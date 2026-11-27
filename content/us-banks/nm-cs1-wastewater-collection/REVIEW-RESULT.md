# Review result: New Mexico Wastewater Collection System Level 1 (CS1) bank

Bank `nm-cs1-wastewater-collection`, version 2026-11-27-v1. Local draft: not imported, not activated, not published. Question numbers 1 to 250 are proposed, not reserved in production.

## Rebalance v2 (2026-11-27)

This section supersedes the counts, review and checks below, which describe version 2026-11-27-v1. Config version is now 2026-11-27-v2.

### Scope decision: no Regulations module

The brief asked for about 8 Regulations questions (20.7.4 NMAC, 20.6.2 NMAC). None were written. The guidebook names only the three rule titles, with no clause-level content. The dossier bars regulatory items until a clause-specific primary source and an independent qualified review exist. The Regulations target is therefore unmet (0 of about 8). Total stays at 250.

### Module counts, before and after

| Module | v1 | v2 |
| --- | --- | --- |
| Collection system | 53 | 53 |
| Lift stations (split from Lift stations and mechanical systems) | 38 (combined) | 14 |
| Mechanical systems (38 conceptual, 12 calculation) | - | 50 |
| Wastewater characteristics | 24 | 24 |
| Units and flow concepts | 11 | 11 |
| Safety awareness | 22 | 42 |
| Cross-connection control | 12 | 8 |
| Sampling and measurement | 18 | 5 |
| Collection system math | 20 | 20 |
| Flow and hydraulics math | 24 | 10 |
| Removal and loading calculations | 20 | 9 |
| Units and conversions | 8 | 4 |
| Regulations | 0 | 0 (not written) |
| Total | 250 (178 conceptual, 72 calculation) | 250 (195 conceptual, 55 calculation) |

Area view, using the guidebook areas (lift stations sit under Collection Systems; calculations under General):

- Collection systems: 87 (target about 80). The bank is 7 over because the Regulations slot is empty and the total must stay at 250.
- Mechanical systems: 50 (about 50).
- General: 58 (about 58). Wastewater characteristics and units and flow stay at 35. Calculations under General fell from 52 to 23.
- Safety: 42 (about 42).
- Regulations: 0 (about 8, not written, see above).
- Cross-connection control: 8 (about 8).
- Sampling and reporting: 5 (about 5).

Step 3 of the brief asked to raise General conceptual rows to about 58. That was not done. General conceptual is still 35, because raising it would have pushed the bank past 250 while keeping the target area totals. The area totals are the binding targets.

### What was removed

- Cross-connection control, 4 rows: a closed-valve leak statement, the air gap definition, a survey-hazard question, and the dual-check valve purpose.
- Sampling and measurement, 13 rows. Kept: composite sampling purpose, grab versus composite, H2S, methane, and effluent toxicity. Removed: the other grab and composite rows, sample preservation and labelling, holding time, chain of custody, duplicates, combustible gas detector, acute toxicity, lift station gas, oxygen deficiency and force main odor.
- Calculations, 25 General rows: 7 flow and velocity, 7 slope and invert, 7 removal, 4 units. The 4 chemical dosing rows (chlorine and chemical dose) were moved to Mechanical systems and kept.

### What was added

- Safety awareness, 20 conceptual rows: fire triangle, first aid purpose, safety program purpose, street hazard, exposed couplings, hydrogen sulfide and smell, exposure routes, wet surfaces and shock, near-miss reports, heat stress, manhole fall, working alone, chlorine, signal word, screenings, housekeeping, ventilation, guardrails, coasting machinery, portable extinguisher. All are awareness level. None gives a procedure, emergency step or entry step.
- Mechanical systems, 14 conceptual rows: pump shutoff, NPSH margin, pump curve, wear rings, motor voltage and amperage, service factor, butterfly valve, reducing valve, air release, feeder calibration, strainer, electromagnetic meter, totalizer, pulsation damper.
- Mechanical systems, 8 calculations: water horsepower, psi to head, three-phase kW, pump efficiency, motor speed with slip, feed pounds per day from solution strength, total dynamic head, kW to hp.

The rebalance was applied to the local draft only. Numbering shifted, which is acceptable here because nothing is imported. Lift station rows were relabelled, not rewritten.

### Review

- Reviewer: GPT gpt-6.2-sol through the agent proxy (id from GET /v1/models). Gemini was not used. The reviewer is the only independent check.
- Pass 1: 46 new or changed rows (34 conceptual, 12 calculation), two chunks (25 and 21), two planted errors per chunk. Planted: 2 marked keys moved to a distractor, 1 explanation negation flipped, 1 stem constant changed. Caught 4 of 4.
- Pass 1 non-planted flags: 16 rows. All fixed. Twelve were content: a defensible distractor, an overstated explanation, a stem asking about likelihood where the key was about severity, and a necessary condition stated as sufficient. Four were basis gaps, fixed by stating the 8.34 factor, brake horsepower, and a by-weight concentration.
- Pass 2: the same 46 rows after fixes, with two planted errors per chunk again. Caught 4 of 4. Non-planted flags: 4 (two defensible distractors, two stems too broad). All fixed.
- Verification calls on the edited rows: 3 further flags (NPSH explanation precision, a motor explanation, a cause-and-effect reversal). All fixed. The last NPSH explanation wording was not sent back to GPT.
- Catch rate: 8 of 8 planted errors across the two passes (100%). The sample is small, so this is not a reliable measure of accuracy.
- A human or subject-matter reviewer has not seen the new rows.

### Checks run

- `node scripts/us-bank.mjs lint nm-cs1-wastewater-collection`: valid.
- `node scripts/us-bank.mjs build nm-cs1-wastewater-collection`: valid, answer positions balanced.
- `node scripts/us-bank.mjs check nm-cs1-wastewater-collection`: exit 0.
- Calculations recomputed with `python3 -I` from the expressions (exact rationals, half-up rounding): 55 of 55 match the built answers. No wrong value equals the answer at the stated decimal places.

### Limits (v2)

1. Regulations are absent. Adding them needs an NMED clarification or a current clause-level source, plus independent review.
2. Calculations are 22% of the bank (brief: about 30%). This was the trade-off for holding General at 58.
3. Collection is 7 over its target, and Mechanical is on target.
4. Safety awareness items still need a qualified safety reviewer before release.
5. Not imported, activated, published or pushed. Local branch commit only.

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
