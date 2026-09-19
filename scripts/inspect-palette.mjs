#!/usr/bin/env node
/**
 * ============================================================================
 *  inspect-palette.mjs — print what the solver does with a given seed/palette
 * ============================================================================
 *
 *  Development aid, not part of the build or of `verify.mjs`. When a generated
 *  theme looks wrong, `verify.mjs` only tells you that contrast still holds —
 *  it cannot tell you *why* the result reads badly. This prints the decision
 *  behind every role: hue, saturation, lightness, relative luminance and
 *  whether the value is a seed reused verbatim or a derived colour.
 *
 *  It also reports the two numbers that actually predict whether a theme will
 *  look "washed out" or "flat":
 *
 *    min surface separation  smallest relative-luminance gap across every pair
 *                            of stacked surfaces; 0.000 means two roles are the
 *                            same colour and the window has no depth
 *    accents at low chroma   the accent must not land in the orange-olive mud
 *                            band (hue 30-60) at low saturation
 *
 *  Usage:
 *    node scripts/inspect-palette.mjs "#F5CBCB"
 *    node scripts/inspect-palette.mjs "#FFF5F5" "#F7D6D0" "#E2B4BD" "#4A4A4A"
 *    node scripts/inspect-palette.mjs "#F5CBCB" --mode dark --intensity bold
 * ============================================================================
 */

import { solveTheme, usedSeedHexes, INTENSITIES, SOLVER_MODES } from '../src/utils/palette.js'
import { contrastRatio, hexToHsl, relativeLuminance } from '../src/utils/color.js'

const argv = process.argv.slice(2)
const flag = (name, fallback) => {
  const at = argv.indexOf(`--${name}`)
  return at === -1 ? fallback : argv[at + 1]
}
const seeds = argv.filter((a) => !a.startsWith('--') && !INTENSITIES.includes(a) && !SOLVER_MODES.includes(a))

if (!seeds.length) {
  console.error('usage: node scripts/inspect-palette.mjs <#hex> [more #hex ...] [--mode auto|light|dark] [--intensity soft|balanced|bold]')
  process.exit(1)
}

const mode = flag('mode', 'auto')
const intensity = flag('intensity', 'balanced')

const STACKED = [
  'frame',
  'frameInactive',
  'toolbar',
  'backgroundTab',
  'buttonBackground',
  'omniboxBackground',
  'ntpBackground',
]

const role = (hex) => {
  const { h, s, l } = hexToHsl(hex)
  return `h=${String(h.toFixed(0)).padStart(3)} s=${String(s.toFixed(0)).padStart(3)} L=${String(
    l.toFixed(0),
  ).padStart(3)} Y=${relativeLuminance(hex).toFixed(3)}`
}

const result = solveTheme({ seeds, mode, intensity })
if (!result.ok) {
  console.error('solver returned ok:false — no valid seeds')
  process.exit(1)
}

console.log(`seeds      ${seeds.join(' ')}`)
console.log(`mode       ${mode} (resolved: ${result.mode})`)
console.log(`intensity  ${intensity}`)
console.log(`reused     ${usedSeedHexes(result.colors, seeds).length} of ${result.seedCount} seeds verbatim`)
console.log('-'.repeat(92))

const GROUPS = [
  ['STACKED SURFACES', STACKED],
  ['TEXT', ['tabText', 'tabBackgroundText', 'toolbarButtonIcon', 'omniboxText', 'bookmarkText', 'ntpText']],
  ['ACCENT', ['ntpLink']],
]

const seedSet = new Set(seeds.map((s) => s.toUpperCase()))
for (const [label, ids] of GROUPS) {
  for (const id of ids) {
    const hex = result.colors[id]
    if (!hex) continue
    const tag = seedSet.has(hex.toUpperCase()) ? '  <- exact seed' : ''
    console.log(`  ${label.padEnd(17)} ${id.padEnd(19)} ${hex}  ${role(hex)}${tag}`)
  }
}

console.log('-'.repeat(92))
const PAIRS = [
  ['tabText / frame', 'tabText', 'frame', 4.5],
  ['tabBackgroundText / frame', 'tabBackgroundText', 'frame', 3.5],
  ['tabBackgroundText / backgroundTab', 'tabBackgroundText', 'backgroundTab', 3.5],
  ['bookmarkText / toolbar', 'bookmarkText', 'toolbar', 3.5],
  ['toolbarButtonIcon / toolbar', 'toolbarButtonIcon', 'toolbar', 3],
  ['omniboxText / omniboxBackground', 'omniboxText', 'omniboxBackground', 4.5],
  ['ntpText / ntpBackground', 'ntpText', 'ntpBackground', 4.5],
  ['ntpLink / ntpBackground', 'ntpLink', 'ntpBackground', 3],
]
for (const [label, fg, bg, min] of PAIRS) {
  const ratio = contrastRatio(result.colors[fg], result.colors[bg])
  const mark = ratio + 1e-9 >= min ? '' : '   <-- FAILS'
  console.log(`  ${label.padEnd(35)} ${ratio.toFixed(2).padStart(6)}  (min ${min})${mark}`)
}

// --- the two aesthetics predictors -----------------------------------------
let separation = Infinity
let worstPair = ''
for (let i = 0; i < STACKED.length; i += 1) {
  for (let j = i + 1; j < STACKED.length; j += 1) {
    const a = result.colors[STACKED[i]]
    const b = result.colors[STACKED[j]]
    const gap = Math.abs(relativeLuminance(a) - relativeLuminance(b))
    if (gap < separation) {
      separation = gap
      worstPair = `${STACKED[i]} vs ${STACKED[j]} (${a} / ${b})`
    }
  }
}
console.log('-'.repeat(92))
console.log(`  min surface separation   dY=${separation.toFixed(4)}   ${worstPair}`)

const link = result.colors.ntpLink
const linkHsl = hexToHsl(link)
const inMud = linkHsl.h >= 30 && linkHsl.h <= 60
console.log(
  `  accent                   ${link}  h=${linkHsl.h.toFixed(0)} s=${linkHsl.s.toFixed(0)}  ` +
    `${inMud && linkHsl.s < 35 ? '<-- MUDDY (orange-olive band at low saturation)' : 'clear of the mud band'}`,
)
console.log(`  notes                    ${result.notes.map((n) => n.key).join(', ') || '(none)'}`)
