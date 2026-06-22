---
date: 2026-06-22
title: M2 interaction half — variations became rounds; added refine and fork-branching
phase: agent-loop
---

What changed: the journey store now holds a _sequence_ of variation rounds instead of one array. A refine bar (quick chips + free text) appends a steered round beneath the current one; re-picking a direction branches a fresh tail; the active path is marked "Exploring" on its direction card.

## Why / decisions

- **Rounds as a sequence, not a single set.** The user's vision was "scroll back and see where you came from." Modeling variations as `rounds: VariationRound[]` (initial fan-out + each refine stacked beneath, labeled `Refined · <steer>`) makes the trail literal — you see the progression, not just the latest result.
- **Refine anchors to the pick.** `refineJourney` calls `engine.refine(base, instruction)` with `base = chosen ?? recommendedOf(latest round)`. Tradeoff in the simulator: `SimulatedEngine.refine` re-derives the base hue from the picked palette's _accent_, so each refine drifts the hue slightly (plus the steer). Acceptable for a deterministic stand-in; the real ClaudeEngine will do "more like this" properly against the actual pick. Considered re-fanning from the original source + accumulated steer instead — rejected for now because anchoring to the pick makes "more like this" feel responsive.
- **Branching resets the tail.** Re-picking a direction clears `rounds` and re-descends, rather than keeping multiple simultaneous tails on screen. Multi-tail side-by-side compare was considered and deferred — a single revisitable path with a highlighted fork is enough and avoids a combinatorial UI. (Comparison across kept palettes is really the library's job, M3.)
- **Scroll only on first pick.** Tracked with a ref so selecting a variation reveals the final palette once, but subsequent re-picks update it in place without yanking the viewport — important now that you pick repeatedly while refining.

## Learned / surprised

- The scoring heuristic is **hue-invariant** — contrast, cohesion, and the harmony terms depend on lightness/saturation/value-range, not hue. So a "warmer" refined round shows the _same_ scores as the round it came from even though the colors clearly shifted. In the snapshot it reads like a no-op; it isn't (the swatch bands visibly move warmer). If scores should ever reflect temperature, the heuristic needs an explicit hue/temperature term. Flagging because it briefly looked like a bug during verification and wasn't.

## Open / next

- M3: persist a kept palette to the library (palette-repo) + a `/library` route, and export (JSON + CSS vars). The final scene's "Saving to your library and export come next." line is the placeholder for this.
- Outputs are still the simulated engine. M4 swaps in Claude behind the same seam.
