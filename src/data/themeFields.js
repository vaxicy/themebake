/**
 * ============================================================================
 *  THEME FIELD MAP  —  single source of truth
 * ============================================================================
 *
 *  This file is the ONLY place where a UI control is translated into a Chrome
 *  theme manifest key. If Chrome changes its theme schema, fix it here and
 *  nothing else needs to change.
 *
 *  ---------------------------------------------------------------------------
 *  PROVENANCE / HOW THESE KEYS WERE VERIFIED (do not guess — re-verify here)
 *  ---------------------------------------------------------------------------
 *  Authority #1 — the key NAME table, in
 *    chrome/browser/themes/browser_theme_pack.cc
 *      StringToIdTable<TP::OverwritableByUserThemeProperty> kOverwritableColorTable[]
 *  This is the only place Chrome maps a manifest key string onto an internal
 *  colour id. A key that is absent here is accepted by the manifest parser but
 *  never read — a "dead key". The table currently holds exactly 24 entries
 *  (kThemePackVersion = 106):
 *    background_tab, background_tab_inactive, background_tab_incognito,
 *    background_tab_incognito_inactive, bookmark_text, button_background,
 *    frame, frame_inactive, frame_incognito, frame_incognito_inactive,
 *    ntp_background, ntp_header, ntp_link, ntp_text, omnibox_background,
 *    omnibox_text, tab_background_text, tab_background_text_inactive,
 *    tab_background_text_incognito, tab_background_text_incognito_inactive,
 *    tab_text, toolbar, toolbar_button_icon, toolbar_text
 *  NOTE: `toolbar_text` IS a real Chrome key -> TP::COLOR_TOOLBAR_TEXT. An
 *  earlier revision of this file wrongly listed it as a Firefox-only alias for
 *  `bookmark_text`. Both exist and mean different things; never conflate them.
 *
 *  Authority #2 — the manifest PARSER, in
 *    chrome/common/extensions/manifest_handlers/theme_handler.cc
 *      bool LoadColors(...)
 *  It validates exactly three things per entry, and nothing else:
 *    1. `value.is_list()`                          — a JSON string is REJECTED
 *    2. `size() == 3 || size() == 4`               — RGB or RGBA
 *    3. the first three items are ints
 *  Consequences that shape this whole module:
 *    - Key names are NEVER compared against any table, so unknown keys are
 *      silently accepted. Chrome neither errors nor warns.
 *    - A hex string value fails check 1 and aborts the WHOLE theme with
 *      kInvalidThemeColors. Hence `COLOR_FORMATS.hex` cannot target Chrome.
 *    - Value ranges are never checked, so out-of-range RGB never fails either.
 *    - `tints` is validated separately: every entry must be a list of exactly
 *      3 doubles, again with no key-name check.
 *  Refs: https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/themes/browser_theme_pack.cc
 *        https://chromium.googlesource.com/chromium/src/+/main/chrome/common/extensions/manifest_handlers/theme_handler.cc
 *
 *  ---------------------------------------------------------------------------
 *  KEYS DELIBERATELY **NOT** USED (and why)
 *  ---------------------------------------------------------------------------
 *  - `ntp_section`, `ntp_link_underline`, `control_background`,
 *    `button_background_hover`, `button_background_secondary`,
 *    `omnibox_border`, `omnibox_focused_border`, `omnibox_background_hover`,
 *    `omnibox_selected_keyword`, `tab_line`, `tab_background_color`,
 *    `toolbar_*_separator`, `toolbar_button_icon_hover|_inactive|_pressed`
 *                        Absent from kOverwritableColorTable. Verified against
 *                        real third-party themes (21 hand-built ones were
 *                        scanned: 17 of the 35 keys they use are these dead
 *                        ones). Writing them changes nothing.
 *  - `theme.images`      Out of scope: ThemeBake emits colour-only themes. The
 *                        generated folder is manifest.json only — no background
 *                        images and, by default since the icon was dropped, no
 *                        icon.png either (Chrome never displays a theme icon;
 *                        `buildThemePackage` can still write one if ever asked).
 *
 *  ---------------------------------------------------------------------------
 *  KNOWN AMBIGUITY (flagged on purpose, see notes on the field below)
 *  ---------------------------------------------------------------------------
 *  `background_tab`: third-party docs disagree on whether it colours the
 *  *active* tab or the *background* (inactive) tab. Chromium's own constant is
 *  COLOR_BACKGROUND_TAB and the key name is "background_tab", so ThemeBake
 *  treats it as the inactive-tab colour. Chrome derives the active tab's own
 *  background from `frame`, which is why the UI exposes "Active Tab Text"
 *  (`tab_text`) rather than an invented "active tab background" key.
 *  -> Re-verify against a current Chrome build before changing this assumption.
 * ============================================================================
 */

/**
 * @typedef {Object} ThemeField
 * @property {string}  id          Internal id, also the key used in theme state.
 * @property {string}  labelKey    i18n key for the human readable label.
 * @property {string}  hintKey     i18n key for the helper text under the control.
 * @property {string}  chromeKey   Exact `theme.colors` key written to manifest.json.
 * @property {string}  groupKey    i18n key for the UI group this field renders under.
 * @property {string}  role        Semantic role, drives the palette solver + preview.
 * @property {string}  [preview]   Where this colour shows up in the mockup.
 */

/**
 * Groups, in the order they should render. `key` is the i18n key; `id` is the
 * stable grouping value used by `THEME_FIELDS[].group`.
 */
export const FIELD_GROUPS = [
  { id: 'Browser chrome', key: 'settings.group.browserChrome' },
  { id: 'Address bar', key: 'settings.group.addressBar' },
  { id: 'Bookmarks', key: 'settings.group.bookmarks' },
  { id: 'New Tab Page', key: 'settings.group.newTabPage' },
]

/** @type {ThemeField[]} */
export const THEME_FIELDS = [
  // ---------------------------- Browser chrome ----------------------------
  {
    id: 'frame',
    labelKey: 'field.frame.label',
    hintKey: 'field.frame.hint',
    chromeKey: 'frame',
    group: 'Browser chrome',
    groupKey: 'settings.group.browserChrome',
    role: 'primary',
    preview: 'Tab strip background',
  },
  {
    id: 'frameInactive',
    labelKey: 'field.frameInactive.label',
    hintKey: 'field.frameInactive.hint',
    chromeKey: 'frame_inactive',
    group: 'Browser chrome',
    groupKey: 'settings.group.browserChrome',
    role: 'primaryMuted',
    preview: 'Not shown in preview',
  },
  {
    id: 'toolbar',
    labelKey: 'field.toolbar.label',
    hintKey: 'field.toolbar.hint',
    chromeKey: 'toolbar',
    group: 'Browser chrome',
    groupKey: 'settings.group.browserChrome',
    role: 'surface',
    preview: 'Toolbar background',
  },
  {
    id: 'backgroundTab',
    labelKey: 'field.backgroundTab.label',
    hintKey: 'field.backgroundTab.hint',
    chromeKey: 'background_tab',
    group: 'Browser chrome',
    groupKey: 'settings.group.browserChrome',
    role: 'surfaceAlt',
    preview: 'Inactive tab background',
  },
  {
    id: 'tabText',
    labelKey: 'field.tabText.label',
    hintKey: 'field.tabText.hint',
    chromeKey: 'tab_text',
    group: 'Browser chrome',
    groupKey: 'settings.group.browserChrome',
    role: 'onPrimary',
    preview: 'Active tab label',
  },
  {
    id: 'tabBackgroundText',
    labelKey: 'field.tabBackgroundText.label',
    hintKey: 'field.tabBackgroundText.hint',
    chromeKey: 'tab_background_text',
    group: 'Browser chrome',
    groupKey: 'settings.group.browserChrome',
    role: 'onSurfaceMuted',
    preview: 'Inactive tab labels',
  },
  {
    id: 'toolbarButtonIcon',
    labelKey: 'field.toolbarButtonIcon.label',
    hintKey: 'field.toolbarButtonIcon.hint',
    chromeKey: 'toolbar_button_icon',
    group: 'Browser chrome',
    groupKey: 'settings.group.browserChrome',
    role: 'onSurface',
    preview: 'Back / forward / reload icons',
  },
  {
    id: 'buttonBackground',
    labelKey: 'field.buttonBackground.label',
    hintKey: 'field.buttonBackground.hint',
    chromeKey: 'button_background',
    group: 'Browser chrome',
    groupKey: 'settings.group.browserChrome',
    role: 'accentSoft',
    preview: 'Window control buttons',
  },

  // ------------------------------ Address bar ------------------------------
  {
    id: 'omniboxBackground',
    labelKey: 'field.omniboxBackground.label',
    hintKey: 'field.omniboxBackground.hint',
    chromeKey: 'omnibox_background',
    group: 'Address bar',
    groupKey: 'settings.group.addressBar',
    role: 'surfaceInset',
    preview: 'Omnibox background',
  },
  {
    id: 'omniboxText',
    labelKey: 'field.omniboxText.label',
    hintKey: 'field.omniboxText.hint',
    chromeKey: 'omnibox_text',
    group: 'Address bar',
    groupKey: 'settings.group.addressBar',
    role: 'onSurface',
    preview: 'Omnibox placeholder text',
  },

  // ------------------------------ Bookmarks --------------------------------
  {
    id: 'bookmarkText',
    labelKey: 'field.bookmarkText.label',
    hintKey: 'field.bookmarkText.hint',
    chromeKey: 'bookmark_text',
    group: 'Bookmarks',
    groupKey: 'settings.group.bookmarks',
    role: 'onSurface',
    preview: 'Bookmark bar labels',
  },

  // --------------------------- New Tab Page --------------------------------
  {
    id: 'ntpBackground',
    labelKey: 'field.ntpBackground.label',
    hintKey: 'field.ntpBackground.hint',
    chromeKey: 'ntp_background',
    group: 'New Tab Page',
    groupKey: 'settings.group.newTabPage',
    role: 'page',
    preview: 'New Tab Page background',
  },
  {
    id: 'ntpText',
    labelKey: 'field.ntpText.label',
    hintKey: 'field.ntpText.hint',
    chromeKey: 'ntp_text',
    group: 'New Tab Page',
    groupKey: 'settings.group.newTabPage',
    role: 'onPage',
    preview: 'New Tab Page heading',
  },
  {
    id: 'ntpLink',
    labelKey: 'field.ntpLink.label',
    hintKey: 'field.ntpLink.hint',
    chromeKey: 'ntp_link',
    group: 'New Tab Page',
    groupKey: 'settings.group.newTabPage',
    role: 'accent',
    preview: 'New Tab Page shortcut label',
  },
]

/** Keyed lookup: `THEME_FIELDS_BY_ID.frame.chromeKey === 'frame'`. */
export const THEME_FIELDS_BY_ID = Object.fromEntries(THEME_FIELDS.map((f) => [f.id, f]))

/** Reverse lookup: Chrome manifest key -> field id. Used by the manifest importer. */
export const FIELD_ID_BY_CHROME_KEY = Object.fromEntries(
  THEME_FIELDS.map((f) => [f.chromeKey, f.id]),
)

/** All UI field ids, in display order. */
export const FIELD_IDS = THEME_FIELDS.map((f) => f.id)

/** Manifest format constants. */
export const MANIFEST_VERSION = 3
export const THEME_VERSION = '1.0.0'

/** Filename used for the generated icon, and the key that references it. */
export const ICON_FILENAME = 'icon.png'
export const ICON_SIZE = 128

/**
 * Suffix appended to the theme slug to name the unpacked folder inside the ZIP.
 *
 * **Empty on purpose (2026-09-19).** The `-theme` suffix was dropped on request, so
 * `Rose Morning` now unpacks into `rose-morning/` and downloads as `rose-morning.zip`.
 * The knob is kept rather than inlined so this convention has exactly one home, and
 * `verify.mjs` pins the empty value so the suffix cannot creep back in unnoticed.
 */
export const THEME_FOLDER_SUFFIX = ''

/**
 * Colour serialisation modes accepted by a theme manifest.
 *
 * - `rgb`:  `"frame": [177, 178, 255]`   integers 0-255 — the ONLY form Chrome
 *           accepts. See `LoadColors` in theme_handler.cc: a non-list value
 *           aborts the whole manifest with kInvalidThemeColors.
 * - `hex`:  `"frame": "#B1B2FF"`         Chromium REJECTS this. Kept because it
 *           is what Firefox / Gecko parses natively, so the option is still
 *           useful — but it is explicitly marked `chromeSafe: false` and the UI
 *           warns before the user downloads a theme Chrome cannot load.
 */
export const COLOR_FORMATS = [
  {
    id: 'rgb',
    labelKey: 'export.format.rgb',
    sample: '[177, 178, 255]',
    chromeSafe: true,
  },
  {
    id: 'hex',
    labelKey: 'export.format.hex',
    sample: '"#B1B2FF"',
    chromeSafe: false,
    noteKey: 'export.formatHexWarn',
  },
]

/**
 * Safety net: every chromeKey we emit must be in this allow-list. The manifest
 * builder refuses to write anything outside it, which makes it impossible for a
 * future refactor to silently emit a key Chrome does not understand.
 *
 * This is a verbatim copy of `kOverwritableColorTable` from
 * chrome/browser/themes/browser_theme_pack.cc — 24 entries. If Chrome adds or
 * removes a key, this set and the table must be changed together.
 */
export const CHROME_COLOR_KEY_ALLOWLIST = new Set([
  'background_tab',
  'background_tab_inactive',
  'background_tab_incognito',
  'background_tab_incognito_inactive',
  'bookmark_text',
  'button_background',
  'frame',
  'frame_inactive',
  'frame_incognito',
  'frame_incognito_inactive',
  'ntp_background',
  'ntp_header',
  'ntp_link',
  'ntp_text',
  'omnibox_background',
  'omnibox_text',
  'tab_background_text',
  'tab_background_text_inactive',
  'tab_background_text_incognito',
  'tab_background_text_incognito_inactive',
  'tab_text',
  'toolbar',
  'toolbar_button_icon',
  'toolbar_text',
])

/**
 * Key names that look plausible, appear in dozens of third-party themes, and are
 * nonetheless absent from `kOverwritableColorTable`. Kept here as an explicit
 * deny-list so the verifier can prove ThemeBake never emits one, and so the
 * importer can drop them and tell the user why instead of round-tripping junk.
 */
export const CHROME_DEAD_COLOR_KEYS = new Set([
  'button_background_active',
  'button_background_hover',
  'button_background_secondary',
  'control_background',
  'ntp_link_underline',
  'ntp_section',
  'omnibox_background_hover',
  'omnibox_border',
  'omnibox_focused_border',
  'omnibox_selected_keyword',
  'tab_background_color',
  'tab_line',
  'toolbar_bottom_separator',
  'toolbar_button_icon_hover',
  'toolbar_button_icon_inactive',
  'toolbar_button_icon_pressed',
  'toolbar_top_separator',
  'toolbar_vertical_separator',
])

/**
 * The 10 keys that complete the 24-key table beyond the 14 core UI fields.
 *
 * They are **derived, not edited**: `utils/derivedColors.js` computes each one
 * from the core palette, so including them costs the user nothing and cannot
 * introduce an unreadable combination. They are always written — there is no
 * longer a toggle. They are listed here (rather than only in the deriver) so the
 * verifier can assert that
 * `CORE_FIELDS + EXTENDED_FIELDS === CHROME_COLOR_KEY_ALLOWLIST` exactly.
 *
 * @type {{chromeKey: string, id: string, from: string}[]}
 */
export const EXTENDED_COLOR_FIELDS = [
  { id: 'frameIncognito', chromeKey: 'frame_incognito', from: 'frame' },
  { id: 'frameIncognitoInactive', chromeKey: 'frame_incognito_inactive', from: 'frameInactive' },
  { id: 'backgroundTabInactive', chromeKey: 'background_tab_inactive', from: 'backgroundTab' },
  { id: 'backgroundTabIncognito', chromeKey: 'background_tab_incognito', from: 'backgroundTab' },
  {
    id: 'backgroundTabIncognitoInactive',
    chromeKey: 'background_tab_incognito_inactive',
    from: 'backgroundTab',
  },
  {
    id: 'tabBackgroundTextInactive',
    chromeKey: 'tab_background_text_inactive',
    from: 'tabBackgroundText',
  },
  {
    id: 'tabBackgroundTextIncognito',
    chromeKey: 'tab_background_text_incognito',
    from: 'tabBackgroundText',
  },
  {
    id: 'tabBackgroundTextIncognitoInactive',
    chromeKey: 'tab_background_text_incognito_inactive',
    from: 'tabBackgroundText',
  },
  { id: 'ntpHeader', chromeKey: 'ntp_header', from: 'ntpText' },
  { id: 'toolbarText', chromeKey: 'toolbar_text', from: 'bookmarkText' },
]

/**
 * The extended set as a lookup, for the importer: these keys are legitimate but
 * derived, so importing one should drop it quietly rather than warn.
 */
export const EXTENDED_CHROME_KEYS = new Set(EXTENDED_COLOR_FIELDS.map((f) => f.chromeKey))

/**
 * `kTintTable` from browser_theme_pack.cc — 6 entries. Tints are HSL triples
 * with each channel normalised to 0-1; they are applied as a *shift* over
 * Chrome's built-in resources rather than as a literal colour.
 */
export const TINT_KEYS = [
  'buttons',
  'frame',
  'frame_inactive',
  'frame_incognito',
  'frame_incognito_inactive',
  'background_tab',
]

/** Which resolved colour each tint is derived from. */
export const TINT_SOURCES = {
  buttons: 'toolbar',
  frame: 'frame',
  frame_inactive: 'frameInactive',
  frame_incognito: 'frameIncognito',
  frame_incognito_inactive: 'frameIncognitoInactive',
  background_tab: 'backgroundTab',
}

/**
 * `kDisplayProperties` from browser_theme_pack.cc — 3 entries, and the only
 * property keys Chrome reads. `ntp_background_alignment` and
 * `ntp_background_repeat` must be strings; `ntp_logo_alternate` must be an int
 * (SetDisplayPropertiesFromJSON ignores a value of the wrong type).
 *
 * ONLY `ntp_logo_alternate` IS EVER WRITTEN — see `LOGO_STYLES` below, which is
 * the control that drives it. The other two stay declared-but-unused on purpose:
 * both only take effect when the theme ships a background *image* through
 * `theme.images`, and ThemeBake is colour-only.
 *
 * They are kept in the table anyway so `CHROME_PROPERTY_KEY_ALLOWLIST` stays a
 * verbatim copy of Chromium's list — that is what makes the "never write a
 * property Chrome cannot read" guard meaningful. Neither carries a `labelKey`:
 * the UI that used them was removed, so a future feature must supply its own
 * strings rather than inherit dangling ones.
 */
export const DISPLAY_PROPERTIES = [
  {
    key: 'ntp_background_alignment',
    type: 'string',
    options: ['top', 'center', 'bottom', 'left', 'right'],
    values: ['top', 'center', 'bottom', 'left', 'right'],
  },
  {
    key: 'ntp_background_repeat',
    type: 'string',
    options: ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'],
    values: ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'],
  },
  {
    key: 'ntp_logo_alternate',
    type: 'int',
    values: [0, 1],
  },
]

/** The only three property keys Chrome accepts, as a Set for fast checking. */
export const CHROME_PROPERTY_KEY_ALLOWLIST = new Set(DISPLAY_PROPERTIES.map((p) => p.key))

/**
 * Fallbacks for the three display properties, consumed by `resolveProperties()`.
 *
 * `ntp_logo_alternate: 1` is the one that matters, and its meaning is the
 * opposite of what an earlier revision of this file claimed:
 *
 *   1 = ADAPTIVE. "Work the logo out from my New Tab colours." Chrome renders
 *       the white wordmark over a dark NTP background and the standard dark
 *       wordmark over a light one.
 *   0 = the ORIGINAL logo. Google only renders it untouched when nothing else
 *       about the New Tab Page has been changed, so for a coloured theme it is
 *       the fragile choice, not the safe one.
 *
 * The old comment here asserted that `1` selected a pre-rendered *white* logo
 * that "disappears on any light background", and the default was changed to 0 on
 * that basis. That reading was wrong, and the reference collection disproves it:
 * of 21 hand-built themes, 19 set `1` — and 18 of those 19 pair it with a
 * near-white New Tab background (mean relative luminance 0.85). A white-on-white
 * wordmark would have been obvious in every one of them.
 *
 * Source: theme.mepa.dev/theme-properties/display-properties, which states it
 * directly — "If you choose option 1, it means 'yes, I want the logo to be
 * changed according to the colors. So, then Google does some calculations with
 * your color; if it's dark, the logo will be white."
 */
export const DEFAULT_NTP_PROPERTIES = {
  ntp_background_alignment: 'top',
  ntp_background_repeat: 'no-repeat',
  ntp_logo_alternate: 1,
}

/**
 * The Google-logo control for the New Tab Page — the single `theme.properties`
 * key ThemeBake writes.
 *
 * `value` is the integer that goes into the manifest; `id` is what the editor
 * state holds. The UI never sees a bare Chrome number, so this table stays the
 * only place the two are related — the same rule the colour fields follow.
 *
 * `adaptive` is the default because it is correct for light *and* dark themes
 * without the user having to reason about it: Chrome derives the wordmark from
 * the `ntp_background` colour we already write. `classic` exists for users who
 * want the untouched logo and accept that Chrome may override it.
 *
 * @type {{id: string, value: number, labelKey: string, sample: string}[]}
 */
export const LOGO_STYLES = [
  { id: 'adaptive', value: 1, labelKey: 'settings.logo.adaptive', sample: '1' },
  { id: 'classic', value: 0, labelKey: 'settings.logo.classic', sample: '0' },
]

/** Valid editor values for the logo control, in render order. */
export const LOGO_STYLE_IDS = LOGO_STYLES.map((style) => style.id)

/** Applied when nothing is stored, and when a stored value is unrecognised. */
export const DEFAULT_LOGO_STYLE = 'adaptive'

/**
 * How the finished theme is delivered.
 *
 * `folder` writes the theme folder straight into a directory the user picks, so
 * "Load unpacked" needs no unzipping first — but it relies on the File System
 * Access API, which exists only in desktop Chrome/Edge. `zip` works everywhere
 * and is the only form the Chrome Web Store accepts, so it stays the default and
 * is never removed.
 *
 * @type {{id: string, labelKey: string}[]}
 */
export const OUTPUT_MODES = [
  { id: 'zip', labelKey: 'export.output.zip' },
  { id: 'folder', labelKey: 'export.output.folder' },
]

/** Valid `outputMode` values, in render order. */
export const OUTPUT_MODE_IDS = OUTPUT_MODES.map((mode) => mode.id)

/** The manifest key this whole table exists to feed. */
export const LOGO_PROPERTY_KEY = 'ntp_logo_alternate'

/**
 * Editor style id -> the integer Chrome expects. An unknown id falls back to the
 * default rather than dropping the key, so the manifest always states its intent.
 * @param {string} id
 * @returns {number}
 */
export function logoStyleValue(id) {
  const match = LOGO_STYLES.find((style) => style.id === id)
  if (match) return match.value
  return LOGO_STYLES.find((style) => style.id === DEFAULT_LOGO_STYLE).value
}

/**
 * The integer found in an imported manifest -> editor style id, or null when the
 * theme does not set the key at all (in which case the current choice is kept
 * rather than silently reset).
 * @param {unknown} value
 * @returns {string|null}
 */
export function logoStyleFromValue(value) {
  const match = LOGO_STYLES.find((style) => style.value === Number(value))
  return match ? match.id : null
}
