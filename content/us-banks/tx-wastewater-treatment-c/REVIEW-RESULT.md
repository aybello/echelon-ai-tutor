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
