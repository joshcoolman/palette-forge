# Continue — Palette Forge

## Where we are (committed)

Two big pieces landed this session, both committed to `main`:

### 1. Generation reworked to hero-ground archetypes
- `src/features/palette/tuning.ts` — `ARCHETYPES` (Jewel/Twilight/Sand/Paper/Meadow/Signal):
  hue-free treatment templates filled with hues **from the seed**. Hero saturated
  grounds, cross-hue accents.
- `src/features/agent/simulated-engine.ts` — composes from archetypes; **light/dark
  are genuine inversions** (ground↔text swap), not a darken pass.
- **Removed:** the numeric score (`scorePalette`, `Score` type, the card number) and
  the WCAG `repair()` enforcement loop. `computeContrastChecks` still records ratios
  but they're unenforced/unshown. Knowledge + SPEC + CLAUDE rewritten to match.

### 2. Official 7-color square swatch card (in `/lab` only so far)
- `src/components/square-card.tsx` — **`SquareCard`**, the locked official design.
  Standalone/presentational, takes `SquareSwatch[]` (label+hex), `showHex` prop,
  adapts to 5/6/7 colors. 4-col × 5-row square grid: background banner (top 3 rows) ·
  neutral row · secondary band + accent corner; bottom-left UPPERCASE labels with a
  tiny ~7px Pantone-style hex flourish.
- `src/routes/lab.tsx` — lean reference: `Card lab` → 7/6/5 cards (light+dark) on the
  **three official palettes** (Set 1 teal+gold / Set 2 blue+red / Set 3 green+red,
  exact hexes hardcoded) → `Together` (original chip cards).
- The 7th role **`secondary`** = the 30% of 60-30-10, derived analogously (~+35° off
  the background hue). **Derived in the lab only — NOT in the engine/types/app yet.**

## NEXT TASK

Build the app's real card as "v2" from `SquareCard`:
1. Add the **light/dark swap** to the real card.
2. Promote **`secondary`** into `tuning.ts` / `types.ts` / the engine / the saved card
   (`favorite-card.tsx` SwatchFace, the flip card) / export (CSS vars + JSON).
3. **Replace** the current 6-role card with this 7-color square design.

Josh is committed to the new direction (secondary included). He said "treat as v2 so we
could go back" — my recommendation: do it as a clean replacement, use git for rollback,
don't maintain a parallel v2 long-term. He's open to either; confirm before deleting the
old card.

## Verify pattern
`agent-browser` with `AGENT_BROWSER_EXECUTABLE_PATH` = Chrome (per global notes); dev on
:3000 (falls back to :3001 if busy). `tsc` / `pnpm test` (vitest, 37) / `vite build` —
all green at session end. `/lab` is the design reference.
