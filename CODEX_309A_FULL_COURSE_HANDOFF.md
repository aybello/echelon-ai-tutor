# Codex Handoff — Ontario 309A Free Full Course and 500-Question Bank

## Mission

Turn the existing public **Ontario 309A Electrician — Construction & Maintenance** preview into a free Echelon Institute course with practice, a 100-question mock exam, flashcards, study notes, progress, and a growing original 500-question bank. Do not add Stripe pricing, paid entitlements, Teams assignment, or Canadian Electrical Code rule-number content in this build.

The governing files and documentation are already present:

| Asset | Purpose |
|---|---|
| `shared/certificationPrograms.ts` | Trade-specific lifecycle and source governance |
| `shared/electrician309aBlueprint.ts` | Current-exam blueprint and task matrix |
| `docs/309a-authoritative-source-facts.md` | Source facts and exclusions |
| `docs/309a-500-question-blueprint.md` | Exact 500-question allocation |
| `content/309a/309a-allocation.json` | Machine-readable MWA and task targets |
| `content/309a/current-exam-source-manifest.json` | Versioned official-source metadata and retrieval hashes |
| `content/309a/309a-question.schema.json` | Authoring/import contract |
| `docs/309a-diagram-specifications.md` | Original SVG/React diagram pack |
| `docs/309a-production-governance.md` | Required data model, review controls, free-beta policy, and claims rules |

## Non-negotiable product policy

The course is **free while the bank is built**. It must be visible through the existing Electrician Preview navigation entry, but its course workspace must state **Free public beta — question bank in active development**. It must remain no-indexed until Echelon Institute decides otherwise. It must not become paid, team-assignable, or a claim of official Red Seal preparation.

The only official curriculum basis is the current Red Seal previous-RSOS Construction Electrician matrix. Red Seal identifies the newer RSOS exams as under development.[1] The target course mock is a 100-question, four-hour, 70% pass-threshold practice experience, matching the Red Seal preparation guide’s public format information.[2]

## Required architecture

1. **Add a beta release channel, not a lifecycle shortcut.** Preserve the meaning of existing program lifecycles. Implement the separate program/bank release channel and content-review state model in `docs/309a-production-governance.md`. A public-beta selector may return only server-verified `beta_approved` items from an active beta bank version; it must never return ordinary `in_review` content.
2. **Keep the existing preview.** `/electrician-309a-demo` remains a 10-question product demonstration. It should link clearly to the new full-course practice route when at least 15 public-beta items exist.
3. **Create full-course routes.** Add `/electrician-309a` for practice, `/electrician-309a-mock` for a 100-question four-hour mock, `/electrician-309a-flashcards` for module cards, and `/electrician-309a-notes` or the existing workspace Notes panel. Reuse existing Echelon course shells rather than recreating layouts.
4. **Use governed database-backed content.** Add the normalized persistence model defined in `docs/309a-production-governance.md`; do not represent question, note, flashcard, diagram, task, source, review, import, or version history only as React constants or repository JSON. Existing `questions`, `question_bank_meta`, and `module_overviews` may remain compatibility surfaces, but delivery must be driven by the governed active bank version.
5. **Allow free access intentionally.** Add `electrician-309a` to the free-access logic in `server/_core/access.ts` without changing access behaviour for any paid water/wastewater course. Do not create a dummy purchase or entitlement.
6. **Do not force 309A into `courseRegistry.ts` unchanged.** That registry encodes water-specific region/track/class/product assumptions. Prefer the existing certification-program registry or extend the shared model only with deliberately trade-neutral fields and full regression coverage.

## Bank import contract

Use `bankKey: "electrician-309a"` and a bank-version-local `bankItemNumber: 1..500`; never overload a global primary key as a content number. Every item must validate against `content/309a/309a-question.schema.json` before import. Persist the question fields already supported in `drizzle/schema.ts` plus the version, task, provenance, content-hash, publication, and review fields required by `docs/309a-production-governance.md`.

Create the initial governed bank version from `content/309a/309a-allocation.json` and tie it to `content/309a/current-exam-source-manifest.json`. Create compatibility metadata with exact module targets `{ "A": 55, "B": 140, "C": 150, "D": 105, "E": 50 }`, `totalQuestions: 500`, `contentVersion: 1`, the blueprint version from `ELECTRICIAN_309A_BLUEPRINT_VERSION`, `minCalcPerMock: 20`, and `recallTargetPct: 25`. Notes, flashcards, diagrams, and rationales must have their own governed source/review/publication records.

## Question-writing instructions

Write **original** questions only. Follow `docs/309a-500-question-blueprint.md` exactly, including task allocations. Use four options and a single defensible answer. Create meaningful distractors based on common conceptual, calculation, sequencing, or troubleshooting errors. Explain why the answer is right without adding generic repair narration.

Use public official sources for blueprint references. First-release content can be imported as `draft` or `editorial_approved`, but it cannot be delivered publicly until a separate qualified technical review changes it to `beta_approved`. The public-beta selector—not the commercial selector—is the only delivery path for beta-eligible content. Do not write CEC rule/table lookups, proprietary manufacturer-programming steps, copied Red Seal samples, unsafe energized-work procedural steps, or unverified numerical requirements.

Write in five batches aligned to Major Work Activities: A=55, B=140, C=150, D=105, E=50. Generate an accompanying immutable content manifest per batch with question-number range, task totals, source URLs, diagram IDs, reviewer status, and SHA-256 checksum.

## Diagrams and flashcards

Implement the 16 original editable React/SVG diagrams defined in `docs/309a-diagram-specifications.md`. Store diagram components under `client/src/components/electrician309a/`; do not place static media in the project tree. If a raster asset is ever needed, follow the project storage policy and upload it through webdev storage.

Create at least 150 flashcards from the 500-question bank, weighted proportionally by Major Work Activity. Cards should test terminology, relationships, formulas, fault paths, equipment purpose, and diagram labels; they must not merely repeat full multiple-choice stems.

## Required automated checks

Add a dedicated 309A bank validation suite and run it on every content change. It must assert:

1. Exactly 500 unique bank-version-local `bankItemNumber` values from 1 through 500.
2. Exact Major Work Activity and task-level allocations from `docs/309a-500-question-blueprint.md`.
3. Exactly four non-empty, unique answer options and a `correctIndex` from 0 to 3.
4. Non-empty explanations, source title/URL/reference, blueprint objective, topic, and review status.
5. All question sources resolve to the versioned source manifest, carry a permitted rights basis, and all questions use the current blueprint version.
6. No question contains a CEC rule/table lookup, copied sample wording, "all of the above," or "none of the above."
7. Calculation questions have `steps` and a `tip`; the mock can select at least 20 calculation questions.
8. Each diagram-backed item references an existing diagram ID with alt text.
9. The public-beta selector excludes `draft`, `editorial_approved`, `technical_approved`, `rejected`, stale-blueprint, retired, and rights-blocked questions.
10. Existing water/wastewater course registry, entitlement, and mock-exam regression suites remain green.

## Delivery sequence

Commit the architecture and validation suite first. Then ship A, B, C, D, and E as separate reviewable content commits, each with bank validation. Add study notes and diagrams alongside the corresponding Major Work Activity rather than leaving a generic placeholder. Only after all five batches validate should the 100-question mock, flashcards, and full-course entry be turned on. Keep the public demo available throughout.

## Acceptance gate

The handoff is complete only when `pnpm check`, `pnpm test`, `pnpm build`, the existing migration checks, and the new 309A bank validator all pass. Confirm the public beta has no paywall, no Teams assignment, no commerce product, clear beta language, reviewer-separation evidence, an emergency unpublish action, and no public claims that the content is official or guaranteed to produce a pass.

## References

[1]: [Red Seal Program — Construction Electrician](https://red-seal.ca/eng/trades/const-elect.shtml)
[2]: [Red Seal Program — Examination preparation guide](https://red-seal.ca/eng/resources/exam-prep-guide.shtml)
