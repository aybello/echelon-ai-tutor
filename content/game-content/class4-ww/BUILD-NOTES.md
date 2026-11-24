# BUILD NOTES: class4-ww (Ontario Class 4 Wastewater Treatment)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (c4ww-ladder01..100) | 100 |
| build-process | 0 | 100 (c4ww-process01..100) | 100 |
| find-calculation-error | 0 | 100 (c4ww-error01..100) | 100 |
| evidence-detective | 0 | 100 (c4ww-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (c4ww-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 272,254 bytes). Each
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
  records (class4-ww/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics: whole plant solids balance (16), nutrient balance (8),
  nutrient removal chemicals with given ratios including the 7.14
  alkalinity factor (12), digestion loading and volatile solids
  reduction (8), biogas production and energy recovery (8), dewatering
  and biosolids production (16), aeration energy benchmarking (12),
  capacity planning with given peaking factors and overflow rates (16),
  compliance sampling program counts (4).
- Error families target Class 4 failure modes: whole plant solids
  balance stream omissions and return stream double counts (18),
  nitrogen and phosphorus balance stream errors (16), nitrification
  alkalinity, supplemental carbon and ferric ratio errors (18),
  volatile solids destruction base errors (5), biogas yield and energy
  recovery errors including gross reported as net (11), biosolids cake
  and yield forecast errors (14), aeration energy benchmark inversions
  and wrong load bases (10), capacity planning peaking factor errors
  (8).
- Process topics: plant and utility management programs (10), nutrient
  removal strategy programs (11), biosolids strategy and program
  leadership (12), effluent compliance leadership (12), technology
  evaluation and pilot programs (11), capital planning and asset
  strategy (12), energy management programs (10), emergency management
  leadership (8), laboratory quality systems (7), overall responsible
  operator and supervisory leadership (7).
- Evidence tasks: 100 unique prompts at Class 4 depth (nutrient removal
  strategy 15, whole plant balance and capacity evaluation 12,
  biosolids strategy 12, technology pilot evaluation 12, effluent
  compliance leadership 12, energy and resource recovery 12, capital
  and asset judgement 10, laboratory quality systems 8, risk and
  emergency leadership 7), each keyed inference the only option
  consistent with all observations.
- Em dash check: zero occurrences in all task and verify files.

## Grounding

No dedicated Class 4 wastewater bank folder exists in the repo, so per
the build rule this course proceeds on the closest matching bank
structure, content/class1-treatment (the bank used for class1-ww),
deepened through the Class 2 and Class 3 builds to the Class 4 scope
in the OWWCO and WPI Need-to-Know progression (recorded in
AUTHORING-BRIEF.md): plant and utility management, advanced biological
nutrient removal strategy leadership, whole plant mass and energy
balance evaluation, biosolids strategy, effluent quality and
compliance leadership, energy management and resource recovery
awareness with given values, technology evaluation and pilot
leadership, capital planning awareness, risk and emergency leadership,
regulatory leadership, and Ontario Regulation 129/04 at the Class 4
level. Exponential and logarithmic numerics are avoided; all kinetics
style work uses given rates and factors. Sources are listed in
sources.json (Spellman Handbook, US EPA municipal wastewater
resources, US EPA process control and nutrient removal guidance,
OWWCO, WPI 2025 Need-to-Know for Wastewater Treatment Class IV,
Ontario Regulation 129/04, CCOHS). The Drive textbooks Ay mentioned
were inventoried (SOURCES.md in the build root): none are reachable in
the connected Drive, so no task cites a Drive textbook yet; a
re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and task level is an
  enum of "oit" and "class1" with no class4 value. This package uses
  the real registry courseKey "class4-ww" and level "class1" as the
  documented placeholder throughout. The repo team must extend the
  schema enum and the registry allowlist, and map the level, before
  this package can be served.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each package, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board
  endorsed.
