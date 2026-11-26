# Offline restore-drill evidence review

This checklist reviews **already captured, authorized evidence only**. It does not perform a restore, connect to a database, change backup settings, create paid resources, or establish a new backup schedule.

## Current evidence boundary

The [provider verification record](./digitalocean-backup-pitr-verification.md) establishes that restore/PITR controls were visible on September 18, 2026. It explicitly leaves actual restore success unverified. The October 17 executive audit also reports no current successful routine-backup restore drill. These records establish an **evidence gap**, not proof that backups are absent or unusable. Do not mark recovery proven from a migration rehearsal, clone, confirmation flag, or visible provider button.

## Review a supplied drill evidence bundle

Review the bundle offline in a private location outside the repository. Do not copy connection strings, customer rows, authentication tokens, encryption keys, or raw database exports into the report. Request missing evidence from the authorized recovery owner; do not generate it against production during this review.

| Evidence | Acceptance check |
| --- | --- |
| Authorization and owner | Dated approval identifies the recovery owner and separate isolated target. |
| Backup identity and recovery point | Selected backup/export identifier and UTC recovery point are explicit. A comparison to a later changing production snapshot is not equivalent. |
| Isolation | Evidence identifies a separate restored database and shows production application routing was not changed. Provider-created paid resources require separate authorization. |
| Start and finish | UTC restore start, usable completion, and measured elapsed time are recorded; measured data loss/recovery-point age is distinguished from restore duration. |
| Schema | Non-sensitive table inventory, migration ledger, and required constraints match the intended release. |
| Data | Counts and, when available, aggregate digests use the same documented method and selected recovery point. Cover question banks, learner accounts, purchases, subscriptions, organizations, team licences, recovery audit records, and saved progress where present. Missing categories are not assumed to match. |
| Application verification | Separately authorized isolated application evidence demonstrates the required restored-data behavior. Public liveness/health alone does not prove entitlement or saved-progress recovery. No real email, OTP, payment, or customer action is needed for this offline evidence review. |
| Outcome | Every mismatch, unsupported check, and correction has an owner; missing evidence remains blocked, not passed. |

## Private review record template

- Review date (UTC), reviewer, and authorized recovery owner:
- Evidence bundle identifier and capture date:
- Backup identifier and selected recovery point (UTC):
- Isolated target identifier (no credentials):
- Restore start / usable finish / elapsed time:
- Measured recovery-point age or data loss, and measurement basis:
- Schema and aggregate comparisons, method, and mismatches:
- Entitlement and saved-progress verification evidence:
- Result: **verified / failed / blocked by missing evidence**:
- Missing checks, corrective owner, and next action:

A verified offline review means the supplied evidence meets the stated checks; it does not mean this reviewer ran a restore or verified current production. Keep the existing [restore procedure](./digitalocean-backup-pitr-verification.md#required-restore-drill-procedure) and [continuity standard](./business-owned-data-continuity-plan.md#restore-drill-standard) as the authority for any separately approved operational work. Do not create, delete, or reconfigure resources as part of this checklist.
