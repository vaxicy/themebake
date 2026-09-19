/**
 * Colour extraction from arbitrary pasted text.
 *
 * Handles everything a designer realistically pastes:
 *   - `#FFF` / `#FFFFFF` hex lists, space / comma / newline separated
 *   - bare hex without `#`  (`FFF5F5 F7D6D0 E2B4BD 4A4A4A`)
 *   - `rgb(255, 245, 245)` and `rgba(...)`
 *   - palette links: `coolors.co/palette/fff5f5-f7d6d0-e2b4bd-4a4a4a`
 *     — parsed purely as a string, so there is no network request and no CORS risk
 *
 * ---------------------------------------------------------------------------
 * FALSE-POSITIVE GUARD (why the bare-hex rule is not simply /[0-9a-f]{6}/)
 * ---------------------------------------------------------------------------
 * `decade`, `facade`, `beaded` and `efface` are all valid 6-character hex
 * strings. Matching bare hex naively turns ordinary prose into colours.
 * Therefore:
 *   1. `#`-prefixed hex is always trusted — it is unambiguous.
 *   2. Bare 6-char hex is only considered when **no** `#`-prefixed hex exists
 *      anywhere in the text, and the token must contain at least one digit.
 *      That rejects every English word above while keeping `4A4A4A` and `FFF5F5`
 *      working, which is what real palette dumps look like.
 */

import { normalizeHex, rgbToHex } from './color.js'

const HEX_PREFIXED = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g
const HEX_BARE = /(?:^|[^0-9a-zA-Z])([0-9a-fA-F]{6})(?![0-9a-zA-Z])/g
const RGB_FN = /rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*(?:[,/]\s*[\d.]+%?\s*)?\)/g

/**
 * Extract every distinct colour from a block of text, preserving encounter order.
 *
 * Order is preserved deliberately: a palette card is usually laid out
 * light-to-dark, and keeping that order makes the role assignment predictable.
 *
 * @param {string} text
 * @returns {string[]} `#RRGGBB` strings, de-duplicated
 */
export function extractColors(text) {
  if (typeof text !== 'string' || !text.trim()) return []

  const found = []
  const push = (hex) => {
    const normalized = normalizeHex(hex)
    if (normalized && !found.includes(normalized)) found.push(normalized)
  }

  // 1. `#`-prefixed hex — always trusted.
  let prefixedCount = 0
  for (const match of text.matchAll(HEX_PREFIXED)) {
    prefixedCount += 1
    push(match[1])
  }

  // 2. Bare hex — only when there is no `#`-prefixed hex to work with, and only
  //    for tokens containing a digit (see the false-positive guard above).
  if (prefixedCount === 0) {
    for (const match of text.matchAll(HEX_BARE)) {
      if (/\d/.test(match[1])) push(match[1])
    }
  }

  // 3. rgb() / rgba() functions.
  for (const match of text.matchAll(RGB_FN)) {
    const [r, g, b] = [match[1], match[2], match[3]].map(Number)
    if ([r, g, b].every((n) => Number.isFinite(n) && n >= 0 && n <= 255)) {
      push(rgbToHex({ r, g, b }))
    }
  }

  return found
}

/**
 * Cheap heuristic used to route a paste to the right importer before we pay for
 * `JSON.parse` on a large manifest.
 * @param {string} text
 */
export function looksLikeJson(text) {
  if (typeof text !== 'string') return false
  const trimmed = text.trim()
  return trimmed.startsWith('{') || trimmed.startsWith('[') || /"theme"\s*:/.test(trimmed)
}

/**
 * Detect a palette URL so the UI can say "read from the link" rather than
 * "found 4 colours that happen to appear in this URL".
 * @param {string} text
 */
export function looksLikePaletteUrl(text) {
  return typeof text === 'string' && /https?:\/\/[^\s]*(coolors|color\.adobe|colorhunt|paletton)/i.test(text)
}
