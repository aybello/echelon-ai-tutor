# Sludge Dewatering for Wastewater Operators: draft notes

Draft only. Not committed, not registered in any catalogue. Key `ceu-sludge-dewatering`, version `2026-11-26.1`, plannedMinutes 240, non-credit wording as in the model. `stream` is `drinking_water` because the schema allows one value; the content is for wastewater operators and the catalogue entry should say so.

## Counts
- 4 modules (`why-dewater`, `belt-and-screw-presses`, `other-dewatering-methods`, `operation-and-records`), 6 checks each (24), 5 finals per module (20), 5 alternates per module (20). 64 unique ids and prompts, 4 choices each, correctIndex in range.
- Calculation questions: 24 (6 are arithmetic-only). All 24 answers recomputed with a separate `python3 -I` script (`calc_check.py`, inputs retyped); all matched. No correct answer equals a number in its own prompt; every prompt states its constants.
- Correct positions: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5. Banned-word regex on options (always, never, only, all, none, must, every, any, cannot, completely, entirely, impossible, solely): none found. Correct option is never strictly the longest. Each explanation names the mistake behind the distractors.
- Lesson words (figures removed): 1,582 / 1,580 / 1,632 / 1,673 (hard max 1,700). Headings 14 / 12 / 13 / 12. Activities 25+12+15+8 = 60 per module, total 240; the last activity of module 4 is a `final_assessment` instruction naming the final assessment.
- Figures: 5 original inline SVGs (wet tons against cake solids, belt filter press zones, centrifuge cutaway, sand drying bed section, sample points around a dewatering unit), 1.1 to 2.0 KB each, no style attributes, text 11 units or larger, colours #1d2d40 and #2f6db2 plus greys. Each rendered once at 390 px with Playwright (`chromium.launch()`, no options) and viewed. Layout slips found on the first look (overlapping labels in the centrifuge and sample-point figures, a clipped label on the belt press) were fixed and re-rendered.
- `validate.py` checks structure, counts, uniqueness, banned words, sourceIds, figure size and lesson length; run result: no errors.

## Sources (read locally, accessed 2026-11-26)
1. WEF MOP 11, 6th ed., Vol III Chapter 33 Dewatering (`wef-mop11`), chapter text read from the table of contents to the Safety and Housekeeping section.
2. Wisconsin DNR Advanced Wastewater Study Guide, Feb 2016 (`wi-adv-ww`): 21.1.1, 22.4.1, 24.3.6, 25.2.2, 26.2.1, 26.2.2, 26.3.1. URL checked with `curl -sIL` and returned 200.
3. Spellman's Standard Handbook for Wastewater Operators Vol II, 2nd ed. (`spellman-ww2`), section 10.7.3, for belt tracking and plate-and-frame wording only.
Schema problem: the CeuSource type requires `url` and the two textbooks have none. No URL was invented; `wef-mop11` and `spellman-ww2` omit `url`, matching the existing `wef-mop11` entry in `ceu-sludge-thickening.json`. Only one verified web source (the Wisconsin guide) is listed; the owner decides how book sources are typed.

## Constants used
8.34 lb per gal; 2,000 lb per ton; 60 min per hr; 1,440 min per day; mg/L x MGD x 8.34 = lb per day; wet tons = dry tons / cake solids as a decimal; recovery = s(f - e) / [f(s - e)] x 100; wash water correction e x (E + W) / E; polymer dose = (polymer conc / feed conc) x (polymer rate / feed rate) x 2,000; g force = 0.0000142 x r/min squared x bowl diameter in inches; the Wisconsin C1V1 = C2V2 volume ratio. Specific gravity 1.00 in the liquid sludge pounds question.

## Typical figures stated (all cited, labelled typical)
Primary 35 to 40 and activated sludge about 25 percent cake; dry, emulsion and solution polymer active contents; 10 percent belt speed and 10 to 15 percent tension steps, 15 to 20 minute settle (belt press); 2 mgd rural air-drying; 150 to 300 mm sand bed fill; 40 to 60 percent moisture removal point; 5 degrees C per 2 points of centrifuge cake solids. No regulatory limits stated; no design ranges beyond those WEF gives.

## Royce U gap check (sdwp, 205 slides read)
29 topics: before YES 12, PART 12, NO 5; after YES 18, PART 8, NO 3. Added: polymer shelf life and make-down points, polymer dilution arithmetic with one question, a routine walk-round, poor-discharge symptoms and the feed, washing and tracking link. Declined with reasons (not in the textbooks): sludge bags, hydraulic power unit and steering circuit settings, automatic wash-down mode, their step sizes and acceptable-cost figure. Full table in `gap-report-sludge-dewatering.md`. Nothing copied; none of their numbers restated.

## Not source-supported, needs reviewer
- Screw presses: no textbook read describes them. The M2 section is general and no question tests it.
- Drying lagoons: no textbook covers them as a method. The M3 paragraph is general and no question tests it.
- Belt tracking detail is from Spellman only; WEF only lists belt misalignment as an alarm.
- Wet-ton arithmetic, specific gravity use and sense checks are general arithmetic. See SOURCECHECK for the 22 NOT COVERED rows.
- WEF's own 98 percent to 72 percent water remark conflicts with its arithmetic, and its polymer dose worked example mixes 0.12 and 0.15 percent; neither is repeated.

## Scope limits and unsure
No regulatory limits, no exact set points. Safety is recognition only; plant procedures govern. Plant and people names are fictional (Heron Mill, Pinewick, Saltmere, Cedar Holloway; Tamsin Okoro, Gareth Lindqvist, Rafael Quist, Mei-Ling Aberg, Noor Haddad, Piers Calloway, Bronwen Achterberg, Isidore Pell) and were not checked against real places or people. Page markers in SOURCECHECK follow the running heads and footers of the extractions, not a separate printed copy. Lesson counts of 12 to 14 headings are above the brief minimum of four.
