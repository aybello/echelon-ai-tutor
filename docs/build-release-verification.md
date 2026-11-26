# Verify the code serving production

A merge, a build, a deployment, and a successful scheduled callback are different evidence.

## Build identity

The normal automatic `pnpm build` stamps immutable **`release` and `releaseKind`** into the server bundle. No Dockerfile, infrastructure, secret or runtime filesystem change is needed. Production startup rejects `unknown`, missing/invalid kinds, dirty markers and unversioned development artifacts. Runtime environment changes cannot relabel a previously built bundle.

- **Clean Git checkout:** the actual full checkout HEAD is stamped with `releaseKind: "git-commit"`. Tracked staged/unstaged changes and untracked functional source fail ordinary release builds. Untracked root test outputs and excluded local/platform metadata do not dirty the source check. Stale _valid_ environment commit labels do not override HEAD; malformed supplied commit labels fail. A broken/unborn checkout is not treated as a source archive.
- **Actual managed archive:** publishing receives committed source equivalent to `git archive HEAD`, without `.git`, installed dependencies, ignored output or environment files. The managed exporter does **not** supply `release.json`. In this normal manifest-free case, the build computes the full deterministic functional-source SHA256 and stamps `releaseKind: "source-sha256"`. `LAST_COMMIT_HASH` is an opaque checkpoint label (it can be nonhexadecimal and five characters), not a Git commit; it is never used for release identity. Valid `BUILD_COMMIT_SHA`/`GITHUB_SHA` labels alone cannot make an archive claim Git identity. Malformed supplied commit labels still fail.
- **Optional explicit manifest:** an existing trusted release exporter may continue to supply **`release.json`** at archive root:

```json
{ "version": 1, "commit": "FULL_APPROVED_COMMIT_SHA", "clean": true }
```

The optional manifest uses the actual full 40- or 64-character hexadecimal commit, not a checkpoint label or an earlier branch revision, and yields `releaseKind: "git-commit"`. If used, generate it alongside the approved export **outside the checkout**. Every supplied `BUILD_COMMIT_SHA` and `GITHUB_SHA` must match the manifest exactly (case-insensitively). A malformed manifest, mismatched SHA, unreadable manifest, or missing explicitly configured `BUILD_RELEASE_FILE` fails instead of silently switching to a fingerprint. A manifest is trusted exporter metadata, not a signature; self-authored `clean: true` is not approval. Do not manufacture a manifest for the actual managed export.

### Functional-source fingerprint contract

`scripts/sourceFingerprint.ts` exports `computeSourceFingerprint(root = process.cwd())`, `sourceFingerprintFiles(root)` and `isSourceFingerprintPath(path)`. The same functional source in a clean checkout and its `git archive HEAD` extraction hashes identically. The build calls the fingerprint once and embeds only its digest/kind; runtime health imports no Git/filesystem/hash implementation.

The versioned contract includes all regular files under **`client`, `server`, `shared`, `scripts`, `drizzle`, `patches`, `config`, `configs`, `content`, `attached_assets`, `public`, and `vendor`** when present. It includes dependency pins (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`), `components.json`, root JS/TS/HTML/CSS/SCSS build inputs, every `tsconfig*.json` and `*.config.{js,ts,mjs,cjs,mts,cts,json,yaml,yml}` (also plain `config.*`), and relevant package/compiler config dotfiles (`.npmrc`, `.pnpmfile.cjs`, `.nvmrc`, `.node-version`, `.browserslistrc`, `.babelrc` variants, `.swcrc`, `.postcssrc` variants). Functional assets and source tests inside those directories are deliberately included. Required package/lock/client HTML/server entry/build script and nonempty client/server/shared/scripts source prevent empty or unknown archives from obtaining an identity.

Excluded at any depth: `node_modules`, `.git`, `dist`, `build`, coverage/test/Playwright output, `.env`/`.env.*`, private `.project-config.json`, `.manus`/`.manus-logs`/`__manus__`/`.webdev`, caches, logs, temporary directories, secret directories and private key material. Unrelated root documentation/research/test artifacts are outside the functional contract. Root paths and exclusion rules are fixed in the helper, not supplied by the environment. Every included symlink is rejected, even if its target is in-root; source escapes and host-dependent link targets cannot contribute bytes.

Canonical encoding is **SHA256** over UTF-8 `echelon-functional-source-sha256-v1` followed by a NUL byte, then for each bytewise-sorted POSIX relative path: unsigned 64-bit big-endian path-byte length, UTF-8 relative path, unsigned 64-bit big-endian content-byte length, and raw file bytes. Paths/bytes are framed unambiguously. Absolute paths, timestamps and directory iteration order are not included. Dependency _source pins_, not installed dependency trees, are fingerprinted. This is source-code identity, not a hash of generated bundles, build-time secret values or external/database state.

The fingerprint is **not an approval statement or a remote Git commit**. Exact agreement with an independently exported approved integrated commit supplies the release-code comparison. The parent/CI must export that approved commit into a temporary directory, compute its expected source fingerprint, and compare all 64 characters to the managed artifact's release. Do not infer a commit from `LAST_COMMIT_HASH`, a shortened value, or the digest itself. Git SHA256 can also be 64 characters, so the explicit injected `__BUILD_RELEASE_KIND__`—never string length—distinguishes kinds.

The parent CI may explicitly use `BUILD_ARTIFACT_MODE=development` for an unversioned or dirty **development/test artifact**. This flag is rejected when building for production, and the resulting dirty or `development-unversioned` artifact cannot start in production. It is not a release workaround.

After authorized deployment, compare **exact equality**:

- For `releaseKind: "git-commit"`, compare the full approved clean integrated commit SHA to health `release`.
- For `releaseKind: "source-sha256"`, compare `computeSourceFingerprint(approvedArchiveRoot)` from **`git archive APPROVED_INTEGRATED_SHA`** to health `release`.
- Require the expected kind as well as HTTP 200, `status: "ok"`, and exact full `release` equality in `GET https://echeloninstitute.ca/api/health`.

A capability list, another branch's SHA, a checkpoint ID, or `unknown` does not satisfy this comparison. Tests use synthetic temporary Git repositories/archives, source mutations, isolated production server builds and health evaluation; no provider, database or browser actions occur. Focused tests/typechecking pass through the sanitized safe wrapper. The concurrently edited working checkout was **not** claimed clean or built as a release; final integrated clean-checkout/archive comparison, full build and authorized deployment remain parent/CI gates. The worker did not run GitHub Actions, deploy or test live health.

## Publishing pause and callback readiness

Normal startup repairs cron/path/method configuration **without an `enable` field**. Disabled weekly, continuation **and Jobs refresh** tasks stay disabled. Saved blog database task UIDs are authoritative: a missing saved UID fails reconciliation rather than rebinding to a same-named task. Monday at 14:00 UTC, the one-minute continuation cadence and six-hour Jobs cadence are unchanged.

Keep both intentionally paused jobs paused until separate owner approval after the release comparison and callback investigation. Read the saved weekly/worker UIDs, scheduler configuration, failure reasons and execution history through authorized operator tooling. Check exact host, POST path, authenticated identity and saved UID, not merely matching display names. The existing callback authorization remains unchanged.

`resumeBoundBlogHeartbeat(kind, expectedTaskUid)` is an explicit operator recovery helper, never a startup call or public endpoint. It checks the saved UID and expected POST callback, then updates only that UID with `enable: true`. Use it only after owner-approved recovery in the verified production deployment. No worker in this package called it or registered a live task.

A separately authorized genuinely idle continuation must return HTTP 200, `action: "idle"`, zero model requests, and no publication changes. A queued weekly response is not completion proof. Verify later approved weekly completion from durable workflow steps and scheduler history. Migration **0074 is already applied; do not rerun it**.

## Jobs verification and durable health

Source posting dates and verification times are separate. Unknown source dates are displayed as unavailable, not replaced with the refresh date. Explicit deadlines, including text extracted from PDF, suppress expired roles. A successful generic board retrieval is not availability proof unless its content matches the role. Missing or unmatched roles are quarantined; temporary network/bot/parser failures do not mutate retained inventory or advance its verification time. Verification concurrency is bounded to eight workers and a 90-second overall admission budget.

This baseline has no durable settings table or settings helper. Reuse existing **`scheduled_work`**, with `job-board:refresh-health`, hashed `job-board:source:*` and `job-board:vacancy:*` keys for compact outcome JSON only. A strict telemetry key validator rejects task/email/lock keys. A separate `job-board:refresh-lock` serializes refresh owners using database-time leases. Owner-token SQL predicates fence state and inventory writes and releases; a rejected/expired owner cannot overwrite newer telemetry. Task consumers address their exact `job:*`, `job-lock:*` and email keys, never scan this namespace. No schema migration is added or applied. Confirm the existing table before release; schema/storage failure is explicit and retryable.

Per-source last attempt and last successful feed/destination check are retained. Destination failures remove that source from the verified count; whole-tier rejection persists failed run/degraded source state and preserves last success. Public stats use the latest actual run outcome, six-hour cadence and coverage, not the newest inventory timestamp. Partial, unknown and overdue coverage remain visible as delayed. Bulk age expiry is disabled on any failed/degraded feed, verification, storage or processing result. `skipExpiry` still protects controlled recovery runs.

PDF extraction uses the pinned **Mozilla PDF.js** runtime package in a separate, time- and memory-bounded Node child. No system PDF binary or custom runtime image is required. Only one parser child is admitted at a time. Input is limited to 5 MB, 30 pages and 2 MB of text output; rendering, native addons, script execution and external assets are disabled. Missing parser, extraction failure, empty/scanned text and detected bot challenges yield `unavailable`, not quarantine or `verified`; retained inventory/seen dates are unchanged, subject to the normal public stale cutoff. A readable document with an explicit past deadline is suppressible. No production refresh or mass PDF quarantine was performed.

After separate authorization, verify intended six-hour callback success, refresh outcome persistence and per-source coverage. A controlled refresh is still required to populate verification state and quarantine the audit's legacy CWRA/GRCA rows. This package did not run ingestion or write a live database.

## Isolated verification and remaining deployment checks

Real SQL tests ran on disposable `echelon_audit_reliability` at loopback port 3311, created from the schema-only supplied baseline using the assigned socket. They cover durable run/source/vacancy JSON, list/count/stats/detail deadline and quarantine filters, malformed/null JSON, source dates, degraded last-success retention, no failure expiry, concurrent owner rejection, expired owner fencing and task-ledger isolation. Unit/server-rendered UI tests cover initial failure, Retry labels, successful zero matches, failed cached revalidation and recovery for Jobs/Blog. All local tests/typechecks used the required sanitized safe wrapper. These are local checks, not a deployed refresh or callback. Parent integration supplies separate full-suite, browser and provider-review evidence; GitHub, approved final managed deployment and callback checks remain release gates.
