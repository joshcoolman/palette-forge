/**
 * Algorithmic dominant-color extraction (Scene 0). Deterministic, free, runs
 * before any agent. Median-cut quantization over sampled pixels, then a
 * character-preserving representative per bucket and a prominence ordering, so
 * the output anchors stay vivid (a yellow field reads as yellow, not olive) and
 * are ordered most-prominent-first — the order the image-native composer relies
 * on. The pure core (`quantize`, `extractFromImageData`) is testable;
 * `extractDominantColors` is the browser wrapper that rasterizes to a canvas.
 */

import type { RGB } from '#/features/color/color-utils'
import { rgbToHex, rgbToHsl, hslToRgb } from '#/features/color/color-utils'

type Channel = 'r' | 'g' | 'b'

/** A quantized bucket: its representative color + how many pixels fell in it. */
export type Swatch = { rgb: RGB; weight: number }

function widestChannel(bucket: RGB[]): { channel: Channel; range: number } {
  let best: Channel = 'r'
  let bestRange = -1
  for (const channel of ['r', 'g', 'b'] as Channel[]) {
    let min = 255
    let max = 0
    for (const px of bucket) {
      if (px[channel] < min) min = px[channel]
      if (px[channel] > max) max = px[channel]
    }
    const range = max - min
    if (range > bestRange) {
      bestRange = range
      best = channel
    }
  }
  return { channel: best, range: bestRange }
}

/** The p-th percentile (0–1) of a numeric list. Pure, sorts a copy. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round(p * (sorted.length - 1))),
  )
  return sorted[idx]
}

/** Median of a numeric list. */
export function median(values: number[]): number {
  return percentile(values, 0.5)
}

/**
 * Average hue on the color wheel (sin/cos mean) — the linear mean would put two
 * reds straddling 0°/360° at ~180° (cyan). Returns 0–360; defaults to the first
 * sample's hue when the vector sum is degenerate (all greys).
 */
export function circularMeanHue(hues: number[]): number {
  if (hues.length === 0) return 0
  let x = 0
  let y = 0
  for (const h of hues) {
    const r = (h * Math.PI) / 180
    x += Math.cos(r)
    y += Math.sin(r)
  }
  if (x === 0 && y === 0) return hues[0]
  const deg = (Math.atan2(y, x) * 180) / Math.PI
  return (deg + 360) % 360
}

/**
 * A character-preserving representative for a bucket: the circular-mean hue, the
 * 75th-percentile saturation (pull toward the vivid members rather than a
 * desaturating RGB mean), and the median lightness (robust — keeps a near-black
 * bucket black and a near-white bucket near-white).
 */
export function representative(bucket: RGB[]): RGB {
  if (bucket.length === 0) return { r: 0, g: 0, b: 0 }
  const hsls = bucket.map(rgbToHsl)
  return hslToRgb({
    h: circularMeanHue(hsls.map((c) => c.h)),
    s: percentile(
      hsls.map((c) => c.s),
      0.75,
    ),
    l: median(hsls.map((c) => c.l)),
  })
}

/** Reduce a pixel set to `count` representative swatches (with weights) via
 *  median cut. */
export function quantize(pixels: RGB[], count: number): Swatch[] {
  if (count < 1 || pixels.length === 0) return []
  let buckets: RGB[][] = [pixels.slice()]
  while (buckets.length < count) {
    let targetIndex = -1
    let targetRange = -1
    let targetChannel: Channel = 'r'
    buckets.forEach((bucket, i) => {
      if (bucket.length < 2) return
      const { channel, range } = widestChannel(bucket)
      if (range > targetRange) {
        targetRange = range
        targetIndex = i
        targetChannel = channel
      }
    })
    if (targetIndex === -1) break
    const bucket = buckets[targetIndex]
    bucket.sort((a, b) => a[targetChannel] - b[targetChannel])
    const mid = Math.floor(bucket.length / 2)
    buckets = [
      ...buckets.slice(0, targetIndex),
      bucket.slice(0, mid),
      bucket.slice(mid),
      ...buckets.slice(targetIndex + 1),
    ]
  }
  return buckets.map((bucket) => ({
    rgb: representative(bucket),
    weight: bucket.length,
  }))
}

/** How much a swatch "pops": saturated and mid-light score highest. */
function vibrancy(s: number, l: number): number {
  return s * (1 - Math.abs(l - 0.5) * 0.6)
}

/**
 * Extract up to `count` dominant hex colors from raw RGBA image data, ordered
 * most-prominent-first (area × vibrancy), and guaranteed to include a near-dark
 * and a near-light anchor so the image-native composer always has a ground and a
 * text color drawn from the real image.
 */
export function extractFromImageData(
  data: Uint8ClampedArray,
  count = 12,
  sampleStep = 1,
): string[] {
  const pixels: RGB[] = []
  const stride = 4 * Math.max(1, sampleStep)
  for (let i = 0; i < data.length; i += stride) {
    if (data[i + 3] < 125) continue // skip near-transparent
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
  }
  const total = pixels.length
  if (total === 0) return []

  const scored = quantize(pixels, count).map((sw) => {
    const hsl = rgbToHsl(sw.rgb)
    const areaFrac = sw.weight / total
    return {
      hex: rgbToHex(sw.rgb),
      l: hsl.l,
      // Area floor so a big flat field still ranks even if low-vibrancy.
      prominence: areaFrac * (0.35 + vibrancy(hsl.s, hsl.l)),
    }
  })
  scored.sort((a, b) => b.prominence - a.prominence)

  // Guarantee a dark + a light anchor near the front so the composer never has to
  // invent black/white. If the prominent set lacks one, hoist the darkest /
  // lightest real swatch (still an image pixel) to the end of the order.
  const ordered = scored.map((s) => s.hex)
  if (!scored.some((s) => s.l < 0.22)) {
    const darkest = [...scored].sort((a, b) => a.l - b.l)[0]
    if (darkest) ordered.push(darkest.hex)
  }
  if (!scored.some((s) => s.l > 0.85)) {
    const lightest = [...scored].sort((a, b) => b.l - a.l)[0]
    if (lightest) ordered.push(lightest.hex)
  }

  return Array.from(new Set(ordered)) // dedupe, first-seen wins → order survives
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

/**
 * Browser-only: rasterize an image (data URL) down to a small canvas — the exact
 * bitmap the extractor samples. Shared so a UI peek can show the same pixels.
 */
export async function rasterizeSmall(
  src: string,
  maxDim = 120,
): Promise<HTMLCanvasElement | null> {
  if (typeof document === 'undefined') return null
  const img = await loadImage(src)
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, w, h)
  return canvas
}

/** Browser-only: rasterize a data URL to a small canvas and extract colors. */
export async function extractDominantColors(
  src: string,
  count = 12,
): Promise<string[]> {
  const canvas = await rasterizeSmall(src)
  if (!canvas) return []
  const ctx = canvas.getContext('2d')
  if (!ctx) return []
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return extractFromImageData(data, count, 1)
}
