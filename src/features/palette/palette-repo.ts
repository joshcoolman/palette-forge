/** Addressable palette storage (IndexedDB). Keyed by stable id. */

import type { Palette } from '#/features/palette/types'
import { STORE_PALETTES, idbDelete, idbGet, idbGetAll, idbPut } from '#/lib/db'

export function savePalette(palette: Palette): Promise<void> {
  return idbPut(STORE_PALETTES, palette).then(() => undefined)
}

export function getPalette(id: string): Promise<Palette | undefined> {
  return idbGet<Palette>(STORE_PALETTES, id)
}

/** All saved palettes, newest first. */
export function listPalettes(): Promise<Palette[]> {
  return idbGetAll<Palette>(STORE_PALETTES).then((all) =>
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  )
}

export function deletePalette(id: string): Promise<void> {
  return idbDelete(STORE_PALETTES, id)
}
