/**
 * Live Chrome-style browser mockup.
 *
 * Deliberately uses NO Chrome or Google marks — it reproduces only the generic
 * browser UI geometry (frame / tab strip / toolbar / address bar / bookmarks /
 * New Tab Page) so users can see *where* each colour lands.
 *
 * Region -> Chrome manifest key mapping (all drawn from the same source of truth
 * as the generated manifest). "Show keys" overlays the mapping directly on the
 * preview, which is the fastest way to teach the UI-name -> manifest-key link.
 */

import { derivePreviewColors } from '../data/presets.js'
import { logoStyleValue } from '../data/themeFields.js'
import { normalizeHex } from '../utils/color.js'
import { useI18n } from '../i18n/index.jsx'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  MoreIcon,
  PaletteIcon,
  ReloadIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  StarIcon,
} from './Icons.jsx'

const TABS = [
  { id: 'newtab', label: 'New Tab', active: true },
  { id: 'pinterest', label: 'Pinterest', active: false },
  { id: 'youtube', label: 'YouTube', active: false },
]

const SHORTCUTS = ['Mail', 'Calendar', 'Music', 'Docs']

/** Small annotation badge; only rendered when the key overlay is enabled. */
function KeyBadge({ children, position = 'top-left' }) {
  return <span className={`key-badge key-badge--${position}`}>{children}</span>
}

export function ChromeMockup({ colors, showKeys, logoStyle }) {
  const { t } = useI18n()
  const safe = Object.fromEntries(
    Object.entries(colors).map(([id, value]) => [id, normalizeHex(value) ?? '#000000']),
  )
  const derived = derivePreviewColors(safe)

  return (
    <div className="mockup" role="img" aria-label={t('preview.mockupAria')}>
      <div className="mockup__window" style={{ backgroundColor: safe.toolbar }}>
        {/* ---------------------------- Tab strip ---------------------------- */}
        <div className="mockup__strip" style={{ backgroundColor: safe.frame }}>
          {showKeys ? <KeyBadge position="top-left">frame</KeyBadge> : null}

          {/* Window controls — coloured by `button_background`. */}
          <div className="mockup__window-controls" style={{ color: safe.toolbarButtonIcon }}>
            {showKeys ? <KeyBadge position="top-right">button_background</KeyBadge> : null}
            <span className="mockup__window-control" style={{ backgroundColor: safe.buttonBackground }} />
            <span className="mockup__window-control" style={{ backgroundColor: safe.buttonBackground }} />
            <span className="mockup__window-control" style={{ backgroundColor: safe.buttonBackground }} />
          </div>

          <div className="mockup__tabs">
            {TABS.map((tab) => (
              <div
                key={tab.id}
                className={`mockup__tab${tab.active ? ' is-active' : ''}`}
                style={{
                  backgroundColor: tab.active ? derived.activeTabBackground : safe.backgroundTab,
                }}
              >
                <span
                  className="mockup__tab-favicon"
                  style={{
                    backgroundColor: tab.active ? safe.tabText : safe.tabBackgroundText,
                    opacity: tab.active ? 0.75 : 0.55,
                  }}
                />
                <span
                  className="mockup__tab-label"
                  style={{ color: tab.active ? safe.tabText : safe.tabBackgroundText }}
                >
                  {tab.label}
                </span>
                <span
                  className="mockup__tab-close"
                  style={{ color: tab.active ? safe.tabText : safe.tabBackgroundText }}
                  aria-hidden="true"
                >
                  ×
                </span>
              </div>
            ))}
            <span className="mockup__newtab" style={{ color: safe.tabBackgroundText }} aria-hidden="true">
              +
            </span>
          </div>

          {showKeys ? (
            <>
              <KeyBadge position="bottom-left">background_tab</KeyBadge>
              <KeyBadge position="bottom-right">tab_text / tab_background_text</KeyBadge>
            </>
          ) : null}
        </div>

        {/* ----------------------------- Toolbar ----------------------------- */}
        <div className="mockup__toolbar" style={{ backgroundColor: safe.toolbar }}>
          {showKeys ? <KeyBadge position="top-left">toolbar</KeyBadge> : null}

          <div className="mockup__nav" style={{ color: safe.toolbarButtonIcon }}>
            <ArrowLeftIcon size={17} />
            <ArrowRightIcon size={17} />
            <ReloadIcon size={15} />
          </div>

          <div
            className="mockup__omnibox"
            style={{
              backgroundColor: safe.omniboxBackground,
              color: safe.omniboxText,
              borderColor: derived.omniboxBorder,
            }}
          >
            <SearchIcon size={13} />
            <span className="mockup__omnibox-text">{t('preview.omnibox')}</span>
            {showKeys ? <KeyBadge position="bottom-left">omnibox_background / omnibox_text</KeyBadge> : null}
          </div>

          <div className="mockup__toolbar-right" style={{ color: safe.toolbarButtonIcon }}>
            <StarIcon size={15} />
            <span
              className="mockup__avatar"
              style={{ backgroundColor: safe.buttonBackground, color: safe.toolbarButtonIcon }}
            >
              T
            </span>
            <MoreIcon size={15} />
          </div>

          {showKeys ? <KeyBadge position="top-right">toolbar_button_icon</KeyBadge> : null}
        </div>

        {/* --------------------------- Bookmark bar -------------------------- */}
        <div className="mockup__bookmarks" style={{ backgroundColor: safe.toolbar }}>
          {showKeys ? <KeyBadge position="right">bookmark_text</KeyBadge> : null}
          {['Design', 'Docs', 'Inspiration'].map((label) => (
            <span className="mockup__bookmark" key={label} style={{ color: safe.bookmarkText }}>
              <span
                className="mockup__bookmark-dot"
                style={{ backgroundColor: safe.bookmarkText, opacity: 0.65 }}
              />
              {label}
            </span>
          ))}
        </div>

        {/* ------------------------- New Tab Page area ------------------------ */}
        <div className="mockup__content" style={{ backgroundColor: derived.contentBackground }}>
          <div className="mockup__ntp" style={{ backgroundColor: safe.ntpBackground }}>
            {showKeys ? <KeyBadge position="top-left">ntp_background</KeyBadge> : null}
            {/*
              The mockup itself draws no browser logos by design, so the logo
              setting is surfaced as a key badge with its live value rather than
              as a picture of a logo we are not allowed to draw. It still earns
              its place in the overlay: it is the one manifest key whose target
              region is otherwise invisible.
            */}
            {showKeys ? (
              <KeyBadge position="top-right">{`ntp_logo_alternate: ${logoStyleValue(logoStyle)}`}</KeyBadge>
            ) : null}

            <div className="mockup__ntp-brand">
              {/* Abstract ThemeBake mark: overlapping shapes in the theme's own
                  colours. No browser logos, no stock imagery. */}
              <span className="mockup__mark mockup__mark--a" style={{ backgroundColor: safe.frame }} />
              <span className="mockup__mark mockup__mark--b" style={{ backgroundColor: safe.ntpLink }} />
              <span className="mockup__mark mockup__mark--c" style={{ backgroundColor: safe.backgroundTab }} />
            </div>

            <p className="mockup__ntp-title" style={{ color: safe.ntpText }}>
              {t('preview.ntpTitle')}
            </p>
            <p className="mockup__ntp-subtitle" style={{ color: safe.ntpText, opacity: 0.62 }}>
              {t('preview.ntpSubtitle')}
            </p>

            <div className="mockup__ntp-search" style={{ backgroundColor: safe.omniboxBackground, color: safe.omniboxText }}>
              <SearchIcon size={13} />
              <span style={{ opacity: 0.7 }}>{t('preview.ntpSearch')}</span>
            </div>

            <div className="mockup__shortcuts">
              {SHORTCUTS.map((label) => (
                <div className="mockup__shortcut" key={label}>
                  <span
                    className="mockup__shortcut-tile"
                    style={{ backgroundColor: derived.ntpCard, borderColor: derived.ntpCardBorder }}
                  />
                  {/*
                    Labels take the NTP text colour, not `ntp_link`: current Chrome
                    derives the New Tab Page's text and link colours from
                    `ntp_background` (its WebUI reads only that one theme colour), so
                    painting these in the link colour showed a hue the browser never
                    renders. See the `ntpLink` note in `data/themeFields.js`.
                  */}
                  <span className="mockup__shortcut-label" style={{ color: safe.ntpText }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {showKeys ? <KeyBadge position="bottom-right">ntp_text</KeyBadge> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Preview shell: title, key-overlay toggle and the contrast audit readout.
 *
 * The audit is always rendered — a green "all clear" is information too, and it
 * is the quickest way for a user to know their hand-edits are still legible.
 */
export function PreviewPanel({ colors, showKeys, onToggleKeys, auditIssues, onFixContrast, logoStyle }) {
  const { t } = useI18n()
  const issues = auditIssues ?? []

  return (
    <section className="preview-panel" aria-labelledby="preview-heading">
      <div className="preview-panel__header">
        <div>
          <h2 className="preview-panel__title" id="preview-heading">
            {t('preview.title')}
          </h2>
          <p className="preview-panel__subtitle">
            <span className="preview-panel__dot" aria-hidden="true">
              <PaletteIcon size={13} />
            </span>
            {t('preview.subtitle')}
          </p>
        </div>

        <label className="switch">
          <input type="checkbox" checked={showKeys} onChange={onToggleKeys} />
          <span className="switch__track" aria-hidden="true">
            <span className="switch__thumb" />
          </span>
          <span className="switch__label">{t('preview.showKeys')}</span>
        </label>
      </div>

      <ChromeMockup colors={colors} showKeys={showKeys} logoStyle={logoStyle} />

      <div className={`audit${issues.length ? ' audit--warn' : ' audit--ok'}`} role="status">
        <div className="audit__head">
          <span className="audit__icon" aria-hidden="true">
            {issues.length ? <ShieldAlertIcon size={15} /> : <ShieldCheckIcon size={15} />}
          </span>
          <span className="audit__title">
            {issues.length ? t('audit.issues', { count: issues.length }) : t('audit.ok')}
          </span>
          {issues.length ? (
            <button
              type="button"
              className="button button--soft button--sm audit__fix"
              onClick={onFixContrast}
              disabled={!onFixContrast}
            >
              {t('audit.autoFix')}
            </button>
          ) : (
            <span className="audit__badge">
              <CheckIcon size={12} />
              {t('audit.title')}
            </span>
          )}
        </div>

        {issues.length ? (
          <ul className="audit__list">
            {issues.map((issue) => (
              <li key={`${issue.fg}-${issue.bg}`}>
                {t('audit.pair', {
                  fg: t(`field.${issue.fg}.label`),
                  bg: t(`field.${issue.bg}.label`),
                  ratio: issue.ratio.toFixed(2),
                  min: issue.min,
                })}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
