import { useRef, useState } from 'react'

import type { Source } from '#/features/palette/types'
import { Modal } from '#/components/ui/modal'

/**
 * The focused "describe your palette" surface — a centered overlay opened from the
 * source popover's "Chat with AI" button. A worded brief is a focused task, so it
 * gets room: a heading and a textarea that grows with the brief (you see the whole
 * thing), not a one-line field crammed into the popover.
 *
 * Submitting starts a `prompt` journey and closes; the model authors the palettes
 * inside the engine (routed by `get-engine.ts`), so the working area shows the round
 * — skeletons while the color theorist thinks, then the takes or a visible error.
 * The dialog itself does no model call. Reacting to the result and clarifying
 * questions are phase 4 (plan-ai-conversational-refine.md); this is the seam that
 * grows into that conversation.
 */
export function PromptDialog({
  onStart,
  onClose,
}: {
  onStart: (source: Source) => void
  onClose: () => void
}) {
  const [prompt, setPrompt] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Grow the textarea to fit its content (up to a cap, then it scrolls) so a long
  // brief stays fully visible as it's typed.
  function autoGrow() {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 280)}px`
  }

  function submit() {
    const text = prompt.trim()
    if (!text) return
    onStart({ type: 'prompt', value: text, extracted: [] })
    onClose()
  }

  return (
    <Modal onClose={onClose} className="max-w-lg">
      <div className="flex flex-col gap-1.5">
        <h2
          className="pf-heading text-base font-semibold"
          style={{ color: 'var(--app-text)' }}
        >
          Describe your palette
        </h2>
        <p className="text-sm" style={{ color: 'var(--app-muted)' }}>
          The mood, the use, the feeling — a sentence or a paragraph. The color
          theorist will design a set from it.
        </p>
      </div>

      <textarea
        ref={taRef}
        value={prompt}
        autoFocus
        rows={4}
        placeholder="A palette for a Pacific Northwest roofing company — small residential roofs, professional but nature-oriented…"
        aria-label="Describe the palette"
        onChange={(e) => {
          setPrompt(e.target.value)
          autoGrow()
        }}
        onKeyDown={(e) => {
          // ⌘/Ctrl-Enter submits; plain Enter still adds a newline (it's a brief).
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            submit()
          }
        }}
        className="w-full resize-none rounded-md border bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none"
        style={{ borderColor: 'var(--app-border)', color: 'var(--app-text)' }}
      />

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs" style={{ color: 'var(--app-muted)' }}>
          ⌘↵ to submit
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={prompt.trim().length === 0}
          className="rounded-md px-4 py-1.5 text-sm font-medium transition disabled:opacity-40"
          style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
        >
          Submit
        </button>
      </div>
    </Modal>
  )
}
