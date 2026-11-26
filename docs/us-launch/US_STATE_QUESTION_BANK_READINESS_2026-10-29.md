# U.S. State Question-Bank Readiness

**Date:** October 29, 2026
**Status:** Research and review-only authoring plan; no question content, database, activation, publication, pricing, checkout, or learner-access changes.

## Executive decision

The routing map is structurally complete: it contains **50 states × 4 operator streams = 200 state-stream records**, and every record carries at least one recorded source reference. This does **not** mean all 200 routes are ready for question-bank drafting.

A question bank can be authored only after its exact state, stream, credential level, official blueprint or exam outline, and source-bound learning objectives are verified. The existing matrix supports the following controlled split:

| Route status | Programs | Authoring action |
|---|---:|---|
| WPI Direct | 50 | Reuse the applicable WPI-based preparation content; do not create a duplicate state-specific bank merely because a state is mapped. |
| State program + WPI component | 7 | Treat WPI material as a bounded component only. First determine whether an addendum is needed and obtain state-specific official source coverage. |
| State-specific / no shared course | 143 | Do not infer that every route needs a new bank. Of these, 55 are recorded as state-specific or WPI-customized and may enter official-source dossier work; 73 are still marked unverified and remain on hold; 2 are marked not offered. |

The current source-matrix `examSystem` counts are: **57 WPI-standardized, 13 mixed, 52 state-specific, 3 WPI-customized, 73 unverified, and 2 not offered**.

## What already exists

- The shared source includes an explicit release mechanism for two dedicated U.S. Class I banks: `us-class1-water` and `us-class1-water-dist` (398 total expected rows).
- The currently attached database does not contain those `us-*` bank rows. It does contain only aggregate `wpi-class1-*` rows, all marked `unreviewed`. This attached database is not proof that the prior dedicated U.S. package was abandoned or that it should be recreated.
- Texas has a separately mapped direct course, `us-texas-class-d-water`. It must not be conflated with a shared WPI course.

## Question-bank program boundaries

1. **No duplicate WPI banks.** Mapped WPI routes are a distribution/routing outcome, not an instruction to create 50 duplicate state banks.
2. **No authoring on unverified or not-offered routes.** A source link alone is not enough; an official exam/credential scope and level are required.
3. **One bank identity per verified product/exam family, not per state by default.** A single shared bank may serve several states only when the official source record supports it. State-specific legal, reporting, licensing, or operating rules belong in state-specific additions, not in a falsely generic bank.
4. **Review-only content first.** Every candidate item must have a batch evidence record, structural checks, an independent reviewer decision, and an `in_review` status. No learner visibility follows from drafting.
5. **Existing U.S. packages must be recovered before replacement.** Before drafting a bank that may overlap the earlier dedicated U.S. Class I release, recover its immutable package/checksum and authoritative-target inventory read-only. Do not duplicate or overwrite it.

## Next controlled work

### Phase A — recover and reconcile existing U.S. Class I content

1. Locate the prior U.S. Class I package, manifest/checksum, release record, and authoritative external database evidence.
2. Compare the recovered package with `us-class1-water` and `us-class1-water-dist` source identities.
3. Preserve an existing reviewed package; create nothing overlapping unless the comparison proves a gap.

### Phase B — state-specific authoring dossiers

For each potentially authorable state-specific or WPI-customized route, create a separate dossier containing:

- exact state and stream;
- credential level and test/exam boundary;
- official issuer and current blueprint/outline or stated limitation;
- retrieved source metadata and supported learning objectives;
- whether the result is **Suitable**, **Narrow**, **Defer**, or **Hold**;
- proposed bank identity only if a unique bank is evidence-supported.

### Phase C — candidate packages

Only dossiers classified **Suitable** may generate review-only JSON candidate batches. Each candidate must include the application question fields, objective, source metadata, structural validation outcome, independent review decision, and `in_review` release state.

## Explicitly excluded from this phase

- database imports or updates;
- source-of-truth or question-bank activation changes;
- learner-visible content, purchase flows, pricing, Stripe, entitlements, email, or advertising;
- approvals, content releases, publishing, checkpoints, or deployments.

## Evidence snapshot

- Source map: `shared/usExamResearch.ts` and `shared/usExamRouting.ts` at GitHub main `910e63f0`.
- Structural inventory: 50 state records, 200 state-stream records, 0 missing stream records, 0 records without a source reference.
- This is a readiness decision, not a statement that all 200 programs are independently verified or ready to sell.
