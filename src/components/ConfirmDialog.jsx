/**
 * Confirmation dialog — used before Reset destroys the current palette.
 * A custom modal, never `window.confirm()`.
 *
 * Copy is passed in (already translated) rather than looked up here, so the
 * same primitive can confirm any future destructive action.
 */

import { useI18n } from '../i18n/index.jsx'
import { Modal } from './Modal.jsx'

export function ConfirmDialog({
  open,
  title,
  description,
  bodyKey = 'confirm.reset.body',
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useI18n()

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <button type="button" className="button button--ghost" onClick={onCancel}>
            {cancelLabel ?? t('confirm.cancel')}
          </button>
          <button
            type="button"
            data-autofocus
            className={destructive ? 'button button--danger' : 'button button--primary'}
            onClick={onConfirm}
          >
            {confirmLabel ?? t('app.close')}
          </button>
        </>
      }
    >
      <p className="confirm__body">{t(bodyKey)}</p>
    </Modal>
  )
}
