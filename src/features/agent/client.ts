/**
 * BYO-key Anthropic client — the single seam between the app and the model.
 *
 * The whole AI layer is additive and opt-in. With no key, `hasKey()` is false and
 * every AI affordance is *absent* (not disabled, not greyed — it does not render).
 * The SDK is imported lazily on the first call, so a no-key visitor never downloads
 * it: the base app stays byte-for-byte unchanged, bytes included.
 *
 * Calls go straight to api.anthropic.com from the browser — no backend, so the app
 * stays fully static. That is inherent to a serverless BYO-key design: the user's
 * key lives in their browser and the request is visible in devtools. Settings says
 * so plainly rather than implying a safety it can't offer.
 */

import { getSettings } from '#/lib/settings'
import type { ChatModel } from '#/features/prefs/prefs-repo'

const MODEL_IDS: Record<ChatModel, string> = {
  haiku: 'claude-haiku-4-5',
  sonnet: 'claude-sonnet-4-6',
}

/** One conversation turn. Kept deliberately minimal — text in, text out — so the
 *  app never leaks SDK types past this seam. Tool use (a later phase) extends it
 *  here, in one place. */
export type Msg = { role: 'user' | 'assistant'; content: string }

export interface CallParams {
  /** System prompt — typically the `/knowledge` prose for the feature. */
  system?: string
  messages: Msg[]
  /** Override the user's chosen model for this one call (e.g. rename forces Haiku). */
  model?: ChatModel
  maxTokens?: number
  signal?: AbortSignal
}

/** True when a key is present. The single gate every AI affordance checks before
 *  it renders. Synchronous on purpose — reads the hydrated in-memory mirror so the
 *  UI can decide *existence* without an async hop (no flash of AI UI). */
export function hasKey(): boolean {
  return getSettings().apiKey.trim().length > 0
}

/**
 * Stream a completion as text deltas. The SDK loads on first call only. Consumers
 * can collect the whole response (`collect`) or process deltas as they arrive and
 * stop early by breaking the loop.
 */
export async function* callAnthropic(
  params: CallParams,
): AsyncGenerator<string, void, unknown> {
  const settings = getSettings()
  const apiKey = settings.apiKey.trim()
  if (!apiKey) throw new Error('No Anthropic API key set')

  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const stream = client.messages.stream(
    {
      model: MODEL_IDS[params.model ?? settings.model],
      max_tokens: params.maxTokens ?? 256,
      ...(params.system ? { system: params.system } : {}),
      messages: params.messages,
    },
    { signal: params.signal },
  )

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }
}

/** Collect a streamed call into its full text. */
export async function collect(params: CallParams): Promise<string> {
  let out = ''
  for await (const chunk of callAnthropic(params)) out += chunk
  return out
}
