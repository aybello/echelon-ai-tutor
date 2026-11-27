# Reverse Osmosis for Water Operators: draft notes

Draft only. Not committed, not registered. Key `ceu-reverse-osmosis`, version `2026-11-26.1`, plannedMinutes 240, non-credit pilot wording as in the template. `stream` is `drinking_water` because the schema allows one value; the audience is shared drinking water and wastewater reuse. Royce U equivalent: `rop` (Reverse Osmosis).

## Counts (validated with rob/validate.py)
- 4 modules (how-ro-works, performance-arithmetic, pretreatment-fouling, operation-troubleshooting); 6 checks each (24), 5 finals (20), 5 alternates (20). 64 ids and prompts unique, 4 distinct choices each, correctIndex in range.
- Correct positions: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5.
- Banned option words (always, never, only, all, every, none, cannot, completely, entirely, solely, must; also any, both, neither) scanned as whole words: none. No correct option is strictly the longest.
- Lesson words without figures: 1,393 / 1,510 / 1,413 / 1,422 (M2 is a few words over the 1,500 target, under the 1,700 maximum). Headings 6 / 10 / 8 / 9.
- 7 original inline SVG figures (M1 two, M2 two, M3 two, M4 one), each under 3 KB, no style attributes, rendered at 390 px with Playwright and viewed; overlaps fixed (pressure arrow label, clipped labels, trend label).
- Activities 60 minutes per module, 240 total; the last activity of module 4 is the final assessment.
- Numeric answers: 23 recomputed with rob/verify_calc.py (python3 -I); two flagged only for rounding (21.2 shown as 21 psi, 1.875 shown as 1.9 percent). No correct answer equals a number in its prompt.

## Sources
1. Water Quality Control Handbook (Alley, WEF Press), Section 8.8 Membrane Filtration (primary).
2. Spellman, Handbook of Water and Wastewater Treatment Plant Operations, 2nd ed. (sp6): membrane filtration 18.9, pressure ranges Table 18.21, brine disposal 18.10.8, BHP 9.2.8, dechlorination 19.10.1.6.5.
3. WEF MOP 11 (advanced treatment, MBR, glossary).
4. EPA water reuse page (https://www.epa.gov/waterreuse, curl 200): context only; it does not mention RO.
Book sources have no URL (owner decision on optional `url` pending); entries omit `url` like `wef-mop11` in the sludge model. Direct EPA membrane manuals and other agency PDFs returned 403 or 404 through the proxy, so only one web source is verified. sp2.txt has only a glossary line on RO; the CA range of knowledge lists membrane filtration at T3-T4 only (scope check: our course stays at recognition and arithmetic level).

## Constants used in questions
R = 8.314 kPa L/(mol K); 6.895 kPa per psi; K = C + 273; 8.34 not used; BHP = gpm x psi x 2.31 / (3,960 x efficiency); 0.746 kW per hp; 1,440 min/day; 60 min/h. Typical figures quoted in lessons are attributed (pore sizes Table 8.7, pressures Table 8.11, flux Table 8.12, SDI under 3.5 as typical). Cleaning triggers in questions are fictional manufacturer settings given in the prompt.

## Not source-supported, needs reviewer
34 of 82 lesson claims are NOT COVERED by the textbooks (SDI test, antiscalant, clean-in-place, cleaner-to-foulant match, normalising, post-treatment stabilisation, shutdown, controller trips, safety hazards). They are written at purpose level with no numbers as rules; see SOURCECHECK. One printed equation (wqc 8.63) is dimensionally wrong and is not followed.

## Royce U gap check (table)
## Topic table

| # | Royce U topic (our paraphrase) | Before | Where in our draft | After |
|---|---|---|---|---|
| 1 | RO as one of several membrane processes; semipermeable principle | YES | M1; C1, C3 | YES |
| 2 | Pressure-driven versus electrically driven membrane processes | NO | none | PART: M1 names electrodialysis reversal only |
| 3 | MF, UF, NF, RO ranked by pore size and pressure | YES | M1; C5, F1 | YES |
| 4 | Molecular weight cutoff as a measure of tightness | NO | none | YES: M1 definition, no numbers |
| 5 | Pressure-vessel systems versus submerged vacuum systems | NO | none | YES: M1 |
| 6 | Cross-flow versus dead-end flow and backwashing | PART | M1 (cross-flow only); F2 | YES: M1 |
| 7 | Reversible and irreversible fouling; natural organic matter | NO | none | PART: M3 reversibility added; organic matter fouling not added |
| 8 | Flux definition, units and its link to pressure | YES | M2; C3, C4 | YES |
| 9 | MF uses: protozoa barrier, turbidity, pleated cartridge detail | NO | none | NO: outside RO scope, declined |
| 10 | UF uses, virus removal and multi-barrier idea | NO | none | NO: outside RO scope, declined |
| 11 | NF as softening and DBP-precursor membrane | NO | none | PART: M1 sentence from Spellman |
| 12 | Differential pressure measured across each stage | PART | M3 stage signatures | YES: M3, M4 |
| 13 | Osmosis, osmotic pressure and reverse osmosis definitions | YES | M1; C1, C3, C4 | YES |
| 14 | Transmembrane pressure formula | NO | none | YES: M2 with own numbers |
| 15 | Recovery definition, calculation and concentrate valve | YES | M2; C1, F1 | YES |
| 16 | Staged arrays and vessels per stage | PART | M3 figure 6 | YES: M2 |
| 17 | Rejection calculation and typical range | PART | M2 formula; C2 | PART: typical range declined |
| 18 | Concentration polarization | YES | M1, M3; A1 | YES |
| 19 | Membrane materials: cellulose acetate and polyamide | PART | M1; F4, A2 | PART: biodegradation of cellulose not in textbooks, declined |
| 20 | Hydrophilic and hydrophobic membranes; mechanical strength | NO | none | NO: no textbook support, declined |
| 21 | Integrity monitoring methods | PART | M3 integrity; F5 | PART: air-pressure hold and particle count named, test steps declined |
| 22 | Spiral wound and hollow fibre construction | YES | M1; C6 | YES |
| 23 | Operating temperature and correction factor | YES | M2, M4; C6 | YES |
| 24 | Bench or pilot studies and manufacturer help | PART | M3 mention | YES: M3 treatability study |
| 25 | Coagulant pretreatment for turbid feeds | NO | none | NO: no textbook support, declined |
| 26 | Pretreatment chart of substances and effects | YES | M3; C1, A4 | YES |
| 27 | SDI and pre-filters | YES | M3; C2, C6 | YES: SDI limits of the other course not restated |
| 28 | Chemical dispersants allowing higher SDI | NO | none | NO: vendor specific, declined |
| 29 | Feed pressure raising flux, foulants and compaction | YES | M2; C3 | YES |
| 30 | Common scalants, scale index and scale control levers | PART | M3; C4, F4 | YES: M3, M4 |
| 31 | Microbiological fouling, oxidant tolerance, biocides | PART | M3; A5 | YES: M3 |
| 32 | Cleaning chemicals, clean-in-place, triggers | PART | M3; F1, F2 | PART: purpose level only, procedure steps and numeric triggers declined |
| 33 | Post-treatment: degasification, pH, disinfection, corrosion control | PART | M4; C4, F5 | YES: M4 |
| 34 | Controller shutdown conditions and alarm testing | NO | none | YES: M4 |
| 35 | Premature fouling, extended shutdown preservation, restart flush | NO | none | YES: M4 shutdown and standby |
| 36 | Record keeping | YES | M4; C5 | YES |
| 37 | Concentrate volume, disposal and permit programs | PART | M4; C3, F4 | YES: M4, programs not named |


See `gap-report-reverse-osmosis.md` for added and declined items.

## Scope limits applied
No regulatory limits, doses, residuals, cleaning recipes or trigger numbers stated as rules. Safety at recognition and purpose only. Chemical handling, cleaning procedure steps and emergency steps are not given. All names, plants and scenarios fictional.

## Review update (2026-11-26, second-model review)

- Backup of the pre-review draft: `ceu-reverse-osmosis.pre-review.json`.
- Second-model review by GPT Sol 6.2 (`gpt-6.2-sol`) only. Gemini did not review this course (no credential in this environment). Three rounds; planted-error catch rate 34 of 36 (see `ceu-reverse-osmosis-REVIEW-RESULT.md`).
- Changes: rounding (21.2 psi; 1.88 percent; 0.375 points), NF attribution removed, several attribution and wording fixes, one quiz restated (Table 8.9 question), one quiz explanation corrected (79 percent), pump-energy basis made consistent (pump efficiency, shaft power), conductivity ratio presented as an estimate.
- Lesson 2 is 1,523 words (target 1,200 to 1,500, hard maximum 1,700).
- Validation after the last change: `review/validate_ro.py` (0 errors) and `rob/verify_calc.py` (23 numeric answers, 0 mismatches). Table 8.9 excerpt used for the reviewer; the draft's Table 8.9 values were checked directly against `ceusrc/wqc.txt` lines 8294 to 8304.
