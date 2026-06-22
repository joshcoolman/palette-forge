import type { ReactNode } from 'react'
import { motion } from 'motion/react'

/** The agent's voice — one short line per scene, animated in. */
export function AgentNarration({ children }: { children: ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-start gap-2 text-sm"
      style={{ color: 'var(--app-muted)' }}
    >
      <span
        aria-hidden
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ background: 'var(--app-text)' }}
      />
      <span>{children}</span>
    </motion.p>
  )
}
