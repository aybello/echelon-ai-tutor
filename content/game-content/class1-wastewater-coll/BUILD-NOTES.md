# BUILD NOTES: class1-wastewater-coll (Ontario Class 1 Wastewater Collection)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (c1wc-ladder01..100) | 100 |
| build-process | 0 | 100 (c1wc-process01..100) | 100 |
| find-calculation-error | 0 | 100 (c1wc-error01..100) | 100 |
| evidence-detective | 0 | 100 (c1wc-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (c1wc-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 246,603 bytes). Each
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
  records (class1-wastewater-coll/verify.json, 200 records): ALL CHECKS
  PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Error tasks were generated with exact Fraction arithmetic and audited
  line by line by their author with an arithmetic parser: every line
  before firstWrongLineId is true as written, and post-error lines
  propagate the single planted error consistently.
- Ladder design note: pipe cross-sectional areas are given directly in
  the prompts so continuity and volume results stay exact with no pi
  rounding.
- Evidence tasks: 100 unique prompts, each keyed inference the only
  option consistent with all observations, with discriminating checks
  built into the evidence. The author cross-checked the class1-ww
  evidence set and replaced three drafts that came too close to its
  wet well cases, so no scenario duplicates the treatment course set.
- Em dash check: zero occurrences in all task and verify files.

## Grounding

Scope and topic vocabulary follow the repo's Class 1 collection bank
(destination bank class1-wastewater-coll, authored in
content/class1-networks: 250 collection candidates, 200 conceptual and
50 worked calculations) and the WPI Collection Class I criteria and US
EPA CMOM guidance recorded in that package's README. Coverage: gravity
sewers and manholes, lift stations (the largest process block), force
mains, flow monitoring, infiltration and inflow investigation, cleaning
and CCTV workflows, blockages, odour and hydrogen sulfide, confined
space and gas testing, spill response, and CMOM documentation. Sources
are listed in sources.json (Spellman Handbook, US EPA CMOM Guide, US
EPA Alternative Wastewater Collection Systems Manual, OWWCO, WPI
Collection Class I criteria, Ontario Regulation 129/04, CCOHS). The
Drive textbooks Ay mentioned were inventoried (SOURCES.md in the build
root): none are reachable in the connected Drive, so no task cites a
Drive textbook yet; a re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and task level is an
  enum of "oit" and "class1". This package uses the real registry
  courseKey "class1-wastewater-coll" and level "class1" throughout, the
  closest pilot convention. The repo team must extend the schema enum
  and the registry allowlist before this package can be served.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each package, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board
  endorsed.
