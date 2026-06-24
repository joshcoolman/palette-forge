/**
 * In-memory mirror of browser-stored preferences, so the UI can read them
 * synchronously without an async IndexedDB hop. Hydrated once on the client.
 */

import {
  getApiKey,
  getChatModel,
  getDefaultPaletteMode,
  getSavedView,
  getSkipDeleteConfirm,
  removeApiKey,
  setApiKey,
  setChatModel,
  setDefaultPaletteMode,
  setSavedView,
  setSkipDeleteConfirm,
} from '#/features/prefs/prefs-repo'
import type { ChatModel, SavedView } from '#/features/prefs/prefs-repo'

export type Settings = {
  skipDeleteConfirm: boolean
  defaultPaletteMode: 'light' | 'dark'
  savedView: SavedView
  apiKey: string
  model: ChatModel
}

let current: Settings = {
  skipDeleteConfirm: false,
  defaultPaletteMode: 'dark',
  savedView: 'expanded',
  apiKey: '',
  model: 'haiku',
}
let hydration: Promise<void> | null = null

/** Read the persisted prefs into memory once (idempotent, client-only). */
export function ensureHydrated(): Promise<void> {
  if (!hydration) {
    hydration = (async () => {
      current = {
        skipDeleteConfirm: await getSkipDeleteConfirm(),
        defaultPaletteMode: await getDefaultPaletteMode(),
        savedView: await getSavedView(),
        apiKey: await getApiKey(),
        model: await getChatModel(),
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

export async function saveSavedView(value: SavedView): Promise<void> {
  await ensureHydrated()
  await setSavedView(value)
  current = { ...current, savedView: value }
}

export async function saveApiKey(value: string): Promise<void> {
  await ensureHydrated()
  await setApiKey(value)
  current = { ...current, apiKey: value }
}

export async function clearApiKey(): Promise<void> {
  await ensureHydrated()
  await removeApiKey()
  current = { ...current, apiKey: '' }
}

export async function saveChatModel(value: ChatModel): Promise<void> {
  await ensureHydrated()
  await setChatModel(value)
  current = { ...current, model: value }
}
