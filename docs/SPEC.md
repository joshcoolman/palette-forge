# palette-forge

> A focused, fully-local utility that turns an image or seed color into refined, accessible color palettes. Tuned for design out of the box — its expertise lives in `/knowledge` as plain markdown you can read and rewrite.

Reference spec for what shipped. It started as a BYO-key, vision-agent tool; building it revealed the deterministic engine was the product, so the in-app LLM was removed. This describes the result.

---

## The one thing it does

Image or seed color in → expressive palettes (light + dark) out. A round of distinct treatment takes — each a saturated hero ground with a contrasting accent, all coherent with your seed; re-run for fresh rounds; keep the ones you like.

If a feature doesn't serve that sentence, it's not v1.

## What it does NOT do (the boundary)

The lane is welded. You can retune _what good color means_ via `/knowledge`; you cannot talk it into being something else.

- Not a design-system builder. No type, no spacing, no components.
- Not an image generator, not an image editor.
- Not multi-user, not a SaaS. Single user, fully local.

This is the discipline that stops it becoming a sprawl.

---

## Why this is more than a color picker

A color picker gives you one swatch. This composes a whole round of **finished, expressive palettes** from your seed — saturated hero grounds, cross-hue accents, real range — the kind of bespoke combinations you'd otherwise hand-build.

1. The engine reads the source's dominant hue and renders it through a set of **treatment archetypes** (`src/features/palette/tuning.ts`) — deep jewel, moody twilight, warm sand, crisp paper, calm meadow, loud signal. Each is a hue-free template; the hues come from your seed, so every take reads as *your* color.
2. The **ground is the hero** (a saturated mid-tone, not a near-white tint) and the **accent jumps to a contrasting hue family** — that cross-hue surprise is where the interest lives.
3. **Legibility is baked into the recipe** — a dark ground pairs with light text, a light ground with ink. There is no runtime contrast repair and no score; bold combinations are never flattened back to "safe."
4. **Re-run** explores — color seeds walk color-theory relationships to the seed (complementary, triadic, …), image seeds rotate around the wheel — so each round is genuinely different yet still seed-coherent.
5. **You** are the oracle for taste — switch, retune the source color, heart what's right.

The loop is deterministic — no model, no key, instant, free to host. (Contrast ratios are still computed onto each record for reference, but never enforced or shown.)

> **AI at the boundary, not in the loop.** The in-app LLM was removed because the deterministic engine + a deterministic namer deliver the whole loop better (instant, predictable, no key wall). The `PaletteEngine` seam and the clean records stay so the engine can be exposed as an **agent-callable capability (MCP/API)** later — AI returns at the boundary, driving the tool, rather than living inside it.

---

## The knowledge layer (the differentiator)

**`/knowledge` is plain, human-readable markdown. Read it and you know exactly what this app considers good. Edit it and the output changes.** It ships with solid design expertise out of the box (color, type, composition). A different expert can fork it and rewrite it for their own taste — by hand, or by pointing their own agent at the folder. No code required.

Knowledge and the archetype dials together define the taste. The prose in `/knowledge` states the north star; the actual generation numbers live in `src/features/palette/tuning.ts` (`ARCHETYPES` — ground L/S, text duotone, accent relationship per take).

```
knowledge/
├── palettes.md     # hero ground, cross-hue accent, seed coherence,
│                   # range across the set, light/dark as inversions
├── characters.md   # the treatment archetypes and how to keep them distinct
├── contrast.md     # legacy WCAG policy — still parsed to record contrast
│                   # ratios for reference, but NOT enforced or shown
└── roles.md        # what each role means: background, surface, text, muted, accent, border
```

Note: the taste dials live in `tuning.ts`; edit there to reshape every take, re-run, and sample card at once.

**Deliberately deferred:** an in-app "talk to it and it edits its own knowledge" mode. The folder is just files — a human or an external agent can already edit it.

---

## Core interaction: surprise-and-keep (this IS the product)

Get this loop to _feel good_; everything else is plumbing.

- **A round of takes** as a comparison set, each a named treatment character, previewed in a realistic light/dark UI.
- **Re-run** for a fresh, genuinely-different round (newest stacked on top).
- **Retune** the source color in-place (the editable swatch + picker) and re-run.
- **Keep** the ones you like — they save to the local library.

---

## Data model (the one forward-looking concession)

Don't bury palettes in React state. Keep them as clean, addressable records with stable IDs so an MCP server can serve them later in ~30 lines.

```ts
type Palette = {
  id: string
  name: string // "Loden Frost", "Rust Studio"
  seed: { type: 'image' | 'color'; value: string }
  colors: { role: string; light: string; dark: string }[]
  contrast: {
    pairing: string
    mode: 'light' | 'dark'
    ratio: number
    passes: 'AA' | 'AAA' | 'fail'
  }[]
  createdAt: string
}
```

Stored in IndexedDB (ages better than localStorage).

## Fully local, no key

No API key, no account, nothing sent anywhere — generation is deterministic and runs entirely in the browser. That's what makes it free to host and instant to use.

## Stack

TanStack Start + React + TypeScript + Tailwind, Vercel.

## v1 cut

1. Input: image or seed color (a `+` popover — upload / curated seeds / picker). 2. Compose a round of named treatment takes (hero ground + cross-hue accent) with light/dark mock. 3. Re-run for varied rounds; retune the seed color and re-run. 4. Heart to the local library; copy/download as JSON + CSS vars. 5. Settings = a single delete-confirm preference.

Deferred (so they stop nagging): the mood-board input, MCP/API exposure, a knowledge-authoring mode, the color "comfort band" as explicit constants.

## The thesis

A focused utility that turns one seed into a round of **bespoke, expressive, seed-coherent palettes** — the kind you'd hand-build — with taste that lives in legible dials (`tuning.ts`) and prose (`/knowledge`), and a clean data model + engine seam that become an **agent-callable capability** later.
