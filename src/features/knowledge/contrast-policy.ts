/**
 * Parses the machine-readable contrast POLICY from `knowledge/contrast.md`
 * frontmatter and feeds it to both the agent (rubric) and the code verifier.
 * Degrades to the welded BASELINE rather than throwing — a malformed markdown
 * edit can never brick the app or drop below the AA floor.
 */

import type {
  ContrastPolicy,
  ContrastTarget,
  PolicyPairing,
} from '#/features/palette/types'
import { BASELINE } from '#/features/color/contrast'
import { getKnowledge } from '#/features/knowledge/knowledge-loader'

function extractFrontmatter(markdown: string): string | null {
  const text = markdown.replace(/^\uFEFF/, '')
  if (!text.startsWith('---')) return null
  const end = text.indexOf('\n---', 3)
  if (end === -1) return null
  return text.slice(3, end)
}

function parseTarget(raw: string): ContrastTarget | null {
  if (raw === 'AA' || raw === 'AAA') return raw
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Ensure the welded baseline pairings are always present. */
function mergeBaseline(policy: ContrastPolicy): ContrastPolicy {
  const pairings = [...policy.pairings]
  for (const base of BASELINE.pairings) {
    if (!pairings.some((p) => p.pairing === base.pairing)) pairings.push(base)
  }
  return { baseline: policy.baseline, pairings }
}

export function parseContrastPolicy(markdown: string): ContrastPolicy {
  const fm = extractFrontmatter(markdown)
  if (!fm) return BASELINE

  const baseline =
    /baseline:\s*(AAA|AA)\b/.exec(fm)?.[1] === 'AAA' ? 'AAA' : 'AA'

  const pairings: PolicyPairing[] = []
  const lineRe = /^\s*-\s*([a-z][a-z-]*):\s*(AAA|AA|\d+(?:\.\d+)?)\s*$/gim
  for (const match of fm.matchAll(lineRe)) {
    const target = parseTarget(match[2]!) // groups 1 and 2 are present on a match
    if (target !== null) pairings.push({ pairing: match[1]!, target })
  }

  if (pairings.length === 0) return BASELINE
  return mergeBaseline({ baseline, pairings })
}

/** The active policy, parsed from the bundled `contrast.md`. */
export function loadContrastPolicy(): ContrastPolicy {
  return parseContrastPolicy(getKnowledge('contrast.md'))
}
