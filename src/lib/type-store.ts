/**
 * The site-wide, fixed font pairing — one global value, persisted to
 * localStorage. Mirrors the journey-store pattern (useSyncExternalStore), but
 * trivial: a single id. Applying it writes --font-heading / --font-body onto
 * :root and lazy-loads the chosen Google families; only `.pf-heading` /
 * `.pf-body` content opts in, so chrome stays in the system font.
 */

import { useSyncExternalStore } from 'react'

import {
  DEFAULT_PAIRING_ID,
  PAIRINGS,
  SYSTEM_STACK,
  pairingById,
} from '#/features/typography/pairings'
import {
  fontStackByName,
  loadFontByName,
} from '#/features/typography/font-loader'

const STORAGE_KEY = 'pf-type-pairing'
const listeners = new Set<() => void>()
let pairingId = DEFAULT_PAIRING_ID

function emit(): void {
  for (const l of listeners) l()
}

/** Load the families and set the CSS vars for a pairing (browser-only). */
function applyVars(id: string): void {
  if (typeof document === 'undefined') return
  const p = pairingById(id)
  if (p.heading) loadFontByName(p.heading, [400, 600, 700])
  if (p.body) loadFontByName(p.body, [400, 500])
  const root = document.documentElement
  root.style.setProperty(
    '--font-heading',
    p.heading ? fontStackByName(p.heading) : SYSTEM_STACK,
  )
  root.style.setProperty(
    '--font-body',
    p.body ? fontStackByName(p.body) : SYSTEM_STACK,
  )
}

/** Read the persisted pairing and apply it. Idempotent, client-only. */
export function ensureTypeHydrated(): void {
  if (typeof window === 'undefined') return
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved && PAIRINGS.some((p) => p.id === saved)) pairingId = saved
  applyVars(pairingId)
  emit()
}

export function setPairing(id: string): void {
  pairingId = id
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, id)
  }
  applyVars(id)
  emit()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getSnapshot(): string {
  return pairingId
}

function getServerSnapshot(): string {
  return DEFAULT_PAIRING_ID
}

export function usePairingId(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
