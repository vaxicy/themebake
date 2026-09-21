/**
 * Workspace mode switch — Chrome theme vs VS Code theme.
 *
 * A two-option tab list above the workspace. Each mode owns a completely
 * separate workbench (its own draft, preview and export), so switching never
 * mixes state; the switcher is the only shared surface.
 */

import { useI18n } from '../i18n/index.jsx'

export const EDITOR_MODES = [
  { id: 'chrome', labelKey: 'mode.chrome' },
  { id: 'vscode', labelKey: 'mode.vscode' },
]

export function ModeSwitcher({ mode, onChange }) {
  const { t } = useI18n()

  return (
    <div className="mode-switch" role="tablist" aria-label={t('mode.aria')}>
      {EDITOR_MODES.map((entry) => {
        const active = entry.id === mode
        return (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`mode-switch__tab${active ? ' is-active' : ''}`}
            onClick={() => onChange(entry.id)}
          >
            {t(entry.labelKey)}
          </button>
        )
      })}
    </div>
  )
}
