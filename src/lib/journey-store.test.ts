/* eslint-disable import/first -- vi.mock must hoist above the store import below */
import 'fake-indexeddb/auto'

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import type { Source } from '#/features/palette/types'

// The store reaches the engine through get-engine and hydrates settings first;
// mock both so the test drives compose outcomes without a key or IndexedDB.
const { compose } = vi.hoisted(() => ({
  compose: vi.fn(),
}))

vi.mock('#/lib/settings', () => ({
  ensureHydrated: () => Promise.resolve(),
}))

vi.mock('#/features/agent/get-engine', () => ({
  getEngine: () => ({
    compose,
  }),
}))

import { resetJourney, startJourney, useJourney } from '#/lib/journey-store'

const SOURCE: Source = {
  type: 'color',
  value: '#3d405b',
  extracted: ['#3d405b'],
}

// Regression: a failed or empty surprise used to render as a silent blank grid
// (the 'error' phase was computed but never surfaced). It must be visible now.
// The check moved from the old direction-pick to the opening compose, same intent.
describe('journey-store surfaces compose failures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks an empty surprise as an error round, not a silent blank', async () => {
    const id = 'empty'
    compose.mockResolvedValueOnce([])
    const { result } = renderHook(() => useJourney(id))
    await act(async () => {
      await startJourney(id, SOURCE)
    })
    const round = result.current.rounds.at(-1)
    expect(round?.phase).toBe('error')
    expect(round?.error).toBeTruthy()
    expect(round?.variations).toHaveLength(0)
    resetJourney(id)
  })

  it('surfaces a thrown engine error message on the round', async () => {
    const id = 'throws'
    compose.mockRejectedValueOnce(new Error('overloaded'))
    const { result } = renderHook(() => useJourney(id))
    await act(async () => {
      await startJourney(id, SOURCE)
    })
    const round = result.current.rounds.at(-1)
    expect(round?.phase).toBe('error')
    expect(round?.error).toBe('overloaded')
    resetJourney(id)
  })

  it('resolves a non-empty surprise to a done round', async () => {
    const id = 'ok'
    compose.mockResolvedValueOnce([{ id: 'p1', character: 'a take' }])
    const { result } = renderHook(() => useJourney(id))
    await act(async () => {
      await startJourney(id, SOURCE)
    })
    const round = result.current.rounds.at(-1)
    expect(round?.phase).toBe('done')
    expect(round?.variations).toHaveLength(1)
    resetJourney(id)
  })
})
