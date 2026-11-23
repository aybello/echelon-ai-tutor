# Duplicate and Safety Report: Exam Bank Gap-to-1000 Package

Build date: November 23, 2026. Package: 5,442 new items across 26 learner-visible banks, staged only. This content is AI-authored and mechanically verified. It has NOT had human or subject-matter expert review, and it must pass the Privacy Gate and Quality Gate before any production release (see README.md).

## Verification summary (final full-package sweep, all 26 banks)

Every bank passed every check with zero hard failures:

- Schema validation (validate_gap.py): 0 errors, 0 warnings on all 26 banks. Exact field sets per schema variant, canonical bankKey on every item, questionNum and itemId matching the assignment plan, composition, difficulty and cognitive level matching the assignment plan, module membership against the per-course SPEC list.
- Calculation verification (verify_calcs_gap.py): 1,088 calculation records recomputed in exact rational arithmetic, 0 problems. Every verify expression reproduces its expected value at the stated decimal places, and every in-item calculation field cross-checks (correctAnswer, calculationExpression, decimalPlaces, unit, steps).
- Deduplication (dedup_gap.py): exact 0, near 0, expression duplicates 0, answer-option set collisions 0, cross-bank exact 0, on all 26 banks.
- Quality checks (quality_checks.py): 0 hard flags on all 26 banks (no per-item correct-to-distractor length ratio above 2.5, no correctIndex position above 40 percent in any batch, true/false share 0 percent everywhere).

## Dedup method and corpus

For each bank, the comparison corpus is the bank's repo content seed files (where the Nov 22 build had them; the seed lists in gap_config.json were verified identical to the Nov 22 build's own dedup lists for all 26 banks) PLUS all 200 Nov 22 staged additions for that bank. Production inserted 6,988 of the 7,000 Nov 22 items; deduplication ran conservatively against all 7,000. Checks applied: exact normalized stem (against the corpus, within the new set, and across all banks including a global Nov 22 exact pool), masked-stem Jaccard similarity at or above 0.85 within bank, calculation-expression duplicates, and answer-option set collisions.

Stated limitation: no live-bank export file exists. The production seed banks live in the database, not in the repository, so deduplication ran against the repository content packages and the full Nov 22 staged set. The governed importer should re-run deduplication against a live database export before release.

## Repairs made during verification

49 originally generated items in 12 banks were rejected pre-acceptance and replaced in place (same questionNum, itemId, topic, difficulty, and position), recorded per item with reasons in each bank's disposition.json. Causes: masked-stem near-duplicates of existing items (mostly bare single-step calculation shapes such as plain F/M ratio, SVI, clarifier loading, percent removal, and rainfall x area x coefficient RDII volume), exact stem duplicates, calculation-expression duplicates, one answer-length tell, and one set of three items copied from an earlier batch in the same build. Every replacement was re-verified through the full suite; final counts are exact.

Coordinator-level corrections, also recorded in disposition.json files: module values set to the exact combined SPEC module strings where workers had split them (class3-ww, class4-ww, wpi-class1-wastewater), and money-answer formatting normalized to the bank house format (dollar sign, no thousands commas) on three wpi-class2-water-coll items so the calculation verifier's answer cross-check passes.

## Safety and content-rule checks

- No item claims official exam-board wording, leaked questions, guaranteed results, or regulatory endorsement.
- No invented regulation limits or factors: Ontario courses cite Ontario regulations as the per-course SPECs direct; WPI courses cite no Ontario regulations and invent no provincial regulation numbers. Where an assignment topic named an Ontario regulation for a WPI course, the item body was authored on the same duty substance in generic provincial terms, with the assigned topic string retained in the topic field only. Calculation stems state every factor they need.
- No em dashes in authored text (the only em dashes in the package sit inside verbatim sourceTitle values copied from the SPEC source lists). No en dashes in question, explanation, or correctAnswer fields.
- Absolute-word review: 40 items across the package have an absolute word (only, must, always, never, all) inside the correct option. Each was reviewed individually by the coordinator and accepted as a factual statement of scope, method, safety, licensing, or design requirement, not an answer shortcut. The itemIds and reasoning are recorded in the disposition.json files.
- Answer-length metric: the share of items where the correct option is strictly the longest ranges from 6 percent to 57 percent per bank (highest: wpi-class3-water-coll at 57 percent, class2-water at 57 percent). This is a reported metric only; no item in any bank exceeded the per-item length-ratio hard threshold. The Quality Gate may want to spot-check the two 57 percent banks.
- True/false balance: 0 percent true/false items in every bank.
- Numbering: new items continue each bank from questionNum 2451 and itemId suffix 451, collision-free against the Nov 22 ranges (2251 to 2450, suffixes 251 to 450). No existing item was changed, and no Nov 22 withheld item was restored; the package only adds new items under new numbers.

## Canonical key note for the WPI collection banks

The live registry (shared/courseRegistry.ts, main, file SHA 4ecbb2720545b5e278e120fdb68e459e5c5dac6c, re-confirmed at push time) defines the WPI water-collection courses with courseKey wpi-classN-water-coll and canonical questionBankKey wpi-classN-wastewater-coll. Every item in those four banks carries the canonical registry bankKey. The Nov 22 staged items for these courses carried bankKey wpi-classN-water-coll; the owner brief's post-import live totals for these surfaces confirm the items sit under the canonical registry bank, so this package follows the registry. The governed importer should confirm the normalization matches the Nov 22 import before release. Full mapping: MANIFEST.md.
