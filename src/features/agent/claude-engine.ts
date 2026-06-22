/**
 * The real engine: a hand-written propose -> self-check -> revise loop over the
 * Anthropic Messages API (not a managed-agent SDK). Claude proposes palettes
 * guided by /knowledge via structured output; CODE computes the WCAG contrast
 * and feeds any failures back for revision before the user sees anything.
 */

import type AnthropicClient from '@anthropic-ai/sdk'

import type {
  ColorRow,
  Direction,
  Palette,
  PaletteType,
  Role,
  ScoredPalette,
  Seed,
  Source,
} from '#/features/palette/types'
import { PALETTE_TYPES, ROLES } from '#/features/palette/types'
import { policyFailures } from '#/features/color/contrast'
import { loadContrastPolicy } from '#/features/knowledge/contrast-policy'
import { makeClient } from '#/features/agent/client'
import { assembleSystem } from '#/features/agent/prompts'
import { finalizePalette } from '#/features/agent/engine'
import type { PaletteEngine, ProgressFn } from '#/features/agent/engine'

const SYSTEM = assembleSystem()
const VARIATION_COUNT = 4
const MAX_REVISIONS = 2
const MAX_TOKENS = 4096

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

const DIRECTIONS_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['directions'],
  properties: {
    directions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'character', 'preview', 'recommended'],
        properties: {
          type: { type: 'string', enum: PALETTE_TYPES },
          character: { type: 'string', description: 'one short line' },
          preview: {
            type: 'array',
            description: 'six representative light-mode hexes: background, surface, muted, border, accent, text',
            items: { type: 'string' },
          },
          recommended: { type: 'boolean' },
        },
      },
    },
  },
}

const VARIATIONS_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['palettes'],
  properties: {
    palettes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'rationale', 'colors'],
        properties: {
          name: { type: 'string' },
          rationale: { type: 'string', description: 'one short line' },
          colors: { type: 'array', items: COLOR_ITEM },
        },
      },
    },
  },
}

type DirectionDraft = {
  type: PaletteType
  character: string
  preview: string[]
  recommended: boolean
}

type PaletteDraft = {
  name: string
  rationale: string
  colors: { role: Role; light: string; dark: string }[]
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function toSeed(source: Source): Seed {
  return { type: source.type, value: source.value }
}

/** All six roles present once -> ordered rows; otherwise null (drop the draft). */
function toColorRows(colors: { role: Role; light: string; dark: string }[]): ColorRow[] | null {
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

export class ClaudeEngine implements PaletteEngine {
  private readonly client: AnthropicClient

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = makeClient(apiKey)
  }

  private async runStructured<T>(userText: string, schema: Record<string, unknown>): Promise<T> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: MAX_TOKENS,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userText }],
      output_config: { format: { type: 'json_schema', schema } },
    })
    if (response.stop_reason === 'refusal') {
      throw new Error('The model declined this request.')
    }
    const block = response.content.find((b) => b.type === 'text')
    const text = block && 'text' in block ? block.text : undefined
    if (!text) throw new Error('No structured output was returned.')
    return JSON.parse(text) as T
  }

  async proposeDirections(source: Source, onProgress?: ProgressFn): Promise<Direction[]> {
    onProgress?.('Reading your colors and sketching directions…')
    const colors = source.extracted.length > 0 ? source.extracted.join(', ') : source.value
    const userText = [
      `Source colors extracted from the user's ${source.type}: ${colors}.`,
      `Propose one direction for each palette type: ${PALETTE_TYPES.join(', ')}.`,
      'For each: a one-line character, six representative light-mode preview hexes (background, surface, muted, border, accent, text), and whether it is your single recommendation for this source.',
      'Recommend exactly one.',
    ].join('\n')

    const data = await this.runStructured<{ directions: DirectionDraft[] }>(
      userText,
      DIRECTIONS_SCHEMA,
    )

    let recommendedSeen = false
    return data.directions.map((d) => {
      const recommended = d.recommended && !recommendedSeen
      if (recommended) recommendedSeen = true
      return {
        type: d.type,
        label: capitalize(d.type),
        character: d.character,
        preview: d.preview,
        recommended,
      }
    })
  }

  async composeVariations(
    source: Source,
    type: PaletteType,
    steer?: string,
    onProgress?: ProgressFn,
  ): Promise<ScoredPalette[]> {
    const colors = source.extracted.length > 0 ? source.extracted.join(', ') : source.value
    const userText = [
      `Source colors: ${colors}.`,
      `Compose ${VARIATION_COUNT} distinct ${type} palettes from this source. Make them genuinely different from each other in temperature, value range, and mood — not minor tweaks of one idea.`,
      steer ? `Apply this steer to all of them: ${steer}.` : '',
      `Return exactly ${VARIATION_COUNT} palettes, each with all six roles (light and dark), a short name, and a one-line rationale.`,
    ]
      .filter(Boolean)
      .join('\n')

    return this.composeLoop(userText, type, toSeed(source), onProgress)
  }

  async refine(
    base: Palette,
    instruction: string,
    onProgress?: ProgressFn,
  ): Promise<ScoredPalette[]> {
    const type = (base as Partial<ScoredPalette>).type ?? 'analogous'
    const userText = [
      `The user kept this ${type} palette:`,
      colorsToText(base.colors),
      `Produce ${VARIATION_COUNT} refined variations of it, applying: ${instruction}.`,
      'Keep its essential character; change only what the instruction asks. Each with all six roles (light and dark), a short name, and a one-line rationale.',
    ].join('\n')

    return this.composeLoop(userText, type, base.seed, onProgress)
  }

  /** propose -> verify (code) -> revise the failing palettes -> finalize. */
  private async composeLoop(
    userText: string,
    type: PaletteType,
    seed: Seed,
    onProgress?: ProgressFn,
  ): Promise<ScoredPalette[]> {
    const policy = loadContrastPolicy()
    onProgress?.('Composing four takes…')
    let drafts = withRows(
      (await this.runStructured<{ palettes: PaletteDraft[] }>(userText, VARIATIONS_SCHEMA)).palettes,
    )
    onProgress?.('Checking every pairing for contrast…')

    for (let revision = 0; revision < MAX_REVISIONS; revision += 1) {
      const failing = drafts
        .map((draft, index) => ({ draft, index, failures: policyFailures(draft.rows, policy) }))
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
              .map((f) => `${f.pairing} (${f.mode}) is ${f.ratio}:1, needs ${f.required}:1`)
              .join('; ')}`,
          ].join('\n'),
        ),
      ].join('\n')

      const corrected = withRows(
        (await this.runStructured<{ palettes: PaletteDraft[] }>(reviseText, VARIATIONS_SCHEMA))
          .palettes,
      )
      failing.forEach((entry, k) => {
        const fix = corrected[k]
        if (fix) drafts[entry.index] = fix
      })
    }

    return drafts.map((draft) => {
      const palette = finalizePalette({ seed, name: draft.name, type, colors: draft.rows, policy })
      return {
        ...palette,
        score: { ...palette.score, rationale: draft.rationale || palette.score.rationale },
      }
    })
  }
}
