# BUILD NOTES: wpi-class4-wastewater (WPI Class 4 Wastewater Treatment, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp4ww-ladder01..100) | 100 |
| build-process | 0 | 100 (wp4ww-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp4ww-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp4ww-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp4ww-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 281,679 bytes). Each
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
  records (wpi-class4-wastewater/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics at the senior level: whole plant nitrogen balances
  (20), biogas energy (10), biosolids program totals (10), capacity
  and load forecasting (10), chemical program economics (10), energy
  benchmarking (10), effluent quality margins (10), whole plant
  solids balances (10), phosphorus balances and chemical phosphorus
  program (10).
- Error families target Class 4 failure modes: utility balance
  closure errors (18), capacity and load forecasting slips (18),
  biosolids program total mistakes (18), biogas energy factor errors
  (16), chemical program cost errors (16), energy benchmark slips
  (14). The error worker ran an independent arithmetic parser over
  all 190 expression bearing lines confirming each flagged line is
  the first error.
- Process topics at the leadership level: nutrient strategy
  development (14), senior decision routines and cold climate at
  utility scale (14), utility management and governance (12),
  biosolids program strategy (12), energy management programs (12),
  technology selection studies (12), capital planning processes
  (12), emergency management leadership (12).
- Evidence tasks: 100 unique prompts at Class 4 depth in western
  Canadian settings (nutrient strategy cases 20, utility performance
  investigations 14, biosolids program cases 14, energy and biogas
  cases 14, technology selection evidence reviews 14, capital
  decision cases 10, emergency after action reviews 7, governance
  and records cases 7), each keyed inference the only option
  consistent with all observations, with direct checks, pilot trials
  and paired system comparisons built in where a case could be
  arguable.
- Em dash check: zero occurrences in all task, verify and package
  files. Any folder grep match is the escaped codepoint inside a
  generator script's own no-em-dash assertion, not content.
- Framing check: zero occurrences of Ontario regulation references in
  the delivered files; regulation framing is generic (provincial
  wastewater requirements, the federal Wastewater Systems Effluent
  Regulations, the CCME Canada-wide Strategy).

## Grounding

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Treatment Class IV in a western Canadian context, at the
senior operator and utility leadership level. The closest matching
bank structure in the repo is content/class1-treatment, deepened from
the WPI Class 3 build: nutrient removal strategy, biosolids program
strategy, biogas and energy management with given factors, utility
management and governance, technology selection studies, capital
planning, emergency management leadership, and senior decision
making, including cold climate operation at utility scale.
Regulation framing stays generic and accurate: provincial wastewater
requirements in general terms, the federal Wastewater Systems
Effluent Regulations in general terms, and the CCME Canada-wide
Strategy as context; no Ontario regulations are cited and no
provincial regulation numbers are invented. Sources are listed in
sources.json (Spellman Handbook, WPI 2025 Need-to-Know for Wastewater
Treatment Class IV, CCME Canada-wide Strategy, the federal
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
  registry courseKey "wpi-class4-wastewater" and level "class1" as the
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
