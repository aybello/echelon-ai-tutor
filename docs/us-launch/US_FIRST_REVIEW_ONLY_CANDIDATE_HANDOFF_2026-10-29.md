# First U.S. Review-Only Candidate Handoff — October 29, 2026

## Status

A private, portable review-only package has been assembled for the first source-ready U.S. tranche. It contains **200 candidates across 8 state-stream routes**. This is not a content release: no database row, import, approval, activation, learner-visible question, pricing, entitlement, Stripe, checkout, email, publication, checkpoint, or deployment action was performed.

The package must not be committed to the public `aybello/echelon-ai-tutor` repository. It is retained as a private Drive handoff with integrity and audit records.

## Routes included

| Route | Credential boundary | Candidates |
|---|---|---:|
| Louisiana water distribution | LDEQ distribution scope recorded in route dossier | 25 |
| North Dakota water distribution | NDDEQ primary-level distribution and storage scope | 25 |
| New Mexico wastewater collection | NMED CS1 | 25 |
| New Mexico water treatment | NMED WS3 | 25 |
| Pennsylvania wastewater collection | DEP E4 | 25 |
| Pennsylvania water distribution | Class E stand-alone distribution examination | 25 |
| Wisconsin wastewater collection | DNR Subclass SS basic examination | 25 |
| Wisconsin wastewater treatment | DNR Wastewater–General examination | 25 |

## Dossier holds retained

No candidates were drafted for these initially selected routes because their public official materials did not provide sufficient objective-level support for safe substantive authoring:

- New Hampshire wastewater collection;
- New Mexico wastewater treatment; and
- Utah water distribution.

They remain evidence holds, not gaps to fill by inference.

## Quality evidence

1. **200/200** initially drafted candidates passed deterministic structural validation after canonical hash metadata normalization. The normalization changed only `contentHash` metadata and was recorded separately.
2. First independent review approved **179** and rejected **21** with item-level repair requirements.
3. All 21 defects were repaired as isolated same-ID replacements and independently re-reviewed. One Wisconsin source-page correction received an additional re-review.
4. Final duplicate screening caught four additional high-similarity candidates. Those items were replaced with different official-source objectives and independently re-reviewed.
5. Final package validation reported **0 structural errors**, **0 exact duplicate stems**, and **0 high-similarity pairs** at the documented screen threshold. Package SHA-256 verification passed.
6. No human or SME approval is claimed. The final item status remains `in_review`.

## Recipient and release boundary

The receiving workspace must verify the package SHA-256, review its evidence files, preserve `in_review`, and decide through a separate documented content-release process whether to import any item. Before any release, recover and compare the historical dedicated U.S. Class I package/authoritative target to avoid overlap; run target-database preflight; validate import behavior; obtain explicit release authorization; then conduct post-import and learner-visibility verification.

The relevant authoring contract, tranche manifest, state-dossier decision index, and individual route dossiers are source-controlled. The proprietary candidate JSON and review records are intentionally private.
