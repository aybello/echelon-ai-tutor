# Learner reliability repair

Incomplete mock exams previously displayed a full-exam score while saving an answered-only score. This change submits unanswered items as null, scores the complete submitted question list, rejects duplicate/unavailable question numbers, and compares the unrounded score against the 70% threshold. The 309A path reads its governed certification bank.

Results and attempts commit in one transaction. The unique result session is claimed first; retries return the saved result for the same learner and bank without duplicating attempts. A different learner cannot reuse that session. New client session IDs are UUIDs, fitting both result and attempt columns.

The mock workspace keeps a same-tab draft for up to 24 hours, including questions, answers, flags, and a wall-clock deadline. Refreshing restores it without resetting the timer. Results display saving, saved, guest, or retry states. Retaking is disabled while a save is pending or failed, so it cannot overwrite the recovery draft. This is same-tab recovery, not cross-device synchronization.

Study recommendations use course-scoped attempt aggregates for both account and email login, and the readiness label comes from the server.

Individual checkout webhook, browser verification, and both reconciliation paths now record purchase and email intent atomically. A minute-based worker retries with bounded backoff and expiring claims. Eight failed deliveries stop automatic retries and appear in Admin > Purchases > Purchase email delivery, with a retry action. Historical purchases are deliberately not backfilled. SMTP acceptance followed by a process crash can still cause a repeated delivery; this is at-least-once delivery.

## Deployment order

1. Take the normal database backup and apply forward migration **0062_purchase_email_outbox** using the existing migration runner. The change only creates the outbox table; it does not update historical purchases.
2. Run the strict schema verifier and verify the migration ledger.
3. Deploy the server and client together after the PR quality gate passes. The new purchase transaction requires the outbox table.
4. Verify a test purchase queues and sends one confirmation, and verify an incomplete mock saves the full question count.

Rollback: roll back application code if needed; leave the additive outbox table intact. Investigate queued messages before restarting delivery. No production deployment was performed by this change.

## Verification

Regression tests cover unanswered items, raw pass/fail, duplicate question rejection, transaction rollback, concurrent submission retries, cross-learner session ownership, selected-course recommendations, and failed email retry. The Teams browser journey now continues through answering, refreshing, a failed save, retrying, and database verification of one result and three attempts.
