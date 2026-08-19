# Database baseline and forward-migration policy

Echelon's early Drizzle files are an archival record, not a replayable chain.
Several were generated from competing baselines, and replaying the numbered
history can drop or duplicate production tables. `pnpm db:push` therefore
refuses to run.

## Current baseline

Production is expected to contain the schema represented by:

- baseline version: `0052_activation_outcomes`
- immutable contract: `drizzle/baseline-0052.contract.json`
- current application schema: `drizzle/schema.ts`
- forward manifest: `drizzle/forward-migrations.json`

The baseline contract never changes. The already-deployed question-governance
change is registered as forward migration 0053. Future schema work changes
`drizzle/schema.ts` and adds a checksummed migration numbered 0054 or later.

## New empty database

Build an empty database directly from the canonical current schema. Never run
the historical SQL chain:

```bash
pnpm exec drizzle-kit export --dialect mysql --schema ./drizzle/schema.ts \
  | sed '/^Reading schema files:/d; /^\/.*schema.ts$/d' \
  | mysql --defaults-extra-file=/path/to/mysql-client.cnf new_database
```

Then verify it read-only:

```bash
DATABASE_URL='mysql://...' pnpm db:verify-schema --strict
```

## One-time adoption for the existing production database

Adoption does not replay SQL or change application tables. It verifies the
immutable v52 contract and creates Echelon's forward-only migration ledger.

1. Take and verify a restorable database backup.
2. Run `DATABASE_URL='mysql://...' pnpm db:verify-schema` and investigate every error.
3. Adopt the baseline:

```bash
MIGRATION_APPROVED=APPLY_FORWARD_MIGRATIONS \
MIGRATION_BACKUP_CONFIRMED=BACKUP_VERIFIED \
DATABASE_URL='mysql://...' \
pnpm db:migrate:adopt
```

4. Confirm `pnpm db:migrate:status` reports baseline 52 and no unknown or failed migrations.

Migration 0053 was deployed before this ledger existed. If adoption verifies
that the database already matches the complete current schema, it records 0053
as applied without rerunning its SQL. This behavior is explicitly opted into by
the 0053 manifest entry and is forbidden for destructive migrations. If the
database is still at baseline 52, adoption records only the baseline and status
reports 0053 as pending; run the normal backup-gated apply step before deploying
application code that requires the governance columns.

Extra legacy tables, columns, or indexes are reported as warnings during
production verification. Missing or incompatible application objects are
blocking errors. CI uses `--strict`, where warnings also fail.

### Repairing the legacy welcome-email marker before adoption

Some legacy production databases were created without
`purchases.welcomeEmailSentAt`, even though that nullable column is part of the
immutable v52 baseline. Do not replay migration 0028 or the archived historical
chain. After verifying a restorable backup, run the narrow idempotent repair:

```bash
MIGRATION_APPROVED=REPAIR_WELCOME_EMAIL_COLUMN \
MIGRATION_BACKUP_CONFIRMED=BACKUP_VERIFIED \
DATABASE_URL='mysql://...' \
pnpm db:repair-welcome-email-column
```

The command adds only the missing marker, verifies its type and default, marks
historical purchases to prevent a duplicate-email burst, and leaves active
purchases from the last 24 hours eligible for normal onboarding delivery. Then
run `pnpm db:verify-schema` and continue the standard adoption procedure.

## Adding a forward migration

1. Update `drizzle/schema.ts`.
2. Add exactly one migration such as `drizzle/0054_short_description.sql`.
3. Separate statements with `--> statement-breakpoint` so each statement has an
   unambiguous result in the migration ledger.
4. Prefer additive and backward-compatible SQL. Destructive SQL is rejected
   unless the manifest explicitly includes `allowDestructive: true` and the PR
   documents the backup, compatibility, and rollback plan.
5. Calculate the immutable checksum:

```bash
sha256sum drizzle/0054_short_description.sql
```

6. Add the version, tag, file, and checksum to
   `drizzle/forward-migrations.json`.
7. Run `pnpm db:verify-migrations` and the full Quality Gate.

The manifest must be contiguous. A migration cannot be removed, reordered, or
edited after it has been applied; make a new migration instead.

## Deployment

Do not start a new application version until its migration finishes.

```bash
# Read-only preflight
DATABASE_URL='mysql://...' pnpm db:migrate:status

# After taking and verifying a backup
MIGRATION_APPROVED=APPLY_FORWARD_MIGRATIONS \
MIGRATION_BACKUP_CONFIRMED=BACKUP_VERIFIED \
DATABASE_URL='mysql://...' \
pnpm db:migrate:apply

# Read-only postflight
DATABASE_URL='mysql://...' pnpm db:verify-schema
```

The runner validates checksums, takes a MySQL named lock, records `applying`
before each migration, records `applied` only after every statement succeeds,
and stops on unknown, modified, interrupted, or failed ledger entries.

## Failure and rollback

MySQL DDL can auto-commit, so a generic automatic rollback is unsafe. If a
migration is marked `applying` or `failed`, do not edit the ledger or rerun it
blindly. Keep the old application version running, inspect which statements
completed, restore the verified backup when necessary, then ship a reviewed
repair migration. Never replay `0000_complete_whizzer.sql`; it is an archived
destructive diff from a competing historical baseline.
