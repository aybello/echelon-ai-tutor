# Eleven Claude game batches — 14 November 2026

## Authorized scope

Publish only 11 audited tables from `77a0f3b65edce68f7c8bb84e30a8f8ac2dccdbb6`, on main baseline `afe89b0d0d4e6e36c7f5952dfd3194fd1aa2af7c`: OIT batches 14–15, OIT wastewater batches 9–12, Class 1 water batches 1–2, Class 1 wastewater batches 1–2, and Class 1 wastewater collection batch 1. Newer Claude source, including the reported `9de1c10` tip, is not authorized and is not imported. No wholesale Claude merge, old-main import, regeneration, content rewrite, dependency, database, or model/API call is part of this release.

The owner explicitly authorized merge/deploy at `2026-11-14T15:12:48-05:00` and accepts Claude's self-review without second-AI, independent, or human technical review. All 11 overlays were generated through the existing `build.ts --review-declaration` publication interface; every declaration covers the exact educational payloads, names the pinned table SHA-256, and records actual successful builder results. Exact Claude model/version is unspecified, historical review time is `null`, and registration uses the actual current timestamp. These are local integrity receipts, not provider-authenticated review records. No blanket factual/procedural/regulatory approval is claimed.

## Measured effective counts

Counts use the actual main engine baseline after PR #229's four spring-box exclusions, not a historical assumed total. All 2,834 additions are available; none intersects an exclusion.

| Course | Actual main | Added | Release |
|---|---:|---:|---:|
| OIT water (`oit`) | 2,838 | 353 | 3,191 |
| OIT wastewater (`oit-ww`) | 1,922 | 719 | 2,641 |
| Class 1 water | 101 | 666 | 767 |
| Class 1 wastewater | 122 | 735 | 857 |
| Class 1 wastewater collection | 106 | 361 | 467 |
| **Five-course total** | **5,089** | **2,834** | **7,923** |

Exact per-course/per-mode catalog and session totals are committed in `docs/claude-11-batches-counts-20261114.json`. Prior overlays, all tracked source tables and declarations (including batch 5), earlier corrections, and exclusions remain byte-identical: 64 protected files. All 129 exclusions are preserved, including the four spring-box IDs. Full exclusion-file SHA-256: `8040a4b366a73d13f44cf29746e9bbedb14eb20304519d1c2e2b6ba04273525b`.

## Integration and regression coverage

Minimal registry append of the 11 new overlays; existing runtime logic is unchanged. The required behavior-policy fingerprint is refreshed because it binds the registry source. New regression tests verify exact receipts, all five course/mode baseline deltas, complete effective ID sets, session counts, original examples and fixed previews, all exclusions, and 309A rejection. Historical sixteen-batch assertions retain their original 3,113-addition scope. PR #229's historical count test is scoped to its original overlays; effective identity equality is checked across current delivery paths rather than comparing obsolete hardcoded behavior hashes. The cautious gate checks the complete OIT overlay bank: 2,817 additions, 2,688 after 129 exclusions. Its correction-specific 50-item session test remains deterministic in its original Class 1 overlay scope, while new full-bank tests preserve every historical pool entry.

## Validation and handoff

All 11 normal publication commands passed. Credential-free validation uses `env -i`, minimal Node PATH, `HOME=/tmp`, `NODE_ENV=test`, `TSX_DISABLE_CACHE=1`, and `node --require ./scripts/test-safety.cjs` before Vitest/tsx. Entire engine folder plus interactive router, HTTP and access integration tests: **20 files / 346 tests passed**, including 16 engine test files and the 18-test new release regression. Both application and scripts TypeScript projects passed. The complete run uses one worker and an explicit 60-second per-test timeout because the existing bundled-loader smoke test takes approximately 10 seconds with the expanded server-only registry. Initial test-assumption failures and subsequent successful complete-run logs are retained rather than represented as a first-run pass.

Production build must run after the release commit from a clean tree, with the existing clean-source guard unchanged and no development-artifact bypass. Build output, commit, PR and hosted-check results are recorded in the external handoff report under `/home/ubuntu/outputs/claude-11-batches-release-20261114`. This document does not claim merge or deployment; the parent release coordinator handles those after checks pass.

## Implementation review

**Summary:** Append only the authorized 2,834 activities using the existing receipt/overlay path. Specification and implementation checks found no remaining blocking issue after test-scope corrections. **Critical issues:** none identified in this limited integration review. **Major issues:** none remaining. **Minor issues:** none requiring a release change. **Positive findings:** source-exact tables, unchanged prior content and exclusions, fail-closed receipt validation, and complete five-course ID/count regressions. **Questions:** none; owner review authority and unknown metadata are explicit. **Verdict:** ready for clean-build and hosted-check verification, not an independent content-safety certification.
