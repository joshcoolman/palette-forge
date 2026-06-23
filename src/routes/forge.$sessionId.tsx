import { createFileRoute, redirect } from '@tanstack/react-router'

// The forge moved inline onto `/` (one in-memory set, fixed key) — no per-set
// URL anymore. Kept as a redirect so old per-session links don't 404.
export const Route = createFileRoute('/forge/$sessionId')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
})
