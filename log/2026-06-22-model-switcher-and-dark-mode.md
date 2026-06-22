---
date: 2026-06-22
title: Front-end model switcher, settings round-trip fix, and a less-inversion-y dark mode
phase: byok
---

Three things from user feedback after the M4 commit.

## Settings round-trip lost the journey

Symptom: open Settings from a journey, come back, "lose everything." Cause was *not* state loss — the journey lives in a module-level store that survives client-side navigation. The bug was that Settings's "Back" hardcoded `<Link to="/">` (home), so you landed on home with no link back to `/forge/$sessionId`. Fix: Back now does `router.history.back()`, returning you to the journey, which was there the whole time.

## Front-end model switcher

Added `ModelControl` in the journey + home header: with a key, a compact Sonnet 4.6 / Opus 4.8 / Haiku 4.5 dropdown (writes `settings.model`, applies on the next run); without a key, the "add key" link. A **Re-run** button on the variations regenerates the current direction — so "switch model → Re-run" is one move with no detour to Settings. Replaced the old `EngineBadge` (deleted).

## Dark mode — compose it, don't invert

The user clocked that dark looked like "an inversion of sorts." It wasn't a math inversion, but the value relationships did mirror. Two changes, knowledge first because it's the lever that shapes the *real* (Claude) output:

- **Knowledge:** added a "Dark mode — compose it, don't invert" section to `knowledge/palettes.md` — concrete rules: warm/cool charcoal backgrounds (~10–16% L, never `#000`), small elevation steps (~4–7%), **desaturate the accent ~10–20%** (a full-sat accent glows on dark), soften text (~90–94% L), quiet borders. This is the high-value change — editing this markdown changes what Claude composes.
- **Simulated recipe:** matched it so the no-key demo looks composed too — dark accents desaturated (~0.1 lower), dark background lifted into warm charcoal (0.115 → 0.13 with a touch more tint), smaller surface elevation step, muted raised for legibility. The accent already *flipped* lightness between modes; now it also clearly de-saturates, which is the bit that reads as "designed dark" rather than "lightened light accent."

## Decision

Committed without a browser re-test, per the user ("we can just commit it, I can come back if I have issues"). The green gate (typecheck, tests, production build) still runs — that's the non-negotiable floor.

## Open / next (still M5)

- `border-on-surface` badge still shows red despite meeting its 3:1 target.
- Refused/failed round renders an empty grid (needs an error state).
- Abort-on-navigate, reduced-motion pass, README on /knowledge.
- M3 (persistence + export + library) deferred.
