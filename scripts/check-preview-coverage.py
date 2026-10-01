"""Every colour the settings panel offers must be visible in the preview.

The panel and the preview are two views of the same list, and a colour with no
surface in the preview is one the user has to take on faith: they change it, and
nothing on screen moves. This audit settles that per colour rather than per
screenshot — each editable colour is set to its own sentinel value, the preview is
rendered, and every computed colour inside it is read back. A sentinel that appears
nowhere is a colour with no effect; one that appears but never inside a
`data-tip-label` region is a colour you can see but not click.

Usage (needs a build to serve, see the README):

    npm run build
    python3 -m http.server 6799 --directory dist
    python3 scripts/check-preview-coverage.py --url http://127.0.0.1:6799/
"""

from __future__ import annotations

import argparse
import sys

from playwright.sync_api import sync_playwright

DEFAULT_URL = "https://themebake.pages.dev/"

# ---------------------------------------------------------------------------
# The two lists. Kept here rather than imported from the app so the audit fails
# loudly (instead of silently shrinking) when a field is removed or renamed.
# ---------------------------------------------------------------------------

VSCODE_MASTERS = [
    "editorBg", "editorFg", "accent", "selectionBg", "lineHighlightBg", "mutedFg",
    "activityBg", "sidebarBg", "titleBg", "border", "buttonBg", "buttonFg",
    "errorFg", "warningFg",
]
VSCODE_REGIONS = ["inactiveTabBg", "panelBg", "statusBarBg", "widgetBg", "lineNumberFg", "indentGuideFg"]

CHROME_FIELDS = [
    "frame", "frameInactive", "toolbar", "backgroundTab", "tabText", "tabBackgroundText",
    "toolbarButtonIcon", "buttonBackground", "omniboxBackground", "omniboxText",
    "bookmarkText", "ntpBackground", "ntpText",
]
# The one Chrome colour a still, focused window cannot show: `frame_inactive` is
# what the frame looks like while another window has focus.
CHROME_EXEMPT = {"frameInactive"}

# ---------------------------------------------------------------------------
# Where each colour is meant to be clickable.
#
# The values are the `data-tip-key`s of that field's regions, and they are the point
# of the audit: a sentinel appearing somewhere in the preview only proves the colour
# is used *somewhere*. Requiring it to appear inside a region tagged with its own key
# also catches the quieter bug — a region painted from the wrong derived colour, e.g.
# a "panel background" region actually showing the sidebar's.
# A trailing dot is a prefix: every syntax rule tagged `tokenColors.<family>`.
# ---------------------------------------------------------------------------

VSCODE_TIP_KEYS = {
    "editorBg": ("editor.background",),
    "editorFg": ("editor.foreground", "tokenColors."),
    "accent": ("editorLineNumber.activeForeground", "tokenColors."),
    "selectionBg": (
        "editor.selectionBackground",
        "list.activeSelectionBackground",
        "editorSuggestWidget.selectedBackground",
    ),
    "lineHighlightBg": ("editor.lineHighlightBackground",),
    "mutedFg": ("tokenColors.comment", "editorIndentGuide.activeBackground1"),
    "activityBg": ("activityBar.background",),
    "sidebarBg": ("sideBar.background",),
    "titleBg": ("titleBar.activeBackground",),
    "border": ("sideBar.border",),
    "buttonBg": ("activityBarBadge.background",),
    "buttonFg": ("activityBarBadge.foreground",),
    "errorFg": ("editorError.foreground", "tokenColors.invalid"),
    "warningFg": ("editorWarning.foreground", "tokenColors.string", "tokenColors.number", "tokenColors.attribute"),
    "inactiveTabBg": ("editorGroupHeader.tabsBackground",),
    "panelBg": ("panel.background",),
    "statusBarBg": ("statusBar.background",),
    "widgetBg": ("editorSuggestWidget.background",),
    "lineNumberFg": ("editorLineNumber.foreground",),
    "indentGuideFg": ("editorIndentGuide.background1",),
}

CHROME_TIP_KEYS = {
    "frame": ("frame",),
    "toolbar": ("toolbar",),
    "backgroundTab": ("background_tab",),
    "tabText": ("tab_text",),
    "tabBackgroundText": ("tab_background_text",),
    "toolbarButtonIcon": ("toolbar_button_icon",),
    "buttonBackground": ("button_background",),
    "omniboxBackground": ("omnibox_background",),
    "omniboxText": ("omnibox_text",),
    "bookmarkText": ("bookmark_text",),
    "ntpBackground": ("ntp_background",),
    "ntpText": ("ntp_text",),
}

# ---------------------------------------------------------------------------
# Sentinels
# ---------------------------------------------------------------------------

def sentinel(index: int) -> str:
    """A colour no derivation will land on by accident.

    Spread across the cube by three different strides so no two sentinels are
    adjacent, which is what keeps "this colour is in the preview" from being
    satisfied by a blend of two others.
    """
    r = (index * 37 + 11) % 256
    g = (index * 53 + 29) % 256
    b = (index * 97 + 43) % 256
    return f"#{r:02X}{g:02X}{b:02X}"


def rgb_of(hex_colour: str) -> str:
    value = hex_colour.lstrip("#")
    return "rgb({}, {}, {})".format(*(int(value[i : i + 2], 16) for i in (0, 2, 4)))


# ---------------------------------------------------------------------------
# Reading the preview back
# ---------------------------------------------------------------------------

READ_COLOURS = """(root) => {
  const props = [
    'color', 'backgroundColor', 'borderTopColor', 'borderRightColor',
    'borderBottomColor', 'borderLeftColor', 'outlineColor', 'caretColor',
  ];
  const describe = (el) => {
    const cls = typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\\s+/).join('.')
      : '';
    return el.tagName.toLowerCase() + cls;
  };
  const seen = [];
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const style = getComputedStyle(el);
    const region = el.closest('[data-tip-label]');
    for (const prop of props) {
      const value = style[prop];
      if (!value || value === 'rgba(0, 0, 0, 0)') continue;
      seen.push({
        el: describe(el),
        prop,
        value,
        label: region?.getAttribute('data-tip-label') ?? null,
        tipKey: region?.getAttribute('data-tip-key') ?? null,
      });
    }
  }
  return seen;
}"""


def matches(tip_key, allowed):
    """Is this region's key one of the field's own? A trailing dot means prefix."""
    if not tip_key:
        return False
    return any(tip_key.startswith(key) if key.endswith(".") else tip_key == key for key in allowed)


def audit(page, root_selector, sentinels, tip_keys, title):
    """Report where each colour shows up, and whether its own region carries it."""
    page.evaluate("() => window.scrollTo(0, 0)")
    page.wait_for_timeout(400)
    occurrences = page.evaluate(READ_COLOURS, page.locator(root_selector).first.element_handle())

    by_value: dict[str, list[dict]] = {}
    for entry in occurrences:
        by_value.setdefault(entry["value"], []).append(entry)

    print(f"\n=== {title} ({len(sentinels)} colours)")
    missing = []
    misplaced = []
    for field, colour in sentinels.items():
        hits = by_value.get(rgb_of(colour), [])
        if not hits:
            missing.append(field)
            print(f"  MISSING    {field:<18} {colour}  painted nowhere in the preview")
            continue
        own = [hit for hit in hits if matches(hit["tipKey"], tip_keys.get(field, ()))]
        if not own:
            misplaced.append(field)
            elsewhere = sorted({hit["tipKey"] for hit in hits if hit["tipKey"]})
            print(
                f"  MISTAGGED  {field:<18} {colour}  {hits[0]['el']} {hits[0]['prop']}"
                f"  — painted, but no region claims it (tags seen: {', '.join(elsewhere) or 'none'})"
            )
            continue
        first = own[0]
        print(
            f"  ok         {field:<18} {colour}  {first['el']} {first['prop']}"
            f"  -> {first['label']} / {first['tipKey']}"
        )
    return missing, misplaced


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=DEFAULT_URL, help="page to audit (default: production)")
    parser.add_argument("--headed", action="store_true", help="show the browser")
    args = parser.parse_args()

    vscode_sentinels = {
        field: sentinel(index) for index, field in enumerate(VSCODE_MASTERS + VSCODE_REGIONS)
    }
    chrome_sentinels = {field: sentinel(index + 40) for index, field in enumerate(CHROME_FIELDS)}

    failures = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not args.headed)
        context = browser.new_context(locale="zh-CN", viewport={"width": 1400, "height": 1200})
        page = context.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(args.url, wait_until="networkidle")

        # ---------------------------------------------------------- VS Code draft
        page.evaluate(
            """(payload) => {
              localStorage.clear()
              localStorage.setItem('themebake:vscode-theme:v1', JSON.stringify(payload))
            }""",
            {
                "name": "Coverage",
                "folderInput": "coverage",
                "type": "dark",
                "colors": {field: colour for field, colour in vscode_sentinels.items() if field in VSCODE_MASTERS},
                "pairedColors": None,
                "overrides": {field: colour for field, colour in vscode_sentinels.items() if field in VSCODE_REGIONS},
                "outputMode": "vsix",
                "pair": False,
                "seed": "#123456",
            },
        )
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(500)
        page.get_by_text("VS Code 主题", exact=True).first.click()
        page.wait_for_timeout(700)
        missing, misplaced = audit(page, ".vsc", vscode_sentinels, VSCODE_TIP_KEYS, "VS Code preview")
        failures += [f"VS Code/{field} is invisible" for field in missing]
        failures += [f"VS Code/{field} is visible but has no region of its own" for field in misplaced]

        # ------------------------------------------------------------ Chrome draft
        page.evaluate(
            """(payload) => {
              localStorage.setItem('themebake:theme:v1', JSON.stringify(payload))
            }""",
            {
                "name": "Coverage",
                "description": "",
                "colors": chrome_sentinels,
                "colorFormat": "hex",
                "folderInput": "coverage",
                "outputMode": "zip",
                "activePresetId": None,
                "logoStyle": 1,
                "seed": "#123456",
            },
        )
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(500)
        page.get_by_text("Chrome 主题", exact=True).first.click()
        page.wait_for_timeout(700)
        missing, misplaced = audit(
            page,
            ".preview-panel",
            {field: colour for field, colour in chrome_sentinels.items() if field not in CHROME_EXEMPT},
            CHROME_TIP_KEYS,
            "Chrome preview",
        )
        failures += [f"Chrome/{field} is invisible" for field in missing]
        failures += [f"Chrome/{field} is visible but has no region of its own" for field in misplaced]
        if CHROME_EXEMPT:
            print(f"  exempt: {', '.join(sorted(CHROME_EXEMPT))} (needs an unfocused window)")

        print("\nconsole errors:", errors or "none")
        browser.close()

    print("\n" + "-" * 56)
    if failures:
        print(f"FAILED: {len(failures)} colour(s) without a preview effect")
        for failure in failures:
            print("  -", failure)
        return 1
    print("every editable colour is visible in the preview and clickable in it")
    return 0


if __name__ == "__main__":
    sys.exit(main())
