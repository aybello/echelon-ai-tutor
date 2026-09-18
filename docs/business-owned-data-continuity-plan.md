# Echelon Institute Business-Owned Data Continuity Plan

**Status:** Proposed operating standard
**Owner:** The Ay Bello Group / Echelon Institute
**Prepared:** September 18, 2026

## Executive decision

Echelon must no longer rely on any application-hosting account as the sole owner of its production database. The production database, backup storage, recovery keys, domain, billing, and source code must be owned by Echelon-controlled accounts with at least two recovery-capable administrators.

The immediate recommendation is to keep the current **MySQL-compatible** application architecture and place the next production database in an **Echelon-owned DigitalOcean Managed MySQL account**. This avoids an expensive rewrite while separating customer and payment-access data from Manus. DigitalOcean Managed Databases support MySQL, TLS encryption, daily backups, point-in-time recovery, VPC networking, and online migration.[1] Backups inside the database provider are not sufficient on their own because deleting a database cluster also destroys that cluster's provider backups.[2]

A second, independent backup copy should be encrypted before upload and stored in an Echelon-owned Cloudflare R2 bucket. R2 uses an S3-compatible API, supports durable object storage, has no egress charges, and includes 10 GB of Standard storage per month before storage charges apply.[3]

> **Business rule:** Manus may host or operate the application, but it must never be the only place that owns Echelon customer data, database backups, recovery keys, source code, domain controls, or payment administration.

## Recommended architecture

| Layer | Recommended owner | Service | Purpose | Failure protection |
|---|---|---|---|---|
| Production database | Echelon-controlled DigitalOcean organization | Managed MySQL | Stores users, purchases, subscriptions, organizations, licences, question banks, attempts, and operational records. | App-hosting account loss does not remove the database. |
| In-provider recovery | Same DigitalOcean organization | Managed MySQL backups and point-in-time recovery | Fast recovery from accidental deletion or corruption. | Restores a separate replacement cluster without overwriting recovery history. |
| Independent encrypted backup | Separate Echelon-controlled Cloudflare account | R2 private bucket | Holds encrypted nightly logical database exports and encrypted pre-change snapshots. | Provider-level database loss or account error does not remove all backups. |
| Recovery keys | Two Echelon owners, stored separately from backups | Password manager plus offline recovery copy | Decrypts independent backups. | A backup cannot be lost because its encryption key was stored only beside it. |
| Source code | Echelon GitHub organization | Private repository | Stores application code, migration history, tests, and deployment records. | App-account changes do not remove the code source of truth. |
| Payments | Echelon Stripe account | Stripe | Remains the payment evidence source. | Database recovery can be reconciled against Stripe. |
| Domain and DNS | Echelon-controlled registrar and Cloudflare account | Domain registrar and DNS | Keeps `echeloninstitute.ca` transferable and independently controlled. | A hosting-account loss cannot strand the domain. |

## Why this is the money-first choice

| Option | Business impact | Cost and complexity | Recommendation |
|---|---|---|---|
| Continue with only the managed application database | Lowest effort today, but repeats the same ownership risk. A platform-account problem can again become a customer-access and revenue problem. | Lowest short-term spend, highest outage and recovery risk. | Reject. |
| Echelon-owned Managed MySQL plus encrypted independent backups | Preserves the current application design, keeps customer access portable, and avoids a database rewrite. | DigitalOcean MySQL begins around US$15 per month for a single node and around US$30 per month for high availability. Backup storage should be low at Echelon's present size. | **Choose this now.** |
| Rebuild around Firebase or another non-MySQL platform | Changes the data model and app code during a sensitive recovery period. | Highest delay, engineering cost, and migration risk. | Consider only for a future deliberate rewrite. |

## Ownership standard

Every account below must use an Echelon-controlled mailbox, not a personal or temporary platform account. Use two-factor authentication and have two named administrators who can recover access.

| Asset | Primary owner | Second recovery owner | Minimum evidence to retain |
|---|---|---|---|
| DigitalOcean organization | Echelon-controlled email | Second company owner | Billing owner, API token inventory, recovery codes, database connection details. |
| Cloudflare R2 and DNS | Echelon-controlled email | Second company owner | Bucket name, retention rules, API-token scope, recovery codes. |
| GitHub organization | Echelon-controlled email | Second company owner | Two organization owners, repository recovery instructions. |
| Stripe | Echelon-controlled email | Second company owner | Two administrators, webhook secret rotation record, account ID. |
| Domain registrar | Echelon-controlled email | Second company owner | Registrar login, renewal method, transfer authorization process. |
| Password manager | Echelon-controlled vault | Second company owner | Emergency recovery kit stored offline. |

## Backup standard

### Nightly process

The nightly process must run from a controlled application job, not a temporary development machine. It must:

1. Export the full production database in a consistent logical backup.
2. Validate that the export is readable and contains expected core tables.
3. Compress and encrypt the export locally with a unique random key.
4. Upload the encrypted export to a private R2 bucket.
5. Store the encryption key only in the Echelon password manager and an offline recovery kit, never in the bucket or code repository.
6. Write a non-sensitive manifest containing the backup time, schema version, encrypted file checksum, row-count checks, and restore instructions.
7. Alert both Echelon owners if backup, validation, upload, or retention verification fails.

### Retention policy

| Backup type | Retention | Purpose |
|---|---:|---|
| Nightly encrypted export | 35 days | Covers normal operational recovery. |
| Month-end encrypted export | 24 months | Covers delayed customer, accounting, and access disputes. |
| Pre-migration or pre-release export | Until the change is verified and at least 90 days thereafter | Provides a safe reversal point before database changes. |
| Provider point-in-time recovery | Provider default retention | Fast recovery from recent errors. It is not the only backup. |

## Restore drill standard

A backup has value only if it can be restored. Run a monthly restore drill into a **new isolated database**, never into production.

| Check | Pass condition |
|---|---|
| Decryption | A recovery owner can decrypt the selected backup using the documented key path. |
| Import | The restored database imports without modifying production. |
| Schema validation | Table list, migration ledger, and required constraints match the expected release. |
| Data validation | Non-sensitive counts for users, purchases, subscriptions, organizations, question banks, and questions match the backup manifest. |
| Application smoke test | A temporary environment can connect and complete a read-only health check. |
| Evidence | A dated drill record records the backup used, elapsed time, result, and any correction. |

## Controlled migration plan

Do not change the live database connection until the new database has passed migration and restore validation.

1. **Create the Echelon-owned accounts.** Create an Echelon DigitalOcean organization, Cloudflare account and R2 private bucket, then appoint two owners and enable two-factor authentication.
2. **Take a current protected export.** Create and verify an encrypted export of the present production database before touching the live connection.
3. **Provision managed MySQL.** Create a MySQL cluster in a Canadian region when available. Require TLS and restrict connection access to the application deployment environment.
4. **Migrate into a new database.** Use a controlled copy of the current production database. Do not reset, overwrite, or delete the present database during this step.
5. **Run reconciliation.** Compare schema, migration ledger, question-bank counts, customer-access aggregates, Stripe recovery aggregates, and key entitlement resolution against the existing production database.
6. **Run a staged smoke test.** Point a temporary staging deployment at the new database and test sign-in, learner question delivery, individual checkout retrieval, Teams/Flex management, and protected admin paths without generating live charges.
7. **Cut over during a short maintenance window.** Freeze nonessential writes, take one final encrypted export, update the production database connection secret, and verify production with read-only and owner-account smoke checks.
8. **Keep the old database read-only.** Preserve it for at least 30 days after cutover. Do not delete it until a successful independent restore drill is recorded.
9. **Turn on nightly independent backups and alerts.** The migration is not complete until the first backup and first restore drill both pass.

## Current status and next action

The historic customer data was not fully lost. The protected pre-reset archive, Stripe export, archived subscription records, and historical correspondence allowed controlled restoration of verified customer access. The current clean production database also now holds the reconstructed customer-access state. However, the original platform-owned database account was still an unacceptable single point of failure.

**Next action for Ay:** Create an Echelon-owned DigitalOcean account using an Echelon-controlled email address, add a second company owner, enable two-factor authentication, and send confirmation that the account is ready. After that, the database can be provisioned, migrated, and protected without exposing any secret in chat.

## References

[1] [DigitalOcean Managed Databases documentation](https://docs.digitalocean.com/products/databases/) describes MySQL support, TLS encryption, point-in-time backups, VPC networking, standby nodes, high availability, and online migration.

[2] [DigitalOcean MySQL restore documentation](https://docs.digitalocean.com/products/databases/mysql/how-to/restore-from-backups/) states that MySQL backups run daily, are retained for seven days, and are destroyed when the cluster is destroyed.

[3] [Cloudflare R2 product overview](https://www.cloudflare.com/products/r2/) and [R2 pricing](https://developers.cloudflare.com/r2/pricing/) describe S3 compatibility, durable object storage, zero egress fees, a 10 GB monthly Standard-storage free tier, and published storage pricing.
