# WPI Class IV Wastewater Collection — live-bank review and 250 additions

Requested September 15, 2026 after the user reported a second Manitoba seat purchase. The specific order was not independently accessed. Review the collection bank, not the previously repaired Class IV wastewater treatment bank.

## Export received — September 15, 2026

The complete production export has now been received and its package and 503 individual row hashes verified. It contains 503 visible, unreviewed questions in the canonical bank, nine calculation flags and no cognitive classifications. The original file stays private. Its content SHA-256 is `397fc0949a31760494116d368cc69ecc465cbe84baddf7daf597ef9cce3b0bab`.

This branch now contains 253 authored historical replacements, including questions 1–150 and 103 additional technical/safety corrections. They are a DRAFT checkpoint: 250 historical rows still need editorial disposition, all 250 requested additions remain to be written, and the authored questions need the final editorial/coverage pass. Do not import this checkpoint or call the bank finished. No application or production-data change is included.

Ten focused checks pass, including independently calculated wet-well cycling, circular-pipe flow maxima and Manning slope. They validate specific properties; they do not prove every question has passed substantive review.

Reproduce the private before/after ledger and preview with:

```sh
node --test scripts/collectionReview.test.mjs
node scripts/build-collection-review.mjs /private/export-wpi-class4-collection-review-20260915.json /private/new-output-directory
```

The builder is offline and has no database connection. It refuses a changed baseline or row hashes and never overwrites an existing output. It preserves existing IDs, bank keys, question numbers, correct-answer positions and publication state. Rewritten wording still changes historical item meaning: retain original content/revision evidence, and do not silently regrade or reinterpret historical attempts against new wording. Metadata targets are proposed only; no strict mock profile is activated.

## Original read-only export instructions

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

## Remaining release work

Complete the 250 untouched historical dispositions and final-check all 253 authored replacements. Write 250 original additions against actual gaps, then check factual accuracy, plausible distractors, duplicates, calculations and per-area cognitive coverage. The source outline supports classification but is not a factual source for every technical or legal assertion. Background references in the draft need item-level confirmation where a specific requirement is asserted.

Current metadata still uses old targets and 50% recall; the proposed current Collection targets are 23/23/16/20/18 and 20/80 recall/application. The completed bank must support the required 16 calculations, including their area allocation, before strict generation is enabled. The final importer must compare fresh live rows, retain rollback/revision evidence and rehearse against an isolated database. No importer or production SQL is supplied with this incomplete checkpoint.
