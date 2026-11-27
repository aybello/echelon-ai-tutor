# Florida Drinking Water Treatment Plant Operator, Class C: final review record

Bank: `fl-water-treatment-c` (branch `claude/us-bank-fl-treatment-c`, starting commit `0bebe6b0f`)
Scope: 150 items (114 conceptual, 36 calculation). Review only. Nothing imported, activated or published.

## Reviewers and chunks

- Reviewers: one reviewer, the agent that ran this review (single model, Claude Haiku 5.5). No second model reviewed the bank. Gemini was not available.
- Chunks: six sequential chunks of 25 items (items 1-25, 26-50, 51-75, 76-100, 101-125, 126-150). Chunk 5 holds 14 conceptual and 11 calculation items; chunk 6 holds the last 25 calculation items.
- Stalls: none. Every chunk finished on the first pass, so no chunk was retried at 12 items.

## Planted-error catch rate

Two errors were planted per chunk in a separate review copy (not the bank): a wrong answer key, and a changed word or number in an explanation or formula. The plant key was sealed until the review was finished.

| Chunk | Items | Planted errors | Caught | Plants |
|---|---|---|---|---|
| 1 | 1-25 | 2 | 2 | key swap (item 2); explanation "more" to "less" (item 5) |
| 2 | 26-50 | 2 | 2 | key swap (item 31); explanation "more" to "less" (item 38) |
| 3 | 51-75 | 2 | 2 | key swap (item 58); explanation "lower" to "higher" (item 59) |
| 4 | 76-100 | 2 | 2 | key swap (item 78); explanation "divided" to "multiplied" (item 82) |
| 5 | 101-125 | 2 | 2 | key swap (item 102); formula "divided" to "multiplied" (item 119) |
| 6 | 126-150 | 2 | 2 | formula "times" to "divided" (item 146); expression "*" to "+" (item 149) |
| Total | 150 | 12 | 12 | 100 percent |

Caveat: the reviewer had read the real bank text before the planted copy was made, so this is not a blind test. The plants were also obvious contradictions. Treat 12 of 12 as an upper bound, not an independent rate.

## Findings and triage

Every finding was confirmed against the text. Calculation answers were recomputed with `python3 -I` for all 36 items. No calculation answer was wrong and no wrong value equalled the correct answer.

| # | Item | Type | Finding | Verdict | Action |
|---|---|---|---|---|---|
| 1 | 4 | Stem repeats answer word | Stem "dissolved minerals" and keyed "dissolved from rock" | Real, minor | Stem reworded to "pair of minerals" |
| 2 | 7 | Giveaway word | Distractor used "all" ("at all depths") | Real | Distractor reworded to "throughout the water column" |
| 3 | 20 | Stem repeats answer word | "Low-alkalinity" in stem, "alkalinity" in keyed answer | Real, minor | Stem reworded to "little natural buffering" |
| 4 | 23 | Stem repeats answer word | "basin" in stem and keyed answer | Real, minor | Stem uses "settling unit" |
| 5 | 28 | Stem repeats answer word | "basin" in stem and keyed answer | Real, minor | Stem uses "settling unit" |
| 6 | 33 | Stem repeats answer word | "sand" in stem and keyed answer | Real, minor | Keyed answer uses "the bed" |
| 7 | 34 | Stem repeats answer word | "particles" in stem and keyed answer | Real, minor | Stem uses "suspended matter" |
| 8 | 36 | Stem repeats answer word | "disinfectant" in stem and keyed answer | Real, minor | Stem reworded to "residual in chlorinated water" |
| 9 | 61 | Stem repeats answer word | "zone" in stem and keyed answer | Real, minor | Stem uses "dead-end area" |
| 10 | 65 | Stem repeats answer word | "pump" in stem and keyed answer | Real, minor | Stem uses "A unit still runs" |
| 11 | 91 | Stem repeats answer word | "well" in stem and keyed answer | Real, minor | Keyed answer uses "yields" |
| 12 | 103 | Explanation mismatch | Keyed answer says "before filtration"; explanation says "before distribution" | Real | Explanation now says "before filtration" |
| 13 | 103 | Stem repeats answer word | "reservoir" in stem and keyed answer | Real, minor | Keyed answer uses "algae growth ... in the source" |
| 14 | 114 | Stem repeats answer word | "before" and "full" in stem and keyed answer | Real, minor | Keyed answer uses "ahead of design" |
| 15 | 121 | Missing stated constant | "2.1 MGD" converted to gal/day by the expression, but no 1 MGD = 1,000,000 gal stated | Real | Constant added to stem |
| 16 | 122 | Missing stated constant | Same, "1.5 MGD" | Real | Constant added to stem |
| 17 | 123 | Missing stated constant | Same, "1.0 MGD" | Real | Constant added to stem |
| 18 | 124 | Missing stated constant | Same, "1.6 MGD" | Real | Constant added to stem |
| 19 | 1-114 (all) | Factual, key, explanation | Read every keyed answer and explanation against the stem | No error found | None |
| 20 | 115-150 (all) | Calculation | 36 answers recomputed with python3 -I; formula text matches expression | No error found | None |
| 21 | 117, 119 | Distractor quality | Some wrong values are not tied to a named mistake (for example 1.2 in item 117, 0.1 in item 119) | Real but minor; the brief asks for mistake-based distractors | Not fixed; see limits |
| 22 | 92, 94, 95, 96 | Scope (dossier exclusion) | Hazard awareness items for H2S, oxygen deficiency, chlorine leaks, safety vs security | False positive on procedure; kept as awareness-level | None |
| 23 | 70 | Scope | Intake screen clog, first response | Generic practice, not site-specific; kept | None |
| 24 | 99 | Scope | Missed monitoring record; no deadline or limit | Kept | None |
| 25 | 19, 45 | Repeated word shared by all options | "alum" (item 19) and "hardness" (item 45) appear in the stem and in several options | False positive; a word shared across options is not an answer giveaway | None |
| 26 | 76 | Wording | "remove the iron well" reads oddly | False positive; idiomatic enough | None |
| 27 | 59 | Distractor could be correct | "A slower flow velocity" as a friction cause | False positive; explanation states lower velocity reduces friction | None |

All 150 items were checked for the error types in the brief. The table lists only the findings and the false positives.

## What was fixed

- 14 conceptual rows in `source/conceptual.txt` (stems, one distractor, one keyed answer, one explanation) and 4 calculation rows in `source/calculations.txt` (stated constant only). No row was inserted, reordered or deleted.
- `questions/bank-150.json`, `manifest.json` and `REVIEW.md` were regenerated with `node scripts/us-bank.mjs build fl-water-treatment-c`. `check` then passed.
- No keyed answer changed value; no calculation expression changed.

## Final counts after the fixes

- Total 150: 114 conceptual, 36 calculation. Matches `config.json` (`count` 150, `calcCount` 36).
- Conceptual difficulty: 38 easy (33 percent), 58 medium (51 percent), 18 hard (16 percent). Target was about 30/55/15.
- Calculation difficulty: 22 medium (61 percent), 14 hard (39 percent). Target was about 60/40.
- Answer positions (builder): A 37, B 38, C 37, D 38.
- Correct option strictly longest: 4 of 114 conceptual items (3.5 percent), within the 5 percent limit. Shortest-option rate 25.4 percent by the builder's cue.
- Giveaway words in options: none after the fixes.
- Stem-repeats-answer-word check: none flagged after the fixes.

## Limits

- Single writing model and single reviewer. Gemini was unavailable, so no second model reviewed the bank.
- DEP handbook (June 2026) was not rechecked against the live source in this review.
- No comparison with real exam questions was made.
- The planted-error catch rate is not blind (see the caveat above).
- Brief conflict: the writer brief asks for 8 to 12 questions per topic, but 150 items over about 20 topics gives about 7 per topic. Not changed.
- Dossier conflict: the dossier's recommended identity is `fl-drinking-water-treatment-class-c`, and the bank uses `fl-water-treatment-c`. Not renamed; the owner should confirm.
- Some calculation distractors are not tied to a named mistake (finding 21). Not fixed.
- Two review files already in the bank folder from earlier rounds (`REVIEW.md` is regenerated; `REVIEW-RESULT.md` left as it was).
- Reviewed text is unreviewed by a human: `reviewStatus` remains `unreviewed` in the generated items.
