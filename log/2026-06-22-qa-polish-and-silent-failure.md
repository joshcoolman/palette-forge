---
date: 2026-06-22
title: QA polish pass — collapsed the final scene, slimmed export, and the silent-failure bug
phase: shipped
---

A rapid feedback loop after declaring v1 done. Three things, in order.

## Collapsed the final detail scene into an action bar

The bottom `ScenePalette` (light/dark mocks, role swatches, per-pairing contrast
badges) wasn't earning its scroll. You had to descend all the way to it before
realizing you could keep anything. Replaced it with a compact `SelectedActions`
bar that sits right under the refine controls and acts on the selected palette:
Save to library · Copy · Export · View library. Mounted with `key={chosen.id}`
so its saved/copied state resets per pick.

Tradeoff, called out explicitly: that scene was the only place rendering the
AA/AAA contrast badges. The verifier still runs (the agent still self-checks and
revises on fail) — it's just not displayed on the selected palette anymore. Left
a door open for a compact "passes AA" chip if it's missed. Deleted
`scene-palette.tsx` and, since they were now orphaned, `contrast-badges.tsx` and
`palette-preview.tsx` too. No-cruft over keep-just-in-case.

## Slimmed the export modal, then fixed its layout

First cut: replaced the verbose per-role hex rows (`background #f6f4f1 / #1f2928`
× six) with a single visual swatch band — the library-card look — since the name
already lives in the header.

Then the real problem surfaced: the modal was `overflow-auto` with a
**content-driven height**. Tailwind v4 output is long, so the whole pop-up grew
tall and scrolled _as a unit_, pushing the swatch band off the top — which read
as "the swatch is missing on the Tailwind view." CSS/Hex are short, so the modal
shrank. Net: the box resized and jumped between tabs.

Fix is structural, not cosmetic: fixed-height modal (`h-[600px] max-h-[85vh]`,
`flex flex-col`), header/swatch/tabs pinned `shrink-0`, and the code area the
only scroller (`min-h-0 flex-1` wrapper, `h-full overflow-auto` on the `<pre>`,
Copy button absolutely pinned so it doesn't scroll). Last nit: the v4/v3 toggle
was its own row that only appeared for Tailwind — an extra row = a small reflow.
Moved it onto the right side of the format pills (same row), so switching tabs
never changes the control row's height.

## The silent-failure bug (the valuable one)

User hit it twice on the real Claude engine: pick a direction, land on an empty
variations grid — no cards, no loading skeletons, and the narration cheerfully
saying "Here are the takes…". Only a manual Re-run cleared it.

Root cause was two doors into the same dead room, both in the store
(`chooseDirection`/`refineJourney`):

1. `composeVariations` **throws** (a transient overload/rate-limit, a refusal, or
   a truncated/malformed JSON body) → the `catch {}` set `phase: 'error'` — but
   `SceneVariations` had **no branch** for `'error'`, so it rendered nothing and
   the narration stayed on the happy path.
2. It **resolves with `[]`** — Claude returned palettes but the role-completeness
   filter (`withRows`) dropped every one → round is `done` with zero variations →
   pixel-identical blank.

So a real failure was indistinguishable from a fresh empty state. The `error`
phase existed but was never rendered anywhere — this is exactly the "show real
failures" issue I'd filed.

Fix, three layers:

- **Store:** an empty fan-out is now treated as a failure (`phase: 'error'` with
  a message), not a silent `done`. `catch (e)` captures the real message instead
  of swallowing it.
- **Scene:** render the error round — an honest line in the agent's voice plus a
  dashed block carrying the specific reason and a "Try again" button (wired to
  re-run for the initial fan-out). The narration no longer lies when a round
  failed.
- **Engine:** clearer messages at the source (`max_tokens`, refusal, and a
  parse-failure caught and reworded instead of leaking a raw `SyntaxError`), and
  bumped `MAX_TOKENS` 4096 → 8192 to reduce truncation-driven throws.

Locked it in with `journey-store.test.ts`: empty result → error round, thrown
error → message surfaced, non-empty → done. The store is module-global +
`useSyncExternalStore`, so the test drives it through `renderHook` with the
engine and settings mocked.

## Also: the Vercel deploy fix

Deploy failed at `pnpm install` — `unrs-resolver`'s native build script was
blocked (pnpm 10+ blocks build scripts by default; Vercel's non-interactive
install exits 1 rather than just warning). pnpm 11 no longer reads the `pnpm`
field in `package.json` — first attempt there was silently ignored with a
warning. Real home is `pnpm-workspace.yaml` → `onlyBuiltDependencies`, which
already listed `esbuild` + `lightningcss`; added `unrs-resolver`.

## Open / next

- The "passes AA" chip on the action bar, if the missing badges are felt.
- The error-state UI is covered by the store test but hasn't been seen live (the
  SimulatedEngine never fails, so it can't be triggered without a key + a real
  hiccup). Worth an eyeball next time the Claude engine misbehaves.
