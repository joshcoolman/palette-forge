import { useEffect, useState } from 'react'

import {
  ensureHydrated,
  getSettings,
  saveDefaultPaletteMode,
  saveSavedView,
  saveSkipDeleteConfirm,
} from '#/lib/settings'
import type { SavedView } from '#/features/prefs/prefs-repo'
import { ViewModeToggle } from '#/components/favorites/view-mode-toggle'

/** App preferences: whether deleting a saved palette needs the confirm popup,
 *  which mode (light/dark) saved-palette cards open in, and whether the saved
 *  grid renders compact strips or full interactive cards. */
export function Preferences() {
  const [skipDeleteConfirm, setSkip] = useState(false)
  const [defaultPaletteMode, setMode] = useState<'light' | 'dark'>('dark')
  const [savedView, setView] = useState<SavedView>('expanded')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    void ensureHydrated().then(() => {
      if (!active) return
      const s = getSettings()
      setSkip(s.skipDeleteConfirm)
      setMode(s.defaultPaletteMode)
      setView(s.savedView)
      setReady(true)
    })
    return () => {
      active = false
    }
  }, [])

  function toggle(next: boolean) {
    setSkip(next)
    void saveSkipDeleteConfirm(next)
  }

  function changeMode(next: 'light' | 'dark') {
    setMode(next)
    void saveDefaultPaletteMode(next)
  }

  function changeView(next: SavedView) {
    setView(next)
    void saveSavedView(next)
  }

  return (
    <div
      className="flex flex-col gap-5 rounded-[var(--app-radius)] border p-6"
      style={{
        borderColor: 'var(--app-border)',
        background: 'var(--app-surface)',
      }}
    >
      <div className="flex flex-col gap-1">
        <h2
          className="text-base font-semibold"
          style={{ color: 'var(--app-text)' }}
        >
          Preferences
        </h2>
      </div>

      <label className="flex cursor-pointer items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm" style={{ color: 'var(--app-text)' }}>
            Don’t show popup when deleting palettes
          </span>
          <p className="text-xs" style={{ color: 'var(--app-muted)' }}>
            Skip the “Are you sure?” confirm and delete immediately.
          </p>
        </div>
        <input
          type="checkbox"
          checked={skipDeleteConfirm}
          disabled={!ready}
          onChange={(e) => toggle(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-current"
          style={{ color: 'var(--app-text)' }}
        />
      </label>

      <hr style={{ borderColor: 'var(--app-border)' }} />

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm" style={{ color: 'var(--app-text)' }}>
            Default palette display mode
          </span>
          <p className="text-xs" style={{ color: 'var(--app-muted)' }}>
            New saved-palette cards open in light or dark mode by default.
          </p>
        </div>
        <div className="mt-1 flex shrink-0 gap-1.5">
          {(['light', 'dark'] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={!ready}
              aria-pressed={defaultPaletteMode === m}
              onClick={() => changeMode(m)}
              className="rounded-full border px-3 py-1 text-xs capitalize transition disabled:opacity-50"
              style={{
                borderColor:
                  defaultPaletteMode === m
                    ? 'var(--app-text)'
                    : 'var(--app-border)',
                background:
                  defaultPaletteMode === m ? 'var(--app-text)' : 'transparent',
                color:
                  defaultPaletteMode === m
                    ? 'var(--app-bg)'
                    : 'var(--app-text)',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <hr style={{ borderColor: 'var(--app-border)' }} />

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm" style={{ color: 'var(--app-text)' }}>
            Palette display style
          </span>
          <p className="text-xs" style={{ color: 'var(--app-muted)' }}>
            Show saved palettes as cards or a compact list.
          </p>
        </div>
        <div className="mt-1">
          <ViewModeToggle
            value={savedView}
            onChange={changeView}
            disabled={!ready}
          />
        </div>
      </div>
    </div>
  )
}
