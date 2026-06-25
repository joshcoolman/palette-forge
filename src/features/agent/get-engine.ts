/**
 * The active palette engine — two generators behind one seam. A worded brief
 * (`source.type === 'prompt'`) is authored by the model; a color or image seed runs
 * the deterministic engine. Routing lives here so the journey store and UI stay
 * engine-agnostic (and a future MCP/API engine slots in the same way).
 */

import type { PaletteEngine } from '#/features/agent/engine'
import { SimulatedEngine } from '#/features/agent/simulated-engine'
import { ModelEngine } from '#/features/agent/model-engine'

class RoutingEngine implements PaletteEngine {
  private readonly sim = new SimulatedEngine()
  private readonly model = new ModelEngine()

  compose: PaletteEngine['compose'] = (source, onProgress, variation, usedNames) =>
    source.type === 'prompt'
      ? this.model.compose(source, onProgress, variation, usedNames)
      : this.sim.compose(source, onProgress, variation, usedNames)
}

let engine: RoutingEngine | null = null

export function getEngine(): PaletteEngine {
  if (!engine) engine = new RoutingEngine()
  return engine
}
