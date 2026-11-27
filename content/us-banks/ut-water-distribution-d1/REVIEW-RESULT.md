# Review result: Utah Water Distribution D1 (`ut-water-distribution-d1`)

Local draft, version 2026-11-27-v1. Not imported, not activated, not published. Not pushed to origin, because the review threshold was not met.

## Build checks

- `node scripts/us-bank.mjs lint` and `build`: pass. 250 questions, 75 calculations.
- Answer positions A/B/C/D: 63, 63, 62, 62.
- Calculations recomputed with `python3 -I` against the bank JSON: 75 checked, 0 mismatches.
- Answer cues: the correct answer is the longest option in 0% of conceptual items and the shortest in 6.9%. Both are under the 35% limit.
- Difficulty: conceptual 52 easy, 96 medium, 27 hard. Calculations 45 medium, 30 hard.

## GPT review (gpt-6.2-sol only)

Each batch had two planted errors, which were kept out of the bank. Planted errors were a wrong key on a conceptual item, or a changed stated constant on a calculation item.

| Round | Batches | Rows reviewed | GPT flags on real rows | Planted caught |
|---|---|---|---|---|
| 1 (full bank) | 10 | 230 | 130 (56.5%) | 20 of 20 |
| 2 (changed plus unreviewed rows) | 2 | 32 | 12 (37.5%) | 4 of 4 |

Round 1 flag categories: option plausibility 90, ambiguous 13, duplicate 11, giveaway 8, other 5, math 2, key 1.

Round 2 flag categories: option plausibility 7, ambiguous 2, duplicate 2, giveaway 1.

### What changed between rounds

Sixteen rows were corrected: a wrong key (q64), wrong explanations (q97, q124, q125), a malformed worked substitution (q224), ambiguous calculation stems (q222, q223, q229, q230), and giveaway or near-duplicate wording (q7, q14, q56, q76, q81, q83, q104). Round 2 also re-reviewed 20 rows that round 1 never saw in original form, because each planted copy replaced a real row in its batch. Four real rows in round 2 were also replaced by planted copies and were not re-reviewed.

## Threshold and stop reason

The target was fewer than 10% of changed rows flagged, or three rounds. The second round flagged 37.5%, so the threshold was not met. This run stopped after two rounds. The remaining flags are mostly about whether distractors are plausible enough, and they sit in rows I did not change. Fixing them is a content task outside this run. The flags are listed in `LEFT-FOR-HUMAN.md`.

## Catch rate

Planted errors were caught in 24 of 24 cases, across both rounds. The catch rate measures sensitivity only. Round 1 also flagged 130 real rows, so the reviewer is strict and its real-row flags are not a precise error count.

## Limits

- The R309-300 rule text was not retrieved. The dossier URL returns 404 on 2026-11-27. Rules items use only DDW study-help and certification-page facts and general recordkeeping practice.
- The bank is labeled D1 only. The dossier recommends grade-specific banks, so SS, D2, D3 and D4 are not built.
- The Rules module has 24 items, against about 47 implied by the published D1 allocation. The allocation is adjusted; see `config.json`.
- Technical items are original general knowledge within the published categories. No granular Utah blueprint exists, so no item cites a Utah rule number.
- Some calculation items are near-duplicates of each other.
