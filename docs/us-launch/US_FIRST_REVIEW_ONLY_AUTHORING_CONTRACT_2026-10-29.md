# U.S. First Review-Only Authoring Contract

**Status:** Candidate-only. No database action, learner visibility, activation, commercial configuration, deployment, or release is authorized.

## Tranche scope

This tranche contains exactly **25 original multiple-choice candidates for each of 11 source-ready routes**, for a maximum of **275 candidate questions**. The selected routes are recorded in `US_FIRST_REVIEW_ONLY_AUTHORING_TRANCHE_2026-10-29.json`.

The selection excludes every WPI-direct route, all unverified and not-offered routes, every Narrow/Defer/Hold dossier, Texas’s existing direct course, and three Suitable routes that have an explicit recovered-package or overlap-reconciliation gate. A selection in this contract means “eligible to draft review candidates,” not “approved,” “importable,” or “ready to sell.”

## Candidate JSON contract

Each route produces one file at `artifacts/us-review-only-candidates/<routeId>/01-draft.json`, with a top-level manifest and exactly 25 items. Each item must include:

- `candidateId` in the form `<routeId>-review-0001` through `-0025`;
- `routeId`, `proposedBankKey`, `jurisdiction`, `stream`, `credentialBoundary`, `module`, `topic`, `blueprintObjective`, `difficulty`, and `cognitiveLevel`;
- one clear `question`, exactly four distinct `options`, a `correctIndex` from 0 to 3, a concise `explanation`, `steps`, `tip`, and `isCalc`;
- one item-level `source` object with official title, issuer, URL, exact section/page/reference, retrieval date, jurisdiction, and the exact supported claim;
- `author` metadata identifying a Manus-native drafting role, workflow/batch identifiers, prompt version, and timestamp;
- `reviewStatus: "in_review"`, `review: { "status": "pending_independent_review" }`, and a deterministic SHA-256 `contentHash` over the normalized learner-visible content and source reference.

`proposedBankKey` is a review identity only. It must not be assumed to be a valid live course key or database bank key.

For deterministic validation, `contentHash` is the lowercase SHA-256 hex digest of `JSON.stringify` applied to this exact ordered payload: `{ question, options, correctIndex, explanation, steps, tip, source: { title, url, reference } }`. Hash normalization may correct this metadata only; it never changes learner-visible fields, source wording, or review state.

## Evidence and drafting rules

Draft only from the exact official sources and examination boundary recorded in the route’s readiness dossier. Do not use a different jurisdiction’s credential rule, a commercial prep site, copyrighted question bank, model knowledge, unsupported threshold, facility-specific procedure, legal conclusion, or site-specific operating instruction. Do not copy material from the source. One item tests one source-bounded objective and has one defensible answer.

For calculations, show the formula, substitutions, units, and stated rounding rule in `steps`; do not use a calculation unless the cited source supports the tested concept. For non-calculations, `steps` is an empty array. Keep candidate language appropriate to the exact certification level and preserve every exclusion in the route dossier.

## Mechanical and review gates

A later deterministic validation must check item count, identity, option uniqueness, keyed-answer range, duplicate stems/options, source fields, review status, and content hashes. A separate Manus-native reviewer who did not draft the batch must issue one decision per item before a candidate can be included in the final portable package. A rejected or ambiguous item is repaired/replaced and re-reviewed; it never becomes learner-visible through this process.

## Explicit exclusions

This contract does not authorize question import, database rows, approval, activation, pricing, Stripe changes, entitlements, checkout, email, marketing, purchase, public claims, publishing, checkpointing, or deployment.
