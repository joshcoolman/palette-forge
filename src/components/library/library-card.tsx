import { useState } from 'react'
import { motion } from 'motion/react'
import { Code, Moon, Sun, Trash2 } from 'lucide-react'

import type { Mode, Palette, Role } from '#/features/palette/types'
import { hexToRgb } from '#/features/color/color-utils'
import { relativeLuminance } from '#/features/color/contrast'
import { IconButton } from '#/components/ui/icon-button'

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

/** The swatch face (front): each role gets an area by weight, its name (bold) and
 *  hex (watermark) drawn top-left on the swatch — left-aligned so the card's
 *  top-right corner stays clear for the floating light/dark toggle. */
function SwatchFace({ palette, mode }: { palette: Palette; mode: Mode }) {
  return (
    <div
      className="grid h-full w-full"
      style={{
        gridTemplateAreas: CELL_AREAS,
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: '2.4fr 1fr 1fr',
      }}
    >
      {CELL_ROLES.map((role, i) => {
        const hex = cellColor(palette, role, mode)
        return (
          <div
            key={role}
            className="flex flex-col gap-0.5 p-3 text-left"
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
    </div>
  )
}

/** The text-specimen face (back): the six roles applied to a real UI fragment
 *  instead of drawn as labelled swatches — background fill, text for title/body,
 *  muted for the subtitle, border for the rule + callout edge, surface for the
 *  callout panel, accent for the eyebrow tag and action pill. Centered, no labels,
 *  no hex; it shows how the palette *reads*. On-accent tone follows luminance. */
function TextSpecimen({ palette, mode }: { palette: Palette; mode: Mode }) {
  const bg = cellColor(palette, 'background', mode)
  const surface = cellColor(palette, 'surface', mode)
  const text = cellColor(palette, 'text', mode)
  const muted = cellColor(palette, 'muted', mode)
  const border = cellColor(palette, 'border', mode)
  const accent = cellColor(palette, 'accent', mode)
  const onAccent = textTone(accent, 0.95)

  return (
    <div
      className="flex h-full w-full flex-col items-center gap-2 p-4 text-center"
      style={{ background: bg }}
    >
      <span
        className="pf-heading rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider"
        style={{ background: accent, color: onAccent }}
      >
        Aa
      </span>
      <div className="flex flex-col gap-0.5">
        <span
          className="pf-heading text-[17px] font-bold leading-tight"
          style={{ color: text }}
        >
          Quiet structure
        </span>
        <span
          className="pf-body text-[11px] leading-snug"
          style={{ color: muted }}
        >
          A subtitle carried in the muted role
        </span>
      </div>
      <div className="h-px w-8" style={{ background: border }} />
      <p
        className="pf-body text-[10px] leading-relaxed"
        style={{ color: text, opacity: 0.88 }}
      >
        Body copy in the text role, set over the background — two lines to show
        how the pairing reads at a small size.
      </p>
      <div
        className="mt-auto flex w-full flex-col items-center gap-2 rounded-[4px] border p-2"
        style={{ background: surface, borderColor: border }}
      >
        <span className="pf-body text-[9px] leading-tight" style={{ color: text }}>
          A callout on surface
        </span>
        <span
          className="pf-heading rounded-[3px] px-2 py-1 text-[8px] font-semibold"
          style={{ background: accent, color: onAccent }}
        >
          Action
        </span>
      </div>
    </div>
  )
}

/** A flip card: the swatch composition on the front, the text specimen on the
 *  back. Clicking the card flips it over. A light/dark toggle floats in the
 *  top-right corner *outside* the flipping layer, so it holds the exact same
 *  spot on both faces and drives whichever side is showing. Below: name, a
 *  delete (on hover), and a `</>` button that opens the code/export popup. */
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
  const [flipped, setFlipped] = useState(false)

  // The toggle floats bare over a different swatch on each face — the text role
  // on the front, the background fill on the back — so tone it for contrast
  // against whichever it currently sits on.
  const toggleOver = cellColor(palette, flipped ? 'background' : 'text', mode)
  const toggleFg = textTone(toggleOver, 0.92)

  const faceStyle = {
    borderColor: 'var(--app-border)',
    backfaceVisibility: 'hidden' as const,
    WebkitBackfaceVisibility: 'hidden' as const,
  }

  return (
    <div className="group flex w-[285px] max-w-full flex-col gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={
            flipped
              ? `Show ${palette.name} swatches`
              : `Show ${palette.name} text specimen`
          }
          aria-pressed={flipped}
          className="block w-full"
          style={{ perspective: '1000px', aspectRatio: '5 / 6' }}
        >
          <motion.div
            className="relative h-full w-full"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <div
              className="absolute inset-0 overflow-hidden rounded-[5px] border"
              style={faceStyle}
            >
              <SwatchFace palette={palette} mode={mode} />
            </div>
            <div
              className="absolute inset-0 overflow-hidden rounded-[5px] border"
              style={{ ...faceStyle, transform: 'rotateY(180deg)' }}
            >
              <TextSpecimen palette={palette} mode={mode} />
            </div>
          </motion.div>
        </button>

        <IconButton
          label={`Show ${mode === 'light' ? 'dark' : 'light'} palette`}
          pressed={mode === 'dark'}
          onClick={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))}
          border={false}
          foreground={toggleFg}
          className="absolute right-2 top-2 z-10"
        >
          {mode === 'light' ? <Sun size={14} /> : <Moon size={14} />}
        </IconButton>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className="pf-heading truncate text-sm"
          style={{ color: 'var(--app-text)' }}
        >
          {palette.name}
        </span>
        <div className="flex items-center gap-2">
          <IconButton label={`View ${palette.name} code`} onClick={onOpen}>
            <Code size={14} />
          </IconButton>
          <IconButton label={`Delete ${palette.name}`} onClick={onDelete}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>
    </div>
  )
}
