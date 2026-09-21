/**
 * VS Code theme derivation.
 *
 * Turns the 14 master colour fields (`vscode/fields.js`) into everything a
 * loadable VS Code extension needs:
 *
 *   - the full workbench `colors` map (~90 keys, all derived)
 *   - auto-generated `tokenColors` + `semanticTokenColors`
 *   - the colour-theme JSON file
 *   - the complete extension package (package.json + theme file + README)
 *
 * The shape follows the hand-made reference themes (peach-sorbet & co): one
 * `themes/<slug>-color-theme.json` declared by a minimal package.json.
 *
 * Free of DOM calls so it stays runnable in Node (verify / future tests).
 */

import { adjustL, mix, parseHex, readableTextOn, relativeLuminance } from '../utils/color.js'
import { toSafeName } from '../utils/slug.js'
import { toThemeFolderName } from '../utils/package.js'
import { DEFAULT_VSCODE_COLORS, DEFAULT_VSCODE_TYPE, VSCODE_TYPES, VSCODE_FIELD_IDS } from './fields.js'

/** Attach an alpha byte: `#RRGGBB` + `'99'` -> `#RRGGBB99` (VS Code hex8). */
function fade(hex, alpha) {
  return `${hex}${alpha}`.toUpperCase()
}

/** Is the master palette a dark scheme? Drives a handful of derivations. */
export function isDarkTheme(colors) {
  return relativeLuminance(colors.editorBg) < 0.4
}

/**
 * Normalise arbitrary input (a preset, a restored draft) into the 14 master
 * fields. Unknown ids are dropped; missing ones fall back to the defaults so
 * `buildVscodeColors` can always rely on a complete record.
 */
export function buildMasterColors(input) {
  const result = {}
  for (const id of VSCODE_FIELD_IDS) {
    const value = input?.[id]
    result[id] = parseHex(value) ? value.toUpperCase() : DEFAULT_VSCODE_COLORS[id]
  }
  return result
}

/**
 * Derive the full workbench `colors` map from the master fields. The layout
 * mirrors the reference themes: one "editor" surface, one "sidebar" surface
 * reused by panels/widgets/status bar, a title/tab surface and a border tone.
 * @param {Record<string,string>} m master colours
 */
export function buildVscodeColors(m) {
  const dark = isDarkTheme(m)
  const onAccent = readableTextOn(m.accent)
  const hoverSurface = mix(m.titleBg, m.editorBg, 0.5)
  const findMatch = mix(m.selectionBg, m.accent, 0.45)

  const ansi = {
    black: dark ? mix(m.editorBg, '#000000', 0.35) : mix(m.editorFg, '#000000', 0.25),
    red: m.errorFg,
    green: mix(m.warningFg, '#8FBF6F', 0.55),
    yellow: m.warningFg,
    blue: mix(m.accent, '#6B9BD1', 0.5),
    magenta: mix(m.accent, '#E06C9F', 0.5),
    cyan: mix(m.accent, '#56B6C2', 0.5),
    white: m.mutedFg,
  }

  return {
    foreground: m.editorFg,
    descriptionForeground: m.mutedFg,
    focusBorder: m.accent,
    'selection.background': m.selectionBg,

    'editor.background': m.editorBg,
    'editor.foreground': m.editorFg,
    'editor.selectionBackground': m.selectionBg,
    'editor.inactiveSelectionBackground': fade(m.selectionBg, '99'),
    'editor.lineHighlightBackground': m.lineHighlightBg,
    'editorCursor.foreground': m.accent,
    'editorLineNumber.foreground': m.mutedFg,
    'editorLineNumber.activeForeground': m.accent,
    'editorIndentGuide.background1': fade(m.border, '66'),
    'editorIndentGuide.activeBackground1': m.mutedFg,
    'editorWhitespace.foreground': m.border,
    'editor.findMatchBackground': findMatch,
    'editor.findMatchHighlightBackground': fade(findMatch, '77'),
    'editorBracketMatch.border': m.accent,
    'editorBracketMatch.background': m.selectionBg,

    'tab.activeBackground': m.editorBg,
    'tab.activeForeground': m.editorFg,
    'tab.activeBorderTop': m.accent,
    'tab.inactiveBackground': m.titleBg,
    'tab.inactiveForeground': m.mutedFg,
    'tab.border': m.border,
    'editorGroupHeader.tabsBackground': m.titleBg,

    'list.activeSelectionBackground': m.selectionBg,
    'list.activeSelectionForeground': m.editorFg,
    'list.inactiveSelectionBackground': fade(m.selectionBg, '99'),
    'list.inactiveSelectionForeground': m.editorFg,
    'list.hoverBackground': hoverSurface,
    'list.highlightForeground': m.accent,

    'button.background': m.buttonBg,
    'button.foreground': m.buttonFg,
    'button.hoverBackground': adjustL(m.buttonBg, dark ? 0.06 : -0.05),
    'badge.background': m.accent,
    'badge.foreground': onAccent,

    'activityBar.background': m.activityBg,
    'activityBar.foreground': m.editorFg,
    'activityBar.inactiveForeground': m.mutedFg,
    'activityBar.activeBorder': m.accent,
    'activityBarBadge.background': m.buttonBg,
    'activityBarBadge.foreground': m.buttonFg,

    'scrollbarSlider.background': fade(m.border, '88'),
    'scrollbarSlider.hoverBackground': fade(m.border, 'BB'),

    'sideBar.background': m.sidebarBg,
    'sideBar.foreground': m.editorFg,
    'sideBar.border': m.border,
    'panel.background': m.sidebarBg,
    'panel.foreground': m.editorFg,
    'panel.border': m.border,

    'statusBar.background': m.sidebarBg,
    'statusBar.foreground': m.editorFg,
    'statusBar.debuggingBackground': m.accent,
    'statusBar.debuggingForeground': onAccent,
    'statusBar.noFolderBackground': m.sidebarBg,
    'statusBar.noFolderForeground': m.editorFg,

    'titleBar.activeBackground': m.titleBg,
    'titleBar.activeForeground': m.editorFg,
    'titleBar.inactiveBackground': m.editorBg,
    'titleBar.inactiveForeground': m.mutedFg,

    'input.background': m.sidebarBg,
    'input.foreground': m.editorFg,
    'input.border': m.border,
    'input.placeholderForeground': m.mutedFg,
    'dropdown.background': m.sidebarBg,
    'dropdown.foreground': m.editorFg,
    'dropdown.border': m.border,

    'editorWidget.background': m.sidebarBg,
    'editorWidget.foreground': m.editorFg,
    'editorWidget.border': m.border,
    'editorHoverWidget.background': m.sidebarBg,
    'editorHoverWidget.foreground': m.editorFg,
    'editorHoverWidget.border': m.border,
    'editorSuggestWidget.background': m.sidebarBg,
    'editorSuggestWidget.foreground': m.editorFg,
    'editorSuggestWidget.border': m.border,
    'editorSuggestWidget.selectedBackground': m.selectionBg,
    'notifications.background': m.sidebarBg,
    'notifications.foreground': m.editorFg,
    'notifications.border': m.border,
    'quickInput.background': m.sidebarBg,
    'quickInput.foreground': m.editorFg,

    'textLink.foreground': m.accent,
    'textLink.activeForeground': m.accent,
    'editorError.foreground': m.errorFg,
    'errorForeground': m.errorFg,
    'editorWarning.foreground': m.warningFg,
    'editorInfo.foreground': mix(m.accent, '#6B9BD1', 0.5),
    'gitDecoration.addedResourceForeground': mix(m.warningFg, '#8FBF6F', 0.55),
    'gitDecoration.modifiedResourceForeground': mix(m.accent, '#6B9BD1', 0.45),
    'gitDecoration.deletedResourceForeground': m.errorFg,

    'terminal.background': m.editorBg,
    'terminal.foreground': m.editorFg,
    'terminal.ansiBlack': ansi.black,
    'terminal.ansiRed': ansi.red,
    'terminal.ansiGreen': ansi.green,
    'terminal.ansiYellow': ansi.yellow,
    'terminal.ansiBlue': ansi.blue,
    'terminal.ansiMagenta': ansi.magenta,
    'terminal.ansiCyan': ansi.cyan,
    'terminal.ansiWhite': ansi.white,
    'terminal.ansiBrightBlack': m.mutedFg,
    'terminal.ansiBrightRed': adjustL(ansi.red, dark ? 0.08 : -0.08),
    'terminal.ansiBrightGreen': adjustL(ansi.green, dark ? 0.08 : -0.08),
    'terminal.ansiBrightYellow': adjustL(ansi.yellow, dark ? 0.08 : -0.08),
    'terminal.ansiBrightBlue': adjustL(ansi.blue, dark ? 0.08 : -0.08),
    'terminal.ansiBrightMagenta': adjustL(ansi.magenta, dark ? 0.08 : -0.08),
    'terminal.ansiBrightCyan': adjustL(ansi.cyan, dark ? 0.08 : -0.08),
    'terminal.ansiBrightWhite': m.editorFg,
  }
}

/**
 * Auto-generated syntax colours. All hues lean on the master palette: the
 * accent drives keywords, the semantic colours drive strings/numbers, and the
 * remaining token families are hue-mixed accents — so the token colours always
 * feel coordinated with the workbench without the user touching them.
 * @param {Record<string,string>} m master colours
 * @returns {{palette: Record<string,string>, tokenColors: object[], semanticTokenColors: Record<string,string>}}
 */
export function buildTokenColors(m) {
  const dark = isDarkTheme(m)
  const shift = (hex) => adjustL(hex, dark ? 0.06 : -0.06)

  const palette = {
    comment: m.mutedFg,
    keyword: shift(m.accent),
    string: shift(mix(m.warningFg, '#8FBF6F', 0.55)),
    number: shift(m.warningFg),
    type: shift(mix(m.accent, '#E06C9F', 0.55)),
    func: shift(mix(m.accent, '#56B6C2', 0.55)),
    variable: m.editorFg,
    tag: shift(m.accent),
    attribute: shift(m.warningFg),
    invalid: m.errorFg,
  }

  const rule = (scope, color, fontStyle) => ({
    scope,
    settings: fontStyle ? { foreground: color, fontStyle } : { foreground: color },
  })

  const tokenColors = [
    rule('comment', palette.comment, 'italic'),
    rule(['keyword', 'storage'], palette.keyword),
    rule('string', palette.string),
    rule(['constant.numeric', 'constant.language'], palette.number),
    rule(['entity.name.type', 'support.type', 'support.class'], palette.type),
    rule(['entity.name.function', 'support.function'], palette.func),
    rule('variable', palette.variable),
    rule('entity.name.tag', palette.tag),
    rule('entity.other.attribute-name', palette.attribute),
    rule('markup.heading', palette.keyword),
    rule('invalid', palette.invalid),
  ]

  const semanticTokenColors = {
    class: palette.type,
    interface: palette.type,
    enum: palette.type,
    type: palette.type,
    function: palette.func,
    method: palette.func,
    parameter: palette.variable,
    property: palette.variable,
    variable: palette.variable,
  }

  return { palette, tokenColors, semanticTokenColors }
}

/** Assemble the colour-theme JSON (the file inside `themes/`). */
export function buildVscodeThemeJson({ name, type = DEFAULT_VSCODE_TYPE, colors }) {
  const master = buildMasterColors(colors)
  const { tokenColors, semanticTokenColors } = buildTokenColors(master)
  return {
    name,
    type,
    colors: buildVscodeColors(master),
    semanticHighlighting: true,
    semanticTokenColors,
    tokenColors,
  }
}

/** Which package.json `uiTheme` matches a theme `type`. */
export function uiThemeFor(type) {
  return VSCODE_TYPES.find((entry) => entry.id === type)?.uiTheme ?? 'vs-dark'
}

/**
 * Build the full extension package.
 *
 * @param {object} options
 * @param {string} options.name  Display name, written verbatim.
 * @param {string} [options.folderName]  User's folder-name field; falls back to
 *   a slug of `name`.
 * @param {string} [options.type]  'dark' | 'light' | 'hc-black'
 * @param {Record<string,string>} options.colors  Master colours.
 * @returns {{files:{path:string,data:string}[], folderName:string, zipName:string,
 *   themeJson:string, colorCount:number, tokenColorCount:number}}
 */
export function buildVscodePackage({ name, folderName: explicitFolderName, type = DEFAULT_VSCODE_TYPE, colors }) {
  const master = buildMasterColors(colors)
  const themeJson = buildVscodeThemeJson({ name, type, colors: master })

  const typedFolderName = typeof explicitFolderName === 'string' ? toSafeName(explicitFolderName) : ''
  const folderName = (typedFolderName || toThemeFolderName(name)).toLowerCase()
  const themeFileName = `${folderName}-color-theme.json`
  const isDark = type !== 'light'

  const pkg = {
    name: folderName,
    displayName: name,
    description: `${name} color theme for VS Code, generated with ThemeBake.`,
    version: '1.0.0',
    publisher: 'themebake',
    engines: { vscode: '^1.80.0' },
    categories: ['Themes'],
    galleryBanner: {
      color: master.sidebarBg,
      theme: isDark ? 'dark' : 'light',
    },
    keywords: ['theme', 'color-theme', 'vscode-theme'],
    contributes: {
      themes: [
        {
          label: name,
          uiTheme: uiThemeFor(type),
          path: `./themes/${themeFileName}`,
        },
      ],
    },
    license: 'MIT',
  }

  const readme = [
    `# ${name}`,
    '',
    `A VS Code color theme generated with [ThemeBake](https://themebake.pages.dev).`,
    '',
    '## Install',
    '',
    '1. Copy this folder into your extensions directory (`%USERPROFILE%\\.vscode\\extensions`).',
    '2. Restart VS Code.',
    `3. Open the theme picker (\`Ctrl+K Ctrl+T\`) and choose **${name}**.`,
    '',
  ].join('\n')

  const files = [
    { path: 'package.json', data: `${JSON.stringify(pkg, null, 2)}\n` },
    { path: `themes/${themeFileName}`, data: `${JSON.stringify(themeJson, null, 2)}\n` },
    { path: 'README.md', data: `${readme}\n` },
    { path: '.vscodeignore', data: '.vscode/**\n.gitignore\n' },
  ]

  return {
    files,
    folderName,
    zipName: `${folderName}.zip`,
    themeJson: themeJson ? `${JSON.stringify(themeJson, null, 2)}\n` : '',
    colorCount: Object.keys(themeJson.colors).length,
    tokenColorCount: themeJson.tokenColors.length,
  }
}

/**
 * Map a solved chrome-keyed palette (the smart studio / randomiser / palette
 * import all speak this dialect) onto the 14 VS Code master fields, so the
 * studio and importer work in both workbenches.
 */
export function masterFromPalette(solved) {
  const frame = solved.frame
  const dark = relativeLuminance(frame) < 0.5
  const bg = dark ? mix(frame, '#131120', 0.74) : mix(frame, '#FFFFFF', 0.88)
  const surface = dark ? mix(bg, '#FFFFFF', 0.05) : mix(bg, '#000000', 0.04)
  const surface2 = dark ? mix(bg, '#FFFFFF', 0.09) : mix(bg, '#000000', 0.07)
  const accent = solved.ntpLink

  return {
    editorBg: bg,
    editorFg: dark ? mix(solved.tabText, '#FFFFFF', 0.5) : solved.tabText,
    accent,
    selectionBg: mix(accent, bg, 0.72),
    lineHighlightBg: surface,
    mutedFg: mix(solved.tabBackgroundText, bg, 0.2),
    activityBg: dark ? mix(bg, '#000000', 0.25) : mix(bg, '#000000', 0.06),
    sidebarBg: surface,
    titleBg: surface2,
    border: dark ? mix(bg, '#FFFFFF', 0.12) : mix(bg, '#000000', 0.12),
    buttonBg: accent,
    buttonFg: readableTextOn(accent),
    errorFg: mix('#E06C75', accent, 0.12),
    warningFg: mix('#E5C07B', accent, 0.18),
  }
}
