/**
 * localStorage persistence with a full failure guard.
 *
 * Browsers can throw on `localStorage` access at any point:
 *   - Safari private mode throws `QuotaExceededError` on setItem
 *   - Disabled cookies / hardened privacy settings throw `SecurityError` on *read*
 *   - Some enterprise profiles block storage entirely
 * `storageAvailable` is therefore probed once with an actual round-trip, and
 * every call site degrades to in-memory-only instead of crashing the app.
 */

const STORAGE_KEY = 'themebake:theme:v1'
const PROBE_KEY = 'themebake:probe'

/** Cached result of the availability probe. `null` = not probed yet. */
let availableCache = null

/**
 * Probe localStorage with a real write/read/delete round-trip.
 * @returns {boolean}
 */
export function storageAvailable() {
  if (availableCache !== null) return availableCache
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      availableCache = false
      return availableCache
    }
    window.localStorage.setItem(PROBE_KEY, '1')
    const readBack = window.localStorage.getItem(PROBE_KEY)
    window.localStorage.removeItem(PROBE_KEY)
    availableCache = readBack === '1'
  } catch {
    availableCache = false
  }
  return availableCache
}

/**
 * Read the saved theme state.
 *
 * The `error` value is an **i18n key**, not a display string — the caller
 * translates it so this module stays free of UI text.
 * @returns {{ok: true, value: object|null} | {ok: false, error: string}}
 */
export function loadTheme() {
  if (!storageAvailable()) {
    return { ok: false, error: 'header.storageUnavailable' }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ok: true, value: null }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { ok: true, value: null }
    return { ok: true, value: parsed }
  } catch {
    // Corrupt payload — treat as "nothing saved" rather than blocking the app.
    return { ok: false, error: 'header.storageWriteFailed' }
  }
}

/**
 * Persist the theme state. `error` is an i18n key (see `loadTheme`).
 * @param {object} state
 * @returns {{ok: boolean, error?: string}}
 */
export function saveTheme(state) {
  if (!storageAvailable()) {
    return { ok: false, error: 'header.storageUnavailable' }
  }
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, savedAt: new Date().toISOString() }),
    )
    return { ok: true }
  } catch {
    return { ok: false, error: 'header.storageWriteFailed' }
  }
}

/** Remove the saved theme (used by Reset). */
export function clearTheme() {
  if (!storageAvailable()) return { ok: false }
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

const LANGUAGE_KEY = 'themebake:lang:v1'

const VSCODE_STORAGE_KEY = 'themebake:vscode-theme:v1'

/**
 * Read the saved VS Code workbench draft. Same failure semantics as
 * `loadTheme` — an i18n key, never display text.
 * @returns {{ok: true, value: object|null} | {ok: false, error: string}}
 */
export function loadVscodeTheme() {
  if (!storageAvailable()) {
    return { ok: false, error: 'header.storageUnavailable' }
  }
  try {
    const raw = window.localStorage.getItem(VSCODE_STORAGE_KEY)
    if (!raw) return { ok: true, value: null }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { ok: true, value: null }
    return { ok: true, value: parsed }
  } catch {
    return { ok: false, error: 'header.storageWriteFailed' }
  }
}

/** Persist the VS Code workbench draft. @returns {{ok: boolean, error?: string}} */
export function saveVscodeTheme(state) {
  if (!storageAvailable()) {
    return { ok: false, error: 'header.storageUnavailable' }
  }
  try {
    window.localStorage.setItem(
      VSCODE_STORAGE_KEY,
      JSON.stringify({ ...state, savedAt: new Date().toISOString() }),
    )
    return { ok: true }
  } catch {
    return { ok: false, error: 'header.storageWriteFailed' }
  }
}

/**
 * Read the saved interface language.
 * @returns {'en'|'zh'|null} null when nothing valid is stored
 */
export function loadLanguage() {
  if (!storageAvailable()) return null
  try {
    const raw = window.localStorage.getItem(LANGUAGE_KEY)
    return raw === 'en' || raw === 'zh' ? raw : null
  } catch {
    return null
  }
}

/** Persist the interface language. Best-effort — a failure is not user-visible. */
export function saveLanguage(lang) {
  if (!storageAvailable()) return { ok: false }
  try {
    window.localStorage.setItem(LANGUAGE_KEY, lang)
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

export { STORAGE_KEY, LANGUAGE_KEY }
