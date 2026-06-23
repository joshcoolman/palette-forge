# Plan — Image → four palettes ("surprise me")

## The idea (the whole scope)

Here is an image. The customer obviously likes it and wants to see **four unique
color palettes that work well for UI. Surprise me.**

That's it. No color-theory step, no type-picker. The agent reads the image and
returns four genuinely distinct, UI-ready palettes, each with a short name and a
one-line character. The user can refine, branch, keep, and export — all of which
already exist.

## Why this shift

- Color-theory types (monochrome / analogous / triadic) are mathematical and
  opaque. People think in **character/vibe**, and — the user's words — "no one
  knows what triadic is." The five fixed cards all collapsed to "cool neutrals +
  a teal accent" anyway.
- The six-role, single-accent model can't render wheel geometry, but it is
  _exactly_ the vocabulary that real design languages speak (Braun, Apple,
  Teenage Engineering = restrained neutrals + one confident accent). So the
  "limitation" was only a mislabel.
- Lean on the model (vision) for the creative read; keep code only for the
  welded contrast verify. Net result: **fewer concepts, simpler code, better
  output.** This is a simplification of the codebase, not an addition.

## What changes

**Remove**

- Scene 1 direction-picker: `SceneDirections`, `direction-card`, the 5 type cards.
- `PaletteType` enum, the `Direction` type, and `knowledge/harmony.md`'s taxonomy.
- `proposeDirections` from the engine seam; `chooseDirection` / `chosenType` /
  `directions` / `directionsPhase` from the journey store.
- `type` threaded through compose and scoring.

**Reframe**

- `PaletteEngine` shrinks to: `compose(source, steer?)` → four `ScoredPalette`,
  and `refine(base, instruction)` (unchanged).
- A palette carries `name` + `character` (a free string the model names), not a
  fixed `type`. `ScoredPalette = Palette & { character?: string; score: Score }`.
- **ClaudeEngine.compose** = 120px vision image + "produce four distinct UI
  palettes, each a different character, surprise me" → structured JSON →
  code contrast-verify/revise → score. Already prototyped in
  `harmony-baseline.mjs` at the repo root.
- **SimulatedEngine.compose** = four deterministically-distinct palettes (vary
  temperature / value range / hue rotation across the four) so the no-key demo
  still works.
- `knowledge/harmony.md` → rewritten as guidance on producing four distinct,
  UI-appropriate characters with real range. `contrast.md`, `roles.md`,
  `palettes.md` stay.
- `scorePalette(colors, policy)` loses its `type` arg; the rationale wording
  that leaned on `type` is reworded around the palette's character.

**Stays welded / untouched**

- WCAG contrast mechanism, the six roles, light/dark composition.
- The store's round / refine / branch machinery (the first round is the
  surprise four; a refine appends a round; re-run re-surprises).
- Library + persistence, export modal, the 120px vision input, the extraction +
  peek widget, the action bar, the Motion animations.

**New flow**

Source → `compose` (one round of four) → the takes grid (`SceneVariations`, now
the first and central scene) → select → action bar. Refine appends a round;
"Re-run" re-surprises with a fresh four.

## Forward-compatible input (design for it, don't build it yet)

The reference a user wants is often just an image they already have — "I like
Teenage Engineering, so I hand it a Teenage Engineering photo." That's lighter
and more general than a tool-authored knowledge file. The natural growth is a
**mood board**: one _or several_ inspiration images plus an _optional_
color-related prompt (e.g. "I dig these; teal is probably our brand color — give
me palette ideas from these inspo shots" — note the prompt can carry a brand-color
hint).

So even though v1 ships single-image, **shape the input seam for N-images +
optional-prompt from the start** — model `Source` to anticipate a list of images
and an optional prompt — so the mood-board step is additive, not a refactor of
`Source` and every consumer (extraction, store, engine, seed, persistence). The
UI stays single-image; only the data model looks ahead.

## Milestones (each ends green: lint / tsc / test / build)

- **R0 — De-risk (no app changes).** Run `harmony-baseline.mjs` on a few real
  images; eyeball that the four come back genuinely distinct and UI-usable.
  Validates the core prompt before any refactor.
- **R1 — Engine seam.** `compose` / `refine` only; drop `PaletteType` /
  `Direction`; de-type scoring; both engines green; update the journey-store
  tests (the silent-failure regression moves from `chooseDirection` to
  `compose`, same intent — empty/throw → a visible error round).
- **R2 — Store + route.** Remove the directions scene; Source → compose → takes;
  narration/copy to match ("Four takes from your image — surprise. Refine or
  keep."); Re-run = re-surprise.
- **R3 — Knowledge + card polish.** Rewrite `harmony.md` → character guidance;
  the palette card shows name + character; full gate + a browser walk.

## Verification

Gate green at each milestone. Browser walk on the SimulatedEngine (no key):
image in → four distinct, usable palettes → refine → keep → export. Then one
keyed pass to confirm the vision read.

## Deferred (captured here so it isn't lost — explicitly NOT in this plan)

- **Mood board input.** One _or several_ inspiration images + an _optional_
  color-related prompt → palettes. The natural growth of "surprise me," and
  likely the real everyday path: people hand the tool images of what they already
  like. Build it after single-image feels great; the input seam is shaped for it
  now (see _Forward-compatible input_ above).
- **Reference / brand knowledge.** Authored `knowledge/characters/*.md` files
  (e.g. `braun`, `keychron`, `teenage-engineering`, `bmw-luxury`) that capture
  each design language's color principles — sharpening, not replacing, the
  model's latent knowledge. Note: user-supplied inspo images often make this
  unnecessary — the reference comes from the upload, not a maintained file. So
  authored knowledge is for **curated / featured** starting points (the moat),
  not the common case. Either way, step two; the plain "surprise me" has to feel
  great first.
- **Selection mechanism.** With many reference files you can't pour them all into
  one prompt: image → pick the character(s) that fit → load only those files →
  compose. Light retrieval over `/knowledge`. Open question: model-selected from
  the image vs user-picked from a roster vs both.
- **Reference-aware steer.** "More like Braun" / "more Teenage Engineering" in
  the refine box — mostly free, since the model already knows these.
- Brand names as internal _inspiration_; descriptive labels in shipping UI
  (trademark hygiene).
