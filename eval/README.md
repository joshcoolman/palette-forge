# Evals

A small, local harness for tuning the AI palette flow with evidence instead of vibes.
The AI path is **model-authored** — a worded brief in, six full palettes out — so its
quality is a *prompt-craft* problem, and prompt-craft needs a feedback loop:

> run a brief → see exactly what came back → steer the system prompt → run it again →
> is it *consistently* good and *inside the ranges* you set? then you're solid.

Everything here serves that loop. None of it ships in the app — it's a property of the
repo, for whoever is tuning the model's taste.

For the *why* behind all of this — the discipline of building an app with a model at its
core — see [`docs/poor-mans-evals.md`](../docs/poor-mans-evals.md). This file is the how.

## The pieces

- **[`prompts.md`](prompts.md)** — a stable set of real briefs (the "golden set"), each
  with the **intent** a good result must honor and the **must-nots** it stated in words
  (e.g. *"nothing girly"* → no pink/purple). Re-runnable so a change is judged the same
  way every time, not against a moving target.
- **`runs.jsonl`** *(local, git-ignored)* — every AI generation in dev, appended one
  JSON object per line: `{ at, model, brief, raw }`, where `raw` is the model's **full
  reply** (message + palettes). "The JSON's in our log" — no devtools required.
- **`latest.json`** *(local, git-ignored)* — the last run, pretty-printed, for a quick eyeball.

## How the capture works

The app is browser-direct (no backend), so a small **dev-only** Vite middleware does the
write: [`vite/eval-capture.ts`](../vite/eval-capture.ts) registers `POST /__eval/run` with
`apply: 'serve'`, so it exists **only** on the dev server — the production build has no
trace of it. The client half, [`src/lib/eval-capture.ts`](../src/lib/eval-capture.ts), is
gated on `import.meta.env.DEV` and fires after each generation
([`prompt-palettes.ts`](../src/features/agent/prompt-palettes.ts)). It's our own tracing
layer — the thing LangSmith/Langfuse sell, scoped to one person and one file.

## Using it

```bash
pnpm dev                      # the capture endpoint is live only here
# add an Anthropic key in Settings → "Chat with AI" → run a brief from prompts.md
tail -f eval/runs.jsonl       # watch runs land
cat eval/latest.json          # eyeball the most recent one
```

Each line:

```json
{ "at": "2026-…Z", "model": "sonnet", "brief": "…the brief…", "raw": "…the model's full JSON reply…" }
```

## The method (and the trap)

1. **Run** a brief. Judge `raw` against that brief's **intent + must-nots**.
2. **Steer** the one lever: [`knowledge/color-theorist.md`](../knowledge/color-theorist.md)
   is the model's **verbatim system prompt** (sent as-is — what you read is what's sent).
   Edit it, re-run, watch the captured JSON change. No code, no rebuild.
3. **Re-run a couple.** Consistently good *and* inside the ranges you specified → solid.

**The trap:** steer with **principles and ranges**, not example palettes. A concrete
example color-set is the most powerful steer *and* the most dangerous — the model anchors
on it and you get six variations of your example instead of six fresh ideas. Say
*"grounds deep but breathing, roughly L 12–20%, not near-black"*, not *"use #2A3B2E"*.
Constraints that are too tight put the muzzle back on.

## Why it's git-ignored

The **capability** is committed (this README, `prompts.md`, the capture code); the
**runs** are local data — your briefs, your iterations. A future step could turn this into
a scripted runner that feeds each `prompts.md` brief through the model and auto-checks the
must-nots (e.g. "no hue in the magenta/pink band") against `runs.jsonl`.
