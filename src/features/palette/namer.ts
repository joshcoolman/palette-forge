/**
 * Deterministic palette naming — replaces the LLM's evocative names with a
 * code namer in the same voice as the curated seed swatches (Polar Night, Loden
 * Frost, Caramel Café). A name is `<hue/material> <mood>`: the first word comes
 * from the accent's hue bucket, the second from the take's character. The pick
 * among synonyms is hashed from the palette's own colors, so a given palette
 * always gets the same name, but different palettes vary. Names are deduped
 * within the four of a round (pass a shared `seen` set).
 */

import type { ColorRow } from '#/features/palette/types'
import { hexToHsl } from '#/features/color/color-utils'

// 12 hue buckets spanning the wheel, four synonyms each, in the seed-swatch
// voice. Disjoint from the mood words below so a name never doubles ("Midnight
// Midnight").
function hueWords(h: number): string[] {
  if (h < 18 || h >= 345)
    return ['Ember', 'Rust', 'Garnet', 'Brick', 'Cinnabar', 'Vermilion']
  if (h < 45)
    return ['Amber', 'Copper', 'Caramel', 'Tangerine', 'Ochre', 'Marmalade']
  if (h < 65)
    return ['Brass', 'Honey', 'Tawny', 'Saffron', 'Wheat', 'Goldenrod']
  if (h < 95)
    return ['Olive', 'Chartreuse', 'Citron', 'Loden', 'Pear', 'Absinthe']
  if (h < 150) return ['Fern', 'Moss', 'Pine', 'Clover', 'Basil', 'Juniper']
  if (h < 185)
    return ['Spruce', 'Cypress', 'Jade', 'Verdant', 'Sage', 'Eucalyptus']
  if (h < 205) return ['Tidal', 'Lagoon', 'Teal', 'Harbor', 'Aqua', 'Reef']
  if (h < 240)
    return ['Frost', 'Glacier', 'Steel', 'Slate', 'Mist', 'Cerulean']
  if (h < 265)
    return ['Cobalt', 'Sapphire', 'Indigo', 'Azure', 'Denim', 'Marine']
  if (h < 290)
    return ['Iris', 'Violet', 'Periwinkle', 'Wisteria', 'Lavender', 'Ultramarine']
  if (h < 320)
    return ['Plum', 'Amethyst', 'Orchid', 'Mauve', 'Lilac', 'Heather']
  return ['Rose', 'Magenta', 'Fuchsia', 'Mulberry', 'Cerise', 'Peony']
}

const NEUTRAL_WORDS = ['Ash', 'Stone', 'Pewter', 'Linen', 'Graphite', 'Smoke']

const MOOD: Record<string, string[]> = {
  Vivid: ['Flare', 'Bold', 'Spark', 'Pop', 'Blaze', 'Punch'],
  Composed: ['Studio', 'Quarter', 'Press', 'Atelier', 'Bureau', 'Salon'],
  Nocturne: ['Midnight', 'Deep', 'Onyx', 'Eclipse', 'Shadow', 'Dusk'],
  Hush: ['Hush', 'Veil', 'Calm', 'Drift', 'Whisper', 'Lull'],
}
const MOOD_FALLBACK = ['Take', 'Mix', 'Cut', 'Set', 'Edit', 'Draft']

/** FNV-1a — a small deterministic string hash. */
function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h | 0)
}

function rowLight(colors: ColorRow[], role: string): string {
  return colors.find((c) => c.role === role)?.light ?? '#888888'
}

/**
 * Name a palette. `kind` is the take's character key (Vivid/Composed/…); `seen`
 * collects names already used this round so the four don't collide.
 */
export function nameFor(
  colors: ColorRow[],
  kind: string,
  seen: Set<string>,
): string {
  const accent = hexToHsl(rowLight(colors, 'accent'))
  const aWords = accent.s < 0.12 ? NEUTRAL_WORDS : hueWords(accent.h)
  const bWords = MOOD[kind] ?? MOOD_FALLBACK
  const seed = hashStr(colors.map((c) => c.light).join(''))

  // Walk synonym combinations from the hashed starting point; take the first
  // that isn't already used this round.
  for (let i = 0; i < aWords.length; i += 1) {
    for (let j = 0; j < bWords.length; j += 1) {
      const name = `${aWords[(seed + i) % aWords.length]} ${bWords[(seed + j) % bWords.length]}`
      if (!seen.has(name)) {
        seen.add(name)
        return name
      }
    }
  }
  // Exhausted (≥16 collisions in one round — practically never): number it.
  const base = `${aWords[seed % aWords.length]} ${bWords[seed % bWords.length]}`
  let n = 2
  while (seen.has(`${base} ${n}`)) n += 1
  const name = `${base} ${n}`
  seen.add(name)
  return name
}
