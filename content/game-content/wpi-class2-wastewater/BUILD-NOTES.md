# BUILD NOTES: wpi-class2-wastewater (WPI Class 2 Wastewater Treatment, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp2ww-ladder01..100) | 100 |
| build-process | 0 | 100 (wp2ww-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp2ww-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp2ww-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp2ww-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 267,867 bytes). Each
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
  records (wpi-class2-wastewater/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics: F/M ratio (12), SRT control (10), dewatering: capture,
  cake and polymer (10), wasting rate (8), volatile solids reduction
  (8), digester gas production (8), disinfection dose, demand and CT
  (8), nutrient loading and removal (8), RAS control (6), volatile
  acids and alkalinity (6), clarifier loading (6), digester loading
  (4), SVI, oxygen requirements, detention and percent removal (6).
- Error families target Class 2 failure modes: SRT control errors
  (18), F/M ratio slips (16), dewatering capture mistakes (12),
  disinfection dose errors (12), gas production factor slips (10),
  clarifier solids loading errors (10), volatile solids reduction
  formula errors (8), nitrification alkalinity mistakes (8), digester
  volatile solids loading (6). The error worker audited a line by line
  sample confirming each flagged line is the first error.
- Process topics: SRT and F/M control programs (12), process control
  testing programs (12), digestion operations (12), laboratory QA/QC
  programs (12), dewatering operations (10), disinfection programs
  (10), nutrient awareness routines (10), troubleshooting programs
  (10), supervisory routines (6), cold climate operations (6).
- Evidence tasks: 100 unique prompts at Class 2 depth in western
  Canadian settings (laboratory QA 16, SRT and process control 15,
  filamentous bulking and foaming 15, anaerobic digestion 15,
  nutrients 15, dewatering 12, disinfection 12), each keyed inference
  the only option consistent with all observations, with process
  control test series and paired train comparisons built in where a
  case could be arguable.
- Em dash check: zero occurrences in all task, verify and package
  files. Any folder grep match is the escaped codepoint inside a
  generator script's own no-em-dash assertion, not content.
- Framing check: zero occurrences of Ontario regulation references in
  the delivered files; regulation framing is generic (provincial
  wastewater requirements, the federal Wastewater Systems Effluent
  Regulations, the CCME Canada-wide Strategy).

## Grounding

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Treatment Class II in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-treatment, deepened from the WPI Class 1 build: solids
retention time and F/M control, process control testing, anaerobic
digestion operations, disinfection dose and contact basics, nutrient
awareness, solids dewatering operations, laboratory QA/QC, process
troubleshooting, and supervisory awareness, including cold climate
operation. Regulation framing stays generic and accurate: provincial
wastewater requirements in general terms, the federal Wastewater
Systems Effluent Regulations in general terms, and the CCME
Canada-wide Strategy as context; no Ontario regulations are cited
and no provincial regulation numbers are invented. Sources are
listed in sources.json (Spellman Handbook, WPI 2025 Need-to-Know for
Wastewater Treatment Class II, CCME Canada-wide Strategy, the
federal Wastewater Systems Effluent Regulations as general reference,
US EPA wastewater primer material as background, CCOHS). The Drive
textbooks Ay mentioned were inventoried (SOURCES.md in the build
root): none are reachable in the connected Drive, so no task cites a
Drive textbook yet; a re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and the task level
  enum holds only "oit" and "class1". This package uses the real
  registry courseKey "wpi-class2-wastewater" and level "class1" as the
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
