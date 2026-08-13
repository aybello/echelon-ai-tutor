# Database rebuild and migration policy

The repository's early Drizzle files are an archival record, not a replayable
chain. Several historical migrations were generated from competing baselines,
and replaying every numbered SQL file can drop or duplicate production tables.

Use `drizzle/schema.ts` as the canonical current-schema baseline for a new
database:

```bash
pnpm exec drizzle-kit export --dialect mysql --schema ./drizzle/schema.ts \
  | sed '/^Reading schema files:/d; /^\/.*schema.ts$/d' \
  | mysql --defaults-extra-file=/path/to/mysql-client.cnf your_database
```

After a baseline is created, apply only forward migrations newer than the
baseline. Existing production databases continue using the journal and must
receive each new migration exactly once through the normal deployment process.

The Quality Gate provisions an empty MySQL database, builds it from the current
schema, applies the newest additive migration to a minimal prior-schema fixture,
and runs database-backed entitlement, OTP, and Stripe/webhook lifecycle tests.
This is the supported disaster-recovery path until a production schema snapshot
has been independently compared with `drizzle/schema.ts`.

Never replay `0000_complete_whizzer.sql` against an Echelon database. It is an
archived destructive diff from a competing historical baseline.
