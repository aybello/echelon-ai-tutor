# Learner reliability repair

Incomplete mock exams previously displayed a full-exam score while saving an answered-only score. This change submits unanswered items as null, scores the complete submitted question list, rejects duplicate/unavailable question numbers, and compares the unrounded score against the 70% threshold. The 309A path reads its governed certification bank.

Results and attempts commit in one transaction. The unique result session is claimed first; retries return the saved result for the same learner and bank without duplicating attempts. A different learner cannot reuse that session. New client session IDs are UUIDs, fitting both result and attempt columns.

The mock workspace keeps a same-tab draft for up to 24 hours, including questions, answers, flags, and a wall-clock deadline. Refreshing restores it without resetting the timer. Results display saving, saved, guest, or retry states. Retaking is disabled while a save is pending or failed, so it cannot overwrite the recovery draft. This is same-tab recovery, not cross-device synchronization.

Study recommendations use course-scoped attempt aggregates for both account and email login, and the readiness label comes from the server.

Individual checkout webhook, browser verification, and both reconciliation paths now record purchase and email intent atomically. A minute-based worker retries with bounded backoff and expiring claims. Eight failed deliveries stop automatic retries and appear in Admin > Purchases > Purchase email delivery, with a retry action. Historical purchases are deliberately not backfilled. SMTP acceptance followed by a process crash can still cause a repeated delivery; this is at-least-once delivery.

## Deployment order

No production migration, merge, or deployment is part of the CI revision. After the revised Quality Gate passes and re-review approves the release:

1. Verify and record database backup evidence before any production schema write.
2. Apply **only `drizzle/0062_purchase_email_outbox.sql`** through the controlled release process. Do not run the unrestricted `pnpm db:migrate:apply` command: it applies all pending migrations. Unrelated pending migrations must remain untouched. This migration only creates the outbox table; it does not update historical purchases.
3. Verify the `purchase_email_outbox` columns, primary key, unique `purchase_email_session_unique_idx` index, and `purchase_email_delivery_idx` index against the SQL. Record the migration checksum and application evidence, and reconcile its ledger entry through the controlled release process. Do not mark unrelated migrations applied or apply them to clear whole-schema verification failures.
4. Merge the reviewed commit, then deploy the server and client together. The new purchase transaction requires the verified outbox table.
5. Validate the live release: verify a test purchase queues and sends one confirmation, and verify an incomplete mock saves the full question count.

Rollback: roll back application code if needed; leave the additive outbox table intact. Investigate queued messages before restarting delivery. No production deployment was performed by this change.

## Verification

Regression tests cover unanswered items, raw pass/fail, duplicate question rejection, transaction rollback, concurrent submission retries, cross-learner session ownership, selected-course recommendations, and failed email retry. The Teams browser journey now continues through answering, refreshing, a failed save, retrying, and database verification of one result and three attempts.
