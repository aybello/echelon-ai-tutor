# WPI Class IV Wastewater Collection — complete historical repair

## Completed September 15, 2026

The remaining 250 existing questions have been repaired. Together with the earlier 253, this branch now contains revised content for **all 503 historical questions**, numbered 1–503. The final pass also improved distractors in the earlier batch. This completes the historical content repair, not a production import. The separately requested **250 new additions have not been authored** and are not counted as repairs.

Course/product/route: `wpi-class4-water-coll`. Canonical question bank: `wpi-class4-wastewater-coll`. This is Wastewater Collection, not Wastewater Treatment.

The supplied production export contains 503 questions and has content SHA-256 `397fc0949a31760494116d368cc69ecc465cbe84baddf7daf597ef9cce3b0bab`. All original row hashes were verified. The original export and compiled before/after package remain private; the Git branch contains authored content and offline tooling.

## What changed

Every historical number has one revised question, four distinct options, one declared correct answer, an explanation, a Collection area, a recall/application classification and a background reference. Repairs address unqualified legal/design limits, weak alternatives, misleading pump/hydraulic explanations and generic assertions that did not test an operational decision. The final pass removes the detected longest-answer and restrictive “only” distractor patterns. Numeric scenarios state their assumptions and units.

The 503 repaired questions include 31 calculation items, 43 recall items and 460 application items. Every calculation has an independent arithmetic fixture. A screening pass found no exact normalized stem duplicates; the closest stem pair intentionally distinguishes maximum circular-pipe discharge from maximum mean velocity. Repeated learning objectives can still occur across different scenarios. Automated screening is not a substitute for subject-matter judgement or evidence of real-exam predictive validity.

| Collection area | Total | Recall | Application | Calculations, included in application |
|---|---:|---:|---:|---:|
| Equipment | 65 | 9 | 56 | 5 |
| Collection O&M and restoration | 104 | 7 | 97 | 9 |
| Lift stations | 60 | 5 | 55 | 4 |
| Monitoring and evaluation | 94 | 17 | 77 | 1 |
| Safety and administration | 180 | 5 | 175 | 12 |
| **Total** | **503** | **43** | **460** | **31** |

The bank itself is not proportioned like a single mock. Its classified supply can support the Collection scored blueprint: areas 23/23/16/20/18; recall 5/4/3/5/3; calculations 3/5/1/0/7; 100 scored questions overall. Supply checks reserve separate recall, calculation/application and non-calculation/application rows in every area. This does **not** establish that the deployed selector enforces those quotas. No strict profile or 110-question simulation is activated by this work.

Sources distinguish technical background from binding local requirements. NIOSH's 100 ppm H2S IDLH is named as a NIOSH value, not a Manitoba legal entry threshold. Heat-emergency guidance is checked against CCOHS. Mathematical answers are independently derived. The questions are original practice material; no WPI endorsement or access to actual exam questions is claimed.

## Reproduce and inspect

```sh
node --test scripts/collectionReview.test.mjs scripts/export-wpi-class4-collection-review.test.mjs
node scripts/build-collection-review.mjs /private/export-wpi-class4-collection-review-20260915.json /private/new-output-directory
```

The builder is offline: no database connection, import, approval, schema migration or application change. It rejects a changed baseline, missing historical repairs, duplicate identities, invalid hashes and incompatible field widths. It never overwrites an existing output directory's files.

Outputs:

- `collection-historical-repair.json`: full before/after rows, row hashes, disposition for all 503, classifications, coverage, proposed metadata changes and package digest.
- `repaired-questions.json`: the complete revised 503-question bank.
- `collection-repair-preview.md`: human-readable questions, answers, explanations and sources.
- `rollback-content.json`: original content with expected post-repair hashes; data only, not executable SQL.

Correct-answer positions deliberately remain unchanged (A: 76, B: 152, C: 138, D: 137). Do not describe their stored distribution as balanced; any future display shuffling must retain the canonical answer mapping and be tested separately.

The immutable original export must accompany those files in the private handoff. The old 253-question checkpoint is superseded and must not be imported.

## Manus release instructions

1. Read this handoff and the complete package. Run the focused tests and regenerate from the supplied original export; compare the resulting digest with the handoff package. No per-question approval workflow is requested.
2. Export the current canonical bank, metadata and module overviews using the same complete field set and canonical hashing. Compare with the supplied baseline. If any content or metadata changed, stop the import and reconcile the exact differences; do not overwrite live edits by assuming this export is still current. Use a consistent snapshot supported by the deployed database. The existing exporter uses MySQL read-only transaction syntax; TiDB deployments must use their supported equivalent rather than silently falling back to inconsistent reads.
3. Verify a restorable production backup and rehearse the guarded update and rollback on an isolated database copy. This branch supplies validated content and rollback data, not a production-tested database importer.
4. Verify current signed-mock behaviour before changing published questions. Drain outstanding sessions or retain versioned questions so an exam started before release can be submitted against its original content. Preserve the original question text/options and revision evidence for historical review. Keeping an ID and answer position does not make the old response an answer to the new wording; never silently regrade or reinterpret historical attempts.
5. In one guarded transaction, compare the full current question rows with all 503 `beforeSha256` values and the metadata with its before hash. Update only the content/classification fields represented in `after`. Preserve `id`, `bankKey`, `questionNum`, `correctIndex`, `difficulty`, publication state and review timestamps. Do not touch attempts, purchases, licences, bookmarks, users or organizations. Verify 503 matched updates and the resulting content hashes before commit. No new questions are inserted.
6. Apply the accompanying metadata change in that transaction: replace the obsolete module menu with the five supplied Collection areas and increment `contentVersion` from the verified baseline. Leave `totalQuestions` at 503. The package intentionally does not alter `moduleTargets`, `minCalcPerMock`, `recallTargetPct`, `blueprintVersion`, formula resources or Process Guide content. Module overviews remain unchanged; check that the application handles the new area menu without displaying an unrelated overview.
7. Invalidate relevant question caches. Verify all 503 identities and revised hashes after commit, learner-visible inventory, module filtering, practice, flashcards, and a complete signed mock through submission. Confirm existing saved attempts and bookmarks still resolve correctly, with historical revision handling as described above. Test with an isolated test learner, not the customer's account.
8. Retain the backup, transaction evidence, package digest, resulting content version and smoke-test results. For rollback, compare current rows with `expectedCurrentSha256` before restoring the supplied original fields; refuse intervening edits. Restore the original module menu, advance the cache version beyond the failed release instead of reusing a stale version, and invalidate caches. Preserve attempts made during either version and associate their content revision correctly.

`releaseReady` remains false because no production import, database-backed rehearsal, backup verification or active-session check was performed here. That flag does not mean historical questions remain unwritten. The content work is complete; controlled application and verification are the release operator's next steps.

## Separate follow-up work

Write the additional 250 questions against the repaired bank and actual coverage gaps. The bank currently has considerable safety/administration content; prioritize useful technical depth and additional calculation variety rather than duplicating those scenarios. Deduplicate additions against both original and repaired text.

Separately correct the Collection mock configuration and its server-enforced scored/unscored structure. The supplied baseline still has older topic targets and a 100-question implementation; a content repair must not be described as fixing the full Manitoba simulation.

## Authoritative references checked September 15, 2026

- [WPI Collection Class IV outline](https://gowpi.org/wp-content/uploads/2026/04/Collection-%E2%80%93-Class-4_final.pdf): Collection-specific scored areas, cognitive distribution and calculation allocation; up to ten unscored pre-test questions.
- [Manitoba operator certification program](https://www.gov.mb.ca/sd/waste_management/wastewater/wastewater_certification_program/index.html): provincial exam and certification context.
- [NIOSH hydrogen sulfide guide](https://www.cdc.gov/niosh/npg/npgd0337.html): named IDLH reference.
- [CCOHS heat guidance](https://www.ccohs.ca/oshanswers/phys_agents/heat/heat_health.html): recognition and response for heat illness.
- [CCOHS hierarchy of controls](https://www.ccohs.ca/oshanswers/hsprograms/hazard/hierarchy_controls.html): general control principles.

Item-level background links accompany the questions. No source is presented as approving this question bank.
