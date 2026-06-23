# Plan — collapse to one page (+ Settings)

**Status:** vetted-pending. Authored 2026-06-23 at the end of a long design session;
written to be executed in a fresh session. Read [`CLAUDE.md`](../CLAUDE.md),
[`docs/SPEC.md`](SPEC.md), and the latest [`log/`](../log/) entry first.

## Why

The Favorites page already reads as the whole product; Home and Forge are
scaffolding around it. Collapse Home (source picker) + Forge (the four takes /
refine / re-run) + Favorites (saved grid) into **one page**, keeping **Settings**
separate. Fewer routes, one surface, same function — fits the welded-boundary,
minimal ethos. Nothing about _what good color means_ changes; this is pure
shell/interaction restructuring.

## Target shape

```
┌ Palette Forge ───────────────────────── [font] [model] ┐   global nav
│                                                          │
│  Palette Forge                          ( + )◄ popover   │
│  N saved palettes                                        │
│                                                          │
│  ┌ working area — only while a set is active ──────────┐ │
│  │  four takes · refine · re-run · Start over          │ │
│  └──────────────────────────────────────────────────────┘
│                                                          │
│  [ saved grid — FavoriteCards: flip, code, delete ]      │
└──────────────────────────────────────────────────────────┘
   + /settings (unchanged route)
```

### The `+` popover (replaces the Home `SceneSource` page)

A small popover anchored to the `+` button:

- **Top:** "Upload Image" — click opens the file dialog; drag-drop onto the
  popover also works.
- **Middle:** the small grid of curated seed colors (today's `CURATED` set in
  `scene-source.tsx`).
- **Last cell of the grid:** the eyedropper (native color input) for a custom color.

Picking any source closes the popover and starts an active set. Repackage the
existing `SceneSource` logic (`startFromFile` / `startFromColor` / `CURATED` /
eyedropper) into a compact popover component; drop the big dropzone + "or start
from a color" divider layout.

### The working area (replaces the `/forge/$sessionId` route)

When an active set exists, render `SceneVariations` (four takes + refine bar +
re-run) **inline, pinned above the saved grid**, plus a "Start over" that clears
the active set. Hearting a take saves it to favorites (existing `toggleSaved`,
which writes through `palette-repo`); the saved grid below updates reactively.
No per-set URL.

### The saved grid (the current Favorites page)

`FavoriteCard`s from `palette-repo` (`listPalettes`). Must **refresh when hearts
change** (today's `FavoritesPage` only loads once on mount) — re-list on
save/delete, or subscribe.

## State & routing

- **Routes after:** `/` (the one page) and `/settings`. Remove
  `/forge/$sessionId` and `/favorites`; fold Home into `/`. `/lab` is a dev
  scratch route — leave it or delete it, out of scope either way.
- **Active set:** one in-memory session in `journey-store` keyed by a fixed id
  (e.g. `'active'`) instead of a route param. Recommended: keep the existing
  IndexedDB persist/rehydrate so a reload restores an in-progress set _and_ the
  favorites — it's already built; just point it at the single fixed key. (Simpler
  fallback: ephemeral working area, favorites still persist.)
- **Favorites persistence:** unchanged (`palette-repo` / IndexedDB).
- **Nav:** wordmark → `/`; **drop the "Favorites" link** (the page _is_ it); keep
  "Settings"; keep the font + model selectors.

### Sample palettes (on demand, not auto-seeded)

**Revised (built):** no auto-seed, no `localStorage` gate. Instead the **empty
state** offers a "Create sample palettes" button that builds **3 known-good
samples** on demand — `createSamplePalettes()` runs the deterministic
`SimulatedEngine` over three fixed seeds (warm / green / cool), keeps one distinct
character each (Vivid / Composed / Nocturne), and saves them under friendly names
(Sunset Studio / Field Notes / Deep Harbor). Deletable like any other; deleting
them all is permanent until you press the button again. Cleaner than a hidden
flag — nothing reappears on its own. Lives in `src/features/palette/samples.ts`.

## Milestones

- **M1 — combined page:** new `/` renders the saved grid + `+` popover + inline
  working area, reusing `SceneVariations` / `FavoriteCard` / `ExportModal` /
  `DeleteConfirm`. Wire popover → active set → working area → heart → grid
  refresh. (Old routes can still exist during this step.)
- **M2 — retire old routes:** delete `/forge/$sessionId` and `/favorites`; update
  the nav and every `to="…"` link; add redirects from the old paths to `/`.
- **M3 — samples + empty state:** _done._ Empty state offers "Create sample
  palettes" → `createSamplePalettes()` writes 3 known-good samples on demand (no
  auto-seed, no gate). See _Sample palettes_ above.
- **M4 — polish:** popover visual design + open/close + outside-click + Esc;
  working-area placement, enter/exit animation, and scroll behavior; active-set
  persistence; mobile widths. Browser-walk the full loop.

## Hold the line (do not regress)

- Welded boundary: image/seed in → palettes out. Contrast math stays locked
  mechanism; taste stays in `/knowledge`.
- Favorites persist; only explicit delete / Start over clears.
- Keep: the four-distinct-characters generation, the typography system
  (Fraunces + Inter default, `.pf-heading`/`.pf-body`), the flip `FavoriteCard`,
  the circular `IconButton` set.
- **AI stays de-promoted** — no "add key" prompt in the main chrome; the model
  selector only appears with a key; built-in generator is the default. See the
  `sim-engine-may-be-enough` memory.

## Gate

Per `CLAUDE.md`: `tsc`, `eslint`, and a production `pnpm build` must pass; browser-
walk the loop (pick source → generate → refine/re-run → heart → grid updates →
delete with confirm → reload restores). Then append a `log/` beat.
