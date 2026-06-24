# Plan — Creative Rename (Phase 1)

Part of [epic-ai-layer.md](epic-ai-layer.md). Prerequisite: [plan-ai-byo-key.md](plan-ai-byo-key.md).

## What this is

A per-card "rename" action that uses Haiku to generate a more culturally-aware, evocative two-word name. The deterministic `nameFor()` name renders instantly and is always the permanent fallback — the model name swaps in when it arrives. It never blocks, never breaks, never delays the experience.

This is the smallest possible AI feature. Its job is to prove the key → call → knowledge → UI swap-in pattern before anything bigger is built on top of it.

## How it works

1. User sees a palette card with a deterministic name ("Harbor Hush")
2. With a key present: a small rename icon appears on hover
3. User clicks → Haiku is called with the palette's colors + the `knowledge/naming.md` persona + optional city-level locale
4. While waiting: the existing name stays, no spinner on the name itself (spinner on the icon)
5. Model returns a two-word name → it swaps in; if it fails or returns invalid output, the deterministic name silently stays

## The knowledge persona

New `knowledge/naming.md` — prose that defines the naming voice. Example: "Two words, evocative. Cultural and film references welcome. Lean into materials, places, moods. You may use the user's city for local color." Editing this file measurably changes naming behavior — same pattern as `contrast.md` being readable and forkable.

## City-level locale

- Coarse IP-based city-level locale only. No browser geolocation, no permission prompt, no GPS, never precise coordinates.
- Used only on the rename call (e.g. "Stumptown Brown" for Portland)
- **Shown transparently in the UI** — display the detected city somewhere visible (a corner of Settings or the nav) so the user can see what the app knows
- An off toggle disables locale use; rename still works without it

## Validation

A simple validator rejects the model's output if it's not exactly two words, is empty, or contains unsafe content. On rejection: the deterministic name stays silently. The validator is intentionally cheap — this is a name, not a color.

## Acceptance criteria

- [ ] Deterministic name renders instantly; rename icon appears only with a key
- [ ] Model name swaps in or fails silently — the card never shows a blank name
- [ ] `knowledge/naming.md` changes measurably change naming output
- [ ] Detected city is visible in the UI; off toggle disables locale on rename calls
- [ ] No permission prompt, no GPS, no precise location ever used

## Files touched

- `knowledge/naming.md` — new persona file
- `src/features/agent/rename.ts` — new: `renamePalette(palette, locale?) → Promise<string>`
- `src/components/square-card.tsx` — rename icon on hover (key-gated), swap-in on resolve
- `src/features/prefs/prefs-repo.ts` — `localeEnabled` get/set
- `src/routes/settings.tsx` — locale display + off toggle

## Gate

`tsc`, `eslint`, `pnpm build`. Manual: add key → card shows rename icon → click → name swaps in. Edit `naming.md` → re-rename → different character. Remove key → no rename icon anywhere. Append a `log/` beat.
