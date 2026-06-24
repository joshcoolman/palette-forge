import { useState } from 'react'
import { motion } from 'motion/react'
import { Code, Moon, Pencil, Sun, Trash2 } from 'lucide-react'

import type { Mode, Palette, Role, ScoredPalette } from '#/features/palette/types'
import { hexToRgb } from '#/features/color/color-utils'
import { relativeLuminance } from '#/features/color/contrast'
import { IconButton } from '#/components/ui/icon-button'
import { SquareCard, toSquareSwatches } from '#/components/square-card'

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

/** The swatch face (front): the locked seven-color SquareCard, filling the
 *  flip-card face. Labels + a tiny hex flourish sit bottom-left on each swatch;
 *  the top-right corner stays clear for the floating light/dark toggle. */
function SwatchFace({ palette, mode }: { palette: Palette; mode: Mode }) {
  return <SquareCard swatches={toSquareSwatches(palette.colors, mode)} fill />
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
export function FavoriteCard({
  palette,
  onOpen,
  onDelete,
  onRename,
  defaultMode = 'dark',
}: {
  /** ScoredPalette so the saved record's `character` (the model's rationale, or the
   *  archetype line) can show under the name. A plain Palette is assignable. */
  palette: ScoredPalette
  onOpen: () => void
  onDelete: () => void
  /** Open the rename dialog (manual edit always; AI suggestions inside it are
   *  gated by whether a key is set). A base feature, so always provided. */
  onRename: () => void
  /** Which face the card opens on — driven by the user's default-mode pref. */
  defaultMode?: Mode
}) {
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [flipped, setFlipped] = useState(false)

  // The toggle floats bare over the background on both faces — the SquareCard's
  // top-right is the background banner, and the specimen back is a background
  // fill — so tone it for contrast against the background.
  const toggleOver = cellColor(palette, 'background', mode)
  const toggleFg = textTone(toggleOver, 0.92)

  const faceStyle = {
    borderColor: 'var(--app-border)',
    backfaceVisibility: 'hidden' as const,
    WebkitBackfaceVisibility: 'hidden' as const,
  }

  return (
    <div className="group flex w-full flex-col gap-2">
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
              className="absolute inset-0 overflow-hidden rounded-[var(--app-radius)] border"
              style={faceStyle}
            >
              <SwatchFace palette={palette} mode={mode} />
            </div>
            <div
              className="absolute inset-0 overflow-hidden rounded-[var(--app-radius)] border"
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
        <div className="flex min-w-0 flex-col">
          <span
            className="pf-heading truncate text-sm"
            style={{ color: 'var(--app-text)' }}
          >
            {palette.name}
          </span>
          {palette.character && (
            <span
              className="truncate text-xs"
              style={{ color: 'var(--app-muted)' }}
              title={palette.character}
            >
              {palette.character}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <IconButton
            label={`Rename ${palette.name}`}
            title="Rename this palette"
            onClick={onRename}
          >
            <Pencil size={14} />
          </IconButton>
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
