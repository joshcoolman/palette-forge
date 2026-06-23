/**
 * Deterministic, zero-token PaletteEngine. Extraction is real; the four takes
 * are composed by recipe, repaired against the contrast policy, and scored by
 * the shared heuristic. It responds to the user's actual source and steers — the
 * no-key demo's feel is fully tunable here before Claude is wired in.
 *
 * The four are distinct by design: they rotate the accent hue, swing accent
 * saturation and lightness, and vary the neutral tint, so the "surprise me"
 * grid reads as four genuinely different moods, not minor tweaks of one idea.
 */

import type {
  ColorRow,
  ScoredPalette,
  Seed,
  Source,
} from '#/features/palette/types'
import {
  clamp,
  hexToHsl,
  hexToRgb,
  hslToHex,
} from '#/features/color/color-utils'
import {
  parsePairing,
  policyFailures,
  relativeLuminance,
} from '#/features/color/contrast'
import { loadContrastPolicy } from '#/features/knowledge/contrast-policy'
import { nameFor } from '#/features/palette/namer'
import type { PaletteEngine, ProgressFn } from '#/features/agent/engine'
import { finalizePalette } from '#/features/agent/engine'

type Recipe = {
  baseHue: number
  accentHueShift: number
  neutralSat: number
  accentSatLight: number
  accentSatDark: number
  accentLightLight: number
  accentLightDark: number
}

/** One of the four characters the no-key demo surprises with. */
type Composition = {
  name: string
  character: string
  accentHueShift: number
  neutralSat: number
  accentSatLight: number
  accentSatDark: number
  accentLightLight: number
  accentLightDark: number
}

// Four deliberately distinct reads of the same source: a punchy lead, a
// restrained professional, a dark complement, and a soft calm. They differ in
// temperature (hue rotation), energy (accent saturation), and depth (accent
// lightness + neutral tint) — the closest a deterministic engine gets to the
// vision model's "surprise me."
const COMPOSITIONS: Composition[] = [
  {
    name: 'Vivid',
    character: 'Bright and confident — a saturated accent over crisp neutrals.',
    accentHueShift: 0,
    neutralSat: 0.07,
    accentSatLight: 0.84,
    accentSatDark: 0.6,
    accentLightLight: 0.47,
    accentLightDark: 0.66,
  },
  {
    name: 'Composed',
    character: 'Muted and professional — restrained color, quiet authority.',
    accentHueShift: 20,
    neutralSat: 0.05,
    accentSatLight: 0.5,
    accentSatDark: 0.4,
    accentLightLight: 0.42,
    accentLightDark: 0.62,
  },
  {
    name: 'Nocturne',
    character: 'Dark and intense — a deep, moody complement.',
    accentHueShift: 180,
    neutralSat: 0.13,
    accentSatLight: 0.72,
    accentSatDark: 0.52,
    accentLightLight: 0.4,
    accentLightDark: 0.64,
  },
  {
    name: 'Hush',
    character: 'Soft and calm — gentle, airy, low-contrast warmth.',
    accentHueShift: 32,
    neutralSat: 0.1,
    accentSatLight: 0.48,
    accentSatDark: 0.4,
    accentLightLight: 0.52,
    accentLightDark: 0.68,
  },
]

const NEUTRAL_GROUND = new Set(['background', 'surface'])

function luminance(hex: string): number {
  return relativeLuminance(hexToRgb(hex))
}

/** Candidate anchor hues from the source, most-saturated first. */
function anchorHues(source: Source): number[] {
  const hexes = source.extracted.length > 0 ? source.extracted : [source.value]
  return hexes
    .map((hex) => hexToHsl(hex))
    .sort((a, b) => b.s - a.s)
    .map((hsl) => hsl.h)
}

/** ~137.5° — successive multiples land maximally far apart on the hue wheel,
 *  so each re-run is a clearly different family, never creeping back for ages. */
const GOLDEN_ANGLE = 137.508

/**
 * Classic color-theory offsets from the seed hue, ordered so consecutive re-runs
 * jump across the wheel: monochromatic, complementary, the two triadics, the two
 * split-complementaries, the two analogous. A color re-run walks this list, so
 * every round is a recognizable, intentional scheme *derived from* the seed —
 * not a random hue. Index 0 (mono) is the opening and isn't reached by re-runs.
 */
const HARMONICS = [0, 180, 120, 240, 150, 330, 210, 30]

/**
 * The base hue for a round. Variation 0 (the opening) anchors on the most
 * saturated source color — the honest read, unchanged for both source types.
 *
 * Re-runs diverge by source type, but both now move boldly each round:
 * - **Image:** rotate the whole palette by the golden angle. Walking the image's
 *   own colors (the prior approach) collapses to a wobble when the image is
 *   hue-narrow — all browns/olives re-run to themselves. A re-run is "surprise me
 *   again," so we explore the wheel; the accent swings most, grounds re-tint.
 * - **Color:** rotate through `HARMONICS` — complementary / triadic / etc.
 *   relative to the seed. Still keyed off the chosen color (every offset is a
 *   relationship to it), but with the same across-round variety images get.
 */
function pickBaseHue(source: Source, variation: number): number {
  const base = anchorHues(source)[0] ?? 220
  if (variation <= 0) return base
  if (source.type === 'image') return (base + variation * GOLDEN_ANGLE) % 360
  return (base + HARMONICS[variation % HARMONICS.length]) % 360
}

/**
 * Deterministic hash in [0, 1) from an integer — the classic sin-fract trick.
 * Drives id-seeded jitter so re-runs differ without any real randomness (the
 * engine stays a pure function of its inputs; tests stay stable).
 */
function noise(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Bounded per-round jitter so a keyless re-run yields a fresh four, not a repeat.
 * No-op on the opening round. Same offsets across the round's four takes, so the
 * round shifts cohesively while the characters stay distinct. Deliberately small
 * — re-runs read as "the same seed, explored," not a different color entirely.
 */
function varyRecipe(recipe: Recipe, variation: number): Recipe {
  if (variation <= 0) return recipe
  const jolt = (salt: number): number => noise(variation * 7.13 + salt) * 2 - 1
  return {
    ...recipe,
    baseHue: (recipe.baseHue + jolt(1) * 15 + 360) % 360,
    neutralSat: clamp(recipe.neutralSat + jolt(2) * 0.02, 0, 0.3),
    accentSatLight: clamp(recipe.accentSatLight + jolt(3) * 0.08, 0.3, 1),
    accentSatDark: clamp(recipe.accentSatDark + jolt(4) * 0.08, 0.3, 1),
    accentLightLight: clamp(recipe.accentLightLight + jolt(5) * 0.05, 0.28, 0.7),
    accentLightDark: clamp(recipe.accentLightDark + jolt(6) * 0.05, 0.4, 0.82),
  }
}

function recipeFor(comp: Composition, baseHue: number): Recipe {
  return {
    baseHue,
    accentHueShift: comp.accentHueShift,
    neutralSat: comp.neutralSat,
    accentSatLight: comp.accentSatLight,
    accentSatDark: comp.accentSatDark,
    accentLightLight: comp.accentLightLight,
    accentLightDark: comp.accentLightDark,
  }
}

/** Never go pure white/gray — every neutral keeps at least this much tint. */
const NEUTRAL_SAT_FLOOR = 0.055

/** A tinted neutral: the base hue at a fraction of the recipe's tint strength. */
function tinted(hue: number, sat: number, light: number): string {
  return hslToHex({ h: hue, s: clamp(sat, 0, 1), l: clamp(light, 0, 1) })
}

function composeColors(recipe: Recipe): ColorRow[] {
  const { baseHue, neutralSat: t } = recipe
  const aHue = (baseHue + recipe.accentHueShift + 360) % 360
  const floor = (sat: number): number => Math.max(sat, NEUTRAL_SAT_FLOOR)
  return [
    {
      // Off-white in light; a warm/cool charcoal (not inverted white) in dark,
      // carrying a touch more tint than light mode.
      role: 'background',
      light: tinted(baseHue, floor(t * 0.9), 0.965),
      dark: tinted(baseHue, floor(t * 1.25), 0.13),
    },
    {
      // A clear step in light; a small elevation lift in dark.
      role: 'surface',
      light: tinted(baseHue, floor(t * 1.6), 0.885),
      dark: tinted(baseHue, floor(t * 1.5), 0.185),
    },
    {
      role: 'text',
      light: tinted(baseHue, t * 1.2, 0.17),
      dark: tinted(baseHue, t * 0.7, 0.93),
    },
    {
      role: 'muted',
      light: tinted(baseHue, floor(t * 1.1), 0.46),
      dark: tinted(baseHue, floor(t * 0.9), 0.66),
    },
    {
      role: 'accent',
      light: hslToHex({
        h: aHue,
        s: recipe.accentSatLight,
        l: recipe.accentLightLight,
      }),
      dark: hslToHex({
        h: aHue,
        s: recipe.accentSatDark,
        l: recipe.accentLightDark,
      }),
    },
    {
      role: 'border',
      light: tinted(baseHue, floor(t), 0.82),
      dark: tinted(baseHue, floor(t * 1.1), 0.3),
    },
  ]
}

/**
 * The deterministic analog of the agent's revise loop: nudge the adjustable
 * (non-ground) role of each failing pairing toward more contrast until the
 * policy is satisfied or we run out of steps (then the badge stays honest).
 */
function repair(
  colors: ColorRow[],
  policy: ReturnType<typeof loadContrastPolicy>,
): ColorRow[] {
  const out = colors.map((c) => ({ ...c }))
  for (let step = 0; step < 48; step += 1) {
    const failures = policyFailures(out, policy)
    if (failures.length === 0) break
    for (const failure of failures) {
      const roles = parsePairing(failure.pairing)
      if (!roles) continue
      const adjustRole = NEUTRAL_GROUND.has(roles.fg) ? roles.bg : roles.fg
      const groundRole = adjustRole === roles.fg ? roles.bg : roles.fg
      const row = out.find((c) => c.role === adjustRole)
      const ground = out.find((c) => c.role === groundRole)
      if (!row || !ground) continue
      const hsl = hexToHsl(row[failure.mode])
      const direction =
        luminance(row[failure.mode]) >= luminance(ground[failure.mode]) ? 1 : -1
      row[failure.mode] = hslToHex({
        ...hsl,
        l: clamp(hsl.l + direction * 0.03, 0, 1),
      })
    }
  }
  return out
}

function toSeed(source: Source): Seed {
  return { type: source.type, value: source.value }
}

export class SimulatedEngine implements PaletteEngine {
  async compose(
    source: Source,
    onProgress?: ProgressFn,
    variation = 0,
    usedNames?: Iterable<string>,
  ): Promise<ScoredPalette[]> {
    onProgress?.('Composing four takes…')
    const policy = loadContrastPolicy()
    const baseHue = pickBaseHue(source, variation)
    // Seeded with names already on screen this journey, so a re-run's four don't
    // collide with each other *or* with earlier rounds.
    const seen = new Set<string>(usedNames)
    return COMPOSITIONS.map((comp) => {
      const recipe = varyRecipe(recipeFor(comp, baseHue), variation)
      const colors = repair(composeColors(recipe), policy)
      return finalizePalette({
        seed: toSeed(source),
        name: nameFor(colors, comp.name, seen),
        character: comp.character,
        colors,
        policy,
      })
    })
  }
}
