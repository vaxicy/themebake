import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/** Distance kept between the pointer and the tip, so the cursor never covers it. */
const GAP = 14
/** Inset kept between the tip and the window edge. */
const EDGE = 8

/** The three parts a region names itself with. */
const readRegion = (element) => ({
  label: element.getAttribute('data-tip-label') ?? '',
  key: element.getAttribute('data-tip-key') ?? '',
  action: element.getAttribute('data-tip-action') ?? '',
})

/**
 * The previews' own tooltip.
 *
 * A region names itself on hover — "Sidebar background · sideBar.background ·
 * click to edit this colour" — and that line used to be a native `title`. A native
 * tooltip arrives after the platform's own delay, renders in the OS's font at the
 * OS's size, ignores the page's palette, and cannot be styled or positioned: none
 * of which fits a preview whose whole job is showing what a colour looks like. So
 * the region writes the three parts as `data-tip-*` attributes and this layer
 * draws them.
 *
 * Delegated rather than per-region state on purpose: the mockups rebuild 100+
 * colours per render, so a tooltip held in their state would re-render the entire
 * workbench on every pointer move. The listeners sit on the preview panel, so the
 * other workspace's preview can never answer for this one's regions.
 *
 * Rendered `position: fixed` because the mockups clip their contents
 * (`overflow: hidden`) — an absolutely positioned tip inside a region would be cut
 * off at the region's edge, which is exactly where it needs to spill out of.
 *
 * @returns {React.ReactElement} an empty anchor in the panel plus the tip itself
 */
export function PreviewTipLayer() {
  // An empty span: all this needs from React is a node to find the panel with.
  const anchorRef = useRef(null)
  const tipRef = useRef(null)
  const [tip, setTip] = useState(null)

  useEffect(() => {
    const host = anchorRef.current?.parentElement
    if (!host) return undefined

    /** The innermost region under an element — regions nest (tabs in a strip). */
    const regionAt = (element) =>
      element instanceof Element ? element.closest('[data-tip-label]') : null

    const show = (region, x, y) => setTip({ ...readRegion(region), x, y })

    const onOver = (event) => {
      const region = regionAt(event.target)
      if (!region) setTip(null)
      else show(region, event.clientX, event.clientY)
    }

    // The tip tracks the pointer inside the region it belongs to. Crossing into a
    // nested region swaps the text instead of flickering empty: `pointerover` for
    // the child arrives after `pointerout` for the parent.
    const onMove = (event) => {
      const region = regionAt(event.target)
      if (!region) return
      show(region, event.clientX, event.clientY)
    }

    const onOut = (event) => {
      const next = regionAt(event.relatedTarget)
      if (next) show(next, event.clientX, event.clientY)
      else setTip(null)
    }

    // Two states the pointer cannot report: it is still over the region after the
    // click picked it, and the page can scroll out from under a fixed tip.
    const dismiss = () => setTip(null)

    host.addEventListener('pointerover', onOver)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerout', onOut)
    host.addEventListener('pointerdown', dismiss)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('blur', dismiss)

    return () => {
      host.removeEventListener('pointerover', onOver)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerout', onOut)
      host.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('blur', dismiss)
    }
  }, [])

  /*
   * Kept inside the window: the tip flips to the other side of the pointer when it
   * would run off the right or bottom edge. Done here rather than in state because
   * its size is only known once it is in the DOM, and a layout effect runs before
   * paint — so the tip never appears at the wrong place first.
   */
  useLayoutEffect(() => {
    const element = tipRef.current
    if (!element || !tip) return
    const { width, height } = element.getBoundingClientRect()
    let x = tip.x + GAP
    let y = tip.y + GAP
    if (x + width > window.innerWidth - EDGE) x = Math.max(EDGE, tip.x - width - GAP)
    if (y + height > window.innerHeight - EDGE) y = Math.max(EDGE, tip.y - height - GAP)
    element.style.left = `${Math.round(x)}px`
    element.style.top = `${Math.round(y)}px`
  })

  return (
    <span className="preview-tip-layer" ref={anchorRef}>
      {tip ? (
        <span className="preview-tip" role="tooltip" ref={tipRef}>
          <span className="preview-tip__label">{tip.label}</span>
          {tip.key ? <code className="preview-tip__key">{tip.key}</code> : null}
          {tip.action ? <span className="preview-tip__action">{tip.action}</span> : null}
        </span>
      ) : null}
    </span>
  )
}
