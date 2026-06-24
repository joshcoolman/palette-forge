import { describe, it, expect } from 'vitest'

import type { ColorRow, Source } from '#/features/palette/types'
import { SimulatedEngine } from '#/features/agent/simulated-engine'
import { nameFor } from '#/features/palette/namer'

const SOURCE: Source = { type: 'color', value: '#34596e', extracted: ['#34596e'] }
const engine = new SimulatedEngine()

function colorsWithAccent(hex: string): ColorRow[] {
  const row = (role: ColorRow['role'], light: string): ColorRow => ({
    role,
    light,
    dark: light,
  })
  return [
    row('background', '#ffffff'),
    row('surface', '#eeeeee'),
    row('text', '#111111'),
    row('muted', '#777777'),
    row('accent', hex),
    row('border', '#cccccc'),
  ]
}

describe('palette namer', () => {
  it('names the takes of a round distinctly', async () => {
    const takes = await engine.compose(SOURCE)
    const names = takes.map((p) => p.name)
    expect(new Set(names).size).toBe(takes.length)
    // `<Word> <Word>` shape, both capitalized.
    expect(names.every((n) => /^[A-Z][a-z]+ [A-Z][a-z]/.test(n))).toBe(true)
  })

  it('is deterministic — same source yields the same names', async () => {
    const a = (await engine.compose(SOURCE)).map((p) => p.name)
    const b = (await engine.compose(SOURCE)).map((p) => p.name)
    expect(a).toEqual(b)
  })

  it('picks the hue word from the accent (warm vs cool differ)', () => {
    const warm = nameFor(colorsWithAccent('#d24a1a'), 'Jewel', new Set())
    const cool = nameFor(colorsWithAccent('#1a55d2'), 'Jewel', new Set())
    expect(warm).not.toEqual(cool)
  })

  it('dedupes against the seen set', () => {
    const seen = new Set<string>()
    const a = nameFor(colorsWithAccent('#d24a1a'), 'Jewel', seen)
    const b = nameFor(colorsWithAccent('#d24a1a'), 'Jewel', seen)
    expect(a).not.toEqual(b)
  })
})
