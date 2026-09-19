/**
 * Smart palette studio — "pick one colour, get a whole theme".
 *
 * The panel is deliberately thin: all of the thinking lives in
 * `utils/palette.js`. This component only collects the seed + options, renders
 * a **live preview of the derived roles** (so the user sees the result before
 * committing), and hands the request up to `App`.
 *
 * Why preview here and not just apply-on-change: the derived theme overwrites
 * every colour the user may have hand-edited. Preview-then-apply keeps that
 * destructive step explicit, which matches how Presets already behave.
 */

import { useMemo } from 'react'
import { INTENSITIES, SOLVER_MODES, solveTheme } from '../utils/palette.js'
import { useI18n } from '../i18n/index.jsx'
import { ColorField } from './ColorField.jsx'
import { SwatchIcon } from './Icons.jsx'

/** The roles shown in the preview strip — the six that read as "the theme". */
const STRIP_ROLES = ['frame', 'toolbar', 'omniboxBackground', 'ntpBackground', 'ntpText', 'ntpLink']

export function PaletteStudio({
  seed,
  mode,
  intensity,
  onSeedChange,
  onModeChange,
  onIntensityChange,
  onGenerate,
  onInvalidSeed,
}) {
  const { t } = useI18n()

  // Deterministic and cheap (14 HSL derivations), so recomputing on every change
  // is fine and keeps the strip honest — it is literally the solve result.
  const preview = useMemo(
    () => solveTheme({ seeds: seed ? [seed] : [], mode, intensity }),
    [seed, mode, intensity],
  )

  return (
    <section className="panel studio" aria-labelledby="studio-heading">
      <div className="panel__header">
        <div className="studio__heading">
          <span className="studio__heading-icon" aria-hidden="true">
            <SwatchIcon size={17} />
          </span>
          <div>
            <h2 className="panel__title" id="studio-heading">
              {t('studio.title')}
            </h2>
            <p className="panel__subtitle">{t('studio.subtitle')}</p>
          </div>
        </div>
      </div>

      <ColorField
        id="studio-seed"
        label={t('studio.seedLabel')}
        hint={t('studio.seedHint')}
        value={seed}
        onChange={onSeedChange}
        onInvalid={onInvalidSeed}
      />

      <div className="studio__options">
        <fieldset className="studio__fieldset">
          <legend className="studio__legend">{t('studio.modeLegend')}</legend>
          <div className="segmented segmented--three" role="radiogroup" aria-label={t('studio.modeLegend')}>
            {SOLVER_MODES.map((option) => (
              <label
                key={option}
                className={`segmented__option${mode === option ? ' is-active' : ''}`}
              >
                <input
                  type="radio"
                  name="studio-mode"
                  value={option}
                  checked={mode === option}
                  onChange={() => onModeChange(option)}
                />
                <span className="segmented__label">{t(`studio.mode.${option}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="studio__fieldset">
          <legend className="studio__legend">{t('studio.intensityLegend')}</legend>
          <div
            className="segmented segmented--three"
            role="radiogroup"
            aria-label={t('studio.intensityLegend')}
          >
            {INTENSITIES.map((option) => (
              <label
                key={option}
                className={`segmented__option${intensity === option ? ' is-active' : ''}`}
              >
                <input
                  type="radio"
                  name="studio-intensity"
                  value={option}
                  checked={intensity === option}
                  onChange={() => onIntensityChange(option)}
                />
                <span className="segmented__label">{t(`studio.intensity.${option}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {preview.ok ? (
        <div className="studio__result">
          <span className="studio__result-legend">{t('studio.resultLegend')}</span>
          <span className="studio__strip">
            {STRIP_ROLES.map((role) => (
              <span
                key={role}
                className="studio__strip-swatch"
                style={{ backgroundColor: preview.colors[role] }}
                title={t(`field.${role}.label`)}
              />
            ))}
          </span>
        </div>
      ) : null}

      {preview.ok && preview.notes.length ? (
        <ul className="studio__notes">
          {preview.notes.map((note, index) => (
            <li key={`${note.key}-${index}`}>{t(note.key, note.vars)}</li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        className="button button--primary studio__generate"
        onClick={onGenerate}
        disabled={!preview.ok}
      >
        <SwatchIcon size={16} />
        {t('studio.generate')}
      </button>
    </section>
  )
}
