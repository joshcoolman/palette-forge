# palette-forge — working notes for Claude

**Read first:** [`docs/SPEC.md`](docs/SPEC.md) (the detailed reference spec) and [`docs/OVERVIEW.md`](docs/OVERVIEW.md) (the umbrella vision). They define what this is and what it refuses to be.

## Hold the line

- **Agent-first, not agent-added.** The agent is the product; the UI serves its loop. If deleting the agent leaves a working app, something went wrong.
- **The boundary is welded.** Image/seed color in → palettes out. Not a design system, not an image editor, not a SaaS. Retune _what good color means_ via `/knowledge` only.
- **Mechanism vs knowledge.** Contrast _math_ is locked mechanism (code). Contrast _policy_ and taste live in `/knowledge` as plain, human-rewritable markdown — it both guides proposals and is the self-check rubric.
- **Free verifier:** WCAG contrast (automatic). **Live verifier:** the user's taste.
- **Data model:** clean, addressable records with stable IDs (MCP-ready later). Don't bury palettes in React state.

## Current state

The **"surprise me" journey** is shipped: source (image/seed) → **four distinct, contrast-checked takes** (each a named character, not a wheel type) → select → action bar (save / copy / export); refine appends a round, Re-run re-surprises. Light/dark, honest WCAG badges throughout. Both engines sit behind the `PaletteEngine` seam (`src/features/agent/`), now `compose(source, steer?)` + `refine`: a deterministic **SimulatedEngine** (no key — four fixed characters: Vivid / Composed / Nocturne / Hush) and the real **ClaudeEngine** (BYO key, vision-enabled — sends the 120px sampled image, names each take's character). Contrast math locked in `src/features/color/contrast.ts`; policy + taste in `/knowledge/*.md` (`characters.md` carries the four-distinct-characters guidance); journey state in a `useSyncExternalStore` store (`src/lib/journey-store.ts`); palettes in IndexedDB. `Source` is shaped for the deferred mood board (`images?` / `prompt?`).

**Plan delivered:** [`docs/plan-surprise-me.md`](docs/plan-surprise-me.md) milestones R1–R3 are done (color-theory types removed; engine seam reshaped; knowledge + card polish). **Next (parked, not started):** adopt the **geometric grid card** from the `/lab` route as the takes display (the lab stays as the design surface; type treatment locked there) — today the takes still use the band-preview card with name + character. Further out: the **mood board** input (N inspo images + optional prompt) and authored `knowledge/characters/*.md` reference languages — see the plan's _Deferred_ section.

## Build log

This repo keeps a working record of the build in [`log/`](log/) — **one file per date** (`log/YYYY-MM-DD.md`); append the day's beats. Each beat is recap-shaped: what changed (+ commit SHA), a short recap, and a one-line **why** only when there was a real decision or reversal. Terse — the recap you'd give at the end of a turn, not an essay. See [`log/README.md`](log/README.md).
