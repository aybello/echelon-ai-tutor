# BUILD NOTES: class4-wastewater-coll (Ontario Class 4 Wastewater Collection)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (c4wc-ladder01..100) | 100 |
| build-process | 0 | 100 (c4wc-process01..100) | 100 |
| find-calculation-error | 0 | 100 (c4wc-error01..100) | 100 |
| evidence-detective | 0 | 100 (c4wc-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (c4wc-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 258,787 bytes). Each
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
  records (class4-wastewater-coll/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics: system flow accounting (12), infiltration accounting
  (12), rainfall dependent inflow volumes, savings and effectiveness
  (15), capacity planning with given peaking and growth factors (15),
  lift station energy and reliability quantities (12), rehabilitation
  program quantities (12), cleaning and CCTV program planning (10),
  odour control program quantities (8), surcharge storage (4).
- Error families target Class 4 failure modes: system flow accounting
  component omissions, double counts and conversion slips (20),
  infiltration and rainfall program effectiveness errors (20), capacity
  planning growth and peaking errors (20), lift station fleet energy
  and reliability quantity errors (20), rehabilitation program quantity
  and forecast errors (12), odour program quantity errors (8).
- Process topics, ten themes of ten: CMOM leadership at utility scale,
  utility management strategy, infiltration and inflow strategy, lift
  station and force main asset strategy, odour and corrosion strategy,
  overflow risk and regulatory leadership, rehabilitation, renewal and
  capital planning, asset management strategy, emergency management
  leadership, overall responsible operator and supervisory leadership
  under Regulation 129/04.
- Evidence tasks: 100 unique prompts at Class 4 depth (lift station
  fleet reliability and assets 16, utility scale infiltration and
  inflow strategy 15, rehabilitation strategy and effectiveness 15,
  CMOM program audits 14, overflow risk and regulatory leadership 14,
  odour and corrosion asset protection 12, capital priority 7,
  emergency leadership and supervisory audits 7), each keyed inference
  the only option consistent with all observations.
- Em dash check: zero occurrences in all task, verify and package
  files. Any folder grep match is the escaped codepoint inside a
  generator script's own no-em-dash assertion, not content.

## Grounding

No dedicated Class 4 collection bank folder exists in the repo, so per
the build rule this course proceeds on the closest matching bank
structure, content/class1-networks (the bank used for
class1-wastewater-coll), deepened through the Class 2 and Class 3
builds to the Class 4 scope in the OWWCO and WPI Need-to-Know
progression (recorded in AUTHORING-BRIEF.md): collection utility
management, CMOM style program leadership at utility scale,
infiltration and inflow strategy and long term program evaluation with
given values, lift station and force main asset strategy, odour and
corrosion asset protection strategy, overflow risk management and
regulatory leadership, rehabilitation and renewal strategy, asset
management strategy, risk and emergency leadership, supervisory
leadership, and Ontario Regulation 129/04 at the Class 4 level.
Exponential and logarithmic numerics are avoided; all work uses given
coefficients, rates and factors. Sources are listed in sources.json
(Spellman Handbook, US EPA CMOM Guide, US EPA Alternative Wastewater
Collection Systems Manual, OWWCO, WPI Wastewater Collection Class IV
Need-to-Know Criteria, Ontario Regulation 129/04, CCOHS). The Drive
textbooks Ay mentioned were inventoried (SOURCES.md in the build
root): none are reachable in the connected Drive, so no task cites a
Drive textbook yet; a re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today, and task level is an
  enum of "oit" and "class1" with no class4 value. This package uses
  the real registry courseKey "class4-wastewater-coll" and level
  "class1" as the documented placeholder throughout. The repo team must
  extend the schema enum and the registry allowlist, and map the level,
  before this package can be served.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each package, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board
  endorsed.
