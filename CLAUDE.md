# palette-forge — working notes for Claude

**Read first:** [`docs/SPEC.md`](docs/SPEC.md) (the detailed reference spec) and [`docs/OVERVIEW.md`](docs/OVERVIEW.md) (the umbrella vision). They define what this is and what it refuses to be.

## Hold the line

- **Agent-first, not agent-added.** The agent is the product; the UI serves its loop. If deleting the agent leaves a working app, something went wrong.
- **The boundary is welded.** Image/seed color in → palettes out. Not a design system, not an image editor, not a SaaS. Retune _what good color means_ via `/knowledge` only.
- **Mechanism vs knowledge.** Contrast _math_ is locked mechanism (code). Contrast _policy_ and taste live in `/knowledge` as plain, human-rewritable markdown — it both guides proposals and is the self-check rubric.
- **Free verifier:** WCAG contrast (automatic). **Live verifier:** the user's taste.
- **Data model:** clean, addressable records with stable IDs (MCP-ready later). Don't bury palettes in React state.

## Current state

M0–M1 built (uncommitted as of 2026-06-22). The product is a vertical animated **journey**: source (image/seed) → typed direction cards → scored variations → final palette with light/dark mocks and honest WCAG badges. It runs on a deterministic **SimulatedEngine** behind a `PaletteEngine` seam (`src/features/agent/`) — no key, no tokens — with the real `ClaudeEngine` deferred to M4. Contrast math is locked in `src/features/color/contrast.ts`; contrast policy + taste live in `/knowledge/*.md`. Live journey state is a `useSyncExternalStore` store (`src/lib/journey-store.ts`); palettes persist to IndexedDB.

## Build log

This repo keeps a working record of how the build actually goes in [`log/`](log/) — decisions, reasoning, and dead-ends the git diff can't capture. Write an entry at natural beats (a unit of work done, a notable or reversed decision, a phase change, a wall); see [`log/README.md`](log/README.md) for the convention and voice. Lean on the _why_.
