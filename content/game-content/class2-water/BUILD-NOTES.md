# BUILD NOTES: class2-water (Ontario Class 2 Water Treatment)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (c2w-ladder01..100) | 100 |
| build-process | 0 | 100 (c2w-process01..100) | 100 |
| find-calculation-error | 0 | 100 (c2w-error01..100) | 100 |
| evidence-detective | 0 | 100 (c2w-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (c2w-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 259,051 bytes). Each
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
  records (class2-water/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Error families are targeted at Class 2 failure modes: baffling factor
  forgotten or inverted in CT (20), purity used as a whole number or
  applied twice (20), affinity law exponents missed (16), softening
  demands applied to the wrong hardness fraction (12).
- Evidence tasks: 100 unique prompts at Class 2 depth (trends, jar
  results, CT and tracer data, paired-train comparisons), each keyed
  inference the only option consistent with all observations.
- Em dash check: zero occurrences in all task and verify files.

## Grounding

No dedicated Class 2 bank folder exists in the repo, so per the build
rule this course proceeds on the closest matching bank structure,
content/class1-water, deepened to the Class 2 scope in the OWWCO and
WPI Need-to-Know progression (recorded in AUTHORING-BRIEF.md): CT with
baffling factors, purity and solution strength corrected chemical feed,
lime soda ash softening, pump affinity laws, enhanced sedimentation,
membrane awareness, laboratory QA/QC, and Regulation 170/03 adverse
response awareness. Sources are listed in sources.json (Spellman
Handbook, US EPA surface water treatment guidance, US EPA Small
Drinking Water Systems Handbook, OWWCO, WPI 2025 Need-to-Know for Water
Treatment Class II, Ontario Regulation 170/03, CCOHS). The Drive
textbooks Ay mentioned were inventoried (SOURCES.md in the build root):
none are reachable in the connected Drive, so no task cites a Drive
textbook yet; a re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and task level is an
  enum of "oit" and "class1" with no class2 value. This package uses
  the real registry courseKey "class2-water" and level "class1" as the
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
