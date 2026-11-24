# BUILD NOTES: wpi-class1-wastewater (WPI Class 1 Wastewater Treatment, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp1ww-ladder01..100) | 100 |
| build-process | 0 | 100 (wp1ww-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp1ww-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp1ww-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp1ww-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 256,727 bytes). Each
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
  records (wpi-class1-wastewater/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics: flow conversions (10), BOD and TSS loadings (10),
  percent removal and effluent concentrations (10), clarifier surface
  overflow, detention, weir loading and solids loading (16), aeration
  detention and F/M ratio (10), return and waste sludge rates (10),
  sludge age and SVI (10), digester volatile solids loading and
  detention (10), grit quantities (5), chemical feed (5), tank volume,
  wet well and pump run time, population equivalent (4).
- Error families target Class 1 failure modes: percent removal errors
  (15), BOD loading slips (12), clarifier surface overflow rate errors
  (12), detention time errors (12), F/M inversions (12), TSS loading
  (8), SVI factor slips (8), return sludge ratio mistakes (8), sludge
  age errors (8), weir loading (5). The error worker audited 13 tasks
  line by line across all families confirming each flagged line is the
  first error.
- Process topics: activated sludge routine operation (16), primary
  clarifier operation (12), screening and headworks (10), secondary
  clarifier operation (10), grit removal (8), trickling filters (7),
  disinfection basics (7), solids handling basics (7), general plant
  operations (6), sampling and laboratory routines (6), rotating
  biological contactors (5), safety routines (3), cold weather
  operations (3).
- Evidence tasks: 100 unique prompts at Class 1 depth in western
  Canadian settings (primary clarification 15, sampling and laboratory
  basics 13, secondary clarifier 11, activated sludge basics 10,
  disinfection basics 7, solids handling 6, screening and grit 10,
  pumps and blowers 8, odour and safety 5, cold weather process 5,
  bulking and foaming 5, trickling filters and RBC 5), each keyed
  inference the only option consistent with all observations.
- Em dash check: zero occurrences in all task, verify and package
  files. Any folder grep match is the escaped codepoint inside a
  generator script's own no-em-dash assertion, not content.
- Framing check: zero occurrences of Ontario regulation references in
  the delivered files; regulation framing is generic (provincial
  wastewater requirements, the federal Wastewater Systems Effluent
  Regulations, the CCME Canada-wide Strategy).

## Grounding

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Treatment Class I in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-treatment, transposed out of the Ontario framing:
preliminary treatment, primary clarification, activated sludge
basics, trickling filters and rotating biological contactors,
secondary clarification, disinfection basics, solids handling
basics, sampling and laboratory basics, pumps and equipment, safety,
and Class I operator duties, including cold climate operation.
Regulation framing stays generic and accurate: provincial wastewater
requirements in general terms, the federal Wastewater Systems
Effluent Regulations in general terms, and the CCME Canada-wide
Strategy as context; no Ontario regulations are cited and no
provincial regulation numbers are invented. Sources are listed in
sources.json (Spellman Handbook, WPI 2025 Need-to-Know for Wastewater
Treatment Class I, CCME Canada-wide Strategy, the federal Wastewater
Systems Effluent Regulations as general reference, US EPA wastewater
primer material as background, CCOHS). The Drive textbooks Ay
mentioned were inventoried (SOURCES.md in the build root): none are
reachable in the connected Drive, so no task cites a Drive textbook
yet; a re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today. This package uses
  the real registry courseKey "wpi-class1-wastewater". The level value
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
