# Plan — Conversational Refine (Phase 4)

Part of [epic-ai-layer.md](epic-ai-layer.md). Prerequisites: [plan-ai-byo-key.md](plan-ai-byo-key.md), [plan-ai-thinking-feed.md](plan-ai-thinking-feed.md).

## What this is

An open refine input on a generated palette. The model's first job is to reach clarity, not to act — if the request is vague ("these are too playful"), it asks a clarifying question before changing anything. Once it has what it needs, it emits a structured adjustment that routes to the existing deterministic color functions.

The model routes and converses. It never computes a color.

## Why this shape

A row of fixed pills ("more saturated", "cooler") felt like a normal app. This is something else: a thoughtful collaborator that asks "in what way?" before pulling a lever. The surprise is that it holds back. That's the character.

### Motivating scenario (from real use)

A user briefed Prompt-to-Palette with: *"I need a palette for a Pacific Northwest roofing company. We're in Portland. We work on small residential houses, something professional but sort of nature-oriented."* It produced a result and stopped — one shot, no recourse. The user's reaction names exactly the gap this phase fills:

> "Oh, you chose pink. I don't like pink, I'd rather red." — *people react to what they see; they don't spec it up front.*

Two things this phase owes that scenario: (1) a way to **react to the produced palette** in plain language and have it adjust, and (2) the model **clarifying** ("warmer red, or a deeper brick?") rather than taking the first reading and running. The point is that the AI feels like it's *listening*, not just consuming a prompt. Until this phase ships, Prompt-to-Palette is deliberately one-shot — see the v1.1 note in [plan-ai-prompt-to-palette.md](plan-ai-prompt-to-palette.md).

## How it works

1. Keyed users see a refine input below the palette card (open text, not chips)
2. User types something vague or specific
3. Model receives the palette's current state + the user's message
4. **If the intent is clear:** model emits a structured adjustment immediately
   ```ts
   { op: 'withSaturation' | 'adjustLightness' | 'rotateHue' | 'mix', role: string, value: number }
   ```
5. **If the intent is unclear:** model asks one short clarifying question; user replies; up to ~2 clarification turns, then the model commits
6. Along with its question or adjustment, the model emits **contextual clickable options** — 4–5 suggestions generated fresh each turn, one marked recommended — so the user can click rather than type
7. The structured adjustment routes to the existing functions in `color-utils.ts`; the verifier re-checks; the card updates in place

## Contextual options

These are not a static toolbar. They're generated per-turn by the model based on the current palette state and the conversation so far. Examples after "too playful":
- "Pull the ground toward charcoal" (recommended)
- "Desaturate the accent by 20%"
- "Shift the whole palette cooler"
- "Try a darker ground, same accent"

Clicking an option submits it as the next user message. The model treats it the same as typed input.

## Relationship to the thinking feed

The structured adjustment step reuses the thinking-feed infrastructure from [plan-ai-thinking-feed.md](plan-ai-thinking-feed.md): the engine verifier re-runs and its events stream through the same feed. This is why the thinking feed is a prerequisite.

## Acceptance criteria

- [ ] Refine input only appears with a key; the card is unchanged without one
- [ ] Vague input triggers a clarifying question, not a blind change
- [ ] Clear input acts immediately — no unnecessary clarification turn
- [ ] Contextual options appear fresh each turn; clicking one submits it as input
- [ ] Final action is a structured call to existing `color-utils.ts` functions; result re-passes contrast check
- [ ] The verifier events stream through the thinking feed after the adjustment
- [ ] Multi-turn conversation stays on the palette — it does not navigate away

## Open questions (decide during build)

- **Turn limit:** after ~2 clarification turns the model commits, even if still uncertain — confirm the right count
- **Refine scope:** does a refine touch the full palette or only the selected card? (Probably the selected card; decide during build)
- **History:** how many turns of conversation context does the model receive? Probably the full thread for the current card session

## Files touched

- `src/features/agent/refine.ts` — new: `refineConversation(palette, history) → AsyncIterable<RefineEvent>`
- `src/features/color/color-utils.ts` — already has the ops; wire them to the structured output
- `src/components/refine-bar/` — new conversational variant (replaces or sits alongside the current re-run controls)
- `src/routes/index.tsx` — render refine input below active palette card, key-gated

## Gate

`tsc`, `eslint`, `pnpm build`. Manual: add key → select a palette → refine input appears → type something vague → clarifying question appears with options → reply or click option → palette updates in place → thinking feed shows verifier events. Remove key → refine input absent. Append a `log/` beat.
