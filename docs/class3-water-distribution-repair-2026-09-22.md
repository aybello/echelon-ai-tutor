# Ontario Class 3 water distribution: guarded repair and 250 candidate questions

## Current state and scope

The September 19 recovery snapshot contains 571 `class3-water-dist` rows. The September 22 context record says the live bank still has 571 rows, but its approval count has changed from 54 to 112. This is **not** evidence that the individual live rows are unchanged. No production connection was available while preparing this package, and no production database was changed.

The [WPI 2025 Class III Need-to-Know guide](https://gowpi.org/wp-content/uploads/2026/04/WaterDistribution-%E2%80%93-Class-3_mh-fin.pdf) maps a standardized exam to 23 system components, 25 installation/maintenance, 25 quality/laboratory and 27 safety/administration/public-interaction questions per 100. It says certification authorities may use older or customized exams. This package uses the guide to select **topics**, pending confirmation of Ontario's implemented exam and dated Ontario source review.

## Package

- `content/class3-water-dist/repair-manifest-2026-09-22.json` pins the September 19 question content fingerprints and IDs of 118 targeted rows.
- `content/class3-water-dist/new-questions-2026-09-22.mjs` authors 250 original candidate questions; `candidate-250-2026-09-22.json` is the identical reviewer-friendly export. All 250 have `reviewStatus=in_review`.
- `scripts/recovery/class3WaterDistributionRepair.mjs` checks every targeted live row and all 571 IDs before any mutation, captures 118 before-images in `question_content_snapshots`, corrects 16 worked numerical questions, holds 116 rows, inserts the 250 drafts, and updates metadata to 821 stored rows in one transaction. The two corrected simple calculations (308 and 447) remain learner-visible as `unreviewed`, reflecting that their old approval cannot be carried over to the edited version.
- `scripts/recovery/verifyClass3DistributionRepair.mjs` verifies the fixed draft JSON, numeric answer keys, uniqueness, area and key-position distribution, and rejects a modified baseline in an offline rehearsal.
- The buyer-facing quiz and mock copy now uses the live learner-visible count, CA$249 catalog price, and the actual three-hour practice timer. Unverified Ontario regulation alignment claims were removed.

**Expected after a successful import against the 571-row baseline:** 821 stored rows, 250 new rows in review, 116 old rows held, and 455 old rows visible if all 116 were previously visible. Existing live review states could lower that visible figure. This import does not publish any of the 250 additions to a learner.

## How to plan and apply

From the repository root:

```bash
node scripts/recovery/verifyClass3DistributionRepair.mjs /private/class3-water-dist-snapshot.json
node scripts/recovery/class3WaterDistributionRepair.mjs --manifest content/class3-water-dist/repair-manifest-2026-09-22.json --snapshot /private/class3-water-dist-snapshot.json
# With production DATABASE_URL set, run the read-only transactional plan first:
node scripts/recovery/class3WaterDistributionRepair.mjs --manifest content/class3-water-dist/repair-manifest-2026-09-22.json
```

If the live plan succeeds, record a current recoverable database backup. Applying requires `CLASS3_REPAIR_BACKUP_EVIDENCE` and `CONFIRM_CLASS3_DISTRIBUTION_REPAIR` equal to the **live** plan digest, and the `--apply` argument. The script rolls back on a changed row, missing metadata, occupied question number, duplicate stem, failed snapshot insert, or incorrect post-write count. It does not touch learners, purchases, or attempts. If a changed row blocks the plan, compare the production version with the pinned snapshot and produce a new reviewed patch; do not disable the comparison.

## Review gates before publishing the 250

1. Confirm which WPI/OWWCO exam blueprint Ontario currently uses. The draft has 58/62/62/68 items across the four WPI task areas and 10/7/10/3 calculations. Its 40 recall items are fewer than the approximately 82 suggested by proportionally scaling WPI's standardized cognitive split; adjust deliberately if Ontario uses that blueprint.
2. Independently check every answer, explanation, calculation and plausible distractor with an experienced Class III operator or qualified SME. The stored WPI citation is a **topic map only**, never answer-level evidence. Add a dated technical source section and Ontario jurisdiction note before marking each item approved. In particular, the current draft still includes obvious irrelevant distractors (paint, billing, etc.) in roughly 80 items; these are editorial candidates, not release-ready exam questions.
3. Review all 45 held legacy regulatory or unsupported technical-claim rows against current Ontario instruments and the specific AWWA edition. Review the 71 held rows 501–571 independently; 14 have prepared numerical corrections, while other items in that block have ambiguous or suspect reasoning. Do not bulk approve a whole block.
4. Audit the remaining visible legacy bank, including the 29 calculation-flagged items before number 501. The automated screening and targeted checks have **not** certified all 571 answers.
5. After each approved batch, read a learner-path sample to verify exact options, key, rationale and absence of held questions. The existing `in_review` filter prevents draft delivery until explicit approval.

The release script stages drafts to preserve work and make content review possible in the production admin interface; it is not a certification of their educational correctness. The metadata count is the stored inventory; the displayed practice count is based on the learner-visible query.
