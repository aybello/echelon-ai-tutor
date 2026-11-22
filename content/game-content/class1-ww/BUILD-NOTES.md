# BUILD NOTES: class1-ww (Ontario Class 1 Wastewater Treatment)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (c1ww-ladder01..100) | 100 |
| build-process | 0 | 100 (c1ww-process01..100) | 100 |
| find-calculation-error | 0 | 100 (c1ww-error01..100) | 100 |
| evidence-detective | 0 | 100 (c1ww-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (c1ww-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 254,885 bytes). Each
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
  records (class1-ww/verify.json, 200 records): ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Error tasks were generated with exact Fraction arithmetic so that every
  line before firstWrongLineId is correct by construction; first wrong
  line distribution: line 2 in 53 tasks, line 3 in 34, line 4 in 13.
- Evidence tasks: correct answers balanced across positions (inference
  25/25/25/25, next-clue 34/33/33), 100 unique prompts, each keyed
  inference the only option consistent with all observations.
- Em dash check: zero occurrences in all task and verify files.

## Grounding

Scope and topic vocabulary follow the repo's Class 1 wastewater bank
(destination bank class1-wastewater, authored in content/class1-treatment:
250 wastewater candidates, 200 conceptual and 50 worked calculations) and
the OWWCO and WPI 2025 Need-to-Know scope recorded in that package's
SOURCES.md. Coverage: flow and characteristics, preliminary treatment,
primary clarification, activated sludge (the largest block in every
mode), trickling filters and RBCs, secondary clarification, effluent
disinfection, solids handling and digestion, sampling and laboratory
basics, pumps and wet wells, safety and instrumentation. Sources are
listed in sources.json (Spellman Handbook, US EPA municipal wastewater
and start-up resources, OWWCO, WPI 2025 Need-to-Know, Ontario Regulation
129/04, CCOHS). The Drive textbooks Ay mentioned were inventoried
(SOURCES.md in the build root): none are reachable in the connected
Drive, so no task cites a Drive textbook yet; a re-citation pass is
queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and task level is an
  enum of "oit" and "class1". This package uses the real registry
  courseKey "class1-ww" and level "class1" throughout, the closest pilot
  convention. The repo team must extend the schema enum and the registry
  allowlist before this package can be served.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each package, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board
  endorsed.
