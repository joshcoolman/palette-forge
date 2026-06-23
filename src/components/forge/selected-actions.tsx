import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import type { ScoredPalette } from '#/features/palette/types'
import { savePalette } from '#/features/palette/palette-repo'
import { toHexList } from '#/features/palette/export'
import { ExportModal } from '#/components/library/export-modal'

/** Compact action bar for the currently-selected palette — replaces the old
 *  full-detail scene. Mount with key={palette.id} so state resets per pick. */
export function SelectedActions({ palette }: { palette: ScoredPalette }) {
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showExport, setShowExport] = useState(false)

  async function save() {
    await savePalette(palette)
    setSaved(true)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(toHexList(palette))
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-2xl border p-4"
      style={{
        borderColor: 'var(--app-border)',
        background: 'var(--app-surface)',
      }}
    >
      <span
        className="text-sm font-medium"
        style={{ color: 'var(--app-text)' }}
      >
        {palette.name}
      </span>
      <span
        className="text-xs tabular-nums"
        style={{ color: 'var(--app-muted)' }}
      >
        score {palette.score.overall}
      </span>
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => void save()}
        disabled={saved}
        className="rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
      >
        {saved ? 'Saved ✓' : 'Save to library'}
      </button>
      <button
        type="button"
        onClick={() => void copy()}
        className="rounded-md border px-3 py-1.5 text-sm"
        style={{ borderColor: 'var(--app-border)', color: 'var(--app-text)' }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button
        type="button"
        onClick={() => setShowExport(true)}
        className="rounded-md border px-3 py-1.5 text-sm"
        style={{ borderColor: 'var(--app-border)', color: 'var(--app-text)' }}
      >
        Export
      </button>
      <Link
        to="/library"
        className="text-xs underline"
        style={{ color: 'var(--app-muted)' }}
      >
        View library
      </Link>
      {showExport && (
        <ExportModal palette={palette} onClose={() => setShowExport(false)} />
      )}
    </div>
  )
}
