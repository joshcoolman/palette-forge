# palette-forge

> A focused, fully-local utility that turns an image or seed color into refined, accessible color palettes. Tuned for design out of the box — its expertise lives in `/knowledge` as plain markdown you can read and rewrite.

Reference spec for what shipped. It started as a BYO-key, vision-agent tool; building it revealed the deterministic engine was the product, so the in-app LLM was removed. AI has since returned in two shapes: a **light boundary enrichment** (BYO-key palette name suggestions) and — for the **prompt flow** — a full **model-authored generator** (a worded brief → the model designs six palettes). Seed-color and image generation stay fully deterministic and model-free; the prompt path is the model computing color, deliberately. Two generators behind one seam. AI-layer detail: [`epic-ai-layer.md`](epic-ai-layer.md), [`plan-ai-model-direct.md`](plan-ai-model-direct.md).

---

## The one thing it does

Image, seed color, **or a worded brief** in → expressive palettes (light + dark) out. A round of distinct treatment takes — each a saturated hero ground with a contrasting accent; for seed/image they're coherent with your input, for a brief the model authors them to the words; re-run for fresh rounds; keep the ones you like.

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

The seed-color and image generators are deterministic — no model, no key, instant, free to host. (Contrast ratios are still computed onto each record for reference, but never enforced or shown.)

> **Two generators behind one seam.** The deterministic engine owns seed/image — it delivers that loop better than a model (instant, predictable, no key wall), and it stays. The **prompt flow** is a second generator: the model reads a worded brief and *authors* whole palettes (every role, both modes), so it does compute color — a deliberate reversal of the original "AI never computes color" line, because honoring worded intent ("nothing girly") and the planned refine loop both need the model to own the colors. Both sit behind the `PaletteEngine` seam (`RoutingEngine` routes by source); the model's taste is its **verbatim `/knowledge` system prompt** (`color-theorist.md`), not buried in code. With no key the prompt on-ramp is absent and the app is fully deterministic. The clean records keep the door open to exposing the engine as an **agent-callable capability (MCP/API)** later.

---

## The knowledge layer (the differentiator)

**`/knowledge` is plain, human-readable markdown. Read it and you know exactly what this app considers good. Edit it and the output changes.** It ships with solid design expertise out of the box (color, type, composition). A different expert can fork it and rewrite it for their own taste — by hand, or by pointing their own agent at the folder. No code required.

Knowledge and the archetype dials together define the taste. The prose in `/knowledge` states the north star; the actual generation numbers live in `src/features/palette/tuning.ts` (`ARCHETYPES` — ground L/S, text duotone, accent relationship per take).

```
knowledge/
├── color-theorist.md  # THE model-generation system prompt — sent verbatim. Edit
│                      # this and the AI's palettes change (no code, no rebuild).
├── palettes.md        # hero ground, cross-hue accent, seed coherence,
│                      # range across the set, light/dark as inversions
├── characters.md      # the deterministic treatment archetypes, kept distinct
├── naming.md          # persona for the AI rename suggestions
├── contrast.md        # legacy WCAG policy — still parsed to record contrast
│                      # ratios for reference, but NOT enforced or shown
└── roles.md           # what each role means: background, surface, text, muted, accent, border, secondary
```

Two taste surfaces: the **deterministic** dials live in `tuning.ts` (edit to reshape every seed/image take, re-run, and sample card at once); the **model's** taste is `color-theorist.md` prose, sent to it verbatim — fork it to change what the AI designs.

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

## Fully local by default; AI is opt-in

No account, and out of the box nothing is sent anywhere — the seed/image generators are deterministic and run entirely in the browser, which is what makes it free to host and instant to use. The **only** things that leave the browser are the opt-in AI paths: with an Anthropic key in Settings, a worded brief (and its system prompt) goes to Anthropic to author palettes, and a saved palette's colors go up to suggest names — both directly, no backend. With no key, neither path exists.

## Stack

TanStack Start + React + TypeScript + Tailwind, Vercel.

## v1 cut

1. Input: image, seed color, **or a worded brief** (a `+` popover — upload / curated seeds / picker / Chat-with-AI, the brief key-gated). 2. Compose a round of named treatment takes (hero ground + cross-hue accent) with light/dark mock — deterministic for seed/image, model-authored for a brief (with the model's friendly note). 3. Re-run for varied rounds (instant for all, including AI); retune the seed color and re-run. 4. Heart to the local library; rename (manual, or AI-suggested with a key), copy/download as JSON + CSS vars. 5. Settings = display prefs + the optional AI-touches panel (BYO key + model).

Deferred (so they stop nagging): the mood-board input, MCP/API exposure, a knowledge-authoring mode, the color "comfort band" as explicit constants, and the rest of the AI epic (thinking feed, conversational refine — [`epic-ai-layer.md`](epic-ai-layer.md) phases 3–4).

## The thesis

A focused utility that turns one seed into a round of **bespoke, expressive, seed-coherent palettes** — the kind you'd hand-build — with taste that lives in legible dials (`tuning.ts`) and prose (`/knowledge`), and a clean data model + engine seam that become an **agent-callable capability** later.
