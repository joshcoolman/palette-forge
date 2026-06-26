# Keyless free runs

**Status: Proposal — not scheduled.** A captured feasibility assessment, not a
commitment to build.

## The question

Could we expose the AI features to anonymous visitors **without making them enter
a key** — a few free runs on the owner's dime, then degrade to "enter your own key
in Settings, or come back tomorrow"? The goal is limited capacity at minimal cost:
let someone *try* the AI palette flow, capped so it can't run up a bill.

## Today's architecture (what this would change)

The app is deliberately **fully static, browser-direct, with zero server secrets**.
The Anthropic key lives in the user's browser; calls go straight to
`api.anthropic.com` from the client (`src/features/agent/client.ts`), gated by
`hasKey()` / `resolveApiKey()`. There is no backend holding a key. A free tier
necessarily introduces one — that's the crux of the trade-off.

## What the reference app (`~/repos/sandbox`) does

Sandbox has two patterns, very different in cost:

- **The chatroom** — Cloudflare Durable Objects, WebSockets, HMAC upgrade tickets,
  a ~966-line stateful actor. This is the "sophisticated and complicated" part —
  **and none of it is relevant here.**
- **The "monono" pattern** — one POST route → a **per-IP monthly counter in
  Upstash Redis** (`@upstash/redis`, `@upstash/ratelimit`) + a **global spend cap**
  → Anthropic via the Vercel AI Gateway. This is the relevant analog. The limiting
  slice is small: `lib/ai/rate-limit.ts` is ~107 lines, the route ~130.

Key details worth stealing from the monono pattern:

- Identify users by IP (`x-forwarded-for` / `x-real-ip`); counter key like
  `ns:session:YYYY-MM:IP`, auto-expiring at the window boundary.
- Track spend in **micro-USD** (`incrby`) against a global cap; once the cap is
  hit, return `429` and stop — the worst case is bounded to the cap.
- Server-side caps: `max_tokens`, model lock, input-length limit.
- If Upstash env vars are absent, gates **pass through** (so local dev isn't
  blocked).

## Why this is *less* work here than in Sandbox

1. **The escape hatch already exists.** Sandbox has no BYO-key fallback — when
   you're cut off, you're done. palette-forge already has the Settings key entry
   and the `hasKey()` → `resolveApiKey()` → `callAnthropic` seam, so "free runs →
   then enter your own key" is mostly **wiring an existing path to a new `429`**,
   not new UX.
2. **No Cloudflare anything.** The multi-day part of Sandbox was the realtime
   Durable Object. We skip it entirely.
3. **Server routes are already available.** TanStack Start + Nitro compiles server
   functions on Vercel today (see `vite.config.ts`), so this needs no framework
   change — just a new route.

## The real cost (where "pass" is defensible)

It isn't lines of code — it's an **architectural reversal**:

- A **server route that holds the owner's key** and proxies to Anthropic. This
  breaks the current "the key never leaves the browser" property *for the free
  path*. (BYO-key users still go browser-direct.)
- An external dependency: **Upstash Redis** (free tier) for the per-IP **daily**
  counter and a global **monthly spend hard-stop**.
- **Abuse exposure.** IP limiting is weak (VPNs, shared/CGNAT IPs) and there's no
  login. Mitigations: tight `max_tokens`, model lock, input-length cap, an
  origin/referer check, and — most importantly — the global monthly spend cap that
  bounds the worst case to a fixed dollar amount (e.g. ~$5/mo).

## Minimal implementation sketch

- **Server proxy route** (Nitro/TanStack server route): validates origin + input
  length, checks the per-IP daily counter and global spend cap in Upstash, calls
  Anthropic with the **server** key and hard `max_tokens` / model, records spend.
- **Upstash keys:** `free:day:YYYY-MM-DD:IP` (per-IP daily count, expires at
  midnight) and `free:spend:YYYY-MM` (global micro-USD, expires month-end).
- **Client:** try the server route first; on `429` (quota or global cap), surface
  a friendly message and route the user to the existing **BYO-key** path.
- **Env vars:** a server-side Anthropic key, `UPSTASH_REDIS_REST_URL`,
  `UPSTASH_REDIS_REST_TOKEN`.

## Effort & recommendation

**~1 day**, plus an Upstash account and three env vars — not the multi-day Sandbox
system (that complexity was the chatroom, which doesn't apply).

**Recommendation:** passing is defensible — it preserves the zero-secret, fully
static, browser-direct model, and avoids an external dependency and ongoing cost
risk for what is a convenience. Revisit if keyless trials become important to
adoption. If we do build it, the monono pattern is the blueprint and the BYO-key
fallback is already in place.

## Reference

`~/repos/sandbox` — `lib/ai/rate-limit.ts`, `app/api/monono/route.ts` (the
per-IP-counter + global-spend-cap pattern this would adapt).
