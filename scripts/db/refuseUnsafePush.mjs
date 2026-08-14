console.error(`
Refusing to run the historical Drizzle migration chain.

Echelon's migrations before baseline 0052 came from competing histories and
cannot be replayed safely. Use the supported commands instead:

  pnpm db:verify-migrations  Validate the forward-only manifest and checksums
  pnpm db:verify-schema      Compare a database with drizzle/schema.ts (read-only)
  pnpm db:migrate:status     Show the adopted baseline and pending migrations
  pnpm db:migrate:adopt      Adopt baseline 0052 after a verified backup
  pnpm db:migrate:apply      Apply checksummed forward migrations after a backup

See drizzle/README.md for the release procedure.
`);

process.exitCode = 1;
