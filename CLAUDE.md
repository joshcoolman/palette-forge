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

- **Deterministic core, AI optional at the boundary.** The generation engine is fully deterministic and never calls a model: each take is a **treatment archetype** (`src/features/palette/tuning.ts`) — a hue-free relationship template (hero ground, cross-hue accent, light/dark duotone) filled with hues derived from the seed, plus harmonic re-run variety. An **optional, BYO-key AI layer** (`src/features/agent/client.ts`, gated by `hasKey()`) adds enrichments *at the boundary* — today, name suggestions for a saved palette — and **never computes color**. With no key, the AI layer is absent (the affordances that touch it don't render). The `PaletteEngine` seam and addressable records stay clean so an external agent could also drive generation later (MCP/API). See the `ai-layer-v1` and `ai-at-the-boundary` memories.
- **Expressive over compliant.** The north star is bespoke, surprising, Type-Explorer-grade palettes — saturated hero grounds, contrasting accents, real range across a round. **No runtime WCAG enforcement** (the old `repair()` loop and the numeric score were removed 2026-06-23 — they flattened bold combos and rewarded "one color + grays"). Legibility lives in the archetype recipes, not a checker.
- **Seed-coherence is the one hard rule.** Every neutral role carries the seed's hue, so a result always reads as the user's color or image; only the accent rotates away. A take that ignores the seed is a bug.
- **The boundary is welded.** Image/seed color in → palettes out. Not a design system, not an image editor, not a SaaS. Retune _what good color means_ via `src/features/palette/tuning.ts` (the archetype dials) and `/knowledge` prose.
- **Contrast is computed but unenforced.** `computeContrastChecks` still records WCAG ratios on each palette for reference (`src/features/color/contrast.ts` + `knowledge/contrast.md` policy), but nothing nudges colors to satisfy them and nothing is shown. Safe to fully excise later.
- **Data model:** clean, addressable records with stable IDs (MCP-ready). Don't bury palettes in React state.

## Current state

The **"surprise me" journey**: source (image/seed) → **a round of distinct treatment takes** (one per archetype in `ARCHETYPES`; 6 today — each a hero-ground, cross-hue-accent palette named for its character) → select → per-card actions (save / rename / copy / export). **Re-run** appends a fresh round, **newest-first**; color seeds rotate the base hue through harmonic relationships (complementary / triadic / split-comp / analogous) per re-run, image seeds rotate by the golden angle — so re-runs stay seed-coherent but varied. Names are deterministic and evocative (`src/features/palette/namer.ts`: an accent-hue word + an archetype mood word, hashed from the colors, deduped journey-wide) — that name is always the baseline; the optional AI layer can *suggest* alternatives (see below), never replace the namer. Light/dark are genuine **inversions**: light mode is a real light theme (richly-tinted light ground + deep color-carrying ink text), dark mode flips it to the hero saturated dark ground + light text — the toggle swaps ground↔text (the deep hue that is the *text* in light mode becomes the *ground* in dark mode), it does not just darken. No score, no WCAG badges. The editable source swatch opens an in-app color picker (Done retunes + re-runs).

One deterministic **SimulatedEngine** behind the `PaletteEngine` seam: `compose(source, onProgress?, variation?, usedNames?)` maps over `ARCHETYPES`. The taste dials (ground L/S, text duotone, accent relationship per archetype) live in `src/features/palette/tuning.ts` — edit there to retune the whole app; `/knowledge/*.md` carries the prose north star (`characters.md`, `palettes.md`). Contrast math in `src/features/color/contrast.ts` (computed, unenforced). Journey state in a `useSyncExternalStore` store (`src/lib/journey-store.ts`, fixed `'active'` key, IndexedDB-persisted); saved palettes in IndexedDB (`palette-repo`); prefs in `src/features/prefs/`. `Source` keeps `images?` / `prompt?` for the deferred mood board.

The app is **one page** (`/`, the combined source picker + working area + saved grid) plus **Settings** (delete-confirm + default-mode + saved-view prefs, and an **AI touches** panel: a BYO Anthropic key + a Haiku/Sonnet model picker, with an open-source footer linking the repo).

**AI layer (optional, v1 shipped).** The in-app LLM removed in the deterministic pivot has been re-introduced as a *light, opt-in* layer — see [`docs/epic-ai-layer.md`](docs/epic-ai-layer.md) and the `ai-layer-v1` memory. What's built (epic phases 0–1):
- **BYO-key foundation** — `src/features/agent/client.ts`: `hasKey()` (sync gate) + `callAnthropic()` (streaming) + `collect()`. The `@anthropic-ai/sdk` is lazy-`import()`-ed on first call, so no-key users download zero of it. Browser-direct (`dangerouslyAllowBrowser`), no backend; key + model persist in IndexedDB via `prefs-repo` and mirror into `src/lib/settings.ts` (`hasKey` reads the sync mirror). Settings UI: `src/components/settings/{ai-access,key-entry,model-control}.tsx`.
- **Rename** — `src/components/favorites/rename-dialog.tsx`, opened by the pencil on saved cards (a base feature for everyone). Manual edit always works (no key); the AI section (`src/features/agent/rename.ts` → `suggestNames`, persona in `knowledge/naming.md`) appears only with a key and *suggests* names. `suggestNames` throws on API error so the dialog shows it — no silent failure.
- **Prime directive (as shipped):** AI is absent and unprompted without a key; it never computes color. Manual rename is a base feature for all, so the no-key app is not strictly byte-for-byte, but the *AI* surface is — a deliberate reinterpretation (recorded in the log + `ai-layer-v1` memory).
- **Deferred (epic phases 2–4):** Prompt-to-Palette (text input), the thinking feed, conversational refine. `docs/plan-remove-ai.md` is the historical record of the earlier removal.

**Parked:** the mood-board input (N inspo images + optional prompt); lifting the color "comfort band" (never-pure-white/black, sat caps) into explicit constants / `/knowledge` (the `color-comfort-band` memory); exposing the engine as an agent-callable MCP/API surface.

## Build log

This repo keeps a working record of the build in [`log/`](log/) — **one file per date** (`log/YYYY-MM-DD.md`); append the day's beats. Each beat is recap-shaped: what changed (+ commit SHA), a short recap, and a one-line **why** only when there was a real decision or reversal. Terse — the recap you'd give at the end of a turn, not an essay. See [`log/README.md`](log/README.md).
