# Historical OIT Approved-Subset Release — 2026-09-10

This controlled release updated only the **62 independently approved historical Ontario OIT revisions** from the staged evidence dossier. It did not delete historical questions or alter the existing Codex OIT package. The 5 items returned for narrower revision and the 37 retained source/editorial holds were deliberately excluded and remain unchanged in the live historical bank.

| Bank | Independently approved revisions applied | Learner-visible count before and after |
|---|---:|---:|
| Water OIT (`oit`) | 52 | 1,038 |
| Wastewater OIT (`oit-ww`) | 10 | 1,033 |
| Total | 62 | 2,071 |

The update was protected by an exact staged-payload checksum (`517f82e130049583a61004c2fc8744f02db6890a70a923d378673be005dc8198`) and a fresh pre-update rollback baseline (`6acd234a8d6f2c243d606c7a56190faed72e4dfcd780bda1188cdc8e1880dfc6`) stored in managed storage. The first guarded apply detected an incompatible archival cognitive-level label and rolled back atomically before commit. The corrected release path preserved the schema-valid stored cognitive level, re-captured the baseline, repeated the managed backup and dry-run reconciliation, then committed the exact 62 revisions.

Post-update reconciliation found zero outstanding changes: all 52 Water and 10 Wastewater target rows match the staged payload, question IDs and review statuses are unchanged, learner-attempt counts match the rollback baseline, and learner-visible totals remain 1,038 Water and 1,033 Wastewater. Public OIT hub and Wastewater-practice routes were checked without selecting or submitting answers.

The remaining unresolved historical records are **not deleted** and are **not approved by this release**. Any later work on those records requires scoped source remediation, independent review, a new staged payload, fresh rollback evidence, and separate promotion authorization.
