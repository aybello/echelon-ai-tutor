# Product trust repair

This branch corrects the wastewater Process Guide, the actual math-guide seed, and Equipment Lab fallback. It needs no schema migration. It does not publish content or change production data during local validation.

## Release

1. Run TypeScript, the deterministic suite, production build and `pnpm exec playwright test e2e/equipment-lab-three.spec.ts`. CI also retains the existing Teams journey. The normal WebGL tests require a working software or hardware WebGL 2 implementation; they now require a drawn frame, not just a canvas element. Separate tests deliberately disable WebGL on desktop/mobile, lose an active context, and block the 3D module download.
2. Review/merge the tested branch and deploy through the existing release process. Verify `/wastewater`: illustrative ranges, corrected legal context and reference links. Verify `/equipment-lab` in both render modes.
3. The published math guide is a database article. Deploying the seed correction alone does not change it. With the production connection supplied securely in the release environment, run this **read-only** command:

   ```sh
   node scripts/correct-ontario-math-guide.mjs
   ```

   Review the returned article ID, changed fields and SHA-256. Preserve a verified production backup. Then run the targeted correction with the exact returned hash and a new private backup path:

   ```sh
   node scripts/correct-ontario-math-guide.mjs --apply --expected-sha256=REVIEWED_HASH --backup-file=/secure/backups/math-guide-before.json
   ```

   The command locks the one article, refuses a changed baseline, durably writes its row backup before updating, reads back its changes, and rolls back on failure. It preserves the slug, publication state/date, author and identity. It does not run other seeds or migrations. Repeating against the corrected article is a no-op. Store the backup outside the public web root and repository.
4. Read `/blog/ontario-water-operator-exam-math-formulas-cheat-sheet` and its metadata after publication. Confirm the review date, OWWCO reference and available-chlorine mass basis; confirm the old universal 20% and no-formula-sheet claims are absent. Rerun the dry-run: `changedFields` must be empty. If serving caches retain old content, invalidate the article cache through the normal release process and verify again.

## Sources and scope

References checked September 13, 2026:

- https://owwco.ca/preparing-for-your-exam/ — distinguishes Ontario OIT content from WPI Class I–IV and links formula/conversion resources. Availability must be confirmed for the learner's specific sitting.
- https://www.ontario.ca/laws/regulation/040129 — operator licensing and sewage works classification.
- https://www.ontario.ca/document/design-guidelines-sewage-works — design context, not a replacement for facility approval conditions.
- https://www.ontario.ca/laws/regulation/030267 — nutrient management/NASM framework; agricultural biosolids application is not authorized by a generic “Category 1” label.

## Class IV evidence still required

The repository does not contain the exact released 907-question candidate package. Preserve the private `release-manifest.json`, `existing-questions.json` (657), `new-questions.json` (250), and release/post-release evidence together. Verify manifest checksums using `hashWpiQuestionRows` and `hashWpiNewQuestionRows` before auditing. Do not rerun the one-time release importer against an already released bank.

Run the offline evidence audit against that private package:

```sh
node scripts/audit-wpi-class4-evidence.mjs --package-dir=/private/package --report=/private/new-evidence.json
```

It checks checksums, completeness, options, category availability, reference metadata and conspicuously long correct answers. Unmapped categories are reported explicitly. It writes a private report and never connects to the database. Its cue flags are screening evidence, not proof an answer is bad.

The release planner now rejects malformed, empty or indistinguishable options and missing explanations in **existing replacements as well as additions**. This is structural validation, not verification of factual answers.

For the relevant WPI standardized Class IV edition, inspect 100-question mock evidence against the official 28/42/15/15 content outline, 25 recall/75 application and 16 calculation items (7/4/0/5 by content area). Confirm the edition with Manitoba's certification authority. These are **exam** targets; the entire 907-question practice bank need not have those exact percentages. The current mock selector uses module targets but does not establish cognitive/calculation balance. Preserve actual generated mock evidence before claiming full blueprint alignment.

Source: https://gowpi.org/wp-content/uploads/2026/04/WastewaterTreatment-%E2%80%93-Class-4_mh-fin.pdf

The historical OIT full-bank quality review likewise requires the complete current export; the partial corrections in this repository do not establish that the rest of that bank has been reviewed.

## Local validation evidence

September 13, 2026: both TypeScript configurations and the production build passed. The discovered deterministic suite passed 1,114 tests; 16 database-dependent cases were skipped without a database. All six Equipment Lab browser cases are discovered and included in CI. Local browser execution remains unverified: the Chromium download timed out, and the available remote browser cannot reach this workspace's localhost. Require the remote browser stage before release. No production article correction or question import was executed.
