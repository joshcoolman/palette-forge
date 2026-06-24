import {
  Link,
  createRouter as createTanStackRouter,
} from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm" style={{ color: 'var(--app-muted)' }}>
        That page does not exist.
      </p>
      <Link
        to="/"
        className="rounded-md px-4 py-2 text-sm font-medium"
        style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
      >
        Back to Color for Days
      </Link>
    </main>
  )
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
