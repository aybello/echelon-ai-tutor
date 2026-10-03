# Ontario Class II exam question drafts — September 23, 2026

Four draft banks contain 250 original multiple-choice items each:

| Bank key | Exam | Items | Calculation items |
| --- | --- | ---: | ---: |
| `class2-water` | Water Treatment II | 250 | 25 |
| `class2-water-dist` | Ontario Water Distribution II | 250 | 25 |
| `class2-wastewater` | Wastewater Treatment II | 250 | 25 |
| `class2-wastewater-coll` | Wastewater Collection II | 250 | 25 |

Every draft has a stem, four options, keyed answer, explanation, topic, module, a family-level primary-source link and reference note. Calculation items also include formula, substitution, and result. All 1,000 have `reviewStatus: "in_review"` and `questionNum: null`. They are **not** learner-visible and have not been imported into the production database.

## Editorial and technical status

This is a structured drafting package, **not a validated or publishable exam bank**. The WPI and OWWCO need-to-know documents inform topic coverage. They do not prove individual answers. The source link and note attached to each item identify a likely primary reference for review; they are **not** a claim that an Ontario subject-matter expert has checked that exact question, distractors, or wording against the linked page. Site-specific operating procedures and current Ontario regulatory obligations need separate verification. Some equipment concepts recur across exam types with setting-specific wording because the operating principles apply in multiple facilities.

The Water Distribution bank follows the separate Ontario Water Distribution Class II guide. OWWCO also describes a standardized **Water Distribution and Supply** exam; this package does not substitute that blueprint without a separate mapping. The WPI 2025 topic maps for the other three banks are provisional until the applicable Ontario exam authority confirms the version in use.

The module counts were scaled into five-question drafting families; they are editorial targets, not an assertion about exact current examination weighting. The generator uses 50 topics per bank with five distinct operating cases per topic. This format makes batch review easier, though an SME should also assess whether any five-case group is too repetitive or too easy.

No current production-bank duplicate check was possible because this runtime has no authorized database connection. `draftId` is unique and `questionNum` stays null until a controlled import allocates production numbers. Before import, check stems and near matches against the live bank, review answer validity and distractor plausibility, resolve the source for each item, and approve batches with an Ontario qualified operator.

## Files and checks

- `class2-*-250-drafts.json`: the four review packages.
- `water-treatment.mjs`, `water-distribution.mjs`, `wastewater-treatment.mjs`, `wastewater-collection.mjs`: editable topic families.
- `sources.mjs`: coverage blueprints and primary-source catalog.
- `build.mjs`, `helpers.mjs`: deterministic generator; **no database writes**.
- `verify.mjs`: checks counts, module targets, unique stems across all four banks, options, keyed position balance, review state, source fields, and independently recomputes all 100 calculation keys.
- `sample-20-each.md`, `sample.mjs`: a readable 80-item preview and its generator.

Regenerate and verify from the repository root:

```bash
node content/class2-2026-09-23/build.mjs
node content/class2-2026-09-23/verify.mjs
node content/class2-2026-09-23/sample.mjs
```

For the reviewer: resolve every `sourceReference` at answer level, verify all alternative answers are materially plausible, mark ambiguous items for rewrite, and use an actual learner-path preview before any production release. An `in_review` draft is not an approved exam question.
