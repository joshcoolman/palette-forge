import { getSettings } from '#/lib/settings'

/**
 * Dev-only: ship a palette-generation run to the local eval log (`eval/runs.jsonl`)
 * via the dev-server middleware (`vite/eval-capture.ts`). No-op outside dev — the
 * endpoint doesn't exist in production, and this is gated on `import.meta.env.DEV`
 * regardless. Fire-and-forget: capturing a run must never affect generation.
 */
export function captureRun(brief: string, raw: string, role?: string): void {
  if (!import.meta.env.DEV) return
  void fetch('/__eval/run', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ brief, model: getSettings().model, role, raw }),
  }).catch(() => {
    // best-effort — a missing/wedged dev endpoint shouldn't surface to the user
  })
}
