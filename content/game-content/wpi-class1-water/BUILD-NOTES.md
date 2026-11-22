# BUILD NOTES: wpi-class1-water (WPI Class 1 Water Treatment, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp1w-ladder01..100) | 100 |
| build-process | 0 | 100 (wp1w-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp1w-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp1w-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp1w-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 278,975 bytes). Each
package carries the course sources list (sources.json in this folder,
6 sources) and computed SHA-256 receipts. Per-task sourceIds default to
the first listed source pending the human review pass.

## Verification

- tools/verify_tasks.py run on every worker file individually: ALL CHECKS
  PASSED for ladder (100, with its 100 computation records), process
  (100), error (100, with its 100 computation records), and evidence
  (100). Each file was then re-verified independently by the coordinator
  on arrival, same result.
- Merged set of all 400 tasks verified with the merged computation
  records (wpi-class1-water/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics: detention time (10), flow conversions (10), tank
  volumes (10), sedimentation surface loading (10), filtration rates
  and backwash (10), disinfection dose, demand, residual and CT (10),
  chemical feed mass (10), chemical feed solution strength (10),
  percent removal (10), pumps: head and pressure at 9.81 kPa per metre,
  run time and velocity (10).
- Error families target Class 1 failure modes: detention time
  inversions and series versus parallel slips (13), chlorine and CT
  errors (15), chemical feed strength, dilution and rate errors (18),
  filtration loading and backwash errors (13), tank volume slips (12),
  flow conversion errors (11), percent removal mistakes (9),
  sedimentation loading errors (9).
- Process topics, ten themes of ten: plant start up and routine
  operations, coagulation, flocculation and sedimentation routines,
  filtration routines, disinfection and residual monitoring, sampling
  routines, chemical handling and feed, pumps and equipment checks,
  cold weather operations, safety routines, record keeping, operator
  duties and emergency response.
- Evidence tasks: 100 unique prompts at Class 1 depth in western
  Canadian settings (filtration 17, sampling and laboratory 13,
  disinfection and chlorine 12, pumps and equipment 11, sedimentation
  9, coagulation and flocculation 9, taste and odour 9, instrumentation,
  chemical feed, safety, records, storage and source cases 20), each
  keyed inference the only option consistent with all observations.
  Cold climate operation is woven through at least 10 cases.
- Em dash check: zero occurrences in all task, verify and package
  files. Any folder grep match is the escaped codepoint inside a
  generator script's own no-em-dash assertion, not content.
- Framing check: zero occurrences of Ontario regulation references in
  the delivered files; regulation framing is generic (provincial
  drinking water requirements, Guidelines for Canadian Drinking Water
  Quality).

## Grounding

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Treatment Class I in a western Canadian context. The closest
matching bank structure in the repo is content/class1-water,
transposed out of the Ontario framing: sources and protection,
coagulation, flocculation and sedimentation, filtration, disinfection
and chlorine residual management, basic chemistry and sampling, pumps
and equipment, safety, and Class I operator duties, including cold
climate operation. Regulation framing stays generic and accurate:
provincial drinking water requirements in general terms and the
Guidelines for Canadian Drinking Water Quality as the federal
reference; no Ontario regulations are cited and no provincial
regulation numbers are invented. Sources are listed in sources.json
(Spellman Handbook, WPI 2025 Need-to-Know for Water Treatment Class I,
Health Canada Guidelines for Canadian Drinking Water Quality, US EPA
Small Drinking Water Systems Handbook, US EPA Surface Water Treatment
Rule guidance as background, CCOHS). The Drive textbooks Ay mentioned
were inventoried (SOURCES.md in the build root): none are reachable in
the connected Drive, so no task cites a Drive textbook yet; a
re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today. This package uses
  the real registry courseKey "wpi-class1-water". The level value
  "class1" is the natural enum value for this Class I course, so for
  the WPI Class 1 courses the remaining blocker is the courseKey
  allowlist extension, recorded here for the repo team.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each package, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board
  endorsed.
