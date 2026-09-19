/**
 * Import panel — one entry point for every way a user can bring colours in.
 *
 * Accepted inputs, auto-detected (no mode switch to get wrong):
 *   1. Pasted hex / rgb() text                        -> palette  -> solver
 *   2. A Coolors / Adobe Color link (parsed as text)  -> palette  -> solver
 *   3. A Chrome manifest or a ThemeBake export       -> direct field mapping
 *   4. An image: file picker, drag & drop, or Ctrl+V  -> palette  -> solver
 *
 * Two very different outcomes, deliberately:
 *   - **Palette** input is a *set of colours with no roles*, so it is handed to
 *     `solveTheme` — the same engine behind the smart palette studio. That is
 *     what "maps it onto Chrome roles" means in the panel subtitle.
 *   - **Manifest** input already names its roles, so it is applied verbatim to
 *     the matching fields. Running a solver over it would silently discard the
 *     user's own role choices.
 *
 * Privacy: images never leave the page. Extraction uses a local `<canvas>`; the
 * panel performs no fetch of any kind, including for links (see `parseColors`).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { extractColors, looksLikeJson, looksLikePaletteUrl } from '../utils/parseColors.js'
import { importThemeJson } from '../utils/importTheme.js'
import { extractPaletteFromImage } from '../utils/image.js'
import { useI18n } from '../i18n/index.jsx'
import { ImageIcon, TrashIcon, UploadIcon, WarningIcon } from './Icons.jsx'

/** The palette card from the brief — a realistic one-paste demo. */
export const EXAMPLE_PALETTE = '#FFF5F5  #F7D6D0  #E2B4BD  #4A4A4A'

const TEXT_FILE_RE = /\.(json|txt|md|csv)$/i

/** Pure: decide what a block of pasted text contains. */
function analyseText(value) {
  const trimmed = value.trim()
  if (!trimmed) return { kind: 'empty' }

  if (looksLikeJson(trimmed)) {
    const result = importThemeJson(trimmed)
    if (!result.ok) return { kind: 'error', error: result.error }
    // NOTE: the spread must come first — `importThemeJson` returns its own `kind`
    // describing the *shape* it found (manifest / themebake / bare), which is
    // kept as `sourceKind`. The UI-level discriminator below is always 'theme'.
    return { ...result, sourceKind: result.kind, kind: 'theme' }
  }

  const colors = extractColors(trimmed)
  if (!colors.length) return { kind: 'error', error: 'import.errorNoColors' }

  return { kind: 'palette', colors, fromUrl: looksLikePaletteUrl(trimmed) }
}

export function ImportPanel({ onApplyPalette, onApplyManifest }) {
  const { t } = useI18n()
  const fileInputRef = useRef(null)

  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  /** Hexes the user struck out of a detected palette (order-independent). */
  const [removed, setRemoved] = useState(() => new Set())

  const analysis = useMemo(() => image ?? analyseText(text), [image, text])

  const reset = useCallback(() => {
    setText('')
    setImage(null)
    setRemoved(new Set())
  }, [])

  const handleTextChange = useCallback((value) => {
    setText(value)
    setImage(null)
    setRemoved(new Set())
  }, [])

  const handleImageFile = useCallback(async (file) => {
    setBusy(true)
    try {
      const result = await extractPaletteFromImage(file)
      setImage(result.ok ? { ...result, kind: 'palette' } : { kind: 'error', error: result.error })
      setText('')
      setRemoved(new Set())
    } finally {
      setBusy(false)
    }
  }, [])

  const handleFiles = useCallback(
    async (fileList) => {
      const file = fileList?.[0]
      if (!file) return

      const isImage = file.type ? file.type.startsWith('image/') : false
      if (isImage) {
        await handleImageFile(file)
        return
      }

      const isText =
        !file.type ||
        file.type.startsWith('text/') ||
        file.type === 'application/json' ||
        TEXT_FILE_RE.test(file.name)

      if (!isText) {
        setImage({ kind: 'error', error: 'import.errorBadFile' })
        return
      }

      try {
        const content = await file.text()
        handleTextChange(content)
      } catch {
        setImage({ kind: 'error', error: 'import.errorBadFile' })
      }
    },
    [handleImageFile, handleTextChange],
  )

  // Ctrl+V of a screenshot anywhere on the page. Pasting *text* is left to the
  // textarea's own onChange so the user can still see and edit what they pasted.
  useEffect(() => {
    function onPaste(event) {
      const items = event.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            event.preventDefault()
            void handleImageFile(file)
            return
          }
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleImageFile])

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    void handleFiles(event.dataTransfer?.files)
  }

  function toggleRemoved(hex) {
    setRemoved((current) => {
      const next = new Set(current)
      if (next.has(hex)) next.delete(hex)
      else next.add(hex)
      return next
    })
  }

  const isPalette = analysis.kind === 'palette'
  /**
   * The detected palette as plain hex strings, with struck-out colours removed.
   *
   * Image extraction yields `{ hex, share }` objects while text yields strings, so
   * this normalises both to `string[]` — which is what `solveTheme` documents and
   * what `onApplyPalette` promises. Passing the objects straight through used to
   * make every image import fail with "no colours found", because the solver's
   * `normalizeSeeds` expects strings and silently drops anything else.
   */
  const visiblePalette = useMemo(() => {
    if (!isPalette) return []
    return (analysis.colors ?? [])
      .map((color) => (typeof color === 'string' ? color : color?.hex))
      .filter((hex) => typeof hex === 'string' && hex && !removed.has(hex))
  }, [isPalette, analysis, removed])

  function handleApply() {
    if (analysis.kind === 'theme') {
      onApplyManifest({ colors: analysis.colors, name: analysis.name, deadKeys: analysis.deadKeys })
      reset()
      return
    }
    if (!isPalette) return
    if (!visiblePalette.length) return
    onApplyPalette(visiblePalette)
    reset()
  }

  const canApply = analysis.kind === 'theme' || (isPalette && visiblePalette.length > 0)

  return (
    <section className="panel import-panel" aria-labelledby="import-heading">
      <div className="panel__header">
        <div className="studio__heading">
          <span className="studio__heading-icon" aria-hidden="true">
            <UploadIcon size={17} />
          </span>
          <div>
            <h2 className="panel__title" id="import-heading">
              {t('import.title')}
            </h2>
            <p className="panel__subtitle">{t('import.subtitle')}</p>
          </div>
        </div>
      </div>

      <div
        className={`import__drop${dragging ? ' is-dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <textarea
          className="text-input import__textarea"
          rows={3}
          value={text}
          placeholder={t('import.placeholder')}
          spellCheck="false"
          autoComplete="off"
          onChange={(event) => handleTextChange(event.target.value)}
          aria-label={t('import.title')}
        />

        <div className="import__actions">
          <button
            type="button"
            className="button button--outline button--sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            <ImageIcon size={15} />
            {busy ? t('import.analyzing') : t('import.pickImage')}
          </button>

          <button
            type="button"
            className="button button--ghost button--sm"
            onClick={() => handleTextChange(EXAMPLE_PALETTE)}
          >
            {t('import.example')}
          </button>

          <span className="import__hint">{t('import.imageHint', { shortcut: t('import.shortcut') })}</span>

          <input
            ref={fileInputRef}
            type="file"
            className="u-visually-hidden"
            accept="image/*,.json,.txt"
            onChange={(event) => {
              void handleFiles(event.target.files)
              // Allow re-selecting the same file straight away.
              event.target.value = ''
            }}
          />
        </div>

        {dragging ? <p className="import__drop-overlay">{t('import.dropHint')}</p> : null}
      </div>

      {analysis.kind === 'error' ? (
        <p className="import__error" role="alert">
          <WarningIcon size={14} />
          {t(analysis.error)}
        </p>
      ) : null}

      {analysis.kind === 'theme' ? (
        <>
          <p className="import__note" role="status">
            {analysis.name
              ? t('import.foundManifest', { name: analysis.name })
              : t('import.foundTheme', { count: Object.keys(analysis.colors).length })}
          </p>
          <ul className="import__swatches">
            {Object.entries(analysis.colors).map(([fieldId, hex]) => (
              <li key={fieldId} className="import__swatch import__swatch--fixed">
                <span className="import__swatch-chip" style={{ backgroundColor: hex }} />
                <span className="import__swatch-text">
                  <span className="import__swatch-hex">{hex}</span>
                  <span className="import__swatch-role">{t(`field.${fieldId}.label`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {isPalette ? (
        <>
          <p className="import__note" role="status">
            {t('import.detected', { count: visiblePalette.length })}
            {analysis.strategy === 'bands' ? ` ${t('import.sourceBands')}` : null}
            {analysis.strategy === 'clusters' ? ` ${t('import.sourceClusters')}` : null}
            {analysis.fromUrl ? ` ${t('import.sourceUrl')}` : null}
          </p>

          <ul className="import__swatches">
            {visiblePalette.map((hex) => (
              <li key={hex} className="import__swatch">
                <span className="import__swatch-chip" style={{ backgroundColor: hex }} />
                <span className="import__swatch-hex">{hex}</span>
                <button
                  type="button"
                  className="import__swatch-remove"
                  onClick={() => toggleRemoved(hex)}
                  aria-label={t('import.removeSwatch', { hex })}
                >
                  <TrashIcon size={13} />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <div className="import__footer">
        <button
          type="button"
          className="button button--primary"
          onClick={handleApply}
          disabled={!canApply || busy}
        >
          {t('import.apply')}
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={reset}
          disabled={analysis.kind === 'empty' && !text && !image}
        >
          {t('import.clear')}
        </button>
      </div>
    </section>
  )
}
