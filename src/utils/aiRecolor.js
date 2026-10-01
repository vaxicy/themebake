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
 */

import { AiNamingError, chatCompletion, extractJson } from './aiClient.js'
import { normalizeHex } from './color.js'

/** How much of the model's own "what I changed" note is kept. */
const MAX_SUMMARY = 200

/**
 * Build the chat messages: the palette as it stands, the request, and the rules a
 * usable answer has to follow.
 *
 * @param {object} context
 * @param {{id: string, value: string, pinned?: boolean}[]} context.palette every
 *   field the caller can apply, with its current colour
 * @param {string} context.instruction the user's sentence
 * @param {'en'|'zh'} context.language language for the model's own summary
 * @returns {{system: string, user: string}}
 */
export function buildRecolorMessages({ palette, instruction, language }) {
  const system = [
    "You are ThemeBake's palette editor. You adjust the colours of a browser or editor theme",
    'from a plain-language request. You always answer with a single JSON object and nothing else —',
    'no markdown fence, no commentary, no trailing text.',
  ].join(' ')

  const lines = []
  lines.push('Current palette')
  for (const field of palette) {
    lines.push(`- ${field.id}: ${field.value}${field.pinned ? ' (has its own colour, pinned)' : ''}`)
  }
  lines.push('')

  const brief = String(instruction ?? '').replace(/\s+/g, ' ').trim()
  lines.push("The user's request:")
  lines.push(`    ${brief}`)
  lines.push('')

  lines.push('Rules:')
  lines.push('- Change only what the request asks for. Every field you leave out keeps its current colour.')
  lines.push(
    '- `changes` keys must be exactly the field ids listed above, spelled the same way. Never invent an id, never nest.',
  )
  lines.push('- Values must be 6-digit hex colours like "#1F3D2B".')
  lines.push(
    "- Keep the palette's overall light or dark character unless the request asks to change it.",
  )
  lines.push(
    '- Colours must stay legible together: text fields against the surface they sit on, and any accent against its background.',
  )
  lines.push(`- summary: one short sentence in ${language === 'zh' ? 'Chinese' : 'English'} saying what you changed. No quotes, no emoji.`)
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
 * Ask the model to recolour the palette.
 *
 * @param {object} config AI config (baseURL / model / apiKey / temperature)
 * @param {{palette: object[], instruction: string, language: string, allowed: string[]}} context
 * @param {object} [options] fetchImpl / signal / timeoutMs
 * @returns {Promise<{summary: string, changes: {id: string, value: string}[], ignored: string[]}>}
 * @throws {AiNamingError} `.key` is an i18n key
 */
export async function requestRecolor(config, context, options = {}) {
  const { system, user } = buildRecolorMessages({
    palette: context.palette,
    instruction: context.instruction,
    language: context.language,
  })

  // Room for a handful of hex pairs plus the summary; a truncated reply fails the
  // JSON parse outright, which is the one failure that costs the whole edit.
  const content = await chatCompletion(config, { system, user, maxTokens: 700 }, options)
  const result = parseRecolorResponse(content, { allowed: context.allowed })

  // A reply with no JSON in it at all is a broken answer. A reply with an empty
  // `changes` map is a valid "nothing needed changing" — the caller says so.
  if (!result.changes.length && !result.summary && content.trim() && !extractJson(content)) {
    throw new AiNamingError('ai.errorParse')
  }
  return result
}
