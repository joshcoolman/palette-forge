/** User preferences, stored only in this browser (IndexedDB). */

import { STORE_SETTINGS, idbGet, idbPut } from '#/lib/db'

type SettingRecord = { key: string; value: string }

const KEY_SKIP_DELETE_CONFIRM = 'skip-delete-confirm'
const KEY_DEFAULT_PALETTE_MODE = 'default-palette-mode'
const KEY_SAVED_VIEW = 'saved-view-mode'

export type SavedView = 'compact' | 'expanded'

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
