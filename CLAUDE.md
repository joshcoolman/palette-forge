# palette-forge — working notes for Claude

**Read first:** [`docs/SPEC.md`](docs/SPEC.md) (the detailed reference spec). It defines what this is and what it refuses to be. The original "agent-first portfolio" umbrella is archived ([`docs/archive/OVERVIEW.md`](docs/archive/OVERVIEW.md)) — superseded by the single-utility, human- + agent-friendly identity (see the `project-identity-pivot` memory).

## Bar for this repo

This is a **public repo the owner points to as evidence of their craft** — development, design, front-end, and architecture. Write every change as if a **senior engineer will read it closely** and judge the author by it.

- **No shortcuts that read as shortcuts.** No reinventing solved problems, no copy-paste duplication, no dead code, no TODO-shaped gaps left behind. If a dependency is the right call, isolate it cleanly rather than hand-rolling a worse version; if hand-rolling is the right call, make it obviously deliberate.
- **The architecture should be legible from the file structure**, not just correct at runtime. Seams (`PaletteEngine`, the agent boundary, knowledge-as-prose) are statements — keep them sharp. A reviewer should see *why* the boundary is where it is.
- **Every commit stands on its own** and passes the full gate (`tsc`, `eslint`, `pnpm build`). No half-built phases in the history someone could land on. Commit messages and `log/` beats are part of the artifact — write them for a reader.
- **Comments earn their place** in the existing voice: the *why*, the decision, the tradeoff — not narration of the obvious.
- When a plan and the actual code disagree on where something attaches, **follow the code** and note the deviation. The plans were written by reading the code; reality wins.

## Hold the line

- **Deterministic core, agent at the boundary.** There is no in-app LLM. Generation is a deterministic engine: each take is a **treatment archetype** (`src/features/palette/tuning.ts`) — a hue-free relationship template (hero ground, cross-hue accent, light/dark duotone) filled with hues derived from the seed, plus harmonic re-run variety. The `PaletteEngine` seam (`src/features/agent/`) and addressable records stay clean so an external agent could drive generation later (MCP/API) — AI belongs at the boundary, not inside the loop. See the `ai-at-the-boundary` memory.
- **Expressive over compliant.** The north star is bespoke, surprising, Type-Explorer-grade palettes — saturated hero grounds, contrasting accents, real range across a round. **No runtime WCAG enforcement** (the old `repair()` loop and the numeric score were removed 2026-06-23 — they flattened bold combos and rewarded "one color + grays"). Legibility lives in the archetype recipes, not a checker.
- **Seed-coherence is the one hard rule.** Every neutral role carries the seed's hue, so a result always reads as the user's color or image; only the accent rotates away. A take that ignores the seed is a bug.
- **The boundary is welded.** Image/seed color in → palettes out. Not a design system, not an image editor, not a SaaS. Retune _what good color means_ via `src/features/palette/tuning.ts` (the archetype dials) and `/knowledge` prose.
- **Contrast is computed but unenforced.** `computeContrastChecks` still records WCAG ratios on each palette for reference (`src/features/color/contrast.ts` + `knowledge/contrast.md` policy), but nothing nudges colors to satisfy them and nothing is shown. Safe to fully excise later.
- **Data model:** clean, addressable records with stable IDs (MCP-ready). Don't bury palettes in React state.

## Current state

The **"surprise me" journey**: source (image/seed) → **a round of distinct treatment takes** (one per archetype in `ARCHETYPES`; 6 today — each a hero-ground, cross-hue-accent palette named for its character) → select → per-card actions (save / copy / export). **Re-run** appends a fresh round, **newest-first**; color seeds rotate the base hue through harmonic relationships (complementary / triadic / split-comp / analogous) per re-run, image seeds rotate by the golden angle — so re-runs stay seed-coherent but varied. Names are deterministic and evocative (`src/features/palette/namer.ts`: an accent-hue word + an archetype mood word, hashed from the colors, deduped journey-wide). Light/dark are genuine **inversions**: light mode is a real light theme (richly-tinted light ground + deep color-carrying ink text), dark mode flips it to the hero saturated dark ground + light text — the toggle swaps ground↔text (the deep hue that is the *text* in light mode becomes the *ground* in dark mode), it does not just darken. No score, no WCAG badges. The editable source swatch opens an in-app color picker (Done retunes + re-runs).

One deterministic **SimulatedEngine** behind the `PaletteEngine` seam: `compose(source, onProgress?, variation?, usedNames?)` maps over `ARCHETYPES`. The taste dials (ground L/S, text duotone, accent relationship per archetype) live in `src/features/palette/tuning.ts` — edit there to retune the whole app; `/knowledge/*.md` carries the prose north star (`characters.md`, `palettes.md`). Contrast math in `src/features/color/contrast.ts` (computed, unenforced). Journey state in a `useSyncExternalStore` store (`src/lib/journey-store.ts`, fixed `'active'` key, IndexedDB-persisted); saved palettes in IndexedDB (`palette-repo`); prefs in `src/features/prefs/`. `Source` keeps `images?` / `prompt?` for the deferred mood board.

The app is **one page** (`/`, the combined source picker + working area + saved grid) plus **Settings** (only the delete-confirm preference). No BYO-key, no model selector — those were removed once the deterministic engine + namer made the LLM redundant (see [`docs/plan-remove-ai.md`](docs/plan-remove-ai.md) and the `sim-engine-may-be-enough` memory).

**Parked:** the mood-board input (N inspo images + optional prompt); lifting the color "comfort band" (never-pure-white/black, sat caps) into explicit constants / `/knowledge` (the `color-comfort-band` memory); exposing the engine as an agent-callable MCP/API surface.

## Build log

This repo keeps a working record of the build in [`log/`](log/) — **one file per date** (`log/YYYY-MM-DD.md`); append the day's beats. Each beat is recap-shaped: what changed (+ commit SHA), a short recap, and a one-line **why** only when there was a real decision or reversal. Terse — the recap you'd give at the end of a turn, not an essay. See [`log/README.md`](log/README.md).
