import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * The Anthropic API key field — a masked password input with a show/hide toggle
 * and an honest note about where the key lives. Presentational: the parent owns
 * the value and persistence. Empty value = no key = the AI layer stays absent.
 */
export function KeyEntry({
  value,
  disabled = false,
  onChange,
  onRemove,
}: {
  value: string
  disabled?: boolean
  onChange: (next: string) => void
  /** Delete the stored key entirely (record removed, not blanked). When a key is
   *  present, a two-step "Remove key" control confirms before calling this. */
  onRemove: () => void
}) {
  const [revealed, setRevealed] = useState(false)
  const hasKey = value.trim().length > 0

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm" style={{ color: 'var(--app-text)' }}>
        Anthropic API key
      </span>

      <div className="relative">
        <input
          type={revealed ? 'text' : 'password'}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="sk-ant-…"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-[var(--app-radius)] border bg-transparent px-3 py-2 pr-10 text-sm tabular-nums outline-none transition focus:opacity-100 disabled:opacity-50"
          style={{
            borderColor: 'var(--app-border)',
            color: 'var(--app-text)',
          }}
        />
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          aria-label={revealed ? 'Hide key' : 'Show key'}
          disabled={disabled || value.length === 0}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center transition hover:opacity-70 disabled:opacity-30"
          style={{ color: 'var(--app-muted)' }}
        >
          {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      <p className="text-xs" style={{ color: 'var(--app-muted)' }}>
        Your key is stored in this browser only and sent only to Anthropic.
      </p>

      {hasKey && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            className="rounded-full border px-4 py-1.5 text-xs font-medium transition hover:opacity-70 disabled:opacity-50"
            style={{ borderColor: '#e5484d', color: '#e5484d' }}
          >
            Remove key
          </button>
        </div>
      )}
    </div>
  )
}
