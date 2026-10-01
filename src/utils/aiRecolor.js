/**
 * AI recolouring — a sentence in, a few colours out.
 *
 * "Warm it up and make the status bar deep green" is a thing a model can do well,
 * because it *is* a colour decision, and the palette is right there in the prompt.
 * What it must not do is invent keys: a theme has a fixed set of fields, and an
 * answer naming anything else is unusable. So the contract is deliberately narrow —
 * the model returns a **partial** map of field → hex, and everything about whether
 * those ids exist, whether the hexes parse, and what the change means for the
 * light/dark mirror is decided here and by the workbench, not by the reply.
 *
 * The same three seams as the naming path keep it testable without a network:
 * `buildRecolorMessages` and `parseRecolorResponse` are pure, and `requestRecolor`
 * takes an injectable `fetchImpl`.
 *
 * Requests come in three sizes and the prompt treats them differently: a named
 * region wants one field moved, a mood ("更奶油一点") only shows when the whole
 * family moves, and a light/dark flip is structural — every background together,
 * every text colour the other way. That last one is checkable, so it is checked:
 * `askedTone` reads the request and `paletteTone` reads the answer, and a palette
 * that came back the wrong way gets one corrective round rather than a shrug.
 */

import { AiNamingError, chatCompletion, extractJson } from './aiClient.js'
import { colorRoleGloss, isBackgroundRole } from '../data/colorRoles.js'
import { hexToHsl, normalizeHex } from './color.js'

/** How much of the model's own "what I changed" note is kept. */
const MAX_SUMMARY = 200

/** Room for a whole palette of hex pairs plus the summary — a truncated reply is
 *  the one failure that costs the entire edit, and the palette rewrite case needs
 *  every field. */
const MAX_TOKENS = 900

/**
 * A palette is called light or dark by its *backgrounds*, not by every colour: an
 * accent can be anything, and a mid-grey themed "dark" is a judgement call. The
 * bands are wide enough to be uncontroversial and leave a `mixed` middle open —
 * asking for dark or light from a mixed palette is a real change, and the model
 * should make it rather than be told it is already there.
 */
const LIGHT_TONE_MIN = 58
const DARK_TONE_MAX = 42

/**
 * Words that ask for a lightness direction.
 *
 * Two-word Chinese phrases only: a request that says 深色/浅色 means the whole
 * palette, while a bare 深 or 浅 turns up inside things like 深绿 or 粉浅 — a
 * single named region, not a direction. Missing a phrasing here only means no
 * second-guessing (the answer is taken as given), never a wrong correction.
 */
const DARK_WORDS = ['深色', '暗色', '深色调', '更暗', '变暗', '压暗', '暗一点', '暗一些', '深一点', '深一些', '暗色系', '夜', 'dark', 'darker', 'darken', 'nighttime', 'black']
const LIGHT_WORDS = ['浅色', '亮色', '浅色调', '更亮', '变亮', '提亮', '亮一点', '亮一些', '浅一点', '浅一些', '明亮', 'light', 'lighter', 'lighten', 'bright', 'pale', 'white']

/** A cue that the word after it is being ruled out: "别太深", "not too dark". */
const NEGATION_RE = /(?:\b(?:not|no|less|never|without)\b|n't|别|不要|不用|不是|没有|勿)/

/** How far back to look for the negation. "don't make it dark" / "别太深了". */
const NEGATION_WINDOW = 12

/** Does a direction word appear anywhere it is not being negated? */
function mentions(text, words) {
  for (const word of words) {
    // Latin words need boundaries ("light" must not fire inside "slight"); Chinese
    // ones are their own boundaries and a `\b` around them matches nothing.
    const pattern = /^[a-z]+$/.test(word) ? new RegExp(`\\b${word}\\b`, 'g') : new RegExp(word, 'g')
    for (const match of text.matchAll(pattern)) {
      const before = text.slice(Math.max(0, match.index - NEGATION_WINDOW), match.index)
      if (!NEGATION_RE.test(before)) return true
    }
  }
  return false
}

/**
 * Which lightness direction the sentence asks for, if it clearly asks for one.
 *
 * `null` when it says nothing about lightness, or asks for both at once ("dark but
 * make the text lighter") — the point of this reading is only to catch an answer
 * that went the *opposite* way, so ambiguity has to mean "no opinion".
 *
 * @param {string} instruction
 * @returns {'dark'|'light'|null}
 */
export function askedTone(instruction) {
  const text = String(instruction ?? '').toLowerCase()
  const dark = mentions(text, DARK_WORDS)
  const light = mentions(text, LIGHT_WORDS)
  if (dark === light) return null
  return dark ? 'dark' : 'light'
}

/**
 * How a palette reads, judged by its background-role fields (their mean HSL
 * lightness — the same measure the rest of the app uses to call a theme light or
 * dark).
 *
 * @param {{id: string, value: string, aiRole?: string}[]} palette
 * @returns {{tone: 'light'|'dark'|'mixed', lightness: number, samples: string[]}|null}
 *   `null` when not one background colour is known, which is the caller saying it
 *   has no opinion to offer.
 */
export function paletteTone(palette) {
  const backgrounds = (palette ?? []).filter(
    (field) => isBackgroundRole(field.aiRole) && normalizeHex(field.value),
  )
  if (!backgrounds.length) return null

  const lightness = backgrounds.reduce((sum, field) => sum + hexToHsl(normalizeHex(field.value)).l, 0) / backgrounds.length
  const tone = lightness >= LIGHT_TONE_MIN ? 'light' : lightness <= DARK_TONE_MAX ? 'dark' : 'mixed'
  return { tone, lightness: Math.round(lightness), samples: backgrounds.map((field) => `${field.id} ${field.value}`) }
}

/**
 * Apply a partial set of changes to a palette, so the result can be judged as the
 * user will see it rather than as the reply describes it.
 */
function mergeChanges(palette, changes) {
  const byId = new Map(changes.map((change) => [change.id, change.value]))
  return (palette ?? []).map((field) =>
    byId.has(field.id) ? { ...field, value: byId.get(field.id) } : field,
  )
}

/**
 * Build the chat messages: the palette as it stands (with names and roles), the
 * request, and the rules a usable answer has to follow.
 *
 * Written for the three kinds of request people actually make, because they need
 * opposite amounts of courage. A named region ("状态栏改成深绿") wants one field
 * touched and the rest left alone. A mood ("更奶油一点") is only visible when the
 * whole family moves together. And a lightness flip ("换成深色主题") is structural:
 * one field cannot carry it, and the failure users notice is a "dark" answer whose
 * surfaces are still pale — the same failure this prompt's wording and the
 * corrective retry in `requestRecolor` are both aimed at.
 *
 * @param {object} context
 * @param {{id: string, value: string, label?: string, aiRole?: string, pinned?: boolean}[]} context.palette
 *   every field the caller can apply, with its current colour; `label` is the name
 *   the user sees for it and `aiRole` its classification (see `data/colorRoles.js`)
 * @param {string} context.instruction the user's sentence
 * @param {'en'|'zh'} context.language language for the model's own summary
 * @returns {{system: string, user: string}}
 */
export function buildRecolorMessages({ palette, instruction, language }) {
  const system = [
    "You are ThemeBake's palette editor. You adjust the colours of a browser or editor theme",
    'from a plain-language request. You always answer with a single JSON object and nothing else —',
    'no markdown fence, no commentary, no trailing text.',
    'You are decisive: you work out which colours the request is really about, and you move them far',
    'enough to be visible. An answer that changes one colour when the request was about the whole',
    'palette reads as "you did not understand me" — so does one that repaints everything when the',
    'request named a single region.',
  ].join(' ')

  const lines = []
  lines.push('Current palette — id: current colour — the name the user sees, and what this colour is:')
  for (const field of palette) {
    const notes = []
    if (field.label) notes.push(String(field.label))
    if (field.aiRole) notes.push(`${field.aiRole} (${colorRoleGloss(field.aiRole)})`)
    if (field.pinned) notes.push('has its own colour, pinned')
    lines.push(`- ${field.id}: ${field.value}${notes.length ? `  — ${notes.join('; ')}` : ''}`)
  }
  lines.push('')

  const tone = paletteTone(palette)
  if (tone) {
    lines.push(
      `As it stands this palette reads as a ${tone.tone.toUpperCase()} theme ` +
        `(its backgrounds average HSL lightness ${tone.lightness}%).`,
    )
    lines.push('')
  }

  const brief = String(instruction ?? '').replace(/\s+/g, ' ').trim()
  lines.push("The user's request:")
  lines.push(`    ${brief}`)
  lines.push('')

  lines.push('Read the request as one of these, and act accordingly:')
  lines.push(
    '1. A light/dark change — "换成深色主题", "make the whole thing dark", "亮一点". This is structural, ' +
      'so move every background field together: a dark palette wants its backgrounds at lightness 8–25% ' +
      '(e.g. #17161F, #24222E, #2E2A38) and its text fields at 85–96%; a light palette is the mirror image ' +
      '(backgrounds 88–97%, text 10–25%). Neighbouring surfaces should stay 4–10 points apart so the strips ' +
      'stay tellable apart, and the accent plus borders move with them. One field is never enough: a dark ' +
      'theme whose toolbar is still #F5F5F5 is not a dark theme.',
  )
  lines.push(
    '2. An overall mood or style — "整体更奶油芝士一点", "warmer", "cooler", "more vintage", "less pink". ' +
      'A mood lives in the whole family, not in one field: shift most or all of the colours together, and keep ' +
      'their relationships (backgrounds stay the darkest or lightest group, the accent stays the most saturated ' +
      'thing in the palette, text stays legible). Read the mood as a hue/temperature/saturation direction and ' +
      'apply it evenly — "奶油芝士" means warm hues (35–60°), low-to-middle saturation (10–30%), soft and ' +
      'muted, not one beige field among unchanged purples.',
  )
  lines.push(
    '3. Named regions — "状态栏改成深绿", "make the address bar darker". Change exactly the fields the ' +
      'sentence names, and leave every other field alone.',
  )
  lines.push(
    'A lightness change and a mood can arrive in one sentence and must both be honoured: 深色 + 奶油芝士 ' +
      'is a deep warm brown-grey, never a pale cream. Never satisfy a mood by lightening a dark palette, ' +
      'and never satisfy "dark" by darkening the accent alone.',
  )
  lines.push('')
  lines.push('Rules:')
  lines.push('- `changes` keys must be exactly the field ids listed above, spelled the same way. Never invent an id, never nest.')
  lines.push('- Values are 6-digit hex colours, e.g. "#1F3D2B".')
  lines.push(
    '- Text must stay readable on its background: at least 4.5:1 for body text and 3:1 for muted text, ' +
      'glyphs and borders. On a dark background text is light; on a light one it is dark.',
  )
  lines.push('- Fields you leave out keep their current colour, so list every field the request implies.')
  lines.push(
    `- summary: one short sentence in ${language === 'zh' ? 'Chinese' : 'English'} naming the direction you took. No quotes, no emoji.`,
  )
  lines.push('')
  lines.push('Return exactly this JSON shape:')
  lines.push('{"summary":"what changed","changes":{"fieldId":"#RRGGBB"}}')

  return { system, user: lines.join('\n') }
}

/**
 * Parse the model's reply into the changes the caller may apply.
 *
 * Anything unusable is dropped rather than thrown on: one bad id should not cost
 * the user the whole edit, and a reply naming a key this workbench has never heard
 * of is a hallucination to discard, not an error to show.
 *
 * @param {unknown} text the assistant message content
 * @param {{allowed?: Iterable<string>, limit?: number}} [options] `allowed` is the
 *   set of field ids the caller can actually apply
 * @returns {{summary: string, changes: {id: string, value: string}[], ignored: string[]}}
 */
export function parseRecolorResponse(text, { allowed = [], limit = 32 } = {}) {
  const data = extractJson(text)
  const empty = { summary: '', changes: [], ignored: [] }
  if (!data || typeof data !== 'object') return empty

  const known = new Set(allowed)
  const raw = data.changes
  // Object map (the contract) or an array of {id, value} — a model that flips the
  // shape still said something usable, and refusing it would just mean a retry.
  const entries = Array.isArray(raw)
    ? raw.map((item) => [item?.id, item?.value])
    : raw && typeof raw === 'object'
      ? Object.entries(raw)
      : []

  const changes = []
  const ignored = []
  const seen = new Set()
  for (const [id, value] of entries) {
    const key = typeof id === 'string' ? id.trim() : ''
    const hex = normalizeHex(typeof value === 'string' ? value : '')
    if (!key) continue
    if (!hex || !known.has(key)) {
      ignored.push(key)
      continue
    }
    if (seen.has(key)) continue
    seen.add(key)
    changes.push({ id: key, value: hex })
    if (changes.length >= limit) break
  }

  const summary =
    typeof data.summary === 'string' ? data.summary.replace(/\s+/g, ' ').trim().slice(0, MAX_SUMMARY) : ''

  return { summary, changes, ignored }
}

/**
 * Ask the model to recolour the palette, and check one thing about the answer: did
 * it go the direction the request asked for?
 *
 * A reply that says "done" while leaving a pale palette where a dark one was asked
 * for is the single most common way this feature reads as "it does not understand
 * me". The palette is right here, so the check is cheap and certain — the answer is
 * merged onto the current colours and judged by its backgrounds. When it went the
 * wrong way, the model gets one corrective round (its own answer quoted back, with
 * the lightness targets spelled out); whatever comes back is used, and the loop
 * stops there — a second opinion is worth one extra request, not two.
 *
 * @param {object} config AI config (baseURL / model / apiKey / temperature)
 * @param {{palette: object[], instruction: string, language: string, allowed: string[]}} context
 * @param {object} [options] fetchImpl / signal / timeoutMs
 * @returns {Promise<{summary: string, changes: {id: string, value: string}[], ignored: string[], corrected?: boolean}>}
 * @throws {AiNamingError} `.key` is an i18n key
 */
export async function requestRecolor(config, context, options = {}) {
  const { system, user } = buildRecolorMessages({
    palette: context.palette,
    instruction: context.instruction,
    language: context.language,
  })

  const content = await chatCompletion(config, { system, user, maxTokens: MAX_TOKENS }, options)
  const result = parseRecolorResponse(content, { allowed: context.allowed })

  // A reply with no JSON in it at all is a broken answer. A reply with an empty
  // `changes` map is a valid "nothing needed changing" — the caller says so.
  if (!result.changes.length && !result.summary && content.trim() && !extractJson(content)) {
    throw new AiNamingError('ai.errorParse')
  }

  const asked = askedTone(context.instruction)
  if (!asked || !result.changes.length) return result

  const landed = paletteTone(mergeChanges(context.palette, result.changes))
  const wrongWay =
    (asked === 'dark' && landed?.tone === 'light') || (asked === 'light' && landed?.tone === 'dark')
  if (!wrongWay) return result

  const retryUser = [
    user,
    '',
    'An earlier attempt at this request produced the changes below, and they do not do what was asked:',
    `    ${JSON.stringify(Object.fromEntries(result.changes.map((change) => [change.id, change.value])))}`,
    `The request asks for a ${asked} palette, but after those changes the surfaces still read as ` +
      `${landed.tone} — ${landed.samples.join(', ')}, average lightness ${landed.lightness}%.`,
    `Answer again, the whole palette, keeping any mood the request also asked for: every background ` +
      `field must land at lightness ${asked === 'dark' ? '8–25%' : '88–97%'} and every text field must ` +
      `move the opposite way, with neighbouring surfaces 4–10 points apart.`,
    'Return the same JSON shape and nothing else.',
  ].join('\n')

  const correctedContent = await chatCompletion(
    config,
    { system, user: retryUser, maxTokens: MAX_TOKENS },
    options,
  )
  const corrected = parseRecolorResponse(correctedContent, { allowed: context.allowed })
  if (!corrected.changes.length) return result
  return { ...corrected, corrected: true }
}
