# BUILD NOTES: wpi-class2-water (WPI Class 2 Water Treatment, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp2w-ladder01..100) | 100 |
| build-process | 0 | 100 (wp2w-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp2w-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp2w-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp2w-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 281,288 bytes). Each
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
  records (wpi-class2-water/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics: disinfection CT with baffling factors (12), chemical
  feed corrected for purity and solution strength (12), pump affinity
  laws (12), filtration performance (14), lime soda ash softening (10),
  iron and manganese treatment (10), laboratory QA: percent recovery,
  RPD, dilution correction, standard preparation (12), sedimentation
  (9), coagulation chemistry and jar test alum mass (9).
- Error families target Class 2 failure modes: CT and baffling factor
  errors (18), chemical feed purity and solution strength errors (22),
  affinity law exponent slips (16), softening demand mistakes (16),
  filtration performance slips (16), dilution and laboratory errors
  (12). The error worker audited a line by line sample confirming each
  flagged line is the first error.
- Process topics, ten themes of ten: coagulation optimization and jar
  test programs, softening operations, iron and manganese treatment,
  disinfection strategy and CT management, filter performance programs,
  chemical program management, laboratory QA/QC programs, process
  troubleshooting programs, supervisory routines, cold climate
  operations.
- Evidence tasks: 100 unique prompts at Class 2 depth in western
  Canadian settings (coagulation optimization and jar tests 15,
  chemical feed verification 15, filtration and membranes 14, CT and
  tracer cases 12, disinfection strategy 13, softening 11, iron and
  manganese 10, laboratory QA 10), each keyed inference the only option
  consistent with all observations, most cases closed with a direct
  check or paired train comparison.
- Em dash check: zero occurrences in all task, verify and package
  files. Any folder grep match is the escaped codepoint inside a
  generator script's own no-em-dash assertion, not content.
- Framing check: zero occurrences of Ontario regulation references in
  the delivered files; regulation framing is generic (provincial
  drinking water requirements, Guidelines for Canadian Drinking Water
  Quality).

## Grounding

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Treatment Class II in a western Canadian context. The closest
matching bank structure in the repo is content/class1-water, deepened
from the WPI Class 1 build: CT with baffling factors, purity corrected
chemical feed, jar test interpretation and coagulation optimization,
lime soda ash softening awareness, pump affinity laws with given
ratios, filtration performance analysis, iron and manganese treatment,
disinfection strategy basics, laboratory QA/QC, troubleshooting and
supervisory awareness, including cold climate operation. Regulation
framing stays generic and accurate: provincial drinking water
requirements in general terms and the Guidelines for Canadian Drinking
Water Quality as the federal reference; no Ontario regulations are
cited and no provincial regulation numbers are invented. Sources are
listed in sources.json (Spellman Handbook, WPI 2025 Need-to-Know for
Water Treatment Class II, Health Canada Guidelines for Canadian
Drinking Water Quality, US EPA Small Drinking Water Systems Handbook,
US EPA Surface Water Treatment Rule guidance as background, CCOHS).
The Drive textbooks Ay mentioned were inventoried (SOURCES.md in the
build root): none are reachable in the connected Drive, so no task
cites a Drive textbook yet; a re-citation pass is queued if they are
shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and the task level
  enum holds only "oit" and "class1". This package uses the real
  registry courseKey "wpi-class2-water" and level "class1" as the
  documented placeholder for a Class II course; the repo team must
  extend the enum and the registry allowlist before this package can
  be served.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each package, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board
  endorsed.
