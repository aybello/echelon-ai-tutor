# PR #88 — Priority review corrections

Reviewed and revised September 15, 2026 against PR head `b95eabac31d827a829413d96c96823c9dda1715f`.

## Outcome

All 25 flagged historical items have been addressed. Each received a content or source correction; none was removed. Database identities, answer positions, difficulty, publication/review fields and the 503-row inventory are preserved. The other 478 proposed rows and the proposed module-menu/cache changes are unchanged. The bank still contains 43 recall items, 460 application items and 31 calculation items. This is a targeted editorial/source review, not a claim of external approval or full-bank psychometric validation.

## Dispositions

| Question | Disposition | Correction and source fit |
| --- | --- | --- |
| 35 | Revised | Narrowed the question to surge acceptance; distinct corrosion, solids-transport and motor-heating alternatives replace overlapping steady-state distractors. EPA force-main fact sheet, pressure-surge discussion. |
| 41 | Revised | Power-failure scenario distinguishes a transient assessment from steady-flow loss, valve leakage and actuator endurance testing. EPA force-main fact sheet. |
| 53 | Revised | Explicitly unchanged inflow, pumping rate and accurate level sensing isolate reduced active storage as the cause of more starts. Explanation gives the fill/drawdown relationship. EPA lift-station wet-well design discussion plus stated mass-balance reasoning. |
| 57 | Revised and re-sourced | Specifies a below-the-hook spreader bar rather than conflating it with a structural support beam. Uses Manitoba M.R. 217/2006, sections 23.33–23.35, for suitability and markings. |
| 58 | Revised and re-sourced | Recast the interpretation question as an immediate-response scenario with a conscious, mobile entrant. Key is withdrawal on an atmospheric alarm, followed by investigation/reassessment. CCOHS Confined Space — Program. |
| 74 | Revised and re-sourced | Concrete moving bypass-hose/pedestrian hazard; compare physical controls with inadequate administrative follow-up. CCOHS hierarchy of controls; no confined-space or local reporting claim. |
| 80 | Revised and re-sourced | Recurring near misses require investigation and verified corrective actions. CCOHS Incident Investigation, including follow-up. |
| 92 | Revised and re-sourced | Upstream observations establish background at sampled times, not downstream conditions or causal extent. EPA Volunteer Stream Monitoring, Chapter 2, PDF page 21. No fixed regulatory sampling plan inferred. |
| 100 | Revised and re-sourced | Comparable head/duty, pump-only metering and the printed energy identity bound the energy-per-volume comparison. EPA lift-station energy discussion plus an explicit independent derivation. Remains non-calculation. |
| 105 | Revised and re-sourced | Specifies a hazardous product and the gap between general WHMIS education and relevant spill instruction. Manitoba subsection 35.3(2)–(3), not confined-space guidance. |
| 107 | Replaced within existing identity | Removed machine-learning content. New item asks whether a dry-weather-calibrated collection model has been checked against wet-weather observations before sizing relief works. NEIWPCC section 6.5. |
| 110 | Revised and re-sourced | Separates environmental equipment suitability from ingress protection, radio range and image quality. Manitoba subsection 38.16(1); no claim that this provision certifies drones or supplies a hazardous-location classification. |
| 123 | Replaced within existing identity | Removed the wet-well/digester comparison. New collection-specific scenario assesses the atmospheric consequence of shutting down ventilation for odour-cost savings. EPA lift-station ventilation/odour discussion. |
| 139 | Revised | Compatibility is established in the stem; the decision tests restoration time using a timed deployment rehearsal. All options are parallel evidence types. Site deadline is a scenario condition, not a universal standard. |
| 146 | Revised | States the contract's handover conditions and uses grammatically parallel status alternatives. Explanation follows those supplied criteria; NEIWPCC is background, not authority for the hypothetical contract. |
| 148 | Revised and re-sourced | Narrows the task to separating two branch contributions before a common outlet. Avoids a bundled key containing unrelated partial requirements. NEIWPCC sections 6.3–6.4. |
| 165 | Explanation corrected | Shows EGL minus HGL directly; removes the rebuttal of a nonexistent option. Retains the stated kinetic-energy correction assumption. |
| 213 | Revised and source bounded | Explicit hypothetical authorization condition isolates material compatibility from hydraulic capacity. NEIWPCC Chapter 4 supports source-control context, not Manitoba municipal law. |
| 214 | Revised and source bounded | The stem expressly supplies the pretreatment/no-dilution condition. The answer follows that condition, with no universal municipal prohibition inferred from a US source. |
| 221 | Revised and re-sourced | Tests workplace-specific orientation for unfamiliar hazards/procedures. Manitoba section 2.2.1; removes the unsupported site-authorization claim. |
| 243 | Retained concept; explanation clarified | Explicitly distinguishes NIOSH IDLH from routine exposure limits, Manitoba alarm settings and entry permission. NIOSH Pocket Guide: Hydrogen sulfide. |
| 250 | Revised and re-sourced | Observed vehicle intrusion prompts reassessment and effective protection. Manitoba section 20.5; no universal barrier layout or cone spacing asserted. |
| 257 | Revised and re-sourced | Remoteness and task hazards matter even when crew numbers do not change. Manitoba Part 5, particularly 5.1–5.5 and 5.8; no invented distance thresholds. |
| 340 | Revised and re-sourced | Verified measurements and observed condensation support checking moisture against the installed media specification before assuming exhaustion. Calgon Carbon ST I X bulletin, pages 1–2; product limits are explicitly not universal. |
| 444 | Replaced within existing identity | Replaces the abstract no-slip question with the cross-sectional mean velocity required by Q = A V in sewer flow measurement. Remains recall and non-calculation. |

## Corrections to the incoming worklist

- `math` is a source code, not a calculation flag. Q100 was never in `CALCULATION_IDS`; the original 31-item count did not include it.
- At the reviewed head, Q123 did not contain the alleged second true safety option. It was replaced to improve scope and source fit, not because that allegation was confirmed.
- Q58 originally asked for interpretation. Its stem and key were changed together to make it an immediate-action question.
- Q53's clear weakness was its distractors, including a telephone bill. The revision supplies an operating cause-and-effect scenario rather than assuming the claimed qualifier ambiguity.

## Evidence boundaries

The new source records in `scripts/lib/collectionReview.mjs` include exact sections and scope limits. Manitoba sources were checked in the consolidated regulation available September 15, 2026; amendments listed as not yet in force were not applied. US technical sources are background, and hypothetical authorization/contract conditions are expressly supplied in the stems. Manufacturer guidance does not establish a universal carbon-media operating limit.

The WPI Class IV Collection outline remains the target for coverage supply. The unchanged metadata and selector do not establish that a live mock actually enforces the scored/unscored blueprint. This revision does not implement that separate work or add the separately requested 250 questions.

## Validation and handoff

- 50 focused content/export tests passed, including independent arithmetic fixtures for all 31 calculation flags.
- Rebuilt the full package from the original private export; all baseline hashes and row/source field checks passed.
- Compared against the prior revision: exactly these 25 proposed rows changed, with unchanged metadata and 478 byte-equivalent proposed rows.
- Verified rollback restores the original content hash and preserved identity/history fields for all 503 rows.
- Manually reviewed the revised stems, declared keys, alternatives, explanations and source fit. Automated screening cannot prove single-answer fairness or source sufficiency.

New compiled content digest: `3619dce31f8769ed1e9dc36ee43c08b82938606f1dbf131a68fae8f48d8a187f`.

The earlier `6827c794...` package is superseded. Use the revised private bundle or regenerate at this revision from the immutable original export. Follow the guarded database-release steps in [the handoff](wpi-class4-collection-review-handoff.md). No production operation was performed during this repair.
