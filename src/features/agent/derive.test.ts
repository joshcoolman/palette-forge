import { describe, expect, it } from 'vitest'

import { deriveRound } from '#/features/agent/derive'
import { hexToHsl } from '#/features/color/color-utils'
import { ROLES } from '#/features/palette/types'
import type { ScoredPalette } from '#/features/palette/types'

function basePalette(name: string, accentHex: string): ScoredPalette {
  const colors = ROLES.map((role) => ({
    role,
    light: role === 'accent' ? accentHex : '#9a9a9a',
    dark: role === 'accent' ? accentHex : '#3a3a3a',
  }))
  return {
    id: `base-${name}`,
    name,
    seed: { type: 'color', value: accentHex },
    colors,
    contrast: [],
    createdAt: '2026-06-24T00:00:00Z',
    character: 'base',
  }
}

function accentHue(p: ScoredPalette): number {
  return hexToHsl(p.colors.find((c) => c.role === 'accent')!.dark).h
}

const base = [basePalette('Red One', '#cc2222'), basePalette('Green Two', '#22aa44')]

describe('deriveRound', () => {
  it('returns a variation per base palette, fresh ids + names, all roles intact', () => {
    const out = deriveRound(base, 1, new Set(base.map((p) => p.name)))
    expect(out).toHaveLength(base.length)
    expect(out.map((p) => p.id)).not.toEqual(base.map((p) => p.id)) // fresh records
    expect(out.some((p) => base.map((b) => b.name).includes(p.name))).toBe(false)
    expect(out.every((p) => p.colors.length === ROLES.length)).toBe(true)
  })

  it('rotates the whole colorway by the harmonic offset (variation 1 ≈ +137.5°)', () => {
    const out = deriveRound(base, 1, new Set())
    const delta = (((accentHue(out[0]!) - accentHue(base[0]!)) % 360) + 360) % 360
    expect(Math.abs(delta - 137.508)).toBeLessThan(8) // hex round-trip slack
  })

  it('variation 0 is an identity rotation (same hues, fresh records)', () => {
    const out = deriveRound(base, 0, new Set())
    const delta = (((accentHue(out[1]!) - accentHue(base[1]!)) % 360) + 360) % 360
    expect(Math.min(delta, 360 - delta)).toBeLessThan(8)
  })
})
