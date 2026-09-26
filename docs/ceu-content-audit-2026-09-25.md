# CEU Content Audit

**Date:** 2026-09-25  
**Scope:** Ten non-credit Echelon Institute CEU pilot courses, the live slide-based learner flow, final assessments, stored exercise engine, and source alignment.  
**Decision:** Do not market or release the courses unchanged. Keep the approved simple flow, then make the delivered learning, assessment, duration, and claims agree before release.

## Bottom line

The **underlying course content is stronger than the live course experience makes it appear**.

Across the ten courses, Echelon has:

- **46 modules**
- **91,065 characters of authored lesson content**
- **26,135 characters of fictional case evidence**
- **140 authored rubric criteria**
- **92 knowledge checks**
- **92 final-assessment questions**
- A server-side case-exercise generator with case-specific distractors, calculations, answer protection, and feedback

The technical examples reviewed are generally sound. The strongest material teaches learners to distinguish supported evidence from assumptions, avoid treating one observation as proof, keep calculation boundaries visible, and separate an operational response from a regulatory conclusion.

The current learner flow, however, shows seven generated slides, **only one optional check per module**, and the final exam. It does **not** show or score the authored assignments, rubrics, or server-side case exercises. That creates a material gap between what the content says learners will do and what the product actually delivers.

> The issue is not that the curriculum is empty or generic. The issue is that the live delivery currently hides too much of the strong curriculum and retains a few promises about practical assessment that are not true in the live product.

## What is strong and should stay

| Strength | Evidence in the curriculum |
|---|---|
| Evidence-first operating decisions | The courses consistently separate a fact, a hypothesis, a calculation, and an authorized decision. |
| Honest uncertainty | Missing values are not turned into zero, later good results do not erase earlier evidence, and a corrected sample label does not reverse an analytical result. |
| Sound calculation boundaries | Full versus simplified SRT, normalized chemical dose, storage-time screening, active chemical basis, and time-aligned CT are carefully bounded. |
| Multi-factor process reasoning | Activated-sludge lessons connect settling, solids inventory, RAS/WAS, DO, temperature, loading, and monitoring rather than claiming one cause from one signal. |
| Safe professional limits | The content avoids prescribing unauthorized operating changes, bypasses, unsafe field work, or universal regulatory rules from fictional cases. |
| Real operator relevance | The cases use recognizable operator work: record reconstruction, source checks, sampling identity, data quality, CT, filter performance, wet-weather response, and handover. |

## Release blockers

### 1. Live course promises do not match the live course

Several lessons visible in the player still say that practical work is scored against a rubric, receives automatic feedback, or is required for completion. The learner cannot actually do that work in the current UI.

Examples include:

- **Activated Sludge, “Monitored recovery and reassessment”**
- **Disinfection CT, “Disinfection verification dossier”**
- **Drinking Water Compliance, “Defend a complete incident file”**
- **Wastewater Process Control, “Integrated shift and defensible handover”**
- **Water Treatment Process Control, “Design and defend an optimization trial”**

The live UI completes a module after its last slide. It does not render a written task, rubric, instructor review, or case-exercise submission.

**Required correction:** keep the approved simple course sequence and remove or rewrite all learner-facing practical-assessment claims. Do not claim case-exercise feedback, rubric acceptance, active-time verification, instructor review, or demonstrated practical competence unless that workflow is restored.

### 2. The displayed duration is not yet validated for the delivered experience

The courses show 3, 4, or 10 planned hours. Those estimates include authored activities and case work that the current UI does not deliver. The visible slide-and-final flow has not been time-tested.

The UI also shows a seven-hour daily limit in authored content, but the live player does not send the active-time heartbeat needed to verify participation. The visible implementation also does not establish that this limit operates across every course.

**Required correction:** label duration as an estimate pending pilot validation. Remove active-time and across-course-limit claims from the simple flow until the actual feature is live and tested.

### 3. Some content needs a tighter Ontario source-to-task bridge

The content is cautious, but the compliance course should be more concrete before it is sold as Ontario regulatory training.

Priority areas:

- **O. Reg. 128/04:** designated ORO/OIC roles, OIC authority over operating parameters, monitoring and records, chronological and attributable log entries, and required shift details.
- **Adverse results:** actual applicability, responsible parties, records, and written basis for any exemption. A sample discrepancy does not itself suspend reporting.
- **Watermain work:** repair, sampling, flushing, and return-to-service requirements depend on the actual work category and procedure.
- **CT:** T10, residual identity, temperature, pH, hydraulic basis, and the conditions for applying a typical baffling factor must remain explicit.

**Required correction:** link each major compliance claim to the exact current Ontario source section and clarify what is a fictional case rule, a technical method, or an applicable legal duty.

## Assessment findings

### What is live now

| Assessment layer | Current live behavior | Appropriate claim |
|---|---|---|
| Optional module check | One of two authored checks appears in each module. It is saved but does not control completion. | “Optional knowledge check” |
| Final exam | 8 or 12 protected questions, 80% pass mark, saved drafts, review feedback, and retakes. | “Knowledge assessment” |
| Certificate | Issued after slide completion and a passing final. | “Non-credit pilot learning record” |

### What exists in code but is not live in the learner flow

| Stored capability | Current issue |
|---|---|
| Rubric criteria | Not displayed to learners as requirements. |
| Case-exercise generator | Not fetched, rendered, or submitted in the course player. |
| Server scoring | Uses an overall 70% score and does not prove every rubric criterion was met. |
| Written assignments and facilitator guides | Not presented as a learner submission or an instructor review workflow. |
| Active-time accounting | Server logic exists, but the displayed learner flow does not emit it. |

The stored case-exercise generator is real and case-specific. It is **not** a written-practical assessment. Most generated questions ask the learner to recognize the correct rubric interpretation among options. This can be useful formative practice later, but it should not be described as a full assessment of a dossier, handover, investigation plan, or trial design.

### Final-exam quality

The answer positions are properly balanced across the 92 final questions. The main improvement is to replace obvious or destructive distractors with credible operational near-misses.

Two items need correction before release:

1. **Instrumentation and SCADA, `instrumentation-scada-f4`**: a line connecting two trend points does not prove that only those points were recorded. It only does not establish measurements between those points.
2. **Activated Sludge, `activated-sludge-troubleshooting-f4`**: the wording does not clearly leave one best answer because several options could be insufficient for a specific filamentous diagnosis.

Also improve the latent time-quality distractor that mislabels a corrected 08:12 time as uncorrected.

## Course readiness after common corrections

| Course | Readiness | Reason |
|---|---|---|
| Collection Systems and Wet-Weather Response | Conditional | Bounded calculations and uncertainty handling are strong. Keep claims limited to knowledge and scenario reasoning. |
| Coagulation, Filtration and Controlled Optimization | Conditional | Solid active-dose, filter, and controlled-trial logic. Add more direct technical source mapping. |
| Sampling, Laboratory Results and Data Quality | Conditional | Strong chain-of-custody and QC boundaries. Use method-specific sources and keep reporting-exemption scope clear. |
| Instrumentation, SCADA and Operational Data Integrity | Conditional | Good scaling, clock, stale-data, and alarm concepts. Correct final question f4. |
| Activated Sludge Troubleshooting and Solids Control | Hold | Strong technical content, but the visible practical-completion claim must be resolved. Correct f4. |
| Distribution Water Quality and System Integrity | Conditional | Good water-age and repair reasoning. Verify procedure-specific material against the current Ontario source. |
| Disinfection Verification and CT Calculations | Conditional | Calculations are sound under supplied assumptions. Keep method limits and Ontario applicability explicit. |
| Wastewater Treatment Operations and Process Control | Hold | Strong process calculations, but current flow does not assess the integrated handover it promises. |
| Water Treatment Process Control and Optimization | Hold | Strong treatment-train reasoning, but current flow does not assess the trial-design outcome it promises. |
| Drinking Water Operations and Regulatory Compliance | Hold | Strongest evidence literacy, but needs tighter current Ontario role, recordkeeping, reporting, and exemption instruction. |

## Recommended release approach

Preserve the approved simple flow:

> Course overview → slide-style lessons → final exam → results → non-credit pilot certificate

Do **not** add a separate complex practical-assessment screen yet.

Instead, make the first release an honest **case-informed knowledge pilot**:

1. Keep the existing evidence slides and scenario-based lessons.
2. Present both authored knowledge checks as optional reinforcement, not evidence of competence.
3. Remove or rewrite every promise of rubric-scored practical work, automatic case-exercise feedback, instructor review, active-time verification, and practical acceptance.
4. Correct the two final questions and improve a short list of weak distractors.
5. Add source cards with the applicable Ontario section, jurisdiction, and clear “training scenario” labels.
6. Time-test the actual delivery and mark the displayed duration as a pilot estimate until validated.
7. Keep the certificate wording exactly non-credit. It must not imply approved CEUs, accreditation, operator qualification, or regulatory recognition.

A later premium version can restore the case-exercise engine and build true practical assessment around it. That would be a separate product decision, not a small wording change.

## Source checks completed for this audit

The audit cross-checked the course themes against the following primary or official technical sources:

- [Ontario Regulation 128/04: Certification of Drinking Water System Operators and Water Quality Analysts](https://www.ontario.ca/laws/regulation/040128)
- [Ontario Procedure for Disinfection of Drinking Water](https://www.ontario.ca/page/procedure-disinfection-drinking-water-ontario)
- [Ontario Watermain Disinfection Procedure](https://www.ontario.ca/page/water-main-disinfection-procedure)
- [Ontario technical bulletin on adverse drinking water test results](https://www.ontario.ca/page/technical-bulletin-adverse-drinking-water-test-results-reporting-requirements-and-exemptions)
- [EPA drinking-water distribution-system tools and resources](https://www.epa.gov/dwreginfo/drinking-water-distribution-system-tools-and-resources)
- [EPA guidance on high-quality turbidity data and SCADA](https://www.epa.gov/sdwa/generating-high-quality-turbidity-data-drinking-water-treatment-plants-support-system)
- [EPA quick guide to drinking-water sample collection](https://www.epa.gov/sites/default/files/2015-11/documents/drinking_water_sample_collection.pdf)
- [EPA Activated Sludge Process Control Manual](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=9100NX8X.TXT)

## Next implementation decision

The immediate next build should be the **simple-flow content alignment pass**, not payments and not a separate course app. It will preserve every course route and the five-state learner experience while making the delivered content truthful, clearer, and commercially safer.
