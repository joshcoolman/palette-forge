# palette-forge

> An image or seed color in, refined and accessible light + dark palettes out. Fan out variations, switch between them, refine to taste.

**Status: v1 shipped** — image or seed in; an agent that proposes, checks its own WCAG contrast, revises, and fans out; a journey you can branch and refine; a saved library; and Tailwind / CSS / hex export. Built in public — the full history from scaffold to v1 lives in [`log/`](log/).

---

## What this is

A focused, **agent-first**, BYO-key utility for building accessible color palettes. The agent proposes a palette (guided by a legible `/knowledge` folder), **checks WCAG contrast itself**, self-corrects until it passes, and fans out variations — and you are the final oracle for taste.

The distinctive bet: **`/knowledge` is plain markdown you can read and rewrite.** It both guides what the agent proposes and is the rubric it judges against. Edit the markdown, change the output — no code required.

Full brief: [`docs/SPEC.md`](docs/SPEC.md) · umbrella vision: [`docs/OVERVIEW.md`](docs/OVERVIEW.md).

## Why an agent (honest about the loop)

The agent earns its place because this domain has a **free, automatic verifier — contrast ratio.** Two verifiers stacked: contrast (automatic, non-negotiable) and you (taste, live). Delete the agent and it's just a color picker, so the agent is the product.

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
