# TX wastewater treatment, Class C (Narrow): review result

Bank: `tx-wastewater-treatment-c`. Status: review-only draft. Not imported, not published, not activated, no learner access.

## Scope

- Narrow. Only the 20 TCEQ wastewater treatment need-to-know categories, with Class C depth. Practice questions aligned to the TCEQ need-to-know categories; not the official exam blueprint. TCEQ publishes no exam weights or question counts, and none are claimed (see `config.json` purpose).
- Sources: TCEQ wastewater need-to-know page (last modified 2026-03-17) and the TCEQ license chart (revised 5/30/2025). The items cite these by source key only. No state rule citations, permit limits, set points or numerical design criteria are stated as facts.
- The dossier (`tx-operator-certification.md`, section 7) says the owner must accept Narrow before any candidate batch is written. This bank was written on the requester's instruction. That acceptance is not recorded in the dossier.

## Final counts

- 402 questions: 284 conceptual, 118 calculations. `config.json` count 402, calcCount 118.
- Per category: 20 each, except Permits and Activated Sludge with 21. Calculations per category: 3 (Statutes and Rules), 6 or 7 (others).
- Per topic: 40 topics, 4 to 17 questions each. The brief's 8 to 12 per topic is not met in every topic.
- Difficulty, conceptual: 116 easy, 119 medium, 49 hard. Calculations: 41 easy, 49 medium, 28 hard. This does not match the brief's 30/55/15 and 60/40 targets.
- Answer positions: A 100, B 101, C 100, D 101.
- Correct answer is the longest option in 27.8% of conceptual items (limit 35%) and the shortest in 10.6%.
- `lint`, `build` and `check` all pass on the final source.
- All 118 calculations recomputed with `python3 -I` from the stored expressions: 0 mismatches.
- No banned words (always, never, only, all, every, none, cannot, completely, entirely, solely) in any option.

## Reviewers

- One reviewer: `gpt-6.2-sol`, confirmed by `GET https://api.openai.com/v1/models` and called through the proxy with a placeholder bearer token.
- Gemini was not available and was not run.
- The reviewer is a model, not a human TCEQ-trained expert. The author was a single writer (Claude Haiku). Nothing here is an independent expert check.

## Round 1

- Chunks: 16 chunks of 25 and one of 2 (17 packets, 402 items). Each packet was built in a copy and given two planted errors: one answer key moved to a wrong option, and either a duplicate option (conceptual) or a changed key number (calculation). The bank files were not changed by planting.
- Planted-error catch rate: 34 of 34 (100%). The error types were structural and easy to see, so this says little about subtle factual errors.
- Other flags (not planted): 246. About 131 of these concern distractors that are implausible, obvious or giveaways. These are not fixed (see unresolved). The remaining flags were mostly key, explanation, stem or calculation wording.
- False positives: some flags said the key was correct but objected to a distractor or a stem. Some called two distractors near-duplicates when they are not. These were not changed. Examples include Q52 and Q272.

## Fixes (source only, rebuilt after each change)

- Keys and explanations corrected, including: the pump efficiency key (energy per unit volume is inversely related to efficiency at a given head); a pump-interval explanation that reversed the direction of change; a disinfection explanation that said temperature is not changed; the sludge-age key, which omitted solids lost in the effluent; the grit and screenings wording in calculations; a dechlorination calculation whose expression did not match its stated formula (1.7 corrected to 3.3); the dilution-ratio and dosing stems, which were ambiguous.
- Calculation stems clarified where the assumption was missing (wastewater versus water use, total dynamic head, no inflow, unit conversion stated).
- Wording: 17 options reworded to remove banned words. About 30 distractors lengthened or reworded so the key is not the longest option (lint, not reviewer). 61 questions had a stem or explanation changed after round 1.

## Round 2

- Round 2 ran on the 87 questions changed after round 1, with no planted errors, in three packets (30, 30 and 27). It returned 65 flags. The key, explanation and calculation items were fixed. The remaining round-2 flags are distractor or wording points and are open.
- The last edits after round 2 were checked by the builder only (lint, build, check, recalculation). They were not re-reviewed by the model.

## Unresolved items

1. Distractor quality: about 131 round-1 flags and part of the round-2 flags say the wrong options are implausible, obvious or giveaways. The brief requires plausible misconceptions. Many items do not meet that yet. Do not release before these options are rewritten and the bank is reviewed again.
2. Stem and key overlap: about 75 stems share a seven-letter or longer word with the key (mostly common process words such as clarifier, temperature and process). Rule 5 is not fully met.
3. Some stems remain incomplete, for example the confined-space definition question (Q47) and the pin floc question (Q197).
4. Class C depth: the items were written to Class C depth, but no check against the TCEQ Class C scope sentences was made. The dossier notes those sentences were not compared with Class D.
5. Level mix and topic counts differ from the brief (see Final counts).
6. Not compared with the official TCEQ exam. No weights or question counts are claimed.
7. Dossier decision: section 7 of the dossier requires the owner to accept Narrow before a batch is written. That acceptance is not recorded.
8. Single writer, no second writer. One reviewer model. Gemini unavailable.

## Distractor fix pass

Scope: `source/conceptual.txt` and `source/calculations.txt` only. Rebuilt with `build`; `lint` and `check` pass. Still review-only: not imported, not published, no learner access.

Counts (compared with commit f4c11c0f):

- Distractors rewritten: 284 conceptual wrong options in 152 of 284 rows, and 13 calculation wrong-value fields. The brief's test of "plausible mistake" was applied by one reviewer model (see below), not by a TCEQ-trained operator.
- Stems reworded: 88 conceptual stems. Keys: wording changed in 16, 46, 96, 100 (lengthened) and 81, 152, 165 (length cue only). Row 283 changed in meaning: the keyed "common error" was a correct procedure (squaring the radius and converting cubic feet to gallons). It is now "Multiplying the diameter by the depth and leaving out pi", which is the actual error. This was a key error in the original commit.
- Calculations: expressions and keys are unchanged. All 118 keys were recomputed with `python3 -I` from the stored expressions: 0 mismatches, and no wrong value equals its key. No arithmetic error was found in a calculation key.

Overlaps fixed:

- Stem and key sharing a word of 7 or more letters (generic domain words "operator" and "plant" are not counted): 69 stems (19 where the word appears only in the key) before; 0 after.
- Shorter distinctive repeats that the reviewer found (for example "flow basis", "peak flow", "hot spot", "blower", "sag", "foam", "fecal", "inflow", "trend", "return rate"): 16 stems reworded.

Longest and shortest correct answer (checker cue, conceptual rows):

- Longest: before 27.8% (79 of 284), after 21.8% (62 of 284). Target was about 30%.
- Shortest: before 10.6% (30 of 284), after 17.3% (49 of 284). The limit is 35%. Lengthening distractors moved some correct answers to the short end.

Review: GPT `gpt-6.2-sol` through the proxy (model id confirmed with `GET /v1/models`). Chunks of about 25 items; each chunk had 2 planted distractor problems.

- Round 1 (179 changed conceptual rows, 13 calculation rows): planted items caught 18 of 18 (blatant planted problems: a joke distractor and an absolute word). Real changed rows flagged: 164 of 192.
- Round 2 (after round-1 fixes; 182 conceptual and 13 calculation rows): planted items caught 18 of 18 (subtler problems: an irrelevant option, and a stem repeating a key word). Real changed rows flagged: 166 of 195.
- Round 3 (18 rows edited after round 2: absolute words, stem repeats, length cues): planted items caught 2 of 2. Real rows flagged: 15 of 18.
- Catch rate overall: 38 of 38 planted items. The planted problems were deliberately obvious, so this shows the reviewer detects obvious faults. It does not show that the remaining distractors are plausible.

What remains:

1. Distractor plausibility. The reviewer flagged most changed rows in every round (about 85% of real rows), mainly as "irrelevant to the question" or "implausible", and some as absolute claims. These need a rewrite by someone who knows the TCEQ Class C material, not another mechanical pass. Calculation wrong values were kept when they trace to a real slip (a missing constant, a decimal shift, an inverted ratio), even where the reviewer called them absurd (for example 54,000 hp).
2. Row 37: the stem and key share "basis" and "sizing". Not fixed.
3. Words shared between stems and keys that are not 7 or more letters are only partly covered. The reviewer's findings for these are fixed in the rows listed above, not all rows.
4. Difficulty mix, per-topic counts and answer-position counts were not changed in this pass. The "Final counts" section above still applies.
5. Dossier gate: section 7 of `docs/us-launch/state-dossiers/tx-operator-certification.md` (on `claude/tx-dossier`) requires the owner to accept Narrow before any candidate batch. That acceptance is not recorded.
6. Not compared with the official TCEQ exam. Reviewer is a model, not a human expert.
