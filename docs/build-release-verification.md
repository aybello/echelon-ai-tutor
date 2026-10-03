# Verify the code serving production

A merge, a build, a deployment, and a successful scheduled callback are different evidence.

## Build identity

`pnpm build` bakes the actual full **tracked-clean checkout HEAD** into the server bundle, ignoring stale environment SHA labels when Git is present. Tracked staged/unstaged changes fail ordinary release builds. Untracked test outputs are not source approval and do not dirty this tracked check. Production startup rejects `unknown`, dirty markers and unversioned development artifacts. Runtime environment changes cannot relabel a previously built bundle.

For a managed source archive without `.git`, its approved clean release exporter must include **`release.json`** at archive root:

```json
{"version":1,"commit":"FULL_APPROVED_COMMIT_SHA","clean":true}
```

Replace the placeholder with the actual full 40- or 64-character hexadecimal commit exported, not a checkpoint label or an earlier branch revision. Generate this metadata alongside `git archive HEAD` from the tracked-clean approved checkout, **outside that checkout**, so generated/untracked files are excluded and metadata generation does not dirty the source. The build reads `release.json` by default; an approved exporter may provide `BUILD_RELEASE_FILE` for another durable path. A supplied build-time `BUILD_COMMIT_SHA` or trusted runner `GITHUB_SHA` must agree exactly with the archive manifest; it cannot replace that manifest. Malformed, mismatched or absent provenance fails an ordinary release build. A manifest is trusted exporter metadata, not a cryptographic signature; an untrusted/self-authored archive is not approved merely by setting `clean: true`.

The Quality Gate checks tracked cleanliness, exports only committed source to a temporary archive, writes its exact HEAD manifest outside the checkout, and verifies archive identity before building the checkout without a development-artifact override. This policy is committed for CI; the worker did not run GitHub Actions or approve a deploy artifact. Any managed exporter that cannot provide approved clean source metadata remains blocked rather than receiving a fabricated SHA.

The parent CI may explicitly use `BUILD_ARTIFACT_MODE=development` for an unversioned or dirty **development/test artifact**. This flag is rejected when building for production, and the resulting dirty or `development-unversioned` artifact cannot start in production. It is not a release workaround.

After authorized deployment, compare **exact equality**:

- `EXPECTED_RELEASE`: the approved clean final merged commit SHA actually built/exported.
- `GET https://echeloninstitute.ca/api/health` JSON `release`.

Require HTTP 200, `status: "ok"`, and `release === EXPECTED_RELEASE`. A capability list, another branch's SHA, a checkpoint ID, or `unknown` does not satisfy this comparison. A local clean-branch build verifies only that branch artifact, not the eventual integrated release. The worker did not deploy or test the live release.

## Publishing pause and callback readiness

Normal startup repairs cron/path/method configuration **without an `enable` field**. Disabled weekly, continuation **and Jobs refresh** tasks stay disabled. Saved blog database task UIDs are authoritative: a missing saved UID fails reconciliation rather than rebinding to a same-named task. Monday at 14:00 UTC, the one-minute continuation cadence and six-hour Jobs cadence are unchanged.

Keep both intentionally paused jobs paused until separate owner approval after the release comparison and callback investigation. Read the saved weekly/worker UIDs, scheduler configuration, failure reasons and execution history through authorized operator tooling. Check exact host, POST path, authenticated identity and saved UID, not merely matching display names. The existing callback authorization remains unchanged.

`resumeBoundBlogHeartbeat(kind, expectedTaskUid)` is an explicit operator recovery helper, never a startup call or public endpoint. It checks the saved UID and expected POST callback, then updates only that UID with `enable: true`. Use it only after owner-approved recovery in the verified production deployment. No worker in this package called it or registered a live task.

A separately authorized genuinely idle continuation must return HTTP 200, `action: "idle"`, zero model requests, and no publication changes. A queued weekly response is not completion proof. Verify later approved weekly completion from durable workflow steps and scheduler history. Migration **0074 is already applied; do not rerun it**.

## Jobs verification and durable health

Source posting dates and verification times are separate. Unknown source dates are displayed as unavailable, not replaced with the refresh date. Explicit deadlines, including text extracted from PDF, suppress expired roles. A successful generic board retrieval is not availability proof unless its content matches the role. Missing or unmatched roles are quarantined; temporary network/bot/parser failures do not mutate retained inventory or advance its verification time. Verification concurrency is bounded to eight workers and a 90-second overall admission budget.

This baseline has no durable settings table or settings helper. Reuse existing **`scheduled_work`**, with `job-board:refresh-health`, hashed `job-board:source:*` and `job-board:vacancy:*` keys for compact outcome JSON only. A strict telemetry key validator rejects task/email/lock keys. A separate `job-board:refresh-lock` serializes refresh owners using database-time leases. Owner-token SQL predicates fence state and inventory writes and releases; a rejected/expired owner cannot overwrite newer telemetry. Task consumers address their exact `job:*`, `job-lock:*` and email keys, never scan this namespace. No schema migration is added or applied. Confirm the existing table before release; schema/storage failure is explicit and retryable.

Per-source last attempt and last successful feed/destination check are retained. Destination failures remove that source from the verified count; whole-tier rejection persists failed run/degraded source state and preserves last success. Public stats use the latest actual run outcome, six-hour cadence and coverage, not the newest inventory timestamp. Partial, unknown and overdue coverage remain visible as delayed. Bulk age expiry is disabled on any failed/degraded feed, verification, storage or processing result. `skipExpiry` still protects controlled recovery runs.

PDF extraction uses **Poppler `pdftotext`** through bounded stdin/stdout and a process timeout. Its presence in this sandbox is **not evidence of production availability**. Confirm it in the managed runtime image before asserting PDF verification readiness. Missing parser, extraction failure, empty/scanned text and detected bot challenges yield `unavailable`, not quarantine or `verified`; retained inventory/seen dates are unchanged, subject to the normal public stale cutoff. A readable document with an explicit past deadline is suppressible. No production binary/image change or mass PDF quarantine was performed.

After separate authorization, verify intended six-hour callback success, refresh outcome persistence and per-source coverage. A controlled refresh is still required to populate verification state and quarantine the audit's legacy CWRA/GRCA rows. This package did not run ingestion or write a live database.

## Isolated verification and remaining deployment checks

Real SQL tests ran on disposable `echelon_audit_reliability` at loopback port 3311, created from the schema-only supplied baseline using the assigned socket. They cover durable run/source/vacancy JSON, list/count/stats/detail deadline and quarantine filters, malformed/null JSON, source dates, degraded last-success retention, no failure expiry, concurrent owner rejection, expired owner fencing and task-ledger isolation. Unit/server-rendered UI tests cover initial failure, Retry labels, successful zero matches, failed cached revalidation and recovery for Jobs/Blog. All local tests/typechecks used the required sanitized safe wrapper; no shared browser or external providers were used. Actual interactive browser, GitHub Actions, managed runtime binary, approved final merged build and authorized deployment/callback checks remain separate release gates.
