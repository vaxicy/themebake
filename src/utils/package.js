/**
 * Theme package assembly.
 *
 * Turns the editor state into the exact file list Chrome expects to find in a
 * folder loaded via "Load unpacked":
 *
 *     <slug>/
 *       manifest.json     <- the only file Chrome actually reads
 *
 * Nothing else is written by the app. The icon parameter is retained so the
 * capability survives — `utils/icon.js` can still render a 128x128 PNG and this
 * module will ship it and reference it — but the app stopped sending one: Chrome
 * never displays a theme's icon anywhere, so it was ~3 KB of dead weight in every
 * download, and only one of the 21 reference themes kept an icon at the folder
 * root. The reference themes this replicates also carry README.md, LICENSE,
 * `theme.json`, `Cached Theme.pak` and store assets — an audit showed that not
 * one of those files influences rendering either, and `Cached Theme.pak` is a
 * cache Chrome itself generates after the first load.
 *
 * This module is intentionally free of DOM calls so `scripts/verify.mjs` can run
 * it in Node: the caller renders the icon and passes it in.
 *
 * There is no general `properties` pass-through. The manifest carries exactly one
 * display property, `ntp_logo_alternate`, driven by the `logoStyle` option.
 * See the note in `utils/manifest.js`.
 */

import { ICON_FILENAME, THEME_FOLDER_SUFFIX } from '../data/themeFields.js'
import { buildManifest } from './manifest.js'
import { toSlug } from './slug.js'
import { MANIFEST_FILENAME } from './zip.js'

/**
 * Folder name for the unpacked theme, e.g. `Rose Morning` -> `rose-morning`.
 *
 * `toSlug` already sanitises for every OS and guards Windows reserved names; the
 * extra lower-casing is practical, not cosmetic: it stops two themes that differ
 * only in case from colliding on a case-insensitive filesystem — which is exactly
 * where a user would extract them. Non-ASCII characters are unaffected, so a CJK
 * name still lower-cases to itself.
 *
 * No suffix is appended. `THEME_FOLDER_SUFFIX` is the single knob for that and it
 * is currently empty (the `-theme` suffix was dropped on 2026-09-19).
 *
 * @param {string} name
 * @returns {string}
 */
export function toThemeFolderName(name) {
  return `${toSlug(name).toLowerCase()}${THEME_FOLDER_SUFFIX}`
}

/**
 * Build the package.
 *
 * @param {object}  options
 * @param {string}  options.name
 * @param {string}  [options.description]
 * @param {Record<string,string>} options.colors
 * @param {'rgb'|'hex'} [options.colorFormat='rgb']
 * @param {string}  [options.version]
 * @param {boolean} [options.complete=false]  Defaults to `false` at this layer;
 *   ThemeForge's app always passes `true` (see `COMPLETE_THEME` in `App.jsx`).
 * @param {'adaptive'|'classic'} [options.logoStyle]  Forwarded to `buildManifest`
 *   as `theme.properties.ntp_logo_alternate`. Omitted means the manifest default.
 * @param {Blob|Uint8Array|ArrayBuffer|null} [options.icon=null]  A rendered
 *   PNG. When null no icon file is written and `icons` is omitted from the
 *   manifest — referencing a file that does not exist is a hard error in
 *   `ThemeHandler::Validate`.
 * @returns {Promise<{
 *   files: {path:string,data:unknown}[],
 *   folderName: string,
 *   zipName: string,
 *   manifest: object,
 *   json: string,
 *   warnings: {key:string,vars?:object}[],
 *   usedChromeKeys: string[],
 *   usedTintKeys: string[],
 *   derivedColors: Record<string,string>,
 *   chromeSafe: boolean,
 * }>}
 */
export async function buildThemePackage({
  name,
  description = '',
  colors,
  colorFormat = 'rgb',
  version,
  complete = false,
  logoStyle,
  icon = null,
}) {
  const built = buildManifest({
    name,
    description,
    colors,
    colorFormat,
    version,
    complete,
    logoStyle,
    includeIcon: Boolean(icon),
  })

  /** @type {{path:string,data:unknown}[]} */
  const files = [{ path: MANIFEST_FILENAME, data: built.json }]
  if (icon) files.push({ path: ICON_FILENAME, data: icon })

  const folderName = toThemeFolderName(name)

  return {
    ...built,
    files,
    folderName,
    zipName: `${folderName}.zip`,
  }
}

/**
 * Human-readable summary of every colour the package will contain, in manifest
 * key order. Used by the export panel so the user can see the derived keys that
 * complete mode adds without opening the manifest.
 *
 * @param {string} json
 * @returns {{key:string, value:string}[]}
 */
export function describeManifestColors(json) {
  try {
    const parsed = JSON.parse(json)
    const colors = parsed?.theme?.colors
    if (!colors || typeof colors !== 'object') return []
    return Object.entries(colors).map(([key, value]) => ({
      key,
      value: Array.isArray(value) ? value.join(', ') : String(value),
    }))
  } catch {
    return []
  }
}
