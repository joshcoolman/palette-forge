/* eslint-disable import/first -- vi.mock must hoist above the store import below */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import type { Source } from '#/features/palette/types'

// The store reaches the engine through get-engine and hydrates settings first;
// mock both so the test drives compose outcomes without a key or IndexedDB.
const { compose, propose, refineFn } = vi.hoisted(() => ({
  compose: vi.fn(),
  propose: vi.fn(),
  refineFn: vi.fn(),
}))

vi.mock('#/lib/settings', () => ({
  ensureHydrated: () => Promise.resolve(),
}))

vi.mock('#/features/agent/get-engine', () => ({
  getEngine: () => ({
    proposeDirections: propose,
    composeVariations: compose,
    refine: refineFn,
  }),
}))

import {
  chooseDirection,
  resetJourney,
  startJourney,
  useJourney,
} from '#/lib/journey-store'

const SOURCE: Source = {
  type: 'color',
  value: '#3d405b',
  extracted: ['#3d405b'],
}

async function seeded(id: string) {
  propose.mockResolvedValue([])
  const view = renderHook(() => useJourney(id))
  await act(async () => {
    await startJourney(id, SOURCE)
  })
  return view
}

// Regression: a failed or empty fan-out used to render as a silent blank grid
// (the 'error' phase was computed but never surfaced). It must be visible now.
describe('journey-store surfaces compose failures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks an empty fan-out as an error round, not a silent blank', async () => {
    const id = 'empty'
    const { result } = await seeded(id)
    compose.mockResolvedValueOnce([])
    await act(async () => {
      await chooseDirection(id, 'editorial')
    })
    const round = result.current.rounds.at(-1)
    expect(round?.phase).toBe('error')
    expect(round?.error).toBeTruthy()
    expect(round?.variations).toHaveLength(0)
    resetJourney(id)
  })

  it('surfaces a thrown engine error message on the round', async () => {
    const id = 'throws'
    const { result } = await seeded(id)
    compose.mockRejectedValueOnce(new Error('overloaded'))
    await act(async () => {
      await chooseDirection(id, 'editorial')
    })
    const round = result.current.rounds.at(-1)
    expect(round?.phase).toBe('error')
    expect(round?.error).toBe('overloaded')
    resetJourney(id)
  })

  it('resolves a non-empty fan-out to a done round', async () => {
    const id = 'ok'
    const { result } = await seeded(id)
    compose.mockResolvedValueOnce([{ id: 'p1', score: { overall: 82 } }])
    await act(async () => {
      await chooseDirection(id, 'editorial')
    })
    const round = result.current.rounds.at(-1)
    expect(round?.phase).toBe('done')
    expect(round?.variations).toHaveLength(1)
    resetJourney(id)
  })
})
