import { Fragment } from 'react'
import { motion } from 'motion/react'
import { Loader2 } from 'lucide-react'

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
  progress,
  onToggleSave,
  onRegenerate,
}: {
  round: VariationRound
  roundIndex: number
  savedIds: string[]
  /** Live status while this round runs — shown so a multi-second model call reads
   *  as working, not stuck. */
  progress?: string
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

  // Running with nothing yet: a labelled, clearly-animated state. The bare
  // app-surface skeletons were invisible on the dark ground (read as broken), so
  // they carry a border, and the live progress sits above them.
  if (round.phase === 'running' && round.variations.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: 'var(--app-muted)' }}
        >
          <Loader2 size={15} className="animate-spin" />
          {progress || 'Designing your palettes…'}
        </div>
        <div className={`grid ${ROUND_GRID}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[7/1] animate-pulse rounded-[var(--app-radius)] border"
              style={{
                background: 'var(--app-surface)',
                borderColor: 'var(--app-border)',
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`grid ${ROUND_GRID}`}>
      {round.variations.map((palette) => (
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
  progress,
  onToggleSave,
  onRegenerate,
}: {
  rounds: VariationRound[]
  savedIds: string[]
  progress?: string
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
            {round.message && (
              <p
                className="pf-body text-sm leading-relaxed"
                style={{ color: 'var(--app-text)' }}
              >
                {round.message}
              </p>
            )}
            <RoundStrips
              round={round}
              roundIndex={roundIndex}
              savedIds={savedIds}
              progress={progress}
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
