/**
 * The live journey state, per session, kept out of the component tree. Engine
 * results are written in via actions; scenes subscribe with useSyncExternalStore.
 * Persisted palettes go through palette-repo, not this store.
 */

import { useSyncExternalStore } from 'react'

import type { Direction, PaletteType, ScoredPalette, Source } from '#/features/palette/types'
import { getEngine } from '#/features/agent/get-engine'

export type Phase = 'idle' | 'running' | 'done' | 'error'

export type JourneyState = {
  source: Source | null
  directions: Direction[]
  directionsPhase: Phase
  chosenType: PaletteType | null
  variations: ScoredPalette[]
  variationsPhase: Phase
  chosen: ScoredPalette | null
}

const EMPTY: JourneyState = {
  source: null,
  directions: [],
  directionsPhase: 'idle',
  chosenType: null,
  variations: [],
  variationsPhase: 'idle',
  chosen: null,
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
    const directions = await getEngine().proposeDirections(source)
    if (sessions[id]?.source === source) patch(id, { directions, directionsPhase: 'done' })
  } catch {
    patch(id, { directionsPhase: 'error' })
  }
}

export async function chooseDirection(id: string, type: PaletteType): Promise<void> {
  const state = getState(id)
  if (!state.source) return
  patch(id, { chosenType: type, variations: [], variationsPhase: 'running', chosen: null })
  try {
    const variations = await getEngine().composeVariations(state.source, type)
    if (sessions[id]?.chosenType === type) patch(id, { variations, variationsPhase: 'done' })
  } catch {
    patch(id, { variationsPhase: 'error' })
  }
}

export function chooseVariation(id: string, palette: ScoredPalette): void {
  patch(id, { chosen: palette })
}

export function resetJourney(id: string): void {
  const next = { ...sessions }
  delete next[id]
  sessions = next
  emit()
}
