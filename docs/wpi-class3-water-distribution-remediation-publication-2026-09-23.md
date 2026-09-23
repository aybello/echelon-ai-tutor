# WPI Class III Water Distribution remediation publication

**Status:** Published and independently verified

**Date:** September 23, 2026
**Target bank:** `wpi-class3-water-dist`
**Release:** `wpi-class3-water-dist-gpt6-remediation-2026-09-23`

## Published scope

The release updated **209** reviewed WPI Class III Water Distribution questions. It did not add, remove, renumber, hide, or reveal any questions. The release also corrected stale bank metadata from 590 to the actual **611** learner-visible questions.

## Safeguards used

The production transaction required a target-bound preflight, a package digest, a matching confirmation digest, complete before-images for all target rows, and a verified recovery artifact. It captured 209 scoped recovery snapshots before applying the updates. The release script also verified that non-target rows remained unchanged, that target identifiers and non-content fields were preserved, and that the post-release bank retained 611 learner-visible questions.

Two release-time compatibility issues were caught before any commit and rolled back cleanly. The final package was normalized to the production schema's supported cognitive-level values, `recall` and `application`. The post-write verifier was also corrected to compare JSON-encoded calculation steps consistently with the staged package.

## Verification result

A fresh read-only verification after publication confirmed all of the following:

| Check | Result |
|---|---:|
| Stored WPI Class III questions | 611 |
| Learner-visible questions | 611 |
| Metadata question count | 611 |
| Metadata content version | 2 |
| Reviewed replacements verified | 209 |
| Scoped recovery snapshots verified | 209 |

No customer records, payments, entitlements, organizations, licences, attempts, or prices were read or changed by this release.
