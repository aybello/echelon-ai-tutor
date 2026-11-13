# Job board refresh repair

## Cause

The scheduled ingestion worker opened the legacy `DATABASE_URL` directly. The public application selects its active store through `activeDatabaseSettings`, including the designated external database and verified TLS settings. The worker and public board could therefore use different stores.

The project's owner-scoped Heartbeat list also lacked the intended `/api/scheduled/fetch-jobs` six-hour refresh.

## Repair

- Resolve feed connections through the existing application target selector and certificate-verified connection builder.
- Fail closed during database maintenance, for missing protected external settings, and for unverified remote connections.
- Fetch the independent RSS, association and municipal tiers concurrently. Wait for all settled tiers before closing their shared connection.
- Preserve existing upsert, identity, province and listing-age protections. Do not bulk-expire inventory after failed database writes. Expiry-write failures are unsuccessful refreshes.
- Add an idempotent production-startup registration for the existing six-hour native Heartbeat callback. It creates a missing job, repairs a paused/stale one by task UID, and leaves unrelated schedules alone.
- Keep public stale-state reporting, but do not tell visitors a refresh is currently running without evidence.

No schema, pricing, payments, learner records, authentication or course content changes.

## Verified current-task recovery

A source-backed run on October 3, 2026 at 05:20:49 UTC used the active store with bulk expiry disabled. It inserted 23 jobs and refreshed 13, with zero database write failures, two productive source tiers and four provinces. The public stats API subsequently returned 74 visible postings, that refresh timestamp, and `isStale: false`.

These results verify a one-time recovery. They do not establish that the newly corrected production handler or recurring schedule is already deployed. Publish the tested checkpoint first, then inspect the owner-scoped Heartbeat list and execution history. Never create a schedule against the old handler.

## Blog investigation, not a publishing change

The public blog and its list API return HTTP 200 with 21 published articles. The active-store summary also has 21 published articles, no drafts and no posts tagged `Automated Article`. The latest publication timestamp is August 11, 2026.

Both recorded weekly Heartbeat attempts, September 21 and September 28, timed out about 30 seconds after starting, before returning an HTTP result. The current synchronous callback fetches sources, generates an article, runs editorial review and can perform a complete revision and second review. Its individual AI request budget is 45 seconds, longer than the observed callback timeout. Logs prove the timeouts, not the exact stage that was interrupted.

A durable staged generation/review process is needed rather than a longer timeout or removing editorial checks. This release does not change the blog schedule, generate an article, publish content or remove existing quality protections.
