/**
 * Presets + Randomize panel.
 *
 * Presets are only a starting point: applying one overwrites the colours, after
 * which every field stays fully editable. Randomize produces a *coordinated*
 * palette (see `generateRandomColors`) rather than 14 independent RGB values.
 *
 * Names and descriptions are looked up by preset id (`preset.<id>.name`), so a
 * new locale only needs dictionary entries — no component change.
 */

import { PRESETS } from '../data/presets.js'
import { useI18n } from '../i18n/index.jsx'
import { normalizeHex } from '../utils/color.js'
import { DiceIcon } from './Icons.jsx'

function PresetSwatch({ colors }) {
  // Show the four colours that best communicate the preset at a glance.
  const keys = ['frame', 'backgroundTab', 'toolbar', 'ntpLink']
  return (
    <span className="preset__swatch" aria-hidden="true">
      {keys.map((key) => (
        <span key={key} style={{ backgroundColor: normalizeHex(colors[key]) ?? '#000000' }} />
      ))}
    </span>
  )
}

export function PresetsPanel({ activePresetId, onApplyPreset, onRandomize }) {
  const { t } = useI18n()

  return (
    <section className="panel" aria-labelledby="presets-heading">
      <div className="panel__header">
        <div>
          <h2 className="panel__title" id="presets-heading">
            {t('presets.title')}
          </h2>
          <p className="panel__subtitle">{t('presets.subtitle')}</p>
        </div>
        <button
          type="button"
          className="button button--soft"
          onClick={onRandomize}
          aria-label={t('presets.randomizeAria')}
        >
          <DiceIcon size={16} />
          {t('presets.randomize')}
        </button>
      </div>

      <ul className="preset-grid">
        {PRESETS.map((preset) => {
          const isActive = preset.id === activePresetId
          return (
            <li key={preset.id}>
              <button
                type="button"
                className={`preset${isActive ? ' is-active' : ''}`}
                onClick={() => onApplyPreset(preset.id)}
                aria-pressed={isActive}
              >
                <PresetSwatch colors={preset.colors} />
                <span className="preset__text">
                  <span className="preset__name">{t(`preset.${preset.id}.name`)}</span>
                  <span className="preset__description">{t(`preset.${preset.id}.description`)}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
