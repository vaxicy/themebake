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

  // ---------------------------------------------------------------------- hero
  'hero.title': 'Create your own Chrome theme.',
  'hero.subtitle':
    'Pick your colors, preview your theme, and generate a ready-to-use Chrome theme in seconds.',

  // ---------------------------------------------------------------- settings
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
  'settings.group.browserChrome': 'Browser chrome',
  'settings.group.addressBar': 'Address bar',
  'settings.group.bookmarks': 'Bookmarks',
  'settings.group.newTabPage': 'New Tab Page',
  'settings.logo.label': 'New Tab Page logo',
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
  'studio.modeLegend': 'Brightness',
  'studio.mode.auto': 'Auto',
  'studio.mode.light': 'Light',
  'studio.mode.dark': 'Dark',
  'studio.intensityLegend': 'Character',
  'studio.intensity.soft': 'Soft',
  'studio.intensity.balanced': 'Balanced',
  'studio.intensity.bold': 'Bold',
  'studio.generate': 'Generate theme',
  'studio.resultLegend': 'Derived result',
  'studio.noteNeutral': 'Neutral seed detected — deriving a greyscale theme rather than inventing a hue.',
  'studio.noteFrameAdjusted':
    '“{hex}” was adjusted so it works as this frame. Its hue still drives the whole theme.',
  'studio.noteSeedsUsed': '{used} of {total} colours from your palette were used directly.',

  // ----------------------------------------------------------------- ai naming
  'ai.title': 'AI naming',
  'ai.subtitle': 'Let a model invent the theme name and its folder name from your colours.',
  'ai.generate': 'Generate names',
  'ai.generating': 'Asking the model…',
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
  'export.outputHint':
    'Folder writes the theme into a directory you pick, so there is nothing to unzip before Load unpacked. ZIP downloads an archive instead.',
  'export.folderUnsupported':
    'This browser cannot write a folder — that needs desktop Chrome or Edge. Use ZIP instead.',
  'export.packageNote': 'The ZIP holds one folder, {folder}/, containing manifest.json.',
  'export.packageNoteFolder': 'Creates {folder}/ wherever you choose, holding exactly manifest.json.',
  'export.generate': 'Generate Theme',
  'export.generating': 'Building ZIP…',
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
  'toast.undone': 'Undid the last change.',
  'toast.presetApplied': 'Applied preset “{name}”.',
  'toast.randomApplied': 'Generated a new random theme.',
  'toast.smartApplied': 'Built a full theme from your colour(s).',
  'toast.paletteApplied': 'Applied a {count}-colour palette.',
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
