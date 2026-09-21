/**
 * ============================================================================
 *  PALETTE SOLVER  —  colour seeds  ->  14 Chrome theme roles
 * ============================================================================
 *
 *  This is the inverse of the randomiser in `data/presets.js`:
 *
 *    randomiser      : nothing      -> a coordinated palette   (generate)
 *    palette solver  : given colours -> role assignment         (reverse-solve)
 *
 *  ---------------------------------------------------------------------------
 *  THE CORE PRINCIPLE
 *  ---------------------------------------------------------------------------
 *  A palette card only supplies a *skeleton*. Colours the user actually gave are
 *  used verbatim wherever they fit (`snap`), and every remaining role is derived
 *  **from the same hue family**. We never inject a foreign hue, because that is
 *  what makes generated themes look assembled-by-a-machine instead of designed.
 *
 *  Worked example — the Coolors card [#FFF5F5, #F7D6D0, #E2B4BD, #4A4A4A]:
 *
 *    #4A4A4A  L 29%  neutral     -> tab_background_text, bookmark_text, toolbar_button_icon
 *    #E2B4BD  L 80%  chroma 18%  -> frame            (snap: most chromatic -> primary)
 *    #FFF5F5  L 98%  chroma 4%   -> toolbar          (snap: target L 95.5)
 *    #F7D6D0  L 89%  chroma 15%  -> background_tab   (snap: target L 86.5)
 *    derived (same hue ~352)     -> button_background, omnibox_background,
 *                                   ntp_background, frame_inactive, ntp_link
 *
 *  All four seeds are still used verbatim, but no seed claims two *stacked*
 *  surfaces. `#FFF5F5` previously took `ntp_background` as well, because both
 *  targets fall inside its tolerance — two stacked surfaces returning byte-
 *  identical colours is what made a one-colour seed produce a flat, depthless
 *  theme. See BACKGROUND_CATS.
 *
 *  ---------------------------------------------------------------------------
 *  THE SATURATION RULE
 *  ---------------------------------------------------------------------------
 *  Derived saturation comes from the seed's *chroma* (see below), but chroma
 *  understates pale colours, so three roles can override it with a floor: the
 *  frame (`FRAME_SATURATION_FLOOR`, because it carries the theme's identity) and
 *  the accent (`ACCENT_SATURATION_FLOOR`, because an accent at 26% saturation is
 *  a grey). Everything else stays purely chroma-driven, which is what keeps a
 *  soft palette soft.
 *
 *  ---------------------------------------------------------------------------
 *  WHY `chroma` AND NOT HSL SATURATION
 *  ---------------------------------------------------------------------------
 *  HSL `s` explodes near the lightness extremes: #FFF5F5 reports s = 98% even
 *  though it is perceptually a whisper of pink. Ranking "most colourful" by HSL
 *  saturation would pick the near-white as the primary. `chroma = (max-min)/255`
 *  is stable across the whole range, so that is what we rank by.
 *
 *  ---------------------------------------------------------------------------
 *  NOTES ARE i18n KEYS, NOT STRINGS
 *  ---------------------------------------------------------------------------
 *  `notes` come back as `{ key, vars }` so this module stays free of UI text.
 * ============================================================================
 */

import { FIELD_IDS } from '../data/themeFields.js'
import {
  adjustL,
  clamp,
  contrastRatio,
  hexToHsl,
  hslToHex,
  normalizeHex,
  parseHex,
  readableTextOn,
  relativeLuminance,
} from './color.js'

/** Saturation multiplier applied to *derived* colours (snapped seeds are exact). */
export const INTENSITY_SCALE = {
  soft: 0.72,
  balanced: 1,
  bold: 1.3,
}

export const INTENSITIES = ['soft', 'balanced', 'bold']
export const SOLVER_MODES = ['auto', 'light', 'dark']

/**
 * How the accent relates to the palette's own hue family.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS A CHOICE AT ALL
 * ---------------------------------------------------------------------------
 * Deriving every role from one hue is safe but monotone: the window, the
 * surfaces and the links all come back as tints of a single colour, which reads
 * as "tinted" rather than "designed". The hand-made reference themes never do
 * that — a grey-green surface family carrying a magenta accent is the house
 * look, and the contrast between the two hues is what makes the accent read as
 * a deliberate choice.
 *
 *   - `harmony` keeps the accent inside the family (±20°, mud-avoiding). The
 *     default, and the right answer when the user wants one calm colour.
 *   - `clash` puts the accent on the opposite hue (180°): the surfaces stay in
 *     the seed's family, so the palette keeps its identity while the links and
 *     active states land on the other side of the wheel.
 *   - `triad` sits 120° away and hands the window buttons the *third* corner, so
 *     the theme carries three related hues instead of two.
 */
export const ACCENT_STRATEGIES = ['harmony', 'clash', 'triad']

export const DEFAULT_ACCENT_STRATEGY = 'harmony'

/**
 * How far the hue may drift for the accent, per strategy.
 *
 * `harmony` is kept small on purpose: a deeper, slightly shifted sibling of the
 * same hue reads as a deliberate accent, whereas a complementary hue would look
 * imported *unless the user asked for one*.
 */
const ACCENT_DISTANCE = { harmony: 20, clash: 180, triad: 120 }

/**
 * Minimum saturation for the accent, per strategy. An accent has to out-shout
 * the surfaces it sits on, and a contrasting accent that is too pale reads as a
 * mistake rather than a decision.
 */
const ACCENT_FLOOR = { harmony: 46, clash: 62, triad: 56 }

/**
 * Surface saturation multiplier per strategy. Contrasting themes need *quieter*
 * surfaces: the whole point is that one colour is loud, and it cannot be if the
 * background is shouting too.
 */
const SURFACE_SAT_SCALE = { harmony: 1, clash: 0.78, triad: 0.84 }

/**
 * A few degrees of extra hue drift per surface role.
 *
 * Stacked surfaces that share one exact hue read as a single flat wash no matter
 * how far apart their lightness is. The reference themes never do that: the
 * toolbar sits a shade off the frame, the New Tab page the other way, and the
 * result reads as depth. Ten degrees is enough to separate the layers and far
 * too little to read as a second colour family.
 */
export const SURFACE_HUE_DRIFT = {
  toolbar: 6,
  backgroundTab: -5,
  buttonBackground: 12,
  omniboxBackground: -8,
  ntpBackground: -12,
  frameInactive: 4,
}

/**
 * The hue band that reads as *dirt*. A +20° drift is not neutral: applied to a
 * pink (h 0) it lands on orange-brown, and applied to a green (h 120) it lands on
 * olive. Both are the classic "someone let a machine pick this" accent. So the
 * shift is signed — see `accentHueFor`.
 */
const MUD_HUE = 45

/**
 * Minimum HSL saturation for the accent. `baseS` is derived from the seed's
 * *chroma*, which understates how saturated a pale colour looks: a dusty pink of
 * chroma 0.165 yields baseS ≈ 26, and an accent at 26% saturation is by
 * definition mud. The accent is the one role where vividness is the point, so it
 * gets a floor. See `ACCENT_FLOOR` for the per-strategy floors.
 */
const ACCENT_SATURATION_FLOOR = ACCENT_FLOOR.harmony

/** Minimum saturation for the frame — the surface that carries the theme's identity. */
const FRAME_SATURATION_FLOOR = 38

/**
 * Multiplier turning a seed's chroma into a usable base saturation.
 *
 * Raised from 1.6 after the "washed out pastel" report. Chroma is measured over
 * the full 0-255 range while HSL saturation is measured relative to the colour's
 * own lightness, so for pale seeds chroma badly understates the perceived tint:
 * `#F5CBCB` is chroma 0.165 but HSL s 68 — it reads as a clear pink, yet 1.6
 * produced surfaces at ~25% saturation and a grey-beige frame. The floor of 16
 * still protects genuinely near-white seeds (`#FFF5F5`, chroma 0.039).
 */
const BASE_SATURATION_MULTIPLIER = 2.0

/** Per-role targets. `cat` decides which seeds are eligible to be snapped in. */
const TARGETS = {
  light: {
    toolbar: { l: 95.5, s: 0.3, cat: 'surface', tolerance: 12 },
    backgroundTab: { l: 86.5, s: 0.62, cat: 'surface', tolerance: 10 },
    buttonBackground: { l: 89, s: 0.85, cat: 'surface', tolerance: 10 },
    omniboxBackground: { l: 99.5, s: 0.08, cat: 'inset', tolerance: 12 },
    ntpBackground: { l: 97.5, s: 0.35, cat: 'page', tolerance: 12 },
    tabText: { l: 17, s: 0.45, cat: 'text', tolerance: 11 },
    tabBackgroundText: { l: 39, s: 0.35, cat: 'text', tolerance: 11 },
    toolbarButtonIcon: { l: 39, s: 0.35, cat: 'text', tolerance: 11 },
    omniboxText: { l: 17, s: 0.45, cat: 'text', tolerance: 11 },
    bookmarkText: { l: 39, s: 0.35, cat: 'text', tolerance: 11 },
    ntpText: { l: 15, s: 0.45, cat: 'text', tolerance: 11 },
    ntpLink: { l: 44, s: 0.95, cat: 'accent', tolerance: 10 },
  },
  dark: {
    toolbar: { l: 22, s: 0.55, cat: 'surface', tolerance: 12 },
    backgroundTab: { l: 17, s: 0.6, cat: 'surface', tolerance: 10 },
    buttonBackground: { l: 30, s: 0.7, cat: 'surface', tolerance: 10 },
    omniboxBackground: { l: 15, s: 0.5, cat: 'inset', tolerance: 12 },
    ntpBackground: { l: 11, s: 0.45, cat: 'page', tolerance: 12 },
    tabText: { l: 93, s: 0.2, cat: 'text', tolerance: 11 },
    tabBackgroundText: { l: 70, s: 0.25, cat: 'text', tolerance: 11 },
    toolbarButtonIcon: { l: 86, s: 0.22, cat: 'text', tolerance: 11 },
    omniboxText: { l: 92, s: 0.2, cat: 'text', tolerance: 11 },
    bookmarkText: { l: 70, s: 0.25, cat: 'text', tolerance: 11 },
    ntpText: { l: 94, s: 0.18, cat: 'text', tolerance: 11 },
    ntpLink: { l: 76, s: 0.7, cat: 'accent', tolerance: 12 },
  },
}

/**
 * Categories whose members are *stacked* on screen — the frame sits behind the
 * toolbar, which sits behind the tab strip, and the NTP is a page behind all of
 * it. A single seed may therefore claim at most one of them.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS (the flat-theme bug)
 * ---------------------------------------------------------------------------
 * Snapping used to be independent per role, so one pale seed (`#F5CBCB`, L 88%)
 * satisfied the tolerance of `toolbar` (95.5 ± 12), `background_tab` (86.5 ± 10),
 * `button_background` (89 ± 10) *and* `ntp_background` (97.5 ± 12) at once. All
 * four roles came back byte-identical, the surface separation dropped to
 * dY = 0.000, and the whole browser became one flat wash of pink with no depth —
 * which is precisely what "the generated theme looks ugly" was describing.
 *
 * Text roles are deliberately *not* in this set: `tab_text` and `omnibox_text`
 * sharing one colour is correct (Chrome does the same), and it is where seed
 * fidelity is most valuable.
 */
const BACKGROUND_CATS = new Set(['surface', 'page', 'inset'])

/** Which seeds may be snapped into which category, per mode. */
const ELIGIBLE = {
  light: {
    text: (s) => s.l <= 50,
    surface: (s) => s.l >= 74,
    page: (s) => s.l >= 84,
    inset: (s) => s.l >= 88,
    accent: (s) => s.chroma >= 0.1 && s.l <= 72,
  },
  dark: {
    text: (s) => s.l >= 60,
    surface: (s) => s.l <= 46,
    page: (s) => s.l <= 30,
    inset: (s) => s.l <= 34,
    accent: (s) => s.chroma >= 0.1 && s.l >= 50,
  },
}

/** Contrast pairs that must hold. `min` follows WCAG (4.5 body, 3 large/UI). */
const CONTRAST_RULES = [
  { fg: 'tabText', bg: ['frame'], min: 4.5, direction: 'text' },
  { fg: 'tabBackgroundText', bg: ['frame', 'backgroundTab'], min: 3.5, direction: 'text' },
  { fg: 'bookmarkText', bg: ['toolbar'], min: 3.5, direction: 'text' },
  { fg: 'toolbarButtonIcon', bg: ['toolbar'], min: 3, direction: 'text' },
  { fg: 'omniboxText', bg: ['omniboxBackground'], min: 4.5, direction: 'text' },
  { fg: 'ntpText', bg: ['ntpBackground'], min: 4.5, direction: 'text' },
  { fg: 'ntpLink', bg: ['ntpBackground'], min: 3, direction: 'text' },
]

// ---------------------------------------------------------------------------
// Seed analysis
// ---------------------------------------------------------------------------

/**
 * Turn a raw hex into everything the solver needs.
 * @returns {null | {hex:string, h:number, s:number, l:number, chroma:number}}
 */
function seedInfo(value) {
  const hex = normalizeHex(value)
  if (!hex) return null
  const rgb = parseHex(hex)
  const { h, s, l } = hexToHsl(hex)
  const max = Math.max(rgb.r, rgb.g, rgb.b)
  const min = Math.min(rgb.r, rgb.g, rgb.b)
  return { hex, h, s, l, chroma: (max - min) / 255 }
}

/**
 * Normalise user input: parse, drop invalid, de-duplicate (order preserved).
 * @param {string[]} values
 */
export function normalizeSeeds(values) {
  const seen = new Set()
  const out = []
  for (const value of values ?? []) {
    const info = seedInfo(value)
    if (!info) continue
    if (seen.has(info.hex)) continue
    seen.add(info.hex)
    out.push(info)
  }
  return out
}

/**
 * Circular mean of the chromatic seeds' hues, weighted by chroma.
 * A weighted circular mean is required — a plain average breaks across 0°/360°
 * (348° and 9° average to 178°, i.e. the exact opposite hue).
 */
function hueFamily(seeds) {
  const chromatic = seeds.filter((s) => s.chroma >= 0.06)
  if (!chromatic.length) {
    return { hue: null, chroma: 0, neutral: true, chromaticCount: 0 }
  }

  let x = 0
  let y = 0
  let weight = 0
  for (const s of chromatic) {
    const rad = (s.h * Math.PI) / 180
    x += Math.cos(rad) * s.chroma
    y += Math.sin(rad) * s.chroma
    weight += s.chroma
  }

  let hue = (Math.atan2(y / weight, x / weight) * 180) / Math.PI
  if (hue < 0) hue += 360

  return { hue, chroma: weight / chromatic.length, neutral: false, chromaticCount: chromatic.length }
}

/**
 * Group the palette's chromatic seeds into distinct hue families.
 *
 * One family is the common case: a couple of pinks are one colour as far as
 * anyone looking at the result is concerned. But the importer is handed *palette
 * cards*, and those routinely hold two or three families — a rose for the shell,
 * a cream for the page, an olive for the accent. Collapsing them into their
 * average is what made an import feel conservative: the olive disappeared and the
 * result was a monochrome tint of the first colour.
 *
 * Seeds are clustered greedily by hue distance (strongest first), and each
 * family's hue is the chroma-weighted circular mean of its members.
 *
 * @param {{h:number, chroma:number}[]} seeds
 * @param {number} [threshold] degrees; seeds further apart start separate families
 * @returns {{hue:number, chroma:number, count:number}[]} strongest family first
 */
export function hueFamilies(seeds, threshold = 26) {
  const families = []

  for (const seed of [...seeds].sort((a, b) => b.chroma - a.chroma)) {
    if (seed.chroma < 0.06) continue
    const near = families.find((family) => hueDistance(family.hue, seed.h) <= threshold)
    if (!near) {
      families.push({ hue: seed.h, weight: seed.chroma, count: 1 })
      continue
    }

    const cx = Math.cos((near.hue * Math.PI) / 180) * near.weight + Math.cos((seed.h * Math.PI) / 180) * seed.chroma
    const cy = Math.sin((near.hue * Math.PI) / 180) * near.weight + Math.sin((seed.h * Math.PI) / 180) * seed.chroma
    near.weight += seed.chroma
    near.count += 1
    let hue = (Math.atan2(cy / near.weight, cx / near.weight) * 180) / Math.PI
    if (hue < 0) hue += 360
    near.hue = hue
  }

  return families.map((family) => ({ hue: family.hue, chroma: family.weight / family.count, count: family.count }))
}

/** Shortest angular distance between two hues, 0-180. */
function hueDistance(a, b) {
  const d = Math.abs(((a - b) % 360 + 360) % 360)
  return d > 180 ? 360 - d : d
}

/**
 * The HSL saturation needed for a colour at lightness `l` to carry `chroma`
 * (max-min over 255).
 *
 * HSL saturation cannot be scaled down to make a colour paler — near white it
 * makes it *grey*: at l 96 a tint at s 12% is a 2/255 channel difference, while a
 * real card's pale pink (`#FFDCDC`) is l 93 / s 98. Chroma is the stable axis, so
 * a "this surface must still show its hue" floor is expressed in chroma and
 * converted here.
 */
function chromaToSaturation(chroma, l) {
  const denom = 1 - Math.abs(2 * (l / 100) - 1)
  if (denom <= 0.02) return 100
  return clamp((chroma / denom) * 100, 0, 100)
}

/**
 * Pick the primary colour: the most chromatic seed, biased towards a lightness
 * that actually works as a window frame.
 */
function pickPrimary(seeds, family, mode) {
  const pool = seeds.filter((s) => s.chroma >= 0.06)
  const candidates = pool.length ? pool : seeds
  const idealL = mode === 'dark' ? 26 : 68

  let best = candidates[0]
  let bestScore = -Infinity
  for (const s of candidates) {
    // Chroma dominates; lightness is a mild tie-breaker.
    const score = s.chroma * 3 - Math.abs(s.l - idealL) / 120
    if (score > bestScore) {
      bestScore = score
      best = s
    }
  }
  return best
}

/** Decide light vs dark from the seeds themselves. */
function detectMode(seeds, requested) {
  if (requested === 'light' || requested === 'dark') return requested
  const mean = seeds.reduce((sum, s) => sum + s.l, 0) / seeds.length
  // A palette that is dark on average wants a dark theme; anything else is light,
  // which is the safer default (a light theme with one dark accent is very common).
  return mean < 42 ? 'dark' : 'light'
}

/**
 * Derive a colour from the hue family at a target lightness/saturation.
 *
 * @param {object} family  result of `hueFamily`
 * @param {object} target  a `TARGETS` entry
 * @param {string} intensity
 * @param {'light'|'dark'} mode
 * @param {object} [options]
 * @param {number} [options.hue]      override the family hue (surface drift, accent)
 * @param {number} [options.minSat]   override the saturation floor
 * @param {number} [options.satScale] extra saturation multiplier (quiet surfaces)
 * @param {number} [options.chroma]   minimum chroma the result must keep, so a
 *   surface carrying a *second* hue family still shows it (see `chromaToSaturation`)
 */
function derive(family, target, intensity, mode, options = {}) {
  const { hue: hueOverride, minSat, satScale = 1, chroma } = options
  const scale = INTENSITY_SCALE[intensity] ?? 1

  if (family.neutral) {
    // No chromatic seed was supplied, so stay grey rather than inventing a hue.
    return hslToHex({ h: 0, s: 0, l: target.l })
  }

  const hue = hueOverride ?? family.hue
  // Base the saturation on how colourful the user's own palette is, so a soft
  // palette yields a soft theme instead of a suddenly vivid one. Roles that
  // carry the theme's identity (the frame) or its energy (the accent) may set a
  // floor on top of that, because chroma understates pale colours.
  const baseS = clamp(family.chroma * 100 * BASE_SATURATION_MULTIPLIER, 16, 78)
  const floor = minSat ?? target.minSat ?? (target.cat === 'accent' ? ACCENT_SATURATION_FLOOR : 0)
  const scaled = Math.max(baseS, floor) * target.s * scale * satScale
  const s = clamp(chroma ? Math.max(scaled, chromaToSaturation(chroma, target.l)) : scaled, 0, 100)
  return hslToHex({ h: hue, s, l: target.l })
}

/**
 * Find a seed close enough to the target to reuse verbatim.
 *
 * @param {Array} seeds
 * @param {object} target
 * @param {'light'|'dark'} mode
 * @param {Set<string>|null} exclude  Seeds already claimed by a stacked background
 *   role. Skipping them lets the *next nearest* seed win instead of falling
 *   straight through to a derived colour, which keeps fidelity high on palettes
 *   with several similar surfaces.
 */
function snap(seeds, target, mode, exclude = null) {
  const predicate = ELIGIBLE[mode][target.cat]
  if (!predicate) return null

  let best = null
  let bestDistance = Infinity
  for (const s of seeds) {
    if (exclude && exclude.has(s.hex)) continue
    if (!predicate(s)) continue
    const distance = Math.abs(s.l - target.l)
    if (distance < bestDistance) {
      bestDistance = distance
      best = s
    }
  }
  return best && bestDistance <= (target.tolerance ?? 9) ? best : null
}

/**
 * Pick `hue ± distance`, preferring the side that is further from the mud band.
 *
 * @param {number} hue  the palette's family hue
 * @param {number} distance  how far to travel, with the sign decided here
 * @returns {number} the resulting hue, 0-360
 */
function hueAtDistance(hue, distance) {
  const plus = (hue + distance + 360) % 360
  const minus = (hue - distance + 360) % 360
  // Ties (the seed lands equidistant from mud) fall to `plus`, which is the
  // traditional "warmer accent" direction and is safe at that distance.
  return hueDistance(plus, MUD_HUE) >= hueDistance(minus, MUD_HUE) ? plus : minus
}

/**
 * Hue for the accent role, given the user's chosen colour relationship.
 *
 * `family.hue + 20` was an unconditional drift, which is only flattering in half
 * the hue wheel: from a pink (0°) it lands on orange-brown, from a green (120°)
 * on olive. Both read as dirt. The drift is therefore signed so it always moves
 * *away* from `MUD_HUE`, and the saturated-accent floor in `derive` keeps the
 * result from sinking into a low-chroma grey. A contrasting accent needs the same
 * care: 180° from an orange (35°) is a blue-cyan (215°), which is fine, but the
 * ±120° corners of a triad can land in the band, so the side is chosen too.
 *
 * @param {number} hue  the palette's family hue
 * @param {string} [strategy]  one of `ACCENT_STRATEGIES`
 * @returns {number} the accent hue, 0-360
 */
function accentHueFor(hue, strategy = DEFAULT_ACCENT_STRATEGY) {
  return hueAtDistance(hue, ACCENT_DISTANCE[strategy] ?? ACCENT_DISTANCE.harmony)
}

/**
 * Luminance window the frame has to sit in, per mode.
 *
 * ---------------------------------------------------------------------------
 * WHY HSL LIGHTNESS IS NOT ENOUGH (the interesting bug)
 * ---------------------------------------------------------------------------
 * `TARGETS` are expressed in HSL lightness, which is *not* perceived brightness.
 * A saturated yellow at L 40% has a relative luminance of 0.49 — brighter than a
 * mid grey — because 71.5% of luminance comes from the green channel. Such a
 * frame cannot host light text at 4.5:1 (white only reaches 2.1:1 on it), and a
 * dark colour cannot work either, because the same text also has to sit on the
 * near-black `background_tab`. The pair becomes mathematically unsolvable, which
 * is exactly what the 1080-solve sweep in `verify.mjs` caught.
 *
 * The fix is to constrain the frame by what it actually *is* — a surface that
 * has to carry text — rather than by its nominal lightness:
 *   - light theme: luminance >= 0.20  so dark text clears 4.5:1 on the frame
 *   - dark theme:  luminance <= 0.18  so light text clears 4.5:1 on the frame
 * Both leave the other surface in the pair free, since `background_tab` is always
 * on the far side of the frame from the text.
 */
const FRAME_LUMINANCE = { light: { min: 0.2 }, dark: { max: 0.18 } }

/**
 * Nudge a frame colour into its mode's luminance window.
 *
 * Two phases, in this order on purpose:
 *   1. **Lightness only.** Preserves the hue and saturation the user chose, and
 *      for a dark theme it is nearly always sufficient.
 *   2. **Ease towards grey while continuing to move lightness.** Some hues (a
 *      fully saturated blue, for example) have almost no luminance headroom on
 *      the lightness axis at all — its luminance is capped at 0.0722 by the blue
 *      channel's tiny weight. Saturation is then the only remaining lever, and
 *      desaturating a surface that is too vivid to carry text is what a designer
 *      would do anyway.
 *
 * @param {string} frame   candidate frame colour
 * @param {'light'|'dark'} mode
 * @returns {string} a colour inside the window (or the closest reachable one)
 */
function confineFrameLuminance(frame, mode) {
  const inWindow = (candidate) =>
    mode === 'dark'
      ? relativeLuminance(candidate) <= FRAME_LUMINANCE.dark.max
      : relativeLuminance(candidate) >= FRAME_LUMINANCE.light.min

  if (inWindow(frame)) return frame

  const lightnessStep = mode === 'dark' ? -3 : 3
  let out = frame

  // Phase 1 — lightness only.
  for (let i = 0; i < 10 && !inWindow(out); i += 1) {
    const moved = adjustL(out, lightnessStep)
    // `adjustL` clamps, so at pure black/white the value stops changing.
    if (moved === out) break
    out = moved
  }
  if (inWindow(out)) return out

  // Phase 2 — trade saturation for luminance, one step at a time.
  const { h } = hexToHsl(out)
  let { s, l } = hexToHsl(out)
  for (let i = 0; i < 18 && !inWindow(out); i += 1) {
    s = Math.max(0, s - 8)
    l = clamp(l + lightnessStep, 0, 100)
    out = hslToHex({ h, s, l })
  }
  return out
}

/**
 * Raise `fg`'s contrast against the *worst* of several backgrounds.
 *
 * Only the foreground moves, and only as far as needed, so the palette keeps its
 * character instead of collapsing to black-on-white.
 *
 * ---------------------------------------------------------------------------
 * WHY BOTH DIRECTIONS ARE TRIED (and why the theme mode is not enough)
 * ---------------------------------------------------------------------------
 * The obvious shortcut — "dark theme => lighten the text" — is wrong whenever a
 * surface lands on the *middle* of the lightness range. A dark theme whose frame
 * came from a mid-tone seed (`#D36969`, L 62%) can only be made legible by going
 * **darker**; lightening it walks straight into white and stalls at 3.3:1.
 *
 * So both directions are explored and the smallest change that actually clears
 * the threshold wins. That preserves the derived colour's character when a small
 * nudge is enough, and only travels far when the background forces it.
 *
 * @param {string} fg
 * @param {string[]} backgrounds
 * @param {number} min  required contrast ratio
 */
function ensureContrastAgainst(fg, backgrounds, min) {
  const ratioOf = (candidate) =>
    Math.min(...backgrounds.map((background) => contrastRatio(candidate, background)))

  const attempts = []
  for (const step of [-3, 3]) {
    let current = fg
    let steps = 0
    for (let i = 0; i < 34 && ratioOf(current) < min; i += 1) {
      const moved = adjustL(current, step)
      // `adjustL` clamps, so at pure black/white the value stops changing.
      if (moved === current) break
      current = moved
      steps += 1
    }
    attempts.push({ color: current, steps, ratio: ratioOf(current) })
  }

  const passing = attempts.filter((attempt) => attempt.ratio + 1e-9 >= min)
  if (passing.length) {
    // Fewest steps = smallest visual change that still clears the bar.
    passing.sort((a, b) => a.steps - b.steps)
    return passing[0].color
  }

  // Neither direction reached the threshold: the background sits in the dead
  // zone of the lightness range. Fall back to the best readable foreground for
  // the worst background rather than leaving an illegible pair behind.
  const best = attempts.reduce((a, b) => (b.ratio > a.ratio ? b : a))
  const worstBg = backgrounds.reduce((a, b) =>
    contrastRatio(best.color, a) <= contrastRatio(best.color, b) ? a : b,
  )
  const fallback = readableTextOn(worstBg)
  return ratioOf(fallback) > best.ratio ? fallback : best.color
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Solve a full 14-role theme from 1..n seed colours.
 *
 * @param {object} options
 * @param {string[]} options.seeds        Raw hex strings (invalid ones are ignored).
 * @param {'auto'|'light'|'dark'} [options.mode='auto']
 * @param {'soft'|'balanced'|'bold'} [options.intensity='balanced']
 * @param {'harmony'|'clash'|'triad'} [options.accentStrategy='harmony']
 *   How the accent relates to the seed's hue — see `ACCENT_STRATEGIES`.
 * @returns {{
 *   ok: boolean,
 *   colors: Record<string,string>,
 *   mode: 'light'|'dark',
 *   seedsUsed: number,
 *   distinctSeedsUsed: number,
 *   seedCount: number,
 *   neutral: boolean,
 *   accentStrategy: string,
 *   notes: {key: string, vars?: Record<string, unknown>}[],
 * }}
 */
export function solveTheme({
  seeds,
  mode = 'auto',
  intensity = 'balanced',
  accentStrategy = DEFAULT_ACCENT_STRATEGY,
} = {}) {
  const strategy = ACCENT_STRATEGIES.includes(accentStrategy)
    ? accentStrategy
    : DEFAULT_ACCENT_STRATEGY
  const parsed = normalizeSeeds(seeds)

  if (!parsed.length) {
    return {
      ok: false,
      colors: {},
      mode: 'light',
      seedsUsed: 0,
      distinctSeedsUsed: 0,
      seedCount: 0,
      neutral: false,
      accentStrategy: strategy,
      notes: [],
    }
  }

  const resolvedMode = detectMode(parsed, mode)
  const family = hueFamily(parsed)
  const primary = pickPrimary(parsed, family, resolvedMode)
  const notes = []

  if (family.neutral) notes.push({ key: 'studio.noteNeutral' })

  // ------------------------------ frame ------------------------------------
  // The frame is the anchor: every other target's lightness is chosen *relative
  // to it*, so the mode has to be a constraint on the frame rather than an
  // independent wish.
  //
  // Without this clamp a mid-tone seed in dark mode (#D36969, L 62%) becomes a
  // mid-tone frame, and then the inactive-tab text needs to be BOTH lighter than
  // that frame (to read on it) and darker than the near-black background tab —
  // which is impossible for one colour. Clamping the frame into the mode's band
  // makes every text pair solvable at once, and the seed's hue and saturation
  // still drive the whole theme.
  const FRAME_BAND = { light: [56, 84], dark: [18, 40] }
  const [minFrameL, maxFrameL] = FRAME_BAND[resolvedMode]
  const frameL = clamp(primary.l, minFrameL, maxFrameL)

  let frame
  if (frameL === primary.l) {
    frame = primary.hex
  } else if (family.neutral) {
    frame = hslToHex({ h: 0, s: 0, l: frameL })
  } else {
    frame = derive(family, { l: frameL, s: 0.95, minSat: FRAME_SATURATION_FLOOR }, intensity, resolvedMode)
  }

  // The band above fixes HSL lightness; this fixes actual luminance (see
  // FRAME_LUMINANCE). Together they guarantee every text pair is solvable.
  frame = confineFrameLuminance(frame, resolvedMode)

  const frameSeedUsed = frame === primary.hex
  const colors = { frame }

  // The frame is a background too, so if it consumed a seed no other stacked
  // surface may reuse that seed — otherwise the toolbar comes back identical to
  // the frame and the window loses its only separating edge.
  const claimedBackgroundSeeds = new Set()
  if (frameSeedUsed) claimedBackgroundSeeds.add(primary.hex)

  if (!frameSeedUsed) notes.push({ key: 'studio.noteFrameAdjusted', vars: { hex: primary.hex } })

  // frame_inactive: same hue, lifted, desaturated (this is what Chrome does for
  // an unfocused window, so it should never be a fully independent colour).
  const frameLActual = hexToHsl(frame).l
  colors.frameInactive = family.neutral
    ? hslToHex({ h: 0, s: 0, l: clamp(frameLActual + (resolvedMode === 'dark' ? 6 : 9), 0, 92) })
    : derive(
        family,
        { l: clamp(frameLActual + (resolvedMode === 'dark' ? 6 : 9), 0, 92), s: 0.55 },
        intensity,
        resolvedMode,
        { hue: family.hue + (SURFACE_HUE_DRIFT.frameInactive ?? 0) },
      )

  // --------------------------- accent hue ----------------------------------
  // A hue the user actually gave us always wins: if their palette holds a
  // genuinely different colour, that *is* their accent, and overriding it with a
  // computed one would throw their input away.
  //
  // Which seed wins the accent is scored by chroma *times* distance rather than
  // by chroma alone. On a palette card the interesting colour is the one that
  // clashes — scoring by chroma alone picks whichever family happens to be most
  // saturated, which is often the one already carrying the shell, so the clash is
  // lost and the theme comes back monochrome.
  //
  // Rivals are measured against the **frame's** hue, not the mean of all the
  // seeds: the frame comes from one seed, and a palette whose mean sits between
  // families (rose + cream + olive) otherwise counts the frame's own family as a
  // rival — the "second colour" ends up being the first one again.
  const families = family.neutral ? [] : hueFamilies(parsed)
  const frameHue = hexToHsl(frame).h
  const rivals = family.neutral
    ? []
    : families
        .filter((entry) => hueDistance(entry.hue, frameHue) > 26)
        .sort(
          (a, b) =>
            b.chroma * hueDistance(b.hue, frameHue) - a.chroma * hueDistance(a.hue, frameHue),
        )

  /**
   * The other family that gets to colour the page-side surfaces — the *second*
   * rival, so that on a three-family card the punchiest family can take the
   * accent while this one still shows up in the surfaces.
   */
  const secondaryFamily = rivals[1] ?? null

  let accentHue = null
  let accentFromSeeds = false
  if (!family.neutral) {
    accentFromSeeds = rivals.length > 0
    accentHue = accentFromSeeds ? rivals[0].hue : accentHueFor(frameHue, strategy)
  }

  /**
   * Chroma floor for an accent taken from the user's palette.
   *
   * Their clash colour is often *muted* on purpose (a sage, a dusty olive): used
   * verbatim as the accent it lands next to a pastel surface and reads as "one
   * more muted colour", which is the conservative result the importer kept
   * producing. Pushing it to a clearly-colourful chroma keeps the hue — the part
   * the user chose — while letting it do the job an accent does. A palette that
   * already supplied a vivid clash is untouched.
   */
  const accentChroma = accentFromSeeds ? Math.max(rivals[0].chroma, 0.3) : undefined
  /** Set when the accent role itself was filled by one of the user's colours. */
  let accentSnapped = false

  // The third corner of the wheel, for the strategies that use one. `clash` has
  // no third corner of its own (its mirror is the accent itself), so its window
  // buttons join the accent instead.
  const thirdHue = family.neutral ? null : (2 * family.hue - accentHue + 720) % 360
  const buttonHue = family.neutral
    ? undefined
    : strategy === 'triad'
      ? thirdHue
      : strategy === 'clash'
        ? accentHue
        : family.hue + (SURFACE_HUE_DRIFT.buttonBackground ?? 0)

  const surfaceSatScale = SURFACE_SAT_SCALE[strategy] ?? 1
  const accentFloor = ACCENT_FLOOR[strategy] ?? ACCENT_SATURATION_FLOOR
  /**
   * Floor for the window buttons when they carry a second hue.
   *
   * Surfaces are derived from the seed's chroma, which for a soft seed is low
   * enough that a third hue arrives as a grey — the strategy would then be
   * invisible on the one element that shows it, and a note claiming otherwise
   * would be a lie. The floor is pre-multiplier on purpose: `derive` scales it by
   * the role's own factor, so it lands around 20% saturation in the output.
   */
  const buttonFloor = strategy === 'harmony' ? undefined : 30

  /**
   * Roles that carry the palette's *second* colour family.
   *
   * The toolbar and the page surfaces are where a second colour reads as part of
   * the design rather than as a mistake: the window frame stays the seed's own
   * colour, so the theme keeps its identity while the other family shows up in
   * the strips around it. These are exactly the roles a palette card's second
   * colour is asking to become — without them the card's olive or cream is
   * averaged away and the import comes back monochrome.
   */
  const SECOND_FAMILY_ROLES = new Set(['toolbar', 'ntpBackground', 'omniboxBackground'])

  /**
   * Hue for one role: the accent, the third corner, a second-family surface, a
   * drifted surface, or the family itself (`undefined` lets `derive` use
   * `family.hue`).
   */
  const hueFor = (fieldId) => {
    if (fieldId === 'ntpLink') return accentHue ?? undefined
    if (fieldId === 'buttonBackground') return buttonHue
    if (secondaryFamily && SECOND_FAMILY_ROLES.has(fieldId)) {
      return secondaryFamily.hue + (SURFACE_HUE_DRIFT[fieldId] ?? 0)
    }
    const drift = SURFACE_HUE_DRIFT[fieldId]
    return drift ? family.hue + drift : undefined
  }

  // -------------------- remaining roles: snap, else derive ------------------
  const targets = TARGETS[resolvedMode]
  for (const fieldId of FIELD_IDS) {
    if (fieldId === 'frame' || fieldId === 'frameInactive') continue
    const target = targets[fieldId]
    if (!target) continue

    // One seed, one stacked surface — see BACKGROUND_CATS.
    const claimsBackground = BACKGROUND_CATS.has(target.cat)
    const hit = snap(parsed, target, resolvedMode, claimsBackground ? claimedBackgroundSeeds : null)
    if (hit) {
      colors[fieldId] = hit.hex
      if (claimsBackground) claimedBackgroundSeeds.add(hit.hex)
      if (fieldId === 'ntpLink') accentSnapped = true
      continue
    }

    colors[fieldId] = derive(family, target, intensity, resolvedMode, {
      hue: hueFor(fieldId),
      minSat:
        target.cat === 'accent'
          ? accentFloor
          : fieldId === 'buttonBackground'
            ? buttonFloor
            : undefined,
      // Quiet surfaces are what let a contrasting accent be the loudest thing on
      // screen; text and accent roles keep their own saturation.
      satScale: BACKGROUND_CATS.has(target.cat) ? surfaceSatScale : 1,
      // A second family has to be *visible*: the base saturation comes from the
      // first family's chroma, so a soft seed would render the other colour as
      // grey, and the imported card would again read as one colour.
      chroma: target.cat === 'accent'
        ? accentChroma
        : secondaryFamily && SECOND_FAMILY_ROLES.has(fieldId)
          ? 0.08
          : undefined,
    })
  }

  /**
   * Let a user-supplied accent be an accent.
   *
   * A snapped accent is the user's colour verbatim, which is right — but those
   * clash colours are often muted on purpose (a sage, a dusty olive). Next to a
   * pastel surface a muted clash reads as one more muted colour, and that is the
   * conservative result the importer kept producing: the hue is theirs, only the
   * colourfulness of it is turned up, keeping hue and lightness (the contrast
   * pass below still has the last word on legibility).
   */
  if ((accentFromSeeds || accentSnapped) && !family.neutral && colors.ntpLink) {
    const hsl = hexToHsl(colors.ntpLink)
    const floor = chromaToSaturation(0.34, hsl.l)
    if (hsl.s < floor) colors.ntpLink = hslToHex({ ...hsl, s: floor })
  }

  // ----------------------------- contrast pass -----------------------------
  for (const rule of CONTRAST_RULES) {
    const backgrounds = rule.bg.map((id) => colors[id]).filter(Boolean)
    if (!backgrounds.length || !colors[rule.fg]) continue
    colors[rule.fg] = ensureContrastAgainst(colors[rule.fg], backgrounds, rule.min)
  }

  const usedHexes = new Set(parsed.map((s) => s.hex))
  const seedsUsed = Object.values(colors).filter((c) => usedHexes.has(c)).length
  // `usedSeedHexes` normalises its input, so it needs the hex strings — passing
  // the parsed records made it return 0 for every palette, and the panel then
  // claimed "0 of 4 colours were used directly" on perfectly good imports.
  const distinctSeedsUsed = usedSeedHexes(
    colors,
    parsed.map((seed) => seed.hex),
  ).length

  // Only worth saying when the user actually supplied a palette.
  if (parsed.length > 1) {
    notes.push({
      key: 'studio.noteSeedsUsed',
      vars: { used: distinctSeedsUsed, total: parsed.length },
    })
  }

  // Say out loud what the strategy did — otherwise a contrasting accent looks
  // like the solver drifted off on its own.
  if (!family.neutral && !accentFromSeeds && !accentSnapped && strategy !== 'harmony') {
    notes.push({
      key: strategy === 'triad' ? 'studio.noteTriad' : 'studio.noteClash',
      vars: { hex: colors.ntpLink, third: colors.buttonBackground },
    })
  }

  // …and which of the user's own colours went where, when the palette held more
  // than one family. Turning a card into a theme is the point of the importer, so
  // the result should be traceable back to the card.
  if (secondaryFamily) {
    notes.push({
      key: 'studio.noteMultiFamily',
      vars: { count: families.length, surfaces: colors.ntpBackground, accent: colors.ntpLink },
    })
  }

  return {
    ok: true,
    colors,
    mode: resolvedMode,
    seedsUsed: Math.min(seedsUsed, parsed.length),
    distinctSeedsUsed,
    seedCount: parsed.length,
    neutral: family.neutral,
    accentStrategy: strategy,
    /** The palette's hue families, strongest first (importers show them). */
    families,
    notes,
  }
}

/**
 * Which seeds actually survived into the result. Used by the UI to show fidelity
 * ("3 of 4 colours from your palette were used directly").
 */
export function usedSeedHexes(colors, seeds) {
  const used = new Set(Object.values(colors ?? {}))
  return (seeds ?? []).map(normalizeHex).filter((hex) => hex && used.has(hex))
}
