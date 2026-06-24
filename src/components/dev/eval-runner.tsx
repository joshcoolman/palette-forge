import { useEffect, useState } from 'react'

import { hasKey } from '#/features/agent/client'

type Prompt = { id: string; label: string; brief: string }

/**
 * Dev-only eval runner: pick a brief from `eval/prompts.md` and fire it in one click,
 * instead of re-pasting through the popover every tuning loop. Mounted only under
 * `import.meta.env.DEV` (in index.tsx), so it — and the prompts — are absent from the
 * production build. Briefs come from the dev-server route `GET /__eval/prompts`
 * (`vite/eval-capture.ts`); running one goes through the same `onRun` → `handleStart`
 * path as Chat-with-AI and lands in `eval/runs.jsonl`. A trigger, not a new flow.
 */
export function EvalRunner({ onRun }: { onRun: (brief: string) => void }) {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selected, setSelected] = useState('')

  useEffect(() => {
    void fetch('/__eval/prompts')
      .then((r) => r.json() as Promise<Prompt[]>)
      .then((data) => {
        setPrompts(data)
        if (data[0]) setSelected(data[0].id)
      })
      .catch(() => {
        /* dev endpoint absent → stay hidden */
      })
  }, [])

  if (prompts.length === 0) return null

  function run() {
    const p = prompts.find((x) => x.id === selected)
    if (p) onRun(p.brief)
  }

  return (
    <div
      className="flex items-center gap-2 rounded-md border border-dashed px-2 py-1 text-xs"
      style={{ borderColor: 'var(--app-border)', color: 'var(--app-muted)' }}
      title="Dev only — run a brief from eval/prompts.md"
    >
      <span className="font-mono uppercase tracking-wide">eval</span>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        aria-label="Eval prompt"
        className="max-w-[180px] truncate bg-transparent outline-none"
        style={{ color: 'var(--app-text)' }}
      >
        {prompts.map((p) => (
          <option key={p.id} value={p.id} style={{ color: '#000' }}>
            {p.label}
          </option>
        ))}
      </select>
      {!hasKey() && <span className="opacity-70">needs key</span>}
      <button
        type="button"
        onClick={run}
        className="rounded px-2 py-0.5 font-medium transition hover:opacity-80"
        style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
      >
        Run
      </button>
    </div>
  )
}
