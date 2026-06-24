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

export type SquareSwatch = { label: string; hex: string }

const SLOTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

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
}: {
  swatches: SquareSwatch[]
  /** Show the hex under each label — a small Pantone-style flourish. */
  showHex?: boolean
}) {
  const layout = LAYOUTS[swatches.length] ?? LAYOUTS[7]
  return (
    <div
      className="grid w-full overflow-hidden rounded-[var(--app-radius)]"
      style={{
        gridTemplateAreas: layout.areas,
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
        aspectRatio: `4 / ${layout.rows}`,
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
            className="flex flex-col justify-end p-3"
            style={{ gridArea: SLOTS[i], background: s.hex }}
          >
            <div
              className="text-[10px] font-bold uppercase leading-tight tracking-wide"
              style={{ color: ink }}
            >
              {s.label}
            </div>
            {showHex && (
              <div
                className="mt-0.5 text-[7px] uppercase leading-none tracking-wide tabular-nums"
                style={{ color: ink, opacity: 0.7 }}
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
