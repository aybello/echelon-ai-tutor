# Billing and managed-job reliability release

This is a code-plus-schema-and-scheduler release. It is not deployed by opening or merging the PR. No production data, email, Stripe object, or schedule was changed during development.

## What changes

- A successful individual Checkout URL records its purchase but cannot sign a visitor into the purchaser's account. Access requires the usual verified identity. Guest buyers are directed to OTP sign-in, without being asked to pay again.
- Individual subscription events use the existing Stripe event ledger. Database/provisioning/customer-lookup failures return a retryable non-2xx response; a committed entitlement is preserved through confirmation-email failures. Completed event replays do not duplicate subscription rows.
- Purchase reconciliation, exam reminders, and study-trigger emails run through authenticated platform-managed HTTP schedules, not application-process timers. Preview hosts cannot run these jobs. Daily durable run records and a cross-day lease serialize replicas. The admin study-trigger button uses that same run record.
- Reminder/study SMTP attempts have durable delivery identities. Ambiguous attempts are held for review instead of blindly resending. This intentionally favors avoiding duplicate nonessential reminders; it does not claim exactly-once SMTP delivery.
- Model-generated email text is escaped before HTML rendering. Checkout without a valid new phone preserves the user's existing phone.

## Before deployment

1. Record the target commit, passing complete Quality Gate, production backup reference, and a verified recovery procedure. Inspect the forward-migration ledger.
2. Apply **only** `0065_scheduled_work` using the backup-gated `pnpm db:migrate:apply-standalone` command with `MIGRATION_TARGET=0065_scheduled_work`. Verify its manifest checksum and `scheduled_work` columns. Do not run an unrestricted all-pending migration command or apply unrelated proposed migrations.
3. Create or identify these project-owned schedules, initially disabled. Retain their task UIDs and confirm all expressions use six fields and UTC:

| Job / POST route suffix under `/api/scheduled/` | UTC expression |
| --- | --- |
| `reconcile-purchases` | `0 0 3 * * *` |
| `exam-reminders` | `0 0 8 * * *` |
| `study-triggers` | `0 0 21 * * *` |
| `purchase-email-delivery` (existing outbox) | `0 * * * * *` |

4. Configure the **production deployment only** before switching traffic:
   - `DEPLOYMENT_ENV=production`
   - `MANAGED_JOBS_ENABLED=true`
   - `MANAGED_JOBS_ORIGIN=https://echeloninstitute.ca` (the actual canonical public origin)
   - `MANAGED_JOB_TASK_UIDS`: a JSON object mapping all four names above to their actual project-owned task UIDs.
   - Existing scheduled-request authentication: platform SDK cron identity, or `x-cron-secret` plus `x-manus-cron-task-uid`. The task UID is an additional restriction, not a replacement for authentication. Do not include secrets in release evidence.
5. Keep jobs disabled in previews, even if a preview uses the shared production database. Remove or disable duplicate legacy schedules. The new build removes these three boot-time cron workers and the boot-time creation of the purchase-email schedule.

**Missing production configuration fails closed, including purchase confirmations.** Verify all four UIDs and authentication before deploying; otherwise queued purchase emails will wait until configuration is repaired. No application replica should create its own schedules.

## Verification and activation

- Use isolated test accounts, an isolated database, Stripe test objects, and a mail sink for pre-release tests. Verify a guest Checkout return cannot acquire a session or token; the same verified purchaser can continue to the course. Test an unrelated signed-in identity as well.
- Verify failed provisioning returns non-2xx, subsequent delivery provisions once, and subscription confirmation failure leaves the entitlement intact. Stripe confirmation email remains at-least-once: a crash after SMTP acceptance but before the ledger checkpoint can repeat a confirmation.
- Verify unauthorized calls fail, preview/wrong-host/wrong-task calls fail, overlapping managed runs cannot send duplicate reminders, and completed daily runs are skipped. The required CI database suite covers leases, replay, UTC rollover, SMTP ambiguity, and individual-subscription recovery.
- After migration, application, and configuration are ready, enable the four schedules. Record task UIDs, deployed commit, migration evidence, and observed successful scheduled responses. A production job execution can deliver real queued messages: perform it only within the authorized release, not as a casual health probe.
- Confirm purchases, entitlements, reconciliation counts, and expected mail delivery through the approved QA journey. Check queued purchase confirmations are draining. Do not use Sally's or another customer's identity as a test account.

## Failure handling

A failed job returns non-2xx and its durable record allows retry. It cannot automatically resend an email already marked completed. The sender uses bounded SMTP timeouts. A lease that expires during slow upstream work must be reacquired through a later run; a stale worker is fenced before another side effect.

Inspect `scheduled_work` for `uncertain` or expired `processing` email records, alongside provider delivery logs and the existing reminder/trigger logs. If delivery cannot be established, do not blindly reset the record. Resolve individually with evidence and explicit operator authorization; a missed reminder is preferable to repeated unsolicited mail. Cooldowns remain in effect after ambiguous trigger attempts.

Disable the affected schedules first when investigating a release failure. Preserve ledger and delivery rows. Prefer a forward fix; reverting to a build with boot-time cron while live SMTP remains configured can restore duplicate senders. The additive table should not be dropped during an application rollback.

## Scope

These changes address checkout identity, individual-subscription provisioning recovery, the three process-local jobs, email HTML escaping, and phone preservation. They do not close the entire earlier audit, prove customer-specific production records, or change course content, pricing, entitlements, or regulatory guidance.
