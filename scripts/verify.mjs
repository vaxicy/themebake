/**
 * ThemeBake self-check.
 *
 * Runs the pure logic (colour maths, manifest generation, filename safety, ZIP
 * packaging) outside the browser so regressions are caught without clicking
 * through the UI.
 *
 *   npm run verify
 *
 * Exits with code 1 if any check fails.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import JSZip from 'jszip'
import {
  CHROME_COLOR_KEY_ALLOWLIST,
  CHROME_DEAD_COLOR_KEYS,
  CHROME_PROPERTY_KEY_ALLOWLIST,
  COLOR_FORMATS,
  DEFAULT_LOGO_STYLE,
  DEFAULT_NTP_PROPERTIES,
  DISPLAY_PROPERTIES,
  EXTENDED_CHROME_KEYS,
  EXTENDED_COLOR_FIELDS,
  FIELD_GROUPS,
  FIELD_IDS,
  ICON_FILENAME,
  LOGO_PROPERTY_KEY,
  LOGO_STYLES,
  LOGO_STYLE_IDS,
  MANIFEST_VERSION,
  OUTPUT_MODES,
  THEME_FIELDS,
  THEME_FOLDER_SUFFIX,
  TINT_KEYS,
  TINT_SOURCES,
  logoStyleFromValue,
  logoStyleValue,
} from '../src/data/themeFields.js'
import { DEFAULT_COLORS, DEFAULT_THEME_NAME, PRESETS, buildColors, generateRandomColors, paletteDistance } from '../src/data/presets.js'
import {
  buildManifest,
  parseManifest,
  resolveProperties,
  sanitizeProperties,
  validateThemeInput,
} from '../src/utils/manifest.js'
import {
  contrastRatio,
  hexToHsl,
  hexToRgbArray,
  hslToHex,
  isValidHex,
  normalizeHex,
  parseHex,
  relativeLuminance,
} from '../src/utils/color.js'
import { toSafeFilename, toSafeName } from '../src/utils/slug.js'
import { createZip, MANIFEST_FILENAME } from '../src/utils/zip.js'
import {
  buildThemePackage,
  describeManifestColors,
  toThemeFolderName,
} from '../src/utils/package.js'
import { suggestThemeName } from '../src/utils/nameFromColors.js'
import {
  DEFAULT_AI_CONFIG,
  AI_LANGUAGES,
  AI_PROVIDERS,
  AI_PROVIDER_IDS,
  AI_STYLES,
  AI_TEMPERATURE,
} from '../src/data/aiProviders.js'
import { sanitizeAiConfig } from '../src/utils/aiConfig.js'
import {
  buildDescriptionMessages,
  buildNamingMessages,
  describePalette,
  normalizeFolder,
  parseDescriptionResponse,
  parseNamingResponse,
  requestThemeDescription,
  requestThemeNames,
} from '../src/utils/aiNaming.js'
import { MAX_DESCRIPTION_LENGTH } from '../src/utils/manifest.js'
import {
  EXTENDED_DERIVATIONS,
  deriveExtendedColors,
  deriveTints,
  isValidTint,
} from '../src/utils/derivedColors.js'
import { drawThemeIcon, ICON_FALLBACK_COLORS } from '../src/utils/icon.js'
import { auditContrast, repairContrast, AUDIT_RULES } from '../src/utils/contrastAudit.js'
import {
  ACCENT_STRATEGIES,
  DEFAULT_ACCENT_STRATEGY,
  INTENSITIES,
  SOLVER_MODES,
  SURFACE_HUE_DRIFT,
  hueFamilies,
  normalizeSeeds,
  solveTheme,
  usedSeedHexes,
} from '../src/utils/palette.js'
import {
  buildVscodeColors,
  buildVscodePackage,
  buildVscodeThemeJson,
  counterpartTypeFor,
  deriveCounterpart,
  masterFromPalette,
  resolveType,
  schemeOf,
} from '../src/vscode/build.js'
import {
  DEFAULT_VSCODE_COLORS,
  VSCODE_FIELD_IDS,
  VSCODE_OVERRIDE_FIELDS,
  VSCODE_OVERRIDE_IDS,
  VSCODE_OUTPUT_MODES,
  buildOverrides,
} from '../src/vscode/fields.js'
import { VSCODE_PRESETS } from '../src/data/vscodePresets.js'
import { extractColors, looksLikeJson, looksLikePaletteUrl } from '../src/utils/parseColors.js'
import { exportThemeJson, importThemeJson } from '../src/utils/importTheme.js'
import { clusterColors, detectBands, measureFlatness } from '../src/utils/image.js'
import { COALESCE_MS, canUndo, createHistory, record, undo } from '../src/utils/history.js'
import { LANGUAGES } from '../src/i18n/languages.js'
import en from '../src/i18n/en.js'
import zh from '../src/i18n/zh.js'

const here = dirname(fileURLToPath(import.meta.url))

let failures = 0
let checks = 0

function ok(label, condition, detail = '') {
  checks += 1
  if (condition) {
    console.log(`  [ok]   ${label}`)
  } else {
    failures += 1
    console.log(`  [FAIL] ${label}${detail ? ` -- ${detail}` : ''}`)
  }
}

function section(title) {
  console.log(`\n${title}`)
}

// ---------------------------------------------------------------------------
section('1. Colour parsing')
// ---------------------------------------------------------------------------
ok('#B1B2FF parses', isValidHex('#B1B2FF'))
ok('b1b2ff (no hash) parses', isValidHex('b1b2ff'))
ok('#FFF shorthand parses', normalizeHex('#FFF') === '#FFFFFF', normalizeHex('#FFF'))
ok('#GGGGGG rejected', !isValidHex('#GGGGGG'))
ok('"google" rejected', !isValidHex('google'))
ok('empty string rejected', !isValidHex(''))
ok('null rejected', !isValidHex(null))
ok('#12345 rejected', !isValidHex('#12345'))
ok('#B1B2FF -> [177,178,255]', JSON.stringify(hexToRgbArray('#B1B2FF')) === '[177,178,255]')

// ---------------------------------------------------------------------------
section('2. Field map integrity')
// ---------------------------------------------------------------------------
const duplicateIds = FIELD_IDS.filter((id, i) => FIELD_IDS.indexOf(id) !== i)
ok('no duplicate field ids', duplicateIds.length === 0, duplicateIds.join(', '))

const duplicateKeys = THEME_FIELDS.map((f) => f.chromeKey).filter(
  (k, i, all) => all.indexOf(k) !== i,
)
ok('no duplicate chromeKeys', duplicateKeys.length === 0, duplicateKeys.join(', '))

const unknownKeys = THEME_FIELDS.filter((f) => !CHROME_COLOR_KEY_ALLOWLIST.has(f.chromeKey))
ok('every chromeKey is allow-listed', unknownKeys.length === 0, unknownKeys.map((f) => f.chromeKey).join(', '))
ok('default colors cover every field', FIELD_IDS.every((id) => isValidHex(DEFAULT_COLORS[id])))

// The 24-key table is a verbatim copy of kOverwritableColorTable. If it is edited
// without editing the source of truth, these assertions are the tripwire.
ok('allow-list holds exactly 24 keys', CHROME_COLOR_KEY_ALLOWLIST.size === 24,
  `${CHROME_COLOR_KEY_ALLOWLIST.size}`)

const coreKeys = THEME_FIELDS.map((f) => f.chromeKey)
const extendedKeys = EXTENDED_COLOR_FIELDS.map((f) => f.chromeKey)

ok('toolbar_text is reachable only through the extended set',
  !coreKeys.includes('toolbar_text') && extendedKeys.includes('toolbar_text'))
ok('core fields never collide with extended fields',
  coreKeys.every((k) => !extendedKeys.includes(k)),
  coreKeys.filter((k) => extendedKeys.includes(k)).join(', '))

const covered = new Set([...coreKeys, ...extendedKeys])
const uncovered = [...CHROME_COLOR_KEY_ALLOWLIST].filter((k) => !covered.has(k))
const surplus = [...covered].filter((k) => !CHROME_COLOR_KEY_ALLOWLIST.has(k))
ok('core + extended covers the allow-list exactly (no gap, no surplus)',
  uncovered.length === 0 && surplus.length === 0,
  `missing [${uncovered.join(', ')}] surplus [${surplus.join(', ')}]`)

// Dead keys are the whole reason this deny-list exists: they must never be
// emitted, and a future edit must not quietly promote one into the allow-list.
ok('no dead key appears in the allow-list',
  ![...CHROME_DEAD_COLOR_KEYS].some((k) => CHROME_COLOR_KEY_ALLOWLIST.has(k)),
  [...CHROME_DEAD_COLOR_KEYS].filter((k) => CHROME_COLOR_KEY_ALLOWLIST.has(k)).join(', '))
ok('no dead key is derivable by the extended set',
  ![...CHROME_DEAD_COLOR_KEYS].some((k) => covered.has(k)))
ok('dead-key names are lowercase snake_case',
  [...CHROME_DEAD_COLOR_KEYS].every((k) => /^[a-z][a-z_]*$/.test(k)))

// `derivedColors.js` keeps its own rule table. Prove the two tables agree.
const ruleIds = Object.keys(EXTENDED_DERIVATIONS).sort()
const declaredIds = EXTENDED_COLOR_FIELDS.map((f) => f.id).sort()
ok('every declared extended field has a derivation rule',
  declaredIds.every((id) => ruleIds.includes(id)) &&
    ruleIds.every((id) => declaredIds.includes(id)),
  `declared [${declaredIds.join(', ')}] rules [${ruleIds.join(', ')}]`)
ok('every derivation source is a real editable field',
  Object.values(EXTENDED_DERIVATIONS).every((rule) => FIELD_IDS.includes(rule.from)),
  Object.entries(EXTENDED_DERIVATIONS)
    .filter(([, rule]) => !FIELD_IDS.includes(rule.from))
    .map(([id]) => id)
    .join(', '))

// Tint coverage must match kTintTable (6 entries) and point at real colours.
ok(`tint key list holds exactly 6 entries`, TINT_KEYS.length === 6)
ok('every tint source resolves to a real field or a derived key',
  Object.values(TINT_SOURCES).every(
    (id) => FIELD_IDS.includes(id) || EXTENDED_COLOR_FIELDS.some((f) => f.id === id),
  ))
// The property allow-list and its resolvers are kept deliberately: nothing writes
// `theme.properties` any more (see section 16), but the data layer still knows
// exactly which keys Chrome reads, so a background-image feature could be added
// back without re-deriving any of this.
ok('the retained property allow-list is exactly the 3 keys Chrome reads',
  CHROME_PROPERTY_KEY_ALLOWLIST.size === 3 &&
    ['ntp_background_alignment', 'ntp_background_repeat', 'ntp_logo_alternate'].every((k) =>
      CHROME_PROPERTY_KEY_ALLOWLIST.has(k),
    ),
  [...CHROME_PROPERTY_KEY_ALLOWLIST].join(', '))
// KEPT, not emitted: `DISPLAY_PROPERTIES` describes the three keys so a future
// background-image feature has the metadata ready. It must stay in step with the
// allow-list it is drawn from, or that future feature inherits a silent bug.
ok('every DISPLAY_PROPERTIES spec sits in the allow-list',
  DISPLAY_PROPERTIES.every((spec) => CHROME_PROPERTY_KEY_ALLOWLIST.has(spec.key)),
  DISPLAY_PROPERTIES.filter((s) => !CHROME_PROPERTY_KEY_ALLOWLIST.has(s.key)).map((s) => s.key).join(', '))
ok('DISPLAY_PROPERTIES covers all 3 allow-listed keys',
  DISPLAY_PROPERTIES.length === CHROME_PROPERTY_KEY_ALLOWLIST.size &&
    [...CHROME_PROPERTY_KEY_ALLOWLIST].every((k) => DISPLAY_PROPERTIES.some((s) => s.key === k)),
  DISPLAY_PROPERTIES.map((s) => s.key).join(', '))

// `LOGO_STYLES` is the only place a UI style id and a Chrome integer are related,
// so it gets its own integrity pass: a bad entry here would reach every manifest.
ok('LOGO_STYLE_IDS covers every declared style', LOGO_STYLE_IDS.length === LOGO_STYLES.length)
ok('the default logo style is a declared style', LOGO_STYLE_IDS.includes(DEFAULT_LOGO_STYLE),
  DEFAULT_LOGO_STYLE)
ok('the logo property key is one Chrome actually reads',
  CHROME_PROPERTY_KEY_ALLOWLIST.has(LOGO_PROPERTY_KEY), LOGO_PROPERTY_KEY)
ok('every logo style carries a value its DISPLAY_PROPERTIES spec allows',
  LOGO_STYLES.every((style) =>
    DISPLAY_PROPERTIES.find((spec) => spec.key === LOGO_PROPERTY_KEY).values.includes(style.value)),
  LOGO_STYLES.map((s) => s.value).join(', '))
ok('no two logo styles share a value',
  new Set(LOGO_STYLES.map((style) => style.value)).size === LOGO_STYLES.length)
ok('every logo style has a label key',
  LOGO_STYLES.every((style) => typeof style.labelKey === 'string' && style.labelKey.length > 0))

// ---------------------------------------------------------------------------
section('3. Manifest generation - RGB array format')
// ---------------------------------------------------------------------------
const rgbResult = buildManifest({ name: DEFAULT_THEME_NAME, colors: DEFAULT_COLORS, colorFormat: 'rgb' })
ok('no warnings for the default theme', rgbResult.warnings.length === 0, rgbResult.warnings.join('; '))

const rgbParsed = parseManifest(rgbResult.json)
ok('output is valid JSON', rgbParsed.ok, rgbParsed.ok ? '' : rgbParsed.error)
ok('manifest_version is 3', rgbResult.manifest.manifest_version === 3)
ok('version is a string', typeof rgbResult.manifest.version === 'string')
ok('name is preserved', rgbResult.manifest.name === DEFAULT_THEME_NAME)

const keys = Object.keys(rgbResult.manifest.theme.colors)
ok(`all ${FIELD_IDS.length} keys written`, keys.length === FIELD_IDS.length, `got ${keys.length}`)
ok('only allow-listed keys written', keys.every((k) => CHROME_COLOR_KEY_ALLOWLIST.has(k)))

const allRgbArrays = Object.values(rgbResult.manifest.theme.colors).every(
  (v) => Array.isArray(v) && v.length === 3 && v.every((n) => Number.isInteger(n) && n >= 0 && n <= 255),
)
ok('every colour is an RGB int array [0-255]', allRgbArrays)
ok('frame === [177,178,255]', JSON.stringify(rgbResult.manifest.theme.colors.frame) === '[177,178,255]')

// ---------------------------------------------------------------------------
section('4. Manifest generation - HEX string format')
// ---------------------------------------------------------------------------
const hexResult = buildManifest({ name: 'Hex Theme', colors: DEFAULT_COLORS, colorFormat: 'hex' })
const allHexStrings = Object.values(hexResult.manifest.theme.colors).every(
  (v) => typeof v === 'string' && /^#[0-9A-F]{6}$/.test(v),
)
ok('every colour is a #RRGGBB string', allHexStrings)
ok('frame === "#B1B2FF"', hexResult.manifest.theme.colors.frame === '#B1B2FF')

// Chromium's LoadColors rejects a non-list colour value outright and aborts the
// whole manifest, so a hex manifest must never be advertised as Chrome-safe.
ok('hex format is flagged not Chrome-loadable', hexResult.chromeSafe === false)
ok('hex format warns about Chrome', hexResult.warnings.some((w) => w.key === 'warn.hexNotChromeLoadable'),
  hexResult.warnings.map((w) => w.key).join(', '))
ok('rgb format is flagged Chrome-loadable', rgbResult.chromeSafe === true)
ok('rgb format emits no format warning',
  !rgbResult.warnings.some((w) => w.key === 'warn.hexNotChromeLoadable'))
ok('COLOR_FORMATS.chromeSafe agrees with the builder',
  COLOR_FORMATS.every((f) => f.chromeSafe === (f.id === 'rgb')),
  COLOR_FORMATS.map((f) => `${f.id}:${f.chromeSafe}`).join(', '))

// ---------------------------------------------------------------------------
section('5. Input hardening')
// ---------------------------------------------------------------------------
const dirty = buildManifest({
  name: '   ',
  colors: { ...DEFAULT_COLORS, frame: 'not-a-colour', toolbar: '#XYZ' },
})
ok('blank name falls back to "User Theme"', dirty.manifest.name === 'User Theme', dirty.manifest.name)
ok('invalid frame dropped, not written', !('frame' in dirty.manifest.theme.colors))
ok('invalid toolbar dropped', !('toolbar' in dirty.manifest.theme.colors))
ok('dropped keys produce warnings', dirty.warnings.length === 2, `${dirty.warnings.length}`)
ok('warnings are i18n keys, not sentences', dirty.warnings.every((w) => typeof w.key === 'string'))
ok('remaining keys still valid', Object.values(dirty.manifest.theme.colors).every(Array.isArray))

const v1 = validateThemeInput({ name: '', colors: DEFAULT_COLORS })
ok('empty name is a validation error', v1.some((i) => i.key === 'validate.nameRequired' && i.field === 'name'))
const v2 = validateThemeInput({ name: 'x'.repeat(46), colors: DEFAULT_COLORS })
ok('over-long name is a validation error', v2.some((i) => i.key === 'validate.nameTooLong'))
const v3 = validateThemeInput({ name: 'Ok', colors: {} })
ok('empty colour set is a validation error', v3.some((i) => i.key === 'validate.noColors'))
const v4 = validateThemeInput({ name: 'Ok', colors: { ...DEFAULT_COLORS, frame: 'nope' } })
ok('invalid colour reported by key', v4.some((i) => i.key === 'validate.invalidColors'))

// ---------------------------------------------------------------------------
section('6. Filename safety')
// ---------------------------------------------------------------------------
const cases = [
  ['My Theme', 'My-Theme.zip'],
  ['../../etc/passwd', 'etc-passwd.zip'],
  ['a:b*c?d"e<f>g|h', 'a-b-c-d-e-f-g-h.zip'],
  ['CON', 'CON-theme.zip'],
  ['...', 'chrome-theme.zip'],
  ['', 'chrome-theme.zip'],
  ['   ', 'chrome-theme.zip'],
  // Non-ASCII is preserved when it still contains ASCII alphanumerics, because
  // modern browsers and every desktop OS handle UTF-8 download names correctly.
  ['Unicode', 'Unicode.zip'],
  // A name with no ASCII alphanumerics at all falls back to a safe default.
  ['\u4E3B\u9898', 'chrome-theme.zip'],
  ['Trailing dots...', 'Trailing-dots.zip'],
]
for (const [input, expected] of cases) {
  const actual = toSafeFilename(input)
  ok(`"${input}" -> "${expected}"`, actual === expected, `got "${actual}"`)
}

// ---------------------------------------------------------------------------
section('7. Presets')
// ---------------------------------------------------------------------------
for (const preset of PRESETS) {
  const built = buildManifest({ name: preset.name, colors: buildColors(preset.colors) })
  const keyCount = Object.keys(built.manifest.theme.colors).length
  ok(`preset "${preset.name}" builds ${FIELD_IDS.length} keys`, keyCount === FIELD_IDS.length, `${keyCount}`)
}

// ---------------------------------------------------------------------------
section('8. Randomiser - coordination + legibility (300 seeds)')
// ---------------------------------------------------------------------------
let minTabText = Infinity
let minNtp = Infinity
let allValid = true
const hues = new Set()
const randomIssues = []
/** How many colour families each seed mixed, bucketed by surface hue spread. */
const familySpread = { one: 0, two: 0, three: 0 }

for (let seed = 1; seed <= 300; seed += 1) {
  const palette = generateRandomColors(seed)
  for (const id of FIELD_IDS) {
    if (!isValidHex(palette[id])) {
      allValid = false
      console.log(`    invalid ${id} at seed ${seed}: ${palette[id]}`)
    }
  }
  hues.add(String(palette.frame).slice(0, 4))
  minTabText = Math.min(minTabText, contrastRatio(palette.tabText, palette.frame))
  minNtp = Math.min(minNtp, contrastRatio(palette.ntpText, palette.ntpBackground))

  // The palette has to survive the app's own audit — a randomise that lights up
  // the contrast panel is a bug report waiting to happen.
  const issues = auditContrast(palette)
  if (issues.length) randomIssues.push(`seed ${seed}: ${issues.map((i) => `${i.fg}/${i.bg}`).join(' ')}`)

  // Distinct hues among the surfaces, ignoring near-identical ones: this is the
  // "one family or several" axis, measured rather than assumed.
  const surfaceHues = ['frame', 'toolbar', 'ntpBackground', 'buttonBackground'].map(
    (id) => hexToHsl(palette[id]).h,
  )
  const distinct = []
  for (const hue of surfaceHues) {
    const gaps = distinct.map((seen) => Math.abs(((hue - seen) % 360 + 360) % 360))
    if (!gaps.some((gap) => Math.min(gap, 360 - gap) < 18)) distinct.push(hue)
  }
  if (distinct.length >= 3) familySpread.three += 1
  else if (distinct.length === 2) familySpread.two += 1
  else familySpread.one += 1
}

ok('every generated field is a valid hex colour', allValid)
ok('tab text vs frame contrast >= 4.5', minTabText >= 4.5, `min ${minTabText.toFixed(2)}`)
ok('NTP text vs NTP background contrast >= 4.5', minNtp >= 4.5, `min ${minNtp.toFixed(2)}`)
ok('generator actually varies (>50 distinct frames)', hues.size > 50, `${hues.size} distinct`)
ok('every random palette passes the contrast audit', randomIssues.length === 0,
  `${randomIssues.length}: ${randomIssues.slice(0, 3).join(' | ')}`)
console.log(`  family spread: ${familySpread.one} single, ${familySpread.two} two-hue, ${familySpread.three} multi-hue`)
ok('randomise produces all three family counts',
  familySpread.one > 0 && familySpread.two > 0 && familySpread.three > 0,
  JSON.stringify(familySpread))
ok('two- and three-family palettes are common, not a rare accident',
  familySpread.two + familySpread.three >= 90,
  `${familySpread.two + familySpread.three} of 300`)

// ---------------------------------------------------------------------------
section('9. Unpacked package + ZIP layout')
// ---------------------------------------------------------------------------
// Chrome's "Load unpacked" takes a DIRECTORY, so the archive must wrap everything
// in exactly one top-level folder. These assertions pin that contract down.
const FAKE_PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01])

const pkg = await buildThemePackage({
  name: DEFAULT_THEME_NAME,
  description: 'A verify fixture.',
  colors: DEFAULT_COLORS,
  icon: FAKE_PNG,
})

// 2026-09-19: the "-theme" suffix was dropped, so the folder is now the plain slug
// ("My Theme" -> "my-theme"). THEME_FOLDER_SUFFIX is pinned empty in the same
// assertion so the suffix cannot creep back in without this test going red.
ok(
  'folder name is the plain slug, with no "-theme" suffix',
  pkg.folderName === 'my-theme' && THEME_FOLDER_SUFFIX === '',
  `${pkg.folderName} / suffix=${JSON.stringify(THEME_FOLDER_SUFFIX)}`,
)
ok('zip filename is the folder name plus .zip', pkg.zipName === `${pkg.folderName}.zip`, pkg.zipName)
ok('package contains exactly 2 files', pkg.files.length === 2, pkg.files.map((f) => f.path).join(', '))
ok('manifest.json is written first', pkg.files[0].path === MANIFEST_FILENAME)
ok('icon.png is written when an icon is supplied', pkg.files.some((f) => f.path === ICON_FILENAME))
ok('manifest references the icon it actually ships', pkg.manifest.icons?.['128'] === ICON_FILENAME,
  JSON.stringify(pkg.manifest.icons))
ok('description is carried into the manifest', pkg.manifest.description === 'A verify fixture.')
ok('manifest_version matches the constant', pkg.manifest.manifest_version === MANIFEST_VERSION)

const zipBlob = await createZip({ files: pkg.files, folder: pkg.folderName })
ok('ZIP blob is produced', zipBlob && zipBlob.size > 0, `size ${zipBlob?.size}`)
ok('ZIP blob has a zip mime type', zipBlob.type.includes('zip'), zipBlob.type)

const buffer = Buffer.from(await zipBlob.arrayBuffer())
ok('ZIP has the PK signature', buffer[0] === 0x50 && buffer[1] === 0x4b, `bytes ${buffer[0]},${buffer[1]}`)

const reopened = await JSZip.loadAsync(buffer)
const entries = Object.keys(reopened.files)
const fileEntries = entries.filter((e) => !e.endsWith('/'))
ok('every ZIP entry lives inside the single top-level folder',
  fileEntries.every((e) => e.startsWith(`${pkg.folderName}/`)),
  entries.join(', '))
ok('ZIP holds exactly the two expected files', fileEntries.length === 2, fileEntries.join(', '))
ok('manifest.json sits at the folder root',
  fileEntries.includes(`${pkg.folderName}/${MANIFEST_FILENAME}`), fileEntries.join(', '))

const restored = await reopened.file(`${pkg.folderName}/${MANIFEST_FILENAME}`).async('string')
ok('manifest.json inside the ZIP is valid JSON', parseManifest(restored).ok)
ok('manifest.json inside the ZIP is byte-identical to the builder output', restored === pkg.json)

const restoredIcon = await reopened.file(`${pkg.folderName}/${ICON_FILENAME}`).async('uint8array')
ok('icon.png round-trips byte-for-byte',
  restoredIcon.length === FAKE_PNG.length && restoredIcon.every((b, i) => b === FAKE_PNG[i]),
  `${restoredIcon.length} vs ${FAKE_PNG.length} bytes`)

// Referencing an icon that is not shipped is a HARD error in
// ThemeHandler::Validate, so the manifest must not mention icons without a file.
const pkgNoIcon = await buildThemePackage({ name: 'No Icon Theme', colors: DEFAULT_COLORS, icon: null })
ok('without an icon only manifest.json is written', pkgNoIcon.files.length === 1,
  pkgNoIcon.files.map((f) => f.path).join(', '))
ok('without an icon the manifest omits the icons key', pkgNoIcon.manifest.icons === undefined,
  JSON.stringify(pkgNoIcon.manifest.icons))

// A hostile theme name must not escape the archive or produce an unusable path.
const nasty = await buildThemePackage({ name: '../../CON:<bad>|name', colors: DEFAULT_COLORS })
ok('folder name never contains a path separator or angle bracket',
  !/[\\/<>:|]/.test(nasty.folderName), nasty.folderName)
ok('folder name never starts with a dot', !nasty.folderName.startsWith('.'), nasty.folderName)

const folderSlug = toThemeFolderName('Rose Morning')
ok('toThemeFolderName slugifies consistently, appending nothing', folderSlug === 'rose-morning', folderSlug)

// The editor now owns the folder name, so the builder must honour one handed in.
// Without this the two fields would silently collapse back into one.
const explicitFolder = await buildThemePackage({
  name: 'Velvet Ribbon Theme',
  folderName: 'velvet-ribbon-theme',
  colors: DEFAULT_COLORS,
})
ok('an explicit folderName wins over the theme name',
  explicitFolder.folderName === 'velvet-ribbon-theme', explicitFolder.folderName)
ok('the zip name follows the explicit folder name',
  explicitFolder.zipName === 'velvet-ribbon-theme.zip', explicitFolder.zipName)
ok('the manifest keeps the theme name verbatim, unslugified',
  explicitFolder.manifest.name === 'Velvet Ribbon Theme', explicitFolder.manifest.name)

// A folder name is typed by the user, not derived, so it keeps its own reading:
// capitals and spaces must survive. Only what a filesystem rejects is removed.
ok('toSafeName keeps case and spaces untouched',
  toSafeName('Blush Matcha Theme') === 'Blush Matcha Theme', toSafeName('Blush Matcha Theme'))
ok('toSafeName trims the ends', toSafeName('  velvet-ribbon-theme  ') === 'velvet-ribbon-theme',
  JSON.stringify(toSafeName('  velvet-ribbon-theme  ')))
ok('toSafeName turns illegal characters into one dash',
  toSafeName('a/b:c*d') === 'a-b-c-d', toSafeName('a/b:c*d'))
ok('toSafeName strips a leading dot and a trailing dot',
  toSafeName('.hidden.') === 'hidden', toSafeName('.hidden.'))
ok('toSafeName still guards Windows device names', toSafeName('CON') === 'CON-theme', toSafeName('CON'))
ok('toSafeName returns empty rather than inventing a name', toSafeName('///') === '', JSON.stringify(toSafeName('///')))

const spacedFolder = await buildThemePackage({
  name: 'Blush Matcha Theme',
  folderName: 'Blush Matcha Theme',
  colors: DEFAULT_COLORS,
})
ok('a typed folder name reaches the package verbatim',
  spacedFolder.folderName === 'Blush Matcha Theme' && spacedFolder.zipName === 'Blush Matcha Theme.zip',
  `${spacedFolder.folderName} / ${spacedFolder.zipName}`)

// ---------------------------------------------------------------------------
section('10. i18n dictionaries')
// ---------------------------------------------------------------------------
const enKeys = Object.keys(en).sort()
const zhKeys = Object.keys(zh).sort()
const missingInZh = enKeys.filter((k) => !Object.prototype.hasOwnProperty.call(zh, k))
const extraInZh = zhKeys.filter((k) => !Object.prototype.hasOwnProperty.call(en, k))
ok('zh has every en key', missingInZh.length === 0, missingInZh.join(', '))
ok('zh has no extra keys', extraInZh.length === 0, extraInZh.join(', '))
ok('zh values are non-empty strings', zhKeys.every((k) => typeof zh[k] === 'string' && zh[k].trim()))
ok('en values are non-empty strings', enKeys.every((k) => typeof en[k] === 'string' && en[k].trim()))

// Two UI blocks have been removed, so their strings must be gone too — in BOTH
// locales. A leftover key is dead weight the next reader would have to prove
// unreachable.
const retiredKeys = [
  // NTP display properties: two keys need a background image we never ship, and
  // the third only picks between Chrome's two pre-rendered logos.
  'export.propLegend',
  'export.propAlignment',
  'export.propRepeat',
  'export.propLogo',
  'export.propLogoStandard',
  'export.propLogoAlternate',
  'export.propNote',
  // The "complete theme" checkbox: the complete manifest is now unconditional.
  'export.complete',
  'export.completeLabel',
  'export.completeHint',
  // The AI naming language picker lost its "follow the interface" option — a
  // Chinese UI produced pinyin folder names, which is never what anyone wants.
  'ai.lang.auto',
]
const survivingKeys = retiredKeys.filter(
  (k) => Object.prototype.hasOwnProperty.call(en, k) || Object.prototype.hasOwnProperty.call(zh, k),
)
ok('every retired i18n key is gone from both locales', survivingKeys.length === 0,
  survivingKeys.join(', '))

// Interpolation placeholders must match between locales, or a message silently
// renders a literal "{count}" in one language.
const placeholderMismatch = enKeys
  .filter((k) => typeof en[k] === 'string' && typeof zh[k] === 'string')
  .filter((k) => {
    const a = (en[k].match(/\{(\w+)\}/g) ?? []).sort().join(',')
    const b = (zh[k].match(/\{(\w+)\}/g) ?? []).sort().join(',')
    return a !== b
  })
ok('placeholders match across locales', placeholderMismatch.length === 0, placeholderMismatch.join(', '))

// Every key the code depends on at runtime, including the dynamically built ones.
const requiredKeys = new Set()
for (const id of FIELD_IDS) {
  requiredKeys.add(`field.${id}.label`)
  requiredKeys.add(`field.${id}.hint`)
}
for (const group of FIELD_GROUPS) requiredKeys.add(group.key)
for (const preset of PRESETS) {
  requiredKeys.add(`preset.${preset.id}.name`)
  requiredKeys.add(`preset.${preset.id}.description`)
}
for (const format of COLOR_FORMATS) {
  requiredKeys.add(format.labelKey)
  if (format.noteKey) requiredKeys.add(format.noteKey)
}
for (const mode of OUTPUT_MODES) requiredKeys.add(mode.labelKey)
for (const mode of VSCODE_OUTPUT_MODES) requiredKeys.add(mode.labelKey)
for (const m of SOLVER_MODES) requiredKeys.add(`studio.mode.${m}`)
for (const i of INTENSITIES) requiredKeys.add(`studio.intensity.${i}`)
for (const strategy of ACCENT_STRATEGIES) {
  requiredKeys.add(`studio.accent.${strategy}`)
  requiredKeys.add(`studio.accentHint.${strategy}`)
}
for (const code of LANGUAGES) requiredKeys.add(`lang.${code}`)
// Passed as props by the workbenches, so the static `t('...')` scan cannot see
// them: a missing one would silently render the raw key as the page headline.
for (const key of [
  'hero.title',
  'hero.subtitle',
  'hero.vscode.title',
  'hero.vscode.subtitle',
  // Reached through a computed key in the workbench.
  'vscode.export.outputHint',
  'vscode.export.outputHintNoFolder',
  'studio.vscodeSeedHint',
]) {
  requiredKeys.add(key)
}
// Emitted by manifest.js as structured diagnostics.
for (const key of ['warn.droppedInvalid', 'warn.skippedKey', 'warn.hexNotChromeLoadable']) {
  requiredKeys.add(key)
}
// Referenced by the solver's `notes`.
for (const key of ['studio.noteNeutral', 'studio.noteFrameAdjusted', 'studio.noteSeedsUsed']) {
  requiredKeys.add(key)
}
// Built dynamically by the AI naming panel.
for (const style of AI_STYLES) requiredKeys.add(`ai.style.${style}`)
for (const language of AI_LANGUAGES) requiredKeys.add(`ai.lang.${language}`)

const missingRequired = [...requiredKeys].filter((k) => !Object.prototype.hasOwnProperty.call(en, k))
ok(`all ${requiredKeys.size} runtime-required keys exist`, missingRequired.length === 0, missingRequired.join(', '))

// Static `t('...')` / `translate(..., '...')` calls across the source tree.
const sourceFiles = []
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(js|jsx)$/.test(entry.name)) sourceFiles.push(full)
  }
}
walk(join(here, '..', 'src'))

const referenced = new Set()
const CALL_RE = /\bt\(\s*'([A-Za-z][\w.-]*)'/g
for (const file of sourceFiles) {
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(CALL_RE)) referenced.add(match[1])
}
const unknownRefs = [...referenced].filter((k) => !Object.prototype.hasOwnProperty.call(en, k))
ok(`every literal t('...') key exists (${referenced.size} found)`, unknownRefs.length === 0, unknownRefs.join(', '))

// ---------------------------------------------------------------------------
section('10b. The complete manifest is unconditional')
// ---------------------------------------------------------------------------
// "Always complete" is a *product* decision made in the app, not a builder
// default, so no call to buildManifest can prove it. Assert it against the
// source instead. The guard exists so nobody quietly reintroduces the toggle, or
// lets the live preview and the downloaded ZIP diverge in which shape they build.
const appSource = readFileSync(join(here, '..', 'src', 'App.jsx'), 'utf8')
const completeFlag = appSource.match(/const COMPLETE_THEME = (true|false)/)
ok('App.jsx declares COMPLETE_THEME = true', completeFlag?.[1] === 'true', String(completeFlag?.[1]))

const completeSites = [...appSource.matchAll(/complete:\s*COMPLETE_THEME/g)].length
ok('both build call sites request the complete manifest', completeSites === 2, `${completeSites}`)

// Look for the specific plumbing that a reintroduced toggle would need, rather
// than a bare-word search for `complete` — prose in the docblocks legitimately
// discusses the concept, and a loose negative match would fail on a comment.
const removedPlumbing = ['setComplete', 'ntpProperties', 'complete={', 'onCompleteChange']
const survivingPlumbing = removedPlumbing.filter((token) => appSource.includes(token))
ok('no complete-mode state, setter or prop survives in App.jsx',
  survivingPlumbing.length === 0, survivingPlumbing.join(', '))

const componentSources = sourceFiles
  .filter((file) => file.includes('components'))
  .map((file) => readFileSync(file, 'utf8'))
ok('no complete-mode control remains in any component',
  componentSources.every((src) => !/complete-mode|onCompleteChange/.test(src)),
  componentSources.filter((src) => /complete-mode|onCompleteChange/.test(src)).length + ' file(s)')

// ---------------------------------------------------------------------------
section('11. Smart palette solver')
// ---------------------------------------------------------------------------
const empty = solveTheme({ seeds: [] })
ok('no seeds -> ok:false', empty.ok === false)
ok('invalid seeds -> ok:false', solveTheme({ seeds: ['nope', ''] }).ok === false)
ok('duplicates are collapsed', solveTheme({ seeds: ['#B1B2FF', '#b1b2ff'] }).seedCount === 1)

// The palette card from the brief, end to end.
const CARD = ['#FFF5F5', '#F7D6D0', '#E2B4BD', '#4A4A4A']
const card = solveTheme({ seeds: CARD })
ok('card solves', card.ok === true)
ok('card is a light theme', card.mode === 'light')
ok('card frame is the most chromatic seed (#E2B4BD)', card.colors.frame === '#E2B4BD', card.colors.frame)
ok('card reuses all 4 seeds', usedSeedHexes(card.colors, CARD).length === 4, usedSeedHexes(card.colors, CARD).join(','))
ok('card: near-white seed becomes a surface, not the frame', card.colors.toolbar === '#FFF5F5', card.colors.toolbar)
ok('card: dark seed becomes text', card.colors.tabBackgroundText === '#4A4A4A', card.colors.tabBackgroundText)
ok('card produces every field', FIELD_IDS.every((id) => isValidHex(card.colors[id])))
ok('card is contrast-clean', auditContrast(card.colors).length === 0, JSON.stringify(auditContrast(card.colors)))
ok('audit rule set is the expected size', AUDIT_RULES.length === 8, `${AUDIT_RULES.length}`)

// Neutral input must stay neutral: never invent a hue the user did not choose.
const grey = solveTheme({ seeds: ['#808080'] })
ok('neutral seed flagged as neutral', grey.neutral === true)
ok(
  'neutral seed yields a greyscale theme',
  FIELD_IDS.every((id) => {
    const rgb = parseHex(grey.colors[id])
    return rgb.r === rgb.g && rgb.g === rgb.b
  }),
)

// Sweep the hue wheel + both intensities: every output must be legible and valid.
let sweepFailures = []
const sweepByGroup = new Map()
let sweepWorst = { ratio: Infinity, label: '' }
let sweepNeutralHueLeaks = 0
for (let hue = 0; hue < 360; hue += 3) {
  for (const intensity of INTENSITIES) {
    for (const mode of SOLVER_MODES) {
      const seedHex = hslToHex({ h: hue, s: 55, l: 62 })
      const result = solveTheme({ seeds: [seedHex], intensity, mode })
      if (!result.ok) {
        sweepFailures.push(`${seedHex} ok=false`)
        continue
      }
      for (const id of FIELD_IDS) {
        if (!isValidHex(result.colors[id])) sweepFailures.push(`${seedHex} ${id}=${result.colors[id]}`)
      }
      const issues = auditContrast(result.colors)
      for (const issue of issues) {
        const key = `${mode}/${intensity} ${issue.fg} on ${issue.bg}`
        sweepByGroup.set(key, (sweepByGroup.get(key) ?? 0) + 1)
        const score = issue.ratio / issue.min
        if (score < sweepWorst.ratio) sweepWorst = { ratio: score, label: `${seedHex} ${key}` }
      }
      if (issues.length) sweepFailures.push(`${seedHex} ${mode}/${intensity}`)
      // The derived accent must stay near the family hue (no foreign hue injected).
      if (result.neutral) sweepNeutralHueLeaks += 1
    }
  }
}
const sweepGroups = [...sweepByGroup.entries()].sort((a, b) => b[1] - a[1])
const describeWorst = (worst) =>
  worst.label
    ? `${(worst.ratio * 100).toFixed(1)}% of the required ratio (${worst.label})`
    : 'no contrast issues in any solve'
console.log(`  worst margin: ${describeWorst(sweepWorst)}`)
for (const [key, count] of sweepGroups) console.log(`  failing group: ${key} x${count}`)
ok('solver sweep (1080 solves): all valid + contrast-clean', sweepFailures.length === 0,
  `${sweepFailures.length} failing solves, ${sweepGroups.length} distinct pairs`)
ok('a chromatic seed is never reported neutral', sweepNeutralHueLeaks === 0, `${sweepNeutralHueLeaks}`)

// ---------------------------------------------------------------------------
// Regression guards for the "the generated theme looks ugly" report. Two
// independent defects were found, both on a single pale seed:
//
//   1. One seed snapped into four *stacked* surface roles at once, so frame /
//      toolbar / background_tab / button_background / ntp_background all came
//      back byte-identical and the surface separation was exactly 0.000 — the
//      whole browser was one flat wash with no depth.
//   2. The accent hue drifted an unconditional +20 degrees, which is only
//      flattering in half the wheel: from a pink (0 deg) it lands on
//      orange-brown, from a green (120 deg) on olive. Combined with a
//      chroma-derived saturation of ~26% for pale seeds, that is literal mud.
// ---------------------------------------------------------------------------
const PALE_SEED = '#F5CBCB'
const pale = solveTheme({ seeds: [PALE_SEED] })
const STACKED_SURFACES = [
  'frame',
  'toolbar',
  'backgroundTab',
  'buttonBackground',
  'omniboxBackground',
  'ntpBackground',
]
ok(
  'a single seed cannot claim four stacked surfaces',
  new Set(STACKED_SURFACES.map((id) => pale.colors[id])).size >= 4,
  STACKED_SURFACES.map((id) => pale.colors[id]).join(','),
)
// Distinctness is not enough on its own — the separation has to be *perceptible*.
// Measured in relative luminance, this was 0.0000 before the fix and is ~0.030 now.
let paleSeparation = Infinity
for (let i = 0; i < STACKED_SURFACES.length; i += 1) {
  for (let j = i + 1; j < STACKED_SURFACES.length; j += 1) {
    const a = relativeLuminance(pale.colors[STACKED_SURFACES[i]])
    const b = relativeLuminance(pale.colors[STACKED_SURFACES[j]])
    paleSeparation = Math.min(paleSeparation, Math.abs(a - b))
  }
}
ok(
  'its stacked surfaces stay perceptibly separated',
  paleSeparation >= 0.02,
  `min dY=${paleSeparation.toFixed(4)}`,
)
// Suppressing reuse must not cost fidelity: the seed the user picked still has
// to appear verbatim in the result, otherwise the whole snap mechanism is moot.
ok(
  'the pale seed is still used verbatim',
  Object.values(pale.colors).includes(PALE_SEED),
  PALE_SEED,
)

// The accent may not sink into the mud band. Hue 30-60 is orange through olive;
// standing there at low saturation is what "muddy brown link colour" means.
const muddyAccents = []
const lowSatAccents = []
for (let hue = 0; hue < 360; hue += 3) {
  const seedHex = hslToHex({ h: hue, s: 55, l: 62 })
  const link = solveTheme({ seeds: [seedHex] }).colors.ntpLink
  const { h, s } = hexToHsl(link)
  if (h >= 30 && h <= 60 && s < 35) muddyAccents.push(`${seedHex}->${link} s=${s.toFixed(0)}`)
  // Pale seeds used to derive the accent from their own low chroma (~26%),
  // which is a grey masquerading as an accent.
  if (s < 30) lowSatAccents.push(`${seedHex}->${link} s=${s.toFixed(0)}`)
}
ok(
  'no accent falls into the orange-olive mud band',
  muddyAccents.length === 0,
  muddyAccents.slice(0, 4).join(', '),
)
ok('no accent is left too desaturated to read as an accent', lowSatAccents.length === 0,
  lowSatAccents.slice(0, 4).join(', '))

// A pale seed must not produce a grey frame — the frame is where the theme's
// identity lives, so it gets its own saturation floor on top of the chroma rule.
ok(
  'a pale seed still yields a tinted frame',
  hexToHsl(pale.colors.frame).s >= 30,
  `${pale.colors.frame} s=${hexToHsl(pale.colors.frame).s.toFixed(0)}`,
)

// Regression guard for the frame band. A mid-tone seed forced into dark mode used
// to produce a mid-tone frame, which makes the inactive-tab text impossible to
// make legible (it would have to be both lighter than the frame and darker than
// the near-black background tab). The frame is now clamped into the mode's band.
const midToneDark = solveTheme({ seeds: ['#D36969'], mode: 'dark' })
ok('mid-tone seed in dark mode is contrast-clean', auditContrast(midToneDark.colors).length === 0,
  JSON.stringify(auditContrast(midToneDark.colors)))
ok('mid-tone seed in dark mode gets a dark frame', hexToHsl(midToneDark.colors.frame).l < 45,
  midToneDark.colors.frame)
ok('a clamped frame reports why', midToneDark.notes.some((n) => n.key === 'studio.noteFrameAdjusted'))

// Auto mode must never need the clamp: the mode is derived from the seed itself.
const autoMid = solveTheme({ seeds: ['#D36969'] })
ok('auto mode keeps the seed as the frame', autoMid.colors.frame === '#D36969', autoMid.colors.frame)

// ---------------------------------------------------------------------------
section('11b. Solver edge cases (extreme seeds x every mode and intensity)')
// ---------------------------------------------------------------------------
// Seeds far outside the frame band are where the second failure class lives: a
// fully saturated blue has almost no luminance headroom, and a saturated yellow
// is far brighter than its HSL lightness suggests.
const EDGE_SEEDS = [
  '#000000', '#FFFFFF', '#808080', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF',
]
for (let hue = 0; hue < 360; hue += 20) {
  EDGE_SEEDS.push(hslToHex({ h: hue, s: 92, l: 16 }), hslToHex({ h: hue, s: 92, l: 88 }))
}

const edgeFailures = []
let edgeWorst = { ratio: Infinity, label: '' }
for (const seedHex of EDGE_SEEDS) {
  for (const mode of SOLVER_MODES) {
    for (const intensity of INTENSITIES) {
      const result = solveTheme({ seeds: [seedHex], mode, intensity })
      if (!result.ok) {
        edgeFailures.push(`${seedHex} ok=false`)
        continue
      }
      for (const id of FIELD_IDS) {
        if (!isValidHex(result.colors[id])) edgeFailures.push(`${seedHex} ${id} invalid`)
      }
      for (const issue of auditContrast(result.colors)) {
        const score = issue.ratio / issue.min
        if (score < edgeWorst.ratio) {
          edgeWorst = { ratio: score, label: `${seedHex} ${mode}/${intensity} ${issue.fg}/${issue.bg}` }
        }
        edgeFailures.push(`${seedHex} ${mode}/${intensity} ${issue.fg}/${issue.bg} ${issue.ratio.toFixed(2)}`)
      }
    }
  }
}
console.log(`  edge worst margin: ${describeWorst(edgeWorst)}`)
ok(
  `edge sweep (${EDGE_SEEDS.length * 9} solves): all valid + contrast-clean`,
  edgeFailures.length === 0,
  edgeFailures.slice(0, 3).join(' | '),
)

// Idempotence matters for the UI: re-solving a solved theme must be stable.
const again = solveTheme({ seeds: [card.colors.frame] })
ok('solving is deterministic', JSON.stringify(again) === JSON.stringify(solveTheme({ seeds: [card.colors.frame] })))

// ---------------------------------------------------------------------------
section('12. Colour extraction from text')
// ---------------------------------------------------------------------------
const eqColors = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected)

ok('prefixed hex list, order preserved', eqColors(extractColors(CARD.join(' ')), CARD))
ok('bare hex list works', eqColors(extractColors('FFF5F5 F7D6D0 E2B4BD 4A4A4A'), CARD))
ok('newline / comma / semicolon separated', eqColors(extractColors(`${CARD[0]},${CARD[1]}\n${CARD[2]} ; ${CARD[3]}`), CARD))
ok('rgb() and rgba() parse', eqColors(extractColors('rgb(177, 178, 255)'), ['#B1B2FF']))
ok('rgba() drops alpha', eqColors(extractColors('rgba(74, 74, 74, 0.5)'), ['#4A4A4A']))
ok('coolors link yields its colours', eqColors(extractColors('https://coolors.co/palette/fff5f5-f7d6d0-e2b4bd-4a4a4a'), CARD))
ok('coolors link is recognised as a palette url', looksLikePaletteUrl('https://coolors.co/palette/fff5f5-f7d6d0'))
ok('adobe color link is recognised', looksLikePaletteUrl('https://color.adobe.com/create'))
ok('a random url is not a palette url', !looksLikePaletteUrl('https://example.com/blog'))

// The false-positive guard: these are all valid hex characters but are words.
ok('"decade facade beaded efface" yields nothing', eqColors(extractColors('decade facade beaded efface'), []))
ok('prose yields nothing', eqColors(extractColors('The quick brown fox jumps over the lazy dog'), []))
ok('bare hex is ignored when prefixed hex exists', eqColors(extractColors('#B1B2FF and decade'), ['#B1B2FF']))
ok('duplicates are removed', eqColors(extractColors('#B1B2FF #b1b2ff'), ['#B1B2FF']))
ok('empty input yields nothing', eqColors(extractColors(''), []))
ok('three-digit shorthand expands', eqColors(extractColors('#FFF'), ['#FFFFFF']))
ok('one colour only', eqColors(extractColors('#E2B4BD'), ['#E2B4BD']))
ok('looksLikeJson detects a manifest', looksLikeJson('{ "manifest_version": 3 }'))
ok('looksLikeJson rejects a colour list', !looksLikeJson('#FFF5F5 #F7D6D0'))

// ---------------------------------------------------------------------------
section('13. Theme import / export round-trip')
// ---------------------------------------------------------------------------
const asManifest = importThemeJson(rgbResult.json)
ok('our own RGB manifest imports back', asManifest.ok === true)
ok('imported shape is a manifest', asManifest.kind === 'manifest')
ok('colour set survives the round-trip', eqColors(asManifest.colors, DEFAULT_COLORS), JSON.stringify(asManifest.colors))
ok('name is carried over', asManifest.name === DEFAULT_THEME_NAME, String(asManifest.name))
ok('no unknown keys for our own output', asManifest.unknownKeys.length === 0, asManifest.unknownKeys.join(','))

const asHexManifest = importThemeJson(hexResult.json)
ok('hex manifests import too', asHexManifest.ok && eqColors(asHexManifest.colors, DEFAULT_COLORS))

const exported = importThemeJson(exportThemeJson({ name: 'Round Trip', colors: DEFAULT_COLORS, colorFormat: 'rgb' }))
ok('ThemeBake export imports back', exported.ok && eqColors(exported.colors, DEFAULT_COLORS))

// The one display property we write has to survive the round-trip as well, or
// "import your own export" would silently reset the New Tab logo behaviour.
ok('an exported classic logo style imports back as "classic"',
  importThemeJson(buildManifest({ name: 'Classic RT', colors: DEFAULT_COLORS, logoStyle: 'classic' }).json)
    .logoStyle === 'classic')
ok('an exported adaptive logo style imports back as "adaptive"',
  importThemeJson(buildManifest({ name: 'Adaptive RT', colors: DEFAULT_COLORS }).json).logoStyle === 'adaptive')
ok('a theme that never set the logo property reports no style, not the default',
  importThemeJson(JSON.stringify({ theme: { colors: { frame: [1, 2, 3] } } })).logoStyle === null)
ok('an out-of-range logo flag is reported as no style rather than guessed',
  importThemeJson(
    JSON.stringify({ theme: { colors: { frame: [1, 2, 3] }, properties: { ntp_logo_alternate: 7 } } }),
  ).logoStyle === null)

const bare = importThemeJson(JSON.stringify({ frame: [226, 180, 189] }))
ok('bare colour map accepted', bare.ok && bare.colors.frame === '#E2B4BD', JSON.stringify(bare))
ok('bare map is tagged as such', bare.ok && bare.kind === 'bare', bare.ok ? bare.kind : bare.error)

// Arbitrary JSON must NOT be mistaken for a bare colour map.
ok('unrelated JSON is rejected as a theme', importThemeJson('{"hello":"world"}').ok === false)
ok('nested theme with no colors rejected', importThemeJson('{"theme":{"images":{}}}').ok === false)

const alpha = importThemeJson(JSON.stringify({ theme: { colors: { frame: [226, 180, 189, 128] } } }))
ok('RGBA array imports and flags dropped alpha', alpha.ok && alpha.colors.frame === '#E2B4BD' && alpha.alphaDropped === true)

const partial = importThemeJson(JSON.stringify({ theme: { colors: { frame: [1, 2, 3], nope_key: [4, 5, 6] } } }))
ok('unknown keys are reported, not applied', partial.ok && partial.unknownKeys.includes('nope_key'))
ok('unknown key is absent from the result', partial.ok && !('nope_key' in partial.colors))

ok('invalid JSON rejected', importThemeJson('{ not json').ok === false)
ok('JSON with no colours rejected', importThemeJson('{"theme":{}}').ok === false)
ok('array payload rejected', importThemeJson('[1,2,3]').ok === false)
ok('non-colour values rejected', importThemeJson(JSON.stringify({ theme: { colors: { frame: 'x' } } })).ok === false)

// ---------------------------------------------------------------------------
section('14. Contrast audit + auto-repair')
// ---------------------------------------------------------------------------
ok('the default theme passes the audit', auditContrast(DEFAULT_COLORS).length === 0, JSON.stringify(auditContrast(DEFAULT_COLORS)))
ok('every preset passes the audit', PRESETS.every((p) => auditContrast(buildColors(p.colors)).length === 0),
  PRESETS.filter((p) => auditContrast(buildColors(p.colors)).length).map((p) => p.name).join(', '))

const broken = { ...DEFAULT_COLORS, tabText: DEFAULT_COLORS.frame, ntpText: DEFAULT_COLORS.ntpBackground }
const brokenIssues = auditContrast(broken)
ok('identical fg/bg colour is detected', brokenIssues.some((i) => i.fg === 'tabText' && i.bg === 'frame'))
ok('issue carries the measured and required ratio', brokenIssues.every((i) => i.ratio >= 1 && i.min > 0))
ok('issues are sorted worst-first', brokenIssues.every((issue, index) => {
  if (index === 0) return true
  const prev = brokenIssues[index - 1]
  return prev.ratio / prev.min <= issue.ratio / issue.min
}))

const repaired = repairContrast(broken)
ok('repair changes something', repaired.changed > 0)
ok('repair clears every issue', auditContrast(repaired.colors).length === 0, JSON.stringify(auditContrast(repaired.colors)))
ok('repair only moves foregrounds', repaired.colors.frame === broken.frame && repaired.colors.ntpBackground === broken.ntpBackground)
ok('repair is a no-op on an already-clean theme', repairContrast(DEFAULT_COLORS).changed === 0)
ok('repair is idempotent', repairContrast(repaired.colors).changed === 0)

// ---------------------------------------------------------------------------
section('15. Image extraction primitives')
// ---------------------------------------------------------------------------
const rgbOf = (hex) => parseHex(hex)

/** Build a flat palette card: `hexes.length` horizontal bands, top to bottom. */
function makeBandImage(hexes, rowsPerBand = 25, width = 6) {
  const height = hexes.length * rowsPerBand
  const data = new Uint8ClampedArray(width * height * 4)
  let p = 0
  for (const hex of hexes) {
    const { r, g, b } = rgbOf(hex)
    for (let i = 0; i < rowsPerBand * width; i += 1) {
      data[p++] = r
      data[p++] = g
      data[p++] = b
      data[p++] = 255
    }
  }
  return { data, width, height }
}

/** Build an image whose pixels are exactly `entries` in the given proportions. */
function makeAreaImage(entries, size = 40) {
  const data = new Uint8ClampedArray(size * size * 4)
  let p = 0
  for (const [hex, count] of entries) {
    const { r, g, b } = rgbOf(hex)
    for (let i = 0; i < count; i += 1) {
      data[p++] = r
      data[p++] = g
      data[p++] = b
      data[p++] = 255
    }
  }
  return { data, width: size, height: size }
}

/**
 * Build a *screenshot* of a palette card, not the card on its own: a page-white
 * margin, an inset swatch block with rounded top corners, an action-button row,
 * colour dots, and two printed label lines underneath.
 */
function makeCardOnPage(hexes, pageHex = '#FFFFFF') {
  const width = 838
  const height = 1048
  const { r: pr, g: pg, b: pb } = rgbOf(pageHex)
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = pr
    data[i * 4 + 1] = pg
    data[i * 4 + 2] = pb
    data[i * 4 + 3] = 255
  }
  const img = { data, width, height }

  const paint = (x0, y0, x1, y1, hex, alpha = 1) => {
    const { r, g, b } = rgbOf(hex)
    for (let y = Math.max(0, y0); y <= Math.min(height - 1, y1); y += 1) {
      for (let x = Math.max(0, x0); x <= Math.min(width - 1, x1); x += 1) {
        const o = (y * width + x) * 4
        data[o] = Math.round(data[o] * (1 - alpha) + r * alpha)
        data[o + 1] = Math.round(data[o + 1] * (1 - alpha) + g * alpha)
        data[o + 2] = Math.round(data[o + 2] * (1 - alpha) + b * alpha)
      }
    }
  }

  const bx0 = 50
  const bx1 = 730
  const by0 = 22
  const blockBottom = 700
  const each = Math.round((blockBottom - by0) / hexes.length)
  hexes.forEach((hex, i) => {
    const y0 = by0 + i * each
    const y1 = i === hexes.length - 1 ? blockBottom : y0 + each - 1
    paint(bx0, y0, bx1, y1, hex)
  })

  // Rounded top corners push page white back over the swatch block's extremes.
  const radius = 26
  for (let dy = 0; dy < radius; dy += 1) {
    const cut = Math.round(radius - Math.sqrt(Math.max(0, radius * radius - (radius - dy) ** 2)))
    for (let dx = 0; dx < cut; dx += 1) {
      paint(bx0 + dx, by0 + dy, bx0 + dx, by0 + dy, pageHex)
      paint(bx1 - dx, by0 + dy, bx1 - dx, by0 + dy, pageHex)
    }
  }

  const ink = '#111111'
  for (let i = 0; i < 3; i += 1) {
    const x0 = 62 + i * 92
    paint(x0, 742, x0 + 74, 744, ink)
    paint(x0, 796, x0 + 74, 798, ink)
    paint(x0, 742, x0 + 2, 798, ink)
    paint(x0 + 72, 742, x0 + 74, 798, ink)
    for (let t = 0; t < 6; t += 1) paint(x0 + 12 + t * 9, 762, x0 + 18 + t * 9, 778, ink, 0.8)
  }

  hexes.forEach((hex, i) => {
    const cx = 95 + i * 165
    for (let dy = -24; dy <= 24; dy += 1) {
      const half = Math.round(Math.sqrt(Math.max(0, 24 * 24 - dy * dy)))
      paint(cx - half, 868 + dy, cx + half, 868 + dy, hex)
    }
  })

  for (let t = 0; t < 8; t += 1) {
    paint(46 + t * 15, 946, 52 + t * 15, 966, ink, 0.85)
    paint(46 + t * 22, 1012, 52 + t * 22, 1030, ink, 0.85)
  }

  return img
}

const bandImage = makeBandImage(CARD)
const flatness = measureFlatness(bandImage.data, bandImage.width, bandImage.height)
ok('a palette card measures as flat (>0.9)', flatness > 0.9, flatness.toFixed(3))

const bands = detectBands(bandImage.data, bandImage.width, bandImage.height)
ok('bands detected', Array.isArray(bands) && bands.length === 4, String(bands?.length))
ok('band colours are exact and in original order', eqColors((bands ?? []).map((b) => b.hex), CARD),
  (bands ?? []).map((b) => b.hex).join(','))
ok('band shares are reported', (bands ?? []).every((b) => b.share > 0.2))

// A photo-like image: no long runs of identical pixels, so flatness must not
// reach the band-detection threshold. Built as a high-frequency pattern whose
// row averages all converge on mid-grey, which also means band detection finds
// no bands at all and returns null (the caller then falls back to clustering).
const noise = makeBandImage(CARD)
for (let y = 0; y < noise.height; y += 1) {
  for (let x = 0; x < noise.width; x += 1) {
    const o = (y * noise.width + x) * 4
    noise.data[o] = (x * 37 + y * 11) % 256
    noise.data[o + 1] = (x * 13 + y * 41) % 256
    noise.data[o + 2] = (x * 29 + y * 7) % 256
    noise.data[o + 3] = 255
  }
}
const noiseFlatness = measureFlatness(noise.data, noise.width, noise.height)
ok('a noisy image is not flat (<0.72)', noiseFlatness < 0.72, noiseFlatness.toFixed(3))

// The guarantee that matters is the negative one: an image that is not a palette
// card must never be reported as one, or the UI would claim "exact colours
// recovered" for a photo.
const noiseBands = detectBands(noise.data, noise.width, noise.height)
ok(
  'band detection never falsely recovers the card palette',
  noiseBands === null || !eqColors(noiseBands.map((b) => b.hex), CARD),
  noiseBands ? noiseBands.map((b) => b.hex).join(',') : 'null',
)

// ---------------------------------------------------------------------------
// The regression that actually bites in the wild: a *screenshot* of a palette
// card. Averaging whole lines across the page margin used to wash every swatch
// out, push two deliberately-distinct pastels inside the merge threshold, and
// turn the printed-label area into an extra white band — so a four-colour card
// was reported as three real colours plus white.
// ---------------------------------------------------------------------------
const REPORTED_CARD = ['#FBEFEF', '#FFE2E2', '#F5CBCB', '#C5B3D3']
const pageShot = makeCardOnPage(REPORTED_CARD)
const shotFlatness = measureFlatness(pageShot.data, pageShot.width, pageShot.height)
ok('a palette-card screenshot reads as flat', shotFlatness >= 0.72, shotFlatness.toFixed(3))

const shotBands = detectBands(pageShot.data, pageShot.width, pageShot.height)
const shotHexes = (shotBands ?? []).map((b) => b.hex)
ok('the swatch block yields 4 bands, not 3 and not 5', shotBands?.length === 4,
  `${shotBands?.length} -> ${shotHexes.join(',')}`)
ok('the exact painted colours survive the page margin',
  eqColors(shotHexes, REPORTED_CARD), shotHexes.join(','))
ok('the printed label area is not reported as a colour',
  shotHexes.every((h) => h !== '#FFFFFF' && h !== '#FEFEFE'), shotHexes.join(','))
ok('two pale pinks ~30 apart are not merged into one',
  shotHexes.includes('#FFE2E2') && shotHexes.includes('#F5CBCB'), shotHexes.join(','))

const threeShot = makeCardOnPage(['#123456', '#ABCDEF', '#FEDCBA'])
ok(
  'a 3-colour card screenshot recovers exactly 3',
  eqColors((detectBands(threeShot.data, threeShot.width, threeShot.height) ?? []).map((b) => b.hex),
    ['#123456', '#ABCDEF', '#FEDCBA']),
)

// A two-band card fills half its own border with one swatch. The background test
// must not mistake that swatch for page white and trim it off.
const twoCard = makeBandImage(['#FFF5F5', '#4A4A4A'], 40, 120)
ok(
  'a 2-colour card is not mistaken for a page margin',
  eqColors((detectBands(twoCard.data, twoCard.width, twoCard.height) ?? []).map((b) => b.hex),
    ['#FFF5F5', '#4A4A4A']),
  (detectBands(twoCard.data, twoCard.width, twoCard.height) ?? []).map((b) => b.hex).join(','),
)

const areaImage = makeAreaImage([
  ['#F7D6D0', 640],
  ['#E2B4BD', 560],
  ['#4A4A4A', 400],
])
const clusters = clusterColors(areaImage.data, areaImage.width, areaImage.height, 6)
ok('clustering returns one entry per distinct colour', clusters.length === 3, clusters.map((c) => c.hex).join(','))
ok('cluster colours are exact, sorted light to dark', eqColors(clusters.map((c) => c.hex), ['#F7D6D0', '#E2B4BD', '#4A4A4A']),
  clusters.map((c) => c.hex).join(','))
ok('cluster shares reflect pixel area', eqColors(clusters.map((c) => Number(c.share.toFixed(2))), [0.4, 0.35, 0.25]),
  clusters.map((c) => c.share.toFixed(3)).join(','))
ok('cluster shares sum to ~1', Math.abs(clusters.reduce((s, c) => s + c.share, 0) - 1) < 0.001,
  clusters.reduce((s, c) => s + c.share, 0).toFixed(4))

// Determinism: the same input must produce the same output, every time.
const repeat = clusterColors(areaImage.data, areaImage.width, areaImage.height, 6)
ok('clustering is deterministic', eqColors(repeat.map((c) => c.hex), clusters.map((c) => c.hex)))

// A dominant flat backdrop must not be reported as the photo's main colour.
const backdrop = makeAreaImage([
  ['#FFFFFF', 1200],
  ['#E2B4BD', 300],
  ['#4A4A4A', 100],
])
const backdropClusters = clusterColors(backdrop.data, backdrop.width, backdrop.height, 6)
ok('a dominant plain backdrop is dropped', !backdropClusters.some((c) => c.hex === '#FFFFFF'),
  backdropClusters.map((c) => c.hex).join(','))

// ---------------------------------------------------------------------------
section('16. The 24-key table + tints, and the builder\'s lean path')
// ---------------------------------------------------------------------------
const coreBuild = buildManifest({ name: 'Core', colors: DEFAULT_COLORS })
ok('core build writes 14 colour keys', coreBuild.usedChromeKeys.length === 14,
  `${coreBuild.usedChromeKeys.length}`)
ok('core build writes no tints', coreBuild.usedTintKeys.length === 0)
ok('core build omits theme.tints entirely', coreBuild.manifest.theme.tints === undefined)

const fullBuild = buildManifest({ name: 'Full', colors: DEFAULT_COLORS, complete: true })
const fullKeys = Object.keys(fullBuild.manifest.theme.colors)
ok('complete build writes all 24 colour keys', fullKeys.length === 24, `${fullKeys.length}`)
ok('complete build writes only allow-listed keys',
  fullKeys.every((k) => CHROME_COLOR_KEY_ALLOWLIST.has(k)),
  fullKeys.filter((k) => !CHROME_COLOR_KEY_ALLOWLIST.has(k)).join(', '))
ok('complete build writes no dead key',
  fullKeys.every((k) => !CHROME_DEAD_COLOR_KEYS.has(k)),
  fullKeys.filter((k) => CHROME_DEAD_COLOR_KEYS.has(k)).join(', '))
ok('complete build covers the whole allow-list',
  [...CHROME_COLOR_KEY_ALLOWLIST].every((k) => fullKeys.includes(k)),
  [...CHROME_COLOR_KEY_ALLOWLIST].filter((k) => !fullKeys.includes(k)).join(', '))
ok('complete build adds toolbar_text', fullKeys.includes('toolbar_text'))
ok('complete build adds ntp_header', fullKeys.includes('ntp_header'))
ok('complete build adds the incognito frame keys',
  fullKeys.includes('frame_incognito') && fullKeys.includes('frame_incognito_inactive'))

// Turning complete mode on must not perturb a single core colour. If it did, the
// live preview and the downloaded theme would disagree.
const coreOnly = coreBuild.manifest.theme.colors
ok('every core colour is unchanged in complete mode',
  Object.entries(coreOnly).every(([k, v]) => JSON.stringify(fullBuild.manifest.theme.colors[k]) === JSON.stringify(v)),
  Object.keys(coreOnly).filter((k) => JSON.stringify(coreOnly[k]) !== JSON.stringify(fullBuild.manifest.theme.colors[k])).join(', '))

// Tints: kTintTable has 6 entries and every value must be a list of 3 doubles.
ok('complete build writes 6 tints', fullBuild.usedTintKeys.length === 6, fullBuild.usedTintKeys.join(', '))
ok('tint keys match kTintTable exactly',
  TINT_KEYS.every((k) => fullBuild.usedTintKeys.includes(k)),
  fullBuild.usedTintKeys.join(', '))
const manifestTints = fullBuild.manifest.theme.tints ?? {}
ok('every tint is a valid HSL triple',
  Object.values(manifestTints).every(isValidTint),
  Object.entries(manifestTints).filter(([, v]) => !isValidTint(v)).map(([k]) => k).join(', '))
ok('every tint is serialised as a 3-number JSON list',
  Object.values(manifestTints).every((v) => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === 'number')))

// `theme.properties` carries exactly ONE key: `ntp_logo_alternate`, written in
// both manifest shapes so the New Tab logo never depends on mode.
//
// This block previously asserted the opposite — that the key was absent
// everywhere — justified by the claim that it "only picks between Chrome's two
// pre-rendered logos rather than tinting one". That was a misreading of the
// property: 1 means "let Chrome derive the logo from the New Tab colours"
// (white over a dark NTP, the standard wordmark over a light one), and 0 is the
// fragile value because it only survives when nothing else about the NTP has
// been changed. See LOGO_STYLES in `data/themeFields.js` for the sources.
//
// The guards are inverted on purpose: if a future refactor drops the key again,
// this must fail loudly rather than quietly ship themes with the wrong logo.
ok('core build writes ntp_logo_alternate', coreBuild.manifest.theme.properties?.ntp_logo_alternate === 1,
  JSON.stringify(coreBuild.manifest.theme.properties))
ok('complete build writes ntp_logo_alternate', fullBuild.manifest.theme.properties?.ntp_logo_alternate === 1,
  JSON.stringify(fullBuild.manifest.theme.properties))
ok('theme.properties carries that one key and no other',
  JSON.stringify(Object.keys(fullBuild.manifest.theme.properties ?? {})) === '["ntp_logo_alternate"]',
  Object.keys(fullBuild.manifest.theme.properties ?? {}).join(', '))

// A stale `properties` bag left over from the old UI must not be able to
// reintroduce the two image-only keys, nor override the value the editor owns.
const staleBag = buildManifest({
  name: 'Stale',
  colors: DEFAULT_COLORS,
  complete: true,
  properties: { ntp_background_alignment: 'bottom', ntp_logo_alternate: 0 },
}).manifest.theme.properties
ok('a passed-in properties bag cannot override the logo value', staleBag.ntp_logo_alternate === 1,
  JSON.stringify(staleBag))
ok('a passed-in properties bag cannot reintroduce alignment/repeat',
  staleBag.ntp_background_alignment === undefined && staleBag.ntp_background_repeat === undefined,
  JSON.stringify(staleBag))

ok('the serialised manifest declares the property', fullBuild.json.includes('"properties"'))
ok('the result object still does not report usedPropertyKeys',
  coreBuild.usedPropertyKeys === undefined && fullBuild.usedPropertyKeys === undefined)

// The style -> integer mapping lives in one table and nowhere else, so the UI can
// never hand the builder a raw Chrome number.
ok('logoStyle "classic" writes 0',
  buildManifest({ name: 'Classic', colors: DEFAULT_COLORS, logoStyle: 'classic' }).manifest.theme.properties
    .ntp_logo_alternate === 0)
ok('an unknown logoStyle falls back to adaptive rather than omitting the key',
  buildManifest({ name: 'Unknown', colors: DEFAULT_COLORS, logoStyle: 'nonsense' }).manifest.theme.properties
    .ntp_logo_alternate === 1)
ok('logoStyleValue maps every declared style',
  LOGO_STYLES.every((style) => logoStyleValue(style.id) === style.value))
ok('logoStyleFromValue round-trips every declared style',
  LOGO_STYLES.every((style) => logoStyleFromValue(style.value) === style.id))
ok('logoStyleFromValue rejects anything that is not a declared value',
  logoStyleFromValue(2) === null && logoStyleFromValue(undefined) === null && logoStyleFromValue('1') === 'adaptive')

// The sanitising/resolving helpers are retained (a background-image feature could
// use them later), so their behaviour still needs to hold.
ok('a clean property set survives sanitising untouched',
  JSON.stringify(sanitizeProperties(DEFAULT_NTP_PROPERTIES)) === JSON.stringify(DEFAULT_NTP_PROPERTIES))
ok('a bad alignment value is dropped', Object.keys(sanitizeProperties({ ntp_background_alignment: 'diagonal' })).length === 0)
ok('a numeric repeat value is dropped', Object.keys(sanitizeProperties({ ntp_background_repeat: 7 })).length === 0)
ok('a stringified logo flag is dropped', Object.keys(sanitizeProperties({ ntp_logo_alternate: '1' })).length === 0)
ok('an out-of-range logo flag is dropped', Object.keys(sanitizeProperties({ ntp_logo_alternate: 2 })).length === 0)
ok('a non-Chrome property key is dropped', Object.keys(sanitizeProperties({ control_background: 1 })).length === 0)

// `resolveProperties` would be what a future builder calls: it always yields all
// three keys with a value Chrome accepts, replacing a bad override with the
// default rather than dropping the key.
ok('resolveProperties always yields all 3 keys', Object.keys(resolveProperties()).length === 3,
  Object.keys(resolveProperties()).join(', '))
ok('resolveProperties with no overrides equals the defaults',
  JSON.stringify(resolveProperties()) === JSON.stringify(DEFAULT_NTP_PROPERTIES))
ok('resolveProperties repairs a single bad override in place',
  resolveProperties({ ntp_background_repeat: 'sideways' }).ntp_background_repeat ===
    DEFAULT_NTP_PROPERTIES.ntp_background_repeat)
ok('resolveProperties keeps the valid half of a mixed override',
  resolveProperties({ ntp_background_alignment: 'bottom', ntp_logo_alternate: 'x' }).ntp_background_alignment === 'bottom' &&
    resolveProperties({ ntp_background_alignment: 'bottom', ntp_logo_alternate: 'x' }).ntp_logo_alternate ===
      DEFAULT_NTP_PROPERTIES.ntp_logo_alternate)

// Derivation must be pure: same palette in, same ten colours out.
const derivedA = deriveExtendedColors(DEFAULT_COLORS)
const derivedB = deriveExtendedColors({ ...DEFAULT_COLORS })
ok('deriving extended colours is deterministic',
  JSON.stringify(derivedA) === JSON.stringify(derivedB))
ok('deriving produces exactly 10 colours', Object.keys(derivedA).length === 10, `${Object.keys(derivedA).length}`)
ok('every derived colour is valid hex',
  Object.values(derivedA).every((h) => isValidHex(h)),
  Object.entries(derivedA).filter(([, h]) => !isValidHex(h)).map(([k]) => k).join(', '))
ok('a partially empty palette degrades without throwing',
  Object.keys(deriveExtendedColors({})).length === 0)
ok('deriving with garbage input does not throw',
  Object.keys(deriveExtendedColors({ frame: 'nope' })).length === 0)
ok('deriving tints with garbage input does not throw',
  Object.keys(deriveTints({ frame: 'nope' })).length === 0)

// `toolbar_text` shares the bookmark ink, which is what COLOR_TOOLBAR_TEXT means.
ok('toolbar_text mirrors bookmark_text', derivedA.toolbar_text === DEFAULT_COLORS.bookmarkText)
ok('ntp_header mirrors ntp_text', derivedA.ntp_header === DEFAULT_COLORS.ntpText)
ok('incognito frame is darker than the normal frame',
  hexToHsl(derivedA.frame_incognito).l < hexToHsl(DEFAULT_COLORS.frame).l,
  `${hexToHsl(derivedA.frame_incognito).l.toFixed(1)} < ${hexToHsl(DEFAULT_COLORS.frame).l.toFixed(1)}`)

// The complete palette must stay valid for every preset and a wide sample of
// random palettes - this is the sweep that would catch a derivation rule that
// produces an unparsable colour for some hue.
let completeSweepBad = 0
let completeSweepKeys = new Set()
const palettes = [...PRESETS.map((p) => buildColors(p.colors)), ...Array.from({ length: 300 }, (_, i) => generateRandomColors(i + 1))]
for (const palette of palettes) {
  const built = buildManifest({ name: 'Sweep', colors: palette, complete: true })
  const cols = built.manifest.theme.colors
  const keysOf = Object.keys(cols)
  completeSweepKeys.add(keysOf.length)
  const bad =
    keysOf.length !== 24 ||
    keysOf.some((k) => !CHROME_COLOR_KEY_ALLOWLIST.has(k)) ||
    keysOf.some((k) => CHROME_DEAD_COLOR_KEYS.has(k)) ||
    Object.values(cols).some(
      (v) => !Array.isArray(v) || v.length !== 3 || !v.every((n) => Number.isInteger(n) && n >= 0 && n <= 255),
    ) ||
    built.usedTintKeys.length !== 6 ||
    Object.values(built.manifest.theme.tints ?? {}).some((t) => !isValidTint(t)) ||
    built.manifest.theme.properties?.ntp_logo_alternate !== 1 ||
    Object.keys(built.manifest.theme.properties ?? {}).length !== 1
  if (bad) completeSweepBad += 1
}
ok(`complete mode holds for all ${palettes.length} presets + random palettes`, completeSweepBad === 0,
  `${completeSweepBad} bad, key counts seen: ${[...completeSweepKeys].join(',')}`)

ok('describeManifestColors reports 14 keys for a core build',
  describeManifestColors(coreBuild.json).length === 14,
  `${describeManifestColors(coreBuild.json).length}`)
ok('describeManifestColors reports 24 keys for a complete build',
  describeManifestColors(fullBuild.json).length === 24,
  `${describeManifestColors(fullBuild.json).length}`)
ok('describeManifestColors tolerates broken JSON', describeManifestColors('{oops').length === 0)

// The ZIP path must honour the same flag as the preview, or the file the user
// downloads would disagree with the manifest they just inspected.
const completePkg = await buildThemePackage({ name: 'Complete Pkg', colors: DEFAULT_COLORS, complete: true })
ok('the package builder also emits 24 keys + 6 tints',
  completePkg.usedChromeKeys.length === 24 && completePkg.usedTintKeys.length === 6,
  `${completePkg.usedChromeKeys.length} keys, ${completePkg.usedTintKeys.length} tints`)

// The preview modal and the downloaded ZIP are two separate entry points into the
// builder. If only one of them honoured the logo choice, the preview would be
// lying about what the user is about to install — so both paths get asserted.
ok('the package builder writes the logo property too',
  completePkg.manifest.theme.properties?.ntp_logo_alternate === 1,
  JSON.stringify(completePkg.manifest.theme.properties))
const classicPkg = await buildThemePackage({ name: 'Classic Pkg', colors: DEFAULT_COLORS, logoStyle: 'classic' })
ok('the package builder forwards a classic logo style',
  classicPkg.manifest.theme.properties?.ntp_logo_alternate === 0,
  JSON.stringify(classicPkg.manifest.theme.properties))

// Regression guard, INVERTED after the mistake it used to enshrine. The default
// was changed to 0 on the theory that 1 selected a pre-rendered white logo which
// "vanishes on any light background". That theory was wrong twice over: 1 is the
// adaptive value, and the reference collection proves it — of 21 hand-built
// themes, 19 set 1 and 18 of those sit on a near-white New Tab background, where
// a genuinely white wordmark would have been unmissable.
//
// So: the default must be ADAPTIVE (1). Do not "fix" this back to 0.
ok('the retained logo default is adaptive, not the original logo',
  DEFAULT_NTP_PROPERTIES.ntp_logo_alternate === 1,
  String(DEFAULT_NTP_PROPERTIES.ntp_logo_alternate))
ok('the default logo style resolves to the same value the fallback table holds',
  logoStyleValue(DEFAULT_LOGO_STYLE) === DEFAULT_NTP_PROPERTIES.ntp_logo_alternate,
  `${logoStyleValue(DEFAULT_LOGO_STYLE)} vs ${DEFAULT_NTP_PROPERTIES.ntp_logo_alternate}`)

// ---------------------------------------------------------------------------
section('16b. Icon geometry (stub canvas)')
// ---------------------------------------------------------------------------
function makeStubCtx() {
  const calls = []
  const ctx = {
    calls,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    clearRect: (...a) => calls.push(['clearRect', ...a]),
    fillRect: (...a) => calls.push(['fillRect', ...a, ctx.fillStyle]),
    beginPath: () => calls.push(['beginPath']),
    closePath: () => calls.push(['closePath']),
    moveTo: (...a) => calls.push(['moveTo', ...a]),
    arcTo: (...a) => calls.push(['arcTo', ...a]),
    arc: (...a) => calls.push(['arc', ...a, ctx.fillStyle]),
    fill: () => calls.push(['fill', ctx.fillStyle]),
    stroke: () => calls.push(['stroke', ctx.strokeStyle]),
  }
  return ctx
}

const iconCtx = makeStubCtx()
drawThemeIcon(iconCtx, DEFAULT_COLORS, 128)
const fillOps = iconCtx.calls.filter((c) => c[0] === 'fill')
const rectOps = iconCtx.calls.filter((c) => c[0] === 'fillRect')
const bgRect = rectOps[0]
const strokes = iconCtx.calls.filter((c) => c[0] === 'stroke')

ok('icon clears the tile first', iconCtx.calls[0][0] === 'clearRect')
ok('icon paints a full-bleed background', bgRect && bgRect[3] === 128 && bgRect[4] === 128,
  JSON.stringify(bgRect))
ok('icon background uses the frame colour', bgRect?.[5] === DEFAULT_COLORS.frame, bgRect?.[5])
ok('icon paints exactly one background rect', rectOps.length === 1, `${rectOps.length}`)
ok('icon draws 5 rounded faces (window, tab, omnibox, dot, card)', fillOps.length === 5, `${fillOps.length}`)
ok('icon draws no stroke for a normal palette', strokes.length === 0, `${strokes.length}`)
ok('icon fill colours are all valid hex',
  fillOps.every((c) => isValidHex(c[1])), fillOps.map((c) => c[1]).join(', '))
ok('icon paints the accent dot in the palette accent colour',
  fillOps.some((c) => c[1] === DEFAULT_COLORS.ntpLink), fillOps.map((c) => c[1]).join(', '))

const smallCtx = makeStubCtx()
drawThemeIcon(smallCtx, DEFAULT_COLORS, 64)
const smallBg = smallCtx.calls.find((c) => c[0] === 'fillRect')
ok('icon scales to the requested size', smallBg && smallBg[3] === 64 && smallBg[4] === 64,
  JSON.stringify(smallBg))

// A palette whose frame equals its toolbar would render as a flat tile; the
// hairline fallback keeps the silhouette readable.
const flatCtx = makeStubCtx()
drawThemeIcon(flatCtx, { ...DEFAULT_COLORS, toolbar: DEFAULT_COLORS.frame }, 128)
ok('icon adds a hairline when frame and toolbar are identical',
  flatCtx.calls.filter((c) => c[0] === 'stroke').length === 1)

const emptyCtx = makeStubCtx()
drawThemeIcon(emptyCtx, {}, 128)
ok('icon falls back to sensible colours for an empty palette',
  emptyCtx.calls.filter((c) => c[0] === 'fill').every((c) => isValidHex(c[1])),
  emptyCtx.calls.filter((c) => c[0] === 'fill').map((c) => c[1]).join(', '))
ok('icon fallback palette is itself valid',
  Object.values(ICON_FALLBACK_COLORS).every((h) => isValidHex(h)))

// ---------------------------------------------------------------------------
section('17. Undo stack')
// ---------------------------------------------------------------------------
// The behaviour worth pinning down is coalescing: a colour drag fires a change
// event per pixel, so without it a single drag would cost dozens of Ctrl+Z.
{
  const drag = createHistory()
  record(drag, 'a', 'frame', 1000)
  record(drag, 'b', 'frame', 1100)
  record(drag, 'c', 'frame', 1200)
  ok('a colour drag collapses into one undo step', drag.past.length === 1, `${drag.past.length}`)
  const restored = undo(drag)
  ok('the collapsed step keeps the state from before the drag', restored === 'a', String(restored))

  const afterWindow = createHistory()
  record(afterWindow, 'a', 'frame', 1000)
  record(afterWindow, 'b', 'frame', 1000 + COALESCE_MS + 1)
  ok('a pause starts a new undo step', afterWindow.past.length === 2, `${afterWindow.past.length}`)

  const twoFields = createHistory()
  record(twoFields, 'a', 'frame', 1000)
  record(twoFields, 'b', 'toolbar', 1050)
  ok('editing a different field starts a new undo step', twoFields.past.length === 2, `${twoFields.past.length}`)

  const discrete = createHistory()
  record(discrete, 'a', null, 1000)
  record(discrete, 'b', null, 1010)
  ok('discrete actions never coalesce', discrete.past.length === 2, `${discrete.past.length}`)

  const mixed = createHistory()
  record(mixed, 'a', 'frame', 1000)
  record(mixed, 'b', null, 1010)
  record(mixed, 'c', 'frame', 1020)
  ok('a discrete action splits the run around it', mixed.past.length === 3, `${mixed.past.length}`)

  const empty = createHistory()
  ok('undo on an empty stack returns null', undo(empty) === null)
  ok('canUndo is false before anything is recorded', canUndo(empty) === false)

  // Undo must break coalescing, or the next edit would be swallowed into the
  // step that was just restored and become unreachable.
  const afterUndo = createHistory()
  record(afterUndo, 'a', 'frame', 1000)
  record(afterUndo, 'b', 'frame', 1100)
  undo(afterUndo)
  record(afterUndo, 'c', 'frame', 1200)
  ok('undo breaks coalescing so the next edit is its own step',
    afterUndo.past.length === 1 && canUndo(afterUndo) === true, `${afterUndo.past.length}`)

  const bounded = createHistory(3)
  for (let i = 0; i < 10; i += 1) record(bounded, i, null, 1000 + i)
  ok('the stack is bounded by its limit', bounded.past.length === 3, `${bounded.past.length}`)
  const newest = undo(bounded)
  ok('the bounded stack keeps the most recent steps', newest === 9, String(newest))
}

// The undo affordance is only discoverable if the strings it needs exist.
ok('the header undo label is translated in both locales',
  typeof en['header.undo'] === 'string' && typeof zh['header.undo'] === 'string')
ok('the undo toast is translated in both locales',
  typeof en['toast.undone'] === 'string' && typeof zh['toast.undone'] === 'string')

// ---------------------------------------------------------------------------
section('18. E2E harness hygiene')
// ---------------------------------------------------------------------------
/**
 * A template literal has no comment syntax, so a backtick written inside one
 * terminates the template and turns the remainder of the line into code. The
 * damage is silent until Chrome launches, which makes it an expensive mistake
 * to discover. Parsing the harness here converts a mid-run detour into an
 * instant, localised failure.
 */
const e2ePath = join(here, '..', '..', '.tb-e2e', 'e2e.mjs')
ok('the E2E harness exists', existsSync(e2ePath), e2ePath)

let harnessParses = false
let harnessError = ''
try {
  execFileSync(process.execPath, ['--check', e2ePath], { stdio: 'pipe' })
  harnessParses = true
} catch (error) {
  harnessError = String(error.stderr ?? error.message).split('\n').slice(0, 4).join(' ').trim()
}
ok('the E2E harness parses as ESM (no unbalanced template literal)', harnessParses, harnessError)

const harnessSource = existsSync(e2ePath) ? readFileSync(e2ePath, 'utf8') : ''
ok('the harness injects the page helpers', harnessSource.includes('${HELPERS}'))
ok('the harness loads JSZip for archive inspection', harnessSource.includes("require('jszip')"))

// ---------------------------------------------------------------------------
section('19. Colour-matched theme/folder naming')
// ---------------------------------------------------------------------------
// The auto-name follows one convention: two Title-Case words + a literal
// "Theme" suffix (three words), and a lower-case, dash-separated folder that
// ends in "-theme" because the theme name already does.
const named = suggestThemeName(DEFAULT_COLORS)
ok('name is three words ending in "Theme"',
  named.name.split(' ').length === 3 && named.name.endsWith(' Theme'), named.name)
ok('folder is the lower-case, dash twin with a -theme tail',
  named.folder === named.name.toLowerCase().replace(/ /g, '-'), named.folder)
ok('folder ends in "-theme"', named.folder.endsWith('-theme'), named.folder)

// Deterministic: the same palette always yields the same name (no RNG inside).
const namedAgain = suggestThemeName(DEFAULT_COLORS)
ok('naming is deterministic for a given palette', named.name === namedAgain.name, `${named.name} vs ${namedAgain.name}`)

// Covers the full hue wheel so every bucket is exercised at least once.
const hueSamples = {}
for (let h = 0; h < 360; h += 15) {
  const sample = suggestThemeName({ frame: hslToHex({ h, s: 60, l: 60 }) })
  hueSamples[sample.name] = (hueSamples[sample.name] ?? 0) + 1
  if (!/^[A-Z][a-z]+ [A-Z][a-z]+ Theme$/.test(sample.name)) {
    ok('every generated name matches the Title-Case convention', false, sample.name)
    break
  }
}
ok('every hue sample matches the "Word Word Theme" shape', true, `${Object.keys(hueSamples).length} distinct names`)
ok('distinct hues produce a spread of names (not one label)',
  Object.keys(hueSamples).length > 8, `${Object.keys(hueSamples).length} distinct`)

// ---------------------------------------------------------------------------
section('20. AI naming & description — prompt, parsing, error mapping')
// ---------------------------------------------------------------------------
// No network here. `describePalette` / `buildNamingMessages` are pure builders,
// `parseNamingResponse` is pure, and `requestThemeNames` takes an injectable
// fetch — so the whole request path is exercised with stubs. The failure
// contract is the important half: every error carries an i18n key the UI can
// show, and the local name survives a failure.
const described = describePalette(DEFAULT_COLORS)
ok('palette description names the dominant hue',
  /^(red|orange|yellow|lime|green|teal|cyan|azure|blue|violet|magenta|rose)$/.test(described.dominant.hue),
  described.dominant.hue)
ok('palette description reports a mode', described.mode === 'light' || described.mode === 'dark', described.mode)
ok('palette description lists every swatch', described.swatches.length === FIELD_IDS.length, `${described.swatches.length}`)

const messagesEn = buildNamingMessages({ palette: described, style: 'auto', language: 'en', candidates: 5 })
ok('the English prompt states the three-word "Theme" convention',
  messagesEn.user.includes('must be "Theme"'), '')
ok('the prompt carries the palette facts', messagesEn.user.includes(described.dominant.hue))
ok('the prompt states the JSON contract', messagesEn.user.includes('"candidates"'))

const messagesZh = buildNamingMessages({
  palette: described, style: 'elegant', language: 'zh', candidates: 3, exclude: ['Old Name Theme'],
})
ok('the Chinese prompt switches the naming rules', messagesZh.user.includes('Chinese characters'))
ok('the prompt lists names to avoid', messagesZh.user.includes('Old Name Theme'))
ok('the style steer reaches the prompt', messagesZh.user.includes('elegant'))

const aiBare = parseNamingResponse(
  '{"candidates":[{"name":"Lemon Juice Theme","folder":"Lemon Juice Theme","vibe":"fresh","reason":"lemon yellow"}]}',
)
ok('parses a bare JSON object', aiBare.length === 1 && aiBare[0].name === 'Lemon Juice Theme', JSON.stringify(aiBare))
ok('folder is forced onto lower-case dashes ending in -theme',
  aiBare[0]?.folder === 'lemon-juice-theme', String(aiBare[0]?.folder))

const fenced = parseNamingResponse('Sure!\n```json\n{"candidates":[{"name":"Mint Mist Theme"}]}\n```\ndone')
ok('parses JSON inside a markdown fence', fenced.length === 1 && fenced[0].name === 'Mint Mist Theme', JSON.stringify(fenced))
ok('a missing folder is derived from the name', fenced[0]?.folder === 'mint-mist-theme', String(fenced[0]?.folder))

const noisy = parseNamingResponse(
  'rambling {"candidates":[{"name":"A B Theme"},{"name":"a b theme"},{"name":""}]} trailing',
)
ok('dedupes names and drops blanks', noisy.length === 1 && noisy[0].name === 'A B Theme', JSON.stringify(noisy))
ok('garbage yields no candidates', parseNamingResponse('not json at all').length === 0)
ok('an empty reply yields no candidates', parseNamingResponse('').length === 0)
ok('normalizeFolder appends the -theme tail',
  normalizeFolder('lemon-soda', 'x') === 'lemon-soda-theme', normalizeFolder('lemon-soda', 'x'))

const stubConfig = {
  baseURL: 'https://api.siliconflow.cn/v1/',
  model: 'Qwen/Qwen2.5-7B-Instruct',
  apiKey: 'sk-test',
  temperature: 1,
  candidates: 5,
  style: 'auto',
  language: 'en',
}
const aiCtx = { palette: described, style: 'auto', language: 'en', candidates: 5 }

let seenUrl = ''
let seenBody = null
const recordingFetch = async (url, init) => {
  seenUrl = url
  seenBody = JSON.parse(init.body)
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content: '{"candidates":[{"name":"Sky Frost Theme","folder":"sky-frost-theme"}]}' } }],
    }),
  }
}
const names = await requestThemeNames(stubConfig, aiCtx, { fetchImpl: recordingFetch })
ok('request hits {baseURL}/chat/completions (trailing slash stripped)',
  seenUrl === 'https://api.siliconflow.cn/v1/chat/completions', seenUrl)
ok('request sends the model and both messages',
  seenBody?.model === 'Qwen/Qwen2.5-7B-Instruct' && seenBody?.messages?.length === 2, String(seenBody?.messages?.length))
ok('request returns the parsed candidates', names.length === 1 && names[0].folder === 'sky-frost-theme', JSON.stringify(names))

const keyFor = async (impl, config = stubConfig) => {
  try {
    await requestThemeNames(config, aiCtx, { fetchImpl: impl })
    return null
  } catch (error) {
    return error.key
  }
}
const statusFetch = (status) => async () => ({ ok: false, status, json: async () => ({}) })
ok('401 maps to a key error', (await keyFor(statusFetch(401))) === 'ai.errorUnauthorized')
ok('429 maps to a rate-limit error', (await keyFor(statusFetch(429))) === 'ai.errorRateLimited')
ok('500 maps to a server error', (await keyFor(statusFetch(500))) === 'ai.errorServer')
ok('a thrown fetch maps to a network error',
  (await keyFor(async () => { throw new TypeError('Failed to fetch') })) === 'ai.errorNetwork')
ok('an unreadable reply maps to a parse error',
  (await keyFor(async () => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'nope' } }] }) }))) ===
    'ai.errorParse')
ok('a missing key fails before any network call',
  (await keyFor(recordingFetch, { ...stubConfig, apiKey: '' })) === 'ai.errorNoKey')

// The description shares the transport, so only its own seams are asserted here:
// the prompt's contract, the tolerant parser, and the manifest-length clamp.
const descMessages = buildDescriptionMessages({ palette: described, name: 'Sky Frost Theme', language: 'en' })
ok('the description prompt carries the theme name', descMessages.user.includes('Sky Frost Theme'))
ok('the description prompt states the 132-character limit', descMessages.user.includes('132'))
ok('the description prompt states the JSON contract', descMessages.user.includes('{"description":"..."}'))
ok('the Chinese description prompt switches the writing rules',
  buildDescriptionMessages({ palette: described, name: '', language: 'zh' }).user.includes('中文写一句话'))

ok('parses a bare JSON description',
  parseDescriptionResponse('{"description":"A calm periwinkle wash for reading."}') ===
    'A calm periwinkle wash for reading.')
ok('parses a fenced JSON description',
  parseDescriptionResponse('```json\n{"description":"Soft dusk blues."}\n```') === 'Soft dusk blues.')
ok('accepts a bare sentence as a description',
  parseDescriptionResponse('A calm periwinkle wash.') === 'A calm periwinkle wash.')
ok('a quoted JSON string also reads as a description',
  parseDescriptionResponse('"Soft dusk blues."') === 'Soft dusk blues.')
ok('an empty description reply yields nothing', parseDescriptionResponse('') === '')
ok('a JSON object without a description yields nothing', parseDescriptionResponse('{"candidates":[]}') === '')
ok('descriptions are clamped to the manifest limit',
  parseDescriptionResponse(`{"description":"${'x'.repeat(300)}"}`).length === MAX_DESCRIPTION_LENGTH)

const descText = await requestThemeDescription(
  stubConfig,
  { palette: described, name: 'Sky Frost Theme', language: 'en' },
  {
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: '{"description":"Quiet periwinkle for long reading sessions."}' } }],
      }),
    }),
  },
)
ok('request returns the clamped description',
  descText === 'Quiet periwinkle for long reading sessions.', descText)

const cleaned = sanitizeAiConfig({ providerId: 'nope', temperature: 9, candidates: 99, style: 'zzz', language: 'zzz' })
ok('an unknown provider falls back to the default',
  cleaned.providerId === DEFAULT_AI_CONFIG.providerId, cleaned.providerId)
ok('temperature is clamped into its range',
  cleaned.temperature <= AI_TEMPERATURE.max && cleaned.temperature >= AI_TEMPERATURE.min, String(cleaned.temperature))
ok('an invalid candidate count falls back', cleaned.candidates === DEFAULT_AI_CONFIG.candidates, String(cleaned.candidates))
ok('invalid style and language fall back',
  cleaned.style === DEFAULT_AI_CONFIG.style && cleaned.language === DEFAULT_AI_CONFIG.language,
  `${cleaned.style}/${cleaned.language}`)
// The names must default to English: a Chinese UI used to send the model down a
// Chinese branch that produced pinyin folder names like `huo-ba-yue-ya-theme`.
ok('names default to English', DEFAULT_AI_CONFIG.language === 'en', DEFAULT_AI_CONFIG.language)
ok('there is no "follow the interface" language option', !AI_LANGUAGES.includes('auto'), AI_LANGUAGES.join(','))
ok('a stored "auto" language is coerced to English',
  sanitizeAiConfig({ language: 'auto' }).language === 'en', sanitizeAiConfig({ language: 'auto' }).language)

// The provider table is hand-written, so a duplicate id or a missing base URL
// would only show up as a broken dropdown at runtime.
for (const id of ['siliconflow', 'deepseek', 'openai', 'gemini']) {
  ok(`the provider table offers ${id}`, AI_PROVIDER_IDS.includes(id), AI_PROVIDER_IDS.join(','))
}
ok('provider ids are unique', new Set(AI_PROVIDER_IDS).size === AI_PROVIDER_IDS.length, AI_PROVIDER_IDS.join(','))
ok('every provider carries a base URL and a starter model',
  AI_PROVIDERS.every((p) => p.id === 'custom' || (p.baseURL && p.defaultModel)),
  AI_PROVIDERS.filter((p) => p.id !== 'custom' && !(p.baseURL && p.defaultModel)).map((p) => p.id).join(','))
// Gemini is reachable only because Google ships an OpenAI-compatible layer; the
// `/openai` suffix is what makes the shared `/chat/completions` call work.
ok('the Gemini preset targets the OpenAI-compatible endpoint',
  (AI_PROVIDERS.find((p) => p.id === 'gemini')?.baseURL ?? '').endsWith('/openai'),
  AI_PROVIDERS.find((p) => p.id === 'gemini')?.baseURL)
ok('the OpenAI preset is flagged as needing a proxy',
  AI_PROVIDERS.find((p) => p.id === 'openai')?.needsProxy === true)

// ---------------------------------------------------------------------------
section('21. Paired light + dark VS Code themes')
// ---------------------------------------------------------------------------
// Every reference preset was extracted from a dark theme file, so the sweep runs
// over dark palettes and checks both directions out of them.
const pairSources = [
  { id: 'default', colors: DEFAULT_VSCODE_COLORS },
  ...VSCODE_PRESETS.map(({ id, colors }) => ({ id, colors })),
]

/** Read one file out of a built package. */
const readFileFrom = (pkg, path) => pkg.files.find((file) => file.path === path)?.data ?? ''

ok(
  'every source palette reads as dark',
  pairSources.every(({ colors }) => schemeOf(colors) === 'dark'),
  pairSources.filter(({ colors }) => schemeOf(colors) !== 'dark').map((s) => s.id).join(','),
)
ok('counterpartTypeFor flips the two schemes and refuses high contrast',
  counterpartTypeFor('dark') === 'light' &&
    counterpartTypeFor('light') === 'dark' &&
    counterpartTypeFor('hc-black') === null)
ok('deriveCounterpart with no target picks the opposite scheme',
  schemeOf(deriveCounterpart(DEFAULT_VSCODE_COLORS)) === 'light')

// The reported bug: a draft declaring "light" while holding dark colours produced
// a "light" theme that rendered dark — and an equally wrong "derived light" that
// was dark again. The palette is the source of truth now.
const lightPalette = deriveCounterpart(DEFAULT_VSCODE_COLORS, 'light')
ok('a dark palette outvotes a declared light type', resolveType('light', DEFAULT_VSCODE_COLORS) === 'dark')
ok('a light palette outvotes a declared dark type', resolveType('dark', lightPalette) === 'light')
ok('the declared type is used only when it agrees with the palette',
  resolveType('dark', DEFAULT_VSCODE_COLORS) === 'dark' && resolveType('light', lightPalette) === 'light')
ok('high contrast survives the palette rule', resolveType('hc-black', DEFAULT_VSCODE_COLORS) === 'hc-black')
ok('a mismatched type can never reach the theme JSON',
  buildVscodeThemeJson({ name: 'Stale Label', type: 'light', colors: DEFAULT_VSCODE_COLORS }).type === 'dark')
const mislabelledSingle = buildVscodePackage({ name: 'Stale Label', type: 'light', colors: DEFAULT_VSCODE_COLORS })
ok('a mismatched type can never reach package.json either',
  JSON.parse(readFileFrom(mislabelledSingle, 'package.json')).contributes.themes[0].uiTheme === 'vs-dark')
// A paired export must pair the palettes it was given, whatever the label says:
// the dark JSON may never end up under the Light contribution.
const mislabelledPair = buildVscodePackage({
  name: 'Stale Pair',
  type: 'light',
  colors: DEFAULT_VSCODE_COLORS,
  counterpart: { type: 'dark', colors: lightPalette },
})
const mislabelledManifest = JSON.parse(readFileFrom(mislabelledPair, 'package.json'))
ok('a mislabelled pair still puts light first and dark second',
  mislabelledManifest.contributes.themes.map((t) => t.uiTheme).join(',') === 'vs,vs-dark',
  mislabelledManifest.contributes.themes.map((t) => t.uiTheme).join(','))
ok('every contribution agrees with the palette inside its own JSON',
  mislabelledManifest.contributes.themes.every((contribution) => {
    const json = JSON.parse(readFileFrom(mislabelledPair, contribution.path.replace('./', '')))
    const isLight = relativeLuminance(json.colors['editor.background']) >= 0.5
    return json.type === (isLight ? 'light' : 'dark') && json.type === (contribution.uiTheme === 'vs' ? 'light' : 'dark')
  }))

const contrastOn = (fg, bg) => contrastRatio(fg, bg)

for (const { id, colors } of pairSources) {
  const light = deriveCounterpart(colors, 'light')
  const backToDark = deriveCounterpart(light, 'dark')

  ok(`${id}: the derived palette is light`, schemeOf(light) === 'light')
  ok(`${id}: light and dark surfaces are on opposite sides of the luminance range`,
    relativeLuminance(light.editorBg) >= 0.5 && relativeLuminance(backToDark.editorBg) <= 0.2,
    `${relativeLuminance(light.editorBg).toFixed(3)} / ${relativeLuminance(backToDark.editorBg).toFixed(3)}`)
  ok(`${id}: text and accent colours clear 4.5:1 on both surfaces`,
    ['editorFg', 'accent', 'errorFg', 'warningFg'].every(
      (key) => contrastOn(light[key], light.editorBg) >= 4.5 && contrastOn(backToDark[key], backToDark.editorBg) >= 4.5,
    ),
    ['editorFg', 'accent', 'errorFg', 'warningFg']
      .map((key) => `${key} ${contrastOn(light[key], light.editorBg).toFixed(2)}/${contrastOn(backToDark[key], backToDark.editorBg).toFixed(2)}`)
      .join(' '))
  // Muted text is deliberately lower contrast than body text, but it still has to
  // be readable rather than decorative.
  ok(`${id}: muted text stays readable on both surfaces`,
    contrastOn(light.mutedFg, light.editorBg) >= 3.5 && contrastOn(backToDark.mutedFg, backToDark.editorBg) >= 3.5,
    `${contrastOn(light.mutedFg, light.editorBg).toFixed(2)} / ${contrastOn(backToDark.mutedFg, backToDark.editorBg).toFixed(2)}`)
  ok(`${id}: the current line is a visible step away from the editor surface`,
    light.lineHighlightBg !== light.editorBg && backToDark.lineHighlightBg !== backToDark.editorBg)
  ok(`${id}: the pair is a real round trip`,
    schemeOf(backToDark) === 'dark' && schemeOf(deriveCounterpart(backToDark, 'light')) === 'light')
  // Nothing may be left undefined: a missing key would silently fall back to a
  // default colour in the exported theme.
  ok(`${id}: the derived palette is complete`,
    Object.keys(DEFAULT_VSCODE_COLORS).every((key) => normalizeHex(light[key]) === light[key]),
    Object.keys(DEFAULT_VSCODE_COLORS).filter((key) => normalizeHex(light[key]) !== light[key]).join(','))
}

// The flipped half is tinted by the scheme's *background*, not by its accent —
// the accent is the loudest colour on screen and surfaces built from it made a
// grey-sage light scheme flip into a maroon dark one. A sage background with a
// magenta accent must come back as a sage dark theme.
const gap = (a, b) => {
  const d = Math.abs(((a - b) % 360 + 360) % 360)
  return d > 180 ? 360 - d : d
}
const sageWithMagenta = deriveCounterpart(
  {
    editorBg: '#202820',
    sidebarBg: '#1C241C',
    titleBg: '#253025',
    activityBg: '#182018',
    lineHighlightBg: '#263026',
    accent: '#D6409F',
  },
  'dark',
)
const sageFlippedHue = hexToHsl(sageWithMagenta.editorBg).h
ok('the flipped surfaces follow the background hue, not the accent',
  gap(sageFlippedHue, 120) <= 40 && gap(sageFlippedHue, 320) >= 40,
  `flipped h=${sageFlippedHue.toFixed(0)}`)

// The other half of that bug: a tinted background used to flip into a *grey*
// surface, because "l 97 at s 28" is a 4/255 channel difference — white with a
// hint of hue. The flip has to carry the background's colour visibly.
const spread = (hex) => {
  const [r, g, b] = hexToRgbArray(hex)
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255
}
const purpleDark = {
  editorBg: '#3D2145',
  sidebarBg: '#351B3C',
  titleBg: '#472A50',
  activityBg: '#2E1635',
  lineHighlightBg: '#4A2C53',
  accent: '#DD86DC',
}
const purpleLight = deriveCounterpart(purpleDark, 'light')
ok('a tinted dark background flips into a visibly tinted light one',
  spread(purpleLight.editorBg) >= 0.03,
  `spread=${spread(purpleLight.editorBg).toFixed(3)} ${purpleLight.editorBg}`)
ok('the flipped light background keeps the background hue',
  gap(hexToHsl(purpleLight.editorBg).h, hexToHsl(purpleDark.editorBg).h) <= 20,
  `${hexToHsl(purpleLight.editorBg).h.toFixed(0)} vs ${hexToHsl(purpleDark.editorBg).h.toFixed(0)}`)
ok('the flipped dark background keeps the light background\u2019s tint',
  spread(deriveCounterpart(purpleLight, 'dark').editorBg) >= 0.04,
  `spread=${spread(deriveCounterpart(purpleLight, 'dark').editorBg).toFixed(3)}`)
const neutralLight = {
  editorBg: '#FFFFFF',
  sidebarBg: '#F3F3F3',
  titleBg: '#ECECEC',
  activityBg: '#F0F0F0',
  lineHighlightBg: '#F7F7F7',
}
const neutralDark = deriveCounterpart(neutralLight, 'dark')
ok('a neutral background still flips neutral',
  spread(neutralDark.editorBg) <= 0.02, `${spread(neutralDark.editorBg).toFixed(3)} ${neutralDark.editorBg}`)

// A derived light palette must survive the rest of the derivation chain — this is
// what the exported JSON runs through.
const lightDerived = deriveCounterpart(DEFAULT_VSCODE_COLORS, 'light')
const lightTheme = buildVscodeThemeJson({ name: 'Pair Test', type: 'light', colors: lightDerived })
ok('a derived light theme declares type light', lightTheme.type === 'light')
ok('a derived light theme paints the editor with its own background',
  lightTheme.colors['editor.background'] === lightDerived.editorBg,
  lightTheme.colors['editor.background'])
ok('a derived light theme is dark-on-light',
  relativeLuminance(lightTheme.colors['editor.background']) > relativeLuminance(lightTheme.colors['editor.foreground']))

const counterpartInput = { type: 'light', colors: lightDerived }
const pairPkg = buildVscodePackage({
  name: 'Peach Test',
  folderName: 'peach-test',
  type: 'dark',
  colors: DEFAULT_VSCODE_COLORS,
  counterpart: counterpartInput,
})
const pairManifest = JSON.parse(readFileFrom(pairPkg, 'package.json'))

ok('a paired package declares two themes', pairPkg.themeCount === 2, String(pairPkg.themeCount))
ok('both theme files are in the package',
  pairPkg.files.some((f) => f.path === 'themes/peach-test-light-color-theme.json') &&
    pairPkg.files.some((f) => f.path === 'themes/peach-test-dark-color-theme.json'))
ok('package.json lists light before dark',
  pairManifest.contributes.themes.map((t) => t.uiTheme).join(',') === 'vs,vs-dark',
  pairManifest.contributes.themes.map((t) => t.uiTheme).join(','))
ok('every contributed label carries its scheme',
  pairManifest.contributes.themes.map((t) => t.label).join('|') === 'Peach Test Light|Peach Test Dark',
  pairManifest.contributes.themes.map((t) => t.label).join('|'))
ok('every declared theme path exists in the package',
  pairManifest.contributes.themes.every((t) => pairPkg.files.some((f) => `./${f.path}` === t.path)))
ok('each theme JSON matches its own contribution type',
  pairManifest.contributes.themes.every((t) => {
    const json = JSON.parse(readFileFrom(pairPkg, t.path.replace('./', '')))
    return json.type === (t.uiTheme === 'vs' ? 'light' : 'dark') && json.name === t.label && !!json.colors && !!json.tokenColors
  }))
ok('the marketplace banner follows the light side of a pair',
  pairManifest.galleryBanner.theme === 'light' && pairManifest.galleryBanner.color === lightDerived.sidebarBg,
  pairManifest.galleryBanner.theme)
ok('a paired package advertises both schemes in its keywords',
  pairManifest.keywords.includes('light-theme') && pairManifest.keywords.includes('dark-theme'))
ok('the README names both themes',
  (readFileFrom(pairPkg, 'README.md').match(/Peach Test (Light|Dark)/g) ?? []).length >= 2)

// Regression guard: the single-scheme output must not change shape.
const soloPkg = buildVscodePackage({ name: 'Solo Test', folderName: 'solo-test', type: 'light', colors: lightDerived })
ok('a package without a counterpart declares one theme', soloPkg.themeCount === 1)
ok('a single theme keeps the unsuffixed file name',
  soloPkg.files.some((f) => f.path === 'themes/solo-test-color-theme.json'))
ok('a single theme keeps its label unsuffixed',
  JSON.parse(readFileFrom(soloPkg, 'package.json')).contributes.themes[0].label === 'Solo Test')
ok('a single theme adds no pair keywords',
  !JSON.parse(readFileFrom(soloPkg, 'package.json')).keywords.includes('light-theme'))

// High contrast is its own rendering mode; the builder must refuse to pair it even
// if a caller passes a counterpart anyway.

const hcPkg = buildVscodePackage({
  name: 'HC Test',
  type: 'hc-black',
  colors: DEFAULT_VSCODE_COLORS,
  counterpart: counterpartInput,
})
ok('high contrast ignores a counterpart', hcPkg.themeCount === 1, String(hcPkg.themeCount))
ok('high contrast keeps its own uiTheme',
  JSON.parse(readFileFrom(hcPkg, 'package.json')).contributes.themes[0].uiTheme === 'hc-black')

// ---------------------------------------------------------------------------
section('22. VSIX hand-over (and the ZIP hand-over it must not disturb)')
// ---------------------------------------------------------------------------
const vsixPkg = buildVscodePackage({
  name: 'Peach Test',
  folderName: 'peach-test',
  type: 'dark',
  colors: DEFAULT_VSCODE_COLORS,
  counterpart: counterpartInput,
  format: 'vsix',
})
const vsixPaths = vsixPkg.files.map((file) => file.path)
const vsixManifestXml = readFileFrom(vsixPkg, 'extension.vsixmanifest')

ok('the vsix descriptor is named <slug>-<version>.vsix',
  vsixPkg.vsixName === 'peach-test-1.0.0.vsix' && vsixPkg.fileName === vsixPkg.vsixName,
  `${vsixPkg.vsixName} / ${vsixPkg.fileName}`)
ok('the vsix carries its OPC metadata at the archive root',
  vsixPaths.includes('extension.vsixmanifest') && vsixPaths.includes('[Content_Types].xml'))
ok('everything else lives under extension/',
  vsixPaths.filter((path) => path !== 'extension.vsixmanifest' && path !== '[Content_Types].xml')
    .every((path) => path.startsWith('extension/')))
ok('the vsix carries both theme JSONs',
  vsixPaths.includes('extension/themes/peach-test-light-color-theme.json') &&
    vsixPaths.includes('extension/themes/peach-test-dark-color-theme.json'))
ok('the manifest asset VS Code reads actually exists in the package',
  /Asset Type="Microsoft\.VisualStudio\.Code\.Manifest" Path="extension\/package\.json"/.test(vsixManifestXml) &&
    vsixPaths.includes('extension/package.json'))
ok('the vsix identity matches the packaged package.json',
  JSON.parse(readFileFrom(vsixPkg, 'extension/package.json')).version === '1.0.0' &&
    /<Identity Language="en-US" Id="peach-test" Version="1\.0\.0" Publisher="themebake" \/>/.test(vsixManifestXml))
ok('the vsix manifest is a complete PackageManifest document',
  vsixManifestXml.startsWith('<?xml version="1.0" encoding="utf-8"?>') &&
    vsixManifestXml.includes('xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011"') &&
    vsixManifestXml.trimEnd().endsWith('</PackageManifest>'))
ok('the vsix advertises the theme engine and the theme category',
  /Microsoft\.VisualStudio\.Code\.Engine" Value="\^1\.80\.0"/.test(vsixManifestXml) &&
    vsixManifestXml.includes('<Categories>Themes</Categories>'))
ok('the vsix shows the readme as its details page',
  vsixManifestXml.includes('Path="extension/README.md"') && vsixPaths.includes('extension/README.md'))

// User text must not be able to break the XML: a theme called `AT&T <Dark>` is a
// realistic name, and an unescaped ampersand makes the whole vsix unreadable.
const riskyPkg = buildVscodePackage({
  name: 'AT&T <Dark>',
  folderName: 'at-and-t',
  type: 'dark',
  colors: DEFAULT_VSCODE_COLORS,
  format: 'vsix',
})
const riskyXml = readFileFrom(riskyPkg, 'extension.vsixmanifest')
ok('user text is escaped in the vsix manifest',
  riskyXml.includes('<DisplayName>AT&amp;T &lt;Dark&gt;</DisplayName>') &&
    !/AT&T/.test(riskyXml),
  riskyXml.split('\n').find((line) => line.includes('DisplayName')))
ok('an unescaped ampersand never reaches the metadata',
  !/<[^>]*&(?!(amp|lt|gt|quot);)[^>]*>/.test(riskyXml))

// Regression guard: the zip / folder hand-over keeps package.json at the root.
const zipLayout = buildVscodePackage({
  name: 'Peach Test',
  folderName: 'peach-test',
  type: 'dark',
  colors: DEFAULT_VSCODE_COLORS,
  format: 'zip',
})
ok('the zip layout still keeps package.json at the root',
  zipLayout.files.some((f) => f.path === 'package.json') &&
    !zipLayout.files.some((f) => f.path.startsWith('extension/')))
ok('the zip layout is unaffected by the vsix option',
  zipLayout.zipName === 'peach-test.zip' && zipLayout.fileName === 'peach-test.zip')
ok('the default format is still the zip layout',
  buildVscodePackage({ name: 'Peach Test', type: 'dark', colors: DEFAULT_VSCODE_COLORS }).files.some(
    (f) => f.path === 'package.json',
  ))
ok('VS Code offers vsix, zip and folder, in that order',
  VSCODE_OUTPUT_MODES.map((mode) => mode.id).join(',') === 'vsix,zip,folder',
  VSCODE_OUTPUT_MODES.map((mode) => mode.id).join(','))

// ---------------------------------------------------------------------------
section('23. Accent strategies (matching / contrasting / triadic)')
// ---------------------------------------------------------------------------
ok('the three relationships are exposed',
  ACCENT_STRATEGIES.join(',') === 'harmony,clash,triad',
  ACCENT_STRATEGIES.join(','))
ok('the default is the calm one', DEFAULT_ACCENT_STRATEGY === 'harmony')
ok('an unknown strategy falls back instead of breaking the solve',
  solveTheme({ seeds: ['#B1B2FF'], accentStrategy: 'nonsense' }).accentStrategy === 'harmony')

/** Shortest angular distance between two hues, 0-180. */
const hueGap = (a, b) => {
  const d = Math.abs(((a - b) % 360 + 360) % 360)
  return d > 180 ? 360 - d : d
}

// Every strategy x mode x a coarse hue wheel: all valid, all contrast-clean, and
// the accent must land where the strategy says it will.
const strategyFailures = []
const accentDistances = { harmony: [181, 0], clash: [181, 0], triad: [181, 0] }
for (const strategy of ACCENT_STRATEGIES) {
  for (let hue = 0; hue < 360; hue += 12) {
    for (const mode of ['light', 'dark']) {
      const seedHex = hslToHex({ h: hue, s: 55, l: 62 })
      const result = solveTheme({ seeds: [seedHex], mode, accentStrategy: strategy })
      if (!result.ok) {
        strategyFailures.push(`${strategy} ${seedHex} ok=false`)
        continue
      }
      if (result.accentStrategy !== strategy) strategyFailures.push(`${strategy} ${seedHex} strategy lost`)
      for (const id of FIELD_IDS) {
        if (!isValidHex(result.colors[id])) strategyFailures.push(`${strategy} ${seedHex} ${id}`)
      }
      const issues = auditContrast(result.colors)
      if (issues.length) {
        strategyFailures.push(`${strategy} ${seedHex} ${mode}: ${issues.map((i) => `${i.fg}/${i.bg}`).join(' ')}`)
      }
      const gap = hueGap(hexToHsl(result.colors.ntpLink).h, hue)
      const [min, max] = accentDistances[strategy]
      accentDistances[strategy] = [Math.min(min, gap), Math.max(max, gap)]
    }
  }
}
ok('every strategy solves on the whole hue wheel: valid + contrast-clean',
  strategyFailures.length === 0,
  `${strategyFailures.length} failures: ${strategyFailures.slice(0, 3).join(' | ')}`)
console.log(`  accent hue gap: harmony ${accentDistances.harmony[0].toFixed(0)}-${accentDistances.harmony[1].toFixed(0)}deg, `
  + `clash ${accentDistances.clash[0].toFixed(0)}-${accentDistances.clash[1].toFixed(0)}deg, `
  + `triad ${accentDistances.triad[0].toFixed(0)}-${accentDistances.triad[1].toFixed(0)}deg`)
ok('harmony keeps the accent inside the family',
  accentDistances.harmony[1] <= 35, `max ${accentDistances.harmony[1].toFixed(1)}`)
ok('clash puts the accent opposite the family',
  accentDistances.clash[0] >= 150, `min ${accentDistances.clash[0].toFixed(1)}`)
ok('triad puts the accent a third of the wheel away',
  accentDistances.triad[0] >= 95 && accentDistances.triad[1] <= 145,
  `${accentDistances.triad[0].toFixed(1)}-${accentDistances.triad[1].toFixed(1)}`)

// A contrasting accent is only worth anything if it actually contrasts with the
// surfaces it sits next to — this is the user-facing promise of the strategy.
const clashSeed = '#D48ACA'
const clash = solveTheme({ seeds: [clashSeed], accentStrategy: 'clash', mode: 'light' })
const harmony = solveTheme({ seeds: [clashSeed], accentStrategy: 'harmony', mode: 'light' })
ok('a clash accent is a different hue to the frame',
  hueGap(hexToHsl(clash.colors.ntpLink).h, hexToHsl(clash.colors.frame).h) >= 150,
  `${hueGap(hexToHsl(clash.colors.ntpLink).h, hexToHsl(clash.colors.frame).h).toFixed(1)}`)
ok('harmony and clash really do differ on the same seed',
  hueGap(hexToHsl(clash.colors.ntpLink).h, hexToHsl(harmony.colors.ntpLink).h) >= 120)
ok('the clash surfaces stay in the seed family',
  hueGap(hexToHsl(clash.colors.ntpBackground).h, hexToHsl(clashSeed).h) <= 25,
  hueGap(hexToHsl(clash.colors.ntpBackground).h, hexToHsl(clashSeed).h).toFixed(1))
// Quiet surfaces: the accent has to out-shout them, or nothing reads as an accent.
const clashSurfaceSat = hexToHsl(clash.colors.toolbar).s
const harmonySurfaceSat = hexToHsl(harmony.colors.toolbar).s
ok('clash holds the surfaces back', clashSurfaceSat <= harmonySurfaceSat,
  `${clashSurfaceSat.toFixed(1)} vs ${harmonySurfaceSat.toFixed(1)}`)

// Three hues, each on its own corner: accent 120 one way, buttons 120 the other.
const triad = solveTheme({ seeds: [clashSeed], accentStrategy: 'triad', mode: 'light' })
const seedHue = hexToHsl(clashSeed).h
ok('triad gives the window buttons the third corner',
  hueGap(hexToHsl(triad.colors.buttonBackground).h, seedHue) >= 95 &&
    hueGap(hexToHsl(triad.colors.buttonBackground).h, hexToHsl(triad.colors.ntpLink).h) >= 95,
  `${hueGap(hexToHsl(triad.colors.buttonBackground).h, seedHue).toFixed(1)} / ${hueGap(hexToHsl(triad.colors.buttonBackground).h, hexToHsl(triad.colors.ntpLink).h).toFixed(1)}`)
ok('a clash theme says so in its notes',
  clash.notes.some((note) => note.key === 'studio.noteClash'))
ok('a triad theme says so in its notes',
  triad.notes.some((note) => note.key === 'studio.noteTriad'))
// The third hue has to be *visible* on the element that carries it; a grey
// button would make the strategy (and the note claiming it) a lie.
ok('a triad button is a visible hue, not a grey',
  hexToHsl(triad.colors.buttonBackground).s >= 14,
  `s=${hexToHsl(triad.colors.buttonBackground).s.toFixed(1)} ${triad.colors.buttonBackground}`)
ok('the VS Code master carries that third hue into its buttons',
  hueGap(hexToHsl(masterFromPalette(triad.colors).buttonBg).h, seedHue) >= 95,
  `${hueGap(hexToHsl(masterFromPalette(triad.colors).buttonBg).h, seedHue).toFixed(1)}`)
ok('the VS Code master keeps the accent readable on its own surfaces',
  ['accent', 'errorFg', 'warningFg', 'editorFg'].every(
    (key) => contrastRatio(masterFromPalette(triad.colors)[key], masterFromPalette(triad.colors).editorBg) >= 4.5,
  ),
  ['accent', 'errorFg', 'warningFg', 'editorFg']
    .map((key) => `${key} ${contrastRatio(masterFromPalette(triad.colors)[key], masterFromPalette(triad.colors).editorBg).toFixed(2)}`)
    .join(' '))
ok('harmony stays quiet about it',
  !harmony.notes.some((note) => note.key === 'studio.noteClash' || note.key === 'studio.noteTriad'))

// Fidelity beats the strategy: a hue the user actually supplied is their accent.
const PAIR = ['#9CBFA8', '#B83075']
const fromPair = solveTheme({ seeds: PAIR, accentStrategy: 'clash' })
ok('a contrasting colour in the user palette is used as-is',
  fromPair.colors.ntpLink === '#B83075' || usedSeedHexes(fromPair.colors, PAIR).length === 2,
  fromPair.colors.ntpLink)
ok('and the strategy does not claim credit for it',
  !fromPair.notes.some((note) => note.key === 'studio.noteClash'))

// Surfaces are layered by hue, not only by lightness: one flat wash was the
// original complaint, and equal hues still read flat however far apart the
// lightnesses are.
ok('every stacked surface has its own hue drift',
  ['toolbar', 'backgroundTab', 'buttonBackground', 'omniboxBackground', 'ntpBackground']
    .every((id) => typeof SURFACE_HUE_DRIFT[id] === 'number' && SURFACE_HUE_DRIFT[id] !== 0))
// A seed dark enough that nothing can snap into a surface role (see ELIGIBLE),
// so every surface really is derived and its drift is what is being measured.
const layering = solveTheme({ seeds: [hslToHex({ h: 200, s: 55, l: 62 })], mode: 'light' })
const layeredHues = new Set(
  ['toolbar', 'backgroundTab', 'ntpBackground'].map((id) => hexToHsl(layering.colors[id]).h.toFixed(1)),
)
ok('three surfaces do not share one exact hue', layeredHues.size === 3, [...layeredHues].join(','))

// Neutral input must never grow a hue just because a strategy asked for one.
const greyClash = solveTheme({ seeds: ['#808080'], accentStrategy: 'clash' })
ok('a neutral seed stays greyscale even in clash mode',
  FIELD_IDS.every((id) => {
    const rgb = parseHex(greyClash.colors[id])
    return rgb.r === rgb.g && rgb.g === rgb.b
  }),
  greyClash.colors.ntpLink)
ok('and no strategy note is emitted for it',
  !greyClash.notes.some((note) => note.key === 'studio.noteClash'))

// ---------------------------------------------------------------------------
section('24. Pinned regions (regions VS Code keeps separate)')
// ---------------------------------------------------------------------------
const MASTER = DEFAULT_VSCODE_COLORS
const plain = buildVscodeColors(MASTER)

// Default state: every pin follows its master field, so the derived map is
// byte-for-byte what it was before pinning existed.
ok('panel follows the sidebar by default', plain['panel.background'] === MASTER.sidebarBg)
ok('status bar follows the sidebar by default',
  plain['statusBar.background'] === MASTER.sidebarBg && plain['statusBar.noFolderBackground'] === MASTER.sidebarBg)
ok('inactive tabs follow the title bar by default',
  plain['tab.inactiveBackground'] === MASTER.titleBg &&
    plain['editorGroupHeader.tabsBackground'] === MASTER.titleBg)
ok('widgets follow the sidebar by default',
  plain['input.background'] === MASTER.sidebarBg &&
    plain['dropdown.background'] === MASTER.sidebarBg &&
    plain['editorWidget.background'] === MASTER.sidebarBg &&
    plain['editorHoverWidget.background'] === MASTER.sidebarBg &&
    plain['editorSuggestWidget.background'] === MASTER.sidebarBg &&
    plain['notifications.background'] === MASTER.sidebarBg &&
    plain['quickInput.background'] === MASTER.sidebarBg)
ok('line numbers follow the muted text by default',
  plain['editorLineNumber.foreground'] === MASTER.mutedFg)
ok('indent guides follow the border, with transparency, by default',
  plain['editorIndentGuide.background1'] === `${MASTER.border}66`.toUpperCase() &&
    plain['editorWhitespace.foreground'] === `${MASTER.border}66`.toUpperCase(),
  plain['editorIndentGuide.background1'])

const pinnedMap = buildVscodeColors(MASTER, { panelBg: '#F6E7D8', statusBarBg: '#3A2A16' })
ok('a pinned panel wins over the sidebar', pinnedMap['panel.background'] === '#F6E7D8')
ok('pinning a region leaves its neighbour alone',
  pinnedMap['sideBar.background'] === MASTER.sidebarBg &&
    pinnedMap['statusBar.background'] === '#3A2A16')
ok('pinning the status bar covers the no-folder state too',
  pinnedMap['statusBar.noFolderBackground'] === '#3A2A16')
// A light strip on a dark theme would otherwise keep the theme's light labels.
ok('text on a pinned surface is legible, not carried over',
  contrastRatio(pinnedMap['panel.foreground'], '#F6E7D8') >= 4.5,
  `${contrastRatio(pinnedMap['panel.foreground'], '#F6E7D8').toFixed(2)}`)
ok('and the theme ink is kept when it still works',
  pinnedMap['statusBar.foreground'] === MASTER.editorFg,
  pinnedMap['statusBar.foreground'])

const rest = buildVscodeColors(MASTER, {
  inactiveTabBg: '#101010',
  widgetBg: '#FFFFFF',
  lineNumberFg: '#FF0000',
  indentGuideFg: '#00FF00',
})
ok('pinned inactive tabs cover the tab strip too',
  rest['tab.inactiveBackground'] === '#101010' && rest['editorGroupHeader.tabsBackground'] === '#101010')
ok('pinned widgets cover every widget surface',
  ['input.background', 'dropdown.background', 'editorWidget.background', 'editorHoverWidget.background',
    'editorSuggestWidget.background', 'notifications.background', 'quickInput.background'].every(
    (key) => rest[key] === '#FFFFFF',
  ))
ok('pinned line numbers land on the line-number key only',
  rest['editorLineNumber.foreground'] === '#FF0000' &&
    rest['editorLineNumber.activeForeground'] === MASTER.accent)
ok('pinned indent guides cover the guides and the whitespace markers',
  rest['editorIndentGuide.background1'] === '#00FF00' && rest['editorWhitespace.foreground'] === '#00FF00')

// Sanitising: a draft can carry anything a previous build wrote.
ok('unknown pin ids are dropped', Object.keys(buildOverrides({ nonsense: '#FFFFFF' })).length === 0)
ok('malformed colours are dropped, not written',
  Object.keys(buildOverrides({ panelBg: 'red' })).length === 0 &&
    Object.keys(buildOverrides({ panelBg: '#FFF' })).length === 0)
ok('valid pins are normalised to uppercase',
  buildOverrides({ panelBg: '#abcdef' }).panelBg === '#ABCDEF')
ok('a missing overrides object means "all follow"', Object.keys(buildOverrides(undefined)).length === 0)
ok('every pinnable id is declared once',
  new Set(VSCODE_OVERRIDE_IDS).size === VSCODE_OVERRIDE_FIELDS.length &&
    VSCODE_OVERRIDE_FIELDS.every((field) => VSCODE_FIELD_IDS.includes(field.inherits)),
  VSCODE_OVERRIDE_FIELDS.map((field) => `${field.id}<-${field.inherits}`).join(','))

// The theme JSON and the package must honour the pins, and a pair must not copy
// one palette's pins onto the other.
ok('the theme JSON honours pins',
  buildVscodeThemeJson({ name: 'Pinned', colors: MASTER, overrides: { panelBg: '#123456' } }).colors[
    'panel.background'
  ] === '#123456')
const pinnedPkg = buildVscodePackage({
  name: 'Pinned Pair',
  folderName: 'pinned-pair',
  type: 'dark',
  colors: MASTER,
  counterpart: { type: 'light', colors: lightDerived },
  overrides: { panelBg: '#123456' },
})
const pinnedThemes = JSON.parse(readFileFrom(pinnedPkg, 'package.json')).contributes.themes
const pinnedPrimary = JSON.parse(readFileFrom(pinnedPkg, `themes/pinned-pair-dark-color-theme.json`))
const pinnedDerived = JSON.parse(readFileFrom(pinnedPkg, `themes/pinned-pair-light-color-theme.json`))
ok('a package declares two themes here', pinnedThemes.length === 2)
ok('the edited theme carries its pins', pinnedPrimary.colors['panel.background'] === '#123456')
ok('the derived theme inherits from its own colours instead',
  pinnedDerived.colors['panel.background'] === lightDerived.sidebarBg,
  pinnedDerived.colors['panel.background'])
ok('a package without pins is unaffected',
  buildVscodeThemeJson({ name: 'Plain', colors: MASTER }).colors['panel.background'] === MASTER.sidebarBg)

// ---------------------------------------------------------------------------
section('25. Variety: multi-family imports and a randomiser that differs')
// ---------------------------------------------------------------------------
/** Chroma (max-min over 255) — the axis HSL saturation cannot express near white. */
const hexToChroma = (hex) => {
  const { r, g, b } = parseHex(hex)
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255
}

// The palette card the user pointed at: two pinks, a cream and an olive.
const CARD_COOLORS = ['#D8A2A2', '#FFDCDC', '#FFF9D6', '#8EA66B']
const coolorSeeds = normalizeSeeds(CARD_COOLORS)
const coolorFamilies = hueFamilies(coolorSeeds)
const coolor = solveTheme({ seeds: CARD_COOLORS })

ok('a palette card is seen as three colour families, not one average',
  coolorFamilies.length === 3,
  coolorFamilies.map((f) => `${f.hue.toFixed(0)}deg x${f.count}`).join(', '))
ok('two pinks in one card are one family',
  coolorFamilies.some((f) => f.count === 2))
ok('greys are not a family',
  hueFamilies(normalizeSeeds(['#808080', '#4A4A4A'])).length === 0)
ok('a single-hue palette stays one family',
  hueFamilies(normalizeSeeds(['#B1B2FF', '#C9CAF2'])).length === 1)

const coolorAccent = hexToHsl(coolor.colors.ntpLink)
const coolorPage = hexToHsl(coolor.colors.ntpBackground)
const coolorFrameHue = hexToHsl(coolor.colors.frame).h
const hueGapTo = (hue) => {
  const d = Math.abs(((hue - coolorFrameHue) % 360 + 360) % 360)
  return d > 180 ? 360 - d : d
}

ok('the card\'s own clashing hue becomes the accent',
  hueGapTo(coolorAccent.h) >= 60,
  `${hueGapTo(coolorAccent.h).toFixed(0)}deg`)
ok('the card keeps a second family on its page surface',
  hueGapTo(coolorPage.h) >= 25,
  `${hueGapTo(coolorPage.h).toFixed(0)}deg`)
ok('an imported accent is pushed to a chroma that reads as an accent',
  hexToChroma(coolor.colors.ntpLink) >= 0.25,
  hexToChroma(coolor.colors.ntpLink).toFixed(3))
ok('the import reports how many of the card\'s colours it used',
  coolor.distinctSeedsUsed >= 3 && coolor.seedsUsed >= 3,
  `${coolor.distinctSeedsUsed}/${coolor.seedCount}`)
ok('and says which family went where',
  coolor.notes.some((note) => note.key === 'studio.noteMultiFamily'))
ok('a multi-family import is still contrast-clean', auditContrast(coolor.colors).length === 0,
  JSON.stringify(auditContrast(coolor.colors)))

// The count of reused seeds was always 0: the parser hands `usedSeedHexes` records
// while it normalises hex strings, so every import claimed "0 of 4 used directly".
ok('the card reports all four colours used directly', card.distinctSeedsUsed === 4,
  String(card.distinctSeedsUsed))

// ---------------------------------------------------------------------------
// Randomiser spread. The complaint was that two randoms looked like the same
// theme in a different hue, so the axes that used to be fixed are measured.
let darkRandom = 0
let greyRandom = 0
const frameLightness = new Set()
const frameChroma = new Set()
const editorLightness = new Set()
let randomMasterBad = 0
for (let seed = 1; seed <= 200; seed += 1) {
  const palette = generateRandomColors(seed)
  const frame = hexToHsl(palette.frame)
  frameLightness.add(Math.floor(frame.l / 10))
  frameChroma.add(Math.floor(hexToChroma(palette.frame) * 10))
  if (frame.l < 50) darkRandom += 1
  if (hexToChroma(palette.frame) < 0.05) greyRandom += 1

  const master = masterFromPalette(palette)
  editorLightness.add(Math.floor(hexToHsl(master.editorBg).l / 10))
  if (
    ['editorFg', 'accent', 'errorFg', 'warningFg'].some(
      (key) => contrastRatio(master[key], master.editorBg) < 4.5,
    )
  ) {
    randomMasterBad += 1
  }
}

console.log(`  frame lightness bands: ${frameLightness.size}, chroma bands: ${frameChroma.size}, `
  + `${darkRandom}/200 dark, ${greyRandom}/200 greyscale, editor bands: ${editorLightness.size}`)
ok('random frames span the lightness range, not one pastel band',
  frameLightness.size >= 4, [...frameLightness].sort().join(','))
ok('random frames span the chroma range', frameChroma.size >= 4, [...frameChroma].sort().join(','))
ok('a third of the randoms are dark themes', darkRandom >= 30, `${darkRandom}/200`)
ok('greyscale randoms actually happen', greyRandom >= 8, `${greyRandom}/200`)
// The VS Code surface was the last place everything converged: a fixed mix made
// every light random a near-white editor whatever the palette was.
ok('the VS Code editor surface follows the palette', editorLightness.size >= 4,
  [...editorLightness].sort().join(','))
ok('every random palette survives the VS Code conversion readable',
  randomMasterBad === 0, `${randomMasterBad}/200`)

// The monotony the user felt was structural, not in the hues: a light random was
// *always* a near-white page (l 88-99) with a mid-tone accent, so two light
// randoms in a row read as one template. The page lightness now follows its own
// strength axis and the accent lightness spans a real range.
const pageLightness = new Set()
const accentLightness = new Set()
let strongPage = 0
for (let seed = 1; seed <= 200; seed += 1) {
  const palette = generateRandomColors(seed)
  const page = hexToHsl(palette.ntpBackground)
  const accent = hexToHsl(palette.ntpLink)
  pageLightness.add(Math.floor(page.l / 8))
  accentLightness.add(Math.floor(accent.l / 8))
  if (page.l < 86) strongPage += 1
}
console.log(`  page lightness bands: ${pageLightness.size}, accent bands: ${accentLightness.size}, strong-tinted pages: ${strongPage}/200`)
ok('light pages range from paper to a clearly coloured surface', pageLightness.size >= 5,
  [...pageLightness].sort().join(','))
ok('some randoms get a strongly tinted (non-white) page', strongPage >= 12, `${strongPage}/200`)
ok('the accent lightness spans deep to bright, not one band', accentLightness.size >= 4,
  [...accentLightness].sort().join(','))

// The randomise button must refuse a theme that is too close to the previous
// one, so two quick clicks cannot land on "the same template in a near hue".
let minConsecutive = 1
let consecutiveSum = 0
let prev = null
for (let i = 0; i < 60; i += 1) {
  let candidate = generateRandomColors()
  for (let attempt = 0; attempt < 8 && prev; attempt += 1) {
    if (paletteDistance(candidate, prev) >= 0.5) break
    candidate = generateRandomColors()
  }
  if (prev) {
    const d = paletteDistance(candidate, prev)
    minConsecutive = Math.min(minConsecutive, d)
    consecutiveSum += d
  }
  prev = candidate
}
console.log(`  consecutive randomise distance: min ${minConsecutive.toFixed(2)}, avg ${(consecutiveSum / 59).toFixed(2)}`)
ok('two quick randomise clicks are forced to differ', minConsecutive >= 0.5,
  minConsecutive.toFixed(2))

// ---------------------------------------------------------------------------
console.log(`\n${'-'.repeat(56)}`)
if (failures === 0) {
  console.log(`ALL CHECKS PASSED  (${checks} assertions)`)
} else {
  console.log(`FAILED: ${failures} of ${checks} assertions`)
  process.exitCode = 1
}
