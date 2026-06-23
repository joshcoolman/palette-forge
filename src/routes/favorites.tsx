import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'

import type { Palette } from '#/features/palette/types'
import { deletePalette, listPalettes } from '#/features/palette/palette-repo'
import { Backdrop } from '#/components/journey/backdrop'
import { FavoriteCard } from '#/components/favorites/favorite-card'
import { ExportModal } from '#/components/favorites/export-modal'
import { DeleteConfirm } from '#/components/favorites/delete-confirm'

export const Route = createFileRoute('/favorites')({ component: FavoritesPage })

function FavoritesPage() {
  const [palettes, setPalettes] = useState<Palette[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState<Palette | null>(null)
  const [confirming, setConfirming] = useState<Palette | null>(null)

  async function refresh() {
    setPalettes(await listPalettes())
    setLoaded(true)
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function remove(id: string) {
    await deletePalette(id)
    await refresh()
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-16">
      <Backdrop colors={[]} />
      <header className="flex items-center justify-between">
        <div>
          <h1
            className="pf-heading text-2xl font-semibold tracking-tight"
            style={{ color: 'var(--app-text)' }}
          >
            Favorites
          </h1>
          <p className="mt-1 text-xs" style={{ color: 'var(--app-muted)' }}>
            {loaded
              ? `${palettes.length} saved ${palettes.length === 1 ? 'palette' : 'palettes'}`
              : 'Loading…'}
          </p>
        </div>
        <Link
          to="/"
          aria-label="New palette"
          className="flex h-8 w-8 items-center justify-center rounded-full border transition hover:opacity-70"
          style={{ borderColor: '#ffffff', color: '#ffffff' }}
        >
          <Plus size={16} />
        </Link>
      </header>

      {loaded && palettes.length === 0 ? (
        <div
          className="rounded-2xl border p-10 text-center text-sm"
          style={{
            borderColor: 'var(--app-border)',
            color: 'var(--app-muted)',
          }}
        >
          No saved palettes yet. Keep one while generating and it will show up
          here.
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
    </main>
  )
}
