/**
 * AI name suggestions — the optional, additive half of rename. Manual editing is
 * the base feature (it needs no model); this offers Haiku-generated alternatives
 * when a key is present. The deterministic `nameFor()` name is always already on
 * the card, so AI here is pure enrichment: it suggests, the user chooses.
 *
 * Unlike a silent one-shot, `suggestNames` throws on an API error so the dialog
 * can show "couldn't reach Anthropic" rather than failing invisibly. Each
 * candidate is validated to a clean two-word name; junk is dropped.
 */

import { collect } from '#/features/agent/client'
import { getKnowledge } from '#/features/knowledge/knowledge-loader'
import type { Palette, Role } from '#/features/palette/types'

/** The roles worth handing the model, in read order: ground and its family, then
 *  the accent surprise. Dark mode is the hero composition the cards open on. */
const DESCRIBE_ROLES: Role[] = ['background', 'surface', 'text', 'accent']

function describe(palette: Palette): string {
  const lines = DESCRIBE_ROLES.map((role) => {
    const hex = palette.colors.find((c) => c.role === role)?.dark
    return hex ? `${role}: ${hex}` : null
  }).filter(Boolean)
  return `A palette:\n${lines.join('\n')}`
}

// A clean two-word name: two capitalized words of letters (with optional internal
// apostrophe or hyphen), nothing else. Deliberately strict — a name is cheap to
// reject, and a malformed one is worse than the solid deterministic fallback.
const TWO_WORDS = /^[A-Z][a-z'’-]+ [A-Z][a-z'’-]+$/

/**
 * Turn one line of the model's text into a usable name, or `null` if it isn't one.
 * Trims, drops wrapping quotes / a trailing period, collapses whitespace, then
 * enforces the two-word shape and a length cap. Pure and exported so the
 * validation — the one part with real edge cases — is unit-tested.
 */
export function parseModelName(raw: string): string | null {
  const name = raw
    .trim()
    .replace(/^["'“”]+|["'“”.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return name.length <= 30 && TWO_WORDS.test(name) ? name : null
}

/**
 * Parse the model's multi-line reply into up to `max` distinct valid names. Strips
 * any list markers the model adds despite instructions (`1.`, `-`, `•`), validates
 * each line, and dedupes — so a sloppy reply still yields clean options.
 */
export function parseNameList(raw: string, max = 4): string[] {
  const out: string[] = []
  for (const line of raw.split('\n')) {
    const stripped = line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '')
    const name = parseModelName(stripped)
    if (name && !out.includes(name)) out.push(name)
    if (out.length >= max) break
  }
  return out
}

/**
 * Ask the model for `count` distinct two-word names. Resolves to the validated,
 * deduped list (possibly fewer than `count`, or empty if the model returned only
 * junk — the dialog offers Regenerate). Throws on no key, network error, or API
 * error so the caller can surface it.
 */
export async function suggestNames(
  palette: Palette,
  count = 4,
): Promise<string[]> {
  let raw: string
  try {
    raw = await collect({
      system: getKnowledge('naming.md'),
      model: 'haiku',
      maxTokens: 80,
      messages: [
        {
          role: 'user',
          content: `${describe(palette)}\n\nSuggest ${count} distinct names, one per line. No numbering, no extra text.`,
        },
      ],
    })
  } catch (err) {
    console.error('[rename] Anthropic call failed:', err)
    throw err instanceof Error ? err : new Error('Rename request failed')
  }

  const names = parseNameList(raw, count)
  if (names.length === 0) {
    console.warn('[rename] model returned no usable two-word names:', JSON.stringify(raw))
  }
  return names
}
