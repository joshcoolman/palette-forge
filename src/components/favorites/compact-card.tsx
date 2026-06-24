import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Code, Moon, Pencil, Sun, Trash2 } from 'lucide-react'

import type { Mode, Palette } from '#/features/palette/types'
import { IconButton } from '#/components/ui/icon-button'
import { SwatchRow } from '#/components/swatch-row'

/**
 * The compact saved-palette card: just the colors. A single swatch strip (the
 * same row shown atop the export/delete popups) with no name label, no flip, no
 * text specimen.
 *
 * Two click behaviours, picked by `openCodeOnClick`:
 * - Mobile (default): tapping the strip reveals inline controls beneath it
 *   (trash · code · light/dark), animating the rows below down. Single-open is
 *   owned by the parent so only one card's controls show at a time.
 * - Desktop (`openCodeOnClick`): a designer is scanning to find-and-share, so a
 *   click jumps straight to the code popup — no inline controls at all.
 *
 * Per-card `mode` mirrors FavoriteCard so each card flips light/dark independently
 * (only reachable via the inline controls, i.e. mobile).
 */
export function CompactCard({
  palette,
  onOpen,
  onDelete,
  onRename,
  defaultMode = 'dark',
  expanded,
  onToggleControls,
  openCodeOnClick = false,
}: {
  palette: Palette
  onOpen: () => void
  onDelete: () => void
  /** Open the rename dialog. Sits in the inline controls row (mobile); desktop
   *  find-and-share has no controls. A base feature, so always provided. */
  onRename: () => void
  defaultMode?: Mode
  expanded: boolean
  onToggleControls: () => void
  openCodeOnClick?: boolean
}) {
  const [mode, setMode] = useState<Mode>(defaultMode)

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={openCodeOnClick ? onOpen : onToggleControls}
        aria-expanded={openCodeOnClick ? undefined : expanded}
        aria-label={
          openCodeOnClick
            ? `View ${palette.name} code`
            : `${expanded ? 'Hide' : 'Show'} controls for ${palette.name}`
        }
        className="block w-full"
      >
        <SwatchRow colors={palette.colors} mode={mode} />
      </button>

      {!openCodeOnClick && (
        <AnimatePresence initial={false}>
          {expanded && (
          <motion.div
            key="controls"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <IconButton label={`Delete ${palette.name}`} onClick={onDelete}>
                <Trash2 size={14} />
              </IconButton>
              <div className="flex items-center gap-2">
                <IconButton
                  label={`Rename ${palette.name}`}
                  title="Rename this palette"
                  onClick={onRename}
                >
                  <Pencil size={14} />
                </IconButton>
                <IconButton label={`View ${palette.name} code`} onClick={onOpen}>
                  <Code size={14} />
                </IconButton>
                <IconButton
                  label={`Show ${mode === 'light' ? 'dark' : 'light'} palette`}
                  pressed={mode === 'dark'}
                  onClick={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))}
                >
                  {mode === 'light' ? <Sun size={14} /> : <Moon size={14} />}
                </IconButton>
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
