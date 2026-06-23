import { motion } from 'motion/react'
import { Braces, Heart } from 'lucide-react'

import type { ColorRow, Mode, ScoredPalette } from '#/features/palette/types'

const BAND_ORDER = [
  'background',
  'surface',
  'muted',
  'border',
  'accent',
  'text',
] as const

function band(colors: ColorRow[], mode: Mode): string[] {
  return BAND_ORDER.map(
    (role) => colors.find((c) => c.role === role)?.[mode] ?? '#888888',
  )
}

/**
 * A take in the surprise grid. Clicking the body selects it (the refine anchor);
 * the corner controls act on this take directly — heart toggles it in and out of
 * favorites, the braces button exports it. No bottom panel: the card is the
 * whole interface for a take.
 */
export function PaletteCard({
  palette,
  recommended = false,
  selected = false,
  saved = false,
  onSelect,
  onToggleSave,
  onExport,
}: {
  palette: ScoredPalette
  recommended?: boolean
  selected?: boolean
  saved?: boolean
  onSelect: () => void
  onToggleSave: () => void
  onExport: () => void
}) {
  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      className="group relative flex flex-col rounded-2xl border"
      style={{
        borderColor: selected ? 'var(--app-text)' : 'var(--app-border)',
        background: 'var(--app-surface)',
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-col gap-2.5 rounded-2xl p-3 text-left"
      >
        <div
          className="overflow-hidden rounded-xl border"
          style={{ borderColor: 'var(--app-border)' }}
        >
          <div className="flex h-20">
            {band(palette.colors, 'light').map((hex, i) => (
              <span
                key={`l-${i}`}
                className="flex-1"
                style={{ background: hex }}
              />
            ))}
          </div>
          <div className="flex h-5">
            {band(palette.colors, 'dark').map((hex, i) => (
              <span
                key={`d-${i}`}
                className="flex-1"
                style={{ background: hex }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <span
              className="pf-heading truncate text-xs font-medium"
              style={{ color: 'var(--app-text)' }}
            >
              {palette.name}
            </span>
            <span
              className="shrink-0 text-xs tabular-nums"
              style={{ color: 'var(--app-muted)' }}
            >
              {palette.score.overall}
            </span>
          </div>
          {palette.character && (
            <span
              className="pf-body text-[11px] leading-snug"
              style={{ color: 'var(--app-muted)' }}
            >
              {palette.character}
            </span>
          )}
        </div>
      </button>

      {recommended && (
        <span
          className="pointer-events-none absolute left-2.5 top-2.5 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
        >
          Recommended
        </span>
      )}

      <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onExport()
          }}
          aria-label={`Export ${palette.name}`}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/90 opacity-0 transition group-hover:opacity-100 hover:bg-black/60"
        >
          <Braces size={13} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleSave()
          }}
          aria-label={
            saved
              ? `Remove ${palette.name} from favorites`
              : `Save ${palette.name} to favorites`
          }
          aria-pressed={saved}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 transition hover:bg-black/60"
          style={{ color: saved ? '#fb7185' : 'rgba(255,255,255,0.9)' }}
        >
          <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
    </motion.div>
  )
}
