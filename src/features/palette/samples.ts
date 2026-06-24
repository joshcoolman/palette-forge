/**
 * Three known-good sample palettes, generated on demand from the empty state so
 * a cleared library is never a dead end. Built with the deterministic
 * SimulatedEngine (no key, no network) over three fixed seeds — one distinct
 * character each — and given friendly names. Deletable like any saved palette;
 * nothing auto-seeds and nothing is gated, so deleting them all is permanent
 * until you ask for them back.
 */

import type { Source } from '#/features/palette/types'
import { SimulatedEngine } from '#/features/agent/simulated-engine'
import { savePalette } from '#/features/palette/palette-repo'

// seed + which composed take (archetype index) to keep + the name it's saved
// under. Warm / green / cool seeds and three contrasting archetypes (Jewel /
// Sand / Signal), so the three read as genuinely different moods.
const SAMPLES: { seed: string; take: number; name: string }[] = [
  { seed: '#e76f2c', take: 0, name: 'Sunset Studio' }, // Orange Tiger · Jewel
  { seed: '#2c6e4f', take: 2, name: 'Field Notes' }, //   Amazon · Sand
  { seed: '#34596e', take: 5, name: 'Deep Harbor' }, //   Midnight · Signal
]

function colorSource(hex: string): Source {
  return { type: 'color', value: hex, extracted: [hex] }
}

/** Compose and persist the three samples. Resolves once all are written. */
export async function createSamplePalettes(): Promise<void> {
  const engine = new SimulatedEngine()
  for (const sample of SAMPLES) {
    // compose returns one take per archetype (6), so take 0/2/5 are present.
    const { palettes } = await engine.compose(colorSource(sample.seed))
    await savePalette({ ...palettes[sample.take]!, name: sample.name })
  }
}
