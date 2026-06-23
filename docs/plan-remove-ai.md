# Plan — remove the AI engine, name palettes deterministically

**Status:** vetted-pending. Authored 2026-06-23. Read [`CLAUDE.md`](../CLAUDE.md),
[`docs/SPEC.md`](SPEC.md), [`docs/OVERVIEW.md`](OVERVIEW.md), and the latest
[`log/`](../log/) before executing.

## Why

Lived experience: the deterministic engine (four characters + harmonic re-run
variety + WCAG verification + hearting) *is* the product. The LLM added latency,
a BYO-key wall, and network/failure modes for a marginal, key-gated upside, and
its one unique contribution — evocative names — is better done in code. Removing
it leaves a faster, free, predictable app. This resolves the long-standing
`sim-engine-may-be-enough` question: the sim engine was enough.

This reframes the project's identity from **agent-first / BYO-key / vision** to a
**deterministic color studio with honest WCAG verification and a human-taste
loop**. The generate → verify → refine *loop* (the real "agent") stays; only the
LLM dependency goes. Fully reversible — git keeps the engine.

## Decisions (locked)

- **Remove the AI entirely** — no Claude engine, no BYO-key anywhere. Keep the
  `PaletteEngine` seam (one impl) for the MCP-ready-later goal.
- **Namer derived from the palette** — hue bucket + character pick the words,
  hash-seeded for variety, deduped within the round. Stable per palette.

## The deterministic namer

New `src/features/palette/namer.ts`: `nameFor(palette, seenNames) → string`.

- **Word A — hue/material**, chosen by the accent's hue bucket, in the voice of
  the curated seed swatches (Polar Night, Autumn Blonde, Loden Frost, Caramel
  Café): warm → Ember/Amber/Rust/Caramel; gold → Brass/Honey/Tawny; green →
  Loden/Fern/Moss/Olive; teal/cool → Harbor/Slate/Frost/Tidal; blue → Indigo/
  Cobalt/Midnight; violet/magenta → Plum/Orchid/Mauve; near-neutral → Ash/Stone/
  Linen.
- **Word B — mood**, from the take's character: Vivid → Bold/Bright/Flare;
  Composed → Studio/Quarter/Press; Nocturne → Midnight/Deep/Onyx; Hush → Soft/
  Veil/Calm. (A small `character → words` map keyed off `comp.name`.)
- **Hash-seed** the pick from the palette colors (e.g. a cheap string hash of the
  six light hexes), so the same palette always yields the same name but different
  palettes vary: "Rust Studio", "Loden Frost", "Harbor Hush".
- **Dedup** within the four of a round: pass a `Set` of names already used this
  round; on a clash advance to the next synonym (then, if truly exhausted, append
  a roman-ish numeral — rare). Cross-round collisions are acceptable (hash makes
  them uncommon); whole-grid dedup is out of scope.

Wire-in: in `SimulatedEngine.compose`, after building the four, run the namer so
`palette.name` is the evocative name and `palette.character` stays the one-line
description (today `name` is just "Vivid"/"Composed"/… — repetitive across
rounds; this is the upgrade). `samples.ts` already overrides names — leave it or
let it use the namer, its call.

## Removal map

**Delete:** `src/features/agent/claude-engine.ts`, `client.ts`, `prompts.ts`,
`agent-loop.test.ts`; `src/components/settings/key-entry.tsx`,
`model-control.tsx`; `src/features/key/key-repo.ts`'s key/model functions.

**Strip:**
- `get-engine.ts` → always return the (singleton) `SimulatedEngine`; drop the
  key/model branch.
- `engine.ts` (`PaletteEngine`) → keep `compose`; the `variation` param stays.
  Drop `refine` from the interface only if we remove refine (see open decision).
- `settings.ts` → keep only `skipDeleteConfirm`; drop `apiKey`/`model`/their
  saves. Prefs persistence (`skip-delete-confirm`) moves to a slimmed
  `prefs-repo.ts` (rename of `key-repo.ts`, or keep the file with only prefs).
- `global-nav.tsx` → remove `<ModelControl>` (keep the font dropdown).
- `routes/settings.tsx` → remove `<KeyEntry>`, keep `<Preferences>`.
- `routes/index.tsx` → drop `hasKey`/`canRefine` plumbing.
- `journey-store.ts` / `journey-store.test.ts` → drop key-aware paths;
  `ensureHydrated` stays (now only prefs).

**Keep:** `PaletteEngine` seam, `SimulatedEngine`, `/knowledge` + `contrast-policy`
(still the contrast + scoring source — no longer an LLM prompt), `scorePalette`,
`finalizePalette`, the whole working-area loop.

## Refine — remove (decided)

Refine (the warmer/cooler/… chips → `applySteer`) is being removed: delete
`RefineBar` (`src/components/forge/refine-bar.tsx`), `refineJourney` + the
`recommendedOf` anchor in `journey-store.ts`, the `onRefine`/`canRefine` props on
`SceneVariations`, and `refine` from the `PaletteEngine` seam +
`SimulatedEngine`. The loop becomes source → four takes → re-run (harmonic) →
heart. (`applySteer` in `simulated-engine.ts` becomes dead — remove it too.)

## Milestones

- **M1 — namer:** add `namer.ts`, wire into `compose`, name the four uniquely per
  round; takes/cards show evocative names + character subtitle. (AI still present
  but unused for naming.)
- **M2 — excise the engine:** delete Claude engine/client/prompts/test; collapse
  `get-engine`; resolve refine per the decision.
- **M3 — excise the key/model UI:** remove KeyEntry + ModelControl; slim
  `settings.ts` + prefs-repo; clean `index.tsx`/`global-nav`/`journey-store`.
- **M4 — docs + memory:** update `SPEC.md` / `OVERVIEW.md` / `CLAUDE.md` to the
  deterministic-studio identity; resolve the `sim-engine-may-be-enough` memory.

## Gate

`tsc`, `eslint`, full `vitest` (drop the Claude tests, add 1–2 namer tests:
determinism + per-round uniqueness), prod `pnpm build`. Browser-walk: source →
four uniquely-named takes → re-run → heart → no key/model UI anywhere. Append a
`log/` beat per milestone.

## Deferred — AI at the boundary

Not part of this plan, but the reason removal is safe long-term: AI may return at
the **boundary** — the engine + WCAG verifier exposed as an agent-facing tool
surface (MCP/API), not an in-app LLM. Keeping the `PaletteEngine` seam + stable-id
records intact (this plan does) is what preserves that option. See the
`ai-at-the-boundary` memory.

## Hold the line

- Welded boundary unchanged: image/seed in → palettes out; contrast math locked.
- The four-distinct-characters generation, harmonic variety, typography system,
  flip `FavoriteCard`, circular `IconButton` set all stay.
- `/knowledge` survives as the contrast policy + taste rubric; it stops being a
  model prompt, nothing more.
