# PR #88 — Priority review corrections

Reviewed and revised September 15, 2026 against PR head `b95eabac31d827a829413d96c96823c9dda1715f`, with a further shared-bank jurisdiction correction against `c828e8b`.

## Latest follow-up

The original priority dispositions below are historical. A later user-authorized [exam-style repair](wpi-class4-collection-exam-style-review.md) further revises 41 items, gives all 503 a specific task mapping, and adds a gated Collection selector. In particular Q74, Q80, Q123, Q139 and Q250 received further distractor improvements. The handoff contains the current digest and validation counts. No live content or metadata was changed.

## Outcome

All 25 flagged historical items have been addressed. Each received a content or source correction; none was removed. Database identities, answer positions, difficulty, publication/review fields and the 503-row inventory are preserved. The first priority pass left the other 478 proposed rows unchanged. The subsequent jurisdiction pass described below also updates other affected rows; the proposed module-menu/cache changes remain unchanged. The bank still contains 43 recall items, 460 application items and 31 calculation items. This is a targeted editorial/source review, not a claim of external approval or full-bank psychometric validation.

## Dispositions

| Question | Disposition | Correction and source fit |
| --- | --- | --- |
| 35 | Revised | Narrowed the question to surge acceptance; distinct corrosion, solids-transport and motor-heating alternatives replace overlapping steady-state distractors. EPA force-main fact sheet, pressure-surge discussion. |
| 41 | Revised | Power-failure scenario distinguishes a transient assessment from steady-flow loss, valve leakage and actuator endurance testing. EPA force-main fact sheet. |
| 53 | Revised | Explicitly unchanged inflow, pumping rate and accurate level sensing isolate reduced active storage as the cause of more starts. Explanation gives the fill/drawdown relationship. EPA lift-station wet-well design discussion plus stated mass-balance reasoning. |
| 57 | Revised and re-sourced | Specifies a below-the-hook spreader bar rather than conflating it with a structural support beam. Now tests verified load capacity and configuration suitability using CCOHS rigging/lift-plan guidance; no provincial marking rule. |
| 58 | Revised and re-sourced | Recast the interpretation question as an immediate-response scenario with a conscious, mobile entrant. Key is withdrawal on an atmospheric alarm, followed by investigation/reassessment. CCOHS Confined Space — Program. |
| 74 | Revised and re-sourced | Concrete moving bypass-hose/pedestrian hazard; compare physical controls with inadequate administrative follow-up. CCOHS hierarchy of controls; no confined-space or local reporting claim. |
| 80 | Revised and re-sourced | Recurring near misses require investigation and verified corrective actions. CCOHS Incident Investigation, including follow-up. |
| 92 | Revised and re-sourced | Upstream observations establish background at sampled times, not downstream conditions or causal extent. EPA Volunteer Stream Monitoring, Chapter 2, PDF page 21. No fixed regulatory sampling plan inferred. |
| 100 | Revised and re-sourced | Comparable head/duty, pump-only metering and the printed energy identity bound the energy-per-volume comparison. EPA lift-station energy discussion plus an explicit independent derivation. Remains non-calculation. |
| 105 | Revised and re-sourced | Specifies a hazardous product and the gap between general WHMIS education and relevant spill instruction. CCOHS WHMIS Education and Training distinguishes general education from site/job procedures. |
| 107 | Replaced within existing identity | Removed machine-learning content. New item asks whether a dry-weather-calibrated collection model has been checked against wet-weather observations before sizing relief works. NEIWPCC section 6.5. |
| 110 | Revised and re-sourced | Separates environmental equipment suitability from ingress protection, radio range and image quality. CCOHS Methane supports ignition-hazard control. The stem specifies methane; no claim that the source certifies drones or supplies a hazardous-location classification. |
| 123 | Replaced within existing identity | Removed the wet-well/digester comparison. New collection-specific scenario assesses the atmospheric consequence of shutting down ventilation for odour-cost savings. EPA lift-station ventilation/odour discussion. |
| 139 | Revised | Compatibility is established in the stem; the decision tests restoration time using a timed deployment rehearsal. All options are parallel evidence types. Site deadline is a scenario condition, not a universal standard. |
| 146 | Revised | States the contract's handover conditions and uses grammatically parallel status alternatives. Explanation follows those supplied criteria; NEIWPCC is background, not authority for the hypothetical contract. |
| 148 | Revised and re-sourced | Narrows the task to separating two branch contributions before a common outlet. Avoids a bundled key containing unrelated partial requirements. NEIWPCC sections 6.3–6.4. |
| 165 | Explanation corrected | Shows EGL minus HGL directly; removes the rebuttal of a nonexistent option. Retains the stated kinetic-energy correction assumption. |
| 213 | Revised and source bounded | Explicit hypothetical authorization condition isolates material compatibility from hydraulic capacity. NEIWPCC Chapter 4 supports source-control context, not local municipal law. |
| 214 | Revised and source bounded | The stem expressly supplies the pretreatment/no-dilution condition. The answer follows that condition, with no universal municipal prohibition inferred from a US source. |
| 221 | Revised and re-sourced | Tests workplace-specific orientation for unfamiliar hazards/procedures. CCOHS Orientation for Workers checklist; no province-specific licensing or orientation-law question. |
| 243 | Retained concept; explanation clarified | Explicitly distinguishes NIOSH IDLH from routine exposure limits, universal alarm settings and entry permission. NIOSH Pocket Guide: Hydrogen sulfide. |
| 250 | Revised and re-sourced | Observed vehicle intrusion prompts reassessment and effective protection. CCOHS Road Work — Traffic Control Zone; no universal barrier layout or cone spacing asserted. |
| 257 | Revised and re-sourced | Remoteness and task hazards matter even when crew numbers do not change. CCOHS First Aid — General; no invented staffing, kit or distance thresholds. |
| 340 | Revised and re-sourced | Verified measurements and observed condensation support checking moisture against the installed media specification before assuming exhaustion. Calgon Carbon ST I X bulletin, pages 1–2; product limits are explicitly not universal. |
| 444 | Replaced within existing identity | Replaces the abstract no-slip question with the cross-sectional mean velocity required by Q = A V in sewer flow measurement. Remains recall and non-calculation. |

## Corrections to the incoming worklist

- `math` is a source code, not a calculation flag. Q100 was never in `CALCULATION_IDS`; the original 31-item count did not include it.
- At the reviewed head, Q123 did not contain the alleged second true safety option. It was replaced to improve scope and source fit, not because that allegation was confirmed.
- Q58 originally asked for interpretation. Its stem and key were changed together to make it an immediate-action question.
- Q53's clear weakness was its distractors, including a telephone bill. The revision supplies an operating cause-and-effect scenario rather than assuming the claimed qualifier ambiguity.

## Evidence boundaries

The source records in `scripts/lib/collectionReview.mjs` include sections and scope limits. The initial priority pass checked Manitoba regulations, but the shared-bank correction replaces those provincial sources with the broader references listed below. US technical sources are background, and hypothetical authorization/contract conditions are expressly supplied in the stems. Manufacturer guidance does not establish a universal carbon-media operating limit.

The WPI Class IV Collection outline remains the target for coverage supply. The unchanged metadata and selector do not establish that a live mock actually enforces the scored/unscored blueprint. This revision does not implement that separate work or add the separately requested 250 questions.

## Validation and handoff

- 50 focused content/export tests passed, including independent arithmetic fixtures for all 31 calculation flags.
- Rebuilt the full package from the original private export; all baseline hashes and row/source field checks passed.
- Compared against the prior revision: exactly these 25 proposed rows changed, with unchanged metadata and 478 byte-equivalent proposed rows.
- Verified rollback restores the original content hash and preserved identity/history fields for all 503 rows.
- Manually reviewed the revised stems, declared keys, alternatives, explanations and source fit. Automated screening cannot prove single-answer fairness or source sufficiency.

New compiled content digest: `3619dce31f8769ed1e9dc36ee43c08b82938606f1dbf131a68fae8f48d8a187f`.

The earlier `6827c794...` package is superseded. Use the revised private bundle or regenerate at this revision from the immutable original export. Follow the guarded database-release steps in [the handoff](wpi-class4-collection-review-handoff.md). No production operation was performed during this repair.


## Shared Western Canada bank correction

Ay clarified that the shared WPI bank serves candidates across Western Canada. The Manitoba customer prompted the review but does not define the bank's jurisdiction. This pass removes province-specific dependencies rather than merely deleting the place name from a legal assertion.

Wording changed in Q7, Q57, Q92, Q105, Q110, Q212, Q214, Q221, Q243, Q250, Q251, Q256, Q257, Q272, Q276, Q353, Q358 and Q398. Q211, Q255 and Q433 also receive better-fit nonprovincial sources. Shared reference notes are made jurisdiction-neutral, producing source-only differences in 335 additional compiled rows. No remaining proposed question or source record names Manitoba. The private before/rollback rows intentionally retain their original text.

Q251 now tests training and experience for preparing a confined-space permit, not the signatory specified in one province's statute. Q256 tests consequences of a short fall into machinery without asserting a universal height exemption. Q358 refers to the responsible classification authority. Inland flood scenarios no longer name a province. Hypothetical authorization conditions in Q213/Q214 remain explicitly supplied in the question.

References checked September 15, 2026:

| Topic | Reference and scope |
| --- | --- |
| Lifting hardware | [CCOHS crane-hook slinging](https://www.ccohs.ca/oshanswers/safety_haz/materials_handling/hooks.html): load, hardware, lift plan and working load limits; original spreader-bar application. |
| Orientation | [CCOHS worker checklist](https://www.ccohs.ca/oshanswers/hsprograms/orientation.html): local hazards, equipment and emergency procedures. |
| Hazardous products | [CCOHS WHMIS education/training](https://www.ccohs.ca/oshanswers/chemicals/whmis_ghs/education_training.html): general education versus site/job procedures. |
| Ignition hazards | [CCOHS Methane](https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/methane.html): flammability and equipment protection; no drone certification claim. |
| Traffic | [CCOHS traffic-control zones](https://www.ccohs.ca/oshanswers/safety_haz/road_work/traffic_control.html): conditions-specific work-zone planning. |
| First aid | [CCOHS first aid](https://www.ccohs.ca/oshanswers/hsprograms/firstaid/firstaid_general.html): workforce, hazards, medical access and transport. |
| Entry permits | [CCOHS confined-space program](https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_program.html): permit preparation by someone trained and experienced; local signatures remain jurisdiction-dependent. |
| Noise | [CCOHS noise exposure](https://www.ccohs.ca/oshanswers/phys_agents/noise/exposure_can.html): level, duration and varying jurisdictional limits. |
| Falls | [CCOHS fall-protection planning](https://www.ccohs.ca/oshanswers/hsprograms/fall/fall_protection_general.html): openings and shorter falls into machinery. |
| Certification | [Canadian certification best practices](https://www.princeedwardisland.ca/sites/default/files/publications/canadian_best_practices_2019_final.pdf), section 2.2: classification changes and the responsible authority; framework background, not current local law. |

Research scope: these are original practice scenarios informed by the cited public references and independent mathematical working. This was a targeted jurisdiction/source review, not a fresh factual re-audit of all 503 items and not comparison with confidential exam questions. Shared WPI/ABC use does not establish identical provincial exam versions; section 5.7 of the Canadian best-practice document allows jurisdictions to add pertinent regulatory questions.

Validation: 50 focused tests pass; rebuilt all 503 rows with no screening candidates. Compared with the previous package: identities, answer positions, difficulty, review state, classifications, calculation flags, blueprint supply and metadata patches are preserved. Regenerate from the original private baseline; the new digest is recorded in the handoff. No merge, deployment or live content import was performed in this pass.
