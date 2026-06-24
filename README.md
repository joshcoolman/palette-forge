# palette-forge

> An image or seed color in, expressive light + dark palettes out. A round of distinct takes, re-run for more, keep the ones you like.

**Live at [colorfordays.com](https://colorfordays.com).**

**Status: v1 shipped.** A focused, open-source color-palette utility — no account, local by default, with an optional BYO-key AI layer (describe-a-palette generation + name suggestions) that's off until you add a key. Built in public; the full history from scaffold to v1 lives in [`log/`](log/).

---

## What this is

A single-purpose, open-source tool for building color palettes. Drop in an image or pick a seed color and it composes a round of **distinct treatment takes** — each a named character (deep jewel, moody twilight, warm sand, crisp paper, calm meadow, loud signal) — in light and dark. Every take leads with a **saturated hero ground** and a **cross-hue accent**; legibility is baked into the recipe (dark ground ↔ light text), not enforced by a checker. **Re-run** for a fresh round; color seeds explore color-theory relationships to your seed (complementary, triadic, …), image seeds rotate around the wheel. Heart the ones you like; rename them (yourself, or with AI-suggested names if you add a key); copy/export as JSON or CSS variables.

The image and seed-color paths are **deterministic** — same input, same result, instant, free to host, running entirely in your browser. With an Anthropic key a third on-ramp opens: **describe a palette in words** ("a calm wellness palette for older clients") and the model authors the whole round — the one place AI is *in* the generation loop, because honoring worded intent needs it to own the colors. Without a key, nothing leaves the browser and the app is fully deterministic. Two generators behind one seam.

The design bet: **`/knowledge` is plain markdown you can read and rewrite.** It's the taste the app generates from — the deterministic dials in `tuning.ts`, and the model's **verbatim system prompt** in [`knowledge/color-theorist.md`](knowledge/color-theorist.md). Edit the markdown, change what "good color" means, no code required.

Full brief: [`docs/SPEC.md`](docs/SPEC.md).

## Steer the taste, and evaluate it locally

The AI flow is a *prompt-craft* problem, so the repo is set up to tune it like one — this is a property of the repo, not a feature of the app:

- **Steer:** [`knowledge/color-theorist.md`](knowledge/color-theorist.md) is the model's system prompt, sent verbatim. Edit it, re-run, watch the output change.
- **Evaluate:** a stable set of briefs ([`eval/prompts.md`](eval/prompts.md)) and a **local, dev-only run capture** — every generation appends its full JSON reply to `eval/runs.jsonl`, so you can judge a prompt change against real output instead of vibes. It's a tiny, self-rolled tracing/eval layer; the method is written up in [`eval/README.md`](eval/README.md).

## Deterministic, not enforced

The output isn't trustworthy because a checker passed it — there's no runtime WCAG enforcement anywhere (the old repair loop and numeric score were removed). The deterministic paths have no model in the loop at all; the worded-brief path leans on the model's judgment, not a checker. Either way:

- **Legibility is baked in.** A dark ground always pairs with light text, a light ground with ink — readable by construction, the way a hand-built theme is. (Contrast ratios are still computed onto each record for reference, never enforced or shown.)
- **You are the final oracle.** Re-run, retune, keep what's right.

> **Built first as a vision-agent, BYO-key app — then the agent came out of the *loop*, then partway back in.** The in-app LLM was first removed because the deterministic engine generated better and faster (see [`docs/plan-remove-ai.md`](docs/plan-remove-ai.md)). It returned in two shapes: a **light boundary enrichment** (BYO-key name suggestions, [`docs/epic-ai-layer.md`](docs/epic-ai-layer.md)) and — for the **worded-brief path** — a **model-authored generator** that *does* compute color, deliberately, because honoring intent needs it to ([`docs/plan-ai-model-direct.md`](docs/plan-ai-model-direct.md)). Seed/image stays deterministic; both AI paths are absent without a key. The clean engine seam + stable-ID records also keep the core exposable as a **capability an agent calls** (MCP/API) later. (Earlier umbrella vision, archived: [`docs/archive/OVERVIEW.md`](docs/archive/OVERVIEW.md).)

## Stack

TanStack Start (Vite-plugin model) · React 19 · TypeScript (strict) · Tailwind v4 · Vitest · ESLint + Prettier · pnpm. Deploys to Vercel.

## Local development

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build
pnpm test     # vitest
pnpm lint
```

## Boundary (the lane is welded)

Does one thing: image/seed color in, palettes out. Not a design-system builder, not an image generator/editor, not multi-user, not a SaaS. You can retune _what good color means_ via `/knowledge`; you cannot talk it into being something else.
