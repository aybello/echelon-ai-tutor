# BUILD NOTES: class2-wastewater-coll (Ontario Class 2 Wastewater Collection)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (c2wc-ladder01..100) | 100 |
| build-process | 0 | 100 (c2wc-process01..100) | 100 |
| find-calculation-error | 0 | 100 (c2wc-error01..100) | 100 |
| evidence-detective | 0 | 100 (c2wc-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (c2wc-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 252,036 bytes). Each
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
  records (class2-wastewater-coll/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Error families target Class 2 failure modes: infiltration and inflow
  basis confusion (20), rainfall dependent inflow coefficient errors
  (15), liner area from diameter instead of circumference (15), firm
  capacity with the largest pump left in service (in the 14-task wet
  well family), completion percentages over the wrong denominator (12).
- Evidence tasks: 100 unique prompts in even blocks of 10 per system
  area, zero overlap with the Class 1 collection evidence set, each
  keyed inference the only option consistent with all observations,
  with control basins and before and after monitoring built in where a
  program effectiveness claim could otherwise be arguable.
- Em dash check: zero occurrences in all task and verify files.

## Grounding

No dedicated Class 2 bank folder exists in the repo, so per the build
rule this course proceeds on the closest matching bank structure,
content/class1-networks (the class1-wastewater-coll bank), deepened to
the Class 2 scope in the OWWCO and WPI Need-to-Know progression
(recorded in AUTHORING-BRIEF.md): CMOM program development, condition
assessment and rehabilitation programs, rainfall dependent infiltration
and inflow analysis, lift station reliability and firm capacity, force
main management, odour and sulfide programs, and FOG program
administration. Sources are listed in sources.json (Spellman Handbook,
US EPA CMOM Guide, US EPA Alternative Wastewater Collection Systems
Manual, OWWCO, WPI Collection Class II criteria, Ontario Regulation
129/04, CCOHS). The Drive textbooks Ay mentioned were inventoried
(SOURCES.md in the build root): none are reachable in the connected
Drive, so no task cites a Drive textbook yet; a re-citation pass is
queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and task level is an
  enum of "oit" and "class1" with no class2 value. This package uses
  the real registry courseKey "class2-wastewater-coll" and level
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
