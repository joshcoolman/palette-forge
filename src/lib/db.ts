/**
 * Single IndexedDB connection shared by the palette and settings repos.
 * Browser-only — callers must run client-side (guard server/SSR paths).
 */

const DB_NAME = 'palette-forge'
const DB_VERSION = 2

export const STORE_PALETTES = 'palettes'
export const STORE_SETTINGS = 'settings'
export const STORE_JOURNEYS = 'journeys'

let dbPromise: Promise<IDBDatabase> | null = null

function getFactory(): IDBFactory {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available in this environment')
  }
  return indexedDB
}

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = getFactory().open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_PALETTES)) {
        db.createObjectStore(STORE_PALETTES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(STORE_JOURNEYS)) {
        db.createObjectStore(STORE_JOURNEYS, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

async function withStore<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(store, mode)
    const request = run(transaction.objectStore(store))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export function idbGet<T>(
  store: string,
  key: IDBValidKey,
): Promise<T | undefined> {
  return withStore<T | undefined>(
    store,
    'readonly',
    (s) => s.get(key) as IDBRequest<T | undefined>,
  )
}

export function idbGetAll<T>(store: string): Promise<T[]> {
  return withStore<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>)
}

export function idbPut<T>(store: string, value: T): Promise<IDBValidKey> {
  return withStore<IDBValidKey>(store, 'readwrite', (s) => s.put(value))
}

export function idbDelete(store: string, key: IDBValidKey): Promise<void> {
  return withStore<void>(
    store,
    'readwrite',
    (s) => s.delete(key) as IDBRequest<void>,
  )
}
