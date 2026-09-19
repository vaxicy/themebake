/**
 * Compact hero. ThemeBake is a tool, not a landing page, so this stays to two
 * lines and hands straight over to the editor.
 */

import { useI18n } from '../i18n/index.jsx'

export function Hero() {
  const { t } = useI18n()

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <h1 className="hero__title" id="hero-heading">
        {t('hero.title')}
      </h1>
      <p className="hero__subtitle">{t('hero.subtitle')}</p>
    </section>
  )
}
