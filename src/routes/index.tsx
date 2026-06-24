import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

import type {
  Mode,
  Palette,
  ScoredPalette,
  Source,
} from '#/features/palette/types'
import { isValidHex, withLightness } from '#/features/color/color-utils'
import { deletePalette, listPalettes } from '#/features/palette/palette-repo'
import { createSamplePalettes } from '#/features/palette/samples'
import {
  chooseVariation,
  hydrateJourney,
  journeyHasSource,
  rerunJourney,
  resetJourney,
  setSourceColor,
  startJourney,
  toggleSaved,
  useJourney,
} from '#/lib/journey-store'
import {
  ensureHydrated,
  getSettings,
  saveSavedView,
  saveSkipDeleteConfirm,
} from '#/lib/settings'
import type { SavedView } from '#/features/prefs/prefs-repo'
import { IconButton } from '#/components/ui/icon-button'
import { Backdrop } from '#/components/journey/backdrop'
import { SceneVariations } from '#/components/journey/scene-variations'
import { SourcePopover } from '#/components/journey/source-popover'
import { ColorPicker } from '#/components/journey/color-picker'
import { FavoriteCard } from '#/components/favorites/favorite-card'
import { CompactCard } from '#/components/favorites/compact-card'
import { ViewModeToggle } from '#/components/favorites/view-mode-toggle'
import { ExportModal } from '#/components/favorites/export-modal'
import { DeleteConfirm } from '#/components/favorites/delete-confirm'

export const Route = createFileRoute('/')({ component: Home })

// One in-memory journey, keyed by a fixed id instead of a route param — the
// whole app lives on this page now. Persist/rehydrate (IndexedDB) is unchanged;
// it just points at this single key.
const ACTIVE = 'active'

function backdropColors(
  chosen: ScoredPalette | null,
  fallback: string[],
): string[] {
  // Before a take is picked the backdrop is tinted by the raw source/seed, which
  // can be a bright curated color — pull its lightness way down so the gradient
  // stays a calm dark canvas, not a glowing blob.
  if (!chosen) {
    return fallback.map((hex) =>
      isValidHex(hex) ? withLightness(hex, 0.16) : hex,
    )
  }
  const get = (role: string): string =>
    chosen.colors.find((c) => c.role === role)?.dark ?? ''
  return [get('accent'), get('surface'), get('background')].filter(Boolean)
}

function SourceThumb({
  source,
  onEdit,
}: {
  source: Source
  onEdit?: () => void
}) {
  if (source.type === 'image') {
    // Show the actual upload at its natural aspect ratio (the browser preserves
    // intrinsic w/h), capped so a tall portrait or wide landscape both stay tidy
    // in the header — no square crop.
    return (
      <img
        src={source.value}
        alt=""
        className="h-auto max-h-24 w-auto max-w-[160px] rounded-[var(--app-radius)]"
        style={{ outline: '1px solid var(--app-border)' }}
      />
    )
  }
  // A color source is editable: click the swatch to open the picker, then Done
  // retunes the source and re-runs.
  return (
    <button
      type="button"
      aria-label="Change source color"
      title="Change source color"
      onClick={onEdit}
      className="h-10 w-10 cursor-pointer rounded-[var(--app-radius)] transition hover:ring-2 hover:ring-white/40"
      style={{
        background: source.value,
        outline: '1px solid var(--app-border)',
      }}
    />
  )
}

function Home() {
  const journey = useJourney(ACTIVE)

  const [palettes, setPalettes] = useState<Palette[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState<Palette | null>(null)
  const [confirming, setConfirming] = useState<Palette | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false)
  const [defaultMode, setDefaultMode] = useState<Mode>('dark')
  const [viewMode, setViewMode] = useState<SavedView>('expanded')
  // Compact view only: which card has its controls revealed. Single-open — tapping
  // another row collapses this one. Null = all rows show just their colors.
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  // Desktop compact behaves differently: a click jumps straight to the code popup
  // (find-and-share) instead of revealing the mobile accordion controls.
  const [isDesktop, setIsDesktop] = useState(false)
  const [editingColor, setEditingColor] = useState(false)

  const active = !!journey.source
  const savedKey = journey.saved.join(',')
  const running = journey.rounds.at(-1)?.phase === 'running'

  async function refresh() {
    setPalettes(await listPalettes())
    setLoaded(true)
  }

  // First-load bootstrap: restore any in-progress set, mirror the prefs the page
  // reads (skip-delete-confirm, default card mode), and — whenever the library
  // loads empty (a brand-new visitor, or someone who deleted everything and then
  // reloaded) — seed the three samples and open a round from a neutral seed so the
  // page lands lively and clickable instead of blank. Mid-session the empty state
  // still shows its manual "Create sample palettes" button; only a fresh load
  // re-seeds. Hydrate first so a returning session isn't started over.
  useEffect(() => {
    let alive = true
    async function bootstrap() {
      await hydrateJourney(ACTIVE)
      await ensureHydrated()
      if (!alive) return
      const s = getSettings()
      setSkipDeleteConfirm(s.skipDeleteConfirm)
      setDefaultMode(s.defaultPaletteMode)
      setViewMode(s.savedView)
      const existing = await listPalettes()
      if (!alive || existing.length > 0) return
      setSeeding(true)
      try {
        await createSamplePalettes()
        await refresh()
        if (!journeyHasSource(ACTIVE)) {
          await startJourney(ACTIVE, {
            type: 'color',
            value: '#8d8d8f',
            extracted: ['#8d8d8f'],
          })
        }
      } finally {
        if (alive) setSeeding(false)
      }
    }
    void bootstrap()
    return () => {
      alive = false
    }
  }, [])

  // Track the sm breakpoint (640px) so compact cards can switch click behavior.
  // Defaults false (mobile-first, SSR-safe); resolves on mount and on resize.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // ESC dismisses the current round — a keyboard mirror of the X ("Start over")
  // button. Ignored while a modal is open so it doesn't double up on their own
  // dismissal, and only when a working area is showing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (!active || open || confirming || editingColor) return
      startOver()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, open, confirming, editingColor])

  // The grid is keyed off palette-repo, but hearts flow through the journey
  // store — re-list whenever the active set's saved ids change so the grid stays
  // in sync with the working area above it.
  useEffect(() => {
    void refresh()
  }, [savedKey])

  // No auto-scroll on a new round: re-runs render newest-first, so the fresh
  // four lands right under the header where the Re-run button is — the page
  // shouldn't jump.

  function handleStart(source: Source) {
    void startJourney(ACTIVE, source)
  }

  // Start over is the one explicit clear of the working area; favorites persist.
  function startOver() {
    resetJourney(ACTIVE)
  }

  async function remove(id: string) {
    await deletePalette(id)
    await refresh()
  }

  // Delete a favorite: straight through if the user opted out of the popup,
  // otherwise open the confirm dialog.
  function requestDelete(palette: Palette) {
    if (skipDeleteConfirm) void remove(palette.id)
    else setConfirming(palette)
  }

  // From the confirm dialog: honor "Don't ask me again", then delete.
  function confirmDelete(dontAskAgain: boolean) {
    if (!confirming) return
    if (dontAskAgain) {
      setSkipDeleteConfirm(true)
      void saveSkipDeleteConfirm(true)
    }
    void remove(confirming.id)
    setConfirming(null)
  }

  async function addSamples() {
    setSeeding(true)
    try {
      await createSamplePalettes()
      await refresh()
    } finally {
      setSeeding(false)
    }
  }

  return (
    <>
      <Backdrop
        colors={backdropColors(
          journey.chosen,
          journey.source?.extracted ?? [],
        )}
      />
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-5 px-4 py-12">
        {/* Brand lives in the global nav now; the homepage stays clean — just the
            forge button, the working area, and the colorful grid. The view toggle
            sits opposite the "+" (only meaningful once there are saved palettes).
            To make this mobile-only later, add `sm:hidden` to the toggle wrapper
            and force `effectiveView` to 'expanded' at >=sm. */}
        <header className="flex items-center justify-between gap-4">
          {loaded && palettes.length > 0 ? (
            <ViewModeToggle
              value={viewMode}
              onChange={(v) => {
                setViewMode(v)
                setOpenCardId(null)
                void saveSavedView(v)
              }}
            />
          ) : (
            <span />
          )}
          <SourcePopover onStart={handleStart} />
        </header>

        {active && journey.source && (
          <section
            className="flex flex-col gap-8 rounded-[var(--app-radius)] border p-5"
            style={{
              borderColor: 'var(--app-border)',
              background: 'var(--app-surface)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <SourceThumb
                  source={journey.source}
                  onEdit={() => setEditingColor(true)}
                />
                <div>
                  <p
                    className="pf-heading text-sm font-medium"
                    style={{ color: 'var(--app-text)' }}
                  >
                    Palettes
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--app-muted)' }}
                  >
                    {journey.source.type === 'image'
                      ? 'From an image'
                      : `From ${journey.source.value}`}
                  </p>
                </div>
              </div>
              {/*
                On mobile, flip the order and widen the gap: Re-run (the frequent,
                safe action) lands in the far-right corner where the screen edge
                stops the thumb from overshooting, and Start over (X, destructive)
                moves inward with real separation so it's no longer an accidental
                tap. Desktop keeps the original order/spacing (mouse — no hazard).
              */}
              <div className="flex flex-row-reverse items-center gap-4 sm:flex-row sm:gap-2">
                {!running && (
                  <IconButton
                    label="Re-run"
                    onClick={() => void rerunJourney(ACTIVE)}
                  >
                    <RefreshCw size={14} />
                  </IconButton>
                )}
                <IconButton label="Start over" onClick={startOver}>
                  <X size={14} />
                </IconButton>
              </div>
            </div>

            <SceneVariations
              rounds={journey.rounds}
              savedIds={journey.saved}
              onToggleSave={(palette) => {
                const wasSaved = journey.saved.includes(palette.id)
                toggleSaved(ACTIVE, palette)
                // Hearting re-themes the page to this palette (the backdrop keys
                // off `chosen`); un-hearting leaves the current theme as-is.
                if (!wasSaved) chooseVariation(ACTIVE, palette)
              }}
              onRegenerate={() => void rerunJourney(ACTIVE)}
            />
          </section>
        )}

        {loaded && palettes.length === 0 ? (
          <div
            className="flex flex-col items-center gap-4 rounded-[var(--app-radius)] border p-10 text-center text-sm"
            style={{
              borderColor: 'var(--app-border)',
              color: 'var(--app-muted)',
            }}
          >
            <p>
              No saved palettes yet. Tap{' '}
              <span style={{ color: 'var(--app-text)' }}>+</span> to forge a set,
              then keep the ones you like.
            </p>
            <button
              type="button"
              onClick={() => void addSamples()}
              disabled={seeding}
              className="rounded-full border px-4 py-1.5 text-xs font-medium transition hover:opacity-70 disabled:opacity-50"
              style={{ borderColor: 'var(--app-text)', color: 'var(--app-text)' }}
            >
              {seeding ? 'Creating…' : 'Create sample palettes'}
            </button>
          </div>
        ) : (
          <div
            className="grid items-start gap-5"
            style={{
              gridTemplateColumns:
                'repeat(auto-fill, minmax(min(285px, 100%), 1fr))',
            }}
          >
            {palettes.map((p) => {
              const cardProps = {
                palette: p,
                defaultMode,
                onOpen: () => setOpen(p),
                onDelete: () => requestDelete(p),
              }
              return viewMode === 'compact' ? (
                <CompactCard
                  key={p.id}
                  {...cardProps}
                  expanded={openCardId === p.id}
                  onToggleControls={() =>
                    setOpenCardId((id) => (id === p.id ? null : p.id))
                  }
                  openCodeOnClick={isDesktop}
                />
              ) : (
                <FavoriteCard key={p.id} {...cardProps} />
              )
            })}
          </div>
        )}
      </main>

      {editingColor && journey.source && (
        <ColorPicker
          initial={journey.source.value}
          onDone={(hex) => {
            setEditingColor(false)
            setSourceColor(ACTIVE, hex)
            void rerunJourney(ACTIVE)
          }}
          onCancel={() => setEditingColor(false)}
        />
      )}

      {open && (
        <ExportModal
          palette={open}
          defaultMode={defaultMode}
          onClose={() => setOpen(null)}
        />
      )}
      {confirming && (
        <DeleteConfirm
          palette={confirming}
          onCancel={() => setConfirming(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  )
}
