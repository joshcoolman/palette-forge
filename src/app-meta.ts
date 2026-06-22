/**
 * Per-app identity for the scaffold's status landing + document title.
 * This is the ONLY file that differs between the three sibling repos
 * (palette-forge, outpaint-studio, prompt-smith) at scaffold stage —
 * the component, routes, and config are identical.
 */

export type AppStatus = 'scaffolding' | 'planned' | 'building' | 'live'

export type AppMeta = {
  name: string
  tagline: string
  status: AppStatus
  statusNote: string
  repo: string
}

export const appMeta: AppMeta = {
  name: 'palette-forge',
  tagline:
    'An image or seed color in, refined and accessible light + dark palettes out.',
  status: 'scaffolding',
  statusNote: 'Scaffold only — the agent loop is not built yet. Active development.',
  repo: 'https://github.com/joshcoolman/palette-forge',
}
