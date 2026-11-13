# Class 1 Water Treatment and Wastewater Treatment — 500 new practice questions

This completed authoring package adds **250 Water Treatment and 250 Wastewater Treatment candidates**, each comprising 200 conceptual/application questions and 50 worked calculations. It replaces the missing, never-pushed Treatment draft; it does not recover or claim to reproduce that old draft word for word.

| Package | Exact destination bank | Proposed numbers | Questions |
| --- | --- | --- | --- |
| Water Treatment | `class1-water` | 2001–2250 | 250 |
| Wastewater Treatment | `class1-wastewater` | 2001–2250 | 250 |

The Wastewater learner route is `/class1-ww`; the physical bank is `class1-wastewater`. Do not import to `class1`, `class1-ww` or a `wpi-` bank. These additions are separate from Distribution/Collection PR #79 and the historical 1,601-row repair package. Together the two expansion PRs contain 1,000 candidates, 250 for each Class 1 stream. They are not live merely because the files were pushed.

## What to read

`REVIEW.md` displays all questions, four shuffled choices, keys and explanations. `questions/*.json` are deterministic release candidates. `source/*-01.txt` through `*-04.txt` are the authored conceptual batches; `source/*-math.txt` contains 50 distinct calculation exercises per stream. The correct choice is first in authoring text for maintenance, not in learner delivery JSON.

Canonical keys are balanced 63/63/62/62 per bank and shuffled reproducibly. Topic-specific distractor revisions removed irrelevant choices, strong length cues and all-wrong-option qualifier patterns. Two conceptual overlaps with the repaired historical bank were replaced by application scenarios. Every numerical exercise includes a formula, expression, independently specified expected value, units, precision and three worked steps. Math is checked with Decimal arithmetic and separately in JavaScript.

All questions were read during authoring and the editorial pass. These are original supplementary practice questions, not leaked exam items, an official weighted mock, regulator-approved content or independently certified SME material. Passing automated checks does not prove that every distractor will discriminate well with learners. Difficulty and cognitive labels are author judgements; no psychometric calibration is claimed.

## Validation

```sh
python3 scripts/class1-treatment.py check
pnpm exec vitest run server/class1TreatmentPackage.test.ts
python3 scripts/reconcile-class1-treatment.py /path/to/current-question-export.json
```

The package tests run through normal test discovery. They check regeneration, identities, keys, checksums, calculation results, bounded numeric choices and the existing answer-cue detector. Reconciliation has no database connection and no write mode. It reads the supplied export and reports occupied numbers, exact stems and lexical similarities. Its snapshot counts cannot prove current production completeness or exhaustive semantic deduplication.

`repaired-baseline-reconciliation.json` records comparison with the supplied full repaired historical preview (555 Water, 565 Wastewater rows). Its SHA identifies that snapshot, not a newly fetched live export. Refresh reconciliation after any production changes. Conceptual TF-IDF review also compared all candidates within each bank and against that preview; see `editorial-review.json` for the threshold and dispositions. Mathematical skills intentionally recur with different supplied problems; they are not claimed to be entirely new competencies.

## Controlled additive release for Manus

1. Confirm current application and authoritative question export; reconcile against all statuses in the exact destination banks. Do not overwrite an occupied number or reactivate a rejected row implicitly. Review close conceptual matches, not just identical stems.
2. Verify a recoverable production backup. Use a reviewed additive importer after the agreed batch review. This package contains **no auto-import, database writer or schema migration**.
3. Map only real schema columns. Persist sourceTitle, sourceReference, sourceUrl, blueprintObjective, topic, cognitiveLevel and the canonical answer index. Serialize `options` and `steps` as the existing schema requires. Fields `itemId`, `correctAnswer`, `optionA`–`optionD`, `formula`, `expression`, `expected`, `decimalPlaces`, `unit` and `evidenceStatus` are package metadata, not blindly insertable database columns.
4. Respect the agreed batch release decision without adding mandatory per-question approval. Source status is `unreviewed`; that status may be learner-visible under the application policy, so importing is a separate release action. Do not falsely attribute an approver or treat a draft staging import as invisible without checking the actual policy.
5. Preserve existing IDs, content and learner history. Refresh bank counts and cache/version metadata using the application's existing mechanism. Verify exact new identities rather than relying only on public totals.
6. Smoke-test both actual course routes: practice, answer-key correctness under display shuffling, explanations, formula steps, flashcards and mock selection. Confirm server-issued mock behaviour remains intact. Then report the number of newly available questions.

No source verification limitation authorizes an invented legal threshold. Numerical operating values in exercises are supplied assumptions, not universal limits or permission to apply a dose in the field. See `SOURCES.md`.
