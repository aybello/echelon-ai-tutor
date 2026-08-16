# Echelon Institute Electrician Trades Build Plan

**Scope:** Establish Echelon Institute’s first skilled-trades certification product: **Ontario 309A Electrician — Construction & Maintenance**, aligned to the current Construction Electrician Red Seal exam framework. This plan deliberately treats 309A as the reusable foundation for later regulated-trade courses—not as a one-off standalone app.

**Status:** Planning approved; the existing `/electrician-309a-demo` is a direct review prototype only. Its questions remain draft and require technical SME approval before commercial or broad public release.

> The Red Seal site distinguishes the newer Construction Electrician RSOS from the standard used by the current exam: new-standard exams are still under development, while current exams remain based on the previous RSOS. The course therefore needs explicit standard-version control rather than a permanent hard-coded blueprint. [1]

## 1. Product Decision

Echelon Institute should launch **one focused certification course first: Ontario 309A**, then use the completed architecture and content-governance workflow to add adjacent electrician credentials. The next logical electrician credential is **Ontario 442A Industrial Electrician**, but it should not enter build until 309A clears content, learner, and commercial validation gates.

The learner experience should use the existing **Echelon Institute** course workspace, visual tokens, account system, AI Tutor controls, mock-exam shell, entitlement model, and Teams reporting—not a separate “Skilled Trades Lab” product. The current prototype is useful for testing the diagnostic and blueprint, but its distinct dark visual system must be retired when the course enters the main product.

| Decision | Plan |
|---|---|
| First commercial credential | Ontario 309A Electrician — Construction & Maintenance / Red Seal Construction Electrician |
| Initial market | Ontario candidates writing the 309A Certificate of Qualification / Red Seal-aligned exam |
| Product promise | Blueprint-mapped practice, clear explanations, study planning, and readiness support—not a pass guarantee |
| Product surface | Existing Echelon Institute course workspace, Teams capability, account, and billing foundations |
| Current prototype | Retain as a direct internal-review diagnostic until the full course replaces it |
| Next expansion | Ontario 442A only after 309A validates the shared architecture and governance model |

## 2. Certification and Content Boundary

Ontario recognizes Electrician — Construction and Maintenance as a compulsory Red Seal trade with a certifying exam. Skilled Trades Ontario describes a 9,000-hour apprenticeship structure and an in-school curriculum that includes code, drawings, theory, wiring, motor controls, transformers, distribution, grounding, protective devices, and more. [2]

The current Red Seal Construction Electrician examination framework uses **100 multiple-choice questions**, a **four-hour** writing time, and a **70%** pass mark. Questions map to trade sub-tasks, not to a single textbook. [3] The current weighting is five Major Work Activities: common occupational skills (11%), generating/distribution/services (28%), wiring systems (30%), motors and control systems (21%), and signalling/communications (10%). [4]

| Content rule | Implementation consequence |
|---|---|
| The current exam blueprint can change | Store `standardVersion`, source URL, source reference, verification date, and effective status on every blueprint and question record |
| Exam questions map to sub-tasks | Build the content matrix at MWA, task, and sub-task level before setting question-volume targets |
| The Canadian Electrical Code is licensed | Do not write or publish rule-number-specific questions until Echelon has legitimate source access and electrician SME approval |
| Red Seal does not endorse prep vendors or authorize recalled exam items | Create original questions only; prohibit memory-based “real exam” claims and copied samples |
| Trade experience matters | Use practice to diagnose knowledge gaps and guide learning, not to present readiness as a substitute for apprenticeship experience |

## 3. Target 309A Learner Experience

The product should feel familiar to an experienced adult tradesperson returning to formal exam preparation: fast entry, straightforward language, visible progress, and explanations that connect theory to field decisions. A practitioner-focused exam-prep video reinforced the need for modular study, code-book navigation, calculation practice, scenario-based questions, timed mocks, and explanation-led review; its precise exam-format claims remain secondary to official sources. [5]

| Course capability | First 309A release | Later enhancement |
|---|---|---|
| Entry diagnostic | Approved, blueprint-balanced diagnostic with a strengths/gaps result | Adaptive diagnostic and prior-experience intake |
| Practice | Module, task, and sub-task practice with explanations and review queue | Weak-area targeting and spaced repetition |
| Study plan | Time-to-exam plan organized by MWA and task | Dynamic plan based on activity, mock results, and confidence |
| Mock exams | 100-question, 240-minute, blueprint-weighted mock with review | Multiple parallel forms and calibrated readiness trends |
| Calculations | Formula-linked, worked calculation items | Visual calculators and intermediate-step checks |
| Code-book skill | Navigation drills referencing permitted source material | Timed reference-navigation drills after licensed-content approval |
| Visual learning | Diagrams and circuit/control interpretation where source-cleared | Interactive circuit tracing and fault-isolation scenarios |
| AI Tutor | Answers grounded only in approved 309A content and cited internal references | Task-aware coaching and misconception detection |
| Teams | Course assignment and manager progress status after course activation | Trade-specific cohort, readiness, and exam-outcome reporting |

## 4. Content Governance Is the Launch Critical Path

The existing 25-question diagnostic is not a course bank. It correctly uses original Echelon wording, source/provenance fields, task mapping, and a `draft` status, but it is still a review artefact. [6] The first build objective is not “generate more questions”; it is to establish a **reviewable, versioned, source-backed content operation**.

### Required question record

Every 309A item must carry the fields below before it can be learner-facing.

| Field group | Required fields |
|---|---|
| Identity | Stable question ID, program key, blueprint version, MWA, task, sub-task |
| Learning design | Difficulty, cognitive type (knowledge / procedure / application), calculation flag, diagram dependency |
| Source | Source type, title, permitted URL or licence reference, exact source location, verification date |
| Review | Author, technical SME reviewer, review date, review status, revision history, rationale |
| Delivery | Approved-for-practice flag, approved-for-mock flag, retirement date, replacement linkage |
| Explanation | Correct-answer rationale, distractor rationale, formula/diagram reference where relevant |

### Required workflow

1. **Blueprint authoring:** establish the versioned task and sub-task matrix from official current-exam materials.
2. **Source mapping:** attach permitted source evidence before question drafting begins.
3. **Original drafting:** create original scenario, calculation, diagram, and procedural questions; never recreate remembered exam questions.
4. **Technical review:** an experienced 309A electrician reviews correctness, trade realism, terminology, assumptions, safety language, and distractors.
5. **Editorial review:** verify clarity, accessibility, one defensible correct answer, and useful explanation.
6. **Approval and release:** only an `approved` question can feed practice, diagnostic, mock, flashcards, inventory claims, readiness calculations, or AI Tutor retrieval.
7. **Maintenance:** version and retire questions when standards, source editions, or reviewer findings change.

> Red Seal advises candidates to use practice questions to learn concepts and gauge weaknesses, rather than to memorize them, and warns candidates not to trust claims that anyone has actual Red Seal exam questions. [3]

## 5. Technical Architecture Plan

### 5.1 Preserve the water product while adding a trade-agnostic program layer

The current course registry is intentionally constrained to `ontario` and `western` exam families, water-specific track types, and Class 1–4 subscription tiers. [7] Forcing 309A into those water contracts would create misleading values and brittle billing/team logic. The next build should add a **trade-agnostic certification-program layer** and keep existing water/wastewater contracts stable during transition.

| Layer | Responsibility | 309A implementation |
|---|---|---|
| Certification program | Jurisdiction, trade, credential, standard version, source status, active/review mode | `construction-electrician-309a-on` |
| Blueprint | MWA/task/sub-task hierarchy, weights, question count, duration, pass mark | Versioned current-exam previous-RSOS blueprint |
| Course experience | Routes, modules, practice, mock, study tools, course status | Reuse Echelon workspace; remove separate prototype shell |
| Content governance | Sources, reviewers, statuses, revisions, release eligibility | Extend existing governance so rejected/draft content cannot reach learners |
| Commerce | Product, entitlement, duration, Teams assignability, price | Separate trade-product configuration; do not overload water `classLevel` or subscription enums |
| Reporting | Learner progression, mock readiness, manager outcomes | Program and blueprint-version filters in analytics/Teams reports |

### 5.2 Build sequence

| Workstream | Deliverables | Acceptance condition |
|---|---|---|
| Program foundation | Trade-agnostic program and blueprint types, current 309A program record, migration plan | Existing water paths and Teams entitlements remain regression-safe |
| Content system | Source ledger, question-review queue, approved-only delivery enforcement | Draft/rejected items cannot enter any learner experience or AI Tutor context |
| Course workspace | 309A course page styled with Echelon Institute design system, module navigation, tool surfaces | Direct prototype replaced by a consistent Echelon course flow |
| Assessment | Approved diagnostic, practice selection, full 100-question mock, result review | Blueprint coverage and weights are deterministically tested |
| Study support | Formulas, diagrams, task notes, flashcards, AI Tutor boundaries | All support materials are sourced, reviewed, and mapped to objectives |
| Commerce and Teams | Product/entitlement adapter, seat assignment, access gate, manager course view | No water product or billing path regresses; no public sale before launch approval |
| Measurement | Activation, practice, mock, readiness, self-reported outcome, team adoption measures | Metrics use real events and distinguish prototype/beta from commercial use |

## 6. Phased Delivery Plan

### Phase A — Product framing and authority setup

Create the versioned 309A program brief, identify the exact current exam basis, document source permissions, and appoint the technical reviewer. Design the course as an Echelon Institute program from the outset, including learner, manager, and support boundaries. The existing demo remains review-only during this phase.

**Exit gate:** Ay confirms the primary user, the product claim, the nominated 309A SME, permitted source set, and whether the first audience is a closed beta, a specific event demo, or an initial paid cohort.

### Phase B — Shared skilled-trades platform foundation

Introduce program, blueprint, and trade-product models without breaking existing water courses. Build the source/review/release lifecycle and enforce approved-only delivery across practice, diagnostics, mock exams, readiness, inventory displays, and AI Tutor retrieval. This phase should precede large-scale content drafting.

**Exit gate:** an approved-only test suite proves that draft, rejected, and retired electrician content cannot appear in learner delivery; water/wastewater regressions remain clean.

### Phase C — 309A core content and learning flow

Build the task/sub-task content matrix, source-backed study notes, original practice items, calculations, diagrams, flashcards, and explanations. Route every item through technical and editorial review. Replace the prototype’s separate look with the existing Echelon course workspace, keeping the blueprint diagnostic as the first-step experience.

**Exit gate:** every released learning item is approved, mapped, source-traceable, and represented across the current blueprint. No public numeric inventory claim is made unless it is database-derived.

### Phase D — Assessment and readiness

Release the approved diagnostic and at least one blueprint-weighted 100-question, four-hour mock. Add post-mock review, topic-level remediation, formula/diagram links, and an explicitly uncalibrated readiness view until outcome evidence supports calibration.

**Exit gate:** deterministic blueprint tests, answer-key review, timing tests, SME sign-off on mock composition, and beta-user usability review are complete.

### Phase E — Closed beta and evidence collection

Recruit a small, clearly labelled 309A beta cohort. Collect structured feedback on trade realism, explanations, code-navigation needs, confusing distractors, study behaviour, and reported exam outcome. Do not claim passing effectiveness or sell a broad course during this phase.

**Exit gate:** documented SME fixes are complete; the beta confirms the study flow and identifies no critical content or access defects.

### Phase F — Commercial release and Teams extension

Add a 309A product/entitlement only after content and beta approval. Launch through Echelon Institute marketing and existing account/support flows, then enable Teams assignment and manager reporting once course activity data is trustworthy.

**Exit gate:** pricing, refund/support policy, access control, purchase flow, Teams permissions, analytics, claims review, and operating owner are all approved.

### Phase G — Repeatable electrician expansion

Only after the 309A operating model works, reuse the program layer for 442A. Add additional trades only when each has an authoritative blueprint, source strategy, named SME, and a credible distribution or employer path.

## 7. Decisions Required From Ay Before Build Begins

| Decision | Why it is needed |
|---|---|
| Confirm 309A as the single initial electrician course | Prevents dilution across 309A, 442A, and unrelated trades |
| Name a 309A technical SME and review cadence | Determines content quality, turnaround, and release authority |
| Approve the permitted-source policy and Canadian Electrical Code access route | Required before rule-specific learning content can be authored |
| Confirm the first audience | Shapes whether the next milestone is internal review, event demo, closed beta, or paid launch |
| Confirm whether the September skilled-trades event is still a target and provide its details | Determines demo scope, claims, and timeline pressure |
| Approve the “Echelon Institute course workspace” design direction | Prevents further work on a visually separate prototype |

## 8. First Build Sprint After Approval

The first implementation sprint should not add a large question bank. It should deliver the shared structure that makes every later question safe and reusable:

1. Define the trade-agnostic certification-program and blueprint contract.
2. Extend question governance so delivery is approved-only, with explicit legacy treatment for existing water content.
3. Migrate the 309A demo metadata into the new program/blueprint structure while preserving the direct review route.
4. Rebuild the 309A entry and module shell in the Echelon Institute design system.
5. Add the SME review queue and source ledger for the existing 25 draft questions.
6. Establish the beta feedback and reported-outcome schema before recruiting any testers.

## 9. Launch Claims and Guardrails

The course may say that it is **aligned to the current published Construction Electrician Red Seal exam weighting**, only while that version is active and the claim is backed by the stored source record. It must not claim to be affiliated with, endorsed by, or a substitute for Red Seal, Skilled Trades Ontario, apprenticeship experience, or a licensed code source. It must not promise passing, present draft bank counts as final inventory, or imply access to actual exam questions.

## References

[1]: [Red Seal — Construction Electrician trade page](https://www.red-seal.ca/eng/trades/const-elect.shtml)

[2]: [Skilled Trades Ontario — Electrician: Construction and Maintenance](https://www.skilledtradesontario.ca/trade-information/electrician-construction-and-maintenance/)

[3]: [Red Seal Exam Preparation Guide](https://www.red-seal.ca/eng/resources/exam-prep-guide.shtml)

[4]: [Red Seal — Construction Electrician current-exam weightings and task matrix](https://www.red-seal.ca/eng/trades/constelectric/previous/exam-weightings.shtml)

[5]: [How to Pass the Red Seal Electrical Exam — practitioner-oriented video reviewed for UX insights](https://www.youtube.com/watch?v=ir_hY-2SY1w)

[6]: [Current 309A draft-question model in Echelon Institute](https://github.com/aybello/echelon-ai-tutor/blob/main/client/src/lib/electrician309aDraftQuestions.ts)

[7]: [Current Echelon Institute course registry](https://github.com/aybello/echelon-ai-tutor/blob/main/shared/courseRegistry.ts)
