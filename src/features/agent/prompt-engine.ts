/**
 * Prompt-to-seed — the third input on-ramp, alongside image and seed color. The
 * model touches only the *input*: it reads a worded description and returns one
 * seed hex. The deterministic engine builds the whole round from that hex exactly
 * as it would from a curated swatch — the model never computes a palette, never a
 * role color, only the spark. See `knowledge/prompt.md` for the persona.
 *
 * Two failure modes, handled differently on purpose:
 *  - **Unparseable output** (model replied with prose, or no hex) — recover to the
 *    neutral seed and proceed. You still get a full round of palettes, just not a
 *    mood-matched one; that's a soft miss, not a dead end.
 *  - **Transport / API error** (no key, network down, 4xx/5xx) — `promptToSeed`
 *    rethrows so the caller can say "couldn't reach Anthropic", mirroring rename.
 *    A silent grey round here would let a broken key masquerade as a bad guess.
 */

import { collect } from '#/features/agent/client'
import { getKnowledge, KNOWLEDGE_ORDER } from '#/features/knowledge/knowledge-loader'
import { normalizeHex } from '#/features/color/color-utils'

/** The first-run neutral, reused as the soft fallback when the model returns no
 *  usable hex — a calm grey round beats a crash. */
export const NEUTRAL_SEED = '#8d8d8f'

/** A 6-digit hex run sitting on its own (not part of a longer hex string), so a
 *  reply like "ember — #e76f2c" or a bare "e76f2c" both yield the color. */
const HEX_RUN = /(?<![0-9a-f])#?([0-9a-f]{6})(?![0-9a-f])/i

/**
 * Pull a normalized `#rrggbb` out of the model's reply, or `null` if there isn't
 * one. Tries the whole trimmed string first (the clean case — the persona asks for
 * only the hex), then scans for a hex run anywhere in case the model wrapped it in
 * prose. Pure and exported so the parsing — the one part with real edge cases — is
 * unit-tested.
 */
export function parseSeedHex(raw: string): string | null {
  const direct = normalizeHex(raw.trim())
  if (direct) return direct
  const match = HEX_RUN.exec(raw)
  return match ? normalizeHex(match[1]!) : null
}

/**
 * Ask the model for the seed hex that best captures `prompt`. Resolves to a valid
 * `#rrggbb` — the model's pick, or `NEUTRAL_SEED` if it returned no usable hex.
 * Throws only on a transport/API error (see the file header). The `/knowledge`
 * prose is the system context, so editing `palettes.md` / `characters.md`
 * measurably steers the result.
 */
export async function promptToSeed(prompt: string): Promise<string> {
  const system = [getKnowledge('prompt.md'), ...KNOWLEDGE_ORDER.map(getKnowledge)]
    .filter(Boolean)
    .join('\n\n---\n\n')

  const raw = await collect({
    system,
    maxTokens: 24, // a hex and nothing else; keep the model from wandering
    messages: [{ role: 'user', content: prompt }],
  })

  const seed = parseSeedHex(raw)
  if (!seed) {
    console.warn('[prompt] model returned no usable hex:', JSON.stringify(raw))
    return NEUTRAL_SEED
  }
  return seed
}
