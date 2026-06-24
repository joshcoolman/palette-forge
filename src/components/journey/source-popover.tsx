import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ImageUp, Loader2, Pipette, Plus, Sparkles } from 'lucide-react'

import { extractDominantColors } from '#/features/color/dominant-color'
import { normalizeHex } from '#/features/color/color-utils'
import { promptToSeed } from '#/features/agent/prompt-engine'
import type { Source } from '#/features/palette/types'
import { IconButton } from '#/components/ui/icon-button'
import { ColorPicker } from '#/components/journey/color-picker'

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
  const [busy, setBusy] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  // The model translates the words into one seed hex; the engine builds the round
  // from it like any other color source (the original text rides along in `prompt`
  // for the deferred mood board). A bad hex falls back to neutral inside
  // promptToSeed; only a transport error throws, which we surface here.
  async function startFromPrompt() {
    const text = prompt.trim()
    if (!text || thinking) return
    setThinking(true)
    setError(null)
    try {
      const seed = await promptToSeed(text)
      setOpen(false)
      setPrompt('')
      onStart({ type: 'color', value: seed, extracted: [seed], prompt: text })
    } catch {
      setError('Couldn’t reach Anthropic. Check your API key in Settings.')
    } finally {
      setThinking(false)
    }
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

          {/* Describe it — additive, only with a key (no nag otherwise). The model
              maps the words to a seed; the engine runs from there. */}
          {aiEnabled && (
            <>
              <div
                className="mt-3 mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide"
                style={{ color: 'var(--app-muted)' }}
              >
                <Sparkles size={12} />
                or describe it
              </div>

              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  void startFromPrompt()
                }}
              >
                <input
                  type="text"
                  value={prompt}
                  disabled={thinking}
                  maxLength={120}
                  placeholder="warm, mid-century, calm"
                  aria-label="Describe the palette"
                  onChange={(e) => {
                    setPrompt(e.target.value)
                    if (error) setError(null)
                  }}
                  className="min-w-0 flex-1 rounded-md border bg-transparent px-2.5 py-1.5 text-sm outline-none disabled:opacity-50"
                  style={{
                    borderColor: 'var(--app-border)',
                    color: 'var(--app-text)',
                  }}
                />
                <button
                  type="submit"
                  disabled={thinking || prompt.trim().length === 0}
                  aria-label="Forge from description"
                  className="flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-40"
                  style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
                >
                  {thinking ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    'Forge'
                  )}
                </button>
              </form>

              {error && (
                <p
                  className="mt-2 text-xs"
                  style={{ color: 'var(--app-text)' }}
                >
                  {error}
                </p>
              )}
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
    </div>
  )
}
