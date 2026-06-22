import { createFileRoute } from '@tanstack/react-router'

import { appMeta } from '#/app-meta'
import { StatusLanding } from '#/components/status-landing'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return <StatusLanding meta={appMeta} />
}
