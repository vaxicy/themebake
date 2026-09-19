# ThemeForge

[English](README.md) | **简体中文**

**在浏览器里做出自定义 Chrome 主题 —— 选颜色、看实时预览，下载一个 Chrome 能直接加载的文件夹。**

**[打开 ThemeForge →](https://themeforge-9g1.pages.dev)**

[![线上应用](https://img.shields.io/badge/live-themeforge--9g1.pages.dev-6C5CE7)](https://themeforge-9g1.pages.dev)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Node 18+](https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white)

![ThemeForge：左侧是颜色控件，右侧是实时 Chrome mockup 与对比度体检](docs/screenshot.png)

ThemeForge 是一个无需账号、没有后端、也不需要构建步骤的 Chrome 主题生成器。选好颜色、
在浏览器 mockup 里看实时预览，几秒内就能下载一个解压后可直接加载的主题文件夹。
所有处理都在浏览器本地完成 —— 没有数据库，也没有登录。

它也支持**从你已有的东西倒推**：给它一个颜色、一张设计师色卡、一个取色链接、一份现成的
主题 manifest，或者一张截图，它会帮你补齐其余 Chrome 主题角色 —— 界面支持 English 与简体中文。

---

## 目录

- [快速开始](#快速开始)
- [安装生成的主题](#安装生成的主题)
- [三种起手方式](#三种起手方式)
- [功能](#功能)
- [工作原理](#工作原理)
- [配色求解器](#配色求解器)
- [导入与图片取色](#导入与图片取色)
- [对比度体检](#对比度体检)
- [语言](#语言)
- [Chrome manifest 的准确性](#chrome-manifest-的准确性)
- [本地开发](#本地开发)
- [验证](#验证)
- [构建](#构建)
- [Cloudflare Pages 部署](#cloudflare-pages-部署)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [隐私](#隐私)
- [免责声明](#免责声明)
- [许可证](#许可证)

---

## 快速开始

1. 打开 **[themeforge-9g1.pages.dev](https://themeforge-9g1.pages.dev)**。
2. 给主题起个名字，然后手动调颜色 —— 或者让求解器从单个颜色、色卡、链接、图片直接生成
   （见[三种起手方式](#三种起手方式)）。
3. 看预览旁边的[对比度体检](#对比度体检)，标红的地方一键修复。
4. 选输出格式（Chrome 请用 **RGB 数组**），点 **生成**。
5. 解压下载的文件并加载 —— 步骤见下。

草稿会随输入自动保存在你自己的浏览器里，刷新不会丢。

## 安装生成的主题

ZIP 里只有**一个**文件夹（例如 `rose-morning-theme/`），文件夹里只有**一个**文件
`manifest.json`。

1. 解压下载的文件，得到一个文件夹，例如 `rose-morning-theme/`。
2. 在 Chrome 里打开 `chrome://extensions`。
3. 打开右上角的**开发者模式**。
4. 点**加载已解压的扩展程序**，选中那个文件夹本身 —— 不是 ZIP，也不是它的上级目录。
   Chrome 需要的是包含 `manifest.json` 的那个目录。

想上架的话，把文件夹重新打包成 ZIP 再上传到
[Chrome 应用商店](https://chrome.google.com/webstore/devconsole)。商店另外要求一套
`store-assets/`（截图、宣传图），这些对「本地加载」来说是多余的。

---

## ThemeForge 是什么

Chrome 主题本质上就是一个文件夹，里面有个 `manifest.json`，把若干命名颜色映射到浏览器
界面区域。手写这个文件意味着要记住 `background_tab`、`toolbar_button_icon`、`ntp_link`
这些键名 —— 还得把值的格式写对。

ThemeForge 把它变成一个点点点就行的编辑器：

- 可视化选颜色，Chrome mockup 实时跟着变。
- 看清每个颜色对应哪个 manifest 键名。
- 下载一个 ZIP，解压出来的文件夹 Chrome 不用改一个字就能加载。

ThemeForge 是**网页应用**，不是 Chrome 扩展，不会往你的浏览器里装任何东西。

---

## 三种起手方式

| 起点 | 你给它什么 | 它会做什么 |
| --- | --- | --- |
| **手动** | 14 个颜色控件 | 直接编辑，实时预览 |
| **一个颜色** | 一个 hex | 按这个颜色的色相和明度*求解*出其余 13 个角色 |
| **你已有的东西** | 色卡、取色链接、`manifest.json` 或一张图片 | 自动判别输入类型：能求解的求解到 Chrome 角色上，已经写明角色的原样套用 |

---

## 功能

| 功能 | 说明 |
| --- | --- |
| **14 个可编辑颜色** | 窗口框架、工具栏、标签背景、标签文字、地址栏、书签、新标签页等 —— Chrome 同样接受的那 10 个键由推导得出，不需要你一个个挑 |
| **实时预览** | Chrome 风格的浏览器 mockup，每次改动都会重绘 |
| **「显示键名」浮层** | 在预览的每个区域上标出它真正的 `theme.colors` 键名 |
| **取色器 + HEX 输入** | 原生取色器与文本框双向同步 |
| **智能配色台** | 选一个颜色就能推导整套主题 —— 应用前先用一条色带预览那六个「signature」角色 |
| **色卡 / 链接 / manifest 导入** | 粘贴 `#FFF5F5 #F7D6D0 #E2B4BD #4A4A4A`、一条 Coolors 链接或一份 manifest —— 输入类型自动判别 |
| **图片取色** | 拖入、选择或粘贴一张截图；扁平色卡走色带检测，照片走主色聚类 |
| **可取色块** | 每个检测到的颜色都是一个色块，应用前可以逐个划掉 —— 不用猜「哪个才是背景」 |
| **对比度体检** | 每一对文字/背景都按 WCAG 阈值检查，始终可见，可一键修复 |
| **6 套预设主题** | Soft Sky、Cozy Vintage、Dusty Petal、Periwinkle Dream、Berry Dusk、Pink Soufflé |
| **随机配色** | 生成的是*协调的*配色（类似色 + 强调色）并自动修正对比度，不是 14 个随机 RGB 值 |
| **撤销（Ctrl+Z）** | 每一步都能撤销。整段拖动取色会合并成一步，Toast 会写明撤销了什么 |
| **预览 manifest** | 下载前查看确切的 JSON，带「合法 JSON」实时校验和复制 JSON |
| **可加载的产物** | ZIP 里是一个 `<slug>-theme/` 文件夹，其中只有 `manifest.json` —— Chrome 从不显示主题的图标，所以不打包 `icon.png`（将来若需要，渲染能力仍保留在 `utils/icon.js`） |
| **永远完整** | 每次下载都会写出全部 **24** 个 Chrome 颜色键（你选的 14 个 + 派生的 10 个：隐身窗口框架、非活动/隐身标签状态、NTP 标题、工具栏文字）以及 6 个 HSL `tints`。没有开关。对纯色主题唯一有用的那个 `theme.properties` 键 —— `ntp_logo_alternate` —— 也总会写出，由新标签页 Logo 控件驱动 |
| **新标签页 Logo** | 自适应（`1`）或原始（`0`）。默认自适应：让 Chrome 依据你的 `ntp_background` 推导字标，浅色和深色主题下都能正确显示 |
| **两种颜色格式** | RGB 整数数组（Chrome 唯一能加载的格式）或给 Firefox 用的 `#RRGGBB` 字符串 —— 后者会被明确标出，因为 Chrome 会直接拒绝 |
| **English / 简体中文** | 界面完整翻译，按浏览器语言自动识别并记住 |
| **自动保存** | 草稿存在 `localStorage`，刷新后恢复 |
| **重置** | 二次确认后恢复到默认主题 |
| **响应式** | 桌面端两栏编辑器，移动端单栏、预览优先 |
| **Toast 提示** | 状态反馈全程不用 `alert()` |
| **无障碍** | 控件都有标签、聚焦环可见、有 ARIA live 区域、生成的配色经过对比度校验 |

---

## 工作原理

```
UI 控件      ──▶  field id            ──▶  Chrome manifest 键    ──┐
（如 "Frame"）     （如 "frame"）            （如 "frame"）           │
                                                                  ├──▶  manifest.json  ──▶  <slug>-theme/  ──▶  ZIP
derivedColors.js ──▶ 10 个额外键 + 6 个 tints ─────────────────────┤        (MV3 主题)        （只有
                                                                  │                          manifest.json）
palette / image ──▶ solveTheme() ──▶ field id ─────────────────────┤
manifest        ──▶ importThemeJson() ──▶ field id ────────────────┘
```

1. **选颜色。** 编辑器里的每个控件都恰好对应 `CHROME_COLOR_KEY_ALLOWLIST` 里的一项。
2. **实时预览。** mockup 读的就是 manifest 构建器读的那个 state 对象，所以所见即所写。
3. **manifest 永远完整。** Chrome 接受、但没人愿意用肉眼去挑的那 10 个键 —— 隐身窗口框架、
   非活动/隐身标签状态、NTP 标题、`toolbar_text` —— 由 `utils/derivedColors.js` 从你的配色
   *推导*得出，因此不可能和你选的颜色打架，6 个 HSL `tints` 也一并写出。这里没有复选框：
   省掉它们只会把这些状态留给 Chrome 自己的默认值，观感明显更「半成品」，却换不来任何好处。
   manifest 里还会带上唯一有意义的那个显示属性 `ntp_logo_alternate` —— 见下文。
4. **生成。** ThemeForge 校验名称/描述/颜色，组装 `manifest.json`，确认 JSON 能被解析，
   然后把它包进 ZIP 里一个单独的 `<slug>-theme/` 文件夹交给浏览器。不画图标：Chrome 在任何
   地方都不会显示主题的 `icon.png`，所以下载包里只有 Chrome 真正会读的那一个文件。

### 为什么压缩包里是一个文件夹，而不是散文件

Chrome 的**加载已解压的扩展程序**要的是一个**目录**，不是压缩包。如果主题 ZIP 把
`manifest.json` 放在自己的根目录，解压时它就会散落到用户当时所在的目录 —— 通常是「下载」，
而那个目录是不能选的。把所有东西包进一个具名文件夹，解压出来的结果就能直接选中，
这也和手工做主题的目录结构一致（`rose-morning-theme/`、`cotton-candy-dream-theme/`……）。

只写两个文件。对 21 个手工主题的审计显示，它们带的其它东西 —— `README.md`、`LICENSE`、
`.gitignore`、`scripts/*.py`、`theme.json`、商店素材和 `Cached Theme.pak` —— 对渲染毫无影响；
`Cached Theme.pak` 其实是 Chrome 首次加载后自己生成的缓存，打包它反而是错的。

---

## 配色求解器

从一个颜色生成主题，不是挑 14 个好看色阶那么简单。这 14 个 Chrome 角色并不等价 ——
有些是背景，有些是那些背景上的文字，还有些必须同时**对两种不同背景**都保持可读。

`src/utils/palette.js` 把它当成一个带约束的推导：

1. **定锚。** 你给的颜色成为窗口框架。如果它太浅或太深、放不下可读的标签文字，就把它的明度
   拉回可用区间；当某个色相根本没有亮度余量时（比如饱和的纯蓝），再把饱和度降下来当第二根
   杠杆。色相保留，面板会告诉你何时发生了这件事。
2. **派生。** 工具栏、地址栏、新标签页和文字颜色都从锚点的色相家族里派生 —— 走类似色的步子，
   绝不引入外来色相。
3. **强制。** 每一对强制配对的颜色都用正式的 WCAG 相对亮度校验。不合格的颜色会被微调
   （哪个方向真的有用就往哪边调，两个方向都试过），直到过线。

求解器是确定性的，并且用 **1485 次穷举求解**验证过 —— 整圈色相 × 浅色/深色/自动 ×
柔和/均衡/强烈，外加极端与边缘种子 —— 零对比度失败。中性色保持灰阶，而不是被硬塞一个色相。

### 当你给的是色卡而不是单个颜色

色卡带着颜色但不带角色，所以它交给同一个求解器：色卡的颜色能直接用的地方就直接用，
剩下的角色从色卡自己的色相派生。面板会报告你的颜色里有多少被原样使用
（`{used} of {total} colours from your palette were used directly`）。

而 **manifest** 不一样，它已经写明了角色 —— 所以原样套用。拿求解器跑一遍只会悄悄丢掉
作者自己的选择。

---

## 导入与图片取色

`ImportPanel` 是唯一的入口，没有会让你选错的模式开关：

| 输入 | 识别为 | 走向 |
| --- | --- | --- |
| Hex / `rgb()` 文本 | 色卡 | 求解器 |
| Coolors / Adobe Color 风格的链接 | 色卡 | 求解器 |
| Chrome `manifest.json` 或 ThemeForge 导出文件 | 主题 | 原样套用 |
| 裸色值映射（`{"frame": "#fff"}`） | 主题 | 识别出 ≥1 个键就原样套用 |
| 图片（拖放、选择文件或 `Ctrl+V`） | 色卡 | 求解器 |

图片处理会自动挑策略（`src/utils/image.js`）：

- **色带** —— 扁平色卡。先对行和列求平均，把连续、几乎相同的行/列合并，然后**按原始顺序、
  带着精确颜色**返回色带。哪条轴的色带尺寸更均匀就采用哪条轴，这正是「真色卡」和
  「照片里的偶然条带」的区别。
- **聚类** —— 照片或插画。像素先量化到桶里，再用确定性的加权 k-means（全程没有
  `Math.random`）找出主色，并丢掉像纸张白这种占了大片面积的近中性底色。

检测出的颜色会以可移除的色块出现，多出来的一块背景色一点就能排除。

---

## 对比度体检

求解器保证了配对可读，但一次刻意的手改就可能破坏它。所以体检**始终**渲染在预览旁边 ——
绿色的「全部通过」本身也是信息。

八对真实的 Chrome 配对分别按 4.5:1（正文）、3.5:1（非活动标签文字、书签）和 3:1
（图标、链接）检查。不合格项按最差在前排列，同时给出实测比值和建议比值。

**一键修复**在三条约束下修复：只移动前景色（框架、工具栏和新标签页背景承载着主题的识别度）、
颜色只移动到刚好够用、过程确定且有界。一个前景色同时面对两个背景时会被归为一组，
这样两条规则不会让它来回震荡。

---

## 语言

界面提供 **English** 与 **简体中文**。初始语言取已保存的选择；否则取 `navigator.languages`
里第一个以 `zh` 或 `en` 开头的；再否则英文。切换语言时 `<html lang>` 会一起更新。

词典在 `src/i18n/en.js` 与 `src/i18n/zh.js`，是扁平的键值表。新增一门语言 = 新增一个文件
加一条 `LANGUAGES` 条目。各语言之间的键集合、非空值、占位符一致性都由 `npm run verify`
强制，另有一处静态扫描断言组件里用到的每个 `t('...')` 键都真实存在。

---

## Chrome manifest 的准确性

映射层在 **`src/data/themeFields.js`**，是唯一的事实来源。三道防线保证产物不说谎：

1. **`CHROME_COLOR_KEY_ALLOWLIST`** —— `chrome/browser/themes/browser_theme_pack.cc` 里
   `kOverwritableColorTable` 的逐字拷贝，目前 **24 键**。manifest 构建器拒绝写出任何不在
   白名单里的键，所以一次重构不可能悄悄写出 Chrome 不认识的键。
2. **`CHROME_DEAD_COLOR_KEYS`** —— 一份显式黑名单，收集那些*看起来像真的*、在第三方主题里
   到处都是、却不在上表里的键。验证脚本会证明 ThemeForge 永不写出它们，导入器会把它们报出来
   而不是把垃圾原样带下去。
3. **出处注释** —— 文件里记录了两个权威来源：上面的键名表，以及
   `chrome/common/extensions/manifest_handlers/theme_handler.cc` 里的 `LoadColors`。

### Chrome 到底校验了什么

`LoadColors` 对 `theme.colors` 的每一项只检查三件事：值是 JSON **列表**、长度是 **3 或 4**、
前三项是**整数**。仅此而已。这些后果直接决定了好几个设计决策：

- **键名从不校验。** 未知键被静默接受 —— Chrome 既不报错也不警告。所以守门的是白名单，
  不是 Chrome。
- **字符串值会让整份 manifest 失败**，报 `kInvalidThemeColors`。所以 HEX 字符串 manifest
  不是「兼容性差一点」，而是在 Chrome 里*根本装不上*。这个选项保留给 Firefox，并在界面上
  明确标出。
- **数值范围从不检查**，所以 `[999, -40, 300]` 也能正常加载。ThemeForge 照样收敛到 0-255。
- **`theme.tints` 单独校验**：每一项必须是恰好 3 个 double 的列表，同样不校验键名。合法的 6 个键
  来自 `kTintTable` —— `buttons`、`frame`、`frame_inactive`、`frame_incognito`、
  `frame_incognito_inactive`、`background_tab`。
- **`theme.properties` 只写一个键：`ntp_logo_alternate`。** Chrome 还会读的另外两个键是真的，
  但对纯色主题够不到：`ntp_background_alignment` / `ntp_background_repeat` 只有在主题通过
  `theme.images` 带了背景图时才生效，而 ThemeForge 刻意不支持背景图。没有图就没有东西可对齐。

  `ntp_logo_alternate` 值得写，而且它**不是**字面上听起来那个意思。`1` 是**自适应**：
  「按我的新标签页配色推导字标」—— 在深色 `ntp_background` 上渲染白色 logo，在浅色上渲染
  标准深色字标。`0` 请求的是**原始** logo，而只有当新标签页的其它设置都没被改动过时 Google
  才会保留它，所以对彩色主题来说 `0` 才是脆弱的那个，不是安全的那个。因此默认是自适应，
  应用也把两个选项都作为新标签页分组里的控件暴露出来。

  这个项目以前搞反过 —— 它删掉了这个键，理由是 `1` 会选一张预渲染的白 logo，「在任何浅色
  背景上都会消失」。那 21 个手工主题推翻了这一点：19 个写了 `1`，其中 18 个的新标签页背景
  接近纯白（相对亮度均值 0.85）。真要是纯白字标，这些主题里每一个都该一眼看出来。
  来源：`theme.mepa.dev/theme-properties/display-properties`，以及 `data/themeFields.js`
  里的 `LOGO_STYLES`。

  `DISPLAY_PROPERTIES` 与 `resolveProperties()` 完整保留，这样将来做背景图功能时不必重新
  推导 Chrome 接受哪些键、要什么值类型。`SetDisplayPropertiesFromJSON` 会静默忽略类型不对的
  值，所以这些辅助函数会丢掉 `ntp_logo_alternate: "1"`，而不是写出一个悄悄失效的键。

其它值得留意的决策：

- **`toolbar_text` 是真实的 Chrome 键**（`TP::COLOR_TOOLBAR_TEXT`）。它总会写出，由
  `bookmark_text` 派生。（本项目早前的一个版本错误地把它当成 Firefox 专用的
  `bookmark_text` 别名；两个键都存在，含义不同。）
- **新标签页背景可以被新标签页自己的设置盖掉。** Chrome 自己的 `Customize Chrome` 背景设置
  优先级高于 `ntp_background`，所以一份写对了的主题也可能显示成纯白的新标签页。重装主题会重新
  应用主题的 NTP 颜色，这就是为什么「重新生成再重装」*看起来*修好了 —— 起作用的是重装，
  不是别的什么改动。真正的修法在 Chrome 侧：打开新标签页 → **自定义 Chrome** → 背景 →
  恢复默认。应用把这条写在安装说明第 5 条里，因为这是最常见的「你的主题不生效」报告。
- **主题依然无法指定 logo 的任意*颜色*。** Chrome 没有为新标签页 logo 暴露任何可主题化的图片
  —— 完整的 `kPersistingImagesTable` 是 `theme_frame`、`theme_frame_inactive`、
  `theme_frame_incognito`、`theme_frame_incognito_inactive`、`theme_toolbar`、
  `theme_tab_background`、`theme_tab_background_inactive`、`theme_tab_background_incognito`、
  `theme_tab_background_incognito_inactive`、`theme_tab_background_v`、`theme_ntp_background`、
  `theme_frame_overlay`、`theme_frame_overlay_inactive`、`theme_button_background`、
  `theme_ntp_attribution`、`theme_window_control_background` —— 里面没有 logo。
  `ntp_logo_alternate` 是唯一的杠杆，而它做的事是*请求 Chrome 从我们已经写出的颜色里推导*
  字标。它是一个行为开关，不是颜色控件 —— 这正是它对这类主题应该取 `1` 的原因，也是应用把它
  暴露出来而不是写死某个值的原因。
- **那 10 个不可编辑的键是推导出来的，不是凭空编的。** 每条规则都列在
  `utils/derivedColors.js` 的 `DERIVATIONS` 里 —— `copy` 表示「同一角色的不同窗口状态」，
  `darken` 表示隐身变体。
- **颜色默认输出 RGB 整数数组**（`[177, 178, 255]`），这是 Chrome 唯一能加载的格式。
  另有 HEX 字符串模式供其它浏览器使用。
- **`background_tab` 按「非活动标签背景」处理。** 第三方文档在这一点上说法不一；这个假设和
  它的理由都写在行内注释里，方便对照某个 Chrome 构建再核实。

---

## 本地开发

需要 **Node.js 18+**。

```bash
npm install
npm run dev          # http://localhost:5173
```

其它脚本：

```bash
npm run build        # 生产构建输出到 ./dist
npm run preview      # 本地起服务预览构建产物
npm run verify       # 纯 Node 自检：颜色、manifest、打包、随机配色
```

### 查看求解结果

`verify.mjs` 能证明对比度成立，但它说不出一个生成的主题*为什么*难看。真遇到难看的时候，
把每个角色的决策打出来：

```bash
node scripts/inspect-palette.mjs "#F5CBCB"
node scripts/inspect-palette.mjs "#FFF5F5" "#F7D6D0" "#E2B4BD" "#4A4A4A"
node scripts/inspect-palette.mjs "#F5CBCB" --mode dark --intensity bold
```

除了色相/饱和度/明度和每一对的实测对比度，它还会打印两个真正能预测「难看」的数字：
**最小表面亮度差**（相对亮度差为 0 意味着两个叠加的表面是同一个颜色，窗口就没有层次），
以及**强调色**是否落进了低饱和度下的橙橄榄泥色带。

---

## 验证

### `npm run verify` —— 294 条断言，不需要浏览器

`scripts/verify.mjs` 跑在纯 Node 里，覆盖：颜色解析；字段映射的完整性（包括 14 个可编辑字段
加 10 个派生字段恰好覆盖 Chromium 的 24 键表，无缺口、无死键）；两种颜色格式下 manifest 的
合法性；HEX 在 Chrome 里装不上这道守卫；输入加固；文件名净化；预设完整性；随机配色在 300 个
种子下的对比度保证；解压包组装与 ZIP 布局；每一套预设加 300 组随机配色都覆盖 24 键（每次都有
6 个合法 tints 和 logo 属性）；logo 样式表及其 id/整数往返；保留下来的显示属性净化函数；
让「永远完整」不可撤销的源码级守卫；扩展颜色派生及其退化输入；生成图标的几何形状（对着一个
桩 canvas）；各语言的 i18n 键与占位符一致性；配色求解器（含 1080 次扫描，以及针对纯黑/白、
RGB/CMY 与 36 个饱和色相的 405 次边缘扫描）；文本提取的误报守卫；导入/导出往返（两个方向
都含 logo 属性）；对比度体检与修复；撤销栈在注入时钟下的合并规则；以及图像色带/聚类原语
（对着合成的像素缓冲）。它还会用 `node --check` 解析 E2E harness，这样一个不配对的模板字面量
会在一秒内失败，而不是等浏览器启动之后。失败时退出码非零，且不需要浏览器。

### 浏览器 E2E —— 200 条断言，真 Chrome

`verify.mjs` 证明纯逻辑。另有一个配套 harness 证明组装后的应用，通过 DevTools Protocol 驱动
真 Chrome，**零额外依赖**（Node 内置的 `WebSocket` + `fetch`，不用 Playwright）。它绑定的是
本机的 Chrome 安装和一个一次性 profile，所以它被保留在本仓库之外，而不是随仓库分发：

```bash
npm run build
npm run preview                    # 提供 ./dist
node <harness>/e2e.mjs http://localhost:4173
```

**200 条断言 / 23 个套件**：首屏渲染、实时预览的响应、非法输入的恢复、预设、随机配色、
键名浮层、manifest 弹窗、名称校验、**把生成的 ZIP 解包后逐字节检查（只有 manifest.json，
没有别的）**、刷新后存储的持久化、重置对话框、响应式布局、EN/中文切换、配色台、色卡导入、
manifest 往返、真实的浏览器内图片取色、对比度体检与修复、控制台错误审计（任何未捕获异常、
console error 或失败请求都会让整轮失败）、无障碍抽查、**无需任何用户操作**就得到 24 键 /
6 tints / logo 属性、以及「完整主题」开关和任何 NTP 属性 *select* **必定不存在**（切换预设后
再验一次）、**Ctrl+Z 撤销**（包括整段取色拖动合并成一步，以及在文本框里按 Ctrl+Z 不碰主题）、
还有**新标签页 Logo 控件**在两个取值与撤销路径上都驱动 `ntp_logo_alternate`。

它会启动**自己的**无头 Chrome，用一次性 profile 和固定的 `--lang=en-US`，并且只结束这一个
实例 —— 你已经打开的 Chrome 永远不会被动到。压缩包是在页面内用 `FileReader` 读回来的，
而不是走下载管理器，所以断言是确定性的，不用跟文件系统抢时序。

它还会把 `HTTP_PROXY` / `HTTPS_PROXY` 转发给浏览器作为 `--proxy-server`（并尊重 `NO_PROXY`）。
沙箱和 CI 经常*只*通过这两个环境变量公布代理 —— Node 认它们，但 Chrome 读的是操作系统自己的
设置。没有这个转发，对着远程 URL 跑就会在文档请求上报 `net::ERR_CONNECTION_CLOSED`，
而同一个 URL 用 `fetch` 却是 200 —— 看起来和「部署坏了」一模一样。

---

## 构建

```bash
npm run build
```

| 设置 | 值 |
| --- | --- |
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |
| Node 版本 | 18+ |

产物是纯静态包（`index.html` + 带 hash 的 CSS/JS）。这里**没有服务端运行时** —— ThemeForge
不使用 SSR、API 路由、边缘函数或任何 Node.js 服务。

---

## Cloudflare Pages 部署

线上地址：**<https://themeforge-9g1.pages.dev>**。

### 方案 A —— Git 集成

1. 把本仓库推到 GitHub/GitLab。
2. 在 Cloudflare 控制台进入 **Workers & Pages → Create → Pages → Connect to Git**。
3. 选择仓库并配置：
   - **Framework preset:** None（或 Vite）
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** `18` 或更新（如果 Cloudflare 默认版本偏旧，在环境变量里设
     `NODE_VERSION`）
4. 保存并部署。

### 方案 B —— 用 Wrangler 直接上传

```bash
npm run build
npx wrangler pages deploy dist --project-name themeforge
```

就这些。不需要 `_redirects`，因为应用没有客户端路由 —— 所有路由都是 `/`。

---

## 项目结构

```
themeforge/
├── index.html                  # 应用外壳、meta 标签、内联 SVG favicon
├── vite.config.js              # Vite 配置（静态构建目标）
├── package.json
├── README.md                   # 英文说明
├── README.zh-CN.md             # 简体中文说明（本文件）
├── LICENSE                     # 非商业使用许可证 v1.0（中英双语）
├── docs/
│   └── screenshot.png          # README 截图
├── scripts/
│   ├── verify.mjs              # 自检脚本（npm run verify）
│   └── inspect-palette.mjs     # 这套配色为什么解成这样？
└── src/
    ├── main.jsx                # 入口，全局 CSS 引入
    ├── App.jsx                 # 应用外壳 + 全部状态、派生 manifest
    ├── components/
    │   ├── Header.jsx          # 品牌、语言切换、重置、关于
    │   ├── LanguageSwitcher.jsx# EN / 中文 分段控件
    │   ├── Hero.jsx            # 标题 + 副标题
    │   ├── ThemeSettings.jsx   # 名称 + 描述、分组颜色控件、NTP Logo 控件
    │   ├── ColorField.jsx      # 一组取色器 + HEX 输入
    │   ├── PaletteStudio.jsx   # 种子颜色 + 模式/强度 + 实时色带
    │   ├── ImportPanel.jsx     # 文本 / 链接 / manifest / 图片入口
    │   ├── PresetsPanel.jsx    # 预设 + 随机配色
    │   ├── ChromeMockup.jsx    # 浏览器 mockup + 实时预览 + 对比度体检
    │   ├── ExportPanel.jsx     # 颜色格式 + 生成
    │   ├── ManifestModal.jsx   # JSON 预览、复制、下载
    │   ├── Modal.jsx           # 通用对话框原语（焦点陷阱、Esc）
    │   ├── ConfirmDialog.jsx   # 重置二次确认
    │   ├── Toast.jsx           # Toast provider + live region
    │   ├── ErrorBoundary.jsx   # 可恢复的崩溃页
    │   └── Icons.jsx           # 内联 SVG 图标集
    ├── data/
    │   ├── themeFields.js      # ⭐ UI 设置 → Chrome manifest 键 的映射
    │   └── presets.js          # 默认主题、6 套预设、随机配色
    ├── i18n/
    │   ├── languages.js        # 无 Hook 核心：词典 + translate()
    │   ├── index.jsx           # React 层：provider、useI18n()、语言检测
    │   ├── en.js               # 英文字典（键集合的基准）
    │   └── zh.js               # 简体中文字典
    ├── utils/
    │   ├── color.js            # HEX/RGB/HSL 转换、亮度、对比度
    │   ├── palette.js          # ⭐ 求解器：一个颜色 → 14 个 Chrome 角色
    │   ├── derivedColors.js    # ⭐ 另 10 个键 + 6 个 tints，从配色派生
    │   ├── history.js          # 撤销栈（合并、有界）
    │   ├── icon.js             # 128×128 图标渲染（保留备用，默认不打包）
    │   ├── package.js          # 把 manifest.json 组装进主题文件夹
    │   ├── importTheme.js      # manifest / ThemeForge / 裸映射解析
    │   ├── parseColors.js      # Hex + rgb() + 色卡链接文本提取
    │   ├── image.js            # 色带检测 + 主色聚类
    │   ├── contrastAudit.js    # WCAG 配对检查 + 有界修复
    │   ├── manifest.js         # manifest 构建 + 校验（含 tints）
    │   ├── zip.js              # JSZip 打包（单层顶层目录）+ 下载
    │   ├── storage.js          # localStorage（草稿 + 语言），带可用性检查
    │   └── slug.js             # 安全的 ZIP 文件名
    └── styles/
        ├── base.css            # 设计令牌、reset、焦点、滚动条
        ├── layout.css          # 头部、Hero、两栏工作区
        ├── components.css      # 按钮、面板、字段、对话框、Toast
        ├── studio.css          # 语言切换、配色台、导入面板
        └── preview.css         # 浏览器 mockup、键名浮层、对比度体检
```

### 想改什么去哪里

| 目标 | 文件 |
| --- | --- |
| 增加或重命名一个主题颜色 | `src/data/themeFields.js`（加一条） |
| 增加一套预设 | `src/data/presets.js`（`PRESETS` 数组） |
| 改随机配色的逻辑 | `src/data/presets.js` 里的 `generateRandomColors()` |
| 改「一个颜色如何变成一套主题」 | `src/utils/palette.js` 里的 `solveTheme()` |
| 改那 10 个额外键的推导方式 | `src/utils/derivedColors.js` 里的 `DERIVATIONS` |
| 改撤销行为 | `src/utils/history.js` 里的 `record()` / `createHistory()` |
| 改生成图标的样子 | `src/utils/icon.js` 里的 `drawThemeIcon()` |
| 改 ZIP 里装什么 | `src/utils/package.js` 里的 `buildThemePackage()` |
| 改「可读」的判定标准 | `src/utils/contrastAudit.js` 里的 `AUDIT_RULES` |
| 支持新的导入格式 | `src/utils/importTheme.js` / `src/utils/parseColors.js` |
| 调图片取色参数 | `src/utils/image.js` 顶部的常量 |
| 增删翻译 | `src/i18n/en.js` + `src/i18n/zh.js`（键要保持一致） |
| 改 manifest 结构 | `src/utils/manifest.js` |
| 调整 mockup | `src/components/ChromeMockup.jsx` + `styles/preview.css` |
| 改头部里的仓库链接 | `src/components/Header.jsx` 里的 `GITHUB_URL` |

---

## 技术栈

- **React 19** + **Vite 8** —— 组件结构与快速的静态构建
- **JSZip** —— React 之外唯一的运行时依赖
- **纯 CSS** 配设计令牌 —— 没有 CSS 框架，没有工具类

配色求解器、对比度计算、导入解析、图片取色和 i18n 层全部基于平台能力实现（Canvas、
`getImageData`、不依赖 `Intl` 的字符串表），**没有引入任何额外依赖**。

刻意排除：路由、状态库、UI 组件库、CSS-in-JS、统计埋点，以及任何后端 SDK。

---

## 隐私

**ThemeForge 在你的浏览器本地处理主题设置。**
**不需要账号。**
**主题配置不会上传到服务器。**

具体来说：

- 所有颜色计算、配色求解、manifest 生成、图片分析和 ZIP 打包都在客户端完成。
- 草稿保存在你自己浏览器的 `localStorage` 里（键为 `themeforge:theme:v1`），语言选择保存在
  `themeforge:lang:v1`。它们从不离开你的设备，也不参与同步。
- **图片从不离开页面。** 取色是把图片画到本地 `<canvas>` 上再用 `getImageData` 读像素，
  不会有任何上传。
- **粘贴进来的取色链接从不被访问。** 颜色是从 URL 文本本身解析出来的 —— 这个面板不发任何
  网络请求。
- 没有后端、没有数据库、没有 API key、没有统计、没有跟踪。
- 应用唯一的网络请求就是加载它自己的静态资源。

以上都可以在源码里查证；整个应用都在 `src/` 里。

---

## 免责声明

ThemeForge 是一个独立工具，与 Google 没有隶属关系，也未获得其认可或赞助。「Chrome」是
Google LLC 的商标。预览里的浏览器 mockup 不使用任何 Chrome 或 Google 的 logo 或商标 ——
它只复现了通用的浏览器界面几何结构。

---

## 许可证

以 **非商业使用许可证**（Non-Commercial License，v1.0，2026-09-19）发布。允许个人、教育及其它
非商业用途，包括阅读和修改源码。商业使用需事先获得作者的书面许可。完整条款（中英双语）见
[LICENSE](LICENSE)。
