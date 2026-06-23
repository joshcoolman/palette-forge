import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'

import type { Mode, Palette, Role } from '#/features/palette/types'
import { hexToRgb } from '#/features/color/color-utils'
import { relativeLuminance } from '#/features/color/contrast'

// The proportional composition card — the library is where you sit and
// contemplate a saved palette, not scan it. Cells a–f run biggest to smallest;
// a tuned template (not strict role proportion) leads with the accent so each
// saved card is recognizable by its hero color, pairs it with the deep text,
// and grounds the bottom row with the light neutrals.
const CELL_ROLES: Role[] = [
  'accent',
  'text',
  'muted',
  'border',
  'background',
  'surface',
]
const CELL_AREAS = '"a a b b" "a a c d" "e e f f"'
const CELL_SLOTS = ['a', 'b', 'c', 'd', 'e', 'f'] as const
const ROLE_LABEL: Record<Role, string> = {
  background: 'Background',
  surface: 'Surface',
  text: 'Text',
  muted: 'Muted',
  accent: 'Accent',
  border: 'Border',
}

/** On-swatch text tone at a given alpha, dark-or-light by the swatch's luminance
 *  — the contrast engine in miniature, legible on light and dark swatches. The
 *  name sits at a readable alpha; the hex drops to a near-watermark whisper. */
function textTone(hex: string, alpha: number): string {
  return relativeLuminance(hexToRgb(hex)) > 0.5
    ? `rgba(28,28,30,${alpha})`
    : `rgba(247,247,245,${alpha})`
}

function cellColor(palette: Palette, role: Role, mode: Mode): string {
  return palette.colors.find((c) => c.role === role)?.[mode] ?? '#888888'
}

/** A geometric composition card: each role gets an area by weight, its name
 *  (bold) and hex (watermark) drawn on the swatch. A sun/moon toggle flips the
 *  whole card between the light and dark palette; name + delete sit below. */
export function LibraryCard({
  palette,
  onOpen,
  onDelete,
}: {
  palette: Palette
  onOpen: () => void
  onDelete: () => void
}) {
  const [mode, setMode] = useState<Mode>('light')

  return (
    <div className="group flex w-[285px] max-w-full flex-col gap-2">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${palette.name}`}
        className="grid overflow-hidden rounded-[5px] border text-left"
        style={{
          borderColor: 'var(--app-border)',
          gridTemplateAreas: CELL_AREAS,
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: '2.4fr 1fr 1fr',
          aspectRatio: '5 / 6',
        }}
      >
        {CELL_ROLES.map((role, i) => {
          const hex = cellColor(palette, role, mode)
          return (
            <div
              key={role}
              className="flex flex-col gap-0.5 p-3"
              style={{ gridArea: CELL_SLOTS[i], background: hex }}
            >
              <span
                className="text-[9px] font-bold leading-tight"
                style={{ color: textTone(hex, 0.64) }}
              >
                {ROLE_LABEL[role]}
              </span>
              <span
                className="text-[9px] leading-tight tabular-nums"
                style={{ color: textTone(hex, 0.22) }}
              >
                {hex.toUpperCase()}
              </span>
            </div>
          )
        })}
      </button>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm" style={{ color: 'var(--app-text)' }}>
          {palette.name}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${palette.name}`}
            className="shrink-0 text-xs underline opacity-0 transition-opacity group-hover:opacity-100"
            style={{ color: 'var(--app-muted)' }}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))}
            aria-label={`Show ${mode === 'light' ? 'dark' : 'light'} palette`}
            aria-pressed={mode === 'dark'}
            className="shrink-0"
            style={{ color: 'var(--app-muted)' }}
          >
            {mode === 'light' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
