# palette-forge — working notes for Claude

**Read first:** [`docs/SPEC.md`](docs/SPEC.md) (the detailed reference spec) and [`docs/OVERVIEW.md`](docs/OVERVIEW.md) (the umbrella vision). They define what this is and what it refuses to be.

## Hold the line

- **Agent-first, not agent-added.** The agent is the product; the UI serves its loop. If deleting the agent leaves a working app, something went wrong.
- **The boundary is welded.** Image/seed color in → palettes out. Not a design system, not an image editor, not a SaaS. Retune _what good color means_ via `/knowledge` only.
- **Mechanism vs knowledge.** Contrast _math_ is locked mechanism (code). Contrast _policy_ and taste live in `/knowledge` as plain, human-rewritable markdown — it both guides proposals and is the self-check rubric.
- **Free verifier:** WCAG contrast (automatic). **Live verifier:** the user's taste.
- **Data model:** clean, addressable records with stable IDs (MCP-ready later). Don't bury palettes in React state.

## Current state

v1 of the **journey** is shipped and committed: source (image/seed) → typed direction cards → scored variations → final palette, light/dark, honest WCAG badges. Both engines exist behind the `PaletteEngine` seam (`src/features/agent/`): a deterministic **SimulatedEngine** (no key) and the real **ClaudeEngine** (BYO key, vision-enabled — sends the 120px sampled image). Contrast math locked in `src/features/color/contrast.ts`; policy + taste in `/knowledge/*.md`; journey state in a `useSyncExternalStore` store (`src/lib/journey-store.ts`); palettes in IndexedDB.

**Active work — read [`docs/plan-surprise-me.md`](docs/plan-surprise-me.md) first.** Reframing the journey's first half away from color-theory types toward **image → four distinct "surprise me" palettes** (characters, not wheel types) — a simplification, not an addition. The display is the **geometric grid card** prototyped in the `/lab` route (kept; type treatment locked there). Other display treatments (palette-over-image, multi-treatment gallery) are parked. Start at milestone R1 (reshape the engine seam to `compose(source)` → four palettes; drop `PaletteType`/`Direction`).

## Build log

This repo keeps a working record of the build in [`log/`](log/) — **one file per date** (`log/YYYY-MM-DD.md`); append the day's beats. Each beat is recap-shaped: what changed (+ commit SHA), a short recap, and a one-line **why** only when there was a real decision or reversal. Terse — the recap you'd give at the end of a turn, not an essay. See [`log/README.md`](log/README.md).
