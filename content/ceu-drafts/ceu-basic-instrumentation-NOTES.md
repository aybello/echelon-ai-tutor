# Basic Instrumentation for Water and Wastewater Operators: draft notes

Draft only. Not committed, not registered in any catalogue. Key `ceu-basic-instrumentation`, version `2026-11-17.1`, plannedMinutes 180 (module activity minutes 45/45/45/45). Non-credit pilot wording as in the models; no approved CEUs or contact hours are implied.

`stream` is `drinking_water` because the schema allows one value. The content is shared with wastewater operators (flumes, aeration DO control, digester temperature, RAS pump control); the catalogue entry should say so.

## Counts
- 4 modules (`measurement-fundamentals`, `pressure-level-flow`, `analyzers-control`, `scada-troubleshooting`), 6 quick checks each (24), 5 finals per module in `finalAssessment` (20) and 5 per module in `alternateFinalAssessment` (20). 64 unique ids and prompts.
- Correct positions balanced: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5.
- Calculations or reading-a-signal items: 12 of 20 finals (60 percent), 12 of 20 alternates (the last of these, a 22.5 mA reading, is a reading-a-signal conclusion).
- Lesson words excluding figures: 1,322 / 1,326 / 1,320 / 1,268. Each has at least five `###` headings and several worked examples with units.
- Figures: 6 original inline SVGs (loop block diagram; 4-20 mA scaling line with live zero; flume with level sensor; magnetic meter full versus part-full pipe; chlorine residual loop; step change versus drift). Each 1.4 to 1.9 KB, viewBox only, no style attributes, text 12 units or larger, colours #1d2d40 / #2f6db2 / greys. Rendered at 390 px with Playwright and inspected; fixes were the "0 gpm" label on the scaling line and the H label on the flume.
- Checks run: JSON parses, counts, unique ids and prompts, four choices, no banned words in options (word-boundary regex), no all/none/both of the above, no correct numeric answer equal to a number in its question, every calculation re-derived by a separate `python3 -I` script that hard-codes the expected values (26 calculation questions and the lesson worked examples). One lesson rounding slip (flume example) was found by that script and fixed.

## Sources (HTTP 200 checked with `curl -sIL -m 20`, 2026-11-17)
1. https://www.ccohs.ca/oshanswers/hsprograms/confinedspace_intro.html (CCOHS: Confined Space - Introduction; page text mentions atmospheric hazards)
2. https://www.ccohs.ca/oshanswers/hsprograms/lockout.html (CCOHS: Lockout/Tag out)
3. https://physics.nist.gov/cuu/Uncertainty/index.html (NIST: Uncertainty of Measurement Results)
4. https://www.epa.gov/npdes/npdes-training (EPA NPDES Training landing page)
A fifth candidate (Sacramento State OWP courses page) returned 200 but an empty body, so it was dropped. None of the sources is an instrumentation manual; they back the safety purpose, lockout purpose and measurement-uncertainty ideas only. The instrument content is standard operator-training knowledge written from general knowledge, not quoted from a source. A reviewer may want to add an operator-training manual on instrumentation.

## Required-topic checklist (gap report `docs/handoff/gap-reports/basic-instrumentation.md`)
| Topic | Where | Status |
| --- | --- | --- |
| Sensor defined; status, physical, analytical families with examples; their uses | Module 1 lesson, M1 checks and finals | YES |
| Control element; panel instruments (meters, lights, annunciators, recorders, pushbuttons, selectors) | Module 1 lesson, M1 finals | YES |
| PLCs, SCADA, HMI, plant network, cost effectiveness, secondary data highways | Module 4 lesson, M4 checks | YES (recognition) |
| Portable gas detectors, confined-space purpose, hazardous atmospheres, records, sensor replacement (manufacturer or failure history, whichever sooner), no alarm levels | Module 4 lesson, M4 check and finals | YES (purpose only) |
| Flow criteria (area, velocity), open channel versus closed pipe, weirs and flumes, rating, primary plus secondary | Module 2 lesson, M2 checks and finals | YES |
| Venturi and orifice, propeller meter parts, magnetic, ultrasonic, error sources | Module 2 lesson, finals | YES |
| Pressure: why, Bourdon and helical gauges, transmitters, differential pressure, flow meter plus control valve | Module 2 lesson, M2 checks | YES |
| Level: purpose, from above, from below, electrical | Module 2 lesson, M2 checks and finals | YES |
| Temperature (digesters, evaporators, device list) | Module 3 lesson | YES (device names only) |
| Weight: load cell, weigh beam, hydraulic cell, chlorine containers | Module 3 lesson and calculations | YES |
| Speed, proximity and zero-speed switches, broken belt example | Module 3 lesson | YES (own wording) |
| Analyzers list: solids, turbidity, DO, sludge blanket, ammonia, nitrate, pH, chlorine, ORP | Module 3 lesson (five in detail, rest named) | PART: solids, sludge blanket, ammonia, nitrate and ORP are named with the shared fouling and verification questions, not described one by one |
| Chlorine residual loop with sample location and transit time; minimum feed system components | Module 3 lesson, figure, finals | YES |
| Digester temperature loop | Module 3 lesson | YES (one paragraph) |
| Pump control by pressure and by level | Module 3 lesson | PART: one short paragraph, no question item |

## Scope limits applied
- No regulatory or exposure limits, no alarm levels, no calibration frequencies, no accuracy requirements, no sample counts or rule numbers. Fictional deviation alarm and tolerance values are explicitly labelled as the facility's choice or left to the manufacturer and procedure.
- Gas detection and lockout are recognition and purpose only; no steps.
- No manufacturer-specific instructions. The applied SCADA course's historian, alarm-data-integrity and record-audit content is not repeated; the lesson only touches range mismatch and a frozen signal from the operator's side.
- No Royce U wording, questions, examples or images were used. The Royce U slides were not re-extracted in this run; coverage follows the supplied gap checklist.

## Constants used
- 4-20 mA span 16 mA; engineering value = (mA - 4) / 16 x span; mA = 4 + fraction x 16
- 0.433 psi per ft of fresh water; 2.31 ft of water per psi; 1 psi = 6.89 kPa; 1 ft = 0.305 m
- 1 cfs = 448.8 gpm = 28.3 L/s; 1 gpm = 0.0631 L/s; area of circle = 0.785 x d x d; 8 in = 0.667 ft
- Fictional flume ratings Q = 3.0 x H^1.5 (lesson) and Q = 2.4 x H^1.5 (question), Q in cfs, H in ft; not a real flume rating
- DP flow = maximum flow x square root of the DP fraction (signal not yet square-rooted)
- Pounds formula: lb/day = mg/L x MGD x 8.34; percent = part / whole x 100
- Ohm's law V = I x R with 250 ohms; 1 A = 1,000 mA
- Sample line delay = volume / flow

## Items I am unsure about
- Several lesson statements are general operator knowledge not tied to a fetched source (for example electrode fouling effects, load cell use for ton containers, ultrasonic foam effects). A reviewer should check them against an instrumentation manual.
- A 4-20 mA fault current below 4 mA and above 20 mA is described qualitatively; some systems use specific fault thresholds, which are deliberately not stated.
- The M3 proportional example uses a fictional controller with a "per 1.0 mg/L" gain and a 50 percent bias; real controllers often use proportional band.
- Lesson lengths are measured by splitting on whitespace after removing figures; a different counter (for example one that includes markdown markers) may differ slightly.
- Fictional place names (Alder Fork, Heron Bend, Quill Run, Linden Mill, Marsh Landing, Reed Landing) were not checked against real places.
