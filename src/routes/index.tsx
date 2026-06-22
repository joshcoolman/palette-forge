import { createFileRoute, useNavigate } from '@tanstack/react-router'

import type { Source } from '#/features/palette/types'
import { makeId } from '#/lib/id'
import { startJourney } from '#/lib/journey-store'
import { Backdrop } from '#/components/journey/backdrop'
import { SceneSource } from '#/components/journey/scene-source'
import { ModelControl } from '#/components/settings/model-control'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const navigate = useNavigate()

  function handleStart(source: Source) {
    const id = makeId()
    void startJourney(id, source)
    void navigate({ to: '/forge/$sessionId', params: { sessionId: id } })
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-4 py-16">
      <Backdrop colors={[]} />
      <div className="absolute right-4 top-4">
        <ModelControl />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight" style={{ color: 'var(--app-text)' }}>
          palette-forge
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--app-muted)' }}>
          An image or a seed color in — refined, accessible light and dark palettes out.
        </p>
      </div>
      <SceneSource onStart={handleStart} />
    </main>
  )
}
