# Class 1 Complete Repair Release — 11 September 2026

## Scope

The controlled release applied the checksum-verified Class 1 repair package to the existing four Class 1 banks. It updated **1,601 existing question rows** while preserving question identities, canonical answer indexes, review statuses, and bank inventories. The affected inventory remained 555 Water Treatment questions, 565 Wastewater Treatment questions, 716 Water Distribution questions, and 724 Wastewater Collection questions.

The release also includes a deterministic display-only option-order permutation for these four Class 1 banks. A learner’s selection, scoring key, saved mock answer, and API submission remain in canonical option-index order; only the visible presentation order changes. Tutor guidance now refers to option text rather than deriving a displayed letter from the canonical index.

## Controls and evidence

The uploaded archive’s ZIP integrity check passed, and all 49 files matched the provided checksum manifest. Independent read-only reconciliation and the archive’s transactional no-write preflight each confirmed the exact 1,601-question repair path was ready. A representative 18-question cross-bank review found no sample-level blocker; high-impact repaired calculations were independently recomputed.

A fresh full-bank rollback baseline was stored in managed storage before the apply. Its baseline checksum is `fdfa36955525b72b86e775dc06a29659a4efdc22d31113c1e8e19ad89afca3f6`; the exact repair package SHA-256 is `6257571e8b5c8efee874b88d7f90879009d5ee9dcee66ddb356bdecfc46eb316`. The guarded transactional writer committed 1,601 question patches and four content-version metadata patches. Its post-commit verifier returned `already-applied` with zero writes.

## Verification

Focused display-order and release-guard tests passed, as did repository type checks, the full test suite, and the production build. The Class 1 Water practice interface was visually checked without selecting or submitting an answer. It served repaired content and displayed the correct scenario question with shuffled visible option positions.

## Boundaries

The release repairs existing content only. It does not add the separate 250-question expansion packages, alter blueprint/module-weight configuration, change learner attempts, create learner activity, or claim independent regulator certification. The package’s per-item source metadata is incomplete for many editorial/scenario-based changes; this remains a documentation-improvement backlog rather than a finding that the representative reviewed repairs are incorrect.
