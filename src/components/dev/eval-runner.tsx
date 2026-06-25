import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { ROLE_FILES } from '#/features/knowledge/knowledge-loader'
import { setGenerationRoleOverride } from '#/features/agent/prompt-palettes'

type Prompt = { id: string; label: string; brief: string }

/**
 * Dev-only eval bar: pick a brief from `eval/prompts.md` and fire it in one click, or
 * add a new one to the golden set on the fly. Mounted only under `import.meta.env.DEV`
 * (in index.tsx) as a full-width **burnt-orange** banner, so it reads unmistakably as a
 * dev tool, not app chrome. Briefs come from / are saved to the dev-server route
 * `/__eval/prompts` (`vite/eval-capture.ts`) — never bundled into production. Running one
 * goes through the same `onRun` → `handleStart` path as Chat-with-AI and lands in
 * `eval/runs.jsonl`. A trigger + a way to grow the test set, not a new flow.
 */
const BURNT = '#b5491f'
const DEFAULT_ROLE = 'color-theorist.md'
/** Selectable roles: the shipped default first, then the dev-only personas from
 *  `knowledge/roles/`. The picker is DEV-only, so it never reaches production. */
const ROLES = [DEFAULT_ROLE, ...ROLE_FILES]
const roleLabel = (file: string): string => file.replace(/\.md$/, '')

export function EvalRunner({ onRun }: { onRun: (brief: string) => void }) {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selected, setSelected] = useState('')
  const [role, setRole] = useState(DEFAULT_ROLE)
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [brief, setBrief] = useState('')

  function load() {
    void fetch('/__eval/prompts')
      .then((r) => r.json() as Promise<Prompt[]>)
      .then((data) => {
        setPrompts(data)
        setSelected((s) => s || data[0]?.id || '')
      })
      .catch(() => {
        /* dev endpoint absent → empty bar, can still add */
      })
  }
  useEffect(load, [])

  function run() {
    const p = prompts.find((x) => x.id === selected)
    if (!p) return
    setGenerationRoleOverride(role === DEFAULT_ROLE ? null : role)
    onRun(p.brief)
  }

  async function saveAndRun() {
    const l = label.trim()
    const b = brief.trim()
    if (!l || !b) return
    try {
      await fetch('/__eval/prompts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: l, brief: b }),
      })
    } catch {
      /* best-effort save */
    }
    setGenerationRoleOverride(role === DEFAULT_ROLE ? null : role)
    onRun(b) // run it now …
    setLabel('')
    setBrief('')
    setAdding(false)
    load() // … and refresh the dropdown so the new one's there next time
  }

  const field =
    'rounded bg-black/25 px-2 py-1 text-white outline-none placeholder:text-white/50'
  const solid = 'rounded bg-white/90 px-2.5 py-1 font-medium text-black hover:bg-white'

  return (
    <div
      className="w-full rounded-[var(--app-radius)] text-xs"
      style={{ background: BURNT, color: '#fff' }}
    >
      <div className="flex flex-wrap items-center gap-2 px-4 py-2">
        <span className="font-mono font-semibold uppercase tracking-wide">
          eval · dev
        </span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Role"
          className={`min-w-[150px] ${field}`}
        >
          {ROLES.map((r) => (
            <option key={r} value={r} className="text-black">
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="Eval prompt"
          className={`min-w-[320px] ${field}`}
        >
          {prompts.map((p) => (
            <option key={p.id} value={p.id} className="text-black">
              {p.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={run} className={solid}>
          Run
        </button>
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          aria-label="Add a prompt"
          aria-pressed={adding}
          className="flex items-center gap-1 rounded border border-white/40 px-2 py-1 hover:bg-white/10"
        >
          <Plus size={12} /> New
        </button>
      </div>

      {adding && (
        <form
          className="flex flex-wrap items-center gap-2 px-4 pb-2"
          onSubmit={(e) => {
            e.preventDefault()
            void saveAndRun()
          }}
        >
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="label — e.g. battery-question — off-topic"
            aria-label="New prompt label"
            className={`min-w-[240px] ${field}`}
          />
          <input
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="the brief / what the user types"
            aria-label="New prompt brief"
            className={`min-w-[360px] flex-1 ${field}`}
          />
          <button type="submit" className={solid}>
            Save &amp; Run
          </button>
        </form>
      )}
    </div>
  )
}
