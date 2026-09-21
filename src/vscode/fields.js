/**
 * VS Code workbench — master colour fields.
 *
 * A VS Code colour theme JSON carries ~90 workbench keys plus `tokenColors`.
 * Editing all of them is noise: the hand-made reference themes repeat a small
 * set of base colours across most keys. So the editor exposes **14 master
 * fields** (mirroring the Chrome workbench's 14 keys) and `vscode/build.js`
 * derives every real key from them, plus auto-generates `tokenColors`.
 */

/** Segmented options for the theme `type`. `uiTheme` goes into package.json. */
export const VSCODE_TYPES = [
  { id: 'dark', labelKey: 'vscode.type.dark', uiTheme: 'vs-dark' },
  { id: 'light', labelKey: 'vscode.type.light', uiTheme: 'vs' },
  { id: 'hc-black', labelKey: 'vscode.type.hc', uiTheme: 'hc-black' },
]

export const VSCODE_TYPE_IDS = VSCODE_TYPES.map((type) => type.id)

export const DEFAULT_VSCODE_TYPE = 'dark'

/**
 * How a finished VS Code theme is handed over.
 *
 * VSIX first, because it is the format VS Code actually installs: one file,
 * double-clicked or picked in the Extensions view, no unzipping and no
 * `extensions/` folder to find. ZIP stays for the cases a VSIX cannot serve —
 * it downloads to any folder on any OS and can be unzipped anywhere — and the
 * folder output stays because writing straight into `~/.vscode/extensions` is
 * the fastest path while developing a theme.
 *
 * @type {{id: string, labelKey: string}[]}
 */
export const VSCODE_OUTPUT_MODES = [
  { id: 'vsix', labelKey: 'export.output.vsix' },
  { id: 'zip', labelKey: 'export.output.zip' },
  { id: 'folder', labelKey: 'export.output.folder' },
]

/** Valid VS Code `outputMode` values, in render order. */
export const VSCODE_OUTPUT_MODE_IDS = VSCODE_OUTPUT_MODES.map((mode) => mode.id)

export const DEFAULT_VSCODE_OUTPUT_MODE = 'vsix'

/** Where each master field appears in the generated theme JSON (documentation). */
export const VSCODE_FIELD_GROUPS = [
  { id: 'Editor', key: 'vscode.group.editor' },
  { id: 'Shell', key: 'vscode.group.shell' },
  { id: 'Controls', key: 'vscode.group.controls' },
  { id: 'Semantic', key: 'vscode.group.semantic' },
]

export const VSCODE_FIELDS = [
  // -------------------------------------------------------------- editor
  { id: 'editorBg', group: 'Editor', labelKey: 'vscode.field.editorBg', hintKey: 'vscode.field.editorBg.hint' },
  { id: 'editorFg', group: 'Editor', labelKey: 'vscode.field.editorFg', hintKey: 'vscode.field.editorFg.hint' },
  { id: 'accent', group: 'Editor', labelKey: 'vscode.field.accent', hintKey: 'vscode.field.accent.hint' },
  { id: 'selectionBg', group: 'Editor', labelKey: 'vscode.field.selectionBg', hintKey: 'vscode.field.selectionBg.hint' },
  { id: 'lineHighlightBg', group: 'Editor', labelKey: 'vscode.field.lineHighlightBg', hintKey: 'vscode.field.lineHighlightBg.hint' },
  { id: 'mutedFg', group: 'Editor', labelKey: 'vscode.field.mutedFg', hintKey: 'vscode.field.mutedFg.hint' },
  // --------------------------------------------------------------- shell
  { id: 'activityBg', group: 'Shell', labelKey: 'vscode.field.activityBg', hintKey: 'vscode.field.activityBg.hint' },
  { id: 'sidebarBg', group: 'Shell', labelKey: 'vscode.field.sidebarBg', hintKey: 'vscode.field.sidebarBg.hint' },
  { id: 'titleBg', group: 'Shell', labelKey: 'vscode.field.titleBg', hintKey: 'vscode.field.titleBg.hint' },
  { id: 'border', group: 'Shell', labelKey: 'vscode.field.border', hintKey: 'vscode.field.border.hint' },
  // ------------------------------------------------------------ controls
  { id: 'buttonBg', group: 'Controls', labelKey: 'vscode.field.buttonBg', hintKey: 'vscode.field.buttonBg.hint' },
  { id: 'buttonFg', group: 'Controls', labelKey: 'vscode.field.buttonFg', hintKey: 'vscode.field.buttonFg.hint' },
  // ----------------------------------------------------------- semantic
  { id: 'errorFg', group: 'Semantic', labelKey: 'vscode.field.errorFg', hintKey: 'vscode.field.errorFg.hint' },
  { id: 'warningFg', group: 'Semantic', labelKey: 'vscode.field.warningFg', hintKey: 'vscode.field.warningFg.hint' },
]

export const VSCODE_FIELD_IDS = VSCODE_FIELDS.map((field) => field.id)

/** Look one master field up by id (the UI needs its label for "follows X"). */
export function vscodeFieldById(id) {
  return VSCODE_FIELDS.find((field) => field.id === id) ?? null
}

/**
 * Regions VS Code treats as their *own* surfaces, which the 14 master fields
 * deliberately merge.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS
 * ---------------------------------------------------------------------------
 * Merging them is what makes the editor usable: nobody wants to name 90 colours
 * by hand. But the merge is also the one place the model can feel wrong — the
 * panel, the status bar and the sidebar are three distinct strips on screen, and
 * real themes (including this project's own hand-made ones) colour them
 * differently. A theme whose sidebar is light and whose status bar is brown is
 * perfectly normal in VS Code and simply not expressible through one field.
 *
 * So each of these starts out *inheriting* a master field and can be pinned to
 * its own colour. `inherits` is the master field id, which is what the UI shows
 * as "follows …" and what an empty override falls back to.
 *
 * @type {{id:string, labelKey:string, hintKey:string, inherits:string}[]}
 */
export const VSCODE_OVERRIDE_FIELDS = [
  {
    id: 'panelBg',
    labelKey: 'vscode.override.panelBg',
    hintKey: 'vscode.override.panelBg.hint',
    inherits: 'sidebarBg',
  },
  {
    id: 'statusBarBg',
    labelKey: 'vscode.override.statusBarBg',
    hintKey: 'vscode.override.statusBarBg.hint',
    inherits: 'sidebarBg',
  },
  {
    id: 'inactiveTabBg',
    labelKey: 'vscode.override.inactiveTabBg',
    hintKey: 'vscode.override.inactiveTabBg.hint',
    inherits: 'titleBg',
  },
  {
    id: 'widgetBg',
    labelKey: 'vscode.override.widgetBg',
    hintKey: 'vscode.override.widgetBg.hint',
    inherits: 'sidebarBg',
  },
  {
    id: 'lineNumberFg',
    labelKey: 'vscode.override.lineNumberFg',
    hintKey: 'vscode.override.lineNumberFg.hint',
    inherits: 'mutedFg',
  },
  {
    id: 'indentGuideFg',
    labelKey: 'vscode.override.indentGuideFg',
    hintKey: 'vscode.override.indentGuideFg.hint',
    inherits: 'border',
  },
]

export const VSCODE_OVERRIDE_IDS = VSCODE_OVERRIDE_FIELDS.map((field) => field.id)

/**
 * Keep only the overrides a caller actually asked for: a known id with a valid
 * hex colour. An empty or broken entry must mean "inherit", never "write the
 * literal string into the theme".
 *
 * @param {Record<string,string>|null|undefined} input
 * @returns {Record<string,string>} possibly empty
 */
export function buildOverrides(input) {
  const out = {}
  if (!input || typeof input !== 'object') return out
  for (const id of VSCODE_OVERRIDE_IDS) {
    const value = input[id]
    if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.trim())) {
      out[id] = value.trim().toUpperCase()
    }
  }
  return out
}

/**
 * The palette the VS Code workbench opens with: a calm dark violet scheme in
 * the house style. Every value is a master field id -> `#RRGGBB`.
 */
export const DEFAULT_VSCODE_COLORS = {
  editorBg: '#211E33',
  editorFg: '#E8E6F5',
  accent: '#B1B2FF',
  selectionBg: '#413D66',
  lineHighlightBg: '#2A2740',
  mutedFg: '#9C97B8',
  activityBg: '#191726',
  sidebarBg: '#272440',
  titleBg: '#302C4D',
  border: '#3C3860',
  buttonBg: '#B1B2FF',
  buttonFg: '#1E1B45',
  errorFg: '#E693A0',
  warningFg: '#EAC18C',
}
