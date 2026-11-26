# WPI Class IV Wastewater Collection — clean-database release

This release applies the reviewed September 15 repair package to the 503 quarantined Collection rows recovered into the clean database. It releases exam content only. It does not read or modify customers, purchases, subscriptions, organizations, seats, licences, attempts, bookmarks or email state.

## Preconditions

1. Use the private compiled `collection-historical-repair.json` whose `contentSha256` is `e5aaa005de5231f58c6715a618837d2d6561d82b9a18967c12ffdb90b104268a`. Regenerate it from the protected original export and the repository-authored repair files when possible.
2. Verify a restorable production backup and retain its private evidence identifier.
3. Apply the required database schema through the controlled migration workflow. The `question_content_snapshots` table must exist.
4. Confirm no Collection content or metadata has been manually changed after legacy archive staging.

## Plan

Run the command without `--apply`. It opens a transaction, locks and compares all 503 rows against the reviewed historical baseline, validates the package, prints an exact confirmation digest and rolls back without changing the database.

```sh
DATABASE_URL='mysql://…' node scripts/recovery/releaseWpiClass4Collection.mjs \
  --package /private/collection-historical-repair.json
```

The plan refuses a changed baseline, wrong package digest, incomplete bank, duplicate number, existing metadata, partially released governance state or missing snapshot table.

## Controlled apply

Repeat against the same database state with the printed confirmation digest and the verified backup evidence identifier:

```sh
DATABASE_URL='mysql://…' \
WPI_COLLECTION_BACKUP_EVIDENCE='private-backup-reference' \
CONFIRM_WPI_COLLECTION_RELEASE='<printed digest>' \
node scripts/recovery/releaseWpiClass4Collection.mjs \
  --package /private/collection-historical-repair.json --apply
```

The transaction snapshots every before-image, applies only the reviewed educational fields, batch-approves exactly 503 rows, creates the canonical five-area metadata and activates the WPI 2025 Collection selector. Database identities, question numbers, answer positions and difficulty are preserved. Any error rolls back the transaction.

## Verification

After commit, invalidate question caches and verify:

- learner-visible inventory is exactly 503;
- module filters use 23/23/16/20/18 as the scored mock targets;
- a 100-question mock contains 20 recall, 80 application and 16 calculation questions;
- practice, flashcards, bookmarks and a complete signed mock work with an isolated QA learner;
- the course is named **WPI Class IV Wastewater Collection**, without Manitoba-only wording;
- no customer, entitlement, purchase, seat or email row changed.

Do not make checkout or Teams commercially available as part of this release. Customer recovery and commercial reopening are separate owner-approved operations.
