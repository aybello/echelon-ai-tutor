# Class 1 Treatment Learner-Visible Release — 2026-09-11

## Scope

The user-authorized release added and published an exact, checksum-bound set of **500 Class 1 Treatment questions**: 250 Water Treatment and 250 Wastewater Treatment questions. The governed package checksum is `627721c849bd492eaaf6cb7ce902a6f237fdbddbd1758e8b5e13001c142a9513`.

## Content controls

The original package received independent item-level review. The initial review cleared 465 candidates and returned 35 for bounded correction. Those corrections received separate re-review; a final structural cue screen then found six residual answer-cue cases. All six were revised and independently approved. Three option-order-only adjustments balanced the Wastewater Treatment answer positions without changing any stem, option text, answer, explanation, or source. The final package passed structural, duplicate, calculation, key-consistency, and answer-cue checks.

One rotating-equipment safety item was restricted to the cited Canadian CCOHS lockout guidance: authorized hazardous-energy isolation and verification before inspection. It does not claim a wastewater-specific or Ontario statutory rule.

## Production controls

Before insertion, a fresh full-bank rollback baseline was captured and stored in managed storage under `governed-content-backups/class1/treatment-import/2ad69a25cbde5bd9efb7449df83ef11591af8a9038222650abf21e6200c3608b.json`. Two read-only preflights confirmed no collisions, duplicate stems, metadata drift, or baseline drift. The guarded additive transaction inserted exactly 250 `in_review` rows per bank, then a separate checksum-gated promotion transaction changed exactly those 500 rows to learner-visible `unreviewed` status.

## Verified outcome

| Bank | Baseline | Added | Learner-visible total |
|---|---:|---:|---:|
| Class 1 Water Treatment | 555 | 250 | **805** |
| Class 1 Wastewater Treatment | 565 | 250 | **815** |

No existing question was deleted or modified. The newly added question rows have zero recorded learner attempts at release verification. The Water and Wastewater practice pages loaded unanswered questions on both the custom and managed production domains; the corrected header uses authoritative bank metadata and displays 805 and 815 respectively. No answer was selected, confirmed, or submitted during verification.

The post-release importer and promotion preflights both now return `already_visible` with no errors for the exact package checksum. This confirms that the package cannot be inserted or promoted a second time while preserving a read-only replay record.

## Remaining documentation limitation

The package retains topic-level source records and the governed independent-review ledger. It should not be represented as independent regulator or Ontario SME certification for every individual item.
