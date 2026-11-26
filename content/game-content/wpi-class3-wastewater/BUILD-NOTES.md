# BUILD NOTES: wpi-class3-wastewater (WPI Class 3 Wastewater Treatment, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp3ww-ladder01..100) | 100 |
| build-process | 0 | 100 (wp3ww-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp3ww-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp3ww-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp3ww-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 287,946 bytes). Each
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
  records (wpi-class3-wastewater/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics, ten of ten: nitrogen mass balances, alkalinity
  balances, nitrification oxygen demand, denitrification carbon,
  chemical phosphorus dose, phosphorus mass balances, SRT
  optimization, F/M optimization, digestion gas utilization,
  dewatering optimization.
- Error families target Class 3 failure modes: nutrient mass balance
  closure errors (20), alkalinity factor mistakes (18), carbon dose
  slips (16), chemical phosphorus dose errors (16), SRT optimization
  slips (15), gas utilization mistakes (15). The error worker ran an
  exact rational audit over all 162 fully stated lines confirming
  each flagged line is the first error and later lines only propagate
  it.
- Process topics: BNR operation programs (15), nutrient control
  strategies (15), SRT optimization programs (12), digestion
  optimization (12), effluent quality management (12), optimization
  studies (12), dewatering optimization (10), senior decision
  routines (6), cold climate operations at scale (6).
- Evidence tasks: 100 unique prompts at Class 3 depth in western
  Canadian settings (clarifier, SRT and multi system troubleshooting
  17, digestion optimization 15, effluent quality management and
  disinfection 15, phosphorus removal 10, nutrient mass balance
  discrepancies 10, dewatering optimization 10, BNR denitrification
  8, BNR nitrification 7, optimization study interpretation 7, cold
  climate at scale woven through), each keyed inference the only
  option consistent with all observations.
- Em dash check: zero occurrences in all task, verify and package
  files. Any folder grep match is the escaped codepoint inside a
  generator script's own no-em-dash assertion, not content.
- Framing check: zero occurrences of Ontario regulation references in
  the delivered files; regulation framing is generic (provincial
  wastewater requirements, the federal Wastewater Systems Effluent
  Regulations, the CCME Canada-wide Strategy).

## Grounding

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Treatment Class III in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-treatment, deepened from the WPI Class 2 build:
biological nutrient removal operations, nutrient mass balances, SRT
optimization, digestion optimization, dewatering optimization,
effluent quality management, process optimization studies, and senior
operator decision making, including cold climate operation at scale.
Regulation framing stays generic and accurate: provincial wastewater
requirements in general terms, the federal Wastewater Systems
Effluent Regulations in general terms, and the CCME Canada-wide
Strategy as context; no Ontario regulations are cited and no
provincial regulation numbers are invented. Sources are listed in
sources.json (Spellman Handbook, WPI 2025 Need-to-Know for Wastewater
Treatment Class III, CCME Canada-wide Strategy, the federal
Wastewater Systems Effluent Regulations as general reference, WEF
Manual of Practice nutrient removal material as background, CCOHS).
The Drive textbooks Ay mentioned were inventoried (SOURCES.md in the
build root): none are reachable in the connected Drive, so no task
cites a Drive textbook yet; a re-citation pass is queued if they are
shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and the task level
  enum holds only "oit" and "class1". This package uses the real
  registry courseKey "wpi-class3-wastewater" and level "class1" as the
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
