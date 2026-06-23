# palette-forge — working notes for Claude

**Read first:** [`docs/SPEC.md`](docs/SPEC.md) (the detailed reference spec) and [`docs/OVERVIEW.md`](docs/OVERVIEW.md) (the umbrella vision). They define what this is and what it refuses to be.

## Hold the line

- **Deterministic core, agent at the boundary.** There is no in-app LLM. Generation is a deterministic engine (four distinct characters + harmonic re-run variety) checked by a free WCAG verifier and your live taste. The `PaletteEngine` seam (`src/features/agent/`) and addressable records stay clean so an external agent could drive generation later (MCP/API) — AI belongs at the boundary, not inside the loop. See the `ai-at-the-boundary` memory.
- **The boundary is welded.** Image/seed color in → palettes out. Not a design system, not an image editor, not a SaaS. Retune _what good color means_ via `/knowledge` only.
- **Mechanism vs knowledge.** Contrast _math_ is locked mechanism (code). Contrast _policy_ and taste live in `/knowledge` as plain, human-rewritable markdown — the policy the verifier and the scoring rubric read.
- **Free verifier:** WCAG contrast (automatic). **Live verifier:** the user's taste (heart what's right).
- **Data model:** clean, addressable records with stable IDs (MCP-ready). Don't bury palettes in React state.

## Current state

The **"surprise me" journey**: source (image/seed) → **four distinct, contrast-checked takes** (each a named character) → select → per-card actions (save / copy / export). **Re-run** appends a fresh four, **newest-first**; color seeds rotate through harmonic relationships (complementary / triadic / split-comp / analogous) per re-run, image seeds rotate by the golden angle — so re-runs stay genuinely varied. Names are deterministic and evocative (`src/features/palette/namer.ts`: a hue-bucket word + a character mood word, hashed from the colors, deduped journey-wide). Light/dark, honest WCAG badges throughout. The editable source swatch opens an in-app color picker (Done retunes + re-runs).

One deterministic **SimulatedEngine** behind the `PaletteEngine` seam: `compose(source, onProgress?, variation?, usedNames?)`. Contrast math locked in `src/features/color/contrast.ts`; policy + taste in `/knowledge/*.md` (`characters.md` carries the four-distinct-characters guidance); journey state in a `useSyncExternalStore` store (`src/lib/journey-store.ts`, fixed `'active'` key, IndexedDB-persisted); saved palettes in IndexedDB (`palette-repo`); prefs in `src/features/prefs/`. `Source` keeps `images?` / `prompt?` for the deferred mood board.

The app is **one page** (`/`, the combined source picker + working area + saved grid) plus **Settings** (only the delete-confirm preference). No BYO-key, no model selector — those were removed once the deterministic engine + namer made the LLM redundant (see [`docs/plan-remove-ai.md`](docs/plan-remove-ai.md) and the `sim-engine-may-be-enough` memory).

**Parked:** the mood-board input (N inspo images + optional prompt); lifting the color "comfort band" (never-pure-white/black, sat caps) into explicit constants / `/knowledge` (the `color-comfort-band` memory); exposing the engine as an agent-callable MCP/API surface.

## Build log

This repo keeps a working record of the build in [`log/`](log/) — **one file per date** (`log/YYYY-MM-DD.md`); append the day's beats. Each beat is recap-shaped: what changed (+ commit SHA), a short recap, and a one-line **why** only when there was a real decision or reversal. Terse — the recap you'd give at the end of a turn, not an essay. See [`log/README.md`](log/README.md).
