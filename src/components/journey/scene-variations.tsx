import { motion } from 'motion/react'

import type { ScoredPalette } from '#/features/palette/types'
import type { VariationRound } from '#/lib/journey-store'
import { AgentNarration } from '#/components/journey/agent-narration'
import { PaletteCard } from '#/components/journey/palette-card'
import { RefineBar } from '#/components/forge/refine-bar'

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

/** Scene 2 — composed, scored variations as a stack of rounds, plus a refine bar. */
export function SceneVariations({
  rounds,
  chosenId,
  onChoose,
  onRefine,
}: {
  rounds: VariationRound[]
  chosenId?: string
  onChoose: (palette: ScoredPalette) => void
  onRefine: (instruction: string) => void
}) {
  const latest = rounds[rounds.length - 1]
  const refining = latest?.phase === 'running'

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <AgentNarration>
        {rounds.length > 1
          ? 'Steered. Pick from the new takes, or keep refining.'
          : 'Here are the takes — start with the recommended one, or steer with a refine.'}
      </AgentNarration>

      {rounds.map((round) => {
        const topId = recommendedId(round.variations)
        const running = round.phase === 'running'
        return (
          <div key={round.id} className="flex flex-col gap-3">
            {round.steer && (
              <p className="text-xs" style={{ color: 'var(--app-muted)' }}>
                Refined · {round.steer}
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {running && round.variations.length === 0
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-40 animate-pulse rounded-2xl"
                      style={{ background: 'var(--app-surface)' }}
                    />
                  ))
                : round.variations.map((palette) => (
                    <PaletteCard
                      key={palette.id}
                      palette={palette}
                      recommended={palette.id === topId}
                      selected={palette.id === chosenId}
                      onSelect={() => onChoose(palette)}
                    />
                  ))}
            </div>
          </div>
        )
      })}

      <RefineBar onRefine={onRefine} busy={refining} />
    </motion.section>
  )
}
