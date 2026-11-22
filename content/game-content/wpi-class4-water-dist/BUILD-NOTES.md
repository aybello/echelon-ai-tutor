# BUILD NOTES: wpi-class4-water-dist (WPI Class 4 Water Distribution, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp4wd-ladder01..100) | 100 |
| build-process | 0 | 100 (wp4wd-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp4wd-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp4wd-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp4wd-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 266,746 bytes). Each
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
  records (wpi-class4-water-dist/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics, ten groups of ten: water balance strategy, demand
  forecasting long range, capacity strategy, asset capital program,
  pressure management strategy, storage strategy, pump energy strategy,
  water quality strategy, flushing turnover programs, cold climate at
  scale.
- Error families target Class 4 failure modes: water audit strategy
  (18), demand and capacity strategy (18), renewal and capital program
  (18), pressure management savings (16), storage and energy balances
  (16), budget and funding arithmetic (14). The error worker re-parsed
  every printed line in all 100 tasks and confirmed each flagged line
  is genuinely the first error and every correctedLine evaluates
  exactly to its verify record.
- Process topics, ten blocks of ten: water loss strategy at utility
  scale, demand forecasting and long range capacity strategy, asset
  management and capital program leadership, pressure management
  strategy, water quality strategy and risk management, system
  optimization and benchmarking, utility management and governance,
  emergency management leadership, cold climate operations at utility
  scale, and regulatory leadership with senior decision making.
- Evidence tasks: 100 unique prompts at Class 4 depth in western
  Canadian settings, ten scenario groups of ten: water loss strategy,
  demand and capacity strategy, asset and capital program, pressure
  strategy, water quality risk, optimization and benchmarking,
  governance and regulatory, emergency leadership, cold climate
  utility, and energy and pumping strategy. The evidence worker ran a
  full manual audit of every keyed inference and clue pairing; twelve
  next-clue steps mis-keyed in the first pass were repaired in the
  generator and re-verified, so every keyed answer is consistent with
  its evidence, explanation, and clue text.
- Em dash check: zero occurrences in all task, verify and package
  files. Any folder grep match is the escaped codepoint inside a
  generator script's own no-em-dash assertion, not content.
- Framing check: zero occurrences of Ontario regulation references in
  the delivered files; regulation framing is generic (provincial
  drinking water requirements, Guidelines for Canadian Drinking Water
  Quality). Hydraulics use given values only: pressure from head at
  9.81 kPa per metre, head loss only from given loss rates; the
  Hazen-Williams formula is never used.

## Grounding

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Distribution Class IV in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, deepened from the WPI Class 3 build to the
Class IV senior scope: water loss strategy at utility scale, demand
forecasting and long range capacity strategy, asset management and
capital program leadership, pressure management strategy, water
quality strategy and risk management, system optimization and
performance benchmarking, utility management and governance,
emergency management leadership, and cold climate operation at
utility scale. Regulation framing stays generic and accurate:
provincial drinking water requirements in general terms and the
Guidelines for Canadian Drinking Water Quality as the federal
reference; no Ontario regulations are cited and no provincial
regulation numbers are invented. Sources are listed in sources.json
(Spellman Handbook, WPI 2025 Need-to-Know for Water Distribution
Class IV, Health Canada Guidelines for Canadian Drinking Water
Quality, AWWA water loss control M36 guidance as background, AWWA
asset management guidance as background, CCOHS). The Drive
textbooks Ay mentioned were inventoried (SOURCES.md in the build
root): none are reachable in the connected Drive, so no task cites
a Drive textbook yet; a re-citation pass is queued if they are
shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and the task level
  enum holds only "oit" and "class1". This package uses the real
  registry courseKey "wpi-class4-water-dist" and level "class1" as the
  documented placeholder for a Class IV course; the repo team must
  extend the enum and the registry allowlist before this package can
  be served.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each package, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board
  endorsed.
