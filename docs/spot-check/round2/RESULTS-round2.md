# Spot-check round 2: AI review, 2026-11-15

Reviewer: Claude Opus 5.5 (same caveat as round 1: a different model from the author, but the same family, so not an independent human check).

Sample: 300 new live items from main `c5e8ba56`, 100 each for Classes 1 to 3, seed `20261201`. It excludes every round 1 item and the 107 items already queued for replacement.

| File | OK | Unclear | Wrong | Weighted rate |
|---|---:|---:|---:|---:|
| r2-class1.csv | 98 | 2 | 0 | 1.0% |
| r2-class2.csv | 95 | 4 | 1 | 3.0% |
| r2-class3.csv | 98 | 1 | 1 | 1.5% |
| **Total** | **291** | **7** | **2** | **1.8%** |

Round 1 gave 2.0%, so the rate holds at about 2%.

## What round 2 showed

- **The same mistakes recur in rows the samples did not hit.** A second sonar item in another table made the same false claim. A rechlorination board repeated the contested outlet-feed claim. So fixes were applied as pattern sweeps across every table, not just to the sampled rows.
- **US units are about 1% of rows overall,** concentrated in the OIT and Class 1 water tables. They came from unit-lesson rows (gallons, psi, 8.34, feet per second). All 162 such rows (66 unique, the rest copies) were removed from the Canadian draft tables. Git history keeps them for the future US courses.
- One round 1 style call was reversed: black water from sulfide corrosion is listed in AWWA operator manuals, so that item is OK.

## Fixes applied (draft tables)

The sonar wording, rechlorination board, wet-weather step-feed sequence, lime softening pair and scale-layer sequence were fixed in every copy. The hydrant colour item and the Ontario OIT rows in the Class 1 tables were removed, along with all US-unit rows. 78 tables changed. All pass the checker except `oit-batch1` to `3`, which are already live and always report themselves as duplicates.

## Live items

`../live-items-to-replace-20261115.json` now lists 307 live item IDs to exclude: 107 from round 1, 154 using US units, and 46 from the round 2 fixes. This covers items added in the recent releases (overlays). The older base questions were not part of this sweep.
