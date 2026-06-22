# palette-forge

> A focused, BYO-key utility that turns an image or seed color into refined, accessible color palettes. Tuned for design out of the box — its expertise lives in `/knowledge` as plain markdown you can read and rewrite.

Starting spec, not a locked design. Keep what's useful, change the rest in the build.

---

## The one thing it does

Image or seed color in → refined palettes (light + dark) out. Fan out variations, switch between them, refine to taste.

If a feature doesn't serve that sentence, it's not v1.

## What it does NOT do (the boundary)

The lane is welded. You can retune *what good color means* via `/knowledge`; you cannot talk it into being something else.

- Not a design-system builder. No type, no spacing, no components.
- Not an image generator, not an image editor.
- Not multi-user, not a SaaS. Single user, your key.

This is the discipline that stops it becoming GenZen.

---

## Why an agent is here (honest about the loop)

Fan-out alone is a workflow. The agent earns its place because this domain has a **free, automatic verifier**: contrast ratio.

1. Agent proposes a palette (from the image's colors, or the seed), guided by `/knowledge`.
2. Agent **computes contrast itself** for the key pairings, light and dark.
3. Fails the target → revises and re-checks. Self-corrects before you see it.
4. Fans out N variations in parallel.
5. **You** are the final oracle for taste — switch, "more like this," refine.

Two verifiers stacked: contrast (automatic, non-negotiable) and you (taste, live). Delete the agent and you've got a color picker — so the agent is the product. Good.

---

## The knowledge layer (the differentiator)

**`/knowledge` is plain, human-readable markdown. Read it and you know exactly what this app considers good. Edit it and the output changes.** It ships with solid design expertise out of the box (that's *your* domain — color, type, composition). A different expert can fork it and rewrite it for their own taste — by hand, or by pointing their own agent at the folder. No code required.

Knowledge influences output in **two** places, and that's the whole point:
1. It **guides what the agent proposes** (the generation side).
2. It **is the rubric the agent self-checks against** before fan-out (the judgment side).

Change `harmony.md` and both the proposals and the judgment shift. That visible cause-and-effect is the feature.

Starter contents (keep them short and legible):

```
knowledge/
├── palettes.md     # value range, accent must be distinct from neutrals,
│                   # light AND dark are both first-class, avoid muddy mid-tones
├── harmony.md      # color relationships, temperature, mood; when analogous vs complementary
├── contrast.md     # accessibility policy: AA minimum (AAA where feasible),
│                   # which role-pairings must be checked (text-on-bg, text-on-surface…)
└── roles.md        # what each role means: background, surface, text, muted, accent, border
```

Note: contrast *math* is mechanism (locked, in code). Contrast *policy* (which targets, which pairings) lives in knowledge, so an expert can tighten or loosen it without touching code.

**Deliberately deferred:** an in-app "talk to it and it edits its own knowledge" mode. Tempting, over-engineered for v1. The folder is just files — a human or an external agent can already edit it. Build the conversational authoring mode as v2, only if v1 earns it.

---

## Core interaction: fan-out-and-refine (this IS the product)

Get this loop to *feel good*; everything else is plumbing.
- **Fan out** N variations as a comparison set (contact-sheet feeling).
- **Switch** between them instantly, previewed in a realistic light/dark UI mock.
- **Refine** by natural-language steer ("warmer," "rework the neutrals," "more like #2").
- **Keep** the one you like.

This is the interaction you'll reuse in every later tool. Build it once, here, right.

---

## Data model (the one forward-looking concession)

Don't bury palettes in React state. Keep them as clean, addressable records with stable IDs so an MCP server can serve them later in ~30 lines.

```ts
type Palette = {
  id: string;
  name: string;                      // "corporate", "PNW-hero"
  seed: { type: "image" | "color"; value: string };
  colors: { role: string; light: string; dark: string }[];
  contrast: { pairing: string; mode: "light" | "dark"; ratio: number; passes: "AA" | "AAA" | "fail" }[];
  createdAt: string;
};
```

Local storage for v1 (IndexedDB ages better than localStorage).

## BYO-key

User's own key, browser-stored, sent only to the provider. This is what makes it free to host. Make the key-entry moment clean and trustworthy.

## Stack

TanStack Start + React + TypeScript + Tailwind, Vercel. Default installs; let Claude Code scaffold the shell.

## v1 cut

1. Key entry. 2. Input: image or seed color. 3. Loop: propose (knowledge-guided) → self-check contrast → revise → fan out. 4. Comparison view with light/dark mock. 5. Refine via language. 6. Save to local library. 7. Copy/download as JSON + CSS vars.

Deferred (write them down so they stop nagging): MCP server, subdomain hosting, knowledge-authoring mode, "improves with use," any second tool.

## The thesis

A focused utility whose expertise is **legible markdown anyone can read and rewrite**, made genuinely agentic by a free verifier (contrast) plus a live one (your taste), with a clean data model that becomes a callable capability later.
