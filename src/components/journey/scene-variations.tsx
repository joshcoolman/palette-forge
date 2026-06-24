import { motion } from 'motion/react'

import type { ScoredPalette } from '#/features/palette/types'
import type { VariationRound } from '#/lib/journey-store'
import { PaletteCard } from '#/components/journey/palette-card'

/**
 * Scene 2 — composed treatment takes as a stack of rounds (newest first). Every
 * round is one grid row of takes; the section gap matches the grid gap so the
 * rows are evenly spaced whether they sit inside a round or across the boundary
 * between two re-runs (no alternating wide/narrow gap).
 */
export function SceneVariations({
  rounds,
  savedIds,
  onToggleSave,
  onRegenerate,
}: {
  rounds: VariationRound[]
  savedIds: string[]
  onToggleSave: (palette: ScoredPalette) => void
  onRegenerate?: () => void
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3"
    >
      {rounds
        .map((round, roundIndex) => ({ round, roundIndex }))
        .reverse()
        .map(({ round, roundIndex }) => {
        const running = round.phase === 'running'
        const errored = round.phase === 'error'
        return (
          <div key={round.id} className="flex flex-col gap-3">
            {errored ? (
              <div
                className="flex flex-col items-start gap-3 rounded-[var(--app-radius)] border border-dashed p-5"
                style={{ borderColor: 'var(--app-border)' }}
              >
                <p className="text-sm" style={{ color: 'var(--app-text)' }}>
                  {round.error ?? 'That run failed.'}
                </p>
                {roundIndex === 0 && onRegenerate && (
                  <button
                    type="button"
                    onClick={onRegenerate}
                    className="rounded-md px-3 py-1.5 text-sm font-medium"
                    style={{
                      background: 'var(--app-text)',
                      color: 'var(--app-bg)',
                    }}
                  >
                    Try again
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {running && round.variations.length === 0
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-[7/1] animate-pulse rounded-[var(--app-radius)]"
                        style={{ background: 'var(--app-surface)' }}
                      />
                    ))
                  : round.variations.map((palette) => (
                      <PaletteCard
                        key={palette.id}
                        palette={palette}
                        saved={savedIds.includes(palette.id)}
                        onToggleSave={() => onToggleSave(palette)}
                      />
                    ))}
              </div>
            )}
          </div>
        )
      })}
    </motion.section>
  )
}
