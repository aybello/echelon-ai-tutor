# Review result: New Mexico Wastewater Collection System Level 1 (CS1) bank

Bank `nm-cs1-wastewater-collection`, version 2026-11-27-v1. Local draft: not imported, not activated, not published. Question numbers 1 to 250 are proposed, not reserved in production.

## Scope and limits of the source

- Dossier: `docs/us-launch/state-dossiers/nm-wastewater-collection.md` (verdict Suitable, retrieved 2026-10-29). Queue rule "Suitable gets a full 250" was applied as instructed. The dossier itself calls its scope a limited technical boundary and says it does not authorize a question bank. The owner should confirm that before any import.
- The NMED CS1 guidebook (service.web.env.nm.gov, March 2026) returned HTTP 403 through the agent proxy. Its topic headings were not checked. Topics follow the dossier's supported objectives. The certification page and 20.7.4 NMAC were reachable but were not used to write or check items.
- Excluded by the dossier and checked by a term scan: CS2, SWW, population bands, permits, reporting deadlines, regulatory limits and site procedures. Safety items (22) are awareness-level only, as the dossier's supported objectives allow. No procedure, emergency or entry steps. A term scan flagged words such as "excavation", "confined" and "permit" in options; each was read and found to be awareness or benign.
- Distractor and key content was written in this session; no sentence is copied from the guidebook, a past exam or another bank.

## Reviewers

- Second model: GPT gpt-6.2-sol (OpenAI, via the agent proxy; the id was taken from GET /v1/models).
- Author-side checks: Haiku 5.5 (writer and fixer). Arithmetic recomputed with `python3 -I`.
- Not done: no Opus review (the queue names one), no human subject-matter review, no review by a second Claude model.

## Chunks and planted errors (pass 1)

- 10 chunks of 25 questions in build order (1-25 through 226-250).
- Two planted errors per chunk, applied only to the copy the reviewer saw: 10 key swaps (correct option moved to a distractor), 7 conceptual explanation word flips, 3 calculation constant swaps (for example 7.48 changed to 8.34 in the stem).
- Caught: 19 of 20 (95%). Key swaps 10 of 10. Explanation flips 6 of 7. Constant swaps 3 of 3. The miss was item 167 (explanation said "after" for "before").

## Real problems and fixes

- Pass 1 flagged 24 non-planted items. One was a false positive: item 33 (scope), which concerns stoppage response concepts named in the dossier outline. The other 23 were changed.
- Pass 2 (after fixes, no planted errors) flagged 20. Item 33 again (same false positive), 19 changed.
- Distinct questions changed after review: 37. By type: key or stem that could mislead, 13 (for example the dead-end main direction, the drop manhole key, a stem that asked for a "usual" practice); distractor that could be defended, 3 (for example a dye-testing option that dye tracing can also support); scope, 2 (a primary-treatment item and a backflow-tester-certification item, both replaced with collection or cross-connection concepts); explanation precision, 12; calculation wording, 7 (a stem that did not state the inflow assumption, an ambiguous "times 8.34" formula phrase).
- Not re-reviewed: the 19 pass 2 fixes were not sent to GPT again. No third pass was run.

## Counts

- 250 questions: 178 conceptual, 72 calculation (`config.json`: count 250, calcCount 72).
- Conceptual difficulty: 53 easy (30%), 98 medium (55%), 27 hard (15%). Calculations: 43 medium (60%), 29 hard (40%).
- Modules: Collection system 53; Lift stations and mechanical systems 38; Wastewater characteristics 24; Flow and hydraulics math 24; Safety awareness 22; Collection system math 20; Removal and loading calculations 20; Sampling and measurement 18; Cross-connection control 12; Units and flow concepts 11; Units and conversions 8.
- Answer positions: A 62, B 62, C 63, D 63 (builder blocks of four).
- Longest option is the key in 30.3% of conceptual items (limit 35%). Shortest in 27.0%.
- Duplicate stems: none. Duplicate option sets: none.

## Checks run

- `node scripts/us-bank.mjs lint nm-cs1-wastewater-collection`: valid.
- `node scripts/us-bank.mjs build nm-cs1-wastewater-collection`: valid, answer positions balanced.
- `node scripts/us-bank.mjs check nm-cs1-wastewater-collection`: exit 0 (no stale generated file).
- Calculations: all 72 recomputed under `python3 -I` from their expressions; 0 mismatches; no wrong value equals the key at the stated decimal places.

## Limits

1. Source scope: the dossier's own wording is narrower than a full bank (see above). The owner should decide before import.
2. Topic coverage was not checked against the NMED guidebook, which the sandbox could not reach.
3. Review is GPT-only plus self-checks. An Opus or human reviewer has not seen the bank. Catch rate (19/20) is measured on 20 plants, so it is a rough figure.
4. Safety awareness items (22) need a qualified safety reviewer before release, even though they contain no procedures.
5. Not imported, activated, published or pushed. Local branch and commit only.
