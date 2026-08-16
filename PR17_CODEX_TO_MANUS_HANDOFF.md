# Codex → Manus Handoff — PR #17 Production-Schema Reconciliation

## Purpose

Complete the evidence-gathering and reconciliation work required to bring draft PR #17, `agent/migration-safety`, to a legitimate zero-blocking production-schema verification result.

Codex reviewed `PR17_GPT_RECONCILIATION_BRIEF.md` and agrees with its safety constraints. The current Codex workspace does not have the production `DATABASE_URL`, so Manus must perform the metadata-only production inspection in the environment where that secret is already configured securely.

This handoff does not authorize a production migration, schema write, data write, deployment, merge, or PR status change.

## Required branch

Work on a separate branch:

`agent/pr17-production-reconciliation`

Start from the latest `agent/migration-safety` head and bring in the latest `main`. Do not modify or force-push the existing PR #17 branch.

## Non-negotiable production-safety rules

1. Do not alter production schema or data.
2. Do not run `pnpm db:push`, `pnpm db:migrate:apply`, `pnpm db:migrate:adopt`, historical Drizzle replay, or any migration command that can write to production.
3. Do not execute `ALTER`, `CREATE`, `DROP`, `INSERT`, `UPDATE`, `DELETE`, baseline adoption, ledger writes, or migration application against production.
4. Production inspection must be restricted to `information_schema.COLUMNS` and `information_schema.STATISTICS`.
5. Do not read or export customer rows, users, emails, purchases, question content, payment information, credentials, tokens, database hostnames, or connection strings.
6. Do not print, commit, or send the production `DATABASE_URL`.
7. Do not weaken the verifier, suppress genuine errors, or reclassify differences as warnings merely to make the command pass.
8. Do not merge or deploy PR #17 during this task.

## Step 1 — Capture the exact read-only evidence

Using the production database connection already configured securely in Manus, run:

```bash
pnpm install --frozen-lockfile
pnpm db:verify-migrations
pnpm db:verify-schema
```

Record the complete result for all seven errors and seventeen warnings. Remove any environment or connection details before committing the transcript.

Create or use a metadata-only contract exporter that outputs only:

- table names;
- column names;
- normalized SQL types and enum values;
- nullability;
- defaults;
- primary-key metadata;
- index names;
- uniqueness;
- ordered index columns.

The exporter must not query application tables or output table rows. Add an automated test proving the artifact cannot contain database URLs, credentials, emails, hostnames, or row data.

Save the sanitized metadata artifact in the repository and calculate its SHA-256 checksum.

## Step 2 — Investigate the seven blocking differences

Investigate each blocker independently:

1. Missing index `stripe_event_log.stripe_event_log_status_idx`.
2. `subscriptions.currentPeriodStart` is `NOT NULL` in production but nullable in the expected contract.
3. `subscriptions.province` is an enum in production but `varchar(32)` in the expected contract.
4. `subscriptions.status` is an enum in production but `varchar(32)` in the expected contract.
5. `subscriptions.stripeSubscriptionId` is `NOT NULL` in production but nullable in the expected contract.
6. `subscriptions.tier` is an enum in production but `varchar(32)` in the expected contract.
7. Missing index `team_flex_orders.team_flex_orders_org_status_idx`.

For every subscription field, trace all applicable application paths:

- Stripe Checkout;
- Stripe webhook creation and updates;
- subscription reconciliation;
- historical and grandfathered subscriptions;
- cancellation and renewal;
- admin recovery;
- test fixtures;
- any direct inserts or updates.

Use metadata only to confirm the exact production enum values and nullability. Establish whether all application paths satisfy the deployed constraints before changing `schema.ts` or proposing any migration.

For the two missing indexes, inspect the actual application queries. Determine whether the index is genuinely needed or the repository expectation is incorrect. Do not assume either answer.

## Step 3 — Classify every error and warning

Create:

`docs/pr17-production-schema-reconciliation.md`

Include one row for each of the seven errors and all seventeen warnings.

Use exactly one classification per finding:

- **Verifier defect**
- **Intentional production state**
- **Incorrect schema.ts or baseline expectation**
- **Required additive migration**

Each row must include:

- actual production metadata;
- expected repository metadata;
- code or product evidence;
- classification;
- exact proposed correction;
- whether it requires a future production write;
- whether Ay's explicit approval is required.

The unexpected production columns `organizations.stream` and `subscriptions.updatedAt`, plus every unexpected index warning, must be investigated and documented. Do not silently ignore warnings.

## Step 4 — Make only evidence-supported repository changes

Permitted repository changes are limited to:

- correcting a genuine verifier defect;
- aligning stale `schema.ts` metadata with proven deployed behavior;
- updating the sanitized contract and checksum when supported by evidence;
- adding precise regression tests;
- drafting a forward-only additive migration that is not applied.

If production is missing an index that application queries genuinely require, create a deterministic proposed forward migration and register its checksum. Clearly label it as not applied to production.

If a column discrepancy requires a production schema or data change, document the proposed migration, compatibility analysis, backup requirement, and preconditions. Do not execute it.

Migration 0053 must remain safely adoptable only when its complete live structure matches. Do not replay it.

## Step 5 — Required automated coverage

Add or confirm tests for:

1. MySQL `NON_UNIQUE` normalization for number, string, bigint, and buffer representations.
2. Rejection of invalid `NON_UNIQUE` values.
3. Structurally equivalent index comparison, including uniqueness and ordered columns.
4. Metadata-export sanitization.
5. Reconciled `subscriptions` definitions.
6. `organizations.stream`.
7. `subscriptions.updatedAt`.
8. Both disputed indexes.
9. Forward-manifest checksums and contiguous sequencing.
10. Prohibition on adopting destructive migrations.
11. Read-only verifier failure while any genuine blocker remains.

## Step 6 — Final validation

Run:

```bash
pnpm db:verify-migrations
pnpm db:verify-schema
pnpm test
pnpm check
pnpm build
```

The production verifier must return zero blocking errors. Warnings may remain only when every warning has an evidence-backed classification in the reconciliation document.

## Required deliverables back to Codex

Push the focused branch and open a draft PR. Do not merge or deploy it.

Return:

1. Branch name.
2. Commit SHA.
3. Draft PR link.
4. Path to the sanitized metadata contract.
5. SHA-256 checksum of that contract.
6. Path to `docs/pr17-production-schema-reconciliation.md`.
7. Exact summary from `db:verify-migrations`.
8. Exact production `db:verify-schema` error and warning counts.
9. Full test result and count.
10. TypeScript result.
11. Build result.
12. Explicit confirmation that no production writes occurred.
13. Final verdict: **APPROVE PR #17** or **HOLD PR #17**.

Only return **APPROVE PR #17** when the production verifier reports zero blocking errors, every retained warning is documented, the contract is sanitized and checksum-valid, and the complete validation suite passes. Otherwise return **HOLD PR #17** with the unresolved findings and minimum safe next action.
