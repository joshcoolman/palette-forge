/**
 * Algorithmic dominant-color extraction (Scene 0). Deterministic, free, runs
 * before any agent. Median-cut quantization over sampled pixels. The pure core
 * (`quantize`, `extractFromImageData`) is testable; `extractDominantColors`
 * is the browser wrapper that rasterizes an image to a canvas.
 */

import type { RGB } from '#/features/color/color-utils'
import { rgbToHex } from '#/features/color/color-utils'

type Channel = 'r' | 'g' | 'b'

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

function averageColor(bucket: RGB[]): RGB {
  if (bucket.length === 0) return { r: 0, g: 0, b: 0 }
  let r = 0
  let g = 0
  let b = 0
  for (const px of bucket) {
    r += px.r
    g += px.g
    b += px.b
  }
  const n = bucket.length
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
}

/** Reduce a pixel set to `count` representative colors via median cut. */
export function quantize(pixels: RGB[], count: number): RGB[] {
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
  return buckets.map(averageColor)
}

/** Extract up to `count` dominant hex colors from raw RGBA image data. */
export function extractFromImageData(
  data: Uint8ClampedArray,
  count = 6,
  sampleStep = 1,
): string[] {
  const pixels: RGB[] = []
  const stride = 4 * Math.max(1, sampleStep)
  for (let i = 0; i < data.length; i += stride) {
    if (data[i + 3] < 125) continue // skip near-transparent
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
  }
  const hexes = quantize(pixels, count).map(rgbToHex)
  return Array.from(new Set(hexes))
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

/** Browser-only: rasterize a data URL to a small canvas and extract colors. */
export async function extractDominantColors(
  src: string,
  count = 6,
): Promise<string[]> {
  if (typeof document === 'undefined') return []
  const img = await loadImage(src)
  const maxDim = 120
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return []
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  return extractFromImageData(data, count, 1)
}
