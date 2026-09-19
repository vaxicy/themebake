/**
 * i18n runtime — React layer.
 *
 * The dictionary registry and the hook-free `translate()` live in
 * `./languages.js` (plain JS, importable from Node for the self-check). This
 * file adds:
 *   - `<LanguageProvider>`: holds the active language, keeps `<html lang>` in
 *     sync for screen readers, and persists the choice.
 *   - `useI18n()`: `{ lang, setLang, t, isZh }`.
 *   - `detectInitialLanguage()`: saved choice, else the browser's preference.
 *
 * Both dictionaries ship in the bundle (a few KB), so switching is instantaneous
 * and there is nothing to await.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loadLanguage, saveLanguage } from '../utils/storage.js'
import { DEFAULT_LANGUAGE, DICTIONARIES, LANGUAGES, translate } from './languages.js'

export { DICTIONARIES, LANGUAGES, DEFAULT_LANGUAGE, interpolate, translate } from './languages.js'

const LanguageContext = createContext(null)

/** Best-effort initial language: saved choice, else the browser's preference. */
export function detectInitialLanguage() {
  const saved = loadLanguage()
  if (saved) return saved

  try {
    const candidates = [
      ...(Array.isArray(navigator.languages) ? navigator.languages : []),
      navigator.language,
    ].filter(Boolean)

    for (const tag of candidates) {
      const lower = String(tag).toLowerCase()
      if (lower.startsWith('zh')) return 'zh'
      if (lower.startsWith('en')) return 'en'
    }
  } catch {
    /* navigator unavailable — fall through to the default */
  }

  return DEFAULT_LANGUAGE
}

export function LanguageProvider({ children, initialLanguage }) {
  const [lang, setLangState] = useState(() => initialLanguage ?? detectInitialLanguage())

  // Keep <html lang> in sync so screen readers and translation tools see the
  // right language after a switch.
  useEffect(() => {
    try {
      document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en')
    } catch {
      /* non-fatal */
    }
  }, [lang])

  const setLang = useCallback((next) => {
    if (!LANGUAGES.includes(next)) return
    setLangState(next)
    saveLanguage(next)
  }, [])

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])

  const value = useMemo(
    () => ({ lang, setLang, t, isZh: lang === 'zh' }),
    [lang, setLang, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

/** @returns {{lang: 'en'|'zh', setLang: (l:string)=>void, t: Function, isZh: boolean}} */
export function useI18n() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useI18n must be used inside <LanguageProvider>.')
  return context
}

/** Convenience for tests and tooling: does a key exist in a locale? */
export function hasKey(lang, key) {
  return Object.prototype.hasOwnProperty.call(DICTIONARIES[lang] ?? {}, key)
}
