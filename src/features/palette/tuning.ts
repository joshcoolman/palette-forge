/**
 * Taste knobs for the palette engine — "what good color feels like."
 *
 * Everything here is safe to nudge a percent or two and re-run; these are the
 * dials, not the machine. The contrast *math* lives in `features/color/contrast.ts`
 * and the WCAG *policy* (the rubric the verifier reads) lives in
 * `knowledge/contrast.md` — both on purpose kept out of this file.
 *
 * Every value here flows into all four takes, every re-run, AND the on-demand
 * sample cards (they all run the same `SimulatedEngine`). Change a number, reload,
 * and the whole app shifts together. If a tweak is too subtle to see, it was too
 * subtle — it still applied.
 */

/** Lightness + tint strength for one neutral role, in light and dark mode. */
export type RoleTone = {
  /** Target lightness in light mode (0–1). */
  light: number
  /** Target lightness in dark mode (0–1). */
  dark: number
  /** Tint strength in light mode: multiplied by the character's neutral saturation. */
  tintLight: number
  /** Tint strength in dark mode. */
  tintDark: number
}

export const TUNING = {
  /** The comfort band — how far color is allowed to go at the extremes. */
  comfortBand: {
    /** Neutrals never go pure gray: minimum saturation kept on every neutral. */
    neutralSatFloor: 0.055,
    /** Accents never go near-pure: maximum saturation allowed on the accent. */
    accentSatCeiling: 0.8,
  },

  /**
   * The neutral ladder: lightness + tint per role, light & dark.
   * `background → surface` is the step reshaped on 2026-06-23 (tinted paper page,
   * gentle lift to the panel). `tint*` is a multiplier on the character's own
   * neutral saturation, so a louder character tints its neutrals more.
   */
  neutrals: {
    background: { light: 0.885, dark: 0.13, tintLight: 1.6, tintDark: 1.25 },
    surface: { light: 0.84, dark: 0.185, tintLight: 1.95, tintDark: 1.5 },
    text: { light: 0.17, dark: 0.93, tintLight: 1.2, tintDark: 0.7 },
    muted: { light: 0.46, dark: 0.66, tintLight: 1.1, tintDark: 0.9 },
    border: { light: 0.82, dark: 0.3, tintLight: 1.0, tintDark: 1.1 },
  } satisfies Record<string, RoleTone>,
} as const
