import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { Plugin } from 'vite'

const RUNS = resolve('eval/runs.jsonl')
const LATEST = resolve('eval/latest.json')
const PROMPTS = resolve('eval/prompts.md')

/**
 * Parse the runnable briefs out of `eval/prompts.md`: each `## heading` whose body
 * opens with a `> ` blockquote is a prompt (the blockquote is the brief). Sections
 * without one (the intro, "How to use") are skipped. Kept here, server-side, so the
 * briefs are never bundled into the client and a new prompt needs no rebuild.
 */
function parsePrompts(
  md: string,
): { id: string; label: string; brief: string }[] {
  const out: { id: string; label: string; brief: string }[] = []
  for (const section of md.split(/^## /m).slice(1)) {
    const nl = section.indexOf('\n')
    const heading = (nl === -1 ? section : section.slice(0, nl)).trim()
    const body = nl === -1 ? '' : section.slice(nl + 1)
    const quote: string[] = []
    let started = false
    for (const line of body.split('\n')) {
      if (line.startsWith('>')) {
        started = true
        quote.push(line.replace(/^>\s?/, '').trim())
      } else if (started) {
        break // first blockquote run ended
      }
    }
    const brief = quote.join(' ').trim()
    if (!brief) continue
    const id = (heading.split('—')[0] ?? heading).trim() || heading
    out.push({ id, label: heading, brief })
  }
  return out
}

/**
 * Dev-only capture of AI palette-generation runs — our own tracing layer. The app
 * is browser-direct (no backend), so the dev server is the only thing that can write
 * to the repo: this middleware takes the raw model reply the client POSTs and appends
 * it to a local eval log, so "the JSON's in our log file" is literally true — no
 * devtools needed. `apply: 'serve'` means it exists ONLY on the dev server; the
 * production (Nitro/Vercel) build has no trace of it. See eval/README.md.
 *
 * Also serves `GET /__eval/prompts` — the briefs from `eval/prompts.md` — so a dev-only
 * runner can pick one and fire it without the popover click-through.
 */
export function evalCapture(): Plugin {
  return {
    name: 'eval-capture',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__eval/prompts', (req, res, next) => {
        if (req.method !== 'GET') return next()
        res.setHeader('content-type', 'application/json')
        try {
          res.end(JSON.stringify(parsePrompts(readFileSync(PROMPTS, 'utf8'))))
        } catch {
          res.end('[]') // no prompts file yet → empty list, runner hides itself
        }
      })

      server.middlewares.use('/__eval/run', (req, res, next) => {
        if (req.method !== 'POST') return next()
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          try {
            const { brief, model, raw } = JSON.parse(body) as {
              brief: string
              model: string
              raw: string
            }
            // Stamp server-side so the log is ordered by when it landed.
            const record = { at: new Date().toISOString(), model, brief, raw }
            mkdirSync(dirname(RUNS), { recursive: true })
            appendFileSync(RUNS, JSON.stringify(record) + '\n') // durable history
            writeFileSync(LATEST, JSON.stringify(record, null, 2)) // last run, pretty
            res.statusCode = 204
            res.end()
          } catch {
            res.statusCode = 400
            res.end()
          }
        })
      })
    },
  }
}
