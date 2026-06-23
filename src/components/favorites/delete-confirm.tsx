import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

import type { Mode, Palette, Role } from '#/features/palette/types'

const BAND_ORDER: Role[] = [
  'background',
  'surface',
  'muted',
  'border',
  'accent',
  'text',
]

function band(palette: Palette, mode: Mode): string[] {
  return BAND_ORDER.map(
    (role) => palette.colors.find((c) => c.role === role)?.[mode] ?? '#888888',
  )
}

/** Delete confirmation — mirrors the export popup (swatch band + a short
 *  message), so removing a saved palette is a deliberate, previewed action. */
export function DeleteConfirm({
  palette,
  onCancel,
  onConfirm,
}: {
  palette: Palette
  onCancel: () => void
  /** `dontAskAgain` is the checkbox state — the parent persists the preference. */
  onConfirm: (dontAskAgain: boolean) => void
}) {
  const [dontAsk, setDontAsk] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onCancel}
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
        <div
          className="overflow-hidden rounded-[var(--app-radius-sm)] border"
          style={{ borderColor: 'var(--app-border)' }}
        >
          <div className="flex h-16">
            {band(palette, 'light').map((hex, i) => (
              <span key={`l-${i}`} className="flex-1" style={{ background: hex }} />
            ))}
          </div>
          <div className="flex h-4">
            {band(palette, 'dark').map((hex, i) => (
              <span key={`d-${i}`} className="flex-1" style={{ background: hex }} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h2
            className="pf-heading text-base font-semibold"
            style={{ color: 'var(--app-text)' }}
          >
            Delete “{palette.name}”?
          </h2>
          <p className="text-sm" style={{ color: 'var(--app-muted)' }}>
            This removes the palette from your favorites. This can’t be undone.
          </p>
        </div>

        <label
          className="flex cursor-pointer items-center gap-2 text-sm"
          style={{ color: 'var(--app-muted)' }}
        >
          <input
            type="checkbox"
            checked={dontAsk}
            onChange={(e) => setDontAsk(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-current"
          />
          Don’t ask me again
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-3 py-1.5 text-sm"
            style={{ borderColor: 'var(--app-border)', color: 'var(--app-text)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(dontAsk)}
            className="rounded-md px-3 py-1.5 text-sm font-medium"
            style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  )
}
