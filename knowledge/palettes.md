# Palettes

What makes a palette good, independent of which hues are chosen.

- **Hero ground.** The background is a real color — a saturated mid-tone built
  from the seed's hue — not a near-white or near-black tint. The neutrals
  (surface, muted, border) are a family around it, sharing that hue.
- **Cross-hue accent.** The accent is unmistakably the accent: it sits in a
  *different* hue family from the ground (a warm spark on a cool ground, a cool
  depth on a warm one), separated in hue and saturation. Never a faintly-tinted
  gray.
- **Deliberate value range.** Span ground → text with intent. The ground owns its
  depth; the text is its duotone partner (light text on a dark ground, ink on a
  light one).
- **Seed coherence.** Every neutral role carries the seed's hue, so the whole
  palette reads as the user's color. Only the accent rotates away.
- **Range across the set.** A round spans treatments — deep jewel, moody
  twilight, warm sand, crisp paper, calm meadow, loud signal — the way a
  hand-built theme grid does. One airy near-light take is fine *as part of* that
  range, not as every take.
- **Restraint where it counts.** Six roles, no decorative extras. The interest
  comes from the ground/accent relationship, not from piling on colors.

## Light and dark are genuine inversions

Each palette ships a `light` and a `dark` rendering, and they **flip** — the
toggle is a real light/dark theme switch, not a "darken everything" pass.

- **Light mode is a true light theme** — a richly-tinted light ground (not flat
  white — let it carry the seed hue) with a deep, **color-carrying ink** text
  (the hero hue at low lightness, not pure black). Plus the bold cross-hue accent.
- **Dark mode flips it** — the hero saturated dark ground with light text. The
  deep hue that is the *text* in light mode becomes the *ground* in dark mode:
  ground↔text swap, so the two modes share the same colors in opposite roles.
- **Tune each mode first-class.** Honor the swap's spirit, but don't blind-invert
  every role — keep `muted` dimmer than `text` and `surface` a sensible step off
  the ground in *both* modes, so neither reads as a mechanical flip.
- **The accent is roughly constant** across modes (a touch lighter/less saturated
  on the dark ground so it reads confident, not neon).

There is no runtime contrast check. Legibility is the recipe's job — get each
mode's ground/text duotone right and both renderings are readable by construction.
