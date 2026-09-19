/**
 * Accessible modal primitive shared by "Preview Manifest" and the Reset confirm.
 *
 * Handles: Escape to close, backdrop click, focus trap, focus restore, body
 * scroll lock and labelled-dialog semantics.
 */

import { useCallback, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../i18n/index.jsx'
import { CloseIcon } from './Icons.jsx'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const { t } = useI18n()
  const dialogRef = useRef(null)
  const previouslyFocused = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      const nodes = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null || node === document.activeElement,
      )
      if (!nodes.length) return

      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return undefined

    previouslyFocused.current = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    // Focus the dialog container itself first (not a control) so screen readers
    // read the title before the content.
    const raf = window.requestAnimationFrame(() => {
      const target = dialogRef.current?.querySelector('[data-autofocus]') ?? dialogRef.current
      target?.focus?.()
    })

    return () => {
      window.cancelAnimationFrame(raf)
      document.body.style.overflow = overflow
      if (previouslyFocused.current instanceof HTMLElement) previouslyFocused.current.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <header className="modal__header">
          <div>
            <h2 className="modal__title" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="modal__description" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t('modal.close')}>
            <CloseIcon size={16} />
          </button>
        </header>

        <div className="modal__body">{children}</div>

        {footer ? <footer className="modal__footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}
