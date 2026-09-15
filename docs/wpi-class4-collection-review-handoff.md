# WPI Class IV Wastewater Collection — live-bank review and 250 additions

Requested September 15, 2026 after the user reported a second Manitoba seat purchase. The specific order was not independently accessed. Review the collection bank, not the previously repaired Class IV wastewater treatment bank.

## Manus: retrieve the current bank first

Course/product/route key: `wpi-class4-water-coll`. Canonical database bank key: `wpi-class4-wastewater-coll`. The old route name says “water-coll” but the course registry identifies Wastewater Collection. The exporter reads both keys, reports them separately, and must not merge or rename rows automatically.

Use the existing project database connection in the authorized release environment. Copy this branch's exporter into that environment; no application merge, deployment, migration or schema change is needed. Prefer a read-only database credential where available. Do not paste credentials into chat or the command.

```sh
node scripts/export-wpi-class4-collection-review.mjs --out /tmp/export-wpi-class4-collection-review-20260915.json
```

Return the complete JSON file privately to Father/Codex. It contains every question in every review status, stable IDs and question numbers, original option/step JSON, correct answers, explanations, source/classification fields, current module settings and guide overviews. It includes per-row and package SHA-256 values and checks row counts inside a read-only consistent snapshot. No learner names, emails, purchases or organization records are exported. Existing output files are never overwritten. If the database rejects read-only snapshots or a query fails, report that failure rather than modifying schema or exporting a partial sample.

The script performs session settings, SELECTs and ROLLBACK only. It does not import, approve, reject, edit or delete questions. Local tests verify its query boundaries, count mismatch rejection, error rollback and hashes; production execution is still pending.

## Review and repair after the export arrives

Review the complete existing bank in batches with an explicit disposition for every row: retain, repair or replace. Preserve stable IDs wherever the learning objective remains the same, so customer history and bookmarks survive. Check one defensible answer, plausible distractors, wording/length clues, duplicates, Class IV reasoning, calculations/units/rounding, useful explanations, and traceable sources. Do not infer content quality from structural checks alone. Provincial legal claims require the applicable Manitoba source; generic Ontario limits must not be presented as Manitoba requirements.

Then write 250 original additional questions, using the audited bank's actual coverage gaps. Deduplicate against the complete export and repaired bank. Deliver the retained/repaired inventory, before/after hashes, 250 additions, validation results, preview and a guarded import/rollback package. Recheck live row hashes immediately before any import, since this course has an active customer. Use one validated batch release; no mandatory individual question approval workflow.

## Exam specification verified September 15, 2026

[Manitoba's certification program](https://www.gov.mb.ca/sd/waste_management/wastewater/wastewater_certification_program/index.html) links the latest standardized criteria and specifies 110 questions and a 70% pass mark. [WPI's current Collection Class IV outline](https://gowpi.org/wp-content/uploads/2026/04/Collection-%E2%80%93-Class-4_final.pdf), linked from its [2025 criteria index](https://gowpi.org/services/2025-need-to-know-criteria/), describes 100 scored questions plus up to ten unscored pre-test items.

The scored collection outline uses five areas at 23/23/16/20/18, with 20 recall and 80 application questions overall and 16 calculation questions. These are collection-specific targets; do not reuse wastewater treatment's 28/42/15/15 and 25/75 settings. WPI presents calculation questions with US and metric units. The published outline supports planning and classification; it does not supply permission to reproduce actual certification questions.

Initial code inspection found this collection mock still configured for 100 questions. PR #87's 110-question simulation applies to wastewater treatment, not this collection bank. Extend the signed-session and scoring implementation deliberately after confirming the current bank's classifications and content; editing the page's question count alone is insufficient. Record this as a separate exam-configuration repair alongside the content work.

## Current status

The repository seed for question 35 asks the purpose of force-main design. Its correct option is a lengthy comprehensive specification, while the alternatives say pipe only, pump only and valve only. This is a concrete answer-cue weakness in the repository sample, not confirmation of the corresponding live row. The live export must establish whether that wording still serves learners before preparing its guarded replacement.

The exact course mapping, official outline and read-only export tooling are ready. The full live question audit, repairs and 250 additions are pending the export. No claim is made that repository seeds equal the live bank or that existing questions are already good. No production data has been changed.
