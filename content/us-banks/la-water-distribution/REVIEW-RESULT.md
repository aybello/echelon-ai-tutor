# Review result: Louisiana Water Distribution Class 1-4 practice bank

Bank `la-water-distribution`, version 2026-11-27-v1. Queue entry 20. Local candidate: not imported, not activated, not published, not pushed. Question numbers 1 to 250 are proposed, not reserved in production.

## Outcome

**Threshold not met.** After three GPT review rounds, 46 of 230 real items (20.0%) were still flagged. The target was fewer than 10%. Review stopped at the three-round limit, so the bank was not pushed. Remaining flags are listed in `LEFT-FOR-HUMAN.md`.

## Reviewer

- GPT only: model `gpt-6.2-sol`, id confirmed with GET https://api.openai.com/v1/models. No other model and no human reviewer were used.
- Each round sent the full bank as 10 chunks of 25 items, one request per chunk. Round 1 covered the first full build. Rounds 2 and 3 re-reviewed all 250 items, so changed and unchanged rows were both covered.
- Raw request and response files are in the session scratch folder, not in the repository.

## Rounds

| Round | Bank reviewed | Real items flagged | Planted errors caught |
|---|---|---|---|
| 1 | First full build | 118 of 230 (51.3%) | 20 of 20 |
| 2 | After round-1 fixes | 80 of 230 (34.8%) | 20 of 20 |
| 3 | After round-2 fixes | 46 of 230 (20.0%) | 20 of 20 |

Round-1 flags were mainly distractors that were unrelated or absurd, scope drift (treatment, source development, sewer), missing calculation assumptions, and a few wrong keys and explanations. The under-registration key was wrong and was corrected. Round-2 flags were mostly weaker distractors and explanation wording. Round-3 flags are mostly distractor plausibility and ambiguous stems. Those were not edited after round 3.

## Catch rate

Each chunk in each round carried two planted errors in the review copy only: one key letter moved to a distractor (explanation unchanged), and one distractor replaced by a copy of the key. 60 of 60 planted errors were caught across three rounds (100%). The sample is small and the planted errors are the obvious kind, so this does not show that subtle real errors are caught at the same rate.

## Calculations

- All 75 calculations were recomputed with `python3 -I` from the stored expression, decimal places and unit: 0 arithmetic mismatches, 0 wrong values equal to the answer.
- Wrong values are the results of stated mistakes (missing conversion, radius for diameter, inverted ratio, missed time factor).
- Stems now state the assumptions that the answer depends on (no flow, equal elevations, no inflow or withdrawal, no unbilled use, no storage change).

## Counts (final file)

- 250 items: 175 conceptual, 75 calculations.
- Conceptual labels: easy 52, medium 97, hard 26. Calculation labels: medium 44, hard 30, easy 1 (item 177).
- Modules: Class 1 conceptual 48 and math 12; Class 2 conceptual 44 and calculations 23; Class 3 conceptual 43 and calculations 23; Class 4 conceptual 40 and calculations 17.
- Answer positions: A 62, B 63, C 63, D 62.
- Builder answer cues: correct answer longest in 24.6% of items and shortest in 10.9% (limit 35%). No giveaway words; no options with absolute words from the brief's list.
- Lint: valid. Build: exit 0. Check: exit 0.
- Against the first draft, 166 of 175 conceptual rows and 19 of 75 calculation rows were changed.

## Source limits

- The LDH Need-to-Know outline, the LDH program page, the operator certification rule and the exam application all returned HTTP 403 from ldh.la.gov on 2026-11-27. The response came from the origin (the CONNECT tunnel succeeded), so it is not a proxy policy. The User-Agent was not changed and the block was not routed around. None of these pages was read.
- The topic structure follows the objective summary in the dossier, not the outline text. Sources fetched and used: La. R.S. 40:1281.1 and 40:1281.2 (definitions and committee, retrieved 2026-11-27). The 2026 exam schedule was retrieved but no item uses it.
- No item cites a rule, timeframe, fee, eligibility requirement, registration step, site procedure, emergency-response step or chemical-handling instruction.

## Other limits

- Gate: the dossier says not to create a new unique bank identity until the earlier US Class I water-distribution package is compared. That comparison was not done. See `LEFT-FOR-HUMAN.md`.
- GPT is a model reviewer. The dossier requires an independent qualified review, which has not happened.
- 11 conceptual topics have 6 or 7 items, below the brief's 8 to 12 target.
- Round-3 flags unresolved: 46 items, listed in `LEFT-FOR-HUMAN.md`.
