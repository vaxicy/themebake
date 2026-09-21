"""Re-shoot the README screenshots in both languages.

Produces:
    docs/screenshot-en.png      English README
    docs/screenshot-zh-CN.png   简体中文 README

Usage
-----
    python3 scripts/capture-docs.py                             # deployed site
    python3 scripts/capture-docs.py --url http://127.0.0.1:5599/  # a local build
    python3 scripts/capture-docs.py --width 1440 --height 1000

Why one browser context per language
------------------------------------
The page picks its language from `navigator.language` on a first visit, so each
shot is a genuine first-visit render of that locale rather than a switched one —
clicking 中文 would capture a page that already drew itself in English, and any
layout shift from the switch would be in the picture.

The frame is a real browser window (viewport-sized, not `full_page`): the panels
scroll well past the fold, and the shot is meant to show the workspace as it
opens, which is what the README is advertising.
"""

from __future__ import annotations

import argparse
import pathlib
import sys

from playwright.sync_api import sync_playwright

DEFAULT_URL = "https://themebake.pages.dev/"
DOCS = pathlib.Path(__file__).resolve().parent.parent / "docs"

# (output file, browser locale) — English first so the pair is always written in
# the same order, whatever the machine's own locale is.
SHOTS = [
    ("screenshot-en.png", "en-US"),
    ("screenshot-zh-CN.png", "zh-CN"),
]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=DEFAULT_URL, help=f"page to capture (default {DEFAULT_URL})")
    parser.add_argument("--width", type=int, default=1280)
    parser.add_argument("--height", type=int, default=900)
    parser.add_argument("--scale", type=float, default=2, help="device pixel ratio (default 2)")
    parser.add_argument("--settle", type=int, default=1800, help="ms to wait after load (default 1800)")
    args = parser.parse_args()

    DOCS.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        for filename, locale in SHOTS:
            context = browser.new_context(
                locale=locale,
                viewport={"width": args.width, "height": args.height},
                device_scale_factor=args.scale,
            )
            page = context.new_page()
            page.goto(args.url, wait_until="networkidle")
            # The workbench animates in; shooting mid-flight catches half-drawn
            # panels. Waiting for the animation to finish beats disabling it —
            # the entrance rules are what put elements at their final position.
            page.wait_for_timeout(args.settle)
            target = DOCS / filename
            page.screenshot(path=str(target))
            lang = page.evaluate("() => document.documentElement.lang")
            print(f"{filename}: {locale} -> <html lang={lang}> {target.stat().st_size // 1024} KB")
            context.close()
        browser.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
