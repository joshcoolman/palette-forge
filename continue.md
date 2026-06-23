# Continue — palette-forge

## What was being worked on

Implemented `docs/plan-surprise-me.md` (the color-theory → "surprise me" reframe),
then iterated on presentation per live design feedback: a geometric library card,
and a takes-view redesign that moves actions onto each card. All changes are
**uncommitted** on `main`.

## Changes made so far

**Engine seam + data model (plan R1)**

- `src/features/palette/types.ts`: removed `PaletteType` / `PALETTE_TYPES` /
  `Direction`. `ScoredPalette` now `Palette & { character?: string; score: Score }`
  (free-form character, not a fixed type). `Source` gained forward-compat
  `images?: string[]` + `prompt?: string` (deferred mood-board seam; v1 unset).
- `src/features/agent/engine.ts`: `PaletteEngine` is now `compose(source, steer?)`
  plus `refine(base, instruction)` (dropped `proposeDirections` /
  `composeVariations`). `scorePalette(colors, policy)` de-typed; `finalizePalette`
  takes optional `character` and uses it as the score rationale when present.
- `src/features/agent/simulated-engine.ts`: `compose` returns four fixed-character
  takes (Vivid / Composed / Nocturne / Hush) varying hue rotation, accent
  sat/lightness, neutral tint. `refine` = compose from the kept palette's source.
- `src/features/agent/claude-engine.ts`: `compose` = the "four distinct UI
  palettes, surprise me" vision prompt; schema field renamed `rationale` →
  `character`; reads `source.prompt` as an extra steer. `composeLoop` de-typed.
- `knowledge/harmony.md` → `knowledge/characters.md` (character guidance, not a
  wheel taxonomy); `KNOWLEDGE_ORDER` updated in `knowledge-loader.ts`.

**Store + route (plan R2)**

- `src/lib/journey-store.ts`: `JourneyState` dropped `directions` /
  `directionsPhase` / `chosenType`; `startJourney` composes the opening four
  directly. `rerunJourney` **appends** another fresh four (keeps prior rows — does
  NOT reset). Added `saved: string[]` + `toggleSaved(id, palette)` (optimistic
  save/delete via palette-repo) for the heart. The empty/throw → visible-error-round
  regression moved from the old direction-pick to `compose`.
- **Journey persistence** (`journey-store.ts` + `lib/db.ts`): `JourneyState` gained
  `hydrated`; the store mirrors settled state to a new IndexedDB `journeys` store
  (DB_VERSION 1→2), debounced 400ms, never while a round is `running`.
  `hydrateJourney(id)` restores on reload; image deduped to one copy (persist with
  `seed.value` stripped, re-inject from `source.value` on load). `resetJourney`
  clears memory + IndexedDB. `journey-store.test.ts` imports `fake-indexeddb/auto`
  and drives the compose path via `startJourney`.
- `src/routes/forge.$sessionId.tsx`: removed the directions scene and the bottom
  `SelectedActions` panel; `SceneVariations` is the central scene; footer repeats
  Library / Start over. Hydrates on mount; shows "Loading your journey…" until
  ready; "Start over" is now a button (header + footer) calling `resetJourney` then
  navigating home. Deleted `scene-directions.tsx`, `direction-card.tsx`,
  `selected-actions.tsx`.

**Presentation**

- `src/components/library/library-card.tsx`: rebuilt as the geometric grid card
  (template `"a a b b" / "a a c d" / "e e f f"`, rows `2.4fr 1fr 1fr`), accent-led
  cell order `[accent, text, muted, border, background, surface]`. On-swatch role
  name (bold) + hex (watermark, ~0.22 alpha), tone picked by `relativeLuminance`.
  Per-card sun/moon toggle (lucide) flips that card light/dark. Fixed `w-[285px]`
  cards in a `flex-wrap` (`src/routes/library.tsx`), 9px labels, `rounded-[5px]`.
- `src/components/journey/palette-card.tsx`: takes-card restructured to a
  `motion.div` container + inner selection button + sibling overlay controls
  (avoids nested buttons). Heart (top-right, always visible, fill `#fb7185` when
  saved) toggles library membership; braces export button (top-right, hover) opens
  the modal; "Recommended" moved to top-left.
- `src/components/journey/scene-variations.tsx`: owns the `ExportModal` state;
  new props `savedIds` + `onToggleSave`; passes `saved` / `onToggleSave` /
  `onExport` to each card.

## Key decisions

- **Bands for the takes grid, geometric card for the library only.** "Best of both
  worlds" — fast scanning while composing, editorial contemplation in the library.
  The `/lab` route stays as the design surface; geometric card is NOT used in the
  takes view.
- **Library cell labels are role + hex** (not poetic per-color names) — honest,
  zero new machinery, reversible. Evocative naming is a possible later add.
- **Click-to-select stays** purely as the refine anchor ("More like this, but…"
  uses the selected take, else the recommended one). Flagged to the user as
  possibly vestigial now that hearts are the main action — open to dropping it.
- Heart = direct, optimistic library save/remove (no separate "save" step).
- **Re-run appends, never replaces** — capitalize on the model's non-determinism;
  a re-run is a new row to compare. Diversity-aware re-runs (telling the model what
  it already made) deferred as fiddly/unproven. Note: the no-key SimulatedEngine is
  deterministic, so its re-run rows are identical (expected); real key varies.
- **Journeys persist across refresh** (IndexedDB); only Start over clears. Persist
  only settled state so a refresh can't rehydrate a stuck "loading" row.
- Don't kill port 3000 after browser walks (it stopped the user's dev server once;
  the "WebSocket connection refused" they saw was Vite HMR + TanStack devtools,
  not app code).

## Outstanding work / next steps

- **R0 (de-risk):** run `harmony-baseline.mjs` with a real key on a few images to
  confirm the four come back genuinely distinct (needs the user's ANTHROPIC key).
- Optional: drop click-to-select and base refine on the recommended take.
- Deferred (in the plan, not started): mood-board input (N images + optional
  prompt), authored `knowledge/characters/*.md` reference languages, evocative
  per-color names for the geometric card.
- Verified via no-key SimulatedEngine browser walks: image → four distinct takes,
  refine, re-run, heart add/remove round-trips to library, per-card export,
  geometric library + sun/moon toggle. One keyed pass still worth doing.

## Git state

- Branch `main`, **nothing committed** this session. ~19 files modified, 3 deleted
  (`harmony.md`, `selected-actions.tsx`, `scene-directions.tsx`,
  `direction-card.tsx`), 2 untracked (`knowledge/characters.md`,
  `harmony-baseline.mjs`).
- Gate is green: `tsc --noEmit`, `eslint`, `vitest` (33 pass), `vite build`.
- Build-log beats appended to `log/2026-06-22.md` (marked "uncommitted"). Per the
  repo workflow, on "commit": `git add -A`, thorough message, `git push` to `main`.
