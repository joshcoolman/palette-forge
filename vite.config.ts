import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
// The Nitro plugin compiles the SSR entry into deployable server functions. Vercel
// auto-detects Nitro and serves them; without it the build is a plain Vite SSR
// `dist/` that Vercel can't route, so every page 404s.
import { nitro } from 'nitro/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev-only: capture AI palette runs to eval/runs.jsonl (no production surface).
import { evalCapture } from './vite/eval-capture'

const config = defineConfig(({ command, mode }) => {
  // Dev convenience: bridge a local `.env.local` ANTHROPIC_API_KEY into the
  // client so the AI affordances (incl. the dev eval bar) light up without
  // pasting a key into the UI. Injected ONLY for `vite dev` (`command === 'serve'`);
  // every build emits an empty string, so a hosted build (Vercel) never embeds the
  // key and ignores it even if the env var is set there. The key reaches the
  // browser only on your machine — same trust model as the BYO-key design.
  const env = loadEnv(mode, process.cwd(), '')
  const devKey = command === 'serve' ? (env.ANTHROPIC_API_KEY ?? '') : ''

  return {
    define: {
      __DEV_ANTHROPIC_KEY__: JSON.stringify(devKey),
    },
    // Honor a PORT env var (preview/CI assign one) and fall back to 3000.
    server: { port: process.env.PORT ? Number(process.env.PORT) : 3000 },
    resolve: { tsconfigPaths: true },
    // evalCapture first so its `/__eval/run` middleware is matched before the
    // app's SSR catch-all.
    plugins: [
      evalCapture(),
      devtools(),
      tailwindcss(),
      tanstackStart(),
      nitro(),
      viteReact(),
    ],
  }
})

export default config
