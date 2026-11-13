# All learner-bank GPT-6 quality audit

**Audit date:** September 23, 2026
**Model:** GPT-6 Sol
**Scope:** 22,583 learner-visible legacy questions across 35 active banks. This review excluded all customer, payment, learner, and attempt data.

## Result

The review completed all 1,144 controlled batches. It found **6,513 content findings**: **1454 critical**, **1819 high**, and **3240 medium**. **3,273** critical or high items need controlled repair before they should be treated as fully verified.

> This is a content-quality assessment. It does not itself modify questions, learner visibility, customer access, pricing, or production data. Findings require source-bound repair and validation before publication.

## Finding types

| Finding type | Count |
|---|---:|
| technical_accuracy | 3486 |
| explanation | 3282 |
| jurisdiction_scope | 1958 |
| ambiguity | 1556 |
| answer_key | 1026 |
| safety | 685 |
| calculation | 628 |
| clarity | 585 |
| duplicate | 445 |
| units | 274 |

## Bank-by-bank priority

| Bank | Questions reviewed | Critical | High | Medium | Total findings | Finding rate |
|---|---:|---:|---:|---:|---:|---:|
| WPI Class III Water Distribution | 611 | 91 | 118 | 111 | 320 | 52.4% |
| Class 4 Water Distribution | 568 | 88 | 60 | 91 | 239 | 42.1% |
| WPI Class IV Water Distribution | 620 | 67 | 126 | 99 | 292 | 47.1% |
| WPI Class II Water Distribution | 595 | 64 | 112 | 113 | 289 | 48.6% |
| Class 3 Wastewater Collection | 572 | 77 | 47 | 110 | 234 | 40.9% |
| WPI Class IV Water Treatment | 678 | 66 | 76 | 121 | 263 | 38.8% |
| WPI Class II Wastewater Treatment | 599 | 61 | 91 | 79 | 231 | 38.6% |
| Class 2 Water Distribution | 535 | 69 | 45 | 91 | 205 | 38.3% |
| Class 4 Wastewater Collection | 570 | 69 | 42 | 79 | 190 | 33.3% |
| Class 4 Wastewater Treatment | 588 | 67 | 48 | 91 | 206 | 35% |
| Class 3 Wastewater Treatment | 580 | 66 | 36 | 113 | 215 | 37.1% |
| Water Quality Analyst (WQA) | 500 | 58 | 64 | 75 | 197 | 39.4% |
| Class 4 Water Treatment | 569 | 57 | 52 | 67 | 176 | 30.9% |
| Class 2 Wastewater Treatment | 547 | 59 | 39 | 73 | 171 | 31.3% |
| Class 3 Water Treatment | 563 | 49 | 48 | 98 | 195 | 34.6% |
| WPI Class III Water Treatment | 561 | 44 | 72 | 114 | 230 | 41% |
| Class 2 Wastewater Collection | 560 | 51 | 32 | 77 | 160 | 28.6% |
| WPI Class I Wastewater Treatment | 594 | 48 | 43 | 120 | 211 | 35.5% |
| Class 2 Water Treatment | 503 | 47 | 42 | 79 | 168 | 33.4% |
| WPI Class III Wastewater Treatment | 607 | 35 | 84 | 88 | 207 | 34.1% |
| WPI Class I Water Distribution | 500 | 38 | 58 | 97 | 193 | 38.6% |
| OIT — Water Treatment | 1038 | 30 | 69 | 183 | 282 | 27.2% |
| OIT — Wastewater | 1033 | 28 | 58 | 167 | 253 | 24.5% |
| WPI Class II Wastewater Collection | 503 | 18 | 66 | 86 | 170 | 33.8% |
| WPI Class II Water Treatment | 598 | 20 | 44 | 88 | 152 | 25.4% |
| WPI Class I Wastewater Collection | 499 | 20 | 40 | 63 | 123 | 24.6% |
| WPI Class III Wastewater Collection | 503 | 14 | 50 | 67 | 131 | 26% |
| WPI Class IV Wastewater Collection | 503 | 12 | 52 | 76 | 140 | 27.8% |
| WPI Class I Water Treatment | 598 | 14 | 22 | 147 | 183 | 30.6% |
| Class 3 Water Distribution | 821 | 9 | 36 | 53 | 98 | 11.9% |
| Class 1 Water Treatment | 805 | 8 | 7 | 50 | 65 | 8.1% |
| Class 1 Wastewater Treatment | 815 | 6 | 11 | 94 | 111 | 13.6% |
| Class 1 Water Distribution | 966 | 3 | 15 | 76 | 94 | 9.7% |
| Class 1 Wastewater Collection | 974 | 1 | 12 | 70 | 83 | 8.5% |
| WPI Class IV Wastewater Treatment | 907 | 0 | 2 | 34 | 36 | 4% |

## Immediate repair queue

The following queue contains the first 100 critical or high items, ordered by severity then bank and question number. The complete private evidence record remains outside the repository.

| Bank key | Question | Severity | Categories | Review finding |
|---|---:|---|---|---|
| class1-wastewater | 93 | critical | technical_accuracy, jurisdiction_scope, explanation | The explanation incorrectly asserts that all adverse conditions, including all bypasses and effluent exceedances, must be promptly reported to MECP. Reporting depends on the event and applicable legal or approval requirements. |
| class1-wastewater | 387 | critical | technical_accuracy, jurisdiction_scope, explanation, ambiguity | The options identify the Spills Action Centre but do not answer when to contact it. The explanation also states too broadly that every untreated or partially treated sewage bypass requires an immediate call, without establishing the applicable reporting trigger. |
| class1-wastewater | 389 | critical | technical_accuracy, jurisdiction_scope, explanation | The stem asks when a bypass is permitted, but the keyed option only defines it. The explanation implies blanket exceptions for emergencies and maintenance and universal MECP reporting; permissions and notification duties depend on applicable requirements and approval conditions. |
| class1-wastewater | 415 | critical | safety, technical_accuracy, explanation | The explanation presents fixed H2S and CO readings as universal safe-entry criteria and says a four-gas meter verifies safe conditions. Detector readings alone do not authorize confined-space entry or address all assessed hazards. |
| class1-wastewater | 427 | critical | safety, explanation | The explanation presents a face shield as an alternative to eye protection for chemical handling. A face shield alone does not adequately protect against chemical splashes. |
| class1-wastewater | 446 | critical | safety, technical_accuracy, explanation | The explanation presents fixed H2S and CO concentrations as proof that a confined-space atmosphere is safe. Those values alone cannot establish safe entry; exposure limits depend on duration, and other atmospheric hazards may exist. |
| class1-wastewater-coll | 468 | critical | technical_accuracy, jurisdiction_scope, explanation | The explanation asserts the same immediate recipients and follow-up reporting requirements for every SSO. Ontario notification duties depend on the circumstances and applicable requirements; notification of the local Medical Officer of Health is not established here as universal. |
| class1-water | 40 | critical | answer_key, clarity | The keyed option, “Polymer,” names the substance but does not answer what it does; no option states the intended purpose. |
| class1-water | 103 | critical | technical_accuracy, jurisdiction_scope, explanation | The explanation incorrectly says O. Reg. 169/03 prescribes aesthetic objectives, conflating the regulation’s standards with nonbinding objectives. |
| class1-water | 147 | critical | technical_accuracy, jurisdiction_scope, explanation | The explanation assigns an unconditional personal reporting duty to every operator based on certification class. Adverse-result notification duties under O. Reg. 170/03 depend on the regulated role and circumstances. |
| class1-water | 148 | critical | answer_key, clarity | The keyed option, “Activated carbon,” names the material rather than stating its purpose, so it does not answer the question. |
| class1-water | 197 | critical | answer_key, clarity | The keyed option, “Soda ash,” does not answer the question. No option states the pH- and alkalinity-increasing purpose given in the explanation. |
| class1-water | 237 | critical | technical_accuracy, jurisdiction_scope, explanation | The item assigns immediate direct reporting to the MECP and medical officer of health to every operator. O. Reg. 170/03 reporting duties depend on the actor and circumstances; an operator must not rely on this blanket description of the required response. |
| class1-water | 350 | critical | technical_accuracy, jurisdiction_scope, explanation | The explanation assigns every operator a direct legal duty to immediately report all adverse incidents to the MECP and medical officer of health. O. Reg. 170/03 allocates notification and corrective-action duties by role and circumstance; the stem does not identify the operator's role or the triggering event. |
| class1-water | 403 | critical | safety, explanation | The explanation presents a start attempt as verification of zero energy. That alone does not verify electrical isolation or control stored energy before maintenance. |
| class1-water-dist | 198 | critical | explanation, technical_accuracy | The explanation assigns the OIC overall operational responsibility for the system, conflating the OIC role with the operator with overall operational responsibility (ORO). The keyed option itself is supportable. |
| class1-water-dist | 351 | critical | jurisdiction_scope, technical_accuracy, explanation | The explanation incorrectly asserts that Ontario universally mandates lead service line replacement programs. |
| class1-water-dist | 415 | critical | technical_accuracy, safety, explanation | The explanation suggests total coliform detection is an AWQI only when accompanied by inadequate residual. Detectable total coliform in a distribution water sample is an adverse microbiological result independently of residual. |
| class2-wastewater | 5 | critical | answer_key, safety, technical_accuracy | Routine chlorine application is not an appropriate default immediate response to trickling-filter ponding and could disrupt treatment or create safety risks. |
| class2-wastewater | 11 | critical | jurisdiction_scope, technical_accuracy, answer_key | The item attributes a universal “Class A biosolids” unrestricted-use standard to O. Reg. 267/03; that terminology and the keyed below-detection requirement are not established as stated. |
| class2-wastewater | 22 | critical | safety, ambiguity, explanation | The cause of filamentous growth is not established, so the keyed chemical treatment is not necessarily preferable to correcting low dissolved oxygen. The explanation presents toxicant addition as selective and largely harmless without operational safeguards. |
| class2-wastewater | 31 | critical | jurisdiction_scope, technical_accuracy | The question attributes the U.S. Class B biosolids designation to Ontario Regulation 267/03, creating a materially incorrect regulatory premise. |
| class2-wastewater | 32 | critical | answer_key, calculation | The stated calculation gives (300 − 25) / 300 × 100 = 91.7%, but the key selects 87.5%. |
| class2-wastewater | 46 | critical | technical_accuracy, jurisdiction_scope, explanation | The keyed answer and explanation incorrectly present site-specific approvals and nutrient management plans as universal requirements under O. Reg. 267/03. Requirements depend on the material and application circumstances. |
| class2-wastewater | 47 | critical | answer_key, calculation | The calculation and explanation give 92.5%, but the key selects 87.5%. |
| class2-wastewater | 71 | critical | answer_key, jurisdiction_scope, technical_accuracy | O. Reg. 129/04 governs sewage works operator licensing; it does not set the effluent limits asserted by the keyed answer and explanation. |
| class2-wastewater | 82 | critical | answer_key, technical_accuracy | The keyed option says lime increases alkalinity requirements, but lime adds alkalinity and raises pH. Its sludge-production drawback is valid; the combined answer is not. |
| class2-wastewater | 83 | critical | answer_key, technical_accuracy | Fouled lamp sleeves reduce UV light delivered to the water, not the wastewater's measured UV transmittance (UVT). The stem and keyed answer conflate UVT with UV intensity. |
| class2-wastewater | 95 | critical | jurisdiction_scope, technical_accuracy | Class A and Class B pathogen categories and the stated land-application distinction reflect a U.S. biosolids framework, not an identified Ontario classification for land application. |
| class2-wastewater | 122 | critical | answer_key, technical_accuracy, jurisdiction_scope, explanation | O. Reg. 129/04 governs sewage works operator licensing; it does not set a 15 mg/L TSS effluent limit. The keyed value and explanation misstate the regulation. |
| class2-wastewater | 132 | critical | jurisdiction_scope, technical_accuracy, explanation | The Class A/Class B biosolids distinction and associated access and harvest restrictions are presented as Ontario land-application requirements, but this framing reflects the U.S. biosolids classification system. |
| class2-wastewater | 153 | critical | jurisdiction_scope, technical_accuracy, duplicate | The stem attributes approval of Ontario sewage works to the Environmental Protection Act; sewage works ECAs are issued under the Ontario Water Resources Act. The item also substantially duplicates question 141. |
| class2-wastewater | 165 | critical | answer_key, calculation | The calculation and explanation give 94.0%, but the key selects 96.0%. |
| class2-wastewater | 171 | critical | answer_key, technical_accuracy | TSS includes both volatile and fixed suspended solids; it does not alone determine the inert (fixed) fraction. The explanation correctly calls for TSS minus VSS, but that is not an option. |
| class2-wastewater | 173 | critical | jurisdiction_scope, technical_accuracy | The stem attributes a sewage-works ECA to Ontario's EPA, whereas sewage-works approval is governed by the Ontario Water Resources Act. The explanation reinforces the incorrect statutory attribution. |
| class2-wastewater | 175 | critical | answer_key, technical_accuracy | For denitrification-related rising sludge, increasing RAS can reduce sludge residence time in the clarifier. Increasing WAS is not the generally preferred immediate response and may impair nitrification. |
| class2-wastewater | 176 | critical | answer_key, ambiguity | A high clarifier blanket does not establish that the system contains too many solids. Increasing WAS is not necessarily the most immediate remedy; inadequate sludge withdrawal or poor settling may require different responses. |
| class2-wastewater | 193 | critical | answer_key, jurisdiction_scope, explanation | O. Reg. 129/04 governs operator licensing; it does not establish municipal effluent discharge limits or provincial water quality objectives. |
| class2-wastewater | 194 | critical | answer_key, technical_accuracy | The keyed answer attributes excess extracellular polymer production to low F:M as a general cause of viscous bulking. That causal link is unsupported as stated, leaving no reliably correct option. |
| class2-wastewater | 205 | critical | jurisdiction_scope, technical_accuracy, calculation, explanation | The explanation imports a U.S. EPA vector-attraction-reduction criterion as an Ontario Class B requirement. Its VS-reduction formula also incorrectly uses influent and effluent VS concentrations alone without accounting for solids mass flows. |
| class2-wastewater | 214 | critical | answer_key, technical_accuracy, explanation | The keyed cold-weather problem is unsupported by the explanation: oxygen solubility increases as water cools, while biological oxygen demand generally decreases. Cold weather more directly impairs digestion rate and stabilization. |
| class2-wastewater | 216 | critical | jurisdiction_scope, technical_accuracy, answer_key | The item attributes a 'Class A biosolids' classification and associated requirements to Ontario Regulation 267/03, conflating Ontario's regulatory framework with U.S. biosolids terminology. |
| class2-wastewater | 225 | critical | technical_accuracy, jurisdiction_scope, explanation | O. Reg. 129/04 governs sewage works operator licensing, not effluent monitoring or effluent quality standards. The explanation attributes effluent limits to the wrong regulation. |
| class2-wastewater | 237 | critical | technical_accuracy, jurisdiction_scope, safety, explanation | The keyed answer and explanation present U.S. Class A/B biosolids criteria and site-restriction terminology as though they govern Ontario land application. The claim that Class A has no site restrictions is also unsafe as a general rule. |
| class2-wastewater | 241 | critical | jurisdiction_scope, technical_accuracy, explanation | The explanation imports a “Class A” designation into an Ontario question and implies that 55–65°C for three days alone establishes pathogen reduction and suitability for soil amendment. |
| class2-wastewater | 246 | critical | answer_key, technical_accuracy | Viscosity of the prepared polymer solution indicates its concentration or preparation, not how much polymer is dosed to sludge. The keyed option is not a valid primary indicator of overdosing. |
| class2-wastewater | 247 | critical | jurisdiction_scope, technical_accuracy, explanation | Thermal drying does not by itself authorize unrestricted distribution or establish a “Class A” designation in Ontario. The stated solids percentage and end uses are also presented as universal. |
| class2-wastewater | 260 | critical | jurisdiction_scope, technical_accuracy, explanation | The explanation presents U.S. “Class A/Class B” labels and pH holding times as Ontario requirements; pH above 12 for 72 hours alone also does not establish the claimed Class A result. |
| class2-wastewater | 287 | critical | safety, technical_accuracy, explanation | The explanation presents a specific RAS chlorination rate and SRT reduction as general foam-control measures without establishing site conditions or safeguards; either intervention can adversely affect treatment. |
| class2-wastewater | 294 | critical | answer_key, technical_accuracy, explanation | TOC measures total organic carbon, not specifically the non-biodegradable fraction requested. None of the options directly measures that fraction. |
| class2-wastewater | 296 | critical | safety, jurisdiction_scope, technical_accuracy | The explanation gives unsupported universal coliform, applied-chlorine, and final-residual targets. A suggested 0.1–0.5 mg/L residual at discharge is also inconsistent with the federal WSER total residual chlorine limit applicable to regulated effluent. |
| class2-wastewater | 300 | critical | answer_key, technical_accuracy, explanation | Maintaining adequate hydraulic loading and media wetting is a principal purpose of trickling-filter recirculation, making option 1 stronger than the keyed option. Recirculation does not inherently increase contact time per pass. |
| class2-wastewater | 320 | critical | safety, explanation | The staged alkaline-chlorination instructions lower pH to 8–9 without requiring verification that cyanide oxidation is complete. Lowering pH while cyanide remains can release highly toxic hydrogen cyanide. |
| class2-wastewater | 336 | critical | jurisdiction_scope, technical_accuracy | A Class 2 plant does not have a prescribed set of ECA effluent limits. The listed concentrations and monthly averaging cannot be assumed from operator or facility class. |
| class2-wastewater | 338 | critical | answer_key, technical_accuracy, explanation | Low F:M and high MCRT can be associated with pin floc, but pin floc is not synonymous with non-filamentous bulking. The keyed explanation conflates distinct settling problems. |
| class2-wastewater | 339 | critical | jurisdiction_scope, technical_accuracy | The item asserts an unconditional duty to report every partial bypass immediately to both MECP and the local medical officer of health. Notification duties, recipients, and timing depend on applicable law and approval conditions. |
| class2-wastewater | 347 | critical | answer_key, technical_accuracy, ambiguity | White, frothy, unstable foam is commonly associated with young sludge or surfactants; excessive grease and oil is not the best general answer. The young-sludge distractor incorrectly pairs young sludge with low organic loading, leaving no clean answer. |
| class2-wastewater | 357 | critical | technical_accuracy, jurisdiction_scope, explanation | O. Reg. 129/04 governs sewage works operator licensing; it does not set the effluent limits claimed in the keyed answer and explanation. |
| class2-wastewater | 359 | critical | technical_accuracy, jurisdiction_scope, explanation | The item invents a universal Ontario secondary-treatment standard and treats 85% removal as interchangeable with 25 mg/L effluent limits. Applicable ECA conditions and federal WSER requirements must not be conflated. |
| class2-wastewater | 363 | critical | safety, jurisdiction_scope, technical_accuracy | Presents controlled bypass with disinfection as a general peak-flow strategy. Bypass is not a routine operator option; its permissibility and response depend on applicable approvals and regulatory requirements. |
| class2-wastewater | 369 | critical | answer_key, jurisdiction_scope, technical_accuracy | Class A and Class B biosolids are not the classification established by Ontario O. Reg. 267/03. The stated distinction also conflates pathogen-reduction classes with vector-attraction requirements. |
| class2-wastewater | 370 | critical | jurisdiction_scope, technical_accuracy | States that a capacity assessment is required at 80% of rated capacity, without identifying an applicable Ontario rule or site-specific approval condition establishing that trigger. |
| class2-wastewater | 378 | critical | jurisdiction_scope, technical_accuracy, explanation | The explanation incorrectly says O. Reg. 129/04 sets sewage-effluent limits. That regulation addresses licensing of sewage works operators, not plant-specific effluent limits. |
| class2-wastewater | 389 | critical | answer_key, jurisdiction_scope, technical_accuracy | “Class B biosolids” is a U.S. regulatory classification, not a designation under Ontario O. Reg. 267/03. The keyed access restriction is therefore unsupported as a stated Class B requirement of that regulation. |
| class2-wastewater | 408 | critical | jurisdiction_scope, technical_accuracy | The item applies US-style Class A biosolids terminology and associated land-use restrictions to Ontario without establishing an applicable Ontario regulatory basis. |
| class2-wastewater | 416 | critical | answer_key, technical_accuracy | Excessive RBC disc submergence chiefly reduces exposure to air and oxygen transfer; it does not necessarily reduce the disc surface available for biomass growth. No option states the primary consequence accurately. |
| class2-wastewater | 436 | critical | answer_key, technical_accuracy, ambiguity | The keyed option implies that staging an RBC ordinarily provides sequential denitrification. Conventional aerobic RBC stages support BOD removal and, where designed, nitrification; denitrification requires suitable anoxic conditions. |
| class2-wastewater | 439 | critical | jurisdiction_scope, technical_accuracy, answer_key | The item treats “Class B biosolids” as an Ontario land-application regulatory classification. That terminology does not establish the applicable Ontario requirements, so the keyed regulatory claim is misleading. |
| class2-wastewater | 458 | critical | jurisdiction_scope, technical_accuracy, answer_key | The question presents US-style “Class A biosolids” as an Ontario regulatory land-application classification; the keyed processes alone do not establish compliance with Ontario requirements. |
| class2-wastewater | 463 | critical | answer_key, calculation | The explanation correctly calculates 31.8 m³/m²/day, but the key selects 25.0 m³/m²/day. |
| class2-wastewater | 472 | critical | answer_key, calculation | The worked calculation gives 95% removal, but the key selects 98%. |
| class2-wastewater | 480 | critical | technical_accuracy, jurisdiction_scope, explanation | O. Reg. 129/04 governs operator licensing; it does not set the stated BOD5 and TSS effluent limits. The item falsely attributes a blanket 25 mg/L monthly limit to that regulation. |
| class2-wastewater | 489 | critical | answer_key, jurisdiction_scope, technical_accuracy | The keyed 38% volatile-solids-reduction alternative conflates a vector-attraction criterion with pathogen-reduction processes and is not established as the stated general Ontario land-application requirement. |
| class2-wastewater | 491 | critical | jurisdiction_scope, technical_accuracy | The item presents Class A/Class B and PFRP/PSRP as the governing Ontario land-application classification without establishing that framework. This materially misstates the regulatory scope. |
| class2-wastewater | 500 | critical | jurisdiction_scope, technical_accuracy | The keyed answer asserts that every SSO requires immediate reporting to both MECP and the local medical officer of health, and the explanation asserts a universal written follow-up. Those duties cannot be stated universally without the applicable spill-reporting rules and site conditions. |
| class2-wastewater | 506 | critical | answer_key, calculation, units | The stem asks for kg BOD₅/kg MLVSS·d, but provides only MLSS. The keyed value is calculated per kg MLSS, not per kg MLVSS. |
| class2-wastewater | 547 | critical | answer_key, ambiguity, calculation | The stated 8.0 ML/d is mixed-liquor flow to the clarifier, not influent flow to the aeration system. Dividing RAS flow by clarifier feed gives 40%, but that is not the stated recirculation ratio; neglecting wastage, influent flow is 8.0 − 3.2 = 4.8 ML/d and the ratio is 66.7%. No option pairs that ratio with the correctly calculated SVI of 80 mL/g. |
| class2-wastewater-coll | 3 | critical | answer_key, jurisdiction_scope, technical_accuracy | This drinking-water question is outside the wastewater collection scope, and the keyed notification sequence and timing are misleading for an adverse drinking-water result. |
| class2-wastewater-coll | 16 | critical | answer_key, calculation, units | For a full 0.6 m diameter pipe, π(0.3 m)² × 1.2 m/s × 86,400 s/day ≈ 29,300 m³/day. No option is close; the explanation acknowledges the discrepancy but keys 2,930 m³/day. |
| class2-wastewater-coll | 26 | critical | safety, technical_accuracy | A blanket one-metre minimum for equipment near a trench does not establish a safe setback; equipment loads can destabilize excavation walls. The one-metre rule for excavated material should not be generalized to equipment. |
| class2-wastewater-coll | 31 | critical | safety, jurisdiction_scope, answer_key | The keyed range permits oxygen concentrations above Ontario’s 23% threshold for an oxygen-enriched atmosphere under O. Reg. 632/05. |
| class2-wastewater-coll | 39 | critical | technical_accuracy, answer_key, explanation | A full pipe dipping below the hydraulic grade line is not thereby under vacuum; pressure at points below that line is positive. The keyed option and explanation misstate siphon hydraulics. |
| class2-wastewater-coll | 51 | critical | answer_key, safety, jurisdiction_scope | The asserted three-person minimum is not established by O. Reg. 632/05. Treating a supervisor or designated rescuer as a required third person also conflates entry supervision with rescue arrangements. |
| class2-wastewater-coll | 54 | critical | jurisdiction_scope, technical_accuracy | O. Reg. 170/03 governs drinking-water systems, not wastewater incident notification. Its notification rule cannot be presented as the wastewater operator's governing requirement. |
| class2-wastewater-coll | 75 | critical | answer_key, technical_accuracy, safety, ambiguity | The stem places the device at a sewer connection, but the keyed answer describes protection of a potable-water supply. A sewer backwater valve and a potable-water backflow preventer address different flow paths and hazards. |
| class2-wastewater-coll | 93 | critical | answer_key, calculation, explanation | With 15 kW input at 75% efficiency, output is 11.25 kW, or approximately 15.1 hp (index 1), not the keyed 20.1 hp. The explanation acknowledges the mismatch. |
| class2-wastewater-coll | 97 | critical | technical_accuracy, jurisdiction_scope, answer_key | O. Reg. 129/04 governs licensing of sewage works operators, not Certificates of Approval; it does not establish the stated general requirement for an approved collection-system operations and maintenance manual. |
| class2-wastewater-coll | 108 | critical | safety, technical_accuracy | The explanation labels zinc-chloride smoke non-toxic, which is unsafe: its aerosol can irritate or harm the respiratory tract. A connection revealed by smoke is not necessarily illegal. |
| class2-wastewater-coll | 116 | critical | answer_key, technical_accuracy, jurisdiction_scope | O. Reg. 170/03 governs drinking water, not wastewater collection, and the keyed 30-minute reporting requirement is unsupported. The explanation substitutes a general wastewater notification principle for the regulation asked about. |
| class2-wastewater-coll | 119 | critical | answer_key, technical_accuracy, safety | The keyed answer and explanation incorrectly attribute the primary immediate H2S hazard to rapid oxygen displacement. H2S is acutely toxic by inhalation even when oxygen is adequate. |
| class2-wastewater-coll | 138 | critical | safety, answer_key | Keying atmospheric testing as the first step after deciding entry bypasses the required hazard assessment and entry planning. The explanation also implies one test establishes that a confined space is safe to enter. |
| class2-wastewater-coll | 147 | critical | safety, technical_accuracy, explanation | The explanation says a locate marks the precise locations of all underground utilities. Locate markings have tolerances and may not cover private infrastructure; treating them as exact or exhaustive creates an excavation hazard. |
| class2-wastewater-coll | 153 | critical | jurisdiction_scope, technical_accuracy, explanation | The explanation cites O. Reg. 129/04 as a source of sanitary-sewer-overflow reporting requirements; that regulation addresses sewage-works operator licensing, not spill notification. |
| class2-wastewater-coll | 158 | critical | answer_key, jurisdiction_scope, technical_accuracy | The keyed Sustainable Water and Wastewater Management Act, 2002 is not an operative source of the claimed municipal water-and-wastewater financial-plan requirement. O. Reg. 453/07 is under the Safe Drinking Water Act and concerns municipal drinking-water financial plans, not a general wastewater-system requirement. |
| class2-wastewater-coll | 166 | critical | answer_key, technical_accuracy, jurisdiction_scope, explanation | O. Reg. 129/04 governs operator licensing; it does not establish a 25 mg/L monthly-average TSS discharge limit. The keyed regulatory claim is false. |
| class2-wastewater-coll | 195 | critical | answer_key, technical_accuracy, ambiguity | In open-channel hydraulics, critical velocity is associated with critical flow (Froude number of one). The keyed definition instead describes self-cleansing velocity. |
| class2-wastewater-coll | 223 | critical | technical_accuracy, safety, jurisdiction_scope, explanation | The explanation attributes a 23.5% acceptable oxygen upper limit to Ontario's confined-spaces regulation. Ontario defines an oxygen-enriched atmosphere as more than 23% oxygen. |
| class2-wastewater-coll | 237 | critical | safety, technical_accuracy, explanation | The explanation says notification follows containment, which could encourage delaying prompt spill reporting when notification is required. |
| class2-wastewater-coll | 240 | critical | answer_key, calculation, explanation | Motor electrical input is 0.05 × 20 × 9.81 ÷ (0.75 × 0.90) ≈ 14.53 kW, so option B is closest, not keyed option C. The explanation reaches this result but retains the wrong key. |
| class2-wastewater-coll | 261 | critical | answer_key, calculation, explanation | 2000 US gpm × 50 ft ÷ 3960 ≈ 25.3 WHP, but the key selects 35.4 WHP. The explanation itself identifies the mismatch. |

## Release approach

Repairs should be executed in bank-specific, source-bound batches. Each batch must preserve an immutable before-image, validate option and answer-key integrity, verify calculations and jurisdictional scope, run the repository test suite, and then publish only after a target-bound production preflight. Broad metadata improvements, including citations and blueprint fields, should be tracked separately from learner-facing content repairs so they do not create unnecessary content churn.
