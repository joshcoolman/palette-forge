import { describe, expect, it } from 'vitest'

import { parseSeedHex } from '#/features/agent/prompt-engine'

// The model's reply is untrusted: a seed only flows into the engine if a real
// hex can be pulled from it. Anything else returns null so the caller falls back
// to the neutral seed rather than crashing on a bad color. These lock that edge.
describe('parseSeedHex', () => {
  it('takes a clean lowercase hex', () => {
    expect(parseSeedHex('#e76f2c')).toBe('#e76f2c')
  })

  it('normalizes case and a missing #', () => {
    expect(parseSeedHex('E76F2C')).toBe('#e76f2c')
    expect(parseSeedHex('#2C6E4F')).toBe('#2c6e4f')
  })

  it('expands 3-digit shorthand via normalizeHex', () => {
    expect(parseSeedHex('#abc')).toBe('#aabbcc')
  })

  it('pulls the hex out of wrapping prose', () => {
    expect(parseSeedHex('A warm terracotta — #c24d2e works well.')).toBe(
      '#c24d2e',
    )
    expect(parseSeedHex('ember\ne76f2c\n')).toBe('#e76f2c')
  })

  it('does not grab 6 chars out of a longer hex run', () => {
    // An 8-digit (rgba-looking) blob is not a clean seed — reject, don't slice.
    expect(parseSeedHex('e76f2caa')).toBeNull()
  })

  it('returns null when there is no hex at all', () => {
    expect(parseSeedHex('warm mid-century calm')).toBeNull()
    expect(parseSeedHex('')).toBeNull()
  })
})
