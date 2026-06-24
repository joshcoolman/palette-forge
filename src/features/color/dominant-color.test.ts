import { describe, it, expect } from 'vitest'

import { hexToHsl, rgbToHsl } from '#/features/color/color-utils'
import {
  circularMeanHue,
  extractFromImageData,
  representative,
} from '#/features/color/dominant-color'

/** Build RGBA image data from a list of [r,g,b,count] runs (alpha 255). */
function imageData(runs: [number, number, number, number][]): Uint8ClampedArray {
  const total = runs.reduce((n, [, , , c]) => n + c, 0)
  const data = new Uint8ClampedArray(total * 4)
  let i = 0
  for (const [r, g, b, count] of runs) {
    for (let k = 0; k < count; k += 1) {
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
      i += 4
    }
  }
  return data
}

describe('dominant-color extraction', () => {
  it('representative keeps a saturated bucket saturated (no RGB-mean muddying)', () => {
    // A bucket of vivid reds with a couple of darker reds mixed in. The old RGB
    // mean would desaturate toward grey; the percentile/median representative
    // should stay clearly red and saturated.
    const reds = [
      { r: 230, g: 20, b: 20 },
      { r: 255, g: 0, b: 0 },
      { r: 200, g: 30, b: 30 },
      { r: 120, g: 10, b: 10 },
    ]
    const hsl = rgbToHsl(representative(reds))
    expect(hsl.s).toBeGreaterThan(0.6)
    expect(hsl.h < 20 || hsl.h > 340).toBe(true) // a red hue
  })

  it('circularMeanHue averages on the wheel (reds straddling 0/360)', () => {
    const h = circularMeanHue([350, 10])
    expect(Math.min(h, 360 - h)).toBeLessThan(5) // ~0°, not ~180°
  })

  it('orders by prominence and includes a dark + a light anchor', () => {
    // A black field, a white field, and a smaller vivid-red block.
    const data = imageData([
      [0, 0, 0, 60],
      [255, 255, 255, 30],
      [230, 20, 20, 30],
    ])
    const hexes = extractFromImageData(data, 12)
    const hsls = hexes.map(hexToHsl)

    // The vivid red is the most "prominent" (area x vibrancy) → leads the order.
    expect(hexToHsl(hexes[0]).s).toBeGreaterThan(0.6)
    // Dark + light anchors are present for the composer's ground/text.
    expect(hsls.some((c) => c.l < 0.22)).toBe(true)
    expect(hsls.some((c) => c.l > 0.85)).toBe(true)
  })
})
