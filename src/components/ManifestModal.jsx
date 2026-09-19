/**
 * "Preview Manifest" modal.
 *
 * Shows the exact JSON that will be written into the ZIP, plus a live JSON.parse
 * check so advanced users can confirm the output is valid before downloading.
 * Offers Copy JSON and a manifest-only download for people who want to inspect
 * the file outside the ZIP.
 */

import { useMemo, useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { parseManifest } from '../utils/manifest.js'
import { downloadText } from '../utils/zip.js'
import { CheckIcon, CopyIcon, DownloadIcon, WarningIcon } from './Icons.jsx'
import { useToast } from './Toast.jsx'
import { Modal } from './Modal.jsx'

export function ManifestModal({ open, onClose, manifestJson, manifest, filename }) {
  const { t } = useI18n()
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  const validation = useMemo(() => parseManifest(manifestJson), [manifestJson])
  const keyCount = manifest?.manifest_version ? Object.keys(manifest.theme?.colors ?? {}).length : 0

  async function handleCopy() {
    try {
      // `navigator.clipboard` is unavailable on insecure origins and in some
      // embedded browsers, so fall back to a hidden textarea + execCommand.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(manifestJson)
      } else {
        fallbackCopy(manifestJson)
      }
      setCopied(true)
      toast.success(t('manifest.copiedToast'))
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      try {
        fallbackCopy(manifestJson)
        toast.success(t('manifest.copiedToast'))
      } catch {
        toast.error(t('manifest.copyFailed'))
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t('manifest.title')}
      description={t('manifest.description')}
      footer={
        <>
          <span className="modal__footer-note">
            {validation.ok ? (
              <>
                <span className="status-chip status-chip--ok">
                  <CheckIcon size={13} /> {t('manifest.validJson')}
                </span>
                <span className="modal__footer-note-text">
                  {t('manifest.summary', { count: keyCount, filename })}
                </span>
              </>
            ) : (
              <span className="status-chip status-chip--error">
                <WarningIcon size={13} /> {t('manifest.invalidJson')}
              </span>
            )}
          </span>

          <span className="modal__footer-actions">
            <button type="button" className="button button--ghost" onClick={onClose}>
              {t('app.close')}
            </button>
            <button
              type="button"
              className="button button--outline"
              onClick={() => downloadText(manifestJson, 'manifest.json')}
            >
              <DownloadIcon size={15} />
              {t('manifest.download')}
            </button>
            <button type="button" data-autofocus className="button button--primary" onClick={handleCopy}>
              {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
              {copied ? t('manifest.copied') : t('manifest.copy')}
            </button>
          </span>
        </>
      }
    >
      {validation.ok ? null : (
        <p className="modal__alert" role="alert">
          {t('manifest.parseFailed', { error: validation.error })}
        </p>
      )}
      <pre className="code-block" tabIndex={0} aria-label={t('manifest.codeAria')}>
        <code>{manifestJson}</code>
      </pre>
    </Modal>
  )
}

/** Legacy clipboard path for contexts without the async Clipboard API. */
function fallbackCopy(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-1000px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
  } finally {
    textarea.remove()
  }
}
