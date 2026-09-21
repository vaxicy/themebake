/**
 * Preset themes + default theme + the harmonised random generator.
 *
 * Every preset is a complete set of the UI field ids declared in
 * `data/themeFields.js`. Presets are only ever a *starting point* — applying one
 * replaces the current colours but the user can keep editing afterwards.
 */

import { FIELD_IDS } from './themeFields.js'
import { SURFACE_HUE_DRIFT } from '../utils/palette.js'
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
    description: 'The ThemeBake house palette: cool lavender and plenty of air.',
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
 * Colour-relationship archetypes the randomiser picks between.
 *
 * One generator that always did "analogous, or maybe complementary" produced a
 * recognisable sameness. Picking a relationship up front — and how loud the
 * surfaces are — is what makes two randomises feel like two different themes.
 */
const RANDOM_ARCHETYPES = ['monochrome', 'analogous', 'complementary', 'split', 'triadic']

/**
 * How far the accent (and, for `split`/`triadic`, the window buttons) sit from
 * the base hue, or `null` when the archetype uses its own rule.
 */
const ARCHETYPE_ACCENT = {
  monochrome: { distance: [14, 30], second: null },
  analogous: { distance: [32, 58], second: null },
  complementary: { distance: [168, 192], second: null },
  split: { distance: [140, 165], second: 'mirror' },
  triadic: { distance: [114, 126], second: 'mirror' },
}

/**
 * Generate a *coordinated* random palette rather than 14 independent RGB values.
 *
 * Strategy — a colour-relationship archetype, one to three colour families, and
 * surfaces tinted around them:
 *   1. Pick a base hue, an archetype (monochrome .. triadic), how many families
 *      the palette mixes (one, two or three) and how loud the surfaces should be.
 *      Some themes are tinted throughout, others are quiet paper with one vivid
 *      accent — the second is what the hand-made reference themes mostly do, so
 *      it is a first-class outcome, not noise.
 *   2. Build the surfaces by pulling luminance up and saturation down from their
 *      family's hue, each layer a few degrees off so they read as depth rather
 *      than one flat wash. With two or three families the toolbar and the New Tab
 *      page carry the other colour, which is what makes a randomise look like a
 *      designer's palette card instead of a tint of one colour.
 *   3. Derive the deep text colour from the base hue with low saturation so it
 *      reads as "tinted ink" instead of pure black.
 *   4. Place the accent: the third family when there is one, otherwise the
 *      archetype's distance from the base hue, choosing the side of the wheel
 *      that is further from the muddy orange-olive band.
 *   5. Let auto-contrast fix any pair that ends up too close — including the
 *      pairs introduced by a second surface family.
 *
 * @param {number} [seed] optional PRNG seed (used by tests)
 * @returns {ThemeColors}
 */
export function generateRandomColors(seed) {
  const rand = createRandom(seed)
  const pick = (min, max) => min + rand() * (max - min)
  const maybe = (chance) => rand() < chance
  /** `hue ± distance`, preferring the side that is not muddy orange-olive. */
  const away = (hue, distance) => {
    const plus = (hue + distance + 360) % 360
    const minus = (hue - distance + 360) % 360
    const toMud = (h) => {
      const d = Math.abs(((h - 45) % 360 + 360) % 360)
      return d > 180 ? 360 - d : d
    }
    return toMud(plus) >= toMud(minus) ? plus : minus
  }

  const baseHue = pick(0, 360)
  // A third of the themes are dark: at under a quarter, two randoms in a row
  // landed on the same scheme often enough that the button felt broken.
  const dark = maybe(0.34)
  const archetype = RANDOM_ARCHETYPES[Math.floor(rand() * RANDOM_ARCHETYPES.length)]
  // Quiet surfaces: the surfaces are pulled towards neutral so a single accent
  // carries the theme. This is the difference between "tinted paper" and "a wash
  // of one colour", and it is worth being deliberate about.
  const quietSurfaces = maybe(0.4)
  /**
   * A grey theme — no hue at all, only lightness.
   *
   * Worth having as an explicit outcome rather than an unlikely accident: an
   * editor theme in pure greys is a real, popular look, and it is the one result
   * that cannot be mistaken for "another tint of the last one".
   */
  const greyscale = maybe(0.12)
  /**
   * How strongly the surfaces are tinted, as its own axis (vs "quiet paper").
   *
   * The sameness that made randoms feel like "the same theme in a different hue"
   * came from the surfaces: a light random was *always* a near-white page with a
   * tinted chrome, so two light randoms in a row read as one template. Now the
   * page/toolbar can be clearly coloured at the high end — a different-looking
   * theme, not a different hue — while the low end stays paper.
   */
  const surfaceStrength = greyscale ? pick(0.15, 0.4) : pick(0.2, 1)

  /**
   * How many colour families the palette mixes.
   *
   * One family is the safe, monochrome answer; two is what a designer's palette
   * card usually is (a rose family for the shell, an olive one for the page);
   * three is an outright multi-colour card. The second family lands 35-105° away
   * — close enough to belong to the same picture, far enough to read as a
   * second colour — and the third takes a corner of its own.
   */
  const familyCount = maybe(0.3) ? 3 : maybe(0.72) ? 2 : 1
  const familyB = familyCount >= 2 ? away(baseHue, pick(35, 105)) : null
  const familyC = familyCount >= 3 ? away(baseHue, pick(105, 180)) : null

  /**
   * Frame weight and lightness.
   *
   * These were a narrow band (light `l` 58-74, `s` 42-72), so every randomise was
   * the same theme in a different hue: a mid-weight pastel, always. The band is
   * now wide enough for a pale wash, a deep saturated frame and a near-grey one to
   * all turn up, which is what "random" has to mean for the button to be worth
   * pressing twice.
   */
  const primaryS = greyscale
    ? pick(2, 8)
    : (dark ? pick(12, 46) : pick(18, 82)) * (quietSurfaces ? 0.72 : 1)
  const primaryL = dark ? pick(12, 34) : pick(46, 80)

  /**
   * Surface hue: the base plus this role's own drift, or the second family.
   *
   * `second` marks the roles that carry the palette's other colour — the toolbar
   * and the New Tab page, which is where a second family is visible without
   * fighting the window frame.
   */
  const tint = (id, family = null) =>
    (family ?? baseHue) + (SURFACE_HUE_DRIFT[id] ?? 0)

  /**
   * A tint of `hue` at lightness `l` with **chroma** (max-min over 255) at least
   * `chroma`.
   *
   * ---------------------------------------------------------------------------
   * WHY NOT HSL SATURATION
   * ---------------------------------------------------------------------------
   * Multiplying an HSL saturation down is not "make it paler" — near white it is
   * "make it grey". A tint at l 96 with s 12% is a 2/255 channel difference, i.e.
   * indistinguishable from white, while the pale pink of a real palette card
   * (`#FFDCDC`) is l 93 / s 98. Chroma is the stable axis across the whole
   * lightness range, which is exactly why the palette solver ranks by it too, so
   * the surfaces are specified in chroma and converted here.
   */
  const tintAt = (hue, l, chroma) => {
    const denom = 1 - Math.abs(2 * (l / 100) - 1)
    const s = denom <= 0.02 ? 0 : Math.min(100, (chroma / denom) * 100)
    return hslToHex({ h: hue, s, l })
  }

  /**
   * Surface colourfulness. Quiet palettes are pulled towards paper — but not to
   * nothing, and a palette with a second family keeps a floor, because a second
   * colour at 3% chroma is a grey with extra steps.
   */
  const quietScale = quietSurfaces ? pick(0.5, 0.75) : 1
  const chromaFloor = familyB !== null ? 0.05 : 0
  const chroma = (budget) => Math.max(budget * quietScale, chromaFloor)

  const frame = hslToHex({ h: baseHue, s: primaryS, l: primaryL })
  const palette = {}
  palette.frame = frame

  // --------------------------- accent placement ------------------------------
  // Where the loud colour goes, in order of preference: the third family (a real
  // multi-colour card), the second family, or the archetype's distance from the
  // base hue. `split` and `triadic` additionally give the window buttons the
  // mirror corner, which is what makes three hues read as intentional rather
  // than as one hue plus a stray.
  const rule = ARCHETYPE_ACCENT[archetype]
  const accentDistance = pick(rule.distance[0], rule.distance[1])
  const mirrorHue = rule.second === 'mirror' ? away(baseHue, -accentDistance) : null
  const accentHue = familyC ?? familyB ?? away(baseHue, accentDistance)
  const buttonHue = familyC !== null ? familyB : (mirrorHue ?? familyB ?? tint('buttonBackground'))
  /** Roles that carry the palette's *other* colour family, when there is one. */
  const otherFamily = (id) => tint(id, familyB)

  /**
   * How far the page/toolbar surfaces sit from paper, driven by `surfaceStrength`
   * (so a strong theme has a clearly coloured page, a quiet one stays near
   * white) but never collapsing to invisible: a second colour family still keeps
   * a floor so it is not a grey with extra steps.
   */
  const pageL = dark
    ? pick(6, 9) + (1 - surfaceStrength) * pick(6, 16)
    : pick(82, 92) + (1 - surfaceStrength) * pick(6, 9)
  const pageChroma = (dark ? pick(0.03, 0.12) : pick(0.03, 0.22)) * surfaceStrength
  const toolbarL = dark
    ? primaryL + pick(4, 16)
    : pick(86, 94) + (1 - surfaceStrength) * pick(3, 5)
  const toolbarChroma = (dark ? pick(0.05, 0.14) : pick(0.03, 0.16)) * surfaceStrength

  if (dark) {
    // ---------------------------------- dark ----------------------------------
    palette.frameInactive = hslToHex({ h: tint('frameInactive'), s: primaryS * 0.85, l: primaryL + 6 })
    palette.toolbar = tintAt(otherFamily('toolbar'), toolbarL, Math.max(toolbarChroma, chromaFloor))
    palette.backgroundTab = tintAt(tint('backgroundTab'), primaryL - pick(0, 6), chroma(pick(0.05, 0.15)))
    palette.ntpBackground = tintAt(otherFamily('ntpBackground'), pageL, Math.max(pageChroma, chromaFloor))
    palette.omniboxBackground = tintAt(otherFamily('omniboxBackground'), pick(11, 26), chroma(pick(0.03, 0.1)))
    palette.buttonBackground = tintAt(buttonHue, primaryL + pick(6, 18), chroma(pick(0.07, 0.18)))
    palette.tabText = hslToHex({ h: baseHue, s: pick(10, 22), l: pick(92, 97) })
    palette.tabBackgroundText = hslToHex({ h: baseHue, s: pick(12, 26), l: pick(66, 78) })
    palette.toolbarButtonIcon = hslToHex({ h: baseHue, s: pick(10, 24), l: pick(84, 92) })
    palette.omniboxText = hslToHex({ h: baseHue, s: pick(10, 20), l: pick(88, 95) })
    palette.bookmarkText = palette.tabBackgroundText
    palette.ntpText = hslToHex({ h: baseHue, s: pick(8, 20), l: pick(92, 96) })
  } else {
    // ---------------------------------- light ---------------------------------
    palette.frameInactive = hslToHex({ h: tint('frameInactive'), s: primaryS * 0.5, l: Math.min(primaryL + 9, 88) })
    palette.toolbar = tintAt(otherFamily('toolbar'), toolbarL, Math.max(toolbarChroma, chromaFloor))
    palette.backgroundTab = tintAt(tint('backgroundTab'), pick(80, 92), chroma(pick(0.06, 0.18)))
    // The page is not always paper: at full `surfaceStrength` it is a clearly
    // coloured surface (a sage or rose page), which is what makes a light random
    // read as its own theme instead of "white with coloured trim".
    palette.ntpBackground = tintAt(otherFamily('ntpBackground'), pageL, Math.max(pageChroma, chromaFloor))
    // The URL bar stays near-white most of the time — it carries typed text —
    // but a tint now and then is what real light themes do.
    palette.omniboxBackground = maybe(0.3)
      ? tintAt(otherFamily('omniboxBackground'), pick(92, 98), chroma(pick(0.03, 0.08)))
      : '#FFFFFF'
    palette.buttonBackground = tintAt(buttonHue, pick(78, 92), chroma(pick(0.07, 0.18)))
    palette.tabText = hslToHex({ h: baseHue, s: pick(18, 36), l: pick(14, 24) })
    palette.tabBackgroundText = hslToHex({ h: baseHue, s: pick(12, 26), l: pick(34, 46) })
    palette.toolbarButtonIcon = palette.tabBackgroundText
    palette.omniboxText = palette.tabText
    palette.bookmarkText = palette.tabBackgroundText
    palette.ntpText = hslToHex({ h: baseHue, s: pick(16, 34), l: pick(12, 22) })
  }

  // A greyscale theme keeps its accent grey too, or it would be a colour theme
  // wearing a grey coat. Otherwise the accent's *character* is its own axis now:
  // a deep, near-primary accent and a bright pastel one are different themes, not
  // a tuning of one. A quieter surface palette leans a touch louder so the quiet
  // half of the choice does not read as dull.
  const accentSatBoost = quietSurfaces ? 1.12 : 1
  palette.ntpLink = hslToHex({
    h: accentHue,
    s: greyscale
      ? pick(0, 8)
      : Math.min((dark ? pick(48, 74) : pick(46, 88)) * accentSatBoost, 92),
    l: dark ? pick(64, 84) : pick(34, 60),
  })

  // ------------------------- contrast correction pass -------------------------
  // Guarantee legibility on the pairs that matter most, without flattening the
  // palette: nudge the *foreground* only, and only as far as necessary. The
  // toolbar pairs are included because a second surface family is a *new*
  // background for text that was chosen against the frame.
  palette.tabText = ensureContrast(palette.tabText, palette.frame, 4.5, dark)
  // This one sits on the frame *and* on the inactive tab, and the audited pair is
  // the tighter of the two, so both are honoured at once.
  palette.tabBackgroundText = ensureContrastAll(palette.tabBackgroundText, [palette.frame, palette.backgroundTab], 3.5, dark)
  palette.ntpText = ensureContrast(palette.ntpText, palette.ntpBackground, 4.5, dark)
  palette.omniboxText = ensureContrast(palette.omniboxText, palette.omniboxBackground, 4.5, dark)
  palette.bookmarkText = ensureContrast(palette.bookmarkText, palette.toolbar, 3.5, dark)
  palette.toolbarButtonIcon = ensureContrast(palette.toolbarButtonIcon, palette.toolbar, 3, dark)
  palette.ntpLink = ensureContrast(palette.ntpLink, palette.ntpBackground, 3, dark)

  return palette
}

/**
 * Perceptual distance between two generated palettes, 0..~1.4.
 *
 * Used by the randomise button to refuse a theme that is too close to the one
 * it just produced — otherwise two quick clicks can land on "the same template
 * in a near hue" and the button feels broken. The axes are the ones a person
 * actually notices: frame hue + lightness, accent hue + lightness, and how far
 * the page sits from paper.
 *
 * @param {ThemeColors} a
 * @param {ThemeColors} b
 */
export function paletteDistance(a, b) {
  const hueGap = (x, y) => {
    const d = Math.abs(((x - y) % 360 + 360) % 360)
    return d > 180 ? 360 - d : d
  }
  const la = hexToHsl(a.frame).l
  const lb = hexToHsl(b.frame).l
  const aa = hexToHsl(a.ntpLink).l
  const ab = hexToHsl(b.ntpLink).l
  const pa = hexToHsl(a.ntpBackground).l
  const pb = hexToHsl(b.ntpBackground).l
  return Math.sqrt(
    (hueGap(hexToHsl(a.frame).h, hexToHsl(b.frame).h) / 180) ** 2 +
      ((la - lb) / 60) ** 2 +
      (hueGap(hexToHsl(a.ntpLink).h, hexToHsl(b.ntpLink).h) / 180) ** 2 +
      ((aa - ab) / 45) ** 2 +
      ((pa - pb) / 30) ** 2,
  )
}

/**
 * Nudge `fg` lighter/darker until it clears `min` contrast against `bg`.
 * Stops after 30 steps so it can never loop forever on an impossible pair.
 */
function ensureContrast(fg, bg, min, dark) {
  return ensureContrastAll(fg, [bg], min, dark)
}

/**
 * Same, against the *worst* of several backgrounds — a colour that has to be
 * legible on two surfaces is only as good as its worst pair.
 */
function ensureContrastAll(fg, backgrounds, min, dark) {
  const worst = (candidate) => Math.min(...backgrounds.map((bg) => contrastRatio(candidate, bg)))
  let out = fg
  for (let i = 0; i < 30; i += 1) {
    if (worst(out) >= min) return out
    out = adjustL(out, dark ? 3 : -3)
  }
  const worstBg = backgrounds.reduce((a, b) => (contrastRatio(out, a) <= contrastRatio(out, b) ? a : b))
  return readableTextOn(worstBg)
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
