/**
 * Theme icon generation.
 *
 * Every hand-built theme in the reference set ships a 128×128 `icon.png`
 * referenced by `icons.128`. Chrome does not require it for a colour-only theme,
 * but the Chrome Web Store does, and a theme without one shows a blank card in
 * `chrome://extensions`. ThemeForge therefore draws one from the theme's own
 * palette instead of asking the user to open an image editor.
 *
 * The drawing is deliberately flat — a miniature browser window in the theme's
 * own colours, no gradients, no text. At 128 px (and at the 48/32/16 px sizes
 * Chrome derives) a flat three-shape composition stays legible where a detailed
 * illustration turns to mud.
 *
 * This module is browser-only: it needs a real `<canvas>`. In Node the caller
 * should pass `icon: null` to `buildThemePackage` and no icon file is written.
 */

import { ICON_SIZE } from '../data/themeFields.js'
import { normalizeHex, readableTextOn } from './color.js'

/** Fallbacks for a palette that is missing or unparsable. */
const FALLBACK = {
  frame: '#DCE1E6',
  toolbar: '#FFFFFF',
  omniboxBackground: '#FFFFFF',
  ntpBackground: '#F5F5F5',
  ntpLink: '#063774',
}

/**
 * Rounded rectangle path. Written with `arcTo` rather than `ctx.roundRect`
 * because the latter only landed in Chrome 99 and this app supports older
 * builds gracefully.
 */
function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/** Resolve one palette entry, falling back rather than drawing nothing. */
function pick(colors, id) {
  return normalizeHex(colors?.[id]) ?? FALLBACK[id] ?? '#000000'
}

/**
 * Draw the icon onto an existing context. Exported so the verifier can exercise
 * the geometry against a stub context without a DOM.
 *
 * Composition (all coordinates for a 128 px canvas, scaled by `size / 128`):
 *   1. full-bleed `frame` background
 *   2. `toolbar` window body, rounded
 *   3. `frame` active tab, a small rounded rect on the tab strip
 *   4. `omniboxBackground` address bar
 *   5. `ntpLink` accent dot at the right of the address bar
 *   6. `ntpBackground` content card
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Record<string,string>} colors Field-id -> hex.
 * @param {number} size
 */
export function drawThemeIcon(ctx, colors, size = ICON_SIZE) {
  const k = size / 128
  const px = (value) => value * k

  // 1. Background — the window frame colour fills the whole tile.
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = pick(colors, 'frame')
  ctx.fillRect(0, 0, size, size)

  // 2. Window body — the toolbar surface, inset 16 px.
  ctx.fillStyle = pick(colors, 'toolbar')
  roundRect(ctx, px(16), px(16), px(96), px(96), px(18))
  ctx.fill()

  // 3. Active tab — painted in the frame colour so it reads as "merged with the
  //    frame", which is what an active tab looks like in real Chrome.
  ctx.fillStyle = pick(colors, 'frame')
  roundRect(ctx, px(28), px(26), px(44), px(18), px(9))
  ctx.fill()

  // 4. Address bar.
  ctx.fillStyle = pick(colors, 'omniboxBackground')
  roundRect(ctx, px(28), px(54), px(64), px(17), px(8.5))
  ctx.fill()

  // 5. Accent dot — the palette's link colour, which is usually the most
  //    saturated entry and gives the icon an identifiable hue at 16 px.
  ctx.fillStyle = pick(colors, 'ntpLink')
  ctx.beginPath()
  ctx.arc(px(100), px(62.5), px(8), 0, Math.PI * 2)
  ctx.fill()

  // 6. Content card.
  ctx.fillStyle = pick(colors, 'ntpBackground')
  roundRect(ctx, px(28), px(82), px(72), px(18), px(9))
  ctx.fill()

  // Guard against an invisible icon: if the two largest surfaces ended up
  // identical the composition would read as a blank tile. A hairline in the
  // most legible ink restores the silhouette without changing the palette.
  const body = pick(colors, 'toolbar')
  if (body === pick(colors, 'frame')) {
    ctx.strokeStyle = readableTextOn(body)
    ctx.globalAlpha = 0.15
    ctx.lineWidth = Math.max(1, px(1.5))
    roundRect(ctx, px(16), px(16), px(96), px(96), px(18))
    ctx.stroke()
    ctx.globalAlpha = 1
  }
}

/**
 * Render the theme icon to a PNG Blob.
 *
 * @param {object} options
 * @param {Record<string,string>} options.colors
 * @param {number} [options.size=ICON_SIZE]
 * @returns {Promise<Blob>}
 */
export async function renderThemeIcon({ colors, size = ICON_SIZE }) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not acquire a 2D canvas context for the theme icon.')

  drawThemeIcon(ctx, colors, size)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas produced no PNG data for the theme icon.'))
    }, 'image/png')
  })
}

export { FALLBACK as ICON_FALLBACK_COLORS }
