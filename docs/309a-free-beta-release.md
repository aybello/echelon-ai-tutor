# 309A Free Beta Release

## Scope

This release activates the existing **500-question Ontario 309A Construction Electrician** bank as a free beta. The bank remains explicitly non-commercial and non-Team-assignable. It does not add a paid 309A product, change an existing product price, create customer records, or restore historical access.

The public beta surfaces are the existing practice, flashcard, and mock-exam routes. The same 500 governed questions are delivered only when the bank version is active in the `beta` release channel and each item is marked `beta_approved` and public-eligible.

## Controls

The release script validates the existing imported bank against the source-controlled 309A content package before it changes anything. It checks the program identity, current blueprint version, bank version, exact 500-item target, allocation checksum, source-manifest checksum, every stored item hash, and every official public-reference source. It rejects content drift, missing questions, stale internal state, a commercial or Team eligibility flag, or pre-existing partial beta-release review records.

The script then creates a private encrypted backup and rehearses a restore before promoting the content. The database work is a single transaction. It changes only the 309A bank version, the 500 certification-question release fields, and 500 internal beta-release review records. It verifies that all protected customer-table counts are unchanged before the transaction is committed.

## Commercial Boundary

> 309A is available for free beta study. It is not for sale, cannot be assigned through a Team plan, and does not change the existing Individual Exam Pass price list.

The commercial availability service holds `electrician-309a` in an explicit non-commercial product exclusion. A future product-catalogue entry cannot make the beta purchasable by accident. Any future paid 309A launch requires a separate commercial approval, pricing decision, checkout configuration, and release review.
