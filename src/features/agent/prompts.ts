/**
 * Assembles the system prompt from the legible /knowledge layer. The same
 * markdown that guides proposals is rendered here as the rubric the agent must
 * satisfy — edit the knowledge, both the prompt and the self-check shift.
 */

import type { ContrastPolicy } from '#/features/palette/types'
import {
  getKnowledge,
  KNOWLEDGE_ORDER,
} from '#/features/knowledge/knowledge-loader'
import { loadContrastPolicy } from '#/features/knowledge/contrast-policy'

function targetText(
  target: ContrastPolicy['pairings'][number]['target'],
): string {
  if (target === 'AA') return 'AA (4.5:1)'
  if (target === 'AAA') return 'AAA (7:1)'
  return `${target}:1`
}

function renderPolicy(policy: ContrastPolicy): string {
  const lines = policy.pairings.map(
    (p) => `- ${p.pairing} — ${targetText(p.target)}`,
  )
  return [
    'Check every pairing below in BOTH light and dark. The baseline floor is AA',
    '(4.5:1) for all text pairings and is non-negotiable.',
    '',
    ...lines,
  ].join('\n')
}

export function assembleSystem(): string {
  const knowledge = KNOWLEDGE_ORDER.map((name) => getKnowledge(name))
    .filter(Boolean)
    .join('\n\n---\n\n')
  const policy = loadContrastPolicy()

  return [
    'You are the color expert inside palette-forge. From a source color or image you compose refined, accessible six-role palettes — background, surface, text, muted, accent, border — each with a LIGHT and a DARK hex.',
    'The design knowledge below is both your guide and your self-check rubric. Honor it.',
    '',
    '# Design knowledge',
    knowledge,
    '',
    '# Contrast rubric',
    renderPolicy(policy),
    '',
    '# Output rules',
    '- Return all six roles, each with a `light` and a `dark` hex in #rrggbb form.',
    '- Never use pure #ffffff or #000000 — keep a slight, deliberate tint in the neutrals.',
    '- Light and dark are both first-class: compose each intentionally, not by inversion.',
    '- The accent must be unmistakably distinct from the neutral family.',
    '- Aim to satisfy every contrast target; the app verifies your work and will ask you to revise pairings that fall short.',
    '- Respond with only the JSON the requested schema defines — no prose outside it.',
  ].join('\n')
}
