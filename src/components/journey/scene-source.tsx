import { useState } from 'react'
import { motion } from 'motion/react'
import { ImageUp, Pipette } from 'lucide-react'

import { extractDominantColors } from '#/features/color/dominant-color'
import { normalizeHex } from '#/features/color/color-utils'
import type { Source } from '#/features/palette/types'

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
// Hex approximated from the reference. The eyedropper cell (last) opens the
// native picker for an exact color.
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

/** Scene 0 — the source: upload an image, or start from a spectrum swatch. */
export function SceneSource({
  onStart,
}: {
  onStart: (source: Source) => void
}) {
  const [busy, setBusy] = useState(false)

  async function startFromFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setBusy(true)
    try {
      const dataUrl = await readAsDataURL(file)
      const extracted = await extractDominantColors(dataUrl, 12)
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
    onStart({ type: 'color', value: norm, extracted: [norm] })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files.item(0)
          if (file) void startFromFile(file)
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--app-radius)] border border-dashed p-12 text-center"
        style={{
          borderColor: 'var(--app-border)',
          background: 'var(--app-surface)',
        }}
      >
        <ImageUp size={28} style={{ color: 'var(--app-muted)' }} />
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
        className="flex items-center gap-3 text-xs"
        style={{ color: 'var(--app-muted)' }}
      >
        <span
          className="h-px flex-1"
          style={{ background: 'var(--app-border)' }}
        />
        or start from a color
        <span
          className="h-px flex-1"
          style={{ background: 'var(--app-border)' }}
        />
      </div>

      <div className="flex gap-2">
        {CURATED.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => startFromColor(hex)}
            aria-label={`Start from ${hex}`}
            className="aspect-square flex-1 rounded-lg border transition-transform hover:-translate-y-1"
            style={{ background: hex, borderColor: 'var(--app-border)' }}
          />
        ))}
        <label
          aria-label="Pick a custom color"
          className="flex aspect-square flex-1 cursor-pointer items-center justify-center rounded-lg border transition-transform hover:-translate-y-1"
          style={{
            borderColor: 'var(--app-border)',
            background: 'var(--app-surface)',
            color: 'var(--app-muted)',
          }}
        >
          <Pipette size={16} />
          <input
            type="color"
            defaultValue="#3d5c49"
            className="hidden"
            onChange={(e) => startFromColor(e.target.value)}
          />
        </label>
      </div>
    </motion.div>
  )
}
