/**
 * In-memory mirror of the browser-stored BYO key + model, so the synchronous
 * engine selector (get-engine) can read them without an async IndexedDB hop.
 * Hydrated once on the client; updated by the settings UI.
 */

import {
  DEFAULT_MODEL,
  clearApiKey,
  getApiKey,
  getModel,
  setApiKey,
  setModel,
} from '#/features/key/key-repo'

export type Settings = { apiKey?: string; model: string }

let current: Settings = { apiKey: undefined, model: DEFAULT_MODEL }
let hydration: Promise<void> | null = null

/** Read the persisted key/model into memory once (idempotent, client-only). */
export function ensureHydrated(): Promise<void> {
  if (!hydration) {
    hydration = (async () => {
      const [apiKey, model] = await Promise.all([getApiKey(), getModel()])
      current = { apiKey, model }
    })().catch(() => {
      // IndexedDB unavailable (e.g. during SSR) — keep defaults.
    })
  }
  return hydration
}

export function getSettings(): Settings {
  return current
}

export async function saveApiKey(key: string): Promise<void> {
  await ensureHydrated()
  await setApiKey(key)
  current = { ...current, apiKey: key }
}

export async function clearApiKeyAndCache(): Promise<void> {
  await ensureHydrated()
  await clearApiKey()
  current = { ...current, apiKey: undefined }
}

export async function saveModel(model: string): Promise<void> {
  await ensureHydrated()
  await setModel(model)
  current = { ...current, model }
}
