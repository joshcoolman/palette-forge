/**
 * Deterministic, zero-token PaletteEngine. Move 1 (extraction) is real; moves
 * 2/4 are composed by harmony rules, repaired against the contrast policy, and
 * scored by the shared heuristic. It responds to the user's actual source and
 * steers — the journey's feel is fully tunable here before Claude is wired in.
 *
 * Composition gives neutrals a perceptible shared tint (per knowledge: "a faint
 * shared temperature, not dead gray") and rotates the whole hue across the four
 * variations so the takes read as genuinely different.
 */

import type {
  ColorRow,
  Direction,
  Palette,
  PaletteType,
  ScoredPalette,
  Seed,
  Source,
} from '#/features/palette/types'
import { PALETTE_TYPES } from '#/features/palette/types'
import { clamp, hexToHsl, hexToRgb, hslToHex } from '#/features/color/color-utils'
import { parsePairing, policyFailures, relativeLuminance } from '#/features/color/contrast'
import { loadContrastPolicy } from '#/features/knowledge/contrast-policy'
import type { PaletteEngine, ProgressFn } from '#/features/agent/engine'
import { finalizePalette } from '#/features/agent/engine'

const CHARACTER: Record<PaletteType, string> = {
  monochrome: 'One hue, varied in value. Calm and focused.',
  analogous: 'Neighboring hues. Warm, cohesive, organic.',
  complementary: 'Opposite hues. Punchy, clear figure and ground.',
  triadic: 'Three balanced hues. Playful and brand-forward.',
  editorial: 'Near-neutral grounds, one saturated accent. Confident.',
}

type Recipe = {
  type: PaletteType
  baseHue: number
  neutralSat: number
  accentSatLight: number
  accentSatDark: number
  accentLightLight: number
  accentLightDark: number
}

const NEUTRAL_GROUND = new Set(['background', 'surface'])

function luminance(hex: string): number {
  return relativeLuminance(hexToRgb(hex))
}

function pickBaseHue(source: Source): number {
  let hue = 220
  let bestSat = -1
  for (const hex of source.extracted.length > 0 ? source.extracted : [source.value]) {
    const hsl = hexToHsl(hex)
    if (hsl.s > bestSat) {
      bestSat = hsl.s
      hue = hsl.h
    }
  }
  return hue
}

function accentHueFor(type: PaletteType, baseHue: number): number {
  switch (type) {
    case 'analogous':
      return (baseHue + 32) % 360
    case 'complementary':
      return (baseHue + 180) % 360
    case 'triadic':
      return (baseHue + 120) % 360
    case 'monochrome':
    case 'editorial':
      return baseHue
  }
}

function baseRecipe(type: PaletteType, baseHue: number): Recipe {
  const common = { type, baseHue }
  switch (type) {
    case 'monochrome':
      return { ...common, neutralSat: 0.16, accentSatLight: 0.6, accentSatDark: 0.55, accentLightLight: 0.42, accentLightDark: 0.66 }
    case 'analogous':
      return { ...common, neutralSat: 0.12, accentSatLight: 0.66, accentSatDark: 0.62, accentLightLight: 0.43, accentLightDark: 0.66 }
    case 'complementary':
      return { ...common, neutralSat: 0.1, accentSatLight: 0.72, accentSatDark: 0.66, accentLightLight: 0.44, accentLightDark: 0.64 }
    case 'triadic':
      return { ...common, neutralSat: 0.1, accentSatLight: 0.68, accentSatDark: 0.64, accentLightLight: 0.44, accentLightDark: 0.65 }
    case 'editorial':
      return { ...common, neutralSat: 0.05, accentSatLight: 0.82, accentSatDark: 0.74, accentLightLight: 0.45, accentLightDark: 0.66 }
  }
}

/** Never go pure white/gray — every neutral keeps at least this much tint. */
const NEUTRAL_SAT_FLOOR = 0.055

/** A tinted neutral: the base hue at a fraction of the recipe's tint strength. */
function tinted(hue: number, sat: number, light: number): string {
  return hslToHex({ h: hue, s: clamp(sat, 0, 1), l: clamp(light, 0, 1) })
}

function composeColors(recipe: Recipe): ColorRow[] {
  const { type, baseHue, neutralSat: t } = recipe
  const aHue = accentHueFor(type, baseHue)
  const floor = (sat: number): number => Math.max(sat, NEUTRAL_SAT_FLOOR)
  return [
    {
      // Off-white, never pure white, always faintly tinted.
      role: 'background',
      light: tinted(baseHue, floor(t * 0.9), 0.965),
      dark: tinted(baseHue, floor(t * 1.1), 0.115),
    },
    {
      // A clear, slightly more tinted step down from background.
      role: 'surface',
      light: tinted(baseHue, floor(t * 1.6), 0.885),
      dark: tinted(baseHue, floor(t * 1.5), 0.17),
    },
    {
      role: 'text',
      light: tinted(baseHue, t * 1.2, 0.17),
      dark: tinted(baseHue, t * 0.7, 0.93),
    },
    {
      role: 'muted',
      light: tinted(baseHue, floor(t * 1.1), 0.46),
      dark: tinted(baseHue, floor(t * 0.9), 0.64),
    },
    {
      role: 'accent',
      light: hslToHex({ h: aHue, s: recipe.accentSatLight, l: recipe.accentLightLight }),
      dark: hslToHex({ h: aHue, s: recipe.accentSatDark, l: recipe.accentLightDark }),
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
function repair(colors: ColorRow[], policy: ReturnType<typeof loadContrastPolicy>): ColorRow[] {
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
      const direction = luminance(row[failure.mode]) >= luminance(ground[failure.mode]) ? 1 : -1
      row[failure.mode] = hslToHex({ ...hsl, l: clamp(hsl.l + direction * 0.03, 0, 1) })
    }
  }
  return out
}

type Delta = {
  label: string
  hueShift: number
  tint: number
  light: number
  accentSat: number
}

const VARIATION_DELTAS: Delta[] = [
  { label: 'balanced', hueShift: 0, tint: 0, light: 0, accentSat: 0 },
  { label: 'deeper', hueShift: -16, tint: 0.05, light: -0.05, accentSat: 0.04 },
  { label: 'brighter', hueShift: 20, tint: -0.02, light: 0.05, accentSat: 0.1 },
  { label: 'warm shift', hueShift: 36, tint: 0.03, light: 0, accentSat: -0.02 },
]

function applyDelta(recipe: Recipe, delta: Delta): Recipe {
  return {
    ...recipe,
    baseHue: (recipe.baseHue + delta.hueShift + 360) % 360,
    neutralSat: clamp(recipe.neutralSat + delta.tint, 0, 0.3),
    accentSatLight: clamp(recipe.accentSatLight + delta.accentSat, 0.3, 1),
    accentSatDark: clamp(recipe.accentSatDark + delta.accentSat, 0.3, 1),
    accentLightLight: clamp(recipe.accentLightLight + delta.light, 0.28, 0.58),
    accentLightDark: clamp(recipe.accentLightDark + delta.light, 0.5, 0.78),
  }
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
  if (/(neutral|gray|grey)/.test(text)) next.neutralSat = clamp(next.neutralSat - 0.05, 0, 0.3)
  if (/(deep|dark|moody|rich)/.test(text)) {
    next.accentLightLight = clamp(next.accentLightLight - 0.06, 0.28, 0.58)
    next.neutralSat = clamp(next.neutralSat + 0.04, 0, 0.3)
  }
  if (/(light|airy|bright|pastel)/.test(text)) {
    next.accentLightLight = clamp(next.accentLightLight + 0.06, 0.28, 0.58)
  }
  return next
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const PREVIEW_ORDER = ['background', 'surface', 'muted', 'border', 'accent', 'text'] as const

function previewHexes(colors: ColorRow[]): string[] {
  return PREVIEW_ORDER.map((role) => colors.find((c) => c.role === role)?.light ?? '#888888')
}

function toSeed(source: Source): Seed {
  return { type: source.type, value: source.value }
}

function sourceFromPalette(base: Palette): Source {
  const accent = base.colors.find((c) => c.role === 'accent')?.light ?? base.seed.value
  return { type: base.seed.type, value: base.seed.value, extracted: [accent] }
}

export class SimulatedEngine implements PaletteEngine {
  async proposeDirections(source: Source, onProgress?: ProgressFn): Promise<Direction[]> {
    onProgress?.('Reading your colors…')
    const policy = loadContrastPolicy()
    const baseHue = pickBaseHue(source)
    const scored = PALETTE_TYPES.map((type) => {
      const colors = repair(composeColors(baseRecipe(type, baseHue)), policy)
      const palette = finalizePalette({
        seed: toSeed(source),
        name: capitalize(type),
        type,
        colors,
        policy,
      })
      return { type, colors, overall: palette.score.overall }
    })
    const topType = scored.reduce((best, d) => (d.overall > best.overall ? d : best)).type
    return scored.map((d) => ({
      type: d.type,
      label: capitalize(d.type),
      character: CHARACTER[d.type],
      preview: previewHexes(d.colors),
      recommended: d.type === topType,
    }))
  }

  async composeVariations(
    source: Source,
    type: PaletteType,
    steer?: string,
    onProgress?: ProgressFn,
  ): Promise<ScoredPalette[]> {
    onProgress?.('Composing palettes…')
    const policy = loadContrastPolicy()
    const base = baseRecipe(type, pickBaseHue(source))
    return VARIATION_DELTAS.map((delta) => {
      let recipe = applyDelta(base, delta)
      if (steer) recipe = applySteer(recipe, steer)
      const colors = repair(composeColors(recipe), policy)
      return finalizePalette({
        seed: toSeed(source),
        name: `${capitalize(type)} · ${delta.label}`,
        type,
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
    const type = (base as Partial<ScoredPalette>).type ?? 'analogous'
    return this.composeVariations(sourceFromPalette(base), type, instruction, onProgress)
  }
}
