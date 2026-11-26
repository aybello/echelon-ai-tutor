# Claude Class 1–3 content release — 15 November 2026

## Scope and provenance

Pinned source: `3b7e9fb205d4504e8e41f349eb58ddbd81693fd4`. Main/base: `053ac23e3541ac6b18bcdf1aa0d2aebab0eb3d8b`. Exactly 41 newly added TypeScript authoring tables were extracted byte-for-byte. The source branch was not merged. Its modified old OIT batch 5 was ignored; all prior overlays, declarations, tables and exclusion bytes were preserved.

Existing unchanged `build.ts` publication checks passed for **41 tables / 11,635 course-level activities**; **0 tables held**. Each passing overlay was appended before checking the next table, so duplicate screening includes stored and previously accepted same-course additions. The release regression additionally rechecks each accepted batch against all other accepted same-course additions, irrespective of publication order.

Tables are routed using their actual `CourseData.courseKey`, not their filename. Shared `class2-s-*` and `class3-s-*` tables reuse material across course levels. These totals are course-level playable activity instances, not globally distinct concepts, original research, or a claim of independent educational verification. Shared-pool provenance is retained in the exact source comments.

## Effective engine counts

| Course | Main baseline | Added | Effective release |
|---|---:|---:|---:|
| class1-wastewater-coll | 467 | 516 | 983 |
| class1-water | 767 | 177 | 944 |
| class1-water-dist | 116 | 903 | 1,019 |
| class1-ww | 857 | 191 | 1,048 |
| class2-wastewater-coll | 103 | 1,192 | 1,295 |
| class2-water | 82 | 1,199 | 1,281 |
| class2-water-dist | 88 | 1,256 | 1,344 |
| class2-ww | 99 | 1,276 | 1,375 |
| class3-water | 87 | 1,345 | 1,432 |
| class3-ww | 104 | 1,443 | 1,547 |
| class3-wastewater-coll | 104 | 1,007 | 1,111 |
| class3-water-dist | 87 | 1,130 | 1,217 |
| Total affected courses | 2,961 | 11,635 | 14,596 |

Counts are measured local effective catalog/session totals for all six modes. They are not production observations. The committed JSON contains complete per-mode baselines, deltas, accepted/held table mappings, hashes and source provenance. OIT and OIT wastewater pools remain unchanged.

## Review declaration and boundaries

The owner explicitly authorized this release in the instruction received at `2026-11-14T23:33:47-05:00` and accepts Claude self-review without a second model or human reviewer. Exact Claude model/version and historical review timestamp were not supplied: declarations retain the honest existing model label and `reviewedAt: null`. Builder registration timestamps are actual local publication times. V2 receipts bind exact educational payloads and unchanged checker results; they are integrity records, not provider-authenticated review evidence. No factual, procedural or regulatory certification is claimed.

All 129 exclusions remain byte-identical at SHA-256 `8040a4b366a73d13f44cf29746e9bbedb14eb20304519d1c2e2b6ba04273525b`, including the four spring-box items. 309A rejection, legacy examples, previews, access boundaries and all earlier corrections remain covered. Historical eleven-batch assertions retain their original 2,834-activity scope; the new release has separate effective-bank coverage.

## Held tables

None. All 41 tables passed the existing publication checks. This is not a claim that every educational statement was independently verified.

## Validation and handoff

Serial commands use a credential-isolated environment: `env -i PATH=/home/ubuntu/.nvm/versions/node/v22.13.0/bin:/usr/bin:/bin HOME=/tmp NODE_ENV=test TSX_DISABLE_CACHE=1 node --require ./scripts/test-safety.cjs`. No production DB or model/network review calls were used. `build.ts`, checker semantics and gates are unchanged. Publication, verification and test logs are retained in `/home/ubuntu/outputs/claude-class123-release-20261115/`.

Final isolated engine/router/access validation passed: 402 tests across 21 files. Application and scripts TypeScript checks both passed. Clean committed production-build outcomes are recorded in the external handoff report. The antecedent UI commit is retained. The new combined-bank test strips only the receipt wrapper before invoking the unchanged draft checker; historical option-length tests isolate their original revision overlays instead of assuming no later additions. Content changes are staged file-specifically. No wholesale old-branch merge is used. The authorized release branch and PR are handed to the parent for hosted checks, merge and managed deployment/checkpoint.

The behavior policy stamp follows the existing nine-source server/shared contract, verified by the engine fingerprint regression. There is no separate UI-only stamp in that contract; the clean production build binds the full committed client and server source identity.

## Integration review

Summary: publish only exact pinned newly added Class 1–3 tables through the existing fail-closed receipt path. Critical issues: none identified in the integration review, subject to final passing regression checks. Major issues: no architecture change required. Positive findings: exact source hashes, preserved earlier release bytes, explicit shared-pool provenance, combined same-course duplicate validation, truthful unknown review metadata, and catalog/session delta coverage. Questions: none. This review concerns release integration, not independent educational certification.
