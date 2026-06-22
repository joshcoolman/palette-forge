/**
 * BYO-key + model settings, stored only in this browser. The key is sent only
 * to the provider; it never touches a backend (see direct-browser engine).
 */

import { STORE_SETTINGS, idbDelete, idbGet, idbPut } from '#/lib/db'

type SettingRecord = { key: string; value: string }

const KEY_API = 'anthropic-api-key'
const KEY_MODEL = 'model'

export const DEFAULT_MODEL = 'claude-sonnet-4-6'

async function getSetting(key: string): Promise<string | undefined> {
  const record = await idbGet<SettingRecord>(STORE_SETTINGS, key)
  return record?.value
}

function putSetting(key: string, value: string): Promise<void> {
  return idbPut<SettingRecord>(STORE_SETTINGS, { key, value }).then(() => undefined)
}

export function getApiKey(): Promise<string | undefined> {
  return getSetting(KEY_API)
}

export function setApiKey(value: string): Promise<void> {
  return putSetting(KEY_API, value)
}

export function clearApiKey(): Promise<void> {
  return idbDelete(STORE_SETTINGS, KEY_API)
}

export async function hasApiKey(): Promise<boolean> {
  return Boolean(await getApiKey())
}

export async function getModel(): Promise<string> {
  return (await getSetting(KEY_MODEL)) ?? DEFAULT_MODEL
}

export function setModel(value: string): Promise<void> {
  return putSetting(KEY_MODEL, value)
}
