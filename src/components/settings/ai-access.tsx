import { useEffect, useState } from 'react'

import type { ChatModel } from '#/features/prefs/prefs-repo'
import {
  clearApiKey,
  ensureHydrated,
  getSettings,
  saveApiKey,
  saveChatModel,
} from '#/lib/settings'
import { KeyEntry } from '#/components/settings/key-entry'
import { ModelControl } from '#/components/settings/model-control'

/**
 * The optional AI layer's settings: the key field, and — only once a key is
 * present — the model picker. This is the one place that owns key/model state in
 * the UI, so the model picker appears and disappears reactively as the key field
 * fills and empties. The whole section is honest about the tradeoff (see KeyEntry)
 * rather than hiding the browser-direct posture.
 */
export function AiAccess() {
  const [apiKey, setKey] = useState('')
  const [model, setModelState] = useState<ChatModel>('haiku')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    void ensureHydrated().then(() => {
      if (!active) return
      const s = getSettings()
      setKey(s.apiKey)
      setModelState(s.model)
      setReady(true)
    })
    return () => {
      active = false
    }
  }, [])

  function changeKey(next: string) {
    setKey(next)
    void saveApiKey(next)
  }

  function changeModel(next: ChatModel) {
    setModelState(next)
    void saveChatModel(next)
  }

  function removeKey() {
    setKey('')
    void clearApiKey()
  }

  const hasKey = apiKey.trim().length > 0

  return (
    <div className="flex flex-col gap-2">
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
            AI touches
          </h2>
          <p className="text-xs" style={{ color: 'var(--app-muted)' }}>
            Optional enrichments on top of the deterministic engine. Off until you
            add a key.
          </p>
        </div>

        <KeyEntry
          value={apiKey}
          disabled={!ready}
          onChange={changeKey}
          onRemove={removeKey}
        />

        {hasKey && (
          <>
            <hr style={{ borderColor: 'var(--app-border)' }} />
            <ModelControl value={model} disabled={!ready} onChange={changeModel} />
          </>
        )}
      </div>

      {/* Footer beneath the panel: the trust note. BYO-key honesty is checkable
          because the code is open — point at it. */}
      <p className="px-1 text-center text-xs" style={{ color: 'var(--app-muted)' }}>
        All code is open source and reviewable on{' '}
        <a
          href="https://github.com/joshcoolman/palette-forge"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 transition hover:underline"
          style={{ color: 'var(--app-text)' }}
        >
          GitHub
        </a>
        .
      </p>
    </div>
  )
}
