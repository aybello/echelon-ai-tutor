# Ontario 309A Production Package — Independent Review Record

## Review outcome

An independent GPT-5.6-sol review of the initial handoff found that a simple public-beta selector for ordinary `in_review` questions would not be sufficient. The review also identified missing versioned source evidence, bank-local numbering, asset-level review controls, a server-side publication invariant, free/non-commercial backend enforcement, answer-integrity checks, calculation checks, diagram sanitization, and claims/safety governance.

The package has been revised to address those requirements before Codex begins implementation. The review does **not** approve public delivery of unreviewed content; it approves the preparation of an implementation specification that makes beta delivery possible only after the required controls are implemented.

## Resolved requirements

| Independent review concern | Package response |
|---|---|
| Current-exam blueprint was not sufficiently versioned | `content/309a/current-exam-source-manifest.json` records sources, retrieval date, SHA-256 hashes, and current previous-RSOS status. |
| Task allocation was not machine-readable | `content/309a/309a-allocation.json` contains exact MWA and task totals summing to 500. |
| Ordinary review content could be made public | `docs/309a-production-governance.md` requires a separate `beta_approved` state and reviewer separation. |
| Lifecycle and visibility were conflated | The governance specification separates program lifecycle from bank-version release channel. |
| Questions alone were governed | The required persistence model covers versions, tasks, sources, reviews, imports, notes, flashcards, and diagrams. |
| Direct or cached retrieval could leak unpublished content | The handoff requires a shared server-side delivery predicate and direct-ID/cache regression tests. |
| CEC and rights exclusions were informal | The source manifest, governance specification, and handoff require explicit rights records and human review. |
| Mock and diagram requirements were underspecified | The handoff defines mock composition, diagram asset requirements, accessibility, and answer-leakage prevention. |

## Remaining implementation gate

Codex must implement the governed data model, import pipeline, server-side selectors, validation suite, and free-beta controls before authoring or publishing the first substantive bank batch. Each authoring batch remains separately reviewable and does not become publicly eligible merely because it exists in the database.
