/* eslint-disable import/first -- vitest's vi.mock must be hoisted above the mocked-module imports below */
import { describe, it, expect, vi } from 'vitest'

import type { ColorRow, Source } from '#/features/palette/types'

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }))

vi.mock('#/features/agent/client', () => ({
  makeClient: () => ({ messages: { create: createMock } }),
}))

import { ClaudeEngine } from '#/features/agent/claude-engine'
import { SimulatedEngine } from '#/features/agent/simulated-engine'
import { loadContrastPolicy } from '#/features/knowledge/contrast-policy'
import { policyFailures } from '#/features/color/contrast'

const SOURCE: Source = {
  type: 'color',
  value: '#3d405b',
  extracted: ['#3d405b'],
}

function structured(obj: unknown) {
  return {
    stop_reason: 'end_turn',
    content: [{ type: 'text', text: JSON.stringify(obj) }],
  }
}

function draft(name: string, colors: ColorRow[]) {
  return {
    name,
    rationale: 'rationale',
    colors: colors.map((c) => ({ role: c.role, light: c.light, dark: c.dark })),
  }
}

// A palette the SimulatedEngine repaired — guaranteed to pass the policy.
async function passingColors(): Promise<ColorRow[]> {
  const variations = await new SimulatedEngine().composeVariations(
    SOURCE,
    'analogous',
  )
  return variations[0].colors
}

// Break text in light mode so text-on-background / text-on-surface fail.
function breakText(colors: ColorRow[]): ColorRow[] {
  return colors.map((c) => (c.role === 'text' ? { ...c, light: '#cfcfcf' } : c))
}

describe('ClaudeEngine self-check + revise loop', () => {
  it('revises a failing palette until the code verifier passes it', async () => {
    const policy = loadContrastPolicy()
    const good = await passingColors()
    const bad = breakText(good)

    createMock.mockReset()
    createMock
      .mockResolvedValueOnce(structured({ palettes: [draft('A', bad)] }))
      .mockResolvedValueOnce(structured({ palettes: [draft('A', good)] }))

    const engine = new ClaudeEngine('test-key', 'claude-sonnet-4-6')
    const result = await engine.composeVariations(SOURCE, 'analogous')

    expect(createMock).toHaveBeenCalledTimes(2) // propose + one revise
    expect(policyFailures(result[0].colors, policy)).toHaveLength(0)
    expect(result[0].score.rationale).toBe('rationale') // the agent's rationale is kept
  })

  it('stops at maxRevisions and returns an honest (still-failing) palette rather than looping', async () => {
    const policy = loadContrastPolicy()
    const bad = breakText(await passingColors())

    createMock.mockReset()
    createMock.mockResolvedValue(structured({ palettes: [draft('A', bad)] }))

    const engine = new ClaudeEngine('test-key', 'claude-sonnet-4-6')
    const result = await engine.composeVariations(SOURCE, 'analogous')

    expect(createMock).toHaveBeenCalledTimes(3) // propose + MAX_REVISIONS (2)
    expect(policyFailures(result[0].colors, policy).length).toBeGreaterThan(0)
  })

  it('throws on a refusal so the chain surfaces as an error, not a crash on empty content', async () => {
    createMock.mockReset()
    createMock.mockResolvedValue({ stop_reason: 'refusal', content: [] })

    const engine = new ClaudeEngine('test-key', 'claude-sonnet-4-6')
    await expect(
      engine.composeVariations(SOURCE, 'analogous'),
    ).rejects.toThrow()
  })
})
