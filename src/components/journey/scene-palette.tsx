import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'

import type { ScoredPalette } from '#/features/palette/types'
import { savePalette } from '#/features/palette/palette-repo'
import { ContrastBadges } from '#/components/forge/contrast-badges'
import { PalettePreview } from '#/components/forge/palette-preview'
import { ExportModal } from '#/components/library/export-modal'

function RoleSwatches({ palette }: { palette: ScoredPalette }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {palette.colors.map((row) => (
        <div
          key={row.role}
          className="flex items-center gap-2 rounded-lg border p-2"
          style={{ borderColor: 'var(--app-border)' }}
        >
          <span className="flex overflow-hidden rounded">
            <span className="h-6 w-4" style={{ background: row.light }} />
            <span className="h-6 w-4" style={{ background: row.dark }} />
          </span>
          <span className="text-xs" style={{ color: 'var(--app-text)' }}>
            {row.role}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Scene 3 — the chosen palette, fully fleshed out in both modes. */
export function ScenePalette({ palette }: { palette: ScoredPalette }) {
  const [saved, setSaved] = useState(false)
  const [showExport, setShowExport] = useState(false)

  async function keep() {
    await savePalette(palette)
    setSaved(true)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          className="text-lg font-semibold"
          style={{ color: 'var(--app-text)' }}
        >
          {palette.name}
        </h2>
        <span
          className="text-sm tabular-nums"
          style={{ color: 'var(--app-muted)' }}
        >
          score {palette.score.overall}
        </span>
      </div>
      <p className="text-sm" style={{ color: 'var(--app-muted)' }}>
        {palette.score.rationale}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span
            className="text-xs uppercase tracking-wide"
            style={{ color: 'var(--app-muted)' }}
          >
            Light
          </span>
          <PalettePreview colors={palette.colors} mode="light" />
          <ContrastBadges checks={palette.contrast} mode="light" />
        </div>
        <div className="flex flex-col gap-2">
          <span
            className="text-xs uppercase tracking-wide"
            style={{ color: 'var(--app-muted)' }}
          >
            Dark
          </span>
          <PalettePreview colors={palette.colors} mode="dark" />
          <ContrastBadges checks={palette.contrast} mode="dark" />
        </div>
      </div>

      <RoleSwatches palette={palette} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void keep()}
          disabled={saved}
          className="rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
        >
          {saved ? 'Saved to library' : 'Keep'}
        </button>
        <button
          type="button"
          onClick={() => setShowExport(true)}
          className="rounded-md border px-4 py-2 text-sm"
          style={{ borderColor: 'var(--app-border)', color: 'var(--app-text)' }}
        >
          Copy / Export
        </button>
        {saved && (
          <Link
            to="/library"
            className="text-xs underline"
            style={{ color: 'var(--app-muted)' }}
          >
            View library
          </Link>
        )}
      </div>

      {showExport && (
        <ExportModal palette={palette} onClose={() => setShowExport(false)} />
      )}
    </motion.section>
  )
}
