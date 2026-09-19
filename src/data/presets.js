/**
 * Preset themes + default theme + the harmonised random generator.
 *
 * Every preset is a complete set of the UI field ids declared in
 * `data/themeFields.js`. Presets are only ever a *starting point* — applying one
 * replaces the current colours but the user can keep editing afterwards.
 */

import { FIELD_IDS } from './themeFields.js'
import {
  adjustL,
  contrastRatio,
  createRandom,
  hexToHsl,
  hslToHex,
  mix,
  readableTextOn,
  withAlpha,
} from '../utils/color.js'

/** @typedef {Record<string, string>} ThemeColors  fieldId -> `#RRGGBB` */

/** The palette the app opens with: a calm periwinkle/lavender scheme. */
export const DEFAULT_COLORS = {
  frame: '#B1B2FF',
  frameInactive: '#C9CAF2',
  toolbar: '#EEF1FF',
  backgroundTab: '#D8DBFA',
  tabText: '#1E1B45',
  tabBackgroundText: '#4A4870',
  toolbarButtonIcon: '#3B3A63',
  buttonBackground: '#D9DBFF',
  omniboxBackground: '#FFFFFF',
  omniboxText: '#2A2848',
  bookmarkText: '#3B3A63',
  ntpBackground: '#F7F8FF',
  ntpText: '#22203F',
  ntpLink: '#6C5CE7',
}

export const DEFAULT_THEME_NAME = 'My Theme'

/**
 * Six hand-tuned starting points.
 * @type {{id:string,name:string,description:string,colors:ThemeColors}[]}
 */
export const PRESETS = [
  {
    id: 'soft-sky',
    name: 'Soft Sky',
    description: 'Airy daylight blues with a crisp white toolbar.',
    colors: {
      frame: '#A8CDEB',
      frameInactive: '#C4DCEE',
      toolbar: '#EAF4FB',
      backgroundTab: '#C6DFF1',
      tabText: '#0E2C40',
      tabBackgroundText: '#3C5C74',
      toolbarButtonIcon: '#2B4C64',
      buttonBackground: '#D3E7F5',
      omniboxBackground: '#FFFFFF',
      omniboxText: '#1E3A50',
      bookmarkText: '#2B4C64',
      ntpBackground: '#F5FAFE',
      ntpText: '#14324A',
      ntpLink: '#2F7FB8',
    },
  },
  {
    id: 'cozy-vintage',
    name: 'Cozy Vintage',
    description: 'Warm parchment, terracotta accents and soft ink text.',
    colors: {
      frame: '#D9C3A5',
      frameInactive: '#E4D3BB',
      toolbar: '#F5EDE1',
      backgroundTab: '#E3D2B9',
      tabText: '#3A2A18',
      tabBackgroundText: '#6B5539',
      toolbarButtonIcon: '#4A3826',
      buttonBackground: '#E8D8BF',
      omniboxBackground: '#FFFBF4',
      omniboxText: '#3A2A18',
      bookmarkText: '#4A3826',
      ntpBackground: '#FBF6EC',
      ntpText: '#33240F',
      ntpLink: '#A8562F',
    },
  },
  {
    id: 'dusty-petal',
    name: 'Dusty Petal',
    description: 'Muted rose with a warm grey base. Quiet and editorial.',
    colors: {
      frame: '#D9A9AE',
      frameInactive: '#E5C2C6',
      toolbar: '#FBEEF0',
      backgroundTab: '#E7C6CA',
      tabText: '#3D1E24',
      tabBackgroundText: '#6E464D',
      toolbarButtonIcon: '#4E2B31',
      buttonBackground: '#EBCFD3',
      omniboxBackground: '#FFFCFC',
      omniboxText: '#3D1E24',
      bookmarkText: '#4E2B31',
      ntpBackground: '#FDF6F7',
      ntpText: '#361A20',
      ntpLink: '#B15D69',
    },
  },
  {
    id: 'periwinkle-dream',
    name: 'Periwinkle Dream',
    description: 'The ThemeForge house palette: cool lavender and plenty of air.',
    colors: {
      frame: '#B1B2FF',
      frameInactive: '#C9CAF2',
      toolbar: '#EEF1FF',
      backgroundTab: '#D8DBFA',
      tabText: '#1E1B45',
      tabBackgroundText: '#4A4870',
      toolbarButtonIcon: '#3B3A63',
      buttonBackground: '#D9DBFF',
      omniboxBackground: '#FFFFFF',
      omniboxText: '#2A2848',
      bookmarkText: '#3B3A63',
      ntpBackground: '#F7F8FF',
      ntpText: '#22203F',
      ntpLink: '#6C5CE7',
    },
  },
  {
    id: 'berry-dusk',
    name: 'Berry Dusk',
    description: 'A dark plum theme for late sessions. Warms the eyes at night.',
    colors: {
      frame: '#3B2A46',
      frameInactive: '#4A3854',
      toolbar: '#4A3854',
      backgroundTab: '#3B2A46',
      tabText: '#F6ECFA',
      tabBackgroundText: '#C0A9CC',
      toolbarButtonIcon: '#E3D3EC',
      buttonBackground: '#5C4767',
      omniboxBackground: '#2C1F36',
      omniboxText: '#EDE2F2',
      bookmarkText: '#C0A9CC',
      ntpBackground: '#22182A',
      ntpText: '#F1E7F5',
      ntpLink: '#C79BE0',
    },
  },
  {
    id: 'pink-souffle',
    name: 'Pink Soufflé',
    description: 'Pale strawberry cream with a rosy accent. Light and friendly.',
    colors: {
      frame: '#F4B8C8',
      frameInactive: '#F9D2DC',
      toolbar: '#FFF1F5',
      backgroundTab: '#FAD4DF',
      tabText: '#4A1B2A',
      // #835A68 read as 3.46:1 against `frame` (#F4B8C8) — just under the 3.5:1
      // UI-text threshold audited in `utils/contrastAudit.js`. Darkened to 3.82:1.
      tabBackgroundText: '#7B5460',
      toolbarButtonIcon: '#5E2C3B',
      buttonBackground: '#FBDCE4',
      omniboxBackground: '#FFFFFF',
      omniboxText: '#4A1B2A',
      bookmarkText: '#5E2C3B',
      ntpBackground: '#FFF8FA',
      ntpText: '#43151F',
      ntpLink: '#D2527A',
    },
  },
]

export const PRESETS_BY_ID = Object.fromEntries(PRESETS.map((p) => [p.id, p]))

/**
 * Generate a *coordinated* random palette rather than 14 independent RGB values.
 *
 * Strategy — analogous-by-default with one accent:
 *   1. Pick a base hue and a saturated-but-soft primary  -> frame
 *   2. Build the light surfaces by pulling luminance up and saturation down
 *      from the same hue family (toolbar, tab background, NTP background)
 *   3. Derive the deep text colour from the base hue with low saturation so it
 *      reads as "tinted ink" instead of pure black
 *   4. Pick one accent, either analogous (+/- 30 deg) or complementary
 *      (+160..200 deg) -> links
 *   5. Let auto-contrast fix any pair that ends up too close
 *
 * @param {number} [seed] optional PRNG seed (used by tests)
 * @returns {ThemeColors}
 */
export function generateRandomColors(seed) {
  const rand = createRandom(seed)
  const pick = (min, max) => min + rand() * (max - min)
  const maybe = (chance) => rand() < chance

  const baseHue = pick(0, 360)
  const dark = maybe(0.22)
  const complementary = maybe(0.45)

  const primaryS = dark ? pick(22, 42) : pick(42, 72)
  const primaryL = dark ? pick(22, 34) : pick(58, 74)

  const frame = hslToHex({ h: baseHue, s: primaryS, l: primaryL })
  const palette = {}
  palette.frame = frame

  if (dark) {
    // ---------------------------------- dark ----------------------------------
    palette.frameInactive = hslToHex({ h: baseHue + pick(-6, 6), s: primaryS * 0.85, l: primaryL + 6 })
    palette.toolbar = hslToHex({ h: baseHue + pick(-8, 8), s: primaryS * 0.7, l: primaryL + 8 })
    palette.backgroundTab = hslToHex({ h: baseHue + pick(-6, 6), s: primaryS * 0.8, l: primaryL - 2 })
    palette.ntpBackground = hslToHex({ h: baseHue + pick(-8, 8), s: primaryS * 0.6, l: pick(9, 15) })
    palette.omniboxBackground = hslToHex({ h: baseHue, s: primaryS * 0.6, l: pick(15, 22) })
    palette.buttonBackground = hslToHex({ h: baseHue + pick(-10, 10), s: primaryS * 0.9, l: primaryL + 12 })
    palette.tabText = hslToHex({ h: baseHue, s: pick(10, 22), l: pick(92, 97) })
    palette.tabBackgroundText = hslToHex({ h: baseHue, s: pick(12, 26), l: pick(66, 78) })
    palette.toolbarButtonIcon = hslToHex({ h: baseHue, s: pick(10, 24), l: pick(84, 92) })
    palette.omniboxText = hslToHex({ h: baseHue, s: pick(10, 20), l: pick(88, 95) })
    palette.bookmarkText = palette.tabBackgroundText
    palette.ntpText = hslToHex({ h: baseHue, s: pick(8, 20), l: pick(92, 96) })
  } else {
    // ---------------------------------- light ---------------------------------
    palette.frameInactive = hslToHex({ h: baseHue + pick(-6, 6), s: primaryS * 0.5, l: Math.min(primaryL + 9, 88) })
    palette.toolbar = hslToHex({ h: baseHue + pick(-8, 8), s: pick(14, 30), l: pick(94, 97) })
    palette.backgroundTab = hslToHex({ h: baseHue + pick(-6, 6), s: pick(26, 44), l: pick(84, 90) })
    palette.ntpBackground = hslToHex({ h: baseHue + pick(-10, 10), s: pick(20, 42), l: pick(96, 98.5) })
    palette.omniboxBackground = '#FFFFFF'
    palette.buttonBackground = hslToHex({ h: baseHue + pick(-10, 10), s: pick(34, 56), l: pick(86, 92) })
    palette.tabText = hslToHex({ h: baseHue, s: pick(18, 36), l: pick(14, 24) })
    palette.tabBackgroundText = hslToHex({ h: baseHue, s: pick(12, 26), l: pick(34, 46) })
    palette.toolbarButtonIcon = palette.tabBackgroundText
    palette.omniboxText = palette.tabText
    palette.bookmarkText = palette.tabBackgroundText
    palette.ntpText = hslToHex({ h: baseHue, s: pick(16, 34), l: pick(12, 22) })
  }

  // ---------------------------------- accent ----------------------------------
  const accentHue = complementary
    ? baseHue + pick(150, 210)
    : baseHue + (maybe(0.5) ? pick(24, 44) : pick(-44, -24))
  palette.ntpLink = hslToHex({
    h: accentHue,
    s: dark ? pick(48, 70) : pick(52, 76),
    l: dark ? pick(70, 82) : pick(38, 50),
  })

  // ------------------------- contrast correction pass -------------------------
  // Guarantee legibility on the pairs that matter most, without flattening the
  // palette: nudge the *foreground* only, and only as far as necessary.
  palette.tabText = ensureContrast(palette.tabText, palette.frame, 4.5, dark)
  palette.tabBackgroundText = ensureContrast(palette.tabBackgroundText, palette.frame, 3.5, dark)
  palette.ntpText = ensureContrast(palette.ntpText, palette.ntpBackground, 4.5, dark)
  palette.omniboxText = ensureContrast(palette.omniboxText, palette.omniboxBackground, 4.5, dark)
  palette.ntpLink = ensureContrast(palette.ntpLink, palette.ntpBackground, 3, dark)

  return palette
}

/**
 * Nudge `fg` lighter/darker until it clears `min` contrast against `bg`.
 * Stops after 30 steps so it can never loop forever on an impossible pair.
 */
function ensureContrast(fg, bg, min, dark) {
  let out = fg
  for (let i = 0; i < 30; i += 1) {
    if (contrastRatio(out, bg) >= min) return out
    out = adjustL(out, dark ? 3 : -3)
  }
  return readableTextOn(bg)
}

/**
 * Build a full colour set from a partial one, filling gaps with the default.
 * @param {Partial<ThemeColors>} [partial]
 * @returns {ThemeColors}
 */
export function buildColors(partial = {}) {
  const out = { ...DEFAULT_COLORS }
  for (const id of FIELD_IDS) {
    const value = partial[id]
    if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) out[id] = value.toUpperCase()
  }
  return out
}

/**
 * Derive preview-only colours that Chrome computes internally and therefore
 * cannot be themed (e.g. active-tab/toolbar hover states).
 * Kept here so no component ever invents its own blend factors.
 */
export function derivePreviewColors(colors) {
  const dark = relativeDark(colors.ntpBackground)
  return {
    activeTabBackground: colors.frame,
    hover: withAlpha(colors.tabText, dark ? 0.12 : 0.08),
    toolbarDivider: withAlpha(colors.toolbarButtonIcon, 0.18),
    omniboxBorder: withAlpha(colors.omniboxText, 0.12),
    ntpCard: dark ? mix(colors.ntpBackground, '#FFFFFF', 0.06) : mix(colors.ntpBackground, '#FFFFFF', 0.5),
    ntpCardBorder: withAlpha(colors.ntpText, 0.1),
    contentBackground: dark ? '#202124' : '#FFFFFF',
  }
}

function relativeDark(hex) {
  const { l } = hexToHsl(hex)
  return l < 50
}
