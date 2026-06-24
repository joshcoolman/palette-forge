# Rebrand + launch fixes

Batch of pre-launch UX changes for hosting at colorfordays.com: rebrand to "Color for Days", a lively first-run state, a default palette-mode preference, an ESC shortcut, new default fonts + pairings, and a font lock on the swatch labels.

## 1. Lively first-run state (whenever the library loads empty): auto-start a round + seed samples

A visitor should land on a page that's already alive — a generated round of takes in the working area *and* three saved palettes in the grid — so they can immediately start clicking around (re-run, heart, flip, export) instead of facing an empty page.

Target state:
- Working area populated with a generated round from a fixed neutral seed **#8d8d8f** ("From #8d8d8f"), re-run + X controls live.
- Saved grid holds the three samples (Sunset Studio, Field Notes, Deep Harbor).

Trigger: **whenever the library loads empty** — a brand-new visitor, or someone who deleted everything and then reloaded. Behavior:
- Mid-session the blank "Create sample palettes" empty state is fine to show (e.g. right after delete-all); it is *not* auto-reseeded until the next fresh load.
- On a fresh load with zero saved palettes, the bootstrap re-seeds the samples and opens the round.
- A populated library is left alone; an in-progress round is restored via `hydrateJourney` and never overwritten.

Implementation (`src/routes/index.tsx`) — one bootstrap effect that runs after `hydrateJourney` settles: mirror prefs, then `const existing = await listPalettes()`; if `existing.length === 0`, `createSamplePalettes()` + `refresh()`, then `startJourney(ACTIVE, colorSource('#8d8d8f'))` when the journey has no source. `startJourney` persists the round to IndexedDB. No once-ever flag — the empty-library check is the gate.

## 2. Default palette display mode (light/dark) setting

Follow the two-layer prefs pattern.
- `src/features/prefs/prefs-repo.ts` — `default-palette-mode` (`getDefaultPaletteMode`/`setDefaultPaletteMode`, default `'dark'`).
- `src/lib/settings.ts` — add `defaultPaletteMode` to `Settings` + `saveDefaultPaletteMode`.
- `src/components/settings/preferences.tsx` — second control row (Dark/Light) below delete-confirm.
- `src/components/favorites/favorite-card.tsx` — optional `defaultMode` prop seeds `useState<Mode>`; the per-card Sun/Moon toggle still works.
- `src/routes/index.tsx` — read `getSettings().defaultPaletteMode` after hydration, pass `defaultMode` to each `FavoriteCard`.

## 3. ESC dismisses the generated round

`src/routes/index.tsx` — `keydown` listener: `Escape` + `active` + no modal open (`!open && !confirming && !editingColor`) → `startOver()`. Mirrors the X button.

## 4 + 5. Font defaults and new pairings

`src/features/typography/pairings.ts`:
- `DEFAULT_PAIRING_ID` → `'space-grotesk-inter'`.
- Append: `pt-sans-ibm-plex-serif` (PT Sans + IBM Plex Serif), `alegreya-source-sans-pro` (Alegreya + Source Sans Pro), `gloock-inter` (Gloock + Inter). `loadFontByName` fetches any Google family on demand — no registration.

`src/routes/__root.tsx` — swap the Fraunces preload stylesheet for Space Grotesk (`family=Space+Grotesk:wght@400;600;700`); keep Inter; update the comment.

## 6. Lock the on-swatch label + hex font (SquareCard)

`src/components/square-card.tsx` — the swatch label/hex text inherits the body font and shifts with the pairing. Lock with inline `fontFamily`: label → `"Space Grotesk", system-ui, sans-serif`, hex → `"Inter", system-ui, sans-serif`. Both families are always loaded via `__root.tsx`. The text-specimen back face keeps `.pf-heading`/`.pf-body` (it is *about* showing the pairing).

## 7. Rebrand to "Color for Days" + strip the homepage header

Display name → **Color for Days** (repo name unchanged). Wordmark lives only in the global nav; the homepage drops its title + saved-count line. The saved grid stays.

- `src/app-meta.ts` — `name: 'Color for Days'` (drives the tab title "Color for Days — building in public").
- `src/components/nav/global-nav.tsx` — wordmark `Link` text → "Color for Days".
- `src/router.tsx` — "Back to Palette Forge" → "Back to Color for Days".
- `src/routes/index.tsx` — remove the `<h1>` and the saved-count `<p>` from the header; keep `SourcePopover` (the `+`) right-aligned.

## Verification

1. `pnpm build` passes clean.
2. Drive with agent-browser:
   - First run (fresh IndexedDB): working area pre-populated "From #8d8d8f" + 3 sample palettes in the grid; immediately clickable.
   - Reload after first run: round persists, grid intact.
   - Start over / delete-all: nothing auto-regenerates; empty-state + manual button remain.
   - Default mode: Settings → Light → reload → cards open light; per-card toggle still flips.
   - ESC: clears a round; does nothing while a modal is open.
   - Fonts: menu defaults to Space Grotesk + Inter; three new pairings apply; no flash on cold load.
   - Locked swatch font: switching pairing leaves the swatch labels/hex in Space Grotesk/Inter while the specimen back face changes.
   - Rebrand: nav shows "Color for Days"; homepage has no title/count; tab reads "Color for Days — building in public"; no stray "Palette Forge".
