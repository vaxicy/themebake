/**
 * Export panel: colour format, output target, and the single "Generate Theme"
 * action that produces a loadable unpacked theme.
 *
 * "Generate" delivers either a ZIP or — where the File System Access API exists —
 * the theme folder itself, written straight into a directory the user picks. Both
 * paths build the same package; only the hand-off differs.
 *
 * The generated ZIP wraps everything in one top-level folder so that unzipping
 * yields exactly what `chrome://extensions` → "Load unpacked" wants: a directory
 * whose root holds `manifest.json`.
 *
 * There is no "complete theme" toggle: the full 24-key table plus `tints` is
 * always written. See `COMPLETE_THEME` in `App.jsx` for why. The subtitle
 * reports `keyCount`/`tintCount` read off the built manifest, so it cannot
 * claim a number the download does not contain.
 *
 * There is also no NTP display-property UI: `ntp_background_alignment` and
 * `ntp_background_repeat` are inert without a background image, and
 * `ntp_logo_alternate` cannot tint the logo to the theme. See the note in
 * `utils/manifest.js` for the full reasoning.
 */

import { COLOR_FORMATS, OUTPUT_MODES } from '../data/themeFields.js'
import { useI18n } from '../i18n/index.jsx'
import { CodeIcon, DownloadIcon } from './Icons.jsx'

export function ExportPanel({
  colorFormat,
  onColorFormatChange,
  outputMode,
  onOutputModeChange,
  folderOutputSupported,
  onGenerate,
  onPreviewManifest,
  onExportJson,
  busy,
  keyCount,
  tintCount,
  filename,
  folderName,
}) {
  const { t } = useI18n()
  const activeFormat = COLOR_FORMATS.find((format) => format.id === colorFormat) ?? COLOR_FORMATS[0]

  return (
    <section className="panel export-panel" aria-labelledby="export-heading">
      <div className="panel__header">
        <div>
          <h2 className="panel__title" id="export-heading">
            {t('export.title')}
          </h2>
          <p className="panel__subtitle">
            {outputMode === 'folder'
              ? t('export.subtitleFolder', { keys: keyCount, tints: tintCount, folder: folderName })
              : t('export.subtitle', { keys: keyCount, tints: tintCount, filename })}
          </p>
        </div>
      </div>

      <fieldset className="format-picker">
        <legend className="format-picker__legend">{t('export.formatLegend')}</legend>
        <div className="segmented" role="radiogroup" aria-label={t('export.formatLegend')}>
          {COLOR_FORMATS.map((format) => (
            <label
              key={format.id}
              className={`segmented__option${colorFormat === format.id ? ' is-active' : ''}`}
            >
              <input
                type="radio"
                name="color-format"
                value={format.id}
                checked={colorFormat === format.id}
                onChange={() => onColorFormatChange(format.id)}
              />
              <span className="segmented__label">{t(format.labelKey)}</span>
              <code className="segmented__sample">{format.sample}</code>
            </label>
          ))}
        </div>
        <p className="format-picker__hint">{t('export.formatHint')}</p>
      </fieldset>

      {/*
        Chrome's LoadColors rejects a non-list colour value and aborts the entire
        manifest, so a hex manifest is not merely "less compatible" — it will not
        install. Say so plainly rather than letting the user download a dead file.
      */}
      {activeFormat.noteKey ? (
        <p className="format-picker__warn" role="alert">
          {t(activeFormat.noteKey)}
        </p>
      ) : null}

      {/*
        Where the finished theme goes. "Folder" skips the ZIP entirely, but only
        desktop Chrome/Edge can write a directory — so the option is disabled with
        the reason in the hint where the API is missing. ZIP is never removed: it
        works everywhere and is the only form the Chrome Web Store accepts.
      */}
      <fieldset className="format-picker">
        <legend className="format-picker__legend">{t('export.outputLegend')}</legend>
        <div className="segmented" role="radiogroup" aria-label={t('export.outputLegend')}>
          {OUTPUT_MODES.map((mode) => {
            const disabled = mode.id === 'folder' && !folderOutputSupported
            return (
              <label
                key={mode.id}
                className={`segmented__option${outputMode === mode.id ? ' is-active' : ''}${disabled ? ' is-disabled' : ''}`}
              >
                <input
                  type="radio"
                  name="output-mode"
                  value={mode.id}
                  checked={outputMode === mode.id}
                  disabled={disabled}
                  onChange={() => onOutputModeChange(mode.id)}
                />
                <span className="segmented__label">{t(mode.labelKey)}</span>
              </label>
            )
          })}
        </div>
        <p className="format-picker__hint">
          {folderOutputSupported ? t('export.outputHint') : t('export.folderUnsupported')}
        </p>
      </fieldset>

      <p className="export-panel__note">
        {outputMode === 'folder'
          ? t('export.packageNoteFolder', { folder: folderName })
          : t('export.packageNote', { folder: folderName })}
      </p>

      <div className="export-panel__actions">
        <button
          type="button"
          className="button button--primary button--lg"
          onClick={onGenerate}
          disabled={busy}
          aria-busy={busy || undefined}
        >
          <DownloadIcon size={18} />
          {busy ? t('export.generating') : t('export.generate')}
        </button>

        <button type="button" className="button button--outline button--lg" onClick={onPreviewManifest}>
          <CodeIcon size={17} />
          {t('export.previewManifest')}
        </button>

        {/*
          The counterpart to the Import panel's "theme" branch. `exportThemeJson`
          already existed, but nothing in the UI could reach it — so the paste hint
          advertised a file no user could produce. This button makes it real.
        */}
        <button
          type="button"
          className="button button--outline button--lg"
          onClick={onExportJson}
          title={t('export.jsonTitle')}
        >
          <DownloadIcon size={17} />
          {t('export.json')}
        </button>
      </div>

      <details className="howto">
        <summary className="howto__summary">{t('export.howtoSummary')}</summary>
        <ol className="howto__list">
          <li>
            {outputMode === 'folder' ? (
              t('export.howto1Folder', { folder: folderName })
            ) : (
              <>
                {t('export.howto1a')}
                <code className="inline-code">{filename}</code>
                {t('export.howto1b')}
                <code className="inline-code">{folderName}/</code>
                {t('export.howto1c')}
              </>
            )}
          </li>
          <li>{t('export.howto2')}</li>
          <li>{t('export.howto3')}</li>
          <li>{t('export.howto4')}</li>
          <li>{t('export.howto5')}</li>
        </ol>
      </details>
    </section>
  )
}
