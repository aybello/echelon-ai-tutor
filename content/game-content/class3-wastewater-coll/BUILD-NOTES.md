# BUILD NOTES: class3-wastewater-coll (Ontario Class 3 Wastewater Collection)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (c3wc-ladder01..100) | 100 |
| build-process | 0 | 100 (c3wc-process01..100) | 100 |
| find-calculation-error | 0 | 100 (c3wc-error01..100) | 100 |
| evidence-detective | 0 | 100 (c3wc-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (c3wc-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 257,348 bytes). Each
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
  records (class3-wastewater-coll/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics: infiltration and inflow (15), rainfall dependent
  inflow (5), peaking and design flows (15), wet well cycling and pump
  capacity (15), force main velocity and detention (12), rehabilitation
  quantities (12), cleaning and CCTV program production and completion
  (10), surcharge and storage volumes (8), odour control dosing (8).
- Error families target Class 3 failure modes: infiltration, inflow and
  rainfall volume errors (15), peaking factor applied to the wrong base
  (15), wet well cycling and pump capacity slips (15), force main
  velocity and detention errors (15), rehabilitation quantity errors
  (15), program completion percentage and production errors (13), odour
  dosing, sulfide load and solution feed errors (12).
- Process topics: CMOM program leadership (10), infiltration and inflow
  program design (12), lift station reliability (10), force main
  management (4), odour and sulfide corrosion management (10), fats
  oils and grease program leadership (10), rehabilitation planning and
  prioritization (12), overflow and bypass response leadership (12),
  asset management and capital planning (10), supervisory and overall
  responsible operator workflows (10).
- Evidence tasks: 100 unique prompts at Class 3 depth (supervisory and
  audit cases 15, infiltration and inflow and rainfall dependent inflow
  investigations 15, lift station failure and reliability 14, overflow
  and bypass cause investigations 11, rehabilitation effectiveness 10,
  odour and sulfide corrosion 10, force main and air valve cases 9,
  fats oils and grease program cases 5, CMOM planning, flow monitoring,
  condition assessment and blockage cases 11), each keyed inference the
  only option consistent with all observations.
- Em dash check: zero occurrences in all task, verify and package
  files. The one folder grep match is the escaped codepoint inside a
  generator script's own no-em-dash assertion, not content.

## Grounding

No dedicated Class 3 collection bank folder exists in the repo, so per
the build rule this course proceeds on the closest matching bank
structure, content/class1-networks (the bank used for
class1-wastewater-coll), deepened through the Class 2 build to the
Class 3 scope in the OWWCO and WPI Need-to-Know progression (recorded
in AUTHORING-BRIEF.md): collection system management at system scale,
CMOM style program leadership, infiltration and inflow reduction
program design and effectiveness analysis with given values, lift
station and force main reliability programs, odour and sulfide
corrosion management with given factors, fats oils and grease program
leadership, rehabilitation planning and prioritization, overflow
response leadership, asset management awareness, supervisory duties,
and Ontario Regulation 129/04 at the Class 3 level. Exponential and
logarithmic numerics are avoided; all work uses given coefficients,
rates and factors. Sources are listed in sources.json (Spellman
Handbook, US EPA CMOM Guide, US EPA Alternative Wastewater Collection
Systems Manual, OWWCO, WPI Wastewater Collection Class III
Need-to-Know Criteria, Ontario Regulation 129/04, CCOHS). The Drive
textbooks Ay mentioned were inventoried (SOURCES.md in the build
root): none are reachable in the connected Drive, so no task cites a
Drive textbook yet; a re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and task level is an
  enum of "oit" and "class1" with no class3 value. This package uses
  the real registry courseKey "class3-wastewater-coll" and level
  "class1" as the documented placeholder throughout. The repo team must
  extend the schema enum and the registry allowlist, and map the level,
  before this package can be served.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each package, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board
  endorsed.
