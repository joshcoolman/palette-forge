/**
 * Resolves the active engine from settings: a key present -> the real
 * ClaudeEngine; no key -> the deterministic SimulatedEngine (the no-key demo
 * and fallback). Synchronous — callers ensure settings are hydrated first.
 */

import type { PaletteEngine } from '#/features/agent/engine'
import { SimulatedEngine } from '#/features/agent/simulated-engine'
import { ClaudeEngine } from '#/features/agent/claude-engine'
import { getSettings } from '#/lib/settings'

let simulated: SimulatedEngine | null = null
let claude: ClaudeEngine | null = null
let claudeKey = ''

export function getEngine(): PaletteEngine {
  const { apiKey, model } = getSettings()
  if (apiKey) {
    const cacheKey = `${model}::${apiKey}`
    if (!claude || claudeKey !== cacheKey) {
      claude = new ClaudeEngine(apiKey, model)
      claudeKey = cacheKey
    }
    return claude
  }
  if (!simulated) simulated = new SimulatedEngine()
  return simulated
}

export type EngineInfo = { mode: 'demo' | 'claude'; model?: string }

export function activeEngine(): EngineInfo {
  const { apiKey, model } = getSettings()
  return apiKey ? { mode: 'claude', model } : { mode: 'demo' }
}
