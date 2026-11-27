# FL Class C water treatment bank: review result

Bank: `fl-water-treatment-c` (Florida DEP Drinking Water Treatment Plant Operator, Class C). Status: review-only draft, not imported, not published, not activated.

## Final counts

- 150 questions: 114 conceptual, 36 calculations (`config.json` count 150, calcCount 36).
- Difficulty: conceptual 38 easy, 58 medium, 18 hard; calculations 22 medium, 14 hard.
- Answer positions: 37 / 38 / 37 / 38 (A / B / C / D).
- Correct answer is the longest option in 5 of 114 conceptual items (4.4%); the shortest in 28 (24.6%). Checker limit is 35%.
- `node scripts/us-bank.mjs lint`, `build` and `check` all pass on the final source.

## Reviewers

- Two fresh Claude sessions, model claude-haiku-5-5, one per half: Q1 to Q75 and Q76 to Q150. Each read only its packet, with no access to the author's notes and no knowledge of the planted errors.
- Same model family as the author. This is not an independent model check. No Gemini review was run because Gemini was not available here.
- Each reviewer got the stems, options, key and explanation, and for calculations the stated assumptions. The builder's expressions were not shown.

## Round 1 (planted-error test, then review of the first full draft)

Two errors were planted in each reviewer's copy of the packet, to test whether the reviewer reads every question. The planted errors were never in the bank.

| Half | Planted error | Reviewer result |
|---|---|---|
| A (Q1 to Q75) | Q8: key pointed at a wrong option | Caught ("key should be B, not C") |
| A | Q16: two identical options | Caught ("options A and D are identical") |
| B (Q76 to Q150) | Q92: explanation said H2S is lighter than air | Caught ("H2S density error") |
| B | Q150: printed correct option did not match 12.0 lb/day | Caught ("no option matches 12.0 lb/day") |

Planted-error catch rate: 4 of 4 (100%). That is a small sample and says little about other error types.

Real problems reported in round 1: Half A reported no others. Half B reported Q95 and Q103 as giveaway wording. Both were real and were fixed (see below).

## Fixes made

Author checks and the round-1 reviewer found and fixed these in new rows only (no existing row was changed):

- Q95: one distractor was the only option that mentioned people, which gave away the answer. Replaced with a closed room with an exhaust fan and no one inside.
- Q103: the stem repeated "algae", a distinctive word from the correct answer. Stem reworded.
- Stem repeats of answer words, found by a scan of all rows: Q68, Q70, Q72, Q76, Q84, Q88, Q94, Q103 (stems reworded).
- Banned words in options (`every`, `all`): Q57, Q106, Q112 (reworded).
- Correct answer was the longest option in 32 of 58 new conceptual rows. Lengthened wrong options or trimmed correct answers. The longest-option rate fell from 37 of 114 to 5 of 114 overall.
- Calculation rows: four wrong values printed as "0 days", "0 gpm/ft", "0 mg/L" or "1 %" after rounding. Changed decimal places or the wrong values (Q138, Q141, Q144, Q149).
- All 36 calculation answers were recomputed by hand and match the builder.

## Round 2 (final text, no planted errors)

Two fresh reviewer sessions (session_01ThbFUXYbyD87dmjww2j3kX for Q1 to Q75, session_01ThbFUWwweRkH2EaN7hvdyv for Q76 to Q150) were started on the final text. Their packets are review-round2-packets/ on the branch, with no planted errors. Both sessions stopped at their first read and had not returned results when this record was written. Round 2 is therefore NOT complete. The final text was checked only by the builder checks (lint, build, check), by the author's scan and by a hand recomputation of the calculations. Before any use, one reviewer per half should be run on the final text, and review-round2-packets/ should be removed from the branch.

## Limits and unresolved items

- No comparison with real exam questions was made. The questions are original practice items.
- The DEP Operator Certification Program Handbook is dated June 2026. The bank's source key cites that handbook, but its subject-area list was not re-checked against the handbook text in this session. The 20 subject areas come from the bank's `reviewIntro`.
- The brief asks for 8 to 12 questions per topic. Twenty subject areas and 150 questions cannot meet that: the average is 7.5 per area. Existing areas have 7 to 12 rows; new areas have 4 to 7.
- Existing rows were not changed, as the brief requires. Known issues in them that an owner should decide on:
  - Q116 (calculation): the answer is in degrees C, which conflicts with the US-units rule.
  - Q7: "at all depths" uses `all`, which the brief bans in options.
  - Q4, Q23, Q28, Q34, Q36: the stem repeats a word from the correct answer (`dissolved`, `basin`, `particles`, `disinfectant`). Minor.
- Both reviewers and the author used the same model. A human expert or a different model should check the final set before any use.
- The review packets were committed to the working branch for the reviewers and are removed in the final commit.
- Q92 in round 1 was the planted explanation error; the real bank row is correct.
