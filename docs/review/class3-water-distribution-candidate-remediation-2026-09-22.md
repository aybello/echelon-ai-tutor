# Class 3 Water Distribution candidate remediation

**Status:** Draft-only, held for qualified Ontario subject-matter-expert review.
**Scope:** 250 Class 3 Water Distribution candidates numbered 2001 to 2250.
**Date:** September 22, 2026.

## Purpose

This remediation improves the 250 candidate questions prepared for the Class 3 Water Distribution bank. The work replaces generic topic-map-only references with answer-level source mapping, improves the practical quality of answer choices, and adds structured Formula, Substitution, and Result steps to every calculation. The candidates remain in the `in_review` state and are not learner-visible or approved for production publication.

## What changed

The canonical candidate builder now overlays a reviewed draft revision package onto the original blueprint-aligned records. The overlay preserves each candidate's number, module, topic, calculation designation, and original correct-answer position. It fails closed if any of the 250 revisions is missing. Every revised record includes a named source, an HTTPS source URL, a limited statement of the technical point supported, and a non-publication review status.

The rewrite focuses on field-realistic judgment. Distractors that relied on irrelevant detail, such as billing, appearance, unrelated equipment, or personal information, were replaced with technically plausible but incorrect or incomplete alternatives. Operational questions now distinguish general practice from actions that depend on local approved procedures, operating conditions, work classification, authorization, or incident roles. Calculation questions retain their verified answers and add explicit formula components, substitutions, units, and results. Simplified hydraulic calculations are labelled as nominal or approximate where that distinction matters.

## Source-review coverage

The supporting source reviews are organized by the four Class 3 blueprint modules:

| Module | Candidate count | Source review |
|---|---:|---|
| General | 58 | [General source review](class3-2026-09-22-source-review-general.md) |
| Processes | 62 | [Processes source review](class3-2026-09-22-source-review-processes.md) |
| Support Systems | 62 | [Support Systems source review](class3-2026-09-22-source-review-support-systems.md) |
| Administration | 68 | [Administration source review](class3-2026-09-22-source-review-administration.md) |

The revision package maps each question to an appropriate source from the reviewed catalog. The catalog prioritizes Ontario government material for Ontario-specific requirements and uses authoritative technical material only where it is suitable for the underlying hydraulic or operational concept. Examples include Ontario's [Drinking Water Systems regulation](https://www.ontario.ca/laws/regulation/030170), the [2020 Watermain Disinfection Procedure](https://www.ontario.ca/page/water-main-disinfection-procedure), the [Ontario distribution-system design guidance](https://www.ontario.ca/document/design-guidelines-drinking-water-systems/instrumentation-control-and-distribution-systems), and [EPA EPANET](https://www.epa.gov/water-research/epanet) for network-hydraulics concepts. The WPI Need-to-Know Criteria remains a blueprint map, not answer-level authority.

## Automated quality controls

The remediation verifier now confirms the following for all 250 candidates:

- Every candidate remains `in_review` and has four unique options.
- Every candidate has non-WPI source title, reference, and HTTPS URL metadata.
- Candidate stems are unique and no answer choice has a material answer-length cue.
- Distractors do not contain the prohibited irrelevant-detail patterns.
- All 30 numerical answers remain unchanged from the independently checked calculation set.
- Each calculation has exactly three structured steps labelled Formula, Substitution, and Result. The Formula and Substitution steps must explain the calculation in enough detail to support learning.
- The module distribution remains 58 General, 62 Processes, 62 Support Systems, and 68 Administration questions.

The final structural audit found **zero weak distractors, zero calculation-step format defects, and zero option-balance outliers**.

## Release boundary

This is **not a production content release**. The learner-visibility rule excludes questions in the `in_review` state. No live database query, data mutation, migration, payment flow, price, product term, or deployment was performed as part of this remediation. A production import would be a separate consequential action that must use the guarded Class 3 release process, including a fresh live-state plan, exact confirmation digest, current backup evidence, and explicit authorization.

## Files

| File | Purpose |
|---|---|
| `content/class3-water-dist/new-questions-2026-09-22.mjs` | Canonical candidate builder with fail-closed revision overlay. |
| `content/class3-water-dist/candidate-250-revisions-2026-09-22.json` | Sourced revision package for all 250 candidates. |
| `content/class3-water-dist/candidate-250-2026-09-22.json` | Checked-in review export generated from the canonical builder. |
| `scripts/recovery/verifyClass3DistributionRepair.mjs` | Regression and structural validation for the candidate package and guarded release. |
