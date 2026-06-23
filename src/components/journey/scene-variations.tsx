import { useState } from 'react'
import { motion } from 'motion/react'

import type { ScoredPalette } from '#/features/palette/types'
import type { VariationRound } from '#/lib/journey-store'
import { AgentNarration } from '#/components/journey/agent-narration'
import { PaletteCard } from '#/components/journey/palette-card'
import { RefineBar } from '#/components/forge/refine-bar'
import { ExportModal } from '#/components/library/export-modal'

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
  savedIds,
  progress,
  onChoose,
  onToggleSave,
  onRefine,
  onRegenerate,
}: {
  rounds: VariationRound[]
  chosenId?: string
  savedIds: string[]
  progress?: string
  onChoose: (palette: ScoredPalette) => void
  onToggleSave: (palette: ScoredPalette) => void
  onRefine: (instruction: string) => void
  onRegenerate?: () => void
}) {
  const [exporting, setExporting] = useState<ScoredPalette | null>(null)
  const latest = rounds.at(-1)
  const refining = latest?.phase === 'running'
  const failed = latest?.phase === 'error'
  const steered = Boolean(latest?.steer)

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-start justify-between gap-3">
        <AgentNarration pending={refining}>
          {refining
            ? progress || 'Composing four takes and checking contrast on each…'
            : failed
              ? 'That run didn’t come together.'
              : rounds.length === 1
                ? 'Four takes, each its own character — surprise. Heart the keepers, refine, or re-run.'
                : steered
                  ? 'Steered. Heart the keepers, or keep refining.'
                  : 'Another four — surprise. Heart the keepers, or keep going.'}
        </AgentNarration>
        {onRegenerate && !refining && (
          <button
            type="button"
            onClick={onRegenerate}
            className="shrink-0 text-xs underline"
            style={{ color: 'var(--app-muted)' }}
          >
            Re-run
          </button>
        )}
      </div>

      {rounds.map((round, roundIndex) => {
        const topId = recommendedId(round.variations)
        const running = round.phase === 'running'
        const errored = round.phase === 'error'
        return (
          <div key={round.id} className="flex flex-col gap-3">
            {round.steer && (
              <p className="text-xs" style={{ color: 'var(--app-muted)' }}>
                Refined · {round.steer}
              </p>
            )}
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
                        recommended={palette.id === topId}
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

      <RefineBar onRefine={onRefine} busy={refining} />

      {exporting && (
        <ExportModal palette={exporting} onClose={() => setExporting(null)} />
      )}
    </motion.section>
  )
}
