import { useEffect, useState } from 'react'

import {
  ensureHydrated,
  getSettings,
  saveSkipDeleteConfirm,
} from '#/lib/settings'

/** App preferences. Today: whether deleting a saved palette needs the confirm
 *  popup. Default off (popup shows); the popup's "Don't ask me again" checkbox
 *  flips this on, and it can be flipped back here. */
export function Preferences() {
  const [skipDeleteConfirm, setSkip] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    void ensureHydrated().then(() => {
      if (!active) return
      setSkip(getSettings().skipDeleteConfirm)
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

  return (
    <div
      className="flex flex-col gap-5 rounded-2xl border p-6"
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
    </div>
  )
}
