# BUILD NOTES: wpi-class1-water-dist (WPI Class 1 Water Distribution, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp1wd-ladder01..100) | 100 |
| build-process | 0 | 100 (wp1wd-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp1wd-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp1wd-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp1wd-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 276,442 bytes). Each
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
  records (wpi-class1-water-dist/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics: pipe volumes (12), flow conversions (12), pressure
  and head at 9.81 kPa per metre (12), pipe velocity (10), storage
  volumes (10), chlorine dose for mains and tanks (10), storage
  turnover (8), head loss with given loss rates (6), flushing volumes
  (5), flushing times (5), demand arithmetic (5), pump run time (5).
- Error families target Class 1 failure modes: pipe volume slips
  (16), pressure and head conversion mistakes (16), velocity errors
  (14), flow conversion errors (12), flushing volume and time errors
  (12), chlorine dose mistakes (12), storage volume slips (10),
  storage turnover errors (8). The error worker audited a 15 task
  sample spanning every pattern confirming each flagged line is the
  first error.
- Process topics: valves (12), hydrants (12), flushing programs
  (12), sampling and water quality (12), storage (10), booster
  stations (10), leak and main break response (10), service lines,
  meters and backflow (10), safety (6), cold weather operations (6).
- Evidence tasks: 100 unique prompts at Class 1 depth in western
  Canadian settings (low pressure complaints 15, discoloured water
  15, residual loss 15, leak indications 12, frozen services and cold
  climate 12, valve failures 10, storage quality and operations 10,
  meter anomalies 6, hydrant problems 5), each keyed inference the
  only option consistent with all observations, with pressure logging
  and paired zone comparisons built in where a case could be
  arguable.
- Em dash check: zero occurrences in all task, verify and package
  files. Any folder grep match is the escaped codepoint inside a
  generator script's own no-em-dash assertion, not content.
- Framing check: zero occurrences of Ontario regulation references in
  the delivered files; regulation framing is generic (provincial
  drinking water requirements, Guidelines for Canadian Drinking Water
  Quality).

## Grounding

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Distribution Class I in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, transposed out of the Ontario framing:
distribution components (mains, valves, hydrants, services, meters),
storage tanks and reservoirs, booster pumps and pressure zones,
water quality in distribution (residual maintenance, flushing,
sampling), leak awareness, basic hydraulics with given values,
safety, and Class I operator duties, including cold climate
operation. Regulation framing stays generic and accurate: provincial
drinking water requirements in general terms and the Guidelines for
Canadian Drinking Water Quality as the federal reference; no Ontario
regulations are cited and no provincial regulation numbers are
invented. Sources are listed in sources.json (Spellman Handbook,
WPI 2025 Need-to-Know for Water Distribution Class I, Health Canada
Guidelines for Canadian Drinking Water Quality, AWWA distribution
guidance as background, US EPA distribution guidance as background,
CCOHS). The Drive textbooks Ay mentioned were inventoried
(SOURCES.md in the build root): none are reachable in the connected
Drive, so no task cites a Drive textbook yet; a re-citation pass is
queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today. This package uses
  the real registry courseKey "wpi-class1-water-dist". The level value
  "class1" is the natural enum value for this Class I course, so for
  the WPI Class 1 courses the remaining blocker is the courseKey
  allowlist extension, recorded here for the repo team.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each package, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board
  endorsed.
