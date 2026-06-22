import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

import type { Palette } from '#/features/palette/types'
import { ROLES } from '#/features/palette/types'
import { EXPORT_FORMATS, buildExport } from '#/features/palette/export'
import type { ExportFormatId, TailwindVersion } from '#/features/palette/export'

/** Click-a-card detail + pasteable code: role-band detail (fontpair look) over
 *  copy-able formats, with a v3/v4 toggle for the Tailwind export. */
export function ExportModal({
  palette,
  onClose,
}: {
  palette: Palette
  onClose: () => void
}) {
  const [formatId, setFormatId] = useState<ExportFormatId>('tailwind')
  const [tailwindVersion, setTailwindVersion] = useState<TailwindVersion>('v4')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const code = buildExport(palette, formatId, tailwindVersion)
  const rows = ROLES.map((role) => {
    const row = palette.colors.find((c) => c.role === role)
    return {
      role,
      light: row?.light ?? '#000000',
      dark: row?.dark ?? '#000000',
    }
  })

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-auto rounded-2xl border p-5"
        style={{
          borderColor: 'var(--app-border)',
          background: 'var(--app-surface)',
        }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--app-text)' }}
          >
            {palette.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm"
            style={{ color: 'var(--app-muted)' }}
          >
            Close
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {rows.map((r) => (
            <div
              key={r.role}
              className="flex items-center gap-3 rounded-lg border px-3 py-2"
              style={{ borderColor: 'var(--app-border)' }}
            >
              <span className="flex overflow-hidden rounded">
                <span className="h-5 w-5" style={{ background: r.light }} />
                <span className="h-5 w-5" style={{ background: r.dark }} />
              </span>
              <span
                className="flex-1 text-sm"
                style={{ color: 'var(--app-text)' }}
              >
                {r.role}
              </span>
              <span
                className="font-mono text-xs"
                style={{ color: 'var(--app-muted)' }}
              >
                {r.light} / {r.dark}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {EXPORT_FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormatId(f.id)}
              className="rounded-full border px-3 py-1 text-xs"
              style={{
                borderColor:
                  f.id === formatId ? 'var(--app-text)' : 'var(--app-border)',
                color: 'var(--app-text)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {formatId === 'tailwind' && (
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--app-muted)' }}
          >
            <span>Version</span>
            {(['v4', 'v3'] as TailwindVersion[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setTailwindVersion(v)}
                className="rounded-md border px-2 py-0.5"
                style={{
                  borderColor:
                    v === tailwindVersion
                      ? 'var(--app-text)'
                      : 'var(--app-border)',
                  color: 'var(--app-text)',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <pre
            className="overflow-auto rounded-lg border p-3 text-xs leading-relaxed"
            style={{
              borderColor: 'var(--app-border)',
              background: 'var(--app-bg)',
              color: 'var(--app-text)',
            }}
          >
            <code>{code}</code>
          </pre>
          <button
            type="button"
            onClick={() => void copy()}
            className="absolute right-2 top-2 rounded-md px-2.5 py-1 text-xs font-medium"
            style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
