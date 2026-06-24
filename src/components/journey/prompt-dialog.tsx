import { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { promptToSeed } from '#/features/agent/prompt-engine'
import type { Source } from '#/features/palette/types'
import { Modal } from '#/components/ui/modal'

/**
 * The focused "describe your palette" surface — a centered overlay opened from the
 * source popover's "Chat with AI" button. A worded brief is a focused task, so it
 * gets room: a heading and a textarea that grows with the brief (you see the whole
 * thing), not a one-line field crammed into the popover.
 *
 * v1.1 is deliberately one-shot: it produces a round and closes. Reacting to the
 * result and clarifying questions are phase 4 (plan-ai-conversational-refine.md);
 * this surface is the seam that grows into that conversation.
 *
 * The model maps the words to a single seed hex (`promptToSeed`); the deterministic
 * engine builds the round from it like any other color source — the brief rides
 * along in `Source.prompt`. A bad hex falls back to neutral inside `promptToSeed`;
 * only a transport error throws, which we surface here rather than swallow.
 */
export function PromptDialog({
  onStart,
  onClose,
}: {
  onStart: (source: Source) => void
  onClose: () => void
}) {
  const [prompt, setPrompt] = useState('')
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Grow the textarea to fit its content (up to a cap, then it scrolls) so a long
  // brief stays fully visible as it's typed.
  function autoGrow() {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 280)}px`
  }

  async function submit() {
    const text = prompt.trim()
    if (!text || thinking) return
    setThinking(true)
    setError(null)
    try {
      const seed = await promptToSeed(text)
      onStart({ type: 'color', value: seed, extracted: [seed], prompt: text })
      onClose()
    } catch {
      setError('Couldn’t reach Anthropic. Check your API key in Settings.')
    } finally {
      setThinking(false)
    }
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
          The mood, the use, the feeling — a sentence or a paragraph. I’ll pick a
          starting color and build a round from it.
        </p>
      </div>

      <textarea
        ref={taRef}
        value={prompt}
        autoFocus
        rows={4}
        disabled={thinking}
        placeholder="A palette for a Pacific Northwest roofing company — small residential roofs, professional but nature-oriented…"
        aria-label="Describe the palette"
        onChange={(e) => {
          setPrompt(e.target.value)
          if (error) setError(null)
          autoGrow()
        }}
        onKeyDown={(e) => {
          // ⌘/Ctrl-Enter submits; plain Enter still adds a newline (it's a brief).
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            void submit()
          }
        }}
        className="w-full resize-none rounded-md border bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none disabled:opacity-50"
        style={{ borderColor: 'var(--app-border)', color: 'var(--app-text)' }}
      />

      {error && (
        <p className="text-sm" style={{ color: 'var(--app-text)' }}>
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs" style={{ color: 'var(--app-muted)' }}>
          ⌘↵ to submit
        </span>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={thinking || prompt.trim().length === 0}
          className="flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition disabled:opacity-40"
          style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
        >
          {thinking && <Loader2 size={14} className="animate-spin" />}
          {thinking ? 'Thinking…' : 'Submit'}
        </button>
      </div>
    </Modal>
  )
}
