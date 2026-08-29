# OIT Water and Wastewater Question Package

This package adds two original OIT practice sets to the existing Echelon banks:

- `oit`: 500 OIT Water questions covering Water Treatment and Water Distribution
- `oit-ww`: 500 OIT Wastewater questions covering Wastewater Treatment and Wastewater Collection

Each set contains 250 questions per operating stream and 96 calculation questions. Across the package there are 1,000 questions covering 200 objectives, with four distinct conceptual item forms per objective plus numerical calculations and safety or regulatory capstones.

The package follows the four selectable OIT modules identified by OWWCO: Water Treatment, Water Distribution/Supply, Wastewater Treatment, and Wastewater Collection. It is an expanded practice pool, not a reproduction of an official examination form.

## Quality gates

The validator enforces more than count and JSON shape. It checks:

- exact stream, difficulty and calculation blueprints;
- unique item IDs and unique normalized question stems;
- near-duplicate conceptual stems;
- four plausible, distinct options with no obvious giveaway language;
- scenario-specific conceptual stems and low-overlap alternatives that avoid multiple equivalent answers;
- sentence-cased options and no correct answer that repeats the topic supplied by its stem;
- no strong correct-answer length cue;
- distinct worked answers across all eight variants of every calculation objective;
- physically possible 0-100% options for removal-efficiency calculations;
- independent recomputation of every calculation using the precision stated in its stem;
- balanced answer positions without a repeating A-B-C-D or short-period sequence;
- item-specific source references and minimum explanation quality;
- known inaccurate or nonsensical wording identified in the first PR review.
- direct safety, terminology and rounding regressions identified in the independent PR review.

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

All source-package items remain marked `unreviewed` to show that the JSON itself has not received human sign-off. The importer writes them to the database as `in_review`. Learner-facing reads exclude both `in_review` and `rejected`, so imported questions do not change the advertised learner inventory and cannot appear in study or mock-exam sessions. An administrator must approve each question individually; that action refreshes the bank cache and visible-question total.
