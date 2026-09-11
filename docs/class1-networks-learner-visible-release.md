# Class 1 Distribution and Collection Learner-Visible Release

**Release marker:** `2026-09-11.class1-networks-live.1`  
**Scope:** User-authorized promotion of the exact staged PR #79 Class 1 candidate package to learner-visible status.

## Outcome

The exact 500-question Class 1 Distribution and Collection candidate package was promoted from `in_review` to `unreviewed` in one guarded transaction. The package remains bound to SHA-256 checksum `ade07fcc19950eeaebd9b19b5a741d32f030216fb90a65b7832f1d401414fb34`.

| Bank | Pre-promotion learner-visible count | Promoted records | Final learner-visible count | Final stored count |
|---|---:|---:|---:|---:|
| Class 1 Water Distribution | 716 | 250 | **966** | 966 |
| Class 1 Wastewater Collection | 724 | 250 | **974** | 974 |

Existing rows were neither edited nor deleted. The pre-stage full-bank rollback baseline remains stored in managed storage, and the promotion itself is an exact, bounded review-status change. The post-promotion database reconciliation confirmed that both final bank inventories consist solely of learner-visible `unreviewed` records and that the 500 promoted records have no learner attempts.

## Controls and Evidence

Before promotion, the read-only preflight locked the full target-bank scope for validation and required all of the following: the exact package checksum, 250 complete and unchanged `in_review` candidates per bank, no conflicting or duplicate stems, and learner-visible metadata aligned with the 716/724 baseline. A second preflight immediately before apply passed with no errors.

The promotion command only updated the 500 exact staged candidates, guarded each update by `reviewStatus = 'in_review'`, recomputed the learner-visible count, and guarded the corresponding metadata update with the observed `totalQuestions` and `contentVersion`. It rolled back on any candidate, metadata, or post-update reconciliation conflict.

Focused package/planner tests, the isolated database promotion/rollback test, the full test suite, application and script TypeScript checks, and the production build passed. The production build has pre-existing warnings for large JavaScript chunks but completed successfully. Live Distribution and Collection practice routes loaded without an answer selection or submission.

The first learner-copy update used `allQuestions.length`. These two practice pages intentionally use `lazy` loading, so that value is empty while the separately managed practice-session loader retrieves the question. A live post-publication check detected the resulting zero-count header before final handoff. The follow-up correction uses the authoritative `useQuestionBank.totalQuestions` metadata instead. Local rendered verification now shows **966 questions** for Distribution and **974 questions** for Collection. The corrected frontend artifact requires the follow-up publication checkpoint and live-domain verification recorded below.

## State Separation

| State | Status |
|---|---|
| Candidate package merged to repository | Completed in PR #79 / commit `d69c15ad` |
| Database additive staging | Completed before this release |
| Learner-visible status promotion | Completed in this release |
| Initial code artifact / release marker | Published as checkpoint `94c20d50` |
| Corrected count-rendering artifact | Validated locally; pending follow-up publication checkpoint at time of this revision |
| Production runtime verification of corrected frontend artifact | Pending follow-up checkpoint publication and cache-propagation check |

No learner answer was selected, confirmed, or submitted during release verification.
