# Plan — BYO-key Foundation (Phase 0)

Part of [epic-ai-layer.md](epic-ai-layer.md). Prerequisites: none. Everything else in the epic is blocked on this.

## What this is

A thin, local, serverless key layer. With no key present, the app is byte-for-byte unchanged. With a key, AI affordances become available — but the key is never required to use the app.

No backend. No proxy. The client calls `api.anthropic.com` directly using the `anthropic-dangerous-direct-browser-access` header, keeping the app fully static/Vercel-hosted.

## Scope

**Settings page additions**
- Anthropic API key input (password field, masked)
- Model picker (Haiku for speed/cost, Sonnet for quality) — only visible when a key is present
- A brief, honest note: "Your key is stored in this browser only and sent only to Anthropic."
- Persist both via the existing `prefs-repo` / IndexedDB `settings` store

**`callAnthropic()` client** — `src/features/agent/client.ts`
- Handles key retrieval, model selection, and streaming in one place
- Streaming primitive: yields lines/events; consumers can stop early
- Model override param for per-call control (rename = Haiku; future features may vary)

**`hasKey()` gate** — exported from `src/features/agent/client.ts` or `src/lib/settings.ts`
- Every AI affordance checks this before rendering
- False = the affordance does not exist in the UI (not disabled, not grayed — absent)

## Acceptance criteria

- [ ] With no key, the app is byte-for-byte the current experience — no prompts, no empty slots, no UI changes
- [ ] Key + model persist across reload; key is never logged or sent anywhere except `api.anthropic.com`
- [ ] Settings note explains the local-storage tradeoff honestly
- [ ] `callAnthropic()` handles streaming; a consumer can collect the full response or process it line by line
- [ ] `hasKey()` is the single gate; AI features use it uniformly

## Files touched

- `src/features/agent/client.ts` — new
- `src/lib/settings.ts` — add `apiKey`, `model`, their saves
- `src/features/prefs/prefs-repo.ts` — add key/model get/set
- `src/routes/settings.tsx` — add KeyEntry + ModelPicker below existing Preferences
- `src/components/settings/key-entry.tsx` — new
- `src/components/settings/model-control.tsx` — new

## Gate

`tsc`, `eslint`, `pnpm build`. Manual check: add a key → reload → key persists; remove key → reload → all AI affordances absent (once they exist). Append a `log/` beat.
