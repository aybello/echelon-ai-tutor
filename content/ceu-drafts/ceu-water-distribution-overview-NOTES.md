# Water Distribution Overview for Operators: draft notes

Draft only. Not committed, not registered in any catalogue. Key `ceu-water-distribution-overview`, version `2026-11-17.1`, plannedMinutes 210 (activities 52 + 52 + 53 + 53), non-credit pilot wording as in the models. `stream` is `drinking_water` because the schema allows one value; the content is distribution only, but the catalogue entry should not call the course approved for any CEU or contact-hour award.

## Counts
- 4 modules (`system-components`, `operating-system`, `maintenance-repair`, `quality-compliance`), 6 quick checks each (24), 20 finals (5 per module) and 20 alternates (5 per module). 64 unique ids and 64 unique prompts; every question has 4 distinct choices.
- Correct positions balanced: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5.
- Calculations: 6 of 20 finals (30 percent), 6 of 20 alternates, 4 checks. All 16 recomputed by an independent `python3 -I` script that parses the numbers out of each stored prompt; all matched, and no answer equals a number in its own question.
- Lesson words (SVG removed): 1,396 / 1,293 / 1,243 / 1,244. At least 4 `###` headings each (10 / 8 / 7 / 8).
- No banned words inside any option (checked with a word-boundary regex). Every wrong option is named in the explanation.
- Correct answer is the longest option in about half of the questions (ties included); a reviewer may want to even this out further.

## Sources (HTTP 200 with `curl -sIL -m 20`, 2026-11-17)
1. https://www.epa.gov/dwreginfo/revised-total-coliform-rule-and-total-coliform-rule
2. https://www.epa.gov/dwreginfo/lead-and-copper-rule
3. https://www.epa.gov/dwreginfo/public-notification-rule
4. https://www.cdc.gov/drinking-water/about/index.html

Many EPA distribution, cross-connection and CCOHS excavation URLs I tried returned 404 and were not used. The four sources support Module 4 well and Modules 1 to 3 only generally (the CDC page for public-health context). No source page was found for hydrants, meters or backflow; those parts rest on standard operator-training knowledge, so a human should add an AWWA-linked or university operator-training page for Modules 1 to 3 if one can be confirmed.

## Constants and assumptions
- 0.433 psi per ft and 2.31 ft per psi (physics constants only); 1 psi = 6.895 kPa
- 7.48 gal per ft3; 449 gpm per cfs; 1,440 min per day; pi = 3.1416; area = pi x d squared / 4; velocity = cfs / ft2
- 14.7 psi atmospheric appears only as a wrong option (absolute versus gauge)
- Lesson examples: 118 ft gives 51.1 psi; 40 ft x 6 ft tank gives 56,398 gal; 600 gpm in 8 in gives 3.83 ft/s; meter 47 of 50 gal is 94 percent, true use 8,000 gal; 2.5 gpm over 30 days is 108,000 gal; 500,000 / 125,000 is 4.0 days; 1.60 to 0.40 mg/L is 75 percent lost; 18 calls per 1,200 customers is 15 per 1,000.

## Gap table against the required checklist
| Item | Where | Status |
|---|---|---|
| Purpose, waterborne disease context | M1 first section | YES |
| Storage roles, tank level and demand cycle | M1, M2 | YES |
| Clear well, elevated, standpipe, ground, hydropneumatic (air ratio, short cycling), surge | M1 | YES |
| Water age in tanks, covers, access | M1, M4 | YES |
| Pressure zones, minimum pressure in principle, ISO grading | M1 | YES |
| Backsiphonage, backpressure, cross-connections | M3 | YES |
| Pipe materials, break types, AC handling, PVC sunlight, concrete types, selection factors | M1 | YES |
| Corrosion, cathodic protection, encasement, continuity, bonding, service pipe not a ground | M1 | PART (bonding at meters cut for length; continuity covered) |
| Tree, loop, grid layouts | M1 | YES |
| Valves: gate, butterfly, check, PRV setting, altitude, air release | M2 | YES |
| Water hammer, slow valve operation | M2 | YES |
| Hydrants: purpose, dry and wet barrel, parts, thrust blocks, lateral, isolation valve, flush hydrants | M2 | YES |
| Hydrant colour and class, operation principles, out-of-service marking, records, flow-test purpose, certified lubricants | M2 | YES |
| Meter types (PD, velocity, turbine, compound, venturi/orifice/proportional, magnetic, ultrasonic), AMR, AMI, testing and replacement | M3 | YES |
| Contamination versus pollution, air gap, RPZ, double check, residential dual check, AVB, PVB, containment versus isolation, testing purpose | M3 | YES |
| Elevation-pressure relationship and tank level | M1, M2 | YES |

Left out on purpose: surge-tank detail beyond a one-line role; sizing and class numbers; a separate figure for tank types. Module 4 and the fixed brief topics (complaints, coliform, lead and copper, notification, certification) have no Royce checklist items but are in the brief.

## Items I am unsure about
- A few recognition statements: standpipe dead storage, PVB for backsiphonage only, magnetic meter needing a full pipe, tracer gas for plastic pipe. Please confirm with a source.
- The hydrant operation paragraph is kept to principles; confirm it stays within recognition level.
- The "air-to-water ratio" for hydropneumatic tanks is named but not quantified.
- Fictional names (Alder Bend, Kestrel Ridge, Pike Hollow, Willow Mill, Cedar Rise, Heron Flats, Marrow Creek, Linden Court, Pine Hollow) were not checked against real places.

## Scope limits applied
No regulatory or design number is restated (pressures, velocities, service-line sizes, test intervals, residuals, sample counts, closing times). Hydrant operation, backflow testing and main repair are recognition and purpose only. All scenarios are fictional. No Royce U wording, questions, examples, images or numbers were used.

## Diagrams
Six original inline SVGs (each under 2.1 KB, viewBox only, blue #2f6db2 plus greys, labels at 11 or 12 units), rendered at 390 px and inspected in `.../scratchpad/diagrams-dist/` (f1 to f6):
- M1: source-to-tap schematic; branched versus grid layout with a dead end; two pressure zones with a PRV.
- M2: daily demand curve with tank level; dry-barrel hydrant parts.
- M3: backflow symbols (air gap, RPZ, vacuum breaker, double check).
Module 4 has no figure.
