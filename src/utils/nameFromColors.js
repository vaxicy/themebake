/**
 * Derive a human, on-brand theme name (and matching folder name) from a palette.
 *
 * The goal is the convention the app already uses elsewhere: a two-word,
 * Title-Case colour description plus a literal "Theme" suffix — e.g.
 * "Lemon Juice Theme" — with the folder as its lower-case, dash-separated twin
 * "lemon-juice-theme". Three words in the name, a dash in the folder.
 *
 * The mapping is *deterministic* (no RNG): the same palette always yields the
 * same name, so tests can assert exact strings and repeating a randomise that
 * happened to land on the same hue reproduces the label. Variety comes from the
 * palette's own metrics — hue picks the colour word, while saturation/lightness
 * pick the texture word — so the result still reads as "matched to the colours"
 * rather than a fixed lookup.
 *
 * Only `colors.frame` is inspected: it is the dominant chrome colour and the
 * one the random generator and solver both treat as the anchor, so it is the
 * most representative single swatch. The dark/light split is taken from its
 * lightness.
 */

import { hexToHsl } from './color.js'
import { toThemeFolderName } from './package.js'

/**
 * Twelve 30°-wide hue buckets, each with a short list of colour adjectives.
 * The list is indexed deterministically by hue+saturation so neighbours still
 * vary a little instead of always returning the first word.
 * @type {string[][]}
 */
const HUE_WORDS = [
  ['Ruby', 'Crimson', 'Rose'], //   0°   red
  ['Coral', 'Amber', 'Ember'], //  30°   orange
  ['Lemon', 'Honey', 'Marigold'], //  60°   yellow
  ['Lime', 'Pear', 'Citron'], //  90°   chartreuse
  ['Mint', 'Sage', 'Jade'], // 120°   green
  ['Teal', 'Seafoam', 'Fern'], // 150°   spring green
  ['Sky', 'Cerulean', 'Lagoon'], // 180°   cyan
  ['Azure', 'Periwinkle', 'Cobalt'], // 210°   azure
  ['Indigo', 'Iris', 'Denim'], // 240°   blue
  ['Lavender', 'Lilac', 'Orchid'], // 270°   violet
  ['Plum', 'Magenta', 'Orchid'], // 300°   magenta
  ['Blush', 'Rose', 'Fuchsia'], // 330°   pink
]

/** Pick a list element without going out of bounds for negative/large keys. */
function pick(arr, key) {
  const idx = ((Math.floor(key) % arr.length) + arr.length) % arr.length
  return arr[idx]
}

function colorWord(h, s) {
  const bucket = Math.floor((((h % 360) + 360) % 360) / 30) % HUE_WORDS.length
  return pick(HUE_WORDS[bucket], h + s)
}

function textureWord(h, s, l, dark) {
  let words
  if (dark) {
    words = s < 26 ? ['Soot', 'Slate', 'Ink', 'Shadow'] : ['Ember', 'Night', 'Velvet', 'Soda']
  } else if (s < 22) {
    words = ['Mist', 'Fog', 'Haze', 'Sand', 'Stone', 'Pearl']
  } else if (l > 82) {
    words = ['Cream', 'Cloud', 'Frost', 'Snow']
  } else {
    words = ['Velvet', 'Juice', 'Matcha', 'Souffle', 'Dew', 'Pop']
  }
  return pick(words, h + l)
}

/**
 * @param {Record<string,string>} colors  fieldId -> `#RRGGBB`
 * @returns {{ name: string, folder: string }}
 *   `name`  is e.g. "Lemon Juice Theme" (three words, Title Case).
 *   `folder` is e.g. "lemon-juice-theme" — the lower-case, dash-separated theme
 *   name, produced through `toThemeFolderName` so reserved-name and length rules
 *   are shared with the rest of the app.
 */
export function suggestThemeName(colors) {
  const frame = colors?.frame || '#888888'
  const { h, s, l } = hexToHsl(frame)
  const dark = l < 50

  const adjective = colorWord(h, s)
  const noun = textureWord(h, s, l, dark)
  const name = `${adjective} ${noun} Theme`
  return { name, folder: toThemeFolderName(name) }
}
