/**
 * The live journey state, per session, kept out of the component tree. Engine
 * results are written in via actions; scenes subscribe with useSyncExternalStore.
 * Persisted palettes go through palette-repo, not this store.
 *
 * Variations are a *sequence of rounds*: the initial fan-out plus any refine
 * steers stacked beneath it, so the trail shows where you came from. Re-picking
 * a direction branches a fresh tail (rounds reset for the new type).
 */

import { useSyncExternalStore } from 'react'

import type { Direction, PaletteType, ScoredPalette, Source } from '#/features/palette/types'
import { getEngine } from '#/features/agent/get-engine'
import { ensureHydrated } from '#/lib/settings'
import { makeId } from '#/lib/id'

export type Phase = 'idle' | 'running' | 'done' | 'error'

export type VariationRound = {
  id: string
  steer?: string
  variations: ScoredPalette[]
  phase: Phase
}

export type JourneyState = {
  source: Source | null
  directions: Direction[]
  directionsPhase: Phase
  chosenType: PaletteType | null
  rounds: VariationRound[]
  chosen: ScoredPalette | null
  progress: string
}

const EMPTY: JourneyState = {
  source: null,
  directions: [],
  directionsPhase: 'idle',
  chosenType: null,
  rounds: [],
  chosen: null,
  progress: '',
}

let sessions: Record<string, JourneyState> = {}
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getState(id: string): JourneyState {
  return sessions[id] ?? EMPTY
}

function patch(id: string, next: Partial<JourneyState>): void {
  sessions = { ...sessions, [id]: { ...getState(id), ...next } }
  emit()
}

function patchRound(id: string, roundId: string, next: Partial<VariationRound>): void {
  const rounds = getState(id).rounds.map((r) => (r.id === roundId ? { ...r, ...next } : r))
  patch(id, { rounds })
}

function recommendedOf(variations: ScoredPalette[]): ScoredPalette | null {
  let best: ScoredPalette | null = null
  for (const palette of variations) {
    if (!best || palette.score.overall > best.score.overall) best = palette
  }
  return best
}

export function useJourney(id: string): JourneyState {
  return useSyncExternalStore(
    subscribe,
    () => getState(id),
    () => EMPTY,
  )
}

export function hasJourney(id: string): boolean {
  return Boolean(sessions[id]?.source)
}

export async function startJourney(id: string, source: Source): Promise<void> {
  patch(id, { ...EMPTY, source, directionsPhase: 'running' })
  try {
    await ensureHydrated()
    const directions = await getEngine().proposeDirections(source, (m) => patch(id, { progress: m }))
    if (sessions[id]?.source === source) {
      patch(id, { directions, directionsPhase: 'done', progress: '' })
    }
  } catch {
    patch(id, { directionsPhase: 'error', progress: '' })
  }
}

/** Pick a path — branches a fresh tail (rounds reset) for this type. */
export async function chooseDirection(id: string, type: PaletteType): Promise<void> {
  const state = getState(id)
  if (!state.source) return
  const roundId = makeId()
  patch(id, {
    chosenType: type,
    chosen: null,
    rounds: [{ id: roundId, variations: [], phase: 'running' }],
  })
  try {
    await ensureHydrated()
    const variations = await getEngine().composeVariations(state.source, type, undefined, (m) =>
      patch(id, { progress: m }),
    )
    if (sessions[id]?.chosenType === type) {
      patchRound(id, roundId, { variations, phase: 'done' })
      patch(id, { progress: '' })
    }
  } catch {
    patchRound(id, roundId, { phase: 'error' })
    patch(id, { progress: '' })
  }
}

export function chooseVariation(id: string, palette: ScoredPalette): void {
  patch(id, { chosen: palette })
}

/** Steer from the current pick (or the latest round's recommendation) — appends a round. */
export async function refineJourney(id: string, instruction: string): Promise<void> {
  const state = getState(id)
  if (!state.chosenType || state.rounds.length === 0) return
  const latest = state.rounds[state.rounds.length - 1]
  const base = state.chosen ?? recommendedOf(latest.variations)
  if (!base) return
  const roundId = makeId()
  patch(id, {
    rounds: [...state.rounds, { id: roundId, steer: instruction, variations: [], phase: 'running' }],
  })
  try {
    await ensureHydrated()
    const variations = await getEngine().refine(base, instruction, (m) => patch(id, { progress: m }))
    patchRound(id, roundId, { variations, phase: 'done' })
    patch(id, { progress: '' })
  } catch {
    patchRound(id, roundId, { phase: 'error' })
    patch(id, { progress: '' })
  }
}

export function resetJourney(id: string): void {
  const next = { ...sessions }
  delete next[id]
  sessions = next
  emit()
}
