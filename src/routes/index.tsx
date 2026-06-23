import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

import type { Palette, ScoredPalette, Source } from '#/features/palette/types'
import { isValidHex, withLightness } from '#/features/color/color-utils'
import { deletePalette, listPalettes } from '#/features/palette/palette-repo'
import { createSamplePalettes } from '#/features/palette/samples'
import {
  chooseVariation,
  hydrateJourney,
  refineJourney,
  rerunJourney,
  resetJourney,
  setSourceColor,
  startJourney,
  toggleSaved,
  useJourney,
} from '#/lib/journey-store'
import { ensureHydrated, getSettings } from '#/lib/settings'
import { IconButton } from '#/components/ui/icon-button'
import { Backdrop } from '#/components/journey/backdrop'
import { SceneVariations } from '#/components/journey/scene-variations'
import { SourcePopover } from '#/components/journey/source-popover'
import { FavoriteCard } from '#/components/favorites/favorite-card'
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
  onPickColor,
}: {
  source: Source
  onPickColor?: (hex: string) => void
}) {
  if (source.type === 'image') {
    return (
      <img
        src={source.value}
        alt=""
        className="h-10 w-10 rounded-lg object-cover"
        style={{ outline: '1px solid var(--app-border)' }}
      />
    )
  }
  // A color source is editable: click the swatch to retune the hue (native
  // picker). It only updates the source — Re-run regenerates when you're ready.
  return (
    <label
      aria-label="Change source color"
      title="Change source color"
      className="relative block h-10 w-10 cursor-pointer rounded-lg transition hover:ring-2 hover:ring-white/40"
      style={{
        background: source.value,
        outline: '1px solid var(--app-border)',
      }}
    >
      <input
        type="color"
        value={source.value}
        onChange={(e) => onPickColor?.(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  )
}

function Home() {
  const journey = useJourney(ACTIVE)

  const [palettes, setPalettes] = useState<Palette[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState<Palette | null>(null)
  const [confirming, setConfirming] = useState<Palette | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [hasKey, setHasKey] = useState(false)

  const active = !!journey.source
  const savedKey = journey.saved.join(',')
  // Refine (the natural-language steer) is a key-gated feature; without a key
  // the working area is surprise + re-run only.
  const running = journey.rounds.at(-1)?.phase === 'running'

  async function refresh() {
    setPalettes(await listPalettes())
    setLoaded(true)
  }

  // Restore an in-progress set from IndexedDB on first load (no-op if live).
  useEffect(() => {
    void hydrateJourney(ACTIVE)
  }, [])

  // Mirror the BYO-key presence so the refine UI can be hidden without one.
  useEffect(() => {
    let alive = true
    void ensureHydrated().then(() => {
      if (alive) setHasKey(Boolean(getSettings().apiKey))
    })
    return () => {
      alive = false
    }
  }, [])

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
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-4 py-12">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1
              className="pf-heading text-2xl font-semibold tracking-tight"
              style={{ color: 'var(--app-text)' }}
            >
              Palette Forge
            </h1>
            <p className="mt-1 text-xs" style={{ color: 'var(--app-muted)' }}>
              {loaded
                ? `${palettes.length} saved ${palettes.length === 1 ? 'palette' : 'palettes'}`
                : 'Loading…'}
            </p>
          </div>
          <SourcePopover onStart={handleStart} />
        </header>

        {active && journey.source && (
          <section
            className="flex flex-col gap-8 rounded-2xl border p-5"
            style={{
              borderColor: 'var(--app-border)',
              background: 'var(--app-surface)',
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SourceThumb
                  source={journey.source}
                  onPickColor={(hex) => setSourceColor(ACTIVE, hex)}
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
              <div className="flex items-center gap-2">
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
              chosenId={journey.chosen?.id}
              savedIds={journey.saved}
              canRefine={hasKey}
              onChoose={(palette) => chooseVariation(ACTIVE, palette)}
              onToggleSave={(palette) => toggleSaved(ACTIVE, palette)}
              onRefine={(instruction) =>
                void refineJourney(ACTIVE, instruction)
              }
              onRegenerate={() => void rerunJourney(ACTIVE)}
            />
          </section>
        )}

        {loaded && palettes.length === 0 ? (
          <div
            className="flex flex-col items-center gap-4 rounded-2xl border p-10 text-center text-sm"
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
          <div className="flex flex-wrap gap-5">
            {palettes.map((p) => (
              <FavoriteCard
                key={p.id}
                palette={p}
                onOpen={() => setOpen(p)}
                onDelete={() => setConfirming(p)}
              />
            ))}
          </div>
        )}
      </main>

      {open && <ExportModal palette={open} onClose={() => setOpen(null)} />}
      {confirming && (
        <DeleteConfirm
          palette={confirming}
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            void remove(confirming.id)
            setConfirming(null)
          }}
        />
      )}
    </>
  )
}
