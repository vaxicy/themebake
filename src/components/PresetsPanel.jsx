/**
 * Presets + Randomize panel.
 *
 * Presets are only a starting point: applying one overwrites the colours, after
 * which every field stays fully editable. Randomize produces a *coordinated*
 * palette rather than independent RGB values.
 *
 * The panel is shared by both workbenches: the Chrome workbench passes its
 * presets, the VS Code workbench the extracted `VSCODE_PRESETS`. Presets may
 * carry their own `displayName`/`displayDescription` (proper nouns from the
 * source themes); otherwise names come from the dictionary by id
 * (`preset.<id>.name`), so a new locale only needs dictionary entries.
 */

import { PRESETS } from '../data/presets.js'
import { useI18n } from '../i18n/index.jsx'
import { normalizeHex } from '../utils/color.js'
import { DiceIcon } from './Icons.jsx'

function PresetSwatch({ colors, keys }) {
  // Show the four colours that best communicate the preset at a glance.
  return (
    <span className="preset__swatch" aria-hidden="true">
      {keys.map((key) => (
        <span key={key} style={{ backgroundColor: normalizeHex(colors[key]) ?? '#000000' }} />
      ))}
    </span>
  )
}

export function PresetsPanel({
  activePresetId,
  presets = PRESETS,
  swatchKeys = ['frame', 'backgroundTab', 'toolbar', 'ntpLink'],
  onApplyPreset,
  onRandomize,
}) {
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
        {presets.map((preset) => {
          const isActive = preset.id === activePresetId
          return (
            <li key={preset.id}>
              <button
                type="button"
                className={`preset${isActive ? ' is-active' : ''}`}
                onClick={() => onApplyPreset(preset.id)}
                aria-pressed={isActive}
              >
                <PresetSwatch colors={preset.colors} keys={swatchKeys} />
                <span className="preset__text">
                  <span className="preset__name">
                    {/*
                      Presets that carry their own copy (the VS Code themes
                      extracted from real extensions) use it verbatim; the
                      Chrome presets are dictionary-driven by id.
                    */}
                    {preset.name ?? t(`preset.${preset.id}.name`)}
                  </span>
                  <span className="preset__description">
                    {preset.description ?? t(`preset.${preset.id}.description`)}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
