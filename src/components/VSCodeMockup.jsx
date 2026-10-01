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

/**
 * Activity bar icons, drawn as outlines the way VS Code draws its own.
 *
 * The mockup shipped with five identical squares, which said "there is an icon
 * here" and nothing else. Five recognisable glyphs are what make the strip read as
 * the workbench's activity bar rather than as decoration.
 */
const ACTIVITY_ICONS = [
  {
    id: 'files',
    art: (
      <>
        <path d="M5 2.5h3.6L12 5.9v7.6H5z" />
        <path d="M8.6 2.5v3.4H12" />
      </>
    ),
  },
  {
    id: 'search',
    art: (
      <>
        <circle cx="7.6" cy="7.6" r="4.1" />
        <path d="M10.7 10.7l2.8 2.8" />
      </>
    ),
  },
  {
    id: 'git',
    art: (
      <>
        <circle cx="5.6" cy="4" r="1.7" />
        <circle cx="5.6" cy="12" r="1.7" />
        <circle cx="11.4" cy="8" r="1.7" />
        <path d="M5.6 5.7v4.6M7.3 8h2.4" />
      </>
    ),
  },
  {
    id: 'run',
    art: <path d="M6 3.6l6.4 4.4L6 12.4z" />,
  },
  {
    id: 'extensions',
    art: (
      <>
        <rect x="3.4" y="3.4" width="4" height="4" />
        <rect x="9.4" y="3.4" width="4" height="4" />
        <rect x="3.4" y="9.4" width="4" height="4" />
        <rect x="9.4" y="9.4" width="4" height="4" />
      </>
    ),
  },
]

/** The menu bar, as a Windows VS Code window shows it. */
const MENUS = ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help']

/** The line the caret is on: highlighted, its number accented, its guide brighter. */
const CURRENT_LINE = 3

/**
 * Which master colour paints each token family, so a click on a word in the sample
 * edits the colour behind it.
 *
 * The token palette shifts and mixes (`buildTokenColors`), so a keyword is not
 * *equal* to the accent — but it is the accent that moves it, and that is the
 * colour to edit when a keyword reads wrong. Naming the token rule in the tooltip
 * says where the colour lands without pretending the two are the same value.
 *
 * @type {Record<string, [fieldId: string, key: string, labelKey: string]>}
 */
const TOKEN_REGIONS = {
  keyword: ['accent', 'tokenColors.keyword', 'vscode.field.accent'],
  tag: ['accent', 'tokenColors.tag', 'vscode.field.accent'],
  type: ['accent', 'tokenColors.type', 'vscode.field.accent'],
  func: ['accent', 'tokenColors.func', 'vscode.field.accent'],
  string: ['warningFg', 'tokenColors.string', 'vscode.field.warningFg'],
  number: ['warningFg', 'tokenColors.number', 'vscode.field.warningFg'],
  attribute: ['warningFg', 'tokenColors.attribute', 'vscode.field.warningFg'],
  comment: ['mutedFg', 'tokenColors.comment', 'vscode.field.mutedFg'],
  invalid: ['errorFg', 'tokenColors.invalid', 'vscode.field.errorFg'],
  variable: ['editorFg', 'editor.foreground', 'vscode.field.editorFg'],
}

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
    // Selected text: the one place `editor.selectionBackground` is visible, and the
    // element that makes it clickable.
    { t: 'blushMatcha', k: 'type', sel: true },
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

export function VSCodeMockup({ colors, overrides = {}, onPick = null }) {
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
   * The name and the key are handed to `TooltipLayer` as data rather than as a
   * native `title`: the tooltip is drawn by the page (see `Tooltip.jsx`), so it
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
        {/* Menu bar, window title, window controls — the order a Windows VS Code
            window puts them in. */}
        <span className="vsc__menu" style={{ color: derived['titleBar.activeForeground'] }}>
          {MENUS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </span>
        <span className="vsc__title-name" style={{ color: derived['titleBar.activeForeground'] }}>
          themebake — Visual Studio Code
        </span>
        <span className="vsc__window-controls" style={{ color: derived['titleBar.activeForeground'] }}>
          <i className="vsc__window-control vsc__window-control--min" />
          <i className="vsc__window-control vsc__window-control--max" />
          <i className="vsc__window-control vsc__window-control--close" />
        </span>
      </div>

      <div className="vsc__body">
        {/* ---------------------------- activity bar --------------------------- */}
        <div
          className="vsc__activity"
          style={{ backgroundColor: derived['activityBar.background'], ...cursorStyle }}
          {...region('activityBg', 'activityBar.background', 'vscode.field.activityBg')}
        >
          {ACTIVITY_ICONS.map((icon, index) => (
            <span
              key={icon.id}
              className={`vsc__activity-icon${index === 0 ? ' is-active' : ''}`}
              style={{
                color: index === 0 ? derived['activityBar.foreground'] : derived['activityBar.inactiveForeground'],
                borderColor: index === 0 ? derived['activityBar.activeBorder'] : 'transparent',
              }}
            >
              <svg className="vsc__activity-art" viewBox="0 0 16 16" aria-hidden="true">
                {icon.art}
              </svg>
              {/*
                An unread badge on the first icon. It is how VS Code paints
                `activityBarBadge.background` / `.foreground` — the button colours,
                which no other surface in this preview shows.
              */}
              {index === 0 ? (
                <span
                  className="vsc__activity-badge"
                  style={{ backgroundColor: derived['activityBarBadge.background'], ...cursorStyle }}
                  {...region('buttonBg', 'activityBarBadge.background', 'vscode.field.buttonBg')}
                >
                  <span
                    className="vsc__activity-badge-count"
                    style={{ color: derived['activityBarBadge.foreground'], ...cursorStyle }}
                    {...region('buttonFg', 'activityBarBadge.foreground', 'vscode.field.buttonFg')}
                  >
                    3
                  </span>
                </span>
              ) : null}
            </span>
          ))}
        </div>

        {/* ------------------------------ sidebar ------------------------------ */}
        <div
          className="vsc__sidebar"
          style={{ backgroundColor: derived['sideBar.background'], ...cursorStyle }}
          {...region('sidebarBg', 'sideBar.background', 'vscode.field.sidebarBg')}
        >
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
                ...(node.active ? cursorStyle : null),
              }}
              // The selected row is `list.activeSelectionBackground` — the same
              // selection colour the editor uses, reached from the other side.
              {...(node.active
                ? region('selectionBg', 'list.activeSelectionBackground', 'vscode.field.selectionBg')
                : null)}
            >
              <span className="vsc__tree-caret">{node.folder ? '▾' : ''}</span>
              {node.dot ? (
                <span className="vsc__tree-dot" style={{ backgroundColor: node.dot }} />
              ) : null}
              {node.name}
            </div>
          ))}
        </div>

        {/*
          The sidebar / editor divider. VS Code draws it from the border colour, and
          at one pixel it is far too thin to aim at — so the element is a few pixels
          wide and paints its line on the trailing edge only.
        */}
        <span
          className="vsc__divider"
          style={{
            backgroundColor: derived['sideBar.background'],
            borderRightColor: derived['sideBar.border'],
            ...cursorStyle,
          }}
          {...region('border', 'sideBar.border', 'vscode.field.border')}
        />

        {/* -------------------------- tabs + editor ---------------------------- */}
        <div className="vsc__main">
          <div
            className="vsc__tabs"
            style={{ backgroundColor: derived['editorGroupHeader.tabsBackground'], ...cursorStyle }}
            {...region('inactiveTabBg', 'editorGroupHeader.tabsBackground', 'vscode.override.inactiveTabBg')}
          >
            <span
              className="vsc__tab is-active"
              style={{
                backgroundColor: derived['tab.activeBackground'],
                color: derived['tab.activeForeground'],
                borderTopColor: derived['tab.activeBorderTop'],
              }}
            >
              <i className="vsc__tab-dot" style={{ backgroundColor: tokens.func }} />
              theme.js
              <i className="vsc__tab-close">×</i>
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
              <i className="vsc__tab-close">×</i>
            </span>
            <span className="vsc__tab-add" style={{ color: derived['tab.inactiveForeground'] }}>
              +
            </span>
            {/* Split editor and view actions, as the tab row's right end carries. */}
            <span className="vsc__tab-actions" style={{ color: derived['tab.inactiveForeground'] }}>
              <i className="vsc__tab-action vsc__tab-action--split" />
              <i className="vsc__tab-action vsc__tab-action--more" />
            </span>
          </div>

          <div
            className="vsc__editor"
            style={{ backgroundColor: derived['editor.background'], ...cursorStyle }}
            {...region('editorBg', 'editor.background', 'vscode.field.editorBg')}
          >
            {/* Breadcrumb: no colour of its own in the theme — VS Code paints it on
                the editor background in the editor's ink. */}
            <div className="vsc__breadcrumb" style={{ color: derived['editor.foreground'] }}>
              <span>src</span>
              <i className="vsc__breadcrumb-sep">›</i>
              <span>theme.js</span>
            </div>
            {CODE_LINES.map((line, index) => {
              const current = index === CURRENT_LINE
              // Indentation guides sit at the column the indentation ends at, so
              // they are measured in `ch` (the mono advance) rather than in px and
              // stay aligned whatever font the machine resolves.
              const indent = (/^ */u.exec(line[0]?.t ?? '')?.[0].length ?? 0) / 2
              return (
                <div
                  key={index}
                  className={`vsc__line${current ? ' is-current' : ''}`}
                  style={{
                    backgroundColor: current ? derived['editor.lineHighlightBackground'] : 'transparent',
                    ...cursorStyle,
                  }}
                  {...(current
                    ? region('lineHighlightBg', 'editor.lineHighlightBackground', 'vscode.field.lineHighlightBg')
                    : null)}
                >
                  {indent > 0 ? (
                    <span
                      className="vsc__guide"
                      style={{
                        left: `calc(38px + ${indent}ch)`,
                        // The guide of the line the cursor is on is a step brighter
                        // in VS Code, and follows the muted text rather than the
                        // border (see `editorIndentGuide.activeBackground1`).
                        borderLeftColor: current
                          ? derived['editorIndentGuide.activeBackground1']
                          : derived['editorIndentGuide.background1'],
                        ...cursorStyle,
                      }}
                      {...(current
                        ? region('mutedFg', 'editorIndentGuide.activeBackground1', 'vscode.field.mutedFg')
                        : region('indentGuideFg', 'editorIndentGuide.background1', 'vscode.override.indentGuideFg'))}
                    />
                  ) : null}
                  <span
                    className="vsc__line-number"
                    style={{
                      color: current
                        ? derived['editorLineNumber.activeForeground']
                        : derived['editorLineNumber.foreground'],
                      ...cursorStyle,
                    }}
                    {...(current
                      ? region('accent', 'editorLineNumber.activeForeground', 'vscode.field.accent')
                      : region('lineNumberFg', 'editorLineNumber.foreground', 'vscode.override.lineNumberFg'))}
                  >
                    {index + 1}
                  </span>
                  {/*
                    The ink of the line as a whole, under the tokens that override
                    it. Blank lines get no region of their own: there is no text to
                    point at, and the editor's background is the honest answer for
                    the empty space.
                  */}
                  <code
                    className="vsc__line-code"
                    style={{ color: derived['editor.foreground'], ...cursorStyle }}
                    {...(line.some((segment) => segment.t)
                      ? region('editorFg', 'editor.foreground', 'vscode.field.editorFg')
                      : null)}
                  >
                    {line.map((segment, subIndex) => {
                      const token = TOKEN_REGIONS[segment.k]
                      return (
                        <span
                          key={subIndex}
                          style={{
                            color: tokens[segment.k] ?? derived['editor.foreground'],
                            backgroundColor: segment.sel ? derived['editor.selectionBackground'] : undefined,
                            ...cursorStyle,
                          }}
                          // Blank segments (the empty sample lines) carry no
                          // text, so tagging them would add a region with no area
                          // to aim at.
                          {...(segment.sel
                            ? region('selectionBg', 'editor.selectionBackground', 'vscode.field.selectionBg')
                            : token && segment.t
                              ? region(token[0], token[1], token[2])
                              : null)}
                        >
                          {segment.t}
                        </span>
                      )
                    })}
                  </code>
                </div>
              )
            })}

            {/*
              The autocomplete popup: the only surface in a workbench that shows
              `editorSuggestWidget.background` (the pinnable widget colour) and one
              of the two places `editorSuggestWidget.selectedBackground` appears.
              Anchored to the bottom-right, clear of every line that carries its own
              region.
            */}
            <div
              className="vsc__suggest"
              style={{
                backgroundColor: derived['editorSuggestWidget.background'],
                borderColor: derived['editorSuggestWidget.border'],
                color: derived['editorSuggestWidget.foreground'],
                ...cursorStyle,
              }}
              {...region('widgetBg', 'editorSuggestWidget.background', 'vscode.override.widgetBg')}
            >
              <span
                className="vsc__suggest-row is-selected"
                style={{ backgroundColor: derived['editorSuggestWidget.selectedBackground'], ...cursorStyle }}
                {...region('selectionBg', 'editorSuggestWidget.selectedBackground', 'vscode.field.selectionBg')}
              >
                bakeTheme <em>fn</em>
              </span>
              <span className="vsc__suggest-row">
                blushMatcha <em>type</em>
              </span>
            </div>
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
        <span className="vsc__panel-tabs">
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
        </span>

        {/*
          A line of real panel content, so the two semantic colours have a home in
          the preview: an error is `editorError.foreground`, a warning
          `editorWarning.foreground`, and they are the only place either shows.
        */}
        <span
          className="vsc__problem"
          style={{ color: derived['editorError.foreground'], ...cursorStyle }}
          {...region('errorFg', 'editorError.foreground', 'vscode.field.errorFg')}
        >
          <i className="vsc__problem-dot" />
          {t('vscode.preview.problemError')}
        </span>
        <span
          className="vsc__problem"
          style={{ color: derived['editorWarning.foreground'], ...cursorStyle }}
          {...region('warningFg', 'editorWarning.foreground', 'vscode.field.warningFg')}
        >
          <i className="vsc__problem-dot" />
          {t('vscode.preview.problemWarning')}
        </span>
      </div>

      {/* ------------------------------ status bar ----------------------------- */}
      <div
        className="vsc__status"
        style={{ backgroundColor: derived['statusBar.background'], ...cursorStyle }}
        {...region('statusBarBg', 'statusBar.background', 'vscode.override.statusBarBg')}
      >
        <span className="vsc__status-side" style={{ color: derived['statusBar.foreground'] }}>
          {/* The branch, the dirty marker, then the problem counts. */}
          <svg className="vsc__status-glyph" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="5.6" cy="4" r="1.7" />
            <circle cx="5.6" cy="12" r="1.7" />
            <circle cx="11.4" cy="8" r="1.7" />
            <path d="M5.6 5.7v4.6M7.3 8h2.4" />
          </svg>
          main*
          <svg className="vsc__status-glyph" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3.5 8a4.5 4.5 0 0 1 7.7-3.2M12.5 8a4.5 4.5 0 0 1-7.7 3.2" />
            <path d="M11.2 2.6v2.4H8.8M4.8 13.4v-2.4h2.4" />
          </svg>
          <span className="vsc__status-count">0</span>
          <span className="vsc__status-count">△ 0</span>
        </span>
        <span className="vsc__status-right" style={{ color: derived['statusBar.foreground'] }}>
          Ln 4, Col 12
          <span className="vsc__status-item">Spaces: 2</span>
          <span className="vsc__status-item">UTF-8</span>
          <span className="vsc__status-item">{'{ }'}</span>
        </span>
      </div>
    </div>
  )
}
