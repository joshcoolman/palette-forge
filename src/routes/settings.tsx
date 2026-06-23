import { createFileRoute, useRouter } from '@tanstack/react-router'

import { Backdrop } from '#/components/journey/backdrop'
import { KeyEntry } from '#/components/settings/key-entry'
import { Preferences } from '#/components/settings/preferences'

export const Route = createFileRoute('/settings')({ component: SettingsPage })

function SettingsPage() {
  const router = useRouter()
  return (
    <main className="relative mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-4 py-16">
      <Backdrop colors={[]} />
      <header className="flex items-center justify-between">
        <h1
          className="pf-heading text-2xl font-semibold tracking-tight"
          style={{ color: 'var(--app-text)' }}
        >
          Settings
        </h1>
        <button
          type="button"
          onClick={() => router.history.back()}
          className="text-xs underline"
          style={{ color: 'var(--app-muted)' }}
        >
          Back
        </button>
      </header>
      <KeyEntry />
      <Preferences />
    </main>
  )
}
