# Loading follow-up (17 October 2026)

The earlier mobile `/chem-calc` and `/teams` 20-second DOMContentLoaded timeouts were not reproduced in this focused run. Fresh anonymous Chromium contexts at 390 × 844 recovered to usable content without interaction. A short-lived spinner, including the earlier quiz snapshot at 6.5 seconds, is not by itself evidence of an application defect.

## Measured live behavior

The shell-based Playwright probe used separate anonymous contexts, blocked service workers, and aborted every non-GET/HEAD request. It also denied the Manus analytics script, matching the supplied smoke evidence. No answers, chat, OTP, checkout, learner records, or scheduled callbacks were submitted. URLs in saved evidence omit query strings; response bodies and cookies were not saved.

- `/chem-calc`: DOMContentLoaded 7.93 seconds; calculator input visible 10.35 seconds. Document TLS negotiation took 2.20 seconds, with a further 1.80 seconds from request start to first byte. Initial document response completed at 4.11 seconds. The first script wave completed around 7.76 seconds; route/shared chunks followed around 7.96–9.87 seconds.
- `/teams`: DOMContentLoaded 5.13 seconds; heading visible 7.92 seconds. Document TLS negotiation took 1.40 seconds; request-to-first-byte 0.82 seconds. Route dependencies followed the initial bundle; the forms vendor chunk finished at 7.75 seconds.
- `/quiz`: DOMContentLoaded 5.62 seconds; practice question visible 9.44 seconds. Document TLS negotiation took 1.44 seconds; request-to-first-byte 0.70 seconds. The quiz shared chunk took 2.48 seconds and completed around 7.98 seconds. The initial data batch completed around 9.30 seconds.

Multiple unrelated first-party assets had roughly 1–3.6-second request-to-first-byte waits. Independent public HEAD checks also took 3.29 seconds for `/chem-calc` and 3.26 seconds for a vendor asset; TLS alone took 1.63 and 2.14 seconds. These are client-observed network/server-path timings, not server execution traces: they do not establish whether the edge, origin, proxy, or transit caused the waits.

## Source checks against those timings

`App.tsx` eagerly imports the landing page and common gates while calculator, Teams, and quiz routes are lazy-loaded. This creates the observed second asset wave. The first-wave miscellaneous vendor transfer was about 152 KB encoded; quiz shared code about 107 KB. The quiz graph also includes the eagerly imported tutor renderer and math styles. These are potential optimization candidates, not a demonstrated cause of the original 20-second failures; no eager/lazy boundary was changed.

Sora CSS completed in approximately 44–54 milliseconds and font transfers in approximately 34–74 milliseconds. The stylesheet begins as a preload, is promoted by `enableFontStylesheet`, and uses `display=swap`. Fonts did not explain the measured multi-second waits.

The global phone gate starts `auth.me`, but returns nothing while loading rather than suspending public content. Calculator and annual Teams content render without waiting for data. Their navigation/session reads do not block the page. On `/quiz`, bank metadata, module overviews, access check, auth, dashboard auth, missed questions, and random questions were in one tRPC request batch, taking about 1.25 seconds total. There was no measured serial auth-then-question waterfall to repair. Aggregate API timing cannot isolate SQL execution time; a database cold start is not established.

The scheduled `/api/scheduled/db-keepalive` callback imports `forceReconnect` from `server/db.ts`. If a pool already exists, it pings that pool. Otherwise `createPool()` calls `activeDatabaseSettings()`, which selects the external URL, CA, and designated database when `DATABASE_CUTOVER_USE_EXTERNAL_TARGET=true`. It does not explicitly target a separate legacy database. One source caveat is that `forceReconnect` first checks `DATABASE_URL` even in external mode; this was not changed because an absent legacy variable or a failed live callback was not demonstrated. The independent two-minute internal keepalive also uses `createPool()`. The schedule description mentioning TiDB is not evidence of which deployed database is being warmed. No callback or configuration was changed or invoked, and the scheduler's actual live target/reachability was not verified here.

## Narrow CI repair

The existing configured learner-browser command omitted `e2e/practice-topic-recovery.spec.ts`. It now includes that spec alongside course-chunk recovery. A regression in `server/ciBrowserRuntime.test.ts` requires the exact spec token in that existing command and preserves failure propagation. The new regression failed before the workflow edit, with two existing checks passing; all three checks passed afterward. No application routing, quiz behavior, gates, timeouts, retry counts, or browser assertions were weakened.

## Evidence

Raw lane artifacts are in `/home/ubuntu/jobs/job_m9JJxkYX/`: `live-loading-timing.json`, `loading-probe.log`, `public-head-timing.txt`, the isolated probe script, focused test logs, typecheck logs, and local browser-test results. These filesystem paths are investigation artifacts, not published product URLs. The source diagnosis uses baseline commit `8a8af187223870fb3fcc4fff86a9eeec4a43edcb`; the live asset filenames match the supplied prior smoke. No deployment or server-side identity change was performed.

Public routes inspected: [calculator](https://echeloninstitute.ca/chem-calc), [Teams](https://echeloninstitute.ca/teams), and [quiz](https://echeloninstitute.ca/quiz).
