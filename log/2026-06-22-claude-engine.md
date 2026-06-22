---
date: 2026-06-22
title: M4 — wired the real Claude engine behind the seam (BYO-key, structured outputs, hand-written revise loop)
phase: agent-loop
---

What changed: `ClaudeEngine` now implements the same `PaletteEngine` interface as the simulator, driven by a hand-written propose → self-check → revise loop over the Messages API. A `/settings` page takes a browser-stored Anthropic key; with a key the journey runs on Claude, without one it stays on the simulator (the no-key demo/fallback). An engine badge shows which is active.

## Why / decisions

- **Batched fan-out, not N parallel chains.** One `messages.create` returns all four variations; code verifies each against the contrast policy; a single revise call fixes the ones that fall short. The spec's literal "fan out N in parallel" would be N propose→revise chains (up to ~12 calls); batching is far cheaper on the user's key and still preserves the real propose → verify → revise loop, just at the batch level. Revisit if variation quality needs independent chains.
- **The mechanism/knowledge split holds inside the engine.** CODE computes WCAG contrast and decides what to revise (`policyFailures`); CLAUDE composes the palettes and writes each rationale. The recommendation is still the top *code* score — I did not hand the pick to Claude yet (could later; it's the "agent has a point of view" lever).
- **Structured outputs via `output_config.format` + `json_schema`.** Confirmed against the installed SDK types (`OutputConfig.format = JSONOutputFormat {schema, type}`) rather than guessing; the constrained JSON comes back as a text block which we `JSON.parse`. No zod dependency. Schemas use `additionalProperties:false` + role/type enums; array length isn't expressible in the schema (no minItems), so "exactly four, all six roles" is instructed in the prompt and validated in code (`toColorRows` drops a malformed palette).
- **No vision in M4.** Extracted hex anchors are passed as text, per the earlier decision (vision enrichment deferred). The image stays client-side for the thumbnail.
- **Settings are an in-memory mirror.** `src/lib/settings.ts` hydrates the key/model from IndexedDB once so the *synchronous* engine selector can read them; the store awaits `ensureHydrated()` before choosing an engine. No forced key-gating — try-before-key is better UX and keeps the simulator as a real fallback.

## Learned / flagged

- **Latent display bug (deferred to M5):** `ContrastCheck.passes` is `classify(ratio)` — the achieved *text* level — so `border-on-surface` (a 3:1 *non-text* target) renders as a red "fail" badge even though it MEETS its target. The revise loop itself is correct (it uses `policyFailures` / `meetsTarget`, which treats 3:1 as a pass); only the badge color lies. Fix: add a `meets`-its-target flag to the check and color badges by that, keeping `passes` as the honest achieved level. Caught this while writing the agent-loop test.
- The agent-loop test mocks `#/features/agent/client`'s `makeClient` (via `vi.hoisted`) and uses the *simulated* engine to manufacture a guaranteed-passing palette as the "fixed" response — handy fixture trick.

## Verified / not

- Verified: typecheck, 28 tests (revise-on-fail, stop-at-maxRevisions-with-honest-failures, refusal-throws), production build, the no-key journey live, and the settings page.
- **Not yet verified — needs a real key:** the live Claude generation. The one thing to watch on first real run is that `messages.create` + `output_config` returns the JSON in a text block as the parse path assumes.

## Open / next

- Live-verify with a key (add it at /settings, run a journey, confirm real palettes + populated contrast badges).
- M5 polish: the badge meets-target fix above, error/refusal UI states (a failed round currently renders an empty grid), abort-on-navigate.
- M3 (persistence + export + library) still deferred until the agent path is confirmed.
