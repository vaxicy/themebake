/**
 * App-level preferences that are neither the theme draft nor the AI settings.
 *
 * These live under their own localStorage key so that neither Reset (which
 * calls `clearTheme`) nor a theme export can ever touch them — the same
 * reasoning that keeps `utils/aiConfig.js` separate.
 */

const AUTO_CLEAR_KEY = 'themebake.autoClearNewTheme'

/** Whether the three identity fields auto-clear when a new theme is applied. */
export function loadAutoClearNewTheme() {
  try {
    return window.localStorage.getItem(AUTO_CLEAR_KEY) === '1'
  } catch {
    return false
  }
}

export function saveAutoClearNewTheme(value) {
  try {
    window.localStorage.setItem(AUTO_CLEAR_KEY, value ? '1' : '0')
  } catch {
    // Storage unavailable: the toggle still works, it just won't persist.
  }
}
