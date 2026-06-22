---
date: 2026-06-22
title: M4 confirmed live; made the wait legible by narrating the loop's real stages
phase: agent-loop
---

The user ran the real Claude path with their own key — it works ("works really well"). The one critique: a real generation takes a few seconds (API latency plus the propose → verify → revise loop), and during it the journey just showed skeletons.

## What I did

Added a live progress channel: `PaletteEngine` methods take an optional `onProgress(message)`; the engine emits its current move; the journey store holds it; the narration line that was already there goes *live* through the stages, with the dot pulsing while pending. On Claude you see: "Composing four takes…" → "Checking every pairing for contrast…" → "Reworking the 2 that missed a target…".

## Why this shape

- **Non-intrusive:** reuses the existing narration line and dot — no spinner, no new chrome. It just makes a line that was static go live.
- **Honest, and on-thesis:** the messages are the *actual* loop stages, not a fake progress bar. It deliberately surfaces the code-side contrast self-check and the revise step — the free-verifier loop is the product's whole differentiator, so the wait becomes a window onto the machinery rather than dead time.
- **Zero added latency:** it's just callbacks around the awaits the loop already does.

## Considered / deferred

Streaming Claude's *actual* summarized thinking (`thinking: {type:"adaptive", display:"summarized"}` over a streamed request) — more genuinely "fun," but it adds thinking tokens and latency, which is ironic against a complaint that it's already a bit slow. Kept as a possible opt-in later; led with the free, honest stage-narration instead.

## Verified / not

- Build + 28 tests green. `onProgress` is an optional param, so it's backward-compatible (the agent-loop tests didn't change).
- The staged timing only really shows under real latency (Claude). On the instant SimulatedEngine the messages flash by — that's correct, the sim genuinely has nothing to wait on.

## Open / next (still M5)

- The `border-on-surface` badge still shows red despite meeting its 3:1 target (passes = achieved text level). Fix: add a meets-target flag and color by it.
- A failed/refused round currently renders an empty grid — needs an error state.
- Abort-on-navigate, reduced-motion pass, README on /knowledge.
- M3 (persistence + export + library) still deferred.
