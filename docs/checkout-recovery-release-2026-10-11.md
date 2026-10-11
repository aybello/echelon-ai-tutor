# Checkout reminder release

This branch preserves required phone collection at Stripe checkout. It does not subscribe customers to promotional calls or texts, and it does not add phone details to analytics.

## Deployment requirements

1. Verify a backup and apply the registered forward migration `0080_checkout_recovery_consent` using the existing guarded migration runner. If `0079_abandoned_checkout_recovery` has not been applied, apply it first. Do not modify the checksum of an already deployed migration. Existing carts keep NULL consent and are never backfilled as opted in.
2. Configure `BUSINESS_MAILING_ADDRESS` with the actual business contact mailing address in the production secret/configuration system. Without it, reminders fail closed before acquiring a delivery claim. Do not invent an address.
3. Bind the existing `/api/scheduled/recover-abandoned-checkouts` task UID in `MANAGED_JOB_TASK_UIDS`, alongside the other managed jobs. The host must be explicitly production-allowlisted. Match the daily 16:30 UTC schedule (`0 30 16 * * *`), not an every-six-hours schedule. No browser or development timer is created.
4. Verify an unchecked reminder box on Pricing, PurchaseGate and QuizGate; buying must remain possible without opting in. Use synthetic non-delivery services for checks, not real customers.

## Delivery and recovery

The server records checkbox acceptance time and notice version in signed Stripe session metadata, then saves that evidence only when the session expires. Only consent-bearing carts are eligible, after six hours and within 14 days. Prior checkout-reminder opt-outs suppress later carts even if they have another opt-in. Do not delete opted-out rows without first moving their suppression state to an equally durable record.

The managed run lease prevents overlapping runs; `scheduled_work` claims keyed by the session prevent replayed or concurrent delivery. A failed database write for an expired session returns HTTP 503 so Stripe can retry safely. Delivery failures cause the managed run to fail rather than report success.

SMTP cannot establish exactly-once delivery. A timeout or a crash during delivery is left processing/uncertain and is **not automatically resent**. Inspect the provider's delivery evidence and the matching `scheduled_work` record before any explicitly approved manual reconciliation. This trades a possibly missed reminder for avoiding duplicate contact.

Reminder copy does not assert that every bank has verified answers or an exact current exam blueprint. Both email formats include the configured mailing address, public support contact and unsubscribe link. Logs contain no recipient address.

## Scope and remaining limits

Real customer identifiers were replaced with reserved-domain fixtures in the current repository tree. This does not remove earlier Git commits, cached copies or already downloaded data; a history cleanup is a separate coordinated change, not a force push in this patch.

The Class II database addition is already released, per PR 144 and October 11 public API counts (753 / 785 / 796 / 810). The draft source statuses remain drafting provenance, not a production hold. No duplicate Class II import or blanket content approval is performed. Individual answer-level expert review and stronger explanations are still separate quality work.
