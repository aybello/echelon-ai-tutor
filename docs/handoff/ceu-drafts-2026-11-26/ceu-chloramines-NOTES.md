# Chloramines in Drinking Water for Operators: draft notes

Draft only. Not committed, not registered in any catalogue. Key `ceu-chloramines`, version `2026-11-26.1`, plannedMinutes 240, non-credit wording as in the model. `stream` is `drinking_water` (the schema allows one value; shared with wastewater). Companion files: `ceu-chloramines-SOURCECHECK.md`, `gap-report-chloramines.md`. Working scripts are in `ceuwork-chlor/` (build.py, validate.py, verify.py, figs.py, render.js).

## Counts (validate.py, 2026-11-26)
- 4 modules (why-and-how, dosing-arithmetic, monitoring-control, operation-troubleshooting), 6 checks each (24), 5 finals and 5 alternates per module (20 and 20). 64 ids and prompts unique, 4 choices each, correctIndex in range.
- Correct positions: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5. No banned word in any option; no correct option strictly longest.
- Lesson words after the second-model review (validate.py, 2026-11-26, final draft): 1656 / 1374 / 1522 / 1433 words; including captions 1693 / 1397 / 1557 / 1447, all under 1,700. The first module is above the 1,200-1,500 target but under the 1,700 hard maximum.
- Six original inline SVG figures (M1 2, M2 1, M3 2, M4 1), each under 3 KB, no style attributes, rendered with Playwright at 390 px and viewed. PNGs in `ceuwork-chlor/diagrams/`.
- Activities: 60 minutes per module, 240 total; the last activity of module 4 is `final_assessment` with the words final assessment.
- Numeric answers: 26 calculations recomputed in `verify.py` with separate formulas; all match (5.625 rounds half-up to 5.63; Python banker rounding would print 5.62). No correct answer equals a number in its own prompt.

## Sources
EPA chloramines page, EPA basic information page and EPA public water systems page (all return 200; PDF Q&A sheets read for Q3, 5, 6, 9, 10, 12), Spellman Handbook 2009 (`sp6.txt`), Spellman waterworks operator handbooks (`sp2.txt`, `sp3.txt`), Water Quality Control Handbook (`wqc.txt`). California range of knowledge (`ca-treat.txt`) was used only as a scope check: chloramine chemistry is listed for T2 to T4, so the course sits above the entry grade and is pitched at operators who already know chlorination. Book sources have no URL key (matching how `wef-mop11` is written in the model); this is the open schema problem.

## Constants used in questions (all restated inside each prompt)
Cl2 71, N 14, NH3 17, H 1, S 32, O 16; 8.34 lb per gal; 1 MGD = 1,000,000 gal/day; 1,440 min per day; 3,785 mL per gal. Fictional ratios 4.5 to 4.9 Cl2 to NH3-N. Fictional aqua ammonia 20 and 19 percent by weight at 7.6 and 7.5 lb per gal; fictional ammonium sulfate 35 percent at 10.0 lb per gal.

## Scope limits applied
- No regulatory limits, rule numbers or recommended residual goals as numbers. No operating ratio range, free ammonia target, pH or temperature range for nitrifiers, tank turnover rate, storage pressure or detection threshold. The only ratio numbers are stoichiometric (5.07 as N, 4.18 as NH3, derived from the stated atomic weights) and the breakpoint figure of about 7.6 from the Water Quality Control Handbook.
- Safety is recognition and purpose only; the SDS, emergency plan and facility procedures govern.
- All scenarios fictional (Marrow Creek Water, Pinewick Water Plant, Hollin Bay Water, Ashgrove Water).
- Cross-reference to Chlorination Principles (free, combined and total chlorine, breakpoint, first chloramine intro); wording and questions not repeated.

## Royce U gap check
Course `cdwp`, 369 slides read in full. 50 topics. First pass YES 18, PART 27, NO 5; after the owner-requested textbook gap fill see gap-report-chloramines.md (no NO left; PART items are those with no textbook support, kept at concept level). Table and what was added or declined are in `gap-report-chloramines.md`. Nothing copied.

## Unsure or open
- Many operating claims (nitrification signs, DPD interference, dialysis and fish notices, ammonia lighter than air, booster practice, feed sequences) are NOT COVERED by our textbooks and rest on general operator knowledge, flagged in SOURCECHECK. A second-model review should look at those.
- WQC gives pH boundaries for chloramine types that differ from drinking-water practice; the course states direction only.
- The M4 lesson at 1,260 words is the shortest; M1 at 1415 is the longest, all inside 1,200 to 1,700.

## 5.625 display (owner instruction, 2026-11-26)
54 divided by 9.6 is 5.625 exactly. The draft already displayed 5.63 in the question choice, its explanation and the lesson, and no "5.62" string remains in the course JSON. This pass makes the rounding explicit: the lesson says "5.625, which rounds half up to 5.63", the explanation of the final item says the same, and that item's prompt now says "(round to two decimal places, half up)".

## Second-model review
GPT Sol 6.2 (`gpt-6.2-sol`) reviewed the course in three rounds. Gemini neon did not review it: no Gemini credential is available here. Full record, planted-error catch rate and the findings table are in `ceu-chloramines-REVIEW-RESULT.md`. Working files: `review/chlor/` (scripts, textbook excerpts, round outputs r1 to r3). Backup of the draft before review: `ceu-chloramines.pre-review.json`.
