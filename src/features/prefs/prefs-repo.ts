/** User preferences, stored only in this browser (IndexedDB). */

import { STORE_SETTINGS, idbDelete, idbGet, idbPut } from '#/lib/db'

type SettingRecord = { key: string; value: string }

const KEY_SKIP_DELETE_CONFIRM = 'skip-delete-confirm'
const KEY_DEFAULT_PALETTE_MODE = 'default-palette-mode'
const KEY_SAVED_VIEW = 'saved-view-mode'
const KEY_API_KEY = 'anthropic-api-key'
const KEY_CHAT_MODEL = 'anthropic-model'

export type SavedView = 'compact' | 'expanded'

/** The two models the optional AI layer offers: Haiku for speed/cost (the
 *  default), Sonnet for quality. Lives here, the lowest layer, because this is
 *  what persists it; the client and settings mirror import the type. */
export type ChatModel = 'haiku' | 'sonnet'

async function getSetting(key: string): Promise<string | undefined> {
  const record = await idbGet<SettingRecord>(STORE_SETTINGS, key)
  return record?.value
}

function putSetting(key: string, value: string): Promise<void> {
  return idbPut<SettingRecord>(STORE_SETTINGS, { key, value }).then(
    () => undefined,
  )
}

/** Preference: skip the delete-confirm popup. Default off (popup shows). */
export async function getSkipDeleteConfirm(): Promise<boolean> {
  return (await getSetting(KEY_SKIP_DELETE_CONFIRM)) === 'true'
}

export function setSkipDeleteConfirm(value: boolean): Promise<void> {
  return putSetting(KEY_SKIP_DELETE_CONFIRM, value ? 'true' : 'false')
}

/** Preference: which mode saved-palette cards open in. Default dark. */
export async function getDefaultPaletteMode(): Promise<'light' | 'dark'> {
  return (await getSetting(KEY_DEFAULT_PALETTE_MODE)) === 'light'
    ? 'light'
    : 'dark'
}

export function setDefaultPaletteMode(value: 'light' | 'dark'): Promise<void> {
  return putSetting(KEY_DEFAULT_PALETTE_MODE, value)
}

/** Preference: how the saved-palettes grid renders. Default expanded (full
 *  interactive flip cards); compact shows just the color strips. */
export async function getSavedView(): Promise<SavedView> {
  return (await getSetting(KEY_SAVED_VIEW)) === 'compact' ? 'compact' : 'expanded'
}

export function setSavedView(value: SavedView): Promise<void> {
  return putSetting(KEY_SAVED_VIEW, value)
}

/** The user's Anthropic API key, stored only in this browser. Empty string =
 *  no key = the AI layer is entirely absent (the prime directive). */
export async function getApiKey(): Promise<string> {
  return (await getSetting(KEY_API_KEY)) ?? ''
}

export function setApiKey(value: string): Promise<void> {
  return putSetting(KEY_API_KEY, value)
}

/** Truly delete the stored key — removes the IndexedDB record, not just blanks
 *  it — so "remove key" leaves nothing behind in the browser. */
export function removeApiKey(): Promise<void> {
  return idbDelete(STORE_SETTINGS, KEY_API_KEY)
}

/** Which model the AI layer calls. Default haiku (fast, cheap). */
export async function getChatModel(): Promise<ChatModel> {
  return (await getSetting(KEY_CHAT_MODEL)) === 'sonnet' ? 'sonnet' : 'haiku'
}

export function setChatModel(value: ChatModel): Promise<void> {
  return putSetting(KEY_CHAT_MODEL, value)
}
