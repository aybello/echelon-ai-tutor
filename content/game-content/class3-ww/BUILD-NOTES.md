# BUILD NOTES: class3-ww (Ontario Class 3 Wastewater Treatment)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (c3ww-ladder01..100) | 100 |
| build-process | 0 | 100 (c3ww-process01..100) | 100 |
| find-calculation-error | 0 | 100 (c3ww-error01..100) | 100 |
| evidence-detective | 0 | 100 (c3ww-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (c3ww-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 256,687 bytes). Each
package carries the course sources list (sources.json in this folder,
7 sources) and computed SHA-256 receipts. Per-task sourceIds default to
the first listed source pending the human review pass.

## Verification

- tools/verify_tasks.py run on every worker file individually: ALL CHECKS
  PASSED for ladder (100, with its 100 computation records), process
  (100), error (100, with its 100 computation records), and evidence
  (100). Each file was then re-verified independently by the coordinator
  on arrival, same result.
- Merged set of all 400 tasks verified with the merged computation
  records (class3-ww/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics: solids retention time and solids inventory control
  (12), food to microorganism ratio (10), sludge volume index (8),
  clarifier solids loading (8), clarifier hydraulic loading and
  detention (8), return and waste sludge optimization (10),
  nitrification alkalinity and oxygen (8), nutrient removal chemicals
  (8), digestion loading, reduction and gas (10), dewatering capture
  and cake (8), multi-unit mass balances (10).
- Error families target Class 3 failure modes: solids retention time
  and wasting errors (14), food to microorganism conversion and ratio
  slips (13), sludge volume index factor errors (13), clarifier loading
  mistakes including return flow wrongly included or omitted (15),
  digestion volatile solids percent and reduction errors (15),
  dewatering capture, cake and polymer errors (12), nutrient chemical
  ratio errors including the 7.14 alkalinity factor (10), multi-unit
  mass balance stream errors (8).
- Process topics: advanced activated sludge process control programs
  (15), biological nutrient removal optimization (15), clarifier
  operations (10), digestion operations (10), dewatering and biosolids
  programs (10), effluent compliance management (10), process auditing
  and optimization trials (10), laboratory quality programs (8),
  emergency response leadership (6), supervisory and overall
  responsible operator workflows (6).
- Evidence tasks: 100 unique prompts at Class 3 depth (activated sludge
  bulking, foaming and process control 17, nitrification 14,
  denitrification 7, phosphorus removal 10, secondary clarifier
  operations 11, digestion 12, dewatering and biosolids 8, effluent
  compliance 7, energy and chemical optimization 4, instrumentation and
  laboratory quality 5, supervisory and audit 5), each keyed inference
  the only option consistent with all observations.
- Em dash check: zero occurrences in all task and verify files.

## Grounding

No dedicated Class 3 wastewater treatment bank folder exists in the
repo, so per the build rule this course proceeds on the closest matching
bank structure, content/class1-treatment (the bank used for class1-ww),
deepened through the Class 2 build to the Class 3 scope in the OWWCO
and WPI Need-to-Know progression (recorded in AUTHORING-BRIEF.md):
advanced activated sludge control, biological nutrient removal
optimization, solids retention time and food to microorganism control
with given values, clarifier solids loading and blanket management,
digestion loading and volatile solids accounting with given factors,
dewatering and biosolids quantities, effluent compliance management,
process auditing, supervisory duties, and Ontario Regulation 129/04 at
the Class 3 level. Exponential and logarithmic numerics are avoided;
all kinetics style work uses given rates and factors. Sources are
listed in sources.json (Spellman Handbook, US EPA municipal wastewater
resources, US EPA process control and nutrient removal guidance,
OWWCO, WPI 2025 Need-to-Know for Wastewater Treatment Class III,
Ontario Regulation 129/04, CCOHS). The Drive textbooks Ay mentioned
were inventoried (SOURCES.md in the build root): none are reachable in
the connected Drive, so no task cites a Drive textbook yet; a
re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and task level is an
  enum of "oit" and "class1" with no class3 value. This package uses
  the real registry courseKey "class3-ww" and level "class1" as the
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
