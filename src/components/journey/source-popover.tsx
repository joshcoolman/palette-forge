import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ImageUp, Pipette, Plus, Sparkles } from 'lucide-react'

import { extractDominantColors } from '#/features/color/dominant-color'
import { normalizeHex } from '#/features/color/color-utils'
import type { Source } from '#/features/palette/types'
import { IconButton } from '#/components/ui/icon-button'
import { ColorPicker } from '#/components/journey/color-picker'
import { PromptDialog } from '#/components/journey/prompt-dialog'

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

// A curated, characterful starting set lifted from a Pantone fashion card —
// warm/cool/neutral/deep, each seed with a personality rather than a coordinate.
// The eyedropper cell (last) opens the native picker for an exact color.
const CURATED = [
  '#363842', // Polar Night
  '#8d8d8f', // Chiseled Stone
  '#e7cda4', // Autumn Blonde
  '#a6afa0', // Loden Frost
  '#e76f2c', // Orange Tiger
  '#2c6e4f', // Amazon
  '#9fd7dc', // Waterspout
  '#34596e', // Midnight
  '#6f6b49', // Martini Olive
  '#c24d8e', // Rose Violet
  '#e4bdcc', // Nosegay
  '#8a5733', // Caramel Café
  '#f3c95c', // Samoan Sun
  '#9e3b2d', // Lava Falls
]

/**
 * The source picker, collapsed into a popover anchored to a `+` button: upload
 * an image (click or drag-drop onto the popover), pick a curated seed, or open
 * the eyedropper for a custom color. Picking any source closes the popover and
 * hands the Source up via onStart. Replaces the full-page SceneSource.
 */
export function SourcePopover({
  onStart,
  aiEnabled,
}: {
  onStart: (source: Source) => void
  /** Whether a key is present — gates the "describe it" prompt section's existence. */
  aiEnabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [chatting, setChatting] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function startFromFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setBusy(true)
    try {
      const dataUrl = await readAsDataURL(file)
      const extracted = await extractDominantColors(dataUrl, 12)
      setOpen(false)
      onStart({
        type: 'image',
        value: dataUrl,
        extracted: extracted.length > 0 ? extracted : ['#3d5c49'],
      })
    } finally {
      setBusy(false)
    }
  }

  function startFromColor(hex: string) {
    const norm = normalizeHex(hex) ?? '#3d5c49'
    setOpen(false)
    onStart({ type: 'color', value: norm, extracted: [norm] })
  }

  return (
    <div ref={ref} className="relative">
      <IconButton
        label="New palette"
        onClick={() => setOpen((o) => !o)}
        pressed={open}
        foreground="var(--app-text)"
      >
        <Plus size={16} />
      </IconButton>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files.item(0)
            if (file) void startFromFile(file)
          }}
          className="absolute right-0 z-50 mt-2 w-72 rounded-[var(--app-radius)] border p-3 shadow-2xl"
          style={{
            borderColor: 'var(--app-border)',
            background: 'var(--app-surface)',
          }}
        >
          <label
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--app-radius-sm)] border border-dashed p-6 text-center"
            style={{ borderColor: 'var(--app-border)' }}
          >
            <ImageUp size={22} style={{ color: 'var(--app-muted)' }} />
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--app-text)' }}
            >
              {busy ? 'Reading image…' : 'Upload Image'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.item(0)
                if (file) void startFromFile(file)
              }}
            />
          </label>

          <div
            className="mt-3 mb-2 text-[11px] uppercase tracking-wide"
            style={{ color: 'var(--app-muted)' }}
          >
            or start from a color
          </div>

          <div className="grid grid-cols-5 gap-2">
            {CURATED.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => startFromColor(hex)}
                aria-label={`Start from ${hex}`}
                className="aspect-square rounded-lg border transition-transform hover:-translate-y-0.5"
                style={{ background: hex, borderColor: 'var(--app-border)' }}
              />
            ))}
            <button
              type="button"
              aria-label="Pick a custom color"
              onClick={() => {
                setOpen(false)
                setPicking(true)
              }}
              className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border transition-transform hover:-translate-y-0.5"
              style={{
                borderColor: 'var(--app-border)',
                background: 'var(--app-bg)',
                color: 'var(--app-muted)',
              }}
            >
              <Pipette size={15} />
            </button>
          </div>

          {/* Chat with AI — additive, only with a key (no nag otherwise). A worded
              brief is a focused task, so it leaves the popover for its own overlay
              rather than crowding the quick picks above. */}
          {aiEnabled && (
            <>
              <hr
                className="mt-3 mb-3 border-0 border-t"
                style={{ borderColor: 'var(--app-border)' }}
              />
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setChatting(true)
                }}
                className="flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition hover:opacity-70"
                style={{
                  borderColor: 'var(--app-border)',
                  color: 'var(--app-text)',
                }}
              >
                <Sparkles size={14} />
                Chat with AI
              </button>
            </>
          )}
        </motion.div>
      )}

      {picking && (
        <ColorPicker
          initial="#3d5c49"
          onDone={(hex) => {
            setPicking(false)
            startFromColor(hex)
          }}
          onCancel={() => setPicking(false)}
        />
      )}

      {chatting && (
        <PromptDialog onStart={onStart} onClose={() => setChatting(false)} />
      )}
    </div>
  )
}
