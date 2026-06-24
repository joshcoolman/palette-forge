/**
 * The fixed set of Google-font pairings the whole site can render content in.
 * Deliberately small and closed — a global preview lens, not an extensible type
 * tool. Drawn from type-explorer's curated pairings. `system` loads nothing.
 *
 * Scope is "content, not chrome": these drive --font-heading / --font-body, which
 * only the `.pf-heading` / `.pf-body` content elements opt into. The nav, buttons,
 * and settings keep the neutral system font.
 */

export type Pairing = {
  id: string
  label: string
  /** Google family for titles, or null for the system default. */
  heading: string | null
  /** Google family for body copy, or null for the system default. */
  body: string | null
}

/** Matches the body's base stack so `system` and unset look identical. */
export const SYSTEM_STACK =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

export const PAIRINGS: Pairing[] = [
  { id: 'system', label: 'System', heading: null, body: null },
  {
    id: 'work-sans-bitter',
    label: 'Work Sans + Bitter',
    heading: 'Work Sans',
    body: 'Bitter',
  },
  {
    id: 'epilogue-baskervville',
    label: 'Epilogue + Baskervville',
    heading: 'Epilogue',
    body: 'Baskervville',
  },
  {
    id: 'space-grotesk-inter',
    label: 'Space Grotesk + Inter',
    heading: 'Space Grotesk',
    body: 'Inter',
  },
  {
    id: 'fraunces-inter',
    label: 'Fraunces + Inter',
    heading: 'Fraunces',
    body: 'Inter',
  },
  {
    id: 'pt-sans-ibm-plex-serif',
    label: 'PT Sans + IBM Plex Serif',
    heading: 'PT Sans',
    body: 'IBM Plex Serif',
  },
  {
    id: 'alegreya-source-sans-pro',
    label: 'Alegreya + Source Sans Pro',
    heading: 'Alegreya',
    body: 'Source Sans Pro',
  },
  {
    id: 'gloock-inter',
    label: 'Gloock + Inter',
    heading: 'Gloock',
    body: 'Inter',
  },
]

export const DEFAULT_PAIRING_ID = 'space-grotesk-inter'

export function pairingById(id: string): Pairing {
  return PAIRINGS.find((p) => p.id === id) ?? PAIRINGS[0]! // PAIRINGS is non-empty
}
