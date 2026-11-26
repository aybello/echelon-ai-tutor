# Ontario 309A — Free Public-Beta Governance Specification

## Decision

Ontario 309A is a **free public beta** while Echelon Institute develops the original 500-question study bank. Free access does not mean unreviewed content is automatically public. Every learner-facing item must be independently eligible for the beta channel and remain non-commercial at the server, database, and user-interface layers.

## State model

Keep a certification program's business lifecycle separate from release visibility. Do **not** overload `internal_review`, `public_preview`, or `commercial` to mean a free course. Add a trade-neutral, versioned release channel to the certification bank/version model:

| Field | Allowed values | Meaning |
|---|---|---|
| `programLifecycle` | `internal_review`, `public_preview`, `commercial`, `retired` | Overall program business state; existing semantics remain compatible |
| `releaseChannel` | `internal`, `beta`, `public`, `retired` | Visibility of a specific bank version |
| `contentStatus` | `draft`, `editorial_approved`, `technical_approved`, `beta_approved`, `rejected`, `retired` | Content review state |
| `commercialEligibility` | `false`, `true` | Explicit server-side commerce policy |
| `teamEligibility` | `false`, `true` | Explicit server-side Teams policy |

Only `beta_approved` items in an active `beta` bank version may be delivered to the 309A public course. A contributor may not technically approve or beta-approve their own item. `draft`, `editorial_approved`, and `technical_approved` content remains in internal review tools only.

## Required persistence model

Codex must add a normalized model, migrations, and referential checks before importing the full bank. Existing generic question columns may be retained for backwards compatibility, but cannot be the sole governance record for 309A.

| Entity | Essential fields |
|---|---|
| `certification_bank_versions` | program key, blueprint version, release channel, item target, active flag, source-manifest checksum, created/published/retired timestamps |
| `certification_blueprint_tasks` | bank-version ID, MWA, task code, official target, 500-bank target, source ID, source reference |
| `certification_sources` | publisher, title, stable URL/identifier, edition/version, retrieval date, SHA-256, rights basis, permitted usage |
| `certification_questions` or governed extension of `questions` | bank-version ID, `bankItemNumber`, task ID, author/origin, content hash, source ID, content status, public eligibility, retirement fields |
| `certification_content_reviews` | content kind, content ID, reviewer identity, review type, decision, notes, timestamp; author and technical reviewer must differ |
| `certification_import_runs` | manifest checksum, dry-run state, importer identity, inserted/updated/rejected counts, atomic completion state |
| `certification_diagrams` | bank-version ID, diagram ID/version, SVG source or approved storage reference, source/rights metadata, alt text, content status, retirement fields |
| `certification_flashcards` | bank-version ID, task ID, front/back, source/review/publication fields |
| `certification_module_notes` | bank-version ID, module/task scope, structured note sections, source/review/publication fields |

The database primary key is never a bank item number. Enforce uniqueness on `(bank_version_id, bank_item_number)` and import exactly 1–500 for the 500-item version.

## Server-side delivery invariant

Every route that can return a 309A question, answer, explanation, flashcard, note, diagram, mock item, direct-ID fetch, cache refresh, or export must apply the same server-side predicate:

1. The bank version is active and has `releaseChannel = beta`.
2. The item is mapped to the active current-exam blueprint version.
3. The item's source is verified, rights are permitted, and the item is not retired.
4. The item has `contentStatus = beta_approved`.
5. `commercialEligibility = false` and `teamEligibility = false` remain enforced in checkout, bundles, subscriptions, Teams, licences, and direct APIs.

The client must never receive answer keys or rationales before an answer is submitted. Client-side filtering, hidden navigation, or no-index metadata alone are not access controls.

## Content safety, rights, and claims

The following claims must appear in the course disclosure and cannot be removed by a content author:

> Free public beta. Echelon Institute is an independent study resource and is not affiliated with or endorsed by Skilled Trades Ontario, Employment and Social Development Canada, or the Red Seal Program. This product contains original practice content, not live examination questions. It does not replace apprenticeship, qualified supervision, site-specific safety procedures, official materials, or professional judgment, and it does not guarantee exam eligibility or success.

For electrical safety topics, questions and notes must be reviewed by a qualified electrician SME before `beta_approved`. No content may tell a learner to perform energized work, bypass protective equipment, ignore a site procedure, or use a rule/table value that is not supplied in the item and rights-cleared.

## Version-change rule

The current bank is pinned to `red-seal-construction-electrician-current-previous-rsos-2026-08-15`. A new RSOS may not replace it automatically. A change requires official evidence that the exam changed, a new bank version, task remapping, source-manifest refresh, impact review, revalidation, and explicit publication approval. Preserve historic attempts and scores against the bank version used at the time.

## Required release evidence

Before a 309A beta bank is visible, retain machine-readable output proving the exact 500 count, task allocations, status eligibility, source hashes, calculation validation, diagram references, importer checksum, reviewer separation, and regression coverage. Include an emergency unpublish action that disables the active beta version immediately without deleting historic attempts.
