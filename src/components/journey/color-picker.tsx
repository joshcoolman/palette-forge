import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

import { hexToHsl, hslToHex, normalizeHex } from '#/features/color/color-utils'

const RAINBOW =
  'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'

const THUMB = `
.pf-range{-webkit-appearance:none;appearance:none;width:100%;height:12px;border-radius:9999px;outline:none}
.pf-range::-webkit-slider-thumb{-webkit-appearance:none;height:20px;width:20px;border-radius:9999px;background:#fff;border:2px solid rgba(0,0,0,0.35);cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.4)}
.pf-range::-moz-range-thumb{height:18px;width:18px;border-radius:9999px;background:#fff;border:2px solid rgba(0,0,0,0.35);cursor:pointer}
`

/**
 * A self-contained color picker in a modal — show it, fiddle with hue /
 * saturation / lightness freely (nothing commits while you adjust), then click
 * Done. Replaces the native `<input type="color">`, which fired on every drag and
 * opened a separate OS window. The parent decides what Done means (start a set,
 * or retune + re-run).
 */
export function ColorPicker({
  initial,
  onDone,
  onCancel,
}: {
  initial: string
  onDone: (hex: string) => void
  onCancel: () => void
}) {
  const [hsl, setHsl] = useState(() => hexToHsl(normalizeHex(initial) ?? '#3d5c49'))
  const hex = hslToHex(hsl)
  const h = Math.round(hsl.h)
  const sPct = Math.round(hsl.s * 100)
  const lPct = Math.round(hsl.l * 100)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onDone(hex)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, onDone, hex])

  const slider = (
    label: string,
    value: number,
    max: number,
    track: string,
    set: (v: number) => void,
  ) => (
    <label className="flex flex-col gap-1.5">
      <span
        className="flex items-center justify-between text-xs"
        style={{ color: 'var(--app-muted)' }}
      >
        {label}
        <span className="tabular-nums">{value}</span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="pf-range"
        style={{ background: track }}
      />
    </label>
  )

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-xs flex-col gap-4 rounded-2xl border p-5"
        style={{
          borderColor: 'var(--app-border)',
          background: 'var(--app-surface)',
        }}
      >
        <style>{THUMB}</style>

        <div className="flex items-center gap-3">
          <span
            className="h-12 w-12 shrink-0 rounded-lg"
            style={{ background: hex, outline: '1px solid var(--app-border)' }}
          />
          <div className="flex flex-col">
            <span
              className="pf-heading text-sm font-medium"
              style={{ color: 'var(--app-text)' }}
            >
              Pick a color
            </span>
            <span
              className="text-xs tabular-nums uppercase"
              style={{ color: 'var(--app-muted)' }}
            >
              {hex}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {slider('Hue', h, 360, RAINBOW, (v) => setHsl({ ...hsl, h: v }))}
          {slider(
            'Saturation',
            sPct,
            100,
            `linear-gradient(to right, hsl(${h} 0% ${lPct}%), hsl(${h} 100% ${lPct}%))`,
            (v) => setHsl({ ...hsl, s: v / 100 }),
          )}
          {slider(
            'Lightness',
            lPct,
            100,
            `linear-gradient(to right, #000, hsl(${h} ${sPct}% 50%), #fff)`,
            (v) => setHsl({ ...hsl, l: v / 100 }),
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-3 py-1.5 text-sm"
            style={{ borderColor: 'var(--app-border)', color: 'var(--app-text)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onDone(hex)}
            className="rounded-md px-4 py-1.5 text-sm font-medium"
            style={{ background: 'var(--app-text)', color: 'var(--app-bg)' }}
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  )
}
