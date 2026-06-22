/**
 * Contrast MECHANISM — locked WCAG math. Which pairings/targets to check is
 * POLICY and lives in `knowledge/contrast.md`; this module only computes
 * ratios and enforces a welded baseline floor. Never reads markdown.
 */

import type {
  ColorRow,
  ContrastCheck,
  ContrastPolicy,
  ContrastTarget,
  Mode,
  PassLevel,
} from '#/features/palette/types'
import { MODES } from '#/features/palette/types'
import type { RGB } from '#/features/color/color-utils'
import { hexToRgb } from '#/features/color/color-utils'

const AA_TEXT = 4.5
const AAA_TEXT = 7
const EPSILON = 1e-9

const round2 = (n: number): number => Math.round(n * 100) / 100

function channel(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

/** WCAG 2.x relative luminance. */
export function relativeLuminance(rgb: RGB): number {
  return (
    0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
  )
}

/** WCAG contrast ratio between two hex colors (1–21), order-independent. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(hexToRgb(a))
  const lb = relativeLuminance(hexToRgb(b))
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

/** The achieved WCAG text level for a ratio (AAA ≥ 7, AA ≥ 4.5, else fail). */
export function classify(ratio: number): PassLevel {
  if (ratio + EPSILON >= AAA_TEXT) return 'AAA'
  if (ratio + EPSILON >= AA_TEXT) return 'AA'
  return 'fail'
}

/** Resolve a target to its numeric ratio. */
export function targetRatio(target: ContrastTarget): number {
  if (target === 'AA') return AA_TEXT
  if (target === 'AAA') return AAA_TEXT
  return target
}

export function meetsTarget(ratio: number, target: ContrastTarget): boolean {
  return ratio + EPSILON >= targetRatio(target)
}

/** Split a `"fg-on-bg"` pairing into its two role names. */
export function parsePairing(
  pairing: string,
): { fg: string; bg: string } | null {
  const idx = pairing.indexOf('-on-')
  if (idx === -1) return null
  const fg = pairing.slice(0, idx)
  const bg = pairing.slice(idx + 4)
  if (!fg || !bg) return null
  return { fg, bg }
}

/** Resolve a pairing to concrete fg/bg hex values for a mode, or null. */
export function resolvePairing(
  colors: ColorRow[],
  pairing: string,
  mode: Mode,
): { fg: string; bg: string } | null {
  const roles = parsePairing(pairing)
  if (!roles) return null
  const fgRow = colors.find((c) => c.role === roles.fg)
  const bgRow = colors.find((c) => c.role === roles.bg)
  if (!fgRow || !bgRow) return null
  return { fg: fgRow[mode], bg: bgRow[mode] }
}

/**
 * Compute the full `contrast[]` for a palette: every policy pairing in both
 * modes. `passes` is the honest achieved WCAG text level (AA/AAA/fail).
 */
export function computeContrastChecks(
  colors: ColorRow[],
  policy: ContrastPolicy,
): ContrastCheck[] {
  const checks: ContrastCheck[] = []
  for (const p of policy.pairings) {
    for (const mode of MODES) {
      const resolved = resolvePairing(colors, p.pairing, mode)
      if (!resolved) continue
      const ratio = contrastRatio(resolved.fg, resolved.bg)
      checks.push({
        pairing: p.pairing,
        mode,
        ratio: round2(ratio),
        passes: classify(ratio),
      })
    }
  }
  return checks
}

export type PolicyFailure = {
  pairing: string
  mode: Mode
  ratio: number
  target: ContrastTarget
  required: number
}

/** The pairings that fall short of their policy target — the revise list. */
export function policyFailures(
  colors: ColorRow[],
  policy: ContrastPolicy,
): PolicyFailure[] {
  const failures: PolicyFailure[] = []
  for (const p of policy.pairings) {
    for (const mode of MODES) {
      const resolved = resolvePairing(colors, p.pairing, mode)
      if (!resolved) continue
      const ratio = contrastRatio(resolved.fg, resolved.bg)
      if (!meetsTarget(ratio, p.target)) {
        failures.push({
          pairing: p.pairing,
          mode,
          ratio: round2(ratio),
          target: p.target,
          required: targetRatio(p.target),
        })
      }
    }
  }
  return failures
}

/**
 * The welded floor. Even if `knowledge/contrast.md` is deleted or malformed,
 * text legibility on background and surface is enforced at AA. Knowledge can
 * tighten or add pairings; it can never drop below this.
 */
export const BASELINE: ContrastPolicy = {
  baseline: 'AA',
  pairings: [
    { pairing: 'text-on-background', target: 'AA' },
    { pairing: 'text-on-surface', target: 'AA' },
  ],
}
