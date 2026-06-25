# Poor-man's evals — engineering an LLM-core app

> Notes on the discipline of building an app with a model at its core, written against
> this repo's own machinery. It's the "roll-your-own, local-only" version of what tools
> like LangSmith / Braintrust / promptfoo sell — kept deliberately small so every piece
> is understandable. A living doc; update it as the practice sharpens.

## The one idea everything hangs on

An LLM is a **non-deterministic, untrusted runtime that you don't own and that can change
underneath you** — and engineering a serious app around such a thing is its own
discipline.

In classic software, your *code* is deterministic and your *data* varies, so you test the
code. Here it's inverted: the "compute" (the model) is probabilistic, opaque, and
swappable, and the code *you* actually write is mostly the **boundary around it** — the
spec going in, the contract coming out, and the instrumentation to know what happened. So
all your engineering effort migrates to that boundary. That's the whole game.

## The mental model: you're managing a contractor, not calling a function

You don't see inside their head. You give them a brief (the system prompt), you spot-check
samples of their work against your standards (evals), you keep records of every job
(observability), and — critically — when you *change who's doing the work* (a model
upgrade), you re-check everything, because the new contractor reads the same brief
differently. Almost every practice below is a version of how you'd manage a skilled but
unpredictable hire.

## The pillars

1. **The spec** — your system prompt. The skill is steering *without* shackling
   (principles and ranges, not example outputs — a concrete example muzzles the model into
   copying it). Keep it as legible prose, not buried in code, so it's auditable and
   editable by a human or another agent.
2. **The contract** — reliable structured output (e.g. JSON). Two routes: prompt-craft, or
   constrained / tool-use decoding. Either way you **validate at the boundary**, because
   the model *will* occasionally break format. Never trust the output shape.
3. **Observability** — capture every input + output. The point isn't debugging one run;
   it's seeing **patterns across many**, because with a probabilistic system you reason
   about *distributions*, not single executions.
4. **Evals** — the big one, and the part that's genuinely *new*. You can't `assertEquals`
   a probabilistic function, so you test **behavior over a representative dataset against
   criteria**. Two kinds people constantly conflate:
   - **Capability evals** — "is it good?" Does it honor intent across your golden set?
     Scored by hard checks ("must-nots") or a fuzzier "LLM-as-judge."
   - **Guardrail / scope evals** — "does it stay in its lane?" Feed it off-topic or
     adversarial input (*"teach me to change my battery"*) and assert it **refuses or
     redirects** instead of cheerfully doing the wrong thing. A distinct, important
     category that's easy to forget.
5. **Versioning + rollback** — prompts *are* code, so they live in git; a tweak is a diff
   you can revert, and evals are how you know the diff was an improvement.
6. **Guardrails (runtime, not just test)** — the refusal behavior itself ("I make
   palettes; I can't help with batteries"). Lives partly in the spec, partly in input
   checks. The eval *verifies* it; the prompt/code *implements* it.

## Why evals are load-bearing, not optional

The sharpest reason: **if the model changes, your tuning gets reinterpreted.**

In normal software your dependencies have version numbers and changelogs. A model upgrade
is a **silent change to your most important dependency, with no diff you can read — only
behavior.** Your eval suite *is* the diff. It's the regression test that tells you "the
new model honors *nothing girly* 9 times out of 10 instead of 10" before your users find
out. (It's also why every captured run should record *which model* produced it — so a
result is always attributable to the runtime behind it.)

## How this repo maps to it

The irreducible core of the discipline, in ~a few hundred lines, all local:

| The discipline | This repo |
|---|---|
| Spec (versioned) | [`knowledge/color-theorist.md`](../knowledge/color-theorist.md) — the model's system prompt, sent verbatim, in git |
| Structured-output contract | [`src/features/agent/prompt-palettes.ts`](../src/features/agent/prompt-palettes.ts) — parse + validate; drop malformed palettes |
| Observability / traces | `eval/runs.jsonl` — every dev run, full reply, with the model id captured |
| Golden set | [`eval/prompts.md`](../eval/prompts.md) — stable briefs with intent + must-nots |
| Eval harness / runner | the dev-only "EVAL" bar ([`src/components/dev/eval-runner.tsx`](../src/components/dev/eval-runner.tsx)) — pick a brief, run it |
| Scorers | the per-brief must-nots (still eyeballed; not yet automated) |

How the loop runs: pick a brief → read the captured reply → tweak the spec
([`color-theorist.md`](../knowledge/color-theorist.md)) → run it again → compare. The
method (and the trap of over-steering) is in [`eval/README.md`](../eval/README.md).

## The rungs not yet climbed

Both natural, neither urgent:

- **Scope / refusal evals.** Add a couple of off-topic briefs to `prompts.md` whose
  "pass" is a *graceful decline*, and see what the model does today.
- **Automated scorers.** Codify a must-not (e.g. "no hue in the magenta/pink band") so a
  run self-checks against `runs.jsonl` instead of being eyeballed.

## In one line

This is **eval-driven development for LLM features**: treat the prompt as code and the
model as an untrusted, swappable runtime, and move all your rigor to the boundary — spec
in, contract out, traces recorded, behavior tested against a representative set (including
the out-of-scope cases), re-run whenever the model or the prompt changes. Not a homemade
approximation of the "real" thing — it *is* the real thing, minus the dashboards.
