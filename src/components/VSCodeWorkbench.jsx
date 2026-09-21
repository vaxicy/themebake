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
import { ColorField } from './ColorField.jsx'
import { ImportPanel } from './ImportPanel.jsx'
import { PaletteStudio } from './PaletteStudio.jsx'
import { PresetsPanel } from './PresetsPanel.jsx'
import { ThemeSettings } from './ThemeSettings.jsx'
import { VSCodeMockup } from './VSCodeMockup.jsx'
import { useToast } from './Toast.jsx'
import { DEFAULT_THEME_NAME } from '../data/presets.js'
import {
  ACCENT_STRATEGIES,
  DEFAULT_ACCENT_STRATEGY,
  INTENSITIES,
  SOLVER_MODES,
  solveTheme,
} from '../utils/palette.js'
import { useI18n } from '../i18n/index.jsx'
import { describePalette, requestThemeNames } from '../utils/aiNaming.js'
import { normalizeHex } from '../utils/color.js'
import { canWriteFolder, writeThemeFolder } from '../utils/fsFolder.js'
import { buildColors, generateRandomColors, paletteDistance } from '../data/presets.js'
import { createHistory, record, undo } from '../utils/history.js'
import { loadVscodeTheme, saveVscodeTheme, storageAvailable } from '../utils/storage.js'
import { toSafeName } from '../utils/slug.js'
import { toThemeFolderName } from '../utils/package.js'
import { createZip, downloadBlob } from '../utils/zip.js'
import {
  VSCODE_FIELDS,
  VSCODE_FIELD_GROUPS,
  VSCODE_OVERRIDE_FIELDS,
  VSCODE_TYPES,
  VSCODE_OUTPUT_MODES,
  VSCODE_OUTPUT_MODE_IDS,
  DEFAULT_VSCODE_COLORS,
  DEFAULT_VSCODE_OUTPUT_MODE,
  DEFAULT_VSCODE_TYPE,
  buildOverrides,
  vscodeFieldById,
} from '../vscode/fields.js'
import {
  VSCODE_EXTENSION_VERSION,
  buildMasterColors,
  buildVscodePackage,
  buildVscodeThemeJson,
  counterpartTypeFor,
  deriveCounterpart,
  masterFromPalette,
  resolveType,
  schemeOf,
} from '../vscode/build.js'
import { VSCODE_PRESETS } from '../data/vscodePresets.js'

/**
 * Swatches shown under the studio's "derived result" strip in this workspace.
 *
 * The Chrome workbench previews Chrome roles because that is what its solver
 * returns. Here the studio result is converted into master colours, so the strip
 * previews those instead — the six fields that actually read as "the theme", so
 * the strip can never show a palette the export would not contain.
 */
const VSCODE_STRIP_ITEMS = [
  { id: 'editorBg', labelKey: 'vscode.field.editorBg' },
  { id: 'sidebarBg', labelKey: 'vscode.field.sidebarBg' },
  { id: 'titleBg', labelKey: 'vscode.field.titleBg' },
  { id: 'accent', labelKey: 'vscode.field.accent' },
  { id: 'buttonBg', labelKey: 'vscode.field.buttonBg' },
  { id: 'border', labelKey: 'vscode.field.border' },
]

const isPairableType = (type) => counterpartTypeFor(type) !== null

/**
 * One pinnable region.
 *
 * Two states and only two: *follows* a master field (the default, and what the
 * hint spells out with the colour it currently resolves to) or *pinned* to its
 * own colour. A third "half-set" state would leave the exported theme — and the
 * person reading the panel — guessing.
 */
function OverrideField({ field, value, inherited, onChange, onInvalid }) {
  const { t } = useI18n()
  const source = vscodeFieldById(field.inherits)
  const sourceLabel = t(source ? source.labelKey : 'vscode.field.sidebarBg')
  const pinned = typeof value === 'string'

  return (
    <div className={`override-field${pinned ? ' is-active' : ''}`}>
      {pinned ? (
        <ColorField
          id={`override-${field.id}`}
          label={t(field.labelKey)}
          hint={t(field.hintKey)}
          value={value}
          onChange={onChange}
          onInvalid={onInvalid}
        />
      ) : (
        <div className="override-field__inherited">
          <span
            className="override-field__swatch"
            style={{ backgroundColor: normalizeHex(inherited) ?? '#000000' }}
            aria-hidden="true"
          />
          <span className="override-field__meta">
            <span className="override-field__label">{t(field.labelKey)}</span>
            <span className="override-field__hint" id={`override-${field.id}-hint`}>
              {t('vscode.override.inherits', { source: sourceLabel })} · <code>{inherited}</code>
            </span>
          </span>
        </div>
      )}

      <label className="override-field__switch" title={t(field.hintKey)}>
        <input
          type="checkbox"
          checked={pinned}
          onChange={(event) => onChange(event.target.checked ? inherited : null)}
        />
        <span>{t('vscode.override.enable')}</span>
      </label>
    </div>
  )
}

/** Read the persisted VS Code draft exactly once. */
function readInitialState() {
  const result = loadVscodeTheme()
  if (!result.ok || !result.value) return { state: null, warning: result.ok ? null : result.error }
  const saved = result.value
  const colors = buildMasterColors(saved.colors)
  const declared = VSCODE_TYPES.some((entry) => entry.id === saved.type) ? saved.type : DEFAULT_VSCODE_TYPE

  return {
    state: {
      name: typeof saved.name === 'string' ? saved.name : DEFAULT_THEME_NAME,
      folderInput: typeof saved.folderInput === 'string' ? saved.folderInput : '',
      // Healed on load: a draft saved before the palette became the source of
      // truth can say "light" while holding dark colours, and that is exactly the
      // state that used to render a light theme dark.
      type: resolveType(declared, colors),
      colors,
      // The other half of a light/dark pair, once the user has one. `null` means
      // "derive it again when pairing is switched on".
      pairedColors: saved.pairedColors ? buildMasterColors(saved.pairedColors) : null,
      // Pinned regions travel with the draft like the colours do; anything
      // unknown or malformed is dropped, which means "inherit".
      overrides: buildOverrides(saved.overrides),
      outputMode: VSCODE_OUTPUT_MODE_IDS.includes(saved.outputMode)
        ? saved.outputMode
        : DEFAULT_VSCODE_OUTPUT_MODE,
      // Paired light+dark export. Off unless the user asked for it.
      pair: saved.pair === true,
      seed: normalizeHex(saved.seed) ?? DEFAULT_VSCODE_COLORS.editorBg,
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
  /**
   * The opposite-scheme palette of a pair, once it exists.
   *
   * Stored rather than derived on every render, because the two halves are
   * **independent**: once the user switches to the light tab and edits a colour
   * there, that is their light theme — re-deriving it from the dark one on the
   * next keystroke would silently undo the edit. New themes (preset, random,
   * studio, import) do re-derive it, so the pair stays coherent when the whole
   * palette is replaced.
   */
  const [pairedColors, setPairedColors] = useState(INITIAL.state?.pairedColors ?? null)
  // Regions pinned to their own colour instead of following the master palette.
  const [overrides, setOverrides] = useState(INITIAL.state?.overrides ?? {})
  const [outputMode, setOutputMode] = useState(() => {
    const saved = INITIAL.state?.outputMode
    if (!VSCODE_OUTPUT_MODE_IDS.includes(saved)) return DEFAULT_VSCODE_OUTPUT_MODE
    return saved === 'folder' && !canWriteFolder() ? DEFAULT_VSCODE_OUTPUT_MODE : saved
  })
  const [activePresetId, setActivePresetId] = useState(null)
  // Ship both schemes in one extension. A preference about the *output*, so it is
  // part of the draft (unlike the switch below).
  const [pair, setPair] = useState(INITIAL.state?.pair ?? false)
  /**
   * Which half of the pair the panel is working on: `primary` or `paired`.
   *
   * The colour fields, the mockup and the "derived" note all follow this, so
   * switching to 浅色 shows *the light palette's values* — and typing in them
   * edits the light palette. That is the whole point of storing both: the two
   * halves are two themes, not one theme and its preview.
   */
  const [editingSlot, setEditingSlot] = useState('primary')

  // ---------------------------------------------------------------------------
  // Undo (Ctrl+Z)
  // ---------------------------------------------------------------------------
  // Same contract as the Chrome workbench (utils/history.js): a snapshot is
  // pushed *before* each mutation, consecutive edits to one field collapse into a
  // single step, and every discrete action gets its own. The stack lives in a ref
  // because only its depth is rendered.
  const historyRef = useRef(null)
  if (historyRef.current === null) historyRef.current = createHistory()
  const [undoDepth, setUndoDepth] = useState(0)

  // ------------------------------------------------------- smart palette studio
  const [seed, setSeed] = useState(INITIAL.state?.seed ?? DEFAULT_VSCODE_COLORS.editorBg)
  const [smartMode, setSmartMode] = useState(INITIAL.state?.smartMode ?? 'auto')
  const [smartIntensity, setSmartIntensity] = useState(INITIAL.state?.smartIntensity ?? 'balanced')
  const [smartAccent, setSmartAccent] = useState(
    INITIAL.state?.smartAccent ?? DEFAULT_ACCENT_STRATEGY,
  )

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
  // The last palette randomise produced, so the next one can be forced to differ.
  const lastRandomRef = useRef(null)

  // ---------------------------------------------------------------- persistence
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const result = saveVscodeTheme({
        name,
        folderInput,
        type,
        colors,
        pairedColors,
        overrides,
        outputMode,
        pair,
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
    folderInput,
    type,
    colors,
    pairedColors,
    overrides,
    outputMode,
    pair,
    seed,
    smartMode,
    smartIntensity,
    smartAccent,
  ])

  // ------------------------------------------------------------------ derived
  const master = useMemo(() => buildMasterColors(colors), [colors])

  /**
   * The scheme the palette *is*, read off the colours — never off the selector.
   * It is what the UI shows, what the pair is built around, and (through
   * `resolveType`) what the exported theme declares.
   */
  const scheme = useMemo(() => schemeOf(master), [master])
  /** `hc-black` is a rendering mode, so it is the one manual choice left. */
  const highContrast = type === 'hc-black'
  const pairable = isPairableType(type)
  /** The scheme the other half of the pair has, or null in high contrast. */
  const otherScheme = counterpartTypeFor(scheme)

  /** The stored other half, or null while pairing is off / nothing is stored yet. */
  const counterpart = useMemo(
    () => (pair && pairable && pairedColors ? buildMasterColors(pairedColors) : null),
    [pair, pairable, pairedColors],
  )
  const editingPaired = editingSlot === 'paired' && counterpart !== null

  /** The palette the fields edit and the mockup shows. */
  const activeColors = editingPaired ? counterpart : master

  /** The type every export writes. For dark/light it is the palette's own scheme. */
  const exportedType = useMemo(() => resolveType(type, master), [type, master])

  const themeJson = useMemo(
    () => buildVscodeThemeJson({ name, type: exportedType, colors: activeColors }),
    [name, exportedType, activeColors],
  )
  const folderName = useMemo(() => toSafeName(folderInput) || toThemeFolderName(name), [folderInput, name])
  /** What the chosen output will be called, shown before anything is generated. */
  const exportFilename = useMemo(
    () =>
      outputMode === 'vsix'
        ? `${folderName}-${VSCODE_EXTENSION_VERSION}.vsix`
        : `${folderName}.zip`,
    [folderName, outputMode],
  )
  const storageWarning = storageWarningKey ? t(storageWarningKey) : null

  // ----------------------------------------------------------------- handlers
  /** The slice one undo step restores: both palettes and the pinned regions. */
  const snapshotDraft = useCallback(
    () => ({ colors, pairedColors, overrides }),
    [colors, pairedColors, overrides],
  )

  /** Record the current draft so the mutation about to run can be undone. */
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
    setPairedColors(snapshot.pairedColors ?? null)
    setOverrides(snapshot.overrides ?? {})
    toast.info(t('toast.undone'))
    return true
  }, [toast, t])

  // Ctrl/Cmd+Z. Skipped inside text fields so the browser's own undo keeps
  // working while typing a name, a folder name or a hex value.
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

      if (handleUndo()) event.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleUndo])

  const handleClearFields = useCallback(() => {
    setName('')
    setFolderInput('')
    setNameError('')
    toast.info(t('toast.vscodeFieldsCleared'))
  }, [toast, t])

  /** Colour edits land in whichever half is on screen. */
  const handleColorChange = useCallback(
    (fieldId, next) => {
      pushHistory(fieldId)
      if (editingPaired) setPairedColors((current) => ({ ...(current ?? {}), [fieldId]: next }))
      else setColors((current) => ({ ...current, [fieldId]: next }))
    },
    [editingPaired, pushHistory],
  )

  /**
   * Pin or release one region. `null` means "follow the master palette again",
   * which is the same state a fresh draft is in — the override is deleted rather
   * than stored as an empty string, so `buildOverrides` has nothing to sanitise.
   */
  const handleOverrideChange = useCallback(
    (fieldId, next) => {
      pushHistory(`override:${fieldId}`)
      setOverrides((current) => {
        const copy = { ...current }
        if (typeof next === 'string' && normalizeHex(next)) copy[fieldId] = normalizeHex(next)
        else delete copy[fieldId]
        return copy
      })
    },
    [pushHistory],
  )

  /**
   * Rebuild the other half of the pair from the palette that just arrived.
   *
   * Only *new* themes go through here: a hand edit must never rewrite the other
   * side, or the "two independent palettes" promise is broken. Everywhere a new
   * theme actually lands (studio, random, import, preset, scheme switch) the flip
   * is regenerated, always from the colours on screen — keeping a stored half
   * merely because it *was* the opposite scheme is how a fresh palette ended up
   * beside the previous theme's other side: a new purple dark theme paired with
   * the grey light half of whatever came before it.
   */
  const reseedPair = useCallback(
    (palette) => {
      const opposite = counterpartTypeFor(schemeOf(palette))
      if (!pair || !opposite) return
      setPairedColors(deriveCounterpart(palette, opposite))
    },
    [pair],
  )

  /**
   * The dark/light cards are not a label picker: the palette already *is* one of
   * them, so clicking the other one means "give me that version" and the palette
   * is converted to match. The selector can therefore never disagree with the
   * colours it describes.
   */
  const handleTypeSelect = useCallback(
    (next) => {
      pushHistory()
      setEditingSlot('primary')
      if (next === 'hc-black') {
        setType('hc-black')
        return
      }
      setType(next)
      if (next === scheme) return
      const converted = deriveCounterpart(master, next)
      setColors(converted)
      // The other half has to be the *opposite* again, or the pair would hold two
      // palettes of the same scheme.
      reseedPair(converted)
      toast.info(t('toast.vscodeSchemeSwitched', { scheme: t(`scheme.${next}`) }))
    },
    [master, pushHistory, reseedPair, scheme, toast, t],
  )

  const handlePairChange = useCallback(
    (next) => {
      pushHistory()
      setPair(next)
      if (next) {
        // Seed the other half the first time it is switched on: an inverted copy
        // of the palette on screen is the useful starting point, and from then on
        // it is the user's own palette.
        const opposite = counterpartTypeFor(schemeOf(master))
        if (opposite) {
          setPairedColors((current) =>
            current && schemeOf(current) === opposite ? current : deriveCounterpart(master, opposite),
          )
        }
      } else {
        // The switch only exists while a pair is configured, so turning it off has
        // to bring the panel back to the primary palette.
        setEditingSlot('primary')
      }
    },
    [master, pushHistory],
  )

  const handleApplyPreset = useCallback(
    (presetId) => {
      const preset = VSCODE_PRESETS.find((entry) => entry.id === presetId)
      if (!preset) return
      pushHistory()
      const built = buildMasterColors(preset.colors)
      setColors(built)
      // Read the scheme off the preset's own colours: presets ship one palette
      // each, and some are built from a light file. High contrast is preserved.
      setType(resolveType(type, built))
      reseedPair(built)
      setActivePresetId(preset.id)
      toast.success(t('toast.presetApplied', { name: preset.name }))
    },
    [pushHistory, reseedPair, toast, t, type],
  )

  /** Shared "solve a palette and adopt it" step for studio / random / import. */
  const applySolvedPalette = useCallback(
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
      pushHistory()
      const built = masterFromPalette(buildColors(result.colors))
      setColors(built)
      // The solver decided light or dark from the seed; the declared type follows
      // the palette it produced, so the pair is always the right way round.
      setType(resolveType(type, built))
      reseedPair(built)
      setActivePresetId(null)
      return result
    },
    [pushHistory, reseedPair, smartMode, smartIntensity, smartAccent, toast, t, type],
  )

  const handleStudioGenerate = useCallback(() => {
    if (applySolvedPalette([seed])) toast.success(t('toast.smartApplied'))
  }, [applySolvedPalette, seed, toast, t])

  const handleImportPalette = useCallback(
    (seeds) => {
      const result = applySolvedPalette(seeds)
      if (!result) return
      toast.success(
        t(result.distinctSeedsUsed > 0 ? 'toast.paletteAppliedUsed' : 'toast.paletteApplied', {
          count: result.seedCount,
          used: result.distinctSeedsUsed,
        }),
      )
    },
    [applySolvedPalette, toast, t],
  )

  /** Chrome manifests do not map onto VS Code keys — palette import only. */
  const handleImportManifestUnsupported = useCallback(() => {
    toast.error(t('vscode.importManifestUnsupported'))
  }, [toast, t])

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
    const built = masterFromPalette(buildColors(candidate))
    setColors(built)
    setType(resolveType(type, built))
    reseedPair(built)
    setActivePresetId(null)
    toast.success(t('toast.randomApplied'))
  }, [pushHistory, reseedPair, toast, t, type])

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
      const pkg = buildVscodePackage({
        name,
        folderName,
        type: exportedType,
        colors: master,
        counterpart: counterpart
          ? { type: counterpartTypeFor(exportedType), colors: counterpart }
          : null,
        overrides,
        format: outputMode,
      })
      if (outputMode === 'folder') {
        const rootName = await writeThemeFolder({ files: pkg.files, folder: pkg.folderName })
        toast.success(t('toast.folderWritten', { root: rootName, folder: pkg.folderName }))
      } else {
        // A VSIX is a zip whose entries are already archive-absolute, so it must
        // NOT be wrapped in the theme folder the bare-ZIP hand-over needs.
        const blob = await createZip({
          files: pkg.files,
          folder: outputMode === 'vsix' ? null : pkg.folderName,
        })
        downloadBlob(blob, pkg.fileName)
        toast.success(
          t(
            outputMode === 'vsix'
              ? pkg.themeCount > 1
                ? 'toast.vscodeVsixGeneratedPair'
                : 'toast.vscodeVsixGenerated'
              : pkg.themeCount > 1
                ? 'toast.vscodeGeneratedPair'
                : 'toast.vscodeGenerated',
          ),
        )
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
  }, [
    colors,
    counterpart,
    exportedType,
    folderName,
    generating,
    master,
    name,
    outputMode,
    overrides,
    toast,
    t,
  ])

  /** The scheme of each slot, for the switch labels. */
  const pairedScheme = counterpart ? schemeOf(counterpart) : null

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
          // The fields show — and edit — whichever half of the pair is selected,
          // so switching to 浅色 shows the light palette's own values.
          colors={activeColors}
          nameError={nameError}
          fieldGroups={VSCODE_FIELD_GROUPS}
          fields={VSCODE_FIELDS}
          titleKey="vscode.title"
          subtitleKey="vscode.subtitle"
          onUndo={handleUndo}
          canUndo={undoDepth > 0}
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
              <div
                className="segmented segmented--three"
                role="radiogroup"
                aria-label={t('vscode.type.label')}
              >
                {VSCODE_TYPES.map((entry) => {
                  // Dark and light are read off the palette, so their cards show
                  // what the colours *are*; only high contrast is a stored choice.
                  // While high contrast is on, exactly one card may be active —
                  // otherwise the scheme card stays lit and clicking it is a no-op,
                  // because a radio that is already checked never fires onChange.
                  const active = highContrast
                    ? entry.id === 'hc-black'
                    : entry.id === scheme
                  return (
                    <label
                      key={entry.id}
                      className={`segmented__option${active ? ' is-active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="vscode-type"
                        value={entry.id}
                        checked={active}
                        onChange={() => handleTypeSelect(entry.id)}
                      />
                      <span className="segmented__label">{t(entry.labelKey)}</span>
                      <code className="segmented__sample">{entry.uiTheme}</code>
                    </label>
                  )
                })}
              </div>
              <p className="format-picker__hint">
                {t('vscode.type.hint', { scheme: t(`scheme.${scheme}`) })}
              </p>

              {/*
                The pair switch. Only meaningful for the two real schemes — high
                contrast is a rendering mode of its own, so the control stays
                visible but disabled rather than silently vanishing.
              */}
              <label className={`pair-toggle${pairable ? '' : ' is-disabled'}`}>
                <input
                  type="checkbox"
                  checked={pair && pairable}
                  disabled={!pairable}
                  onChange={(event) => handlePairChange(event.target.checked)}
                />
                <span className="pair-toggle__body">
                  <span className="pair-toggle__label">{t('vscode.pair.label')}</span>
                  <span className="pair-toggle__hint">
                    {pairable
                      ? t('vscode.pair.hint', { other: t(`scheme.${otherScheme}`) })
                      : t('vscode.pair.hcUnsupported')}
                  </span>
                </span>
              </label>
            </fieldset>
          }
          footerSlot={
            <div className="settings-groups">
              <fieldset className="settings-group">
                <legend className="settings-group__legend">{t('vscode.override.section')}</legend>
                {/*
                  Pins are absolute colours, so they belong to the palette they
                  were chosen against — the primary one. Showing them while the
                  other half is on screen would let a user "pin" a region and see
                  nothing happen, so the section explains itself instead.
                */}
                {editingPaired ? (
                  <p className="settings-group__hint">
                    {t('vscode.override.otherPairNote', { scheme: t(`scheme.${scheme}`) })}
                  </p>
                ) : (
                  <>
                    <p className="settings-group__hint">{t('vscode.override.sectionHint')}</p>
                    <div className="settings-group__fields">
                      {VSCODE_OVERRIDE_FIELDS.map((field) => (
                        <OverrideField
                          key={field.id}
                          field={field}
                          value={overrides[field.id]}
                          inherited={master[field.inherits]}
                          onChange={(next) => handleOverrideChange(field.id, next)}
                          onInvalid={(label) => toast.error(t('colorField.invalidToast', { label }))}
                        />
                      ))}
                    </div>
                  </>
                )}
              </fieldset>
            </div>
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
          accent={smartAccent}
          onSeedChange={setSeed}
          onModeChange={(next) => setSmartMode(SOLVER_MODES.includes(next) ? next : 'auto')}
          onIntensityChange={(next) => setSmartIntensity(INTENSITIES.includes(next) ? next : 'balanced')}
          onAccentChange={(next) =>
            setSmartAccent(ACCENT_STRATEGIES.includes(next) ? next : DEFAULT_ACCENT_STRATEGY)
          }
          onGenerate={handleStudioGenerate}
          onInvalidSeed={(label) => toast.error(t('colorField.invalidToast', { label }))}
          seedHintKey="studio.vscodeSeedHint"
          stripMapper={masterFromPalette}
          stripItems={VSCODE_STRIP_ITEMS}
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

            {/*
              Only shown while a pair exists: with one scheme there is nothing to
              switch between, and an inert control would just be noise. Each tab
              is named after the scheme *that palette is*, so the two can never be
              mislabelled even if one of them later changes scheme.
            */}
            {counterpart ? (
              <div
                className="segmented segmented--pair"
                role="radiogroup"
                aria-label={t('vscode.preview.variantLegend')}
              >
                {[
                  { slot: 'primary', label: scheme },
                  { slot: 'paired', label: pairedScheme },
                ].map(({ slot, label }) => (
                  <label
                    key={slot}
                    className={`segmented__option${editingSlot === slot ? ' is-active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="vsc-editing-slot"
                      value={slot}
                      checked={editingSlot === slot}
                      onChange={() => setEditingSlot(slot)}
                    />
                    <span className="segmented__label">{t(`scheme.${label}`)}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>

          <VSCodeMockup colors={activeColors} overrides={editingPaired ? {} : overrides} />

          <p className="export-panel__note">
            {t('vscode.preview.derived', {
              colors: themeJson.colors ? Object.keys(themeJson.colors).length : 0,
              tokens: themeJson.tokenColors.length,
            })}
          </p>

          {counterpart ? (
            <p className="export-panel__note">
              {t('vscode.preview.pairNote', {
                shown: t(`scheme.${editingPaired ? pairedScheme : scheme}`),
              })}
            </p>
          ) : null}
        </section>

        <section className="panel export-panel" aria-labelledby="vsc-export-heading">
          <div className="panel__header">
            <div>
              <h2 className="panel__title" id="vsc-export-heading">
                {t('vscode.export.title')}
              </h2>
              <p className="panel__subtitle">
                {outputMode === 'folder'
                  ? t(
                      counterpart ? 'vscode.export.subtitlePairFolder' : 'vscode.export.subtitleFolder',
                      { folder: folderName },
                    )
                  : t(counterpart ? 'vscode.export.subtitlePair' : 'vscode.export.subtitle', {
                      filename: exportFilename,
                      count: counterpart ? 2 : 1,
                    })}
              </p>
            </div>
          </div>

          <fieldset className="format-picker">
            <legend className="format-picker__legend">{t('export.outputLegend')}</legend>
            <div
              className="segmented segmented--three"
              role="radiogroup"
              aria-label={t('export.outputLegend')}
            >
              {VSCODE_OUTPUT_MODES.map((mode) => {
                const disabled = mode.id === 'folder' && !canWriteFolder()
                return (
                  <label
                    key={mode.id}
                    className={`segmented__option${outputMode === mode.id ? ' is-active' : ''}${disabled ? ' is-disabled' : ''}`}
                  >
                    <input
                      type="radio"
                      name="vscode-output-mode"
                      value={mode.id}
                      checked={outputMode === mode.id}
                      disabled={disabled}
                      onChange={() => setOutputMode(mode.id)}
                    />
                    <span className="segmented__label">{t(mode.labelKey)}</span>
                  </label>
                )
              })}
            </div>
            <p className="format-picker__hint">
              {t(canWriteFolder() ? 'vscode.export.outputHint' : 'vscode.export.outputHintNoFolder')}
            </p>
          </fieldset>

          <p className="export-panel__note">
            {outputMode === 'folder'
              ? t(counterpart ? 'vscode.export.notePairFolder' : 'vscode.export.noteFolder', {
                  folder: folderName,
                })
              : outputMode === 'vsix'
                ? t(counterpart ? 'vscode.export.notePairVsix' : 'vscode.export.noteVsix', {
                    filename: exportFilename,
                  })
                : t(counterpart ? 'vscode.export.notePair' : 'vscode.export.note', {
                    folder: folderName,
                  })}
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
            {/* The steps follow the chosen artefact: a VSIX is installed from the
                Extensions view, a folder is copied — telling the wrong one is how
                a theme ends up "generated but not installed". */}
            <ol className="howto__list">
              {outputMode === 'vsix' ? (
                <>
                  <li>{t('vscode.export.howtoVsix1')}</li>
                  <li>{t('vscode.export.howtoVsix2', { filename: exportFilename })}</li>
                </>
              ) : (
                <>
                  <li>{t('vscode.export.howto1', { name })}</li>
                  <li>{t('vscode.export.howto2')}</li>
                </>
              )}
              <li>{t('vscode.export.howto3', { name })}</li>
            </ol>
          </details>
        </section>
      </div>
    </div>
  )
}
