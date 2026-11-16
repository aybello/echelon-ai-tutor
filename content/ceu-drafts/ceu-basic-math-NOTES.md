# Basic Math for Water and Wastewater Operators: draft notes

Draft only. Not committed, not registered in `server/ceu/catalogue.ts`. Key `ceu-basic-math`, version `2026-11-16.1`, plannedMinutes 210 (module activity minutes 53/53/52/52 = 210), non-credit pilot wording copied from the existing courses. No approved CEUs or contact hours are implied.

`stream` is `drinking_water` because the schema allows only one value. The content is shared with wastewater operators (pounds formula, loading rates, BOD/TSS removal); the catalogue entry should say so.

## Counts
- 4 modules (`number-skills`, `units-conversions`, `areas-volumes`, `plant-formulas`), 6 quick checks each (24); objective = module id.
- 20 final questions (5 per module, interleaved) and 20 alternate questions. All 64 prompts unique. Correct positions exactly balanced: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5.
- Calculations: 16 of 20 finals (80 percent), 16 of 20 alternates, 21 of 24 checks. Every calculation question states its own constants. No correct numeric answer equals a number in its prompt (checked by script).
- Every number was generated and then re-derived by a separate `python3 -I` script that hard-codes the expected values; all 52 calculation questions and all lesson worked examples matched. No question has an all/none/both option. Each explanation names the mistake behind every distractor.
- Lesson word counts excluding figures: 1,061 / 980 / 1,041 / 1,026. Each has at least four worked examples with units. Module 2 is slightly under 1,000 words.
- Figures: 5 original inline SVGs (module 1: fraction-decimal-percent strip; module 2: unit-cancellation of 2.5 MGD to 1,736 gpm; module 3: area and volume shapes, and tank depth-from-volume 22,440 gal / 7.48 / 600 sq ft = 5.0 ft; module 4: pounds formula triangle). Each under 2.1 KB, viewBox only, no style attributes, colours #1d2d40 / #2f6db2 / greys, text 12 units or larger. Rendered at 390 px with Playwright and inspected; the unit-cancellation strike marks were redrawn after the first render.

## Sources (HTTP 200 checked with `curl -sIL -m 20`, 2026-11-16)
1. https://dnr.wisconsin.gov/sites/default/files/topic/OpCert/DWSGSurfaceWater.pdf (downloaded; Chapter 4 Section 4.2 lists detention time and chlorine feed rate calculations)
2. https://www.waterboards.ca.gov/drinking_water/certlic/occupations/documents/opcert/2016/treat_range_of_know.pdf (downloaded; lists flow rate, storage volume, detention time and gpm-to-MGD conversion)
3. https://www.owp.csus.edu/courses/ (landing page)
4. https://www.epa.gov/npdes/npdes-training (landing page)

The state math PDFs named in the dossiers (Louisiana math sheet, Kentucky distribution math guide, NH wastewater formula sheet) returned 403 to curl and were not used as sources. Sources 3 and 4 are landing pages, not math manuals; a reviewer should replace them with a confirmed math manual if one is found.

## Constants used
- 7.48 gal per cu ft (1 cu ft = 28.3 L; 1 gal = 3.785 L); 27 cu ft per cu yd (0.765 cu m); 12 in per ft (25.4 mm per in; 1 ft = 0.305 m); 1 sq ft = 0.0929 sq m
- 1,440 min per day; 60 s per min; 1,000,000 gal per MG
- 694.4 gpm per MGD (1 MGD = 43.8 L/s); 1.547 cfs per MGD (1 cfs = 28.3 L/s); 1 gpm = 0.0631 L/s
- 8.34 lb per gal; 62.4 lb per cu ft; 1 mg/L = 1 ppm; 1 percent = 10,000 mg/L
- C = (F - 32) x 5/9; F = C x 9/5 + 32
- Circle area = 0.785 x d x d = 3.14 x r x r; triangle 0.5 x b x h; cone 1/3 x base area x height; pipe diameter in inches / 12 = feet
- lb/day = mg/L x MGD x 8.34; detention time (h) = volume / flow in gal/day x 24; SOR = flow in gal/day / area; weir overflow = flow in gal/day / weir length (circular weir length = 3.14 x d); percent removal = (in - out) / in x 100; percent strength = chemical / (chemical + water) x 100; C1 x V1 = C2 x V2
- 1 gal per day per sq ft = 0.0407 cu m per day per sq m (used once, in the lesson)

## Exam topics supported (only topics present in the repo dossiers)
| Module | Topic | Dossier evidence |
| --- | --- | --- |
| 1 Number skills and percent | Foundational arithmetic, percent, ratio, averages, math word problems | `nh-wastewater-treatment.md` (Grade 1 written exam includes math word problems), `ky-water-distribution.md` and `la-water-distribution.md` (state math guides/sheets) |
| 2 Units and conversions | Common unit conversions and equivalents (for example gpm to MGD), flow units | `ca-water-treatment.md` (T1 unit-conversion and flow calculations), `la-water-treatment.md` / `la-water-distribution.md` (math sheet of equivalents), `nh-wastewater-treatment.md` (common conversions) |
| 3 Areas and volumes | Tank volumes, area formulas | `ca-water-treatment.md` (volume in a storage facility), `nh-wastewater-treatment.md` (simple rectangular and circular tank volume), `la-water-treatment.md` (area formulas) |
| 4 Treatment-plant formulas | Detention time, dose and dosage, loading, percent removal, chlorine feed rate | `nh-wastewater-treatment.md` (daily loading, percent removal, detention time, dose), `wi-water-treatment.md` (detention time, chlorine feed rate, percent of production), `ca-water-treatment.md` (detention time) |

Dossiers I did not open in full (about 40 others also mention calculations or math) may support further topics; this table cites only the ones I read.

## Items I am unsure about
- The dossier-listed state math PDFs could not be verified (403), so no section-level claim is made for them. Sources 3 and 4 are generic; Wisconsin and California are the only sources I actually read, and only for their calculation lists.
- Weir overflow uses circumference = 3.14 x d; some manuals use the length of the weir only along the inside edge, and some state formula sheets use different rounding of pi. Confirm against your agency sheet.
- Worked example 2 in module 2 uses 0.5 percent = 5,000 mg/L as strength by mass-volume convention (1 percent = 10,000 mg/L), which is an approximation for strong solutions whose density differs from water.
- Percent strength by weight (module 4) ignores solution density; fine for exam-style problems.
- Some small distractor values are floating rounded (for example 0.00094 gpm); the rounding follows the same rule as the correct answer.
- Fictional place names (Alder Creek, Quillfeather Reservoir, Marlow Bend, Spruce Landing, Tern Harbor, Pine Ridge, Copper Fen) were not checked against real places.
- Module 4's quick check on reasonableness and the final question on doubling flow overlap in spirit with the lesson text; kept as distinct items.
