# Claude game batch release — 14 November 2026

Publishes only the 16 audited source tables from Claude commit `8098bb3984754fa9377f20b603f42cf2703a516b`: water batches 6–13 and wastewater batches 1–8. Baseline main is `5ddf25b5c63ac428ffb87bd66635348f263c3fda`. The newer remote Claude tip observed during preparation was intentionally not imported. The imported checker is retained source-exact; the existing builder, receipt contract and runtime selection mechanism are unchanged.

The owner expressly authorized release and accepts Claude's self-review. Every new overlay uses the existing `build.ts --review-declaration` interface, with exact per-item educational-payload hashes, actual successful builder results and current registration timestamps. Claude's exact model/version is unspecified and historical review time is explicitly null, consistent with batch 5. These local integrity records are not provider-authenticated API receipts or independent/human technical approval. No additional model call or content review was performed.

All 16 publication commands passed. New additions total 3,113: water 1,624 and wastewater 1,489. There are no replacements. Registry order retains all prior overlays, followed by ascending water then wastewater batches. All previous overlay files, corrections, batch-5 source/declaration and the exact exclusion file remain byte-identical. The exclusions SHA-256 remains `d1feb9454ed4324c516abf8ec0900cbccecf29397adfc27a72e499895fa9b5f5`. Only the existing behavior fingerprint was refreshed after registry changes; no loader behavior changed.

## Measured local effective counts

Counts below come from the actual current-main engine catalog, then the registered release catalog and session totals, not from an assumed production count. Main already includes batch 5.

| Mode | Water baseline | Added | Effective | Wastewater baseline | Added | Effective |
|---|---:|---:|---:|---:|---:|---:|
| Rapid swipe | 390 | 441 | 831 | 124 | 443 | 567 |
| Speed match | 93 | 181 | 274 | 24 | 147 | 171 |
| Odd one out | 236 | 405 | 641 | 52 | 347 | 399 |
| Before/after | 193 | 225 | 418 | 81 | 223 | 304 |
| Cause/effect | 167 | 176 | 343 | 88 | 172 | 260 |
| Tap the flaw | 139 | 196 | 335 | 64 | 157 | 221 |
| Total | 1,218 | 1,624 | 2,842 | 433 | 1,489 | 1,922 |

Combined effective total: **4,764**. This is a measured local release expectation, not a claim that deployment has occurred.

## Verification

Credential-free commands use `env -i`, `NODE_ENV=test`, `TSX_DISABLE_CACHE=1` and preload `scripts/test-safety.cjs` first. No broad database test suite, external model calls, dependency changes, new gate architecture or old table regeneration. Focused engine/router tests: 9 files / 161 tests passed, including the 20-test new release regression. Both application and scripts TypeScript projects passed. A production server build requires the release commit to be clean; retain the subsequent clean-build evidence with the release handoff.

Evidence, exact commands, per-batch results, source and protected-file hashes, catalog/session counts and build logs: `/home/ubuntu/outputs/claude-batches-release-20261114`. No push, merge or live deployment is part of this branch handoff.
