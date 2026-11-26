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

## Gap closure (Royce U `bsp` comparison, 2026-11-17)
Gap list from `docs/handoff/gap-reports/basic-safety.md`. All additions are original wording and fictional scenarios; no Royce U wording, questions, examples or numbers were used, and no numeric safety limit is stated (the lessons say the applicable rule, permit or program sets the value).

| Gap | Status | Where |
| --- | --- | --- |
| SCBA and IDLH | closed (recognition only) | Module 2, new section "Breathing apparatus and classified areas"; checks c4, a2 |
| Explosion-proof equipment, classified areas | closed (recognition only) | Module 2, same section; a5 |
| Hydrogen peroxide | closed | Module 4 table row and first aid line; a1 |
| Cross-connection, non-potable marking | closed | Module 4 new section; c1, a4 |
| Food and laboratory contamination | closed | Module 4 new section; a5 |
| Sandblasting | closed | Module 1 new section "Dust, abrasive blasting, paint and solvents"; c5 |
| Paint and solvents | closed | Module 1 same section |
| Respirator fit test and medical review | closed | Module 1 PPE section; c6 |
| PPE grades (hard hat, eyes, hearing, feet) | closed | Module 1 PPE section |
| Toe-boards, falling objects, stacking | closed | Module 1 housekeeping section; a4 |
| Vaccinations, hand washing, animal and insect bites | closed | Module 1 new section "Biological hazards and hygiene"; a5 |
| Testing atmosphere types, ventilation and purge, attendant, harness and lifeline | closed | Module 2 safeguard table; a1 |
| Grounding, GFCI, extension cords | closed | Module 3 new section; a4, a5 |
| Welding and hot work, arc screens, filter lenses | closed | Module 3 new section; a2 |
| Cranes, hoists, rigging; power tools | closed | Module 3 new section and tools paragraph; a1 |
| De-energizing awareness | kept at recognition level (assume energized until verified) | Module 3 |
| Batteries and electrolyte; cylinder regulators | closed | Module 4 "Cylinders, batteries and containers" |
| First aid and CPR awareness | closed (awareness only) | Module 4 first aid section |
| Fire classes, extinguishers, response order, ignition sources and smoking | closed (awareness only) | Module 4 fire section |

Replaced questions (16, each keeps the original correct-answer position): hazard-ppe c5, c6, a4, a5; confined-atmosphere c4, a1, a2, a5; excavation-energy a1, a2, a4, a5; chemical-emergency c1, a1, a4, a5. Counts unchanged: 4 modules, 24 checks, 20 finals, 20 alternates, positions balanced (6/6/6/6 checks, 5/5/5/5 finals and alternates), 180 minutes, unique ids and prompts, four choices each, no banned words in options.

Lesson words (text only, no SVG, table pipes excluded) are now 1,500 / 1,470 / 1,477 / 1,545 (module 4 is slightly over the target) after trimming padding in every module; headings per lesson 10 / 9 / 12 / 12. Each module gained one objective for the new topics. Evidence, rubrics and facilitator guides were not changed. Calculations and lesson figures (0.25 percent, 3,000 ppm, 12 and 10, 2.44 m, 8 days, 5.4 kg, 44 kg) were recomputed with `python3 -I` and match. No new sources were added; the new topics rest on standard operator teaching and are not tied to a verified URL, so a reviewer should confirm the SCBA, IDLH, explosion-proof, hydrogen peroxide, cross-connection and fire-class statements. Not recorded as numbers or procedures: nothing in these sections gives a limit, schedule or step list. Still NO: none. Pre-existing questions where the correct option is the longest (unchanged this pass): confined-atmosphere-c1, chemical-emergency-c2, chemical-emergency-c5, confined-atmosphere-f2, chemical-emergency-f3.

## Photos (added 2026-11-17)

Cover and four lesson photos are in `content/ceu-drafts/covers/ceu-basic-safety-*.jpg` (1200 to 1600 px JPEGs). Lesson figures reference `/ceu-covers/<file>`, so the files must be copied into `client/public/ceu-covers/` when the course is registered. Generated with gpt-image-2.6-flare (cover, confined space, chemicals) and gpt-image-2.6-sunburst (PPE, trench). The Gemini image route returned 401 in this session, so no Gemini images were used. Each photo shows safe practice only. The PPE photo shows a hard hat hung on a hook rather than worn, and the chemical containers are unlabelled. Neither is a teaching point, and both should be checked by a safety reviewer before use.
