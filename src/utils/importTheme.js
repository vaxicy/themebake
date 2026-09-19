/**
 * Reverse import — read an existing theme back into the editor.
 *
 * Four accepted shapes:
 *   1. Chrome theme manifest  `{ "theme": { "colors": { "frame": [177,178,255] } } }`
 *   2. ThemeBake export      `{ "colors": { "frame": "#B1B2FF" } }`
 *   3. A bare colour map      `{ "frame": [177,178,255], "toolbar": "#EEF1FF" }`
 *      — accepted only when at least one key is a key we recognise, so arbitrary
 *      JSON is still rejected with "not a Chrome theme manifest" rather than
 *      silently reporting "no colours found".
 *   4. A "name" field on any of the above is picked up as the theme name.
 *
 * Colour values may be RGB int arrays, RGBA arrays (alpha is dropped — Chrome
 * themes are opaque and our state is 6-digit hex) or hex strings.
 *
 * Unmappable keys are reported in three buckets, because they mean different
 * things and the user can act on each differently:
 *   - `deadKeys`    — looks like a Chrome theme key, is absent from
 *                     `kOverwritableColorTable`, so Chrome ignores it. Common in
 *                     third-party themes and worth telling the user about.
 *   - `derivedKeys` — one of the 10 keys complete mode derives. Dropped on
 *                     purpose; it will be recomputed from the core palette.
 *   - `unknownKeys` — neither of the above. Probably a typo.
 *
 * This is also the round-trip test for our own generator: a manifest produced by
 * ThemeBake must import back into an identical colour set — including the one
 * display property we write, `ntp_logo_alternate`, which is reported as a
 * `logoStyle` style id so the editor state stays free of raw Chrome integers.
 * `verify.mjs` asserts exactly that.
 *
 * All errors are **i18n keys**, never sentences.
 */

import {
  CHROME_DEAD_COLOR_KEYS,
  EXTENDED_CHROME_KEYS,
  FIELD_ID_BY_CHROME_KEY,
  LOGO_PROPERTY_KEY,
  THEME_FIELDS_BY_ID,
  logoStyleFromValue,
} from '../data/themeFields.js'
import { normalizeHex, rgbToHex } from './color.js'

/** Coerce one manifest colour value into `#RRGGBB`, or null. */
function toHex(value) {
  if (typeof value === 'string') return normalizeHex(value)

  if (Array.isArray(value) && value.length >= 3) {
    const [r, g, b] = value
    if ([r, g, b].every((n) => Number.isFinite(n) && n >= 0 && n <= 255)) {
      return rgbToHex({ r, g, b })
    }
  }

  return null
}

/**
 * Chrome manifest key OR ThemeBake field id -> internal field id.
 * @param {string} key
 * @returns {string|null}
 */
function resolveFieldId(key) {
  return FIELD_ID_BY_CHROME_KEY[key] ?? (THEME_FIELDS_BY_ID[key] ? key : null)
}

/**
 * @param {string} text
 * @returns {{ok: true, kind:'manifest'|'themebake'|'bare', name:string|null,
 *            colors:Record<string,string>, unknownKeys:string[], alphaDropped:boolean,
 *            logoStyle:string|null}
 *          | {ok: false, error: string}}
 */
export function importThemeJson(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'import.errorBadJson' }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'import.errorBadJson' }
  }

  const hasManifestShape = parsed.theme && typeof parsed.theme === 'object'
  let source
  let kind

  if (hasManifestShape) {
    source = parsed.theme.colors
    kind = 'manifest'
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      return { ok: false, error: 'import.errorNoThemeColors' }
    }
  } else if (parsed.colors && typeof parsed.colors === 'object' && !Array.isArray(parsed.colors)) {
    source = parsed.colors
    kind = 'themebake'
  } else {
    // Lenient: the object itself is the colour map. Require at least one
    // recognised key, otherwise this is just arbitrary JSON.
    const recognised = Object.keys(parsed).some((key) => resolveFieldId(key))
    if (!recognised) return { ok: false, error: 'import.errorBadJson' }
    source = parsed
    kind = 'bare'
  }

  const colors = {}
  const unknownKeys = []
  const deadKeys = []
  const derivedKeys = []
  let alphaDropped = false

  for (const [rawKey, rawValue] of Object.entries(source)) {
    // Prefer the Chrome manifest key mapping; fall back to a ThemeBake field id
    // so our own export format round-trips too.
    const fieldId = resolveFieldId(rawKey)

    if (!fieldId) {
      // Three distinct reasons a key did not map, and they deserve different
      // treatment. Chrome itself never complains about any of them, so the
      // importer is the only place a user can find out.
      if (CHROME_DEAD_COLOR_KEYS.has(rawKey)) {
        // A plausible-looking key that is absent from kOverwritableColorTable.
        // Importing it would be pointless: it renders nothing.
        deadKeys.push(rawKey)
      } else if (EXTENDED_CHROME_KEYS.has(rawKey)) {
        // One of the 10 keys complete mode derives. Dropping it is correct —
        // it will be recomputed from the core palette on export.
        derivedKeys.push(rawKey)
      } else {
        unknownKeys.push(rawKey)
      }
      continue
    }

    const hex = toHex(rawValue)
    if (!hex) {
      unknownKeys.push(rawKey)
      continue
    }

    if (Array.isArray(rawValue) && rawValue.length >= 4) alphaDropped = true
    colors[fieldId] = hex
  }

  if (!Object.keys(colors).length) {
    return { ok: false, error: 'import.errorNoThemeColors' }
  }

  return {
    ok: true,
    kind,
    name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : null,
    colors,
    unknownKeys,
    deadKeys,
    derivedKeys,
    alphaDropped,
    // The one display property we emit, read back as a style id. `null` when the
    // theme does not set it — the caller keeps its current choice rather than
    // resetting to the default, so importing a colour palette cannot silently
    // undo a deliberate logo setting.
    logoStyle: logoStyleFromValue(parsed?.theme?.properties?.[LOGO_PROPERTY_KEY]),
  }
}

/**
 * Serialise the current theme for sharing / backup.
 * Uses the same shape `importThemeJson` reads, so export -> import is lossless.
 */
export function exportThemeJson({ name, colors, colorFormat }) {
  return JSON.stringify(
    {
      __format: 'themebake/theme',
      name,
      colorFormat,
      colors,
    },
    null,
    2,
  )
}
