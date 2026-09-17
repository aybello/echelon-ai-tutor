# WPI Class IV Wastewater Treatment — clean-database release

This release restores the exact September 11 reviewed Treatment bank into the clean recovery database: 657 reviewed historical questions plus 250 reviewed additions, for 907 learner-visible questions. It releases exam content only. It does not read or modify customers, purchases, subscriptions, organizations, seats, licences, attempts, bookmarks or email state.

The authoritative private archive is `WPI-Class-IV-Manus-Handoff-907-Questions.zip`, SHA-256 `57f41898a17bdf7920f419b9be5cce1c99fc59e80525a1d2f1fde712945d1f1f`. Do not substitute the earlier partial audit branch or create replacement questions.

## Preconditions

1. Obtain the exact private archive and extract it outside the repository and web root.
2. Identify its canonical release manifest, 657-row original baseline or complete before/after patch package, 657-row reviewed final payload, and 250-row addition payload. The script accepts either a row array or an object containing `questions`; the baseline and reviewed-existing arguments also accept the complete package containing 657 `patches` with `before` and `after` rows.
3. Verify a restorable production backup and retain its private evidence identifier.
4. Confirm the clean database still contains exactly 606 quarantined `wpi-class4-wastewater` rows and no metadata row for that bank.
5. Confirm the applicable certifying authority uses the WPI 2025 Class IV Wastewater Treatment outline before representing the mock as an exact official simulation. The bank remains WPI Class IV, not Manitoba-specific content.

## Plan

Run without `--apply`. It verifies the original ZIP hash, the original 657-row checksum, all package checksums and the 2025 blueprint feasibility. It then locks the 606 clean rows, requires each to match either its approved before-image or reviewed final row, identifies the 51 missing reviewed rows, prints an exact confirmation digest and rolls back.

```sh
DATABASE_URL='mysql://…' \
node scripts/recovery/releaseWpiClass4Treatment.mjs \
  --archive /private/WPI-Class-IV-Manus-Handoff-907-Questions.zip \
  --manifest /private/extracted/release-manifest.json \
  --baseline /private/extracted/original-baseline-or-complete-patches.json \
  --existing /private/extracted/existing-questions.json \
  --additions /private/extracted/new-questions.json
```

The plan refuses a different archive, incomplete payload, changed source row, unknown question, occupied 2001–2250 addition number, duplicate stem, missing classification, infeasible mock blueprint, partial governance state, unexpected metadata or missing snapshot table.

## Controlled apply

Repeat against the unchanged database state with the printed digest and verified backup evidence:

```sh
DATABASE_URL='mysql://…' \
WPI_TREATMENT_BACKUP_EVIDENCE='private-backup-reference' \
CONFIRM_WPI_TREATMENT_RELEASE='<printed digest>' \
node scripts/recovery/releaseWpiClass4Treatment.mjs \
  --archive /private/WPI-Class-IV-Manus-Handoff-907-Questions.zip \
  --manifest /private/extracted/release-manifest.json \
  --baseline /private/extracted/original-baseline-or-complete-patches.json \
  --existing /private/extracted/existing-questions.json \
  --additions /private/extracted/new-questions.json \
  --apply
```

One transaction snapshots all 606 existing clean rows, revises them in place while preserving their clean database IDs, inserts the 51 missing reviewed historical rows and 250 reviewed additions, approves exactly 907 rows, and creates the WPI 2025 28/42/15/15 metadata with 25 recall, 75 application and 16 calculation questions per scored mock. Any failure rolls back everything.

## Verification

After commit, invalidate question caches and verify with an isolated QA learner:

- learner-visible inventory is exactly 907 and no `in_review` row remains in this bank;
- existing clean IDs stayed unchanged and 606 immutable before-image snapshots exist under the release key;
- practice, filters, flashcards, bookmarks and AI explanations load;
- a signed mock delivers 110 unique questions, scores exactly 100, treats ten as hidden unscored pre-test items, and the scored set satisfies 28/42/15/15, 25/75 recall/application and 16 calculations;
- an incomplete or replayed mock submission is rejected;
- no customer, entitlement, purchase, organization, seat, attempt or email row changed.

Do not reopen checkout, Teams or historical customer access as part of this exam release. Those remain separate recovery operations.
