# Blog continuation binding recovery (2026-10-17)

This change **does not create, delete, resume or pause Heartbeats**. It changes only the singleton blog state's `workerTaskUid`, from `gNrrRXxb5V8mQEUpHZGXSb` to an operator-supplied exact UID. Weekly binding must remain `RCdSVHj37rLDyqV3cYkjaP`. Callback authorization and editorial approval gates are unchanged. No publication, requeue or entire-row restoration SQL is provided.

## Required operator order

1. Review the implementation and synthetic tests (Argon and Sol review required by the operator). Deploy the `server/blogSchedule.ts` registrar CAS/no-op fix **before applying** the binding repair; otherwise an old startup registrar could overwrite a recovered binding after remote IO.
2. Use supported official Heartbeat operations externally to create exactly one unique-name replacement: `echelon-blog-continuation-recovered-20261017`, owner `310519663446228701`, cron `0 * * * * *`, POST `/api/scheduled/continue-blog`. Preserve the original worker **paused**, without deleting it. Wait for any original in-flight callback/lease to drain. The new replacement must be enabled for this tool's final plan/apply. Unbound replacement callbacks should remain unauthorized before the binding CAS; do not weaken authorization to work around that.
3. Export the application's authoritative DB configuration, or explicitly pass `--env-file /absolute/path/to/app.env`. No implicit dotenv loading occurs. With an explicit file, its parsed app settings override ambient app settings for this invocation only. CLI Forge credentials come from the existing process environment, never from the app file. Require `DATABASE_CUTOVER_USE_EXTERNAL_TARGET=true`, authoritative target/schema, and certificate-verified TLS; managed `DATABASE_URL` fallback is forbidden.
4. Run the read-only plan from the repository root (no credentials are printed):

```sh
node scripts/recover-blog-worker-binding.mjs \
  --expected-new-worker D22yj64Mkuku4eaN9a2Moc --plan \
  --env-file /absolute/private/app.env
```

5. After approval, explicitly apply with a **new** private journal filename outside all repositories:

```sh
node scripts/recover-blog-worker-binding.mjs \
  --expected-new-worker D22yj64Mkuku4eaN9a2Moc --apply \
  --journal-file /home/ubuntu/private/echelon-authoritative-recovery/blog-binding/rebind-20261017.json \
  --env-file /absolute/private/app.env
```

This tool reads the full paginated official CLI list, checks actor and every job owner, unique exact identities, original paused with canonical name `echelon-blog-continuation` and exact cron/path/POST, and replacement enabled with exact name/cron/path/method. Weekly must remain enabled as `weekly-echelon-blog`, cron `0 0 14 * * 1`, POST `/api/scheduled/generate-blog`. All three callback payloads must be empty or an empty JSON object; conflicting camel/snake aliases are rejected strictly. Every enabled job must have a known `/api/scheduled/` callback path, with no other enabled continuation worker. It fails closed on incomplete/unknown data. The CLI list and DB transaction cannot be atomic across services; do not concurrently change Heartbeats while operating. No automatic retries are implemented.

Under a SERIALIZABLE transaction and `SELECT * ... FOR UPDATE`, exactly one state row must exist: exact singleton ID and expected old/weekly binding, `status=completed`, `runKey=''`, empty JSON object progress, NULL claim and lease (even expired leases block), and no error. This intentionally supports only the empty initialization placeholder. A completed real run or any uncertain submission needs separate inspection, not a relaxed flag. A complete exclusive `0600` beforeimage file and directory are fsynced **before** a parameterized, binary-exact old/weekly CAS UPDATE. The in-transaction full postimage must preserve every field except the worker UID and normal `updatedAt`. After COMMIT a fresh independent DB connection verifies again; then an exclusive `.verified.json` receipt is fsynced.

## Failure/recovery

Any exception in the transaction attempts rollback. **An error never proves that COMMIT did not happen.** COMMIT transport failures, independent verification failures and postcommit receipt failures are explicitly reported as potentially committed; inspect the beforeimage and independent DB state and stop unattended retries. A pre-COMMIT error reports whether rollback was acknowledged, without making an absolute no-commit guarantee. Driver messages and private row payloads are not printed.

A repeat invocation with the *same exact new UID and original journal file* is a read/verify no-op only if the authoritative state matches the original beforeimage in all fields except worker UID/normal updatedAt, and the journal proves the exact old/weekly placeholder preimage. A leftover prepared journal does not itself prove a commit; current independent DB state is mandatory. Existing journals are never overwritten. After a precommit failure with the original binding still present, inspect state first and use a fresh journal only for an explicitly approved new attempt. Never blindly reverse the UID or restore the entire beforeimage.

After successful recovery, externally observe a replacement callback succeeding while the state remains idle before triggering any supported weekly queue operation. Publishing must continue through the deployed editorial workflow, never custom SQL.

## Local validation (no production calls)

```sh
node --test scripts/blogBindingRecovery.test.mjs
node_modules/.bin/vitest run server/blogSchedule.test.ts server/blogAutomationHealth.test.ts
node_modules/.bin/tsc --noEmit --incremental false -p tsconfig.json
node --check scripts/lib/blogBindingRecovery.mjs
node --check scripts/recover-blog-worker-binding.mjs
```

The standalone Node test runner matches existing `scripts/*.test.mjs` conventions. All recovery DB/CLI operations are synthetic injected dependencies and durable-journal tests use disposable OS temp directories. No runtime dependencies are added. The Quality Gate runs `node --test scripts/blogBindingRecovery.test.mjs` in the separate required `Validate blog binding recovery guards` step, without `continue-on-error` or failure suppression; `server/ciBrowserRuntime.test.ts` asserts that CI contract.
