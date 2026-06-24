/**
 * SquareCard — a standalone, presentational palette swatch card.
 *
 * Decoupled from the engine on purpose: it takes a plain ordered list of
 * swatches (label + hex) and renders the locked square composition, choosing the
 * layout by how many swatches it's given (5, 6, or 7). This is the "swap in / out
 * without trouble" seam — the app can keep its current card and switch to this by
 * rendering <SquareCard swatches={…} /> whenever it's ready, and pick the color
 * count per palette.
 *
 * Layout (4 columns × 5 rows of square cells, labels bottom-left). The
 * background banner owns the top 3 rows; as colors are added, the neutral row
 * gains a cell and the bottom band splits so the secondary appears and the
 * accent retreats to its scarce corner:
 *
 *   5: bg banner · [surface muted text] · accent band
 *   6: bg banner · [surface border muted text] · accent band
 *   7: bg banner · [surface border muted text] · secondary band + accent corner
 */

import type { ColorRow, Mode } from '#/features/palette/types'
import { secondaryFor } from '#/features/palette/secondary'

export type SquareSwatch = { label: string; hex: string }

const SLOTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

// The on-swatch label + hex are locked to Space Grotesk / Inter so they read the
// same regardless of the site-wide type pairing (which the specimen face shows
// off). Both families are always loaded via __root, so these stacks never flash.
const LABEL_FONT = '"Space Grotesk", system-ui, sans-serif'
const HEX_FONT = '"Inter", system-ui, sans-serif'

/**
 * The seven-color swatch order the locked layout expects: background banner ·
 * [surface border muted text] neutral row · secondary band + accent corner. The
 * single source of truth that maps a palette's role colors to the SquareCard, so
 * the journey take card and the saved card stay identical. `secondary` is read
 * from the palette when present, else derived from the background hue (older
 * saves predate the role) — see `secondaryFor`.
 */
export function toSquareSwatches(
  colors: ColorRow[],
  mode: Mode,
): SquareSwatch[] {
  const get = (role: string): string | undefined =>
    colors.find((c) => c.role === role)?.[mode]
  const bg = get('background') ?? '#888888'
  return [
    { label: 'Background', hex: bg },
    { label: 'Surface', hex: get('surface') ?? bg },
    { label: 'Border', hex: get('border') ?? bg },
    { label: 'Muted', hex: get('muted') ?? bg },
    { label: 'Text', hex: get('text') ?? bg },
    { label: 'Secondary', hex: get('secondary') ?? secondaryFor(bg, mode) },
    { label: 'Accent', hex: get('accent') ?? bg },
  ]
}

/** Grid keyed by swatch count. Slots fill in order a, b, c, …; `rows` sets the
 *  square aspect (4 cols / N rows). Background owns the top 3 rows. */
const LAYOUTS: Record<number, { areas: string; rows: number }> = {
  5: { rows: 5, areas: '"a a a a" "a a a a" "a a a a" "b c d d" "e e e e"' },
  6: { rows: 5, areas: '"a a a a" "a a a a" "a a a a" "b c d e" "f f f f"' },
  7: { rows: 5, areas: '"a a a a" "a a a a" "a a a a" "b c d e" "f f f g"' },
}

/** Quick perceptual luminance (0–1) to pick a legible label ink. Self-contained
 *  so the component carries no dependencies. */
function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

export function SquareCard({
  swatches,
  showHex = true,
  fill = false,
}: {
  swatches: SquareSwatch[]
  /** Show the hex under each label — a small Pantone-style flourish. */
  showHex?: boolean
  /** Stretch to the parent's height instead of imposing the square aspect.
   *  Use when the card lives inside a fixed-aspect container (e.g. a flip card);
   *  the 4×N cell grid keeps equal rows either way. */
  fill?: boolean
}) {
  const layout = LAYOUTS[swatches.length] ?? LAYOUTS[7]! // 7 is the defined fallback
  return (
    <div
      className={`grid w-full overflow-hidden rounded-[var(--app-radius)] ${fill ? 'h-full' : ''}`}
      style={{
        gridTemplateAreas: layout.areas,
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
        ...(fill ? {} : { aspectRatio: `4 / ${layout.rows}` }),
      }}
    >
      {swatches.map((s, i) => {
        const ink =
          luminance(s.hex) > 0.6
            ? 'rgba(31,36,33,0.62)'
            : 'rgba(246,245,243,0.66)'
        return (
          <div
            key={s.label + i}
            className="flex flex-col justify-end p-3 text-left"
            style={{ gridArea: SLOTS[i], background: s.hex }}
          >
            <div
              className="text-[10px] font-bold uppercase leading-tight tracking-wide"
              style={{ color: ink, fontFamily: LABEL_FONT }}
            >
              {s.label}
            </div>
            {showHex && (
              <div
                className="mt-0.5 text-[7px] uppercase leading-none tracking-wide tabular-nums"
                style={{ color: ink, opacity: 0.7, fontFamily: HEX_FONT }}
              >
                {s.hex}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
