import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { ensureHydrated, getSettings, saveModel } from '#/lib/settings'

const MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { id: 'claude-opus-4-8', label: 'Opus 4.8' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5' },
]

/** Header control: with a key, a compact model switcher (changes apply on the
 *  next run); without one, the "add key" link to settings. */
export function ModelControl() {
  const [hasKey, setHasKey] = useState(false)
  const [model, setModel] = useState('claude-sonnet-4-6')

  useEffect(() => {
    let active = true
    void ensureHydrated().then(() => {
      if (!active) return
      const settings = getSettings()
      setHasKey(Boolean(settings.apiKey))
      setModel(settings.model)
    })
    return () => {
      active = false
    }
  }, [])

  if (!hasKey) {
    return (
      <Link
        to="/settings"
        className="text-xs underline"
        style={{ color: 'var(--app-muted)' }}
      >
        Demo engine · add key
      </Link>
    )
  }

  return (
    <div
      className="flex items-center gap-2 text-xs"
      style={{ color: 'var(--app-muted)' }}
    >
      <span>Claude</span>
      <select
        aria-label="Model"
        value={model}
        onChange={(e) => {
          setModel(e.target.value)
          void saveModel(e.target.value)
        }}
        className="rounded-md border px-2 py-1 text-xs outline-none"
        style={{
          borderColor: 'var(--app-border)',
          background: 'var(--app-surface)',
          color: 'var(--app-text)',
        }}
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      <Link
        to="/settings"
        className="underline"
        style={{ color: 'var(--app-muted)' }}
      >
        Settings
      </Link>
    </div>
  )
}
