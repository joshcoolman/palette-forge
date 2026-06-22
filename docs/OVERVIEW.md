# Focused Agentic Utilities — Overview

> Start here. This is the umbrella vision for three small, single-purpose creative tools — **palette-forge**, **outpaint-studio**, and **prompt-smith**. Read this first, then the individual specs.

---

## What this is

A set of focused, **agent-first** creative utilities. Each does one thing well, runs on the user's own API key (BYO-key), and carries its expertise in a **legible `/knowledge` folder** anyone can read and rewrite. They're built in public — as real tools people would actually use, and as a demonstration of how to build agents deliberately rather than by gluing a chatbot onto a CRUD app.

They are **not** a suite. They're three independent repos that happen to share a shape. Each stands, ships, and is forkable on its own.

## Why these exist

Two reasons, both honest.

**The public-repo thesis.** A GitHub profile is the new resume. Listing good companies proves nothing; a focused, working, well-explained repo proves competence directly. These are deliberately small and easy to communicate so each one makes a clear point. They're part of a build-in-public loop — repo, then a short write-up that distributes it — pointed at establishing a credible identity as someone who builds agentic software.

**The personal-learning angle.** The work is a move from frontend/design into agent-first thinking. The differentiator isn't "another AI engineer" — it's **a designer who builds agents**, a nearly empty quadrant. Most agent demos are ugly CLIs because the people building them can't design. The bet here is to make the normally-invisible machinery of an agent legible and well-crafted, which is exactly the thing a designer is positioned to do.

## The core idea: agent-first, not agent-added

The old shape is a tool where a human does the work and an agent is bolted into a sidebar to assist. The new shape inverts it: **the agent is the product, and the UI exists to serve the agent's loop.** The test: if you deleted the agent, is there still an app? In these tools, mostly no — the agent *is* the thing. That's the line they're built to hold.

## The shared shape (a set, not a suite)

Every tool instantiates the same structure. Nothing is coupled; the "sameness" is a pattern each repo follows independently.

- **Mechanism** — the loop, the verifier, the generation. Domain-invariant, lives in code, locked to forkers.
- **Boundary** — a short, fixed declaration of what the tool does and refuses to do. The welded lane that keeps "make it your own" from drifting into "make it anything."
- **Knowledge** — `/knowledge`, plain human-readable markdown. The expertise that makes outputs good. Ships solid out of the box; swappable by a domain expert.
- **(Deferred) Authoring** — an optional v2 where you talk to the tool and an agent edits its own knowledge under your review. Explicitly *not* a starting point.

Because they're independent, they compose *later* through the thinnest possible seam — one tool's output as another's input, a small shared data format (markdown/frontmatter, OKF-ish) — never through shared state. Pipes, not a monolith. That seam is discovered empirically once two tools exist, never designed up front.

## The knowledge layer (the distinctive bet)

This is the part worth being known for. **`/knowledge` is legible markdown: read it and you know what the app considers good; edit it and the output changes.** Knowledge feeds output in two places — it guides what the agent proposes, and it's the rubric the agent judges against before showing you anything.

The payoff is an **extension surface**: the tool ships generic-but-good, then a domain expert with no interest in code can repurpose it by rewriting the markdown — by hand, or by pointing their own agent at the folder. A photographer's outpainter and an architect's outpainter share the same mechanism and differ only in `/knowledge`. That demands a clean separation between domain-invariant mechanism and swappable domain knowledge — which is a senior thing to get right, and the extensibility falls out of it for free rather than being engineered as a plugin system.

## The method (the honesty checks)

The intellectual backbone, and arguably the most credible thing the collection demonstrates. Each tool is built against a running set of disciplines:

- **Does it actually need a loop?** Half of "agent" demos are a single call in a costume. A loop is earned only when the path can't be predetermined. Each tool's loop is justified, not decorative.
- **Where does the verifier come from?** "Good agentic app" reduces to "has a way to check its own work." The four honest sources: *free* (contrast math), *supplied* (a stated complaint, a test set), *harvested* (accepted outputs become labeled examples — "gets better with use"), and *live human* (your taste, in the refine loop). Each tool names its verifier.
- **Single-purpose, anti-creep.** Each repo does one thing. The boundary is the brand. This is the corrective to feature-creep sprawl.
- **Clean, addressable data from day one.** The one forward-looking concession: store outputs as records with stable IDs so they can later be served over MCP in ~30 lines — turning each tool from "an app you visit" into "a capability your agents can call."
- **Build concrete first; extract templates backward.** Never build the general thing before two specific things show what "general" means. The template is the residue of having shipped, not the blueprint.

## The three utilities

**palette-forge** — image or seed color in, refined light/dark palettes out. Verifier is *free and automatic*: WCAG contrast. The agent proposes, checks contrast itself, self-corrects, fans out variations; you refine to taste. The gentle flagship — cleanest data model, best later MCP story.

**outpaint-studio** — image + target ratio in, seam-aware extension out (the "make this hero 21:9" case). Verifier is *vision*: generate, look at the seam, regenerate the bad region. Agent-first competence that stays invisible — it's just weirdly good. Best showcase of the knowledge-as-extension-surface idea.

**prompt-smith** — a prompt plus a complaint in, an improved prompt out. Verifier is the *stated complaint* plus the standing `/knowledge` rubric. Small and immediately useful; the natural capstone is a later optimizer version (optimize a system prompt against a held-out test set, watch the score climb) — the evals/optimization rung.

## What they demonstrate

Read together, the three walk a competence ladder: a hand-written agent loop (not an SDK hiding it), tool dispatch, dynamic tool choice, verifiers and self-correction, evals and prompt optimization, a clean mechanism/knowledge architecture, extensibility as an emergent property, and a path to MCP exposure. The claim they support isn't "I can call an LLM API." It's: *I build apps where the agent is the product, the agent can check its own work, its expertise is legible and swappable, and it's built to become a capability other agents can call.*

## Sequencing

1. **palette-forge first** — fully built, deployed, BYO-key, with real design knowledge in `/knowledge`. One shipped tile beats three planned ones.
2. **outpaint-studio** second, same pattern.
3. **Extract the shared shape** on the third repo, backward, from what proved identical.
4. **Later, optional:** subdomain hosting, MCP exposure, the cross-tool pipe, the knowledge-authoring mode. All real; all downstream of tools that exist.

The single risk now is planning the collection instead of shipping the first tile. The thinking is done. Build palette-forge.

## How to read the specs

- **palette-forge-SPEC.md** — the detailed one. The reference implementation of the whole pattern.
- **outpaint-studio-SPEC.md** and **prompt-smith-SPEC.md** — deliberately loose sketches. Enough to hold the idea, not so prescriptive they fight what the build reveals.
