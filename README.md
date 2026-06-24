# palette-forge

> An image or seed color in, refined and accessible light + dark palettes out. Four distinct takes, re-run for more, keep the ones you like.

**Live at [colorfordays.com](https://colorfordays.com).**

**Status: v1 shipped.** A focused, fully-local color-palette utility — no account, no API key, nothing sent anywhere. Built in public; the full history from scaffold to v1 lives in [`log/`](log/).

---

## What this is

A single-purpose, open-source tool for building accessible color palettes. Drop in an image or pick a seed color and it composes **four distinct, contrast-checked takes** — each a named character (Vivid, Composed, Nocturne, Hush) — in light and dark, with honest WCAG badges. **Re-run** for a fresh four; color seeds explore color-theory relationships to your seed (complementary, triadic, …), image seeds rotate around the wheel. Heart the ones you like; copy/export as JSON or CSS variables.

It's **deterministic** — same input, same result — so it's instant and free to host. Generation runs entirely in your browser.

The design bet: **`/knowledge` is plain markdown you can read and rewrite.** It's the policy the engine generates from and the rubric it's scored against — edit the markdown, change what "good color" means, no code required.

Full brief: [`docs/SPEC.md`](docs/SPEC.md).

## Two verifiers, no model

What makes the output trustworthy isn't an LLM — it's two stacked verifiers:

- **Free + automatic:** WCAG contrast. The engine computes it for every role-pairing in both modes and repairs until the policy passes; the badges stay honest.
- **Live:** your taste. You're the final oracle — re-run, retune the seed, keep what's right.

> **Built first as a vision-agent, BYO-key app — then the agent came out.** For color generation the deterministic engine proved better and the in-app LLM's latency made it nearly unusable, so it was removed (see [`docs/plan-remove-ai.md`](docs/plan-remove-ai.md)). The clean engine seam and addressable, stable-ID records stay — so the core can later be exposed as a **capability an agent calls** (MCP/API). The aim: good for humans, callable by agents. (Earlier umbrella vision, archived: [`docs/archive/OVERVIEW.md`](docs/archive/OVERVIEW.md).)

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
