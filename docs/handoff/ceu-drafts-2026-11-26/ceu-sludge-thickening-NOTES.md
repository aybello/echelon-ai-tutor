# Sludge Thickening for Wastewater Operators: draft notes

Draft only. Not committed, not registered in any catalogue. Key `ceu-sludge-thickening`, version `2026-11-26.1`, plannedMinutes 240, non-credit pilot wording as in the template. `stream` is `drinking_water` because the schema allows one value; the content is for wastewater operators and the catalogue entry should say so. Backups: `ceu-sludge-thickening.pre-check.json` (before the textbook check), `ceu-sludge-thickening.pre-gap.json` (before the Royce U gap closure). The earlier version of these notes is `ceu-sludge-thickening-NOTES.pre-gap.md`.

## Counts (validated 2026-11-26 with `ceuwork-thick/validate.py`)
- 4 modules (`why-thicken`, `gravity-thickening`, `mechanical-thickening`, `operation-and-records`), 6 checks each (24), 5 finals per module (20), 5 alternates per module (20). 64 ids and 64 prompts unique; every question has 4 distinct choices, in-range correctIndex and a one-sentence explanation.
- Correct positions: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5.
- Option text scanned for always, never, cannot, only, all, every, any, none, completely, entirely, impossible: none. No correct option is strictly the longest.
- Lesson words with the figure removed: 1,514 / 1,974 / 2,186 / 1,768. Each is under the 2,200 target. Headings: 13 / 12 / 17 / 15. One inline SVG per module (unchanged by the gap closure).
- Activities: 60 minutes per module, 240 total; module 4 ends with `final_assessment`.
- Numeric answers: the nine new or changed calculations were re-derived by `validate.py` with separate formulas (polymer strength, air-to-solids ratio, recycle percent); matches shown there. The older numeric questions were recomputed in the first draft and were not changed in this pass.

## Sources
1. Wisconsin DNR Advanced Wastewater Study Guide (2016): polymers (21.1.1), positive displacement pumps (22.1.1), bound and unbound water (22.4.1), polymer slipperiness (25.2.2).
2. Wisconsin DNR Solids Separation Study Guide, Subclass B (2016): blanket depth, SLR, SOR (2.1.3, 2.1.4, 2.2.14), DAF (2.4), DAF problems (3.6.5).
3. WEF MOP 11, 6th edition, Volume III, Chapter 29 Thickening (`ceusrc/chapters/ch29-thickening.txt`). Claim-by-claim check in `ceu-sludge-thickening-SOURCECHECK.md`.
4. Spellman's Standard Handbook for Wastewater Operators, Volume II (`ceusrc/sp5.txt`), sections 10.5.4.5 air-to-solids ratio and 10.5.4.6 recycle flow percent. Added in the gap closure.
5. Spellman, Handbook of Water and Wastewater Treatment Plant Operations, 2nd edition (`ceusrc/sp6.txt`), 5.6.5.4.6 percent strength of solutions, 5.7.8.21 gravity and DAF thickener calculations. Added in the gap closure.

The two Spellman books have no URL, so their source entries omit `url` (owner decision on optional url is pending, see CEU-PROCEDURE item 5). Check that the importer accepts a missing url before use. The Water Quality Control Handbook (`wqc.txt`) was searched and gave nothing needed beyond the above.

## Royce U gap closure (2026-11-26)
Royce U `stp` (359 slides: gravity belt thickening and dissolved air flotation) was compared topic by topic; see `gap-report-sludge-thickening.md`. 35 topics: before COVERED 6, PARTLY 15, MISSING 14; after COVERED 23, PARTLY 9, MISSING 3. Only topics were used; wording, questions, numbers and examples were not copied, and our calculations use our own numbers.

Added, with sources:
- M3 "Parts of a gravity belt thickener": flocculation tank, inline mixer, plows, ramp, doctor blade, wash tube, tracking, tension (WEF 29-40 to 29-43).
- M3 "Adjusting a gravity belt thickener": mixing energy, retention time, belt speed, ramp, feed solids change, biological sludge, wash water and blinding, cause and response table, polymer aging (WEF 29-45 to 29-49, Table 29.7).
- M3 "Polymer solution strength": percent by weight, worked example, liquid polymer balance (Spellman sp6 5.6.5.4.6).
- M4 "Controlling a DAF unit": air-to-solids ratio and formula (Spellman sp5 10.5.4.5, WEF 29-34), recycle percent (sp5 10.5.4.6), loadings, skimmer and float depth, pressure advice, bottom sludge removal, start-up, shutdown and sampling (WEF 29-34 to 29-36).
- Nine questions replaced in place (same ids, same answer positions): M3 C3 belt speed, C6 mixing energy, F5 and A5 polymer strength, A4 wash water and blinding; M4 C1 air-to-solids ratio, C3 float depth and skimmer, F4 bottom sludge, A1 recycle percent. Replaced were mainly near-duplicate arithmetic and low-value recall questions.
- Two objectives added (M3, M4) and two source entries.
- To keep M3 under the word limit, several M3 paragraphs were shortened and the WEF solids ranges for mechanical units, the drum attendance remark, the DAF capture table figures and the DAF advantage sentence were removed. No question relied on them (checked).

Declined (no textbook support or plant-specific): spin-down tests and composite sampling, rise-rate test, DAF component functions, hydraulic oil quality and temperature, polymer makedown steps and aging times, DAF tank pressure and level control detail, DAF switch positions, inlet turbulence and skimmer blade troubleshooting. Listed in the report. Jurisdiction-specific and numeric operating ranges were not added (see "Not to add" in the report).

## Not source-supported, needs reviewer (carried over, partly resolved by the textbook check)
See `ceu-sludge-thickening-SOURCECHECK.md` for the current verdicts. The new sections were written against the WEF and Spellman passages listed above and were not added to that table.

## Scope limits applied
No regulatory limits, design ranges, target percent solids, polymer doses or loading values stated as rules. Numbers appear in arithmetic prompts or as attributed textbook quotations. "Plant procedures and manuals take precedence" is stated in the lessons. Plant and people names are fictional (Larkspur Hollow, Quillon Bend, Marrow Creek, Fennick Ridge; Ines Varga, Tomas Reilly, Priya Anand, Dev Okafor, Marta Lindqvist, Hana Kowalczyk, Luca Moretti); not checked against real places or people.

## Not done in this pass
- No second-model review of the new questions (CEU-PROCEDURE step 4).
- Figures were not re-rendered; the SVGs are unchanged.
- SOURCECHECK.md not extended to the new sections.
