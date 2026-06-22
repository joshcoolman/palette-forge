import { motion } from 'motion/react'

import type { Direction, PaletteType } from '#/features/palette/types'
import type { Phase } from '#/lib/journey-store'
import { AgentNarration } from '#/components/journey/agent-narration'
import { DirectionCard } from '#/components/journey/direction-card'

/** Scene 1 — the agent presents palette-type directions; the user picks a path. */
export function SceneDirections({
  directions,
  phase,
  onChoose,
}: {
  directions: Direction[]
  phase: Phase
  onChoose: (type: PaletteType) => void
}) {
  const running = phase === 'running'
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-4"
    >
      <AgentNarration>
        {running
          ? 'Reading your colors and sketching a few directions…'
          : 'A few ways this could go. Pick a path to descend into.'}
      </AgentNarration>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {running && directions.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl"
                style={{ background: 'var(--app-surface)' }}
              />
            ))
          : directions.map((direction) => (
              <DirectionCard
                key={direction.type}
                direction={direction}
                onChoose={() => onChoose(direction.type)}
              />
            ))}
      </div>
    </motion.section>
  )
}
