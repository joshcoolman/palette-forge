import { describe, it, expect } from 'vitest'

import type { Mode, Role, ScoredPalette, Source } from '#/features/palette/types'
import { hexToHsl } from '#/features/color/color-utils'
import { SimulatedEngine } from '#/features/agent/simulated-engine'

/** Shortest distance between two hues on the 0–360 wheel. */
function hueGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

function roleHsl(take: ScoredPalette, role: Role, mode: Mode) {
  const hex = take.colors.find((c) => c.role === role)![mode]
  return { hex, ...hexToHsl(hex) }
}

function accentHue(take: ScoredPalette): number {
  return roleHsl(take, 'accent', 'light').h
}

const engine = new SimulatedEngine()

const COLOR: Source = { type: 'color', value: '#34596e', extracted: ['#34596e'] }

// A vivid, multi-color image (yellow field + red blocks + black + white, à la a
// Basquiat poster). Image-native composition should build takes from THESE
// colors, not a single hue + computed complement.
const VIVID_IMAGE: Source = {
  type: 'image',
  value: 'data:image/x,',
  extracted: ['#f2c200', '#e01b1b', '#141414', '#f4f4f0', '#7a7a30'],
}

// A flat, near-grey image (no usable vivids) — should fall through to the
// archetype path and still vary across re-runs.
const GREY_IMAGE: Source = {
  type: 'image',
  value: 'data:image/x,',
  extracted: ['#3a3a3a', '#6f6f6f', '#9a9a9a', '#c8c8c8', '#e8e8e8'],
}

describe('image-native composition', () => {
  it('builds takes from the image’s own colors (accent hue is a real anchor)', async () => {
    const takes = await engine.compose(VIVID_IMAGE)
    const anchorHues = VIVID_IMAGE.extracted.map((h) => hexToHsl(h).h)
    for (const take of takes) {
      const a = accentHue(take)
      const matches = anchorHues.some((h) => hueGap(h, a) < 12)
      expect(matches).toBe(true) // accent comes from the image, not a complement
    }
  })

  it('is deterministic for the same input', async () => {
    const a = await engine.compose(VIVID_IMAGE, undefined, 1)
    const b = await engine.compose(VIVID_IMAGE, undefined, 1)
    expect(a.map((t) => t.colors)).toEqual(b.map((t) => t.colors))
  })

  it('re-runs drift the whole palette around the wheel (surprise game)', async () => {
    const r0 = await engine.compose(VIVID_IMAGE, undefined, 0)
    const r1 = await engine.compose(VIVID_IMAGE, undefined, 1)
    const r2 = await engine.compose(VIVID_IMAGE, undefined, 2)
    // Not just the accent selection — a vivid role (secondary) shifts hue, i.e.
    // the colorway rotated, and each re-run is a distinct move from the last.
    const sec = (t: ScoredPalette) => roleHsl(t, 'secondary', 'dark').h
    expect(hueGap(sec(r0[0]), sec(r1[0]))).toBeGreaterThan(30)
    expect(hueGap(sec(r1[0]), sec(r2[0]))).toBeGreaterThan(30)
    expect(hueGap(sec(r0[0]), sec(r2[0]))).toBeGreaterThan(30)
  })

  it('light and dark are genuine inversions', async () => {
    const [take] = await engine.compose(VIVID_IMAGE)
    expect(roleHsl(take, 'background', 'dark').l).toBeLessThan(0.3)
    expect(roleHsl(take, 'background', 'light').l).toBeGreaterThan(0.8)
    expect(roleHsl(take, 'text', 'dark').l).toBeGreaterThan(0.7)
    expect(roleHsl(take, 'text', 'light').l).toBeLessThan(0.4)
  })

  it('stays in the comfort band (no pure black/white, sat-capped, muted < text)', async () => {
    const takes = await engine.compose(VIVID_IMAGE)
    for (const take of takes) {
      for (const mode of ['light', 'dark'] as Mode[]) {
        for (const c of take.colors) {
          expect(c[mode]).not.toBe('#000000')
          expect(c[mode]).not.toBe('#ffffff')
        }
        // capped at 0.8 in HSL; allow a hair for hex round-trip quantization
        expect(roleHsl(take, 'accent', mode).s).toBeLessThanOrEqual(0.82)
      }
      // muted is a dimmer partner of text in both modes (less contrast vs ground)
      expect(roleHsl(take, 'muted', 'dark').l).toBeLessThan(
        roleHsl(take, 'text', 'dark').l,
      )
    }
  })

  it('a flat grey image falls back to the archetype path and still varies', async () => {
    const r0 = await engine.compose(GREY_IMAGE, undefined, 0)
    const r1 = await engine.compose(GREY_IMAGE, undefined, 1)
    expect(r0).toHaveLength(6)
    expect(hueGap(accentHue(r0[0]), accentHue(r1[0]))).toBeGreaterThan(30)
  })
})

describe('color-seed re-run variety', () => {
  it('opening round (variation 0) is unchanged on re-compose', async () => {
    const a = (await engine.compose(COLOR, undefined, 0))[0]
    const b = (await engine.compose(COLOR, undefined, 0))[0]
    expect(accentHue(a)).toBeCloseTo(accentHue(b), 5)
  })

  it('color-seed re-runs explore harmonic relationships to the seed', async () => {
    const base = accentHue((await engine.compose(COLOR, undefined, 0))[0])
    // Round 1 is the complementary scheme (~180° off the seed); every re-run is
    // a big move, not the old "stay close" wobble. (±25° absorbs the recipe
    // jitter and rounding.)
    const v1 = accentHue((await engine.compose(COLOR, undefined, 1))[0])
    expect(hueGap(v1, (base + 180) % 360)).toBeLessThan(25)
    for (const v of [1, 2, 3]) {
      const h = accentHue((await engine.compose(COLOR, undefined, v))[0])
      expect(hueGap(h, base)).toBeGreaterThan(60)
    }
  })
})
