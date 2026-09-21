/**
 * Live VS Code-style mockup.
 *
 * Reproduces only the generic editor geometry — title bar, activity bar,
 * sidebar file tree, editor tabs, a short syntax-highlighted code sample and
 * the status bar — so users can see *where* each master colour lands. No
 * Microsoft marks; the layout is the message.
 *
 * The workbench chrome is painted from `buildVscodeColors(master)` (the exact
 * same derivation the exported JSON uses) and the code sample is tinted from
 * `buildTokenColors(master).palette`, so the preview can never drift from the
 * generated theme.
 */

import { buildTokenColors, buildVscodeColors } from '../vscode/build.js'
import { normalizeHex } from '../utils/color.js'
import { useI18n } from '../i18n/index.jsx'

/** Activity bar icons, drawn as neutral shapes. */
const ACTIVITY_ICONS = ['files', 'search', 'git', 'debug', 'extensions']

/** Sidebar file tree — names chosen to look like a real project. */
const TREE = [
  { name: 'src', folder: true, depth: 0 },
  { name: 'theme.js', dot: '#EAC18C', depth: 1, active: true },
  { name: 'palette.js', dot: '#EAC18C', depth: 1 },
  { name: 'package.json', dot: '#8FBF6F', depth: 0 },
  { name: 'README.md', dot: '#6B9BD1', depth: 0 },
]

/**
 * A tiny fake code sample. Each segment carries a token-family key that maps
 * into the generated palette, so the highlighting is always theme-accurate.
 */
const CODE_LINES = [
  [
    { t: 'import', k: 'keyword' },
    { t: ' { bakeTheme } ', k: 'variable' },
    { t: 'from', k: 'keyword' },
    { t: " './oven'", k: 'string' },
  ],
  [{ t: '', k: 'variable' }],
  [{ t: '// mix the palette into a theme', k: 'comment' }],
  [
    { t: 'const', k: 'keyword' },
    { t: ' colors ', k: 'variable' },
    { t: '= ', k: 'variable' },
    { t: 'bakeTheme', k: 'func' },
    { t: '({', k: 'variable' },
  ],
  [
    { t: '  palette', k: 'variable' },
    { t: ': ', k: 'variable' },
    { t: 'blushMatcha', k: 'type' },
    { t: ', ', k: 'variable' },
  ],
  [
    { t: '  contrast', k: 'variable' },
    { t: ': ', k: 'variable' },
    { t: '4.5', k: 'number' },
    { t: ',', k: 'variable' },
  ],
  [{ t: '})', k: 'variable' }],
  [{ t: '', k: 'variable' }],
  [
    { t: 'export default', k: 'keyword' },
    { t: ' colors', k: 'variable' },
  ],
]

export function VSCodeMockup({ colors }) {
  const { t } = useI18n()
  const master = Object.fromEntries(
    Object.entries(colors).map(([id, value]) => [id, normalizeHex(value) ?? '#000000']),
  )
  const derived = buildVscodeColors(master)
  const tokens = buildTokenColors(master).palette

  return (
    <div className="vsc" role="img" aria-label={t('vscode.preview.aria')}>
      {/* ------------------------------ title bar ------------------------------ */}
      <div className="vsc__title" style={{ backgroundColor: derived['titleBar.activeBackground'] }}>
        <span className="vsc__title-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="vsc__title-name" style={{ color: derived['titleBar.activeForeground'] }}>
          themebake — Visual Studio Code
        </span>
      </div>

      <div className="vsc__body">
        {/* ---------------------------- activity bar --------------------------- */}
        <div className="vsc__activity" style={{ backgroundColor: derived['activityBar.background'] }}>
          {ACTIVITY_ICONS.map((icon, index) => (
            <span
              key={icon}
              className={`vsc__activity-icon${index === 0 ? ' is-active' : ''}`}
              style={{
                color: index === 0 ? derived['activityBar.foreground'] : derived['activityBar.inactiveForeground'],
                borderColor: index === 0 ? derived['activityBar.activeBorder'] : 'transparent',
              }}
            />
          ))}
        </div>

        {/* ------------------------------ sidebar ------------------------------ */}
        <div className="vsc__sidebar" style={{ backgroundColor: derived['sideBar.background'] }}>
          <div className="vsc__sidebar-title" style={{ color: derived['sideBar.foreground'] }}>
            EXPLORER
          </div>
          {TREE.map((node) => (
            <div
              key={node.name}
              className={`vsc__tree-item${node.active ? ' is-active' : ''}`}
              style={{
                paddingLeft: `${10 + node.depth * 14}px`,
                color: node.active ? derived['list.activeSelectionForeground'] : derived['sideBar.foreground'],
                backgroundColor: node.active ? derived['list.activeSelectionBackground'] : 'transparent',
              }}
            >
              <span className="vsc__tree-caret">{node.folder ? '▾' : ''}</span>
              {node.dot ? (
                <span className="vsc__tree-dot" style={{ backgroundColor: node.dot }} />
              ) : null}
              {node.name}
            </div>
          ))}
        </div>

        {/* -------------------------- tabs + editor ---------------------------- */}
        <div className="vsc__main">
          <div className="vsc__tabs" style={{ backgroundColor: derived['editorGroupHeader.tabsBackground'] }}>
            <span
              className="vsc__tab is-active"
              style={{
                backgroundColor: derived['tab.activeBackground'],
                color: derived['tab.activeForeground'],
                borderTopColor: derived['tab.activeBorderTop'],
              }}
            >
              theme.js
            </span>
            <span
              className="vsc__tab"
              style={{
                backgroundColor: derived['tab.inactiveBackground'],
                color: derived['tab.inactiveForeground'],
                borderTopColor: 'transparent',
              }}
            >
              palette.js
            </span>
          </div>

          <div className="vsc__editor" style={{ backgroundColor: derived['editor.background'] }}>
            {CODE_LINES.map((line, index) => (
              <div
                key={index}
                className={`vsc__line${index === 3 ? ' is-current' : ''}`}
                style={{
                  backgroundColor: index === 3 ? derived['editor.lineHighlightBackground'] : 'transparent',
                }}
              >
                <span
                  className="vsc__line-number"
                  style={{ color: index === 3 ? derived['editorLineNumber.activeForeground'] : derived['editorLineNumber.foreground'] }}
                >
                  {index + 1}
                </span>
                <code className="vsc__line-code" style={{ color: derived['editor.foreground'] }}>
                  {line.map((segment, subIndex) => (
                    <span key={subIndex} style={{ color: tokens[segment.k] ?? derived['editor.foreground'] }}>
                      {segment.t}
                    </span>
                  ))}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------ status bar ----------------------------- */}
      <div className="vsc__status" style={{ backgroundColor: derived['statusBar.background'] }}>
        <span style={{ color: derived['statusBar.foreground'] }}>main*</span>
        <span className="vsc__status-right" style={{ color: derived['statusBar.foreground'] }}>
          Ln 4, Col 12 · Spaces: 2 · UTF-8
        </span>
      </div>
    </div>
  )
}
