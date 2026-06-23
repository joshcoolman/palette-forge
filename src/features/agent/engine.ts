/**
 * The engine seam. Everything above it (journey UI, store, contrast verifier,
 * repo, export) is engine-agnostic; the deterministic SimulatedEngine implements
 * this today, and the seam stays so another impl (e.g. agent-driven) could slot
 * in. Shared helpers — contrast verification and scoring — live here so any
 * engine produces honest, comparable records.
 */

import type {
  ColorRow,
  ContrastPolicy,
  Role,
  Score,
  ScoredPalette,
  Seed,
  Source,
} from '#/features/palette/types'
import { MODES, ROLES } from '#/features/palette/types'
import { clamp, hexToHsl } from '#/features/color/color-utils'
import {
  computeContrastChecks,
  contrastRatio,
  resolvePairing,
  targetRatio,
} from '#/features/color/contrast'
import { makeId } from '#/lib/id'

/** Live, human-readable status of the agent's current move, in its own voice. */
export type ProgressFn = (message: string) => void

export interface PaletteEngine {
  /**
   * The surprise: from a source, four genuinely distinct, contrast-checked,
   * UI-ready palettes — each its own character. `variation` is the round index
   * (0 = opening): re-runs pass 1, 2, … so each four is genuinely different
   * instead of repeating the opening. `usedNames` are names already on screen
   * this journey, so re-run names don't repeat them.
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

const NEUTRAL_ROLES: Role[] = ['background', 'surface', 'muted', 'border']

function byRole(colors: ColorRow[], role: Role): ColorRow {
  const row = colors.find((c) => c.role === role)
  if (!row) throw new Error(`Palette is missing the "${role}" role`)
  return row
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, n) => sum + n, 0) / values.length
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function temperatureWord(hue: number): string {
  if (hue < 60 || hue >= 320) return 'warm'
  if (hue < 150) return 'fresh'
  if (hue < 255) return 'cool'
  return 'rich'
}

/**
 * Heuristic taste score, grounded in the contrast policy and the knowledge
 * rubric (distinct accent, quiet neutrals, deliberate value range). Used as-is
 * by the simulated engine and as a sanity check for the Claude engine.
 */
export function scorePalette(
  colors: ColorRow[],
  policy: ContrastPolicy,
): Score {
  let passed = 0
  let total = 0
  let headroom = 0
  for (const pairing of policy.pairings) {
    for (const mode of MODES) {
      const resolved = resolvePairing(colors, pairing.pairing, mode)
      if (!resolved) continue
      total += 1
      const ratio = contrastRatio(resolved.fg, resolved.bg)
      const required = targetRatio(pairing.target)
      if (ratio + 1e-9 >= required) passed += 1
      headroom += clamp((ratio - required) / (21 - required), 0, 1)
    }
  }
  const passFraction = total === 0 ? 1 : passed / total
  const avgHeadroom = total === 0 ? 0 : headroom / total
  const contrast = Math.round(
    clamp(passFraction * 70 + avgHeadroom * 30, 0, 100),
  )

  const neutralSat = mean(
    NEUTRAL_ROLES.map((role) => hexToHsl(byRole(colors, role).light).s),
  )
  const cohesion = Math.round(clamp(100 - neutralSat * 220, 0, 100))

  const accent = hexToHsl(byRole(colors, 'accent').light)
  const distinctAccent = clamp((accent.s - neutralSat) * 120, 0, 55)
  const lightnesses = ROLES.map(
    (role) => hexToHsl(byRole(colors, role).light).l,
  )
  const valueRange = Math.max(...lightnesses) - Math.min(...lightnesses)
  const harmony = Math.round(
    clamp(distinctAccent + valueRange * 45 + 8, 0, 100),
  )

  const overall = Math.round(contrast * 0.4 + harmony * 0.34 + cohesion * 0.26)

  const ranked: [string, number][] = [
    ['contrast', contrast],
    ['harmony', harmony],
    ['cohesion', cohesion],
  ]
  ranked.sort((a, b) => b[1] - a[1])
  const lead = ranked[0][0]
  const phrase =
    lead === 'contrast'
      ? 'strong, accessible contrast'
      : lead === 'harmony'
        ? 'a confident, distinct accent'
        : 'cohesive, quiet neutrals'
  const rationale = `${capitalize(temperatureWord(accent.h))} cast — ${phrase}.`

  return { overall, harmony, contrast, cohesion, rationale }
}

/** Assemble a scored, contrast-checked palette record from composed colors. */
export function finalizePalette(args: {
  seed: Seed
  name: string
  character?: string
  colors: ColorRow[]
  policy: ContrastPolicy
  createdAt?: string
}): ScoredPalette {
  const { seed, name, character, colors, policy } = args
  const score = scorePalette(colors, policy)
  return {
    id: makeId(),
    name,
    seed,
    colors,
    contrast: computeContrastChecks(colors, policy),
    createdAt: args.createdAt ?? new Date().toISOString(),
    character,
    // When the agent named a character for this take, it's the truer one-line
    // read than the heuristic; fall back to the computed rationale otherwise.
    score: character ? { ...score, rationale: character } : score,
  }
}
