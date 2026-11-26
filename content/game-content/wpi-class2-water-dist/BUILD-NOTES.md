# BUILD NOTES: wpi-class2-water-dist (WPI Class 2 Water Distribution, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp2wd-ladder01..100) | 100 |
| build-process | 0 | 100 (wp2wd-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp2wd-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp2wd-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp2wd-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 283,808 bytes). Each
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
  records (wpi-class2-water-dist/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics, ten of ten: water balance and non-revenue water,
  night flow leakage, pressure and head, storage turnover and water
  age, flushing volumes, pump energy, break flow estimates, demand
  forecasting with given growth values, affinity laws and given rate
  head loss, chlorine residual arithmetic with given decline rates.
- Error families target Class 2 failure modes: water balance
  component omissions (16), non-revenue water denominator errors
  (16), night flow leakage slips (16), pressure zone head mistakes
  (16), storage turnover and water age errors (14), pump energy slips
  (8), chlorine management errors (5), pump affinity confusions (4),
  flushing design slips (4), metering accuracy (1). The error worker
  hand audited a 20 task sample across all families confirming each
  flagged line is the first error.
- Process topics, ten themes of ten: pressure zone management
  programs, water loss control programs, water quality management
  programs, flushing program design, storage management programs,
  pump station operations, cross connection control program
  routines, main break program analysis, supervisory routines, cold
  climate operations.
- Evidence tasks: 100 unique prompts at Class 2 depth in western
  Canadian settings (water quality programme cases 20, water loss
  investigations 17, pressure zone puzzles 15, storage management
  investigations 14, pump station performance cases 14, cross
  connection incidents 11, main break pattern analysis 11), each
  keyed inference the only option consistent with all observations,
  with district metering datasets and paired zone comparisons built
  in where a case could be arguable.
- Em dash check: zero occurrences in all task, verify and package
  files. Any folder grep match is the escaped codepoint inside a
  generator script's own no-em-dash assertion, not content.
- Framing check: zero occurrences of Ontario regulation references in
  the delivered files; regulation framing is generic (provincial
  drinking water requirements, Guidelines for Canadian Drinking Water
  Quality).

## Grounding

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Distribution Class II in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, deepened from the WPI Class 1 build:
pressure zone management, water loss and non-revenue water basics,
water quality management programs, main break and leak program
analysis, pump station operations, cross connection control program
awareness, and supervisory awareness, including cold climate
operation. Regulation framing stays generic and accurate: provincial
drinking water requirements in general terms and the Guidelines for
Canadian Drinking Water Quality as the federal reference; no Ontario
regulations are cited and no provincial regulation numbers are
invented. Sources are listed in sources.json (Spellman Handbook,
WPI 2025 Need-to-Know for Water Distribution Class II, Health Canada
Guidelines for Canadian Drinking Water Quality, AWWA water loss
control guidance as background, US EPA distribution guidance as
background, CCOHS). The Drive textbooks Ay mentioned were
inventoried (SOURCES.md in the build root): none are reachable in the
connected Drive, so no task cites a Drive textbook yet; a re-citation
pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and the task level
  enum holds only "oit" and "class1". This package uses the real
  registry courseKey "wpi-class2-water-dist" and level "class1" as the
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
