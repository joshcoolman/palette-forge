import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { Plugin } from 'vite'

const RUNS = resolve('eval/runs.jsonl')
const LATEST = resolve('eval/latest.json')

/**
 * Dev-only capture of AI palette-generation runs — our own tracing layer. The app
 * is browser-direct (no backend), so the dev server is the only thing that can write
 * to the repo: this middleware takes the raw model reply the client POSTs and appends
 * it to a local eval log, so "the JSON's in our log file" is literally true — no
 * devtools needed. `apply: 'serve'` means it exists ONLY on the dev server; the
 * production (Nitro/Vercel) build has no trace of it. See eval/README.md.
 */
export function evalCapture(): Plugin {
  return {
    name: 'eval-capture',
    apply: 'serve',
    configureServer(server) {
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
