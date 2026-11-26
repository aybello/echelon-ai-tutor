# BUILD NOTES: wpi-class3-water-dist (WPI Class 3 Water Distribution, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp3wd-ladder01..100) | 100 |
| build-process | 0 | 100 (wp3wd-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp3wd-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp3wd-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp3wd-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 263,614 bytes). Each
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
  records (wpi-class3-water-dist/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics, ten of ten: full water audit arithmetic, real loss
  rates, demand forecasting, capacity planning, pressure management,
  storage operations, pump energy, asset renewal quantities, booster
  disinfection, flushing and sampling programs.
- Error families target Class 3 failure modes: water audit closure
  errors (16), real loss rate mistakes (16), demand forecast slips
  with given growth values (16), capacity margin errors (16), pressure
  management savings mistakes (18), renewal quantity slips (18). The
  error worker hand checked a sample across all six families line by
  line, confirming each flagged line is genuinely the first error.
- Process topics: water loss strategy and audit programs (15), demand
  forecasting and capacity planning (13), asset management and capital
  planning (15), pressure management programs (12), water quality
  strategy (15), system optimization studies (10), senior decision
  routines and emergency leadership (10), cold climate operations at
  scale (10).
- Evidence tasks: 100 unique prompts at Class 3 depth in western
  Canadian settings, ten scenarios of ten: water audit discrepancies,
  loss strategy reviews, demand forecast reviews, asset condition
  puzzles, pressure management evaluations, water quality strategy,
  optimization study interpretation, senior multi-system
  troubleshooting, storage turnover and cold climate at scale, and
  cross connection, sampling, emergency and senior duties. Each keyed
  inference is the only option consistent with all observations, with
  direct checks, audit datasets, or paired-system comparisons built in
  where a case could otherwise be arguable.
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
Water Distribution Class III in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, deepened from the WPI Class 2 build (the repo
also carries a partial content/class3-water-dist folder): water loss
strategy and audit programs, demand forecasting and capacity planning,
asset management awareness, pressure management programs, water
quality strategy, system optimization studies, senior decision
making, and cold climate operation at scale. Regulation framing stays
generic and accurate: provincial drinking water requirements in
general terms and the Guidelines for Canadian Drinking Water Quality
as the federal reference; no Ontario regulations are cited and no
provincial regulation numbers are invented. Sources are listed in
sources.json (Spellman Handbook, WPI 2025 Need-to-Know for Water
Distribution Class III, Health Canada Guidelines for Canadian
Drinking Water Quality, AWWA water loss control M36 guidance as
background, AWWA asset management guidance as background, CCOHS).
The Drive textbooks Ay mentioned were inventoried (SOURCES.md in the
build root): none are reachable in the connected Drive, so no task
cites a Drive textbook yet; a re-citation pass is queued if they are
shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and the task level
  enum holds only "oit" and "class1". This package uses the real
  registry courseKey "wpi-class3-water-dist" and level "class1" as the
  documented placeholder for a Class III course; the repo team must
  extend the enum and the registry allowlist before this package can
  be served.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each package, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board
  endorsed.
