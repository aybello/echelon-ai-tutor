# BUILD NOTES: class2-ww (Ontario Class 2 Wastewater Treatment)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (c2ww-ladder01..100) | 100 |
| build-process | 0 | 100 (c2ww-process01..100) | 100 |
| find-calculation-error | 0 | 100 (c2ww-error01..100) | 100 |
| evidence-detective | 0 | 100 (c2ww-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (c2ww-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 278,624 bytes). Each
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
  records (class2-ww/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
  A quarter of the ladder computation records are expressed in a
  non-expected convertible unit, exercising the conversion path.
- Error families are even at 10 per topic: SRT, F/M, oxygen
  requirements, WAS/RAS mass balance, clarifier solids loading, digester
  loading, alkalinity for nitrification, multi-stage removal, SVI, and
  chemical feed. The author patched three wrong-line labels that showed
  non-terminating decimals before delivery.
- Evidence tasks: 100 unique prompts, correct answers balanced
  (inference 25/25/25/25), zero overlap with the Class 1 wastewater
  evidence set, each keyed inference the only option consistent with all
  observations.
- Em dash check: zero occurrences in all task and verify files.

## Grounding

No dedicated Class 2 bank folder exists in the repo, so per the build
rule this course proceeds on the closest matching bank structure,
content/class1-treatment (the class1-wastewater bank), deepened to the
Class 2 scope in the OWWCO and WPI Need-to-Know progression (recorded
in AUTHORING-BRIEF.md): SRT and F/M process control, nitrification and
denitrification, alkalinity at 7.14 mg as CaCO3 per mg ammonia nitrogen,
aeration and DO control, digester loading and volatile solids reduction,
and laboratory process control. Sources are listed in sources.json
(Spellman Handbook, US EPA municipal wastewater and process control
guidance, OWWCO, WPI 2025 Need-to-Know for Wastewater Treatment Class
II, Ontario Regulation 129/04, CCOHS). The Drive textbooks Ay mentioned
were inventoried (SOURCES.md in the build root): none are reachable in
the connected Drive, so no task cites a Drive textbook yet; a
re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and task level is an
  enum of "oit" and "class1" with no class2 value. This package uses
  the real registry courseKey "class2-ww" and level "class1" as the
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
