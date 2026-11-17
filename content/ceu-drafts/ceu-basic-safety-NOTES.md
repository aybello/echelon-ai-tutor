# Basic Safety for Water and Wastewater Operators: draft notes

Draft only. Not committed, not registered in `server/ceu/catalogue.ts`. Key `ceu-basic-safety`, version `2026-11-17.1`, plannedMinutes 180 (activities 12/8/15/5/5 = 45 per module), non-credit pilot wording copied from the models. No approved CEUs or contact hours are implied.

`stream` is `drinking_water` because the schema allows only one value. The content is shared with wastewater operators (confined spaces, wet wells, digester gas, collection-system excavations); the catalogue entry should say so, and the course must not be called Director approved for either stream.

## Counts
- 4 modules (`hazard-ppe`, `confined-atmosphere`, `excavation-energy`, `chemical-emergency`), 6 quick checks each (24), 20 final and 20 alternate questions (5 per module each, interleaved). 64 questions, all ids and prompts unique, every question has 4 choices and a valid `correctIndex`. Correct-answer positions are balanced: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5.
- Lesson word counts (text only, no SVG, table pipes excluded): 1,451 / 1,447 / 1,398 / 1,440. Headings per lesson: 8 / 8 / 9 / 10.
- Scenario-recognition items among finals: 11 of 20 (hazard-ppe f1, f3; confined-atmosphere f1, f4; excavation-energy f1, f2, f4, f5; chemical-emergency f1, f3, f5). Among alternates: 9 of 20.
- Banned words (always, never, only, all, every, none, cannot, completely, entirely, solely, and also both) were scanned in every option and none remain. The correct option is the single longest in only 1 of 64 questions.

## Sources (HTTP 200 checked with `curl -sIL -m 20`, 2026-11-17)
1. https://www.ccohs.ca/oshanswers/hsprograms/hazard/hierarchy_controls.html (CCOHS hierarchy of controls)
2. https://www.ccohs.ca/oshanswers/chemicals/whmis_ghs/index.html (CCOHS WHMIS and GHS labels and SDS)
3. https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html (CCOHS confined spaces introduction)
4. https://www.cdc.gov/niosh/trenching/ (CDC NIOSH trenching and excavation safety)

Most OSHA pages (osha.gov/confined-spaces, /trenching-excavation, /hazcom and others) returned 403 to the proxy and several NIOSH and EPA URLs returned 404, so none of those were used. I confirmed the four URLs return 200 and that the CCOHS and NIOSH pages load, but I did not read each page end to end; the section descriptions in `sources` are written from the page titles and my knowledge of standard practice. A reviewer should confirm them. Two sources are Canadian, one is US federal. No source covers chemical safety in detail (module 4 cites the WHMIS/GHS page and the confined-space page); a state or university operator-safety manual would strengthen module 4 and the emergency-awareness section if one can be verified.

## Constants and numbers used (all fictional practice values, none a regulatory value)
- 10,000 ppm = 1 percent by volume (questions: 4,000 ppm = 0.4 percent; 0.6 percent = 6,000 ppm; lesson: 2,500 ppm = 0.25 percent; 0.3 percent = 3,000 ppm)
- 1 ft = 0.3048 m (7 ft = 2.13 m; 9 ft = 2.74 m; lesson: 8 ft = 2.44 m)
- Fictional risk scale: severity 1 to 5 times likelihood 1 to 5 (3 x 4 = 12; 5 x 2 = 10)
- Chlorine days of supply = pounds on hand / pounds per day (96 / 12 = 8; 98 / 14 = 7); 1 lb = 0.4536 kg gives 12 lb = 5.4 kg and 96 lb = 44 kg
- Soil weight "roughly a hundred pounds per cubic foot (45 kg)" is a rounded teaching figure, not a design value
All calculations, distractor arithmetic and lesson examples were recomputed with a separate `python3 -I` script; every answer matched and no answer equals a number written in its question.

## Scope limits applied
- No exact oxygen, flammable, toxic-gas or noise exposure limits, no trench depth thresholds, slope ratios, ladder rules, eyewash flush times, reporting deadlines, sample counts or rule numbers. The lessons say the applicable rule, permit or program sets the value.
- Confined spaces: recognition and purpose only. No entry procedure, no test order, no calibration steps. Rescue awareness stops at "call trained rescue and stay out".
- Lockout and tagout: purpose and recognition only, no steps. Chemical leaks and fires: awareness level (move away, warn, notify; trained responders handle it). First aid is described only as flushing until help arrives, with the SDS and facility plan governing.
- All scenarios are fictional (Cedarline, Alder Bend, Pine Hollow, Marlowe Springs, Marlow Creek, Willow Gap). Names were not checked against real places.

## Diagrams
Five original inline SVGs, drawn from scratch, each under 2 KB, viewBox only, role="img" with aria-label and title, text 11 units or larger, #1d2d40 text, #2f6db2 accent plus greys, with text labels so colour never carries meaning. Rendered at 390 px wide with Playwright and every PNG was looked at (PNGs in the scratchpad `diagrams-safety` folder; a trench-figure spoil-pile mound that overlapped a label was removed).
- Module 1: hierarchy-of-controls pyramid (five labelled levels); PPE zones on a body outline (seven zones).
- Module 2: vault cross-section showing where methane, hydrogen sulfide and chlorine collect and that low oxygen can occur at any level.
- Module 3: sloped, shored and shielded trench cross-sections.
- Module 4: storage layout with hypochlorite, acids, ammonia and caustic in separate areas and dashed lines for reacting pairs.
Reviewer notes: the gas-position figure is schematic (mixing and ventilation change positions) and says so; the shored panel is simplified and shows no real brace hardware.

## Items I am unsure about
- Statements for a reviewer to confirm: hydrogen sulfide described as "slightly heavier than air"; chlorine, methane and carbon dioxide positions; pictogram meanings (flame, corrosion, gas cylinder, skull and crossbones); SDS section descriptions (written by purpose, section numbers deliberately omitted); polymer described as very slippery when wet; caustic releasing heat on dilution.
- The module 4 incompatibility list (hypochlorite plus acid gives chlorine gas, hypochlorite or chlorine plus ammonia gives chloramines, acid plus caustic gives heat) is standard operator teaching but was not checked against a single source.
- "Competent person" and "permit-required" are US OSHA terms; Canadian jurisdictions use different wording, which the lessons note only by deferring to the applicable rule.
- The module 2 table says ventilation "supports testing and does not replace it", and the lesson says gas monitors are bump-tested and calibrated; this is recognition-level, and no schedule is given.
- Module 3 notes that a locate service does not make a trench safe; the one-call service name varies by region and is described generically.
- The question explanations are generated from a lead sentence plus one "The ... choice" clause per distractor, so wording is formulaic; the rest of the text is hand-written.
- The evidence scenarios use a fictional meter reading (3,000 ppm) and trench depth (8 ft) that appear in the facilitator guides and rubrics only.
