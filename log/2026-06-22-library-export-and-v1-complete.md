---
date: 2026-06-22
title: M3 — library + export; v1 is functionally complete
phase: shipped
---

The last v1 piece: a saved-palette library and a multi-format export. User verified it end to end and called it a complete v1.

## What I did

- **Library** (`/library`): a static gallery of saved palettes — Coolors-style horizontal swatch band (with a thin dark strip beneath to keep our light+dark value visible) + name + a hover delete. Client-reads IndexedDB (no SSR loader — IndexedDB is browser-only). A **Keep** button on the final journey scene saves into it.
- **Export popup** (click a card, or "Copy / Export" on the final scene): a fontpair-style role-band detail (role + light/dark hex) over copy-able formats — **AI prompt** (the headline: a markdown table to hand a palette to someone's coding agent), **CSS variables**, **Tailwind** (with a **v3/v4 toggle**, each a complete pasteable setup — CSS vars + config/@theme, not a stub), **SVG**, and **Hex**.

## References that shaped it (the user shared four)

- **Type Explorer** (their own app) — role-labeled card grid, responsive 1→2→3, `rounded-2xl`.
- **fontpair** — big role bands with hex; "Export DESIGN.md" → confirmed the AI-prompt export.
- **Color Hunt** / **Coolors** — horizontal band cards; Coolors was the favorite. Adopted Coolors' "involved Tailwind" idea as the **v3/v4 toggle**; deliberately skipped its OKLCH/RGB/HSL color-space toggle — overkill for six semantic tokens (and our model is roles, not Coolors' arbitrary-5 with 50–950 shade scales).

## Verified

Walked the no-key path: journey → Keep → the card appears in `/library` → open the export modal → AI-prompt table renders → Tailwind tab shows the v3/v4 toggle and a complete v4 `@theme` + dark-variant + CSS vars. The export generators are unit-tested (CSS, prompt, Tailwind v3/v4, SVG). 32 tests, tsc, build all green.

Gotcha: agent-browser couldn't click the card's _unlabeled_ band button (a button containing only color spans) — "matched 3 elements." Used a JS `.click()` via eval to open the modal. Worth a note: unlabeled icon/swatch buttons are hard to drive with the accessibility-tree automation.

## v1 complete

All seven spec v1-cut items are done: key entry, image/seed input, the propose → self-check contrast → revise → fan-out loop, light/dark comparison, NL refine, save-to-library, export. The spec's "JSON" export became the AI-prompt + CSS/Tailwind/SVG/hex set, per the user — more useful for the real case (communicate a palette to an agent) than raw JSON.

## Open / next (all optional polish, not blocking v1)

- `border-on-surface` badge still red despite meeting its 3:1 target (passes = achieved text level) — add a meets-target flag.
- Error/refused-round UI state (currently an empty grid).
- Reduced-motion pass; README on `/knowledge`.
- A raw-JSON export would be a trivial add if wanted.
- Still deferred from the start: MCP server, subdomain hosting, knowledge-authoring mode, image vision enrichment.
