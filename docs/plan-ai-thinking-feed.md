# Plan — Thinking Feed (Phase 3)

Part of [epic-ai-layer.md](epic-ai-layer.md). Prerequisite: [plan-ai-prompt-to-palette.md](plan-ai-prompt-to-palette.md).

## What this is

A paced, real-time progress feed that replaces the spinner during generation. Every line on screen corresponds to something that actually happened. No fabricated steps, no fake progress — legibility pacing only.

This works for all users, not just keyed ones. The engine feed runs on every generation.

## What actually happens in compose (read from the code)

The repair loop was removed, so the narrative from earlier drafts ("accent 3.9:1 fails AA · darkening") is no longer accurate. What actually happens per archetype in `simulated-engine.ts`:

1. Pick base hue from the source
2. Derive the seven role hexes via the archetype's ground/accent dials
3. `finalizePalette()` → `computeContrastChecks()` records contrast ratios
4. `nameFor()` picks the evocative name

These are all genuine, narrate-able steps. The contrast check doesn't repair — but it does produce a real ratio and pass/fail. That's still a real story: `"Jewel — background/text 6.8:1 passes AA · named Harbor Hush"`.

## Event architecture (decided by reading the code)

`ProgressFn = (message: string) => void` already exists in `engine.ts` and is passed through `compose()` — it's called once today ("Composing takes…"). This is the right seam.

**Extend `compose()` with a second typed callback** alongside the existing `onProgress`:

```ts
compose(
  source: Source,
  onProgress?: ProgressFn,
  variation?: number,
  usedNames?: Iterable<string>,
  onEvent?: (event: EngineEvent) => void,   // ← new, optional
): Promise<ScoredPalette[]>
```

`EngineEvent` is a small discriminated union:

```ts
type EngineEvent =
  | { type: 'seed'; hex: string }
  | { type: 'archetype:start'; key: string; character: string }
  | { type: 'archetype:contrast'; key: string; pairing: string; ratio: number; passes: string }
  | { type: 'archetype:named'; key: string; name: string }
  | { type: 'archetype:complete'; key: string; palette: ScoredPalette }
  | { type: 'model:note'; text: string }   // from prompt-engine, before compose runs
```

Keeping `onEvent` optional and additive means no existing callers break.

## Pacing architecture

The engine emits events synchronously (sub-ms). The UI **buffers all events into a queue** and drains one per ~350ms interval. This is legibility pacing — the engine isn't slowed.

```
engine emits synchronously → eventQueue[]
                               ↓
                        useEffect interval (350ms)
                               ↓
                        shownEvents[] (rendered)
                               ↓
                   when archetype:complete → reveal palette card
```

`shownEvents` is the displayed list. The current (last) event is emphasized; older ones dim. As each `archetype:complete` event is drained, its palette card mounts below the feed.

## Two sources of content

**1. Engine events (always, no key required)**
Emitted during every `compose()` call. The feed works on any re-run, not just prompt-to-palette.

**2. Model status notes (prompt path only)**
Before `promptToSeed()` calls the model, it instructs it to emit short notes (present tense, ≤6 words, one per decision) before the JSON fence. These arrive as `{ type: 'model:note' }` events and are prepended to the queue before the engine events. The raw stream is available via a disclosure triangle.

## Feed layout

```
leaning warm and earthy          ← model:note (dimmed, complete)
picking a cross-hue accent       ← model:note (dimmed, complete)
seed locked #a85c2e              ← seed event (dimmed)
Jewel — background/text 6.8:1 ✓  ← archetype:contrast (dimmed)
named Harbor Hush                ← archetype:named (dimmed)
▶ composing Twilight…            ← archetype:start (emphasized, current)

[ Harbor Hush card ]             ← revealed after archetype:complete drained
```

One active line emphasized. Completed lines dim and compress above. Palette cards appear as each archetype finishes — the output arriving IS the progress.

## Acceptance criteria

- [ ] Every event corresponds to a real engine action — no hardcoded or fabricated text
- [ ] Feed appears on all generation (no key required)
- [ ] Pacing is legibility-only (~350ms/event); engine is never slowed
- [ ] Model notes appear before engine events on the prompt path; raw stream behind a disclosure triangle
- [ ] Palette cards reveal one by one as archetype:complete events drain
- [ ] One active event emphasized; completed events dim above it
- [ ] No existing `compose()` callers break (onEvent is optional)

## Files touched

- `src/features/agent/engine.ts` — add `EngineEvent` type, `onEvent` param to `PaletteEngine.compose`
- `src/features/agent/simulated-engine.ts` — emit events during compose (seed, per-archetype start/contrast/named/complete)
- `src/features/agent/prompt-engine.ts` — parse model notes from stream; prepend as `model:note` events
- `src/components/thinking-feed.tsx` — new: paced drain, event list, disclosure triangle
- `src/routes/index.tsx` — pass `onEvent` to compose; render `ThinkingFeed` during active generation

## Gate

`tsc`, `eslint`, `pnpm build`. Manual (no key): re-run → engine feed appears, paced → palette cards reveal one by one. Manual (with key, prompt): model notes appear first → engine events follow → cards reveal. Disclosure triangle shows raw stream. Append a `log/` beat.
