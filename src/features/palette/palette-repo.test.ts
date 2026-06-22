import 'fake-indexeddb/auto'

import { describe, it, expect } from 'vitest'

import type { Palette } from '#/features/palette/types'
import {
  deletePalette,
  getPalette,
  listPalettes,
  savePalette,
} from '#/features/palette/palette-repo'

function sample(id: string, createdAt: string): Palette {
  return {
    id,
    name: `palette-${id}`,
    seed: { type: 'color', value: '#3d405b' },
    colors: [{ role: 'background', light: '#ffffff', dark: '#111111' }],
    contrast: [
      {
        pairing: 'text-on-background',
        mode: 'light',
        ratio: 18.5,
        passes: 'AAA',
      },
    ],
    createdAt,
  }
}

describe('palette-repo', () => {
  it('round-trips a palette by id', async () => {
    const palette = sample('round-trip', '2026-03-01T00:00:00.000Z')
    await savePalette(palette)
    expect(await getPalette('round-trip')).toEqual(palette)
  })

  it('lists newest first and deletes', async () => {
    await savePalette(sample('older', '2026-01-01T00:00:00.000Z'))
    await savePalette(sample('newer', '2026-02-01T00:00:00.000Z'))

    const ids = (await listPalettes()).map((p) => p.id)
    expect(ids.indexOf('newer')).toBeLessThan(ids.indexOf('older'))

    await deletePalette('older')
    expect(await getPalette('older')).toBeUndefined()
  })
})
