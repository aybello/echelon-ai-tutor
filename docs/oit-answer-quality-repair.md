# OIT answer-quality repair — September 9, 2026

The old `peersFor` generator explicitly preferred different modules when choosing distractors. This created a relevance giveaway: the disinfection item could offer pump, membrane and flocculation statements. Merely balancing option length did not fix that design.

This revision authors new alternatives for all **782 conceptual questions**, including the eight capstone items. It retains **972 questions overall: 489 Water and 483 Wastewater**, including all **190 unchanged calculation records**. No question IDs, keyed answer positions, stems, source references, explanations or excluded-item decisions change. Correct-answer wording is shortened or clarified where needed while preserving the intended concept; existing explanations retain the fuller explanation.

## What changed

- Water `1039` now contrasts residual, contact time, nominal basin volume and applied dose. It no longer offers unrelated membrane, pump and floc facts.
- Water `1042` uses the plausible numerical errors of adding dose and residual, mistaking residual for demand, and dividing the values. Its correct demand remains 1.4 mg/L.
- Wastewater `1031` distinguishes recirculating sludge from removing system biomass.
- Wastewater `1055` contrasts real disc rotation/oxygen-transfer principles and unsafe restart assumptions. The adjacent trip-response item retains explicit isolation and lockout before fault investigation and approved restart.
- All other conceptual items now use alternatives specific to their own process, task or assessment objective. Some beginner safety distractors remain clearly unsafe by design; difficulty and real learner discrimination are not established by automated checks.

The original long-answer detector flagged **29 items** (15 Water, 14 Wastewater). It flags **zero** in this revision. Additional checks cover extreme short keys, systematic longest/shortest keys and one family of qualification giveaways. These checks are heuristics, not a claim that software can certify instructional quality.

Token overlap no longer blocks plausible same-topic alternatives. For example, multiplication versus division or addition versus subtraction can share nearly every word while testing a meaningful error. Exact duplicate alternatives remain prohibited, and all generated choices must match the complete authored source. Existing stem-duplicate, numeric recomputation, answer-position and safety checks remain active.

## Verification and reproducibility

Run the following from the repository root:

```bash
node scripts/content/build-oit-question-banks.mjs
node scripts/validate-oit-question-banks.mjs
node node_modules/vitest/vitest.mjs run server/oitEditorial.test.ts server/oitQuestionBankPackage.test.ts server/oitRelease.test.ts
node node_modules/typescript/bin/tsc --noEmit
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.scripts.json
node scripts/release-oit-question-banks.mjs
```

The last command is repository-only and prints the checksum for the revised payload. Use that checksum rather than a token from the earlier package. The automated Quality Gate already runs package validation and discovers the new deterministic tests. Database importer tests remain in the dedicated database stage.

Local results: all 31 focused tests and both TypeScript configurations passed. Regeneration reproduced the same manifest and question files byte-for-byte. Comparison with the preceding local commit confirmed that only conceptual alternatives and 275 correct-answer phrasings changed (209 Water, 66 Wastewater); all other question fields and every calculation record remained identical. Revised payload checksum: `6e82fadaee5015bd5652a9af670905a7f8866e51258be7d535c137a8928a91d5`.

Representative technical references checked during editing: [CDC water-treatment processes](https://www.cdc.gov/drinking-water/about/how-water-treatment-works.html), [EPA municipal wastewater primer](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=20017KBE.TXT), [EPA RBC operational material](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=20016O8D.TXT), and [CCOHS hydrogen-sulfide hazards](https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/hydrogen_sulfide.html). Existing item-specific references remain attached. This is an authored content repair, not independent regulator approval or a measured improvement in exam outcomes.

## Release status

No production database import, content replacement or activation was performed. Public inventory totals cannot identify exact package rows. The [batch-release instructions](oit-batch-release.md) require complete read-only reconciliation, verified backup and exact payload comparison. If previous variants already exist, stop on the reported conflict; do not overwrite them through a broad status or content update. Authenticated practice, flashcard and mock serving checks follow a controlled release.

Per the product decision, no mandatory individual question approval is introduced.
