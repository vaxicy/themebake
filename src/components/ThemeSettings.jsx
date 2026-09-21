/**
 * Left column: the identity fields (theme name, folder name, optional AI
 * panel), every colour setting grouped by where the colour appears, and
 * per-workspace extras.
 *
 * The component is workspace-agnostic: the Chrome workbench passes its 14
 * Chrome keys and the NTP logo control; the VS Code workbench passes its 14
 * master fields and a theme-type selector via `headerSlot`. Everything else —
 * layout, localisation, the clear/auto-clear actions — is shared.
 *
 * The colour field list comes from the workspace's own field definitions, so
 * adding a new colour key is a one-line change there plus two dictionary
 * entries.
 */

import { useI18n } from '../i18n/index.jsx'
import { ColorField } from './ColorField.jsx'

const MAX_NAME_LENGTH = 45 // Chrome's own limit for theme/extension names.

export function ThemeSettings({
  name,
  folderInput,
  colors,
  nameError,
  aiPanel,
  fieldGroups,
  fields,
  titleKey = 'settings.title',
  subtitleKey = 'settings.subtitle',
  headerSlot = null,
  groupExtra,
  onAutoClearChange,
  onClearFields,
  onNameChange,
  onFolderChange,
  onColorChange,
  onInvalidColor,
  autoClear,
  autoClearTitle,
}) {
  const { t } = useI18n()

  const grouped = fieldGroups
    .map((group) => ({
      group,
      groupFields: fields.filter((field) => field.group === group.id),
    }))
    .filter((entry) => entry.groupFields.length > 0)

  return (
    <section className="panel settings-panel" aria-labelledby="settings-heading">
      <div className="panel__header">
        <div>
          <h2 className="panel__title" id="settings-heading">
            {t(titleKey)}
          </h2>
          <p className="panel__subtitle">{t(subtitleKey)}</p>
        </div>

        {/*
          One click empties the identity fields; the checkbox makes the same
          clear happen automatically whenever a new theme is applied. Only
          rendered when the workspace asks for them.
        */}
        {onClearFields ? (
          <div className="settings-actions">
            {onAutoClearChange ? (
              <label className="auto-clear-toggle" title={autoClearTitle}>
                <input
                  type="checkbox"
                  checked={autoClear}
                  onChange={(event) => onAutoClearChange(event.target.checked)}
                />
                <span>{t('settings.autoClear')}</span>
              </label>
            ) : null}
            <button
              type="button"
              className="button button--ghost button--sm"
              onClick={onClearFields}
              title={t('settings.clearTitle')}
            >
              {t('settings.clear')}
            </button>
          </div>
        ) : null}
      </div>

      {headerSlot}

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
        their own state, and keeping the composition in the workbench means this
        component stays a pure layout for the fields it declares.
      */}
      {aiPanel}

      <div className="settings-groups">
        {grouped.map(({ group, groupFields }) => (
          <fieldset className="settings-group" key={group.id}>
            <legend className="settings-group__legend">{t(group.key)}</legend>
            <div className="settings-group__fields">
              {groupFields.map((field) => (
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
                Per-workspace extras that belong inside a specific group (the
                Chrome workbench appends its NTP logo control there).
              */}
              {groupExtra ? groupExtra(group) : null}
            </div>
          </fieldset>
        ))}
      </div>
    </section>
  )
}
