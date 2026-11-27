# Sludge Digestion for Wastewater Operators: draft notes

Draft only. Not committed, not registered in any catalogue. Key `ceu-sludge-digestion`, version `2026-11-26.1`, plannedMinutes 240, non-credit wording as in the model. `stream` is `drinking_water` because the schema allows one value; the content is for wastewater operators and the catalogue entry should say so.

## Counts
- 4 modules (`why-stabilise`, `anaerobic-digestion`, `aerobic-and-additional`, `operation-and-records`), 6 checks each (24), 5 finals and 5 alternates per module (20 and 20). 64 unique ids and prompts, 4 distinct choices each, correctIndex in range, one-sentence explanation each that names the mistake behind the distractors.
- Calculation questions: 27 (24 arithmetic only, 3 with a formula given in the source). All 27 recomputed with a separate `python3 -I` script (`recompute.py`, inputs retyped); all matched at the precision shown; no correct answer equals a number in its own prompt; each prompt states its constants.
- Correct positions: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5. Banned-word regex on options (always, never, cannot, only, all, every, any, none, completely, entirely, impossible, solely, must) found nothing; the correct option is never strictly the longest (ties exist).
- Lessons, words including figure captions (SVG code and labels not counted, as COMMON.md says): 1,603 / 1,699 / 1,694 / 1,700 (hard max 1,700 for this review); headings 15 / 13 / 14 / 16. Open item: COMMON.md asks for about 1,200 to 1,500 words per lesson, so these lessons are above that target. Activities 60 minutes per module, 240 total; the last activity is `final_assessment` and says "Sit the final assessment".
- Five original inline SVGs (solids before and after digestion; three stages; VA:Alk zones; aerobic digester; trend log), 1.8, 2.1, 1.8, 1.9 and 1.4 KB, no style attributes. Each rendered with Playwright at 390 px and viewed; fixes made: a title overflowing its box (stages figure), a label crossing a line (trend figure), a label crowding its box (zones figure). Figures also confirmed to survive marked and DOMPurify. Colours are neutral greys with a blue accent plus brown, green and orange tints; they differ from the COMMON.md suggestion of #2f6db2 and every region is labelled in text, not colour alone.

## Sources (read locally, accessed 2026-11-26)
1. WEF MOP 11, 6th ed., Vol. III, Ch. 30 Anaerobic Digestion, Ch. 31 Aerobic Digestion, Ch. 32 Additional Stabilization Methods (`wef-mop11`, no url; written as in the model).
2. Wisconsin DNR Advanced Wastewater Study Guide, Feb 2016 (`wi-adv-ww`; the URL returned HTTP 200 on 2026-11-26): 21.1.2, 21.2.x, 22.2.x, 22.3.x, 23.1.x to 23.4.1.
Spellman texts were not used. No second web source was added.

## Schema problem for the owner
`CeuSource` requires a `url`; the textbook has none. I omitted `url` for `wef-mop11` as the model does and invented nothing. Owner decides: make `url` optional, or give books a different source type.

## Constants used
8.34 lb per gal; specific gravity 1.00; 1 MGD = 1,000,000 gal per day; mg/L x MGD x 8.34 = lb/day; HRT = volume / daily feed (equal to SRT without decanting); VSR = (VS in - VS out) / VS in x 100; VA:Alk = VA / alkalinity (mg/L); required alkalinity = VA / 0.1 (WEF Eq. 30.8 target ratio); typical gas 15 cu ft per lb VS destroyed (inside the WEF 12 to 18 range, stated in the prompts); 2 lb oxygen per lb VS destroyed (WEF design allowance, stated in the prompts); SRT x temperature product = SRT x temperature.

## Royce U gap check (code sdgp, 280 slides read)
34 topics: YES 21, PART 10, NO 3 after additions. Details in `gap-report-sludge-digestion.md`. Added in our words from the textbooks: Van Kleeck mention, ash arithmetic, primary and secondary digesters, scum, flame traps and relief valves (recognition), key factors list, SRT from solids mass, aerobic decanting and supernatant, CO2 and nitrate lowering pH, supernatant samples, troubleshooting tables. Declined: their numbers and limits, entry and tether lists, and rules of thumb not in the sources.

## Corrections made while drafting (see SOURCECHECK, CONTRADICTED rows)
Six first-draft slips were caught and fixed: a false "tighter" comparison of the temperature figures, "usually needs treatment" (source says may), "most usual route" to a sour digester (source says often), an overstated aerobic solids limit, a reversed decanting remark, and one distractor that the Wisconsin guide could support.

## Not source-supported, needs reviewer: disposition (2026-11-26)
SOURCECHECK labels 14 lesson rows "Needs reviewer" (rows 30 to 357). The 22 in the earlier count are those 14 plus 8 NOT COVERED rows that are arithmetic, fictional or activity advice; those 8 were checked by recomputation or are not factual claims. Each of the 14 was reviewed and recorded in SOURCECHECK:
- Kept as general reasoning, no numbers: fixed solids definition, total and volatile solids reasoning, putrescible, "neither process is better in every case", volatile percent base, choice depends on plant factors, thickening does not change VS pounds.
- Softened: vector definition ("in this course ... can carry disease"), thickening normally comes first, one VSR method used consistently, primary digester kept mixed and heated for the sensitive methane formers, a thickened-sludge target as a useful step, log what changed, simplest likely explanation first.
- Lime pH 12: reworded as a high-pH process description in the WEF Ch. 32 text (not a required value); the distractor explanation no longer says "pH 12".

## Scope limits applied
No regulatory limits stated as rules. Numbers in lessons are labelled typical or reported from the manual: SRT 15 to 20 days, mesophilic range, VA:Alk zones, gas yield, loading 0.1 to 0.2, lime pH 12 or more appears only as the WEF Ch. 32 description of a standard lime process, worded as 'a high-pH condition' with the source cited, not as a required value, overload more than 10 percent above the daily limit. Vector attraction percentages, Class A and B criteria and H2S exposure figures are not stated. WEF is internally inconsistent on the mesophilic range, flammable range and gas yield; see SOURCECHECK. Safety is recognition and purpose only. Plant and people names are fictional (Wren Hollow, Tamsin Reach, Ashgrove Falls, Corbel Mere; Nadia Brennan, Owen Castellane, Kofi Adair, Sunita Okonkwo, Rosalind Teague, Jonas Pettibone, Mira Halloran, Dev Marchetti) and not checked against real places or people.

## Unsure
- Quotes in SOURCECHECK show one representative sentence for list claims.
- WEF and the Wisconsin guide differ on ATAD retention time; both are quoted by name.
- The extraction garbles Eq. 30.1 to 30.3 symbols; formulas were taken from the surrounding text and standard form.

## Second-model review (2026-11-26)
Reviewed with GPT-6.2 Sol (`gpt-6.2-sol`) using `review/review_course_sol.py`. Gemini did NOT review this course: the second model in the original script had no credential here, so its call was removed. Full record: `ceu-sludge-digestion-REVIEW-RESULT.md`. Three rounds. Real errors were fixed; false positives were recorded with reasons. Round 3 fixes were made after the last review and were not re-reviewed.

