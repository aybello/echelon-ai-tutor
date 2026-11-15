# Request for Manus: western release, one content fix, and operations notes

Written 2026-11-15 after reviewing main at `c5e8ba56`. Four items, in priority order. Nothing here changes grading, access or payments.

## 1. Publish the western (WPI) tables

Branch `claude/hello-5oz7m4`, commits `33b31a96`, `2a4e0e69`, `37403bc7`, and the gap-filling commits listed below. Exactly 91 newly added files named `scripts/game-authoring/data/wpi-class*.ts`.

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

Twelve more small tables fill thin topics found by checking the content against the ABC Need to Know outlines (report: `docs/western-need-to-know-coverage-20261115.md`). They are the `*-g1.ts` files below, checker clean. Each adds only items for its listed topics.

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
| `wpi-class2-wastewater-g1.ts`, `wpi-class4-wastewater-g1.ts` | `2b3b1d21` | wastewater treatment Class 2 and Class 4: security, public relations, flow equalization, flotation, standby power, communication |

Expected counts, drafts only and before the live banks are added:

| Courses | Result |
|---|---|
| Classes 2, 3, 4, all four systems | At or above 150 per mode in all six modes |
| Class 1 water | 201 to 328 per mode after the top-up |
| Class 1 wastewater | 197 to 285 per mode |
| Class 1 water distribution | 154 to 182 per mode after its top-up |
| Class 1 collection | 155 to 180 per mode after its top-up |

All 16 western courses are at or above 150 per mode in all six modes, counting drafts only.

Seven more small tables fill thin topics found by checking the content against the ABC Need to Know outlines (report: `docs/western-need-to-know-coverage-20261115.md`). They are all `*-g1.ts` files, checker clean, and each adds only items for its listed topics:

| File | Commit | Topics |
|---|---|---|
| `wpi-class1-water-dist-g1.ts` | `a9034144` | generators, electrical controls, swabbing, temporary service, fire flow, pipe materials, crew safety equipment, maintenance management |
| `wpi-class1-water-g1.ts` | `094af463` | blowers, dechlorination, plant security, generators |
| `wpi-class3-water-g1.ts` | `094af463` | plant maintenance management, cross-connection control, standby power |
| `wpi-class1-wastewater-g1.ts` | `d8c28d86` | security, public relations, flow equalization, flotation |
| `wpi-class3-wastewater-g1.ts` | `d8c28d86` | same topics at depth |
| `wpi-class1-water-coll-g1.ts` | next commit | public health for crews, flow monitoring, electrical controls, security |

That is six files, one more than the earlier count of 79 plus these, because the first row above was the only one written before this section was started. The total of 86 includes all of them.

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

## What I will not do without a go-ahead

Apply migrations, set environment flags, change the release gates, or open a pull request. All changes stay on `claude/hello-5oz7m4`.
