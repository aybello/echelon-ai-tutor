# Exam-date integrity release

This change addresses audit M12. It depends on PR #91's durable reminder delivery and migration 0065. Review this PR as a follow-up to that branch; release #91 first. It does not close the remaining audit findings.

## Result

There is one database-enforced exam-date record per normalized learner email and canonical course. Both the account/dashboard picker and onboarding use the same atomic upsert. Saving the same calendar date preserves sent-reminder history; changing the date resets only that date's history. Onboarding's profile and date commit together, and explicitly clearing its date removes the reminder record. Different courses remain separate.

Dates accept real YYYY-MM-DD calendar days and are stored at UTC noon. The existing TIMESTAMP storage limits the supported range to 1971–2037. Reminder day calculations and email date labels use UTC calendar days rather than the application server's timezone. This is a daily reminder schedule, not an exact local-time appointment.

Reminder workers recheck a scanned row before sending, retain PR #91's durable delivery key and ambiguous-SMTP protection, and acknowledge only the same row/date they actually processed. Concurrent acknowledgements append without erasing other intervals. A date edited after SMTP has begun cannot recall that email, but its acknowledgement cannot mark the replacement date as reminded. Clearing and re-adding the same date also retains the durable once-per-date/interval delivery record.

## Controlled release

1. Review the exact head and complete Quality Gate. Verify PR #91 and migration 0065 have been released. No production migration, customer change or email is performed by this PR.
2. Verify a recoverable production backup. Pause **all** exam-date writers (old application replicas, account/dashboard/onboarding writes) and the reminder schedule for the reconciliation-to-deployment window. A process-local flag is not a substitute for pausing all replicas. Keep them paused until the unique index and new code are verified.
3. Run the read-only plan in a private release workspace:

   ```sh
   umask 077
   pnpm exec tsx scripts/db/reconcileExamDates.ts > /private/release/exam-date-plan.json
   ```

   DATABASE_URL must identify the intended production database. The output includes learner data; never commit it, attach it to a public PR, or paste it into shared logs. Review the exact SHA and each proposed change. The plan groups normalized email/course aliases, keeps the most recently updated row (highest ID breaks ties), and unions sent intervals only for that row's exam day. It exposes every previous date: a later reminder write can affect updatedAt, so **do not assume the automatic winner expresses the learner's latest intention when dates differ**. Resolve conflicting dates from appropriate customer/support evidence before applying if that winner is not justified. Unknown courses, malformed histories and conflicting organization ownership are blockers, not discarded rows.
4. Apply only the reviewed snapshot, writing a new private backup file:

   ```sh
   EXAM_DATE_RECONCILIATION_APPROVED=APPLY_REVIEWED_EXAM_DATES \
   EXAM_DATE_WRITERS_PAUSED=ALL_WRITERS_PAUSED \
   MIGRATION_BACKUP_CONFIRMED=BACKUP_VERIFIED \
     pnpm exec tsx scripts/db/reconcileExamDates.ts --apply \
       --sha256 REVIEWED_SHA --backup /private/release/exam-dates-before.json
   ```

   The tool locks the selected records in a transaction, refuses stale snapshots/blockers, writes and fsyncs the complete original rows and plan before modifying anything, preserves keeper IDs/ownership, verifies the result, then commits. The backup path must be new (created with mode 0600). A changed snapshot or failed verification causes rollback. It refuses alias normalization when an existing hashed legacy reminder-delivery record would become disconnected; reconcile that delivery evidence explicitly before proceeding. Do not erase or reset uncertain delivery records to force the tool through.
5. Apply **only** proposed migration 0066 using the existing guarded standalone command:

   ```sh
   MIGRATION_APPROVED=APPLY_APPROVED_STANDALONE_MIGRATION \
   MIGRATION_BACKUP_CONFIRMED=BACKUP_VERIFIED \
   MIGRATION_TARGET=0066_exam_dates_unique \
     pnpm db:migrate:apply-standalone
   ```

   Confirm the ledger records 0066 as applied and `exam_dates_email_product_unique` is UNIQUE on `(email, productKey)`. This migration intentionally fails if duplicates remain. It does not delete or normalize production data itself. Do not use the unrestricted all-pending migration command. The verifier must not ignore this missing unique index.
6. Deploy this code before resuming date writers and the managed reminder schedule. Using an approved QA identity, save the same date from the picker and onboarding, refresh, change it, and clear it; confirm one canonical row, correct countdown and preserved/reset history as appropriate. Use mocked SMTP or a controlled test recipient for reminder validation, never a customer.

## Recovery and verification

If reconciliation or index creation fails, keep writers paused and inspect the error; do not deploy code that assumes the unique index. The reconciliation transaction rolls back its own failed writes, and its private backup plus the verified database backup preserve every original duplicate. Restore only under maintenance with a reviewed, ID-scoped plan; replacing the whole table after traffic resumes could erase new learner changes. Do not casually remove the unique index during rollback. Older select-then-insert code may reject concurrent saves under that index, so any application rollback also requires a deliberate maintenance/release decision.

Tests cover concurrent alias/canonical saves, independent courses, replay history, late acknowledgement, concurrent delivery, ownership, the two public save paths, invalid calendar dates, clearing onboarding, reconciliation replay, stale SHA, private backup permissions, legacy delivery protection and enforcement of the unique index. The real reconciliation CLI is tested against its own temporary database, not a production connection. Existing database and browser journeys remain required.

References: [MySQL atomic upsert](https://dev.mysql.com/doc/en/insert-on-duplicate.html), [MySQL locking reads](https://dev.mysql.com/doc/refman/8.3/en/innodb-locking-reads.html). Database constraints and transaction behavior are also exercised by the Quality Gate.
