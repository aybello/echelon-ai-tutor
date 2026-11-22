# BUILD NOTES: class3-water-dist (Ontario Class 3 Water Distribution)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (c3wd-ladder01..100) | 100 |
| build-process | 0 | 100 (c3wd-process01..100) | 100 |
| find-calculation-error | 0 | 100 (c3wd-error01..100) | 100 |
| evidence-detective | 0 | 100 (c3wd-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (c3wd-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 292,409 bytes). Each
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
  records (class3-water-dist/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics: water loss audit (20), zone demand and peaking (15),
  storage volume (10), storage turnover and water age (10), pump energy
  and wire to water efficiency (10), chlorine booster dosing (10),
  pressure and head conversions at 9.81 kPa per metre (10), flushing
  volumes and velocities (10), Regulation 170/03 sampling program
  counts (5).
- Error families target Class 3 failure modes: peaking factor applied
  to the wrong demand base (15), storage turnover and water age
  inversions and dead storage slips (15), pump energy and efficiency
  inversion errors (14), water loss audit component and percentage
  errors (14), chlorine booster dosing conversion and strength errors
  (14), pressure and head factor slips (14), flushing volume and
  velocity errors (14).
- Process topics, ten themes of ten: multi-zone system operations,
  storage operations at system scale, pressure management programs,
  water quality and regulatory sampling programs under Regulation
  170/03, system water quality management, leak detection and water
  loss, main break and emergency response leadership, cross connection
  control program administration, asset management and capital
  planning, energy management, supervision and overall responsible
  operator workflows.
- Evidence tasks: 100 unique prompts at Class 3 depth (storage water
  quality, nitrification and turnover 12, water loss and leak
  localization 12, main break and contamination response 12, cross
  connection and backflow 12, pumping energy waste 12, sampling program
  and adverse results 12, asset condition and capital priority 14,
  supervisory, audit and pressure zone management 14), each keyed
  inference the only option consistent with all observations.
- Em dash check: zero occurrences in all task and verify files.

## Grounding

The repo holds a partial Class 3 distribution structure
(content/class3-water-dist) but no complete Class 3 bank, so per the
build rule this course proceeds on the closest complete matching bank
structure, content/class1-networks (the bank used for
class1-water-dist), deepened through the Class 2 build to the Class 3
scope in the OWWCO and WPI Need-to-Know progression (recorded in
AUTHORING-BRIEF.md): multi-zone system management, pressure zone and
elevated storage operations at system scale, system water quality
management, regulatory sampling program design, water loss accounting
with given audit values, emergency response leadership, cross
connection control program administration, asset management awareness,
pumping energy management, supervisory duties, and Ontario Regulation
170/03 at the Class 3 level. Exponential and logarithmic numerics and
Hazen-Williams are avoided; chlorine decay uses given per day factors
and pressure uses 9.81 kPa per metre of head. Sources are listed in
sources.json (Spellman Handbook, US EPA Small Drinking Water Systems
Handbook, US EPA Cross-Connection Control Manual, US EPA EPANET and
manual, OWWCO, WPI Water Distribution Class III Need-to-Know Criteria,
Ontario Regulation 170/03, CCOHS). The Drive textbooks Ay mentioned
were inventoried (SOURCES.md in the build root): none are reachable in
the connected Drive, so no task cites a Drive textbook yet; a
re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and task level is an
  enum of "oit" and "class1" with no class3 value. This package uses
  the real registry courseKey "class3-water-dist" and level "class1" as
  the documented placeholder throughout. The repo team must extend the
  schema enum and the registry allowlist, and map the level, before
  this package can be served.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each package, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board
  endorsed.
