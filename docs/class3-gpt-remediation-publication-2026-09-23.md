# Class 3 Water Distribution GPT remediation publication

**Status:** Published and verified

**Date:** September 23, 2026

**Bank:** `class3-water-dist`

## Scope

This publication replaced **212** reviewed original Class 3 Water Distribution questions. It preserved the course inventory, existing approved candidate questions, pricing, access terms, payment behaviour, and learner entitlements. It did not add or delete learner questions.

The published bank contains **821 learner-visible questions**, consisting of 571 original-bank questions and 250 previously approved candidate questions. The 212 replacements are learner-visible and the approved candidate range remains unchanged.

## Controls applied

The release used the guarded `class3-gpt-remediation-2026-09-23` production command committed in `f0115b9`. The command required a fresh target-bound preflight, a scoped recovery snapshot, immutable before-images for all 212 replacements, an exact-plan confirmation, a single database transaction, and post-write checks before completion.

The reviewed remediation package was authored and reviewed using GPT-5.6 Sol only. It was validated for source metadata, question structure, unique options, valid answer keys, duplicate stems, and an even answer-position distribution of 53 correct answers in each position. The final GPT review approved the release after redundant sampled objectives were rewritten.

## Verification result

Post-publication verification confirmed all of the following:

| Check | Result |
|---|---|
| Stored Class 3 questions | 821 |
| Learner-visible Class 3 questions | 821 |
| Repaired rows | 212 |
| Approved candidate questions preserved | 250 |
| Metadata total | 821 |
| Content version | 4 |
| Before-image snapshots | 212 |
| Snapshot target set and payload validation | Passed |
| Repaired target set and published payload validation | Passed |
| Public Class 3 practice page | Displays 821 questions |

The GitHub Quality Gate for the guarded release commit passed before the database publication. The public Class 3 practice page was then checked after the verified publication and displayed the updated 821-question bank.
