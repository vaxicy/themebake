/**
 * One-off generator: reads the hand-made VS Code theme folders and extracts a
 * preset table for the app (`src/data/vscodePresets.js`).
 *
 * For every folder that contains a `themes/*dark*.json`, the 14 master colour
 * fields used by the VS Code workbench are pulled out of the full theme JSON.
 * Run from the repo root:
 *
 *   node scripts/extract-vscode-presets.mjs <themes-root>
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'

const root = process.argv[2]
if (!root) {
  console.error('Usage: node scripts/extract-vscode-presets.mjs <vscode-themes-folder>')
  process.exit(1)
}

const toTitle = (slug) =>
  slug
    .replace(/-theme$/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

/** Keep only `#RRGGBB` — VS Code colours may carry an alpha suffix. */
const hex6 = (value) => {
  if (typeof value !== 'string') return null
  const match = /^#?([0-9a-fA-F]{6})/.exec(value.trim())
  return match ? `#${match[1].toUpperCase()}` : null
}

const lum = (hex) => {
  const n = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

const mixHex = (a, b, t) => {
  const pa = a.replace('#', '')
  const pb = b.replace('#', '')
  const ch = (i) => {
    const ca = parseInt(pa.slice(i, i + 2), 16)
    const cb = parseInt(pb.slice(i, i + 2), 16)
    return Math.round(ca + (cb - ca) * t)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  }
  return `#${ch(0)}${ch(2)}${ch(4)}`
}

const shiftL = (hex, delta) => {
  const target = delta >= 0 ? '#FFFFFF' : '#000000'
  return mixHex(hex, target, Math.abs(delta))
}

const presets = []

/** Curated keep-list — only these end up in the app's preset grid. */
const KEEP = new Set([
  'blue-reverie',
  'blush-cloud',
  'candy-breeze',
  'cozy-latte',
  'dusty-petal',
  'jade-veil',
  'lavender-mist',
  'peach-sorbet',
  'soft-sky',
])

for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const dir = join(root, entry.name)
  const themesDir = join(dir, 'themes')
  let files
  try {
    files = readdirSync(themesDir)
  } catch {
    continue
  }
  const darkFile = files.find((name) => /dark/i.test(name) && name.endsWith('.json'))
  if (!darkFile) continue

  let theme
  try {
    theme = JSON.parse(readFileSync(join(themesDir, darkFile), 'utf8'))
  } catch {
    continue
  }
  const c = theme.colors ?? {}
  const bg = hex6(c['editor.background'])
  const fg = hex6(c['editor.foreground'])
  if (!bg || !fg) continue

  const displayName = theme.name?.replace(/\s+Dark$/i, '') || toTitle(entry.name)

  let description = `${displayName}: a hand-tuned VS Code colour theme.`
  const pkgPath = join(dir, 'package.json')
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
      if (typeof pkg.description === 'string' && pkg.description) description = pkg.description
    } catch {
      /* keep the fallback */
    }
  }

  if (!KEEP.has(entry.name.replace(/-theme$/, ''))) continue

  presets.push({
    id: entry.name.replace(/-theme$/, ''),
    name: displayName,
    description,
    colors: {
      editorBg: bg,
      editorFg: fg,
      mutedFg:
        hex6(c['descriptionForeground']) ??
        hex6(c['editorLineNumber.foreground']) ??
        shiftL(fg, lum(bg) > 0.4 ? -0.28 : 0.28),
      accent:
        hex6(c['editorCursor.foreground']) ?? hex6(c['focusBorder']) ?? shiftL(bg, lum(bg) > 0.4 ? -0.3 : 0.35),
      selectionBg:
        hex6(c['editor.selectionBackground']) ?? mixHex(bg, hex6(c['focusBorder']) ?? fg, 0.35),
      lineHighlightBg: hex6(c['editor.lineHighlightBackground']) ?? shiftL(bg, lum(bg) > 0.4 ? -0.03 : 0.04),
      activityBg: hex6(c['activityBar.background']) ?? shiftL(bg, lum(bg) > 0.4 ? -0.05 : 0.05),
      sidebarBg: hex6(c['sideBar.background']) ?? shiftL(bg, lum(bg) > 0.4 ? -0.03 : 0.03),
      titleBg:
        hex6(c['titleBar.activeBackground']) ??
        hex6(c['tab.inactiveBackground']) ??
        shiftL(bg, lum(bg) > 0.4 ? -0.04 : 0.06),
      border: hex6(c['sideBar.border']) ?? hex6(c['tab.border']) ?? shiftL(bg, lum(bg) > 0.4 ? -0.1 : 0.12),
      buttonBg: hex6(c['button.background']) ?? hex6(c['focusBorder']) ?? shiftL(bg, 0.3),
      buttonFg:
        hex6(c['button.foreground']) ??
        (lum(hex6(c['button.background']) ?? bg) > 0.4 ? '#1B1B1F' : '#FFFFFF'),
      errorFg: hex6(c['errorForeground']) ?? '#E06C75',
      warningFg: hex6(c['editorWarning.foreground']) ?? '#E5C07B',
    },
  })
}

if (!presets.length) {
  console.error('No dark theme JSONs found under', root)
  process.exit(1)
}

presets.sort((a, b) => a.id.localeCompare(b.id))

const banner = `/**
 * VS Code preset themes, extracted from the hand-made theme folders by
 * \`scripts/extract-vscode-presets.mjs\` — do not edit by hand; re-run the
 * script instead.
 *
 * Each preset carries only the 14 master colour fields of the VS Code
 * workbench; the full \`colors\` map and \`tokenColors\` are derived from these
 * at build time (see \`vscode/build.js\`).
 *
 * @type {{id:string,name:string,description:string,colors:Record<string,string>}[]}
 */
export const VSCODE_PRESETS = `

writeFileSync(
  new URL('../src/data/vscodePresets.js', import.meta.url),
  `${banner}${JSON.stringify(presets, null, 2)}\n`,
)

console.log(`Wrote ${presets.length} presets: ${presets.map((p) => p.id).join(', ')}`)
