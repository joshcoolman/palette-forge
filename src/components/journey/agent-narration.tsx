import type { ReactNode } from 'react'
import { motion } from 'motion/react'

/** The agent's voice — one short line per scene. While `pending`, the dot pulses
 *  and the line carries the live stage of the loop. */
export function AgentNarration({
  children,
  pending = false,
}: {
  children: ReactNode
  pending?: boolean
}) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-start gap-2 text-sm"
      style={{ color: 'var(--app-muted)' }}
    >
      <motion.span
        aria-hidden
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ background: 'var(--app-text)' }}
        animate={pending ? { opacity: [0.25, 1, 0.25], scale: [0.85, 1, 0.85] } : { opacity: 1, scale: 1 }}
        transition={pending ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
      />
      <span>{children}</span>
    </motion.p>
  )
}
