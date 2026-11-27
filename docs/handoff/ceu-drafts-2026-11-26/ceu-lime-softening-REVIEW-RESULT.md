# Review result: ceu-lime-softening

Scratchpad draft, not published. Backup of the pre-review draft: `ceudrafts/ceu-lime-softening.pre-review.json`.

## Reviewer
- **Reviewer:** GPT Sol 6.2, model id `gpt-6.2-sol` (exact id listed by `GET https://api.openai.com/v1/models` on 2026-11-26; the `gpt-6.2-sol-healthcare` variant was not used).
- **Gemini neon did NOT review this course.** This environment has no Gemini credential. The Gemini call was removed from the review script, and no Gemini output exists for this course. The owner must add a Gemini credential before Gemini review can run.
- **Script:** `review/lime/review_course_sol.py` (adapted from `docs/handoff/tools/review_course.py` on origin/main; Bearer placeholder as the proxy requires).
- **Excerpts given to the reviewer:** curated line ranges from `ceusrc/sp6.txt` (Spellman, 5.6.12, 11.6.4, 18.11.2.1.5), `ceusrc/wtp.txt` (Water Treatment Plant Operation, lime-soda chapter, recarbonation and arithmetic examples) and `ceusrc/wqc.txt` (Water Quality Control Handbook, soda ash). Excerpts were capped at 14,000 characters per book per unit, so many claims were flagged "NOT IN EXCERPTS". Those flags were checked against the full text with grep (see below).

## Rounds
Three rounds (maximum in the brief). Each round planted errors in a review copy only (never in the draft), then reviewed six units: four modules, the final set and the alternate set. Outputs: `review/lime/r1--*.txt`, `r2--*.txt`, `r3--*.txt`; planted items: `review/lime/plants-r1.json` to `plants-r3.json`.

Round 3 still raised real but minor wording problems, all fixed. No round produced a real wrong answer key.

## Planted-error catch rate
| Round | Planted | Caught | Kinds |
|---|---|---|---|
| 1 | 13 | 13 | 6 wrong keys, 3 explanation numbers, 4 lesson numbers |
| 2 | 14 | 14 | 6 wrong keys, 4 explanation numbers, 4 lesson numbers |
| 3 | 13 | 13 | 6 wrong keys, 3 explanation numbers, 4 lesson numbers |
| Total | 40 | 40 (100%) | |

Method: for each planted item I checked the reviewer's findings for that unit and item (or the altered number) and confirmed it identified the change. The check was manual, not automated. Planted values were removed from the draft and are not findings.

## Findings and triage (real problems)
| # | Finding (round) | Verdict | Action |
|---|---|---|---|
| 1 | Feeder answer 84 vs 84.44 lb/hr, no rounding stated (flag) | Real | Prompt now says "rounded to one decimal place"; correct choice is 84.4 lb/hr; explanation shows 2,026.6 / 24. Distractors 2,027, 243, 3.5, with reasons. |
| 2 | Equivalent weights 50.0 / 12.2 give 4.10, not 4.12 (R2) | Real | Lesson uses Spellman's printed weights 50.045, 20.04, 12.15 (sp6 5.6.12). |
| 3 | Marrow Creek 140.8 / 0.90 = 156.5 and 3,262 lb/day rounding (R1) | Real | Unrounded 140.82 carried; 156.47 in the feed step. |
| 4 | Lantern Ford: displayed terms sum to 85.7; "carbonate hardness term" for a bicarbonate alkalinity value (R1) | Real | Unrounded sum 85.62; label changed to bicarbonate alkalinity term. |
| 5 | Recarbonation example: displayed terms do not sum (16.6 + 7.2 vs 23.9); Cedar Flats 17.3 (R1) | Real | Unrounded terms shown. The equation is cited to the water treatment text (verified in full at wtp, recarbonation CO2 feed). |
| 6 | Ferry Hollow read as "deep jump" and blanket depth from settled solids (R1) | Real | Wording now says a nine-point rise in settled fraction; blanket checked separately. Settled-solids test described generically (100 mL / 10 min removed). |
| 7 | Draft said handbook does not discuss acid for pH (R1) | Real | Corrected: wtp says pH may be lowered by acid. |
| 8 | Filters: "regulators allow acidified samples" (R1, R2) | Real wording | Reworded to Spellman's statement that EPA allows lime-softening systems to acidify turbidity samples under a state-approved protocol (sp6). Current rule not checked. |
| 9 | Distractor explanations naming wrong mistakes: ops c2 (0.17), ops a3 (0.15), ops f1 (243), chem a3 (300), process a2 (5.3), process c4 (6.3), ops a2 (34) (R1, R2) | Real | Each explanation now names the actual slip (omitting both 50,000 and sample volume, etc.). |
| 10 | Chem f1 distractor "7,205" does not match any slip (R1) | Real | Replaced with 72,058 (multiplied by 24) with explanation. |
| 11 | Chem f3 distractor 165 unexplained (R1) | Real | Replaced with 164 (dose plus 74.1) and explained. |
| 12 | Hardness c2 explanation "100 + 49.4 = 149" hides rounding (R3) | Real | Shows 149.44, rounds to 149. |
| 13 | Process c5 correct option "stops depositing" too absolute; explanation says recarbonation adds no hardness (R1) | Real | Option reworded to "less calcium carbonate deposits"; explanation notes overdose can redissolve carbonate. Option kept shorter than the longest. |
| 14 | Process f1 and a3 explanations used rounded terms (R1) | Real | Unrounded terms. |
| 15 | Ops f1 explanation: "leaving out 8.34 gives 243" (R2) | Real | Corrected: leaving out 8.34 and the division by 24. |
| 16 | "Using 8.34 lb per gal" presented as a unit; 8.34 is lb per million gallons per mg/L of dose (R2, R3) | Real | Prompts and lesson state the 8.34 factor and its dose basis. |
| 17 | Sludge estimate 6,255 lb/day labelled as carbonate hardness; 150 mg/L is bicarbonate alkalinity (R2, R3) | Real | Labelled calcium bicarbonate hardness, from alkalinity; stated as calcium-only, not total dry solids. |
| 18 | Purity correction needs same chemical basis (CaO vs Ca(OH)2) (R3) | Real | Lesson states the same-basis rule. |
| 19 | "Total alkalinity" shorthand where a bicarbonate term is meant (R3) | Real | Term written as bicarbonate alkalinity. |
| 20 | Ops lesson: "alkalinity is titrated to two end points" implied every sample titrated twice (R2) | Real | Reworded; zero phenolphthalein alkalinity case stated. |
| 21 | Ops lesson: worked 7.6 mL example lacked sample volume and normality (R2) | Real | Stated as a 100 mL sample of 0.02 N acid, 76 mg/L. |
| 22 | Ops lesson: lime-slurry and jar-test timings (about 1 min, 20 min) not in textbook excerpts (R1) | Real | Removed; "use your plant procedure". |
| 23 | Unsupported attributions: Spellman Vol. 2 aeration; sanitary sewer disposal; "hopper agitation"; NIOSH pocket-guide quotes; side benefits list (R1) | Real | Removed or reattributed. Side-benefit list removed (not found in the texts). Sewer-disposal and hopper-agitation claims removed. |
| 24 | Hardness-soap, classes, corrosion, "hardness is not a health hazard" (R1, R2, R3 finals) | False positive for most | Verified in full text: sp6 (hardness not a health hazard; classes 0-75 / 75-150 / 150-300 / over 300; low hardness contributes to corrosive tendency). Kept. |
| 25 | 50-75 mg/L blend target and "calcium carbonate stability most effective" (R1, R2, R3) | False positive | Verified: sp6 ion exchange section (blend to 50-75 mg/L; "most effective" in the corrosion section). Page numbers removed; labelled as an ion-exchange example. |
| 26 | "Two hours" to measure pH; CO2 moves pH toward 7 (R1, R2, R3) | False positive | Verified: sp6 lab pH within 2 hours; CO2 moves pH toward 7. Kept. |
| 27 | Alum 1 mg/L reacts with 0.45 mg/L alkalinity (R1, R2, R3) | False positive | Verified: sp6 factor stated in its alkalinity example. Kept; attribution to Spellman. |
| 28 | Groundwater harder than surface water (R2, R3) | False positive | Verified: sp6 ("groundwaters are harder"). |
| 29 | Grains per gallon 0.01712 g/L (R3) | False positive | Verified: wqc grains-per-gallon table. |
| 30 | Langelier index interpretation (R1, R2, R3, finals) | Real wording | Reworded through three rounds: negative = undersaturated, may dissolve CaCO3; not a pipe-corrosion test by itself. |
| 31 | Magnesium precipitation above about 10.5; 9.4 / 10.6 operating pH (R2) | Partly real | Both values now in the texts: sp6 gives 9.4 and 10.6 (operating) and precipitation above 10.5. |
| 32 | Soda ash 106/100 and total alkalinity formula attributed to Spellman (R1) | Real attribution | Reattributed to wtp (Examples 15 and 14, verified). |
| 33 | Lime forms and slurry settling (R2, R3) | False positive | Verified: wqc (solids sold in bags, bulk, powder or granular; slurry settles in low-velocity sections). |
| 34 | Dry feeders volumetric vs gravimetric (R2, R3) | False positive | Verified: sp6 dry feeder passage. |
| 35 | Lime sludge quantity and recalcination (R1, R3) | False positive for the core claim | Verified: sp6 (large quantity of sludge from lime-soda; recalcination reduces disposal problems). |
| 36 | Solids-contact one-tank description (R3) | Real wording | Softened to "usually"; figure and text describe one design. |
| 37 | Recarbonation example "residual magnesium" basis (R3) | Real wording | Stated as "as Mg". Underlying equation kept; reviewer found it not in excerpts but verified in full wtp text. |
| 38 | Hydrated lime vs quicklime 1.32 ratio (R1) | Real wording | Stated as pure-chemical basis. |
| 39 | Purity sentence on quicklime strength table (R1) | Real wording | Removed table attribution; use delivery ticket purity. |
| 40 | NIOSH molecular weights 56.1 and 74.1 (R3) | Not verified in texts | Kept with the NIOSH web source already listed (niosh-ca-hydroxide, niosh-ca-oxide). Those pages were not re-fetched in this round. |

Planted-error findings were not counted as real problems, and no real wrong answer key was found in the draft.

## Not checked or unresolved
- **Gemini neon review:** not done (no credential).
- **Excerpt-only flags:** the reviewer flagged many claims as not in its excerpts. I checked the full text for the claims above. Claims I did not check in full text: EDTA hardness method, pH meter calibration, the NIOSH hazard wording (now generic), the Cedar Flats scenario procedures (presented as general practice), and the slaker/feeder purpose statements.
- **Regulatory:** the acidified turbidity sample statement is from the 2009 Spellman text; the current EPA/state rule was not checked. Verify before publication.
- **Figures:** captions in modules 2 and 3 changed. The SVG figures were not re-rendered at 390 px in this session; the drafting agent's earlier render is the last check.
- **Gap report:** `ceudrafts/gap-report-lime-softening.md` was not revised after these edits; some rows (alum factor, LSI, recarbonation equation) now cite the texts differently.
- **SOURCECHECK:** not regenerated. The new wtp source entry (`wtp-gibson-reynolds`, no URL, per the brief) and the reattributions above are recorded here, not in the SOURCECHECK table.
- **Lesson length:** chemistry-and-dose is 1,608 words and operation-troubleshooting 1,683 words (including SVG labels and captions). Both are within the 1,700 hard max but above the 1,200-1,500 target.
- **Book source URLs:** book sources still have no URL, the schema issue noted in NOTES.

## Revalidation (script: `review/lime/validate_lime.py`, run after the last edit)
- Counts: 24 checks, 20 finals, 20 alternates; 64 unique ids and 64 unique prompts.
- Four choices each; correctIndex in range.
- Positions: checks 6/6/6/6; finals 5/5/5/5; alternates 5/5/5/5.
- Banned option words (always, never, only, all, every, none, cannot, completely, entirely, solely, must): none found. Correct option never strictly longest.
- sourceIds: all exist, including the new `wtp-gibson-reynolds`.
- Activity minutes: 60 per module, total 240. Last activity of last module contains "final assessment".
- Lesson words including captions and SVG labels: 1,391 / 1,608 / 1,355 / 1,683 (max 1,683, within 1,700).
- Figures: 6 inline SVG figures, each under 3 KB, no style attributes.
- Evidence contains "fictional" and is over 120 characters; assignment over 100; rubric at least 3; facilitatorGuide over 200; objectives at least 2 (validator checks all four).

## Numeric recomputation
`review/lime/recompute_lime.py` (python3 -I) recomputes 64 numeric answers and worked-example figures. All 64 pass.
