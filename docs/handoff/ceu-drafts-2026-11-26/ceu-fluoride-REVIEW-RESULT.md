# Review result: Fluoride in Drinking Water for Operators (`ceu-fluoride`)

Draft only. Not committed, not registered, not published. Version `2026-11-26.1`. Backup of the pre-review draft: `ceudrafts/ceu-fluoride.pre-review.json`.

## Reviewers

- **Reviewed by: GPT Sol 6.2, model id `gpt-6.2-sol`.** The exact id is from `GET https://api.openai.com/v1/models`. The `gpt-6.2-sol-healthcare` variant is also listed and was not used.
- **Gemini neon did NOT review this course.** No Gemini credential is available in this environment, so that step was skipped. The owner must add a credential before a Gemini review can be recorded.
- Tool: `review/fluoride/review_course_sol.py`, adapted from `docs/handoff/tools/review_course.py` on origin/main. The Gemini call is removed. Calls go to `https://api.openai.com/v1/chat/completions` with `Authorization: Bearer placeholder`.
- Textbook excerpts per module are in `review/fluoride/excerpts/`: Spellman HB 2009 (sp6), Spellman Waterworks Vol 1 (sp3), WTP Operation Vol 2 Ch. 13 (wtp), and the Water Quality Control Handbook (wqc, EPA fluoride method). The excerpts are partial. Claims outside them were checked against the full texts in ceusrc/ (see the SOURCECHECK addendum).

## Rounds and planted-error design

Planted errors are made in a review copy only. The draft is never changed by planting. `plants.json` in each round folder lists them.

| Round | Seed | Outputs | Planted | Caught |
|---|---|---|---|---|
| 1 | 7 | `review/fluoride/round1/` | 11 (6 wrong keys, 2 explanation numbers, 3 lesson numbers) | 11 |
| 2 | 11 | `review/fluoride/round2/` | 11 (6 wrong keys, 1 explanation number, 4 lesson numbers) | 11 |
| 3 | 23 | `review/fluoride/round3/` | 11 (6 wrong keys, 1 explanation number, 4 lesson numbers) | 10 |

- **Planted-error catch rate: 32 of 33 (97%).** The one miss was in round 3: "Module 3 uses both" in the chemicals-feeders lesson, changed to "Module 9". The reviewer did not flag the cross-reference.
- Three rounds were run, the limit in the brief. Round 3 fixes were applied and validated, but were not sent to a fourth review.

## Triage approach

- Every reviewer table row was triaged. Rows are of four kinds: planted errors (not draft errors, the draft was already right), real findings (fixed), wording points (reworded in the same fix), and NOT-IN-EXCERPT points (checked against the full text; kept with a citation, reworded, or removed).
- Reviewer claims that the excerpts did not contain were the most common finding. Many of them are supported by the full texts. Those are recorded as supported, not as errors.
- Fixes are in `review/fluoride/apply_r1_fixes.py`, `apply_r2_fixes.py` and `apply_r3_fixes.py`, which are exact-match edits that fail loudly if the text is not found.

## Findings table (real findings and main overreaches)

| # | Where | Finding | Verdict | Action |
|---|---|---|---|---|
| 1 | what-and-why, Table 5.7 offsets | Historical community range was 0.1 below and 0.5 above, not symmetric | CONFIRMED (sp6 Table 5.7) | Lesson gives the historical range, labelled a historical example. No current number stated. |
| 2 | what-and-why, "most waters contain fluoride" | Spellman says fluoride is seldom found in surface water | REAL overstatement | Changed to "Some source waters already contain fluoride". |
| 3 | what-and-why, "fluoride is an element" | Fluorine is the element; fluoride is the ion | REAL chemistry error | Reworded to fluoride as the ion of fluorine. |
| 4 | what-and-why, decision and authority | WTP 13.1: governing body usually decides by vote; water department chooses chemicals | Partly supported | Rewritten to the WTP wording; the "health authority" claim removed. |
| 5 | what-and-why, history | Colorado 1931 and 1945 dates, city names; federal interim table | NOT in books | Section replaced by a sourced paragraph. |
| 6 | what-and-why, health effects | Acute and chronic definitions; "acute poisoning is rare"; bone effects | NOT in books | Definitions shortened to general terms; frequency and bone claims removed. Recorded as NOT COVERED. |
| 7 | what-and-why, dose vs feed chemical | Dose depends on target and background, not on chemical chosen | REAL conceptual error | Reworded: chemical chosen decides how much product the dose takes. |
| 8 | what-and-why, scenario | "Same feed rate on Well 2" ignores flow | REAL | Reworded to specify the same flow. |
| 9 | chemicals, NaF manufacture | Sodium carbonate neutralisation omitted | CONFIRMED (sp6 10257) | Added. |
| 10 | chemicals, NaF "tinted blue", CDC dry-feed advice | Not in supplied texts | NOT in books | Removed. Replaced by WTP 13.31 crystal-grade statement (CONFIRMED). |
| 11 | chemicals, silicofluoride "60 gal per lb", detention | Not found | NOT in books | Removed. |
| 12 | chemicals, floc loss "about a tenth" | Not found in ch. 13 or sp6 fluoride text | NOT in books | Removed from lesson and from final question f2. f2 now asks where the analyzer sits (WTP 13.7). |
| 13 | chemicals, anti-siphon wording | Potable backflow and chemical siphoning described in one sentence | REAL conflation | Split: air gap protects potable make-up line; anti-siphon valve stops siphoning through idle pump. |
| 14 | chemicals, saturator "only saturated while undissolved chemical remains" | Conflates making and keeping saturated solution | REAL | Reworded. |
| 15 | chemicals, "upflow widely used", "stir the bed" | Not found | NOT in books | Removed. |
| 16 | chemicals, hardness numbers | Reviewer read WTP 13.31 hardness guidance | Supported text exists | Course refers to Ch. 13 guidance; no numbers restated as rules. |
| 17 | chemicals, fluorosilicic acid "fumes rise" | Not found | NOT in books | Removed. |
| 18 | chemicals, day tank "caps what could be fed" | Not found; WTP glossary says a day tank usually holds enough for at least one day | REAL overstatement | Reworded to the glossary wording. |
| 19 | feed-rate, pounds per day formula scope | Eq. 5.107 does not apply to NaF in a saturator | REAL scope gap | Scope stated at the formula. |
| 20 | feed-rate, 10.5 / 0.595 = 17.7 | Displayed rounding gives 17.6 | PARTLY valid | Unrounded value 10.508 shown; 17.7 kept and explained. |
| 21 | feed-rate, "3,785" typed as 9,785 / 1,573 / 3,1573 | Planted lesson-number errors | PLANTED (not in draft) | No draft change needed. The draft text was checked and reads 3,785. |
| 22 | feed-rate, saturator 1.88 percent example (water vs solution basis) | Spellman Eq. 5.115 basis differs | REAL ambiguity | Example removed. |
| 23 | feed-rate, "CDC recommends against unsaturated solutions" | Attribution not in supplied texts | NOT in books | Removed. |
| 24 | feed-rate, 19 lb NaF and 46 lb acid per 1 ppm per MG | Reviewer said NOT-IN-EXCERPT | SUPPORTED (sp6 10259; sp6 ~10306) | Kept, now attributed to Spellman's formula. |
| 25 | feed-rate, acid 9.94 lb/gal vs 10 lb/gal in Ex. 5.178 | Density choice | SUPPORTED (sp6 Table 5.6: 9.938 for 23 percent) | Kept 9.94 with Table 5.6 as source. |
| 26 | feed-rate, "molecule" for NaF and Na2SiF6 | Ionic compounds | NIT, accepted | "formula unit" throughout the lesson and questions. |
| 27 | feed-rate, "see what the plant actually delivered" | Back-calculation is a calculated dose, not a measurement | REAL | Reworded to "estimate ... from its records". |
| 28 | feed-rate, final f3 / f4 units | 8.34 lb/gal used as a conversion factor | NIT, accepted | Units written out in the explanation (MG x 8.34 lb/gal = million lb). |
| 29 | feed-rate, final f5 percent by weight | 8.0/417 uses water only | REAL | Solution basis 425 lb; answer 1.9 percent unchanged. |
| 30 | feed-rate, final f4 "4.4 gal" | Time unit dropped | REAL | "gal/day". |
| 31 | feed-rate, alternate a4 "329 multiplies by 3,785" | Stated mistake does not give 329 | REAL | Distractor replaced by 1,440 gal/day with the correct explanation (1,440 is minutes per day). Key 1 (47.6) kept. |
| 32 | feed-rate, alternate a2 "16.5 lb" | Daily mass rate | NIT, accepted | "lb/day" and parentheses. |
| 33 | monitoring, "in proportion to ion activity" | Electrode response is logarithmic (semilog calibration) | REAL error | Reworded in lesson and quiz (wqc 7.2). |
| 34 | monitoring, EPA buffer and interference | Al, Fe, Si form complexes; pH 5.0 buffer with chelating agent | CONFIRMED (wqc 24889-24891) | Lesson and final explanation reworded. Method 340.2 section 6.1 pH range (5.0 to 5.5) not added; the WQC text gives 5.0. |
| 35 | monitoring, colorimetric dye wording | Fluoride reacts with the zirconium-dye complex, which bleaches | CONFIRMED (sp6 15.8.20) | Reworded in lesson and explanation. |
| 36 | monitoring, calibration curve for every meter | Electrometer uses a curve; selective-ion meter follows manufacturer | CONFIRMED (wqc 7.2, 8) | Lesson reworded. |
| 37 | monitoring, "most important part" (Spellman) | Not found | NOT in books | Removed. |
| 38 | monitoring, "cannot see fluoride" | Not supported | NOT in books | Premise removed. |
| 39 | monitoring, overfeed definition and causes | Not in excerpts | NOT COVERED for the cause list | Definition restated as feeding more than intended; causes limited to general causes; large-tank sentence kept as qualified. |
| 40 | monitoring, analyzer downstream for mixing | Reviewer said not in excerpt | SUPPORTED (WTP 13.7, item 2; "if the installation warrants") | Kept, with "recommended at larger plants" qualified. |
| 41 | monitoring, records | Log sheets are Chapter 13 (13.62), not Ch. 29 | PLANTED "Ch. 29" (not in draft) | Draft reads Ch. 13. Also "who tested it" and dated-corrections claims removed (NOT in books). |
| 42 | monitoring, poisoning symptoms | Reviewer read a fixed onset sequence | REAL (wording) | Listed as symptoms, no sequence; doctor immediately (WTP 13.111). |
| 43 | monitoring, dust "most often" | Ranking not supported; dust is a major cause (WTP 13.110) | REAL | Reworded to "a major cause". |
| 44 | monitoring, "acid burns skin, delay" | Delayed burn | SUPPORTED (sp6 ~10302) | Kept. |
| 45 | monitoring, storage "separate, restricted entry, SDS" | Not in excerpts | NOT in books | Replaced by dry-bag storage (WTP 13.110). |
| 46 | monitoring, Harbor Ridge injection and stuck valve | Stuck-open valve does not create drive pressure by itself | REAL logic | Scenario says the stuck valve is a plausible cause under investigation. |
| 47 | final, what-and-why f1 (comparison) | Total feed vs per-gallon amount | REAL ambiguity | Prompt restated per gallon with both sources below target. |
| 48 | final, what-and-why f5 | "Concentrated chemical carries the larger risk" | REAL overgeneralisation | Explanation reworded (dose and route). |
| 49 | final, chemicals f4 "holds traces" | Presented as certain | REAL | "may hold traces". |
| 50 | final, monitoring f3 | Prompt asked who decides; answer names documents | REAL | Prompt now asks what governs notification. |
| 51 | alternate a5 (what-and-why) | Brief dip vs sustained drift below the control band | REAL | Prompt now asks about sustained drift. |
| 52 | alternate chemicals a5 | Inlet meter reads make-up water, not solution | REAL | Explanation reworded. |
| 53 | alternate monitoring a4 | "Meters do not catch mislabeled standards" overstated | REAL wording | "may accept the calibration without flagging it". |
| 54 | Planted keys (chem c4, feed c2, mon c4, final chem f1, alt chem a5, etc.) | Wrong keys in review copies | PLANTED | Draft keys are correct and unchanged. |

## Reviewer claims rejected or not adopted (false positives or overreach)

| Reviewer claim | Why not adopted |
|---|---|
| 19 lb NaF, 46 lb acid per MG "not in excerpt" | Both are in the full Spellman text (sp6 10259 and ~10306). Kept with citation. |
| 9.94 lb/gal should be 10 lb/gal | Spellman Table 5.6 gives 9.938 for 23 percent. Example 5.178 rounds. Kept 9.94. |
| Silicofluoride solubility "0.76 g per 100 mL at 25 C" must be cited with temperature | Not stated as a number in the lesson; "well under one percent" kept. |
| Method 340.2 pH range 5.0 to 5.5 | Not adopted in text; both 5.0 buffer and the method's pH range are consistent. Noted in row 34. |
| Remove "Dust is a major hazard" | Supported by WTP 13.110 ("one of the major causes of overexposure"). Kept as "major". |
| Mid-range pump accuracy rule is NOT in excerpt | Kept as general practice with "check the manufacturer's accuracy range". Recorded NOT COVERED. |

## Unresolved items

- General practice statements with no supplied source: alarm and interlock behaviour, closed-loop response to a low-reading analyzer, mid-range pump accuracy, colorimetric interferences, calibration intervals and standards shelf life, vent and tank material specifications, acute and chronic toxicology definitions, and the Harbor Ridge and Lakeview scenarios' comparative judgments. These are recorded NOT COVERED in SOURCECHECK. The facility procedure governs them.
- The federal and state rule history sentence in the lesson is NOT COVERED.
- The Method 340.2 pH 5.0 to 5.5 specification is not in the course text.
- CDC web sources (cdc-about, cdc-eng) were checked for HTTP 200 only. Their content was not verified, so no module cites them now. They remain in the `sources` list as verified-reachable references.
- Round 3 fixes were not reviewed in a fourth round.
- Gemini neon did not review this course (see above).

## Validation (after round 3 fixes)

`review/fluoride/validate_fluoride.py`, output in `review/fluoride/validation-final.txt`: 49 checks, 0 failures.

- 4 modules; 6 checks each (24); 20 finals and 20 alternates.
- 64 unique ids, unique prompts; ids follow `ceu-fluoride-<module>-cN/fN/aN`.
- 4 choices on every item; correctIndex in range.
- Correct positions: checks 6/6/6/6; finals 5/5/5/5; alternates 5/5/5/5.
- No banned option words; the correct option is never the unique longest.
- All sourceIds exist; module sourceIds now use spellman-hb, spellman-wf, wtp2 and wqc only.
- Activity minutes sum to 240; the last activity of the last module mentions "final assessment".
- Lesson words including captions: 1,402 to 1,439 per module (limit 1,700). Each has at least 4 `###` headings.
- Seven inline SVG figures, each under 3 KB, none with style attributes.

## Numeric checks

Recomputed with python -I for the final and alternate items and for the Ridgeback worked example. All keyed answers match their stated inputs after the fixes above.

## Scope

- No exact recommended or regulatory level is stated as a rule. Target and limit values are the authority's, and the lesson says so. The Table 5.7 historical range is labelled historical. The Table 14.3 value is not printed.
- Safety is recognition and purpose level only.
- Lessons, questions and scenarios are fictional, and the scenarios are labelled fictional.
