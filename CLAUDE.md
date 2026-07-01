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

- **Two generators behind one seam.** The seed-color and image paths are **deterministic** and never call a model: each take is a **treatment archetype** (`src/features/palette/tuning.ts`) — a hue-free relationship template (hero ground, cross-hue accent, light/dark duotone) filled with hues derived from the seed, plus harmonic re-run variety. The **prompt flow** (a worded brief, key-gated) is a second generator — **model-authored**: the BYO-key model returns whole palettes (all seven roles, both modes) and so *does* compute color. This **deliberately reverses the earlier "AI never computes color" line for that path only** — honoring worded intent (e.g. "nothing girly") and the future refine loop both require the model to own the colors (see the `model-direct-palettes` memory). Both impls sit behind the `PaletteEngine` seam; `RoutingEngine` (`get-engine.ts`) picks by `source.type` (prompt → `ModelEngine`, color/image → `SimulatedEngine`, also the fallback when the model returns junk). With no key the prompt on-ramp is absent and the app is fully deterministic. AI also still adds boundary enrichments (palette name suggestions). See the `ai-layer-v1`, `model-direct-palettes`, and `ai-at-the-boundary` memories.
- **AI re-runs are instant, not paid.** The model authors the opening round once; re-runs are free algorithmic variations *of* that output (`src/features/agent/derive.ts` rotates the colorway), so smashing regen stays the fast wall-of-color it is for deterministic seeds. Round 0 honors the brief; the rotations are exploration on top.
- **Expressive over compliant.** The north star is bespoke, surprising, Type-Explorer-grade palettes — saturated hero grounds, contrasting accents, real range across a round. **No runtime WCAG enforcement** (the old `repair()` loop and the numeric score were removed 2026-06-23 — they flattened bold combos and rewarded "one color + grays"). Legibility lives in the archetype recipes, not a checker.
- **Seed-coherence is the one hard rule — on the deterministic path.** For seed/image sources every neutral role carries the seed's hue, so a result always reads as the user's color; only the accent rotates away. A deterministic take that ignores the seed is a bug. The prompt path has no seed — the model authors freely, bound only by the brief.
- **The boundary is welded.** Image/seed color → deterministic palettes; a worded brief → model-authored palettes. Out the other side it's always clean palette records, nothing else. Not a design system, not an image editor, not a SaaS. Retune _what good color means_ via `src/features/palette/tuning.ts` (the deterministic dials), `knowledge/color-theorist.md` (the model's verbatim system prompt), and the rest of `/knowledge` prose.
- **Contrast is computed but unenforced.** `computeContrastChecks` still records WCAG ratios on each palette for reference (`src/features/color/contrast.ts` + `knowledge/contrast.md` policy), but nothing nudges colors to satisfy them and nothing is shown. Safe to fully excise later.
- **Data model:** clean, addressable records with stable IDs (MCP-ready). Don't bury palettes in React state.

## Current state

State lives in **git, not a handoff doc.** What changed and why is in the commit history and the dated beats in [`log/`](log/); outstanding or planned-but-unfinished work is tracked as **GitHub issues.** There is no `continue.md` — this file holds the **rules**, which don't go stale, and nothing here needs to be kept in sync with a session-state file. For the full architecture see [`docs/SPEC.md`](docs/SPEC.md); for the AI layer, [`docs/epic-ai-layer.md`](docs/epic-ai-layer.md); for the eval workflow, [`eval/README.md`](eval/README.md).

## Build log

This repo keeps a working record of the build in [`log/`](log/) — **one file per date** (`log/YYYY-MM-DD.md`); append the day's beats. Each beat is recap-shaped: what changed (+ commit SHA), a short recap, and a one-line **why** only when there was a real decision or reversal. Terse — the recap you'd give at the end of a turn, not an essay. See [`log/README.md`](log/README.md).
