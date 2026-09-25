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
  /*
   * The identity hints name the file the values end up in, and that file differs
   * per workspace (manifest.json for Chrome, package.json for a VS Code theme), so
   * each workspace passes its own keys. Defaulting to the Chrome ones keeps the
   * Chrome workbench's markup exactly as it was.
   */
  nameHintKey = 'settings.name.hint',
  folderHintKey = 'settings.folder.hint',
  /*
   * Optional action nodes rendered at the far end of the name / folder label row
   * (the Chrome workbench puts a re-generate button there). A workspace that has
   * nothing to offer simply omits them.
   */
  nameAction = null,
  folderAction = null,
  headerSlot = null,
  footerSlot = null,
  groupExtra,
  onAutoClearChange,
  onClearFields,
  onUndo,
  canUndo = false,
  onNameChange,
  onFolderChange,
  onColorChange,
  onInvalidColor,
  autoClear,
  autoClearTitle,
}) {
  const { t } = useI18n()

  // `hidden` fields stay in the data table (it drives the manifest writer, whose
  // 24-key coverage is an invariant) but never render: a field whose Chrome
  // counterpart paints nothing is noise in the panel. See `ntpLink`.
  const grouped = fieldGroups
    .map((group) => ({
      group,
      groupFields: fields.filter((field) => field.group === group.id && !field.hidden),
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
        {onClearFields || onUndo ? (
          <div className="settings-actions">
            {onAutoClearChange ? (
              <label className="auto-clear-toggle" title={autoClearTitle ?? t('settings.autoClearTitle')}>
                <input
                  type="checkbox"
                  checked={autoClear}
                  onChange={(event) => onAutoClearChange(event.target.checked)}
                />
                <span>{t('settings.autoClear')}</span>
              </label>
            ) : null}
            {/*
              Undo is passed in by a workspace that owns its own draft (the VS Code
              one): the Chrome workbench keeps its undo in the site header instead,
              and would otherwise show two of them.
            */}
            {onUndo ? (
              <button
                type="button"
                className="button button--ghost button--sm"
                onClick={onUndo}
                disabled={!canUndo}
                title={t('header.undoTitle')}
              >
                {t('header.undo')}
              </button>
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
        <div className="field__label-row">
          <label className="field__label" htmlFor="theme-name">
            {t('settings.name.label')}
          </label>
          {nameAction}
        </div>
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
            {t(nameHintKey)}
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
        <div className="field__label-row">
          <label className="field__label" htmlFor="theme-folder">
            {t('settings.folder.label')}
          </label>
          {folderAction}
        </div>
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
          {t(folderHintKey)}
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

      {/*
        Per-workspace extras that belong *after* the colour groups — the VS Code
        workbench appends its "pin a region" list there, because those controls
        only make sense once the master palette above is settled.
      */}
      {footerSlot}
    </section>
  )
}
