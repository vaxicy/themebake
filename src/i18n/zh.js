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

  // ---------------------------------------------------------------------- hero
  'hero.title': '创建你自己的 Chrome 主题。',
  'hero.subtitle': '挑选颜色、实时预览，几秒内生成一个可直接使用的 Chrome 主题。',

  // ---------------------------------------------------------------- settings
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
  'settings.group.browserChrome': '浏览器外观',
  'settings.group.addressBar': '地址栏',
  'settings.group.bookmarks': '书签栏',
  'settings.group.newTabPage': '新标签页',
  'settings.logo.label': '新标签页 Logo',
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
  'studio.modeLegend': '明暗',
  'studio.mode.auto': '自动',
  'studio.mode.light': '浅色',
  'studio.mode.dark': '深色',
  'studio.intensityLegend': '风格强度',
  'studio.intensity.soft': '柔和',
  'studio.intensity.balanced': '标准',
  'studio.intensity.bold': '鲜明',
  'studio.generate': '生成主题',
  'studio.resultLegend': '推导结果',
  'studio.noteNeutral': '检测到中性色 —— 会生成灰阶主题，不会硬套一个色相。',
  'studio.noteFrameAdjusted': '已把「{hex}」调成适合做窗口框架的明度，它的色相仍然主导整套配色。',
  'studio.noteSeedsUsed': '色卡里的 {total} 个颜色中，有 {used} 个被直接采用。',

  // ----------------------------------------------------------------- ai naming
  'ai.title': 'AI 命名',
  'ai.subtitle': '让模型根据你的配色，起一个主题名和对应的文件夹名。',
  'ai.generate': '智能生成名称',
  'ai.generating': '正在生成…',
  'ai.pickOne': '挑一个 —— 主题名和文件夹名会一起填好。',
  'ai.settingsSummary': 'AI 设置',
  'ai.statusReady': '已配置',
  'ai.statusNoKey': '未填密钥',
  'ai.provider': '服务商',
  'ai.baseURL': '接口地址',
  'ai.baseURLHint': '任何兼容 OpenAI 的地址都可以。OpenAI 官方域名不允许网页直连，需要填你自己的代理地址。',
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
  'ai.language': '名称语言',
  'ai.lang.auto': '跟随界面',
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
  'export.outputHint':
    '「文件夹」把主题直接写进你选的一个目录，不用解压就能「加载已解压的扩展程序」；「ZIP」则下载一个压缩包。',
  'export.folderUnsupported': '当前浏览器不支持直接写文件夹（需要桌面版 Chrome 或 Edge），请用 ZIP。',
  'export.packageNote': 'ZIP 里只有一个文件夹 {folder}/，内含 manifest.json。',
  'export.packageNoteFolder': '会在你选的位置创建文件夹 {folder}/，里面只有 manifest.json。',
  'export.generate': '生成主题',
  'export.generating': '正在打包 ZIP…',
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
