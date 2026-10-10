# U.S. Operator Certification Launch Plan

**Status:** State-route research is complete for the initial cohort. Dedicated U.S. Class I authoring is held pending recovery of the original product and release decision. This planning program has not imported, approved, activated, published, or sold any U.S. content; Git history separately records an October 8 dedicated-bank import and release whose package and authoritative database record must now be recovered.

## Decision

Launch in stages, not as a blanket “U.S. exam prep” offering.

1. **Use shared WPI Class I preparation** only where the state regulator or certification body explicitly confirms a standardized WPI/ABC Class I exam and a local credential match.
2. **Build a separate bank** only when the official state program uses a genuinely state-specific or WPI-customized examination.
3. **Hold every unresolved route** until the exact exam authority, exam system, credential level, and current source documents are independently verified.
4. **Do not sell a course whose bank is empty, staged-only, or unable to generate a complete mock form.**

This keeps Echelon’s product claim precise: independent exam-preparation support for a named route, never state approval, accreditation, eligibility determination, licensure, or a guarantee of a passing result.

## Initial sellable target — after release gates

The first launch cohort is **five states and 20 verified Class I state/stream routes**.

| State | Water treatment | Water distribution | Wastewater treatment | Wastewater collection |
|---|---|---|---|---|
| Alabama | WPI Class I maps to **Alabama Water Treatment Grade II**; basic groundwater only | Alabama Grade I | Alabama Grade I; lagoon-only | Alabama Grade I(C); public systems |
| Alaska | Provisional/1 (Level 1) | Provisional/1 (Level 1) | Provisional/1 (Level 1) | Provisional/1 (Level 1) |
| Arizona | Grade 1 | Grade 1 | Grade 1 | Grade 1 |
| Georgia | Water Operator Class I | Board-linked WPI Class I exam; credential is unnumbered | Wastewater Operator Class I | Board-linked WPI Class I exam; credential is unnumbered |
| South Carolina | D Level | D Level | D Level, biological wastewater only | Voluntary WEASC VCC D Level; not a state Board licence |

The final source check for this cohort was completed on **2026-10-10**. The route-specific evidence, labels, exclusion rules, and official links are preserved in the tracked [Phase I verification report](./PHASE1_OFFICIAL_STATE_ROUTE_VERIFICATION_2026-10-10.md).

### Required positioning

Every state page, product page, advertisement, checkout disclosure, and support response must state that Echelon:

- is independent study preparation and is not approved, accredited, endorsed by, affiliated with, or a substitute for WPI, ABC, a state agency, a Board, or a state rule;
- does not guarantee a passing score, eligibility, certification, licence, renewal, upgrade, facility authorization, or exam scheduling;
- covers only the named shared exam route, not higher grades, other facility types, local rules, specialty streams, laboratory, maintenance, biosolids, backflow, industrial, physical/chemical wastewater, or unverified small-system/lagoon credentials; and
- directs learners to the named state authority for eligibility, application, fee, required-course, experience, and certification questions.

## Current product and content status

| Product or bank | Current status | What must happen before sale |
|---|---|---|
| `us-class1-water` | Product, routes, mock profile, and state-context support exist. The currently attached database has **0 rows** and no metadata row; this is not evidence that a dedicated package was abandoned or never existed. | Recover the original product/release decision and any package or prior environment record before deciding whether to validate an existing package, continue its intended authoring program, replace the design, or retire the product. |
| `us-class1-water-dist` | Product, routes, mock profile, and state-context support exist. The currently attached database has **0 rows** and no metadata row; this is not evidence that a dedicated package was abandoned or never existed. | Recover the original product/release decision and any package or prior environment record before deciding whether to validate an existing package, continue its intended authoring program, replace the design, or retire the product. |
| `wpi-class1-wastewater` | 594 legacy visible questions and metadata exist. | Reconcile the active pool to the 2025 WPI Class I criteria, confirm mock allocation capacity, perform a source/provenance and state-label review, then create the Phase I route disclosures. |
| `wpi-class1-wastewater-coll` | 499 legacy visible questions and metadata exist. | Reconcile the active pool to the 2025 WPI Class I collection criteria, confirm mock allocation capacity, perform a source/provenance and state-label review, then create the Phase I route disclosures. |

The current application advertises two dedicated U.S. Class I products at **CA$149** each and remains CAD-only for new checkout. The original intent and package history must be recovered before changing their availability, routing, copy, or delivery model. Any later commercial guard must be designed from that recovered decision record, not from a zero-row observation alone. See the [dedicated-bank context-recovery hold](./DEDICATED_US_CLASS1_CONTEXT_RECOVERY_HOLD.md).

## Workstreams and release gates

### 1. Product-delivery integrity — required first

1. Create an availability resolver that requires a bank to have verified learner-visible inventory and enough classified questions to build the advertised practice and mock experience.
2. Make pricing cards, direct checkout, course catalogue, course pages, and state routes use that resolver. An unavailable U.S. bank must show a truthful waitlist or “coming soon” state rather than a purchase path.
3. Add regression coverage proving an empty U.S. bank cannot be purchased or served and that an unrelated Canadian or WPI bank can never satisfy a U.S. bank request.

### 2. Dedicated U.S. Class I content — two separate release packages

For `us-class1-water` and `us-class1-water-dist`:

1. Reconstruct the missing package from its source dossier or create a new evidence-grounded package. Do not infer the missing package from product-copy counts.
2. Lock the WPI 2025 criteria version, module allocation, source manifest, calculation requirements, question numbering, and a machine-readable checksum.
3. Run structural validation, answer-key checks, duplicate checks, answer-cue checks, source-to-claim checks, and independent technical review.
4. Stage each bank with a guarded additive importer that inserts only `in_review` rows, captures a fresh baseline, preserves learner attempts, and rolls back on any mismatch.
5. Complete source and mock-capacity verification before a separate promotion authorization. No staging or promotion is included in this plan.

### 3. State-route metadata and claims controls

Create a structured state-route record for each active route:

- state, stream, local credential label, shared-bank key, WPI criteria version, official authority URL, source-check date;
- allowed claim, prohibited wording, facility/specialty exclusions, and authority-referral text; and
- a release status: `research`, `review`, `ready_for_state_copy`, `sellable`, `held`, or `retired`.

The state pages already separate confirmed shared routes from dedicated needs. Convert the critical local distinctions in the initial five states into source-controlled copy and test them so future edits cannot flatten them into a generic “Class I in every state” claim.

### 4. Commercial and operational readiness

Before opening U.S. checkout, verify:

- Stripe product/price configuration and the product-to-delivery availability guard;
- CAD-only price disclosure and cross-border checkout experience;
- sales-tax, refund, consumer-disclosure, privacy, and support-routing obligations for the chosen U.S. sales footprint, with qualified legal/tax advice where required;
- a support escalation rule: support may link to an authority, but may not decide a learner’s eligibility or claim state approval; and
- public-route availability, checkout initiation, cancelled-checkout behavior, entitlement isolation, and no-learner-data regression coverage.

### 5. Demand validation before large state-bank investment

Use the existing `/us/states` experience as the top of funnel. For routes still held, capture demand by **state + stream + local credential** through a waitlist rather than selling unsupported preparation. Measure search demand, conversion to the state selector, free-preview engagement, waitlist sign-ups, and paid conversion only after the delivery gates pass.

## National roadmap

| Phase | Scope | Decision rule |
|---|---|---|
| **0 — Product integrity** | Prevent empty U.S. products from being sold; preserve public state research and state-first discovery | Must pass before any U.S. paid traffic or checkout promotion |
| **I — Five-state Class I cohort** | Alabama, Alaska, Arizona, Georgia, South Carolina; four confirmed shared routes each | Build/recover the two U.S. dedicated banks and certify the two reused WPI Class I banks for route-specific delivery |
| **II — Shared-route expansion** | Prioritize partial shared states after an independent official-source recheck: Connecticut, Maine, Massachusetts, Mississippi, Montana, Nevada, New Jersey, Ohio, Oregon, Rhode Island, Tennessee, Utah, Virginia, Washington, plus Colorado’s verified subset | Add only the exact state/stream/level combinations confirmed by a regulator or certification body; do not infer adjacent streams or grades |
| **III — Dedicated state-bank discovery** | Twelve states have one or more state-specific or customized routes: California, Connecticut, Delaware, Illinois, Indiana, Kansas, Michigan, Nebraska, New Hampshire, New Mexico, Pennsylvania, Wisconsin | Select one state and one credential route at a time based on verified demand and official blueprint access; create a separate versioned bank and its own claims boundary |
| **IV — Unresolved markets** | Nineteen states currently have no verified shared or dedicated route in the evidence record | Research only; no state-matched course, advertising claim, or checkout route until official evidence supports a specific path |

## Explicit non-actions

This plan does not authorize question generation, imports, database writes, migrations, activation, publication, paid advertising spend, Stripe configuration changes, checkout changes, tax filings, or sales to learners. Each requires a separate approved implementation and release decision.

## References

- [Alabama ADEM Operator Certification](https://prd.adem.alabama.gov/opcert/)
- [Alaska DEC Operator Certification exam information](https://dec.alaska.gov/water/operator-certification/info-for-written-and-proctored-online-exams/)
- [Arizona ADEQ Operator Certification Examination](https://azdeq.gov/operator-certification-examination)
- [Georgia Board exam information](https://sos.ga.gov/page/georgia-board-examiners-certification-water-wastewater-treatment-plant-operators-and)
- [South Carolina Environmental Certification Board exam information](https://llr.sc.gov/env/examinfo.aspx)
- [Water Professionals International 2025 Need-to-Know Criteria](https://gowpi.org/services/2025-need-to-know-criteria/)
