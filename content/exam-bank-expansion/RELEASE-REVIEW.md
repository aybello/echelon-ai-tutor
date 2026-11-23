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
