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

// seed + which of the four composed takes to keep + the name it's saved under.
// Warm / green / cool seeds and Vivid / Composed / Nocturne takes, so the three
// read as genuinely different moods.
const SAMPLES: { seed: string; take: number; name: string }[] = [
  { seed: '#e76f2c', take: 0, name: 'Sunset Studio' }, // Orange Tiger · Vivid
  { seed: '#2c6e4f', take: 1, name: 'Field Notes' }, //   Amazon · Composed
  { seed: '#34596e', take: 2, name: 'Deep Harbor' }, //   Midnight · Nocturne
]

function colorSource(hex: string): Source {
  return { type: 'color', value: hex, extracted: [hex] }
}

/** Compose and persist the three samples. Resolves once all are written. */
export async function createSamplePalettes(): Promise<void> {
  const engine = new SimulatedEngine()
  for (const sample of SAMPLES) {
    // compose always returns the four COMPOSITIONS, so take 0–2 are present.
    const takes = await engine.compose(colorSource(sample.seed))
    await savePalette({ ...takes[sample.take], name: sample.name })
  }
}
