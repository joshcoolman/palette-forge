# Eval prompts

A small, stable set of real briefs to test the AI palette flow against — so changes
to the system prompt / model / contract can be judged consistently instead of by
one-off vibes. Grab these for manual runs; a future eval runner can parse this file.

Each case records the brief verbatim, the **intent** a good result must honor, and
any **must-not** (hard constraints the user stated in words). The v1 seed-only path
fails the must-nots because the model only picked a seed hue and the deterministic
engine chose the accent — see `docs/plan-ai-model-direct.md` for why, and the fix.

---

## lawn-care — natural / professional

> We're in the Pacific Northwest. We need a palette for a lawn care company:
> professional, residential services.

- **Intent:** natural, outdoorsy, trustworthy; greens/earth; calm and credible, not loud.
- **Must-not:** nothing garish or toy-like; no hot pink / magenta accents.
- **v1 result (seed-only):** seed greens were right (`#2d5a1b`, `#348514`), but engine
  accents rotated to magenta/pink — **fails** the must-not.

## racing-brand — serious / no-frills

> We're a serious performance mechanic for serious racers. We want a racing brand,
> a set of colors, nothing girly. It's a pretty serious crowd. Show us what you have.

- **Intent:** bold, high-contrast, performance/automotive; serious and masculine-coded;
  reds/blacks/steel/electric accents read well here.
- **Must-not:** **explicitly no "girly"** — no pink, no purple/lavender, no pastels.
- **v1 result (seed-only):** pink and purple accents throughout — **fails** the must-not,
  and the user called it out directly. This is the motivating case for model-authored
  palettes (the model controls every hue, so it can simply obey "nothing girly").

## wellness-yoga — calm / professional / older clients

> So I'm a personal trainer. I do yoga training for people over 60 who are doing
> rehabilitation, so I focus on mobility and wellness. I'm in the Pacific Northwest. My
> clients are active but older.

- **Intent:** calm, trustworthy, professional wellness; soft naturals (forest, stone, mist,
  still water); approachable and easy on older eyes; suitable for a real website.
- **Must-not:** nothing loud, clinical, or harsh; legible at a glance (older audience).
- **Tuning note (model-direct, 2026-06-24):** good, clearly-considered output — but several
  takes ran the **grounds too dark** (backgrounds ~`#191419`, near-black) for a professional
  wellness site. The darks carry a hue (not pure black) but read heavier than the brief
  wants. Candidate fix: guide ground lightness in `knowledge/color-theorist.md` (deep, not
  near-black) — the test case for that prompt tweak. (The Minecraft brief, by contrast, ran
  great — so this is taste-tuning, not a contract bug.)

## battery-question — off-topic guard

> Teach me how to change my car battery.

## Minecraft Party Theme

> Hey, I'm putting together a party for my kid and his friends. They're all really into Minecraft, and I was hoping you can create some nice color palettes for some invitations I'm creating.

---

## How to use

**In-app (visual smoke test):** add a real Anthropic key in Settings → open the source
popover → "Chat with AI" → paste a brief above → Submit. The dev console + `eval/runs.jsonl`
capture the exact prompt and raw response.

**Headless (fast iteration):** `pnpm eval [prompt-id]` — no app needed. See `eval/README.md`.
