import { describe, it, expect } from 'vitest'

import type { ScoredPalette, Source } from '#/features/palette/types'
import { hexToHsl } from '#/features/color/color-utils'
import { SimulatedEngine } from '#/features/agent/simulated-engine'

/** Shortest distance between two hues on the 0–360 wheel. */
function hueGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

function accentHue(take: ScoredPalette): number {
  const hex = take.colors.find((c) => c.role === 'accent')!.light
  return hexToHsl(hex).h
}

const engine = new SimulatedEngine()

// A deliberately hue-narrow image (all browns/olives, like the bottle-cap
// photo): the prior "walk the image's own colors" approach collapsed to a
// wobble here. Re-runs must still diverge boldly.
const NARROW_IMAGE: Source = {
  type: 'image',
  value: 'data:image/x,',
  extracted: ['#5b4a2a', '#6f6b49', '#807040', '#4e4a32', '#8a7a4a'],
}

const COLOR: Source = { type: 'color', value: '#34596e', extracted: ['#34596e'] }

describe('keyless re-run variety', () => {
  it('opening round (variation 0) is unchanged regardless of source type', async () => {
    const [img] = await engine.compose(NARROW_IMAGE, undefined, undefined, 0)
    const again = (await engine.compose(NARROW_IMAGE, undefined, undefined, 0))[0]
    expect(accentHue(img)).toBeCloseTo(accentHue(again), 5)
  })

  it('image re-runs rotate into clearly different hue families', async () => {
    const hues = await Promise.all(
      [0, 1, 2, 3].map(async (v) =>
        accentHue((await engine.compose(NARROW_IMAGE, undefined, undefined, v))[0]),
      ),
    )
    // The first re-run leaves the opening's family, and every re-run is a big
    // jump from the one before it — "click again, clearly different." (We don't
    // assert distance from the opening for *all* rounds: golden-angle spreading
    // intentionally lets a later round sweep back near the start.)
    expect(hueGap(hues[1], hues[0])).toBeGreaterThan(60)
    for (let v = 1; v < hues.length; v += 1) {
      expect(hueGap(hues[v], hues[v - 1])).toBeGreaterThan(60)
    }
  })

  it('color-seed re-runs stay close to the seed hue', async () => {
    const base = accentHue((await engine.compose(COLOR, undefined, undefined, 0))[0])
    for (const v of [1, 2, 3]) {
      const h = accentHue((await engine.compose(COLOR, undefined, undefined, v))[0])
      expect(hueGap(h, base)).toBeLessThan(25)
    }
  })
})
