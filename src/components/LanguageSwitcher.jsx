/**
 * EN / 中文 switch.
 *
 * A two-option segmented control rather than a `<select>`: with exactly two
 * choices a toggle is both faster to hit and always shows the current state.
 * Rendered as `aria-pressed` buttons inside a labelled group so screen readers
 * announce it as a set of choices, not as a form field the user must open.
 */

import { LANGUAGES, useI18n } from '../i18n/index.jsx'
import { GlobeIcon } from './Icons.jsx'

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n()

  return (
    <div className="lang-switch">
      <span className="lang-switch__icon" aria-hidden="true">
        <GlobeIcon size={15} />
      </span>
      <div className="lang-switch__group" role="group" aria-label={t('lang.switcherAria')}>
        {LANGUAGES.map((code) => {
          const active = code === lang
          return (
            <button
              key={code}
              type="button"
              lang={code === 'zh' ? 'zh-CN' : 'en'}
              className={`lang-switch__option${active ? ' is-active' : ''}`}
              aria-pressed={active}
              onClick={() => setLang(code)}
            >
              {t(`lang.${code}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
