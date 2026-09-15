# Learner recording and Class IV mock repair — September 15, 2026

## What this change repairs

WPI Class IV Wastewater now issues 110 unique questions: 100 scored and 10 unscored practice pre-test items. The signed manifest includes an encrypted pre-test selection so it cannot be decoded by the browser during the exam. All 110 answers, including unanswered entries, must be submitted. Only the 100 scored entries affect the result, module breakdown, question attempts and readiness. The result explains the denominator and identifies unscored items during review. Previously issued version-1 sessions keep their original scoring.

The existing strict blueprint continues to select the **100 scored** questions jointly against 28/42/15/15 topic totals, 25 recall/75 application and 16 calculations. The 10 additional items are selected without replacement from the remaining bank. Profile activation remains a separate, guarded operation; deploying this branch does not falsely mark an unclassified bank aligned. The release preflight now also requires at least 110 usable questions.

Process Guide and Equipment Lab recording use the server's authenticated entitlement list. A sole available course is selected automatically; with multiple courses, a valid guide preference or explicit selection is used. The guide's lesson content and diagrams are unchanged. The recording strip shows access, saving and retry failures. The common recording hook starts after interaction, uses a 60-second idle window, retries initial session creation with the same UUID/start time, and retains immutable heartbeat payloads until acknowledged. Final requests use a non-batched keepalive transport; SPA navigation drains outstanding work for up to a minute. Back/forward-cache navigation does not permanently stop recording.

Flashcards now send individual known/unknown changes with unique operation IDs. Transactions merge them with the complete course-wide state, preserve legacy records and prevent replayed saves from undoing a newer rating. The browser retains each pending operation separately for retry/reload and shows a saved confirmation only after acknowledgement. Two tabs cannot overwrite each other's stored outbox entries. Old replacement-save requests are rejected with a refresh instruction, preserving the historical data.

## Source evidence

Checked September 15, 2026: [Manitoba's certification page](https://www.gov.mb.ca/sd/waste_management/wastewater/wastewater_certification_program/index.html) describes the latest standardized exams, 110 questions and a 70% passing grade, and links the current WPI resources. The [WPI Class IV wastewater criteria](https://gowpi.org/wp-content/uploads/2026/04/WastewaterTreatment-%E2%80%93-Class-4_mh-fin.pdf) specifies the 100-question scored blueprint and unscored pre-test convention. The ten extra Echelon items are a simulation; they are not WPI's actual pre-test content or an endorsement.

## Migration and controlled release

This branch adds **only migration 0064_flashcard_progress_operations**. Before release, check current main and the production migration ledger for a numbering collision. Do not edit an already-applied migration. Do not run the unrestricted all-pending migration command.

1. Run the full remote Quality Gate, including the new database-backed flashcard tests and extended Teams browser journeys. Require evidence from the actual proposed head.
2. Verify a recoverable production backup and retain the backup reference privately.
3. Apply only the additive migration in the authorized production release environment:

```sh
MIGRATION_APPROVED=APPLY_APPROVED_STANDALONE_MIGRATION \
MIGRATION_BACKUP_CONFIRMED=BACKUP_VERIFIED \
MIGRATION_TARGET=0064_flashcard_progress_operations \
node --import tsx scripts/db/migrate.ts apply-standalone
```

Supply `DATABASE_URL` through the release environment, never the command text or repository. Verify the ledger, `flashcard_progress_state` and `flashcard_progress_operations` against the migration contract. No existing progress is deleted; legacy IDs are merged on first write. Existing losses cannot be reconstructed automatically from data already overwritten before this fix.

4. Deploy the checked application and verify its release marker. With dedicated QA identities, exercise a sole WPI Class IV Course Pass through guide recording, an aborted initial tracking request, reconnect, Equipment Lab, flashcard failed save/retry/reload, and mock completion with unanswered items. Confirm manager reporting stays scoped to the operator's organization.
5. Follow `docs/mock-blueprint-labels-release.md` to run the read-only Class IV profile preflight against the exact current bank. Retain the current Manitoba/WPI references as edition evidence. If classifications or joint quotas fail, repair the identified bank records and repeat preflight; do not activate by bypassing its checks. After a successful reviewed preflight and backup, use its guarded apply command and verify multiple 110-item mocks, checking quotas on the 100 scored subset server-side.

A code rollback leaves the additive tables intact. The old application does not read the new state, so pause flashcard writes or forward-fix if rolling back; do not declare old/new progress reconciled or delete the new receipt history. Preserve signed mock compatibility for already-issued sessions when selecting a rollback build.

## Verification and honest limits

Local deterministic suite: 1,141 passed, 16 database-dependent cases skipped. Both TypeScript configurations and the migration manifest passed. Focused mock/recording tests prove retries, exact scored quotas, hidden pre-test identities, partial-submission rejection, final drain and legacy session compatibility. Real database tests cover concurrent first saves, union of legacy rows, independent device updates, replay, payload conflicts and account isolation. The Teams browser regression exercises course attribution and a failed tracking start, plus failed flashcard writes and reload preservation. Database/browser execution requires the isolated CI services; no production credentials or customer sessions were used during implementation.

Keepalive is best-effort: a hard browser/device shutdown while offline cannot guarantee a final delivery. The UI tells learners to keep the page open during retries. Sessions expire after five minutes; unrecoverable intervals are disclosed, not credited as if saved. This is platform-recorded, interaction-sensitive study time, not a claim of verified attendance or regulatory credit.

## Historical OIT: exact remaining input

The 972-question expansion is already released; do not re-import it. `docs/oit-historical-approved-subset-release.md` records 62 historical corrections applied, leaving five narrower rewrites and 37 source/editorial holds. Those remaining 42 are **not repaired by this code branch**.

The current repository has older candidates and aggregate release evidence, but not the exact final 104-item staged dossier identifying the 62 applied versus 42 held rows. The older full-bank export predates the applied subset and cannot safely serve as today's rollback baseline. Manus should retrieve the private dossier identified by staged checksum `517f82e130049583a61004c2fc8744f02db6890a70a923d378673be005dc8198`, then produce a read-only current export of the exact 42 held `(bankKey, questionNum)` records with IDs, question/options/correctIndex/explanation, module/topic, source references and row hashes. Preserve the dossier's five revision reasons and 37 source holds. Return that exact package for scoped source-backed repair; do not substitute unrelated older deferred lists or infer the identities from totals. Batch validation and guarded updates are sufficient; no mandatory individual approval workflow is introduced.
