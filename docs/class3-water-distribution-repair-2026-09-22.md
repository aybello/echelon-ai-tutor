# Ontario Class 3 water distribution: 116 repaired legacy questions and 250 candidates

## Current state and scope

The September 19 recovery snapshot contains 571 `class3-water-dist` rows. The September 22 context record says the live bank still has 571 rows, but its approval count has changed from 54 to 112. This is **not** evidence that the individual live rows are unchanged. No production connection was available while preparing this package, and no production database was changed.

The [WPI 2025 Class III Need-to-Know guide](https://gowpi.org/wp-content/uploads/2026/04/WaterDistribution-%E2%80%93-Class-3_mh-fin.pdf) maps a standardized exam to 23 system components, 25 installation/maintenance, 25 quality/laboratory and 27 safety/administration/public-interaction questions per 100. It says certification authorities may use older or customized exams. This package uses the guide to select **topics**, pending confirmation of Ontario's implemented exam and dated Ontario source review.

## Package

- `content/class3-water-dist/repair-manifest-2026-09-22.json` pins the September 19 question content fingerprints and IDs of 118 targeted rows.
- `content/class3-water-dist/repaired-116-2026-09-22.mjs` contains answer-level replacements for all 45 held regulatory/technical questions and all 71 questions in the defective Q501–Q571 calculation block. `repaired-116-2026-09-22.json` is the identical reviewer-facing export. The regulatory replacements cite current Ontario, AWWA, Hydraulic Institute, EPA, or WPI primary material with a dated section reference. All 71 calculation answers were independently recomputed.
- `content/class3-water-dist/new-questions-2026-09-22.mjs` authors 250 original candidate questions; `candidate-250-2026-09-22.json` is the identical reviewer-facing export. All 250 have `reviewStatus=in_review`.
- `scripts/recovery/class3WaterDistributionRepair.mjs` validates the complete 1–571 baseline and unique row IDs, checks every targeted row before mutation, captures 118 before-images in `question_content_snapshots`, installs the 116 replacements as `in_review`, inserts the 250 drafts, and updates metadata to 821 stored rows in one transaction. The two corrected simple calculations (308 and 447) remain learner-visible as `unreviewed`, reflecting that their old approval cannot be carried over to edited content.
- `scripts/recovery/verifyClass3DistributionRepair.mjs` verifies exact 116-row coverage, source metadata, four distinct choices, unique stems, checked-in/release-payload equality, all numerical answer strings, 70 independently recomputed numerical results plus the comparative-pipe item, the 250-candidate payload, and fail-closed rejection of a changed baseline. CI runs the source-independent part on every pull request.
- The buyer-facing quiz and mock copy now uses the live learner-visible count, CA$249 catalog price, and the actual three-hour practice timer. Unverified Ontario regulation alignment claims were removed.

**Expected after a successful import against the 571-row baseline:** 821 stored rows, 116 repaired legacy rows in review, 250 new rows in review, and two corrected legacy rows left visible as unreviewed. Existing live review states can further reduce the learner-visible count. The import does not automatically publish any repaired or new in-review question.

## What the 116-question repair corrects

- Replaces duplicated or unsupported regulatory prompts with scenario-specific questions tied to current consolidated O. Reg. 169/03, O. Reg. 170/03, O. Reg. 128/04, and Ontario's 2020 Watermain Disinfection Procedure.
- Corrects the lead standard to 0.010 mg/L; uses the Schedule 10 population formulas instead of invented weekly/five-day rules; distinguishes pre-service commissioning samples from drinking-water tests; and uses method-specific new-main disinfection conditions.
- Rebuilds ambiguous hydraulic scenarios so each has one stated flow path, operating assumption, efficiency basis, or mixing model.
- Corrects every defective answer in Q501–Q571, including TDH, pump energy, PRV dissipation, Darcy-Weisbach loss, pipe diameter, tank cycling, Hazen-Williams loss, and fire-storage depletion.
- Removes contradictory legacy `steps` from all 116 replacements and puts the verified derivation in one explanation.

## How to plan and apply

From the repository root:

```bash
node scripts/recovery/verifyClass3DistributionRepair.mjs /private/class3-water-dist-snapshot.json
node scripts/recovery/class3WaterDistributionRepair.mjs --manifest content/class3-water-dist/repair-manifest-2026-09-22.json --snapshot /private/class3-water-dist-snapshot.json
# With production DATABASE_URL set, run the non-locking, read-only plan first:
node scripts/recovery/class3WaterDistributionRepair.mjs --manifest content/class3-water-dist/repair-manifest-2026-09-22.json
```

If the live plan succeeds, take and verify a current recoverable database backup. Applying requires `CONFIRM_CLASS3_DISTRIBUTION_REPAIR` equal to the **live** plan digest and `--apply`. It also requires `CLASS3_REPAIR_BACKUP_EVIDENCE` to be a JSON record with `release`, the exact `planDigest`, a nonblank verified `backupId`, and an ISO `backedUpAt` timestamp no more than one hour old. For example: `{"release":"class3-water-dist-repair-2026-09-22","planDigest":"<live plan digest>","backupId":"<verified backup identifier>","backedUpAt":"2026-09-22T21:00:00Z"}`. The script locks rows only on this explicit apply path. It rolls back on a changed row, missing metadata, occupied question number, duplicate stem, failed snapshot insert, or incorrect post-write count. It does not touch learners, purchases, or attempts. If a changed row blocks the plan, compare the production version with the pinned snapshot and produce a new reviewed patch; do not disable the comparison.

## Review gates before publishing

1. Confirm which WPI/OWWCO exam blueprint Ontario currently uses. The draft has 58/62/62/68 items across the four WPI task areas and 10/7/10/3 calculations. Its 40 recall items are fewer than the approximately 82 suggested by proportionally scaling WPI's standardized cognitive split; adjust deliberately if Ontario uses that blueprint.
2. Have an experienced Ontario Class III/IV distribution operator or other qualified SME review each of the 116 replacements before approval. The package has primary-source and calculation evidence but intentionally does not impersonate independent human sign-off.
3. Independently check every one of the 250 new candidate answers, explanations, calculations and distractors. The stored WPI citation on those candidates is a topic map only, not answer-level evidence. The candidate batch still needs the editorial distractor pass documented in the original handoff.
4. Audit the remaining visible legacy bank, including the 29 calculation-flagged items before number 501. This targeted repair does **not** certify all other legacy answers.
5. After each approved batch, read a learner-path sample to verify exact choices, key, rationale and absence of in-review questions. The existing `in_review` filter prevents draft delivery until explicit approval.

The release script stages drafts to preserve work and make content review possible in the production admin interface; it is not a certification of their educational correctness. The metadata count is the stored inventory; the displayed practice count is based on the learner-visible query.
