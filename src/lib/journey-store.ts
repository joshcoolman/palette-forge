/**
 * The live journey state, per session, kept out of the component tree. Engine
 * results are written in via actions; scenes subscribe with useSyncExternalStore.
 * Persisted palettes go through palette-repo, not this store.
 *
 * Variations are a *sequence of rounds*: the opening "surprise me" four, plus any
 * re-runs (fresh fours) stacked newest-first, so the trail shows everything
 * you've generated. A settled journey is mirrored to IndexedDB and rehydrated on
 * reload — only Start over clears it.
 */

import { useSyncExternalStore } from 'react'

import type { ScoredPalette, Source } from '#/features/palette/types'
import { getEngine } from '#/features/agent/get-engine'
import { deriveRound } from '#/features/agent/derive'
import { deletePalette, savePalette } from '#/features/palette/palette-repo'
import { STORE_JOURNEYS, idbDelete, idbGet, idbPut } from '#/lib/db'
import { ensureHydrated } from '#/lib/settings'
import { makeId } from '#/lib/id'

export type Phase = 'idle' | 'running' | 'done' | 'error'

export type VariationRound = {
  id: string
  variations: ScoredPalette[]
  phase: Phase
  error?: string
  /** The model's friendly note for this round (AI engine only; unset otherwise). */
  message?: string
}

export type JourneyState = {
  source: Source | null
  rounds: VariationRound[]
  chosen: ScoredPalette | null
  /** Ids of takes the user has hearted into favorites this session. */
  saved: string[]
  progress: string
  /** True once this tab has loaded (or confirmed empty) from IndexedDB. */
  hydrated: boolean
}

const EMPTY: JourneyState = {
  source: null,
  rounds: [],
  chosen: null,
  saved: [],
  progress: '',
  hydrated: false,
}

/** What's mirrored to IndexedDB — the live, non-transient state, keyed by id. */
type PersistedJourney = {
  id: string
  source: Source
  rounds: VariationRound[]
  chosen: ScoredPalette | null
  saved: string[]
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
  schedulePersist(id)
}

function patchRound(
  id: string,
  roundId: string,
  next: Partial<VariationRound>,
): void {
  const rounds = getState(id).rounds.map((r) =>
    r.id === roundId ? { ...r, ...next } : r,
  )
  patch(id, { rounds })
}

// Every take in a journey shares one seed (the source), so persist palettes with
// the bulky image stripped and re-attach it from `source` on load — one image
// copy per journey instead of one per take.
function stripSeed(p: ScoredPalette): ScoredPalette {
  return { ...p, seed: { ...p.seed, value: '' } }
}

function reinjectSeed(p: ScoredPalette, value: string): ScoredPalette {
  return { ...p, seed: { ...p.seed, value } }
}

const persistTimers: Record<string, ReturnType<typeof setTimeout>> = {}

/**
 * Mirror a journey to IndexedDB (debounced). The source persists as soon as it's set
 * — so a refresh mid-generation keeps the brief instead of losing everything — but a
 * **running** round is never persisted (it would rehydrate as stuck, and a model
 * stream can't resume across a reload). An interrupted journey therefore restores as
 * "source present, no rounds", which the UI offers to regenerate.
 */
function schedulePersist(id: string): void {
  if (!getState(id).source) return
  clearTimeout(persistTimers[id]) // no-op when absent
  persistTimers[id] = setTimeout(() => {
    delete persistTimers[id]
    const s = getState(id)
    if (!s.source) return
    // Stripping the per-take seed only pays off for images (one shared dataURL,
    // else stored N times). Color/prompt seeds are tiny — and a prompt journey's
    // takes each carry their OWN seed, so stripping + reinjecting one source value
    // would flatten them. Leave non-image seeds intact.
    const strip = s.source.type === 'image'
    const record: PersistedJourney = {
      id,
      source: s.source,
      rounds: s.rounds
        .filter((r) => r.phase !== 'running')
        .map((r) => ({
          ...r,
          variations: strip ? r.variations.map(stripSeed) : r.variations,
        })),
      chosen: s.chosen ? (strip ? stripSeed(s.chosen) : s.chosen) : null,
      saved: s.saved,
    }
    void idbPut(STORE_JOURNEYS, record)
  }, 400)
}

/** An empty fan-out is a failure, not a result — surface it like a thrown one. */
const EMPTY_RESULT = 'The composer returned no usable palettes. Try again.'

function messageFrom(e: unknown): string {
  if (e instanceof Error && e.message) return e.message
  return 'The composer hit an error. Try again.'
}

/** Non-hook read of whether a journey already holds a source — for the one-time
 *  first-run bootstrap, which must not start a round over a restored session. */
export function journeyHasSource(id: string): boolean {
  return !!getState(id).source
}

export function useJourney(id: string): JourneyState {
  return useSyncExternalStore(
    subscribe,
    () => getState(id),
    () => EMPTY,
  )
}

/** Open the journey: compose the surprise — four distinct takes in one round. */
export async function startJourney(id: string, source: Source): Promise<void> {
  const roundId = makeId()
  patch(id, {
    ...EMPTY,
    source,
    hydrated: true,
    rounds: [{ id: roundId, variations: [], phase: 'running' }],
  })
  await runSurprise(id, roundId, source, 0)
}

/**
 * Restore a journey from IndexedDB on reload. No-op if this tab already holds a
 * live session (navigated in from home). Marks the session hydrated either way so
 * the route can tell "still loading" from "genuinely empty — start over."
 */
export async function hydrateJourney(id: string): Promise<void> {
  if (id in sessions) return
  let stored: PersistedJourney | undefined
  try {
    stored = await idbGet<PersistedJourney>(STORE_JOURNEYS, id)
  } catch {
    stored = undefined
  }
  if (id in sessions) return
  if (stored?.source) {
    const value = stored.source.value
    // Mirror the persist side: only image takes had their seed stripped, so only
    // they need it reinjected. Non-image seeds were stored whole.
    const reinject =
      stored.source.type === 'image'
        ? (v: ScoredPalette): ScoredPalette => reinjectSeed(v, value)
        : (v: ScoredPalette): ScoredPalette => v
    patch(id, {
      source: stored.source,
      rounds: stored.rounds.map((r) => ({
        ...r,
        variations: r.variations.map(reinject),
      })),
      chosen: stored.chosen ? reinject(stored.chosen) : null,
      saved: stored.saved,
      progress: '',
      hydrated: true,
    })
  } else {
    patch(id, { hydrated: true })
  }
}

/** Re-run: append another fresh round — keep everything already generated. */
export async function rerunJourney(id: string): Promise<void> {
  const state = getState(id)
  if (!state.source) return
  // The new round's index is the variation seed, so each re-run differs from the
  // opening (and from prior re-runs).
  const variation = state.rounds.length

  // AI journeys: the opening round was a paid model call; re-runs are instant,
  // free algorithmic variations *of* that output (rotate the colorway) — so
  // smashing regen stays the fast wall-of-color it is for deterministic seeds,
  // not a model call each time. Falls back to a fresh AI compose if there's no
  // settled base yet (e.g. the opening round failed).
  if (state.source.type === 'prompt') {
    const base = state.rounds[0]?.variations ?? []
    if (base.length > 0) {
      const seen = new Set<string>(
        state.rounds.flatMap((r) => r.variations.map((v) => v.name)),
      )
      patch(id, {
        rounds: [
          ...state.rounds,
          { id: makeId(), variations: deriveRound(base, variation, seen), phase: 'done' },
        ],
      })
      return
    }
  }

  const roundId = makeId()
  patch(id, {
    rounds: [...state.rounds, { id: roundId, variations: [], phase: 'running' }],
  })
  await runSurprise(id, roundId, state.source, variation)
}

/** Compose a round and resolve it to done / a visible error round. */
async function runSurprise(
  id: string,
  roundId: string,
  source: Source,
  variation: number,
): Promise<void> {
  try {
    await ensureHydrated()
    // Names already on screen this journey — so a re-run's four don't repeat
    // earlier rounds' names (journey-wide dedup).
    const usedNames = getState(id).rounds.flatMap((r) =>
      r.variations.map((v) => v.name),
    )
    const { palettes, message } = await getEngine().compose(
      source,
      (m) => patch(id, { progress: m }),
      variation,
      usedNames,
    )
    if (getState(id).source !== source) return
    if (palettes.length === 0) {
      patchRound(id, roundId, { phase: 'error', error: EMPTY_RESULT })
    } else {
      patchRound(id, roundId, { variations: palettes, message, phase: 'done' })
    }
    patch(id, { progress: '' })
  } catch (e) {
    patchRound(id, roundId, { phase: 'error', error: messageFrom(e) })
    patch(id, { progress: '' })
  }
}

export function chooseVariation(id: string, palette: ScoredPalette): void {
  patch(id, { chosen: palette })
}

/**
 * Retune the active set's source color in place — for the editable swatch. Only
 * updates the source (and its anchor), never composes; the existing rounds stay
 * put and the user hits Re-run when they want a fresh four from the new color.
 * Color sources only (an image's hue isn't a single editable value).
 */
export function setSourceColor(id: string, hex: string): void {
  const state = getState(id)
  if (!state.source || state.source.type !== 'color') return
  patch(id, { source: { ...state.source, value: hex, extracted: [hex] } })
}

/**
 * Heart a take into favorites, or un-heart it back out — the only save path
 * now. Optimistic: flip the session's saved set immediately, persist in the
 * background (IndexedDB writes are local and effectively always succeed).
 */
export function toggleSaved(id: string, palette: ScoredPalette): void {
  const saved = getState(id).saved
  if (saved.includes(palette.id)) {
    patch(id, { saved: saved.filter((s) => s !== palette.id) })
    void deletePalette(palette.id)
  } else {
    patch(id, { saved: [...saved, palette.id] })
    // Stamp the save moment so the grid (sorted newest-first) shows the take you
    // just hearted as the very first card — even when it came from an older
    // round. createdAt is otherwise the compose time.
    void savePalette({ ...palette, createdAt: new Date().toISOString() })
  }
}

/** Start over: forget the journey in memory and in IndexedDB. */
export function resetJourney(id: string): void {
  const next = { ...sessions }
  delete next[id]
  sessions = next
  clearTimeout(persistTimers[id]) // no-op when absent
  delete persistTimers[id]
  void idbDelete(STORE_JOURNEYS, id)
  emit()
}
