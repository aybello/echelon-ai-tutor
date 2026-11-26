# BUILD NOTES: class3-water (Ontario Class 3 Water Treatment)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (c3w-ladder01..100) | 100 |
| build-process | 0 | 100 (c3w-process01..100) | 100 |
| find-calculation-error | 0 | 100 (c3w-error01..100) | 100 |
| evidence-detective | 0 | 100 (c3w-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (c3w-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 250,475 bytes). Each
package carries the course sources list (sources.json in this folder,
8 sources) and computed SHA-256 receipts. Per-task sourceIds default to
the first listed source pending the human review pass.

## Verification

- tools/verify_tasks.py run on every worker file individually: ALL CHECKS
  PASSED for ladder (100, with its 100 computation records), process
  (100), error (100, with its 100 computation records), and evidence
  (100). Each file was then re-verified independently by the coordinator
  on arrival, same result.
- Merged set of all 400 tasks verified with the merged computation
  records (class3-water/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics: membrane recovery (12), chemical optimization (12),
  advanced CT (11), membrane flux (10), membrane area (10), membrane
  transmembrane pressure (10), UV dose (10), energy per volume (10),
  residuals (10), multi-unit mass balance (3), filter optimization (2).
- Error families target Class 3 failure modes: membrane flux conversion
  and flow-confusion slips (15), recovery and concentrate errors (15),
  transmembrane pressure averaging errors (10), UV dose errors (15),
  multi-unit mass balance stream errors (15), residuals solids fraction
  slips (15), energy, CT, and blending errors (15).
- Process topics: membrane plant operations (15), UV system operations
  and dose monitoring (10), process optimization and performance
  auditing (10), residuals management (10), chemical optimization
  programs (10), DWQMS risk assessment and operational planning (10),
  advanced laboratory quality programs (10), capital project
  commissioning (8), emergency preparedness and response leadership (9),
  supervisory and overall responsible operator workflows (8).
- Evidence tasks: 100 unique prompts at Class 3 depth (membrane fouling
  and integrity 18, UV and advanced oxidation 14, coagulation,
  clarification and filtration 16, disinfection strategy 12, residuals
  handling 10, energy and chemical waste 10, instrumentation and
  laboratory quality 12, regulatory and audit cases 8), each keyed
  inference the only option consistent with all observations.
- Em dash check: zero occurrences in all task and verify files.

## Grounding

No dedicated Class 3 water treatment bank folder exists in the repo, so
per the build rule this course proceeds on the closest matching bank
structure, content/class1-water, deepened to the Class 3 scope in the
OWWCO and WPI Need-to-Know progression (recorded in AUTHORING-BRIEF.md):
membrane flux, recovery, transmembrane pressure and cleaning, UV dose
with given intensity and exposure values, multi-unit mass balances,
residuals mass and volume, energy per volume, advanced CT, chemical
optimization, and DWQMS awareness. Exponential and logarithmic numerics
are avoided; membrane and UV work uses given unit rates and factors.
Sources are listed in sources.json (Spellman Handbook, US EPA membrane
filtration guidance, US EPA ultraviolet disinfection guidance, US EPA
Surface Water Treatment Rule, OWWCO, WPI 2025 Need-to-Know for Water
Treatment Class III, Ontario Regulation 170/03, Ontario Drinking Water
Quality Management Standard). The Drive textbooks Ay mentioned were
inventoried (SOURCES.md in the build root): none are reachable in the
connected Drive, so no task cites a Drive textbook yet; a re-citation
pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and task level is an
  enum of "oit" and "class1" with no class3 value. This package uses
  the real registry courseKey "class3-water" and level "class1" as the
  documented placeholder throughout. The repo team must extend the
  schema enum and the registry allowlist, and map the level, before
  this package can be served.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each package, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board
  endorsed.
