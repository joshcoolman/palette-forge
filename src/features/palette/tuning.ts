/**
 * Taste knobs for the palette engine — "what good color feels like."
 *
 * Everything here is safe to nudge and re-run; these are the dials, not the
 * machine. Each entry below is a **treatment archetype** — a relationship
 * template distilled from hand-picked palettes (a hero ground, a contrasting
 * cross-hue accent). It carries NO fixed hues: the actual hues come from the
 * user's seed color or image every time (`baseHue` in `simulated-engine.ts`), so
 * a result always reads as *their* color, just rendered through a different mood.
 *
 * Light and dark are genuine **inversions** of each other (not two depths of one
 * dark look): light mode is a real light theme — a richly-tinted light ground
 * with deep, color-carrying ink text; dark mode flips it — the hero saturated
 * dark ground with light text. The toggle swaps ground↔text, so the deep hue
 * that is the *text* in light mode becomes the *ground* in dark mode.
 *
 * Every value here flows into all takes, every re-run, AND the on-demand sample
 * cards (they all run the same `SimulatedEngine`). Change a number, reload, and
 * the whole app shifts together.
 */

/** A hue-free tone: lightness + saturation (0–1). Hue is supplied at compose. */
export type Tone = { l: number; s: number }

/** A tone in both render modes. */
export type ModeTone = { light: Tone; dark: Tone }

/**
 * One treatment archetype. Both modes are first-class themes:
 * - `ground.light` is a light ground (ink text on top); `ground.dark` is the
 *   hero saturated dark ground (light text on top). They share the seed hue, so
 *   the dark ground is essentially the deep version of the light mode's text.
 * - `accentShift` rotates the accent off the ground hue (the cross-hue
 *   "surprise"): 180 complementary, 150/210 split-comp, 120/240 triadic,
 *   30/40 analogous.
 * - `accent` is the accent's lightness + saturation per mode (hue is derived).
 * - `key` doubles as the namer's mood bucket (see `namer.ts`).
 */
export type Archetype = {
  key: string
  character: string
  accentShift: number
  ground: ModeTone
  accent: ModeTone
}

/**
 * The six a single round surprises with. They share the seed's hue family (so
 * the grid stays coherent with the user's input) but read as genuinely
 * different treatments, varying by accent relationship and ground richness.
 * Five are light-in-light-mode / dark-in-dark-mode pairs; Signal is one bold
 * high-key vivid for range.
 */
export const ARCHETYPES: readonly Archetype[] = [
  {
    // Balanced rich neutrals + a bold complementary accent.
    key: 'Jewel',
    character: 'Rich neutrals with a bold complementary accent.',
    accentShift: 175,
    ground: { light: { l: 0.88, s: 0.2 }, dark: { l: 0.2, s: 0.44 } },
    accent: { light: { l: 0.48, s: 0.72 }, dark: { l: 0.62, s: 0.74 } },
  },
  {
    // Soft, moody tones + a warm analogous glow.
    key: 'Twilight',
    character: 'Soft, moody tones with a warm analogous glow.',
    accentShift: 38,
    ground: { light: { l: 0.85, s: 0.24 }, dark: { l: 0.15, s: 0.4 } },
    accent: { light: { l: 0.46, s: 0.55 }, dark: { l: 0.7, s: 0.46 } },
  },
  {
    // Warm, grounded neutrals + a deep split-complementary contrast.
    key: 'Sand',
    character: 'Warm, grounded neutrals with a deep contrast accent.',
    accentShift: 200,
    ground: { light: { l: 0.82, s: 0.32 }, dark: { l: 0.25, s: 0.42 } },
    accent: { light: { l: 0.45, s: 0.62 }, dark: { l: 0.6, s: 0.6 } },
  },
  {
    // Crisp and airy + a single vivid complementary mark.
    key: 'Paper',
    character: 'Crisp and airy with a single vivid mark.',
    accentShift: 180,
    ground: { light: { l: 0.93, s: 0.12 }, dark: { l: 0.16, s: 0.32 } },
    accent: { light: { l: 0.5, s: 0.8 }, dark: { l: 0.58, s: 0.72 } },
  },
  {
    // Calm, leafy tones + a gentle triadic accent.
    key: 'Meadow',
    character: 'Calm, leafy tones with a gentle triadic accent.',
    accentShift: 120,
    ground: { light: { l: 0.89, s: 0.18 }, dark: { l: 0.27, s: 0.36 } },
    accent: { light: { l: 0.47, s: 0.55 }, dark: { l: 0.7, s: 0.5 } },
  },
  {
    // The loudest of the set: the boldest (most-saturated) light ground that
    // still reads as light, a vivid dark hero, and a punchy split-comp accent.
    key: 'Signal',
    character: 'Bold and confident — the loudest of the set.',
    accentShift: 150,
    ground: { light: { l: 0.82, s: 0.42 }, dark: { l: 0.3, s: 0.74 } },
    accent: { light: { l: 0.5, s: 0.82 }, dark: { l: 0.62, s: 0.74 } },
  },
] as const

/**
 * How the supporting roles are derived from the hero ground in each mode. All
 * share the ground's (seed) hue — surface is a quiet panel step, border a
 * slightly stronger divider, muted a dimmed text, text the duotone partner.
 *
 * `light` (light mode): ink text on a light ground — surface a hair darker,
 * text a deep *color-carrying* ink (so light mode is rich, not flat black).
 * `dark` (dark mode): cream text on the hero dark ground — surface a step
 * lighter. Tuned so muted always stays dimmer than text in both modes.
 *
 * `secondary` is the 30% of 60-30-10: an analogous relative of the ground hue
 * (`shift`° off it), held at a mid lightness/saturation so it supports the
 * background without competing with the 10% accent.
 */
export const DERIVATION = {
  light: {
    surfaceLightStep: -0.045,
    borderLightStep: -0.12,
    text: { l: 0.2, s: 0.32 },
    muted: { l: 0.46, satFactor: 0.7 },
    borderSatFactor: 0.7,
    secondary: { shift: 35, l: 0.4, s: 0.5 },
  },
  dark: {
    surfaceLightStep: 0.07,
    borderLightStep: 0.13,
    text: { l: 0.92, s: 0.12 },
    muted: { l: 0.66, satFactor: 0.6 },
    borderSatFactor: 0.8,
    secondary: { shift: 35, l: 0.56, s: 0.5 },
  },
} as const
