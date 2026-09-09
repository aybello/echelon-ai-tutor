# OIT Water and Wastewater Question Package

This package adds two original OIT practice sets to the existing Echelon banks:

- `oit`: 489 OIT Water questions covering Water Treatment and Water Distribution
- `oit-ww`: 483 OIT Wastewater questions covering Wastewater Treatment and Wastewater Collection

The retained package contains 972 questions and 190 calculations (96 Water, 94 Wastewater). The historical filenames ending in `500` are identifiers, not counts. The manifest records the actual stream counts after defective items were removed.

The package follows the four selectable OIT modules identified by OWWCO: Water Treatment, Water Distribution/Supply, Wastewater Treatment, and Wastewater Collection. It is an expanded practice pool, not a reproduction of an official examination form.

## Quality gates

The validator enforces more than count and JSON shape. It checks:

- exact stream, difficulty and calculation blueprints;
- unique item IDs and unique normalized question stems;
- near-duplicate conceptual stems;
- four distinct options, selected giveaway-word checks, and exact agreement with the authored editorial choices;
- scenario-specific conceptual stems (semantic plausibility and a uniquely defensible answer require editorial judgment, not a word-overlap score);
- sentence-cased options and no correct answer that repeats the topic supplied by its stem;
- no strong long-answer cue, no extreme short-answer cue, and no systematic longest/shortest key pattern;
- no item where all three wrong answers advertise the checked qualification shortcuts while its key does not;
- distinct worked answers across the retained variants of every calculation objective;
- physically possible 0-100% options for removal-efficiency calculations;
- independent recomputation of every calculation using the precision stated in its stem;
- balanced answer positions without a repeating A-B-C-D or short-period sequence;
- item-specific source references and minimum explanation quality;
- known inaccurate or nonsensical wording identified in the first PR review.
- direct safety, terminology and rounding regressions identified in the independent PR review.

## Authored alternatives, version 2026-09-09-v4

All 782 conceptual items use the per-question choices in `editorial/water-options.txt` and `editorial/wastewater-options.txt`. Each UTF-8 line is `questionNum|correct answer|distractor 1|distractor 2|distractor 3`; literal pipes are not permitted in choices. The generator then places the key into its existing balanced answer slot. Missing, duplicate or unused editorial rows fail generation. It no longer borrows answers from unrelated objectives. The 190 calculation records, IDs, answer slots, explanations, sources and original exclusion list are preserved by this revision.

The generator is reproducible and preserves the batch-release policy. Edit the authored choices, regenerate, validate and review the resulting diff together. Do not edit generated options alone. The [editorial repair report](../../docs/oit-answer-quality-repair.md) records scope, checks and remaining production verification.

## Safe additive deployment

Question numbers `1001-1500` are reserved for this package. The import never replaces lower-numbered questions, preserving existing question identities, attempts, bookmarks, and analytics.

Generate and validate the committed package:

```bash
pnpm oit:generate
pnpm oit:validate
pnpm oit:import:dry-run
```

The dry run prints a SHA-256 confirmation token for the exact validated payload. Manus can import it after deployment with the production database configured:

```bash
CONFIRM_OIT_IMPORT=<printed-sha256> node scripts/import-oit-question-banks.mjs --apply
```

The apply step is transactional and idempotent. It inserts missing questions, accepts an already-identical import, and aborts rather than overwriting conflicting deployed content. The import is deliberately not run during the application build.

The importer stages missing items as `in_review` and preserves identical existing rows, including their visibility and rejection decisions. There is no mandatory individual approval. Use the exact-package release described in [OIT batch release](../../docs/oit-batch-release.md). It compares content against the complete database banks, publishes matching staged rows as `unreviewed`, and refreshes visible counts and cache versions in one transaction. It does not claim human review and never releases unrelated drafts or rejected items.
