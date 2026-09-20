/**
 * Persistence for the AI naming settings.
 *
 * Two stores, split by sensitivity rather than by feature:
 *   - everything *except* the API key goes to `localStorage` (a long-lived
 *     preference, like the theme draft);
 *   - the key goes to `sessionStorage` by default, so a key pasted once dies with
 *     the tab. Turning "remember" on moves it to `localStorage` — the user's
 *     explicit choice, not ours.
 *
 * Whichever store does not hold the key gets it removed, so flipping the toggle
 * never leaves a stale copy behind. Every access is guarded the same way
 * `storage.js` guards the draft: a browser with storage disabled degrades to
 * defaults instead of throwing.
 */

import {
  AI_CANDIDATE_COUNTS,
  AI_LANGUAGES,
  AI_PROVIDER_IDS,
  AI_PROVIDER_BY_ID,
  AI_STYLES,
  AI_TEMPERATURE,
  DEFAULT_AI_CONFIG,
} from '../data/aiProviders.js'
import { storageAvailable } from './storage.js'

const CONFIG_KEY = 'themebake:ai:v1'
const KEY_KEY = 'themebake:ai:key:v1'

function safeGet(store, key) {
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}

function safeSet(store, key, value) {
  try {
    store.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function safeRemove(store, key) {
  try {
    store.removeItem(key)
  } catch {
    /* non-fatal */
  }
}

function clamp(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n * 10) / 10))
}

/** Coerce anything read back into a shape the panel can render. */
export function sanitizeAiConfig(input = {}) {
  const providerId = AI_PROVIDER_IDS.includes(input.providerId)
    ? input.providerId
    : DEFAULT_AI_CONFIG.providerId
  const preset = AI_PROVIDER_BY_ID[providerId]

  const baseURL =
    typeof input.baseURL === 'string' && input.baseURL.trim()
      ? input.baseURL.trim()
      : preset.baseURL || DEFAULT_AI_CONFIG.baseURL

  const model =
    typeof input.model === 'string' && input.model.trim() ? input.model.trim() : preset.defaultModel || ''

  return {
    providerId,
    baseURL,
    model,
    apiKey: typeof input.apiKey === 'string' ? input.apiKey : '',
    rememberKey: Boolean(input.rememberKey),
    temperature: clamp(input.temperature, AI_TEMPERATURE.min, AI_TEMPERATURE.max, DEFAULT_AI_CONFIG.temperature),
    candidates: AI_CANDIDATE_COUNTS.includes(Number(input.candidates))
      ? Number(input.candidates)
      : DEFAULT_AI_CONFIG.candidates,
    style: AI_STYLES.includes(input.style) ? input.style : DEFAULT_AI_CONFIG.style,
    language: AI_LANGUAGES.includes(input.language) ? input.language : DEFAULT_AI_CONFIG.language,
  }
}

/**
 * @returns {typeof DEFAULT_AI_CONFIG} the saved settings, defaults filled in.
 */
export function loadAiConfig() {
  if (!storageAvailable()) return { ...DEFAULT_AI_CONFIG }

  let stored = {}
  const raw = safeGet(window.localStorage, CONFIG_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') stored = parsed
    } catch {
      /* corrupt payload — fall back to defaults */
    }
  }

  const remembered = safeGet(window.localStorage, KEY_KEY)
  const sessionKey = safeGet(window.sessionStorage, KEY_KEY)
  const apiKey = remembered ?? sessionKey ?? ''

  return sanitizeAiConfig({ ...DEFAULT_AI_CONFIG, ...stored, apiKey, rememberKey: Boolean(remembered) })
}

/** @returns {{ok: boolean}} best-effort; a failure never blocks the app. */
export function saveAiConfig(config) {
  if (!storageAvailable()) return { ok: false }
  const clean = sanitizeAiConfig(config)
  const { apiKey, ...rest } = clean

  safeSet(window.localStorage, CONFIG_KEY, JSON.stringify(rest))

  if (!apiKey) {
    safeRemove(window.localStorage, KEY_KEY)
    safeRemove(window.sessionStorage, KEY_KEY)
    return { ok: true }
  }

  if (clean.rememberKey) {
    safeSet(window.localStorage, KEY_KEY, apiKey)
    safeRemove(window.sessionStorage, KEY_KEY)
  } else {
    safeSet(window.sessionStorage, KEY_KEY, apiKey)
    safeRemove(window.localStorage, KEY_KEY)
  }

  return { ok: true }
}

/** Forget everything — used by nothing yet, but keeps the module self-contained. */
export function clearAiConfig() {
  if (!storageAvailable()) return { ok: false }
  safeRemove(window.localStorage, CONFIG_KEY)
  safeRemove(window.localStorage, KEY_KEY)
  safeRemove(window.sessionStorage, KEY_KEY)
  return { ok: true }
}

export { CONFIG_KEY, KEY_KEY }
