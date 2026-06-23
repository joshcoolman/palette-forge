---
baseline: AA
pairings:
  - text-on-background: AAA
  - text-on-surface: AA
  - muted-on-background: AA
  - muted-on-surface: AA
  - accent-on-background: AA
  - background-on-accent: AA
  - border-on-surface: 1.5
---

# Contrast policy

Accessibility is non-negotiable, and it is checkable for free — so the agent
checks it before you ever see a palette.

- **Baseline:** every text pairing must clear **AA** (4.5:1). This is the floor;
  it is enforced in code and cannot be lowered from this file.
- **Primary reading** (`text-on-background`) should reach **AAA** (7:1) where the
  hue allows — it is the most-read pairing in the product.
- **Secondary text** (`muted-on-*`) must still clear AA. Muted means lower
  contrast, not illegible.
- **Accent** must be legible both as colored text or icons on the background
  (`accent-on-background`) and as a button background under its label, where the
  label uses the page color (`background-on-accent`).
- **Non-text UI** (`border-on-surface`) is held to a soft **1.5:1** — a refined,
  quiet hairline, not a hard line. WCAG 1.4.11 names 3:1 for non-text UI that must
  be *identified to be operated*; a decorative card divider isn't that, so we treat
  the rule as guidance here and let taste set a gentler line. The badge still
  reports the true ratio honestly.

The list above is the rubric the agent revises against. Tighten or loosen a
target by editing it — the proposals and the self-check shift together. The
math itself lives in code and is not editable here.
