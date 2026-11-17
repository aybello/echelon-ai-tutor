# Basic Safety for Water and Wastewater Operators: draft notes

Draft only. Not committed, not registered in `server/ceu/catalogue.ts`. Key `ceu-basic-safety`, version `2026-11-17.1`, plannedMinutes 180 (4 modules x 45 min), same non-credit pilot wording as the Hydraulics draft. `stream` is `drinking_water` because the schema allows one value; content serves wastewater operators too. No CEU or contact-hour claim anywhere.

## Counts
- 4 modules: `hazard-recognition`, `confined-spaces`, `energy-excavation-traffic`, `chemical-biological-emergency`; 6 checks each (24); 20 finals and 20 alternates (5 per module, interleaved). 64 unique ids and prompts.
- Answer positions: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5. Longest-choice heuristic for finals plus alternates: correct is longest in 47.5 percent (limit 50 percent), shortest in 5 percent. To get there, some wrong choices have a short trailing clause added by the build script; a reviewer may want to hand-polish those.
- Lesson words: 1,610 / 1,439 / 1,716 / 1,213. Four inline SVG figures: hierarchy of controls (M1), gas layers in a tank (M2), trench with spoil setback and ladder (M3), four parts of a work zone (M3).
- Checker: a `python3 -I` script enforcing the rules of `server/ceu/catalogue.test.ts` (4 modules, 6 checks, 5+5 finals per module, activity minutes = 180, at least 4 `###` headings, last activity names the final assessment, unique ids and prompts, 4 distinct choices, no em dash, "fictional" in evidence, source ids resolve, position balance, length heuristic) passed. The vitest was not run because the draft is not registered in the catalogue.
- Numeric answers re-derived by script and matched (ladder 4 to 1 base distances 6 ft and 5 ft; air change 5 min; ppm to percent 0.3; cylinder 1,131 ft3; incident rates 2.5 and 1.0). Lesson and scenario arithmetic also recomputed (vault 6 min, wet well 1,099.6 ft3, Pelican Run 1,131 ft3 / 3.0 min, evidence well 1,385.4 ft3 / 4.62 min, rates 3.0 and 2.0). No numeric answer equals a number in its prompt.

## Sources (HTTP 200 checked with `curl -sIL -m 20`, 2026-11-17)
Verified: https://www.cdc.gov/niosh/hierarchy-of-controls/ , https://www.cdc.gov/niosh/noise/ , https://www.cdc.gov/niosh/heat-stress/ , https://www.epa.gov/rmp (all 200).
Could not verify: every osha.gov page tried (confined-spaces, trenching-excavation, control-hazardous-energy, heat-exposure, noise, hazard-communication, wastewater-treatment) returned 403 to automated curl (CloudFront block), so no OSHA page is listed as a source and OSHA figures below rest on my knowledge of the standards, not on a fetched page. Several guessed cdc.gov NIOSH confined-space and hazmat URLs returned 404 and were not used. The EPA RMP page is only loosely tied to chlorine and chemical emergencies; a reviewer could add a better EPA or provincial page.

## Regulatory figures and constants used
- Oxygen 19.5 to 23.5 percent (US OSHA, commonly cited). 20.9 percent normal air.
- Hearing: 85 dBA action level (8-hour TWA) and 90 dBA permissible limit (US OSHA 1910.95). Canadian provinces differ; text says follow local rules.
- Excavation (US OSHA 1926 Subpart P): protective system generally at 5 ft (1.5 m); ladder, stair or ramp within 25 ft (7.6 m) of lateral travel for trenches 4 ft (1.2 m) or deeper; spoil at least 2 ft (0.6 m) from the edge; competent person inspects daily and after rain.
- US recordkeeping reporting times: fatality 8 hours; in-patient hospitalisation, amputation or eye loss 24 hours (lesson only, not in questions).
- Ladder 4 to 1 rule, 3 ft (1 m) extension above landing, three points of contact.
- 1 percent = 10,000 ppm. Volume of cylinder pi x d squared / 4 x depth; air change = volume / flow. Incident rate = cases x 200,000 / hours. SDS has 16 sections. 1 ft3 = 28.3 L; 1 ft = 0.3048 m.
- Heat acclimatisation "one to two weeks" and eyewash "commonly about 15 minutes" are general practice, stated loosely and deferred to local program or SDS.
- Not stated on purpose: H2S or LEL numeric limits, fall-protection trigger heights, glove or respirator selection numbers.

## Items a reviewer should confirm
- US OSHA figures above against the current CFR text (not fetched).
- The chlorine statements (heavier than air; do not apply water to a leaking container unless the plan directs) are standard training points, confirm against the plan and SDS wording you use.
- Hypochlorite plus ammonia described only generally ("irritating compounds").
- 811 is described as used by "many US states and Canadian provinces"; check.
- Scenario names (Cinder Ridge, Pelican Run, Alder Flats, Quarry Bend) are fictional and not checked against real places.
- Figures are schematic; trench and work-zone drawings are not to scale and not design drawings.

## Benchmark comparison
Not done. A coordinator message told me to read a competitor course text and compare, but my attempt to read that file was blocked by the permission system, so I did not read it and did not try to get around the block. Everything here was written from standard principles in line with the original brief. No benchmark comparison can be reported; if the owner still wants one, the read must be allowed (or the comparison run by a session that has access) and the course reviewed for gaps afterward.
