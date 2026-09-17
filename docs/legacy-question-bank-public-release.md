# Legacy Question Bank Public Release

## Purpose

This release makes the exact non-OIT question banks recovered from the protected pre-reset archive available to learners and opens their existing Individual Exam Pass products. It does not change prices, create new products, enable Teams checkout, or restore historical learner access.

The release scope is **32 legacy banks and 17,549 questions**. WPI Class IV Wastewater Collection is excluded because it was already released through its separate, reviewed 503-question release process. The two OIT banks remain unchanged. The 309A bank follows a separate free-beta release process because it is governed by versioned certification tables rather than the legacy `questions` table.

## Release Boundaries

The release runner accepts only the checksum-pinned pre-reset archive. It verifies the immutable per-bank counts, locks the question and metadata tables, and checks that every target row remains in untouched `in_review` quarantine. It then promotes the target rows to `unreviewed` and adds factual metadata based only on the module labels already stored with those questions.

The runner deliberately leaves `moduleTargets`, `formulaLinks`, `minCalcPerMock`, and `recallTargetPct` empty. It does not invent a source-backed exam blueprint from the recovered content. Existing product prices are unchanged. Teams and Flex checkout remain server-blocked.

Before applying, the runner creates an AES-256-GCM encrypted backup of the target rows and rehearses its restore. The encryption key is kept in the operator-controlled private escrow directory and is not written into the repository or the report. The transaction verifies that all protected customer table counts and all non-target questions and metadata are unchanged before commit.

## Verification Standard

A successful release must prove the following:

1. The protected source archive hash and every per-bank question count match the immutable release scope.
2. Exactly 17,549 quarantined rows become learner-visible across exactly 32 banks.
3. Exactly 32 factual bank-metadata rows are created without fabricated targets or source claims.
4. No historical user, purchase, subscription, organization, seat, entitlement, attempt, email, or price record changes.
5. Each released individual product remains gated by a live learner-visible count of at least 100 questions.
6. Teams commerce remains disabled.

The source archive and execution reports remain private. They must not be committed, uploaded to public assets, or copied into Notion.
