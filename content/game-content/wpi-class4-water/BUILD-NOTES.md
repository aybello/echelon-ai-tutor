# BUILD NOTES: wpi-class4-water (WPI Class 4 Water Treatment, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp4w-ladder01..100) | 100 |
| build-process | 0 | 100 (wp4w-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp4w-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp4w-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp4w-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 278,092 bytes). Each
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
  records (wpi-class4-water/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics at the senior level: utility mass balances (15),
  energy benchmarking (15), capacity planning (15), technology
  comparison quantities (15), demand forecasting with given growth
  values (10), chemical program economics (10), water quality target
  margins (10), residuals forecasting (5), compliance sampling counts
  (5).
- Error families target Class 4 failure modes: utility water balance
  closure errors (20), capacity and demand forecasting slips (20),
  chemical program cost errors (20), technology comparison quantity
  mistakes (15), energy benchmark slips (15), residuals program total
  mistakes (10). The error worker audited a sample spanning every
  error pattern confirming each flagged line is the first error.
- Process topics, ten groups of ten: utility governance and quality
  management, water quality strategy and risk, technology selection
  and innovation, capital planning and asset management, project
  delivery leadership, emergency management and resilience,
  benchmarking, performance and optimization, cold climate and climate
  adaptation at utility scale, people, safety and laboratory quality
  leadership, regulatory leadership, finance and stakeholders.
- Evidence tasks: 100 unique prompts at Class 4 depth in western
  Canadian settings (water quality strategy 16, utility performance
  investigations 15, technology selection evidence reviews 15,
  emergency after action reviews 15, capital decision cases 14,
  multi plant benchmarking puzzles 13, governance and records cases
  12), each keyed inference the only option consistent with all
  observations, with paired plant comparisons and direct checks built
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
Water Treatment Class IV in a western Canadian context, at the senior
operator and utility leadership level. The closest matching bank
structure in the repo is content/class1-water, deepened from the WPI
Class 3 build: utility management and governance, whole plant and
utility wide balances, water quality strategy, technology selection
studies, capital planning, emergency management leadership, regulatory
management in generic provincial terms, and senior decision making,
including cold climate operation at utility scale. Regulation framing
stays generic and accurate: provincial drinking water requirements in
general terms and the Guidelines for Canadian Drinking Water Quality
as the federal reference; no Ontario regulations are cited and no
provincial regulation numbers are invented. Sources are listed in
sources.json (Spellman Handbook, WPI 2025 Need-to-Know for Water
Treatment Class IV, Health Canada Guidelines for Canadian Drinking
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
  registry courseKey "wpi-class4-water" and level "class1" as the
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
