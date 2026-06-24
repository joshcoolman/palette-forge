import { LayoutGrid, Rows3 } from 'lucide-react'

import type { SavedView } from '#/features/prefs/prefs-repo'

/**
 * The saved-grid display switch: compact color strips vs full interactive cards.
 * A two-pill segmented control reused by the page header and the Settings page,
 * styled to match the Settings button-toggles. Icon-only with a title/aria-label
 * so it stays small in the header.
 */
// Cards first (the default, full interactive cards), List to its right (the
// compact color strips). The stored values stay 'expanded'/'compact'.
const OPTIONS: { value: SavedView; label: string; icon: typeof Rows3 }[] = [
  { value: 'expanded', label: 'Cards', icon: LayoutGrid },
  { value: 'compact', label: 'List', icon: Rows3 },
]

export function ViewModeToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: SavedView
  onChange: (value: SavedView) => void
  disabled?: boolean
}) {
  return (
    <div className="flex shrink-0 gap-1.5">
      {OPTIONS.map(({ value: v, label, icon: Icon }) => {
        const active = value === v
        return (
          <button
            key={v}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            aria-label={`${label} view`}
            title={`${label} view`}
            onClick={() => onChange(v)}
            className="flex items-center justify-center rounded-full border px-2.5 py-1 transition hover:opacity-70 disabled:opacity-50"
            style={{
              borderColor: active ? 'var(--app-text)' : 'var(--app-border)',
              background: active ? 'var(--app-text)' : 'transparent',
              color: active ? 'var(--app-bg)' : 'var(--app-text)',
            }}
          >
            <Icon size={14} />
          </button>
        )
      })}
    </div>
  )
}
