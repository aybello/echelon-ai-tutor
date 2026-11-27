# Effluent Filtration for Wastewater Operators: draft notes

Draft only. Not committed, not registered. Key `ceu-effluent-filtration`, version `2026-11-26.1`, plannedMinutes 240, non-credit wording as in the model. `stream` is `drinking_water` because the schema allows one value; content is for wastewater operators and the catalogue entry should say so. Royce U equivalent: `efp` (Effluent Filtration), see `gap-report-effluent-filtration.md`.

## Counts (validated with `ceuwork-eff/validate.py`)
- 4 modules (`why-filter`, `granular-media`, `backwash-cleaning`, `operation-troubleshooting`), 6 checks each (24), 5 finals (20), 5 alternates (20). 64 ids and prompts unique, 4 distinct choices, correctIndex in range.
- Correct positions: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5. No banned word in any option; no correct option strictly longest.
- Lesson words (figures removed): 1,237 / 1,264 / 1,247 / 1,274; headings 7 / 6 / 7 / 8. Six original inline SVG figures (2 / 2 / 1 / 1), each under 3,072 bytes, no style attributes, text 11 units or larger, rendered at 390 px with Playwright and viewed (PNG in `diagrams-eff/`).
- Activities 60 minutes per module, 240 total; last activity is `final_assessment` with "final assessment" in the instruction.

## Constants used
8.34 lb per gal; 1 MGD = 1,000,000 gal per day; 1,440 min per day, so 1 MGD = 694.4 gpm; 7.48 gal per ft3; 12 in. per ft; rise rate in./min = gpm/ft2 x 1.6 (Spellman); pounds per day = mg/L x MGD x 8.34. Turbidity to TSS factors 1.3 to 1.5 (filter effluent) and 2.0 to 2.4 (settled secondary) are quoted from MOP 11 as typical and plant specific.

## Sources
WEF MOP 11 Vol II Ch. 24 (filtration); Wisconsin Solids Separation Study Guide 2.3, 3.6 (URL verified 200); Spellman Handbook 5.6.8; Spellman Vol III 4.4; Water Quality Control Handbook 8.7, 8.8. Book sources have no URL (url key omitted, as in `wef-mop11` in the sludge model); the CeuSource type requires url, so the importer must accept a missing url or owner must decide. See `ceu-effluent-filtration-SOURCECHECK.md`: 59 lesson claims (52 supported, 0 contradicted, 7 not covered), 64 questions.

## Royce U gap table
42 topics: YES 21, PART 17, NO 4. Declined: traveling-bridge equipment data and switch positions, Royce numeric design values, preventive maintenance tables, activated carbon module, super-chlorination quantities, pulsing and cloud-height checks (no textbook support or plant specific). Added after comparison: diatomaceous earth recognition sentence (M2) and a wording fix in M3.

## Scope limits applied
No regulatory limits or design ranges stated as rules; textbook ranges are labelled typical and attributed. Safety is recognition and purpose only; chlorine use for algae points to plant procedures. All people and places fictional (Ashgrove Bend, Nadia Brennan, Colm Reyes, Priya Anand, Wen Hartley); not checked against real names.

## Unsure / not done
- M4 F2 uses a labelled classroom assumption (run length inversely proportional to solids), not from a source.
- WQC gives a 30 to 50 percent bed expansion for sand while Spellman gives 20 to 25 percent; the lesson says ranges differ and defers to the design.
- No second-model review. Figures re-viewed after final tweaks only for Figure 5.
