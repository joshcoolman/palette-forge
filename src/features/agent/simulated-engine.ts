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
  Palette,
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

/**
 * The base hue for a round. Variation 0 (the opening) anchors on the most
 * saturated source color — unchanged. Re-runs (variation ≥ 1) walk to the next
 * source color, so an image's other colors get their turn; a single-color seed
 * has nowhere to walk, so it relies on the recipe jitter for variety.
 */
function pickBaseHue(source: Source, variation: number): number {
  const hues = anchorHues(source)
  if (hues.length === 0) return 220
  return hues[variation % hues.length]
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

/** Best-effort natural-language steer for the simulated refine path. */
function applySteer(recipe: Recipe, instruction: string): Recipe {
  const text = instruction.toLowerCase()
  const next = { ...recipe }
  if (/\bwarm/.test(text)) next.baseHue = (next.baseHue + 340) % 360
  if (/\bcool/.test(text)) next.baseHue = (next.baseHue + 200) % 360
  if (/(vibrant|bold|saturat|punch)/.test(text)) {
    next.accentSatLight = clamp(next.accentSatLight + 0.12, 0.3, 1)
    next.accentSatDark = clamp(next.accentSatDark + 0.12, 0.3, 1)
  }
  if (/(muted|subtle|calm|soft)/.test(text)) {
    next.accentSatLight = clamp(next.accentSatLight - 0.12, 0.3, 1)
    next.accentSatDark = clamp(next.accentSatDark - 0.12, 0.3, 1)
    next.neutralSat = clamp(next.neutralSat - 0.03, 0, 0.3)
  }
  if (/(neutral|gray|grey)/.test(text))
    next.neutralSat = clamp(next.neutralSat - 0.05, 0, 0.3)
  if (/(deep|dark|moody|rich)/.test(text)) {
    next.accentLightLight = clamp(next.accentLightLight - 0.06, 0.28, 0.58)
    next.neutralSat = clamp(next.neutralSat + 0.04, 0, 0.3)
  }
  if (/(light|airy|bright|pastel)/.test(text)) {
    next.accentLightLight = clamp(next.accentLightLight + 0.06, 0.28, 0.58)
  }
  return next
}

function toSeed(source: Source): Seed {
  return { type: source.type, value: source.value }
}

function sourceFromPalette(base: Palette): Source {
  const accent =
    base.colors.find((c) => c.role === 'accent')?.light ?? base.seed.value
  return { type: base.seed.type, value: base.seed.value, extracted: [accent] }
}

export class SimulatedEngine implements PaletteEngine {
  async compose(
    source: Source,
    steer?: string,
    onProgress?: ProgressFn,
    variation = 0,
  ): Promise<ScoredPalette[]> {
    onProgress?.('Composing four takes…')
    const policy = loadContrastPolicy()
    const baseHue = pickBaseHue(source, variation)
    // Fold an optional source prompt (mood-board seam) into the steer.
    const merged = [source.prompt, steer].filter(Boolean).join(' ').trim()
    return COMPOSITIONS.map((comp) => {
      let recipe = varyRecipe(recipeFor(comp, baseHue), variation)
      if (merged) recipe = applySteer(recipe, merged)
      const colors = repair(composeColors(recipe), policy)
      return finalizePalette({
        seed: toSeed(source),
        name: comp.name,
        character: comp.character,
        colors,
        policy,
      })
    })
  }

  async refine(
    base: Palette,
    instruction: string,
    onProgress?: ProgressFn,
  ): Promise<ScoredPalette[]> {
    return this.compose(sourceFromPalette(base), instruction, onProgress)
  }
}
