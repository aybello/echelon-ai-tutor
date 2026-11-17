# Chlorination Principles for Water and Wastewater Operators: draft notes

Draft only. Not committed, not registered in any catalogue. Key `ceu-chlorination-principles`, version `2026-11-17.1`, plannedMinutes 210, non-credit pilot wording as in the models. `stream` is `drinking_water` because the schema allows one value; the content is shared with wastewater operators and the catalogue entry should say so.

## Counts
- 4 modules (`forms-chemistry`, `dose-calculations`, `contact-residual`, `feed-problems`), 6 checks each (24), 5 finals per module (20) and 5 alternates per module (20). All 64 prompts and ids unique, every question 4 choices.
- Calculation questions: 13 of 20 finals and 13 of 20 alternates (checks add 8 more). All 35 numeric answers recomputed with a separate `python3 -I` script; all matched; no correct answer equals a number in its own prompt; every prompt states its constants.
- Correct positions balanced: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5. Banned words checked with word-boundary regex on options: none found.
- Lesson words (figure SVG removed): 1,337 / 1,291 / 1,238 / 1,371. At least 11 `###` headings per lesson. Activities 52 + 52 + 53 + 53 = 210; last activity of module 4 names the final assessment.
- Six original inline SVG figures (HOCl/OCl- by pH, breakpoint curve, pounds formula, gas feed schematic, hypochlorite day-tank layout, baffled versus open basin), each under 2.6 KB, rendered at 390 px with Playwright (including through the app's marked and DOMPurify path) and viewed. PNGs in the scratchpad `diagrams-chlor/` folder.

## Sources (HTTP 200 with `curl -sIL -m 20`, 2026-11-17)
1. https://www.epa.gov/dwreginfo/chloramines-drinking-water
2. https://www.epa.gov/dwreginfo/stage-1-and-stage-2-disinfectants-and-disinfection-byproducts-rules
3. https://www.cdc.gov/chemical-emergencies/chemical-fact-sheets/chlorine.html
4. https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/chlorine.html

I confirmed page titles for 1 to 3; the CCOHS page returned a title-less response to my fetch, so its `section` text is general and needs a human check. Module 2 (arithmetic) has only weak source support (landing-level EPA pages); a reviewer should add a certifying-agency math or treatment manual if one can be confirmed. Several guessed EPA and CDC URLs returned 404 and were not used.

## Constants used
8.34 lb per gal; 1 MGD = 1,000,000 gal per day; 1,440 min per day; 24 h per day; 1 MGD = 133,680 ft3 per day (about 92.84 cfm); 1 gal = 3.785 L; 1 lb = 0.454 kg; kg/day = mg/L x ML/d. Hypochlorite examples use 8 to 12.5 percent available chlorine and 9.4 to 10.2 lb per gal; calcium hypochlorite 65 percent; cylinder 150 lb. These are practice values; the label and procedures govern.

## Gap checklist (Royce U `cpp`) coverage
| Area | Status | Where |
| --- | --- | --- |
| Heavier than air, liquid vaporises, volume expansion, temperature and pressure | YES (qualitative, no multiplier stated) | M1 lesson, M1 check |
| Materials: dry steel, wet corrosive, plastics, PVC and rubber attacked | YES | M1 lesson, M1 final |
| Health effects: liquid burn, gas irritant, dry versus wet, delayed effects, exertion, duration, first aid purpose | YES (no values, no steps) | M4 lesson |
| Leak principles: worsens, alarms real, upwind, ammonia white cloud, no water, two-person, fire and heat, kits, notify | YES (recognition only) | M4 lesson, checks, final |
| Containers: 150 lb, one-ton, tank car/truck, valves, stamped numbers, full/empty, scale, team task | YES | M1 lesson table, M1 alternate |
| Equipment: scale, evaporator, PRV, manifold, heat strips, floor sampling, vacuum regulator, ejector, analyzer/recorder, compound loop, expansion chamber, changeover, hypochlorite feed | YES | M3, M4 lessons, M4 questions |
| Chemistry: HOCl/OCl-, free/combined/total, mono/di/trichloramine, breakpoint, nitrification, denitrification, nitrite demand | YES | M1 |
| Detention time in ft3 with 133,680 ft3 per day, dose/residual/demand, lb/day, injection and mixing | YES | M2, M3 |
| Coliform indicator purpose | YES | M3 |
| SDS sections, right-to-know, training, notifying neighbours | YES (purpose only) | M4 |
| Operating problems and PM | PART: faulty heater, high usage and flow-pacing readings are named briefly; "low vacuum from low water flow" and "water in rotameter" have questions | M4 table |

## Scope limits applied
No exposure limits, container weights as limits, residual targets, sample counts, deadlines or rule numbers. Safety content is recognition and purpose; "facility procedures govern" is stated in the lesson, assignment and facilitator guide. No step-by-step container change, leak repair or first aid. All names and scenarios are fictional. CT verification is not repeated (the existing `ceu-disinfection-ct` covers it); M3 stops at nominal detention time.

## Unsure
- Calling the gas "more than twice as heavy as air" is a physical fact, not a limit; a reviewer may prefer wording without a ratio.
- Ammonia vapour leak detection is described at recognition level as done by trained people.
- Ejector, check valve and "water in rotameter" wording is general; confirm against a manufacturer manual.
- Scenario names (Birch Ford, Willow Gap, Fern Hollow, Cinder Flat and others) were not checked against real places.
- M4 lesson has two figures and is close to the density limit for a 210-minute course; consider trimming if the reviewer finds it heavy.
