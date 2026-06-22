import type { ContrastCheck, Mode, PassLevel } from '#/features/palette/types'

const TONE: Record<PassLevel, string> = {
  AAA: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  AA: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  fail: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
}

function shortPairing(pairing: string): string {
  return pairing.replace('-on-', ' · ')
}

/** Honest WCAG badges per pairing. `fail` is deliberately loud. */
export function ContrastBadges({ checks, mode }: { checks: ContrastCheck[]; mode?: Mode }) {
  const shown = mode ? checks.filter((c) => c.mode === mode) : checks
  return (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map((check, i) => (
        <li
          key={`${check.pairing}-${check.mode}-${i}`}
          className={`rounded-md border px-1.5 py-0.5 text-[10px] tabular-nums ${TONE[check.passes]}`}
          title={`${shortPairing(check.pairing)} (${check.mode}) — ${check.ratio}:1 · ${check.passes}`}
        >
          {shortPairing(check.pairing)} {check.ratio}
        </li>
      ))}
    </ul>
  )
}
