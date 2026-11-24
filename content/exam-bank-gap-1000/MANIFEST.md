# MANIFEST: exam-bank gap-to-1000 package (STAGED ONLY)

Build date: 2026-11-23. Objective: add only the missing questions needed to
bring every learner-visible exam bank below 1,000 to at least 1,000 usable
questions. Total requested: **5,442 new items across 26 banks**. No existing
question is regenerated, overwritten, or renumbered. Ontario 309A is out of
scope and untouched. Banks already at or above 1,000 received nothing.

Live totals are the owner's post-import verified figures (production inserted
6,988 approved questions from the Nov 22 expansion). Canonical bank keys were
confirmed against `shared/courseRegistry.ts` on `aybello/echelon-ai-tutor`
main, fetched 2026-11-23 (file SHA 4ecbb2720545b5e278e120fdb68e459e5c5dac6c).

## Confirmed canonical mapping (course key -> registry questionBankKey)

| Learner surface | Course key | Registry questionBankKey (canonical) | Item bankKey in this package | Live | Build | Projected |
| --- | --- | --- | --- | --- | --- | --- |
| Class 2 Water | class2-water | class2-water | class2-water | 949 | 51 | 1000 |
| Class 3 Water | class3-water | class3-water | class3-water | 761 | 239 | 1000 |
| Class 4 Water | class4-water | class4-water | class4-water | 769 | 231 | 1000 |
| Class 2 Wastewater | class2-ww | class2-wastewater | class2-wastewater | 994 | 6 | 1000 |
| Class 3 Wastewater | class3-ww | class3-wastewater | class3-wastewater | 780 | 220 | 1000 |
| Class 4 Wastewater | class4-ww | class4-wastewater | class4-wastewater | 788 | 212 | 1000 |
| Water Quality | wqa | wqa | wqa | 688 | 312 | 1000 |
| Class 2 Water Distribution | class2-water-dist | class2-water-dist | class2-water-dist | 984 | 16 | 1000 |
| Class 4 Water Distribution | class4-water-dist | class4-water-dist | class4-water-dist | 765 | 235 | 1000 |
| Class 3 Wastewater Collection | class3-wastewater-coll | class3-wastewater-coll | class3-wastewater-coll | 770 | 230 | 1000 |
| Class 4 Wastewater Collection | class4-wastewater-coll | class4-wastewater-coll | class4-wastewater-coll | 770 | 230 | 1000 |
| WPI Class 1 Water | wpi-class1-water | wpi-class1-water | wpi-class1-water | 797 | 203 | 1000 |
| WPI Class 2 Water | wpi-class2-water | wpi-class2-water | wpi-class2-water | 793 | 207 | 1000 |
| WPI Class 3 Water | wpi-class3-water | wpi-class3-water | wpi-class3-water | 758 | 242 | 1000 |
| WPI Class 4 Water | wpi-class4-water | wpi-class4-water | wpi-class4-water | 872 | 128 | 1000 |
| WPI Class 1 Wastewater | wpi-class1-wastewater | wpi-class1-wastewater | wpi-class1-wastewater | 791 | 209 | 1000 |
| WPI Class 2 Wastewater | wpi-class2-wastewater | wpi-class2-wastewater | wpi-class2-wastewater | 797 | 203 | 1000 |
| WPI Class 3 Wastewater | wpi-class3-wastewater | wpi-class3-wastewater | wpi-class3-wastewater | 806 | 194 | 1000 |
| WPI Class 1 Water Distribution | wpi-class1-water-dist | wpi-class1-water-dist | wpi-class1-water-dist | 698 | 302 | 1000 |
| WPI Class 2 Water Distribution | wpi-class2-water-dist | wpi-class2-water-dist | wpi-class2-water-dist | 794 | 206 | 1000 |
| WPI Class 3 Water Distribution | wpi-class3-water-dist | wpi-class3-water-dist | wpi-class3-water-dist | 811 | 189 | 1000 |
| WPI Class 4 Water Distribution | wpi-class4-water-dist | wpi-class4-water-dist | wpi-class4-water-dist | 817 | 183 | 1000 |
| WPI Class 1 Water Collection | wpi-class1-water-coll | wpi-class1-wastewater-coll | wpi-class1-wastewater-coll | 698 | 302 | 1000 |
| WPI Class 2 Water Collection | wpi-class2-water-coll | wpi-class2-wastewater-coll | wpi-class2-wastewater-coll | 702 | 298 | 1000 |
| WPI Class 3 Water Collection | wpi-class3-water-coll | wpi-class3-wastewater-coll | wpi-class3-wastewater-coll | 703 | 297 | 1000 |
| WPI Class 4 Water Collection | wpi-class4-water-coll | wpi-class4-wastewater-coll | wpi-class4-wastewater-coll | 703 | 297 | 1000 |

## WPI water-collection mapping note (read before import)

The live registry defines the four WPI collection courses as
`courseKey: wpi-classN-water-coll`, display name "WPI Class N Wastewater
Collection", track `wastewater-collection`, with
`questionBankKey: wpi-classN-wastewater-coll` and the bank key also listed as
the course's alias. There is exactly ONE canonical bank per level behind both
routes. This package therefore generates exactly ONE payload set per level
(folder `wpi-classN-water-coll`), and every item carries the canonical
registry bank key `wpi-classN-wastewater-coll`. No question is duplicated
across the alias.

Divergence from the Nov 22 staged files, flagged for the release verifier:
the Nov 22 staged expansion items for these four courses carried
`bankKey: wpi-classN-water-coll` (the course key) in their staged JSON. The
post-import learner totals in the owner brief (698/702/703/703 for these
surfaces) confirm the items are held under the canonical registry bank, so
this package follows the registry. The governed importer should confirm the
normalization matches the Nov 22 import before release.

## Numbering

Every bank's Nov 22 additions occupy questionNum 2251-2450 and itemId
suffixes 251-450 (verified from the staged additions files for all 26
banks). New items continue collision-free per bank: questionNum 2451 upward
and itemId suffix 451 upward, sequential in batch order. Exact per-batch
ranges are in MANIFEST.json and in each bank's `assignments/batch-<N>.json`.

## Batch plan

123 batches total. Batch sizes split each bank's deficit as evenly as
possible at no more than 50 items per batch. Each batch follows the house
pattern from the Nov 22 build: about 80 percent conceptual, 20 percent
calculation; conceptual difficulty ramps easy, medium, hard; calculation
items split medium then hard; easy items are recall level, the rest
application. Per-item assignments (topic, difficulty, numbering) are in each
bank's assignments folder.

## Exclusions

No Nov 22 item is restored, altered, or renumbered by this package; all
prior exclusion and withholding decisions are preserved by construction
(this package only adds new items under new numbers). No local exclusions
manifest existed in the Nov 22 workspace package to carry forward.

## Status

STAGED ONLY. Not merged, not imported, not live. See README.md for the
release gates this package still requires.
