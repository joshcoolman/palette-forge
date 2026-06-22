import type { CSSProperties } from 'react'

/** Fixed gradient backdrop whose stops cross-fade to the current colors. */
export function Backdrop({ colors }: { colors: string[] }) {
  const a = colors[0]
  if (!a) return <div className="pf-backdrop" aria-hidden />
  const style = {
    '--pf-grad-a': a,
    '--pf-grad-b': colors[1] ?? a,
    '--pf-grad-c': colors[2] ?? colors[1] ?? a,
  } as CSSProperties
  return <div className="pf-backdrop" style={style} aria-hidden />
}
