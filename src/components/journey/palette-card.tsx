import { motion } from 'motion/react'

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

export function PaletteCard({
  palette,
  recommended = false,
  selected = false,
  onSelect,
}: {
  palette: ScoredPalette
  recommended?: boolean
  selected?: boolean
  onSelect: () => void
}) {
  return (
    <motion.button
      type="button"
      layout
      onClick={onSelect}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      className="relative flex flex-col gap-2.5 rounded-2xl border p-3 text-left"
      style={{
        borderColor: selected ? 'var(--app-text)' : 'var(--app-border)',
        background: 'var(--app-surface)',
      }}
    >
      {recommended && (
        <span
          className="absolute right-3 top-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
        >
          Recommended
        </span>
      )}
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
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--app-text)' }}
        >
          {palette.name}
        </span>
        <span
          className="text-xs tabular-nums"
          style={{ color: 'var(--app-muted)' }}
        >
          {palette.score.overall}
        </span>
      </div>
    </motion.button>
  )
}
