/**
 * The VS Code workbench — a workspace fully independent of the Chrome one.
 *
 * Same skeleton (identity fields + AI naming + studio + presets + import +
 * live preview + export), different substance:
 *
 *   - 14 master colour fields (see `vscode/fields.js`); the ~90-key workbench
 *     `colors` map and `tokenColors` are derived, never edited directly.
 *   - A theme `type` selector (dark / light / high contrast) instead of a
 *     summary field — VS Code themes have no store description here.
 *   - Presets extracted from the hand-made reference themes.
 *   - Export produces a VS Code extension package: package.json + a themes/
 *     colour-theme JSON + README, as a ZIP or written straight into a folder.
 *
 * State lives under its own storage key, so neither workspace can ever see or
 * clobber the other's draft. The AI settings are shared with the Chrome
 * workbench (passed down from App, which owns them).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AiNamingPanel } from './AiNamingPanel.jsx'
import { ImportPanel } from './ImportPanel.jsx'
import { PaletteStudio } from './PaletteStudio.jsx'
import { PresetsPanel } from './PresetsPanel.jsx'
import { ThemeSettings } from './ThemeSettings.jsx'
import { VSCodeMockup } from './VSCodeMockup.jsx'
import { useToast } from './Toast.jsx'
import { DEFAULT_THEME_NAME } from '../data/presets.js'
import { INTENSITIES, SOLVER_MODES, solveTheme } from '../utils/palette.js'
import { useI18n } from '../i18n/index.jsx'
import { describePalette, requestThemeNames } from '../utils/aiNaming.js'
import { normalizeHex } from '../utils/color.js'
import { canWriteFolder, writeThemeFolder } from '../utils/fsFolder.js'
import { buildColors, generateRandomColors } from '../data/presets.js'
import { loadVscodeTheme, saveVscodeTheme, storageAvailable } from '../utils/storage.js'
import { OUTPUT_MODE_IDS } from '../data/themeFields.js'
import { toSafeName } from '../utils/slug.js'
import { toThemeFolderName } from '../utils/package.js'
import { createZip, downloadBlob } from '../utils/zip.js'
import { VSCODE_FIELDS, VSCODE_FIELD_GROUPS, VSCODE_TYPES, DEFAULT_VSCODE_COLORS, DEFAULT_VSCODE_TYPE } from '../vscode/fields.js'
import { buildMasterColors, buildVscodeThemeJson, buildVscodePackage, masterFromPalette } from '../vscode/build.js'
import { VSCODE_PRESETS } from '../data/vscodePresets.js'

/** Read the persisted VS Code draft exactly once. */
function readInitialState() {
  const result = loadVscodeTheme()
  if (!result.ok || !result.value) return { state: null, warning: result.ok ? null : result.error }
  const saved = result.value
  return {
    state: {
      name: typeof saved.name === 'string' ? saved.name : DEFAULT_THEME_NAME,
      folderInput: typeof saved.folderInput === 'string' ? saved.folderInput : '',
      type: VSCODE_TYPES.some((entry) => entry.id === saved.type) ? saved.type : DEFAULT_VSCODE_TYPE,
      colors: buildMasterColors(saved.colors),
      outputMode: OUTPUT_MODE_IDS.includes(saved.outputMode) ? saved.outputMode : 'zip',
      seed: normalizeHex(saved.seed) ?? DEFAULT_VSCODE_COLORS.editorBg,
      smartMode: SOLVER_MODES.includes(saved.smartMode) ? saved.smartMode : 'auto',
      smartIntensity: INTENSITIES.includes(saved.smartIntensity) ? saved.smartIntensity : 'balanced',
    },
    warning: null,
  }
}

const INITIAL = readInitialState()

/** Compact role map so the AI namer can reason over the master colours. */
function paletteForAi(master) {
  return {
    frame: master.editorBg,
    background: master.editorBg,
    text: master.editorFg,
    accent: master.accent,
    sidebar: master.sidebarBg,
    titlebar: master.titleBg,
    border: master.border,
    button: master.buttonBg,
  }
}

export function VSCodeWorkbench({ aiConfig, onAiConfigChange }) {
  const toast = useToast()
  const { t } = useI18n()

  const [name, setName] = useState(INITIAL.state?.name ?? DEFAULT_THEME_NAME)
  const [folderInput, setFolderInput] = useState(INITIAL.state?.folderInput ?? '')
  const [type, setType] = useState(INITIAL.state?.type ?? DEFAULT_VSCODE_TYPE)
  const [colors, setColors] = useState(INITIAL.state?.colors ?? { ...DEFAULT_VSCODE_COLORS })
  const [outputMode, setOutputMode] = useState(() => {
    const saved = INITIAL.state?.outputMode
    if (!OUTPUT_MODE_IDS.includes(saved)) return 'zip'
    return saved === 'folder' && !canWriteFolder() ? 'zip' : saved
  })
  const [activePresetId, setActivePresetId] = useState(null)

  // ------------------------------------------------------- smart palette studio
  const [seed, setSeed] = useState(INITIAL.state?.seed ?? DEFAULT_VSCODE_COLORS.editorBg)
  const [smartMode, setSmartMode] = useState(INITIAL.state?.smartMode ?? 'auto')
  const [smartIntensity, setSmartIntensity] = useState(INITIAL.state?.smartIntensity ?? 'balanced')

  // ----------------------------------------------------------------- AI naming
  const [aiBusy, setAiBusy] = useState(false)
  const [aiCandidates, setAiCandidates] = useState([])
  const [aiAppliedName, setAiAppliedName] = useState('')
  const aiSeenRef = useRef([])
  const [nameError, setNameError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [storageWarningKey, setStorageWarningKey] = useState(() =>
    storageAvailable() ? INITIAL.warning : 'header.storageUnavailable',
  )
  const warnedRef = useRef(false)

  // ---------------------------------------------------------------- persistence
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const result = saveVscodeTheme({ name, folderInput, type, colors, outputMode, seed, smartMode, smartIntensity })
      if (!result.ok && !warnedRef.current) {
        warnedRef.current = true
        setStorageWarningKey(result.error)
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [name, folderInput, type, colors, outputMode, seed, smartMode, smartIntensity])

  // ------------------------------------------------------------------ derived
  const master = useMemo(() => buildMasterColors(colors), [colors])
  const themeJson = useMemo(
    () => buildVscodeThemeJson({ name, type, colors: master }),
    [name, type, master],
  )
  const folderName = useMemo(() => toSafeName(folderInput) || toThemeFolderName(name), [folderInput, name])
  const filename = useMemo(() => `${folderName}.zip`, [folderName])
  const storageWarning = storageWarningKey ? t(storageWarningKey) : null

  // ----------------------------------------------------------------- handlers
  const handleClearFields = useCallback(() => {
    setName('')
    setFolderInput('')
    setNameError('')
    toast.info(t('toast.vscodeFieldsCleared'))
  }, [toast, t])

  const handleColorChange = useCallback((fieldId, next) => {
    setColors((current) => ({ ...current, [fieldId]: next }))
  }, [])

  const handleApplyPreset = useCallback(
    (presetId) => {
      const preset = VSCODE_PRESETS.find((entry) => entry.id === presetId)
      if (!preset) return
      setColors(buildMasterColors(preset.colors))
      setType('dark')
      setActivePresetId(preset.id)
      toast.success(t('toast.presetApplied', { name: preset.name }))
    },
    [toast, t],
  )

  /** Shared "solve a palette and adopt it" step for studio / random / import. */
  const applySolvedPalette = useCallback(
    (seeds) => {
      const result = solveTheme({ seeds, mode: smartMode, intensity: smartIntensity })
      if (!result.ok) {
        toast.error(t('import.errorNoColors'))
        return null
      }
      const built = buildColors(result.colors)
      setColors(masterFromPalette(built))
      setActivePresetId(null)
      return result
    },
    [smartMode, smartIntensity, toast, t],
  )

  const handleStudioGenerate = useCallback(() => {
    if (applySolvedPalette([seed])) toast.success(t('toast.smartApplied'))
  }, [applySolvedPalette, seed, toast, t])

  const handleImportPalette = useCallback(
    (seeds) => {
      const result = applySolvedPalette(seeds)
      if (result) toast.success(t('toast.paletteApplied', { count: result.seedCount }))
    },
    [applySolvedPalette, toast, t],
  )

  /** Chrome manifests do not map onto VS Code keys — palette import only. */
  const handleImportManifestUnsupported = useCallback(() => {
    toast.error(t('vscode.importManifestUnsupported'))
  }, [toast, t])

  const handleRandomize = useCallback(() => {
    const built = buildColors(generateRandomColors())
    setColors(masterFromPalette(built))
    setActivePresetId(null)
    toast.success(t('toast.randomApplied'))
  }, [toast, t])

  const handleApplyAiCandidate = useCallback((candidate) => {
    setName(candidate.name)
    setNameError('')
    setFolderInput(candidate.folder)
    setAiAppliedName(candidate.name)
    if (candidate.name && !aiSeenRef.current.includes(candidate.name)) {
      aiSeenRef.current = [candidate.name, ...aiSeenRef.current].slice(0, 20)
    }
  }, [])

  /** Names only — the VS Code workbench has no summary to generate. */
  const handleAiGenerateNames = useCallback(async () => {
    if (!String(aiConfig.apiKey).trim()) {
      toast.error(t('ai.errorNoKey'))
      return
    }
    setAiBusy(true)
    try {
      const names = await requestThemeNames(aiConfig, {
        palette: describePalette(paletteForAi(master)),
        style: aiConfig.style,
        language: aiConfig.language,
        candidates: aiConfig.candidates,
        exclude: aiAppliedName ? [aiAppliedName, ...aiSeenRef.current] : aiSeenRef.current,
      })
      setAiCandidates(names)
      const chosen = names[0]
      if (chosen) handleApplyAiCandidate(chosen)
      toast.success(t('ai.generated', { count: names.length }))
    } catch (error) {
      toast.error(t(error?.key || 'ai.errorUnknown'), 6000)
    } finally {
      setAiBusy(false)
    }
  }, [aiConfig, aiAppliedName, handleApplyAiCandidate, master, toast, t])

  const handleGenerate = useCallback(async () => {
    if (generating) return
    if (!name.trim()) {
      setNameError(t('validate.nameRequired'))
      toast.error(t('validate.nameRequired'))
      return
    }

    setGenerating(true)
    try {
      const pkg = buildVscodePackage({ name, folderName, type, colors: master })
      if (outputMode === 'folder') {
        const rootName = await writeThemeFolder({ files: pkg.files, folder: pkg.folderName })
        toast.success(t('toast.folderWritten', { root: rootName, folder: pkg.folderName }))
      } else {
        const blob = await createZip({ files: pkg.files, folder: pkg.folderName })
        downloadBlob(blob, pkg.zipName)
        toast.success(t('toast.vscodeGenerated'))
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
      const message = error instanceof Error ? error.message : 'Unknown error.'
      toast.error(
        t(outputMode === 'folder' ? 'toast.folderFailed' : 'toast.zipFailed', { error: message }),
        6000,
      )
    } finally {
      setGenerating(false)
    }
  }, [colors, folderName, generating, master, name, outputMode, toast, t, type])

  // ------------------------------------------------------------------- render
  return (
    <div className="workspace">
      {storageWarning ? (
        <div className="site-header__banner" role="status">
          {storageWarning}
        </div>
      ) : null}

      <div className="workspace__left">
        <ThemeSettings
          name={name}
          folderInput={folderInput}
          colors={master}
          nameError={nameError}
          fieldGroups={VSCODE_FIELD_GROUPS}
          fields={VSCODE_FIELDS}
          titleKey="vscode.title"
          subtitleKey="vscode.subtitle"
          onClearFields={handleClearFields}
          aiPanel={
            <AiNamingPanel
              config={aiConfig}
              onChange={onAiConfigChange}
              onGenerateAll={handleAiGenerateNames}
              onApply={handleApplyAiCandidate}
              busy={aiBusy}
              candidates={aiCandidates}
              appliedName={aiAppliedName}
              description=""
              descriptionError=""
              onDescriptionChange={() => {}}
              showDescription={false}
            />
          }
          headerSlot={
            <fieldset className="format-picker">
              <legend className="format-picker__legend">{t('vscode.type.label')}</legend>
              <div className="segmented" role="radiogroup" aria-label={t('vscode.type.label')}>
                {VSCODE_TYPES.map((entry) => (
                  <label
                    key={entry.id}
                    className={`segmented__option${type === entry.id ? ' is-active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="vscode-type"
                      value={entry.id}
                      checked={type === entry.id}
                      onChange={() => setType(entry.id)}
                    />
                    <span className="segmented__label">{t(entry.labelKey)}</span>
                    <code className="segmented__sample">{entry.uiTheme}</code>
                  </label>
                ))}
              </div>
              <p className="format-picker__hint">{t('vscode.type.hint')}</p>
            </fieldset>
          }
          onNameChange={(value) => {
            setName(value)
            if (nameError) setNameError('')
          }}
          onFolderChange={setFolderInput}
          onColorChange={handleColorChange}
          onInvalidColor={(label) => toast.error(t('colorField.invalidToast', { label }))}
        />

        <PaletteStudio
          seed={seed}
          mode={smartMode}
          intensity={smartIntensity}
          onSeedChange={setSeed}
          onModeChange={(next) => setSmartMode(SOLVER_MODES.includes(next) ? next : 'auto')}
          onIntensityChange={(next) => setSmartIntensity(INTENSITIES.includes(next) ? next : 'balanced')}
          onGenerate={handleStudioGenerate}
          onInvalidSeed={(label) => toast.error(t('colorField.invalidToast', { label }))}
        />

        <ImportPanel onApplyPalette={handleImportPalette} onApplyManifest={handleImportManifestUnsupported} />

        <PresetsPanel
          activePresetId={activePresetId}
          presets={VSCODE_PRESETS}
          swatchKeys={['editorBg', 'accent', 'sidebarBg', 'buttonBg']}
          onApplyPreset={handleApplyPreset}
          onRandomize={handleRandomize}
        />
      </div>

      <div className="workspace__right">
        <section className="panel" aria-labelledby="vsc-preview-heading">
          <div className="panel__header">
            <div>
              <h2 className="panel__title" id="vsc-preview-heading">
                {t('vscode.preview.title')}
              </h2>
              <p className="panel__subtitle">{t('vscode.preview.subtitle')}</p>
            </div>
          </div>
          <VSCodeMockup colors={master} />
          <p className="export-panel__note">
            {t('vscode.preview.derived', { colors: themeJson.colors ? Object.keys(themeJson.colors).length : 0, tokens: themeJson.tokenColors.length })}
          </p>
        </section>

        <section className="panel export-panel" aria-labelledby="vsc-export-heading">
          <div className="panel__header">
            <div>
              <h2 className="panel__title" id="vsc-export-heading">
                {t('vscode.export.title')}
              </h2>
              <p className="panel__subtitle">
                {outputMode === 'folder'
                  ? t('vscode.export.subtitleFolder', { folder: folderName })
                  : t('vscode.export.subtitle', { filename })}
              </p>
            </div>
          </div>

          <fieldset className="format-picker">
            <legend className="format-picker__legend">{t('export.outputLegend')}</legend>
            <div className="segmented" role="radiogroup" aria-label={t('export.outputLegend')}>
              {['zip', 'folder'].map((modeId) => {
                const disabled = modeId === 'folder' && !canWriteFolder()
                return (
                  <label
                    key={modeId}
                    className={`segmented__option${outputMode === modeId ? ' is-active' : ''}${disabled ? ' is-disabled' : ''}`}
                  >
                    <input
                      type="radio"
                      name="vscode-output-mode"
                      value={modeId}
                      checked={outputMode === modeId}
                      disabled={disabled}
                      onChange={() => setOutputMode(modeId)}
                    />
                    <span className="segmented__label">{t(`export.output.${modeId}`)}</span>
                  </label>
                )
              })}
            </div>
            <p className="format-picker__hint">
              {canWriteFolder() ? t('export.outputHint') : t('export.folderUnsupported')}
            </p>
          </fieldset>

          <p className="export-panel__note">
            {outputMode === 'folder'
              ? t('vscode.export.noteFolder', { folder: folderName })
              : t('vscode.export.note', { folder: folderName })}
          </p>

          <div className="export-panel__actions">
            <button
              type="button"
              className="button button--primary button--lg"
              onClick={handleGenerate}
              disabled={generating}
              aria-busy={generating || undefined}
            >
              {generating ? t('export.generating') : t('export.generate')}
            </button>
          </div>

          <details className="howto">
            <summary className="howto__summary">{t('vscode.export.howtoSummary')}</summary>
            <ol className="howto__list">
              <li>{t('vscode.export.howto1', { name })}</li>
              <li>{t('vscode.export.howto2')}</li>
              <li>{t('vscode.export.howto3')}</li>
            </ol>
          </details>
        </section>
      </div>
    </div>
  )
}
