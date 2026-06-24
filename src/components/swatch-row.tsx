import type { ColorRow, Mode, Role } from '#/features/palette/types'

/**
 * The simple take-card swatch style as a standalone, presentational row: the
 * palette's full set of roles as one row of squares (dark mode by default),
 * rounded outer corners + hard interior seams, no border, no heart. Shared by the
 * generated take card and the export / delete popups so they read as the same
 * object. Ordered ground → neutrals → secondary → accent.
 */
export const ROW_ROLES: Role[] = [
  'background',
  'surface',
  'border',
  'muted',
  'text',
  'secondary',
  'accent',
]

export function SwatchRow({
  colors,
  mode = 'dark',
  rounded = true,
}: {
  colors: ColorRow[]
  mode?: Mode
  /** Round + clip own corners. Off when a rounded parent already clips it. */
  rounded?: boolean
}) {
  return (
    <div
      className={`grid w-full ${rounded ? 'overflow-hidden rounded-[var(--app-radius-sm)]' : ''}`}
      style={{ gridTemplateColumns: `repeat(${ROW_ROLES.length}, 1fr)` }}
    >
      {ROW_ROLES.map((role) => {
        const hex = colors.find((c) => c.role === role)?.[mode] ?? '#888888'
        return (
          <span key={role} className="aspect-square" style={{ background: hex }} />
        )
      })}
    </div>
  )
}
