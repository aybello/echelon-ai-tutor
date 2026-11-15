# Spot-check of the game content

Drawn 2026-11-15 from the live game content on `main` at `c5e8ba56`. The aim is to find out whether the new game items are correct, by having someone who knows water and wastewater work read a random sample.

## Why

The new items (OIT batches 14 and 15, OIT wastewater 9 to 12, and the Class 1 to 4 tables) are mostly written from general operator knowledge. A script checked their structure, such as duplicates and balance. A script cannot check whether a statement is true. The release notes say plainly that it is Claude self-review the owner authorized, not independent verification. This sample is the independent check.

## What is in the sample

500 items, none repeated. Items were chosen at random and spread across the six game modes.

| File | Items | Made up of |
|---|---:|---|
| `class1.csv` | 100 | 25 each from water treatment, wastewater treatment, water distribution, wastewater collection |
| `class2.csv` | 100 | same split |
| `class3.csv` | 100 | same split |
| `class4.csv` | 100 | same split |
| `oit-water.csv` | 50 | OIT water |
| `oit-wastewater.csv` | 50 | OIT wastewater |

Rows are shuffled, so a reviewer does not read 25 rows on one topic in a row.

The sample covers the new content only. It leaves out the older base questions that were live before this release, and the 180 items that are already excluded. The western (WPI) courses reuse the same underlying items, so these results apply to them too.

## How to review (about 3 minutes per item)

Open a file in Google Sheets or Excel. For each row, read the prompt, the options and the "marked_correct" column. The explanation shows why the item says so. Then fill in two columns:

- **verdict**, using exactly one of:
  - `OK`: correct and sensible for an exam on this level.
  - `WRONG`: factually wrong, or the marked answer is wrong.
  - `UNCLEAR`: could be read two ways, or two answers could be right.
  - `OFF-LEVEL`: correct, but clearly too hard or too easy for the level.
  - `OFF-TOPIC`: not something an operator is tested on.
- **correction_or_note**: for anything other than `OK`, one line on what is wrong and what it should say. Add your name or initials in `reviewer`.

Notes for reviewers:
- Judge by general operator practice in Canada. Local rules differ by province, so mark `UNCLEAR` if the answer depends on a local rule.
- Class level is in the file name. Class 1 is entry level. Class 4 is for the person in charge of a large system.
- The mode label tells you what the item asks:
  - **Rapid swipe:** is the statement true? The marked answer is Yes or No.
  - **Speed match:** every listed pair should be a correct match.
  - **Odd one out:** the marked option is the one that does NOT belong.
  - **Cause and effect:** the marked option says what happens to the named quantity.
  - **Tap the flaw:** the marked option is the WRONG statement.
  - **Before or after:** the marked option is the step that comes in the order stated.
- US units (gallons, pounds, psi, feet) in a Canadian product should be noted as `UNCLEAR` with the note "US units".

## Reading the result

Count `WRONG` and `UNCLEAR` per file, then use these thresholds as a starting point:

| Share of `WRONG` in a file | What to do |
|---|---|
| Under 2% | Exclude the wrong items by exact ID. Content is in good shape. |
| 2% to 5% | Exclude the wrong items. Review about 100 more items from the same class and the same systems. |
| Over 5% | Pause that class's content and review the tables behind it before wider use. |

`UNCLEAR` items count as half. Treat the sizes of the samples as rough. With 100 items, a 2% rate could really be anywhere from about 0% to 7%.

## What happens with the answers

- The `item_id` column is the exact live ID. Wrong items can be excluded by that ID in `server/interactiveContent/engine/releaseExclusions.json`.
- `source_overlay` shows which release file the item came from, so wrong items can be traced back to their draft table in `scripts/game-authoring/data/`.
- Fixes then go back through the normal release path.

## Observations while building the sample

- About 1% of the sample (4 of 500) uses US units such as pounds, million gallons or 8.34. For example Class 3 water has a dosing-math item in pounds. Most of the content uses metric. OIT batch 5 is the known place where US units are common.

## Redrawing the sample

`python3 -I scripts/game-authoring/make-spot-check.py` rebuilds the files from the committed overlays. The seed is fixed (`20261115`), so the same overlays give the same rows. After new releases, pass a different seed as the second argument to draw a fresh sample: `python3 -I scripts/game-authoring/make-spot-check.py . 20261201`.
