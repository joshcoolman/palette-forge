import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'

import { PAIRINGS, pairingById } from '#/features/typography/pairings'
import {
  fontStackByName,
  loadFontByName,
} from '#/features/typography/font-loader'
import { ensureTypeHydrated, setPairing, usePairingId } from '#/lib/type-store'
import { ModelControl } from '#/components/settings/model-control'

/** Preload every preset's families so the dropdown can render each option in its
 *  own type. First open may briefly fall back then swap — acceptable per spec. */
function preloadPairingFonts(): void {
  for (const p of PAIRINGS) {
    if (p.heading) loadFontByName(p.heading, [400, 600, 700])
    if (p.body) loadFontByName(p.body, [400, 500])
  }
}

/**
 * The one persistent chrome element: home / Favorites / Settings plus the global,
 * fixed font-pairing dropdown. The pairing is site-wide and preview-only — it
 * never touches the palette records or exports. Each menu row previews in its own
 * fonts. Lives in __root above every route's own page header.
 */
export function GlobalNav() {
  const pairingId = usePairingId()
  const current = pairingById(pairingId)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Apply the persisted pairing on first client paint, and warm the previews.
  useEffect(() => {
    ensureTypeHydrated()
    preloadPairingFonts()
  }, [])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <nav
      className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b px-6 py-2.5 backdrop-blur"
      style={{
        borderColor: 'var(--app-border)',
        background: 'color-mix(in srgb, var(--app-bg) 80%, transparent)',
      }}
    >
      <div className="flex items-center gap-5 text-sm">
        <Link
          to="/"
          className="pf-heading font-semibold tracking-tight"
          style={{ color: 'var(--app-text)' }}
        >
          Palette Forge
        </Link>
        <Link to="/favorites" style={{ color: 'var(--app-muted)' }}>
          Favorites
        </Link>
        <Link to="/settings" style={{ color: 'var(--app-muted)' }}>
          Settings
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs"
          style={{ borderColor: 'var(--app-border)', color: 'var(--app-text)' }}
        >
          <span
            style={{
              fontFamily: current.heading
                ? fontStackByName(current.heading)
                : undefined,
            }}
          >
            {current.label}
          </span>
          <ChevronDown size={13} style={{ color: 'var(--app-muted)' }} />
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute right-0 z-50 mt-1.5 w-60 overflow-hidden rounded-xl border p-1 shadow-2xl"
            style={{
              borderColor: 'var(--app-border)',
              background: 'var(--app-surface)',
            }}
          >
            {PAIRINGS.map((p) => {
              const active = p.id === pairingId
              return (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setPairing(p.id)
                    setOpen(false)
                  }}
                  className="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition hover:bg-white/5"
                  style={{ background: active ? 'rgba(255,255,255,0.06)' : undefined }}
                >
                  <span
                    className="text-[15px] leading-tight"
                    style={{
                      color: 'var(--app-text)',
                      fontFamily: p.heading
                        ? fontStackByName(p.heading)
                        : undefined,
                    }}
                  >
                    {p.heading ?? 'System'}
                  </span>
                  <span
                    className="text-xs leading-snug"
                    style={{
                      color: 'var(--app-muted)',
                      fontFamily: p.body ? fontStackByName(p.body) : undefined,
                    }}
                  >
                    {p.body ? `with ${p.body}` : 'Default UI font'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
        </div>
        <ModelControl />
      </div>
    </nav>
  )
}
