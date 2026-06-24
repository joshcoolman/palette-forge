/**
 * In-memory mirror of browser-stored preferences, so the UI can read them
 * synchronously without an async IndexedDB hop. Hydrated once on the client.
 */

import {
  getDefaultPaletteMode,
  getSkipDeleteConfirm,
  setDefaultPaletteMode,
  setSkipDeleteConfirm,
} from '#/features/prefs/prefs-repo'

export type Settings = {
  skipDeleteConfirm: boolean
  defaultPaletteMode: 'light' | 'dark'
}

let current: Settings = {
  skipDeleteConfirm: false,
  defaultPaletteMode: 'dark',
}
let hydration: Promise<void> | null = null

/** Read the persisted prefs into memory once (idempotent, client-only). */
export function ensureHydrated(): Promise<void> {
  if (!hydration) {
    hydration = (async () => {
      current = {
        skipDeleteConfirm: await getSkipDeleteConfirm(),
        defaultPaletteMode: await getDefaultPaletteMode(),
      }
    })().catch(() => {
      // IndexedDB unavailable (e.g. during SSR) — keep defaults.
    })
  }
  return hydration
}

export function getSettings(): Settings {
  return current
}

export async function saveSkipDeleteConfirm(value: boolean): Promise<void> {
  await ensureHydrated()
  await setSkipDeleteConfirm(value)
  current = { ...current, skipDeleteConfirm: value }
}

export async function saveDefaultPaletteMode(
  value: 'light' | 'dark',
): Promise<void> {
  await ensureHydrated()
  await setDefaultPaletteMode(value)
  current = { ...current, defaultPaletteMode: value }
}
