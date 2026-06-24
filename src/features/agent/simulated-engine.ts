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
  return (base + HARMONICS[variation % HARMONICS.length]!) % 360
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

// ──────────────────────────────────────────────────────────────────────────
// Image-native composition. A single seed *color* is best served by the archetype
// templates above; an *image* already carries its own palette, so reducing it to
// one hue + a computed accent (the old behaviour) threw the image's character
// away. Instead, map the image's real extracted colors to the roles where they
// show in the dark-mode take row — the image's dark → ground, its light → text,
// its vivids → accent + secondary — then invert for light mode. Still
// deterministic, still seed-coherent (every hue comes from the image).
// ──────────────────────────────────────────────────────────────────────────

type Anchor = { h: number; s: number; l: number }

/** A color counts as "vivid" (a candidate accent/secondary) above this sat. */
const VIVID_S = 0.32
/** Comfort band: accents stay punchy but never pure color. */
const SAT_CAP = 0.8

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function hueGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/**
 * Split the (prominence-ordered) extracted colors into the vivids that drive
 * accent/secondary and the darkest/lightest anchors that drive ground/text.
 */
function classify(extracted: string[]): {
  vivids: Anchor[]
  dark: Anchor
  light: Anchor
} {
  const anchors = (extracted.length > 0 ? extracted : ['#888888']).map(hexToHsl)
  const vivids = anchors.filter((a) => a.s >= VIVID_S) // keeps prominence order
  const byL = [...anchors].sort((a, b) => a.l - b.l)
  // anchors is non-empty (falls back to ['#888888']), so byL has a first and last.
  return { vivids, dark: byL[0]!, light: byL[byL.length - 1]! }
}

/**
 * The 7 role hexes for one mode of an image take. `ground` is the field hue
 * (the dark anchor in dark mode, the light anchor in light mode) and `ink` its
 * inversion partner — so the deep hue that is *text* in light mode is the same
 * hue that becomes the *ground* in dark mode (a genuine inversion). Accent and
 * secondary keep the image's vivid hues in both modes; only lightness adapts.
 */
function imageRoleHexes(
  mode: Mode,
  ground: Anchor,
  ink: Anchor,
  accent: Anchor,
  secondary: Anchor,
  take: number,
): Record<Role, string> {
  const d = DERIVATION[mode]
  const isDark = mode === 'dark'
  // Ground: a tinted near-black (dark mode) or cream (light mode); depth spreads
  // across the 6 takes so a round offers a range.
  const groundL = isDark ? lerp(0.1, 0.22, take / 5) : lerp(0.88, 0.93, take / 5)
  const groundS = clamp(ground.s, 0.05, 0.5)
  // Ink (text): the opposite extreme, lifted/deepened into a legible, non-pure tone.
  const inkL = isDark
    ? clamp(Math.max(0.88, ink.l), 0.88, 0.95)
    : clamp(Math.min(0.26, ink.l), 0.14, 0.26)
  // Accent: keep the vivid, alternate punch by take; lighter than the ground.
  const accentL = isDark
    ? take % 2 === 0
      ? 0.52
      : 0.64
    : take % 2 === 0
      ? 0.45
      : 0.5
  const mutedL = isDark ? 0.62 : 0.46
  const secondaryL = isDark ? 0.56 : 0.42
  return {
    background: hslToHex({ h: ground.h, s: groundS, l: groundL }),
    surface: hslToHex({
      h: ground.h,
      s: groundS,
      l: clamp(groundL + d.surfaceLightStep, 0, 1),
    }),
    border: hslToHex({
      h: ground.h,
      s: groundS * d.borderSatFactor,
      l: clamp(groundL + d.borderLightStep, 0, 1),
    }),
    text: hslToHex({ h: ink.h, s: clamp(ink.s, 0, 0.18), l: inkL }),
    muted: hslToHex({ h: ink.h, s: clamp(ink.s, 0, 0.3) * 0.6, l: mutedL }),
    accent: hslToHex({ h: accent.h, s: clamp(accent.s, 0.4, SAT_CAP), l: accentL }),
    secondary: hslToHex({
      h: secondary.h,
      s: clamp(secondary.s, 0.4, 0.7),
      l: secondaryL,
    }),
  }
}

/** One image take's full light+dark palette (the inversion swaps ground↔ink). */
function composeImageColors(
  cls: { dark: Anchor; light: Anchor },
  accent: Anchor,
  secondary: Anchor,
  take: number,
): ColorRow[] {
  const dark = imageRoleHexes('dark', cls.dark, cls.light, accent, secondary, take)
  const light = imageRoleHexes('light', cls.light, cls.dark, accent, secondary, take)
  return ROLES.map((role) => ({ role, light: light[role], dark: dark[role] }))
}

/** Rotate an anchor's hue (keeps s/l). The re-run "surprise" lever for images. */
function rotateAnchor(a: Anchor, deg: number): Anchor {
  return { ...a, h: (a.h + deg + 360) % 360 }
}

function toSeed(source: Source): Seed {
  // This engine only ever receives image/color sources (the router sends prompt
  // briefs to the model engine); the coercion just keeps Seed's type honest.
  return { type: source.type === 'image' ? 'image' : 'color', value: source.value }
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
    const seed = toSeed(source)
    // Seeded with names already on screen this journey, so a re-run's takes
    // don't collide with each other *or* with earlier rounds.
    const seen = new Set<string>(usedNames)

    // Image with real, vivid colors → image-native composition (build each take
    // from the image's own palette). A single seed color, or a hue-narrow/grey
    // image with no usable vivids, falls through to the archetype templates.
    const base = classify(source.extracted)
    if (source.type === 'image' && base.vivids.length >= 2) {
      // Re-runs are a surprise game: each one drifts the whole image palette
      // around the wheel (golden angle), keeping its multi-color structure but
      // landing on a new colorway. variation 0 (the pinned first generation) is
      // rot 0 — the faithful read of the image.
      const rot = variation * GOLDEN_ANGLE
      const cls = {
        vivids: base.vivids.map((a) => rotateAnchor(a, rot)),
        dark: rotateAnchor(base.dark, rot),
        light: rotateAnchor(base.light, rot),
      }
      return ARCHETYPES.map((arch, take) => {
        // Guarded by vivids.length >= 2 above, so both modulo indices are in bounds.
        const accent = cls.vivids[take % cls.vivids.length]!
        let secondary = cls.vivids[(take + 1) % cls.vivids.length]!
        // Two near-identical vivids would merge accent into secondary — split the
        // secondary off to an analogous hue so the 60-30-10 stays legible.
        if (hueGap(accent.h, secondary.h) < 25) {
          secondary = { h: (accent.h + 35) % 360, s: accent.s, l: accent.l }
        }
        const colors = composeImageColors(cls, accent, secondary, take)
        return finalizePalette({
          seed,
          name: nameFor(colors, arch.key, seen),
          character: 'Drawn from your image.',
          colors,
          policy,
        })
      })
    }

    const baseHue = pickBaseHue(source, variation)
    return ARCHETYPES.map((arch) => {
      const colors = composeColors(baseHue, arch)
      return finalizePalette({
        seed,
        name: nameFor(colors, arch.key, seen),
        character: arch.character,
        colors,
        policy,
      })
    })
  }
}
