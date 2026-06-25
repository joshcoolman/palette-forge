# Plan — Model-authored palettes (the AI-direct path)

Reshapes the back half of [epic-ai-layer.md](epic-ai-layer.md). Supersedes the
seed-only contract of [plan-ai-prompt-to-palette.md](plan-ai-prompt-to-palette.md)
for the **prompt flow** and is the precondition for
[plan-ai-conversational-refine.md](plan-ai-conversational-refine.md).

## Context — why we're changing the bet

The shipped prompt flow handcuffs the model: `promptToSeed` returns **one hex**, then
the deterministic engine builds the palette — and the engine alone chooses the accent
(`accent hue = seedHue + archetype.accentShift`, shifts of 150–200° in `tuning.ts`). A
green "lawn / serious / nothing girly" seed therefore gets a magenta/pink accent every
time (`eval/prompts.md`). The model read the brief correctly; it had no lever on the
thing the user objected to.

Two consequences forced the rethink:
1. **Intent fidelity** — "nothing girly" can't be honored when the model controls one
   hue out of fourteen.
2. **The refine loop is impossible** — "too saturated / too girly / warmer" has nowhere
   to land if the model didn't author the colors. Conversational refine (the goal) needs
   model-authored palettes as its substrate.

So for the **prompt flow**, the model authors the whole palette. This is a deliberate
reversal of the old "AI never computes color" line — *for this path only*. The
deterministic engine stays the generator for swatch and image seeds, and the fallback
when the model fails. The thesis becomes: **two generators behind one seam** — an
algorithmic one and a model one — and the prompt flow leans on the model "to see what it
can do with color."

## The principle this serves (constraint, not scope)

`/knowledge` becomes the real **source of truth** — and literally so: the system prompt
*is* the prose in `/knowledge`, sent verbatim. It's framed as a **role** —
`knowledge/color-theorist.md`: *"You are an expert in color theory. Here is what you
know…"* — which can **layer on** reference docs (color harmony, temperature, cultural
associations) as the taste deepens.

Transparency is the one invariant: composition is a **plain, ordered list of readable
files concatenated verbatim** (the pattern the repo already uses — `KNOWLEDGE_ORDER` in
`knowledge-loader.ts`), never a string built by code or a schema hidden in TypeScript.
Open the files, read exactly what's sent, edit any of them, and the output changes. Fork
the repo and re-aim it (the "children's-party-invitation maker" test) by rewriting the
role. We keep the `PaletteEngine` seam and addressable records sharp so that stays
possible — a constraint while building, not a feature here.

**Static layering now; agentic retrieval later.** v1 includes a small fixed set of files
every call (legible, simple). Letting the model *grab* theory docs as needed is genuine
retrieval/tool-use — powerful once the corpus is too big to send wholesale, but it
reintroduces the multi-turn machinery we set aside for transparency. Named future, not v1.

## The baseline (what v1 is, and isn't)

**v1 goal, stated operationally:** an editable system prompt (pulled from `/knowledge`,
verbatim) + the user's brief → **consistent, well-formed palette output**, every time.
The proof it works: *the model said "nothing girly" got pink, and we fix it by editing
the system prompt — not the code.* If massaging `color-theorist.md` can move the output,
the baseline is real.

Everything past that — layering extra theory docs, giving the model retrieval tools,
multi-turn refine — is acknowledged but **explicitly deferred and unclear**. We don't
design for it; we just keep the seams clean so it isn't walled out.

## The contract (the interesting part: reliable JSON from prose alone)

**No tool-use schema** — a tool's `input_schema` would live in code, invisible in the
markdown, breaking "what you see is what's sent." Instead the output format is *described
in the system prompt itself* (the shape + a worked example + "respond with ONLY valid
JSON, no commentary"), and getting consistent, well-formed JSON back is the prompt-craft
problem. That craft — iterating `generate-palettes.md` until the response parses every
time — is the deterministic contract worth solving.

The prompt instructs: return **N palettes** as a JSON array, each palette =

```jsonc
{
  "name": "Pit Lane",                 // model-authored name (namer is the fallback)
  "rationale": "deep steel + …",      // DEV-only: why this palette fits the brief
  "roles": {                          // all 7 roles, each light + dark hex
    "background": { "light": "#…", "dark": "#…" },
    "surface":    { "light": "#…", "dark": "#…" },
    "text":       { "light": "#…", "dark": "#…" },
    "muted":      { "light": "#…", "dark": "#…" },
    "border":     { "light": "#…", "dark": "#…" },
    "secondary":  { "light": "#…", "dark": "#…" },
    "accent":     { "light": "#…", "dark": "#…" }
  }
}
```

- **System prompt** = `knowledge/generate-palettes.md`, **verbatim** — one self-contained
  file holding the role meanings, the light/dark inversion, the comfort band, "honor the
  brief incl. negative constraints like *nothing girly*", AND the JSON format spec +
  example. (Authored by distilling today's taste prose, but shipped as one complete
  prompt; it supersedes the seed-only `prompt.md` for this flow.)
- **Parse + validate** — extract the JSON array from the response (tolerant of stray
  prose), then every hex through `normalizeHex` (`color-utils.ts`); drop any palette with
  a missing role or bad hex.
- **Reliability without tool-use** — one cheap **retry** on unparseable/empty output
  (the prose is the lever we're tuning); if it still fails, or fewer than the floor
  survive, **fall back to the deterministic engine** so it's never a dead end.
- **Model** — default this path to **Sonnet** (84 hexes + coherence + strict JSON is real
  work; Haiku is the cheap option but flakes more on format). Respect the Settings picker.
- **Count / latency** — start at the current round size (6); if latency hurts, drop to 4.
  Stream so the dialog can show progress (ties into the thinking feed later).

## Integration — reuse the pipeline, change one seam

Confirmed surface (Explore trace):

- Implement the existing `PaletteEngine` interface (`src/features/agent/engine.ts`) as a
  new `ModelEngine` — `compose(source, onProgress?, variation?, usedNames?) → Promise<ScoredPalette[]>`.
- Build the 7 `ColorRow`s from the model JSON and wrap each with **`finalizePalette`**
  (`engine.ts:48`) — it assigns the `id`, computes `contrast` (unenforced), stamps
  `createdAt`. Name = model's, else `nameFor` (`namer.ts:73`). **Zero changes downstream**
  (cards, save, export, journey rounds all consume `ScoredPalette`).
- **Routing** — `get-engine.ts` returns a small router implementing `PaletteEngine`:
  a prompt-bearing source → `ModelEngine`; color/image source → `SimulatedEngine`. The
  journey store (`runSurprise`, `journey-store.ts:233`) is untouched.
- **Source** — add `type: 'prompt'` to the `Source` union (value = the brief text) so the
  prompt overlay starts a journey with the brief itself instead of pre-converting it to a
  seed. The prompt dialog stops calling `promptToSeed`; `startJourney(ACTIVE, { type: 'prompt', value: text })`.
- **Re-run** — `variation`/`usedNames` already flow to `compose`; `ModelEngine` uses them
  to ask for a distinct round ("round N, different from before, don't reuse these names").

## Observability (dev-only) — both console + persisted

Instrument the one chokepoint (`client.ts`). Capture per call: timestamp, feature tag,
**resolved model id**, system prompt, messages, maxTokens, raw response, latency, parsed
result/validation outcome, error.
- **Console**, gated by `import.meta.env.DEV` — `console.groupCollapsed` per call.
- **Persisted** — a new `STORE_AI_CALLS` via the existing `idbPut` (`db.ts`) so an eval
  session is reviewable; a thin dev reader (route or console helper) lists recent calls.
- **Dev rationale** — in dev, the schema includes `rationale`; we log it. Production can
  omit it to save tokens. Makes "how did they reason" actually observable.

## Eval

- `eval/prompts.md` (done) — the two stable briefs + intent + must-nots.
- Manual now: run each via the UI with a real key; judge against the must-nots;
  observability shows the exchange. A scripted runner (auto-check "no magenta/pink hue in
  the racing result") is a later step.

## Docs / thesis reconciliation (part of this work)

Update `CLAUDE.md` ("Hold the line"), `docs/SPEC.md`, and the `ai-at-the-boundary` /
`sim-engine-may-be-enough` memories: the deterministic engine generates for seed/image;
the **prompt flow is model-authored** (the model computes color there, deliberately).
Per-commit gate stays green; docs match reality.

## References mined (color skills — reference, not dependency)

Two existing skills were studied to sharpen `color-theorist.md` and the layering design
(not adopted): **meodai/skill.color-expert** (a lean role + an `INDEX.md` + 140 deep
reference docs consulted as needed — research-backed) and **jezweb's color-palette** (one
hex → 11-shade scale + semantic tokens + WCAG → Tailwind CSS; strong pairing discipline).

- **Architecture validated.** meodai *is* the "role + progressively-layered theory,
  grabbed as needed" structure. Lesson applied: keep `color-theorist.md` **lean**; depth
  (OKLCH, APCA, color history, naming corpora) belongs in a *future references tier*, not
  the role file.
- **Folded into the prompt now** (research-backed, kept tight): character-first range
  (pale/muted/deep/vivid/dark — hue is a weak predictor of mood/emotion); mood from
  chroma + lightness, not hue; legibility = lightness separation (grayscale check;
  perceived lightness varies across hues); explicit 60-30-10; pairing discipline (every
  ground legible with its text in both modes). Negative-constraint-wins is reinforced —
  "nothing girly" becomes a *character* (no pale-pink), not a hue dodge.
- **The references tier (deferred future).** An `INDEX.md` + theory docs the model
  consults as needed = the "agentic retrieval" future; meodai is the blueprint. Also
  filed: richer naming via `color-name-lists` (18 systems); OKLCH-*derived* roles (author
  anchors, derive border/muted by a contrast target).
- **Aside, out of scope.** meodai's "HSL lightness is a lie; hue-harmony is weak; use
  OKLCH" is a quiet critique of the *deterministic* engine's HSL hue-rotation archetypes
  (`tuning.ts` `accentShift`) — irrelevant to the model-direct path, but the upgrade path
  if we ever revisit the engine.

## Build sequence (independently shippable slices)

1. **Eval prompts** — done.
2. **The contract** — `knowledge/palette-direct.md` + extend `client.ts` with a tool-use
   structured call + `promptToPalettes(brief, count, variation)` returning validated
   palettes. Unit-test the JSON→ColorRow parser/validator (no key needed). *The reliability
   slice — prove well-formed output.*
3. **Observability** — console + `STORE_AI_CALLS` + dev rationale at the `client.ts` seam.
4. **Wire it in** — `ModelEngine` + router in `get-engine.ts` + `Source 'prompt'` type +
   prompt overlay starts a prompt journey; reuse `finalizePalette`. Render through the
   existing pipeline.
5. **Reconcile docs + memories.**

Branch: continue on `feat/prompt-to-palette` or a fresh `feat/model-direct` (decide at
slice 2). Gate (`tsc`, `eslint`, `pnpm build`, tests) green per slice; a `log/` beat each.

## Verification

- Unit (no key): the parser/validator (valid → 7 ColorRows; missing role / bad hex →
  rejected; partial round → engine fallback fills).
- Manual (real key, user runs): both eval prompts → 6 coherent palettes as valid JSON;
  **racing brief has no pink/purple**; observability shows model + prompt + raw response;
  editing `palette-direct.md` visibly changes output.
