import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'

/**
 * The centered-overlay shell: a dimmed backdrop, a click-outside / Escape close,
 * and the surface card with the app's border + radius. Extracted so a dialog is
 * just its *content* — the shell was being copy-pasted across the favorites
 * dialogs (delete/export/rename) and the color picker, which let them drift
 * (one even lost its click-outside). New overlays build on this; the existing
 * four fold in as a follow-up.
 *
 * `className` overrides only the card's width (default `max-w-sm`); pass e.g.
 * `max-w-lg` for a roomier surface.
 */
export function Modal({
  onClose,
  className = 'max-w-sm',
  children,
}: {
  onClose: () => void
  className?: string
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full ${className} flex-col gap-4 rounded-[var(--app-radius)] border p-5`}
        style={{
          borderColor: 'var(--app-border)',
          background: 'var(--app-surface)',
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
