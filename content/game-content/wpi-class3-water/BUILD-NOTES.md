# BUILD NOTES: wpi-class3-water (WPI Class 3 Water Treatment, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp3w-ladder01..100) | 100 |
| build-process | 0 | 100 (wp3w-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp3w-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp3w-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp3w-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 272,707 bytes). Each
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
  records (wpi-class3-water/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics: membranes (flux 10, recovery 10, design: area, module
  counts, transmembrane pressure 10), UV disinfection with given values
  (10), whole plant mass balances (10), residuals management (10),
  chemical optimization (10), pump and energy (10), source water
  loading (10), plant scale CT (7), filtration performance (3).
- Error families target Class 3 failure modes: membrane flux, area,
  recovery, permeate and concentrate splits and transmembrane pressure
  (46), UV dose factor mistakes (16), mass balance closure errors
  (16), residuals solids mistakes (12), optimization slips (10). The
  error worker audited a line by line sample confirming each flagged
  line is the first error.
- Process topics: advanced process control and optimization programs
  (15), membrane operation and cleaning programs (20), UV system
  programs (13), mass balance and optimization studies (12), residuals
  management programs (12), source water protection planning (10),
  water quality management programs (8), asset and capital awareness,
  senior decision routines and cold climate operations at scale (10).
- Evidence tasks: 100 unique prompts at Class 3 depth in western
  Canadian settings (membrane investigations 14, senior level multi
  system troubleshooting 14, optimization study interpretation 12, UV
  disinfection and validation 11, residuals programs 11, water quality
  management 11, mass balances 10, source water events 10, cold climate
  at scale 7), each keyed inference the only option consistent with all
  observations.
- Em dash check: zero occurrences in all task, verify and package
  files. Any folder grep match is the escaped codepoint inside a
  generator script's own no-em-dash assertion, not content.
- Framing check: zero occurrences of Ontario regulation references in
  the delivered files; regulation framing is generic (provincial
  drinking water requirements, Guidelines for Canadian Drinking Water
  Quality).

## Grounding

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Treatment Class III in a western Canadian context. The closest
matching bank structure in the repo is content/class1-water, deepened
from the WPI Class 2 build: advanced process control, membrane
treatment with given values, ultraviolet disinfection with given
values, whole plant mass balances, residuals management, source water
protection planning, water quality management programs, optimization
studies, capital and asset awareness, and senior operator decision
making, including cold climate operation at scale. Regulation framing
stays generic and accurate: provincial drinking water requirements in
general terms and the Guidelines for Canadian Drinking Water Quality
as the federal reference; no Ontario regulations are cited and no
provincial regulation numbers are invented. Sources are listed in
sources.json (Spellman Handbook, WPI 2025 Need-to-Know for Water
Treatment Class III, Health Canada Guidelines for Canadian Drinking
Water Quality, US EPA Membrane Filtration Guidance Manual as
background, US EPA Ultraviolet Disinfection Guidance Manual as
background, CCOHS). The Drive textbooks Ay mentioned were
inventoried (SOURCES.md in the build root): none are reachable in the
connected Drive, so no task cites a Drive textbook yet; a re-citation
pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and the task level
  enum holds only "oit" and "class1". This package uses the real
  registry courseKey "wpi-class3-water" and level "class1" as the
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
