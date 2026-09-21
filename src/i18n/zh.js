/**
 * 简体中文字典。
 *
 * 键集合必须与 `en.js` 完全一致 —— `verify.mjs` 会断言两者键集相同，
 * 缺翻译会直接让自检失败，而不是运行时静默回退成英文。
 */

export default {
  // ------------------------------------------------------------------ app-wide
  'app.name': 'ThemeBake',
  'app.skipToEditor': 'ThemeBake — 返回编辑器',
  'app.primaryNav': '主导航',
  'app.close': '关闭',

  // -------------------------------------------------------------------- header
  'header.undo': '撤销',
  'header.undoTitle': '撤销上一步修改（Ctrl+Z）',
  'header.reset': '重置',
  'header.github': 'GitHub',
  'header.githubTitle': 'ThemeBake 的 GitHub 仓库',
  'header.githubAria': 'GitHub 上的 ThemeBake 仓库',
  'header.about': '关于',
  'header.storageUnavailable': '当前浏览器无法使用本地存储 —— 刷新后这次的修改不会保留。',
  'header.storageWriteFailed': '草稿没能存进本地存储。你的修改依然有效，但刷新后会丢失。',

  // --------------------------------------------------------------------- about
  'about.title': '关于 ThemeBake',
  'about.description': '直接在浏览器里制作 Chrome 主题。',
  'about.intro':
    'ThemeBake 是一个无需登录的 Chrome 主题生成器。选好颜色、看实时预览，几秒内就能下载一个可直接加载的主题 ZIP。',
  'about.whatYouGet': '你会得到什么',
  'about.bullet1a': '一个主题文件夹，内含 ',
  'about.bullet1b': '，放在一个以主题名命名的文件夹里，可以直接「加载已解压的扩展程序」——除此之外不会生成任何文件。',
  'about.bullet2': '兼容 Manifest V3，每种颜色都写进 Chrome 真正使用的主题键。',
  'about.bullet3a': '通过 ',
  'about.bullet3b': ' → 打开开发者模式 → 加载已解压的扩展程序即可使用，也可以上传到 Chrome 应用商店。',
  'about.privacy': '隐私',
  'about.privacyBody':
    'ThemeBake 全部在你的浏览器本地处理。不需要账号，主题配置和图片都不会上传到任何服务器。草稿只保存在本浏览器的本地存储里。唯一的例外是「AI 命名」：只有你主动点击时，才会把这套配色的颜色值发给你自己配置的服务商，用的是你自己的 Key。',
  'about.scope': '能力范围',
  'about.scopeBody':
    '当前版本只生成纯色主题，不写背景图片（theme.images）。所有文字配色都会跑一遍内置的对比度检查，导出的文件也因此更小。',

  // -------------------------------------------------------------------- footer
  'footer.privacy':
    'ThemeBake 的所有处理都在你的浏览器里完成。不需要账号，你的主题配置也不会被上传到任何服务器；唯一的例外是你主动点击「AI 命名」时，只有颜色值会发给你自己配置的服务商。',

  // -------------------------------------------------------- language switcher
  'lang.switcherAria': '界面语言',
  'lang.en': 'EN',
  'lang.zh': '中文',

  // ------------------------------------------------------------------- scheme
  // 浅色 / 深色这两个词本身。与 `vscode.type.*` 分开：智能配色与预览开关说的是
  // 「配色方案」，不是主题声明的 type。
  'scheme.light': '浅色',
  'scheme.dark': '深色',

  // ---------------------------------------------------------------------- hero
  'hero.title': '创建你自己的 Chrome 主题。',
  'hero.subtitle': '挑选颜色、实时预览，几秒内生成一个可直接使用的 Chrome 主题。',
  'hero.vscode.title': '创建你自己的 VS Code 主题。',
  'hero.vscode.subtitle':
    '只调 14 个基准色，工作台与语法高亮实时更新，几秒内导出一个可直接安装的扩展包。',

  // ---------------------------------------------------------------- settings
  'mode.chrome': 'Chrome 主题',
  'mode.vscode': 'VS Code 主题',
  'mode.aria': '选择工作台',
  'settings.title': '主题设置',
  'settings.subtitle': '下面每种颜色都对应一个 Chrome 真实使用的主题键名 —— 点「预览 manifest」即可查看。',
  'settings.name.label': '主题名称',
  'settings.name.placeholder': '我的主题',
  'settings.name.hint':
    '会写进 manifest.json 的 name，也就是 Chrome 里显示的主题名，按你输入的原样保留。下面的文件夹名是独立的一项。',
  'settings.folder.label': '文件夹名',
  'settings.folder.placeholder': 'blush-matcha-theme',
  'settings.folder.hint':
    '下载下来的文件夹名与 ZIP 文件名。填什么就是什么，只去掉文件系统不接受的字符。留空则用主题名派生。',
  'settings.description.label': '摘要',
  'settings.description.placeholder': '一个安静的玫瑰色主题，适合长时间阅读。',
  'settings.description.hint':
    '可选，最多 {max} 个字符。它会写进 manifest.json 的 description —— 上传商店后就是「软件包中的摘要」，显示在详情页和搜索结果的标题下方。本地加载主题时 Chrome 不会显示它。',
  'settings.clear': '清空',
  'settings.clearTitle': '一键清空主题名称、文件夹名和摘要',
  'settings.autoClear': '新主题自动清空',
  'settings.autoClearTitle': '应用新主题（选预设、随机、智能配色、导入）时自动清空这三个输入框',
  'settings.group.browserChrome': '浏览器外观',
  'settings.group.addressBar': '地址栏',
  'settings.group.bookmarks': '书签栏',
  'settings.group.newTabPage': '新标签页',
  'settings.logo.label': '新标签页 Logo',

  // ------------------------------------------------------------------ vscode
  'vscode.title': 'VS Code 主题设置',
  'vscode.subtitle':
    '只调 14 个基准色，其余 90+ 个工作台键与语法高亮配色自动派生 —— 预览即时更新，导出即可安装。',
  'vscode.type.label': '主题类型',
  'vscode.type.dark': '深色',
  'vscode.type.light': '浅色',
  'vscode.type.hc': '高对比',
  'vscode.type.hint':
    '深色 / 浅色由主配色的明暗自动判断，当前是{scheme}，theme JSON 的 type 也随之写入。点另一张卡片会把主配色换算成那个方案（另一套不受影响）；高对比是渲染模式，仍需手动选。',
  'vscode.pair.label': '同时生成相反的色调',
  'vscode.pair.hint': '由当前配色推导出{other}方案，一个扩展包里同时包含两套主题；预览上方可随时切换。',
  'vscode.pair.hcUnsupported': '高对比没有对应的浅色/深色方案，无法成对生成。',
  'vscode.importManifestUnsupported': 'VS Code 工作台不支持导入 Chrome 主题 —— 请用调色板导入。',
  'vscode.group.editor': '编辑器',
  'vscode.group.shell': '外壳',
  'vscode.group.controls': '控件',
  'vscode.group.semantic': '语义色',
  // 每条说明都直接列出它真正控制的 VS Code 键名 ——「这里到底能调什么颜色」正是这个面板要回答的问题。
  'vscode.field.editorBg': '编辑器背景',
  'vscode.field.editorBg.hint':
    '编辑区底色，同时是活动标签页与终端的背景（editor.background、tab.activeBackground、terminal.background）。',
  'vscode.field.editorFg': '编辑器文字',
  'vscode.field.editorFg.hint':
    '默认代码文字，也是全局前景色：侧边栏、面板、状态栏的文字都用它（editor.foreground、foreground、sideBar.foreground）。',
  'vscode.field.accent': '强调色',
  'vscode.field.accent.hint':
    '光标、焦点边框、链接与徽标（editorCursor.foreground、focusBorder、textLink.foreground、badge.background）。',
  'vscode.field.selectionBg': '选中背景',
  'vscode.field.selectionBg.hint':
    '选中文本、列表选中项与自动补全高亮（editor.selectionBackground、list.activeSelectionBackground、editorSuggestWidget.selectedBackground）。',
  'vscode.field.lineHighlightBg': '当前行高亮',
  'vscode.field.lineHighlightBg.hint': '光标所在行的底色（editor.lineHighlightBackground）。',
  'vscode.field.mutedFg': '弱化文字',
  'vscode.field.mutedFg.hint':
    '行号、说明文字、非活动标签与输入框占位文字（editorLineNumber.foreground、descriptionForeground、tab.inactiveForeground）。',
  'vscode.field.activityBg': '活动栏背景',
  'vscode.field.activityBg.hint':
    '最左侧图标栏的底色（activityBar.background）；图标本身跟随编辑器文字色。',
  'vscode.field.sidebarBg': '侧边栏背景',
  'vscode.field.sidebarBg.hint':
    '资源管理器侧边栏（sideBar.background）。面板、状态栏和弹窗默认跟着它 —— 想分开就在下面的「单独控制」里指定。',
  'vscode.field.titleBg': '标题栏 / 非活动标签',
  'vscode.field.titleBg.hint':
    '标题栏与未选中的标签页（titleBar.activeBackground、tab.inactiveBackground、editorGroupHeader.tabsBackground）。',
  'vscode.field.border': '边框',
  'vscode.field.border.hint':
    '侧边栏、面板、输入框与标签的分隔线，以及滚动条滑块（sideBar.border、panel.border、input.border、tab.border、scrollbarSlider.background）。',
  'vscode.field.buttonBg': '按钮背景',
  'vscode.field.buttonBg.hint':
    '主按钮、活动栏徽标与调试状态下的状态栏（button.background、activityBarBadge.background、statusBar.debuggingBackground）。',
  'vscode.field.buttonFg': '按钮文字',
  'vscode.field.buttonFg.hint': '上面这些按钮与徽标上的文字（button.foreground、activityBarBadge.foreground）。',
  'vscode.field.errorFg': '错误色',
  'vscode.field.errorFg.hint':
    '错误波浪线与错误提示，以及 git 的删除标记（editorError.foreground、errorForeground、gitDecoration.deletedResourceForeground）。',
  'vscode.field.warningFg': '警告色',
  'vscode.field.warningFg.hint':
    '警告波浪线，并参与字符串、数字等语法色的推导（editorWarning.foreground、terminal.ansiYellow）。',

  // ------------------------------------------------------- 单独控制
  'vscode.override.section': '单独控制',
  'vscode.override.sectionHint':
    '下面这些区域默认跟随上面的基准色。它们在 VS Code 里本来是各自独立的颜色（浅色侧边栏配深色状态栏是很常见的搭配），需要时在这里单独指定，预览和导出都会同步。',
  'vscode.override.otherPairNote':
    '单独控制是绝对颜色，只属于你刚才编辑的那套（{scheme}）配色。切回那套配色就能修改。',
  'vscode.override.enable': '单独设置',
  'vscode.override.inherits': '跟随{source}',
  'vscode.override.panelBg': '面板背景',
  'vscode.override.panelBg.hint': '问题 / 输出 / 终端那条面板（panel.background）。默认跟随侧边栏背景。',
  'vscode.override.statusBarBg': '状态栏背景',
  'vscode.override.statusBarBg.hint':
    '最底部那条状态栏（statusBar.background、statusBar.noFolderBackground）。默认跟随侧边栏背景。',
  'vscode.override.inactiveTabBg': '非活动标签页背景',
  'vscode.override.inactiveTabBg.hint':
    '未选中的标签与标签栏底色（tab.inactiveBackground、editorGroupHeader.tabsBackground）。默认跟随标题栏。',
  'vscode.override.widgetBg': '弹窗与提示背景',
  'vscode.override.widgetBg.hint':
    '命令面板、自动补全、悬浮提示、通知、输入框与下拉（quickInput.background、editorSuggestWidget.background、editorHoverWidget.background、notifications.background、input.background、dropdown.background）。默认跟随侧边栏背景。',
  'vscode.override.lineNumberFg': '行号颜色',
  'vscode.override.lineNumberFg.hint': '编辑器行号（editorLineNumber.foreground）。默认跟随弱化文字。',
  'vscode.override.indentGuideFg': '缩进参考线',
  'vscode.override.indentGuideFg.hint':
    '缩进参考线与空白字符标记（editorIndentGuide.background1、editorWhitespace.foreground）。默认跟随边框，带透明度。',
  'vscode.preview.title': 'VS Code 预览',
  'vscode.preview.subtitle': '按当前配色实时渲染工作台与语法高亮。',
  'vscode.preview.aria': 'VS Code 界面预览',
  'vscode.preview.derived': '派生 {colors} 个工作台颜色键 + {tokens} 条语法高亮规则。',
  'vscode.preview.variantLegend': '正在编辑的配色',
  'vscode.preview.pairNote':
    '正在编辑{shown}配色。两套互相独立、各自保存自己的颜色，可以分别调整；导出时会同时包含两套。',
  'vscode.export.title': '导出 VS Code 主题',
  'vscode.export.subtitle': '生成可安装的扩展包 {filename}（package.json + themes/ 主题 JSON + README）。',
  'vscode.export.subtitleFolder': '直接写一个扩展包文件夹 {folder}/，无需解压即可安装。',
  'vscode.export.subtitlePair':
    '生成一个可安装的扩展包 {filename}，内含 {count} 套主题（package.json + 每套方案各一个 JSON + README）。',
  'vscode.export.subtitlePairFolder': '直接写出含 {count} 套主题的扩展包文件夹 {folder}/，安装一次，之后随时切换。',
  'vscode.export.note': 'ZIP 里只有一个文件夹 {folder}/，内含 package.json 与 themes/ 下的主题 JSON。',
  'vscode.export.noteFolder': '会在你选的位置创建文件夹 {folder}/，内含 package.json 与 themes/ 下的主题 JSON。',
  'vscode.export.notePair': 'ZIP 里只有一个文件夹 {folder}/，themes/ 下同时包含浅色与深色两套主题 JSON。',
  'vscode.export.notePairFolder': '会在你选的位置创建文件夹 {folder}/，themes/ 下同时包含浅色与深色两套主题。',
  'vscode.export.outputHint':
    '「VSIX」是 VS Code 直接安装的扩展包：不用解压，装完就出现在扩展列表里。「ZIP」下载压缩包，任何系统都能解压到任意文件夹。「文件夹」直接把扩展写进你选的目录，边改主题边看效果最省事。',
  'vscode.export.outputHintNoFolder':
    '「VSIX」是 VS Code 直接安装的扩展包：不用解压，装完就出现在扩展列表里。「ZIP」下载压缩包，任何系统都能解压到任意文件夹。当前浏览器不支持直接写文件夹（需要桌面版 Chrome 或 Edge）。',
  'vscode.export.noteVsix': '下载 {filename} —— VS Code 的标准扩展安装包，装完出现在扩展列表里，无需解压。',
  'vscode.export.notePairVsix': '{filename} 内含浅色与深色两套主题，安装一次就能在主题选择器里切换。',
  'vscode.export.howtoSummary': '安装方法',
  'vscode.export.howto1': '把导出的文件夹复制到 %USERPROFILE%\\.vscode\\extensions\\。',
  'vscode.export.howto2': '重启 VS Code（或对文件夹「以文件夹方式安装」调试）。',
  'vscode.export.howto3': 'Ctrl+K Ctrl+T 打开颜色主题选择器，选择「{name}」。',
  'vscode.export.howtoVsix1': '在 VS Code 里打开扩展面板，点右上角「⋯」→「从 VSIX 安装…」，选中下载的 .vsix 文件。',
  'vscode.export.howtoVsix2': '或者用命令行：code --install-extension {filename}',
  'settings.logo.adaptive': '自适应',
  'settings.logo.classic': '原始彩色',
  'settings.logo.hint':
    '自适应（默认）：logo 跟随新标签页的背景色 —— 深色背景用白色 logo，浅色背景用标准深色 logo。原始彩色：使用 Google 原本的彩色 logo。',

  // ------------------------------------------------------- theme field labels
  'field.frame.label': '窗口框架',
  'field.frame.hint': '窗口边框与标签栏。Chrome 也会用这个颜色推导活动标签的背景。',
  'field.frameInactive.label': '窗口框架（非活动窗口）',
  'field.frameInactive.hint': '浏览器窗口不在最前面时使用。',
  'field.toolbar.label': '工具栏',
  'field.toolbar.hint': '包含地址栏、扩展图标与头像的那一条。',
  'field.backgroundTab.label': '标签背景',
  'field.backgroundTab.hint': '未选中的（后台）标签页背景色。',
  'field.tabText.label': '活动标签文字',
  'field.tabText.hint': '当前选中的那个标签的文字颜色。',
  'field.tabBackgroundText.label': '非活动标签文字',
  'field.tabBackgroundText.hint': '未选中标签的文字颜色。',
  'field.toolbarButtonIcon.label': '工具栏图标颜色',
  'field.toolbarButtonIcon.hint': '前进、后退、刷新以及扩展图标。',
  'field.buttonBackground.label': '窗口按钮背景',
  'field.buttonBackground.hint': '最小化 / 最大化 / 关闭按钮的背景。',
  'field.omniboxBackground.label': '地址栏背景',
  'field.omniboxBackground.hint': '圆角的搜索 / 网址输入框。',
  'field.omniboxText.label': '地址栏文字',
  'field.omniboxText.hint': '在地址栏里输入的文字颜色。',
  'field.bookmarkText.label': '书签文字',
  'field.bookmarkText.hint': '书签栏里的文字与图标颜色。',
  'field.ntpBackground.label': '新标签页背景',
  'field.ntpBackground.hint': '新建标签页的整页背景色。',
  'field.ntpText.label': '新标签页文字',
  'field.ntpText.hint': '新标签页上的标题与正文颜色。',
  'field.ntpLink.label': '新标签页链接',
  'field.ntpLink.hint': '新标签页上的链接与快捷方式标签颜色。',

  // --------------------------------------------------------------- colour field
  'colorField.pickerAria': '{label} 取色器',
  'colorField.hexAria': '{label} 十六进制值',
  'colorField.invalid': '请输入类似 #B1B2FF 的十六进制颜色值，已保留上一个有效值。',
  'colorField.invalidToast': '颜色值无效。{label} 已保留上一个有效颜色。',

  // ------------------------------------------------------------- smart palette
  'studio.title': '智能配色',
  'studio.subtitle': '选一个颜色，ThemeBake 帮你推导出一整套经过对比度校验的主题。',
  'studio.seedLabel': '主色',
  'studio.seedHint': '它会成为窗口框架色，其余颜色都由它推导出来。',
  // VS Code 工作台解出的还是同一套配色，但落到不同的角色上，所以这里说的是它
  // 自己的落点，不再提「窗口框架」。
  'studio.vscodeSeedHint': '它会成为整套配色的基准 —— 由它解出的框架色会落到编辑器背景，其余工作台配色随之推导。',
  'studio.randomSeed': '随机主色',
  'studio.resolvedScheme': '推导为{scheme}',
  'studio.modeLegend': '明暗',
  'studio.mode.auto': '自动',
  'studio.mode.light': '浅色',
  'studio.mode.dark': '深色',
  'studio.intensityLegend': '风格强度',
  'studio.intensity.soft': '柔和',
  'studio.intensity.balanced': '标准',
  'studio.intensity.bold': '鲜明',
  'studio.accentLegend': '配色方式',
  'studio.accent.harmony': '同色系',
  'studio.accent.clash': '撞色',
  'studio.accent.triad': '三色',
  'studio.accentHint.harmony': '所有表面色与强调色都留在主色的色相里 —— 一套安静的同色阶。',
  'studio.accentHint.clash':
    '表面色留在主色的色相，强调色落到色轮的对侧；表面色会自动收敛，让强调色成为主角。',
  'studio.accentHint.triad': '三个相关色相：主色做表面、第二个色相做强调色、第三个色相给窗口按钮。',
  'studio.generate': '生成主题',
  'studio.resultLegend': '推导结果',
  'studio.noteNeutral': '检测到中性色 —— 会生成灰阶主题，不会硬套一个色相。',
  'studio.noteFrameAdjusted': '已把「{hex}」调成适合做窗口框架的明度，它的色相仍然主导整套配色。',
  'studio.noteSeedsUsed': '色卡里的 {total} 个颜色中，有 {used} 个被直接采用。',
  'studio.noteClash': '强调色取的是主色的对角色相（{hex}），表面色仍沿用主色自己的色相。',
  'studio.noteTriad': '三色搭配：强调色 {hex}，窗口按钮用第三个色相 {third}。',

  // ----------------------------------------------------------------- ai naming
  'ai.title': 'AI 生成',
  'ai.subtitle': '根据配色一键生成主题名、文件夹名和商店摘要。',
  'ai.generate': '一键生成',
  'ai.generating': '正在生成…',
  'ai.generateDesc': '智能生成摘要',
  'ai.generatingDesc': '正在写摘要…',
  'ai.descGenerated': '摘要已更新。',
  'ai.pickOne': '挑一个 —— 主题名和文件夹名会一起填好。',
  'ai.settingsSummary': 'AI 设置',
  'ai.statusReady': '已配置',
  'ai.statusNoKey': '未填密钥',
  'ai.provider': '服务商',
  'ai.baseURL': '接口地址',
  'ai.baseURLHint':
    '任何兼容 OpenAI 的地址都可以 —— 硅基流动、DeepSeek、Gemini、OpenRouter 都开箱即用。末尾的 /chat/completions 会自动补上。',
  'ai.corsWarning':
    'OpenAI 官方域名不允许网页直连，这个预设只有走你自己的代理才可用。请把上面的地址换成你的代理地址。',
  'ai.model': '模型',
  'ai.modelHint': '填服务商要求的完整模型名。',
  'ai.apiKey': 'API Key',
  'ai.apiKeyHint': '由浏览器直接发给服务商，只存在本机，不会传到别处，也不会写进主题文件。',
  'ai.rememberKey': '记住这个 Key',
  'ai.temperature': '创意度',
  'ai.temperatureHint': '越高，名字越出人意料。',
  'ai.candidates': '候选数量',
  'ai.candidatesOption': '{count} 个',
  'ai.style': '风格',
  'ai.style.auto': '自动',
  'ai.style.elegant': '优雅',
  'ai.style.minimal': '极简',
  'ai.style.cute': '可爱',
  'ai.style.tech': '科技',
  'ai.style.nature': '自然',
  'ai.style.retro': '复古',
  'ai.style.dreamy': '梦幻',
  'ai.language': '生成语言',
  'ai.lang.en': '英文',
  'ai.lang.zh': '中文',
  'ai.privacyNote': 'Key 只留在本机浏览器里；每次请求除了这几个颜色，不会把你的主题内容发出去。',
  'ai.generated': '已生成 {count} 个名字。',
  'ai.errorNoKey': '请先在 AI 设置里填入 API Key。',
  'ai.errorNoBase': '请先在 AI 设置里填写接口地址。',
  'ai.errorNoModel': '请先在 AI 设置里填写模型名。',
  'ai.errorUnauthorized': '服务商拒绝了这把 Key（401），请检查 Key 和服务商是否对应。',
  'ai.errorForbidden': '服务商拒绝了这次请求（403），可能是这把 Key 没有该模型的权限。',
  'ai.errorNotFound': '没找到接口或模型（404），请检查地址和模型名。',
  'ai.errorRateLimited': '请求太频繁了（429），稍等一下再试。',
  'ai.errorServer': '服务商内部出错了（5xx），过一会儿再试。',
  'ai.errorNetwork': '连不上服务商。可能是网络问题，也可能这个地址不允许网页直连（CORS）。',
  'ai.errorTimeout': '请求超时了，再试一次，或换一个更快的模型。',
  'ai.errorParse': '模型的回复读不出名字，再试一次，或把创意度调低些。',
  'ai.errorUnknown': 'AI 命名失败了，已保留本地生成的名字。',

  // -------------------------------------------------------------------- import
  'import.title': '导入',
  'import.subtitle': '粘贴颜色、色卡链接、manifest，或拖入图片 —— ThemeBake 会把它们对应到 Chrome 各处的界面配色。',
  'import.placeholder':
    '粘贴十六进制色值、rgb() 列表、Coolors / Adobe Color 链接、manifest.json，或本工具导出的主题 JSON…',
  'import.pickImage': '选择图片',
  'import.imageHint': '或按 {shortcut} 直接粘贴截图',
  'import.shortcut': 'Ctrl+V',
  'import.dropHint': '把图片拖到这里，或点击选择文件',
  'import.example': '试试示例色卡',
  'import.removeSwatch': '移除 {hex}',
  'import.detected': '识别到 {count} 个颜色',
  'import.sourceBands': '检测到扁平色卡 —— 已按原顺序还原出准确颜色。',
  'import.sourceClusters': '检测到照片 —— 已提取出画面中出现最多的几种颜色。',
  'import.sourceUrl': '已从链接里读出配色，全程没有发起任何网络请求 —— 链接只是当作普通文本解析。',
  'import.apply': '应用到主题',
  'import.clear': '清空',
  'import.analyzing': '分析中…',
  'import.foundManifest': '识别到 Chrome 主题 manifest（名称：「{name}」）。',
  'import.foundTheme': '识别到一份主题定义 —— 已把 {count} 个颜色对应到 Chrome 的界面配色上。',
  'import.errorEmpty': '没有可导入的内容 —— 请先粘贴颜色或选择图片。',
  'import.errorNoColors': '没有从输入里识别出任何颜色。',
  'import.errorBadFile': '不支持这种文件类型。请使用图片、.json 或 .txt 文件。',
  'import.errorTooBig': '图片太大了，请换一张 10 MB 以内的。',
  'import.errorBadImage': '这张图片无法读取。',
  'import.errorBadJson': '看起来是 JSON，但不是 Chrome 主题 manifest。',
  'import.errorNoThemeColors': '该 manifest 里没有 theme.colors。',
  'import.deadKeys':
    '已忽略 {count} 个 Chrome 不支持的键名：{keys}。manifest 解析器会接受它们，但 Chrome 渲染时完全不会用到。',

  // ------------------------------------------------------------------ presets
  'presets.title': '预设',
  'presets.subtitle': '从一套调好的配色开始，之后仍可继续编辑。',
  'presets.randomize': '随机生成',
  'presets.randomizeAria': '生成一套协调的随机主题',
  // Preset NAMES stay in English on purpose: they are brand-ish identifiers, and
  // a literal translation reads oddly in a colour picker ("落瓣" for "Dusty
  // Petal"). The one-line descriptions are localised, which is where the meaning
  // actually matters.
  'preset.soft-sky.name': 'Soft Sky',
  'preset.soft-sky.description': '通透的日间蓝，工具栏干净利落。',
  'preset.cozy-vintage.name': 'Cozy Vintage',
  'preset.cozy-vintage.description': '羊皮纸暖底，陶土色点缀，墨色文字柔和。',
  'preset.dusty-petal.name': 'Dusty Petal',
  'preset.dusty-petal.description': '低饱和玫瑰配暖灰底，安静、有杂志感。',
  'preset.periwinkle-dream.name': 'Periwinkle Dream',
  'preset.periwinkle-dream.description': '冷调薰衣草，留白充足。',
  'preset.berry-dusk.name': 'Berry Dusk',
  'preset.berry-dusk.description': '深紫梅子色，适合深夜使用，眼睛更舒服。',
  'preset.pink-souffle.name': 'Pink Soufflé',
  'preset.pink-souffle.description': '淡草莓奶油配玫瑰强调色，轻盈友好。',

  // ------------------------------------------------------------------ preview
  'preview.title': '实时预览',
  'preview.subtitle': '随编辑即时更新。实际应用时 Chrome 可能微调对比度。',
  'preview.showKeys': '显示键名',
  'preview.mockupAria': '你正在制作的 Chrome 主题的实时预览',
  'preview.omnibox': '搜索或输入网址',
  'preview.ntpSearch': '搜索或输入网址',
  'preview.ntpTitle': '搜索网页',
  'preview.ntpSubtitle': '你的自定义主题已应用。',

  // ------------------------------------------------------------------- export
  'export.title': '生成',
  'export.subtitle': '写入全部 {keys} 个 Chrome 颜色键与 {tints} 项 tints，下载为 {filename}。',
  'export.subtitleFolder': '写入全部 {keys} 个 Chrome 颜色键与 {tints} 项 tints，输出到 {folder}/。',
  'export.formatLegend': 'manifest 颜色格式',
  'export.formatHint': 'Chrome 只认 RGB 数组，HEX 字符串只适用于 Firefox。',
  'export.format.rgb': 'RGB 数组',
  'export.format.hex': 'HEX 字符串',
  'export.formatHexWarn':
    '只要有任意一个颜色值是字符串，Chrome 就会拒绝整个 manifest，主题装不上。想在 Chrome 里使用，请换成 RGB 数组。',
  'export.outputLegend': '输出方式',
  'export.output.zip': 'ZIP',
  'export.output.folder': '文件夹',
  'export.output.vsix': 'VSIX',
  'export.outputHint':
    '「文件夹」把主题直接写进你选的一个目录，不用解压就能「加载已解压的扩展程序」；「ZIP」则下载一个压缩包。',
  'export.folderUnsupported': '当前浏览器不支持直接写文件夹（需要桌面版 Chrome 或 Edge），请用 ZIP。',
  'export.packageNote': 'ZIP 里只有一个文件夹 {folder}/，内含 manifest.json。',
  'export.packageNoteFolder': '会在你选的位置创建文件夹 {folder}/，里面只有 manifest.json。',
  'export.generate': '生成主题',
  'export.generating': '输出中…',
  'export.previewManifest': '预览 manifest',
  'export.json': '导出主题 JSON',
  'export.jsonTitle': '把当前主题存成一份 JSON 文件，可以直接贴回「导入」面板 —— 备份或分享用。',
  'export.howtoSummary': '生成的主题怎么安装？',
  'export.howto1a': '解压 ',
  'export.howto1b': '，会得到一个文件夹 ',
  'export.howto1c': '。',
  'export.howto1Folder': '打开你刚才选的目录 —— {folder}/ 已经在那里了，不用解压。',
  'export.howto2': '打开 chrome://extensions 并开启「开发者模式」。',
  'export.howto3':
    '点击「加载已解压的扩展程序」，直接选中那个文件夹本身 —— 要选的是装着 manifest.json 的文件夹，不是 ZIP 文件，也不是它的上一层目录。',
  'export.howto4': '如果想发布，把文件夹重新打包成 ZIP，上传到 Chrome 应用商店开发者后台即可。',
  'export.howto5':
    '新标签页还是白底？「自定义 Chrome」里的背景设置会盖过主题。打开新标签页 → 右下角「自定义 Chrome」→ 背景 → 恢复默认即可；另外，重新安装主题也会重新应用主题的背景色。',

  // ------------------------------------------------------------------ manifest
  'manifest.title': 'manifest.json',
  'manifest.description': '这就是 ThemeBake 会写进主题 ZIP 的内容，一字不差。',
  'manifest.validJson': '合法 JSON',
  'manifest.invalidJson': 'JSON 非法',
  'manifest.parseFailed': '生成的 manifest 无法解析：{error}',
  'manifest.summary': '{count} 个主题键 · {filename}',
  'manifest.copy': '复制 JSON',
  'manifest.copied': '已复制',
  'manifest.download': '下载 JSON',
  'manifest.codeAria': '生成的 manifest JSON',
  'manifest.copiedToast': 'manifest JSON 已复制到剪贴板。',
  'manifest.copyFailed': '复制失败，请手动选中 JSON 复制。',

  // ------------------------------------------------------------------- confirm
  'confirm.reset.title': '要重置这个主题吗？',
  'confirm.reset.description': '当前的颜色和主题名称会被替换成 ThemeBake 的默认主题。',
  'confirm.reset.body': '只影响当前主题，不会上传任何内容，也不会改动 ThemeBake 之外的任何东西。',
  'confirm.reset.confirm': '确认重置',
  'confirm.cancel': '取消',

  // -------------------------------------------------------------------- modal
  'modal.close': '关闭对话框',

  // -------------------------------------------------------------------- toast
  'toast.region': '通知',
  'toast.themeGenerated': '主题生成成功。',
  'toast.themeReset': '主题已重置。',
  'toast.fieldsCleared': '已清空名称、文件夹名和摘要。',
  'toast.vscodeGenerated': 'VS Code 主题扩展包已生成。',
  'toast.vscodeGeneratedPair': '含浅色与深色两套主题的 VS Code 扩展包已生成。',
  'toast.vscodeVsixGenerated': 'VS Code 扩展安装包（.vsix）已生成。',
  'toast.vscodeVsixGeneratedPair': '含浅色与深色两套主题的 .vsix 已生成。',
  'toast.vscodeSchemeSwitched': '已按{scheme}方案重新解算整套配色。',
  'toast.vscodeFieldsCleared': '已清空名称和文件夹名。',
  'toast.undone': '已撤销上一步修改。',
  'toast.presetApplied': '已应用预设「{name}」。',
  'toast.randomApplied': '已生成一套新的随机主题。',
  'toast.smartApplied': '已根据你的颜色生成一整套主题。',
  'toast.paletteApplied': '已应用 {count} 个颜色的色卡。',
  'toast.imageExtracted': '已从图片中提取 {count} 个颜色。',
  'toast.zipFailed': 'ZIP 生成失败：{error}',
  'toast.folderFailed': '写入文件夹失败：{error}',
  'toast.folderWritten': '已把 {folder}/ 写入 {root}。',
  'toast.noValidColors': '没有可用颜色，无法生成主题。',
  'toast.dismiss': '关闭通知：{message}',

  // ------------------------------------------------------------------ validate
  'validate.nameRequired': '请填写主题名称。',
  'validate.nameTooLong': '主题名称不能超过 45 个字符。',
  'validate.invalidColors': '以下颜色不是合法的十六进制值：{fields}。',
  'validate.noColors': '至少需要一个有效的颜色。',
  'validate.descriptionTooLong': '摘要最多 {max} 个字符。',

  // ------------------------------------------------------------------ warnings
  // 由 manifest.js 在不得不丢弃字段时发出。正常使用下不会触发（编辑器无法产出非法值），
  // 这里保留只为兜底，同时保持可本地化。
  'warn.droppedInvalid': '已丢弃「{field}」（{chromeKey}）：「{value}」不是合法的十六进制颜色。',
  'warn.skippedKey': '已跳过未知的 Chrome 主题键名「{chromeKey}」（字段「{field}」）。',
  'warn.hexNotChromeLoadable':
    'HEX 字符串格式：颜色值是字符串时 Chrome 会拒绝整个 manifest，装不上。要在 Chrome 里使用请换成 RGB 数组。',

  // -------------------------------------------------------------------- audit
  'audit.title': '对比度检查',
  'audit.ok': '所有文字配色的对比度都合格。',
  'audit.issues': '有 {count} 处对比度需要留意：',
  'audit.autoFix': '一键修复对比度',
  'audit.fixed': '已调整 {count} 个颜色，让文字更易读。',
  'audit.fixFailed': '对比度无法自动改善。',
  'audit.pair': '{fg} 在 {bg} 上：{ratio}:1（建议 {min}:1）。',

  // --------------------------------------------------------------------- crash
  'crash.title': '出了点问题',
  'crash.text':
    'ThemeBake 遇到了意外错误。你保存的草稿还在这个浏览器里，刷新通常就能恢复。如果反复出现，可以清空本地数据。',
  'crash.reload': '刷新',
  'crash.clear': '清空本地数据并刷新',
}
