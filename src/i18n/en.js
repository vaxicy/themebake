/**
 * English dictionary.
 *
 * The key set here is the canonical one: `verify.mjs` asserts that every other
 * locale has exactly the same keys, so a missing translation fails the build
 * check instead of silently falling back at runtime.
 *
 * Naming: `<area>.<thing>[.<variant>]`. Interpolation uses `{name}` placeholders.
 * Theme field labels/hints live under `field.<fieldId>.label|hint`.
 */

export default {
  // ------------------------------------------------------------------ app-wide
  'app.name': 'ThemeBake',
  'app.skipToEditor': 'ThemeBake — back to the editor',
  'app.primaryNav': 'Primary',
  'app.close': 'Close',

  // -------------------------------------------------------------------- header
  'header.undo': 'Undo',
  'header.undoTitle': 'Undo the last change (Ctrl+Z)',
  'header.reset': 'Reset',
  'header.github': 'GitHub',
  'header.githubTitle': 'ThemeBake on GitHub',
  'header.githubAria': 'ThemeBake repository on GitHub',
  'header.about': 'About',
  'header.storageUnavailable':
    'Local storage is unavailable in this browser — your edits will not be remembered after a reload.',
  'header.storageWriteFailed':
    'Could not save your draft to local storage. Your edits still work, but will not survive a reload.',

  // --------------------------------------------------------------------- about
  'about.title': 'About ThemeBake',
  'about.description': 'Create custom Chrome themes directly in your browser.',
  'about.intro':
    'ThemeBake is a no-account theme builder for Chrome. Pick your colours, watch the live preview, and download a ready-to-load theme ZIP in seconds.',
  'about.whatYouGet': 'What you get',
  'about.bullet1a': 'A theme folder containing ',
  'about.bullet1b': ' inside a named folder — ready for Load unpacked. Nothing else is written.',
  'about.bullet2': 'Manifest V3 compatible, with colours mapped to real Chrome theme keys.',
  'about.bullet3a': 'Load it via ',
  'about.bullet3b': ' → Developer mode → Load unpacked, or upload it to the Chrome Web Store.',
  'about.privacy': 'Privacy',
  'about.privacyBody':
    'ThemeBake processes theme settings locally in your browser. No account is required. Theme configurations and images are never uploaded to a server. Your draft is kept in this browser’s local storage only. The one exception is AI naming: only when you click it are the palette colours sent to the AI provider you configured, using your own key.',
  'about.scope': 'Scope',
  'about.scopeBody':
    'This version generates colour-only themes and does not write background images (theme.images). Every text pair is checked by the built-in contrast audit, and the download stays small.',

  // -------------------------------------------------------------------- footer
  'footer.privacy':
    'ThemeBake processes theme settings locally in your browser. No account is required, and your theme configurations are never uploaded to a server — the only exception is AI naming, where clicking it sends just the colours to the provider you configured.',

  // -------------------------------------------------------- language switcher
  'lang.switcherAria': 'Interface language',
  'lang.en': 'EN',
  'lang.zh': '中文',

  // ------------------------------------------------------------------- scheme
  // The light/dark pair, one word each. Kept separate from `vscode.type.*`
  // because the studio and the preview switch talk about schemes, not about a
  // theme's declared type.
  'scheme.light': 'Light',
  'scheme.dark': 'Dark',

  // ---------------------------------------------------------------------- hero
  'hero.title': 'Create your own Chrome theme.',
  'hero.subtitle':
    'Pick your colors, preview your theme, and generate a ready-to-use Chrome theme in seconds.',
  'hero.vscode.title': 'Create your own VS Code theme.',
  'hero.vscode.subtitle':
    'Tune 14 master colours, watch the workbench and the syntax highlighting update live, and export an installable extension in seconds.',

  // ---------------------------------------------------------------- settings
  'mode.chrome': 'Chrome Theme',
  'mode.vscode': 'VS Code Theme',
  'mode.aria': 'Choose a workspace',
  'settings.title': 'Theme Settings',
  'settings.subtitle': 'Every colour below maps to a real Chrome theme key — see Preview Manifest.',
  'settings.name.label': 'Theme Name',
  'settings.name.placeholder': 'My Theme',
  'settings.name.hint':
    'Written into manifest.json as the theme’s display name, exactly as typed. The folder name below is a separate field.',
  'settings.folder.label': 'Folder name',
  'settings.folder.placeholder': 'blush-matcha-theme',
  'settings.folder.hint':
    'The folder inside the download, and the file name of the ZIP. Used exactly as typed — only characters a filesystem rejects are stripped. Leave it empty to derive one from the theme name.',
  'settings.description.label': 'Summary',
  'settings.description.placeholder': 'A calm rose theme for long reading sessions.',
  'settings.description.hint':
    'Optional. Up to {max} characters. Written into manifest.json as description — the Chrome Web Store shows it as the package summary, under the title on the detail page and in search results. Chrome does not display it for a locally loaded theme.',
  'settings.clear': 'Clear',
  'settings.clearTitle': 'Clear the theme name, folder name and summary in one click',
  'settings.autoClear': 'Auto-clear on new theme',
  'settings.autoClearTitle': 'Clear these three fields whenever a new theme is applied (preset, random, smart palette, import)',
  'settings.group.browserChrome': 'Browser chrome',
  'settings.group.addressBar': 'Address bar',
  'settings.group.bookmarks': 'Bookmarks',
  'settings.group.newTabPage': 'New Tab Page',
  'settings.logo.label': 'New Tab Page logo',

  // ------------------------------------------------------------------ vscode
  'vscode.title': 'VS Code Theme Settings',
  'vscode.subtitle':
    'Tune 14 master colours — the other 90+ workbench keys and the syntax colours are derived automatically. Live preview, installable export.',
  'vscode.type.label': 'Theme type',
  'vscode.type.dark': 'Dark',
  'vscode.type.light': 'Light',
  'vscode.type.hc': 'High contrast',
  'vscode.type.hint':
    'Dark and light follow the primary palette — {scheme} right now, which is also the type written into the theme JSON. Picking the other card re-solves the primary palette for it (the other half is untouched); high contrast is a rendering mode, so it stays a manual choice.',
  'vscode.pair.label': 'Also generate the opposite scheme',
  'vscode.pair.hint':
    'Derives the {other} palette from your colours and exports both themes from one package. The preview switch flips between them.',
  'vscode.pair.hcUnsupported': 'High contrast has no light/dark counterpart, so pairing is unavailable.',
  'vscode.importManifestUnsupported': 'The VS Code workspace cannot import a Chrome theme — use palette import.',
  'vscode.group.editor': 'Editor',
  'vscode.group.shell': 'Shell',
  'vscode.group.controls': 'Controls',
  'vscode.group.semantic': 'Semantic',
  // Each hint names the VS Code keys it actually drives: "what can I even
  // colour here?" is the question this panel exists to answer.
  'vscode.field.editorBg': 'Editor background',
  'vscode.field.editorBg.hint':
    'The editing surface, and the backdrop of the active tab and the terminal (editor.background, tab.activeBackground, terminal.background).',
  'vscode.field.editorFg': 'Editor text',
  'vscode.field.editorFg.hint':
    'Default code colour and the global foreground — sidebar, panel and status-bar labels use it too (editor.foreground, foreground, sideBar.foreground).',
  'vscode.field.accent': 'Accent',
  'vscode.field.accent.hint':
    'Cursor, focus borders, links and badges (editorCursor.foreground, focusBorder, textLink.foreground, badge.background).',
  'vscode.field.selectionBg': 'Selection',
  'vscode.field.selectionBg.hint':
    'Selected text, selected list rows and the suggestion highlight (editor.selectionBackground, list.activeSelectionBackground, editorSuggestWidget.selectedBackground).',
  'vscode.field.lineHighlightBg': 'Current line',
  'vscode.field.lineHighlightBg.hint':
    'Background of the line the cursor sits on (editor.lineHighlightBackground).',
  'vscode.field.mutedFg': 'Muted text',
  'vscode.field.mutedFg.hint':
    'Line numbers, descriptions, inactive tabs and input placeholders (editorLineNumber.foreground, descriptionForeground, tab.inactiveForeground).',
  'vscode.field.activityBg': 'Activity bar',
  'vscode.field.activityBg.hint':
    'The leftmost icon bar (activityBar.background); its icons follow the editor text colour.',
  'vscode.field.sidebarBg': 'Sidebar background',
  'vscode.field.sidebarBg.hint':
    'The Explorer sidebar (sideBar.background). The panel, the status bar and popups follow it by default — pin them separately under “Pin a region” below.',
  'vscode.field.titleBg': 'Title bar / inactive tabs',
  'vscode.field.titleBg.hint':
    'Title bar and the unselected tabs (titleBar.activeBackground, tab.inactiveBackground, editorGroupHeader.tabsBackground).',
  'vscode.field.border': 'Borders',
  'vscode.field.border.hint':
    'Separators for sidebar, panel, inputs and tabs, plus the scrollbar slider (sideBar.border, panel.border, input.border, tab.border, scrollbarSlider.background).',
  'vscode.field.buttonBg': 'Button background',
  'vscode.field.buttonBg.hint':
    'Primary buttons, activity-bar badges and the debugging status bar (button.background, activityBarBadge.background, statusBar.debuggingBackground).',
  'vscode.field.buttonFg': 'Button text',
  'vscode.field.buttonFg.hint': 'Text on those buttons and badges (button.foreground, activityBarBadge.foreground).',
  'vscode.field.errorFg': 'Error colour',
  'vscode.field.errorFg.hint':
    'Error squiggles and messages, plus the git-deleted marker (editorError.foreground, errorForeground, gitDecoration.deletedResourceForeground).',
  'vscode.field.warningFg': 'Warning colour',
  'vscode.field.warningFg.hint':
    'Warning squiggles; it also steers the string and number token colours (editorWarning.foreground, terminal.ansiYellow).',

  // ------------------------------------------------------- pinned regions
  'vscode.override.section': 'Pin a region',
  'vscode.override.sectionHint':
    'These regions follow the master palette above. In VS Code they are separate surfaces — a light sidebar with a dark status bar is a completely normal pairing — so pin one here and both the preview and the export follow.',
  'vscode.override.otherPairNote':
    'Pinned regions are absolute colours, so they belong to the {scheme} palette you were editing. Switch back to it to change them.',
  'vscode.override.enable': 'Pin',
  'vscode.override.inherits': 'Follows {source}',
  'vscode.override.panelBg': 'Panel background',
  'vscode.override.panelBg.hint':
    'The Problems / Output / Terminal strip (panel.background). Follows the sidebar by default.',
  'vscode.override.statusBarBg': 'Status bar background',
  'vscode.override.statusBarBg.hint':
    'The bottom status bar (statusBar.background, statusBar.noFolderBackground). Follows the sidebar by default.',
  'vscode.override.inactiveTabBg': 'Inactive tab background',
  'vscode.override.inactiveTabBg.hint':
    'Unselected tabs and the tab strip (tab.inactiveBackground, editorGroupHeader.tabsBackground). Follows the title bar by default.',
  'vscode.override.widgetBg': 'Popup and widget background',
  'vscode.override.widgetBg.hint':
    'Command palette, suggestions, hover tooltips, notifications, inputs and dropdowns (quickInput.background, editorSuggestWidget.background, editorHoverWidget.background, notifications.background, input.background, dropdown.background). Follows the sidebar by default.',
  'vscode.override.lineNumberFg': 'Line number colour',
  'vscode.override.lineNumberFg.hint':
    'Editor line numbers (editorLineNumber.foreground). Follows the muted text colour by default.',
  'vscode.override.indentGuideFg': 'Indent guides',
  'vscode.override.indentGuideFg.hint':
    'Indent guides and whitespace markers (editorIndentGuide.background1, editorWhitespace.foreground). Follows the border colour, with transparency, by default.',
  'vscode.preview.title': 'VS Code Preview',
  'vscode.preview.subtitle': 'The workbench and syntax colours rendered from your palette.',
  'vscode.preview.aria': 'VS Code interface preview',
  'vscode.preview.derived': 'Derives {colors} workbench colour keys + {tokens} syntax rules.',
  'vscode.preview.variantLegend': 'Edited palette',
  'vscode.preview.pairNote':
    'Editing the {shown} palette. The two halves are independent — each keeps its own colours, so tune them separately — and the export contains both.',
  'vscode.export.title': 'Export VS Code Theme',
  'vscode.export.subtitle': 'Builds an installable extension package {filename} (package.json + themes/ JSON + README).',
  'vscode.export.subtitleFolder': 'Writes the extension folder {folder}/ directly — no unzipping needed.',
  'vscode.export.subtitlePair':
    'Builds one installable package {filename} carrying {count} themes: package.json + a JSON per scheme + README.',
  'vscode.export.subtitlePairFolder':
    'Writes the folder {folder}/ carrying {count} themes — install once, switch whenever you like.',
  'vscode.export.note': 'The ZIP holds a single folder {folder}/ with package.json and the theme JSON under themes/.',
  'vscode.export.noteFolder': 'Creates folder {folder}/ at your chosen location, with package.json and the theme JSON under themes/.',
  'vscode.export.notePair':
    'The ZIP holds a single folder {folder}/ whose themes/ directory carries the light and the dark JSON.',
  'vscode.export.notePairFolder':
    'Creates folder {folder}/ at your chosen location, with both theme JSONs under themes/.',
  'vscode.export.outputHint':
    'VSIX is the package VS Code installs directly — no unzipping, and it shows up in the Extensions list. ZIP downloads an archive you can unzip into any folder on any OS. Folder writes the extension straight into a directory you pick, which is the quickest path while tweaking a theme.',
  'vscode.export.outputHintNoFolder':
    'VSIX is the package VS Code installs directly — no unzipping, and it shows up in the Extensions list. ZIP downloads an archive you can unzip into any folder on any OS. This browser cannot write a folder — that needs desktop Chrome or Edge.',
  'vscode.export.noteVsix':
    'Downloads {filename} — the standard VS Code extension package. It installs into the Extensions list, and there is nothing to unzip.',
  'vscode.export.notePairVsix':
    '{filename} carries both the light and the dark theme in one package — install once, switch any time.',
  'vscode.export.howtoSummary': 'How to install',
  'vscode.export.howto1': 'Copy the exported folder into %USERPROFILE%\\.vscode\\extensions\\.',
  'vscode.export.howto2': 'Restart VS Code (or open the folder and debug it as an extension).',
  'vscode.export.howto3': 'Open the theme picker with Ctrl+K Ctrl+T and choose “{name}”.',
  'vscode.export.howtoVsix1':
    'In VS Code, open the Extensions view, use the ⋯ menu → Install from VSIX… and pick the downloaded file.',
  'vscode.export.howtoVsix2': 'Or from a terminal: code --install-extension {filename}',
  'settings.logo.adaptive': 'Adaptive',
  'settings.logo.classic': 'Original',
  'settings.logo.hint':
    'Adaptive (default) — the logo follows your New Tab background: white over dark backgrounds, the standard dark logo over light ones. Original — Google’s unmodified colour logo.',

  // ------------------------------------------------------- theme field labels
  'field.frame.label': 'Frame',
  'field.frame.hint':
    'Window frame and tab strip. Chrome also derives the active tab background from this colour.',
  'field.frameInactive.label': 'Frame (inactive window)',
  'field.frameInactive.hint': 'Used when the browser window loses focus.',
  'field.toolbar.label': 'Toolbar',
  'field.toolbar.hint': 'The strip containing the address bar, extensions and profile icons.',
  'field.backgroundTab.label': 'Tab background',
  'field.backgroundTab.hint': 'Background of the inactive (background) tabs.',
  'field.tabText.label': 'Active tab text',
  'field.tabText.hint': 'Text of the currently selected tab.',
  'field.tabBackgroundText.label': 'Inactive tab text',
  'field.tabBackgroundText.hint': 'Text of the unselected tabs.',
  'field.toolbarButtonIcon.label': 'Toolbar icon colour',
  'field.toolbarButtonIcon.hint': 'Navigation, reload and extension icons in the toolbar.',
  'field.buttonBackground.label': 'Window button background',
  'field.buttonBackground.hint': 'Background of the window controls (minimise / maximise / close).',
  'field.omniboxBackground.label': 'Address bar background',
  'field.omniboxBackground.hint': 'The rounded search/URL field.',
  'field.omniboxText.label': 'Address bar text',
  'field.omniboxText.hint': 'Text typed into the address bar.',
  'field.bookmarkText.label': 'Bookmark text',
  'field.bookmarkText.hint': 'Text and icons in the bookmarks bar.',
  'field.ntpBackground.label': 'New Tab Page background',
  'field.ntpBackground.hint': 'Full-page background of a newly opened tab.',
  'field.ntpText.label': 'New Tab Page text',
  'field.ntpText.hint': 'Headings and text on the New Tab Page.',
  'field.ntpLink.label': 'New Tab Page link',
  'field.ntpLink.hint': 'Links and interactive shortcuts on the New Tab Page.',

  // --------------------------------------------------------------- colour field
  'colorField.pickerAria': '{label} colour picker',
  'colorField.hexAria': '{label} hex value',
  'colorField.invalid': 'Enter a hex colour such as #B1B2FF. Keeping the last valid value.',
  'colorField.invalidToast': 'Invalid color value. {label} kept its last valid colour.',

  // ------------------------------------------------------------- smart palette
  'studio.title': 'Smart palette',
  'studio.subtitle': 'Pick one colour and ThemeBake derives a full, contrast-checked theme.',
  'studio.seedLabel': 'Main colour',
  'studio.seedHint': 'Becomes the window frame. Everything else is derived from it.',
  // The VS Code workbench solves the same palette but writes different roles, so
  // it says where the seed lands there instead of talking about a window frame.
  'studio.vscodeSeedHint':
    'Drives the whole palette — the frame solved from it becomes the editor surface, and the rest of the workbench follows.',
  'studio.randomSeed': 'Random colour',
  'studio.resolvedScheme': 'Resolved: {scheme}',
  'studio.modeLegend': 'Brightness',
  'studio.mode.auto': 'Auto',
  'studio.mode.light': 'Light',
  'studio.mode.dark': 'Dark',
  'studio.intensityLegend': 'Character',
  'studio.intensity.soft': 'Soft',
  'studio.intensity.balanced': 'Balanced',
  'studio.intensity.bold': 'Bold',
  'studio.accentLegend': 'Colour relationship',
  'studio.accent.harmony': 'Matching',
  'studio.accent.clash': 'Contrasting',
  'studio.accent.triad': 'Triadic',
  'studio.accentHint.harmony':
    'Every surface and the accent stay in the seed hue — one calm colour in a few tints.',
  'studio.accentHint.clash':
    'Surfaces keep the seed hue while the accent lands on the opposite side of the colour wheel. The surfaces are held back so the accent carries the theme.',
  'studio.accentHint.triad':
    'Three related hues: the seed for the surfaces, a second for the accent and a third for the window buttons.',
  'studio.generate': 'Generate theme',
  'studio.resultLegend': 'Derived result',
  'studio.noteNeutral': 'Neutral seed detected — deriving a greyscale theme rather than inventing a hue.',
  'studio.noteFrameAdjusted':
    '“{hex}” was adjusted so it works as this frame. Its hue still drives the whole theme.',
  'studio.noteSeedsUsed': '{used} of {total} colours from your palette were used directly.',
  'studio.noteClash':
    'The accent sits on the opposite hue to your seed ({hex}); the surfaces keep the seed hue.',
  'studio.noteTriad':
    'Triadic result: accent {hex}, with the window buttons on the third hue {third}.',
  'studio.noteMultiFamily':
    'Your palette held {count} colour families: {accent} became the accent and {surfaces} the toolbar and page — no longer averaged into one colour.',

  // ----------------------------------------------------------------- ai naming
  'ai.title': 'AI generation',
  'ai.subtitle': 'Generate the theme name, folder name, and store description from your colours in one click.',
  'ai.generate': 'Generate all',
  'ai.generating': 'Generating…',
  'ai.generateDesc': 'Generate description',
  'ai.generatingDesc': 'Writing description…',
  'ai.descGenerated': 'Description updated.',
  'ai.pickOne': 'Pick one — it fills in both the theme name and the folder name.',
  'ai.settingsSummary': 'AI settings',
  'ai.statusReady': 'Configured',
  'ai.statusNoKey': 'No API key',
  'ai.provider': 'Provider',
  'ai.baseURL': 'Endpoint',
  'ai.baseURLHint':
    'Any OpenAI-compatible base URL — SiliconFlow, DeepSeek, Gemini and OpenRouter all work as-is. The standard /chat/completions path is added for you.',
  'ai.corsWarning':
    'api.openai.com refuses browser requests, so this preset only works through a proxy you control. Replace the URL above with your own proxy address.',
  'ai.model': 'Model',
  'ai.modelHint': 'The exact model id the provider expects.',
  'ai.apiKey': 'API key',
  'ai.apiKeyHint':
    'Sent straight from your browser to the provider. Kept only in this browser — never uploaded anywhere else, and never written into the theme.',
  'ai.rememberKey': 'Remember this key',
  'ai.temperature': 'Creativity',
  'ai.temperatureHint': 'Higher means more surprising names.',
  'ai.candidates': 'Candidates',
  'ai.candidatesOption': '{count}',
  'ai.style': 'Direction',
  'ai.style.auto': 'Auto',
  'ai.style.elegant': 'Elegant',
  'ai.style.minimal': 'Minimal',
  'ai.style.cute': 'Cute',
  'ai.style.tech': 'Technical',
  'ai.style.nature': 'Nature',
  'ai.style.retro': 'Retro',
  'ai.style.dreamy': 'Dreamy',
  'ai.language': 'Generation language',
  'ai.lang.en': 'English',
  'ai.lang.zh': 'Chinese',
  'ai.privacyNote':
    'The key stays in this browser. Nothing about your theme leaves the page except the colours in this request.',
  'ai.generated': 'Generated {count} name suggestion(s).',
  'ai.errorNoKey': 'Add an API key in the AI settings first.',
  'ai.errorNoBase': 'Enter an endpoint URL in the AI settings.',
  'ai.errorNoModel': 'Enter a model id in the AI settings.',
  'ai.errorUnauthorized': 'The provider rejected the API key (401). Check the key and the provider.',
  'ai.errorForbidden': 'The provider refused the request (403). The key may lack access to this model.',
  'ai.errorNotFound': 'Endpoint or model not found (404). Check the URL and the model id.',
  'ai.errorRateLimited': 'Rate limited (429). Wait a moment and try again.',
  'ai.errorServer': 'The provider had an internal error (5xx). Try again shortly.',
  'ai.errorNetwork':
    'Could not reach the provider. A network problem, or the endpoint blocks browser requests (CORS).',
  'ai.errorTimeout': 'The request timed out. Try again, or pick a faster model.',
  'ai.errorParse':
    'The model’s reply could not be read as names. Try again, or lower the creativity.',
  'ai.errorUnknown': 'AI naming failed. The locally generated name is still in place.',

  // -------------------------------------------------------------------- import
  'import.title': 'Import',
  'import.subtitle':
    'Paste colours, a palette link, a manifest, or drop an image — ThemeBake maps it onto Chrome roles.',
  'import.placeholder':
    'Paste hex codes, an rgb() list, a Coolors / Adobe Color link, a manifest.json, or a theme JSON this tool exported…',
  'import.pickImage': 'Choose image',
  'import.imageHint': 'or paste a screenshot with {shortcut}',
  'import.shortcut': 'Ctrl+V',
  'import.dropHint': 'Drag an image here, or click to browse',
  'import.example': 'Try an example',
  'import.removeSwatch': 'Remove {hex}',
  'import.detected': 'Detected {count} colour(s)',
  'import.sourceBands': 'Flat palette detected — exact colours recovered in order.',
  'import.sourceClusters': 'Photo detected — dominant colours extracted by clustering.',
  'import.sourceUrl': 'Read from the link. No network request was made — the URL is only parsed as text.',
  'import.apply': 'Apply to theme',
  'import.clear': 'Clear',
  'import.analyzing': 'Analysing…',
  'import.foundManifest': 'Found a Chrome theme manifest (name: “{name}”).',
  'import.foundTheme': 'Recognised a theme definition — {count} colour(s) mapped onto Chrome roles.',
  'import.errorEmpty': 'Nothing to import — paste some colours or choose an image first.',
  'import.errorNoColors': 'No colours found in that input.',
  'import.errorBadFile': 'That file type is not supported. Use an image, .json or .txt file.',
  'import.errorTooBig': 'That image is too large. Try one under 10 MB.',
  'import.errorBadImage': 'That image could not be read.',
  'import.errorBadJson': 'That looks like JSON but is not a Chrome theme manifest.',
  'import.errorNoThemeColors': 'No theme.colors object found in that manifest.',
  'import.deadKeys':
    'Ignored {count} key(s) that Chrome does not support: {keys}. They are accepted by the manifest parser but never rendered.',

  // ------------------------------------------------------------------ presets
  'presets.title': 'Presets',
  'presets.subtitle': 'Start from a hand-tuned palette, then keep editing.',
  'presets.randomize': 'Randomize',
  'presets.randomizeAria': 'Generate a random coordinated theme',
  'preset.soft-sky.name': 'Soft Sky',
  'preset.soft-sky.description': 'Airy daylight blues with a crisp white toolbar.',
  'preset.cozy-vintage.name': 'Cozy Vintage',
  'preset.cozy-vintage.description': 'Warm parchment, terracotta accents and soft ink text.',
  'preset.dusty-petal.name': 'Dusty Petal',
  'preset.dusty-petal.description': 'Muted rose with a warm grey base. Quiet and editorial.',
  'preset.periwinkle-dream.name': 'Periwinkle Dream',
  'preset.periwinkle-dream.description': 'Cool lavender with plenty of breathing room.',
  'preset.berry-dusk.name': 'Berry Dusk',
  'preset.berry-dusk.description': 'A dark plum theme for late sessions. Warms the eyes at night.',
  'preset.pink-souffle.name': 'Pink Soufflé',
  'preset.pink-souffle.description': 'Pale strawberry cream with a rosy accent. Light and friendly.',

  // ------------------------------------------------------------------ preview
  'preview.title': 'Live Preview',
  'preview.subtitle': 'Updates as you edit. Chrome may fine-tune contrast slightly on apply.',
  'preview.showKeys': 'Show keys',
  'preview.mockupAria': 'Live preview of the Chrome theme you are building',
  'preview.omnibox': 'Search or enter address',
  'preview.ntpSearch': 'Search or type a URL',
  'preview.ntpTitle': 'Search the web',
  'preview.ntpSubtitle': 'Your custom theme, applied.',

  // ------------------------------------------------------------------- export
  'export.title': 'Generate',
  'export.subtitle':
    'Writes all {keys} Chrome colour keys plus {tints} tints. Downloads as {filename}.',
  'export.subtitleFolder': 'Writes all {keys} Chrome colour keys plus {tints} tints into {folder}/.',
  'export.formatLegend': 'Manifest colour format',
  'export.formatHint': 'RGB arrays are what Chrome loads. The HEX form is for Firefox only.',
  'export.format.rgb': 'RGB array',
  'export.format.hex': 'HEX string',
  'export.formatHexWarn':
    'Chrome aborts the whole manifest when a colour value is a string, so it will refuse to load this theme. Switch to RGB array to install it in Chrome.',
  'export.outputLegend': 'Output',
  'export.output.zip': 'ZIP',
  'export.output.folder': 'Folder',
  'export.output.vsix': 'VSIX',
  'export.outputHint':
    'Folder writes the theme into a directory you pick, so there is nothing to unzip before Load unpacked. ZIP downloads an archive instead.',
  'export.folderUnsupported':
    'This browser cannot write a folder — that needs desktop Chrome or Edge. Use ZIP instead.',
  'export.packageNote': 'The ZIP holds one folder, {folder}/, containing manifest.json.',
  'export.packageNoteFolder': 'Creates {folder}/ wherever you choose, holding exactly manifest.json.',
  'export.generate': 'Generate Theme',
  'export.generating': 'Exporting…',
  'export.previewManifest': 'Preview Manifest',
  'export.json': 'Export theme JSON',
  'export.jsonTitle':
    'Save this theme as a JSON file you can paste back into the Import panel — for backup or sharing.',
  'export.howtoSummary': 'How do I install the generated theme?',
  'export.howto1a': 'Unzip ',
  'export.howto1b': ' — you get a single folder, ',
  'export.howto1c': '.',
  'export.howto1Folder': 'Open the directory you picked — {folder}/ is already there, no unzipping needed.',
  'export.howto2': 'Open chrome://extensions and turn on Developer mode.',
  'export.howto3':
    'Click Load unpacked and select that folder itself — Chrome needs the folder containing manifest.json, not the ZIP and not its parent.',
  'export.howto4':
    'To publish instead, zip the folder again and upload it in the Chrome Web Store developer dashboard.',
  'export.howto5':
    'New Tab Page still plain white? A Customize Chrome background outranks the theme. Open a new tab, click Customize Chrome at the bottom right, then reset Background to the default — reinstalling the theme also re-applies its colour.',

  // ------------------------------------------------------------------ manifest
  'manifest.title': 'manifest.json',
  'manifest.description': 'This is exactly what ThemeBake writes into your theme ZIP.',
  'manifest.validJson': 'Valid JSON',
  'manifest.invalidJson': 'Invalid JSON',
  'manifest.parseFailed': 'The generated manifest could not be parsed: {error}',
  'manifest.summary': '{count} theme key(s) · {filename}',
  'manifest.copy': 'Copy JSON',
  'manifest.copied': 'Copied',
  'manifest.download': 'Download JSON',
  'manifest.codeAria': 'Generated manifest JSON',
  'manifest.copiedToast': 'Manifest JSON copied to clipboard.',
  'manifest.copyFailed': 'Copying failed. Select the JSON manually instead.',

  // ------------------------------------------------------------------- confirm
  'confirm.reset.title': 'Reset this theme?',
  'confirm.reset.description':
    'Your current colours and theme name will be replaced with the default ThemeBake theme.',
  'confirm.reset.body':
    'This affects the current theme only. Nothing is uploaded anywhere, and nothing outside ThemeBake is changed.',
  'confirm.reset.confirm': 'Reset theme',
  'confirm.cancel': 'Cancel',

  // -------------------------------------------------------------------- modal
  'modal.close': 'Close dialog',

  // -------------------------------------------------------------------- toast
  'toast.region': 'Notifications',
  'toast.themeGenerated': 'Theme generated successfully.',
  'toast.themeReset': 'Theme reset.',
  'toast.fieldsCleared': 'Name, folder name and summary cleared.',
  'toast.vscodeGenerated': 'VS Code theme package generated.',
  'toast.vscodeGeneratedPair': 'VS Code theme package with a light and a dark theme generated.',
  'toast.vscodeVsixGenerated': 'VS Code extension package (.vsix) generated.',
  'toast.vscodeVsixGeneratedPair': '.vsix generated, carrying a light and a dark theme.',
  'toast.vscodeSchemeSwitched': 'Re-solved the palette for the {scheme} scheme.',
  'toast.vscodeFieldsCleared': 'Name and folder name cleared.',
  'toast.undone': 'Undid the last change.',
  'toast.presetApplied': 'Applied preset “{name}”.',
  'toast.randomApplied': 'Generated a new random theme.',
  'toast.smartApplied': 'Built a full theme from your colour(s).',
  'toast.paletteApplied': 'Applied a {count}-colour palette.',
  'toast.paletteAppliedUsed': 'Applied a {count}-colour palette — {used} of them used directly.',
  'toast.imageExtracted': 'Extracted {count} colour(s) from the image.',
  'toast.zipFailed': 'ZIP generation failed: {error}',
  'toast.folderFailed': 'Writing the folder failed: {error}',
  'toast.folderWritten': 'Wrote {folder}/ into {root}.',
  'toast.noValidColors': 'No valid colours were available to generate a theme.',
  'toast.dismiss': 'Dismiss notification: {message}',

  // ------------------------------------------------------------------ validate
  'validate.nameRequired': 'Theme name is required.',
  'validate.nameTooLong': 'Theme name must be 45 characters or fewer.',
  'validate.descriptionTooLong': 'The summary must be {max} characters or fewer.',
  'validate.invalidColors': 'These colours are not valid hex values: {fields}.',
  'validate.noColors': 'At least one valid colour is required.',

  // ------------------------------------------------------------------ warnings
  // Emitted by `manifest.js` when it has to drop something. In normal use these
  // never fire — the editor cannot produce an invalid value — so they exist as a
  // belt-and-braces guard that stays localised.
  'warn.droppedInvalid': 'Dropped "{field}" ({chromeKey}): "{value}" is not a valid hex colour.',
  'warn.skippedKey': 'Skipped unknown Chrome theme key "{chromeKey}" (field "{field}").',
  'warn.hexNotChromeLoadable':
    'HEX string format: Chrome rejects a manifest whose colours are strings. Use RGB array to install this theme in Chrome.',

  // -------------------------------------------------------------------- audit
  'audit.title': 'Contrast check',
  'audit.ok': 'Contrast looks good across all text pairs.',
  'audit.issues': '{count} contrast issue(s) to review:',
  'audit.autoFix': 'Auto-fix contrast',
  'audit.fixed': 'Adjusted {count} colour(s) to restore readability.',
  'audit.fixFailed': 'Contrast could not be improved automatically.',
  'audit.pair': '{fg} on {bg}: {ratio}:1 (recommended {min}:1).',

  // --------------------------------------------------------------------- crash
  'crash.title': 'Something went wrong',
  'crash.text':
    'ThemeBake hit an unexpected error. Your saved draft is still in this browser; reloading usually fixes it. If it keeps happening, clear the saved data below.',
  'crash.reload': 'Reload',
  'crash.clear': 'Clear saved data & reload',
}
