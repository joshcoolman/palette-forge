import { motion } from 'motion/react'

import type { Direction } from '#/features/palette/types'

export function DirectionCard({
  direction,
  onChoose,
}: {
  direction: Direction
  onChoose: () => void
}) {
  return (
    <motion.button
      type="button"
      layout
      onClick={onChoose}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative flex flex-col gap-3 rounded-2xl border p-4 text-left"
      style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface)' }}
    >
      {direction.recommended && (
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
        >
          Recommended
        </span>
      )}
      <div className="flex h-10 overflow-hidden rounded-lg">
        {direction.preview.map((hex, i) => (
          <span key={`${hex}-${i}`} className="flex-1" style={{ background: hex }} />
        ))}
      </div>
      <div>
        <h3 className="text-base font-semibold" style={{ color: 'var(--app-text)' }}>
          {direction.label}
        </h3>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--app-muted)' }}>
          {direction.character}
        </p>
      </div>
    </motion.button>
  )
}
