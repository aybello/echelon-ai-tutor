# Legacy Question Archive Staging Controls

## Purpose

This process preserves the non-OIT question content recovered from the verified private pre-reset archive without treating it as learner-ready content. It is a **quarantined content staging operation**, not a release or customer recovery process.

The staging importer accepts only the immutable 33-bank allowlist defined in `scripts/recovery/stageLegacyQuestionArchive.mjs`. It excludes the ambiguous `class1` legacy alias, the already-restored OIT Water and OIT Wastewater banks, and versioned Ontario 309A content. It imports no customer identity, payment, purchase, subscription, organization, seat, attempt, email, metadata, or module-overview data.

## Safety model

Every staged row is stored with `reviewStatus = 'in_review'`. The application’s learner-facing filter excludes both `in_review` and `rejected` questions. This means staged rows cannot appear in a learner quiz, preview, course inventory, dashboard, mock exam, checkout eligibility calculation, or commercial availability result.

The importer verifies the protected archive SHA-256 before use, normalizes and validates every row, requires an exact 33-bank and 18,052-question package with fixed per-bank counts, rejects duplicate bank/question identities, and requires the clean OIT-only baseline before it can write. It creates an AES-256-GCM encrypted before-state backup under protected storage using a 32-byte key supplied from external escrow rather than saving that key beside the backup, performs a decrypt-and-compare restore rehearsal, locks the three content tables sequentially, stages all rows in one transaction, verifies deterministic checksums before commit, and confirms that existing rows did not change after commit. A second execution fails closed because target-bank rows already exist.

## Completed controlled staging, September 17, 2026

The private archive preflight and guarded transaction completed successfully. The operation staged **18,052 questions across 33 non-OIT banks**. The clean OIT baseline remained unchanged at **489 OIT Water questions** and **483 OIT Wastewater questions**. The post-transaction database has 19,024 stored question rows, of which 18,052 are quarantined as `in_review` and 972 remain learner-visible OIT rows.

No metadata or module overviews were copied because the archive audit identified stale mappings and mismatched totals. No staged questions have source-title and source-reference fields complete enough for approval. Several historic rows also need content-quality remediation. The archive remains protected outside the repository, and the encrypted before-state rollback artifacts remain protected outside the repository.

## Release prerequisites

Before any bank can become learner-visible or commercially available, it must complete all of the following:

1. Repair and reconcile the bank’s module taxonomy, module overview mapping, and question counts against an authoritative current blueprint.
2. Add traceable official source title and reference fields to each question, and resolve any recorded option or answer-quality issue.
3. Run deterministic per-bank validation, independent technical and editorial review, and exact release reconciliation.
4. Update only the approved bank’s metadata and study notes from validated sources.
5. Obtain explicit owner approval for learner visibility. A separate approval is required before pricing, individual checkout, Teams, Flex, historical customer recovery, or outbound communication changes.

Until then, public commerce remains OIT-only and Teams/Flex checkout remains deliberately blocked.
