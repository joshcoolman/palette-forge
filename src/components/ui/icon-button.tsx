import type { ReactNode } from 'react'

/**
 * The shared circular action button — one consistent shape and size set across
 * the app (light/dark, code, delete, close, copy). Colors are parameterized:
 * `foreground` drives both the icon and the border; `background` fills it. The
 * border can be dropped entirely (`border={false}`) for a bare icon that keeps
 * the same hit area — used for the on-card light/dark toggle.
 */
export function IconButton({
  label,
  onClick,
  children,
  size = 28,
  pressed,
  className,
  foreground = 'var(--app-muted)',
  background = 'transparent',
  border = true,
  title,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  size?: number
  pressed?: boolean
  className?: string
  foreground?: string
  background?: string
  border?: boolean
  /** Visible hover tooltip. Defaults to `label` so the accessible name and the
   *  tooltip stay in sync unless a caller needs them to differ. */
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={title ?? label}
      aria-pressed={pressed}
      className={`flex shrink-0 items-center justify-center rounded-full transition hover:opacity-70 ${border ? 'border' : ''} ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        color: foreground,
        background,
        borderColor: border ? foreground : undefined,
      }}
    >
      {children}
    </button>
  )
}
