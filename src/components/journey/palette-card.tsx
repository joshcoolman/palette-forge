import { motion } from 'motion/react'
import { Heart } from 'lucide-react'

import type { Mode, Role, ScoredPalette } from '#/features/palette/types'
import { ROW_ROLES, SwatchRow } from '#/components/swatch-row'

function roleHex(palette: ScoredPalette, role: Role, mode: Mode): string {
  return palette.colors.find((c) => c.role === role)?.[mode] ?? '#888888'
}

/**
 * A take in the surprise grid, stripped to its colors: one row of dark-mode
 * swatches. The whole card is a single toggle — click anywhere to heart it (and
 * re-theme the page to this palette) or un-heart it. The heart sits centered in
 * the accent swatch (the last cell), drawn in the palette's own *secondary* color
 * (its neighbor, the second-to-last cell) so it reads as a contrasting mark — it
 * fills when saved, with a small bounce. When saved, the card's border picks up
 * the palette's own *muted* color as a soft self-colored highlight.
 */
export function PaletteCard({
  palette,
  saved = false,
  onToggleSave,
}: {
  palette: ScoredPalette
  saved?: boolean
  onToggleSave: () => void
}) {
  const heartInk = roleHex(palette, 'secondary', 'dark')
  return (
    <motion.button
      layout
      type="button"
      onClick={onToggleSave}
      aria-label={
        saved
          ? `Remove ${palette.name} from favorites`
          : `Save ${palette.name} to favorites`
      }
      aria-pressed={saved}
      className="relative block w-full overflow-hidden rounded-[var(--app-radius)] border"
      style={{
        borderColor: saved
          ? roleHex(palette, 'muted', 'dark')
          : 'var(--app-border)',
      }}
    >
      <SwatchRow colors={palette.colors} rounded={false} />

      <motion.span
        className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center justify-center"
        style={{ width: `${100 / ROW_ROLES.length}%`, color: heartInk }}
        animate={{ scale: saved ? [1, 1.4, 1] : 1 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <Heart size={16} strokeWidth={2.25} fill={saved ? 'currentColor' : 'none'} />
      </motion.span>
    </motion.button>
  )
}
