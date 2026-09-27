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
// The key-overlay badge is shared with the Chrome mockup: both previews answer the
// same question ("which key paints this?") with the same affordance.
import { KeyBadge } from './ChromeMockup.jsx'

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

export function VSCodeMockup({ colors, overrides = {}, showKeys = false, onPick = null }) {
  const { t } = useI18n()
  const master = Object.fromEntries(
    Object.entries(colors).map(([id, value]) => [id, normalizeHex(value) ?? '#000000']),
  )
  // Overrides are part of the palette being previewed, so the mockup takes them
  // too: a user who pins the status bar must see it move in here, not only in
  // the exported file.
  const derived = buildVscodeColors(master, overrides)
  const tokens = buildTokenColors(master).palette

  /**
   * Hovering a region names it and prints the workbench key it becomes; clicking
   * jumps to the colour field that paints it. The same contract as the Chrome
   * mockup, so the two previews behave alike.
   *
   * The name and the key are handed to `PreviewTipLayer` as data rather than as a
   * native `title`: the tooltip is drawn by the page (see `PreviewTip.jsx`), so it
   * can style the key as code and keep the mockups' colours in view underneath.
   */
  const cursorStyle = onPick ? { cursor: 'pointer' } : null
  const region = (fieldId, key, labelKey) => ({
    'data-tip-label': t(labelKey),
    'data-tip-key': key,
    ...(onPick ? { 'data-tip-action': t('preview.clickToEdit') } : null),
    // Regions nest (the tab strip holds the tabs, the editor holds its lines), so
    // the innermost one wins the click.
    onClick: onPick
      ? (event) => {
          event.stopPropagation()
          onPick(fieldId)
        }
      : undefined,
  })

  return (
    <div className="vsc" role="img" aria-label={t('vscode.preview.aria')}>
      {/* ------------------------------ title bar ------------------------------ */}
      <div
        className="vsc__title"
        style={{ backgroundColor: derived['titleBar.activeBackground'], ...cursorStyle }}
        {...region('titleBg', 'titleBar.activeBackground', 'vscode.field.titleBg')}
      >
        {showKeys ? <KeyBadge position="top-right">titleBar.activeBackground</KeyBadge> : null}
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
        <div
          className="vsc__activity"
          style={{ backgroundColor: derived['activityBar.background'], ...cursorStyle }}
          {...region('activityBg', 'activityBar.background', 'vscode.field.activityBg')}
        >
          {showKeys ? <KeyBadge position="bottom-left">activityBar.background</KeyBadge> : null}
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
        <div
          className="vsc__sidebar"
          style={{ backgroundColor: derived['sideBar.background'], ...cursorStyle }}
          {...region('sidebarBg', 'sideBar.background', 'vscode.field.sidebarBg')}
        >
          {showKeys ? <KeyBadge position="bottom-left">sideBar.background</KeyBadge> : null}
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
          <div
            className="vsc__tabs"
            style={{ backgroundColor: derived['editorGroupHeader.tabsBackground'], ...cursorStyle }}
            {...region('inactiveTabBg', 'editorGroupHeader.tabsBackground', 'vscode.override.inactiveTabBg')}
          >
            {showKeys ? <KeyBadge position="top-right">editorGroupHeader.tabsBackground</KeyBadge> : null}
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

          <div
            className="vsc__editor"
            style={{ backgroundColor: derived['editor.background'], ...cursorStyle }}
            {...region('editorBg', 'editor.background', 'vscode.field.editorBg')}
          >
            {showKeys ? <KeyBadge position="top-right">editor.background</KeyBadge> : null}
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

      {/*
        Panel strip. VS Code colours this independently of the sidebar, and the
        editor can pin it separately — a preview that never showed the panel would
        hide that whole control.
      */}
      <div
        className="vsc__panel"
        style={{
          backgroundColor: derived['panel.background'],
          borderTopColor: derived['panel.border'],
          ...cursorStyle,
        }}
        {...region('panelBg', 'panel.background', 'vscode.override.panelBg')}
      >
        {showKeys ? <KeyBadge position="top-right">panel.background</KeyBadge> : null}
        <span
          className="vsc__panel-tab is-active"
          style={{
            backgroundColor: derived['editor.background'],
            color: derived['panel.foreground'],
            borderBottomColor: derived['focusBorder'],
          }}
        >
          PROBLEMS
        </span>
        <span className="vsc__panel-tab" style={{ color: derived['panel.foreground'] }}>
          OUTPUT
        </span>
        <span className="vsc__panel-tab" style={{ color: derived['panel.foreground'] }}>
          TERMINAL
        </span>
      </div>

      {/* ------------------------------ status bar ----------------------------- */}
      <div
        className="vsc__status"
        style={{ backgroundColor: derived['statusBar.background'], ...cursorStyle }}
        {...region('statusBarBg', 'statusBar.background', 'vscode.override.statusBarBg')}
      >
        {showKeys ? <KeyBadge position="bottom-right">statusBar.background</KeyBadge> : null}
        <span style={{ color: derived['statusBar.foreground'] }}>main*</span>
        <span className="vsc__status-right" style={{ color: derived['statusBar.foreground'] }}>
          Ln 4, Col 12 · Spaces: 2 · UTF-8
        </span>
      </div>
    </div>
  )
}
