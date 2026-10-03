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
- A returned provider response ID is saved before deadline checks and retained through a recoverable persistence failure. Recovery polls that response instead of submitting again.
- Temporary source HTTP failures and safe-read deadline cancellation preserve the phase for another callback, within the thirty-minute run limit.
- Existing HTML, article-length, heading, internal-link, duplication and editorial-review checks remain. One revision is allowed. A failed review, refused output or incomplete response cannot publish.
- The article insert and run completion commit together. Replayed callbacks cannot publish the article twice.
- The existing owner notice runs after publication commits. Notice failure cannot undo or repeat publication.
- Only the stored project task identities can call the production worker. Preview and sandbox hosts are rejected.
- The Data Explorer exposes run status, timestamps and a safe error summary. Drafts, source extracts, provider IDs and lease tokens remain hidden.

## Proposed database change

`drizzle/0074_blog_automation_runs.sql` creates one new `blog_automation_runs` table with indexed scheduler task identities. It does not alter or delete existing blog articles, learner records, purchases or payment data.

The migration is registered as proposed in the guarded forward manifest. Production application requires explicit approval and a verified backup. The new worker must be deployed only after that table is installed.

## Validation

The automated tests cover:

- provider request shape, background submission, retrieval, refusal and missing keys;
- schedule creation, unchanged schedules, paused schedule repair and missing schema;
- callback task authorization and truthful responses;
- saved phase transitions, one revision, uncertain submissions, returned-response recovery after deadline/write failures, actual source HTTP 500/503 recovery and safe polling retries;
- real disposable-database enqueue deduplication, competing replicas, expired lease rejection, restart recovery, atomic publication, duplicate articles and rollback on a completion failure.

Existing published articles were not changed. No article was generated or published to production during this repair. A minimal harmless API capability test verified that the requested model supports background submission and retrieval.

## Release order

1. Finish exact-commit review and the full GitHub Quality Gate.
2. Obtain explicit approval for migration 0074 and the guarded release.
3. Verify a backup, apply only the approved additive migration and verify schema/ledger state.
4. Publish the tested checkpoint through the existing Echelon project.
5. Confirm the weekly and continuation task bindings are registered.
6. Verify the first completed run before describing the recurring blog as recovered. Do not force an extra public article without approval.
