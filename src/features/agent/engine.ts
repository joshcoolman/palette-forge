/**
 * The engine seam. Everything above it (journey UI, store, contrast verifier,
 * repo, export) is engine-agnostic; the deterministic SimulatedEngine implements
 * this today, and the seam stays so another impl (e.g. agent-driven) could slot
 * in. The shared finalize helper lives here so any engine produces clean,
 * addressable records.
 */

import type {
  ColorRow,
  ContrastPolicy,
  ScoredPalette,
  Seed,
  Source,
} from '#/features/palette/types'
import { computeContrastChecks } from '#/features/color/contrast'
import { makeId } from '#/lib/id'

/** Live, human-readable status of the agent's current move, in its own voice. */
export type ProgressFn = (message: string) => void

export interface PaletteEngine {
  /**
   * The surprise: from a source, a set of genuinely distinct, seed-coherent,
   * UI-ready palettes — each its own treatment character. `variation` is the
   * round index (0 = opening): re-runs pass 1, 2, … so each set is genuinely
   * different instead of repeating the opening. `usedNames` are names already on
   * screen this journey, so re-run names don't repeat them.
   *
   * This is the one seam between everything above (UI, store, verifier, repo)
   * and palette generation — kept clean and addressable so the engine could be
   * driven by an external agent (MCP/API) later. Today: one deterministic impl.
   */
  compose: (
    source: Source,
    onProgress?: ProgressFn,
    variation?: number,
    usedNames?: Iterable<string>,
  ) => Promise<ScoredPalette[]>
}

/**
 * Assemble a palette record from composed colors. The `character` is the take's
 * human one-line read (e.g. "Deep jewel ground with a bright complementary
 * spark."). Contrast is still computed for reference, but it is never enforced
 * (no repair loop) and not shown — legibility lives in the archetype recipes.
 */
export function finalizePalette(args: {
  seed: Seed
  name: string
  character?: string
  colors: ColorRow[]
  policy: ContrastPolicy
  createdAt?: string
}): ScoredPalette {
  const { seed, name, character, colors, policy } = args
  return {
    id: makeId(),
    name,
    seed,
    colors,
    contrast: computeContrastChecks(colors, policy),
    createdAt: args.createdAt ?? new Date().toISOString(),
    character,
  }
}
