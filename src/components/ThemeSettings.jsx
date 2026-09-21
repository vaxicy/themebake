/**
 * Left column: the theme name and folder name fields, every Chrome colour setting
 * grouped by where the colour appears in the browser, and the one display property
 * ThemeBake writes (the New Tab Page logo behaviour).
 *
 * The two name fields are deliberately separate. The theme name is free text that
 * goes into the manifest verbatim, while the folder name has to survive a
 * filesystem — one field used to do both, which forced dashed slugs into the name
 * Chrome displays.
 *
 * The colour field list itself comes from `data/themeFields.js` — this component
 * only handles layout and localisation, so adding a new Chrome colour key is a
 * one-line change there plus two dictionary entries.
 *
 * The logo control sits inside the New Tab Page group rather than in the export
 * panel, because it *is* an NTP setting and it only makes sense next to the
 * `ntp_background` colour it keys off. `LOGO_STYLES` supplies both the options
 * and the Chrome integers, so no raw 0/1 ever reaches the UI.
 */

import { FIELD_GROUPS, LOGO_STYLES, THEME_FIELDS } from '../data/themeFields.js'
import { useI18n } from '../i18n/index.jsx'
import { ColorField } from './ColorField.jsx'

const MAX_NAME_LENGTH = 45 // Chrome's own limit for theme/extension names.

/** The group that also gets the logo control appended to it. */
const NTP_GROUP_ID = 'New Tab Page'

export function ThemeSettings({
  name,
  folderInput,
  colors,
  logoStyle,
  nameError,
  aiPanel,
  autoClear,
  onAutoClearChange,
  onClearFields,
  onNameChange,
  onFolderChange,
  onColorChange,
  onLogoStyleChange,
  onInvalidColor,
}) {
  const { t } = useI18n()

  const grouped = FIELD_GROUPS.map((group) => ({
    group,
    fields: THEME_FIELDS.filter((field) => field.group === group.id),
  })).filter((entry) => entry.fields.length > 0)

  return (
    <section className="panel settings-panel" aria-labelledby="settings-heading">
      <div className="panel__header">
        <div>
          <h2 className="panel__title" id="settings-heading">
            {t('settings.title')}
          </h2>
          <p className="panel__subtitle">{t('settings.subtitle')}</p>
        </div>

        {/*
          One click empties the three identity fields (name, folder name,
          summary); the checkbox makes the same clear happen automatically
          whenever a new theme is applied — preset, random, smart palette or
          import. The preference persists under its own key, so Reset and a
          theme export never touch it.
        */}
        <div className="settings-actions">
          <label className="auto-clear-toggle" title={t('settings.autoClearTitle')}>
            <input
              type="checkbox"
              checked={autoClear}
              onChange={(event) => onAutoClearChange(event.target.checked)}
            />
            <span>{t('settings.autoClear')}</span>
          </label>
          <button
            type="button"
            className="button button--ghost button--sm"
            onClick={onClearFields}
            title={t('settings.clearTitle')}
          >
            {t('settings.clear')}
          </button>
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="theme-name">
          {t('settings.name.label')}
        </label>
        <input
          id="theme-name"
          type="text"
          className={`text-input${nameError ? ' is-invalid' : ''}`}
          value={name}
          placeholder={t('settings.name.placeholder')}
          maxLength={MAX_NAME_LENGTH}
          spellCheck="false"
          autoComplete="off"
          onChange={(e) => onNameChange(e.target.value)}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? 'theme-name-error' : 'theme-name-hint'}
        />
        {nameError ? (
          <p className="field__error" id="theme-name-error" role="status">
            {nameError}
          </p>
        ) : (
          <p className="field__hint" id="theme-name-hint">
            {t('settings.name.hint')}
          </p>
        )}
      </div>

      {/*
        The folder name is edited by hand, never derived on the fly: the two fields
        follow different conventions ("Blush Matcha Theme" vs "blush-matcha-theme")
        and users keep both. An empty field is the only case where the theme name is
        reused, and even then nothing is written back into this input.
      */}
      <div className="field">
        <label className="field__label" htmlFor="theme-folder">
          {t('settings.folder.label')}
        </label>
        <input
          id="theme-folder"
          type="text"
          className="text-input"
          value={folderInput}
          placeholder={t('settings.folder.placeholder')}
          maxLength={MAX_NAME_LENGTH}
          spellCheck="false"
          autoComplete="off"
          onChange={(event) => onFolderChange(event.target.value)}
          aria-describedby="theme-folder-hint"
        />
        <p className="field__hint" id="theme-folder-hint">
          {t('settings.folder.hint')}
        </p>
      </div>

      {/*
        The AI controls arrive as a slot rather than being imported here: they own
        their own state, and keeping the composition in `App` means this component
        stays a pure layout for the fields it declares. The AI panel now wraps the
        description field plus a single one-click generate action.
      */}
      {aiPanel}

      <div className="settings-groups">
        {grouped.map(({ group, fields }) => (
          <fieldset className="settings-group" key={group.id}>
            <legend className="settings-group__legend">{t(group.key)}</legend>
            <div className="settings-group__fields">
              {fields.map((field) => (
                <ColorField
                  key={field.id}
                  id={field.id}
                  label={t(field.labelKey)}
                  hint={t(field.hintKey)}
                  value={colors[field.id]}
                  onChange={(next) => onColorChange(field.id, next)}
                  onInvalid={onInvalidColor}
                />
              ))}

              {/*
                The only non-colour control in the panel, and the only
                `theme.properties` key written. Placed after the NTP colours so
                the dependency reads in the right order: this value tells Chrome
                how to render the logo *against* the background above it.
              */}
              {group.id === NTP_GROUP_ID ? (
                <div className="field logo-style">
                  <span className="field__label" id="logo-style-label">
                    {t('settings.logo.label')}
                  </span>
                  <div
                    className="segmented"
                    role="radiogroup"
                    aria-labelledby="logo-style-label"
                  >
                    {LOGO_STYLES.map((style) => (
                      <label
                        key={style.id}
                        className={`segmented__option${logoStyle === style.id ? ' is-active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="logo-style"
                          value={style.id}
                          checked={logoStyle === style.id}
                          onChange={() => onLogoStyleChange(style.id)}
                        />
                        <span className="segmented__label">{t(style.labelKey)}</span>
                        <code className="segmented__sample">{style.sample}</code>
                      </label>
                    ))}
                  </div>
                  <p className="field__hint">{t('settings.logo.hint')}</p>
                </div>
              ) : null}
            </div>
          </fieldset>
        ))}
      </div>
    </section>
  )
}
