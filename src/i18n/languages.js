/**
 * Dictionary registry + the hook-free translation core.
 *
 * Kept as plain `.js` with **no React and no JSX** on purpose: `verify.mjs` runs
 * in Node and asserts that both locales expose an identical key set and that
 * every statically-referenced key in the source actually exists. It cannot import
 * a `.jsx` file, so the runtime lives here and `index.jsx` adds the React layer
 * (provider, hooks, storage sync) on top.
 *
 *  - Dictionaries are imported statically, so switching language is instant and
 *    there is no loading state to handle.
 *  - `translate()` falls back to the key itself when a translation is missing,
 *    which makes gaps obvious in the UI instead of rendering `undefined`.
 */

import en from './en.js'
import zh from './zh.js'

export const DICTIONARIES = { en, zh }
export const LANGUAGES = ['en', 'zh']
export const DEFAULT_LANGUAGE = 'en'

/** Replace `{name}` placeholders. Missing values are left visible on purpose. */
export function interpolate(template, vars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  )
}

/**
 * Hook-free translation, for non-React or class contexts.
 * @param {string} lang
 * @param {string} key
 * @param {Record<string, unknown>} [vars]
 */
export function translate(lang, key, vars) {
  const dict = DICTIONARIES[lang] ?? DICTIONARIES[DEFAULT_LANGUAGE]
  const template = dict[key] ?? DICTIONARIES[DEFAULT_LANGUAGE][key]
  if (typeof template !== 'string') return key
  return interpolate(template, vars)
}
