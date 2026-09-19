/**
 * One colour row: native picker + hex text field + swatch, kept in two-way sync.
 *
 * Behaviour contract:
 *  - Typing a *valid* hex updates the theme immediately (live preview).
 *  - Typing an *invalid* hex never throws and never writes garbage upstream; the
 *    field is marked `aria-invalid`, shows an inline message, and keeps the last
 *    valid colour in effect.
 *  - Blurring or pressing Enter with an invalid value restores the last good one.
 *  - The native picker and the text field always converge on the same value.
 */

import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { normalizeHex } from '../utils/color.js'

export function ColorField({ id, label, hint, value, onChange, onInvalid }) {
  const { t } = useI18n()
  const inputId = `${id}-hex`
  const pickerId = `${id}-picker`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const [draft, setDraft] = useState(value)
  const [invalid, setInvalid] = useState(false)
  const lastValid = useRef(value)

  // Keep the text field in sync when the value changes from the outside
  // (preset applied, randomise, reset, or another input) — but never fight the
  // user while they are mid-edit in this very field.
  useEffect(() => {
    if (normalizeHex(draft) !== null && normalizeHex(draft) !== value) {
      setDraft(value)
      setInvalid(false)
      lastValid.current = value
      return
    }
    if (normalizeHex(draft) === null) {
      // Draft is malformed and the upstream value moved on: adopt the new value.
      setDraft(value)
      setInvalid(false)
      lastValid.current = value
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function commit(next) {
    const normalized = normalizeHex(next)
    if (normalized) {
      lastValid.current = normalized
      setInvalid(false)
      if (normalized !== value) onChange(normalized)
      return true
    }
    setInvalid(true)
    onInvalid?.(label)
    return false
  }

  function handleTextChange(event) {
    const next = event.target.value
    setDraft(next)
    // Live commit while typing so the preview keeps up, but only when the value
    // is already a complete, valid colour.
    if (normalizeHex(next)) commit(next)
    else setInvalid(next.trim().length > 0)
  }

  function handleBlur() {
    if (normalizeHex(draft)) {
      setDraft(normalizeHex(draft))
      setInvalid(false)
      return
    }
    // Report once on blur rather than on every keystroke, so the user is not
    // spammed while typing "#B1B2F".
    if (draft.trim().length > 0) onInvalid?.(label)
    // Restore last good value instead of leaving the field broken.
    setDraft(lastValid.current)
    setInvalid(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleBlur()
      event.currentTarget.blur()
    }
  }

  return (
    <div className="color-field">
      <div className="color-field__main">
        <span className="color-field__swatch" style={{ backgroundColor: normalizeHex(value) ?? '#000000' }} aria-hidden="true" />

        <div className="color-field__meta">
          <label className="color-field__label" htmlFor={inputId}>
            {label}
          </label>
          {hint ? (
            <span className="color-field__hint" id={hintId}>
              {hint}
            </span>
          ) : null}
        </div>

        <div className="color-field__controls">
          <input
            id={pickerId}
            type="color"
            className="color-field__picker"
            value={normalizeHex(value) ?? '#000000'}
            onChange={(e) => {
              const next = e.target.value
              setDraft(next)
              commit(next)
            }}
            aria-label={t('colorField.pickerAria', { label })}
            aria-describedby={hint ? hintId : undefined}
          />

          <input
            id={inputId}
            type="text"
            className={`color-field__hex${invalid ? ' is-invalid' : ''}`}
            value={draft}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            spellCheck="false"
            autoComplete="off"
            inputMode="text"
            maxLength={7}
            aria-invalid={invalid || undefined}
            aria-label={t('colorField.hexAria', { label })}
            aria-describedby={[hint ? hintId : null, invalid ? errorId : null].filter(Boolean).join(' ') || undefined}
          />
        </div>
      </div>

      {invalid ? (
        <p className="color-field__error" id={errorId} role="status">
          {t('colorField.invalid')}
        </p>
      ) : null}
    </div>
  )
}
