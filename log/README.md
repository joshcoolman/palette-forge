# log/ — a working record of how the build actually goes

**Purpose.** This project is built in public. `log/` is the trail from scaffold to shipped: the decisions, the reasoning, and the things tried and abandoned. It is a working record, not a publication — a separate site distills these into a public "follow along" narrative later. The job here is a faithful, detailed trail, not a polished story. Don't write for an audience; don't market; don't smooth over the messy parts — the mess is the most useful part.

**Why it's worth the effort.** The git diff already captures what changed, line by line. It never captures *why* — why this approach over another, what looked right but broke, what was learned. That "why" is the decision record that makes the code legible to future-me, to forkers, and to people following along. Spend words there.

## Where & format

- One file per entry: `log/YYYY-MM-DD-short-slug.md` (multiple per day is fine).
- Light frontmatter:

```
---
date: 2026-06-22
title: short and factual (not a headline)
phase: scaffolding   # scaffolding | agent-loop | knowledge | byok | shipped
---
```

## When

At natural beats, not every commit — finishing a unit of work, making or reversing a notable decision, changing phase, or hitting a wall. Several short entries beat one giant one.

## What to capture (lean toward detail on the why)

- **What I did** — briefly; the diff has the specifics, don't re-narrate the code.
- **Why** — the problem, the reasoning, the tradeoff.
- **Decisions & alternatives** — what was chosen, what was considered and rejected, and especially anything **reversed**: tried it, it didn't work, here's why. Flag these clearly — dead-ends are the highest-value entries.
- **Learned / surprised** — friction, gotchas, anything you'd warn the next person about.
- **Open / next** — what's unresolved.
- Reference commits by short SHA where useful.

**Voice.** Plain, factual, specific. Capture, don't perform.
