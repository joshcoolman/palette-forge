import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Clipboard, ClipboardCheck, X } from 'lucide-react'

import type { Mode, Palette, Role } from '#/features/palette/types'
import { EXPORT_FORMATS, buildExport } from '#/features/palette/export'
import type { ExportFormatId, TailwindVersion } from '#/features/palette/export'
import { IconButton } from '#/components/ui/icon-button'

const BAND_ORDER: Role[] = [
  'background',
  'surface',
  'muted',
  'border',
  'accent',
  'text',
]

function band(palette: Palette, mode: Mode): string[] {
  return BAND_ORDER.map(
    (role) => palette.colors.find((c) => c.role === role)?.[mode] ?? '#888888',
  )
}

/** A compact visual swatch band (the favorite-card look) over copy-able formats,
 *  with a v3/v4 toggle for the Tailwind export. The name lives in the header. */
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
        className="flex h-[600px] max-h-[85vh] w-full max-w-lg flex-col gap-4 rounded-2xl border p-5"
        style={{
          borderColor: 'var(--app-border)',
          background: 'var(--app-surface)',
        }}
      >
        <div className="flex shrink-0 items-center justify-between">
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--app-text)' }}
          >
            {palette.name}
          </h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={14} />
          </IconButton>
        </div>

        <div
          className="shrink-0 overflow-hidden rounded-xl border"
          style={{ borderColor: 'var(--app-border)' }}
        >
          <div className="flex h-20">
            {band(palette, 'light').map((hex, i) => (
              <span
                key={`l-${i}`}
                className="flex-1"
                style={{ background: hex }}
              />
            ))}
          </div>
          <div className="flex h-5">
            {band(palette, 'dark').map((hex, i) => (
              <span
                key={`d-${i}`}
                className="flex-1"
                style={{ background: hex }}
              />
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3">
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
        </div>

        <div className="relative min-h-0 flex-1">
          <pre
            className="h-full overflow-auto rounded-lg border py-3 pl-3 pr-12 text-xs leading-relaxed"
            style={{
              borderColor: 'var(--app-border)',
              background: 'var(--app-bg)',
              color: 'var(--app-text)',
              scrollbarGutter: 'stable',
            }}
          >
            <code>{code}</code>
          </pre>
          <IconButton
            label={copied ? 'Copied' : 'Copy code'}
            onClick={() => void copy()}
            className="absolute right-3 top-3"
            foreground="var(--app-text)"
            background="var(--app-surface)"
          >
            {copied ? <ClipboardCheck size={14} /> : <Clipboard size={14} />}
          </IconButton>
        </div>
      </motion.div>
    </div>
  )
}
