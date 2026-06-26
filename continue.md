# Continue — Palette Forge

## Where we are (2026-06-25, end of session)

**Everything is on `main` and deployed; `feat/prompt-to-palette` has been merged and
deleted (local + remote) — `main` is now the only branch.** `main` (HEAD `d4a44ae`) is
clean, fully pushed → Vercel production at **colorfordays.com**. Gate green on every commit
(`tsc`, `eslint`, 73 tests, `build`); CI runs on push + PR.

This session shipped, in order:

## 1. Repo-hardening quick wins (morning) — `108a2e9` via PR #7

- **CI** (`.github/workflows/ci.yml`): full gate on push + PR, tailored to the stack (pnpm 11
  via `packageManager`, Node 22, TanStack Start + Nitro).
- **MIT LICENSE** (backs the footer's "open-source" claim).
- **Vercel Analytics + Speed Insights** in `src/routes/__root.tsx` (React variants, NOT the
  Next.js snippet — this is TanStack Start).
- Merged `feat/prompt-to-palette` → `main` via **PR #7** (first time main carried the v1
  AI/eval work) and tagged **`v1.0.0`** on the merge commit.

## 2. Minimal Color Theorist — `ca22dbb`

Replaced the 109-line `knowledge/color-theorist.md` with a **five-sentence** system prompt
(mission + multi-hue permission + a plain darkness/white guardrail + the verbatim JSON
contract). Tuned live against a Minecraft brief (saved in `eval/prompts.md`) on sonnet,
reading hue/L/S back from `eval/runs.jsonl`.

- **Mechanism unchanged:** `color-theorist.md` IS the system prompt, sent verbatim via
  `generationSystemPrompt()` (`src/features/agent/prompt-palettes.ts`). The markdown file is
  the knob — tuning = editing prose, no code.
- Multi-hue permission ("background/surface/border/muted don't all have to be the same hue")
  unlocked genuine cross-hue palettes where the brief invites it; serious briefs stayed
  restrained — **the prompt self-calibrates boldness to the brief, untold.**

## 3. Dev eval bar: role × brief selector — `41289f2`

Turned the manual `GENERATION_KNOWLEDGE` swap into a **Role dropdown** beside the brief
dropdown. The eval bar is now a role × brief matrix.

- `knowledge/roles/` holds dev-only alternate personas; `roles/interior-designer.md` is the
  worked example (warm Pottery-Barn persona, same shape as minimal color-theorist).
- `knowledge-loader.ts` globs `roles/*.md`, merges into the basename map, exports `ROLE_FILES`.
- `prompt-palettes.ts`: **DEV-gated** `setGenerationRoleOverride()` + `currentGenerationRole()`;
  `generationSystemPrompt()` honors the override. Live app always uses `color-theorist.md`;
  "role" never enters the shipped `Source`/journey model.
- `eval/runs.jsonl` records now carry `role` (self-describing role × brief).

## Key decisions / philosophy (this session)

- **Minimal beats verbose for a system prompt.** The test of a good prompt: a stranger feels
  safe editing it. Forty rules hide which one carries the result (and let contradictions hide
  across sections). Goal stated by the user: **easy on us, easy on everyone else, easy for the
  model.**
- **Vague guardrails don't bind** — "darks tending toward 100% black" left grounds at L 4–10%
  (model reads near-black as "not pure black"). A concrete-ish range is the lever that bites.
  Left as a known next step; current darkness judged expressive and good enough.
- **One markdown file = one knob.** Personas are a folder of `.md` + the `getKnowledge` getter;
  drop a file in `knowledge/roles/`, it appears in the picker — no framework, no LangGraph.
- **No prompt-version archive / dating.** Single canonical `color-theorist.md`; git is the
  silent backstop. "Open the repo, see it, it's simple, tweak it."

## Outstanding / next steps (nothing in flight — clean stopping point)

- **Conversational refine (the user's fresh idea, not started):** with AI enabled, react to a
  returned round — *"I like 2 and 4, redo the rest."* Open design question raised: **replace
  in place vs. a carousel of variations** (and keep instant algorithmic re-runs for the rest).
  This maps to the already-deferred **epic phases 3–4** and `docs/plan-ai-conversational-refine.md`
  — the keep-N / carousel framing should be written into that doc when picked up.
- **Darkness concrete-floor lever** — if near-black grounds ever bug you, add a real lightness
  range to `color-theorist.md` (e.g. "deep but breathing, ~L 12–20%, not near-black"). Known,
  one-sentence change.
- **Eval-tooling de-duplication (spec'd in this session's assessment, deferred):** the response
  parser, the `prompts.md` parser, and the run-record shape are each implemented 2–3× (TS in
  `prompt-palettes.ts` + JS mirror in `scripts/eval.mjs` + `vite/eval-capture.ts`). Consolidate
  into one shared parser + one prompt-set parser + one record shape; convert `eval.mjs`→`.ts`
  via `tsx` so it imports the shared TS. Net code *reduction*. Deliberately deferred until after
  the tuning soak so the harness isn't destabilized mid-use.
- **More personas** in `knowledge/roles/` (the pattern is proven; e.g. a "serious designer").
- **Parked (from CLAUDE.md):** mood-board input; the agent-callable MCP/API surface; lifting the
  color "comfort band" into explicit constants.

## How state is captured (so we don't lose the thread)

- **Done-work:** prose commit messages + `log/YYYY-MM-DD.md` beats (today: `log/2026-06-25.md`).
- **Where-we-are / next:** this file (`continue.md`) — now also **surfaced first in `/docs`**
  (added to the docs glob), and kept fresh by a **`.claude/settings.json` Stop hook** that nudges
  when commits outpace it. Load-bearing handoff doc.
- **Bigger plans:** `docs/` (e.g. `epic-ai-layer.md`, `plan-ai-conversational-refine.md`,
  `poor-mans-evals.md`) + `CLAUDE.md`'s "Parked" list + memories.

## Workflow hardening done this session (beyond the app)

- `continue.md` surfaced first in the `/docs` viewer (`d4a44ae`); a Stop hook nudges if it drifts.
- Two principles graduated to **global `~/.claude/CLAUDE.md`** (apply to all repos): *portability
  as a habit* and *minimal prose contracts; tune with evidence*. Plus the continue.md "read &
  verify on session start" note and `branch-cleanup-fastidious` / `minimal-system-prompts` memories.
- **Side quest (outpaint-studio):** closed. It's the canonical greenfield baseline; the everywhere-
  floor (a `continue.md` + the global read-it instruction) is already in place there, so no per-repo
  hook/CI/log port was needed. The convention-based `/docs` route was evaluated for back-porting
  *here* and **declined** (its `NN-` ordering collides with our ISO-date log filenames; churn on a
  correct file). The convention model stays outpaint's; the reusable value lives at the principle level.

## Git state

On **`main`** only (the feature branch was merged and deleted, local + remote), clean, fully
pushed (HEAD `d4a44ae`), live on colorfordays.com. A real Anthropic key in `.env.local` (and in
Settings) exercises the AI path; the dev eval bar's Role dropdown A/Bs personas locally.
