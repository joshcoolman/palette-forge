import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { ensureHydrated, getSettings, saveModel } from '#/lib/settings'
import { pairingById } from '#/features/typography/pairings'
import { fontStackByName } from '#/features/typography/font-loader'
import { usePairingId } from '#/lib/type-store'

const MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { id: 'claude-opus-4-8', label: 'Opus 4.8' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5' },
]

/** Nav control, styled to match the font-pairing dropdown beside it (same pill,
 *  same pairing font): a compact model switcher (applies on the next run) that
 *  only appears when a key is set. No key → nothing; set one in Settings to
 *  reveal it. */
export function ModelControl() {
  const [hasKey, setHasKey] = useState(false)
  const [model, setModel] = useState('claude-sonnet-4-6')
  const pairing = pairingById(usePairingId())
  const fontFamily = pairing.heading
    ? fontStackByName(pairing.heading)
    : undefined

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

  if (!hasKey) return null

  return (
    <div className="relative">
      <select
        aria-label="Model"
        value={model}
        onChange={(e) => {
          setModel(e.target.value)
          void saveModel(e.target.value)
        }}
        className="appearance-none rounded-lg border py-1.5 pl-3 pr-8 text-xs outline-none"
        style={{
          borderColor: 'var(--app-border)',
          background: 'transparent',
          color: 'var(--app-text)',
          fontFamily,
        }}
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--app-muted)' }}
      />
    </div>
  )
}
