# BUILD NOTES: class1-water (Ontario Class 1 Water Treatment)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 4 | 96 (c1w-ladder05..100) | 100 |
| build-process | 4 | 96 (c1w-process05..100) | 100 |
| find-calculation-error | 4 | 96 (c1w-error05..100) | 100 |
| evidence-detective | 4 | 96 (c1w-evidence05..100) | 100 |
| exam-escape-room missions | 3 | 97 (c1w-mission04..100) | 100 |

## Packaging

The live contract caps a package at 200 tasks and 20 missions
(FORMAT.md section 5), so the course ships as six files in this folder:
package-1.json is the repo pilot package copied unchanged (16 tasks,
3 missions, original receipts). package-2.json through package-6.json hold
the 384 new tasks in canonical mode order, chunked at 77 or 76 tasks, each
with its own missions (20, 20, 20, 20, 17) generated from that chunk's task
pool so every mission reference resolves inside its own package. All files
are under the 1,048,576 byte package cap (largest: 263,646 bytes).
New packages carry computed SHA-256 receipts; per-task sourceIds on new
tasks default to the course's first listed source pending the human review
pass that assigns per-task citations precisely.

## Verification

- tools/verify_tasks.py run on every worker file individually: ALL CHECKS
  PASSED for ladder (96), process (96), error (96), and evidence (96).
- Independent coordinator re-verification of the evidence file after the
  worker handoff: 96 tasks, ALL CHECKS PASSED, zero em dashes.
- Merged set of all 400 tasks verified with the merged computation records
  (class1-water/verify.json, 200 records: 8 pilot + 96 ladder + 96 error):
  ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Error tasks were additionally audited line by line by their author so
  that all lines before firstWrongLineId are correct.
- Evidence tasks: each keyed inference is the only option consistent with
  all observations; every distractor is contradicted or unsupported by at
  least one stated observation. Coverage spans coagulation and chemical
  feed, sedimentation, filtration, disinfection, chemistry and water
  quality, distribution, and equipment and instrumentation (35 distinct
  topicIds in the new evidence set alone).
- Em dash check: zero occurrences in all new task files.

## Grounding

Modules and topics follow the repo's Class 1 Water bank
(content/class1-water/questions batch files): Filtration, Disinfection,
Coagulation and Flocculation, Sedimentation, Hydraulics, Chemical Feed and
Dosing, Water Distribution, Water Quality and Regulations, Water Sources
and Quality, Pumps and Hydraulics, Safety, Sampling and Laboratory,
Instrumentation and Control, Iron and Manganese Removal, Softening.
Ladder topic distribution is led by chemical-dose-mass, detention,
flow-conversion, and disinfection-CT. Sources are the pilot package's
source list plus the bank sources. The Drive textbooks Ay mentioned were
inventoried (SOURCES.md): none are reachable in the connected Drive, so
no task cites a Drive textbook yet; a re-citation pass is queued if they
are shared.

## Scope notes and gaps

- Level value "class1" is used for every task, as the contract requires
  for this courseKey.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each chunk, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board endorsed.
