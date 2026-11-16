# Exam bank review: results

Review of every row of the production `questions` table, using the read-only export `docs/exam-bank-export/2026-11-16/` (Manus commit `d118897a`, 24,350 rows, 39 banks). Method follows `docs/exam-bank-review-plan.md`. Nothing here has been applied: no database write, no question file edited. `corrections.json` holds every finding for Manus to apply.

## What was done

- **Coverage:** all 24,350 rows were read, in 174 chunks of about 150 questions, in bank order. Reviewed by Claude models only (no human subject-matter review, no alignment to WPI or state exam outlines).
- **Reviewers:** chunks 1 to 35 by Opus 5.5, chunks 36 to 174 by Sonnet 5.5 (switched to cut usage). One reviewer at a time from chunk 31 on.
- **Check that reviewers were reading:** every chunk had two planted wrong questions. From chunk 13 on, one of the two was subtle: a real calculation question with its key and final step quietly changed. **347 of 348 planted errors were caught.** The one exception, in chunk 174, was a faulty planted item, not a reviewer miss: it was copied from a question whose key was already wrong, and my edit happened to make it correct. The reviewer correctly left it alone and correctly flagged the original.
- **Spot checks by me:** I recomputed about ten flagged calculations by hand (wet-well volume, Manning flow and slope, Hazen-Williams loss and the C-value factor, a standard deviation, an annuity payment, 30^0.75, a per-capita flow, a unit conversion). The reviewer was right every time.
- **A stricter second read** of one clean chunk (chunk 7) found the same result as the first read, so low problem counts in the newer banks look real.

## Findings

**1,803 of 24,350 questions (7.4%) have a problem.** The export has 24,140 distinct questions; 176 appear in two banks and 17 in three, and each copy was reviewed on its own.

| Verdict | Questions | Meaning |
|---|---:|---|
| WRONG | 669 | Wrong key, wrong arithmetic, wrong fact, or explanation that contradicts the key |
| UNCLEAR | 515 | Two defensible answers, misleading wording, or a claim that could not be confirmed |
| JURISDICTION | 334 | Another place's rule used: US EPA/OSHA rules or Ontario terms (ECA, O. Reg. 128/04 and 129/04, OHSA) in a western or Ontario bank |
| UNITS | 278 | US units in a Canadian bank (answers recalculated in the fix) |
| OFF-TOPIC | 7 | Not about the operator's field |

34 findings have no fix (`fix: null`) because the reviewer could not repair them; remove or rewrite those.

### By bank (highest problem rate first)

| Bank | Questions | Problems | Rate | Wrong | Unclear | Jurisdiction | Units |
|---|---:|---:|---:|---:|---:|---:|---:|
| wpi-class2-water-dist | 595 | 173 | 29.1% | 30 | 26 | 36 | 81 |
| wpi-class4-water-dist | 620 | 140 | 22.6% | 25 | 12 | 35 | 68 |
| wpi-class2-wastewater | 599 | 123 | 20.5% | 39 | 66 | 16 | 2 |
| wpi-class1-wastewater | 594 | 92 | 15.5% | 34 | 43 | 15 | 0 |
| wpi-class3-water-dist | 611 | 89 | 14.6% | 5 | 7 | 14 | 63 |
| class4-water-dist | 568 | 78 | 13.7% | 49 | 17 | 8 | 4 |
| wqa | 500 | 64 | 12.8% | 32 | 28 | 2 | 2 |
| class3-wastewater-coll | 572 | 73 | 12.8% | 38 | 19 | 12 | 2 |
| class4-wastewater-coll | 570 | 71 | 12.5% | 42 | 15 | 11 | 3 |
| class1 | 250 | 30 | 12.0% | 15 | 8 | 7 | 0 |
| wpi-class4-water | 678 | 79 | 11.7% | 28 | 15 | 34 | 2 |
| class4-wastewater | 588 | 56 | 9.5% | 28 | 9 | 19 | 0 |
| class2-water-dist | 785 | 73 | 9.3% | 35 | 17 | 4 | 17 |
| class3-water | 563 | 48 | 8.5% | 33 | 12 | 2 | 1 |
| class3-wastewater | 580 | 49 | 8.4% | 25 | 14 | 9 | 1 |
| class4-water | 569 | 48 | 8.4% | 27 | 17 | 4 | 0 |
| wpi-class3-water | 561 | 47 | 8.4% | 19 | 14 | 14 | 0 |
| class2-wastewater | 796 | 63 | 7.9% | 21 | 19 | 18 | 5 |
| wpi-class1-water-dist | 500 | 37 | 7.4% | 3 | 10 | 24 | 0 |
| class2-wastewater-coll | 810 | 59 | 7.3% | 27 | 16 | 4 | 7 |
| wpi-class1-wastewater-coll | 499 | 32 | 6.4% | 14 | 12 | 6 | 0 |
| oit | 1038 | 56 | 5.4% | 21 | 30 | 2 | 3 |
| wpi-class3-wastewater | 607 | 32 | 5.3% | 12 | 11 | 8 | 1 |
| wpi-class2-water | 598 | 27 | 4.5% | 13 | 8 | 6 | 0 |
| class2-water | 753 | 30 | 4.0% | 14 | 14 | 1 | 1 |
| oit-ww | 1033 | 38 | 3.7% | 14 | 16 | 7 | 1 |
| wpi-class2-wastewater-coll | 503 | 18 | 3.6% | 7 | 8 | 2 | 1 |
| wpi-class1-water | 598 | 21 | 3.5% | 5 | 9 | 7 | 0 |
| wpi-class3-wastewater-coll | 503 | 10 | 2.0% | 3 | 2 | 3 | 2 |
| class3-water-dist | 821 | 12 | 1.5% | 0 | 11 | 0 | 1 |
| wpi-class4-wastewater-coll | 503 | 7 | 1.4% | 3 | 0 | 3 | 1 |
| class1-water-dist | 966 | 9 | 0.9% | 3 | 1 | 0 | 5 |
| class1-wastewater | 815 | 7 | 0.9% | 4 | 2 | 1 | 0 |
| class1-water | 805 | 6 | 0.7% | 1 | 5 | 0 | 0 |
| wpi-class4-wastewater | 907 | 4 | 0.4% | 0 | 0 | 0 | 4 |
| class1-wastewater-coll | 974 | 2 | 0.2% | 0 | 2 | 0 | 0 |
| us-class1-water-dist | 198 | 0 | 0.0% | 0 | 0 | 0 | 0 |
| us-class1-water | 200 | 0 | 0.0% | 0 | 0 | 0 | 0 |
| us-texas-class-d-water | 120 | 0 | 0.0% | 0 | 0 | 0 | 0 |

### Patterns worth knowing

1. **A block of calculation questions with wrong keys.** About 230 of the findings are questions numbered in the 240,000s (calculation questions in the Class 3 and 4 banks and the western banks). Many have a key that does not match their own working, and some explanations admit it.
2. **Question and answers that do not match.** Mostly in the western `wpi-class1-wastewater`, `wpi-class2-wastewater` and `wpi-class2-water-dist` banks: a question about total dynamic head with answers in kW, a total-nitrogen question with a phosphorus answer, steps copied from a neighbouring question. A learner sees an obviously broken item. Fix these first.
3. **Western banks use Ontario terms; Ontario banks use US terms.** For example "Environmental Compliance Approval" and O. Reg. 129/04 in western Canada, and "Long-Term Control Plan" or biosolids "Class A/B" in Ontario.
4. **US units in western banks**, concentrated in `wpi-class2-water-dist` (81), `wpi-class4-water-dist` (68) and `wpi-class3-water-dist` (63).
5. **Classic wrong facts recur across banks**: chlorine gas raising pH, hydrogen sulfide lighter than air, methane described as heavier and non-flammable, E. coli listed as a protozoan, nitrification and denitrification swapped, total chlorine as free minus combined. Each also shows up as a copied question in several banks.

## What the review does not cover

- **No second check of the fixes.** The reviewers' corrected questions are model output. Spot-check them, especially JURISDICTION fixes, before they go live.
- **Facts reviewers could not confirm online.** Many reviewers ran no web search. `needs-source-check.txt` lists what to confirm before applying, including Ontario sampling frequencies (Schedule 6 and 10), holding times, the lead limit (the Ontario bank fixes assume 0.010 mg/L, the western banks use Health Canada's 0.005 mg/L, so check which figure applies where), Health Canada manganese and iron values, and several OPSS and MECP citations.
- **US-unit coverage is incomplete in one place.** The reviewer of chunk 170 said it left several unflagged. A text scan of the Canadian banks found 144 more questions with US-unit terms that no reviewer flagged (`units-unflagged-candidates.json`). These are pattern matches only: some are incidental (a pipe size in inches), so each needs a quick read.
- **Visibility was not considered.** The export includes every row; `reviewStatus` is `unreviewed` or `approved` for all of them, so none are hidden by the review-status filter. Whether a learner currently sees a bank depends on course and access rules outside this export.
- **The three US banks and `wqa`** were read with the same brief, but US rules were not matched against each state's own outline.
- **309A** (electrician) is not in this export.

## Files

- `corrections.json`: every finding, with bank, question number, id, verdict, reviewer note, the original question and a full corrected question.
- `needs-source-check.txt`: findings that rest on unconfirmed facts.
- `units-unflagged-candidates.json`: question ids per bank with US-unit terms that no reviewer flagged.
- `MANUS-REQUEST.md`: what Manus should do with these.
