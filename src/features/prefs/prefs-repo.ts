/** User preferences, stored only in this browser (IndexedDB). */

import { STORE_SETTINGS, idbGet, idbPut } from '#/lib/db'

type SettingRecord = { key: string; value: string }

const KEY_SKIP_DELETE_CONFIRM = 'skip-delete-confirm'

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
