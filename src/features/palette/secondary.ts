/**
 * Derive the `secondary` role from a ground (background) hex, using the same
 * taste knob the engine composes with (`DERIVATION[mode].secondary`). The engine
 * emits `secondary` directly from the base hue; this helper recovers it from a
 * background color when it's missing — e.g. palettes saved before `secondary`
 * existed — so cards/exports can show all seven roles without a migration.
 */

import type { Mode } from '#/features/palette/types'
import { hexToHsl, hslToHex } from '#/features/color/color-utils'
import { DERIVATION } from '#/features/palette/tuning'

export function secondaryFor(groundHex: string, mode: Mode): string {
  const g = hexToHsl(groundHex)
  const d = DERIVATION[mode].secondary
  return hslToHex({ h: (g.h + d.shift) % 360, s: d.s, l: d.l })
}
