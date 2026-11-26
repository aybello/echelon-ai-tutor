# Durable weekly blog repair

## Problem

The weekly publishing callback performed research, article generation, editorial review and possible rewriting inside one request. Recent scheduled runs timed out before an article was saved. The public blog and its existing articles still worked.

## Repair

- The weekly callback only queues a run and returns immediately.
- A project-owned continuation callback advances one saved step each minute. Idle callbacks do not call a model.
- Research uses the existing official-source allowlist. Source reads and provider requests have explicit deadlines.
- Drafting and editorial review use the directly verified `gpt-6.1-sol` model through OpenAI background Responses. The worker retrieves the saved response instead of waiting for generation inside the callback.
- A thirty-minute run limit stops stalled work.
- Database-time leases allow only one worker to own a step and reject expired workers.
- Submission intent is saved before any paid model request. An uncertain submission is stopped for inspection rather than resubmitted and billed again.
- A failed run blocks weekly enqueue even after the UTC week changes. The next scheduled callback returns `409` / `failed_requires_inspection` without replacing its progress, error, run key or saved response. A calendar boundary is not authorization to retry.
- The sole exception archives a narrowly proven first-draft, pre-transport `missing_credential` failure as sparse audit metadata and starts a fresh topic-only run. It never reuses or submits the historic draft, research, error, provider ID, or lease token. Every near-match remains blocked for inspection.
- A returned provider response ID is saved before deadline checks and retained through a recoverable persistence failure. Recovery polls that response instead of submitting again.
- Temporary source HTTP failures and safe-read deadline cancellation preserve the phase for another callback, within the thirty-minute run limit.
- Existing HTML, article-length, heading, internal-link, duplication and editorial-review checks remain. One revision is allowed. A failed review, refused output or incomplete response cannot publish.
- The article insert and run completion commit together. Replayed callbacks cannot publish the article twice.
- The existing owner notice runs after publication commits. Notice failure cannot undo or repeat publication.
- Only the stored project task identities can call the production worker. Preview and sandbox hosts are rejected.
- The Data Explorer exposes run status, timestamps and a safe error summary. Drafts, source extracts, provider IDs and lease tokens remain hidden.

## Proposed database change

`drizzle/0074_blog_automation_runs.sql` creates one new `blog_automation_runs` table with indexed scheduler task identities. `drizzle/0081_blog_automation_unsent_archive.sql` adds a separate sparse audit table for the sole proved pre-transport credential failure. Neither migration alters or deletes existing blog articles, learner records, purchases or payment data.

The migration is registered as proposed in the guarded forward manifest. Production application requires explicit approval and a verified backup. The new worker must be deployed only after that table is installed.

## Validation

The automated tests cover:

- provider request shape, background submission, retrieval, refusal and missing keys;
- schedule creation, unchanged schedules, paused schedule repair and missing schema;
- callback task authorization and truthful responses;
- saved phase transitions, one revision, uncertain submissions, returned-response recovery after deadline/write failures, actual source HTTP 500/503 recovery and safe polling retries;
- real disposable-database enqueue deduplication, competing replicas, expired lease rejection, restart recovery, atomic publication, duplicate articles and rollback on a completion failure;
- exact definitely-unsent archival, concurrent weekly callbacks, and archive rollback if resetting the singleton run fails.

Existing published articles were not changed. No article was generated or published to production during this repair. A minimal harmless API capability test verified that the requested model supports background submission and retrieval.

## Failed-submission inspection

The direct adapter accepts `OPENAI_CUSTOM_API_KEY`, falling back to `OPENAI_API_KEY`,
and always calls the official OpenAI Responses endpoint. Sandbox environment
presence or successful metadata discovery does **not** establish what credential
was available to a historical deployed callback.

For a failed `*-submit` run with `submissionPending: true` and no `responseId`,
absence of an ID is not proof that nothing was sent. A legacy generic error also
cannot establish credential, timeout or schema failure. Do not reset/requeue it,
including through a new weekly run. Reconcile the exact deployed-runtime logs
and provider request history for that run's time window first.

The only automatic exception requires the exact stored first-draft state,
`submissionPending: true`, `submissionNotSent: true`, no response/article/issues,
no active claim or lease, a canonical weekly key, and the canonical pre-transport
OpenAI `missing_credential` error. It writes only sparse fixed audit metadata and
queues a fresh topic run in the same transaction. It does not retry or recover
the historic request. Any uncertainty remains inspection-only.

## Release order

1. Finish exact-commit review and the full GitHub Quality Gate.
2. Obtain explicit approval for the required migration(s) and the guarded release.
3. Verify a backup, apply only approved additive migrations, including 0081 before this recovery code is deployed, and verify schema/ledger state.
4. Publish the tested checkpoint through the existing Echelon project.
5. Confirm the weekly and continuation task bindings are registered.
6. At the next normal weekly callback, verify the archive-and-fresh-queue outcome and then the first completed run before describing the recurring blog as recovered. Do not force an extra public article without approval.
