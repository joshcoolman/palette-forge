import type { AppMeta, AppStatus } from '#/app-meta'

const STATUS_STYLES: Record<AppStatus, string> = {
  scaffolding: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  planned: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
  building: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  live: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
}

/**
 * Placeholder landing for a repo that is scaffolded but not yet built.
 * Honest about status, tasteful by intent — these repos are built in public.
 * Entirely props-driven so every sibling repo reuses it unchanged.
 */
export function StatusLanding({ meta }: { meta: AppMeta }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 text-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(120,119,198,0.18),transparent)]"
      />

      <div className="relative flex w-full max-w-xl flex-col items-start gap-6">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase ${STATUS_STYLES[meta.status]}`}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {meta.status}
        </span>

        <h1 className="font-mono text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {meta.name}
        </h1>

        <p className="text-lg leading-relaxed text-zinc-400">{meta.tagline}</p>

        <p className="text-sm text-zinc-500">{meta.statusNote}</p>

        <hr className="w-full border-zinc-800" />

        <div className="flex flex-col gap-3 text-sm">
          <p className="text-zinc-400">
            A focused, agent-first utility. The agent is the product; its
            expertise lives in a legible{' '}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-300">
              /knowledge
            </code>{' '}
            folder you can read and rewrite. BYO-key, single user.
          </p>

          <div className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-xs text-zinc-600">
            <span>agent-first</span>
            <span aria-hidden>·</span>
            <span>legible /knowledge</span>
            <span aria-hidden>·</span>
            <span>free verifier</span>
            <span aria-hidden>·</span>
            <span>BYO-key</span>
          </div>

          <a
            href={meta.repo}
            className="font-mono text-xs text-zinc-500 underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-zinc-300"
          >
            built in public →
          </a>
        </div>
      </div>
    </main>
  )
}
