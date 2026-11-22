# BUILD NOTES: oit (Ontario OIT)

Status: COMPLETE, 2026-11-21. 100 tasks per game x 5 games = 500 items.

## Counts (verified)

| Mode | Pilot | New | Total |
|---|---|---|---|
| calculation-ladder | 4 | 96 (oit-ladder05..100) | 100 |
| build-process | 4 | 96 (oit-process05..100) | 100 |
| find-calculation-error | 4 | 96 (oit-error05..100) | 100 |
| evidence-detective | 4 | 96 (oit-evidence05..100) | 100 |
| exam-escape-room missions | 3 | 97 (oit-mission04..100) | 100 |

## Packaging

The live contract caps a package at 200 tasks and 20 missions
(FORMAT.md section 5), so the course ships as six files in this folder:
package-1.json is the repo pilot package copied unchanged (16 tasks,
3 missions, original receipts). package-2.json through package-6.json hold
the 384 new tasks in canonical mode order, chunked at 77 or 76 tasks, each
with its own missions (20, 20, 20, 20, 17) generated from that chunk's task
pool so every mission reference resolves inside its own package. All files
are under the 1,048,576 byte package cap (largest: 288,327 bytes). New
packages carry computed SHA-256 receipts; per-task sourceIds on new tasks
default to the course's first listed source (Spellman Handbook) pending the
human review pass that assigns per-task citations precisely.

## Verification

- tools/verify_tasks.py run on every worker file and on the merged set of
  all 400 tasks with the merged computation records (oit/verify.json,
  200 records): ALL CHECKS PASSED.
- Every ladder expected value and every error task's corrected governing
  value was recomputed in exact rational arithmetic (fractions, matching
  compareNumericAnswer in the repo) from the stored computation records.
- Error tasks were additionally audited line by line by their author for
  the rule that all lines before firstWrongLineId are correct; several
  self-caught defects were fixed before delivery (documented in the
  worker's working notes, summarized in the course report).
- Process orders were authored against standard practice in the cited
  sources (Spellman Handbook, US EPA manuals, Ontario regulations, CCOHS).
- Em dash check: zero occurrences in all new task files.

## Grounding

Modules and topics follow the repo's OIT banks (content/oit/questions,
972 questions across the water and wastewater banks): module distribution
and topic vocabulary are recorded in AUTHORING-BRIEF.md. Stream split of
new content is roughly 60 percent water, 40 percent wastewater for
calculation modes and 55/45 for process and evidence, matching the banks.
Sources are the pilot package's source list (Spellman Handbook pages) plus
the bank sources (US EPA manuals, Ontario Regulations 170/03, 128/04,
129/04, CCOHS). The Drive textbooks Ay mentioned were inventoried
(SOURCES.md): none are reachable in the connected Drive, so no task cites
a Drive textbook yet; a re-citation pass is queued if they are shared.

## Scope notes and gaps

- The registry has a separate oit-ww course key. The repo pilot package
  covers the OIT level under courseKey "oit" only, and this build follows
  the pilot: one OIT package family spanning both streams. If Ay wants a
  distinct oit-ww package, the wastewater subset can be split out later.
- Level value "oit" is used for every task, as the contract requires for
  this courseKey.
- Missions are programmatically generated reference chains with themed
  titles; they satisfy the schema and mix modes within each chunk, but
  they are the lightest-authored part of the package and a good first
  target for the human review pass.
- Human review status: all content is AI-authored and AI-reviewed, the
  same status the repo pilots declare. Nothing here is exam-board endorsed.
