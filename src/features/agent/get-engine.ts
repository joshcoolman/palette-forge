/**
 * The active palette engine. One deterministic implementation now — kept behind
 * this resolver (and the `PaletteEngine` seam) so generation stays a single,
 * swappable surface (e.g. an agent-driven MCP/API engine later).
 */

import type { PaletteEngine } from '#/features/agent/engine'
import { SimulatedEngine } from '#/features/agent/simulated-engine'

let engine: SimulatedEngine | null = null

export function getEngine(): PaletteEngine {
  if (!engine) engine = new SimulatedEngine()
  return engine
}
