/**
 * Chrome theme manifest generation.
 *
 * Converts the UI theme state into a spec-compliant `manifest.json`, and
 * serialises colours into the format Chrome's theme parser accepts.
 *
 * Design rules:
 *  - Never emit a key that is not in CHROME_COLOR_KEY_ALLOWLIST.
 *  - Never emit a key whose value is missing/invalid (drop it instead).
 *  - Never emit a property key outside CHROME_PROPERTY_KEY_ALLOWLIST.
 *  - Write exactly one property: `ntp_logo_alternate`. The other two keys Chrome
 *    reads are inert without a background image — see `LOGO_STYLES`.
 *  - Always produce valid JSON.
 *
 * VALIDATION REALITY CHECK (chrome/common/extensions/manifest_handlers/theme_handler.cc)
 * ---------------------------------------------------------------------------------
 * `LoadColors` checks exactly three things per `theme.colors` entry: the value is
 * a list, its length is 3 or 4, and the first three items are ints. Key names are
 * never compared against any table, so an unknown key is silently ignored rather
 * than rejected — which is why ThemeBake's allow-list, not Chrome, has to be the
 * guard. A **string** value fails the very first check and aborts the whole
 * manifest with kInvalidThemeColors, so the `hex` format cannot target Chrome.
 * See COLOR_FORMATS[].chromeSafe in `data/themeFields.js`.
 *
 * All diagnostics (`warnings`, `validateThemeInput`) are returned as
 * `{ key, vars }` pairs rather than sentences, so this module stays free of UI
 * text and every message is localised by the caller.
 */

import {
  CHROME_COLOR_KEY_ALLOWLIST,
  CHROME_PROPERTY_KEY_ALLOWLIST,
  DEFAULT_LOGO_STYLE,
  DEFAULT_NTP_PROPERTIES,
  DISPLAY_PROPERTIES,
  EXTENDED_COLOR_FIELDS,
  ICON_FILENAME,
  ICON_SIZE,
  LOGO_PROPERTY_KEY,
  MANIFEST_VERSION,
  THEME_FIELDS,
  THEME_VERSION,
  logoStyleValue,
} from '../data/themeFields.js'
import { hexToRgbArray, normalizeHex } from './color.js'
import { deriveExtendedColors, deriveTints } from './derivedColors.js'

/**
 * The manifest `description` limit — 132 characters. This is the same string the
 * Chrome Web Store reads as the "package summary", so the cap is the store's too.
 * (The store's long description field is a separate, 16,000-character field that
 * ThemeBake does not write.)
 */
export const MAX_DESCRIPTION_LENGTH = 132

/**
 * @typedef {Object} BuildManifestResult
 * @property {object}      manifest          The manifest object (not yet stringified).
 * @property {string}      json              Pretty-printed JSON, 2-space indent.
 * @property {{key:string,vars?:object}[]} warnings  Non-fatal issues, as i18n keys.
 * @property {string[]}    usedChromeKeys    `theme.colors` keys actually written.
 * @property {string[]}    usedTintKeys      `theme.tints` keys actually written.
 * @property {Record<string,string>} derivedColors  Extended colours used (complete mode).
 * @property {boolean}     chromeSafe        Whether current Chrome can load this output.
 */

/**
 * Serialise one colour into the requested manifest format.
 *
 * Chrome's theme colour parser accepts ONLY an array of 3 or 4 integers
 * (`ParseThemeColor` is not used for `theme.colors`; `LoadColors` in
 * theme_handler.cc enforces the list shape itself). The `hex` branch exists for
 * Gecko/Firefox and is flagged `chromeSafe: false` at the source.
 *
 * @param {string} hex
 * @param {'rgb'|'hex'} format
 * @returns {number[]|string}
 */
export function serializeColor(hex, format) {
  const normalized = normalizeHex(hex) ?? '#000000'
  return format === 'hex' ? normalized : hexToRgbArray(normalized)
}

/**
 * Write one colour into a target map, honouring the allow-list and the format.
 * Returns true when the key was written.
 * @param {Record<string, unknown>} target
 * @param {string} chromeKey
 * @param {string} hex
 * @param {'rgb'|'hex'} colorFormat
 */
function writeColor(target, chromeKey, hex, colorFormat) {
  const normalized = normalizeHex(hex)
  if (!normalized) return false
  if (!CHROME_COLOR_KEY_ALLOWLIST.has(chromeKey)) return false
  target[chromeKey] = serializeColor(normalized, colorFormat)
  return true
}

/**
 * Keep only property keys Chrome reads, and only values of the type it accepts.
 * `SetDisplayPropertiesFromJSON` silently skips a value of the wrong type, so
 * writing `ntp_logo_alternate: "1"` would be quietly dead — drop it instead.
 *
 * @param {Record<string, unknown>} input
 * @returns {Record<string, string|number>}
 */
export function sanitizeProperties(input) {
  /** @type {Record<string, string|number>} */
  const out = {}
  if (!input || typeof input !== 'object') return out

  for (const spec of DISPLAY_PROPERTIES) {
    if (!CHROME_PROPERTY_KEY_ALLOWLIST.has(spec.key)) continue
    const value = input[spec.key]
    if (value === undefined || value === null) continue

    if (spec.type === 'string') {
      if (typeof value === 'string' && spec.values.includes(value)) out[spec.key] = value
    } else if (typeof value === 'number' && spec.values.includes(value)) {
      out[spec.key] = value
    }
  }

  return out
}

/**
 * Resolve the NTP display properties.
 *
 * Used indirectly: `buildManifest` runs its single logo flag through
 * `sanitizeProperties` rather than through this function, because writing all
 * three keys would also pin `ntp_background_alignment` / `ntp_background_repeat`,
 * which do nothing without a background image. This one is kept whole as the
 * "give me a complete, valid property bag" primitive for a future
 * background-image feature.
 *
 * An override is used only when it is a value Chrome actually accepts. Anything
 * else — a wrong type, an unknown key, an out-of-range flag — silently reverts to
 * the default for *that key*, which is why a partial override cannot produce a
 * half-broken manifest.
 *
 * @param {Record<string, unknown>} [overrides]
 * @returns {Record<string, string|number>}
 */
export function resolveProperties(overrides) {
  /** @type {Record<string, string|number>} */
  const out = {}

  for (const spec of DISPLAY_PROPERTIES) {
    if (!CHROME_PROPERTY_KEY_ALLOWLIST.has(spec.key)) continue
    const candidate = overrides?.[spec.key]
    const accepted = sanitizeProperties({ [spec.key]: candidate })[spec.key]
    const fallback = sanitizeProperties({ [spec.key]: DEFAULT_NTP_PROPERTIES[spec.key] })[spec.key]
    const value = accepted ?? fallback
    if (value !== undefined) out[spec.key] = value
  }

  return out
}

/**
 * Build the manifest for a theme.
 *
 * @param {object}          options
 * @param {string}          options.name        Theme name (required, trimmed).
 * @param {string}          [options.description]
 * @param {Record<string,string>} options.colors Field-id -> hex. May be partial.
 * @param {'rgb'|'hex'}     [options.colorFormat='rgb']
 * @param {string}          [options.version='1.0']
 * @param {boolean}         [options.complete=false]  Emit the full 24-key table
 *   plus `tints`. The extra 10 keys are derived, not editable. The default is
 *   `false` because this module is a primitive that can produce either shape;
 *   the *product* always wants the complete one, and `App.jsx` passes `true`
 *   explicitly (`COMPLETE_THEME`).
 * @param {'adaptive'|'classic'} [options.logoStyle='adaptive']  New Tab Page
 *   Google-logo behaviour, written as `theme.properties.ntp_logo_alternate`.
 *   `adaptive` (=1) lets Chrome derive the wordmark from the NTP colours;
 *   `classic` (=0) pins the original logo. An unrecognised value falls back to
 *   the default rather than omitting the key, so the manifest always declares it.
 * @param {boolean}         [options.includeIcon=false]  Reference `icon.png` at
 *   `icons.128`. Only set this when the caller actually writes that file —
 *   `ThemeHandler::Validate` hard-errors on a missing theme resource.
 * @returns {BuildManifestResult}
 */
export function buildManifest({
  name,
  description = '',
  colors,
  colorFormat = 'rgb',
  version = THEME_VERSION,
  complete = false,
  logoStyle = DEFAULT_LOGO_STYLE,
  includeIcon = false,
}) {
  const warnings = []
  const themeColors = {}
  const usedChromeKeys = []

  for (const field of THEME_FIELDS) {
    const raw = colors?.[field.id]
    const hex = normalizeHex(raw)

    if (!hex) {
      // Missing or malformed: drop the key entirely rather than writing a
      // bogus value. Chrome falls back to its own default for omitted keys,
      // which is far better than writing something invalid.
      if (raw != null && String(raw).trim() !== '') {
        warnings.push({
          key: 'warn.droppedInvalid',
          vars: { field: field.id, chromeKey: field.chromeKey, value: String(raw) },
        })
      }
      continue
    }

    if (!CHROME_COLOR_KEY_ALLOWLIST.has(field.chromeKey)) {
      // Defensive: the mapping table itself is wrong. Do NOT write the key.
      warnings.push({
        key: 'warn.skippedKey',
        vars: { field: field.id, chromeKey: field.chromeKey },
      })
      continue
    }

    themeColors[field.chromeKey] = serializeColor(hex, colorFormat)
    usedChromeKeys.push(field.chromeKey)
  }

  // ------------------------------------------------------------ complete mode
  /** @type {Record<string,string>} */
  let derivedColors = {}
  /** @type {Record<string, [number,number,number]>} */
  let tints = {}
  const usedTintKeys = []

  if (complete) {
    derivedColors = deriveExtendedColors(colors)
    for (const field of EXTENDED_COLOR_FIELDS) {
      const hex = derivedColors[field.chromeKey]
      if (writeColor(themeColors, field.chromeKey, hex, colorFormat)) {
        usedChromeKeys.push(field.chromeKey)
      }
    }

    tints = deriveTints(colors, derivedColors)
    for (const key of Object.keys(tints)) usedTintKeys.push(key)
  }

  const cleanName = (name ?? '').trim() || 'User Theme'
  const cleanDescription = (description ?? '').trim().slice(0, MAX_DESCRIPTION_LENGTH)

  /** @type {Record<string, unknown>} */
  const theme = { colors: themeColors }

  // Chrome validates every tint entry as a list of exactly 3 doubles, with no
  // key-name check. Only emit the block when it is non-empty and well-formed.
  if (usedTintKeys.length) theme.tints = tints

  // `theme.properties` carries exactly ONE key: `ntp_logo_alternate`.
  //
  // This block used to be omitted entirely, on the reasoning that the key "only
  // chooses between Chrome's two pre-rendered logos and cannot tint the logo to
  // the theme". The second half is true — a theme has no way to set an arbitrary
  // logo colour — but the first half was wrong, and so was the conclusion:
  // `ntp_logo_alternate: 1` means "derive the logo from the New Tab colours",
  // which is precisely what a coloured New Tab Page needs. See `LOGO_STYLES`.
  //
  // The other two display properties stay out: both only take effect when the
  // theme ships a background image, and ThemeBake is colour-only.
  const properties = sanitizeProperties({ [LOGO_PROPERTY_KEY]: logoStyleValue(logoStyle) })
  if (Object.keys(properties).length) theme.properties = properties

  /** @type {Record<string, unknown>} */
  const manifest = {
    manifest_version: MANIFEST_VERSION,
    version,
    name: cleanName,
  }
  if (cleanDescription) manifest.description = cleanDescription
  manifest.theme = theme
  if (includeIcon) manifest.icons = { [String(ICON_SIZE)]: ICON_FILENAME }

  // A hex-string manifest is valid JSON and installs fine in Firefox, but
  // Chrome aborts it in LoadColors. Surfacing this as a warning is the only
  // honest thing to do — the user is about to download something.
  if (colorFormat === 'hex') {
    warnings.push({ key: 'warn.hexNotChromeLoadable' })
  }

  return {
    manifest,
    json: JSON.stringify(manifest, null, 2),
    warnings,
    usedChromeKeys,
    usedTintKeys,
    derivedColors,
    chromeSafe: colorFormat !== 'hex',
  }
}

/**
 * Validate the inputs before generation.
 *
 * Returns i18n keys (not sentences) plus the input they belong to, so the caller
 * can both localise the message and decide which form control to flag.
 *
 * @param {object} input
 * @param {string} input.name
 * @param {Record<string,string>} input.colors
 * @param {string} [input.description]
 * @returns {{key:string, vars?:object, field:'name'|'colors'|'description'}[]}
 */
export function validateThemeInput({ name, colors, description = '' }) {
  const errors = []

  const trimmed = (name ?? '').trim()
  if (!trimmed) {
    errors.push({ key: 'validate.nameRequired', field: 'name' })
  } else if (trimmed.length > 45) {
    // Chrome's own limit for extension/theme names is 45 characters.
    errors.push({ key: 'validate.nameTooLong', field: 'name' })
  }

  if ((description ?? '').trim().length > MAX_DESCRIPTION_LENGTH) {
    errors.push({
      key: 'validate.descriptionTooLong',
      vars: { max: MAX_DESCRIPTION_LENGTH },
      field: 'description',
    })
  }

  const invalid = Object.entries(colors ?? {})
    .filter(([, value]) => !normalizeHex(value))
    .map(([id]) => id)
  if (invalid.length) {
    errors.push({ key: 'validate.invalidColors', vars: { fields: invalid.join(', ') }, field: 'colors' })
  }

  const validCount = Object.values(colors ?? {}).filter((v) => normalizeHex(v)).length
  if (validCount === 0) {
    errors.push({ key: 'validate.noColors', field: 'colors' })
  }

  return errors
}

/**
 * Parse a manifest JSON string back into an object. Used by Preview Manifest to
 * prove the output is valid JSON before the user ever downloads it.
 * @param {string} json
 * @returns {{ ok: true, value: object } | { ok: false, error: string }}
 */
export function parseManifest(json) {
  try {
    const value = JSON.parse(json)
    return { ok: true, value }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
