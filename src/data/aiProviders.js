/**
 * AI naming providers + the shape of the AI naming settings.
 *
 * Every supported backend speaks the OpenAI Chat Completions API, so the whole
 * integration is one endpoint (`{baseURL}/chat/completions`) and a bearer key —
 * there is no per-provider client. The table below only supplies the defaults a
 * human would otherwise have to look up: a base URL and a starter model.
 *
 * Browser reachability matters here and is not uniform: SiliconFlow, OpenRouter
 * and a local Ollama all send the CORS headers a static page needs, whereas
 * OpenAI's own host deliberately does not and must be reached through a proxy
 * the user supplies as a custom base URL. That is why "custom" exists.
 *
 * Provider labels are brand names and stay untranslated on purpose.
 */

export const AI_PROVIDERS = [
  {
    id: 'siliconflow',
    label: 'SiliconFlow · 硅基流动',
    baseURL: 'https://api.siliconflow.cn/v1',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  {
    // Openai's own host refuses browser cross-origin requests, so this preset
    // only works once the URL is pointed at a proxy. `needsProxy` drives the
    // warning in the panel — it is not a guess, it is why the field exists.
    id: 'openai',
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    needsProxy: true,
  },
  {
    // Google ships an OpenAI-compatible layer, so Gemini needs no special client.
    // The base URL already ends in `/openai`; the standard `/chat/completions`
    // suffix is appended by `requestThemeNames`.
    id: 'gemini',
    label: 'Gemini · Google',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
  },
  {
    id: 'moonshot',
    label: 'Moonshot · 月之暗面',
    baseURL: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
  },
  {
    id: 'zhipu',
    label: 'Zhipu GLM · 智谱',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
  },
  {
    id: 'ollama',
    label: 'Ollama · local',
    baseURL: 'http://localhost:11434/v1',
    defaultModel: 'qwen2.5',
  },
  { id: 'custom', label: 'Custom · OpenAI-compatible', baseURL: '', defaultModel: '' },
]

export const AI_PROVIDER_IDS = AI_PROVIDERS.map((provider) => provider.id)

export const AI_PROVIDER_BY_ID = Object.fromEntries(AI_PROVIDERS.map((p) => [p.id, p]))

/** Creative directions the prompt can steer towards. */
export const AI_STYLES = ['auto', 'elegant', 'minimal', 'cute', 'tech', 'nature', 'retro', 'dreamy']

/**
 * Language the *names* come back in. There is deliberately no `auto`/"follow the
 * interface" option: a Chinese UI produced pinyin slugs like
 * `huo-ba-yue-ya-theme`, which is never what someone wants in a filename, and
 * "English UI, English names" is the only pairing that surprises nobody.
 */
export const AI_LANGUAGES = ['en', 'zh']

export const AI_CANDIDATE_COUNTS = [3, 4, 5, 6]

export const AI_TEMPERATURE = { min: 0.6, max: 1.3, step: 0.1 }

/**
 * Everything except the key is a plain preference. `rememberKey` is off by
 * default: the key then lives only in `sessionStorage` and is gone when the tab
 * closes, which is the safer default for a value the user pastes once.
 */
export const DEFAULT_AI_CONFIG = {
  providerId: 'siliconflow',
  baseURL: AI_PROVIDER_BY_ID.siliconflow.baseURL,
  model: AI_PROVIDER_BY_ID.siliconflow.defaultModel,
  apiKey: '',
  rememberKey: false,
  temperature: 1,
  candidates: 5,
  style: 'auto',
  language: 'en',
}
