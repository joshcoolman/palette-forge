#!/usr/bin/env node
/**
 * Headless eval runner — calls the Anthropic API directly using the same system
 * prompt and golden briefs the in-app dev runner uses, but with no running app.
 *
 * Claude Code uses this to iterate on knowledge/color-theorist.md autonomously:
 * edit the system prompt, run a brief, read the output, repeat. The dev-UI banner
 * (eval-runner.tsx) stays for visual smoke tests; this is for fast iteration.
 *
 * Usage:
 *   pnpm eval               — run all briefs in eval/prompts.md
 *   pnpm eval lawn-care     — run one brief by ID (partial match, case-insensitive)
 *
 * Requires ANTHROPIC_API_KEY in .env.local (loaded via --env-file in the pnpm script).
 * Optional: ANTHROPIC_MODEL=sonnet (defaults to haiku — cheap for iteration).
 *
 * Output is written to eval/runs.jsonl + eval/latest.json (same format as the Vite
 * capture middleware) so both paths feed the same log.
 */

import { readFileSync, appendFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const RUNS = resolve(ROOT, 'eval/runs.jsonl')
const LATEST = resolve(ROOT, 'eval/latest.json')
const PROMPTS = resolve(ROOT, 'eval/prompts.md')
const KNOWLEDGE_DIR = resolve(ROOT, 'knowledge')

const ROLES = ['background', 'surface', 'text', 'muted', 'accent', 'border', 'secondary']

const MODEL_ALIASES = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
}

function resolveModel(m) {
  if (!m) return MODEL_ALIASES.haiku
  return MODEL_ALIASES[m.toLowerCase()] ?? m
}

// --- Prompt parsing (mirrors vite/eval-capture.ts:parsePrompts, extended with mustNot) ---

function parsePrompts(md) {
  const out = []
  for (const section of md.split(/^## /m).slice(1)) {
    const nl = section.indexOf('\n')
    const heading = (nl === -1 ? section : section.slice(0, nl)).trim()
    const body = nl === -1 ? '' : section.slice(nl + 1)

    const quote = []
    let started = false
    for (const line of body.split('\n')) {
      if (line.startsWith('>')) {
        started = true
        quote.push(line.replace(/^>\s?/, '').trim())
      } else if (started) {
        break
      }
    }
    const brief = quote.join(' ').trim()
    if (!brief) continue

    const mustNotMatch = body.match(/\*\*Must-not:\*\*\s*(.+)/)
    const mustNot = mustNotMatch?.[1]?.trim() ?? null

    const id = (heading.split('—')[0] ?? heading).trim() || heading
    out.push({ id, label: heading, brief, mustNot })
  }
  return out
}

// --- Response parsing (mirrors src/features/agent/prompt-palettes.ts) ---

function normalizeHex(h) {
  const s = h.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s.toLowerCase()}`
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    const [r, g, b] = s
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return null
}

function asRoleColors(v) {
  if (typeof v !== 'object' || v === null) return null
  const l = typeof v.light === 'string' ? normalizeHex(v.light) : null
  const d = typeof v.dark === 'string' ? normalizeHex(v.dark) : null
  return l && d ? { light: l, dark: d } : null
}

function toModelPalette(obj) {
  if (typeof obj !== 'object' || obj === null) return null
  if (typeof obj.roles !== 'object' || obj.roles === null) return null
  const roles = {}
  for (const role of ROLES) {
    const rc = asRoleColors(obj.roles[role])
    if (!rc) return null
    roles[role] = rc
  }
  const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : 'Untitled'
  const rationale =
    typeof obj.rationale === 'string' && obj.rationale.trim() ? obj.rationale.trim() : undefined
  return { name, rationale, roles }
}

function parseModelResponse(raw) {
  const objStart = raw.indexOf('{')
  const arrStart = raw.indexOf('[')
  if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
    try {
      const o = JSON.parse(raw.slice(objStart, raw.lastIndexOf('}') + 1))
      if (o && typeof o === 'object') {
        const message =
          typeof o.message === 'string' && o.message.trim() ? o.message.trim() : undefined
        const arr = Array.isArray(o.palettes) ? o.palettes : []
        return { message, palettes: arr.map(toModelPalette).filter(Boolean) }
      }
    } catch {
      // fall through to bare-array scan
    }
  }
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) return { palettes: [] }
  try {
    const arr = JSON.parse(raw.slice(start, end + 1))
    return { palettes: Array.isArray(arr) ? arr.map(toModelPalette).filter(Boolean) : [] }
  } catch {
    return { palettes: [] }
  }
}

// --- Run one prompt ---

async function runPrompt(client, model, prompt) {
  const systemPrompt = readFileSync(resolve(KNOWLEDGE_DIR, 'color-theorist.md'), 'utf8')

  console.log(`\n── ${prompt.label} ──`)
  console.log(`Brief: ${prompt.brief}\n`)

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt.brief }],
  })

  const raw = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')

  const { message, palettes } = parseModelResponse(raw)

  if (message) console.log(`Model: "${message}"\n`)

  if (palettes.length === 0) {
    console.error('⚠  No usable palettes parsed. Raw reply:')
    console.error(raw.slice(0, 800))
    return { prompt, raw, palettes: [] }
  }

  for (const [i, p] of palettes.entries()) {
    const bg = p.roles.background
    const accent = p.roles.accent
    const label = p.rationale ? `  — ${p.rationale}` : ''
    console.log(`  ${i + 1}. "${p.name}"${label}`)
    console.log(`     bg: ${bg.light} / ${bg.dark}   accent: ${accent.light} / ${accent.dark}`)
  }

  const count = `${palettes.length} palette${palettes.length === 1 ? '' : 's'} parsed`
  const mustNotNote = prompt.mustNot ? `  ·  ⚠ must-not: ${prompt.mustNot}` : ''
  console.log(`\n${count}${mustNotNote}`)

  const record = { at: new Date().toISOString(), model, brief: prompt.brief, raw }
  mkdirSync(dirname(RUNS), { recursive: true })
  appendFileSync(RUNS, JSON.stringify(record) + '\n')
  // latest.json gets a `parsed` field so it opens as readable structured JSON in an editor.
  // runs.jsonl stays raw-only (the shared format with the Vite capture middleware).
  writeFileSync(LATEST, JSON.stringify({ ...record, parsed: { message, palettes } }, null, 2))
  console.log('→ saved to eval/runs.jsonl + eval/latest.json\n')

  return { prompt, raw, palettes }
}

// --- Entry point ---

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey?.trim()) {
    console.error('Error: ANTHROPIC_API_KEY not set.')
    console.error('Add it to .env.local and run via: pnpm eval')
    process.exit(1)
  }

  const model = resolveModel(process.env.ANTHROPIC_MODEL)
  const filter = process.argv[2]

  let all
  try {
    all = parsePrompts(readFileSync(PROMPTS, 'utf8'))
  } catch {
    console.error(`Error: could not read ${PROMPTS}`)
    process.exit(1)
  }

  const selected = filter
    ? all.filter((p) => p.id.toLowerCase().includes(filter.toLowerCase()))
    : all

  if (selected.length === 0) {
    const ids = all.map((p) => p.id).join(', ')
    console.error(`No prompts found${filter ? ` matching "${filter}"` : ''}.`)
    console.error(`Available: ${ids}`)
    process.exit(1)
  }

  console.log(`Model: ${model}`)

  const client = new Anthropic({ apiKey })

  for (const prompt of selected) {
    await runPrompt(client, model, prompt)
  }

  if (selected.length > 1) {
    console.log(`Done — ran ${selected.length} prompt${selected.length === 1 ? '' : 's'}.`)
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
