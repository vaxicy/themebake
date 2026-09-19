/**
 * Contrast audit — "体检".
 *
 * The solver guarantees legible pairs, but once a user hand-edits a colour that
 * guarantee is gone. This module re-checks the pairs that actually matter in
 * Chrome and reports failures in a form the UI can localise.
 *
 * It returns **field ids and numbers only** — never sentences — so the caller
 * can build a localised message via `t('field.<id>.label')` + `t('audit.pair')`.
 */

import { adjustL, contrastRatio, hexToHsl, normalizeHex } from './color.js'

/** Pairs that must be legible in the real browser. */
export const AUDIT_RULES = [
  { fg: 'tabText', bg: 'frame', min: 4.5 },
  { fg: 'tabBackgroundText', bg: 'frame', min: 3.5 },
  { fg: 'tabBackgroundText', bg: 'backgroundTab', min: 3.5 },
  { fg: 'bookmarkText', bg: 'toolbar', min: 3.5 },
  { fg: 'toolbarButtonIcon', bg: 'toolbar', min: 3 },
  { fg: 'omniboxText', bg: 'omniboxBackground', min: 4.5 },
  { fg: 'ntpText', bg: 'ntpBackground', min: 4.5 },
  { fg: 'ntpLink', bg: 'ntpBackground', min: 3 },
]

/**
 * @typedef {Object} ContrastIssue
 * @property {string} fg    field id of the foreground
 * @property {string} bg    field id of the background
 * @property {number} ratio measured contrast ratio
 * @property {number} min   required ratio
 */

/**
 * @param {Record<string,string>} colors  fieldId -> hex
 * @returns {ContrastIssue[]} empty when everything passes
 */
export function auditContrast(colors) {
  const issues = []
  if (!colors) return issues

  for (const rule of AUDIT_RULES) {
    const fg = normalizeHex(colors[rule.fg])
    const bg = normalizeHex(colors[rule.bg])
    if (!fg || !bg) continue

    const ratio = contrastRatio(fg, bg)
    // 1e-9 guards float noise on an exactly-equal pair (e.g. 4.499999999).
    if (ratio + 1e-9 < rule.min) {
      issues.push({ fg: rule.fg, bg: rule.bg, ratio, min: rule.min })
    }
  }

  // Worst offenders first — most useful when several pairs fail at once.
  return issues.sort((a, b) => a.ratio / a.min - b.ratio / b.min)
}

/** Convenience for the preview: `true` when the theme has no contrast problems. */
export function contrastOk(colors) {
  return auditContrast(colors).length === 0
}

/**
 * Move foregrounds until every audited pair clears its threshold.
 *
 * Design constraints, in order of importance:
 *  1. **Only foregrounds move.** Backgrounds carry the theme's identity (frame,
 *     toolbar, NTP) and shifting them would change what the user designed.
 *  2. **Only as far as necessary.** The step is small so a 4.4:1 pair gains the
 *     minimum instead of collapsing to black-on-white.
 *  3. **Deterministic and bounded.** No randomness, and a hard iteration cap, so
 *     an impossible pair (e.g. a mid-grey on mid-grey) terminates instead of
 *     looping.
 *
 * One foreground can be judged against several backgrounds (inactive tab text
 * sits on both `frame` and `background_tab`), so rules are grouped by foreground
 * and the loop targets the *worst* ratio of the group. This avoids the two rules
 * fighting each other and oscillating the colour.
 *
 * @param {Record<string,string>} colors
 * @returns {{colors: Record<string,string>, changed: number}} `changed` counts
 *   foregrounds whose value actually moved.
 */
export function repairContrast(colors) {
  const next = { ...(colors ?? {}) }
  if (!colors) return { colors: next, changed: 0 }

  /** @type {Map<string, {bg:string, min:number}[]>} */
  const byForeground = new Map()
  for (const rule of AUDIT_RULES) {
    const list = byForeground.get(rule.fg) ?? []
    list.push({ bg: rule.bg, min: rule.min })
    byForeground.set(rule.fg, list)
  }

  let changed = 0

  for (const [fgId, rules] of byForeground) {
    const start = normalizeHex(next[fgId])
    if (!start) continue

    const pairs = rules
      .map((rule) => ({ bg: normalizeHex(next[rule.bg]), min: rule.min }))
      .filter((pair) => pair.bg)
    if (!pairs.length) continue

    /** Worst (ratio / required) across the group. 1 or more means "fine". */
    const worst = (candidate) =>
      Math.min(...pairs.map((pair) => contrastRatio(candidate, pair.bg) / pair.min))

    if (worst(start) + 1e-9 >= 1) continue

    // Light backgrounds want darker text and vice versa. Averaging the group's
    // background lightness gives one direction for the whole group.
    const meanBgL = pairs.reduce((sum, pair) => sum + hexToHsl(pair.bg).l, 0) / pairs.length
    const step = meanBgL < 50 ? 3 : -3

    let current = start
    for (let i = 0; i < 44 && worst(current) + 1e-9 < 1; i += 1) {
      const moved = adjustL(current, step)
      // `adjustL` clamps, so at pure black/white the value stops changing.
      if (moved === current) break
      current = moved
    }

    if (current !== start) {
      next[fgId] = current
      changed += 1
    }
  }

  return { colors: next, changed }
}
