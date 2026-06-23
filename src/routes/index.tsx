import { createFileRoute, useNavigate } from '@tanstack/react-router'

import type { Source } from '#/features/palette/types'
import { makeId } from '#/lib/id'
import { startJourney } from '#/lib/journey-store'
import { Backdrop } from '#/components/journey/backdrop'
import { SceneSource } from '#/components/journey/scene-source'

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
      <SceneSource onStart={handleStart} />
    </main>
  )
}
