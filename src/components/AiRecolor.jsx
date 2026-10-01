import { useState } from 'react'

import { useI18n } from '../i18n/index.jsx'
import { StarIcon } from './Icons.jsx'

/** Long enough for a sentence with two or three colours in it. */
const MAX_INSTRUCTION = 280

/**
 * "Tell it what to change" — a sentence, applied to the palette.
 *
 * Not a second palette solver: the studio next to it derives a whole theme from one
 * colour, deterministically and predictably. This is for the requests a solver
 * cannot take — "warm it up", "the status bar should be deep green, keep everything
 * else" — where the useful answer is a handful of specific colours rather than a
 * new family. The two sit together because they answer the same question ("make
 * this look different") in two registers.
 *
 * The component owns nothing but the sentence being typed: the request, the
 * validation and the undo step all belong to the workbench, which is the only
 * thing that knows what fields exist and how the pair mirrors.
 *
 * @param {object} props
 * @param {(instruction: string) => Promise<boolean>} props.onRun resolves true when
 *   the palette changed, which is when the box clears itself
 * @param {boolean} [props.busy] a request is in flight
 * @param {boolean} [props.hasKey] an API key is configured
 */
export function AiRecolor({ onRun, busy = false, hasKey = true }) {
  const { t } = useI18n()
  const [instruction, setInstruction] = useState('')
  const canRun = Boolean(instruction.trim()) && !busy && hasKey

  const submit = async (event) => {
    event.preventDefault()
    if (!canRun) return
    const applied = await onRun(instruction.trim())
    // Cleared on success only: a failed request keeps the sentence so it can be
    // retried or edited instead of being retyped.
    if (applied) setInstruction('')
  }

  return (
    <section className="panel recolor" aria-labelledby="recolor-heading">
      <div className="panel__header">
        <div>
          <h2 className="panel__title" id="recolor-heading">
            {t('recolor.title')}
          </h2>
          <p className="panel__subtitle">{t('recolor.subtitle')}</p>
        </div>
      </div>

      <form className="recolor__form" onSubmit={submit}>
        <label className="field__label" htmlFor="recolor-instruction">
          {t('recolor.label')}
        </label>
        <textarea
          id="recolor-instruction"
          className="text-input recolor__input"
          rows={2}
          value={instruction}
          maxLength={MAX_INSTRUCTION}
          placeholder={t('recolor.placeholder')}
          spellCheck="false"
          onChange={(event) => setInstruction(event.target.value)}
        />
        <button type="submit" className="button button--primary" disabled={!canRun}>
          <StarIcon size={15} />
          {busy ? t('recolor.busy') : t('recolor.button')}
        </button>
      </form>

      <p className="field__hint">{hasKey ? t('recolor.hint') : t('recolor.needsKey')}</p>
    </section>
  )
}
