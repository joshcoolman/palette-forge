import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import type { ScoredPalette, Source } from '#/features/palette/types'
import { chooseDirection, chooseVariation, useJourney } from '#/lib/journey-store'
import { Backdrop } from '#/components/journey/backdrop'
import { SceneDirections } from '#/components/journey/scene-directions'
import { SceneVariations } from '#/components/journey/scene-variations'
import { ScenePalette } from '#/components/journey/scene-palette'

export const Route = createFileRoute('/forge/$sessionId')({ component: ForgePage })

function backdropColors(chosen: ScoredPalette | null, fallback: string[]): string[] {
  if (!chosen) return fallback
  const get = (role: string): string => chosen.colors.find((c) => c.role === role)?.dark ?? ''
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
      style={{ background: source.value, outline: '1px solid var(--app-border)' }}
    />
  )
}

function ForgePage() {
  const { sessionId } = Route.useParams()
  const journey = useJourney(sessionId)
  const variationsRef = useRef<HTMLDivElement>(null)
  const paletteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (journey.chosenType) {
      variationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [journey.chosenType])

  useEffect(() => {
    if (journey.chosen) {
      paletteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [journey.chosen])

  if (!journey.source) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <Backdrop colors={[]} />
        <p className="text-sm" style={{ color: 'var(--app-muted)' }}>
          This journey has no source — it was probably reloaded. Start a new one.
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
      <Backdrop colors={backdropColors(journey.chosen, journey.source.extracted)} />
      <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-16">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SourceThumb source={journey.source} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--app-text)' }}>
                Your journey
              </p>
              <p className="text-xs" style={{ color: 'var(--app-muted)' }}>
                {journey.source.type === 'image' ? 'From an image' : `From ${journey.source.value}`}
              </p>
            </div>
          </div>
          <Link to="/" className="text-xs underline" style={{ color: 'var(--app-muted)' }}>
            Start over
          </Link>
        </header>

        <SceneDirections
          directions={journey.directions}
          phase={journey.directionsPhase}
          onChoose={(type) => void chooseDirection(sessionId, type)}
        />

        {journey.chosenType && (
          <div ref={variationsRef}>
            <SceneVariations
              variations={journey.variations}
              phase={journey.variationsPhase}
              chosenId={journey.chosen?.id}
              onChoose={(palette) => chooseVariation(sessionId, palette)}
            />
          </div>
        )}

        {journey.chosen && (
          <div ref={paletteRef}>
            <ScenePalette palette={journey.chosen} />
          </div>
        )}
      </main>
    </>
  )
}
