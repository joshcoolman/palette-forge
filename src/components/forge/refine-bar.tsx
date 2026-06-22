import { useState } from 'react'

const CHIPS = [
  'warmer',
  'cooler',
  'more vibrant',
  'more muted',
  'rework the neutrals',
  'deeper',
]

/** Natural-language steer — quick chips plus a free-text "more like this, but…". */
export function RefineBar({
  onRefine,
  busy,
}: {
  onRefine: (instruction: string) => void
  busy: boolean
}) {
  const [text, setText] = useState('')

  function submit(instruction: string) {
    const value = instruction.trim()
    if (!value || busy) return
    onRefine(value)
    setText('')
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border p-4"
      style={{
        borderColor: 'var(--app-border)',
        background: 'var(--app-surface)',
      }}
    >
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={busy}
            onClick={() => submit(chip)}
            className="rounded-full border px-3 py-1 text-xs disabled:opacity-40"
            style={{
              borderColor: 'var(--app-border)',
              color: 'var(--app-text)',
            }}
          >
            {chip}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(text)
        }}
        className="flex gap-2"
      >
        <input
          value={text}
          disabled={busy}
          onChange={(e) => setText(e.target.value)}
          placeholder="More like this, but…"
          className="flex-1 rounded-md border px-3 py-2 text-sm outline-none disabled:opacity-50"
          style={{
            borderColor: 'var(--app-border)',
            background: 'var(--app-bg)',
            color: 'var(--app-text)',
          }}
        />
        <button
          type="submit"
          disabled={busy || text.trim().length === 0}
          className="rounded-md px-4 py-2 text-sm font-medium disabled:opacity-40"
          style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
        >
          {busy ? 'Refining…' : 'Refine'}
        </button>
      </form>
    </div>
  )
}
