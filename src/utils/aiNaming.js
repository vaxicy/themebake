/**
 * AI theme naming — palette in, names out.
 *
 * One backend shape only: OpenAI-compatible `POST {baseURL}/chat/completions`.
 * That covers SiliconFlow and every other "OpenAI-compatible" host, so there is
 * no provider-specific code, just a configurable base URL.
 *
 * Three seams keep this testable without a network:
 *   - `describePalette` / `buildNamingMessages` are pure string builders.
 *   - `parseNamingResponse` is a pure text -> candidates function.
 *   - `requestThemeNames` takes an injectable `fetchImpl`, so `verify.mjs` can
 *     drive the whole request path with a stub and assert the error mapping.
 *
 * Failure is non-fatal by contract: the caller keeps the deterministic local
 * name (see `nameFromColors.js`) and only *replaces* it when the model answers.
 * Every error carries an i18n key in `.key` rather than a display string, so this
 * module stays free of UI text.
 */

import { hexToHsl } from './color.js'
import { MAX_DESCRIPTION_LENGTH } from './manifest.js'
import { toThemeFolderName } from './package.js'

/** 12 hue sectors, used only to give the model a word for the dominant colour. */
const HUE_LABELS = [
  'red',
  'orange',
  'yellow',
  'lime',
  'green',
  'teal',
  'cyan',
  'azure',
  'blue',
  'violet',
  'magenta',
  'rose',
]

function hueLabel(hue) {
  const h = ((hue % 360) + 360) % 360
  return HUE_LABELS[Math.floor(h / 30) % HUE_LABELS.length]
}

function saturationWord(s) {
  if (s < 20) return 'muted'
  if (s < 45) return 'soft'
  if (s < 70) return 'rich'
  return 'vivid'
}

function lightnessWord(l) {
  if (l < 25) return 'very dark'
  if (l < 45) return 'dark'
  if (l < 65) return 'mid'
  if (l < 85) return 'light'
  return 'very light'
}

/** An error the UI can translate: `.key` is an i18n key, never a message. */
export class AiNamingError extends Error {
  constructor(key) {
    super(key)
    this.name = 'AiNamingError'
    this.key = key
  }
}

/**
 * Turn the 14 colours into the compact facts a model reasons over, instead of a
 * bare list of hex codes. The hue *word* matters: "azure" steers a model far
 * better than "#B1B2FF".
 *
 * @param {Record<string,string>} colors fieldId -> #RRGGBB
 */
export function describePalette(colors = {}) {
  const frame = colors.frame || '#888888'
  const { h, s, l } = hexToHsl(frame)
  const ntp = colors.ntpBackground ? hexToHsl(colors.ntpBackground) : null
  const mode = (ntp ? ntp.l : l) < 50 ? 'dark' : 'light'

  const swatches = Object.entries(colors)
    .filter(([, value]) => typeof value === 'string')
    .map(([role, value]) => `${role} ${value}`)

  return {
    mode,
    dominant: {
      hue: hueLabel(h),
      hueDegrees: Math.round(h),
      saturation: saturationWord(s),
      lightness: lightnessWord(l),
    },
    accent: colors.ntpLink || null,
    swatches,
  }
}

/**
 * The writing rules for the store summary.
 *
 * Shared by the naming prompt — every candidate comes back with its own summary,
 * so picking a name brings its description along instead of leaving whatever was
 * written for the first name — and the standalone description prompt. One list,
 * so a summary from either path is equally manifest-valid. Exported so the
 * self-check can assert that both prompts really do state the same rules.
 */
export const DESCRIPTION_RULES = {
  en: [
    `- Write ONE sentence in English describing the mood of these colours and what the theme suits, at most ${MAX_DESCRIPTION_LENGTH} characters.`,
    '- Plain text: no quotes, no emoji, no marketing superlatives, and the word "theme" at most once.',
  ],
  zh: [
    `- 用中文写一句话描述这套配色的氛围和适合的场景，不超过 ${MAX_DESCRIPTION_LENGTH} 个字符。`,
    '- 纯文本：不要引号、不要 emoji、不要夸张的营销词，"主题"一词最多出现一次。',
  ],
}

/** @param {'en'|'zh'} language @returns {string[]} prompt bullets */
function descriptionRules(language) {
  return DESCRIPTION_RULES[language === 'zh' ? 'zh' : 'en']
}

/** Human-readable style/phrase appended to the prompt. `auto` = no steer. */
function styleInstruction(style) {
  switch (style) {
    case 'elegant':
      return 'Lean elegant and refined, like a boutique hotel or a fashion label.'
    case 'minimal':
      return 'Lean minimal and understated — one clean, quiet idea.'
    case 'cute':
      return 'Lean playful and cute, but never childish.'
    case 'tech':
      return 'Lean modern and technical, like a developer tool or a spacecraft.'
    case 'nature':
      return 'Lean natural — plants, weather, landscapes, minerals.'
    case 'retro':
      return 'Lean retro and nostalgic, like a 70s print or a vintage poster.'
    case 'dreamy':
      return 'Lean dreamy and atmospheric — dusk, mist, soft light.'
    default:
      return 'Pick whatever direction best fits these colours.'
  }
}

/**
 * Build the chat messages. Deliberately one system turn (the contract) and one
 * user turn (the palette), which is what every OpenAI-compatible host accepts
 * without surprises.
 *
 * @param {object} context
 * @param {ReturnType<typeof describePalette>} context.palette
 * @param {string} context.style one of AI_STYLES
 * @param {'en'|'zh'} context.language resolved language for the *names*
 * @param {number} context.candidates how many to ask for
 * @param {string[]} [context.exclude] names to avoid (recently applied)
 * @returns {{system: string, user: string}}
 */
export function buildNamingMessages({ palette, style, language, candidates, exclude = [] }) {
  const system = [
    'You are ThemeBake\'s naming assistant. You invent short, evocative names for Chrome',
    'browser themes from a colour palette. You always answer with a single JSON object and',
    'nothing else — no markdown fence, no commentary, no trailing text.',
  ].join(' ')

  const lines = []
  lines.push('Palette')
  lines.push(`- mode: ${palette.mode}`)
  lines.push(
    `- dominant colour: ${palette.dominant.hue} (hue ${palette.dominant.hueDegrees}°, ${palette.dominant.saturation} saturation, ${palette.dominant.lightness})`,
  )
  if (palette.accent) lines.push(`- link/accent colour: ${palette.accent}`)
  lines.push('- swatches:')
  for (const swatch of palette.swatches) lines.push(`    ${swatch}`)
  lines.push('')
  lines.push(`Direction: ${styleInstruction(style)}`)
  lines.push(`How many candidates: ${candidates}`)
  if (exclude.length) lines.push(`Avoid repeating these already-used names: ${exclude.slice(0, 20).join(', ')}`)
  lines.push('')

  if (language === 'zh') {
    lines.push('Naming rules (Chinese):')
    lines.push('- name: 2 to 5 Chinese characters, no spaces, do NOT include the word 主题. It should read like a theme name, e.g. 柠檬汽水.')
    lines.push('- folder: a short lowercase English or pinyin slug for that name, dash-separated, ending in "-theme", e.g. "lemon-soda-theme".')
  } else {
    lines.push('Naming rules (English):')
    lines.push('- name: exactly three words, Title Case, and the LAST word must be "Theme", e.g. "Lemon Juice Theme".')
    lines.push('- folder: the name lower-cased with spaces turned into single dashes and ending in "-theme", e.g. "lemon-juice-theme".')
  }

  lines.push('')
  lines.push('Quality bar:')
  lines.push('- Every name must clearly relate to the palette above; no generic filler.')
  lines.push('- Across the candidates, vary the first letter and the semantic category (nature, food, weather, material, emotion, place).')
  lines.push('- No two candidates may share a first word.')
  lines.push('')
  lines.push('Each candidate also carries its own store summary, which the user gets when they pick that name:')
  lines.push('- description: written for THAT name. Two candidates must never share a description.')
  for (const rule of descriptionRules(language)) lines.push(rule)
  lines.push('')
  lines.push('Return exactly this JSON shape:')
  lines.push(
    '{"candidates":[{"name":"...","folder":"...","vibe":"2-3 word mood","reason":"one short sentence referencing the palette","description":"one-sentence store summary for this name"}]}',
  )

  return { system, user: lines.join('\n') }
}

/** Pull a JSON object out of whatever the model returned (fences and prose tolerated). */
function extractJson(text) {
  const raw = String(text ?? '').trim()
  if (!raw) return null

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fenced ? fenced[1].trim() : raw

  try {
    return JSON.parse(body)
  } catch {
    /* fall through to a brace scan */
  }

  const objectish = body.match(/\{[\s\S]*\}/)
  if (objectish) {
    try {
      return JSON.parse(objectish[0])
    } catch {
      return null
    }
  }
  return null
}

/**
 * Force the folder onto the app's own convention instead of trusting the model:
 * slugified, lower-cased, and always ending in `-theme` (the name already does,
 * so a name-derived folder is left alone).
 */
export function normalizeFolder(folderRaw, name) {
  const source = typeof folderRaw === 'string' && folderRaw.trim() ? folderRaw : name
  const base = toThemeFolderName(source)
  if (!base) return toThemeFolderName(name)
  return base.endsWith('-theme') ? base : `${base}-theme`
}

/**
 * Does `folder` still look like the slug of `name`?
 *
 * The two identity fields are independent — someone who typed their own folder
 * name keeps it — so when a *new* name arrives the folder is only carried along
 * while it still follows the name: empty, or exactly what the old name slugs to.
 * Anything else is a hand-written value and none of our business.
 *
 * @param {string} name the name the folder may be following
 * @param {string} folder the folder currently in the field
 */
export function folderFollowsName(name, folder) {
  const current = String(folder ?? '').trim()
  if (!current) return true
  const trimmedName = String(name ?? '').trim()
  if (!trimmedName) return false
  return current.toLowerCase() === normalizeFolder('', trimmedName).toLowerCase()
}

/**
 * Parse and validate the model's reply.
 * @param {string} text
 * @param {{limit?: number}} [options]
 * @returns {{name:string, folder:string, vibe:string, reason:string, description:string}[]}
 */
export function parseNamingResponse(text, { limit = 6 } = {}) {
  const data = extractJson(text)
  const list = Array.isArray(data) ? data : data?.candidates
  if (!Array.isArray(list)) return []

  const out = []
  const seen = new Set()
  for (const item of list) {
    const name = typeof item?.name === 'string' ? item.name.trim().slice(0, 45) : ''
    if (!name || seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    out.push({
      name,
      folder: normalizeFolder(item?.folder, name),
      vibe: typeof item?.vibe === 'string' ? item.vibe.trim().slice(0, 60) : '',
      reason: typeof item?.reason === 'string' ? item.reason.trim().slice(0, 200) : '',
      // Each candidate's own store summary. Run through the description parser so
      // a model that wraps it in quotes or JSON gets cleaned up the same way the
      // standalone path cleans it, and it can never exceed the manifest limit.
      description: parseDescriptionResponse(
        typeof item?.description === 'string' ? item.description : '',
      ),
    })
    if (out.length >= limit) break
  }
  return out
}

function httpErrorKey(status) {
  if (status === 401) return 'ai.errorUnauthorized'
  if (status === 403) return 'ai.errorForbidden'
  if (status === 404) return 'ai.errorNotFound'
  if (status === 429) return 'ai.errorRateLimited'
  if (status >= 500) return 'ai.errorServer'
  return 'ai.errorUnknown'
}

/**
 * The one network call both features share. Everything about the transport —
 * validation, timeout, abort, and the HTTP-status → i18n-key mapping — lives
 * here so the naming and description paths cannot drift apart.
 *
 * @returns {Promise<string>} the assistant message content
 * @throws {AiNamingError} `.key` is an i18n key
 */
async function chatCompletion(config, { system, user, maxTokens }, options = {}) {
  const { fetchImpl = fetch, signal, timeoutMs = 30000 } = options

  const base = String(config?.baseURL ?? '').trim().replace(/\/+$/, '')
  if (!base) throw new AiNamingError('ai.errorNoBase')
  if (!String(config?.model ?? '').trim()) throw new AiNamingError('ai.errorNoModel')
  if (!String(config?.apiKey ?? '').trim()) throw new AiNamingError('ai.errorNoKey')

  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const onAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onAbort, { once: true })
  }

  let response
  try {
    response = await fetchImpl(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${String(config.apiKey).trim()}`,
      },
      body: JSON.stringify({
        model: String(config.model).trim(),
        temperature: Number.isFinite(config.temperature) ? config.temperature : 1,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: controller.signal,
    })
  } catch (error) {
    if (timedOut) throw new AiNamingError('ai.errorTimeout')
    if (signal?.aborted) throw new AiNamingError('ai.errorTimeout')
    // A CORS rejection and an offline network both surface as TypeError here.
    throw new AiNamingError('ai.errorNetwork')
  } finally {
    clearTimeout(timer)
    if (signal) signal.removeEventListener('abort', onAbort)
  }

  if (!response.ok) throw new AiNamingError(httpErrorKey(response.status))

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new AiNamingError('ai.errorParse')
  }

  const content = payload?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new AiNamingError('ai.errorParse')
  }
  return content
}

/**
 * Ask the model for names.
 *
 * @param {object} config AI config (baseURL/model/apiKey/temperature/candidates/style/language)
 * @param {object} context naming context (see `buildNamingMessages`)
 * @param {object} [options]
 * @param {typeof fetch} [options.fetchImpl] injectable for tests
 * @param {AbortSignal} [options.signal] caller cancellation
 * @param {number} [options.timeoutMs=30000]
 * @returns {Promise<{name:string, folder:string, vibe:string, reason:string, description:string}[]>}
 * @throws {AiNamingError} `.key` is an i18n key
 */
export async function requestThemeNames(config, context, options = {}) {
  const { system, user } = buildNamingMessages({
    palette: context.palette,
    style: context.style,
    language: context.language,
    candidates: context.candidates,
    exclude: context.exclude,
  })

  // Room for the summaries: each candidate now carries a full sentence, and a
  // truncated reply would fail the JSON parse outright — the one failure mode
  // that costs the user the whole generation.
  const content = await chatCompletion(config, { system, user, maxTokens: 1600 }, options)
  const names = parseNamingResponse(content, { limit: config.candidates || 6 })
  if (!names.length) throw new AiNamingError('ai.errorParse')

  return names
}

/**
 * Build the messages for the store description. Same palette facts as naming,
 * plus the theme name the description should agree with.
 *
 * @param {object} context
 * @param {ReturnType<typeof describePalette>} context.palette
 * @param {string} context.name the current theme name
 * @param {'en'|'zh'} context.language language of the description text
 * @returns {{system: string, user: string}}
 */
export function buildDescriptionMessages({ palette, name, language }) {
  const system = [
    'You are ThemeBake\'s description assistant. You write the one-line store description that goes',
    'into a Chrome theme manifest. You always answer with a single JSON object and nothing else —',
    'no markdown fence, no commentary, no trailing text.',
  ].join(' ')

  const lines = []
  lines.push('Palette')
  lines.push(`- mode: ${palette.mode}`)
  lines.push(
    `- dominant colour: ${palette.dominant.hue} (hue ${palette.dominant.hueDegrees}°, ${palette.dominant.saturation} saturation, ${palette.dominant.lightness})`,
  )
  if (palette.accent) lines.push(`- link/accent colour: ${palette.accent}`)
  lines.push('- swatches:')
  for (const swatch of palette.swatches) lines.push(`    ${swatch}`)
  if (name) lines.push(`- theme name: ${name}`)
  lines.push('')

  lines.push(language === 'zh' ? 'Writing rules (Chinese):' : 'Writing rules (English):')
  for (const rule of descriptionRules(language)) lines.push(rule)

  lines.push('')
  lines.push('Return exactly this JSON shape:')
  lines.push('{"description":"..."}')

  return { system, user: lines.join('\n') }
}

/**
 * Parse the description out of the model's reply. JSON is preferred, but a bare
 * sentence is accepted too — a model that ignores the JSON contract still wrote
 * something usable, and throwing would only make the user click again.
 *
 * @param {string} text
 * @param {{limit?: number}} [options]
 * @returns {string} '' when nothing usable was said
 */
export function parseDescriptionResponse(text, { limit = MAX_DESCRIPTION_LENGTH } = {}) {
  const raw = String(text ?? '').trim()
  if (!raw) return ''

  const data = extractJson(raw)
  let description = ''
  if (typeof data === 'string') description = data
  else if (data && typeof data.description === 'string') description = data.description
  else if (!data) description = raw // plain prose, no JSON anywhere

  description = description.replace(/^["'\s]+/, '').replace(/["'\s]+$/, '').replace(/\s+/g, ' ').trim()
  if (!description) return ''
  return description.slice(0, limit)
}

/**
 * Ask the model for the store description.
 *
 * @param {object} config AI config (see `requestThemeNames`)
 * @param {object} context description context (see `buildDescriptionMessages`)
 * @param {object} [options] fetchImpl / signal / timeoutMs
 * @returns {Promise<string>} the description, already clamped to the manifest limit
 * @throws {AiNamingError} `.key` is an i18n key
 */
export async function requestThemeDescription(config, context, options = {}) {
  const { system, user } = buildDescriptionMessages(context)
  const content = await chatCompletion(config, { system, user, maxTokens: 200 }, options)
  const description = parseDescriptionResponse(content)
  if (!description) throw new AiNamingError('ai.errorParse')
  return description
}
