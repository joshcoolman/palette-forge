# palette-forge

> A focused, fully-local utility that turns an image or seed color into refined, accessible color palettes. Tuned for design out of the box — its expertise lives in `/knowledge` as plain markdown you can read and rewrite.

Reference spec for what shipped. It started as a BYO-key, vision-agent tool; building it revealed the deterministic engine was the product, so the in-app LLM was removed. This describes the result.

---

## The one thing it does

Image or seed color in → refined palettes (light + dark) out. A fan of four distinct takes; re-run for fresh fours; keep the ones you like.

If a feature doesn't serve that sentence, it's not v1.

## What it does NOT do (the boundary)

The lane is welded. You can retune _what good color means_ via `/knowledge`; you cannot talk it into being something else.

- Not a design-system builder. No type, no spacing, no components.
- Not an image generator, not an image editor.
- Not multi-user, not a SaaS. Single user, fully local.

This is the discipline that stops it becoming a sprawl.

---

## Why this is more than a color picker

A color picker gives you one swatch. This runs a real **generate → verify → choose** loop, and it earns that because the domain has a **free, automatic verifier**: contrast ratio.

1. The engine **composes four distinct characters** from the source (image colors or seed), guided by `/knowledge`.
2. It **computes contrast itself** for the key role-pairings, light and dark, and **repairs** until the policy is met — self-corrected before you see it.
3. It **scores** each take against the taste rubric (distinct accent, quiet neutrals, deliberate value range) and shows the honest WCAG badges.
4. **Re-run** explores — color seeds walk color-theory relationships to the seed (complementary, triadic, …), image seeds rotate around the wheel — so each four is genuinely different.
5. **You** are the final oracle for taste — switch, retune the source color, heart what's right.

Two verifiers stacked: contrast (automatic, non-negotiable) and you (taste, live). The loop is deterministic — no model, no key, instant, free to host.

> **AI at the boundary, not in the loop.** The in-app LLM was removed because the deterministic engine + a deterministic namer deliver the whole loop better (instant, predictable, no key wall). The `PaletteEngine` seam and the clean records stay so the engine can be exposed as an **agent-callable capability (MCP/API)** later — AI returns at the boundary, driving the tool, rather than living inside it.

---

## The knowledge layer (the differentiator)

**`/knowledge` is plain, human-readable markdown. Read it and you know exactly what this app considers good. Edit it and the output changes.** It ships with solid design expertise out of the box (color, type, composition). A different expert can fork it and rewrite it for their own taste — by hand, or by pointing their own agent at the folder. No code required.

Knowledge influences output in **two** places, and that's the whole point:

1. It **guides what the engine generates** (the generation side — characters, neutrals, accent policy).
2. It **is the rubric the scoring checks against** (the judgment side — the WCAG policy and the taste score).

Change the policy and both the generation and the judgment shift. That visible cause-and-effect is the feature.

```
knowledge/
├── palettes.md     # value range, accent distinct from neutrals,
│                   # light AND dark both first-class, avoid muddy mid-tones
├── characters.md   # the four distinct characters (Vivid / Composed / Nocturne / Hush)
├── contrast.md     # accessibility policy: AA floor (AAA where feasible),
│                   # which role-pairings must be checked (text-on-bg, text-on-surface…)
└── roles.md        # what each role means: background, surface, text, muted, accent, border
```

Note: contrast _math_ is mechanism (locked, in code). Contrast _policy_ (which targets, which pairings) lives in knowledge, so an expert can tighten or loosen it without touching code.

**Deliberately deferred:** an in-app "talk to it and it edits its own knowledge" mode. The folder is just files — a human or an external agent can already edit it.

---

## Core interaction: surprise-and-keep (this IS the product)

Get this loop to _feel good_; everything else is plumbing.

- **Four takes** as a comparison set, each a named character, previewed in a realistic light/dark UI.
- **Re-run** for a fresh, genuinely-different four (newest stacked on top).
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

1. Input: image or seed color (a `+` popover — upload / curated seeds / picker). 2. Compose four contrast-checked, named takes with light/dark mock. 3. Re-run for varied fours; retune the seed color and re-run. 4. Heart to the local library; copy/download as JSON + CSS vars. 5. Settings = a single delete-confirm preference.

Deferred (so they stop nagging): the mood-board input, MCP/API exposure, a knowledge-authoring mode, the color "comfort band" as explicit constants.

## The thesis

A focused utility whose expertise is **legible markdown anyone can read and rewrite**, made genuinely useful by a free verifier (contrast) plus a live one (your taste), with a clean data model and engine seam that become an **agent-callable capability** later.
