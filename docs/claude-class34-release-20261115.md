# Claude Class 3–4 content release — 15 November 2026

## Scope and provenance

Pinned source: `44339b1fb1c876121799f11f0947f39a9f1f5665`. Main/base: `a13e14baeee41a6d4f61f48af6bbbd2ff689904a`. Exactly 26 newly ADDED authoring data tables in `3b7e9fb205d4504e8e41f349eb58ddbd81693fd4..44339b1fb1c876121799f11f0947f39a9f1f5665` were extracted byte-for-byte: two Class 3 collection/distribution tables and 24 Class 4 actual/shared/depth tables. No source-branch merge, fresh fetch, generation, model call, second review or database operation was performed. Modified old OIT batch 5 was ignored.

The unchanged existing `scripts/game-authoring/build.ts` checks passed for **26 tables / 7,489 course-level playable activity instances; zero tables held**. Each passing overlay was registered before the next table was checked. The new regression additionally checks every accepted table against all other accepted same-course additions, including tables later in publication order. No duplicate, answer-length, schema, wording, balance or mode-fit checks were loosened.

Shared tables intentionally reuse educational material across course levels: these are course-level playable activity instances, not globally distinct concepts. Routing uses each table's actual `courseKey`. Compact IDs preserve the existing builder formula: actual batches use 1, shared batches 101–103, depth 2 uses 202 and depth 3 uses 203. Class 3 actual batch 1 does not collide with prior shared batch 101.

## Effective engine counts

| Course | Base runtime | Added | Effective runtime |
|---|---:|---:|---:|
| class3-wastewater-coll | 1,111 | 325 | 1,436 |
| class3-water-dist | 1,217 | 327 | 1,544 |
| class4-wastewater-coll | 93 | 1,621 | 1,714 |
| class4-water | 93 | 1,674 | 1,767 |
| class4-water-dist | 76 | 1,751 | 1,827 |
| class4-ww | 105 | 1,791 | 1,896 |
| Total affected courses | 2,695 | 7,489 | 10,184 |

Counts are measured local effective catalog/session totals across all six modes, not production observations. Complete per-mode baselines, deltas, source hashes, overlay/declaration paths and prior-content protection hashes are committed in `docs/claude-class34-counts-20261115.json`.

## Owner-authorized review and integrity

The owner accepts Claude's own review of the exact unchanged pinned source in the instruction received at `2026-11-15T01:35:07-05:00`. No independent model or human review is required. New normal v2 content receipts use the existing honest label `Claude (owner-provided; exact model unspecified)` and `reviewedAt: null`, because historical review timestamps and exact model/version were not supplied. Receipt registration timestamps are actual local publication times. Receipts bind exact educational payloads and builder results; they do not authenticate a provider or independently certify educational/regulatory correctness.

All 129 prior exclusions are byte-identical at SHA-256 `8040a4b366a73d13f44cf29746e9bbedb14eb20304519d1c2e2b6ba04273525b`. All 246 protected prior source, declaration, overlay, builder, exclusion and unrelated CSS files remain unchanged. The two UI CSS files concurrently owned by the implementation lead are explicitly outside content-worker protection; this worker did not edit them. Prior registry entries remain in exact order; only 26 new imports and registry references were appended. Earlier payloads and review records were not overwritten.

## Validation and handoff

Existing prepare/publish/verify scripts were reused under `/home/ubuntu/outputs/saved-games-release-20261115/content/`, alongside source-plan, exact-source SHA-256 metadata, per-table declaration/overlay paths, publication results/log, measured expected counts and test log. A temporary first preparation attempt failed on implementation-in-progress conflict markers in `loader.ts`; it wrote no declarations or overlays. The content worker did not alter that file. A later protection check correctly detected the implementation lead's concurrent UI CSS changes; those two implementation-owned files were explicitly removed from content immutability scope, with original hashes retained in external plan metadata.

Credential-isolated checks use `env -i PATH=/home/ubuntu/.nvm/versions/node/v22.13.0/bin:/usr/bin:/bin HOME=/tmp NODE_ENV=test TSX_DISABLE_CACHE=1 node --require ./scripts/test-safety.cjs`. Exact-source/hash verification, unchanged exclusion checks, effective catalog/session deltas and v2 receipts passed. Focused Vitest run: **2 files / 91 tests passed** (`claudeClass34Release.test.ts`: 35; historical `claudeClass123Release.test.ts`: 56). Historical Class 1–3 assertions retain their original bank snapshot instead of treating later additions as part of that historical release. New coverage includes combined same-course duplicate screening, legacy and preview compatibility, all accepted IDs, session counts, OIT invariance, all exclusions and 309A rejection.

The implementation lead owns final application typechecks, complete engine/router/application aggregation, behavior fingerprint stamping if required, production build and authorized deployment. No new release-gate architecture was introduced.
