# Spot-check results: AI review, 2026-11-15

Reviewer: Claude Opus 5.5. It is a different model from the one that wrote the items, but from the same family, so this is a stronger check than self-review and not an independent human check. A person in the field should still look at the `WRONG` and `UNCLEAR` items, and at a sample of the `OK` ones.

Verdicts and notes are filled in the six CSV files in this folder.

## Result

| File | Items | OK | Unclear | Wrong | Weighted rate (wrong + half unclear) | Action from the README thresholds |
|---|---:|---:|---:|---:|---:|---|
| class1.csv | 100 | 94 | 6 | 0 | 3.0% | fix or exclude the 6; review about 100 more Class 1 items |
| class2.csv | 100 | 95 | 4 | 1 | 3.0% | exclude the wrong item; fix the 4; review about 100 more Class 2 items |
| class3.csv | 100 | 97 | 1 | 2 | 2.5% | exclude the 2 wrong items; fix the 1; review about 100 more Class 3 items |
| class4.csv | 100 | 98 | 2 | 0 | 1.0% | fix the 2 |
| oit-water.csv | 50 | 50 | 0 | 0 | 0% | none |
| oit-wastewater.csv | 50 | 49 | 1 | 0 | 1.0% | fix the 1 |
| **Total** | **500** | **483** | **14** | **3** | **2.0%** | |

The README treats samples of 100 as rough: a true rate could be a few points either side.

## The three wrong items (exclude by item ID)

| Sample | Item ID | Problem |
|---|---|---|
| CLASS2-021 | see class2.csv | Says sonar maps a pipe above and below the water line. Sonar sees only the submerged part. |
| CLASS3-035 | see class3.csv | Board pairs "checking condition" of a force main with "annual pump calibration". |
| CLASS3-095 | see class3.csv | Says a restriction raises motor current. For centrifugal pumps a discharge restriction usually lowers it, so the keyed answer and the explanation are backwards. |

## What the unclear items have in common

- **Weak cause-effect or before-after items** (4): the cause changes nothing, no baseline is given, or the two steps happen at the same time.
- **Boards with two pairs that could swap** (2).
- **Practice-dependent claims** (2): tank rechlorination point, and the order of steps at a sewer backup.
- **US units** (4): pounds and 8.34, miles, gallons. That is 4 of 500, close to the 1% estimate when the sample was drawn.
- **Wording** (2): "falling inflow", and step feed described as moving solids out of the clarifier.

## Other observations (not counted as faults)

- Many odd-one-out items are easy because the intruder is plainly from another field (for example "Turbidimeter" as a hydrant part, or "Steel" as a plastic pipe). They are correct but do little at Class 3 and 4.
- The odd-one-out explanations use a template that sometimes reads badly ("Ions is dissolved or microscopic").
- Before-after explanations end with a fixed sentence that repeats the answer ("X comes before Y"). This is harmless, but it reads as filler.
- No item reviewed relied on an Ontario-only rule except OIT-WASTEWATER-040 (Ontario exam eligibility). That item is in an Ontario course, so it is fine there.

## Next steps

1. Manus excludes the three wrong items by their exact IDs (column `item_id` in the CSVs).
2. Rewrite or exclude the 14 unclear items. The notes say how to fix each one.
3. A person in the field checks this review, especially the three `WRONG` calls and about 30 `OK` items picked at random.
4. Draw a second sample of about 100 items each for Classes 1 to 3, as the thresholds suggest: `python3 -I scripts/game-authoring/make-spot-check.py . 20261201`.
