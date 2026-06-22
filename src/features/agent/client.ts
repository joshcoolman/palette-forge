/**
 * Anthropic client factory. Direct browser → Anthropic: the key is stored only
 * in this browser and sent only to the provider (this is what keeps hosting
 * free). `dangerouslyAllowBrowser` makes the SDK add the
 * `anthropic-dangerous-direct-browser-access` header itself.
 */

import Anthropic from '@anthropic-ai/sdk'

export function makeClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}
