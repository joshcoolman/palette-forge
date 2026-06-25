/**
 * Instant, algorithmic re-runs for AI journeys. The model authors the opening round
 * (premium, one paid call); every re-run after that is a free, synchronous variation
 * *of that output* — so smashing regen on an AI palette stays the fast wall-of-color it
 * already is for deterministic seeds (the whole reason the app is fun), instead of a
 * 10-30s model call each time. See docs/plan-ai-model-direct.md.
 *
 * The transform rotates the *whole* round-0 colorway by a harmonic offset, the same idea
 * the deterministic engine uses per re-run — but applied to the AI's finished palettes,
 * so each palette's internal structure (role relationships, the light/dark inversion) is
 * preserved while the colorway shifts. Round 0 honors the brief's intent; the rotations
 * are the exploration on top.
 */

import type { ColorRow, ScoredPalette } from '#/features/palette/types'
import { rotateHue } from '#/features/color/color-utils'
import { loadContrastPolicy } from '#/features/knowledge/contrast-policy'
import { nameFor } from '#/features/palette/namer'
import { finalizePalette } from '#/features/agent/engine'

/** ~137.5°: successive multiples land maximally far apart on the wheel, so each re-run
 *  is a clearly different colorway rather than a slow creep. */
const GOLDEN_ANGLE = 137.508

/** Mood buckets for the namer, so derived variants read with varied names (not the
 *  base round's). Mirrors the deterministic archetype keys. */
const KINDS = ['Jewel', 'Twilight', 'Sand', 'Paper', 'Meadow', 'Signal']

function rotateRow(row: ColorRow, deg: number): ColorRow {
  return {
    role: row.role,
    light: rotateHue(row.light, deg),
    dark: rotateHue(row.dark, deg),
  }
}

/**
 * One re-run round derived from the AI's opening palettes: the colorway rotated by a
 * variation-indexed harmonic offset, re-wrapped as fresh addressable records (new id,
 * a fresh name from the rotated colors, recomputed contrast). `variation` is the round
 * index (1, 2, …; 0 is the AI original). Pure — no model call, no I/O beyond the policy.
 */
export function deriveRound(
  base: ScoredPalette[],
  variation: number,
  seen: Set<string>,
): ScoredPalette[] {
  const deg = variation * GOLDEN_ANGLE
  const policy = loadContrastPolicy()
  return base.map((p, i) => {
    const colors = p.colors.map((row) => rotateRow(row, deg))
    const accentDark = colors.find((c) => c.role === 'accent')!.dark
    return finalizePalette({
      seed: { type: 'color', value: accentDark },
      name: nameFor(colors, KINDS[i % KINDS.length]!, seen),
      colors,
      policy,
    })
  })
}
