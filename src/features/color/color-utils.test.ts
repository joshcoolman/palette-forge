import { describe, it, expect } from 'vitest'

import {
  adjustLightness,
  hexToRgb,
  hslToRgb,
  isValidHex,
  mix,
  normalizeHex,
  rgbToHex,
  rgbToHsl,
  rotateHue,
} from '#/features/color/color-utils'

describe('hex parsing', () => {
  it('expands shorthand and lowercases', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc')
    expect(normalizeHex('FFF')).toBe('#ffffff')
    expect(normalizeHex('#1a2b3c')).toBe('#1a2b3c')
  })

  it('rejects invalid input', () => {
    expect(normalizeHex('nope')).toBeNull()
    expect(normalizeHex('#12')).toBeNull()
    expect(isValidHex('#abcd')).toBe(false)
    expect(isValidHex('#abc')).toBe(true)
  })

  it('round-trips hex <-> rgb', () => {
    expect(rgbToHex(hexToRgb('#1a2b3c'))).toBe('#1a2b3c')
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('throws on invalid hex', () => {
    expect(() => hexToRgb('xyz')).toThrow()
  })
})

describe('hsl conversion', () => {
  it('round-trips rgb <-> hsl within tolerance', () => {
    for (const hex of ['#1a2b3c', '#e07a5f', '#3d405b', '#81b29a', '#f2cc8f']) {
      const back = rgbToHex(hslToRgb(rgbToHsl(hexToRgb(hex))))
      const a = hexToRgb(hex)
      const b = hexToRgb(back)
      expect(Math.abs(a.r - b.r)).toBeLessThanOrEqual(1)
      expect(Math.abs(a.g - b.g)).toBeLessThanOrEqual(1)
      expect(Math.abs(a.b - b.b)).toBeLessThanOrEqual(1)
    }
  })

  it('grayscale has zero saturation', () => {
    expect(rgbToHsl(hexToRgb('#808080')).s).toBe(0)
  })
})

describe('adjustments', () => {
  it('rotating hue 360° is a no-op (within tolerance)', () => {
    expect(rotateHue('#e07a5f', 360)).toBe('#e07a5f')
  })

  it('clamps lightness at the extremes', () => {
    expect(adjustLightness('#ffffff', 0.5)).toBe('#ffffff')
    expect(adjustLightness('#000000', -0.5)).toBe('#000000')
  })

  it('mixes toward the midpoint', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000')
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff')
  })
})
