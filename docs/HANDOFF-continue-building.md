# Handoff: how to continue this work from another account

Written 2026-11-16. The previous session ran as the reviewer and engineer for `aybello/echelon-ai-tutor`. This file is what a new session needs to carry on.

## Ground rules (set by the owner)

- Work and push only on branch `claude/hello-5oz7m4`. Do not push anywhere else.
- Do not open a pull request unless the owner asks.
- Do not apply migrations, set environment flags, or change release gates. Those are for the owner and Manus.
- Do not edit the live content directly. Corrected content goes through the normal receipt path, which Manus runs. See `docs/manus-request-western-release-and-fixes-20261115.md`.
- Review by Claude models is the verification authority for the content. The owner decided this on 2026-11-15, so do not ask for a human field review.
- Game results stay private to the learner. They are not part of the readiness score and managers do not see them.
- Product goal: the best exam prep for both the US and Canada. Target 150 items per game mode per course, in all six modes.
- WPI means Water Professionals International (formerly ABC). Canadian courses use metric units.
- Commit files by name, not with `git add -A`. End commits with the attribution lines the session gives you.

## Where things stand

Done and pushed, last commit `56620ca6`:

- The game content for Ontario Classes 1 to 4, OIT, and the 16 western (WPI) courses. Each is at 150 or more items per mode, counting drafts.
- Saved game results (migration `0082`, off by default behind `INTERACTIVE_SAVED_PROGRESS_ENABLED`).
- A full review of every game item. See `docs/spot-check/full-review/RESULTS-full-review.md`. 13,669 distinct units were read, 432 had a problem, and the fixes are applied to 152 draft tables.

Waiting on Manus (nothing for you to do until it reports back):

- Publish the corrected and new tables.
- Exclude the 1,379 live items in `docs/spot-check/live-items-to-replace-20261115.json`.
- Publish the 288 corrected older items in `docs/spot-check/full-review/replacement-items.json`, or accept excluding them.

## What to do next, in order

1. **Review the exam question banks.** The full plan and the reviewer brief are in `docs/exam-bank-review-plan.md`; follow it. The game content is done; the multiple-choice exam questions have not been read.
   - They live in the production `questions` table, keyed by `bankKey` (for example `class1-wastewater-coll`). The table is not reachable from a cloud session, because `DATABASE_URL` is not set.
   - The repo holds the sources: `content/` (OIT, Class 1 and 3, others), `server/seeds/examBankGapQuestions.ts`, and the import scripts in `scripts/`. Start with those.
   - A read-only export of the `questions` table has been requested from Manus (section 6 of the Manus request). Ask the owner whether it has arrived and where it is. Do not ask for database credentials; use the export.
   - Method: use the same approach as the game review. Chunk the questions, send each chunk to a reviewer with a brief like `scripts/game-authoring/full-review/INSTRUCTIONS.md` adapted to four options and `correctIndex`, plant known errors as a check, and apply the fixes. An existing script, `server/seeds/runExamBankQualityAudit.ts`, checks structure only; it cannot tell whether a statement is true.
2. **US courses against each state's own exam outline.** The three US courses were read for truth but not matched to state outlines. The state dossiers are in `docs/us-launch/state-dossiers/`.
3. **A Class 3 distribution gap table**, written the way the Class 1, 2 and 4 gap tables were.
4. **Re-run the coverage check** after any change to the tables, using `scripts/game-authoring/full-review/coverage.mts`, so no course drops under 150 per mode.
5. **The daily review** (scheduled task `trig_015C4XQmXXyq6cwwNhNWeBHs`) stays read-only and silent if main has no new commits. Its last reviewed baseline is main `c5e8ba56`.

## How the game content is built

- Authoring tables live in `scripts/game-authoring/data/*.ts`. Each is built with `buildItems` from `scripts/game-authoring/build.ts`.
- One row is repeated across many courses (the shared pool), so **every fix has to be applied to every copy**. Search for the exact text across the folder.
- Validate a table: `scripts/game-authoring/check-draft.ts <file> <batch-name>`. It checks balance, duplicates, the ban on absolute words, answer-length tells, and minimum set sizes. `oit-batch1` to `oit-batch4` are already live and always report duplicates, so ignore those.
- Run tests like this, from the repo root:

```
env -i PATH="$PATH" HOME=/tmp NODE_ENV=test PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node --max-old-space-size=8192 --require ./scripts/test-safety.cjs node_modules/vitest/vitest.mjs run <test file>
```

  The heap flag matters, because the live content is about 48 MB. `NODE_OPTIONS` is blocked by the safety guard.
- Spot-check tools: `scripts/game-authoring/make-spot-check.py` draws a random sample from the committed content. The tools from the full review are in `scripts/game-authoring/full-review/`; read its README first, because the paths inside are hard-coded.

## Working with reviewers

- Send chunks to reviewer agents in waves of **at most six**. A bigger wave hit the usage limit and lost work.
- Always plant known errors in a chunk (see `canary.py`) and check they are caught.
- The best-known mistakes to plant: chlorine gas and pH, CT as concentration times contact time, a bacterium listed as a protozoan, hydrogen sulfide heavier than air, a reversed filter backwash order.
- Run one writer at a time when writing new tables.
- Check each unit against the rest of the bank by content, not by prompt alone. The first merge in the full review ignored options and pairs and missed 74 items.

## Useful facts

- The ABC Need to Know guides are on `owwco.ca` and are allowed by the network rules. The Tennessee host is blocked.
- Ontario rules to check against: O. Reg. 170/03 for drinking water, and ontario.ca for operator licensing. Two licensing claims are still unconfirmed: reciprocity excludes Quebec, and the general section has 40 questions.
- The Manus request lists every file Manus must publish and every exclusion. Keep it in step with any change.
