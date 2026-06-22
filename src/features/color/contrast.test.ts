import { describe, it, expect } from 'vitest'

import type { ColorRow, ContrastPolicy } from '#/features/palette/types'
import {
  classify,
  computeContrastChecks,
  contrastRatio,
  meetsTarget,
  parsePairing,
  policyFailures,
} from '#/features/color/contrast'

describe('contrastRatio', () => {
  it('is 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
  })

  it('is 1:1 for a color on itself', () => {
    expect(contrastRatio('#3d405b', '#3d405b')).toBeCloseTo(1, 5)
  })

  it('is order-independent', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(
      contrastRatio('#ffffff', '#767676'),
      10,
    )
  })

  it('matches the known #767676-on-white boundary (~4.54)', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
  })
})

describe('classify', () => {
  it('labels by achieved WCAG text level', () => {
    expect(classify(21)).toBe('AAA')
    expect(classify(7)).toBe('AAA')
    expect(classify(6.99)).toBe('AA')
    expect(classify(4.5)).toBe('AA')
    expect(classify(4.49)).toBe('fail')
    expect(classify(1)).toBe('fail')
  })
})

describe('meetsTarget', () => {
  it('honors named and numeric targets', () => {
    expect(meetsTarget(4.5, 'AA')).toBe(true)
    expect(meetsTarget(4.49, 'AA')).toBe(false)
    expect(meetsTarget(7, 'AAA')).toBe(true)
    expect(meetsTarget(3.2, 3)).toBe(true)
    expect(meetsTarget(2.9, 3)).toBe(false)
  })
})

describe('parsePairing', () => {
  it('splits fg-on-bg', () => {
    expect(parsePairing('text-on-background')).toEqual({
      fg: 'text',
      bg: 'background',
    })
    expect(parsePairing('garbage')).toBeNull()
  })
})

const COLORS: ColorRow[] = [
  { role: 'background', light: '#ffffff', dark: '#111111' },
  { role: 'surface', light: '#f2f2f2', dark: '#1d1d1d' },
  { role: 'text', light: '#111111', dark: '#f5f5f5' },
  { role: 'muted', light: '#767676', dark: '#9a9a9a' },
  { role: 'accent', light: '#0a66c2', dark: '#5aa9e6' },
  { role: 'border', light: '#cccccc', dark: '#3a3a3a' },
]

const POLICY: ContrastPolicy = {
  baseline: 'AA',
  pairings: [
    { pairing: 'text-on-background', target: 'AAA' },
    { pairing: 'text-on-surface', target: 'AA' },
    { pairing: 'border-on-background', target: 3 },
  ],
}

describe('computeContrastChecks', () => {
  it('produces a check per pairing per mode with honest pass levels', () => {
    const checks = computeContrastChecks(COLORS, POLICY)
    expect(checks).toHaveLength(POLICY.pairings.length * 2)

    const textOnBgLight = checks.find(
      (c) => c.pairing === 'text-on-background' && c.mode === 'light',
    )
    expect(textOnBgLight?.passes).toBe('AAA')
    expect(textOnBgLight?.ratio).toBeGreaterThan(7)
  })
})

describe('policyFailures', () => {
  it('flags only pairings below their target', () => {
    const failures = policyFailures(COLORS, POLICY)
    // #cccccc border on #ffffff is ~1.6 — below the 3.0 non-text target (light mode).
    expect(
      failures.some(
        (f) => f.pairing === 'border-on-background' && f.mode === 'light',
      ),
    ).toBe(true)
    // text-on-background easily clears AAA in both modes.
    expect(failures.some((f) => f.pairing === 'text-on-background')).toBe(false)
  })
})
