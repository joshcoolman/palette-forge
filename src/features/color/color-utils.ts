/**
 * Pure color math — hex/RGB/HSL conversion and HSL-space adjustments.
 * No React, no LLM. Locked mechanism, shared by the contrast verifier and
 * both engines.
 */

export type RGB = { r: number; g: number; b: number } // channels 0–255
export type HSL = { h: number; s: number; l: number } // h 0–360, s/l 0–1

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

const round255 = (n: number): number => clamp(Math.round(n), 0, 255)

export function isValidHex(hex: string): boolean {
  return HEX_RE.test(hex.trim())
}

/** Normalize to lowercase `#rrggbb`, expanding shorthand. Null if invalid. */
export function normalizeHex(hex: string): string | null {
  const match = HEX_RE.exec(hex.trim())
  if (!match) return null
  let body = match[1]!.toLowerCase() // group 1 is always present on a match
  if (body.length === 3) {
    body = body.replace(/(.)/g, '$1$1') // expand shorthand: abc → aabbcc
  }
  return `#${body}`
}

export function hexToRgb(hex: string): RGB {
  const norm = normalizeHex(hex)
  if (!norm) throw new Error(`Invalid hex color: ${hex}`)
  return {
    r: parseInt(norm.slice(1, 3), 16),
    g: parseInt(norm.slice(3, 5), 16),
    b: parseInt(norm.slice(5, 7), 16),
  }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const hh = (n: number): string => round255(n).toString(16).padStart(2, '0')
  return `#${hh(r)}${hh(g)}${hh(b)}`
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0)
        break
      case gn:
        h = (bn - rn) / d + 2
        break
      default:
        h = (rn - gn) / d + 4
        break
    }
    h *= 60
  }
  return { h, s, l }
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const hue = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - c / 2
  let rp = 0
  let gp = 0
  let bp = 0
  if (hue < 60) [rp, gp, bp] = [c, x, 0]
  else if (hue < 120) [rp, gp, bp] = [x, c, 0]
  else if (hue < 180) [rp, gp, bp] = [0, c, x]
  else if (hue < 240) [rp, gp, bp] = [0, x, c]
  else if (hue < 300) [rp, gp, bp] = [x, 0, c]
  else [rp, gp, bp] = [c, 0, x]
  return {
    r: round255((rp + m) * 255),
    g: round255((gp + m) * 255),
    b: round255((bp + m) * 255),
  }
}

export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex))
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl))
}

/** Set absolute lightness (0–1). */
export function withLightness(hex: string, l: number): string {
  return hslToHex({ ...hexToHsl(hex), l: clamp(l, 0, 1) })
}

/** Nudge lightness by a delta, clamped to [0, 1]. */
export function adjustLightness(hex: string, delta: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, l: clamp(hsl.l + delta, 0, 1) })
}

/** Set absolute saturation (0–1). */
export function withSaturation(hex: string, s: number): string {
  return hslToHex({ ...hexToHsl(hex), s: clamp(s, 0, 1) })
}

/** Rotate hue by degrees (wraps 0–360). */
export function rotateHue(hex: string, degrees: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, h: (((hsl.h + degrees) % 360) + 360) % 360 })
}

/** Linear RGB blend; t=0 → a, t=1 → b. */
export function mix(a: string, b: string, t: number): string {
  const ratio = clamp(t, 0, 1)
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * ratio,
    g: ca.g + (cb.g - ca.g) * ratio,
    b: ca.b + (cb.b - ca.b) * ratio,
  })
}
