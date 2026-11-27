# Second-model review: ceu-effluent-filtration

## Reviewer and model

- Reviewer: GPT, one model only. Model id `gpt-6.2-sol`, the exact id listed by `GET https://api.openai.com/v1/models` (the listing also shows `gpt-6.2-sol-healthcare`, which was not used).
- Calls: `POST https://api.openai.com/v1/chat/completions` with the proxy-injected key (`Authorization: Bearer placeholder`).
- **Gemini did NOT review this course.** The original tool's Gemini call was removed; no Gemini credential is available in this environment. The request named "Gemini neon"; no model of that name is in the tool, so I read it as the Gemini model the original tool used (`gemini-4-hydrogen`), which was not called.
- Script: `review/review_course_sol_effluent.py` (scratchpad). Outputs: `review/effluent/r1-seed7/`, `r2-seed11/`, `r3-seed23/`.
- Each module unit received only the textbook excerpts for that module; finals received all five excerpts (WEF MOP 11 Ch. 24 filtration; WI Solids Separation 2.3 and 3.6; WI Advanced 16 tertiary wording; Spellman 4.4 and 5.6.8; WQC 8.7).

## Rounds

| Round | Seed | Planted errors | Caught | Real problems fixed | Notes |
|---|---|---|---|---|---|
| 1 | 7 | 11 | 11 | 58 edits (lesson and quiz) | Excerpt gaps caused some "NOT IN SOURCE" items; fixed in round 2 excerpts |
| 2 | 11 | 13 | 13 | 42 edits | Added WI Advanced 16 and Spellman 4.4 to the relevant units |
| 3 | 23 | 12 | 12 | 22 edits plus 4 option-length fixes | Stopped at the three-round limit; remaining items are wording NITs |

Planted-error catch rate: 36 of 36 (100%). Planted errors were placed only in review copies; the course file was never corrupted. The reviewer scored its own catches; I checked the evidence quote for every planted item.

## Findings triage

Verdicts: **FIXED** (real problem, edited), **WORDING** (accurate but overstated or ambiguous, tightened), **FP** (false positive, no edit), **PLANTED** (artifact of the review copy, no edit), **DECLINED** (reviewer suggestion not adopted, reason given).

| # | Where | Reviewer finding (summary) | Verdict | Action or reason |
|---|---|---|---|---|
| 1 | All units | "19.68 lb per gallon" / "mg/L x MGD x 19.68" | PLANTED | Real course already uses 8.34 (MOP 11 p. 24-6); recomputed 300.24 lb/day |
| 2 | Quiz keys (11, 13, 12 items) | Wrong `correctIndex`, altered explanation numbers, altered lesson numbers | PLANTED | Each real key rechecked by recomputation; all correct in the real file |
| 3 | why-filter | "95 to 99 percent" called not in source | FP | Spellman 4.4.1 says "processes typically remove 95 to 99%"; round 1 excerpt omitted it |
| 4 | why-filter | Tertiary purpose and media list called unsupported | FP | WI Advanced 16 and Solids Study Guide Sec. 1 support it; excerpt gap |
| 5 | why-filter | TSS "on a filter paper" | FIXED | Glass-fiber filter, dried and weighed |
| 6 | why-filter | "Your permit says which one you report" ambiguous | FIXED | Parameters and limits wording |
| 7 | why-filter | Thin single-sand bed "quickly blinds" overgeneralized | FIXED | MOP 11 says drinking-water-type shallow beds |
| 8 | why-filter | "A filter removes particles, not dissolved material" too broad (membranes, biofilters) | FIXED | "Conventional granular filter"; c1 explanation narrowed |
| 9 | why-filter Fig. 2 and granular-media | Depth storage stated for all granular beds | FIXED | Shallow beds collect near top; deep multimedia stores through depth |
| 10 | why-filter | "Either kind can be gravity or pressure" | FIXED | Reworded to granular filters in general |
| 11 | why-filter | Reuse/tight-limit attribution to MOP 11 | FIXED | Attributed to the reuse context only |
| 12 | why-filter | "Two sample points" — concentration vs mass, upstream causes | FIXED | Concentration reduction vs mass removal; upstream coagulation named |
| 13 | why-filter c5 and f5, a5 | Cloth panel replacement, "submerged" disc, surface-mat wording | FIXED | "Fully submerged"; panels replaced as needed; a5 specifies conventional filter |
| 14 | why-filter c2, c3, c6, f3, c1 | Explanation wording (culture, 400%, MF pores, 11.8 distractor) | FIXED or WORDING | Explanations tightened; c6 option left unchanged (reviewer NIT, no factual error) |
| 15 | why-filter / Spellman tertiary-advanced and cost statements | "NOT IN SOURCE" | FP | Supported by Spellman 4.1 (SOURCECHECK); outside the excerpt set |
| 16 | granular-media | Coarse-top layering stated for all conventional beds | FIXED | Dual- or multimedia bed |
| 17 | granular-media | "Sorts by density" only | FIXED | Size and density |
| 18 | granular-media | Constant-rate variable-head description | FIXED | Level rises as head loss builds, to terminal head loss |
| 19 | granular-media | "Design and permit set acceptable rates" | WORDING | "Design and any permit conditions" |
| 20 | granular-media | Run-record trend stated as "after each wash" (readings 1.2, 1.2, 1.3, 1.5, 1.8) | FIXED | "Climb over the week" |
| 21 | granular-media | Head-loss definition and tap-elevation correction | FIXED | Piezometer level or elevation-corrected differential pressure |
| 22 | granular-media | Run "ends when turbidity begins to rise" | FIXED | "Reaches its action limit" |
| 23 | granular-media Fig. 4 and head-loss text | "Well-timed backwash ... before terminal head loss" conflicts with MOP | FIXED | Caption now refers to the plant's turbidity action limit as backstop |
| 24 | granular-media | Filter-aid coating: "three or four runs" for every dose change | FIXED | New bed = runs; dose reduction = backwashes (MOP 11 p. 24-43) |
| 25 | granular-media and a5 | Surges "push particles through the bed" | FIXED | MOP says "penetrate" / "deeper into the bed" |
| 26 | granular-media c1, c3, c4, c5, f2, f5 | Stems and explanations (physical cause, equal flow split, flow-qualified head loss, distractor math) | FIXED or WORDING | c5 key error was planted; c2 "25 divides by length" is correct as written (FP) |
| 27 | backwash-cleaning | Grains "rub" as the cleaning mechanism (lesson, Fig. 5, c3 option C) | FIXED | Washwater loosens and carries solids; key unchanged |
| 28 | backwash-cleaning | Pumping required for backwash | FIXED | "By a pump or from an elevated tank" |
| 29 | backwash-cleaning | Simultaneous air and water: coal-bed restriction | FIXED | MOP 11 p. 24-34; "should not ... unless designed for it" |
| 30 | backwash-cleaning | Air scour and surface wash timing conflated | FIXED | Spellman "several minutes" for excessive scour; MOP 60 s for mechanical surface wash |
| 31 | backwash-cleaning | "Less than 5 percent" as a rule; "most plants use" triggers | FIXED | Screening benchmark; "many plants" |
| 32 | backwash-cleaning | "Washed automatically"; slug "solids come back around" | FIXED | "Backwashed"; "can come back around" |
| 33 | backwash-cleaning | Boiling pattern as diagnostic; "clean differently and more often" for cloth discs | FIXED | Softened; cloth-disc frequency NOT IN SOURCE |
| 34 | backwash-cleaning | Media-loss causes merge washout and underdrain loss | FIXED | Washout during backwash; Table 24.3 causes |
| 35 | backwash-cleaning | Initial head loss compared without flow condition | FIXED | "At the same filtration rate" |
| 36 | backwash-cleaning | Figure 5 caption "held and returned" as universal | FIXED | "Often held" |
| 37 | backwash-cleaning quiz | c1 "rising turbidity"; f1 product-water basis; f2 0.62 explanation; f3 gap; f5 and a5 explanations | FIXED | Stem and explanations corrected; f1 numbers rechecked (3.2%) |
| 38 | operation-troubleshooting | "Usual remedy" chlorine; "kills bacterial growth" | FIXED | Where plant procedures authorize; "helps control" |
| 39 | operation-troubleshooting | "Table 24.3 and WI give the same list" | FIXED | "Overlapping causes" |
| 40 | operation-troubleshooting | Virus breakthrough at "0.5 NTU or fewer" as threshold | FIXED | "Can break through"; "a rise that can be 0.5 NTU or less" |
| 41 | operation-troubleshooting | "Fixing the clarifier cures more problems than any adjustment" | FIXED | Unsupported ranking removed |
| 42 | operation-troubleshooting | Records scenario: Step 2 chronology contradicted the data (run shortened on day 2, before TSS rise on day 3) | FIXED | "Rose from day 3 while runs kept shortening"; steady flow stated |
| 43 | operation-troubleshooting | "Changing the filters first would have hidden the cause" | FIXED | "Could have treated the symptom" |
| 44 | operation-troubleshooting | Turbidity response: exceedance must come first | FIXED | Take filter out of service and backwash (MOP 11 p. 24-44) |
| 45 | operation-troubleshooting | Jar test attribution to Wisconsin and MOP; "jar tests show" overstated | FIXED | Spellman symptom 7; "help show" |
| 46 | operation-troubleshooting | "Above about 5 percent" rule; mudballs/media washout "mean" | FIXED | Benchmark; "can mean" |
| 47 | operation-troubleshooting | Top-filled filter "given a slow backwash" | FIXED | "Drained completely before a slow bottom refill" (MOP 11 p. 24-43, checked) |
| 48 | operation-troubleshooting | Dry-media soak missing | FIXED | 8-hour soak added (MOP 11 p. 24-43, checked) |
| 49 | operation-troubleshooting quiz | c3, c4, c5, f1 wording; f2 "4.0" distractor and "22 subtracts" explanation; f4, f5, a2, a3, a5 | FIXED | f2 distractor 4.0 changed to 3.8; f2 prompt states flow held constant |
| 50 | operation-troubleshooting | Trend scenario "days 1 to 17" | PLANTED | Real text already "days 1 to 7" |
| 51 | final, alt | "Use 8.34 lb per gal" as a unit error | WORDING | Factor restated in prompts; 8.34 value unchanged (reviewer's own check gave the same results) |
| 52 | final, alt | Distractor explanations with wrong arithmetic (why-f3 11.8; ops-f2) | FIXED | Explanations rewritten; keys unchanged |
| 53 | alt a2 and a3 | "Which TSS range applies" and "other sets" overstatements | FIXED | Estimate wording; a2 explanation revised twice |
| 54 | final and alt keys (granular f4, a3; ops a1; why f1) | Wrong keys, altered numbers | PLANTED | Real keys correct (checked by recomputation) |
| 55 | ops-f2 | Classroom inverse relationship called not in source | DECLINED | Kept and labelled "classroom assumption", as the lesson already did; the stem now states flow held constant |
| 56 | why-filter c6 option A | MF "separates ... through pores" could read as solids passing | DECLINED | Factually correct (suspended and colloidal solids are removed); not changed to avoid length churn |

## Validation (final file)

Output saved at `review/effluent/validation-final.txt` (scratchpad). Results: 4 modules; 24 checks (6 each); 20 finals and 20 alternates (5 per module); 4 choices each; ids and prompts unique; correctIndex in range; check positions 6/6/6/6, final 5/5/5/5, alt 5/5/5/5; no banned word (always, never, only, all, every, none, cannot, completely, entirely, solely, must) in any option; no correct option strictly longest (four violations introduced by edits were fixed); all sourceIds exist; activity minutes sum to 240; last activity of the last module is `final_assessment` ("final assessment"); evidence contains "fictional" and is over 120 characters; assignments, rubrics, facilitator guides and objectives within limits. Lesson words 1,335 / 1,350 / 1,351 / 1,361 (figures removed); headings 7 / 6 / 7 / 8; SVG figures 2 / 2 / 1 / 1 (six in total).

## Unresolved

- Round 3 still produced wording NITs (a few accepted, a few declined above). The three-round limit was reached; no further round was run.
- The reviewer's self-scored catch rate is one model's judgment; I checked the evidence quotes but did not re-run scoring with a second model (none available).
- Not independently re-read in this review: the MOP 11 filter-aid "four benefits" list (checked: four bullets in the MOP 11 Ch. 24 filtration text); the Spellman 4.1 tertiary/advanced statement (carried from SOURCECHECK, not re-checked in this round).
- Book sources still have no URL, as recorded in the NOTES file.
- The JSON version, key and stream are unchanged; the NOTES and SOURCECHECK files still describe the pre-review draft and were not updated.
