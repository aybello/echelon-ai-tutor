# Review result: ceu-chloramines

## Reviewer
- Reviewer: GPT Sol 6.2, model id `gpt-6.2-sol`. The id was taken from the live `GET https://api.openai.com/v1/models` listing on 2026-11-26 (the listing also has `gpt-6.2-sol-healthcare`, which was not used).
- **Gemini neon did NOT review this course.** No Gemini credential is available in this environment, so the Gemini half of the two-reviewer rule was not run. Only Sol 6.2 reviewed it. The owner must add a Gemini credential to the environment before a second reviewer can run.
- Tool: `review/chlor/review_course_sol.py` in the scratchpad, adapted from `docs/handoff/tools/review_course.py` on origin/main. The Gemini call is removed and the endpoint is `https://api.openai.com/v1/chat/completions` with `Authorization: Bearer placeholder`. The planted-error design is kept.
- Context given to the reviewer: each of the six review units (four modules, the final and the alternate final) with the course's lesson (figures stripped) and its items, plus keyword textbook excerpts for that unit from Spellman sp6, Spellman sp2 and sp3, the Water Quality Control Handbook (wqc) and Water Treatment Plant Operation (wtp), built by `review/chlor/make_excerpts.py`. The reviewer was also asked to flag overlap with *Chlorination Principles*.

## Rounds
| Round | Draft reviewed | Seed | Output folder | Planted errors | Caught |
|---|---|---|---|---|---|
| 1 | Pre-review draft (`ceu-chloramines.pre-review.json`) | 7 | `review/chlor/r1/` | 14 | 13 |
| 2 | After round 1 fixes | 8 | `review/chlor/r2/` | 12 | 12 |
| 3 | After round 2 fixes (last permitted round) | 9 | `review/chlor/r3/` | 13 | 12 |

Total: 37 of 39 planted errors caught (95%). The planted errors are the review-copy changes made by the tool (wrong answer keys, altered explanation numbers, altered lesson numbers). Each was scored by reading the reviewer's report and checking for the planted item. This was done by hand, not by a script. The two misses are the same planted lesson-number change ("Module 3" changed to "Module 9" in the first module), which round 1 and round 3 did not flag. Round 2 did flag it.

Round 3 fixes were applied after the last review and were not re-reviewed, because the three-round limit was reached. They are checked by `validate.py` only.

## Changes made
- Draft changed in 51 items (32 prompts, 24 choice lists, 47 explanations). No correct-answer index changed, so the answer keys are the same as the pre-review draft. The planted wrong keys were never in the real draft.
- Four lesson texts revised (first, second, third and fourth module) and the figure label in the first module changed from "about 5" to "5.07".
- Rounding display fixed in the lesson and the ratio explanation; the 5.625 case is recorded in NOTES.

## Findings table (real-copy findings; planted ones are in the catch table)
Verdicts: FIXED (real error, changed), SOFTENED (overstated, changed to what the books support), KEPT (checked, supported or accepted with reason), FALSE POSITIVE (reviewer error or excerpt gap), OPEN (not resolved in this pass).

| # | Finding (round) | Verdict | Action or reason |
|---|---|---|---|
| 1 | 5.625 shown as 5.62? (owner) | KEPT | Already 5.63. No 5.62 string in the course. Rounding now stated explicitly (lesson, explanation, prompt "round half up") |
| 2 | 0.531 x 2.0 x 8.34 = 8.85 (displayed operands give 8.86) (r1) | FIXED | Shown as (2.6 ÷ 4.9) x 2.0 x 8.34 |
| 3 | 0.478 x 3.5 x 8.34 = 13.96 (displayed gives 13.95) (r1) | FIXED | Shown as (2.2 ÷ 4.6) x 3.5 x 8.34 |
| 4 | 12.0 ÷ 1.252 = 9.59 (displayed gives 9.58) (r1) | FIXED | Nitrogen per gallon shown as 1.2518 |
| 5 | Distractor 8.12 should be 8.13 (r1) | FIXED | Changed to 8.13 and explanation corrected |
| 6 | Booster: 0.111 x 0.36 x 8.34 displayed gives 0.333, key 0.334 (r1) | FIXED | Dose carried unrounded (0.1111) |
| 7 | Distractor 0.668 should be 0.667 (r2) | FIXED | Choice changed to 0.667 |
| 8 | "Chlorine in water is mainly HOCl" with no pH condition (r2) | FIXED | Reworded: HOCl is one form of free chlorine |
| 9 | Residual "on the rising side is combined" (r2) | FIXED | Limited to the pre-breakpoint rise after initial demand |
| 10 | 7.6 attributed to "standard operator text" (r1) | FIXED | Attributed to WQC (line 10548), 8 to 10 in practice |
| 11 | Dichloramine above 5.07 as a threshold (r1, r2, r3) | FIXED | 5.07 called the ideal stoichiometric ratio; species depend on pH and temperature |
| 12 | Lower pH favours dichloramine (r1, r3) | KEPT | WQC line 10520 gives pH bands; course uses direction only, and now cites the bands |
| 13 | "Water age" used for volume divided by throughput (r2) | FIXED | Renamed nominal tank residence time |
| 14 | Nitrite "displaces oxygen in the blood" (r1) | FIXED | Impairs oxygen carrying |
| 15 | Older water has more free ammonia; decay "releases ammonia" stated as fact (r1, r2) | SOFTENED | Stated as possible |
| 16 | Booster must add ammonia; chlorine-only is wrong (r1) | SOFTENED | "normally" |
| 17 | Total minus free estimates monochloramine (r1, r3) | FIXED | Estimates combined chlorine; new chloramine-specific item |
| 18 | DPD chloramine interference "false positive" direction (r1, r2) | FIXED | Biases the free chlorine result high; item key kept |
| 19 | Staff use the white cloud to find leaks (r1) | FIXED | Removed; use alarms and emergency plan |
| 20 | Hypochlorite "relatively safe"; vacuum shut-off as blanket claim (r1) | FIXED | Reworded |
| 21 | Drawdown compares pump output with level change (r2) | FIXED | Volume from the day tank, converted with calibration |
| 22 | Facility emergency plan described as the threshold rule (r2) | FIXED | Emergency plans sit within risk-management programmes |
| 23 | Feed records give ratio fed without a mass basis (r2, r3) | FIXED | Ratio needs mass rates on a common basis |
| 24 | Low drawdown proves low turnover and old tank (r3) | FIXED | "Possible contributor" |
| 25 | Quick guide: ammonia overfeed as the cause (r3) | FIXED | "Possible"; check feed records |
| 26 | Restart is "most likely" time for drift (r1) | SOFTENED | "can drift" |
| 27 | Overlap: breakpoint recall, pre/post breakpoint, post-breakpoint explanation (r1, r3) | FIXED | Checks and finals rewritten to chloramine-specific content |
| 28 | Overlap: generic lb/day conversion and dose-minus-demand items (r1, r2) | FIXED | Rebuilt as residual-to-ammonia-N items |
| 29 | Overlap: flow pacing and trim item (r1) | FIXED | Replaced with bench-check item |
| 30 | Overlap: generic booster chlorine feed (r1) | FIXED | Now ammonia-N feed at a stated ratio |
| 31 | Overlap: "why only chlorine at a booster" and breakpoint-dip items (r1, r2) | FIXED | Replaced |
| 32 | Overlap: storm and demand item (r2, r3) | KEPT | Tests the ammonia feed set on the dose, not the residual definition; flagged as partial overlap |
| 33 | Cryptosporidium item may repeat general chlorination (r3) | KEPT | Stem made chloramine-specific; the Chlorination Principles brief does not cover Cryptosporidium |
| 34 | Operation first step includes flushing before confirmation (r1) | FIXED | Key is verify and compare with baseline |
| 35 | Ammonia-first "lowest by-products" and "most kill" (r1, r2) | FIXED | Limited to least free chlorine contact |
| 36 | Temperature "no link" to chloramine type (r1) | FIXED | Distractor replaced |
| 37 | Ammonia lighter than air sets detector height as a rule (r1, r2, r3) | KEPT | True density fact; stem and explanation now say final siting follows approved design |
| 38 | Dialysis, fish, EPA notice, nitrification mechanisms, decay releasing ammonia (r1 to r3) | OPEN | Not in the supplied excerpts. Kept as general operator knowledge; marked NOT COVERED in SOURCECHECK. Needs references before publication |
| 39 | "EPA does not require any utility to use chloramine" (r1, r2) | KEPT, OPEN | Attributed to EPA; the EPA page was read earlier (NOTES). Reviewer found no excerpt |
| 40 | 8.34 described as a density, not a conversion factor (r2, r3) | FALSE POSITIVE | 8.34 is the standard approximation of 8.345 lb per gallon. Prompts now name it as the factor for mg/L x MGD |
| 41 | Figures "[diagram]" cannot be checked (all rounds) | FALSE POSITIVE | The review copy strips SVG. Figures were rendered at 390 px and viewed; the first-module figure was re-rendered after the label change |
| 42 | Water-age figure caption relies on "age alone" (r3) | FIXED | Caption reworded |
| 43 | Booster-trim and feed-plan claims underspecified (r1, r2) | FIXED | Stated as configured example and assumptions |
| 44 | Reviewer missed planted lesson "Module 3" to "Module 9" in round 1 and round 3 | FALSE NEGATIVE (review) | Recorded in catch table |

## Remaining open items
1. No Gemini review. Only Sol 6.2 reviewed the course.
2. Items 38 and 39: operating and regulatory statements that the supplied books do not settle. They need a drinking-water distribution reference, a dialysis or aquatic reference, and the applicable rule or EPA page before publication.
3. Round 3 fixes were not re-reviewed (round limit reached).
4. The first module is 1,656 words plus captions (1,693), inside the 1,700 maximum but above the 1,200 to 1,500 target.
5. Book sources have no URL. The `CeuSource` URL requirement is still open.
