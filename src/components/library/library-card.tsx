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

/** A Coolors-style horizontal band (light, with a thin dark strip beneath to
 *  signal the dual-mode palette), name below, delete on hover. */
export function LibraryCard({
  palette,
  onOpen,
  onDelete,
}: {
  palette: Palette
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <div className="group flex flex-col gap-2">
      <button
        type="button"
        onClick={onOpen}
        className="overflow-hidden rounded-2xl border text-left"
        style={{ borderColor: 'var(--app-border)' }}
      >
        <div className="flex h-28">
          {band(palette, 'light').map((hex, i) => (
            <span
              key={`l-${i}`}
              className="flex-1"
              style={{ background: hex }}
            />
          ))}
        </div>
        <div className="flex h-5">
          {band(palette, 'dark').map((hex, i) => (
            <span
              key={`d-${i}`}
              className="flex-1"
              style={{ background: hex }}
            />
          ))}
        </div>
      </button>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm" style={{ color: 'var(--app-text)' }}>
          {palette.name}
        </span>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${palette.name}`}
          className="shrink-0 text-xs underline opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: 'var(--app-muted)' }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
