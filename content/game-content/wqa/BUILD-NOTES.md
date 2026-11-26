# BUILD NOTES: wqa (Ontario Water Quality Analyst)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wqa-ladder01..100) | 100 |
| build-process | 0 | 100 (wqa-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wqa-error01..100) | 100 |
| evidence-detective | 0 | 100 (wqa-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wqa-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 263,809 bytes). Each
package carries the course sources list (sources.json in this folder,
7 sources) and computed SHA-256 receipts. Per-task sourceIds default to
the first listed source pending the human review pass.

## Verification

- tools/verify_tasks.py run on every worker file individually: ALL CHECKS
  PASSED for ladder (100, with its 100 computation records), process
  (100), error (100, with its 100 computation records), and evidence
  (100). Each file was then re-verified independently by the coordinator
  on arrival, same result.
- Merged set of all 400 tasks verified with the merged computation
  records (wqa/verify.json, 200 records) via tools/finish_course.py:
  ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics: dilution factors and diluted results (15), standard
  and reagent preparation (15), percent recovery and relative percent
  difference (15), result averaging and summary statistics (15), sample
  counts and bottle planning (15), holding time and scheduling
  arithmetic (13), bench unit conversions (12).
- Error families target analyst failure modes: dilution factor inverted
  or omitted (14), standard preparation concentration errors (14),
  percent recovery on the wrong base (13), relative percent difference
  denominator errors (13), averaging and summary statistic slips (13),
  sample count and bottle planning errors (11), holding time arithmetic
  errors (11), bench unit conversion slips (11).
- Process topics: sampling run planning and chain of custody (10),
  sample receipt and login (10), microbiological analysis workflows
  (12), bench chemistry analysis workflows (16), calibration and
  quality control batch workflows (14), quality control failure
  response (10), data review and reporting (10), adverse result
  notification support (8), laboratory safety and housekeeping (5),
  analyst training and competency (5).
- Evidence tasks: 100 unique prompts at analyst depth (contaminated
  blanks and bottle lots 12, calibration drift and standard preparation
  12, microbiological false positives and negatives 12, holding time
  and preservation failures 12, turbidity and chlorine bench
  interferences 12, duplicate and spike recovery investigations 12,
  sample mix up and chain of custody 12, data transcription and
  reporting integrity 9, laboratory safety and quality systems 7), each
  keyed inference the only option consistent with all observations.
- Em dash check: zero occurrences in all task, verify and package
  files. Any folder grep match is the escaped codepoint inside a
  generator script's own no-em-dash assertion, not content.

## Grounding and scope note

SCOPE NOTE (the ambiguity the index flagged): the registry entry for
wqa is "Water Quality Analyst (WQA)", track "water-quality",
classLevel 4, questionBankKey "wqa". This is Ontario's laboratory
analyst certification, a distinct scope from the Class 1 to 4 operator
courses, and the repo holds no dedicated wqa bank folder. Per the
build rule, this course proceeds on the closest matching existing
structure, the laboratory, sampling and water quality topic structure
inside content/class1-water and the treatment banks: sampling and
chain of custody, microbiological and bench chemistry analysis,
calibration and quality control, dilution, recovery and summary
calculation with given values, reporting and adverse result duties,
laboratory safety, and the Regulation 169/03 standards, Regulation
170/03 sampling and Regulation 128/04 analyst certificate context at a
general level. pH is treated only as a measured scale value and is
never calculated from hydrogen ion concentration; exponential and
logarithmic numerics are avoided throughout. Sources are listed in
sources.json (Spellman Handbook, OWWCO, Ontario Regulation 169/03,
Ontario Regulation 170/03, Ontario Regulation 128/04, US EPA drinking
water laboratory quality assurance guidance, CCOHS). The Drive
textbooks Ay mentioned were inventoried (SOURCES.md in the build
root): none are reachable in the connected Drive, so no task cites a
Drive textbook yet; a re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and task level is an
  enum of "oit" and "class1" with no wqa value. This package uses the
  real registry courseKey "wqa" and level "class1" as the documented
  placeholder throughout. The repo team must extend the schema enum
  and the registry allowlist, and map the level, before this package
  can be served.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each package, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board
  endorsed.
