import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import type { ScoredPalette, Source } from '#/features/palette/types'
import { isValidHex, withLightness } from '#/features/color/color-utils'
import {
  chooseVariation,
  hydrateJourney,
  refineJourney,
  rerunJourney,
  resetJourney,
  toggleSaved,
  useJourney,
} from '#/lib/journey-store'
import { Backdrop } from '#/components/journey/backdrop'
import { SceneVariations } from '#/components/journey/scene-variations'
import { ExtractionPeek } from '#/components/journey/extraction-peek'

export const Route = createFileRoute('/forge/$sessionId')({
  component: ForgePage,
})

function backdropColors(
  chosen: ScoredPalette | null,
  fallback: string[],
): string[] {
  // Before a take is picked the backdrop is tinted by the raw source/seed, which
  // can be a bright curated color — pull its lightness way down so the gradient
  // stays a calm dark canvas, not a glowing blob.
  if (!chosen) {
    return fallback.map((hex) =>
      isValidHex(hex) ? withLightness(hex, 0.16) : hex,
    )
  }
  const get = (role: string): string =>
    chosen.colors.find((c) => c.role === role)?.dark ?? ''
  return [get('accent'), get('surface'), get('background')].filter(Boolean)
}

function SourceThumb({ source }: { source: Source }) {
  if (source.type === 'image') {
    return (
      <img
        src={source.value}
        alt=""
        className="h-10 w-10 rounded-lg object-cover"
        style={{ outline: '1px solid var(--app-border)' }}
      />
    )
  }
  return (
    <span
      className="h-10 w-10 rounded-lg"
      style={{
        background: source.value,
        outline: '1px solid var(--app-border)',
      }}
    />
  )
}

function ForgePage() {
  const { sessionId } = Route.useParams()
  const journey = useJourney(sessionId)
  const navigate = useNavigate()
  const variationsRef = useRef<HTMLDivElement>(null)

  const roundCount = journey.rounds.length

  // Restore a reloaded journey from IndexedDB (no-op if already live in this tab).
  useEffect(() => {
    void hydrateJourney(sessionId)
  }, [sessionId])

  // A new round appended — bring it (and the refine bar) into view.
  useEffect(() => {
    if (roundCount > 1) {
      variationsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      })
    }
  }, [roundCount])

  // Start over is the one explicit clear: forget this journey, then go home.
  function startOver() {
    resetJourney(sessionId)
    void navigate({ to: '/' })
  }

  if (!journey.source) {
    if (!journey.hydrated) {
      return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
          <Backdrop colors={[]} />
          <p
            className="animate-pulse text-sm"
            style={{ color: 'var(--app-muted)' }}
          >
            Loading…
          </p>
        </main>
      )
    }
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <Backdrop colors={[]} />
        <p className="text-sm" style={{ color: 'var(--app-muted)' }}>
          Nothing here yet — this was cleared. Start a new one.
        </p>
        <Link
          to="/"
          className="rounded-md px-4 py-2 text-sm font-medium"
          style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
        >
          Start over
        </Link>
      </main>
    )
  }

  return (
    <>
      <Backdrop
        colors={backdropColors(journey.chosen, journey.source.extracted)}
      />
      <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-16">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SourceThumb source={journey.source} />
            <div>
              <p
                className="pf-heading text-sm font-medium"
                style={{ color: 'var(--app-text)' }}
              >
                Palettes
              </p>
              <p className="text-xs" style={{ color: 'var(--app-muted)' }}>
                {journey.source.type === 'image'
                  ? 'From an image'
                  : `From ${journey.source.value}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={startOver}
            className="text-xs underline"
            style={{ color: 'var(--app-muted)' }}
          >
            Start over
          </button>
        </header>

        <ExtractionPeek source={journey.source} />

        <div ref={variationsRef}>
          <SceneVariations
            rounds={journey.rounds}
            chosenId={journey.chosen?.id}
            savedIds={journey.saved}
            progress={journey.progress}
            onChoose={(palette) => chooseVariation(sessionId, palette)}
            onToggleSave={(palette) => toggleSaved(sessionId, palette)}
            onRefine={(instruction) =>
              void refineJourney(sessionId, instruction)
            }
            onRegenerate={() => void rerunJourney(sessionId)}
          />
        </div>

        <footer
          className="flex items-center justify-center gap-5 pt-4 text-xs"
          style={{ color: 'var(--app-muted)' }}
        >
          <button type="button" onClick={startOver} className="underline">
            Start over
          </button>
        </footer>
      </main>
    </>
  )
}
