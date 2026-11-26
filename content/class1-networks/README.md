# Ontario Class 1 — Distribution and Collection expansion

This package contains **250 Water Distribution and 250 Wastewater Collection practice questions**. Each bank has 200 conceptual questions and 50 calculation questions, four choices, an answer key and an explanation. Calculations include stated assumptions, units, a formula, substitution and a worked result. They are original practice items, not questions obtained from a certification examination.

| Stream | Exact destination bank | Candidate numbers | Count |
| --- | --- | --- | --- |
| Water Distribution | `class1-water-dist` | 2001–2250 | 250 |
| Wastewater Collection | `class1-wastewater-coll` | 2001–2250 | 250 |

These are the Ontario course keys in `shared/courseRegistry.ts`, not the separate `wpi-` banks. The numbers are proposed identifiers; they are **not reserved against production**. Existing questions or attempt history must not be overwritten. This package does not include or replace the earlier Treatment expansion.

## Review and validation

- `REVIEW.md` displays every question, choice, answer and explanation.
- `source/*.txt` are editable authoring inputs; `questions/*.json` are deterministic outputs.
- `manifest.json` includes exact counts, module allocations, per-file SHA-256 hashes and answer-cue results.
- Correct answer positions are shuffled deterministically, with A/B/C/D counts of 63/63/62/62 in each bank. The authoring files put the correct answer first only to simplify maintenance; they are not learner delivery files.
- Checks require four distinct options, valid answer keys and schema values, complete explanations, valid metadata lengths, 50 recomputed calculations and no identical normalized stems within each bank.
- The repository's answer-cue detector checks strong length differences, systematic longest/shortest answer patterns and all-wrong-option qualifier cues. Passing heuristics does not prove every question is equally difficult or that every distractor will work for real learners.
- Editorial review replaced irrelevant distractors, removed several wording clues, and checked that keys follow the stated scenario. No outside examiner or independent subject-matter expert approval is claimed.

```sh
node scripts/class1-networks.mjs build
node scripts/class1-networks.mjs check
pnpm exec vitest run server/class1NetworksPackage.test.ts
python scripts/verify-class1-networks-math.py
```

The Python check uses a separate arithmetic evaluator plus independently specified expected values; it does not merely compare the JavaScript generator with itself.

## Coverage and reference limits

The 20% calculation allocation is a supplemental-practice choice, **not a claim about official Ontario examination weighting**. Module allocations appear in the manifest. Questions cover relevant Class 1 operating subjects but this supplement alone is not a complete official blueprint-matched mock. Confirm the examination version and applicable resources through [OWWCO](https://owwco.ca/preparing-for-your-exam/) and [WPI's current criteria](https://gowpi.org/services/2025-need-to-know-criteria/).

Supporting references were checked on 2026-09-09:

- [WPI Distribution Class I criteria](https://gowpi.org/wp-content/uploads/2026/04/WaterDistribution-%E2%80%93-Class-1_mh-fin.pdf) and [Collection Class I criteria](https://gowpi.org/wp-content/uploads/2026/04/Collection-%E2%80%93-Class-1_final.pdf): subject coverage, not evidence that these original items appear on an exam.
- [EPA EPANET and its linked manual](https://www.epa.gov/water-research/epanet): distribution hydraulics, pumps, storage, pressure and water-age concepts.
- [EPA Small Drinking Water Systems Handbook](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=100046K6.TXT): general distribution operation and maintenance background.
- [EPA Cross-Connection Control Manual](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=2000262T.TXT): backflow principles and device application. Ontario installation requirements and device selection remain subject to applicable codes and approved site design.
- [EPA CMOM Guide](https://www.epa.gov/sites/default/files/2015-10/documents/cmom_guide_for_collection_systems.pdf): collection management, operation, maintenance, investigation and rehabilitation. US guidance is used for general principles, **not represented as Ontario law**.
- [CCOHS confined spaces](https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html), [lockout](https://www.ccohs.ca/oshanswers/hsprograms/lockout.html), and [hydrogen sulfide](https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/hydrogen_sulfide.html): safety background. Equipment, entry, excavation and chemical tasks require the applicable task-specific procedures and requirements.

Item references identify supporting subject material, not a claim of line-by-line expert certification. No universal notification deadline, disinfectant field dose, confined-space threshold or prescribed device-for-every-hazard rule is invented. Numerical dose scenarios are expressly arithmetic exercises. Safety questions test hazard recognition and use of the proper procedure; they are not instructions authorizing entry or repair work.

## Release handoff

1. Review the package and run the commands above. No mandatory individual approval workflow is added.
2. On an authorized environment, compare against **all rows** in each exact destination bank using `node scripts/class1-networks.mjs reconcile` with an explicitly supplied `DATABASE_URL`. Use read-only credentials. The command issues SELECTs in a rollback-only transaction and has no apply mode. It does not read `.env` automatically.
3. Resolve occupied question numbers, content conflicts and identical stems. Also review near duplicates against the full live content; exact matching alone cannot detect paraphrases. Check active, staged and rejected rows, and do not reactivate rejected content implicitly. Local seed examples or public totals cannot establish complete-bank deduplication.
4. After a verified backup, use a reviewed additive import for the exact package. Map only actual `questions` table columns; `formula`, `calculationExpression`, `decimalPlaces`, `unit`, `itemId`, `optionA`–`optionD` and `evidenceStatus` are package metadata. Store `options` as JSON text and preserve `steps` as JSON text. Publish the validated batch as `unreviewed`; do not fabricate an approver or individually gate each question.
5. Verify exact imported identities and counts, update bank metadata consistently with the existing import mechanism, and smoke-test practice, explanations, calculations, flashcards and mocks on both course routes. The UI may shuffle answers; verify keys remain correct. Only then report the batch as live.

**Current boundary:** content creation and local validation are complete. No production baseline, insertion, activation, count change or learner smoke test is claimed by these files. No schema migration is required for the existing question fields.
