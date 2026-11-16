# Request for Manus: western release, one content fix, and operations notes

Written 2026-11-15 after reviewing main at `c5e8ba56`. Four items, in priority order. Nothing here changes grading, access or payments.

## 1. Publish the western (WPI) tables

Branch `claude/hello-5oz7m4`, commits `33b31a96`, `2a4e0e69`, `37403bc7`, and the gap-filling commits listed below. Exactly 92 newly added files named `scripts/game-authoring/data/wpi-class*.ts`. The 92nd, `wpi-class3-water-dist-g1.ts`, was added after the others and is listed in the gap table below.

- 72 files are `wpi-class{1-4}-{water,wastewater,water-dist,water-coll}-t{n}.ts`. They are copies of the matching Ontario course tables, re-keyed to the western course keys.
- 5 files are Class 1 top-ups, named `wpi-class1-water-o{1-3}.ts` and `wpi-class1-wastewater-o{1-2}.ts`. They derive from `oit-batch10` to `12` and `oit-ww-batch5` and `6`.
- 2 files are new Class 1 top-ups written for the western exam: `wpi-class1-water-dist-w1.ts` (commit `2a4e0e69`) and `wpi-class1-water-coll-w1.ts` (commit `37403bc7`).
- Rows naming Ontario, OIT, a class number, or certification and licensing terms were dropped, so a western learner sees no Ontario rules. 174 rows were dropped in the main copies and 3 in the top-ups.
- Each table passes `scripts/game-authoring/check-draft.ts` with no problems, including the duplicate screen against the live bank of its own western course.
- Please use the same fail-closed receipt path as the Class 1 to 4 releases and route each table by its own `courseKey`.

Expected counts, drafts only and before the live banks are added:

| Courses | Result |
|---|---|
| Classes 2, 3, 4, all four systems | At or above 150 per mode in all six modes |
| Class 1 water | 201 to 328 per mode after the top-up |
| Class 1 wastewater | 197 to 285 per mode |
| Class 1 water distribution | 154 to 182 per mode after its top-up |
| Class 1 collection | 155 to 180 per mode after its top-up |

All 16 western courses are at or above 150 per mode in all six modes, counting drafts only.

Thirteen more small tables fill thin topics found by checking the content against the ABC Need to Know outlines (report: `docs/western-need-to-know-coverage-20261115.md`). They are the `*-g1.ts` files below, checker clean. Each adds only items for its listed topics.

| File | Commit | Topics |
|---|---|---|
| `wpi-class1-water-dist-g1.ts` | `a9034144` | generators, electrical controls, swabbing, temporary service, fire flow, pipe materials, crew safety equipment, maintenance management |
| `wpi-class1-water-g1.ts` | `094af463` | blowers, dechlorination, plant security, generators |
| `wpi-class3-water-g1.ts` | `094af463` | plant maintenance management, cross-connection control, standby power |
| `wpi-class1-wastewater-g1.ts` | `d8c28d86` | security, public relations, flow equalization, flotation |
| `wpi-class3-wastewater-g1.ts` | `d8c28d86` | the same topics at depth |
| `wpi-class1-water-coll-g1.ts` | `c1e8f24a` | public health for crews, flow monitoring, electrical controls, security |
| `wpi-class2-water-g1.ts`, `wpi-class4-water-g1.ts` | `2bb6129a` | water treatment Class 2 and Class 4: blowers, dechlorination, security, generators, maintenance management, cross-connection control, electrical controls, cathodic protection |
| `wpi-class2-water-dist-g1.ts`, `wpi-class4-water-dist-g1.ts` | `7a71969f` | distribution Class 2 and Class 4: electrical controls, generators, maintenance management, temporary service, swabbing, thawing, cold weather planning |
| `wpi-class3-water-dist-g1.ts` | `c979cc6b` | distribution Class 3: standby generators, electrical controls, swabbing, temporary service, maintenance management, safety equipment, fire flow testing, thawing, disinfecting new mains (98 items) |
| `wpi-class2-wastewater-g1.ts`, `wpi-class4-wastewater-g1.ts` | `2b3b1d21` | wastewater treatment Class 2 and Class 4: security, public relations, flow equalization, flotation, standby power, communication |

WPI is Water Professionals International, formerly the Association of Boards of Certification. The content is general operator knowledge. It is not matched line by line to the WPI exam outlines yet.

## 2. Fix or exclude one live item and note the units

- File `server/interactiveContent/overlay/2026-11-14-oit-batch-5.json`, item `og-oit-b5-rapid-swipe-0018`.
- Its explanation is wrong: "Multiplying by 24 gives gallons per hour from gallons per minute only if minutes were hours. Use 1,440 minutes per day." The statement is false and correctly keyed, but the explanation does not make sense.
- Please exclude the item by exact id in `releaseExclusions.json`. A replacement is optional. A corrected explanation I would suggest: "There are 1,440 minutes in a day, so multiply by 1,440, not 24."
- The same batch uses gallons and grains per gallon (for example the "Grains per gallon" hardness board near line 1175). The product serves Canada, where metric is expected. A metric conversion pass is a later job, so no action now.

## 3. Saved results: before turning it on

The code is off unless `INTERACTIVE_SAVED_PROGRESS_ENABLED=true`. Good. Before enabling it, please decide:

1. Apply migration `0082_interactive_saved_results` after a verified backup. It adds two tables and changes nothing else.
2. Retention and deletion. `interactive_item_progress.learnerKey` and `interactive_daily_activity.learnerKey` hold `user:<id>` or `email:<address>`. A learner who deletes their account, or asks for deletion, needs their rows removed. Nothing in code does that yet. Please also decide a retention period.
3. Game results stay private to the learner: no readiness score input and no manager view. This is the owner's decision.
4. Optional: a per-user rate limit on `recordResults`. It is already capped at 50 results per call and needs a verified identity.

## 4. Operations notes

- The committed overlays are now about 48 MB of JSON loaded into the server. The engine and router tests went from about 16 seconds to about 263 seconds, and the test runner ran out of memory at the default heap. Passing `--max-old-space-size=8192` on the `node` command line fixed it. `NODE_OPTIONS` is blocked by the test-safety guard, which is correct. CI will need the same flag.
- Measured on main: about 600 MB of server memory, about 3 seconds to import the engine, and about 40 to 80 ms per session. Please check the memory against the production instance size.
- If memory is tight, loading overlays per course on first use is the obvious fix. I have not started on it and will not without a go-ahead.
- Leaving the course games page within 4 seconds of an answer drops up to four unsent answers. This is by design in the current client, to avoid writing under the wrong identity. It is low severity.

## 5. Replace live items the full review found wrong, unclear or in US units

Every game item was reviewed by Claude models (`docs/spot-check/full-review/RESULTS-full-review.md`): 13,669 distinct units covering all 29,943 live items and every table row. 72 planted errors were all caught. 432 units had a problem (17 wrong, 143 unclear, 268 US units in Canadian courses, 4 jurisdiction). The earlier samples (`round1` to `round3`) found about 2 percent; the full review found 1.5 percent in the authoring tables and 6.7 percent in the older base bank.

- The exact live item IDs, courses and overlay files are in `docs/spot-check/live-items-to-replace-20261115.json`. It now lists **2,254** items, computed against main `d4079b66` (after the western release, PR #233).
- Please exclude all 2,254 by exact ID in `releaseExclusions.json`. A wrong item should not stay live while its fix waits.
- **Corrected rows from the draft tables.** About 1,000 of the items come from rows in the authoring tables. The corrected rows are already in the 152 edited tables on `claude/hello-5oz7m4`, all checker clean. Please publish the corrected tables through the normal receipt path, including the Ontario Class 1 to 4 source and shared tables, `oit-ww-batch*`, and the western tables listed above.
- **Four new top-up tables** (Ontario Class 1, generic metric rows from the matching western Class 1 tables) keep these courses at 150 or more per mode after the exclusions: `class1-water-r4.ts`, `class1-water-r4b.ts`, `class1-wastewater-coll-r4.ts` and `class1-water-dist-r4.ts`. They pass the checker.
- **Older base-bank items.** 380 live copies of 288 older items come from no table. Their corrected versions are in `docs/spot-check/full-review/replacement-items.json`: 281 with a corrected item and 7 with none (exclude only). Each entry lists the live IDs it replaces. Please publish the corrected items as a new overlay through the same receipt path. If that is not practical, excluding them alone is safe, since every course stays at or above 150 per mode (lowest 152).
- **The western tables released in PR #233 predate the full review.** They contain items the review corrected: US units in Canadian courses, a reversed hydrogen sulfide statement, the "Racking" board, the swappable steps in the main repair sequence, and others. About 1,060 of the 2,254 items are western. Please exclude them with the rest, and publish the corrected western tables from this branch in their place. Section 1's file list is still the right list; the corrected files replace the released ones.
- After the exclusions and the new tables, every Ontario Class 1 to 4 course and every western course is at or above 150 items in each of the six modes, counting drafts.
- The fixes include: two Ontario chlorine-residual rules under O. Reg. 170/03 that were stated wrongly, the Gould sludge age definition, a settleometer reading, two pump power items, US units converted to metric across the western and Ontario tables, and swappable steps removed from sequences.

## 6. Read-only export of the exam question table, so the exam banks can be reviewed

The game content has now been read in full. The multiple-choice exam questions have not, because they live in the production `questions` table and the review session has no database access. Please send an export rather than a live connection. A snapshot shows exactly what is live, and it keeps database credentials out of the review session.

What to export:

- Every row of `questions`, all banks, with these columns: `id`, `bankKey`, `questionNum`, `module`, `difficulty`, `question`, `options`, `correctIndex`, `explanation`, `steps`, `tip`, `isCalc`, `topic`, `cognitiveLevel`. Please add whatever columns say whether a question is live, hidden, paused or approved, since the review needs to know which questions a learner can actually see.
- One file per `bankKey` (JSON or CSV), plus a short list of row counts per `bankKey` and the time of the export.
- Nothing else. No users, attempts, answers, emails or payment data.

Where to put it: ask the owner. The simplest is a folder in the repo on `claude/hello-5oz7m4`, for example `docs/exam-bank-export/`, if the owner is comfortable with the questions being in the repository. Otherwise the owner can pass the files in directly.

What comes back: a list of question IDs with a verdict, the reason, and a corrected question for each problem. Manus applies any change to the production table. The review session never writes to the database.

## What I will not do without a go-ahead

Apply migrations, set environment flags, change the release gates, or open a pull request. All changes stay on `claude/hello-5oz7m4`.
