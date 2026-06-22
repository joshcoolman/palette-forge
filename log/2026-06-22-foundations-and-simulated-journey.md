---
date: 2026-06-22
title: Built the contrast mechanism, the knowledge layer, and a simulated journey before any Claude calls
phase: agent-loop
---

Goal this session: plan v1, then build the foundations (M0) and the first walkable experience (M1) — without spending a single token. Got through both; the full journey runs end to end on a deterministic engine.

## What I did

- M0 (mechanism/foundations): WCAG contrast math + color utils (`src/features/color/`), the `Palette` data model (`src/features/palette/types.ts`), IndexedDB repos for palettes and the BYO key (`src/lib/db.ts`, `palette-repo.ts`, `key-repo.ts`), the `/knowledge` markdown bundle + loader + a frontmatter contrast-policy parser (`src/features/knowledge/`). 25 tests (contrast math, storage round-trip, policy parse + baseline fallback).
- M1 (simulated journey): an engine seam (`src/features/agent/engine.ts`), a deterministic `SimulatedEngine`, a `useSyncExternalStore` journey store keyed by session, and the vertical animated journey (Motion) — source → typed directions → scored variations → final palette with light/dark mocks and honest contrast badges.

## Why the big decisions

- **Simulate-first.** The whole journey is built behind a `PaletteEngine` interface with a `SimulatedEngine` that uses no key and no tokens; a `ClaudeEngine` drops in behind the same seam later (M4). Reasoning: the journey's value — animation, scroll, scoring, branching, the feel — is all front-end and deterministic. Tuning that against the real API would be slow and cost tokens on every iteration. The simulator also becomes the pre-key demo, the no-key fallback, and the agent-loop test fixture. This was the single most load-bearing architectural call.
- **Journey-as-vertical-descent, not a flat contact sheet.** Emerged in planning conversation: each of the agent's moves is a scene that animates in, you pick a fork, it scrolls to the next, and the trail stays behind as provenance. Chosen because it makes the agent's reasoning into something you can walk — the "designer who builds agents" thesis made literal. A flat grid of N variations was the first sketch; rejected as generic.
- **Mechanism vs knowledge boundary for contrast.** Contrast _math_ is locked in `contrast.ts`; _which_ pairings and _what_ AA/AAA targets to check is policy living in `knowledge/contrast.md` frontmatter, parsed to a typed `ContrastPolicy` fed to BOTH the (future) prompt and the code verifier. A welded `BASELINE` floor is enforced in code so a malformed or hostile markdown edit can't drop below AA or brick the app. This is the spec's "edit the knowledge, the output shifts" made concrete.
- **Motion + CSS gradients over GSAP/Three.js.** The journey is fork/step-driven (click a path → animate → scroll to the next discrete scene), not scroll-scrubbed cinema — that's exactly the line where Motion fits better than GSAP. CSS `@property` gradient backdrop tinted by the current palette for delight; WebGL/Three deferred unless we later want literal 3D.
- **Data model out of React.** Palettes are addressable records in IndexedDB; the live journey is a tiny external store, not component state. Keeps the MCP-ready records clean and the store legible.

## Reversed / dead-ends (the useful part)

- **`text-on-accent` contrast policy was wrong — the free verifier caught it on the first real render.** I wrote `text-on-accent: AA` into `contrast.md`. The very first generated palette showed it failing at 2.41 (loud red badge). It is unsatisfiable with a single accent: dark text on a dark accent physically can't reach 4.5:1, and even pure-black text on that accent caps around 2.2. Reversed to `background-on-accent` (a white/page-colored label on the accent button) — realistic, satisfiable, and it matches what the preview mock already renders. The lesson is the whole bet paying off in development itself: the automatic verifier surfaced a policy mistake before a human had to notice it. Scores jumped 85 → 89 once the impossible pairing was gone.
- **First palettes were washed out and all looked the same.** Two separate bugs. (1) Neutrals were near-pure white (saturation ~0.03), so light mode was a stark-white field with one accent — no color presence. (2) The variation cards rendered the same fake-app mock with a ~4px accent dot, so genuinely different palettes were indistinguishable at thumbnail scale, and the four "takes" only nudged the accent hue. Fixes, over two rounds of user feedback: give neutrals a perceptible tint with a hard saturation FLOOR (never pure white), widen the background↔surface lightness gap (~0.045 → ~0.08 — two near-whites that close read as one blob), rotate the _whole_ palette hue across the four takes (−16/0/+20/+36°), and rebuild the cards as color-forward light+dark swatch bands. The full UI mock stays only in the final detail view, where it belongs.

## Learned / surprised

- The honest verifier is useful _to the builder_, not just the user — see the policy reversal above.
- Port 3000 was taken by another local site; Vite auto-incremented palette-forge to **3001**. Worth knowing for browser automation.
- The agent-browser daemon wedges intermittently (`os error 35`) — `pkill -f agent-browser` and restart; and clicks only bind after a fresh `snapshot` (stale refs click nothing, silently).
- TanStack route tree must be regenerated (`pnpm generate-routes`) after adding a route file, or tsc errors on the new route id and `useParams`. Don't hand-edit `routeTree.gen.ts`.
- Strict TS here is real: `verbatimModuleSyntax` forces `import type` discipline and `noUnusedLocals` fails the build on a stray import (caught an unused `contrastRatio`). The `#/` alias resolves in Vitest via package.json `imports`; `@/` only exists in tsconfig, so avoid it in runtime/test code.
- For light-mode neutrals, surface needs _more_ tint and a _bigger_ lightness step than instinct suggests.

## Open / next

- Committed at session end as the M0–M1 checkpoint (this entry included).
- M2 interaction half (revisitable trail + branch-from-a-fork + "more like this" refine bar) is not built; only the linear descent and output polish are.
- M3 persistence/export/library, M4 the real `ClaudeEngine`, M5 polish.
- The simulated outputs are a stand-in. The tint/floor/separation heuristics are written so they carry into the prompt we give Claude — the simulator is teaching us what to ask for.
