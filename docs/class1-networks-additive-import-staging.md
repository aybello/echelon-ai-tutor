# Class 1 Distribution and Collection Additive Import — Review-Only Staging

**Release state:** Completed production database staging; not learner-visible.

On 2026-09-11, the merged PR #79 Class 1 candidate package was inserted as a single guarded additive transaction. The transaction was bound to the exact package checksum `ade07fcc19950eeaebd9b19b5a741d32f030216fb90a65b7832f1d401414fb34`, after a fresh full-bank rollback baseline had been captured and stored in managed storage.

| Control | Verified result |
|---|---|
| Target banks | `class1-water-dist` and `class1-wastewater-coll` |
| Additions | 250 candidates per bank, numbered `2001–2250` |
| Stored counts after staging | 966 Distribution; 974 Collection |
| Existing rows | 716 Distribution and 724 Collection retained without change |
| Existing learner attempts | 0; unchanged throughout the transaction |
| New-row review state | `in_review` only |
| Learner-visible counts | Unchanged at 716 Distribution and 724 Collection |
| Post-stage reconciliation | Exact package present; replay preflight reports `already_staged` with no errors |
| Rollback baseline | `8263dfaa29360962027ceaede9495f6ea7494046842a83e023dd3f0ff50032df` |

The learner delivery filter excludes `in_review` rows. Therefore, this operation inserted the candidates into the production database without changing any learner-visible practice, mock-exam, or flashcard bank. Promoting this exact 500-item set requires a distinct authorization, a review-status promotion gate, and another post-promotion delivery verification.

## Verification Record

The full test suite passed with 1,295 tests. Focused package and importer tests passed, including an isolated database transaction test that verifies full-batch atomicity, unchanged existing rows, preserved learner-visible counts, and rollback on baseline drift. Application and script TypeScript checks passed, and the production build succeeded. The build continues to report pre-existing large-chunk warnings; it completed successfully.

Both live practice routes loaded without selecting an answer or creating an attempt. As expected for review-only staging, their current learner-facing labels and served pools were not changed by the database insert.
