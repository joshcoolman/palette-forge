import { useState } from 'react'
import { motion } from 'motion/react'

import type { ScoredPalette } from '#/features/palette/types'
import type { VariationRound } from '#/lib/journey-store'
import { PaletteCard } from '#/components/journey/palette-card'
import { ExportModal } from '#/components/favorites/export-modal'

/** Scene 2 — composed, scored variations as a stack of rounds (newest first). */
export function SceneVariations({
  rounds,
  chosenId,
  savedIds,
  onChoose,
  onToggleSave,
  onRegenerate,
}: {
  rounds: VariationRound[]
  chosenId?: string
  savedIds: string[]
  onChoose: (palette: ScoredPalette) => void
  onToggleSave: (palette: ScoredPalette) => void
  onRegenerate?: () => void
}) {
  const [exporting, setExporting] = useState<ScoredPalette | null>(null)

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
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
                className="flex flex-col items-start gap-3 rounded-2xl border border-dashed p-5"
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
                        selected={palette.id === chosenId}
                        saved={savedIds.includes(palette.id)}
                        onSelect={() => onChoose(palette)}
                        onToggleSave={() => onToggleSave(palette)}
                        onExport={() => setExporting(palette)}
                      />
                    ))}
              </div>
            )}
          </div>
        )
      })}

      {exporting && (
        <ExportModal palette={exporting} onClose={() => setExporting(null)} />
      )}
    </motion.section>
  )
}
