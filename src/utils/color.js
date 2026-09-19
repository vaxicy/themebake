/**
 * Colour utilities.
 *
 * Everything in ThemeBake is stored as a 6-digit uppercase hex string
 * (`#RRGGBB`). Conversion to whatever Chrome wants happens only in
 * `utils/manifest.js`, so the UI layer never deals with manifest formats.
 */

const HEX_SHORT = /^#?([0-9a-fA-F]{3})$/
const HEX_LONG = /^#?([0-9a-fA-F]{6})$/

/**
 * Parse a hex string into `{ r, g, b }`.
 * Accepts `#RGB`, `RGB`, `#RRGGBB`, `RRGGBB` (case insensitive).
 * @param {string} value
 * @returns {{r:number,g:number,b:number}|null} null when the input is not valid
 */
export function parseHex(value) {
  if (typeof value !== 'string') return null
  const input = value.trim()
  if (!input) return null

  const short = HEX_SHORT.exec(input)
  if (short) {
    const [r, g, b] = short[1].split('').map((c) => parseInt(c + c, 16))
    return { r, g, b }
  }

  const long = HEX_LONG.exec(input)
  if (long) {
    const n = long[1]
    return {
      r: parseInt(n.slice(0, 2), 16),
      g: parseInt(n.slice(2, 4), 16),
      b: parseInt(n.slice(4, 6), 16),
    }
  }

  return null
}

/** @returns {boolean} true when `value` is a parsable hex colour. */
export function isValidHex(value) {
  return parseHex(value) !== null
}

/** Normalise any accepted hex form to `#RRGGBB` (uppercase). @returns {string|null} */
export function normalizeHex(value) {
  const rgb = parseHex(value)
  return rgb ? rgbToHex(rgb) : null
}

/** @param {{r:number,g:number,b:number}} param0 @returns {string} `#RRGGBB` */
export function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map((c) => clampByte(c).toString(16).padStart(2, '0')).join('').toUpperCase()
}

/** @returns {[number,number,number]} integers in 0-255 */
export function hexToRgbArray(hex) {
  const rgb = parseHex(hex)
  if (!rgb) return [0, 0, 0]
  return [rgb.r, rgb.g, rgb.b]
}

/** `#RRGGBB` -> `{ h: 0-360, s: 0-100, l: 0-100 }`. */
export function hexToHsl(hex) {
  const { r, g, b } = parseHex(hex) ?? { r: 0, g: 0, b: 0 }
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  return { h, s: s * 100, l: l * 100 }
}

/** `{ h, s, l }` (h in degrees, s/l in percent) -> `#RRGGBB`. */
export function hslToHex({ h, s, l }) {
  const hn = ((h % 360) + 360) % 360
  const sn = clamp(s, 0, 100) / 100
  const ln = clamp(l, 0, 100) / 100

  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1))
  const m = ln - c / 2

  let rgb
  if (hn < 60) rgb = [c, x, 0]
  else if (hn < 120) rgb = [x, c, 0]
  else if (hn < 180) rgb = [0, c, x]
  else if (hn < 240) rgb = [0, x, c]
  else if (hn < 300) rgb = [x, 0, c]
  else rgb = [c, 0, x]

  return rgbToHex({
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  })
}

/** HSL helpers used by the randomiser and the presets. */
export function withL(hex, l) {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, l })
}

export function adjustL(hex, delta) {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, l: hsl.l + delta })
}

export function adjustS(hex, delta) {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, s: hsl.s + delta })
}

/** Linear interpolation between two hex colours. `t` in 0-1. */
export function mix(a, b, t) {
  const ca = parseHex(a) ?? { r: 0, g: 0, b: 0 }
  const cb = parseHex(b) ?? { r: 0, g: 0, b: 0 }
  const k = clamp(t, 0, 1)
  return rgbToHex({
    r: Math.round(ca.r + (cb.r - ca.r) * k),
    g: Math.round(ca.g + (cb.g - ca.g) * k),
    b: Math.round(ca.b + (cb.b - ca.b) * k),
  })
}

/** Relative luminance per WCAG 2.1. */
export function relativeLuminance(hex) {
  const { r, g, b } = parseHex(hex) ?? { r: 0, g: 0, b: 0 }
  const channel = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio, 1 - 21. */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const light = Math.max(la, lb)
  const dark = Math.min(la, lb)
  return (light + 0.05) / (dark + 0.05)
}

/** Pick a legible foreground for a given background. */
export function readableTextOn(background, light = '#FFFFFF', dark = '#1B1B1F') {
  return contrastRatio(background, light) >= contrastRatio(background, dark) ? light : dark
}

/** `#RRGGBB` + alpha -> `rgba(r, g, b, a)` for CSS-only usages in the mockup. */
export function withAlpha(hex, alpha) {
  const [r, g, b] = hexToRgbArray(hex)
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function clampByte(value) {
  return Math.round(clamp(Number(value) || 0, 0, 255))
}

/** Deterministic tiny PRNG so randomise is testable and never returns NaN. */
export function createRandom(seed = Math.floor(Math.random() * 2 ** 31)) {
  let state = seed % 2147483647
  if (state <= 0) state += 2147483646
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}
