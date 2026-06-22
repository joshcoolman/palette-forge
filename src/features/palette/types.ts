/**
 * The data model. Palettes are clean, addressable records with stable IDs
 * (MCP-ready later) — never buried in React state. The agent proposes colors;
 * code computes contrast; the UI renders records.
 */

export type Role = 'background' | 'surface' | 'text' | 'muted' | 'accent' | 'border'

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
 */
export type Source = { type: 'image' | 'color'; value: string; extracted: string[] }

/** The addressable palette record. Persisted in IndexedDB. */
export type Palette = {
  id: string
  name: string
  seed: Seed
  colors: ColorRow[]
  contrast: ContrastCheck[]
  createdAt: string
}

/** Harmony families a palette can be taken toward. */
export type PaletteType =
  | 'monochrome'
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'editorial'

export const PALETTE_TYPES: readonly PaletteType[] = [
  'monochrome',
  'analogous',
  'complementary',
  'triadic',
  'editorial',
] as const

/** A proposed direction shown in Scene 1 (one per palette type). */
export type Direction = {
  type: PaletteType
  label: string
  character: string
  preview: string[]
  recommended: boolean
}

/** The agent's judgment of a composed palette (0–100 per dimension). */
export type Score = {
  overall: number
  harmony: number
  contrast: number
  cohesion: number
  rationale: string
}

/** A composed palette carrying its type and the agent's score (Scene 2). */
export type ScoredPalette = Palette & { type: PaletteType; score: Score }

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
