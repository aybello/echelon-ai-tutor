# Class 3 Water Distribution approved-candidate publication

**Release date:** September 22, 2026

## Scope

The owner approved publication of the 250 Class 3 Water Distribution candidate questions numbered 2001 through 2250. This release added and approved those 250 questions only. It did not run the separate 116-question legacy repair, change pricing, alter product access terms, modify payment processing, or change learner, customer, purchase, organization, or entitlement records.

## Guardrails

The publication script requires the authoritative external database target to be explicitly selected and certificate-verified TLS to be available. It refuses the platform-managed database route. Before any write, it performs a read-only live plan that binds the release to the exact target, metadata version, and full 571-question baseline. The apply operation then requires the exact plan digest, fresh target-bound preflight evidence, and fresh scoped recovery evidence.

The release validates transactional storage and uniqueness controls, locks the Class 3 question set and candidate-number range during the explicit apply, inserts only the approved candidates, and conditionally updates only Class 3 metadata. It reads back every inserted candidate and verifies that the original 571 question IDs and content payloads remain unchanged. An uncertain database commit outcome is treated as a reconciliation event, not a retry condition.

## Observed production result

The production verification confirmed **821 stored Class 3 questions**, **821 learner-visible questions**, and **250 approved new candidates**. The original **571 questions were preserved exactly**, and the Class 3 metadata content version increased to 2. The public Class 3 practice page displayed **821 questions** after the database publication.

## Validation

The candidate package verifier passed. Focused release tests passed with 10 tests across the candidate publication and legacy repair safeguard suites. TypeScript checks and the complete deterministic test suite passed, as did the production build. The build continues to emit pre-existing large-chunk warnings only.

A GPT-6 Astra independent review approved the final guarded release path. It confirmed that the write scope is limited to candidate inserts and Class 3 metadata, with target-bound evidence, transactional checks, full baseline preservation, and exact post-write validation.

## Repository and checkpoint

The guarded release script and its test suite were committed in `3b0b79495f796be2a7d317e265bf6bcb87b7337f` with the message `feat: add guarded Class 3 candidate release`. The related WebDev checkpoint uses version `3b0b7949`.
