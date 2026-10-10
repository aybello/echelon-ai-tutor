# U.S. Class I Review-Only Authoring Contract

**Applies to:** `us-class1-water` (200 candidates) and `us-class1-water-dist` (198 candidates)  
**Drafting status:** Not started  
**Database status:** No write, import, approval, activation, or publication authorized.

## Purpose

This contract governs the creation of **review-only candidate JSON** for two U.S. Class I study banks. It does not authorize a learner-facing release, commercial availability, database write, product-price change, checkout, paid advertising, or customer action.

## Required input documents

- [Water Treatment source dossier](./US_CLASS1_WATER_TREATMENT_SOURCE_DOSSIER.md)
- [Water Distribution source dossier](./US_CLASS1_WATER_DISTRIBUTION_SOURCE_DOSSIER.md)
- [Phase I state-route verification](./PHASE1_OFFICIAL_STATE_ROUTE_VERIFICATION_2026-10-10.md)
- [Controlled U.S. launch plan](./US_OPERATOR_CERTIFICATION_LAUNCH_PLAN.md)

## Candidate JSON contract

Each candidate has exactly four options and must contain:

```json
{
  "bankKey": "us-class1-water",
  "questionNum": 1,
  "module": "Treatment process",
  "difficulty": "easy | medium | hard",
  "cognitiveLevel": "recall | application",
  "question": "Original, bounded prompt",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "explanation": "A source-supported explanation",
  "steps": [{"l": "Step", "c": "..."}],
  "tip": "Short learning tip",
  "isCalc": "yes | no",
  "topic": "Specific foundational topic",
  "sourceTitle": "Official source title",
  "sourceReference": "Section/task/formula reference",
  "sourceUrl": "https://...",
  "blueprintObjective": "Single WPI-aligned learning objective",
  "reviewStatus": "in_review",
  "reviewedBy": null,
  "reviewedAt": null,
  "provenance": {
    "authoringMethod": "Manus-native agent",
    "sourceDossier": "exact dossier filename",
    "batchId": "course-batch"
  }
}
```

`steps` must be `null` for non-calculation items and a compact worked solution for calculation items. It must never state site-specific operating instructions, legal duties, state eligibility, or state numeric limits unless the authoring contract explicitly permits them; it does not.

## Drafting rules

1. Draft one source-supported learning objective per item.
2. Use an original scenario or wording. Never reproduce, reconstruct, paraphrase closely, claim access to, or imitate an actual WPI/ABC test item.
3. Cite the exact official-source task, section, or formula that supports the correct answer. If support is not specific enough for one correct answer, do not draft the item.
4. Keep all U.S. state-specific requirements out of the question and answer. The state pages handle state route labels and exclusions separately.
5. Keep calculations in the source dossier’s permitted families. Show units and a reasonableness check.
6. Make distractors plausible but not unsafe, absurd, answer-length-signalling, or technically ambiguous.
7. Do not use `always`, `never`, or `only` unless the source requires the absolute statement.
8. Candidate output remains `in_review`; it never self-approves.

## Deterministic structural gates

Before independent review, reject any candidate that has:

- a missing or duplicate `questionNum`;
- anything other than four non-empty, distinct options;
- a `correctIndex` outside 0–3;
- an unsupported source URL, missing source reference, missing explanation, or missing blueprint objective;
- an explanation that introduces a claim beyond the cited source;
- calculation status inconsistent with `steps`;
- an answer-length cue, duplicate semantic stem, duplicate option set, or copied wording; or
- scope drift to another class, stream, specialty credential, jurisdiction, facility rule, or state eligibility path.

## Independent-review gate

Every item must be reviewed by a Manus-native agent that did **not** draft that item. The reviewer must return `approve`, `repair`, `hold`, or `reject` with source-based reasons. A repair must receive re-review by a different agent before a technical approver may act.

No `approved` status may be applied by the drafting pipeline. A later, separately authorized release must confirm an accountable reviewer identity, date, package checksum, source manifest checksum, bank allocation, mock capacity, database preflight, rollback plan, and post-stage inventory.

## Stop conditions

Stop and mark the item `hold` if there is uncertainty about the answer key, source support, Class I level, technical/safety implication, legal/jurisdictional boundary, WPI criteria version, source permission, or duplicate risk.
