# Exam-specific game authoring pipeline

## Implemented first stage (offline, not activated)

`scripts/content/game-pipeline.mjs` stages existing server-only packages with their item-level source URLs and produces course/mode coverage. It does not call a model, upload books, access a database, edit the registry, activate a course, or deploy. Its output contains answers and must remain private, outside `client/` and `public/`.

Run from repository root (new output files only; overwrite is refused):

```
node scripts/content/game-pipeline.mjs stage server/interactiveContent/release-2026-11-12 /tmp/game-authoring.json
node scripts/content/game-pipeline.mjs report /tmp/game-authoring.json /tmp/game-coverage.json
env -i PATH="$PATH" HOME=/tmp NODE_ENV=test node --require ./scripts/test-safety.cjs --test scripts/content/game-pipeline.test.mjs
```

500 means **500 distinct exercises per course per mode, across easy/medium/hard**, not 500 in each difficulty. A speed-match board counts as one exercise, not one exercise per pair; changing order or an ID does not create another exercise. Difficulty proportions are not fixed without blueprint and learner evidence. Same-body duplicates are discounted; semantic near-duplicate review is still required.

At commit e2265aba the actual inventory is 3,821 items, all with at least one source URL, over 38 courses / 228 course-mode combinations. The full target is 114,000 exercises. Raw numerical inventory gap is 110,179, before duplicate/quality review. No existing item is silently upgraded to technical approval or assigned a guessed difficulty. Staging therefore starts with zero complete **new authoring review records**, not a claim that all existing content is incorrect or has never been AI-reviewed.

## Authoring record

Each record retains the exact renderer `item` and its canonical SHA256, course key and prior package version. Additional fields: concept ID, exact blueprint objective, jurisdiction, difficulty + reason, claim classification and sources. Sources require title, locator (page/chapter), checked date, and URL or private document ID; edition should be recorded when applicable. Regulatory claims additionally require authoritative URL and exact section. Copyright ownership and commercial reuse permissions require separate checking; a Drive copy is not permission to republish text or diagrams.

Review remains `unreviewed` until actual review occurs. The completeness checker requires a named human technical review, date and evidence reference, bound to both the item hash and `reviewHash(record)` (all metadata excluding review). AI-review history may be retained as separate evidence but cannot impersonate human sign-off. Metadata validation does not verify reviewer identity, source correctness or legal rights, and must not be represented as such. Do not stamp review fields automatically merely to pass checks.

## Grounded integration design / next stages

1. Inventory textbooks privately by exact edition and chapter/page; OCR scans with page anchors and uncertainty flags. Keep copyrighted source bytes outside source control and client bundles. Supplement older technical books with current official jurisdiction-specific regulations.
2. Map concepts to actual `shared/courseRegistry.ts` course keys and current exam blueprints. Do not cross-map water, wastewater, distribution, collection or jurisdictions just because terms overlap.
3. Reuse verified concepts from existing question banks, not literal question-to-game conversions. `drizzle/schema.ts` questions already carries bankKey, difficulty, topic, cognitiveLevel, sourceTitle/sourceReference/sourceUrl, blueprintObjective and reviewStatus. An approved source question is not automatic approval of a transformed game item.
4. Draft mode-specific exercises with an explanation and plausible distractors. Easy: recall; medium: one-step application; hard: multi-step diagnosis/interpretation, not obscure wording. Keep learner difficulty separate from operator licence class.
5. Check structural validity using the runtime schema, compute math independently, review ambiguity and semantic duplicates, check source currency/jurisdiction, then obtain technical review. A matching board needs every pair supported; before/after needs an explicit process context.
6. Use coverage gaps by course/mode/difficulty/topic to assign the next batch. Run a small OIT pilot first rather than filling quota by repeating prompts.
7. A future export must run the runtime schema, enforce independently verified review/approval, and write immutable server-only package shards. It must not overwrite old release evidence. Publishing and production data changes are separate steps.

## Current runtime constraints / not yet implemented

`server/interactiveContent/schema.ts` currently caps **all examples in a course package at 300**. That cannot hold 6 × 500 exercises. Before any large release, introduce server-side paginated/sharded retrieval and bounded selection while preserving exact-course entitlements and fixed previews. Do not simply raise the limit and send 3,000 answer-bearing exercises to the browser.

The current renderer schema is strict and has no difficulty/provenance fields. Keep authoring metadata in server-only sidecars; add a separate safe public difficulty selector and server filter in a later runtime change. This staging tool does not claim that selector or adaptive learning is live.

Not implemented by this first stage: textbook ingestion/OCR, automatic generation, factual verification, runtime difficulty filtering, secure reviewer identity enforcement, package export/registration, progress persistence, or 500-item banks. No production database write is required to run this tool.
