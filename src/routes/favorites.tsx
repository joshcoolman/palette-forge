import { createFileRoute, redirect } from '@tanstack/react-router'

// Favorites folded into `/` (the one page). Kept as a redirect so old
// bookmarks/links don't 404.
export const Route = createFileRoute('/favorites')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
})
