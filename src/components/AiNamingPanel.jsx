/**
 * AI naming controls — embedded directly under the theme name / folder name
 * fields, so the generated result sits next to the two inputs it fills instead
 * of in a separate panel further down the page.
 *
 * The component owns no logic: it renders the AI settings (provider / endpoint /
 * model / key / creativity), a button that asks for names, and the returned
 * candidates as clickable chips. Applying a chip writes **both** the theme name
 * and the folder name, which is the whole point — the two fields are generated
 * together and stay in step.
 *
 * The provider defaults live in `data/aiProviders.js`. Choosing a provider is
 * convenience only: it just prefills the base URL and model, and everything
 * stays editable, so any OpenAI-compatible endpoint works through the "custom"
 * entry or by editing the URL directly.
 *
 * The API key is the one value users are cautious about, so the copy is explicit:
 * it is stored only in this browser, and requests go straight to the provider.
 */

import {
  AI_CANDIDATE_COUNTS,
  AI_LANGUAGES,
  AI_PROVIDERS,
  AI_PROVIDER_BY_ID,
  AI_STYLES,
  AI_TEMPERATURE,
} from '../data/aiProviders.js'
import { useI18n } from '../i18n/index.jsx'
import { StarIcon } from './Icons.jsx'

export function AiNamingPanel({
  config,
  onChange,
  onSuggest,
  onApply,
  busy,
  candidates,
  appliedName,
}) {
  const { t } = useI18n()
  const hasKey = Boolean(config.apiKey)

  // A preset that blocks browser requests warns until the URL is actually
  // changed — so the message disappears the moment a proxy is filled in, rather
  // than nagging someone who already solved it.
  const needsProxy =
    Boolean(AI_PROVIDER_BY_ID[config.providerId]?.needsProxy) && /api\.openai\.com/.test(config.baseURL)

  const handleProvider = (providerId) => {
    const preset = AI_PROVIDER_BY_ID[providerId]
    onChange({
      providerId,
      baseURL: preset?.baseURL || config.baseURL,
      model: preset?.defaultModel || config.model,
    })
  }

  return (
    <section className="ai" aria-labelledby="ai-heading">
      <div className="ai__head">
        <h3 className="ai__label" id="ai-heading">
          {t('ai.title')}
        </h3>
        <span className={`status-chip ${hasKey ? 'status-chip--ok' : 'status-chip--error'}`}>
          {hasKey ? t('ai.statusReady') : t('ai.statusNoKey')}
        </span>
      </div>

      <button
        type="button"
        className="button button--soft ai__generate"
        onClick={onSuggest}
        disabled={busy}
        aria-busy={busy ? true : undefined}
      >
        <StarIcon size={16} />
        {busy ? t('ai.generating') : t('ai.generate')}
      </button>

      {candidates.length ? (
        <div className="ai__candidates">
          <span className="ai__candidates-legend">{t('ai.pickOne')}</span>
          <ul className="ai__candidate-list">
            {candidates.map((candidate) => {
              const isActive = candidate.name === appliedName
              return (
                <li key={candidate.name}>
                  <button
                    type="button"
                    className={`ai__candidate${isActive ? ' is-active' : ''}`}
                    onClick={() => onApply(candidate)}
                    aria-pressed={isActive}
                    title={candidate.reason || undefined}
                  >
                    <span className="ai__candidate-name">{candidate.name}</span>
                    <span className="ai__candidate-folder">{candidate.folder}</span>
                    {candidate.vibe ? (
                      <span className="ai__candidate-vibe">{candidate.vibe}</span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <details className="ai__settings">
        <summary className="ai__settings-summary">{t('ai.settingsSummary')}</summary>

        <div className="ai__settings-body">
          <div className="field field--compact">
            <label className="field__label" htmlFor="ai-provider">
              {t('ai.provider')}
            </label>
            <select
              id="ai-provider"
              className="select-input"
              value={config.providerId}
              onChange={(event) => handleProvider(event.target.value)}
            >
              {AI_PROVIDERS.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field field--compact">
            <label className="field__label" htmlFor="ai-base-url">
              {t('ai.baseURL')}
            </label>
            <input
              id="ai-base-url"
              type="text"
              className="text-input"
              value={config.baseURL}
              placeholder="https://api.siliconflow.cn/v1"
              spellCheck="false"
              autoComplete="off"
              onChange={(event) => onChange({ baseURL: event.target.value })}
            />
            <p className="field__hint">{t('ai.baseURLHint')}</p>
            {needsProxy ? <p className="ai__warn">{t('ai.corsWarning')}</p> : null}
          </div>

          <div className="field field--compact">
            <label className="field__label" htmlFor="ai-model">
              {t('ai.model')}
            </label>
            <input
              id="ai-model"
              type="text"
              className="text-input"
              value={config.model}
              placeholder="Qwen/Qwen2.5-7B-Instruct"
              spellCheck="false"
              autoComplete="off"
              onChange={(event) => onChange({ model: event.target.value })}
            />
            <p className="field__hint">{t('ai.modelHint')}</p>
          </div>

          <div className="field field--compact">
            <label className="field__label" htmlFor="ai-api-key">
              {t('ai.apiKey')}
            </label>
            <input
              id="ai-api-key"
              type="password"
              className="text-input"
              value={config.apiKey}
              placeholder="sk-…"
              spellCheck="false"
              autoComplete="off"
              onChange={(event) => onChange({ apiKey: event.target.value })}
            />
            <p className="field__hint">{t('ai.apiKeyHint')}</p>
            <label className="switch ai__remember">
              <input
                type="checkbox"
                checked={config.rememberKey}
                onChange={(event) => onChange({ rememberKey: event.target.checked })}
              />
              <span className="switch__track">
                <span className="switch__thumb" />
              </span>
              <span className="switch__label">{t('ai.rememberKey')}</span>
            </label>
          </div>

          <div className="ai__row">
            <div className="field field--compact">
              <label className="field__label" htmlFor="ai-temperature">
                {t('ai.temperature')}
              </label>
              <input
                id="ai-temperature"
                type="range"
                className="ai__range"
                min={AI_TEMPERATURE.min}
                max={AI_TEMPERATURE.max}
                step={AI_TEMPERATURE.step}
                value={config.temperature}
                onChange={(event) => onChange({ temperature: Number(event.target.value) })}
              />
              <p className="field__hint">{t('ai.temperatureHint')}</p>
            </div>

            <div className="field field--compact">
              <label className="field__label" htmlFor="ai-candidates">
                {t('ai.candidates')}
              </label>
              <select
                id="ai-candidates"
                className="select-input"
                value={config.candidates}
                onChange={(event) => onChange({ candidates: Number(event.target.value) })}
              >
                {AI_CANDIDATE_COUNTS.map((count) => (
                  <option key={count} value={count}>
                    {t('ai.candidatesOption', { count })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ai__row">
            <div className="field field--compact">
              <label className="field__label" htmlFor="ai-style">
                {t('ai.style')}
              </label>
              <select
                id="ai-style"
                className="select-input"
                value={config.style}
                onChange={(event) => onChange({ style: event.target.value })}
              >
                {AI_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {t(`ai.style.${style}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field field--compact">
              <label className="field__label" htmlFor="ai-language">
                {t('ai.language')}
              </label>
              <select
                id="ai-language"
                className="select-input"
                value={config.language}
                onChange={(event) => onChange({ language: event.target.value })}
              >
                {AI_LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {t(`ai.lang.${language}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="ai__note">{t('ai.privacyNote')}</p>
        </div>
      </details>
    </section>
  )
}
