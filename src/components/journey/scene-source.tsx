import { useState } from 'react'
import { motion } from 'motion/react'

import { extractDominantColors } from '#/features/color/dominant-color'
import { isValidHex, normalizeHex } from '#/features/color/color-utils'
import type { Source } from '#/features/palette/types'

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

/** Scene 0 — the source: drop an image, or start from a seed color. */
export function SceneSource({ onStart }: { onStart: (source: Source) => void }) {
  const [seed, setSeed] = useState('#3d405b')
  const [busy, setBusy] = useState(false)

  async function startFromFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setBusy(true)
    try {
      const dataUrl = await readAsDataURL(file)
      const extracted = await extractDominantColors(dataUrl, 6)
      onStart({ type: 'image', value: dataUrl, extracted: extracted.length > 0 ? extracted : [seed] })
    } finally {
      setBusy(false)
    }
  }

  function startFromColor() {
    const norm = normalizeHex(seed) ?? '#3d405b'
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
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-10 text-center"
        style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface)' }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--app-text)' }}>
          {busy ? 'Reading image…' : 'Drop an image, or click to upload'}
        </span>
        <span className="text-xs" style={{ color: 'var(--app-muted)' }}>
          PNG or JPG — colors are extracted in your browser
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

      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--app-muted)' }}>
        <span className="h-px flex-1" style={{ background: 'var(--app-border)' }} />
        or start from a color
        <span className="h-px flex-1" style={{ background: 'var(--app-border)' }} />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label="Seed color"
          value={normalizeHex(seed) ?? '#3d405b'}
          onChange={(e) => setSeed(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-md border bg-transparent"
          style={{ borderColor: 'var(--app-border)' }}
        />
        <input
          type="text"
          value={seed}
          spellCheck={false}
          onChange={(e) => setSeed(e.target.value)}
          className="flex-1 rounded-md border px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-text)' }}
        />
        <button
          type="button"
          onClick={startFromColor}
          disabled={!isValidHex(seed)}
          className="rounded-md px-4 py-2 text-sm font-medium disabled:opacity-40"
          style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
        >
          Forge
        </button>
      </div>
    </motion.div>
  )
}
