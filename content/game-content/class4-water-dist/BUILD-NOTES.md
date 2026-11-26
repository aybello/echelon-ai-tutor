# BUILD NOTES: class4-water-dist (Ontario Class 4 Water Distribution)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (c4wd-ladder01..100) | 100 |
| build-process | 0 | 100 (c4wd-process01..100) | 100 |
| find-calculation-error | 0 | 100 (c4wd-error01..100) | 100 |
| evidence-detective | 0 | 100 (c4wd-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (c4wd-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 320,268 bytes). Each
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
  records (class4-water-dist/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics: system water balance (8), water loss components (4),
  zone demand forecasting with given growth and peaking factors (13),
  storage sizing and turnover (13), pump energy benchmarking (13),
  booster disinfection program quantities (13), flushing program
  volumes (12), sampling program design counts under Regulation 170/03
  (12), renewal program quantities with given unit rates (12).
- Error families target Class 4 failure modes: system water balance
  component omissions, double counts and wrong percent denominators
  (20), demand forecast growth double counts and omissions (20),
  storage strategy turnover and sizing errors (18), pump energy
  benchmark efficiency inversions (14), booster disinfection program
  quantity errors (14), renewal program percent and quantity errors
  (14).
- Process topics, ten themes of ten: distribution utility management
  programs, water quality strategy, water loss strategy and audit
  leadership, pressure and storage strategy, asset management and
  capital planning, Drinking Water Quality Management Standard
  management review for distribution, emergency management leadership,
  energy strategy for pumping, cross connection program strategy,
  overall responsible operator and supervisory leadership.
- Evidence tasks: 100 unique prompts at Class 4 depth, ten families of
  ten (water loss strategy and district metering, pressure management
  and audit leadership, storage nitrification strategy, DWQMS audit and
  management review findings, asset renewal and capital priority,
  emergency and adverse event leadership, energy strategy, cross
  connection program strategy, water quality strategy, storage and
  pressure strategy judgement), each keyed inference the only option
  consistent with all observations.
- Em dash check: zero occurrences in all task and verify files.

## Grounding

No dedicated Class 4 distribution bank exists in the repo (a partial
Class 3 structure exists), so per the build rule this course proceeds
on the closest complete matching bank structure, content/class1-networks
(the bank used for class1-water-dist), deepened through the Class 2
and Class 3 builds to the Class 4 scope in the OWWCO and WPI
Need-to-Know progression (recorded in AUTHORING-BRIEF.md): distribution
utility management, system wide water quality strategy, water loss
strategy and audit leadership with given values, pressure and storage
strategy at system scale, asset management strategy and capital
planning leadership, DWQMS leadership for distribution operations, risk
and emergency leadership, pumping energy strategy, supervisory
leadership, and Ontario Regulation 170/03 at the Class 4 level.
Exponential and logarithmic numerics and Hazen-Williams are avoided;
all work uses given values, rates and factors. Sources are listed in
sources.json (Spellman Handbook, US EPA Small Drinking Water Systems
Handbook, US EPA Cross-Connection Control Manual, US EPA EPANET and
manual, OWWCO, WPI Water Distribution Class IV Need-to-Know Criteria,
Ontario Regulation 170/03, CCOHS). The Drive textbooks Ay mentioned
were inventoried (SOURCES.md in the build root): none are reachable in
the connected Drive, so no task cites a Drive textbook yet; a
re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and task level is an
  enum of "oit" and "class1" with no class4 value. This package uses
  the real registry courseKey "class4-water-dist" and level "class1" as
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
