# palette-forge — working notes for Claude

**Read first:** [`docs/SPEC.md`](docs/SPEC.md) (the detailed reference spec) and [`docs/OVERVIEW.md`](docs/OVERVIEW.md) (the umbrella vision). They define what this is and what it refuses to be.

## Hold the line

- **Agent-first, not agent-added.** The agent is the product; the UI serves its loop. If deleting the agent leaves a working app, something went wrong.
- **The boundary is welded.** Image/seed color in → palettes out. Not a design system, not an image editor, not a SaaS. Retune *what good color means* via `/knowledge` only.
- **Mechanism vs knowledge.** Contrast *math* is locked mechanism (code). Contrast *policy* and taste live in `/knowledge` as plain, human-rewritable markdown — it both guides proposals and is the self-check rubric.
- **Free verifier:** WCAG contrast (automatic). **Live verifier:** the user's taste.
- **Data model:** clean, addressable records with stable IDs (MCP-ready later). Don't bury palettes in React state.

## Current state

Scaffold only (TanStack Start + React 19 + TS + Tailwind v4 + Vitest). No agent loop, no `/knowledge`, no BYO-key flow yet. The status landing lives in `src/components/status-landing.tsx`, driven by `src/app-meta.ts`.
