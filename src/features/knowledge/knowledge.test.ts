import { describe, it, expect } from 'vitest'

import { BASELINE } from '#/features/color/contrast'
import {
  loadContrastPolicy,
  parseContrastPolicy,
} from '#/features/knowledge/contrast-policy'

const VALID = `---
baseline: AA
pairings:
  - text-on-background: AAA
  - text-on-surface: AA
  - border-on-surface: 3
---

# Contrast policy
Prose below the frontmatter should be ignored.
`

describe('parseContrastPolicy', () => {
  it('parses named and numeric targets from frontmatter', () => {
    const policy = parseContrastPolicy(VALID)
    expect(policy.baseline).toBe('AA')
    expect(policy.pairings).toContainEqual({
      pairing: 'text-on-background',
      target: 'AAA',
    })
    expect(policy.pairings).toContainEqual({
      pairing: 'border-on-surface',
      target: 3,
    })
  })

  it('falls back to BASELINE when there is no frontmatter', () => {
    expect(parseContrastPolicy('# Just prose, no policy')).toEqual(BASELINE)
    expect(parseContrastPolicy('')).toEqual(BASELINE)
  })

  it('welds the baseline floor in even if knowledge omits it', () => {
    const policy = parseContrastPolicy(`---
baseline: AA
pairings:
  - accent-on-background: AA
---`)
    // baseline floor pairings are always present
    for (const base of BASELINE.pairings) {
      expect(policy.pairings.some((p) => p.pairing === base.pairing)).toBe(true)
    }
  })
})

describe('loadContrastPolicy', () => {
  it('returns a policy that includes the welded floor pairings', () => {
    const policy = loadContrastPolicy()
    for (const base of BASELINE.pairings) {
      expect(policy.pairings.some((p) => p.pairing === base.pairing)).toBe(true)
    }
  })
})
