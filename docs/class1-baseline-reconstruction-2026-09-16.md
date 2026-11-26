# Class I Baseline Reconstruction Plan

## Purpose

This document defines the controlled path to reconstruct missing Ontario Class I course baselines. It does not authorize content generation, database import, learner visibility, checkout activation, or a claim that a course matches an official examination.

The existing Class I Treatment and Networks packages are additive 250-question batches. Their own manifests require full live-bank reconciliation and cannot honestly be marketed as complete paid courses without the missing baseline content.

## Official context

The Ontario Water Wastewater Certification Office states that Ontario uses Water Professionals International standardized examinations for Class I to IV Water Treatment, Water Distribution and Supply, Wastewater Treatment, and Wastewater Collection. It directs learners to no-cost need-to-know documents, study guides, formula/conversion tables, and sample questions, while warning that study resources do not replace appropriate training and experience and may not cover every exam subject area.[^owwco]

Ontario's drinking-water certification page states that Class I water certification requires an OIT credential, the Entry-Level Course, at least one year in a municipal drinking-water system, and the applicable Class I examination. It identifies water treatment, water distribution and supply, and water distribution as separate certificate tracks.[^water]

Ontario's wastewater licensing page identifies wastewater treatment and wastewater collection as separate OIT and Class I to IV licence tracks, and says operators must meet education, training, experience, and examination requirements for upgrades.[^wastewater]

## Reconstruction boundaries

| Course family | Existing additive batch | Missing condition | Commercial status |
|---|---:|---|---|
| Class I Water Treatment | 250 questions | Full reconciled baseline is absent | Not purchasable |
| Class I Wastewater Treatment | 250 questions | Full reconciled baseline is absent | Not purchasable |
| Class I Water Distribution | 250 questions | Full reconciled baseline is absent | Not purchasable |
| Class I Wastewater Collection | 250 questions | Full reconciled baseline is absent | Not purchasable |

## Required reconstruction workflow

1. Establish a versioned competency map for each course family using official need-to-know and exam-preparation materials. The map must distinguish regulatory knowledge, process knowledge, safety, calculations, monitoring, records, and operational decision-making.
2. Create baseline items in a separate private candidate dataset. Every item must have a source citation, a competency tag, difficulty rationale, calculation validation where applicable, answer-key rationale, and a reviewer status.
3. Run automated structural checks before review: duplicate detection, stem/option integrity, answer-position balance as a diagnostic only, numerical-unit verification, source-link availability, jurisdiction check, and prohibited official-affiliation claims.
4. Require independent subject-matter review of every learner-visible item. A reviewer must explicitly approve, revise, or reject each item. Unreviewed items may not be imported into a learner-visible bank.
5. Reconcile candidate and existing additive packages into one complete per-course bank. Preserve provenance for every source batch and require an exact count, module/competency coverage report, checksum, and zero duplicate question identifiers.
6. Import into a non-public staging bank only after a private backup, a dry-run plan, and an exact confirmation token. Run delivery, access, math, and content-governance checks without creating fabricated learners or purchases.
7. Seek a separate user decision before making a bank public, enabling checkout, or adding it to individual or team commercial availability.

## Release evidence required per course

| Evidence | Required outcome |
|---|---|
| Official source map | Versioned, date-stamped, and linked for every competency family |
| Item ledger | Source, competency, rationale, calculation validation, review disposition |
| Quality report | Duplicate, math, format, jurisdiction, and answer-quality checks pass |
| Reconciliation report | Exact total, coverage, checksum, and provenance of every incorporated batch |
| Staging validation | Bank is non-public until delivery and access checks pass |
| Commercial approval | Explicit approval before checkout or Teams inclusion |

## Non-negotiable public wording

Until full evidence is complete, public copy must describe future courses as under development or invite interest. It must not claim that an incomplete course is available, contains a full bank, matches official exam questions, is endorsed by a certifying body, or guarantees exam outcomes.

[^owwco]: Ontario Water Wastewater Certification Office, [Preparing for Your Exam](https://owwco.ca/preparing-for-your-exam/), accessed September 16, 2026.
[^water]: Government of Ontario, [Drinking water operator certification](https://www.ontario.ca/page/drinking-water-operator-certification), updated March 13, 2026.
[^wastewater]: Government of Ontario, [Wastewater operator licensing](https://www.ontario.ca/page/wastewater-operator-licensing), updated March 13, 2026.
