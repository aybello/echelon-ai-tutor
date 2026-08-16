# GPT Implementation Brief — PR #17 Migration-Safety Reconciliation

## Mission

Work in the repository **`aybello/echelon-ai-tutor`**. Your task is to bring draft PR **#17 — Harden database migration workflow** to a state where its **read-only production schema verifier reports zero blocking errors**. Treat the deployed production schema as evidence that must be reconciled deliberately—not overwritten, normalized away, or guessed.

The PR branch is `agent/migration-safety`. Its current head is `bf3acefe159b15c4589c60b7ce75e99b46435584` at the time of this brief. It already includes a fix for the MySQL `information_schema.STATISTICS.NON_UNIQUE` type-conversion defect and forward-manifest handling for deployed migration `0053_question_governance`.

## Non-Negotiable Safety Constraints

1. **Do not alter production schema or data.** No `ALTER`, `CREATE`, `DROP`, `INSERT`, `UPDATE`, `DELETE`, baseline adoption, ledger writes, or migration application against production.
2. **Do not run** `pnpm db:migrate:adopt`, `pnpm db:migrate:apply`, `pnpm db:push`, historical Drizzle replay, or any command that can write to production.
3. Production inspection must use **metadata-only** queries against `information_schema`. Never extract customer data, user records, purchases, question content, email addresses, payment data, or credentials.
4. Do not make the verifier pass by broadly suppressing errors, treating every difference as an allowed warning, removing expected fields without evidence, or overwriting the sanitized production contract from an assumed schema.
5. Do not merge PR #17, change its draft status, or deploy anything. Prepare a clean follow-up branch/commit and a reviewable evidence package only.

## Verified Starting Facts

The earlier false-positive primary-key issue is fixed: MySQL can return `NON_UNIQUE` as a string, buffer, bigint, or number, and the verifier now normalizes these values. Do not regress that behavior. Maintain test coverage for valid representations (`0`, `1`, `"0"`, `"1"`, buffer, bigint) and invalid values.

On a fresh read-only production check, the verifier now reports **7 blocking errors and 17 warnings**. The remaining blocking errors are:

| # | Production-verification error | Do not assume the resolution |
|---:|---|---|
| 1 | Missing index: `stripe_event_log.stripe_event_log_status_idx` | Determine whether the deployed index is genuinely required, the schema expectation is wrong, or a future additive migration is required. |
| 2 | `subscriptions.currentPeriodStart` is `NOT NULL` in production but nullable in the expected contract | Establish the real write-path and semantic requirement before changing source or proposing migration. |
| 3 | `subscriptions.province` is a production enum but expected as `varchar(32)` | Determine the authoritative allowed values and whether source schema should reflect the deployed enum. |
| 4 | `subscriptions.status` is a production enum but expected as `varchar(32)` | Same discipline: evidence first, then source alignment or a separately proposed migration. |
| 5 | `subscriptions.stripeSubscriptionId` is `NOT NULL` in production but nullable in the expected contract | Trace all creation and webhook paths. Do not make nullable/non-nullable changes without proving compatibility. |
| 6 | `subscriptions.tier` is a production enum but expected as `varchar(32)` | Confirm enum values and application behavior. |
| 7 | Missing index: `team_flex_orders.team_flex_orders_org_status_idx` | Determine whether this is an intentional absence, a source mistake, or a future additive migration requirement. |

The 17 warnings include unexpected indexes and two unexpected production columns: `organizations.stream` and `subscriptions.updatedAt`. They must be classified too; they cannot be silently ignored just because warnings do not block the command.

## Required Work

### 1. Start from current state and preserve the safety model

Fetch current `main` and PR #17. Confirm the branch is rebased/mergeable with current `main` before making any change. Read these files before editing:

- `scripts/db/migrationSafety.ts`
- `scripts/db/verifySchema.ts`
- `scripts/db/migrate.ts`
- `drizzle/baseline-0052.contract.json`
- `drizzle/forward-migrations.json`
- `drizzle/schema.ts`
- `drizzle/0053_question_governance.sql`
- `server/stripe/subscriptionPeriod.ts`
- `server/stripe/webhook.ts`
- all subscription insert/update paths

### 2. Re-run the read-only evidence collection

Run:

```bash
pnpm db:verify-migrations
pnpm db:verify-schema
```

Use metadata-only `information_schema.columns` and `information_schema.statistics` queries to collect exact evidence for the seven errors and 17 warnings. Export a sanitized contract that contains only:

- table names;
- column names, SQL types, nullability, defaults, and key metadata;
- index names, uniqueness, and ordered index columns.

Do not include table rows, database URLs, usernames, hostnames, tokens, or any customer information.

### 3. Classify every difference with evidence

Create `docs/pr17-production-schema-reconciliation.md` containing one row per finding. Use exactly one of these classifications:

| Classification | Meaning |
|---|---|
| **Verifier defect** | The verifier is interpreting valid production metadata incorrectly. Fix the verifier and add regression tests. |
| **Intentional production state** | Production is correct by documented design. Update the sanitized contract/source expectation only when backed by code-path and product evidence. |
| **Incorrect `schema.ts` or baseline expectation** | The deployed state is authoritative and source metadata is stale or wrongly modeled. Make a source-only alignment that remains runtime-compatible. |
| **Required additive migration** | The expected schema is correct, but production genuinely needs a new column/index/constraint. Draft a forward migration but do not apply it to production. |

For every row, include: actual metadata, expected metadata, evidence source, classification, exact proposed change, whether it needs user approval, and whether it requires a production write later.

### 4. Resolve only what can be legitimately resolved without production writes

- Fix verifier defects and stale source/contract modeling when the evidence supports that conclusion.
- Preserve the strict zero-error rule. Do **not** downgrade a genuine missing index or incompatible column definition to a warning just to satisfy the gate.
- If a missing index is genuinely required, author a **separate proposed forward migration** with a deterministic name, checksum update, tests, and an explicit note: **not applied to production in this task**.
- If the subscription differences require a data or schema migration, do not execute it. Document the exact proposed migration and preconditions instead.
- Keep migration `0053_question_governance` as safely adopted only when its live schema state matches; do not replay it.

### 5. Add precise automated coverage

Add or update tests for:

1. `NON_UNIQUE` normalization for number, bigint, string, and buffer representations plus invalid input rejection.
2. Structurally equivalent index comparison, including unique and ordered-column behavior.
3. The sanitized-contract exporter: assert it never contains row data, emails, URLs with credentials, or connection details.
4. The reconciled production-contract rules for `subscriptions`, `organizations.stream`, `subscriptions.updatedAt`, `stripe_event_log`, and `team_flex_orders`.
5. Forward-manifest validation, including prohibition on adopting destructive migrations.
6. Migration status and read-only verification behavior when unresolved blockers remain.

### 6. Validation and acceptance gate

Run and report:

```bash
pnpm db:verify-migrations
pnpm db:verify-schema
pnpm test
pnpm tsc --noEmit
```

You may recommend PR #17 for merge **only if** all of the following are true:

1. `pnpm db:verify-schema` returns **zero blocking errors** against production using read-only metadata access.
2. Every remaining warning has a documented, evidence-backed classification and is intentionally retained.
3. The baseline contract is sanitized, checksum-valid, and reflects the reconciled production state without hiding real drift.
4. No production schema/data writes, baseline adoption, historical migration replay, or migration application occurred during this work.
5. The full test suite and TypeScript pass.
6. The implementation is on a focused review branch with a clear PR description and a no-write verification transcript.

If any blocking error remains, do **not** claim completion or recommend merging PR #17. Instead return the unresolved findings, their classification, the minimum safe next action, and whether explicit approval for a future additive production migration is needed.

## Required Deliverables

Return:

1. A focused branch or PR with the verifier/source/contract/test changes only.
2. `docs/pr17-production-schema-reconciliation.md` with the complete classification table.
3. A sanitized metadata-only production schema contract and its SHA-256 checksum.
4. The exact output summary of `db:verify-migrations`, `db:verify-schema`, tests, and TypeScript.
5. A final explicit verdict: **APPROVE PR #17** or **HOLD PR #17**, with evidence.

## Product Context

Echelon Institute is a live Canadian water and wastewater certification-prep platform with real learners, paid Individual Exam Passes, Stripe payments, Teams All-Access, Course Passes, organizations, licences, and question banks. Treat the production database as business-critical. Correctness and recoverability are more important than speed.
