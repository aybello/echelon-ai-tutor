# BUILD NOTES: wpi-class3-water-coll (WPI Class 3 Wastewater Collection, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp3wc-ladder01..100) | 100 |
| build-process | 0 | 100 (wp3wc-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp3wc-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp3wc-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp3wc-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 263,863 bytes). Each
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
  records (wpi-class3-water-coll/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics, ten groups of ten: I/I basin balances, I/I removal
  economics, rehabilitation program, capacity planning, lift station
  optimization, condition assessment, CMOM performance, odour and
  corrosion programs, FOG source control, cold climate at scale.
- Error families target Class 3 failure modes, five groups of twenty:
  I/I program (basin balance, removal effectiveness, cost per volume,
  RDII program volume), rehabilitation program (lining program,
  renewal rate, liner quantity, phasing cost), capacity planning
  (growth flow, design flow, storage detention, growth phasing),
  lift station optimization (energy per volume, fleet comparison,
  pump optimization, pump cycling), condition program (CCTV defect
  rate, grading progress, cleaning condition program, manhole
  assessment program). The error worker hand read 22 sampled tasks
  across all twenty topic families, confirming each flagged line is
  genuinely the first error.
- Process topics, ten themes of ten: I/I program design,
  rehabilitation program planning, CMOM program routines, asset
  management programs, lift station reliability, condition
  assessment programs, capacity planning studies, safety program
  leadership, emergency and overflow programs, cold climate
  programs.
- Evidence tasks: 100 unique prompts at Class 3 depth in western
  Canadian settings, ten scenario groups of ten: I/I evaluation,
  I/I removal, rehabilitation decisions, CMOM review, asset
  condition, lift optimization, capacity planning, overflow trends,
  senior multi-basin troubleshooting, cold climate programs. Each
  case carries paired-basin controls, matched rainfall and
  groundwater, meter verification, or direct checks so the keyed
  inference is the only option consistent with all observations.
- Em dash check: zero occurrences in all task, verify and package
  files. Any folder grep match is the escaped codepoint inside a
  generator script's own no-em-dash assertion, not content.
- Framing check: zero occurrences of Ontario regulation references in
  the delivered files; regulation framing is generic (provincial
  wastewater requirements, the federal Wastewater Systems Effluent
  Regulations and the CCME Canada-wide Strategy as general
  references). All calculation vocabulary uses given values only;
  the Hazen-Williams formula is never used.

## Grounding

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Collection Class III in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, deepened from the WPI Class 2 collection
build: inflow and infiltration programs and rehabilitation
programs, CMOM program elements, asset management awareness, lift
station optimization and reliability programs, condition assessment
programs, capacity and growth planning awareness, safety program
leadership, senior operator decision making, and cold climate
operations at scale. Regulation framing stays generic and accurate:
provincial wastewater requirements in general terms, with the
federal Wastewater Systems Effluent Regulations and the CCME
Canada-wide Strategy as general federal references; no Ontario
regulations are cited and no provincial regulation numbers are
invented. Sources are listed in sources.json (Spellman Handbook,
WPI 2025 Need-to-Know for Wastewater Collection Class III, CCME
Canada-wide Strategy, Government of Canada Wastewater Systems
Effluent Regulations, US EPA collection system guidance as
background, CCOHS). The Drive textbooks Ay mentioned were
inventoried (SOURCES.md in the build root): none are reachable in
the connected Drive, so no task cites a Drive textbook yet; a
re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and the task level
  enum holds only "oit" and "class1". This package uses the real
  registry courseKey "wpi-class3-water-coll" and level "class1" as the
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
