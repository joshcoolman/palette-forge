/**
 * Model-authored palettes — the AI-direct generation path. The model reads the
 * brief and authors whole palettes (every role, both modes); the deterministic
 * engine is no longer in the loop here. See docs/plan-ai-model-direct.md.
 *
 * The contract is prose, not code: the system prompt is `/knowledge` markdown sent
 * **verbatim** (see `generationSystemPrompt`), including the JSON format spec. There
 * is no tool-use schema — getting consistent, well-formed JSON is the prompt-craft
 * problem, and the lever is editing `knowledge/color-theorist.md`, not this file.
 * Reliability here is parse-and-validate: malformed palettes are dropped; the caller
 * decides the fallback (the deterministic engine) when too few survive.
 */

import { collect } from '#/features/agent/client'
import { getKnowledge } from '#/features/knowledge/knowledge-loader'
import { normalizeHex } from '#/features/color/color-utils'
import { captureRun } from '#/lib/eval-capture'
import { ROLES } from '#/features/palette/types'
import type { ColorRow, Role } from '#/features/palette/types'

/**
 * The ordered `/knowledge` files that compose the generation system prompt, joined
 * verbatim. One file today (the role is self-contained); layering theory docs is just
 * adding entries here — the composition stays a plain, readable concatenation.
 */
export const GENERATION_KNOWLEDGE = ['color-theorist.md'] as const

export type RoleColors = { light: string; dark: string }
export type ModelPalette = {
  name: string
  rationale?: string
  roles: Record<Role, RoleColors>
}

/**
 * The verbatim system prompt: the ordered knowledge files concatenated. What you read
 * in `/knowledge` is exactly what the model receives — nothing assembled in code.
 */
/**
 * Dev-only role override for the eval bar's role picker. When set (DEV only), generation
 * uses this knowledge file as the system prompt instead of the shipped default, so an
 * alternate persona (e.g. `interior-designer.md`) can be A/B'd against `color-theorist.md`.
 * Never set in production — the live app always uses `GENERATION_KNOWLEDGE`.
 */
let devRoleOverride: string | null = null

export function setGenerationRoleOverride(file: string | null): void {
  if (import.meta.env.DEV) devRoleOverride = file
}

/** The role file generation will use right now — the dev override if set, else the
 *  shipped default. Used to stamp eval runs so each is self-describing (role × brief). */
export function currentGenerationRole(): string {
  return (import.meta.env.DEV && devRoleOverride) || GENERATION_KNOWLEDGE[0]
}

export function generationSystemPrompt(): string {
  const files =
    import.meta.env.DEV && devRoleOverride ? [devRoleOverride] : GENERATION_KNOWLEDGE
  return files
    .map(getKnowledge)
    .filter(Boolean)
    .join('\n\n---\n\n')
}

/**
 * Pull the JSON array out of the model's reply, tolerant of stray prose or code
 * fences (we ask for JSON-only, but don't trust it). Returns the parsed array, or
 * null if there isn't a usable one.
 */
export function extractJsonArray(raw: string): unknown[] | null {
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) return null
  try {
    const parsed: unknown = JSON.parse(raw.slice(start, end + 1))
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function asRoleColors(v: unknown): RoleColors | null {
  if (typeof v !== 'object' || v === null) return null
  const { light, dark } = v as Record<string, unknown>
  const l = typeof light === 'string' ? normalizeHex(light) : null
  const d = typeof dark === 'string' ? normalizeHex(dark) : null
  return l && d ? { light: l, dark: d } : null
}

/**
 * Validate + normalize one object into a `ModelPalette`, or null if any of the seven
 * roles is missing or any hex is invalid. Strict on purpose: a malformed palette is
 * dropped rather than rendered half-broken.
 */
export function toModelPalette(obj: unknown): ModelPalette | null {
  if (typeof obj !== 'object' || obj === null) return null
  const o = obj as Record<string, unknown>
  if (typeof o.roles !== 'object' || o.roles === null) return null
  const r = o.roles as Record<string, unknown>

  const roles = {} as Record<Role, RoleColors>
  for (const role of ROLES) {
    const rc = asRoleColors(r[role])
    if (!rc) return null
    roles[role] = rc
  }

  const name = typeof o.name === 'string' && o.name.trim() ? o.name.trim() : 'Untitled'
  const rationale =
    typeof o.rationale === 'string' && o.rationale.trim()
      ? o.rationale.trim()
      : undefined
  return { name, rationale, roles }
}

/** Parse the model's reply into validated palettes, dropping any malformed one. */
export function parseModelPalettes(raw: string): ModelPalette[] {
  const arr = extractJsonArray(raw)
  if (!arr) return []
  return arr
    .map(toModelPalette)
    .filter((p): p is ModelPalette => p !== null)
}

export type ModelResponse = { message?: string; palettes: ModelPalette[] }

/**
 * Parse the full reply into the model's friendly message + the validated palettes.
 * The contract is `{ "message": "…", "palettes": [ … ] }`; tolerant of a bare array
 * (no message) and of a malformed object wrapper (falls back to scanning for the
 * palettes array). The message is the model talking to the user; palettes are the goods.
 */
export function parseModelResponse(raw: string): ModelResponse {
  const objStart = raw.indexOf('{')
  const arrStart = raw.indexOf('[')
  // Object form leads when a `{` precedes any `[` — try it for the message; a bad
  // wrapper falls through to the bare-array scan below (which still finds the palettes).
  if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
    try {
      const o: unknown = JSON.parse(raw.slice(objStart, raw.lastIndexOf('}') + 1))
      if (o && typeof o === 'object') {
        const rec = o as Record<string, unknown>
        const message =
          typeof rec.message === 'string' && rec.message.trim()
            ? rec.message.trim()
            : undefined
        const arr = Array.isArray(rec.palettes) ? rec.palettes : []
        return {
          message,
          palettes: arr
            .map(toModelPalette)
            .filter((p): p is ModelPalette => p !== null),
        }
      }
    } catch {
      // fall through
    }
  }
  return { palettes: parseModelPalettes(raw) }
}

/** A model palette as the engine's `ColorRow[]` (all seven roles), ready for
 *  `finalizePalette`. */
export function toColorRows(p: ModelPalette): ColorRow[] {
  return ROLES.map((role) => ({
    role,
    light: p.roles[role].light,
    dark: p.roles[role].dark,
  }))
}

/**
 * Ask the color-theorist persona for six palettes that answer `brief`. Resolves to
 * the validated set (possibly fewer than six if the model malformed some, or empty if
 * it returned nothing usable — the caller decides the fallback). Throws only on a
 * transport/API error.
 *
 * No model override: the call respects the user's Settings picker so haiku/sonnet can
 * be A/B'd in an eval. Sonnet is the recommended pick — six palettes is 84 hexes plus
 * strict JSON, which haiku is likelier to malform.
 */
export async function promptToPalettes(brief: string): Promise<ModelResponse> {
  const raw = await collect({
    system: generationSystemPrompt(),
    maxTokens: 4096,
    messages: [{ role: 'user', content: brief }],
  })

  if (import.meta.env.DEV) {
    // Dev observability: see exactly what the model returned while massaging the
    // prompt — in the console, and captured to eval/runs.jsonl for later review.
    console.log('[generate] raw model reply:\n', raw)
  }
  captureRun(brief, raw, currentGenerationRole())

  const result = parseModelResponse(raw)
  if (result.palettes.length === 0) {
    console.warn(
      '[generate] no usable palettes parsed from reply:',
      JSON.stringify(raw.slice(0, 500)),
    )
  }
  return result
}
