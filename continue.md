# Continue — Palette Forge

## Where we are

On branch **`feat/prompt-to-palette`** (open, **not merged** — deliberate, mid tuning
soak). Everything committed + pushed; working tree clean except this file. Gate green on
every commit (`tsc`, `eslint`, 73 tests, `pnpm build`). **`main`** only has a cherry-picked
border tweak (`cf18369`) — none of the AI/eval work below.

This session shipped two big arcs on the branch: **(1) model-direct palettes** and **(2) a
full local eval/observability setup**.

## Arc 1 — Model-direct palettes (the prompt flow is now model-authored)

The seed-only prompt path (model picks one hex, deterministic engine builds the rest)
couldn't honor palette-wide intent ("nothing girly" → pink accent every time) and gave a
refine loop nothing to act on. So **for the prompt flow, the model now authors the whole
palette** — it computes color there, deliberately reversing the old "AI never computes
color" line *for that path only*. Seed/image stay deterministic.

- **Two generators behind one seam** (`src/features/agent/get-engine.ts` → `RoutingEngine`):
  `source.type === 'prompt'` → `ModelEngine` (`model-engine.ts`), else `SimulatedEngine`.
  `compose()` now returns `ComposeResult { palettes, message? }` (the model's friendly note).
- **Contract is prose, not tool-use:** `knowledge/color-theorist.md` IS the system prompt,
  sent **verbatim** (`generationSystemPrompt()` in `src/features/agent/prompt-palettes.ts`).
  Model returns `{ message, palettes }` JSON; `parseModelResponse`/`toModelPalette` validate
  + drop malformed; transport error → visible error round (no silent grey).
- **`Source` gained `'prompt'`** (value = the brief). The Chat-with-AI overlay
  (`prompt-dialog.tsx`) starts a prompt journey; `index.tsx` shows the quoted brief + a
  Sparkles marker.
- **Instant re-runs:** the model is paid once (opening round); re-runs are free algorithmic
  variations of that output — `src/features/agent/derive.ts` `deriveRound()` rotates the
  whole colorway by a harmonic offset (reuses `rotateHue` + `finalizePalette`). Preserves
  the beloved "smash regen → wall of color" without a model call each time. `rerunJourney`
  branches prompt→derive / color·image→deterministic.
- **Finished-feel:** visible "Designing…" loading state (was invisible skeletons), the
  model's friendly `message` above the round, palette `character`/rationale exposed (strip
  hover-title + saved-card subtitle), refresh recovery (source persists eagerly; interrupted
  → "Generate again"). Favorite cards now wear their own `border` role color.
- **Docs reconciled** to "two generators": `CLAUDE.md`, `docs/SPEC.md`, `README.md`,
  `docs/plan-ai-model-direct.md`, and memories (`model-direct-palettes` is the canonical record).

## Arc 2 — Local eval / observability (rolled our own, dev-only)

The point: tune the model prompt with evidence, not vibes. All dev-only, zero prod surface.

- **Capture (tracing):** `vite/eval-capture.ts` — Vite plugin `apply: 'serve'` (dev only).
  `POST /__eval/run` appends every generation `{ at, model, brief, raw }` to
  **`eval/runs.jsonl`** (+ pretty `eval/latest.json`); client half `src/lib/eval-capture.ts`
  `captureRun()` (DEV-gated) fires from `promptToPalettes`. Run files git-ignored.
- **Eval runner (dev UI):** `src/components/dev/eval-runner.tsx` — a **burnt-orange** banner
  (`#b5491f`) above the app header, content-width, **gated on `import.meta.env.DEV &&
  aiEnabled`** (hidden without a key). A wide dropdown of briefs + **Run** + **+ New**
  (label+brief form → `POST /__eval/prompts` appends to `prompts.md` + runs). `GET
  /__eval/prompts` parses the briefs from `eval/prompts.md` server-side. Tree-shaken from prod.
- **The golden set:** `eval/prompts.md` — briefs with intent + must-nots (lawn-care,
  racing-brand, wellness-yoga, battery-question). The how is `eval/README.md`; the **why** is
  the new conceptual doc **`docs/poor-mans-evals.md`** (spec/contract/observability/evals/
  guardrails + a concept→codebase table; cross-linked from README + eval/README).

## Key decisions

- **Pay for AI once, explore free:** opening round = model; re-runs = algorithmic variations
  of it. (Re-run hue-rotation can drift off intent — round 0 honors it, re-runs are the
  playground. One-line swap to lightness/saturation-only if intent-locked re-runs wanted.)
- **`prompts.md` is the curated golden set; `runs.jsonl` is the firehose.** Deliberately did
  NOT pull run-history into the picker (would mix curation with noise); `+ New` is the
  deliberate bridge that promotes a brief into the set.
- **Steer with principles/ranges, not example palettes** (examples muzzle the model).
- Eval tooling stays ~tiny, dev-only, single-project, no abstraction — "this is how LangChain
  starts; we stop here." (We're in evals/observability territory, not orchestration.)

## TOMORROW — do these first (repo-as-resume quick wins + analytics)

Workflow is already strong (per-commit gate, prose commits, `log/` narrative, real PRs like
#6, focused tests — don't over-engineer past this). Three quick, high-signal gaps the user
wants closed first, then analytics:

1. **CI — the big one.** No `.github/workflows` exists, so "gate green per commit" is an
   unverifiable claim. Add a GitHub Actions workflow running the gate (`tsc` + `eslint` +
   `pnpm test` + `pnpm build`) on push + PR → verifiable green checks. **Tailor to this
   stack, not a generic template:** pnpm (see the `vercel-deploy-tanstack-pnpm11` memory),
   Node, TanStack Start + Nitro.
2. **LICENSE — none exists**, but the app footer calls itself "open-source" (a real
   claim/reality gap a reviewer will catch; legally meaningful too). Add one — MIT is the
   conventional pick for a showcase repo; confirm with the user.
3. **Tag `v1.0.0`** — "v1 shipped" with no git tag. A tiny signal that you ship deliberately.
4. **Vercel Analytics** — the user enabled it in Vercel (org `devpdx`, project
   `palette-forge`, live at colorfordays.com). Add `@vercel/analytics`. **GOTCHA: this is
   TanStack Start, NOT Next.js** — the dashboard shows the Next.js snippet
   (`@vercel/analytics/next`); use the React variant instead:
   `import { Analytics } from '@vercel/analytics/react'` and render `<Analytics />` in the
   root layout (`src/routes/__root.tsx`). Optional companion: `@vercel/speed-insights/react`.

Workflow habit notes: keep cherry-picks rare (the border tweak `cf18369` is a dup on both
`main` and the branch — reconcile at merge); land `feat/prompt-to-palette` as a proper PR
when ready (CI will then decorate it). Skip: e2e/component tests, conventional-commits
(your prose messages are better), heavy branch protection.

## THEN — the prompt tuning (what the eval loop was built for)

Two eval paths now available: `pnpm eval [prompt-id]` (headless, key in `.env.local`,
Claude Code can drive this autonomously) and the in-app dev banner (visual smoke test).
`eval/latest.json` now has a `parsed` field alongside `raw` — readable in VS Code.

1. **Mono-hue neutrals (relax it).** `color-theorist.md` says neutrals share one hue family
   — that's why each Minecraft take was single-hued. One-line relax to let the model build
   cohering multi-hue palettes ("muted pink + cyan + muted purple"). User is keen on this.
2. **Ground-lightness range.** `wellness-yoga` brief returned grounds too dark (~`#191419`,
   near-black) for a pro site. Add "deep but breathing, ~L 12–20%, not near-black" to
   `color-theorist.md`. (`wellness-yoga` is the tagged test case.)
3. **Deferred:** scope/refusal eval (the `battery-question` "pass" = graceful decline —
   needs a prompt guard + a way to judge it); automated scorers (codify a must-not like "no
   magenta-band hue"); epic phases 3–4 (thinking feed, conversational refine).

## Git state

`feat/prompt-to-palette`, clean, fully pushed (HEAD `69145b4`). Open for the tuning soak —
no PR yet. `main` is untouched by this work except the border cherry-pick (`cf18369`).
Real Anthropic key confirmed working — full AI happy path browser-verified this session.
