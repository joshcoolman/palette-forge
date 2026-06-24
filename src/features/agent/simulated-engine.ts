/**
 * Deterministic, zero-token PaletteEngine. Extraction is real; each take is a
 * treatment archetype (`features/palette/tuning.ts`) filled with hues derived
 * from the user's actual source — so every result reads as *their* color or
 * image, rendered through a different mood.
 *
 * The takes are distinct by design: a dark jewel, a moody twilight, a warm
 * sand, a crisp paper, a calm meadow, a loud signal. They share the seed's hue
 * family (coherent grid) but differ in ground depth, text duotone, and the
 * cross-hue accent relationship — the closest a deterministic engine gets to
 * "surprise me." Legibility is baked into the archetypes; there is no runtime
 * contrast repair flattening bold combinations back to "safe."
 */

import type {
  ColorRow,
  Mode,
  Role,
  ScoredPalette,
  Seed,
  Source,
} from '#/features/palette/types'
import { ROLES } from '#/features/palette/types'
import { clamp, hexToHsl, hslToHex } from '#/features/color/color-utils'
import { loadContrastPolicy } from '#/features/knowledge/contrast-policy'
import { nameFor } from '#/features/palette/namer'
import { ARCHETYPES, DERIVATION } from '#/features/palette/tuning'
import type { Archetype } from '#/features/palette/tuning'
import type { PaletteEngine, ProgressFn } from '#/features/agent/engine'
import { finalizePalette } from '#/features/agent/engine'

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
 * every round is a recognizable scheme *derived from* the seed — never a random
 * hue. Index 0 (mono) is the opening and isn't reached by re-runs.
 */
const HARMONICS = [0, 180, 120, 240, 150, 330, 210, 30]

/**
 * The base hue for a round — the spine of seed-coherence. Every neutral role
 * (background, surface, muted, border, text) is this hue, so the whole palette
 * reads as the user's color; only the accent rotates away from it.
 *
 * Variation 0 (the opening) anchors on the most saturated source color — the
 * honest read. Re-runs move boldly but stay keyed to the seed:
 * - **Image:** rotate by the golden angle (explore the wheel; a hue-narrow
 *   image otherwise wobbles in place).
 * - **Color:** rotate through `HARMONICS` — complementary / triadic / etc.
 *   relative to the seed.
 */
function pickBaseHue(source: Source, variation: number): number {
  const base = anchorHues(source)[0] ?? 220
  if (variation <= 0) return base
  if (source.type === 'image') return (base + variation * GOLDEN_ANGLE) % 360
  return (base + HARMONICS[variation % HARMONICS.length]) % 360
}

/**
 * The six role hexes for one render mode of an archetype at a given base hue.
 * Light and dark are inversions: light mode is a light ground with ink text;
 * dark mode flips to the hero dark ground with light text. The derivation is
 * keyed by mode (not the archetype), so the toggle swaps ground↔text rather
 * than just darkening the same look.
 */
function roleHexes(
  baseHue: number,
  arch: Archetype,
  mode: Mode,
): Record<Role, string> {
  const g = arch.ground[mode]
  const d = DERIVATION[mode]
  const a = arch.accent[mode]
  return {
    background: hslToHex({ h: baseHue, s: g.s, l: g.l }),
    surface: hslToHex({
      h: baseHue,
      s: g.s,
      l: clamp(g.l + d.surfaceLightStep, 0, 1),
    }),
    text: hslToHex({ h: baseHue, s: d.text.s, l: d.text.l }),
    muted: hslToHex({ h: baseHue, s: g.s * d.muted.satFactor, l: d.muted.l }),
    accent: hslToHex({
      h: (baseHue + arch.accentShift + 360) % 360,
      s: a.s,
      l: a.l,
    }),
    border: hslToHex({
      h: baseHue,
      s: g.s * d.borderSatFactor,
      l: clamp(g.l + d.borderLightStep, 0, 1),
    }),
    secondary: hslToHex({
      h: (baseHue + d.secondary.shift) % 360,
      s: d.secondary.s,
      l: d.secondary.l,
    }),
  }
}

/** Compose the full light+dark palette for one archetype at a base hue. */
function composeColors(baseHue: number, arch: Archetype): ColorRow[] {
  const light = roleHexes(baseHue, arch, 'light')
  const dark = roleHexes(baseHue, arch, 'dark')
  return ROLES.map((role) => ({
    role,
    light: light[role],
    dark: dark[role],
  }))
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
    onProgress?.('Composing takes…')
    const policy = loadContrastPolicy()
    const baseHue = pickBaseHue(source, variation)
    // Seeded with names already on screen this journey, so a re-run's takes
    // don't collide with each other *or* with earlier rounds.
    const seen = new Set<string>(usedNames)
    return ARCHETYPES.map((arch) => {
      const colors = composeColors(baseHue, arch)
      return finalizePalette({
        seed: toSeed(source),
        name: nameFor(colors, arch.key, seen),
        character: arch.character,
        colors,
        policy,
      })
    })
  }
}
