/**
 * Compact hero. ThemeBake is a tool, not a landing page, so this stays to two
 * lines and hands straight over to the editor.
 *
 * Both workbenches render it, each with its own copy: the headline is the first
 * thing that tells a user which editor they are building for, and a VS Code
 * workspace opening under "Create your own Chrome theme" would be lying. The
 * keys are props rather than a mode check so the wording lives in the dictionary
 * with every other string, and so neither workbench owns the other's layout.
 */

import { useI18n } from '../i18n/index.jsx'

export function Hero({ titleKey = 'hero.title', subtitleKey = 'hero.subtitle' }) {
  const { t } = useI18n()

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <h1 className="hero__title" id="hero-heading">
        {t(titleKey)}
      </h1>
      <p className="hero__subtitle">{t(subtitleKey)}</p>
    </section>
  )
}
