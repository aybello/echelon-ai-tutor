# Class IV mock balance, equipment labels and published math guidance

Based on PR #82 code-only release checkpoint `17a30c7c` after PR #81's deployment.

## Code release

No schema migration. Deploy this PR after the Quality Gate succeeds. It preserves the latest lazy-module timeout and other Equipment Lab recovery fixes.

- The Equipment Lab exploded view displays 01–07 as legible, projected HTML labels, matching the sidebar. It needs no external font download. Desktop and mobile browser regressions require a rendered 3D scene and all seven labels; an automatic fallback cannot satisfy these tests.
- The blog API and server-rendered article replace the exact known legacy math article body with the approved canonical content from PR #81. The old content fingerprint was checked against the live HTML on September 13. This is a read-time correction, with no database writes, no new publication, and no change to article identity, author or publication state. Other posts, drafts and future edits are not overridden. Each summary/SEO field is repaired only if it independently matches its exact legacy value; newer editorial fields survive even when the body remains old. The list and related-post endpoints apply the same summary correction without fetching article bodies. The reviewed date appears in the corrected article. The existing guarded database correction remains available to align the stored record; after it runs, the read-time correction becomes a no-op.
- The Class IV parser preserves cognitive classifications and normalizes the three documented historic module synonyms across mock, practice and flashcard responses. Canonical practice filters query all matching stored aliases. Other banks remain unchanged. Issued mocks still hide answers and require the complete signed session.

Verify the public math article after deployment, including the JSON API and page source: the old no-formula-sheet and universal-20% claims must be absent. Check `/equipment-lab` in Exploded view on desktop/mobile and with WebGL disabled. Do not infer deployment from a green test alone.

### Verified code-only deployment — 2026-09-14

PR #82 was merged and deployed as code only in checkpoint `17a30c7c`. A TiDB-specific test setup defect was corrected by changing only the integration test's rollback-only snapshot setup from the unsupported combined SQL clause to mysql2's portable `beginTransaction()` API. No Class IV activation, stored article correction, question-content change, migration, sign-in, learner attempt, answer submission, or learner-data write was performed.

The isolated Class IV integration suite passed, followed by the complete repository suite (**1,366 tests**), both TypeScript configurations, and the production build. The nine-case Equipment Lab browser resilience suite then passed locally and against both managed and custom production domains. Those public checks cover a controllable model or explicit Diagram fallback, reduced motion, desktop/mobile no-WebGL recovery, lost context, failed/pending 3D modules, and numbered exploded-view labels, without authentication or learner activity.

Both public domains were directly checked for the math-guide read-time repair after deployment propagation. The guide now shows the reviewed September 13, 2026 framing and OWWCO exam-preparation reference, states that calculation content varies by certification area and level, and removes the legacy universal-20% and no-formula-sheet claims. The stored `blog_posts` row remains unchanged; the guarded stored-row correction was not run.

## Activate the Class IV exam profile only against verified live data

The selector enforces the WPI standardized **2025** wastewater Class IV outline: equipment/treatment/laboratory/safety 28/42/15/15; recall 6/7/7/5; calculations 7/4/0/5. This yields 25 recall, 75 application and 16 calculations. It solves these quotas jointly and shuffles the final exam. A lack of required classified questions produces an explicit error rather than an incorrectly balanced mock.

Source: https://gowpi.org/wp-content/uploads/2026/04/WastewaterTreatment-%E2%80%93-Class-4_mh-fin.pdf

WPI explicitly says certifying authorities may use older or customized editions. Confirm the current Manitoba sitting uses this edition. Do not call a practice profile Manitoba-approved without that evidence.

The production 907-question bank is not available in this workspace. The older 657-question export has no cognitive classifications, so a blind activation could interrupt the paying learner. Existing mocks remain available until the bank's verified profile is activated (`blueprintVersion = 2025`). This is a configuration release check, not a mandatory individual question-approval workflow.

With the production DB connection supplied securely in the release environment, run:

```sh
node --import tsx scripts/configure-wpi-class4-mock.ts
```

The command is read-only by default. It reports coverage, missing classifications, malformed visible rows and whether the joint quotas are feasible. It fingerprints metadata plus all current question rows. If `canActivate` is false, repair the reported classifications/coverage against the exact current export and authoritative sources, then repeat. Never infer cognitive level just from question length, presence of a number or a topic name. Do not rerun the 657+250 importer.

After the code is deployed, the current bank passes preflight, the production backup is verified, and the applicable edition is confirmed:

```sh
node --import tsx scripts/configure-wpi-class4-mock.ts --apply --expected-sha256=REVIEWED_HASH --backup-file=/secure/backups/class4-blueprint-before.json --edition-evidence='Reference to certification-authority confirmation of standardized 2025 edition'
```

This locks the bank rows, checks the reviewed baseline and feasibility again, saves and syncs a new private snapshot, then updates only that bank's metadata, increments its content version and verifies the result. It never edits questions, attempts, purchases or learner records. A changed baseline or failed backup prevents the update. Repeating an already completed configuration is a no-op. Preserve the evidence/backup privately outside the repository and web root.

Use a dedicated test account to start several deployed mocks; inspect the server-side selected question classifications to verify all per-area quotas, unique identities, complete scoring and unchanged access. Public active-exam responses intentionally do not reveal answer keys/classification evidence. Existing saved exam sessions remain valid. If the configured bank later loses sufficient coverage, restore reviewed content or deliberately restore the previous metadata from the backup; do not silently relabel an unbalanced exam as aligned.

## Limits of this release

The tests prove selection, API wiring, transactional guards and public rendering. They do not certify the factual quality of all 907 questions or establish Manitoba's exam edition. The live DB configuration and stored math-article update cannot be executed here because there is no production DB connection. No production content or learner data was changed during implementation.
