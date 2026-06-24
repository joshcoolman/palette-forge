import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'

import type { Palette } from '#/features/palette/types'
import { suggestNames } from '#/features/agent/rename'
import { SwatchRow } from '#/components/swatch-row'

/**
 * Rename a saved palette. Follows the delete/export convention — the palette's
 * own swatch row sits on top so the action is previewed. Two paths, by design:
 *
 *  - **Edit myself** (base feature, always): a text field + Save. No model, no key.
 *  - **Let AI suggest** (additive, key-gated by `aiEnabled`): Haiku proposes a few
 *    two-word names; pick one or regenerate. Hidden entirely without a key — AI is
 *    lightly offered, never forced, and the manual path always stands alone.
 *
 * Loading and error states are visible here (a failed call shows a message, not
 * silence), which is the whole point of choosing a dialog over a one-shot swap.
 */
export function RenameDialog({
  palette,
  aiEnabled,
  onClose,
  onApply,
}: {
  palette: Palette
  /** Whether a key is present — gates the AI suggestion section's existence. */
  aiEnabled: boolean
  onClose: () => void
  onApply: (name: string) => void
}) {
  const [name, setName] = useState(palette.name)
  const [suggestions, setSuggestions] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      setSuggestions(await suggestNames(palette))
    } catch {
      setError('Couldn’t reach Anthropic. Check your API key in Settings.')
    } finally {
      setLoading(false)
    }
  }

  const trimmed = name.trim()
  const canSave = trimmed.length > 0 && trimmed.length <= 40

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-[var(--app-radius)] border p-5"
        style={{
          borderColor: 'var(--app-border)',
          background: 'var(--app-surface)',
        }}
      >
        <SwatchRow colors={palette.colors} />

        <h2
          className="pf-heading text-base font-semibold"
          style={{ color: 'var(--app-text)' }}
        >
          Rename palette
        </h2>

        {/* Edit myself — the base path, always available. */}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSave) onApply(trimmed)
          }}
        >
          <input
            type="text"
            value={name}
            autoFocus
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            aria-label="Palette name"
            className="min-w-0 flex-1 rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none"
            style={{ borderColor: 'var(--app-border)', color: 'var(--app-text)' }}
          />
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-40"
            style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
          >
            Save
          </button>
        </form>

        {/* Let AI suggest — additive, only when a key is present (no nag otherwise). */}
        {aiEnabled && (
          <>
            <div className="flex items-center gap-3">
              <hr className="flex-1" style={{ borderColor: 'var(--app-border)' }} />
              <span className="text-xs" style={{ color: 'var(--app-muted)' }}>
                or let AI suggest
              </span>
              <hr className="flex-1" style={{ borderColor: 'var(--app-border)' }} />
            </div>

            {suggestions === null && !loading && !error ? (
              <button
                type="button"
                onClick={() => void generate()}
                className="flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition hover:opacity-70"
                style={{ borderColor: 'var(--app-border)', color: 'var(--app-text)' }}
              >
                <Sparkles size={14} />
                Suggest names
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                {loading && (
                  <div
                    className="flex items-center gap-2 px-1 py-2 text-sm"
                    style={{ color: 'var(--app-muted)' }}
                  >
                    <Loader2 size={14} className="animate-spin" />
                    Finding names…
                  </div>
                )}

                {error && (
                  <p className="px-1 text-sm" style={{ color: 'var(--app-text)' }}>
                    {error}
                  </p>
                )}

                {!loading && !error && suggestions?.length === 0 && (
                  <p className="px-1 text-sm" style={{ color: 'var(--app-muted)' }}>
                    No usable names came back — try again.
                  </p>
                )}

                {!loading &&
                  suggestions?.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onApply(s)}
                      className="rounded-md border px-3 py-1.5 text-left text-sm transition hover:opacity-70"
                      style={{
                        borderColor: 'var(--app-border)',
                        color: 'var(--app-text)',
                      }}
                    >
                      {s}
                    </button>
                  ))}

                {!loading && (
                  <button
                    type="button"
                    onClick={() => void generate()}
                    className="flex items-center gap-2 self-start px-1 pt-1 text-xs transition hover:opacity-70"
                    style={{ color: 'var(--app-muted)' }}
                  >
                    <RefreshCw size={12} />
                    {error || suggestions?.length === 0 ? 'Try again' : 'Regenerate'}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
