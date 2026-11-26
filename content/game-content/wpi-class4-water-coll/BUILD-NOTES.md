# BUILD NOTES: wpi-class4-water-coll (WPI Class 4 Wastewater Collection, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.
This is the final course of the build: 35 of 35 in-scope courses complete.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp4wc-ladder01..100) | 100 |
| build-process | 0 | 100 (wp4wc-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp4wc-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp4wc-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp4wc-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 272,428 bytes). Each
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
  records (wpi-class4-water-coll/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics, ten groups of ten: I/I strategy at utility scale,
  I/I program economics, CMOM utility performance, asset renewal
  and capital, capacity and growth strategy, lift station fleet
  energy, condition and risk programs, budget and funding
  arithmetic, cold climate at utility scale, overflow and emergency
  governance.
- Error families target Class 4 failure modes: I/I strategy at
  utility scale (15), CMOM performance metrics (15), asset and
  capital program quantities (20), capacity strategy (15), lift
  station fleet and energy (15), budget and funding (20). The error
  worker hand checked a sample across all six families, confirming
  each flagged line is genuinely the first error.
- Process topics, ten themes of ten: I/I strategy at utility scale,
  CMOM governance and reporting leadership, asset management and
  capital program leadership, capacity strategy and long range
  planning, lift station fleet strategy, condition and risk
  programs, utility management and governance, emergency management
  leadership, regulatory leadership and senior decision making,
  cold climate operations at utility scale.
- Evidence tasks: 100 unique prompts at Class 4 depth in western
  Canadian settings, ten scenario groups of ten: I/I strategy,
  CMOM governance, asset and capital program, capacity strategy,
  lift station fleet, condition and risk programs, governance and
  reporting, emergency leadership, benchmarking, cold climate at
  utility scale. Each case carries control basins, verified meters,
  matched rainfall, paired comparisons, or direct records so the
  keyed inference is the only option consistent with all
  observations.
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
Wastewater Collection Class IV in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, deepened from the WPI Class 3 collection
build to the Class IV senior scope: inflow and infiltration
strategy at utility scale, CMOM at utility scale, asset management
and capital program leadership, capacity strategy and long range
growth planning, lift station fleet strategy and energy management,
condition and risk programs, utility management and governance,
emergency management leadership, senior decision making, and cold
climate operations at utility scale. Regulation framing stays
generic and accurate: provincial wastewater requirements in general
terms, with the federal Wastewater Systems Effluent Regulations and
the CCME Canada-wide Strategy as general federal references; no
Ontario regulations are cited and no provincial regulation numbers
are invented. Sources are listed in sources.json (Spellman
Handbook, WPI 2025 Need-to-Know for Wastewater Collection Class IV,
CCME Canada-wide Strategy, Government of Canada Wastewater Systems
Effluent Regulations, US EPA collection system guidance as
background, CCOHS). The Drive textbooks Ay mentioned were
inventoried (SOURCES.md in the build root): none are reachable in
the connected Drive, so no task cites a Drive textbook yet; a
re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and the task level
  enum holds only "oit" and "class1". This package uses the real
  registry courseKey "wpi-class4-water-coll" and level "class1" as the
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
