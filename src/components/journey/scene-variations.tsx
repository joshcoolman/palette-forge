import { motion } from 'motion/react'

import type { ScoredPalette } from '#/features/palette/types'
import type { Phase } from '#/lib/journey-store'
import { AgentNarration } from '#/components/journey/agent-narration'
import { PaletteCard } from '#/components/journey/palette-card'

function recommendedId(variations: ScoredPalette[]): string {
  let best = ''
  let bestScore = -1
  for (const palette of variations) {
    if (palette.score.overall > bestScore) {
      bestScore = palette.score.overall
      best = palette.id
    }
  }
  return best
}

/** Scene 2 — composed, scored variations within the chosen path. */
export function SceneVariations({
  variations,
  phase,
  chosenId,
  onChoose,
}: {
  variations: ScoredPalette[]
  phase: Phase
  chosenId?: string
  onChoose: (palette: ScoredPalette) => void
}) {
  const running = phase === 'running'
  const topId = recommendedId(variations)
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <AgentNarration>
        {running
          ? 'Composing variations and checking contrast on each…'
          : 'Here are the takes — start with the recommended one, or keep the one you like.'}
      </AgentNarration>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {running && variations.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl"
                style={{ background: 'var(--app-surface)' }}
              />
            ))
          : variations.map((palette) => (
              <PaletteCard
                key={palette.id}
                palette={palette}
                recommended={palette.id === topId}
                selected={palette.id === chosenId}
                onSelect={() => onChoose(palette)}
              />
            ))}
      </div>
    </motion.section>
  )
}
