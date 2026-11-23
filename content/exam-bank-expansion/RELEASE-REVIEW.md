# Muse Exam-Bank Expansion Release Review

Date: 2026-11-23 UTC

The authoritative live-bank comparison checked all 7,000 staged questions against 16,491 existing production rows. It found 5 exact findings and 11 masked near-match findings, representing 11 unique staged items.

Gemini `gemini-4-argon` and OpenAI `gpt-6.2-sol` independently reviewed the same payloads and agreed: **9 unique items are withheld** and **2 are retained** because their automated live matches were false positives involving unrelated topics.

- Raw staged questions: 7,000
- Unique withheld items: 9
- Retained flagged items: 2
- Release candidate after exclusions: 6,991
- Ontario 309A: excluded from scope

The exact item payload hashes, model names, and decisions are recorded in `release-exclusions.json`. Any future importer must consume that manifest, verify hashes, and fail closed if an item changes. This package remains AI-authored and mechanically validated; it is not endorsed by an exam board or subject-matter regulator.

## Owner-authorized additive release, 2026-11-23

The owner, Ay Bello, states that he personally reviewed the questions and authorized their release. The earlier review above remains a historical record, not the current exclusion decision.

At 05:49:15 UTC the owner approved withholding both previously retained flagged items: `wpi-class1-wastewater#2303` and `wpi-class1-wastewater#2308`. Their exact payload hashes remain bound in the manifest. The original nine exclusions remain unchanged. Current scope: **7,000 staged, 6,989 candidates, 11 withheld, zero approved flagged exceptions**.

The owner approved only these bank-key mappings: `wpi-class1-water-coll` to `wpi-class1-wastewater-coll`, and the same exact alias resolution for Classes 2, 3 and 4. The existing approved OIT wastewater mapping remains source questions 1501–1600 to database questions 1601–1700. Original and mapped identities and hashes must appear in immutable insertion receipts. No other numbering or bank-key remapping is authorized.

Existing live duplicates stay untouched. New candidate collisions still block the release. The importer must use the same authoritative target as the production app, preserve existing content and blueprint metadata, and pass the required Privacy and Quality Gates before production execution. Ontario 309A and every withheld item remain excluded.

## Authoritative-target correction and final preflight, 2026-11-23

The earlier baseline used the inactive managed database. The production app selects the external authoritative database through `activeScriptConnection.mjs` and the matching runtime selection in `server/db.ts`. The importer now uses that target and requires both an exact package hash and an exact target fingerprint before any write.

The authoritative comparison found one additional exact normalized-stem duplicate after the approved bank mapping: source `wpi-class1-water-coll#2266`, item `COLLECTION-L1-266`, “What is a force main?”, matches existing live `wpi-class1-wastewater-coll#7`, database ID 46720. To enforce the owner's no-duplicate instruction, Manus AI added this exact hashed item to the withheld manifest without modifying the live row. Final scope: **6,988 candidates, 12 withheld, 35 mapped live banks, no approved duplicate exceptions**. Read-only preflight found zero remaining candidate number or normalized-stem conflicts and metadata for all mapped banks. The four pre-existing normalized-stem duplicates in the authoritative target banks remain untouched.

The calculation verifier's old workspace path was also corrected to this checked-in package, with missing-file, complete-record and per-course count checks added. It now checks all 1,400 calculation records rather than accepting an empty run. No authored candidate payload was edited.
