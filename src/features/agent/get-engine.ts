/**
 * Resolves the active engine. For now it is always the SimulatedEngine (no key,
 * no tokens). M4 swaps this to return the ClaudeEngine when a key is present.
 */

import type { PaletteEngine } from '#/features/agent/engine'
import { SimulatedEngine } from '#/features/agent/simulated-engine'

let cached: PaletteEngine | null = null

export function getEngine(): PaletteEngine {
  if (!cached) cached = new SimulatedEngine()
  return cached
}
