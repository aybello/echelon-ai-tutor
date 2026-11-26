# 309A Certification Program Foundation

This checkpoint implements the safe boundary for Echelon Institute's first
non-water certification program. The 309A diagnostic is available as a clearly
labelled public draft preview; it does not sell or migrate 309A into the
production question database.

## Implemented boundary

- `shared/certificationPrograms.ts` is the trade-agnostic program registry.
- Ontario 309A uses program key `construction-electrician-309a-on`.
- The current blueprint is versioned as
  `red-seal-construction-electrician-current-previous-rsos-2026-08-15`.
- Official Red Seal and Skilled Trades Ontario references are recorded in a
  source ledger with verification dates and usage controls.
- Canadian Electrical Code rule-specific authoring remains blocked until
  legitimate licensed access and technical SME review are confirmed.
- The program lifecycle is `public_preview`; the limited draft diagnostic is
  approved for demonstration only. Commercial learner delivery, selling and
  Teams assignment are all disabled.

## Content delivery contract

Public practice or mock delivery fails closed unless all of these are true:

1. The program is in the `commercial` lifecycle.
2. Public delivery has been explicitly approved.
3. The question belongs to the program and current blueprint version.
4. The source verification date is present.
5. The question has an `approved` review status.
6. The question is not retired.
7. The question is explicitly approved for the requested practice or mock
   surface.

Public preview is a separate selector. It may show current draft and in-review
items for the limited diagnostic, but never rejected, retired or
stale-blueprint content. It is not a learner-practice or mock-exam entitlement.
Internal review remains separately available to administrators. The existing
direct `/electrician-309a-demo` route uses the public-preview selector.

## Current question state

All 25 prototype questions carry the program key, blueprint version, source
verification date, review status, separate practice/mock approvals and
retirement state. Every item remains draft and is limited to the public
diagnostic; it is blocked from public practice, mock exams, learner inventory,
commerce and Teams.

## Deferred database work

No production migration is included in this checkpoint. The later additive
migration should persist programs, blueprint versions, source records, question
revisions, reviewer identity and per-surface approvals only after the SME review
workflow is finalized. Existing water and wastewater tables and entitlements
remain unchanged.
