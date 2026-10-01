/**
 * The one AI call every feature shares.
 *
 * One backend shape only: OpenAI-compatible `POST {baseURL}/chat/completions`.
 * That covers SiliconFlow and every other "OpenAI-compatible" host, so there is no
 * provider-specific code, just a configurable base URL.
 *
 * Everything about the transport — validation, timeout, abort, and the HTTP status
 * → i18n-key mapping — lives here so the naming, the summary and the recolouring
 * paths cannot drift apart in how they fail.
 *
 * Failure is non-fatal by contract: every error carries an i18n key in `.key`
 * rather than a display string, so this module stays free of UI text.
 */

/** An error the UI can translate: `.key` is an i18n key, never a message. */
export class AiNamingError extends Error {
  constructor(key) {
    super(key)
    this.name = 'AiNamingError'
    this.key = key
  }
}

/** @returns {string} an i18n key for a failed HTTP status. */
function httpErrorKey(status) {
  if (status === 401) return 'ai.errorUnauthorized'
  if (status === 403) return 'ai.errorForbidden'
  if (status === 404) return 'ai.errorNotFound'
  if (status === 429) return 'ai.errorRateLimited'
  if (status >= 500) return 'ai.errorServer'
  return 'ai.errorUnknown'
}

/**
 * @param {object} config baseURL / model / apiKey / temperature
 * @param {{system: string, user: string, maxTokens: number}} prompt
 * @param {object} [options]
 * @param {typeof fetch} [options.fetchImpl] injectable for tests
 * @param {AbortSignal} [options.signal] caller cancellation
 * @param {number} [options.timeoutMs=30000]
 * @returns {Promise<string>} the assistant message content
 * @throws {AiNamingError} `.key` is an i18n key
 */
export async function chatCompletion(config, { system, user, maxTokens }, options = {}) {
  const { fetchImpl = fetch, signal, timeoutMs = 30000 } = options

  const base = String(config?.baseURL ?? '').trim().replace(/\/+$/, '')
  if (!base) throw new AiNamingError('ai.errorNoBase')
  if (!String(config?.model ?? '').trim()) throw new AiNamingError('ai.errorNoModel')
  if (!String(config?.apiKey ?? '').trim()) throw new AiNamingError('ai.errorNoKey')

  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const onAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onAbort, { once: true })
  }

  let response
  try {
    response = await fetchImpl(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${String(config.apiKey).trim()}`,
      },
      body: JSON.stringify({
        model: String(config.model).trim(),
        temperature: Number.isFinite(config.temperature) ? config.temperature : 1,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: controller.signal,
    })
  } catch (error) {
    if (timedOut) throw new AiNamingError('ai.errorTimeout')
    if (signal?.aborted) throw new AiNamingError('ai.errorTimeout')
    // A CORS rejection and an offline network both surface as TypeError here.
    throw new AiNamingError('ai.errorNetwork')
  } finally {
    clearTimeout(timer)
    if (signal) signal.removeEventListener('abort', onAbort)
  }

  if (!response.ok) throw new AiNamingError(httpErrorKey(response.status))

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new AiNamingError('ai.errorParse')
  }

  const content = payload?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new AiNamingError('ai.errorParse')
  }
  return content
}

/**
 * Pull a JSON object out of whatever the model returned (fences and prose
 * tolerated). Shared by every parser so one tolerant reader serves them all.
 *
 * @param {unknown} text
 * @returns {unknown|null}
 */
export function extractJson(text) {
  const raw = String(text ?? '').trim()
  if (!raw) return null

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fenced ? fenced[1].trim() : raw

  try {
    return JSON.parse(body)
  } catch {
    /* fall through to a brace scan */
  }

  const objectish = body.match(/\{[\s\S]*\}/)
  if (objectish) {
    try {
      return JSON.parse(objectish[0])
    } catch {
      return null
    }
  }
  return null
}
