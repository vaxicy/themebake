/**
 * Lightweight toast notifications.
 *
 * Replaces `alert()` for every user-facing status message. Toasts are announced
 * through an `aria-live` region so screen readers pick them up, and they stack
 * bottom-centre with a hard cap so the UI can never be flooded.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { CheckIcon, CloseIcon, InfoIcon, WarningIcon } from './Icons.jsx'

const ToastContext = createContext(null)

const MAX_TOASTS = 4
const DEFAULT_DURATION = 3600

const ICONS = {
  success: CheckIcon,
  error: WarningIcon,
  info: InfoIcon,
}

export function ToastProvider({ children }) {
  const { t } = useI18n()
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())
  const counter = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message, variant = 'info', duration = DEFAULT_DURATION) => {
      // De-duplicate identical consecutive messages (e.g. holding a key in the
      // hex field) so the stack does not fill with repeats.
      const id = ++counter.current
      setToasts((current) => {
        if (current.length && current[current.length - 1].message === message) {
          return current
        }
        const next = [...current, { id, message, variant }]
        return next.slice(-MAX_TOASTS)
      })

      if (duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), duration)
        timers.current.set(id, timer)
      }
      return id
    },
    [dismiss],
  )

  // Clear every pending timer on unmount to avoid setState-after-unmount.
  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((timer) => window.clearTimeout(timer))
      map.clear()
    }
  }, [])

  const api = useMemo(
    () => ({
      toast: push,
      success: (m, d) => push(m, 'success', d),
      error: (m, d) => push(m, 'error', d),
      info: (m, d) => push(m, 'info', d),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="region" aria-label={t('toast.region')}>
        <div aria-live="polite" aria-atomic="false" className="toast-stack">
          {toasts.map((toast) => {
            const Icon = ICONS[toast.variant] ?? InfoIcon
            return (
              <div key={toast.id} className={`toast toast--${toast.variant}`} role="status">
                <span className="toast__icon" aria-hidden="true">
                  <Icon size={16} />
                </span>
                <span className="toast__message">{toast.message}</span>
                <button
                  type="button"
                  className="toast__close"
                  onClick={() => dismiss(toast.id)}
                  aria-label={t('toast.dismiss', { message: toast.message })}
                >
                  <CloseIcon size={14} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

/** @returns {{toast:Function, success:Function, error:Function, info:Function, dismiss:Function}} */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>.')
  return context
}
