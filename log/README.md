# log/ — the build trail

Built in public. `log/` records how the build actually went — what changed and,
crucially, the **why** the git diff can't show.

## Format

- **One file per date:** `log/YYYY-MM-DD.md`. Append the day's beats to it; don't
  spawn a file per change-set.
- **Each beat is recap-shaped:**
  - **Changed:** a brief line — files touched, plus the commit SHA if there is one.
  - A short recap: what landed and its state (green / committed / verified).
  - **Why:** one line, but only when there was a real decision or reversal. Skip it
    on routine work. This is the highest-value content — it's why the log exists.
- Newest beat at the bottom.

## Voice

Terse and factual. The diff already has the code; don't re-narrate it. Capture the
outcome and the reasoning in as few lines as it takes — no essays, no marketing.
The recap you'd give at the end of a turn is about the right size.

## When

At natural beats (a unit of work, a notable/reversed decision, a phase change, a
wall), not every commit. A few short entries beat one giant one.
