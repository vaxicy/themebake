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

import {
  adjustL,
  clamp,
  contrastRatio,
  hexToHsl,
  hslToHex,
  mix,
  parseHex,
  readableTextOn,
  relativeLuminance,
} from '../utils/color.js'
import { toSafeName } from '../utils/slug.js'
import { toThemeFolderName } from '../utils/package.js'
import {
  DEFAULT_VSCODE_COLORS,
  DEFAULT_VSCODE_TYPE,
  VSCODE_FIELD_IDS,
  VSCODE_TYPES,
  buildOverrides,
} from './fields.js'

/** Attach an alpha byte: `#RRGGBB` + `'99'` -> `#RRGGBB99` (VS Code hex8). */
function fade(hex, alpha) {
  return `${hex}${alpha}`.toUpperCase()
}

/** Is the master palette a dark scheme? Drives a handful of derivations. */
export function isDarkTheme(colors) {
  return relativeLuminance(colors.editorBg) < 0.4
}

/**
 * Which scheme a palette actually *is*, read off its editor background.
 *
 * Never trust the declared `type` for this: a palette solved from a light seed
 * while the selector still said "dark" is a real state (the studio sets both,
 * but a restored draft or a hand-edited colour can desync them), and the derived
 * workbench keys follow the colours, not the label.
 *
 * @param {Record<string,string>} colors master colours
 * @returns {'dark'|'light'}
 */
export function schemeOf(colors) {
  return isDarkTheme(buildMasterColors(colors)) ? 'dark' : 'light'
}

/**
 * The opposite scheme of a theme type, or `null` when there is none.
 * High contrast is deliberately excluded: `hc-black` is its own rendering mode,
 * not one half of a light/dark pair.
 * @param {string} type
 * @returns {'dark'|'light'|null}
 */
export function counterpartTypeFor(type) {
  if (type === 'dark') return 'light'
  if (type === 'light') return 'dark'
  return null
}

/**
 * The type a theme must actually be *written* as.
 *
 * ---------------------------------------------------------------------------
 * WHY THE PALETTE WINS
 * ---------------------------------------------------------------------------
 * Dark and light are not a preference here, they are a property of the colours:
 * VS Code uses `type` to decide which of its own UI assumptions apply, so a
 * theme that says `light` while its editor background is near-black renders
 * wrong. Letting a user pick the label freely therefore produces a broken theme
 * whenever the two disagree — and they disagree in practice, because the
 * palette arrives from a seed, a preset, an import or a hand-edited hex field,
 * none of which consult a selector.
 *
 * So the palette decides, and only high contrast stays a manual choice: it is a
 * rendering *mode* (`hc-black`), not a scheme, and its palette is deliberately
 * pushed to the extremes rather than being light or dark.
 *
 * @param {string} declaredType the selector's value
 * @param {Record<string,string>} colors master colours
 * @returns {'dark'|'light'|'hc-black'}
 */
export function resolveType(declaredType, colors) {
  return declaredType === 'hc-black' ? 'hc-black' : schemeOf(colors)
}

/**
 * Push a colour's lightness until it clears `min` contrast against a background.
 *
 * Only lightness moves — hue and saturation are what make the colour *that*
 * colour, and a hue-preserving nudge is what keeps a derived light theme looking
 * like a sibling of its dark original instead of a different theme.
 *
 * **Both directions are tried.** Guessing the direction from the background's
 * luminance is right in the easy cases and wrong exactly where it matters: a
 * surface at luminance 0.5 is a dead zone where only a *very* dark foreground
 * clears 4.5:1, so the old "background is dark, lighten the text" rule walked the
 * wrong way, ran out of headroom and gave up on a readable answer. The direction
 * that reaches the bar in fewer steps wins; when neither does, the extreme of the
 * side with more contrast is used.
 */
function contrastAgainst(hex, background, min = 4.5) {
  if (contrastRatio(hex, background) >= min) return hex

  const hsl = hexToHsl(hex)
  const attempts = []
  for (const up of [true, false]) {
    for (let step = 1; step <= 60; step += 1) {
      const l = clamp(hsl.l + (up ? step : -step) * 1.4, 0, 100)
      const candidate = hslToHex({ ...hsl, l })
      attempts.push({ color: candidate, ratio: contrastRatio(candidate, background), steps: step })
      if (l <= 0 || l >= 100) break
    }
  }

  const passing = attempts.filter((attempt) => attempt.ratio >= min)
  if (passing.length) {
    passing.sort((a, b) => a.steps - b.steps)
    return passing[0].color
  }

  const best = attempts.reduce((a, b) => (b.ratio > a.ratio ? b : a))
  return best.ratio > contrastRatio(hex, background) ? best.color : hex
}

/**
 * Flip a master palette into the opposite scheme.
 *
 * The surfaces are rebuilt from the *accent's hue* rather than from the original
 * surfaces' colours: a dark scheme's near-black editor background carries almost
 * no hue information, so inverting its lightness would produce a washed-out grey
 * light theme. Starting from the accent instead gives a surface that is tinted by
 * the theme's own colour — and the accent/error/warning colours are then re-anchored
 * so they still read on the new background at 4.5:1.
 *
 * @param {Record<string,string>} colors master colours (any scheme)
 * @param {'dark'|'light'} [targetType] defaults to the opposite of `colors`
 * @returns {Record<string,string>} a complete master record for `targetType`
 */
export function deriveCounterpart(colors, targetType) {
  const source = buildMasterColors(colors)
  const target = targetType ?? counterpartTypeFor(schemeOf(source))
  if (target !== 'dark' && target !== 'light') return source

  const dark = target === 'dark'
  const accentHsl = hexToHsl(source.accent)

  // Only a whisper of the accent's saturation goes into the surfaces, so the
  // accent itself stays the loudest colour on screen.
  const bg = hslToHex({ h: accentHsl.h, s: Math.min(accentHsl.s, dark ? 24 : 28), l: dark ? 13 : 97 })
  const fg = hslToHex({ h: accentHsl.h, s: Math.min(accentHsl.s, 24), l: dark ? 93 : 16 })
  const accent = contrastAgainst(source.accent, bg)

  /** A surface one step away from `bg`, in the direction that adds depth. */
  const step = (t) => mix(bg, dark ? '#FFFFFF' : '#000000', t)

  return {
    editorBg: bg,
    editorFg: fg,
    accent,
    selectionBg: mix(accent, bg, 0.72),
    // Tinted with the text colour, not with a fixed lightness step, so the
    // current line reads as a highlight in both schemes.
    lineHighlightBg: mix(bg, fg, dark ? 0.07 : 0.06),
    mutedFg: mix(fg, bg, 0.42),
    activityBg: dark ? mix(bg, '#000000', 0.25) : mix(bg, '#000000', 0.05),
    sidebarBg: step(0.05),
    titleBg: step(0.09),
    border: step(0.12),
    buttonBg: accent,
    buttonFg: readableTextOn(accent),
    errorFg: contrastAgainst(source.errorFg, bg),
    warningFg: contrastAgainst(source.warningFg, bg),
  }
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
export function buildVscodeColors(m, overrides = {}) {
  const dark = isDarkTheme(m)
  const onAccent = readableTextOn(m.accent)
  const hoverSurface = mix(m.titleBg, m.editorBg, 0.5)
  const findMatch = mix(m.selectionBg, m.accent, 0.45)

  /**
   * An overridden surface, or the master field it inherits from.
   *
   * Only the six regions in `VSCODE_OVERRIDE_FIELDS` can be pinned; every other
   * key keeps following the master palette, so the "90 keys from 14" promise is
   * intact and an override is a deliberate, narrow exception.
   */
  const pick = (id, fallback) => (typeof overrides[id] === 'string' ? overrides[id] : fallback)

  /**
   * Text for a surface: the palette's own ink when it still clears 4.5:1 on the
   * new colour, Chrome's white/near-black fallback when it does not.
   *
   * Overriding a surface is how a user says "this strip is a different colour";
   * it is not how they say "and let the labels disappear". A light panel on a
   * dark theme would otherwise keep the theme's light text and be unreadable.
   */
  const inkOn = (background, preferred) =>
    contrastRatio(preferred, background) >= 4.5 ? preferred : readableTextOn(background)

  const panelBg = pick('panelBg', m.sidebarBg)
  const statusBarBg = pick('statusBarBg', m.sidebarBg)
  const inactiveTabBg = pick('inactiveTabBg', m.titleBg)
  const widgetBg = pick('widgetBg', m.sidebarBg)
  const lineNumberFg = pick('lineNumberFg', m.mutedFg)
  const indentGuideFg = pick('indentGuideFg', fade(m.border, '66'))

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
    'editorLineNumber.foreground': lineNumberFg,
    'editorLineNumber.activeForeground': m.accent,
    'editorIndentGuide.background1': indentGuideFg,
    'editorIndentGuide.activeBackground1': m.mutedFg,
    'editorWhitespace.foreground': indentGuideFg,
    'editor.findMatchBackground': findMatch,
    'editor.findMatchHighlightBackground': fade(findMatch, '77'),
    'editorBracketMatch.border': m.accent,
    'editorBracketMatch.background': m.selectionBg,

    'tab.activeBackground': m.editorBg,
    'tab.activeForeground': m.editorFg,
    'tab.activeBorderTop': m.accent,
    'tab.inactiveBackground': inactiveTabBg,
    'tab.inactiveForeground': inkOn(inactiveTabBg, m.mutedFg),
    'tab.border': m.border,
    'editorGroupHeader.tabsBackground': inactiveTabBg,

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
    'panel.background': panelBg,
    'panel.foreground': inkOn(panelBg, m.editorFg),
    'panel.border': m.border,

    'statusBar.background': statusBarBg,
    'statusBar.foreground': inkOn(statusBarBg, m.editorFg),
    'statusBar.debuggingBackground': m.accent,
    'statusBar.debuggingForeground': onAccent,
    'statusBar.noFolderBackground': statusBarBg,
    'statusBar.noFolderForeground': inkOn(statusBarBg, m.editorFg),

    'titleBar.activeBackground': m.titleBg,
    'titleBar.activeForeground': m.editorFg,
    'titleBar.inactiveBackground': m.editorBg,
    'titleBar.inactiveForeground': m.mutedFg,

    'input.background': widgetBg,
    'input.foreground': inkOn(widgetBg, m.editorFg),
    'input.border': m.border,
    'input.placeholderForeground': m.mutedFg,
    'dropdown.background': widgetBg,
    'dropdown.foreground': inkOn(widgetBg, m.editorFg),
    'dropdown.border': m.border,

    'editorWidget.background': widgetBg,
    'editorWidget.foreground': inkOn(widgetBg, m.editorFg),
    'editorWidget.border': m.border,
    'editorHoverWidget.background': widgetBg,
    'editorHoverWidget.foreground': inkOn(widgetBg, m.editorFg),
    'editorHoverWidget.border': m.border,
    'editorSuggestWidget.background': widgetBg,
    'editorSuggestWidget.foreground': inkOn(widgetBg, m.editorFg),
    'editorSuggestWidget.border': m.border,
    'editorSuggestWidget.selectedBackground': m.selectionBg,
    'notifications.background': widgetBg,
    'notifications.foreground': inkOn(widgetBg, m.editorFg),
    'notifications.border': m.border,
    'quickInput.background': widgetBg,
    'quickInput.foreground': inkOn(widgetBg, m.editorFg),

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
export function buildVscodeThemeJson({ name, type = DEFAULT_VSCODE_TYPE, colors, overrides = {} }) {
  const master = buildMasterColors(colors)
  const { tokenColors, semanticTokenColors } = buildTokenColors(master)
  return {
    name,
    // Normalised here, at the single point every theme JSON is created, so no
    // caller can emit a theme whose `type` contradicts its own colours.
    type: resolveType(type, master),
    colors: buildVscodeColors(master, buildOverrides(overrides)),
    semanticHighlighting: true,
    semanticTokenColors,
    tokenColors,
  }
}

/** Which package.json `uiTheme` matches a theme `type`. */
export function uiThemeFor(type) {
  return VSCODE_TYPES.find((entry) => entry.id === type)?.uiTheme ?? 'vs-dark'
}

/** Label suffix used when a package ships both schemes, per house convention. */
const SCHEME_LABEL = { light: 'Light', dark: 'Dark' }

/** Version of every generated extension. Bumped only on the user's say-so. */
export const VSCODE_EXTENSION_VERSION = '1.0.0'

/** Publisher id written into package.json and the VSIX identity. */
const PUBLISHER = 'themebake'

/** Minimal XML escaping — the values come from user text, so this is not optional. */
function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * The two OPC metadata files a `.vsix` needs.
 *
 * A `.vsix` is a zip, but not one VS Code will install by accident: the root must
 * carry `extension.vsixmanifest` (which points at the real `package.json` through
 * its `Microsoft.VisualStudio.Code.Manifest` asset) plus `[Content_Types].xml`,
 * and the extension itself lives under `extension/`. The layout is copied from a
 * `vsce`-produced bundle, so `code --install-extension` and the Extensions view
 * both accept it without complaint.
 *
 * @param {object} options
 * @param {object} options.pkg the generated package.json contents
 * @param {string} options.displayName
 * @param {string} options.folderName
 */
function buildVsixMetadata({ pkg, displayName, folderName }) {
  const tags = [...pkg.keywords, '__web_extension'].map(xmlEscape).join(',')

  const manifest = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">',
    '  <Metadata>',
    `    <Identity Language="en-US" Id="${xmlEscape(folderName)}" Version="${xmlEscape(pkg.version)}" Publisher="${xmlEscape(pkg.publisher)}" />`,
    `    <DisplayName>${xmlEscape(displayName)}</DisplayName>`,
    `    <Description xml:space="preserve">${xmlEscape(pkg.description)}</Description>`,
    `    <Tags>${tags}</Tags>`,
    `    <Categories>${pkg.categories.map(xmlEscape).join(',')}</Categories>`,
    '    <GalleryFlags>Public</GalleryFlags>',
    '    <Properties>',
    `      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="${xmlEscape(pkg.engines.vscode)}" />`,
    '      <Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="ui,workspace" />',
    `      <Property Id="Microsoft.VisualStudio.Services.Branding.Color" Value="${xmlEscape(pkg.galleryBanner.color)}" />`,
    `      <Property Id="Microsoft.VisualStudio.Services.Branding.Theme" Value="${xmlEscape(pkg.galleryBanner.theme)}" />`,
    '    </Properties>',
    '  </Metadata>',
    '  <Installation>',
    '    <InstallationTarget Id="Microsoft.VisualStudio.Code"/>',
    '  </Installation>',
    '  <Dependencies/>',
    '  <Assets>',
    '    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />',
    '    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true" />',
    '  </Assets>',
    '</PackageManifest>',
    '',
  ].join('\n')

  const contentTypes = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension=".json" ContentType="application/json"/><Default Extension=".md" ContentType="text/markdown"/><Default Extension=".vsixmanifest" ContentType="text/xml"/></Types>',
    '',
  ].join('\n')

  return { manifest, contentTypes }
}

/**
 * Build the full extension package.
 *
 * Passing `counterpart` declares **two** themes in one extension (light + dark),
 * which is the house convention of the hand-made reference themes: files named
 * `<slug>-{light,dark}-color-theme.json`, labels `"<Name> Light"` / `"<Name>
 * Dark"`, light listed first so the picker reads consistently across families.
 *
 * `format` decides which *hand-over* the returned file list describes, not what
 * the theme contains:
 *   - `'zip'` / `'folder'` — the extension itself, with `package.json` at the root
 *     (what `Load unpacked` / copying into `extensions/` wants).
 *   - `'vsix'` — the same extension wrapped the way VS Code installs it: metadata
 *     at the archive root, the extension under `extension/`.
 *
 * @param {object} options
 * @param {string} options.name  Display name, written verbatim.
 * @param {string} [options.folderName]  User's folder-name field; falls back to
 *   a slug of `name`.
 * @param {string} [options.type]  'dark' | 'light' | 'hc-black'
 * @param {Record<string,string>} options.colors  Master colours of the edited scheme.
 * @param {{type:string, colors:Record<string,string>}|null} [options.counterpart]
 *   The other scheme (`deriveCounterpart`). Ignored for `hc-black`, which is a
 *   rendering mode of its own rather than one half of a pair.
 * @param {Record<string,string>} [options.overrides]  Pinned regions
 *   (`VSCODE_OVERRIDE_FIELDS`). They apply to the edited palette only; the
 *   derived half of a pair inherits from its own colours.
 * @param {'zip'|'folder'|'vsix'} [options.format]  Which hand-over to lay out for.
 * @returns {{files:{path:string,data:string}[], folderName:string, zipName:string,
 *   vsixName:string, fileName:string, format:string,
 *   themeJson:string, colorCount:number, tokenColorCount:number,
 *   themeCount:number, themes:{label:string,uiTheme:string,path:string}[]}}
 */
export function buildVscodePackage({
  name,
  folderName: explicitFolderName,
  type = DEFAULT_VSCODE_TYPE,
  colors,
  counterpart = null,
  overrides = {},
  format = 'zip',
}) {
  const master = buildMasterColors(colors)
  const pinned = buildOverrides(overrides)
  const typedFolderName = typeof explicitFolderName === 'string' ? toSafeName(explicitFolderName) : ''
  const folderName = (typedFolderName || toThemeFolderName(name)).toLowerCase()
  // The declared type decides only *whether* a pair is possible; which side each
  // palette is comes from the palettes themselves (`schemeOf`), so a stale label
  // can never put a dark JSON under the Light contribution.
  const declaredType = resolveType(type, master)
  const paired = Boolean(counterpart) && counterpartTypeFor(declaredType) !== null

  /**
   * One contributed theme: its JSON payload plus the package.json entry.
   *
   * `isPrimary` decides whether the pinned regions apply. An override is an
   * absolute colour chosen against *this* palette — a pale panel picked for a
   * light theme would be wrong on the derived dark one — so the derived theme
   * inherits from its own master colours instead.
   */
  const makeTheme = (label, themeType, themeColors, fileName, isPrimary = true) => {
    const json = buildVscodeThemeJson({
      name: label,
      type: themeType,
      colors: themeColors,
      overrides: isPrimary ? pinned : {},
    })
    return {
      label,
      json,
      file: { path: `themes/${fileName}`, data: `${JSON.stringify(json, null, 2)}\n` },
      contribution: { label, uiTheme: uiThemeFor(themeType), path: `./themes/${fileName}` },
    }
  }

  let themes
  if (paired) {
    const other = buildMasterColors(counterpart.colors)
    const masterIsLight = schemeOf(master) === 'light'
    // Light first, then dark — the order the reference families use.
    themes = ['light', 'dark'].map((scheme) => {
      const isPrimary = (scheme === 'light') === masterIsLight
      return makeTheme(
        `${name} ${SCHEME_LABEL[scheme]}`,
        scheme,
        isPrimary ? master : other,
        `${folderName}-${scheme}-color-theme.json`,
        isPrimary,
      )
    })
  } else {
    themes = [makeTheme(name, declaredType, master, `${folderName}-color-theme.json`)]
  }

  // The marketplace banner sits behind the logo, so take the light side of a
  // pair (matching the reference families) and otherwise whatever was edited.
  const bannerColors = paired
    ? buildMasterColors(schemeOf(master) === 'light' ? master : counterpart.colors)
    : master

  const pkg = {
    name: folderName,
    displayName: name,
    description: `${name} color theme for VS Code, generated with ThemeBake.`,
    version: VSCODE_EXTENSION_VERSION,
    publisher: PUBLISHER,
    engines: { vscode: '^1.80.0' },
    categories: ['Themes'],
    galleryBanner: {
      color: bannerColors.sidebarBg,
      theme: schemeOf(bannerColors),
    },
    keywords: [
      'theme',
      'color-theme',
      'vscode-theme',
      ...(paired ? ['light-theme', 'dark-theme'] : []),
    ],
    contributes: { themes: themes.map((theme) => theme.contribution) },
    license: 'MIT',
  }

  const themeNames = themes.map((theme) => `**${theme.label}**`).join(' or ')
  const vsixName = `${folderName}-${pkg.version}.vsix`

  const readme = [
    `# ${name}`,
    '',
    'A VS Code color theme generated with [ThemeBake](https://themebake.pages.dev).',
    '',
    ...(paired
      ? [`Includes ${themes.length} themes: ${themes.map((theme) => `**${theme.label}**`).join(' and ')}.`, '']
      : []),
    '## Install',
    '',
    // The instructions match the artefact the user actually holds: telling someone
    // with a .vsix to copy a folder is how a theme ends up never installed.
    ...(format === 'vsix'
      ? [
          '1. In VS Code, open **Extensions**, use the `…` menu → **Install from VSIX…** and pick this file.',
          `2. Or from a terminal: \`code --install-extension ${vsixName}\`.`,
          `3. Open the theme picker (\`Ctrl+K Ctrl+T\`) and choose ${themeNames}.`,
        ]
      : [
          '1. Copy this folder into your extensions directory (`%USERPROFILE%\\.vscode\\extensions`).',
          '2. Restart VS Code.',
          `3. Open the theme picker (\`Ctrl+K Ctrl+T\`) and choose ${themeNames}.`,
        ]),
    '',
  ].join('\n')

  const primary = themes[0]

  const extensionFiles = [
    { path: 'package.json', data: `${JSON.stringify(pkg, null, 2)}\n` },
    ...themes.map((theme) => theme.file),
    { path: 'README.md', data: `${readme}\n` },
    { path: '.vscodeignore', data: '.vscode/**\n.gitignore\n' },
  ]

  // A `.vsix` keeps the extension in a subfolder and adds the OPC metadata the
  // installer reads first. `createZip` is called with no wrapping folder for it,
  // because these paths are already absolute within the archive.
  const vsix = buildVsixMetadata({ pkg, displayName: name, folderName })
  const files =
    format === 'vsix'
      ? [
          { path: 'extension.vsixmanifest', data: vsix.manifest },
          { path: '[Content_Types].xml', data: vsix.contentTypes },
          ...extensionFiles.map((file) => ({ ...file, path: `extension/${file.path}` })),
        ]
      : extensionFiles

  return {
    files,
    format,
    folderName,
    zipName: `${folderName}.zip`,
    vsixName,
    /** Whatever the chosen format downloads as (folder output ignores it). */
    fileName: format === 'vsix' ? vsixName : `${folderName}.zip`,
    themeJson: primary.json ? `${JSON.stringify(primary.json, null, 2)}\n` : '',
    colorCount: Object.keys(primary.json.colors).length,
    tokenColorCount: primary.json.tokenColors.length,
    themeCount: themes.length,
    themes: themes.map((theme) => theme.contribution),
  }
}

/**
 * Map a solved chrome-keyed palette (the smart studio / randomiser / palette
 * import all speak this dialect) onto the 14 VS Code master fields, so the
 * studio and importer work in both workbenches.
 */
export function masterFromPalette(solved) {
  const frame = solved.frame
  /**
   * Light or dark, decided by the palette's own ink.
   *
   * A luminance threshold on the *frame* is the wrong question and the wrong
   * answer in the middle of the range: the solver's light theme built on
   * `#D48ACA` has a frame of luminance 0.36, so a `< 0.5` test called it dark and
   * produced a near-black editor carrying that theme's dark ink — 3.85:1, an
   * unreadable VS Code theme from a perfectly good Chrome palette. The ink is
   * what actually has to sit on the surface, so compare the two: if the text is
   * lighter than the frame, this is a dark palette.
   */
  const ink = solved.tabText ?? solved.ntpText
  const dark = ink ? relativeLuminance(ink) > relativeLuminance(frame) : relativeLuminance(frame) < 0.5

  /**
   * How much of the frame survives into the editor surface.
   *
   * Fixed amounts here were the last place every randomise collapsed into the
   * same theme: a light palette always produced a near-white editor (l≈96) and a
   * dark one a near-black (l≈12), whatever the palette's own colour was, so the
   * workbench never looked different even when the hue did. The amount now
   * follows the frame's own chroma — a saturated frame keeps its tint in the
   * surface, a near-grey one stays close to paper — which is how the hand-made
   * themes read: a matcha theme's editor is warm off-white, not white.
   */
  const frameChroma = (() => {
    const { r, g, b } = parseHex(frame)
    return (Math.max(r, g, b) - Math.min(r, g, b)) / 255
  })()
  const bgMix = dark
    ? clamp(0.86 - frameChroma * 1.5, 0.45, 0.88)
    : clamp(0.95 - frameChroma * 2.2, 0.62, 0.95)

  /**
   * Keep the editor surface on the correct side of the luminance range.
   *
   * A vivid frame (a saturated red, say) at 62% white still lands near luminance
   * 0.5 — the dead zone where nothing but near-black text is readable, so the
   * theme is neither a light one nor a dark one and every accent measured against
   * it fails. The surface is pushed from a bad place rather than clamped, so the
   * palette's own tint survives.
   */
  const confineBg = (hex, isDark) => {
    let out = hex
    for (let step = 0; step < 24; step += 1) {
      const luminance = relativeLuminance(out)
      if (isDark ? luminance <= 0.18 : luminance >= 0.6) break
      out = mix(out, isDark ? '#000000' : '#FFFFFF', 0.06)
    }
    return out
  }
  const bg = confineBg(dark ? mix(frame, '#131120', bgMix) : mix(frame, '#FFFFFF', bgMix), dark)
  const surface = dark ? mix(bg, '#FFFFFF', 0.05) : mix(bg, '#000000', 0.04)
  const surface2 = dark ? mix(bg, '#FFFFFF', 0.09) : mix(bg, '#000000', 0.07)

  /**
   * The accent, re-checked against the surface it is about to sit on.
   *
   * Chrome only requires the link colour to clear 3:1 on the New Tab background —
   * it is an interactive element, not body text — and the solver stops there. In
   * VS Code the same value becomes link text, cursors and focus borders on the
   * *editor* surface, where 4.5:1 is the bar. A cyan accent that passed at 3.02
   * there measured 2.89 here, so it gets nudged again rather than exported
   * unreadable.
   */
  const accent = contrastAgainst(solved.ntpLink ?? frame, bg)

  /**
   * A trace of the accent in the shell surfaces.
   *
   * The studio can deliberately place the accent on the opposite hue (see
   * `ACCENT_STRATEGIES`), and the user's own palette may hold one. Letting a few
   * percent of it into the panels — never the editor, which stays the reading
   * surface — is what makes the result read as one designed theme instead of a
   * monochrome workbench with a stray coloured link.
   */
  const shell = (base, amount) => mix(base, accent, amount)

  /**
   * Buttons: the solver's own button colour when it carries a hue of its own.
   *
   * In a triadic theme the window buttons were given the *third* corner of the
   * wheel; collapsing them onto the accent here would throw that away and leave
   * the VS Code workbench with two hues where the Chrome one has three. A
   * near-grey button surface is the one case where the accent is the better
   * answer — a tinted button with no tint reads as a bug.
   */
  const solvedButton = solved.buttonBackground ?? accent
  const buttonBg = hexToHsl(solvedButton).s >= 18 ? solvedButton : accent

  return {
    editorBg: bg,
    editorFg: dark ? mix(solved.tabText, '#FFFFFF', 0.5) : solved.tabText,
    accent,
    selectionBg: mix(accent, bg, 0.72),
    lineHighlightBg: surface,
    mutedFg: mix(solved.tabBackgroundText, bg, 0.2),
    activityBg: shell(dark ? mix(bg, '#000000', 0.25) : mix(bg, '#000000', 0.06), 0.05),
    sidebarBg: shell(surface, 0.04),
    titleBg: shell(surface2, 0.06),
    border: dark ? mix(bg, '#FFFFFF', 0.12) : mix(bg, '#000000', 0.12),
    buttonBg,
    buttonFg: readableTextOn(buttonBg),
    // Nudged onto the new surface: the semantic colours come from the solver, but
    // nothing upstream guarantees they clear 4.5:1 against an editor background
    // this function just invented.
    errorFg: contrastAgainst(mix('#E06C75', accent, 0.12), bg),
    warningFg: contrastAgainst(mix('#E5C07B', accent, 0.18), bg),
  }
}
