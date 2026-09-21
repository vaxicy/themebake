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
