import { describe, it, expect } from 'vitest'

import type { Palette } from '#/features/palette/types'
import {
  toCssVars,
  toHexList,
  toTailwindV3,
  toTailwindV4,
} from '#/features/palette/export'

const palette: Palette = {
  id: 'x',
  name: 'Test Palette',
  seed: { type: 'color', value: '#3d405b' },
  colors: [
    { role: 'background', light: '#ffffff', dark: '#111111' },
    { role: 'surface', light: '#f2f2f2', dark: '#1d1d1d' },
    { role: 'text', light: '#111111', dark: '#f5f5f5' },
    { role: 'muted', light: '#767676', dark: '#9a9a9a' },
    { role: 'accent', light: '#0a66c2', dark: '#5aa9e6' },
    { role: 'border', light: '#cccccc', dark: '#3a3a3a' },
    { role: 'secondary', light: '#5c7a4a', dark: '#7fa05c' },
  ],
  contrast: [],
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('palette export', () => {
  it('CSS variables cover every role in :root and .dark', () => {
    const css = toCssVars(palette)
    expect(css).toContain(':root')
    expect(css).toContain('.dark')
    expect(css).toContain('--background: #ffffff;')
    expect(css).toContain('--accent: #5aa9e6;')
    expect(css).toContain('--secondary: #5c7a4a;')
  })

  it('Tailwind v4 emits a @theme block; v3 emits a config + darkMode', () => {
    const v4 = toTailwindV4(palette)
    expect(v4).toContain('@theme')
    expect(v4).toContain('--color-accent: var(--accent);')
    const v3 = toTailwindV3(palette)
    expect(v3).toContain("darkMode: 'class'")
    expect(v3).toContain("accent: 'var(--accent)'")
  })

  it('the hex list carries every role with light and dark', () => {
    const hex = toHexList(palette)
    expect(hex).toContain('#ffffff')
    expect(hex).toContain('#5aa9e6')
    expect(hex).toContain('#7fa05c')
    expect(hex.split('\n')).toHaveLength(7)
  })
})
