import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/** Distance kept between the pointer and the tip, so the cursor never covers it. */
const GAP = 14
/** Inset kept between the tip and the window edge. */
const EDGE = 8

/**
 * What an element says about itself.
 *
 * Two shapes, one tip:
 *  - `data-tip="…"` is a sentence ("两套独立：改一套不影响另一套。").
 *  - `data-tip-label` / `data-tip-key` / `data-tip-action` is the previews' three
 *    parts — a region name, the workbench or manifest key behind it, and the click
 *    hint — drawn as label · code · action.
 */
const readTip = (element) => {
  const text = element.getAttribute('data-tip') ?? ''
  if (text) return { text, label: '', key: '', action: '' }
  return {
    text: '',
    label: element.getAttribute('data-tip-label') ?? '',
    key: element.getAttribute('data-tip-key') ?? '',
    action: element.getAttribute('data-tip-action') ?? '',
  }
}

/**
 * The page's tooltip — the one that replaces the browser's.
 *
 * A native `title` waits for the platform's own delay, renders in the OS's font at
 * the OS's size, ignores the page's palette, and is positioned by the OS: none of
 * which fits an app whose whole subject is how a colour looks. So an element writes
 * what it wants to say as `data-tip*`, and this layer draws it — for the preview
 * regions and for ordinary controls alike.
 *
 * Mounted **once**, inside the app shell (`App.jsx`), and it delegates: the
 * listeners sit on its parent, so every `data-tip*` element in the app answers,
 * in either workspace, without each panel mounting its own copy. Delegation rather
 * than per-element state also matters for the mockups: they rebuild 100+ colours per
 * render, and a tooltip held in their state would re-render the whole workbench on
 * every pointer move.
 *
 * Rendered `position: fixed` because the mockups clip their contents
 * (`overflow: hidden`) — an absolutely positioned tip inside a region would be cut
 * off at the region's edge, which is exactly where it needs to spill out of.
 *
 * @returns {React.ReactElement} an empty anchor plus the tip itself
 */
export function TooltipLayer() {
  // An empty span: all this needs from React is a node to find the host with.
  const anchorRef = useRef(null)
  const tipRef = useRef(null)
  const [tip, setTip] = useState(null)

  useEffect(() => {
    const host = anchorRef.current?.parentElement
    if (!host) return undefined

    /** The innermost tooltip owner under an element — regions nest (tabs in a strip). */
    const ownerAt = (element) =>
      element instanceof Element ? element.closest('[data-tip], [data-tip-label]') : null

    const show = (owner, x, y) => setTip({ ...readTip(owner), x, y })

    const onOver = (event) => {
      const owner = ownerAt(event.target)
      if (!owner) setTip(null)
      else show(owner, event.clientX, event.clientY)
    }

    // The tip tracks the pointer inside the element it belongs to. Crossing into a
    // nested one swaps the text instead of flickering empty: `pointerover` for the
    // child arrives after `pointerout` for the parent.
    const onMove = (event) => {
      const owner = ownerAt(event.target)
      if (!owner) return
      show(owner, event.clientX, event.clientY)
    }

    const onOut = (event) => {
      const next = ownerAt(event.relatedTarget)
      if (next) show(next, event.clientX, event.clientY)
      else setTip(null)
    }

    // Two states the pointer cannot report: it is still over the element after the
    // click used it, and the page can scroll out from under a fixed tip.
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
    <span className="tooltip-layer" ref={anchorRef}>
      {tip ? (
        <span
          className={`tooltip${tip.text ? ' tooltip--text' : ''}`}
          role="tooltip"
          ref={tipRef}
        >
          {tip.text ? <span className="tooltip__text">{tip.text}</span> : null}
          {tip.label ? <span className="tooltip__label">{tip.label}</span> : null}
          {tip.key ? <code className="tooltip__key">{tip.key}</code> : null}
          {tip.action ? <span className="tooltip__action">{tip.action}</span> : null}
        </span>
      ) : null}
    </span>
  )
}
