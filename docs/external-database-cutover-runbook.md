# Echelon Institute External Database Cutover Runbook

## Purpose

This runbook moves the live Echelon application from the platform-managed database to an **Echelon-owned DigitalOcean Managed MySQL cluster**. The target database is independently controlled by the business and is protected with certificate-verified TLS. The process preserves the existing production database until the new connection has passed data, application, and rollback checks.

> **Current state, September 18, 2026:** The authorized production cutover is complete. A fresh separate final target was cloned from a write-frozen source, verified across 62 tables with matching aggregate digest, and selected by the production application. Live status, health, database-backed public read, and a 30-minute production monitor passed. The earlier protected validation clone remains untouched. The original platform-managed source database remains unchanged as rollback protection for at least seven days after cutover. Provider PITR controls are active but are still accumulating history on the new cluster. See [the backup and PITR verification record](./digitalocean-backup-pitr-verification.md).

## Controls already in place

The application now has a database-pool configuration path that supports a MySQL URL with mandatory TLS and a CA certificate. When `DATABASE_REQUIRE_TLS=true`, the application refuses to start a new pool unless the database URL requests TLS and `DATABASE_SSL_CA` contains a valid PEM certificate. The pool verifies the certificate authority and does not accept an unverified connection.

The clone utility at `scripts/migration/cloneToExternalMySql.mjs` is deliberately narrow. It reads the source through a TiDB snapshot transaction, refuses to change the source, refuses to write to an external target that is not empty, copies tables and rows only after an explicit approval token, and compares ordered row digests for every table after the copy. Its reports must remain in protected storage outside the repository.

## Required pre-cutover preparation

Before changing `DATABASE_URL`, create a fresh external clone from a production snapshot. The existing validation clone is a protected recovery artifact. **Never drop, truncate, empty, reset, reuse, or point the final clone at that database.** A separate final target must be newly provisioned and empty before preflight begins because new learner, payment, access, or recovery records may have been written after the validation clone was created. The final cloning window needs a short maintenance period that prevents application writes while the snapshot is taken and checked. The release includes a server-side write fence: when `DATABASE_CUTOVER_MODE=freeze`, every request is rejected except the explicit read-only health and cutover-status paths, before it can reach Stripe, OAuth, tRPC, scheduled jobs, or direct Express handlers. The clone utility refuses its final write unless the production `https://echeloninstitute.ca/api/cutover/status` endpoint reports the active fence twice with two fresh echoed challenges.

The final cutover must use these protected project secrets, never repository files or chat messages:

| Secret | Purpose |
|---|---|
| `DATABASE_URL` | Platform-provided prior source connection. It remains unchanged during the seven-day rollback retention period. |
| `EXTERNAL_DATABASE_URL` | Protected DigitalOcean MySQL connection used by final clone verification and production external routing. |
| `EXTERNAL_DATABASE_CA` | Protected DigitalOcean PEM CA certificate used for certificate-verified external TLS. |
| `DATABASE_CUTOVER_USE_EXTERNAL_TARGET` | Literal value `true` enables the explicit, fail-closed production external route. |
| `DATABASE_CUTOVER_TARGET_DATABASE` | Names the separately verified final target database. This prevents use of the validation clone. |
| `DATABASE_CUTOVER_MODE` | `freeze` during the final clone and `normal` after post-cutover production checks pass. |

## Cutover sequence

1. Confirm the final maintenance window and customer-facing communication plan. Deploy the write-fence release, set `DATABASE_CUTOVER_MODE=freeze`, and restart it. A saved secret alone is not proof that the serving instance has restarted. Publish a fresh project release after the secret change, then confirm twice that `https://echeloninstitute.ca/api/cutover/status` returns `{"writesFrozen":true,"mode":"freeze"}` and that the returned `challenge` is byte-identical to the UUID value sent in that request. Use a different UUID for the second request. New logins, purchases, licence assignments, recovery actions, scheduled jobs, and other writes must pause during the final snapshot.
2. Create a verified encrypted pre-cutover backup of both the source and the existing external validation clone. Store backup keys in the business-controlled escrow location, separate from the backup artifacts.
3. Provision a separate, dedicated, **empty** final external target. Verify its identity and `EXTERNAL_DATABASE_URL` before preflight. Do not alter the existing validation clone in any way. Invoke the final clone with `DATABASE_CUTOVER_MODE=freeze` and the exact `ECHELON_CUTOVER_STATUS_URL=https://echeloninstitute.ca/api/cutover/status`. The script independently checks the live source application's fence twice before it permits any target write and refuses any non-empty target.
4. Verify all source and target table digests match. Check the total table count, row totals, question-bank inventory, purchase/access resolution, subscription state, organization seats, and recovery ledger counts.
5. Enable the protected external route only through `DATABASE_CUTOVER_USE_EXTERNAL_TARGET=true` and the separately verified `DATABASE_CUTOVER_TARGET_DATABASE`. The application fails closed if the protected external connection, CA certificate, or safe target database name is unavailable. Do not commit any credential.
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
