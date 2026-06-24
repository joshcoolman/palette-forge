# Epic — AI Layer

## Why this exists

The app shipped first as an AI-driven tool. The LLM sat between the user's intent and the output — every palette generation required a round-trip, a key, and a wait. The output didn't justify the promise. It was slow and frustrating, so the AI was removed entirely.

What replaced it is better: a deterministic engine that produces expressive, seed-coherent palettes instantly, for free, with no key. The app is fast and rewarding on its own. That's v1.

This epic is v2's thesis: **now that the base works and feels good, deliver on what AI actually can bring.** Not as a gatekeeper — as an enrichment layer. The difference is that the user gets the payoff immediately (the palettes), and AI adds on top of that rather than sitting in front of it.

## Prime directive

The current experience is the product. AI is additive, never a replacement.

- **No key present = byte-for-byte the current app.** Nothing hidden, nothing degraded, no prompts to add a key.
- AI never computes color and never sits between the user and the first render.
- Every AI output passes through the existing contrast policy. An AI-driven change cannot produce a palette that fails.
- The model emits small structured outputs (a spec or a tool call), not raw color values. Deterministic code executes; the engine stays in control.

## The features (ordered by build sequence)

| # | Plan | What it is | Status |
|---|------|-----------|--------|
| 0 | [plan-ai-byo-key.md](plan-ai-byo-key.md) | BYO-key foundation — settings, client, gate | Done |
| 1 | [plan-ai-rename.md](plan-ai-rename.md) | Creative Rename — per-card AI name, instant fallback | Done (locale deferred) |
| 2 | [plan-ai-prompt-to-palette.md](plan-ai-prompt-to-palette.md) | Prompt-to-Palette — text as a third input on-ramp | Not started |
| 3 | [plan-ai-thinking-feed.md](plan-ai-thinking-feed.md) | Thinking Feed — real-time paced progress stream | Not started |
| 4 | [plan-ai-conversational-refine.md](plan-ai-conversational-refine.md) | Conversational Refine — clarify-then-act on a palette | Not started |

## Build order rationale

**Phase 0 first** — the key + client are the prerequisite for everything. Nothing else can ship without it.

**Rename second** — smallest possible AI feature. Proves the key → call → knowledge → UI pattern before anything bigger. Haiku-class, one call, deterministic fallback means it can never break the experience.

**Prompt-to-Palette third** — the headline feature, a new input modality. One model round-trip produces a structured spec; the existing engine does everything downstream.

**Thinking Feed fourth** — UX layer that upgrades Prompt-to-Palette from "basic spinner" to something genuinely compelling. Designed to work even with no model (the engine verifier loop is a real story worth narrating).

**Conversational Refine last** — the most complex. Multi-turn, clarify-then-act. Build it after the other three prove the pattern.

## Repo seams (where this attaches)

| Concern | File(s) |
|---------|---------|
| Engine seam | `src/features/agent/simulated-engine.ts` |
| Knowledge loader (the pattern to copy) | `src/features/knowledge/knowledge-loader.ts`, `src/features/knowledge/contrast-policy.ts` |
| Knowledge prose | `knowledge/palettes.md`, `knowledge/characters.md`, `knowledge/roles.md` |
| Refine tools (already implemented) | `src/features/color/color-utils.ts` → `withSaturation`, `adjustLightness`, `rotateHue`, `mix` |
| Deterministic namer (the fallback) | `src/features/palette/namer.ts` → `nameFor()` |
| Local storage | `src/lib/db.ts`, `src/features/prefs/prefs-repo.ts` |
| Settings UI | `src/routes/settings.tsx` |
| Card layout | `src/components/square-card.tsx` |
| Build log | `log/` — append an entry per phase |
