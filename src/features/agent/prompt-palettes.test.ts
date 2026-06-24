import { describe, expect, it } from 'vitest'

import {
  extractJsonArray,
  parseModelPalettes,
  toColorRows,
  toModelPalette,
} from '#/features/agent/prompt-palettes'
import { ROLES } from '#/features/palette/types'

// A well-formed palette object as the model is asked to emit it. `hex` lets a test
// inject a bad value into one role.
function paletteObj(over: Record<string, unknown> = {}) {
  const role = (light: string, dark: string) => ({ light, dark })
  return {
    name: 'Pit Lane',
    rationale: 'steel + a charged amber',
    roles: {
      background: role('#f4f4f5', '#17181b'),
      surface: role('#e8e8ea', '#212227'),
      text: role('#1a1a1d', '#ededf0'),
      muted: role('#6b6b70', '#9a9aa0'),
      border: role('#d8d8db', '#2e2f35'),
      secondary: role('#3a3f4a', '#5a6172'),
      accent: role('#c8341f', '#e8552f'),
    },
    ...over,
  }
}

// The model's reply is untrusted: only fully-formed palettes (all seven roles, valid
// hex) reach the engine; anything else is dropped so a malformed color never renders.
describe('extractJsonArray', () => {
  it('parses a clean JSON array', () => {
    expect(extractJsonArray('[1, 2, 3]')).toEqual([1, 2, 3])
  })

  it('pulls the array out of code fences and stray prose', () => {
    const raw = 'Here you go:\n```json\n[{"a":1}]\n```\nHope that helps!'
    expect(extractJsonArray(raw)).toEqual([{ a: 1 }])
  })

  it('returns null when there is no array or the JSON is broken', () => {
    expect(extractJsonArray('no json here')).toBeNull()
    expect(extractJsonArray('{"not":"an array"}')).toBeNull()
    expect(extractJsonArray('[broken')).toBeNull()
  })
})

describe('toModelPalette', () => {
  it('accepts a full palette and normalizes its hexes', () => {
    const p = toModelPalette(
      paletteObj({
        roles: {
          ...paletteObj().roles,
          accent: { light: 'C8341F', dark: '#ABC' }, // no #, and shorthand
        },
      }),
    )
    expect(p).not.toBeNull()
    expect(p?.roles.accent).toEqual({ light: '#c8341f', dark: '#aabbcc' })
    expect(Object.keys(p!.roles).sort()).toEqual([...ROLES].sort())
  })

  it('rejects a palette missing any of the seven roles', () => {
    const { secondary: _omit, ...roles } = paletteObj().roles
    expect(toModelPalette(paletteObj({ roles }))).toBeNull()
  })

  it('rejects a palette with an invalid hex in any role', () => {
    const roles = { ...paletteObj().roles, text: { light: '#1a1a1d', dark: 'nope' } }
    expect(toModelPalette(paletteObj({ roles }))).toBeNull()
  })

  it('falls back to a placeholder name when none is given', () => {
    expect(toModelPalette(paletteObj({ name: '' }))?.name).toBe('Untitled')
  })
})

describe('parseModelPalettes', () => {
  it('keeps the good palettes and drops the malformed ones', () => {
    const broken = paletteObj({ roles: { ...paletteObj().roles, accent: undefined } })
    const raw = JSON.stringify([paletteObj(), broken, paletteObj({ name: 'Apex Steel' })])
    const out = parseModelPalettes(raw)
    expect(out).toHaveLength(2)
    expect(out.map((p) => p.name)).toEqual(['Pit Lane', 'Apex Steel'])
  })

  it('returns an empty list for an unusable reply', () => {
    expect(parseModelPalettes('the model refused')).toEqual([])
  })
})

describe('toColorRows', () => {
  it('produces one ColorRow per role with light + dark', () => {
    const rows = toColorRows(toModelPalette(paletteObj())!)
    expect(rows).toHaveLength(ROLES.length)
    expect(rows.map((r) => r.role).sort()).toEqual([...ROLES].sort())
    const accent = rows.find((r) => r.role === 'accent')
    expect(accent).toEqual({ role: 'accent', light: '#c8341f', dark: '#e8552f' })
  })
})
