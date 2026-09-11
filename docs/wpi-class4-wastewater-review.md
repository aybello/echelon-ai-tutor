# WPI Class IV Wastewater Treatment: existing-bank review and 250-question expansion

## Current evidence — September 11, 2026

The correct application bank is `wpi-class4-wastewater`. The quiz reads it from
the database through `useQuestionBank`. The repository does not provide a complete
snapshot of this bank. `scripts/insert_class4_questions.mjs` instead references
an external `/home/ubuntu/wpi_class4_water_new_questions.json` file that is not
included. The Class I production export and Ontario Class IV seed questions are
not substitutes for the WPI Class IV Wastewater Treatment bank.

No question repair, full-bank audit, production change, or 250-question expansion
is claimed completed by this preparatory checkpoint.

## Manus: obtain the actual bank

Run from this branch in the existing project environment, using its configured
DATABASE_URL (do not paste credentials into chat):

```sh
node scripts/export-wpi-class4-wastewater-review.mjs /tmp/export-wpi-class4-wastewater-review.json
```

Return that JSON file. The exporter uses a consistent read-only transaction,
includes every question regardless of publication status, and verifies the row
count. It includes original IDs, question numbers, options, explanations,
calculation steps, topics and source metadata. It does not query operators,
organizations, purchases, attempts, emails or other customer data. It makes no
schema or question writes and does not truncate the bank to a sample. A file
already at the destination must be retained; choose a new filename for a new run.

Also provide the Manitoba exam-preparation notice or official link identifying
the WPI criteria edition applicable to this candidate's exam. WPI publishes both
current and historical criteria; publication of a new edition alone does not
establish Manitoba's adoption for this sitting. Remove personal information from
any candidate correspondence. No examination questions or confidential exam
materials are requested.

## Review and repair order

1. Reconcile the export count, question identities, modules and statuses. Keep an
   untouched source snapshot and checksum.
2. Review every existing item in batches: answer correctness, one defensible best
   option, explanations, numerical recomputation and units, ambiguous conditions,
   answer-length clues, implausible distractors, duplication, appropriate Class IV
   difficulty and treatment-versus-collection scope. Automated cue checks screen
   for problems; passing them is not a complete technical review.
3. Check coverage against the applicable WPI wastewater treatment criteria.
   Separate general process knowledge from Manitoba-specific regulatory claims;
   verify the latter against authoritative Manitoba sources. Do not import Ontario
   regulatory answers into this bank.
4. Prepare an item-by-item repair ledger and guarded updates retaining both `id`
   and `questionNum`. Match original content before updates to detect concurrent
   changes. Do not delete/reinsert or renumber existing questions. Preserve option
   order where possible; any changed answer key must explicitly account for saved
   attempts and cached/in-progress exams rather than silently reinterpret history.
5. Only after establishing the repaired baseline, add 250 original Class IV
   questions targeting coverage gaps. Include realistic process-control decisions,
   multi-step calculations and useful explanations. Compare all additions against
   the complete repaired bank and one another before assigning collision-free IDs.
6. Deliver a reviewable repair package and separate addition package with validation
   results and import reconciliation. Use batch quality checks without requiring
   individual question approval. Stage and test before learner-visible activation;
   confirm the active learner's progress and history survive the release.

## Sources to reconcile

- WPI current criteria: https://gowpi.org/services/2025-need-to-know-criteria/
- WPI formula resources: https://gowpi.org/services/abc-testing/formula-conversion-tables/

These identify resources, not verified evidence that a specific edition applies to
the Manitoba candidate. The full production export and applicable exam edition
are the outstanding inputs for the requested substantive audit.
