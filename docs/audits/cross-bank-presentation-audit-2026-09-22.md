# Cross-bank learner presentation audit

**Date:** September 22, 2026
**Scope:** Active Echelon course banks, shared catalogue copy, practice and mock page source, and checkout display paths.
**Method:** A read-only query against the authoritative production question-bank data, static source inspection, and local browser verification of representative routes. No production data, price, checkout, Stripe, or infrastructure change was made.

## Executive summary

The Class 3 Water Distribution issue was not isolated. The audit covered 36 active courses and 35 individually catalogued products. It found **five course metadata records that do not match learner-visible inventory**, **23 exact product-description counts that are stale**, **28 mock intro pages that derive a displayed count from a preview pool**, and widespread hard-coded two-hour marketing text despite the server-issued mock specification being three hours for most active courses.

The shared checkout repair already protects the commercial offer itself. Active individual catalogue products determine the displayed offer and the checkout request, so outdated component-level price props are not currently changing the amount charged. However, 107 manual price props or labels remain in source and should be removed during a focused presentation cleanup so future changes cannot reintroduce price drift. The recommended next release is a display-only correction. It should use authoritative bank metadata for every learner-visible count, server mock specifications for duration text, and the shared catalogue for all checkout copy. It must not change prices, access terms, Stripe behaviour, or question data.

## Authoritative inventory and metadata mismatches

The practice hook reads `question_bank_meta.totalQuestions`, while learner-visible practice data excludes `in_review` and `rejected` rows. These five metadata records currently understate what learners can access.

| Course | Learner-visible questions | Metadata shown to client | Difference | Risk |
|---|---:|---:|---:|---|
| Water Quality Analyst | 500 | 475 | 25 | Practice surfaces can understate the bank by 25 questions. |
| WPI Class III Water Treatment | 561 | 531 | 30 | Practice surfaces can understate the bank by 30 questions. |
| WPI Class IV Water Treatment | 678 | 592 | 86 | Practice surfaces can understate the bank by 86 questions. |
| WPI Class III Water Distribution | 611 | 590 | 21 | Practice surfaces can understate the bank by 21 questions. |
| WPI Class IV Water Distribution | 620 | 610 | 10 | Practice surfaces can understate the bank by 10 questions. |

All other standard active question banks audited had metadata equal to the current learner-visible count. The separate 309A program has a distinct certification-bank data path and was not treated as a missing standard-bank record.

## Mock intro count defect

Twenty-eight mock pages build their intro line from `POOL.length`. For an unpaid visitor, `POOL` is the bounded preview response, not the full learner-visible bank. Local browser verification showed the Class 2 Water Distribution mock presenting **15 questions**, while the authoritative learner-visible bank has **535 questions**.

This defect affects the following mock page families:

| Family | Affected pages |
|---|---:|
| Ontario treatment and collection | 11 |
| Ontario water distribution | 3 |
| WPI treatment, collection, and distribution | 14 |
| **Total** | **28** |

Each affected mock should use the bank metadata label with a safe fallback, not the currently loaded preview-pool length.

## Stale catalogue inventory claims

The product catalogue has 23 exact numeric question-count claims that conflict with learner-visible inventory. These are display-copy defects. They do not require a question-data change.

| Product family | Product | Catalogue claim | Learner-visible questions |
|---|---|---:|---:|
| Ontario Water Treatment | Class 2 Water Treatment | 500 | 503 |
| Ontario Water Distribution | Class 1 Water Distribution | 500 | 966 |
| Ontario Water Distribution | Class 2 Water Distribution | 500 | 535 |
| Ontario Water Distribution | Class 4 Water Distribution | 500 | 568 |
| Ontario Wastewater Collection | Class 1 Wastewater Collection | 500 | 974 |
| Ontario Wastewater Collection | Class 2 Wastewater Collection | 500 | 560 |
| Ontario Wastewater Collection | Class 3 Wastewater Collection | 500 | 572 |
| Ontario Wastewater Collection | Class 4 Wastewater Collection | 500 | 570 |
| WPI Water Treatment | Class I | 502 | 598 |
| WPI Water Treatment | Class II | 501 | 598 |
| WPI Water Treatment | Class III | 502 | 561 |
| WPI Water Treatment | Class IV | 501 | 678 |
| WPI Wastewater Treatment | Class I | 500 | 594 |
| WPI Wastewater Treatment | Class II | 501 | 599 |
| WPI Wastewater Treatment | Class III | 501 | 607 |
| WPI Wastewater Treatment | Class IV | 502 | 907 |
| WPI Wastewater Collection | Class I | 150 | 499 |
| WPI Wastewater Collection | Class II | 150 | 503 |
| WPI Wastewater Collection | Class III | 150 | 503 |
| WPI Water Distribution | Class I | 150 | 500 |
| WPI Water Distribution | Class II | 150 | 595 |
| WPI Water Distribution | Class III | 150 | 611 |
| WPI Water Distribution | Class IV | 150 | 620 |

Ten catalogue descriptions use a conservative `400+ questions` claim that is still true for current visible inventory. Two descriptions have no numeric inventory claim. The Class 3 Water Distribution catalogue description is now non-numeric, which avoids a stale exact claim until a central dynamic inventory path is adopted.

## Time-limit copy drift

The server mock specification is the operating authority. Most active Ontario and WPI mock sessions are issued with a three-hour duration. The audit found old two-hour strings in SEO descriptions, quiz promotional bullets, comments, and shared feature text. Representative affected areas include Ontario Class 1 through 4 mocks, OIT Water, WQA, Ontario collection and distribution mocks, and several quiz-to-mock promotional bullets.

The displayed timer can already be correct even where the metadata description is stale. For example, the Class 2 Water mock displayed a **three-hour** time limit in the local preview while its SEO description still said **two-hour timer**. The cleanup should derive all visible duration wording from the same server-controlled mock specification or a shared duration formatter.

## Commercial offer assessment

The audit found 107 explicit manual price props or labels across course pages. Several are stale, such as `CA$99` props on higher-level courses. The current shared offer resolver prevents them from changing active individual product offers: the authoritative catalogue price and product name win, and checkout passes only the product key and currency to the server.

Local verification confirmed this protection on Class 2 Water Distribution. Its page retains an old `price={99}` source prop, but the rendered purchase gate correctly shows the active **CA$149** 12-month exam pass. Therefore this is a source-hygiene and future-regression problem, not evidence of an active price or charging error.

## Confirmed Class 3 Water Distribution baseline

The authoritative Class 3 Water Distribution bank has **571 learner-visible questions**. Its active individual catalogue product is **CA$249** or **US$179**, with **12 months of access from successful payment**. The server issues a 100-question mock with a **three-hour** duration. The prior Class 3 display repair aligns its practice and mock surfaces with those values.

## Recommended repair scope

The next display-only release should be narrowly scoped and sequenced as follows:

1. Correct the five `question_bank_meta.totalQuestions` records through the established reviewed metadata process, without touching question content or learner records.
2. Replace all `POOL.length` mock intro claims with the metadata-backed count formatter used in the Class 3 correction.
3. Replace exact static inventory claims in product descriptions, quiz subtitles, page metadata, and mock info lines with current metadata-backed display values or deliberately conservative non-numeric copy.
4. Replace hard-coded duration copy with a shared formatter based on the server mock specification. The WPI Class IV Wastewater special case must retain its 110-question, three-hour specification.
5. Remove stale manual `price`, `priceLabel`, and `productName` props from course pages after confirming the shared catalogue resolver remains the only offer source.
6. Add a cross-bank regression audit that fails when metadata, visible inventory, mock duration copy, or active catalogue offer values drift.

This work must not change commercial prices, access duration, Stripe charging behaviour, question review status, live question content, or production infrastructure.

## Validation evidence

The audit ran in a read-only transaction against the authoritative production data, with static source scanning and local preview verification. The local Class 2 Water Distribution mock visibly reproduced the preview-count issue. The local Class 2 Water mock visibly confirmed that the canonical catalogue offer overrides a stale manual prop and that a three-hour displayed timer can coexist with stale two-hour SEO text.

> This audit identifies customer-facing copy and metadata defects. It is not a statement about question quality, answer accuracy, certification alignment, or historical learner data.
