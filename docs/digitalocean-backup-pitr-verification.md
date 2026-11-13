# DigitalOcean Backup and Point-in-Time Recovery Verification Record

**Status:** Provider controls verified. First daily-backup and restore-drill evidence pending.

**Owner:** The Ay Bello Group / Echelon Institute
**Author:** Manus AI
**Verified:** September 18, 2026
**Scope:** Echelon production DigitalOcean Managed MySQL cluster

## Executive conclusion

Echelon production now runs on an Echelon-controlled DigitalOcean Managed MySQL cluster. On September 18, 2026, the DigitalOcean dashboard was reviewed without creating, restoring, deleting, or modifying any database resource. The provider exposes both the **Restore from backup** action and an active **point-in-time recovery** selector. A provider restore creates a **new database cluster**, not an overwrite of the existing production cluster.[1]

The provider recovery window was live, but it began at **2026-09-18 20:38:32 UTC**. The cluster was newly created, so this short initial recovery history is expected. It does not yet prove that the first automated daily backup has completed or that the full seven-day provider retention period is available. DigitalOcean documents daily MySQL backups with seven-day retention, subject to the lifecycle of the cluster.[1]

> **Operational conclusion:** Provider backup and point-in-time recovery controls exist and are selectable. Echelon must still complete an isolated restore drill after the first full daily backup becomes available. Provider recovery is not a replacement for an independent encrypted backup outside DigitalOcean.

## What was verified

The provider dashboard exposed an action labeled **Restore from backup** for the Echelon production MySQL cluster. Opening the non-destructive restore dialog confirmed the following controls.

| Control | Verification result | Operational meaning |
|---|---|---|
| Restore action | Available | The production cluster has a provider recovery workflow. |
| Latest transaction recovery | Available | A restore can use the most recent recoverable transaction state. |
| Point-in-time recovery | Available | A restore can target a selected UTC point within the available recovery window. |
| Restore target | New cluster only | Production is not overwritten by a restore operation. |
| Initial recovery history | Began 2026-09-18 20:38:32 UTC | PITR is live but still accumulating history on the new cluster. |
| Stated provider retention | Up to seven days | Recheck once the cluster is seven days old. |

The dialog was closed using **Cancel**. No restore job, test cluster, database, credential, access rule, payment record, learner record, entitlement, or outbound communication was created or changed.

## What is not yet proven

A visible recovery control proves that a recovery path is configured. It does not prove that Echelon can recover its data to a usable state. The following items remain unverified.

The first provider-managed daily backup has not yet been evidenced. Confirm it after **September 19, 2026, 20:38:32 UTC**, which is **September 19, 2026, 4:38:32 PM EDT**. The full seven-day recovery period cannot be confirmed before **September 25, 2026, 20:38:32 UTC**, which is **September 25, 2026, 4:38:32 PM EDT**.

Echelon has not yet run an isolated restore drill. A restore drill must create a temporary new cluster, connect to it with certificate-verified TLS, compare the restored database to the selected recovery point using non-sensitive table inventory and digest checks, record the outcome, then delete only the temporary drill cluster. It must never point the production application at the drill cluster.

Echelon has not yet configured or verified an independent encrypted backup destination. DigitalOcean warns that destroying a database cluster destroys its provider backups, so provider recovery alone does not protect the business from provider-account loss, cluster deletion, or retention expiry.[1]

## Verification schedule

| Milestone | Earliest date and time | Required evidence | Pass condition |
|---|---:|---|---|
| First daily provider-backup check | Sep 19, 2026, 4:38 PM EDT | Restore dialog displays an eligible daily backup or an equivalent provider restore point after 24 hours of cluster history | Provider backup is visibly available without starting a restore. |
| Isolated restore drill | After first backup confirmation and separate approval | New temporary cluster, TLS connection, table inventory, aggregate digest, drill record | Restored data is readable and matches the selected recovery point. |
| Full provider retention check | Sep 25, 2026, 4:38 PM EDT | PITR selector reaches at least seven days into the past | Full provider retention is available. |
| Independent backup activation | Separate approval | Encrypted export manifest in a business-controlled second destination | Backup is stored outside DigitalOcean and has a documented recovery key path. |
| Monthly restore drill | After independent backup activation | Dated drill record | The selected backup is decrypted, imported, verified, and isolated from production. |

## Required restore-drill procedure

The restore drill must be approved separately because it creates a temporary paid database cluster. DigitalOcean restores MySQL backups into a new cluster, which preserves the original recovery timeline and avoids changes to the live cluster.[1]

First, record the intended UTC restore point and the current production table inventory and aggregate digest. Start a restore into a new cluster with a name that clearly identifies it as a temporary drill. Do not provide that cluster to the production application.

Second, retrieve the restored cluster connection information through protected project secrets. Connect with certificate-verified TLS and run read-only inventory and digest checks. Compare the restored schema and data results with the recorded expected values for the selected restore point. Do not inspect, export, or publish personal customer data as part of the drill.

Third, create a dated drill record in the Echelon AI Context Hub. It must state the selected restore point, duration, table count, digest comparison result, responsible owner, and any corrective action. Delete only the temporary drill cluster after the evidence is recorded and the result is accepted.

## Current business-continuity position

The Echelon-owned production database and provider recovery controls remove the prior dependency on an application-hosting account as the sole database owner. This is a material reduction in revenue and customer-access risk. The remaining gap is an independent, encrypted backup outside DigitalOcean, together with two named recovery owners and a repeated restore drill. These controls are required before Echelon can treat its data-continuity system as complete.

## References

[1]: https://docs.digitalocean.com/products/databases/mysql/how-to/restore-from-backups/ "How to Manually Restore MySQL Database Clusters from Backups"
