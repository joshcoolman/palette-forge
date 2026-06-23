import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import type { ScoredPalette, Source } from '#/features/palette/types'
import {
  chooseDirection,
  chooseVariation,
  refineJourney,
  useJourney,
} from '#/lib/journey-store'
import { Backdrop } from '#/components/journey/backdrop'
import { ModelControl } from '#/components/settings/model-control'
import { SceneDirections } from '#/components/journey/scene-directions'
import { SceneVariations } from '#/components/journey/scene-variations'
import { SelectedActions } from '#/components/forge/selected-actions'
import { ExtractionPeek } from '#/components/journey/extraction-peek'

export const Route = createFileRoute('/forge/$sessionId')({
  component: ForgePage,
})

function backdropColors(
  chosen: ScoredPalette | null,
  fallback: string[],
): string[] {
  if (!chosen) return fallback
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
  const variationsRef = useRef<HTMLDivElement>(null)
  const paletteRef = useRef<HTMLDivElement>(null)
  const hadChosen = useRef(false)

  const roundCount = journey.rounds.length

  // Descend to the variations when a path is picked.
  useEffect(() => {
    if (journey.chosenType) {
      variationsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [journey.chosenType])

  // A new refine round appended — bring it (and the refine bar) into view.
  useEffect(() => {
    if (roundCount > 1) {
      variationsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      })
    }
  }, [roundCount])

  // Reveal the final palette only on the first selection, not on every re-pick.
  useEffect(() => {
    if (journey.chosen && !hadChosen.current) {
      hadChosen.current = true
      paletteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (!journey.chosen) hadChosen.current = false
  }, [journey.chosen])

  if (!journey.source) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <Backdrop colors={[]} />
        <p className="text-sm" style={{ color: 'var(--app-muted)' }}>
          This journey has no source — it was probably reloaded. Start a new
          one.
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
                className="text-sm font-medium"
                style={{ color: 'var(--app-text)' }}
              >
                Your journey
              </p>
              <p className="text-xs" style={{ color: 'var(--app-muted)' }}>
                {journey.source.type === 'image'
                  ? 'From an image'
                  : `From ${journey.source.value}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ModelControl />
            <Link
              to="/library"
              className="text-xs underline"
              style={{ color: 'var(--app-muted)' }}
            >
              Library
            </Link>
            <Link
              to="/"
              className="text-xs underline"
              style={{ color: 'var(--app-muted)' }}
            >
              Start over
            </Link>
          </div>
        </header>

        <ExtractionPeek source={journey.source} />

        <SceneDirections
          directions={journey.directions}
          phase={journey.directionsPhase}
          activeType={journey.chosenType}
          progress={journey.progress}
          onChoose={(type) => void chooseDirection(sessionId, type)}
        />

        {journey.chosenType && (
          <div ref={variationsRef}>
            <SceneVariations
              rounds={journey.rounds}
              chosenId={journey.chosen?.id}
              progress={journey.progress}
              onChoose={(palette) => chooseVariation(sessionId, palette)}
              onRefine={(instruction) =>
                void refineJourney(sessionId, instruction)
              }
              onRegenerate={() => {
                if (journey.chosenType)
                  void chooseDirection(sessionId, journey.chosenType)
              }}
            />
          </div>
        )}

        {journey.chosen && (
          <div ref={paletteRef}>
            <SelectedActions key={journey.chosen.id} palette={journey.chosen} />
          </div>
        )}
      </main>
    </>
  )
}
