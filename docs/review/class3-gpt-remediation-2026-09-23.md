# Class 3 Water Distribution GPT remediation package

**Status:** Validated release package, pending guarded production publication
**Date:** September 23, 2026
**Bank:** `class3-water-dist`
**Scope:** 212 existing original-bank questions identified by the September 22 audit as 188 questions requiring review and 24 requiring correction.

## Purpose

This package replaces only the 212 flagged original Class 3 Water Distribution questions. It does not add or remove questions, change course pricing, modify access terms, or alter payment behaviour. The existing 250 approved candidate questions remain unchanged. The stored and learner-visible inventory is expected to remain **821 questions** after publication.

## Authoring and source control

The question repairs were authored using **GPT-5.6 Sol only**, as directed. Each repair cites one of the controlled public sources in `original-453-remediation-source-pack-2026-09-23.json`. The source pack covers Ontario distribution-system design guidance, Ontario watermain disinfection requirements, Ontario drinking-water quality standards, Ontario confined-space and construction rules, Ontario operator certification requirements, EPA guidance, AWWA water-loss guidance, and EPANET documentation.

The release script pins both the remediation package and source pack by SHA-256 digest. It rejects changes to either input, source metadata that is not in the controlled pack, unsupported O. Reg. 170/03 references, invalid question structures, duplicate answer choices, and duplicate replacement stems.

## Validation

The validated package contains exactly 212 original-question replacements. Every question has four unique options, a valid keyed answer, an explanation, a controlled source title, reference, URL, and learning objective. The final answer-position distribution is balanced at 53 correct answers in each of positions 1 through 4. The deterministic package audit reports zero failures, zero warnings, and zero duplicate stems.

## Publication controls

Publication uses `scripts/recovery/releaseClass3GptRemediation.mjs`. The command plans by default and can write only when all controls pass. It requires a fresh target-bound baseline manifest, a scoped recovery snapshot less than one hour old, the exact live plan digest in the confirmation environment variable, a single transaction, immutable before-images for all 212 target rows, a metadata version update, and post-write verification that all non-target rows, including all approved candidate questions, are unchanged.

> The publication has not run at the time of this package record. The learner-visible Class 3 inventory remains unchanged until the guarded production step completes.
