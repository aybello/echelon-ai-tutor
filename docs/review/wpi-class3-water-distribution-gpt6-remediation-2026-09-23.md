# WPI Class III Water Distribution remediation package

**Status:** Validated staged repair package. Publication is controlled separately by a target-bound production release.

**Date:** September 23, 2026
**Authoring and review model:** GPT-6 Sol
**Target bank:** `wpi-class3-water-dist`
**Learner-visible bank inventory at audit:** 611 questions
**Repair scope:** 209 critical or high findings
**Package file:** `content/wpi-class3-water-dist/repaired-critical-high-209-2026-09-23.json`
**Package SHA-256:** `9a2d964640267794aca108ed1e6f45bea93d643800f6ecbefc5dde2cd932e0fb`

## Why this repair was prepared

The full learner-bank audit identified 209 critical or high risk items in WPI Class III Water Distribution. The issues included unsupported regulatory claims presented as Western Canada-wide rules, unsafe or incomplete procedure wording, wrong keys, ambiguous answer choices, and calculation defects. This package replaces only those 209 questions. It does not add, remove, renumber, or hide questions, so the learner-visible inventory remains 611.

## Controlled authoring approach

The repaired questions use a restricted source pack. General operational items map to the 2025 WPI Class III Water Distribution competency framework. Calculations use WPI water formula and conversion conventions. Detailed water-main disinfection and repair questions stay within the publicly available scope of AWWA C651-23 and avoid unsupported doses, contact times, sample counts, test pressures, durations, and acceptance thresholds. Health Canada material is treated as guidance unless a named provincial authority supports a regulatory claim.

Where the legacy question relied on an unnamed provincial duty, local approval, numeric design requirement, or safety protocol, the repair either identifies the required context or reframes the item as a jurisdiction-neutral operational competency. The package does not claim that a single provincial rule applies across Alberta, British Columbia, Saskatchewan, and Manitoba.

## Validation record

The deterministic package validator confirmed all 209 replacements have four distinct answer options, a valid answer key, a non-empty explanation, controlled source metadata, and a unique stem that does not duplicate the unchanged bank. All 35 remaining calculation items include reproducible steps. It also screened the package for several previously unsafe or unsupported stock claims.

A complete GPT-6 Sol review then covered all 209 staged questions. The first pass flagged two calculation-clarity issues. Both were corrected, after which the final review reported **0 blockers, 0 major issues, and 0 minor issues**. A dedicated calculation-format review subsequently checked all 35 calculation items for formula-first explanations, defined variables, unit-labelled substitutions, and reproducible rounding. Its final pass also reported **0 blockers, 0 major issues, and 0 minor issues**.

## Publication safeguards

The live preflight found that the bank contains 611 learner-visible questions while its metadata still claimed 590. The guarded release corrects that stale metadata count to 611 as part of the same atomic transaction. It does not add, remove, renumber, hide, or reveal any questions beyond the 209 reviewed replacements.

The accompanying release script requires the exact package digest, a fresh live preflight bound to the production target, complete before-images for all 209 target rows, a verified recovery artifact, a matching confirmation digest, row-level post-write verification, exact raw-value protection of every non-target question, an increment of only the target bank metadata version, and confirmation that the 611-question learner-visible inventory is unchanged. It also prevents a second application of the same release and retains a durable retry gate if a database commit outcome is uncertain.

This package contains question content only. It does not read or modify customer records, payment records, purchases, entitlements, organizations, team licences, learner attempts, or prices.
