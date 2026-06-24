# Plan — Prompt-to-Palette (Phase 2)

Part of [epic-ai-layer.md](epic-ai-layer.md). Prerequisite: [plan-ai-byo-key.md](plan-ai-byo-key.md).

## What this is

A third input on-ramp alongside image and seed color: a text box. The user types something like "warm, mid-century, calm, good for reading" and gets a round of palettes. Exactly one model round-trip produces a single hex; the existing engine runs all six archetypes from it deterministically.

The model touches only the **input**. It never computes a color.

## Popover UX (decided by reading the code)

`source-popover.tsx` already has a clear two-section layout: image upload → divider "or start from a color" → swatch grid. A third section at the bottom follows the same pattern:

```
[ image upload zone ]
─── or start from a color ───
[ 14 curated swatches + pipette ]
─── or describe it ───          ← key-gated; hidden without a key
[ text input + Submit ]
```

No tabs, no reorganization. With no key the popover is unchanged. With a key, a third section appears below the swatches.

## What the model outputs (simplified from original spec)

Looking at the engine: `compose()` takes a `Source` and runs all six archetypes from a single `baseHue`. The only lever the model needs to pull is **one seed hex** — the engine fills in everything else. `archetypeBias` from the earlier spec is dropped from v1; it added complexity without a real hook in the current engine.

Model output is minimal:
```ts
{ seedHex: string }
```

The model receives the user's prompt + the `/knowledge` prose as system context and returns the hex that best captures the mood. The engine does the rest.

## Source mapping (zero engine changes)

A prompt result maps directly to the existing `Source` type:
```ts
{ type: 'color', value: seedHex, extracted: [seedHex] }
```
Note: `Source` already has a reserved `prompt?: string` field (forward-compat seam for the mood board). Set it to the original prompt text so it's available if needed later.

This means **no changes to `SimulatedEngine`, `engine.ts`, or the journey store** — the prompt path produces a `Source` and hands it to the same `startJourney()` call as every other input.

## Knowledge context

`knowledge-loader.ts` already has `KNOWLEDGE_ORDER` (`roles.md`, `palettes.md`, `characters.md`, `contrast.md`) and `getKnowledge()`. The system prompt concatenates these in order. No new infrastructure needed — just call `getKnowledge()` for each file and join them.

## Validation + fallback

A validator checks that `seedHex` is a valid 6-digit hex. On any failure (bad output, network error, timeout) it falls back to `#8d8d8f` (the neutral default used at first-run) and proceeds. Never crashes, never blocks.

## Relationship to the thinking feed

This plan ships with a basic spinner during the model call. [plan-ai-thinking-feed.md](plan-ai-thinking-feed.md) upgrades that UX in the next phase. These are independently shippable.

## Acceptance criteria

- [ ] Image and seed paths are untouched; prompt is purely additive
- [ ] With no key: popover is unchanged — no third section, no empty space
- [ ] Exactly one model round-trip; engine runs downstream unchanged
- [ ] `/knowledge` prose measurably steers the result
- [ ] Invalid model output falls back to `#8d8d8f`; never crashes or blocks
- [ ] Palettes appear at the same speed as any seed-color input

## Files touched

- `src/features/agent/prompt-engine.ts` — new: `promptToSeed(prompt) → Promise<string>` (returns a hex)
- `src/components/journey/source-popover.tsx` — third section (key-gated), text input + submit
- `src/routes/index.tsx` — wire prompt source → `startJourney` (same path as color)

## Gate

`tsc`, `eslint`, `pnpm build`. Manual: add key → popover shows text section → type a prompt → palettes appear at normal speed. Edit `knowledge/palettes.md` → same prompt → different hex. Remove key → text section absent. Append a `log/` beat.
