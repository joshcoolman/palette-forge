# palette-forge

> An image or seed color in, expressive light + dark palettes out. A round of distinct takes, re-run for more, keep the ones you like.

**Live at [colorfordays.com](https://colorfordays.com).**

**Status: v1 shipped.** A focused, open-source color-palette utility — no account, local by default, with an optional BYO-key AI layer (name suggestions) that's off until you add a key. Built in public; the full history from scaffold to v1 lives in [`log/`](log/).

---

## What this is

A single-purpose, open-source tool for building color palettes. Drop in an image or pick a seed color and it composes a round of **distinct treatment takes** — each a named character (deep jewel, moody twilight, warm sand, crisp paper, calm meadow, loud signal) — in light and dark. Every take leads with a **saturated hero ground** and a **cross-hue accent**; legibility is baked into the recipe (dark ground ↔ light text), not enforced by a checker. **Re-run** for a fresh round; color seeds explore color-theory relationships to your seed (complementary, triadic, …), image seeds rotate around the wheel. Heart the ones you like; rename them (yourself, or with AI-suggested names if you add a key); copy/export as JSON or CSS variables.

It's **deterministic** — same input, same result — so it's instant and free to host. Generation runs entirely in your browser; the only thing that ever leaves it is the optional AI name-suggestion call (off until you add a key).

The design bet: **`/knowledge` is plain markdown you can read and rewrite.** It's the policy the engine generates from — edit the markdown, change what "good color" means, no code required.

Full brief: [`docs/SPEC.md`](docs/SPEC.md).

## Deterministic, not enforced

The output isn't trustworthy because a model approved it or a checker passed it — there's no LLM in the generation loop and no runtime WCAG enforcement (the old repair loop and numeric score were removed). Instead:

- **Legibility is baked into the recipe.** A dark ground always pairs with light text, a light ground with ink — readable by construction, the way a hand-built theme is. (Contrast ratios are still computed onto each record for reference, never enforced or shown.)
- **You are the final oracle.** Re-run, retune the seed, keep what's right.

> **Built first as a vision-agent, BYO-key app — then the agent came out of the *loop*.** For color generation the deterministic engine proved better and the in-app LLM's latency made it nearly unusable, so it was removed (see [`docs/plan-remove-ai.md`](docs/plan-remove-ai.md)). AI has since returned as a **light, opt-in layer at the boundary** — today, BYO-key name suggestions ([`docs/epic-ai-layer.md`](docs/epic-ai-layer.md)); it never computes color and is absent without a key. The clean engine seam + stable-ID records also keep the core exposable as a **capability an agent calls** (MCP/API) later. (Earlier umbrella vision, archived: [`docs/archive/OVERVIEW.md`](docs/archive/OVERVIEW.md).)

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
