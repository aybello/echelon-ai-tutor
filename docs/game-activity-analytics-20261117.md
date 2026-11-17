# Games activity analytics — 2026-11-17

## Scope and implementation

Adds one Games activity card to Admin → Overview, defaulting to 30 days with a 7-day option. Reuses `product_analytics_events` (`eventName` is varchar) and existing `adminProcedure`, tRPC transport and public session engine. No new table, schema migration, provider call or production database write was used during development. Migration 0082 and `INTERACTIVE_SAVED_PROGRESS_ENABLED` are unchanged. No pricing, purchase/access, readiness, quiz history, revenue or deploy configuration changed.

Course sessions optionally receive a six-hour HMAC-signed capability containing the server-delivered session UUID, canonical course, mode, delivered item IDs and server-resolved pseudonymous identity. The analytics write endpoint accepts only that capability, a UUID browser token, bounded round/sequence numbers, and answer/completion events. It validates the capability, identity, eligible course, mode and delivered item membership. No authored text, answers, correctness, names, emails or IP addresses enter game event storage. Identity is HMAC-derived using the existing server cookie secret; missing secret disables tracking rather than weakening it. Signed-in IDs and verified-email identities come only from server context. Admin roles and both server-context email identities pass the canonical internal/synthetic exclusion helper.

Client reporting is independent of saved-progress `onResult`, nonblocking, bounded to 200 queued events and serialized so completion cannot overtake the last answer. Errors are swallowed by telemetry, not gameplay. Browser DNT/GPC, the existing measurement refusal and Umami opt-out are honored; blocked storage disables tracking rather than merging browsers into a shared fallback identity. DNT/GPC are also checked server-side. Existing general tRPC IP throttling remains in effect, supplemented with bounded per-process 120-events/minute privacy-identity limits (including batched calls).

## Metric definitions

- **Players (estimate):** distinct HMAC identities with an answer in the selected rolling window. Breakdown separates server-identified accounts/verified-email identities from anonymous browsers. It is not a unique-person count: browser changes, cleared storage and anonymous-to-signed-in transitions can count again. Signed-out internal users cannot be recognized.
- **Rounds started:** distinct gameplay round IDs with an answer, never a page view/session delivery. Each newly delivered session is separate. Entering/restarting timed Rapid Swipe creates a separate local round counter under the signed session. Untimed backtracking/reanswering does not create additional round/item counts.
- **Questions answered:** distinct server-derived answer IDs. Untimed play counts each delivered item once per round; timed cycling counts each presented answer sequence. Skips do not count. Speed-Match counts one finished activity, not individual pair picks. Cause Effect counts a checked activity, not individual direction selections.
- **Rounds completed:** explicit valid finish events in the selected window. Untimed completion requires an answer for every delivered item; timed completion requires an explicit End round/timer expiry and at least one stored answer. Completion is engagement, not evidence of mastery. A finish can occur in the window for a round started before it, so starts and finishes are period activities, not a conversion cohort.
- **Returning players:** the same privacy identity answered on at least two distinct server-stamped UTC days within the selected window. Duplicate event IDs are grouped before distinct-day counting, preventing a retry crossing midnight from manufacturing a return.
- **Popular course/mode:** top three by distinct rounds started; ties use canonical key order.
- **Tracking since:** earliest stored game answer. No backfill or historical play inference. Course games only; public introductory demos are excluded.

## Persistence and reporting limits

The existing events table has no unique event key. Concurrent/retried writes may persist duplicate rows; all metric counts DISTINCT server-derived answer/round IDs, so those duplicates do not inflate counts. This intentionally avoids a migration. It does not provide a database exactly-once ingestion guarantee.

All summaries aggregate in SQL over fixed 7/30-day windows using the existing event/time index; only aggregate rows and up to three course/mode groups return to Node. The earliest-event query uses the game event filter. No unbounded raw-history loading or new table is introduced. Reporting/database errors appear as unavailable, not fake zeros.

These are best-effort engagement signals, not tamper-proof assessment records. A capable client can submit fabricated interactions against a valid delivered capability; it cannot claim correctness or a different server identity/course/item outside that capability. Capability lifetime is six hours. Network failures, navigation before queue delivery, throttling, missing signing configuration and privacy refusal undercount. No automatic retries are introduced. Persistent DB SQL behavior was not integration-tested against a database during development; tests verify generated parameterized MySQL SQL and mocked result handling, not live execution. The application’s existing database timestamp conventions are retained; return-day metadata is explicitly stamped in UTC.

## Validation

All commands used a clean `env -i` environment, with PATH/HOME/TMPDIR and test settings only; Vitest additionally preloaded `scripts/test-safety.cjs` and used the placeholder Stripe test key. No inherited DB credentials were available.

- Full `tsc --noEmit -p tsconfig.json`: pass.
- Full `tsc --noEmit -p tsconfig.scripts.json`: pass.
- `git diff --check`: pass.
- Selected Vitest run: **10 files, 215 tests passed**. Files: `server/gameAnalytics.test.ts`, `client/src/lib/gameAnalytics.test.ts`, `client/src/components/AdminGamesActivity.browser.test.ts`, `client/src/components/InteractiveDrill.results.browser.test.ts`, `server/interactiveContent/engine/router.test.ts`, `client/src/pages/CourseInteractiveLearning.saved.browser.test.ts`, `client/src/pages/CourseInteractiveLearning.browser.test.ts`, `client/src/components/InteractiveDrill.sessions.test.ts`, `client/src/pages/CourseInteractiveLearning.sessions.test.ts`, `server/trpcRateLimit.test.ts`.
- Isolated Chromium tests use synthetic data and mocked transport, including all six modes under React StrictMode, first answer/no page-view play, skips, duplicate callbacks, backtracking, timed repeats, empty/answered timer expiry, timed restart and anonymous course reporting with saved progress absent. Existing engine/access/session tests remain green.
- Card loading/empty/error/retry/period/definitions and overflow tested at 390px and 1280px. Existing blue/black overview typography, spacing and panel classes preserved.
- Server tests cover signed capability tampering/expiry/browser/identity changes, internal/admin/test exclusions, DNT/GPC, strict payload bounds, dedupe keys, completion evidence, per-identity throttling, real admin route authorization and SQL aggregation construction.

## Review and release boundary

Self-review intent: measure actual course-game engagement without coupling it to readiness or saved progress. No known critical or major issues found in the focused change; positive patterns are narrow signed delivery bindings, privacy-minimized persistence and SQL DISTINCT aggregation instead of a migration. Remaining limitations are the best-effort/client-reported nature of engagement and absence of live-DB integration validation, documented above. Independent parent review remains required.

Branch is based on verified remote main `118c342b51eddae60132f1fa434cc3cf6811a342`. This is a local review checkpoint only: no push, PR, merge or deployment has been performed. Parent handles independent review and any subsequent push/PR/merge/deploy authorization.
