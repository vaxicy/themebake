/**
 * ThemeBake — application shell and single source of state.
 *
 * State shape:
 *   {
 *     name, description, colors: { [fieldId]: '#RRGGBB' }, colorFormat,
 *     activePresetId,
 *     seed, smartMode, smartIntensity,   // smart-palette studio options
 *   }
 *
 * Everything else is derived:
 *   - `manifestResult` is rebuilt whenever the state changes, so the preview
 *     modal and the download always agree with what is on screen.
 *   - `filename` / `folderName` are derived from the name with full filename
 *     sanitisation; the archive wraps its files in that single folder so that
 *     unzipping yields something `Load unpacked` accepts directly.
 *   - `auditIssues` is recomputed from `colors`, which is why hand-editing a
 *     colour can surface a contrast problem the solver had already prevented.
 *
 * Persistent storage holds only this draft plus the interface language
 * (`utils/storage.js`) and the AI naming settings (`utils/aiConfig.js`, its own
 * key so Reset cannot wipe an API key). Nothing is uploaded — with one deliberate
 * exception: clicking "Generate all" sends the palette colours to the AI
 * provider the user configured, using the user's own key. That path is optional,
 * explicit, and never blocks the theme itself.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AiNamingPanel } from './components/AiNamingPanel.jsx'
import { ConfirmDialog } from './components/ConfirmDialog.jsx'
import { ExportPanel } from './components/ExportPanel.jsx'
import { Header } from './components/Header.jsx'
import { Hero } from './components/Hero.jsx'
import { ImportPanel } from './components/ImportPanel.jsx'
import { ManifestModal } from './components/ManifestModal.jsx'
import { PaletteStudio } from './components/PaletteStudio.jsx'
import { PresetsPanel } from './components/PresetsPanel.jsx'
import { PreviewPanel } from './components/ChromeMockup.jsx'
import { ThemeSettings } from './components/ThemeSettings.jsx'
import { useToast } from './components/Toast.jsx'
import {
  DEFAULT_COLORS,
  DEFAULT_THEME_NAME,
  PRESETS_BY_ID,
  buildColors,
  generateRandomColors,
  paletteDistance,
} from './data/presets.js'
import { DEFAULT_LOGO_STYLE, FIELD_GROUPS, LOGO_STYLES, LOGO_STYLE_IDS, OUTPUT_MODE_IDS, THEME_FIELDS } from './data/themeFields.js'
import { ModeSwitcher } from './components/ModeSwitcher.jsx'
import { VSCodeWorkbench } from './components/VSCodeWorkbench.jsx'
import { useI18n } from './i18n/index.jsx'
import { loadAiConfig, saveAiConfig } from './utils/aiConfig.js'
import { describePalette, requestThemeDescription, requestThemeNames } from './utils/aiNaming.js'
import { loadAutoClearNewTheme, saveAutoClearNewTheme, loadEditorMode, saveEditorMode } from './utils/appPrefs.js'
import { normalizeHex } from './utils/color.js'
import { auditContrast, repairContrast } from './utils/contrastAudit.js'
import { canWriteFolder, writeThemeFolder } from './utils/fsFolder.js'
import { createHistory, record, undo } from './utils/history.js'
import { exportThemeJson } from './utils/importTheme.js'
import { buildManifest, parseManifest, validateThemeInput } from './utils/manifest.js'
import { buildThemePackage, toThemeFolderName } from './utils/package.js'
import { suggestThemeName } from './utils/nameFromColors.js'
import { ACCENT_STRATEGIES, DEFAULT_ACCENT_STRATEGY, INTENSITIES, SOLVER_MODES, solveTheme } from './utils/palette.js'
import { toSafeName } from './utils/slug.js'
import { clearTheme, loadTheme, saveTheme, storageAvailable } from './utils/storage.js'
import { createZip, downloadBlob, downloadText } from './utils/zip.js'

/**
 * ThemeBake always writes the complete theme.
 *
 * This used to be a checkbox. It was removed because there is no user-facing
 * reason to ship the leaner manifest: the 10 extra keys and the 6 `tints` are
 * *derived* from the palette the user already tuned, so they can never
 * contradict it, and a theme that omits them leaves those Chrome states to
 * Chrome's own defaults — a visibly less finished result for zero benefit.
 *
 * The builder keeps `complete` as an option (the primitive can still emit the
 * 14-key manifest, and `verify.mjs` exercises both paths), but the product
 * decision lives here, at the app boundary, and is applied identically to the
 * live "Preview Manifest" output and to the downloaded ZIP — if they diverged,
 * the preview would be lying.
 *
 * `theme.properties` is still deliberately NOT written; see the note in
 * `utils/manifest.js`.
 */
const COMPLETE_THEME = true

/** Read the persisted draft exactly once, at module scope of the first render. */
function readInitialState() {
  const result = loadTheme()
  if (!result.ok || !result.value) {
    return { state: null, warning: result.ok ? null : result.error }
  }
  const saved = result.value
  const colors = buildColors(saved.colors)

  return {
    state: {
      name: typeof saved.name === 'string' ? saved.name : DEFAULT_THEME_NAME,
      description: typeof saved.description === 'string' ? saved.description : '',
      // Its own field, persisted as typed. A draft saved by an older build has
      // none, and an empty field falls back to a slug of the theme name — exactly
      // what that draft's single name field used to produce.
      folderInput: typeof saved.folderInput === 'string' ? saved.folderInput : '',
      outputMode: OUTPUT_MODE_IDS.includes(saved.outputMode) ? saved.outputMode : 'zip',
      colors,
      colorFormat: saved.colorFormat === 'hex' ? 'hex' : 'rgb',
      activePresetId: typeof saved.activePresetId === 'string' ? saved.activePresetId : null,
      // Validated against the style ids rather than trusted: a draft written by a
      // future build (or a hand-edited one) must not reach `buildManifest` with a
      // value it does not understand.
      logoStyle: LOGO_STYLE_IDS.includes(saved.logoStyle) ? saved.logoStyle : DEFAULT_LOGO_STYLE,
      // No `complete`: a draft saved by an older build may still carry the flag,
      // and it is now meaningless — the output is always complete.
      // The studio seed starts from whatever the frame currently is, so the panel
      // is coherent with the saved theme instead of resetting to a foreign colour.
      seed: normalizeHex(saved.seed) ?? colors.frame,
      smartMode: SOLVER_MODES.includes(saved.smartMode) ? saved.smartMode : 'auto',
      smartIntensity: INTENSITIES.includes(saved.smartIntensity) ? saved.smartIntensity : 'balanced',
      smartAccent: ACCENT_STRATEGIES.includes(saved.smartAccent)
        ? saved.smartAccent
        : DEFAULT_ACCENT_STRATEGY,
    },
    warning: null,
  }
}

const INITIAL = readInitialState()

/** Validate a string against an allow-list, falling back to `fallback`. */
function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}

export default function App() {
  const toast = useToast()
  const { t } = useI18n()

  const [name, setName] = useState(INITIAL.state?.name ?? DEFAULT_THEME_NAME)
  const [description, setDescription] = useState(INITIAL.state?.description ?? '')
  const [colors, setColors] = useState(INITIAL.state?.colors ?? { ...DEFAULT_COLORS })
  const [colorFormat, setColorFormat] = useState(INITIAL.state?.colorFormat ?? 'rgb')
  // The folder name is deliberately NOT derived from the theme name: they follow
  // different conventions ("Blush Matcha Theme" vs "blush-matcha-theme") and users
  // keep both at once. Typing in one field never rewrites the other.
  const [folderInput, setFolderInput] = useState(INITIAL.state?.folderInput ?? '')
  // Where the finished theme goes. Remembered like `colorFormat`, but never
  // restored into a browser that cannot actually write a folder.
  const [outputMode, setOutputMode] = useState(() => {
    const saved = INITIAL.state?.outputMode
    if (!OUTPUT_MODE_IDS.includes(saved)) return 'zip'
    return saved === 'folder' && !canWriteFolder() ? 'zip' : saved
  })
  const [activePresetId, setActivePresetId] = useState(INITIAL.state?.activePresetId ?? null)
  // New Tab Page logo behaviour. Unlike `colorFormat` (an encoding choice), this
  // changes what the theme actually does, so it is part of the draft, part of the
  // undo snapshot, and reset by Reset.
  const [logoStyle, setLogoStyle] = useState(INITIAL.state?.logoStyle ?? DEFAULT_LOGO_STYLE)

  // Auto-clear the three identity fields whenever a new theme is applied. A user
  // preference rather than part of the draft: it lives under its own localStorage
  // key so Reset and a theme export never touch it (same rule as the AI settings).
  const [autoClearOnNewTheme, setAutoClearOnNewTheme] = useState(() => loadAutoClearNewTheme())

  // Which workspace is open. Each workbench owns a completely separate draft;
  // this only decides which one is mounted.
  const [mode, setMode] = useState(() => loadEditorMode())

  useEffect(() => {
    saveEditorMode(mode)
  }, [mode])

  // ------------------------------------------------------- smart palette studio
  const [seed, setSeed] = useState(INITIAL.state?.seed ?? DEFAULT_COLORS.frame)
  const [smartMode, setSmartMode] = useState(INITIAL.state?.smartMode ?? 'auto')
  const [smartIntensity, setSmartIntensity] = useState(INITIAL.state?.smartIntensity ?? 'balanced')
  // How the derived accent relates to the seed's hue: inside the family, or on
  // the opposite side of the wheel. Part of the draft so a solve can be repeated.
  const [smartAccent, setSmartAccent] = useState(
    INITIAL.state?.smartAccent ?? DEFAULT_ACCENT_STRATEGY,
  )

  // ----------------------------------------------------------------- AI naming
  // The AI settings are a separate preference, not part of the theme draft: they
  // persist under their own key so Reset never wipes a pasted API key, and so a
  // theme export can never leak one.
  const [aiConfig, setAiConfig] = useState(() => loadAiConfig())
  const [aiBusy, setAiBusy] = useState(false)
  const [aiCandidates, setAiCandidates] = useState([])
  const [aiAppliedName, setAiAppliedName] = useState('')
  // Names applied this session, sent back to the model as "avoid these" so a
  // second click yields genuinely different ideas instead of reshuffling one.
  const aiSeenRef = useRef([])

  useEffect(() => {
    saveAiConfig(aiConfig)
  }, [aiConfig])

  useEffect(() => {
    saveAutoClearNewTheme(autoClearOnNewTheme)
  }, [autoClearOnNewTheme])

  const [nameError, setNameError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [showKeys, setShowKeys] = useState(false)
  const [manifestOpen, setManifestOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [generating, setGenerating] = useState(false)

  // The stored/derived value is an i18n key; it is translated at render time so it
  // follows a language switch like every other string.
  const [storageWarningKey, setStorageWarningKey] = useState(() =>
    storageAvailable() ? INITIAL.warning : 'header.storageUnavailable',
  )

  // Warn once, not on every render, and never block editing.
  const warnedRef = useRef(false)
  // The last palette randomise produced, so the next one can be forced to differ.
  const lastRandomRef = useRef(null)

  // ---------------------------------------------------------------------------
  // Undo
  // ---------------------------------------------------------------------------
  // The stack itself lives in a ref: it is never rendered, so re-rendering the
  // whole app on every colour pixel would be waste. `undoDepth` is the only part
  // that needs to be reactive, and only to enable/disable the header button.
  const historyRef = useRef(null)
  if (historyRef.current === null) historyRef.current = createHistory()
  const [undoDepth, setUndoDepth] = useState(0)

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const manifestResult = useMemo(
    () =>
      buildManifest({
        name,
        description,
        colors,
        colorFormat,
        complete: COMPLETE_THEME,
        logoStyle,
      }),
    [name, description, colors, colorFormat, logoStyle],
  )

  // The folder inside the ZIP is derived from the name, and the download itself is
  // named after that folder — so what a user sees in their Downloads list is
  // exactly what they are about to unpack and select. An empty or unusable name
  // falls back inside `toThemeFolderName`, so there is no second fallback here.
  // Used exactly as typed — case and spaces included — because this is the user's
  // own name for the folder, not a slug of the theme name. Only what a filesystem
  // rejects is stripped. An empty field is the one case that derives a name (a slug
  // of the theme name) so the export panel is never blank, and nothing is ever
  // written back into the input either way.
  const folderName = useMemo(() => toSafeName(folderInput) || toThemeFolderName(name), [folderInput, name])
  const filename = useMemo(() => `${folderName}.zip`, [folderName])

  /** Re-checked on every colour change: the safety net under manual edits. */
  const auditIssues = useMemo(() => auditContrast(colors), [colors])

  const storageWarning = storageWarningKey ? t(storageWarningKey) : null

  // ---------------------------------------------------------------------------
  // Persistence — debounced so typing in a hex field does not hammer storage
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const result = saveTheme({
        name,
        description,
        colors,
        colorFormat,
        folderInput,
        outputMode,
        activePresetId,
        logoStyle,
        seed,
        smartMode,
        smartIntensity,
        smartAccent,
      })
      if (!result.ok && !warnedRef.current) {
        warnedRef.current = true
        setStorageWarningKey(result.error)
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [
    name,
    description,
    colors,
    colorFormat,
    folderInput,
    outputMode,
    activePresetId,
    logoStyle,
    seed,
    smartMode,
    smartIntensity,
    smartAccent,
  ])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  /** The slice of state one undo step restores. */
  const snapshotDraft = useCallback(
    () => ({ colors, activePresetId, seed, logoStyle }),
    [colors, activePresetId, seed, logoStyle],
  )

  /**
   * Record the current draft so the mutation about to run can be undone.
   * @param {string|null} field field id for coalescing, or null for a discrete
   *   action (preset, randomise, reset, import) that must stay its own step.
   */
  const pushHistory = useCallback(
    (field = null) => {
      record(historyRef.current, snapshotDraft(), field)
      setUndoDepth(historyRef.current.past.length)
    },
    [snapshotDraft],
  )

  const handleUndo = useCallback(() => {
    const snapshot = undo(historyRef.current)
    setUndoDepth(historyRef.current.past.length)
    if (!snapshot) return false

    setColors(snapshot.colors)
    setActivePresetId(snapshot.activePresetId)
    setSeed(snapshot.seed)
    setLogoStyle(snapshot.logoStyle ?? DEFAULT_LOGO_STYLE)
    toast.info(t('toast.undone'))
    return true
  }, [toast, t])

  // Ctrl/Cmd+Z. Deliberately skipped inside text fields so the browser's own
  // undo keeps working while typing a theme name or a hex value.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() !== 'z') return
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return

      const target = event.target
      const tag = target?.tagName
      const isTextField =
        tag === 'TEXTAREA' ||
        target?.isContentEditable === true ||
        (tag === 'INPUT' && !['color', 'range', 'checkbox', 'radio'].includes(target.type))
      if (isTextField) return

      // Only swallow the keystroke when something was actually undone; otherwise
      // the user keeps a working browser shortcut.
      if (handleUndo()) event.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleUndo])

  const handleColorChange = useCallback(
    (fieldId, next) => {
      pushHistory(fieldId)
      setColors((current) => ({ ...current, [fieldId]: next }))
      // Any manual edit means the theme is no longer the untouched preset.
      setActivePresetId((current) => (current ? null : current))
    },
    [pushHistory],
  )

  /**
   * Discrete, not coalescing: a logo switch is one deliberate action, so it gets
   * its own undo step rather than merging with a nearby colour drag. The guard
   * keeps a no-op click from pushing a dead step onto the stack — and, more
   * importantly, the history write stays outside the state updater, which React
   * is allowed to invoke twice.
   */
  const handleLogoStyleChange = useCallback(
    (next) => {
      const resolved = pick(next, LOGO_STYLE_IDS, DEFAULT_LOGO_STYLE)
      if (resolved === logoStyle) return
      pushHistory()
      setLogoStyle(resolved)
    },
    [logoStyle, pushHistory],
  )

  const handleNameChange = useCallback(
    (value) => {
      setName(value)
      if (nameError) setNameError('')
    },
    [nameError],
  )

  const handleDescriptionChange = useCallback(
    (value) => {
      setDescription(value)
      if (descriptionError) setDescriptionError('')
    },
    [descriptionError],
  )

  /**
   * One click empties the three identity fields — theme name, folder name and
   * the store summary. Colours are untouched: this only clears what describes
   * the theme, not the theme itself.
   */
  const handleClearFields = useCallback(() => {
    setName('')
    setFolderInput('')
    setDescription('')
    setNameError('')
    setDescriptionError('')
    toast.info(t('toast.fieldsCleared'))
  }, [toast, t])

  const handleInvalidColor = useCallback(
    (label) => {
      toast.error(t('colorField.invalidToast', { label }))
    },
    [toast, t],
  )

  const handleApplyPreset = useCallback(
    (presetId) => {
      const preset = PRESETS_BY_ID[presetId]
      if (!preset) return
      pushHistory()
      const built = buildColors(preset.colors)
      const { name: autoName, folder: autoFolder } = suggestThemeName(built)
      setColors(built)
      setName(autoName)
      setFolderInput(autoFolder)
      // A new theme arrived: drop the previous theme's summary so it can never
      // leak into the next one (name/folder are replaced by the auto name above).
      if (autoClearOnNewTheme) setDescription('')
      setActivePresetId(preset.id)
      toast.success(t('toast.presetApplied', { name: t(`preset.${preset.id}.name`) }))
    },
    [autoClearOnNewTheme, pushHistory, toast, t],
  )

  const handleRandomize = useCallback(() => {
    pushHistory()
    // Refuse a theme too close to the previous one — two quick clicks landing on
    // "the same template in a near hue" is what made randomise feel stuck.
    let candidate = generateRandomColors()
    for (let attempt = 0; attempt < 8 && lastRandomRef.current; attempt += 1) {
      if (paletteDistance(candidate, lastRandomRef.current) >= 0.5) break
      candidate = generateRandomColors()
    }
    lastRandomRef.current = candidate
    const built = buildColors(candidate)
    const { name: autoName, folder: autoFolder } = suggestThemeName(built)
    setColors(built)
    setName(autoName)
    setFolderInput(autoFolder)
    if (autoClearOnNewTheme) setDescription('')
    setActivePresetId(null)
    toast.success(t('toast.randomApplied'))
  }, [autoClearOnNewTheme, pushHistory, toast, t])

  const handleResetConfirmed = useCallback(() => {
    pushHistory()
    setColors({ ...DEFAULT_COLORS })
    setName(DEFAULT_THEME_NAME)
    setDescription('')
    setActivePresetId('periwinkle-dream')
    setSeed(DEFAULT_COLORS.frame)
    setLogoStyle(DEFAULT_LOGO_STYLE)
    setNameError('')
    setDescriptionError('')
    clearTheme()
    setResetOpen(false)
    toast.info(t('toast.themeReset'))
  }, [pushHistory, toast, t])

  /**
   * Shared "run the solver and adopt the result" step, used by both the studio
   * button and the palette importer so they can never drift apart.
   * @returns {ReturnType<typeof solveTheme> | null} null when there was nothing to solve
   */
  const applySolvedTheme = useCallback(
    (seeds) => {
      const result = solveTheme({
        seeds,
        mode: smartMode,
        intensity: smartIntensity,
        accentStrategy: smartAccent,
      })
      if (!result.ok) {
        toast.error(t('import.errorNoColors'))
        return null
      }
      // Only recorded once the solve succeeded, so a failed solve does not leave
      // a no-op step on the undo stack.
      pushHistory()
      const built = buildColors(result.colors)
      const { name: autoName, folder: autoFolder } = suggestThemeName(built)
      setColors(built)
      setName(autoName)
      setFolderInput(autoFolder)
      if (autoClearOnNewTheme) setDescription('')
      setActivePresetId(null)
      return result
    },
    [autoClearOnNewTheme, pushHistory, smartMode, smartIntensity, smartAccent, toast, t],
  )

  const handleStudioGenerate = useCallback(() => {
    const result = applySolvedTheme([seed])
    if (result) toast.success(t('toast.smartApplied'))
  }, [applySolvedTheme, seed, toast, t])

  const handleImportPalette = useCallback(
    (seeds) => {
      const result = applySolvedTheme(seeds)
      if (!result) return
      // Say how many of the card's own colours survived verbatim: an importer
      // that quietly replaces everything is the reason a palette import can feel
      // like it ignored the input.
      toast.success(
        t(result.distinctSeedsUsed > 0 ? 'toast.paletteAppliedUsed' : 'toast.paletteApplied', {
          count: result.seedCount,
          used: result.distinctSeedsUsed,
        }),
      )
    },
    [applySolvedTheme, toast, t],
  )

  /**
   * A manifest already names its roles, so it is applied verbatim — running the
   * solver over it would silently discard the user's own role choices.
   */
  const handleImportManifest = useCallback(
    ({
      colors: importedColors,
      name: importedName,
      description: importedDescription,
      logoStyle: importedLogoStyle,
      deadKeys,
    }) => {
      pushHistory()
      const built = buildColors(importedColors)
      setColors(built)
      // An imported theme is a new theme: clear the stale summary first, then
      // let the source's own description (if any) take its place below.
      if (autoClearOnNewTheme) setDescription('')
      if (importedName) {
        setName(importedName)
        setFolderInput(toThemeFolderName(importedName))
        setNameError('')
      } else {
        // A colour-only source (e.g. a bare palette URL) carries no name, so
        // match one to the colours the way randomise/preset do.
        const { name: autoName, folder: autoFolder } = suggestThemeName(built)
        setName(autoName)
        setFolderInput(autoFolder)
      }
      // Same rule as the logo below: only when the source actually carried one.
      if (importedDescription) {
        setDescription(importedDescription)
        setDescriptionError('')
      }
      // Only when the source theme actually declared it: a theme without the key
      // must not silently reset a choice the user made here.
      if (importedLogoStyle) setLogoStyle(importedLogoStyle)
      setActivePresetId(null)

      // A third-party theme often carries keys Chrome silently ignores. Reporting
      // them is the only way the user finds out why "that colour" never showed up.
      if (Array.isArray(deadKeys) && deadKeys.length) {
        toast.info(
          t('import.deadKeys', {
            count: deadKeys.length,
            keys: deadKeys.slice(0, 4).join(', '),
          }),
          7000,
        )
        return
      }

      toast.success(t('toast.paletteApplied', { count: Object.keys(importedColors).length }))
    },
    [autoClearOnNewTheme, pushHistory, toast, t],
  )

  // --------------------------------------------------------------- AI naming
  const handleAiConfigChange = useCallback((patch) => {
    setAiConfig((current) => ({ ...current, ...patch }))
  }, [])

  /**
   * Applying a candidate writes **both** fields — the theme name the model
   * invented and the folder name that goes with it — which is the whole reason
   * the two are editable side by side.
   */
  const handleApplyAiCandidate = useCallback((candidate) => {
    setName(candidate.name)
    setNameError('')
    setFolderInput(candidate.folder)
    setAiAppliedName(candidate.name)
    if (candidate.name && !aiSeenRef.current.includes(candidate.name)) {
      aiSeenRef.current = [candidate.name, ...aiSeenRef.current].slice(0, 20)
    }
  }, [])

  /**
   * One click fills the whole store listing — theme name, its folder name, and
   * the description — from the palette. It runs two requests on the same path
   * (one key, one endpoint, one set of error toasts): the model's names come
   * first with the top candidate applied immediately, then the description is
   * written for that name. The description clamps to the manifest's 132-character
   * limit inside `parseDescriptionResponse`, so an over-talkative model can never
   * produce an invalid manifest.
   */
  const handleAiGenerateAll = useCallback(async () => {
    if (!String(aiConfig.apiKey).trim()) {
      toast.error(t('ai.errorNoKey'))
      return
    }
    setAiBusy(true)
    try {
      const names = await requestThemeNames(aiConfig, {
        palette: describePalette(colors),
        style: aiConfig.style,
        language: aiConfig.language,
        candidates: aiConfig.candidates,
        exclude: aiAppliedName
          ? [aiAppliedName, ...aiSeenRef.current]
          : aiSeenRef.current,
      })
      setAiCandidates(names)
      const chosen = names[0]
      if (chosen) handleApplyAiCandidate(chosen)
      toast.success(t('ai.generated', { count: names.length }))

      const text = await requestThemeDescription(aiConfig, {
        palette: describePalette(colors),
        name: chosen?.name || name,
        language: aiConfig.language,
      })
      setDescription(text)
      setDescriptionError('')
      toast.success(t('ai.descGenerated'))
    } catch (error) {
      toast.error(t(error?.key || 'ai.errorUnknown'), 6000)
    } finally {
      setAiBusy(false)
    }
  }, [aiConfig, aiAppliedName, colors, handleApplyAiCandidate, name, toast, t])

  const handleFixContrast = useCallback(() => {
    const { colors: repaired, changed } = repairContrast(colors)
    if (changed > 0) {
      pushHistory()
      setColors(buildColors(repaired))
      setActivePresetId(null)
      toast.success(t('audit.fixed', { count: changed }))
      return
    }
    toast.error(t('audit.fixFailed'))
  }, [colors, pushHistory, toast, t])

  const handlePreviewManifest = useCallback(() => {
    setManifestOpen(true)
  }, [])

  /**
   * Save the theme in this app's own JSON shape rather than as a manifest: it
   * carries the colour *format* choice as well as the palette, and it is exactly
   * what the Import panel's "theme" branch reads back — so export -> import
   * restores everything the editor owns: name, summary, logo choice, format and
   * the 14 colours. Nothing is silently dropped.
   */
  const handleExportJson = useCallback(() => {
    downloadText(
      exportThemeJson({ name, description, colors, colorFormat, logoStyle }),
      `${folderName}.json`,
    )
  }, [name, description, colors, colorFormat, logoStyle, folderName])

  const handleGenerate = useCallback(async () => {
    if (generating) return

    // 1. Validate the user's input.
    const errors = validateThemeInput({ name, colors, description })
    if (errors.length) {
      // Field-level errors get an inline message *and* a toast. The toast is the
      // one guarantee that the failure is announced even when the offending field
      // is scrolled out of view — and it keeps the app off `alert()` entirely.
      const nameIssue = errors.find((issue) => issue.field === 'name')
      const descriptionIssue = errors.find((issue) => issue.field === 'description')
      setNameError(nameIssue ? t(nameIssue.key, nameIssue.vars) : '')
      setDescriptionError(descriptionIssue ? t(descriptionIssue.key, descriptionIssue.vars) : '')
      errors.forEach((issue) => toast.error(t(issue.key, issue.vars)))
      return
    }

    setGenerating(true)
    try {
      // 2. Assemble manifest.json and prove the JSON parses. No icon is drawn:
      //    Chrome never displays a theme's icon.png anywhere, so shipping one is
      //    3 KB of dead weight in every download (and none of the reference
      //    themes kept one at the folder root either). The rendering capability
      //    stays in utils/icon.js if it is ever wanted again.
      const pkg = await buildThemePackage({
        name,
        // The user's own folder name, not a slug of the theme name.
        folderName,
        description,
        colors,
        colorFormat,
        complete: COMPLETE_THEME,
        logoStyle,
      })

      const parsed = parseManifest(pkg.json)
      if (!parsed.ok) {
        throw new Error(`Generated manifest is not valid JSON: ${parsed.error}`)
      }
      if (!pkg.usedChromeKeys.length) {
        throw new Error('No valid colours were available to generate a theme.')
      }
      pkg.warnings.forEach((warning) => toast.error(t(warning.key, warning.vars)))

      // 4. Deliver it. Both paths carry the same package; only the hand-off
      //    differs. `folder` writes <folder>/manifest.json straight into a
      //    directory the user picks, so "Load unpacked" needs no unzipping — but
      //    only desktop Chrome/Edge can do that, which is why ZIP stays.
      if (outputMode === 'folder') {
        const rootName = await writeThemeFolder({ files: pkg.files, folder: pkg.folderName })
        toast.success(t('toast.folderWritten', { root: rootName, folder: pkg.folderName }))
      } else {
        // The archive's sole top-level entry is the theme folder, so unzipping
        // yields exactly the directory Chrome wants to be handed.
        const blob = await createZip({ files: pkg.files, folder: pkg.folderName })
        downloadBlob(blob, pkg.zipName)
        toast.success(t('toast.themeGenerated'))
      }
    } catch (error) {
      // Cancelling the directory picker is a non-event, not a failure.
      if (error?.name === 'AbortError') return
      const message = error instanceof Error ? error.message : 'Unknown error.'
      toast.error(
        t(outputMode === 'folder' ? 'toast.folderFailed' : 'toast.zipFailed', { error: message }),
        6000,
      )
    } finally {
      setGenerating(false)
    }
  }, [generating, name, folderName, description, colors, colorFormat, logoStyle, outputMode, toast, t])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  /** The NTP logo control belongs inside the New Tab Page colour group. */
  const renderNtpLogoExtra = useCallback(
    (group) =>
      group.id === 'New Tab Page' ? (
        <div className="field logo-style">
          <span className="field__label" id="logo-style-label">
            {t('settings.logo.label')}
          </span>
          <div className="segmented" role="radiogroup" aria-labelledby="logo-style-label">
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
                  onChange={() => handleLogoStyleChange(style.id)}
                />
                <span className="segmented__label">{t(style.labelKey)}</span>
                <code className="segmented__sample">{style.sample}</code>
              </label>
            ))}
          </div>
          <p className="field__hint">{t('settings.logo.hint')}</p>
        </div>
      ) : null,
    [handleLogoStyleChange, logoStyle, t],
  )

  return (
    <div className="app">
      <Header
        onReset={() => setResetOpen(true)}
        onUndo={handleUndo}
        canUndo={undoDepth > 0}
        storageWarning={mode === 'chrome' ? storageWarning : null}
        showThemeActions={mode === 'chrome'}
      />

      <main className="app__main" id="editor">
        <ModeSwitcher mode={mode} onChange={setMode} />

        {mode === 'vscode' ? (
          <>
            {/*
              Same headline slot as the Chrome workbench, with VS Code copy: the
              hero is the one line that says which editor this workspace is for,
              and both workbenches should open the same way.
            */}
            <Hero titleKey="hero.vscode.title" subtitleKey="hero.vscode.subtitle" />
            <VSCodeWorkbench
              aiConfig={aiConfig}
              onAiConfigChange={handleAiConfigChange}
              autoClear={autoClearOnNewTheme}
              onAutoClearChange={setAutoClearOnNewTheme}
            />
          </>
        ) : (
          <>
            <Hero />

            <div className="workspace">
              <div className="workspace__left">
                <ThemeSettings
                  name={name}
                  folderInput={folderInput}
                  colors={colors}
                  nameError={nameError}
                  fieldGroups={FIELD_GROUPS}
                  fields={THEME_FIELDS}
                  groupExtra={renderNtpLogoExtra}
                  aiPanel={
                    <AiNamingPanel
                      config={aiConfig}
                      onChange={handleAiConfigChange}
                      onGenerateAll={handleAiGenerateAll}
                      onApply={handleApplyAiCandidate}
                      busy={aiBusy}
                      candidates={aiCandidates}
                      appliedName={aiAppliedName}
                      description={description}
                      descriptionError={descriptionError}
                      onDescriptionChange={handleDescriptionChange}
                    />
                  }
                  onNameChange={handleNameChange}
                  onFolderChange={setFolderInput}
                  autoClear={autoClearOnNewTheme}
                  onAutoClearChange={setAutoClearOnNewTheme}
                  onClearFields={handleClearFields}
                  onColorChange={handleColorChange}
                  onInvalidColor={handleInvalidColor}
                />

            <PaletteStudio
              seed={seed}
              mode={smartMode}
              intensity={smartIntensity}
              accent={smartAccent}
              onSeedChange={setSeed}
              onModeChange={(next) => setSmartMode(pick(next, SOLVER_MODES, 'auto'))}
              onIntensityChange={(next) => setSmartIntensity(pick(next, INTENSITIES, 'balanced'))}
              onAccentChange={(next) => setSmartAccent(pick(next, ACCENT_STRATEGIES, DEFAULT_ACCENT_STRATEGY))}
              onGenerate={handleStudioGenerate}
              onInvalidSeed={handleInvalidColor}
            />

            <ImportPanel
              onApplyPalette={handleImportPalette}
              onApplyManifest={handleImportManifest}
            />

            <PresetsPanel
              activePresetId={activePresetId}
              onApplyPreset={handleApplyPreset}
              onRandomize={handleRandomize}
            />
          </div>

          <div className="workspace__right">
            <PreviewPanel
              colors={colors}
              showKeys={showKeys}
              onToggleKeys={() => setShowKeys((value) => !value)}
              auditIssues={auditIssues}
              onFixContrast={handleFixContrast}
              logoStyle={logoStyle}
            />
            <ExportPanel
              colorFormat={colorFormat}
              onColorFormatChange={setColorFormat}
              outputMode={outputMode}
              onOutputModeChange={setOutputMode}
              folderOutputSupported={canWriteFolder()}
              onGenerate={handleGenerate}
              onPreviewManifest={handlePreviewManifest}
              onExportJson={handleExportJson}
              busy={generating}
              // Read off the built manifest rather than recomputed, so the
              // subtitle can never claim a number the download does not contain.
              keyCount={manifestResult.usedChromeKeys.length}
              tintCount={manifestResult.usedTintKeys.length}
              filename={filename}
              folderName={folderName}
            />
          </div>
            </div>
          </>
        )}
      </main>

      <footer className="site-footer">
        <p>{t('footer.privacy')}</p>
      </footer>

      {mode === 'chrome' ? (
        <>
          <ManifestModal
            open={manifestOpen}
            onClose={() => setManifestOpen(false)}
            manifestJson={manifestResult.json}
            manifest={manifestResult.manifest}
            filename={filename}
          />

          <ConfirmDialog
            open={resetOpen}
            title={t('confirm.reset.title')}
            description={t('confirm.reset.description')}
            confirmLabel={t('confirm.reset.confirm')}
            destructive
            onConfirm={handleResetConfirmed}
            onCancel={() => setResetOpen(false)}
          />
        </>
      ) : null}
    </div>
  )
}
