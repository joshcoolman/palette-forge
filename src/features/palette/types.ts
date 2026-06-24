/**
 * The data model. Palettes are clean, addressable records with stable IDs
 * (MCP-ready later) — never buried in React state. The agent proposes colors;
 * code computes contrast; the UI renders records.
 */

export type Role =
  | 'background'
  | 'surface'
  | 'text'
  | 'muted'
  | 'accent'
  | 'border'

export const ROLES: readonly Role[] = [
  'background',
  'surface',
  'text',
  'muted',
  'accent',
  'border',
] as const

export type Mode = 'light' | 'dark'

export const MODES: readonly Mode[] = ['light', 'dark'] as const

/** WCAG conformance level a pairing reaches, or `fail` if below the AA floor. */
export type PassLevel = 'AA' | 'AAA' | 'fail'

/**
 * A contrast target: a named WCAG level, or an explicit numeric ratio
 * (e.g. 3.0 for non-text UI components, per WCAG 1.4.11).
 */
export type ContrastTarget = 'AA' | 'AAA' | number

/** A single role's color in both modes. */
export type ColorRow = { role: Role; light: string; dark: string }

/** One computed contrast result for a role-pairing in one mode. */
export type ContrastCheck = {
  pairing: string
  mode: Mode
  ratio: number
  passes: PassLevel
}

/** What seeded a palette. `image` value is a data URL; `color` value is a hex. */
export type Seed = { type: 'image' | 'color'; value: string }

/**
 * The live input to a journey: the seed plus the anchor colors extracted from
 * it (dominant colors for an image, a derived neighborhood for a seed color).
 *
 * `images` and `prompt` are forward-compat seams for the deferred mood-board
 * step (N inspiration images + an optional color-related prompt). v1 ships
 * single-image and leaves them unset; the engine reads them when present, so
 * mood-board is additive — not a reshape of `Source` and every consumer.
 */
export type Source = {
  type: 'image' | 'color'
  value: string
  extracted: string[]
  /** Additional inspiration images (mood board). v1 unset; reserved. */
  images?: string[]
  /** Optional color-related steer (e.g. a brand-color hint). v1 unset. */
  prompt?: string
}

/** The addressable palette record. Persisted in IndexedDB. */
export type Palette = {
  id: string
  name: string
  seed: Seed
  colors: ColorRow[]
  contrast: ContrastCheck[]
  createdAt: string
}

/**
 * A composed palette carrying the free-form `character` named for this take
 * (e.g. "Deep jewel ground with a bright complementary spark.") — not a fixed
 * taxonomy type. (Name kept as `ScoredPalette` for continuity across the app;
 * there is no longer a numeric score.)
 */
export type ScoredPalette = Palette & { character?: string }

/** One pairing the contrast policy requires, with its target. */
export type PolicyPairing = { pairing: string; target: ContrastTarget }

/**
 * Contrast policy parsed from `knowledge/contrast.md` frontmatter. It drives
 * BOTH the agent's self-check rubric and the code verifier. `baseline` is the
 * floor the welded mechanism enforces regardless of knowledge edits.
 */
export type ContrastPolicy = {
  baseline: 'AA' | 'AAA'
  pairings: PolicyPairing[]
}
