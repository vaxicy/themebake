/**
 * App header: brand on the left, language / Reset / GitHub / About on the right.
 *
 * The GitHub link is intentionally a placeholder — no repository exists yet —
 * so it is rendered as a disabled-looking control with a tooltip instead of a
 * dead link that 404s.
 *
 * All copy comes from the dictionary, so the About modal switches language with
 * the rest of the UI without a reload.
 */

import { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { GitHubIcon, InfoIcon, PaletteIcon, ResetIcon, UndoIcon } from './Icons.jsx'
import { LanguageSwitcher } from './LanguageSwitcher.jsx'
import { Modal } from './Modal.jsx'

export const GITHUB_URL = 'https://github.com/'

export function Header({ onReset, onUndo, canUndo = false, storageWarning }) {
  const { t } = useI18n()
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <a className="brand" href="#editor" aria-label={t('app.skipToEditor')}>
            <span className="brand__mark" aria-hidden="true">
              <PaletteIcon size={19} />
            </span>
            <span className="brand__name">{t('app.name')}</span>
          </a>

          <nav className="site-header__nav" aria-label={t('app.primaryNav')}>
            <LanguageSwitcher />

            {/* Undo lives in the header rather than only behind Ctrl+Z so the
                shortcut is discoverable — and it is the fastest escape hatch
                after a randomise or a preset you did not want. */}
            <button
              type="button"
              className="button button--ghost button--sm"
              onClick={onUndo}
              disabled={!canUndo}
              title={t('header.undoTitle')}
              aria-label={t('header.undo')}
            >
              <UndoIcon size={15} />
              <span className="button__label">{t('header.undo')}</span>
            </button>

            <button
              type="button"
              className="button button--ghost button--sm"
              onClick={onReset}
              aria-label={t('header.reset')}
            >
              <ResetIcon size={15} />
              <span className="button__label">{t('header.reset')}</span>
            </button>

            <a
              className="button button--ghost button--sm is-placeholder"
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer noopener"
              title={t('header.githubTitle')}
              aria-label={t('header.githubAria')}
            >
              <GitHubIcon size={15} />
              <span className="button__label">{t('header.github')}</span>
            </a>

            <button
              type="button"
              className="button button--ghost button--sm"
              onClick={() => setAboutOpen(true)}
              aria-label={t('header.about')}
            >
              <InfoIcon size={15} />
              <span className="button__label">{t('header.about')}</span>
            </button>
          </nav>
        </div>

        {storageWarning ? (
          <div className="site-header__banner" role="status">
            {storageWarning}
          </div>
        ) : null}
      </header>

      <Modal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        title={t('about.title')}
        description={t('about.description')}
        footer={
          <button
            type="button"
            data-autofocus
            className="button button--primary"
            onClick={() => setAboutOpen(false)}
          >
            {t('app.close')}
          </button>
        }
      >
        <div className="prose">
          <p>{t('about.intro')}</p>

          <h3>{t('about.whatYouGet')}</h3>
          <ul>
            <li>
              {t('about.bullet1a')}
              <code className="inline-code">manifest.json</code>
              {t('about.bullet1b')}
            </li>
            <li>{t('about.bullet2')}</li>
            <li>
              {t('about.bullet3a')}
              <code className="inline-code">chrome://extensions</code>
              {t('about.bullet3b')}
            </li>
          </ul>

          <h3>{t('about.privacy')}</h3>
          <p>{t('about.privacyBody')}</p>

          <h3>{t('about.scope')}</h3>
          <p>{t('about.scopeBody')}</p>
        </div>
      </Modal>
    </>
  )
}
