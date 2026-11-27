# TX Wastewater Treatment Plant Operator, Class D (Narrow): review result

**Scope.** Narrow practice bank. Practice questions aligned to the TCEQ need-to-know categories; not the official exam blueprint. TCEQ publishes need-to-know categories for Class D, not an exam outline, weights or question counts. No category share, weight or exam count is claimed. Source: TCEQ "What You Need to Know for a Class D Wastewater Treatment Plant Operator Exam" (page read 2026-11-27). Dossier: `docs/us-launch/state-dossiers/tx-operator-certification.md` on branch `claude/tx-dossier` (7299c1123), Narrow verdict, section 7 item 2 (owner chose a Narrow bank with a "need-to-know criteria, no weights" label).

## Counts

- 400 questions: 309 conceptual, 91 calculations (23 percent calculations; the brief's about 30 percent was not reached, and it was not rebalanced).
- 20 categories, 20 questions each (min 20, max 20). 40 topics, 10 each (min 10, max 10).
- Levels: easy 121, medium 188, hard 91 (hard is 23 percent, above the brief's 15 percent conceptual target; not rebalanced).
- Correct answer position: A 100, B 100, C 100, D 100.
- Longest-option share 32.7 percent (limit 35). Shortest-option share 28.8 percent.
- Recorded in `config.json`: `count` 400, `calcCount` 91.

## Checks run

- `node scripts/us-bank.mjs lint`, `build` and `check`: all pass after the fixes below.
- 91 calculations recomputed with `python3 -I` against each stated answer: 0 mismatches.
- Review: 400 items in 16 chunks of 25. Reviewer: `gpt-6.2-sol` via the OpenAI proxy (id confirmed by `GET /v1/models`). One call per chunk, same prompt.
- Planted errors: 2 per chunk, 32 in total, in the review copy only (never in the bank). One is a flipped answer key; the other is a changed constant in a stem, or a reversed key term in an explanation. Caught: 32 of 32 (100 percent).
- Unplanted flags: 134. Types: cue or plausibility ("the only option ..."), 79; factual, 41; ambiguous, 11; key, 2; math, 1.

## Fixes

- 52 items edited at source (63 field edits): 13 stems (2 of them calculation stems), 19 correct answers, 2 distractors, 1 calculation unit, 28 explanation sentences. These address the factual, key, math and ambiguous flags. Examples: a "minimum experience" wording that conflicts with the Class D entry level; a force-main explanation; a grit-definition overstatement; ponding wording; an effluent oxygen claim; the chlorine demand and residual definitions; a dosage term renamed to feed rate; a pounds-per-acre-per-year unit.

## False positives recorded

- Item 27 (effluent definition): the definition is correct; the reviewer's concern was not a real error.
- Item 64 (confined space): the reviewer added a condition that the stem does not ask about.
- Item 187 (level weir): the explanation does not claim a guarantee.

## Unresolved

- 79 items flagged by the reviewer for answer cues or weak distractors ("B is the only option about ..."). Not adjudicated or rewritten. Item numbers: 26, 28, 30, 31, 32, 33, 35, 36, 38, 40, 41, 42, 45, 47, 49, 51, 54, 55, 56, 58, 59, 60, 61, 62, 63, 65, 66, 67, 69, 70, 71, 72, 73, 76, 77, 79, 81, 83, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 99, 100, 119, 120, 124, 128, 129, 138, 140, 142, 143, 144, 157, 158, 159, 166, 216, 217, 253, 260, 261, 268, 270, 271, 273, 278, 281, 301, 303, 309.
- The 52 fixes were not re-reviewed by GPT. Any later release needs a second review of the edited items.

## Limits

- Single writer. One author produced all content; the reviewer is a single model.
- Gemini is not available. No second model review.
- Not compared with the official TCEQ exam. TCEQ publishes no blueprint, so the bank cannot be checked against one.
- No exam weights or question counts exist to balance against. The bank is not balanced to an exam.
- Readiness contract: `docs/us-launch/US_STATE_QUESTION_BANK_READINESS_2026-10-29.md` allows candidate batches only from Suitable dossiers. This Narrow bank was built on the owner's explicit instruction (dossier section 7 item 2). An owner decision is needed before any use.
- The dossier says the TCEQ page text is in its source notes. It is not; the page was read directly.
- Not imported, not activated, not published, no database rows.
- Calculation explanations are generated from the formula and expression by the builder.
- Hard share and calculation share were not rebalanced to the brief's targets.
