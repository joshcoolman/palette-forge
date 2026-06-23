import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// A standalone docs viewer — not linked from the nav; reach it at /docs. The
// project's own markdown (README, spec, plans, build log, archive) rendered with
// a sidebar, in the app's theme + font. Files are read at build time, so editing
// a doc and reloading just works. Ironically, a local reader for docs an agent
// maintains is itself the "agent-friendly utility" idea in miniature.
export const Route = createFileRoute('/docs')({ component: DocsPage })

const RAW: Record<string, string> = import.meta.glob(
  ['/README.md', '/CLAUDE.md', '/docs/**/*.md', '/log/*.md'],
  { query: '?raw', import: 'default', eager: true },
)

type Doc = {
  id: string
  title: string
  section: string
  order: number
  content: string
}

const SECTION_ORDER = [
  'Start here',
  'Plans',
  'Working notes',
  'Build log',
  'Archive',
]

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function slugify(path: string): string {
  return path.replace(/^\//, '').replace(/\.md$/i, '').replace(/\//g, '-').toLowerCase()
}

function classify(path: string): {
  section: string
  title: string
  order: number
} {
  const base = path.split('/').pop()!.replace(/\.md$/i, '')
  if (path === '/README.md') return { section: 'Start here', title: 'README', order: 0 }
  if (path === '/docs/SPEC.md') return { section: 'Start here', title: 'Spec', order: 1 }
  if (path === '/CLAUDE.md')
    return { section: 'Working notes', title: 'CLAUDE.md', order: 0 }
  if (path.startsWith('/docs/plan-'))
    return {
      section: 'Plans',
      title: titleCase(base.replace(/^plan-/, '').replace(/-/g, ' ')).replace(
        /\bai\b/gi,
        'AI',
      ),
      order: 0,
    }
  if (path.startsWith('/docs/archive/'))
    return { section: 'Archive', title: base, order: 0 }
  if (path.startsWith('/log/'))
    return base.toLowerCase() === 'readme'
      ? { section: 'Build log', title: 'About the log', order: -1 }
      : { section: 'Build log', title: base, order: 0 }
  return { section: 'Working notes', title: base, order: 1 }
}

function buildDocs(): Doc[] {
  return Object.entries(RAW).map(([path, content]) => ({
    id: slugify(path),
    content,
    ...classify(path),
  }))
}

function DocsPage() {
  const docs = useMemo(buildDocs, [])

  // Group into sections, ordered; logs sort newest-first by their dated title.
  const sections = useMemo(() => {
    const bySection = new Map<string, Doc[]>()
    for (const d of docs) {
      const list = bySection.get(d.section) ?? []
      list.push(d)
      bySection.set(d.section, list)
    }
    return SECTION_ORDER.filter((s) => bySection.has(s)).map((section) => ({
      section,
      docs: (bySection.get(section) ?? []).sort(
        (a, b) => a.order - b.order || b.title.localeCompare(a.title),
      ),
    }))
  }, [docs])

  const defaultId = docs.find((d) => d.id === 'readme')?.id ?? docs[0].id
  const [activeId, setActiveId] = useState(defaultId)

  // Deep-link / share via #hash, client-only so SSR stays deterministic.
  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, '')
    if (fromHash && docs.some((d) => d.id === fromHash)) setActiveId(fromHash)
  }, [docs])

  function select(id: string) {
    setActiveId(id)
    window.history.replaceState(null, '', `#${id}`)
    window.scrollTo({ top: 0 })
  }

  const active: Doc = docs.find((d) => d.id === activeId) ?? docs[0]

  return (
    <main className="mx-auto flex w-full max-w-6xl gap-10 px-4 py-10">
      <aside className="hidden w-56 shrink-0 sm:block">
        <nav className="sticky top-20 flex flex-col gap-5">
          {sections.map(({ section, docs: items }) => (
            <div key={section} className="flex flex-col gap-1">
              <p
                className="pf-heading px-2 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: 'var(--app-muted)' }}
              >
                {section}
              </p>
              {items.map((d) => {
                const on = d.id === active.id
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => select(d.id)}
                    className="rounded-md px-2 py-1 text-left text-sm transition"
                    style={{
                      color: on ? 'var(--app-text)' : 'var(--app-muted)',
                      background: on ? 'var(--app-surface)' : 'transparent',
                    }}
                  >
                    {d.title}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>

      <article className="docs-content min-w-0 max-w-3xl flex-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {active.content}
        </ReactMarkdown>
      </article>
    </main>
  )
}
