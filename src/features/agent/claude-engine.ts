/**
 * The real engine: a hand-written propose -> self-check -> revise loop over the
 * Anthropic Messages API (not a managed-agent SDK). Claude proposes palettes
 * guided by /knowledge via structured output; CODE computes the WCAG contrast
 * and feeds any failures back for revision before the user sees anything.
 */

import type AnthropicClient from '@anthropic-ai/sdk'

import type {
  ColorRow,
  Palette,
  Role,
  ScoredPalette,
  Seed,
  Source,
} from '#/features/palette/types'
import { ROLES } from '#/features/palette/types'
import { policyFailures } from '#/features/color/contrast'
import { rasterizeSmall } from '#/features/color/dominant-color'
import { loadContrastPolicy } from '#/features/knowledge/contrast-policy'
import { makeClient } from '#/features/agent/client'
import { assembleSystem } from '#/features/agent/prompts'
import { finalizePalette } from '#/features/agent/engine'
import type { PaletteEngine, ProgressFn } from '#/features/agent/engine'

const SYSTEM = assembleSystem()
const VARIATION_COUNT = 4
const MAX_REVISIONS = 2
const MAX_TOKENS = 8192

const COLOR_ITEM = {
  type: 'object',
  additionalProperties: false,
  required: ['role', 'light', 'dark'],
  properties: {
    role: { type: 'string', enum: ROLES },
    light: { type: 'string', description: 'hex #rrggbb' },
    dark: { type: 'string', description: 'hex #rrggbb' },
  },
}

const PALETTES_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['palettes'],
  properties: {
    palettes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'character', 'colors'],
        properties: {
          name: { type: 'string' },
          character: {
            type: 'string',
            description: 'one short line — the mood/character of this take',
          },
          colors: { type: 'array', items: COLOR_ITEM },
        },
      },
    },
  },
}

type PaletteDraft = {
  name: string
  character: string
  colors: { role: Role; light: string; dark: string }[]
}

function toSeed(source: Source): Seed {
  return { type: source.type, value: source.value }
}

/** All six roles present once -> ordered rows; otherwise null (drop the draft). */
function toColorRows(
  colors: { role: Role; light: string; dark: string }[],
): ColorRow[] | null {
  const byRole = new Map(colors.map((c) => [c.role, c]))
  const rows: ColorRow[] = []
  for (const role of ROLES) {
    const c = byRole.get(role)
    if (!c) return null
    rows.push({ role, light: c.light, dark: c.dark })
  }
  return rows
}

function colorsToText(rows: ColorRow[]): string {
  return rows.map((r) => `${r.role}: ${r.light} / ${r.dark}`).join('\n')
}

type ValidDraft = PaletteDraft & { rows: ColorRow[] }

function withRows(palettes: PaletteDraft[]): ValidDraft[] {
  return palettes
    .map((p) => ({ ...p, rows: toColorRows(p.colors) }))
    .filter((p): p is ValidDraft => p.rows !== null)
}

/**
 * The 120px sampled bitmap as a base64 PNG — what the vision-capable agent
 * actually looks at, so it works from the real image, not six quantized hexes.
 * Null for seed-color sources (nothing to see) and outside the browser.
 */
type ImageInput = { media_type: 'image/png'; data: string }

async function imageInputFor(source: {
  type: string
  value: string
}): Promise<ImageInput | null> {
  if (source.type !== 'image') return null
  const canvas = await rasterizeSmall(source.value, 120)
  if (!canvas) return null
  const data = canvas.toDataURL('image/png').split(',').at(1) ?? ''
  return data ? { media_type: 'image/png', data } : null
}

export class ClaudeEngine implements PaletteEngine {
  private readonly client: AnthropicClient

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = makeClient(apiKey)
  }

  private async runStructured<T>(
    userText: string,
    schema: Record<string, unknown>,
    image?: ImageInput | null,
  ): Promise<T> {
    const content = image
      ? [
          {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: image.media_type,
              data: image.data,
            },
          },
          { type: 'text' as const, text: userText },
        ]
      : userText
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: MAX_TOKENS,
      system: [
        { type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content }],
      output_config: { format: { type: 'json_schema', schema } },
    })
    if (response.stop_reason === 'refusal') {
      throw new Error(
        'The model declined this request. Try a different source.',
      )
    }
    if (response.stop_reason === 'max_tokens') {
      throw new Error('The response ran past the length limit. Try again.')
    }
    const block = response.content.find((b) => b.type === 'text')
    const text = block && 'text' in block ? block.text : undefined
    if (!text) throw new Error('The model returned no palettes. Try again.')
    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error('The response was cut off or malformed. Try again.')
    }
  }

  async compose(
    source: Source,
    steer?: string,
    onProgress?: ProgressFn,
  ): Promise<ScoredPalette[]> {
    const image = await imageInputFor(source)
    const colors =
      source.extracted.length > 0 ? source.extracted.join(', ') : source.value
    const intro = image
      ? `A 120px sample of the user's image is attached — read its full color story, not just the hints. Dominant colors sampled from it: ${colors}.`
      : `Source color: ${colors}.`
    // The mood-board seam: an optional color-related prompt rides alongside.
    const steers = [source.prompt, steer].filter(Boolean) as string[]
    const userText = [
      intro,
      `From this, produce ${VARIATION_COUNT} distinct UI color palettes — each a different character you read from the source (e.g. bright & punchy, muted & professional, dark & intense, soft & calm — whatever the source actually suggests). Surprise me.`,
      `Make the ${VARIATION_COUNT} genuinely different in character and energy, not minor tweaks of one idea.`,
      steers.length
        ? `Honor this steer across all of them: ${steers.join('; ')}.`
        : '',
      `Return exactly ${VARIATION_COUNT} palettes, each with all six roles (light and dark), a short name, and a one-line character.`,
    ]
      .filter(Boolean)
      .join('\n')

    return this.composeLoop(userText, toSeed(source), onProgress, image)
  }

  async refine(
    base: Palette,
    instruction: string,
    onProgress?: ProgressFn,
  ): Promise<ScoredPalette[]> {
    const image = await imageInputFor(base.seed)
    const userText = [
      image ? "A 120px sample of the user's source image is attached." : '',
      'The user kept this palette:',
      colorsToText(base.colors),
      `Produce ${VARIATION_COUNT} refined variations of it, applying: ${instruction}.`,
      'Keep its essential character; change only what the instruction asks. Each with all six roles (light and dark), a short name, and a one-line character.',
    ]
      .filter(Boolean)
      .join('\n')

    return this.composeLoop(userText, base.seed, onProgress, image)
  }

  /** propose -> verify (code) -> revise the failing palettes -> finalize. */
  private async composeLoop(
    userText: string,
    seed: Seed,
    onProgress?: ProgressFn,
    image?: ImageInput | null,
  ): Promise<ScoredPalette[]> {
    const policy = loadContrastPolicy()
    onProgress?.('Composing four takes…')
    const drafts = withRows(
      (
        await this.runStructured<{ palettes: PaletteDraft[] }>(
          userText,
          PALETTES_SCHEMA,
          image,
        )
      ).palettes,
    )
    onProgress?.('Checking every pairing for contrast…')

    for (let revision = 0; revision < MAX_REVISIONS; revision += 1) {
      const failing = drafts
        .map((draft, index) => ({
          draft,
          index,
          failures: policyFailures(draft.rows, policy),
        }))
        .filter((entry) => entry.failures.length > 0)
      if (failing.length === 0) break
      onProgress?.(
        `Reworking ${failing.length} ${failing.length === 1 ? 'palette' : 'palettes'} that missed a target…`,
      )

      const reviseText = [
        'These palettes fall short of the contrast rubric. Return corrected full palettes (all six roles, light and dark), keeping each name and overall character, fixing only what is needed to pass every target.',
        '',
        ...failing.map((entry) =>
          [
            `Palette "${entry.draft.name}":`,
            colorsToText(entry.draft.rows),
            `Failures: ${entry.failures
              .map(
                (f) =>
                  `${f.pairing} (${f.mode}) is ${f.ratio}:1, needs ${f.required}:1`,
              )
              .join('; ')}`,
          ].join('\n'),
        ),
      ].join('\n')

      const corrected = withRows(
        (
          await this.runStructured<{ palettes: PaletteDraft[] }>(
            reviseText,
            PALETTES_SCHEMA,
          )
        ).palettes,
      )
      failing.forEach((entry, k) => {
        const fix = corrected.at(k)
        if (fix) drafts[entry.index] = fix
      })
    }

    return drafts.map((draft) =>
      finalizePalette({
        seed,
        name: draft.name,
        character: draft.character,
        colors: draft.rows,
        policy,
      }),
    )
  }
}
