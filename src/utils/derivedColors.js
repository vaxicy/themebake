/**
 * Derived colours: the 10 Chrome keys that complete mode adds beyond the 14 that
 * the editor exposes, plus the 6 `theme.tints` entries.
 *
 * WHY DERIVE INSTEAD OF ASK
 * -------------------------
 * The 14 editable fields cover everything a user can meaningfully judge by eye.
 * The remaining 10 keys describe states most people never inspect:
 *   - incognito frame and tab colours
 *   - the *inactive window* variants of the background tab
 *   - the NTP heading colour
 *   - `toolbar_text` (toolbar tooltip / extension-name text)
 * Asking for them would add ten colour pickers nobody wants, and hand-editing
 * them is exactly how a theme ends up with an unreadable combination.
 *
 * So they are computed deterministically from the palette the user already
 * tuned. Every rule is listed in DERIVATIONS below — no hidden heuristics.
 *
 * WHY TINTS
 * ---------
 * `theme.tints` is `kTintTable` in browser_theme_pack.cc: 6 keys, each an HSL
 * triple with channels normalised to 0-1. Chrome applies a tint as a *shift*
 * over its own built-in artwork, not as a literal colour.
 *
 * Emitting the colour's own HSL is therefore the semantically correct choice:
 * asking Chrome to shift the default frame to `frame`, the default toolbar to
 * `toolbar`, and so on. Because the same keys are also set literally in
 * `theme.colors`, the tint is belt-and-braces — it keeps the manifest coherent
 * if a future Chrome build ever prefers the tinted resource.
 */

import {
  EXTENDED_COLOR_FIELDS,
  TINT_KEYS,
} from '../data/themeFields.js'
import { adjustL, hexToHsl, normalizeHex, parseHex } from './color.js'

/**
 * How each extended colour is produced.
 *
 * - `copy`   — reuse the source colour verbatim. Used where Chrome's own
 *              semantics say "same role, different window state", and inventing
 *              a difference would be noise rather than information.
 * - `darken` — shift HSL lightness by `delta` percentage points. Used for the
 *              incognito variants, which should read as a slightly deeper,
 *              clearly-different-from-normal surface.
 *
 * @type {Record<string, {mode:'copy'|'darken', from:string, delta?:number}>}
 */
const DERIVATIONS = {
  // Incognito is visually "the same theme, deeper". ~6 points of lightness is
  // enough to be noticeable next to the normal frame without breaking contrast
  // with tab text, which is solved against `frame` — a 6-point drop cannot flip
  // a passing 4.5:1 pair into a failing one.
  frameIncognito: { mode: 'darken', from: 'frame', delta: -6 },
  frameIncognitoInactive: { mode: 'darken', from: 'frameInactive', delta: -4 },

  // Inactive/inactive-incognito tab surfaces match the active one. Chrome
  // already dims them itself; adding a second opinion here would fight it.
  backgroundTabInactive: { mode: 'copy', from: 'backgroundTab' },
  backgroundTabIncognito: { mode: 'darken', from: 'backgroundTab', delta: -6 },
  backgroundTabIncognitoInactive: { mode: 'copy', from: 'backgroundTab' },

  // Tab labels keep their resolved colour across states. The inactive/incognito
  // label keys exist so the manifest is complete, not so we can pick new inks.
  tabBackgroundTextInactive: { mode: 'copy', from: 'tabBackgroundText' },
  tabBackgroundTextIncognito: { mode: 'copy', from: 'tabBackgroundText' },
  tabBackgroundTextIncognitoInactive: { mode: 'copy', from: 'tabBackgroundText' },

  // The NTP heading shares the NTP body ink. Chrome's own default splits them,
  // but a single ink is what the preview shows and what users expect.
  ntpHeader: { mode: 'copy', from: 'ntpText' },

  // `toolbar_text` is COLOR_TOOLBAR_TEXT: the text drawn *on the toolbar*.
  // `bookmark_text` is the only other on-surface ink in the palette, so they
  // share a value. (The two keys are distinct in Chrome — never alias one to
  // the other in the manifest.)
  toolbarText: { mode: 'copy', from: 'bookmarkText' },
}

/**
 * Compute every extended Chrome colour key from the core palette.
 *
 * @param {Record<string,string>} colors Field-id -> hex (the 14 editable fields).
 * @returns {Record<string,string>} chromeKey -> `#RRGGBB`. Keys with an
 *   unparsable source are omitted rather than guessed at.
 */
export function deriveExtendedColors(colors) {
  /** @type {Record<string,string>} */
  const out = {}

  for (const field of EXTENDED_COLOR_FIELDS) {
    const rule = DERIVATIONS[field.id]
    if (!rule) continue

    const source = normalizeHex(colors?.[rule.from])
    if (!source) continue

    out[field.chromeKey] = rule.mode === 'darken' ? adjustL(source, rule.delta ?? 0) : source
  }

  return out
}

/** Round to 3 decimals — Chrome stores tints as doubles and 3 is plenty. */
function round3(value) {
  return Math.round(value * 1000) / 1000
}

/**
 * Compute `theme.tints` from the resolved palette.
 *
 * @param {Record<string,string>} colors    Field-id -> hex for the core fields.
 * @param {Record<string,string>} [extended] chromeKey -> hex from
 *   `deriveExtendedColors`, needed for the two incognito frame tints.
 * @returns {Record<string, [number, number, number]>} tintKey -> [h, s, l],
 *   each channel in 0-1. Unparsable sources are skipped.
 */
export function deriveTints(colors, extended = {}) {
  /** @type {Record<string,string|undefined>} */
  const sourceByTint = {
    buttons: colors?.toolbar,
    frame: colors?.frame,
    frame_inactive: colors?.frameInactive,
    frame_incognito: extended.frame_incognito,
    frame_incognito_inactive: extended.frame_incognito_inactive,
    background_tab: colors?.backgroundTab,
  }

  /** @type {Record<string, [number, number, number]>} */
  const tints = {}

  for (const key of TINT_KEYS) {
    const hex = normalizeHex(sourceByTint[key])
    if (!hex) continue

    // `hexToHsl` reports hue in degrees and s/l in percent; Chrome wants all
    // three normalised to 0-1.
    const { h, s, l } = hexToHsl(hex)
    tints[key] = [round3(h / 360), round3(s / 100), round3(l / 100)]
  }

  return tints
}

/**
 * Every colour a complete-mode manifest will contain, as one map.
 *
 * @param {Record<string,string>} colors
 * @returns {{ colors: Record<string,string>, extended: Record<string,string>, tints: Record<string, [number,number,number]> }}
 */
export function resolveCompletePalette(colors) {
  const extended = deriveExtendedColors(colors)
  return { extended, tints: deriveTints(colors, extended), colors }
}

/** True when a value is a well-formed HSL tint triple. Exported for the verifier. */
export function isValidTint(value) {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1)
  )
}

/** Re-exported so callers do not need to reach into `color.js` for this check. */
export { parseHex }

/**
 * The rule table, exported so `scripts/verify.mjs` can prove it stays in sync
 * with `EXTENDED_COLOR_FIELDS` in `data/themeFields.js`. Two tables describing the
 * same 10 keys is exactly the kind of duplication that drifts silently.
 */
export { DERIVATIONS as EXTENDED_DERIVATIONS }
