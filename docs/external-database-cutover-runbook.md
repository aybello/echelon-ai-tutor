# Echelon Institute External Database Cutover Runbook

## Purpose

This runbook moves the live Echelon application from the platform-managed database to an **Echelon-owned DigitalOcean Managed MySQL cluster**. The target database is independently controlled by the business and is protected with certificate-verified TLS. The process preserves the existing production database until the new connection has passed data, application, and rollback checks.

> **Current state, September 18, 2026:** A protected validation clone completed successfully. The new DigitalOcean database contains the same 62 tables and a matching deterministic aggregate checksum as the then-current production snapshot. It is an independently owned recovery copy, not yet the live application database.

## Controls already in place

The application now has a database-pool configuration path that supports a MySQL URL with mandatory TLS and a CA certificate. When `DATABASE_REQUIRE_TLS=true`, the application refuses to start a new pool unless the database URL requests TLS and `DATABASE_SSL_CA` contains a valid PEM certificate. The pool verifies the certificate authority and does not accept an unverified connection.

The clone utility at `scripts/migration/cloneToExternalMySql.mjs` is deliberately narrow. It reads the source through a TiDB snapshot transaction, refuses to change the source, refuses to write to an external target that is not empty, copies tables and rows only after an explicit approval token, and compares ordered row digests for every table after the copy. Its reports must remain in protected storage outside the repository.

## Required pre-cutover preparation

Before changing `DATABASE_URL`, create a fresh external clone from a production snapshot. The validation clone must not be treated as a final cutover copy because new learner, payment, access, or recovery records may have been written after it was created. The final cloning window needs a short maintenance period that prevents application writes while the snapshot is taken and checked.

The final cutover must use these protected project secrets, never repository files or chat messages:

| Secret | Purpose |
|---|---|
| `DATABASE_URL` | DigitalOcean MySQL connection string for the live application |
| `DATABASE_SSL_CA` | DigitalOcean PEM CA certificate |
| `DATABASE_REQUIRE_TLS` | Literal value `true`, which makes the application fail closed when TLS is not correctly configured |
| `EXTERNAL_DATABASE_URL` | Staging-only external connection string used by migration validation |
| `EXTERNAL_DATABASE_CA` | Staging-only external CA certificate used by migration validation |

## Cutover sequence

1. Confirm the final maintenance window and customer-facing communication plan. New logins, purchases, licence assignments, recovery actions, and other writes must pause during the final snapshot.
2. Create a verified encrypted pre-cutover backup of both the source and the existing external validation clone. Store backup keys in the business-controlled escrow location, separate from the backup artifacts.
3. Refresh the external clone from the frozen source snapshot. Do not use the earlier validation clone as the final state without proving no later writes exist.
4. Verify all source and target table digests match. Check the total table count, row totals, question-bank inventory, purchase/access resolution, subscription state, organization seats, and recovery ledger counts.
5. Update the protected production secrets to the DigitalOcean connection string, PEM CA, and `DATABASE_REQUIRE_TLS=true`. Do not commit any credential.
6. Restart the application, then run a live smoke check for the home page, sign-in, one existing learner entitlement, pricing availability, and a read-only organization dashboard query. Do not create a live Stripe payment for this check.
7. Monitor error logs and the database connection status for 30 minutes. Keep the current platform-managed database intact and unchanged for at least seven days after a clean cutover.
8. If any verification fails, restore the old `DATABASE_URL`, remove `DATABASE_REQUIRE_TLS`, restart the application, and investigate using the protected backups. Do not attempt ad hoc table repair on the new live target.

## Post-cutover business continuity

The business must keep at least two owners on the DigitalOcean account with billing, database, and backup access. The target cluster should have automated daily backups and point-in-time recovery enabled where the plan supports it. An encrypted logical export should also be sent daily to a second business-controlled storage location, such as Cloudflare R2 or a controlled Google Drive folder, with a 30-day minimum retention period.

Once daily backups are configured, run a monthly restore drill into a new isolated database. The drill must confirm that the schema, question banks, learner accounts, purchases, subscriptions, organizations, team licences, and recovery audit records can be restored and that the application can authenticate against the restored copy. Record the date, result, restore time, and any correction needed in the Echelon AI Context Hub.

## Ownership checklist

| Asset | Required owner and access model |
|---|---|
| DigitalOcean account and Managed MySQL cluster | Two named Echelon administrators with billing and database access |
| DigitalOcean database credentials and CA certificate | Stored only in protected project secrets and business-controlled password management |
| GitHub repository | At least two organization owners with protected main branch controls |
| Stripe account and webhooks | At least two account administrators and documented webhook endpoint ownership |
| Echelon domain and DNS | Business-owned registrar and DNS account with two administrators |
| External backup destination and encryption key escrow | Business-controlled account with a documented recovery owner and monthly restore evidence |

## Recovery rule

A backup is not a recovery system until the business has restored it into a separate database and verified the application against that restored copy. The monthly restore drill is therefore mandatory after cutover.
