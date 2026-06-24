import type { ChatModel } from '#/features/prefs/prefs-repo'

/** The two-model picker. Only rendered when a key is present (the parent gates
 *  it). Presentational: parent owns value + persistence. */
const OPTIONS: { value: ChatModel; label: string; note: string }[] = [
  { value: 'haiku', label: 'Haiku', note: 'Fast and cheap' },
  { value: 'sonnet', label: 'Sonnet', note: 'Higher quality' },
]

export function ModelControl({
  value,
  disabled = false,
  onChange,
}: {
  value: ChatModel
  disabled?: boolean
  onChange: (next: ChatModel) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm" style={{ color: 'var(--app-text)' }}>
          Model
        </span>
        <p className="text-xs" style={{ color: 'var(--app-muted)' }}>
          Which model the AI touches call.
        </p>
      </div>
      <div className="mt-1 flex shrink-0 gap-1.5">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            aria-pressed={value === o.value}
            title={o.note}
            onClick={() => onChange(o.value)}
            className="rounded-full border px-3 py-1 text-xs transition disabled:opacity-50"
            style={{
              borderColor: value === o.value ? 'var(--app-text)' : 'var(--app-border)',
              background: value === o.value ? 'var(--app-text)' : 'transparent',
              color: value === o.value ? 'var(--app-bg)' : 'var(--app-text)',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
