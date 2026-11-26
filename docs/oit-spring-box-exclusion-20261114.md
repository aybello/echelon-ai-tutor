# Four ambiguous spring-box exercises: reversible exclusion

Base: `8ebc7b2` (PR #228). This patch does not rewrite the authoring table, immutable overlay, declaration, or exact-payload receipt. It appends four narrowly scoped exclusions using the existing release mechanism:

- `og-oit-b12-odd-one-out-0107`
- `og-oit-b12-odd-one-out-0108`
- `og-oit-b12-odd-one-out-0110`
- `og-oit-b12-odd-one-out-0112`

Each asks which item is not a surface-water intake, but contains Spring box alongside a different keyed intruder. Spring boxes collect emerging groundwater, leaving multiple defensible answers. Independent technical review opened Wisconsin DNR, *Springs* (DG094, March 2026), page 1: https://dnr.wisconsin.gov/sites/default/files/topic/DrinkingWater/Publications/DG094.pdf . The Ontario corroborating PDF was not relied on as read because retrieval returned 403. This is a narrow demonstrated ambiguity finding, not blanket scientific certification or rejection of the other batches.

The original 125 exclusions are preserved in their original order and exact JSON content. Four are appended. All 3,113 PR #228 stored additions and their receipt bindings remain unchanged; 3,109 of those additions remain eligible for selection. Effective water Odd-One-Out changes from 641 to 637; other 11 course/mode counts are unchanged. The effective water release version changes, invalidating old cached catalogs/sessions. The wastewater version remains unchanged.

Independent code review and focused tests verify full effective-pool exclusion, sampled sessions, unchanged preview/legacy behavior, exact original exclusions, source/receipt integrity and version changes. These checks do not claim exhaustive technical content review.

## Serving-release verification before this patch

Public read-only health and catalog requests on November 14 returned source fingerprint `511e08b010ad391754a83e492717c5927a60706064adc50a0b12807c88fd313a`, which exactly matched the functional source fingerprint computed from a clean archive of main `8ebc7b2`.

Public catalog versions matched that same archived engine:
- Water: `effective-2c43e39d492880ef3be22c9910508d892b4dcc00fdc3fc1b90b0916b6938da2f`
- Wastewater: `effective-cb5268ddf59919fec3577c4004734a9cfaaa139592aa676d7c2a5c54f729f0f2`

Verified serving counts (swipe/match/odd/cause/flaw/order): water 831/274/641/343/335/418; wastewater 567/171/399/260/221/304. The matching archived effective pool includes all four affected IDs. Therefore the expanded release is serving; the exclusion is not live merely because this branch exists. A separate approved merge/deployment and live verification are required.

## Earlier work reconciliation

The older `fix/oit-cause-effect-100` branch remains intact and unmerged. Its old count-gap analysis is superseded by PR #228: every current effective course/mode exceeds 100. Main already has its own direction-presentation and calculation-mode-fit implementation; blindly merging the older alternative would risk conflicting semantics. Its 381 source-backed drafts/reviews remain research assets, not automatically novel additions or approved live content. Current stored Cause & Effect classifications are 250 directional + 93 qualitative water items, and 175 directional + 85 qualitative wastewater items; these are presentation classifications, not scientific quality certifications.
