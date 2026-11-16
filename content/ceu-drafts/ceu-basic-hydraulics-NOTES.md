# Basic Hydraulics for Water and Wastewater Operators: draft notes

Draft only. Not committed, not registered in `server/ceu/catalogue.ts`. Key `ceu-basic-hydraulics`, version `2026-11-16.1`, plannedMinutes 180, non-credit pilot wording copied from the existing courses.

`stream` is `drinking_water` because the schema allows only one value. The content is shared with wastewater operators; the catalogue entry should say so, and the course must not be called Director approved for either stream.

## Counts
- 4 modules (`pressure-head`, `flow-velocity`, `friction-pumps`, `operating-problems`), 6 quick checks each (24), objective = module id as in the disinfection file.
- 20 final questions (5 per module, interleaved) and 20 alternate questions. All 64 prompts are unique. Correct-answer positions are exactly balanced: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5.
- 39 questions have numeric answers. Each was recomputed with a separate script (`python3 -I`) that re-derives the answer from the prompt text; all matched. No numeric answer equals a number in its prompt, and each question states its own constants.
- Lesson word counts: 1,286 / 1,178 / 1,201 / 1,125. Module 1 is above the 900 to 1,200 target; modules 3 and 4 were rewritten to fit the added scope.

## Sources (HTTP 200 checked with `curl -sIL -m 20`, 2026-11-16)
1. https://www.epa.gov/water-research/epanet
2. https://www.owp.csus.edu/courses/
3. https://www.epa.gov/npdes/npdes-training

Many direct EPA PDF and training-manual URLs returned 403 or 404 and were not used. Two of the three pages are landing pages, not manuals; the CSUS page returned no readable text to my fetch, so its section description is generic and "operator training course listings" should be confirmed by a human. Only 3 (not 4) sources were verified. The NPDES page is weak support for hydraulics. A reviewer should add a hydraulics-specific state or university manual if one can be confirmed.

## Constants used
- 0.433 psi per ft (9.79 kPa per m); 2.31 ft per psi (0.102 m per kPa, 0.704 m per psi); 1 psi = 6.895 kPa
- 14.7 psi atmospheric (101.3 kPa); about 34 ft of water
- 7.48 gal per ft3 (1 ft3 = 28.3 L); 449 gpm per cfs (1 cfs = 28.3 L/s; 1 gpm = 0.0631 L/s)
- 1.547 cfs per MGD (1 MGD = 43.8 L/s); 1,000,000 gal per MGD; 1,440 min per day; 694.4 gpm per MGD
- 1 in = 25.4 mm; 1 ft/s = 0.305 m/s; pi x d squared / 4 for pipe and tank area
- 3,960 in WHP = Q x H / 3,960 (33,000 ft-lb per min per hp divided by 8.34 lb per gal); BHP = WHP / pump efficiency; input hp = BHP / motor efficiency; 0.746 kW per hp; 8,760 h per year
- g = 32.2 ft/s squared (9.81 m/s squared); velocity head = V squared / (2 g)
- Affinity laws: Q ratio = N ratio, H ratio = N ratio squared, P ratio = N ratio cubed
- Friction scales roughly with flow to the 1.85 power (stated in the lesson only, never in a question)

## Scope addition (coordinator request) and where it went
Module 3: TDH from static, friction and velocity head with a worked example using all three (Marsh Landing, 66.56 ft) and a final question; NPSH available versus required, conceptual (quick check); affinity laws with a worked example and calculation check (Pine Terrace, 960 gpm / 51.2 ft / 15.4 BHP; head final question, power alternate question); WHP and BHP stated precisely and kept separate; pumping-energy example to kW and kWh per year (Heron Bay, 230,624 kWh, about 2,562 kWh per foot per year; one final and one alternate); gauge versus absolute (14.7 psi) in Module 1 and again in the NPSH discussion.
Module 4: cavitation recognition with noise, vibration, falling flow and causes (check plus alternate); cause-to-symptom table (low flow, low pressure, erratic operation, high power draw, vibration) with a high-power-draw final question; valve table (gate, globe, ball, butterfly, check, plug, knife gate, pinch) with a check-valve quick check and a throttling-versus-isolation alternate question; pump classification, kinetic versus positive displacement, with a final question and a short paragraph.
To make room I dropped the quick checks on the C factor-driven flow decline, the pump curve reading (still covered by the throttle and shutoff questions), the pipe-length friction question, dead-end low pressure, surge factors and the vortex air question. Dead-end and surge ideas remain in the lessons. Closing-time guidance is mentioned only as "no single time fits; any figure is only a guideline", with no number.

## Items I am unsure about
- Valve table purposes are general recognition statements (for example plug valves for sludge and slurry, pinch valves for slurries); a reviewer should confirm against the chosen source manual.
- The statement that gate valves held partly open can be damaged is a common operator-training point; confirm wording.
- Velocity head is described as "usually well under a foot" for 2 to 8 ft/s (0.06 to 1.0 ft); borderline at 8 ft/s, which gives 0.99 ft.
- Cause-to-symptom table entries (for example "tight packing" for high power draw) are recognition-level and not exhaustive.
- Module 1 lesson exceeds the word target by about 86 words.
- Fictional scenario names (Larkspur Hollow, Brightwater Bluffs, Cedar Fork, Willow Gap, Marsh Landing, Pine Terrace, Heron Bay) were not checked against real places.
- The energy example's per-kWh price (0.10) is a fictional figure and is not given in any question.

## Diagrams

Six original inline SVG figures were added to module lessons (viewBox-only, role="img", aria-label and title, blue #2f6db2 plus greys, each under 3 KB). Drawn from scratch; no outside images used.

- Module 1: pressure at depth, wide and narrow tank, 0/10/20 ft = 0/4.33/8.66 psi (0.433 psi per ft), after the "elevated tanks" paragraph.
- Module 2: reducer with velocity arrows and Q = A x V, after the continuity "most tested idea" paragraph.
- Module 3: suction lift versus suction head layouts with TDH terms, after the pressurised-tank sentence in the TDH section.
- Module 3: pump curve and system curve crossing at the operating point (qualitative, no numbers), after "ask which curve moved".
- Module 4: water hammer pressure trace (qualitative), after the water hammer paragraph.
- Module 4: valve recognition strip (gate, globe, ball, butterfly, check), after "Throttling versus isolation".

Reviewer notes: the pump-curve and water-hammer shapes are schematic only. The TDH formulas shown for lift and head layouts take static discharge head from the pump centreline.
