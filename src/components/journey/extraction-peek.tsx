import { useEffect, useState } from 'react'

import type { Source } from '#/features/palette/types'
import { rasterizeSmall } from '#/features/color/dominant-color'

/** A peek at the exact downscaled bitmap the extractor sampled (120px), shown
 *  pixelated next to the colors pulled from it. Optional — safe to remove (this
 *  file + its mount in forge.$sessionId.tsx; rasterizeSmall stays in use). */
export function ExtractionPeek({ source }: { source: Source }) {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (source.type !== 'image') {
      setPreview(null)
      return
    }
    let alive = true
    void rasterizeSmall(source.value).then((canvas) => {
      if (alive && canvas) setPreview(canvas.toDataURL())
    })
    return () => {
      alive = false
    }
  }, [source])

  if (source.type !== 'image' || !preview) return null

  return (
    <div
      className="flex items-center gap-4 rounded-xl border p-3"
      style={{
        borderColor: 'var(--app-border)',
        background: 'var(--app-surface)',
      }}
    >
      <img
        src={preview}
        alt="The downscaled image the extractor sampled"
        className="rounded-md border"
        style={{
          imageRendering: 'pixelated',
          height: 96,
          width: 'auto',
          maxWidth: 180,
          borderColor: 'var(--app-border)',
        }}
      />
      <div className="flex flex-col gap-2">
        <span className="text-xs" style={{ color: 'var(--app-muted)' }}>
          What the extractor sampled — 120px, before quantization
        </span>
        <div className="flex overflow-hidden rounded-md">
          {source.extracted.map((hex, i) => (
            <span
              key={`${hex}-${i}`}
              className="h-6 w-8"
              style={{ background: hex }}
              title={hex}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
