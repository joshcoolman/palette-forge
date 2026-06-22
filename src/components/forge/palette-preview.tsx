import type { CSSProperties } from 'react'

import type { ColorRow, Mode } from '#/features/palette/types'

function paletteVars(colors: ColorRow[], mode: Mode): CSSProperties {
  const get = (role: string): string =>
    colors.find((c) => c.role === role)?.[mode] ?? '#888888'
  return {
    '--pf-bg': get('background'),
    '--pf-surface': get('surface'),
    '--pf-text': get('text'),
    '--pf-muted': get('muted'),
    '--pf-accent': get('accent'),
    '--pf-border': get('border'),
  } as CSSProperties
}

/** A realistic mini UI mock rendered in the palette's own colors for one mode. */
export function PalettePreview({
  colors,
  mode,
  compact = false,
}: {
  colors: ColorRow[]
  mode: Mode
  compact?: boolean
}) {
  return (
    <div
      style={paletteVars(colors, mode)}
      className="overflow-hidden rounded-xl"
    >
      <div
        style={{ background: 'var(--pf-bg)', color: 'var(--pf-text)' }}
        className="p-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Palette</span>
          <span
            style={{ background: 'var(--pf-accent)' }}
            className="h-2.5 w-2.5 rounded-full"
          />
        </div>
        <div
          style={{
            background: 'var(--pf-surface)',
            borderColor: 'var(--pf-border)',
          }}
          className="mt-3 rounded-lg border p-3"
        >
          <p className="text-sm" style={{ color: 'var(--pf-text)' }}>
            The quick brown fox.
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--pf-muted)' }}>
            Muted secondary copy
          </p>
          {!compact && (
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                style={{
                  background: 'var(--pf-accent)',
                  color: 'var(--pf-bg)',
                }}
                className="rounded-md px-3 py-1.5 text-xs font-medium"
              >
                Action
              </button>
              <span
                style={{ color: 'var(--pf-accent)' }}
                className="text-xs font-medium"
              >
                Link
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
