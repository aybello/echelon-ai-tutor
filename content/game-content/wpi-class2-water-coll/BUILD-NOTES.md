# BUILD NOTES: wpi-class2-water-coll (WPI Class 2 Wastewater Collection, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp2wc-ladder01..100) | 100 |
| build-process | 0 | 100 (wp2wc-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp2wc-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp2wc-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp2wc-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 255,782 bytes). Each
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
  records (wpi-class2-water-coll/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics, ten groups of ten: lift station drawdown, pump
  performance, wet well storage, flow monitoring, infiltration and
  inflow, cleaning program, CCTV condition, rehabilitation quantities,
  chemical and fuel programs, cold climate operations.
- Error families target Class 2 failure modes: pump performance and
  drawdown (18), wet well storage (14), flow monitoring and I/I rates
  (27 across night flow, per hectare, per kilometre, basin comparison,
  RDII and rainfall families), cleaning production (8), CCTV
  production (8), rehabilitation quantities (18 across CIPP liner,
  pipe replacement, grout and manhole coating). The error worker hand
  checked 16 tasks across all families and positions, confirming each
  flagged line is genuinely the first error.
- Process topics, ten themes of ten: lift station maintenance
  programs, cleaning program planning, CCTV condition assessment
  programs, flow monitoring and I/I study routines, rehabilitation
  job planning, confined space program routines, spill response
  coordination, standby power routines, records and CMOM
  documentation, supervisory and cold climate routines.
- Evidence tasks: 100 unique prompts at Class 2 depth in western
  Canadian settings, ten scenario groups of ten: I/I flow monitoring
  and night flow analysis, smoke and dye source detection, pump
  performance decline, CCTV defect interpretation, cleaning program
  effectiveness, rehabilitation priority, overflow cause
  investigations, odour and sulfide program, cold climate program,
  and lift station reliability with CMOM records. Each case carries
  a direct check, paired control, swapped instrument, or
  before-and-after comparison so the keyed inference is the only
  option consistent with all observations.
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
Wastewater Collection Class II in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, deepened from the WPI Class 1 collection
build: lift station operations and maintenance programs, cleaning
program planning, CCTV condition assessment, inflow and infiltration
programs, rehabilitation awareness, safety program routines, spill
response coordination, records and CMOM awareness, supervisory
awareness, and cold climate operations. Regulation framing stays
generic and accurate: provincial wastewater requirements in general
terms, with the federal Wastewater Systems Effluent Regulations and
the CCME Canada-wide Strategy as general federal references; no
Ontario regulations are cited and no provincial regulation numbers
are invented. Sources are listed in sources.json (Spellman
Handbook, WPI 2025 Need-to-Know for Wastewater Collection Class II,
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
  registry courseKey "wpi-class2-water-coll" and level "class1" as the
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
