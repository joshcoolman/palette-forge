import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'motion/react'
import { Menu, X } from 'lucide-react'

import { IconButton } from '#/components/ui/icon-button'

// A standalone docs viewer — not linked from the nav; reach it at /docs. The
// project's own markdown (README, spec, plans, build log, archive) rendered with
// a sidebar, in the app's theme + font. Files are read at build time, so editing
// a doc and reloading just works. Ironically, a local reader for docs an agent
// maintains is itself the "agent-friendly utility" idea in miniature.
export const Route = createFileRoute('/docs')({ component: DocsPage })

const RAW: Record<string, string> = import.meta.glob(
  ['/continue.md', '/README.md', '/CLAUDE.md', '/docs/**/*.md', '/log/*.md'],
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
  // The root handoff doc — single file in the repo root, surfaced first here as the
  // "where are we" first stop. Stays one file; this route just reads it at build time.
  if (path === '/continue.md')
    return { section: 'Start here', title: 'Continue', order: -1 }
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

type Section = { section: string; docs: Doc[] }

// The shared list of doc links — rendered both in the desktop sidebar and the
// mobile slide-out drawer, so the two never drift. `onSelect` lets the drawer
// close itself on top of switching docs.
function NavList({
  sections,
  activeId,
  onSelect,
}: {
  sections: Section[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <>
      {sections.map(({ section, docs: items }) => (
        <div key={section} className="flex flex-col gap-1">
          <p
            className="pf-heading px-2 text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--app-muted)' }}
          >
            {section}
          </p>
          {items.map((d) => {
            const on = d.id === activeId
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelect(d.id)}
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
    </>
  )
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

  const defaultId = docs.find((d) => d.id === 'readme')?.id ?? docs[0]!.id
  const [activeId, setActiveId] = useState(defaultId)
  const [navOpen, setNavOpen] = useState(false)

  // Deep-link / share via #hash, client-only so SSR stays deterministic.
  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, '')
    if (fromHash && docs.some((d) => d.id === fromHash)) setActiveId(fromHash)
  }, [docs])

  // Close the mobile drawer on Escape, mirroring the color-picker modal.
  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  function select(id: string) {
    setActiveId(id)
    setNavOpen(false)
    window.history.replaceState(null, '', `#${id}`)
    window.scrollTo({ top: 0 })
  }

  const active: Doc = docs.find((d) => d.id === activeId) ?? docs[0]!

  return (
    <main className="mx-auto flex w-full max-w-6xl gap-10 px-4 py-10">
      <aside className="hidden w-56 shrink-0 sm:block">
        <nav className="sticky top-20 flex flex-col gap-5">
          <NavList sections={sections} activeId={active.id} onSelect={select} />
        </nav>
      </aside>

      <article className="docs-content min-w-0 max-w-3xl flex-1">
        {/* Mobile-only menu trigger: the sidebar is hidden below `sm`, so this
            is the only way to the doc list on a phone. Lives in the content
            area, not the global nav. */}
        <div className="mb-6 flex items-center gap-3 sm:hidden">
          <IconButton label="Open docs menu" onClick={() => setNavOpen(true)}>
            <Menu size={16} />
          </IconButton>
          <span
            className="pf-heading text-sm font-medium"
            style={{ color: 'var(--app-text)' }}
          >
            {active.title}
          </span>
        </div>

        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {active.content}
        </ReactMarkdown>
      </article>

      {/* Slide-out drawer — small screens only. */}
      {navOpen && (
        <div
          className="fixed inset-0 z-[60] sm:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setNavOpen(false)}
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'tween', duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-72 max-w-[80%] flex-col gap-5 overflow-y-auto border-r p-5"
            style={{
              borderColor: 'var(--app-border)',
              background: 'var(--app-surface)',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="pf-heading text-sm font-semibold"
                style={{ color: 'var(--app-text)' }}
              >
                Docs
              </span>
              <IconButton label="Close docs menu" onClick={() => setNavOpen(false)}>
                <X size={16} />
              </IconButton>
            </div>
            <nav className="flex flex-col gap-5">
              <NavList sections={sections} activeId={active.id} onSelect={select} />
            </nav>
          </motion.div>
        </div>
      )}
    </main>
  )
}
