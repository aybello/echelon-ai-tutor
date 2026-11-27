# Review result: ceu-sludge-dewatering

Reviewed 2026-11-26. Course file: `ceudrafts/ceu-sludge-dewatering.json` (backup of the pre-review draft: `ceudrafts/ceu-sludge-dewatering.pre-review.json`).

## Reviewer

- **Reviewer:** GPT Sol 6.2, through the OpenAI chat completions API.
- **Model id:** `gpt-6.2-sol` (the exact id listed by `GET https://api.openai.com/v1/models`; `gpt-6.2-sol` was present).
- **Gemini did NOT review this course.** No Gemini credential is available in this environment, so the Gemini step was not run. Every finding below comes from GPT Sol 6.2 alone and was triaged by checking the textbooks.
- **Script:** `review/review_course_sol.py` (adapted from `docs/handoff/tools/review_course.py` on origin/main; Gemini call removed; planted-error design kept). Outputs: `review/dewatering/round1`, `round2`, `round3`. Fix scripts and logs: `review/dewatering/apply_fixes*.py`, `apply_wordcut.py`, `fix-log-*.json`.
- **Textbook excerpts given per unit:** WEF MOP 11 Vol III Ch. 33 (`ceusrc/chapters/ch33-dewatering-approx.txt`) by module line range (finals and alternates get the full chapter body); Spellman sp6 section 5.7.9 (`ceusrc/sp6.txt`, lines 13346-13766) for all units; Spellman Vol II sections 10.7.3-10.7.4 (`ceusrc/sp5.txt`) for the belt-press module and finals, because the draft cites that volume.

## Rounds

Three rounds, each on the then-current draft, each with a new random planting seed (7, 8, 9). Each round reviewed 6 units: four modules, the final set and the alternate set. Round 1 found real problems and they were fixed; round 2 found real problems and they were fixed; round 3 found only clarity points, which were fixed. The three-round limit was then reached, so no fourth round was run. The last round produced no new factual or numeric error.

## Planted-error catch rate

Each round planted three kinds of error into a review copy only (a wrong answer key, a changed number in a lesson, a changed number in an explanation). The draft itself was never changed by planting.

| Round | Planted | Caught |
|---|---|---|
| 1 | 11 | 11 |
| 2 | 12 | 12 |
| 3 | 11 | 11 |
| **Total** | **34** | **34 (100%)** |

Caught means the reviewer named the planted item with the wrong fact and the right fix. I checked each one by reading the output.

## Findings and verdicts

Verdicts: **REAL** = confirmed against the book or the arithmetic and fixed; **FP** = false positive, kept, with the reason; **CLARITY** = not wrong, but ambiguous or overstated, tightened to what the book says; **PLANT** = planted error, caught, no draft change needed.

### Planted errors (all caught)

| Round | Item | Verdict | Action |
|---|---|---|---|
| 1-3 | Wrong answer keys (11 + 12 + 11 items, see table above) | PLANT | None to the draft; keys in the draft are correct. |
| 1-3 | Changed lesson numbers ($900, 10 to 15 percent, 99 percent, 12 gpd) | PLANT | None; draft text is correct. |
| 1-3 | Changed explanation numbers ($2,000, 35.20, 2, 125,100) | PLANT | None; draft text is correct. |

### Real findings, fixed

| Round | Where | Finding | Book check | Action |
|---|---|---|---|---|
| 1 | Why dewater, dry and wet tons | Dry solids must be the solids recovered in the cake | Eq. 33.1 basis; Spellman 5.7.9.4.4 | Stated "in the cake"; R3 reworded again |
| 1 | Why dewater, volume ratio | Volume ratio assumes equal sludge density | Lesson formula only | Added density assumption to lesson and why c4, final-alt why a3 prompts |
| 1 | Why dewater, 25 percent | "Biosolids above 25 percent" applies only to activated sludge | WEF chapter lines 224-232: primary 35 to 40 percent, activated about 25 | Limited to waste activated sludge |
| 1 | Why dewater, polymer and drier cake | Overstated "dose raises dryness" | WEF chapter line 277: more polymer alone, without more cake depth, makes little difference | Reworded to WEF |
| 1 | Why dewater, charge | "Opposite charge", "anionic would repel" overstated | WEF chapter lines 736-746: virtually all flocculants used are cationic | Reworded; removed the anionic claim |
| 1 | Why dewater, wet tons below dry tons | Diagnosis too narrow | Arithmetic | Now lists percent multiplied, or 20 for 0.20 |
| 1 | Why dewater, storage | Missed the anaerobic digester exception | WEF chapter lines 311-312 | Added exception |
| 1 | Why dewater, 24 hours | Example advice presented as general rule | WEF chapter lines 508-545 is an example | Labelled as example advice |
| 1 | Belt, wash-water formula | E and W not defined; capture effect of wash water | WEF Eq. 33.9, E = effluent excluding wash water | Defined E and W; R2 added "few solids" condition |
| 1 | Belt, dryness trade-off | Missing "within limits" and "all else equal" | WEF chapter line 2477 | Added both |
| 1 | Belt, start-up alarm | "Full cake conveyor" not the book's wording | WEF chapter line 2605 | Changed to "conveyor shutdown or storage-bin overfilling" |
| 1 | Belt c5 explanation | Blinding stated as certain | WEF chapter line 2689 "can be the result of" | Reworded |
| 1 | Belt c6 explanation | "Belts do not crack" unsupported | WEF chapter line 2650 | Removed the claim |
| 1 | Belt c3 and f1 | Wash-water flow ambiguous | Eq. 33.9 | Prompts now say filtrate before wash water; keys unchanged |
| 1 | Belt a1 explanation | 15,012 comes from 0.30, not 3 | Arithmetic | Corrected |
| 1 | Belt a5 explanation | Later sample "does not reflect" overclaimed | WEF chapter lines 2645-2667, 15 to 20 minutes | Reworded |
| 1 | Other, torque | "Fixing torque fixes dryness" overclaimed | WEF "very expensive viscometer" (line 2893); Table 33.7 (line 3145) | Reworded |
| 1 | Other, g force | Bowl diameter missing from example | WEF g-force formula | Added 29-inch bowl |
| 1 | Other, air drying | "Instead of machines" and listed mechanisms stated as universal | WEF chapter lines 1699-1862 | Reworded |
| 1 | Ops, disposal cost | Cost basis (wet or dry ton) not given | Spellman Eq. 5.248 | Stated basis |
| 1 | Ops, capture | Filtrate sampled as TSS, not total solids | WEF data collection | Added approximation note |
| 1 | Ops, polymer dilution | "0.5 percent solution" basis unclear | WEF polymer section | "by volume" added (lesson and final-alt a2) |
| 1 | Ops, cost per dry ton | Two costs on different bases added directly | Spellman 5.7.9.3.5 vs 5.7.10 | Put both on feed basis |
| 1 | Ops, recycle | "Everything goes back to the plant" | WEF data collection | Limited to when filtrate or centrate is returned |
| 1 | Ops, changes in feed | Qualifier "without warning" dropped | WEF chapter lines 508-545 | Restored |
| 1 | Ops, odour | "At least a minute of contact" and "safer room" unsupported | Not in sources | Number removed |
| 1 | Ops f3 explanation | "Recycle does not settle out" overreach | Wisconsin guide lists return sidestreams | Reworded to what the guide says |
| 1 | Ops f5 | Dry and liquid polymer spills mixed | WEF chapter lines 957-964 | Prompt specifies liquid polymer |
| 1 | Other f4 explanation | "Chemicals do not make gas" too broad | WEF chapter line 3508: lime releases ammonia | Removed gas denial |
| 1 | Other f5 explanation | "Sand beds still need polymer" overstated | WEF chapter lines 1862-1864 | Reworded |
| 1 | Final-alt why a1 | 312 is 312.5 | Arithmetic | Choice and explanation corrected |
| 1 | Final-alt other a2 explanation | "65 subtracts the wrong way" is wrong (gives -55) | Arithmetic | Reworded: 65 is solids at 35 percent moisture |
| 1 | Final-alt other a5 explanation | Small beds "need polymer and decanting" overgeneral | WEF chapter lines 1699-1760 | Reworded |
| 1 | Ops and belt distractor explanations | "Come from swapping terms" not demonstrated | Recomputed; no source | Replaced with what the formula gives |
| 2 | Why c6 explanation | "Needs a positive charge" as a requirement | WEF chapter lines 736-746 | Reworded |
| 2 | Other, pressure-filter safety | Stopping the press is not isolation | WEF chapter line 3505 "without first shutting the unit down" | Added that plant lock-out governs entry |
| 2 | Ops, polymer dose formula | Ratio of flows gives mass ratio only at equal densities | Book formula, no density term | Assumption stated in lesson and c3 prompt |
| 2 | Other f5 explanation | "Raw sludge does not drain too fast" unsupported | WEF drying-bed text, odour as the stated reason | Removed |
| 2 | Final-alt why a5 explanation | Shearing treated as a later conditioning step | WEF conditioning section: avoid excessive shear once flocs form | Reworded |
| 2 | Final-alt other a4 explanation | "Paved beds drain without it" wrong | WEF chapter line 1862: pavement blocks drainage | Reworded |
| 3 | Why c5 explanation | Distractor "raise density of the water" not addressed | Book: polymer binds fines into flocs | Added to explanation |
| 3 | Why dry and wet tons, scope | Sentence could read as all feed solids end in cake | Eq. 33.1 | Scoped to "these examples" |
| 3 | Other, pressure-filter safety | Lock-out for tool insertion | WEF safety section | Lock-out governs any entry (merged with round 2) |

### Own checks while fixing (not from the reviewer)

| Item | Action |
|---|---|
| "The basic disposal cost is the sum of..." (ops lesson) | Garbled; reworded to "the total cost is the polymer cost plus the disposal cost" |
| Lesson word limit (ops lesson was 1,761 words including captions) | Removed the struvite section (not used by any question) and two sentences; now 1,650 |
| Correct option strictly longest (ops c6) | Shortened the correct option; no correct option is now strictly longest |

### False positives, kept with reasons

| Round | Where | Reviewer claim | Why kept |
|---|---|---|---|
| 1, 3 | Other, pond adjustment | "4 mm every year or two" unsupported | WEF chapter lines 2929-2931: "Each year or two, try changing the pond up and down by approximately 4 mm" |
| 1, 3 | Other, polymer points | "At least four" should be "four" | WEF chapter line 2931: "at least four polymer addition points"; the reviewer's quote is not in the extraction |
| 1 | Other, lagoon | "Only in a case history" cannot be established | The whole chapter mentions a lagoon once (lines 1619 to 1632); the reviewer's excerpts did not include it |
| 1, 2, 3 | Ops, iron and alum | "In proportion" unsupported | WEF chapter line 593: "The effect on dewatering will be proportional to the amount added" |
| 1, 2 | Ops f3, Wisconsin attribution | Wisconsin guide not verifiable | Reviewer had no Wisconsin excerpt; the guide lists "Return sidestreams" as a disadvantage of mechanical dewatering (text extraction, around lines 3310 to 3324). Verified when drafting |
| 2 | Why, alum | "No change or more difficult" overreach | WEF chapter line 591: "either no change or result in more difficult-to-dewater biosolids" |
| 2 | Why, drier cake and polymer | Generalised from centrifuges | WEF chapter line 277: "to obtain dryer cakes requires an increase in the polymer dosage" is a general statement; wording now includes WEF's cake-depth qualifier |
| 3 | Why, bell-shaped curve | Shape overstated | Draft uses WEF's words: "bell shaped, levelling off and sometimes declining" |
| 2, 3 | Other, polymer quick mix | Mixing time not specified | WEF chapter line 3369: "Polymers only need a quick mix before injection to the press" |
| 1 | Ops, "no flow measurements" | Only true with negligible auxiliary flows | Eq. 33.5 uses concentrations only; the TSS caveat was added instead |

## Source check and validation after review

- **Not-covered rows (22):** 21 kept (accurate general reasoning, no numbers, or arithmetic, or flagged teaching inference). One softened: "Anything unusual goes in the log and to the supervisor" became "Writing anything unusual in the log is good practice, and your plant procedures set who else must be told." Recorded in `ceudrafts/ceu-sludge-dewatering-SOURCECHECK.md`.
- **Web source:** `https://dnr.wisconsin.gov/sites/default/files/topic/OpCert/StudyGuideAdvancedWastewater.pdf` returned HTTP 200 (`curl -sIL -m 20`). Kept. It is the only URL in the course.
- **Validation (`review/dewatering/validate.py`, run after all fixes):** 4 modules, 24 checks, 20 finals, 20 alternates; all ids and prompts unique; 4 choices each; correctIndex in range; positions 6/6/6/6 (checks), 5/5/5/5 (finals), 5/5/5/5 (alternates); no banned option words; no correct answer number appears in its own prompt; no correct option strictly longest; sourceIds all exist; activity minutes sum to 240; last activity of last module mentions final assessment; evidence contains "fictional" and is over 120 characters; assignment over 100; rubric at least 3; facilitatorGuide over 200; objectives at least 2; five SVG figures (largest 1,997 bytes, no style attributes); lesson words including captions 1,613 to 1,650 (limit 1,700).
- **Numeric recompute (`review/dewatering/recompute.py`, python3 -I):** all keyed numeric answers reproduced.
- **Stale text in SOURCECHECK:** the struvite rows describe the removed section and remain in the table for the record.

## Unresolved

- Gemini did not review the course (no credential).
- Round 3 was the last round; reviewer NITs repeated the false positives above and were not re-argued further.
- Spellman sp6 (cited as requested) is the general handbook; the draft's own Spellman citation is Vol II (sp5), which was added to the excerpts.
- Book sources still have no URL, as the brief requires; the schema's url field is only satisfied by the Wisconsin link.
