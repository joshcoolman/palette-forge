import { describe, expect, it } from 'vitest'

import { parseModelName, parseNameList } from '#/features/agent/rename'

// The model's output is untrusted: the name swaps into the card only if it's a
// clean two-word name. Anything else must return null so the deterministic
// fallback silently stays. These lock that boundary.
describe('parseModelName', () => {
  it('accepts a clean two-word name', () => {
    expect(parseModelName('Tuscan Dusk')).toBe('Tuscan Dusk')
  })

  it('strips wrapping quotes and a trailing period', () => {
    expect(parseModelName('"Cobalt Riot"')).toBe('Cobalt Riot')
    expect(parseModelName('Sumi Ink.')).toBe('Sumi Ink')
    expect(parseModelName('“Velvet Heresy”')).toBe('Velvet Heresy')
  })

  it('collapses incidental whitespace and newlines', () => {
    expect(parseModelName('  Quiet   Riot \n')).toBe('Quiet Riot')
  })

  it('keeps internal apostrophes and hyphens', () => {
    expect(parseModelName("Painter's Light")).toBe("Painter's Light")
    expect(parseModelName('Blue-green Hush')).toBe('Blue-green Hush')
  })

  it('rejects anything that is not exactly two words', () => {
    expect(parseModelName('Dusk')).toBeNull()
    expect(parseModelName('Warm Mid Century Calm')).toBeNull()
    expect(parseModelName('')).toBeNull()
  })

  it('rejects lowercase, digits, and chatty preambles', () => {
    expect(parseModelName('tuscan dusk')).toBeNull()
    expect(parseModelName('Studio 54')).toBeNull()
    expect(parseModelName('Sure! Here is a name: Tuscan Dusk')).toBeNull()
  })

  it('rejects an over-long name', () => {
    expect(parseModelName('Supercalifragilistic Expialidocious')).toBeNull()
  })
})

// The model's multi-line reply is untrusted: only clean two-word names survive,
// list markers are tolerated, duplicates collapse, and the count is capped.
describe('parseNameList', () => {
  it('parses one valid name per line', () => {
    expect(parseNameList('Tuscan Dusk\nCobalt Riot\nSumi Ink')).toEqual([
      'Tuscan Dusk',
      'Cobalt Riot',
      'Sumi Ink',
    ])
  })

  it('strips numbering and bullet markers the model adds anyway', () => {
    expect(parseNameList('1. Tuscan Dusk\n2) Cobalt Riot\n- Sumi Ink\n• Velvet Heresy')).toEqual([
      'Tuscan Dusk',
      'Cobalt Riot',
      'Sumi Ink',
      'Velvet Heresy',
    ])
  })

  it('skips invalid lines and dedupes', () => {
    expect(
      parseNameList('Tuscan Dusk\nSure, here are some ideas:\nTuscan Dusk\nCobalt Riot'),
    ).toEqual(['Tuscan Dusk', 'Cobalt Riot'])
  })

  it('caps the result at max', () => {
    expect(
      parseNameList('Tuscan Dusk\nCobalt Riot\nSumi Ink\nVelvet Heresy\nQuiet Riot', 4),
    ).toHaveLength(4)
  })

  it('returns empty when nothing is usable', () => {
    expect(parseNameList('Here are some great palette name ideas for you')).toEqual([])
  })
})
