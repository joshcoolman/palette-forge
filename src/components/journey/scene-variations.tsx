import { Fragment } from 'react'
import { motion } from 'motion/react'

import type { ScoredPalette } from '#/features/palette/types'
import type { VariationRound } from '#/lib/journey-store'
import { PaletteCard } from '#/components/journey/palette-card'

// One column on mobile, three on desktop. On mobile we also render only the
// first two strips of every round (a lighter, playful slice for a phone) — the
// engine still composes the full round of archetypes, so the data stays whole
// and seed-coherent; we just hide strips 3+ below `sm`. Desktop shows them all.
const ROUND_GRID =
  'grid-cols-1 gap-3 sm:grid-cols-3 [&>*:nth-child(n+3)]:hidden sm:[&>*:nth-child(n+3)]:block'

/**
 * The strips for a single round: pulse skeletons while running, the error state
 * with an opening-round "Try again", or the composed takes.
 */
function RoundStrips({
  round,
  roundIndex,
  savedIds,
  onToggleSave,
  onRegenerate,
}: {
  round: VariationRound
  roundIndex: number
  savedIds: string[]
  onToggleSave: (palette: ScoredPalette) => void
  onRegenerate?: () => void
}) {
  if (round.phase === 'error') {
    return (
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
            style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  const running = round.phase === 'running'
  return (
    <div className={`grid ${ROUND_GRID}`}>
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
  )
}

/**
 * Scene 2 — composed treatment takes as a stack of rounds. The opening round (the
 * faithful first read) is pinned at the top; re-runs — the surprise game — stack
 * newest-first below it. The section gap matches the grid gap so rows stay evenly
 * spaced across round boundaries (no alternating wide/narrow gap).
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
  // Pin the opening round (the faithful first read) at the top; stack the re-runs
  // newest-first below it. roundIndex stays the original index so the opening-round
  // "Try again" still targets round 0.
  const items = rounds.map((round, roundIndex) => ({ round, roundIndex }))
  const [first, ...rest] = items
  const ordered = first ? [first, ...rest.reverse()] : []

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3"
    >
      {ordered.map(({ round, roundIndex }) => (
        <Fragment key={round.id}>
          <div className="flex flex-col gap-3">
            <RoundStrips
              round={round}
              roundIndex={roundIndex}
              savedIds={savedIds}
              onToggleSave={onToggleSave}
              onRegenerate={onRegenerate}
            />
          </div>
          {roundIndex === 0 && ordered.length > 1 && (
            <div className="flex items-center gap-3 py-1" aria-hidden>
              <span
                className="text-[10px] uppercase tracking-wide"
                style={{ color: 'var(--app-muted)' }}
              >
                variants
              </span>
              <span className="h-px flex-1" style={{ background: 'var(--app-border)' }} />
            </div>
          )}
        </Fragment>
      ))}
    </motion.section>
  )
}
