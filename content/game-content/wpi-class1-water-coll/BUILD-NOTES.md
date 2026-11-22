# BUILD NOTES: wpi-class1-water-coll (WPI Class 1 Wastewater Collection, western family)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 0 (no repo pilot) | 100 (wp1wc-ladder01..100) | 100 |
| build-process | 0 | 100 (wp1wc-process01..100) | 100 |
| find-calculation-error | 0 | 100 (wp1wc-error01..100) | 100 |
| evidence-detective | 0 | 100 (wp1wc-evidence01..100) | 100 |
| exam-escape-room missions | 0 | 100 (wp1wc-mission01..100) | 100 |

## Packaging

This course has no pilot package in the repo, so there is no
pilot-baseline.json. The course ships as five files in this folder,
package-1.json through package-5.json, each holding 80 tasks in canonical
mode order with 20 missions generated from that package's own task pool,
so every mission reference resolves inside its own package. All files are
under the 1,048,576 byte package cap (largest: 253,410 bytes). Each
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
  records (wpi-class1-water-coll/verify.json, 200 records) via
  tools/finish_course.py: ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Ladder topics, ten groups of ten: flow conversions, sewer slope,
  pipe volume and velocity, wet well operations, pump cycles, force
  main hydraulics, infiltration and inflow, cleaning and inspection,
  services and safety, cold climate and capacity.
- Error families target Class 1 failure modes: wet well volume (14),
  pump cycles (14), flow conversion (14), pipe velocity (12),
  flushing volume (12), rainfall inflow (12), infiltration rate (10),
  cleaning production (6), chemical and fuel quantity (6). The error
  worker's sample audit caught a corrected line operator defect in
  its first pass; the generator was fixed, everything regenerated,
  and all 100 corrected lines re-inspected before delivery.
- Process topics, ten themes of ten: lift station daily routines and
  alarm response, manhole inspection routines, sewer flushing and
  cleaning routines, CCTV inspection support, confined space entry
  routines, traffic control setup, spill and overflow first response,
  pump checks and wet well cleaning, records and reporting routines,
  cold climate routines.
- Evidence tasks: 100 unique prompts at Class 1 depth in western
  Canadian settings, ten scenario groups of ten: grease blockages,
  roots, wipes and debris, lift station faults, infiltration and
  inflow, manhole and pipe condition, spill causes, odour complaints,
  frozen services, cleaning effectiveness. Each keyed inference is
  the only option consistent with all observations.
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
Wastewater Collection Class I in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, the same bank the Ontario Class 1
wastewater collection build used, transposed west: collection
system components, lift station basics, inspection and cleaning
basics, inflow and infiltration awareness, safety, spill and
overflow first response, records and reporting basics, and cold
climate operation. Regulation framing stays generic and accurate:
provincial wastewater requirements in general terms, with the
federal Wastewater Systems Effluent Regulations and the CCME
Canada-wide Strategy as general federal references; no Ontario
regulations are cited and no provincial regulation numbers are
invented. Sources are listed in sources.json (Spellman Handbook,
WPI 2025 Need-to-Know for Wastewater Collection Class I, CCME
Canada-wide Strategy, Government of Canada Wastewater Systems
Effluent Regulations, US EPA collection system guidance as
background, CCOHS). The Drive textbooks Ay mentioned were
inventoried (SOURCES.md in the build root): none are reachable in
the connected Drive, so no task cites a Drive textbook yet; a
re-citation pass is queued if they are shared.

## Scope notes and gaps

- Contract blocker (FORMAT.md section 5): the live repo contract only
  serves courseKeys "oit" and "class1-water" today. This package uses
  the real registry courseKey "wpi-class1-water-coll" and level
  "class1", which is the natural enum value for a Class I course;
  only the courseKey allowlist blocks serving, and the repo team
  must extend it before this package can be served.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each package, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board
  endorsed.
