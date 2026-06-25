/**
 * The AI-direct PaletteEngine: the model authors whole palettes from a worded
 * brief. The deterministic engine is not in the loop here — `promptToPalettes`
 * returns full role colors and we only wrap them as addressable records. Routed to
 * by `get-engine.ts` for `source.type === 'prompt'`; see docs/plan-ai-model-direct.md.
 *
 * Failure surfaces, it doesn't fake: a transport error throws (→ the journey's
 * error round), and an empty/unparseable reply returns `[]` (→ the same
 * "no usable palettes" round the deterministic engine uses). No silent grey round.
 */

import type { ColorRow, Source } from '#/features/palette/types'
import { loadContrastPolicy } from '#/features/knowledge/contrast-policy'
import { nameFor } from '#/features/palette/namer'
import type {
  ComposeResult,
  PaletteEngine,
  ProgressFn,
} from '#/features/agent/engine'
import { finalizePalette } from '#/features/agent/engine'
import { promptToPalettes, toColorRows } from '#/features/agent/prompt-palettes'

/** Keep the model's name when it's fresh this journey; otherwise fall back to the
 *  deterministic namer so re-runs never show a duplicate. */
function uniqueName(preferred: string, colors: ColorRow[], seen: Set<string>): string {
  if (preferred && !seen.has(preferred)) {
    seen.add(preferred)
    return preferred
  }
  return nameFor(colors, 'Jewel', seen) // deterministic, adds itself to `seen`
}

export class ModelEngine implements PaletteEngine {
  async compose(
    source: Source,
    onProgress?: ProgressFn,
    _variation = 0,
    usedNames?: Iterable<string>,
  ): Promise<ComposeResult> {
    onProgress?.('Asking the color theorist…')
    const policy = loadContrastPolicy()
    const seen = new Set<string>(usedNames)

    const { message, palettes } = await promptToPalettes(source.value)
    return {
      message,
      palettes: palettes.map((p) => {
        const colors = toColorRows(p)
        return finalizePalette({
          // The palette's own accent is its signature color — a sensible seed for a
          // record authored from words, not seeded from a single color.
          seed: { type: 'color', value: p.roles.accent.dark },
          name: uniqueName(p.name, colors, seen),
          character: p.rationale,
          colors,
          policy,
        })
      }),
    }
  }
}
