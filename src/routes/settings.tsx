import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

import { Backdrop } from '#/components/journey/backdrop'
import { Preferences } from '#/components/settings/preferences'
import { AiAccess } from '#/components/settings/ai-access'

export const Route = createFileRoute('/settings')({ component: SettingsPage })

function SettingsPage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-4 py-16">
      <Backdrop colors={[]} />
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Back to home"
          title="Back to home"
          className="-ml-12 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border transition hover:opacity-70 sm:flex"
          style={{ borderColor: 'var(--app-border)', color: 'var(--app-muted)' }}
        >
          <ChevronLeft size={18} />
        </Link>
        <h1
          className="pf-heading text-2xl font-semibold tracking-tight"
          style={{ color: 'var(--app-text)' }}
        >
          Settings
        </h1>
      </header>
      <Preferences />
      <AiAccess />
    </main>
  )
}
