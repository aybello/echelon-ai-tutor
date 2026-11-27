# Source check: ceu-lime-softening
Checked and extended after the gap fill 2026-11-26 against ceusrc/sp6.txt (Spellman, Handbook of Water and Wastewater Treatment Plant Operations, 2nd ed., page markers as printed), sp2.txt and sp3.txt (Handbook for Waterworks Operator Certification), ceusrc/wqc.txt (Water Quality Control Handbook) and two NIOSH Pocket Guide pages (URLs return 200). ceusrc/ca-treat.txt (California range of knowledge) has no lime softening content, so it supports nothing here.

## Totals
| Group | Supported | Contradicted | Not covered | Total |
|---|---|---|---|---|
| Lesson claims | 64 | 0 | 27 | 91 |
| Question groups (27 numeric questions in 13 groups) | 10 | 0 | 3 | 13 |

The 37 concept questions test the lesson claims below and are not counted again. Every numeric answer was recomputed with a separate python3 -I script (lime-build/numcheck.py). NOT COVERED means the listed texts are silent; those items are general chemistry or practice, kept qualitative, with no numbers taken from outside sources, and are listed in the notes as unsupported by the texts. Items taken from Royce U (the topic list only) were not used as a source.

## Lesson claims
| Location | Claim | Verdict | Evidence (location and quote) |
|---|---|---|---|
| M1 Why hardness matters | Hardness comes mostly from calcium and magnesium; iron, strontium and barium add some | SUPPORTED | sp6 5.6.12, p.137: "others include iron, strontium, and barium" |
| M1 Why hardness matters | Groundwater is generally harder than surface water | SUPPORTED | sp6 18.5.3.8, p.610: "groundwaters are harder than surface waters" |
| M1 Why hardness matters | Soil carbon dioxide forms carbonic acid that dissolves minerals | SUPPORTED | sp6 18.5.3.8: "natural carbon dioxide in the soil enters the water and forms carbonic acid" |
| M1 Why hardness matters | Soap use, scum, scale and boiler damage | SUPPORTED | sp6 18.5.3.8, p.611: "increases soap consumption, leaves a soapy scum"; "boiler scale" |
| M1 Why hardness matters | Hardness is not considered a health hazard | SUPPORTED | sp6 11.5, p.435: "Hardness is not considered a health hazard" |
| M1 Why hardness matters | Low hardness adds to corrosive tendency | SUPPORTED | sp6 p.435: "Low hardness contributes to the corrosive tendencies of water" |
| M1 Why hardness matters | Classes soft below 75, very hard above 300 mg/L as CaCO3 (typical) | SUPPORTED | sp6 Table 11.4, p.435 and Table 18.2, p.611 |
| M1 Why hardness matters | Customer objection depends on what they are used to; utility sets its goal | SUPPORTED | sp3 15.2.3: "dependent on the amount of hardness they are used to" |
| M1 mg/L as CaCO3 | Factors 2.50 and 4.12 follow from equivalent weights 50.0, 20.0, 12.2 | SUPPORTED | sp6 5.6.12, p.137 lists 20.04, 12.15 and 50.045 and the ratio formula; factors derived from them |
| M1 mg/L as CaCO3 | 1 gr/gal is about 17.1 mg/L (0.01712 g/L) | SUPPORTED | wqc appendix conversion table: "Grains / gallon (U.S.) (GPG) ... 0.01712" |
| M1 Carbonate / non-carbonate | Temporary hardness is carbonate hardness, permanent is non-carbonate | SUPPORTED | sp6 18.5.3.8, p.611 Note: "Temporary hardness is also known as carbonate hardness" |
| M1 Carbonate / non-carbonate | Total = carbonate + non-carbonate; alkalinity at or above hardness means no non-carbonate | SUPPORTED | sp6 5.6.12.4, p.138, Eq. 5.119 to 5.122 |
| M1 Carbonate / non-carbonate | Alkalinity is acid-neutralizing capacity from bicarbonate, carbonate and hydroxide, as CaCO3 | SUPPORTED | sp6 5.6.12.5, p.139: "Alkalinity measures the acid-neutralizing capacity" |
| M1 Carbonate / non-carbonate | Below about pH 8.3 all alkalinity is bicarbonate | NOT COVERED | Texts give 8.3 only as the phenolphthalein end point; general chemistry, kept as stated |
| M1 Carbonate / non-carbonate | Carbonate hardness handled by lime; non-carbonate needs soda ash | SUPPORTED | sp6 5.6.12.6, p.140: "Soda ash ... is used for precipitation and removal of noncarbonate hardness" |
| M1 What softening does | Lime raises pH, bicarbonate becomes carbonate, calcium precipitates as CaCO3 | SUPPORTED | sp6 18.11.2.1.5, p.655 |
| M1 What softening does | Calcium removal at pH about 9 to 9.5; magnesium needs excess lime, Mg(OH)2 above about 10.5 | SUPPORTED | sp6 p.655: "pH range of 9 to 9.5"; "Magnesium hydroxide precipitates at pH levels greater than 10.5" (p.437 gives 9.4 and 10.6) |
| M1 What softening does | Plain, excess-lime, split and lime-soda are common arrangements | SUPPORTED | sp6 p.655: "excess lime treatment, split lime treatment, and lime-soda softening are all common" |
| M1 What softening does | Split treatment: part of the flow treated, blended with bypass | NOT COVERED | sp6 names split treatment only; bypass and blend described for cation exchange in sp3 15.2.3.2.2, p.186. Concept only, no ratio given |
| M1 What softening does | Ion exchange swaps Ca and Mg for sodium and makes brine, not sludge | SUPPORTED | sp6 11.6.4.2, p.437 |
| M1 What softening does | Lime-soda cuts minerals, solids, iron, manganese, color, bacteria; drawbacks sludge and careful operation | SUPPORTED | sp6 11.6.4.1, p.437 |
| M1 What softening does | The goal is a chosen leftover hardness, not zero | NOT COVERED | Not stated in the texts; supported only indirectly by p.435 on low hardness and sp3 p.186 blending. Kept qualitative |
| M2 Reactions | Molecular weights CaO 56.1 and Ca(OH)2 74.1 | SUPPORTED | NIOSH NPG calcium oxide and calcium hydroxide: "Molecular Weight 56.1", "74.1" |
| M2 Reactions | Molecular weights CaCO3 100 and CO2 44 | NOT COVERED | CO2 ratios 44/74 and 44/24.3 appear in sp6 Eq. 5.128; 100 and 44 are general chemistry |
| M2 Reactions | CO2 + Ca(OH)2 gives CaCO3; Ca(HCO3)2 + Ca(OH)2 gives 2 CaCO3 (concept) | NOT COVERED | Equations are not printed in the texts; sp6 describes the shift only. General chemistry |
| M2 Reactions | Raw-water CO2 uses lime without adding hardness | NOT COVERED | Not stated in the texts; general chemistry |
| M2 Reactions | CaSO4 + Na2CO3 gives CaCO3 (soda ash for non-carbonate) | NOT COVERED | sp6 supports the purpose (p.140), not the equation |
| M2 Constants | Soda ash = non-carbonate hardness x 106/100 | SUPPORTED | sp6 Eq. 5.126, p.140: "Soda ash (mg/L) = Noncarbonate hardness ... x 106/100" |
| M2 Constants | Lime constants 1.27, 0.56, 2.31 mg/L CaO per mg/L | NOT COVERED | Derived from molecular weights (56/44, 56/100, 56.1/24.3); not printed in the texts |
| M2 Constants | Feed rate lb/day = MGD x mg/L x 8.34 | SUPPORTED | sp6 Eq. 5.129, p.141 |
| M2 Constants | Divide dose by purity as a decimal | NOT COVERED | General arithmetic; texts use purity only for fluoride |
| M2 Constants | Dose determined by jar or pilot testing and history | SUPPORTED | sp6 5.6.12.8, p.141: "determined by lab or pilot scale testing (e.g., jar testing, pilot plant)" |
| M2 Constants | Hydrated lime needs about 1.32 times the mass of quicklime for the same effect | SUPPORTED | Derived from NIOSH molecular weights 74.1 / 56.1 |
| M2 Alkalinity | Alkalinity (mg/L as CaCO3) = mL x N x 50,000 / sample mL | SUPPORTED | sp6 Eq. 5.123 and 5.124, p.139 |
| M2 Sludge | Considerable sludge; disposal expensive | SUPPORTED | sp6 p.655: "Considerable amounts of sludge are produced in a lime softening system, and its disposal is expensive" |
| M2 Sludge | Magnesium removal forms magnesium hydroxide | SUPPORTED | sp6 11.6.4.1, p.437: "magnesium hardness to magnesium hydroxide" |
| M2 Sludge | Two parts CaCO3 form per part of carbonate hardness removed | NOT COVERED | Stoichiometry; not stated in the texts |
| M3 Units | Flocculation is slow mixing to raise collisions and form larger flocs | SUPPORTED | sp6 18.7, p.616: "slowly mixing the coagulated water to increase the probability of particle collision" |
| M3 Units | Jar test imitates fast mix then slow mix then settling | SUPPORTED | sp6 18.6, p.616 |
| M3 Units | Rapid mix disperses chemical within seconds | NOT COVERED | Not stated for softening in the texts; general practice |
| M3 Units | Solids-contact unit has a slurry sample taken for percent settled solids | SUPPORTED | sp6 5.6.7.6, p.116: "100-mL slurry sample from the solids contact unit" |
| M3 Units | Percent settled solids = settled mL / sample mL x 100 after 10 min | SUPPORTED | sp6 Eq. 5.77, p.116 |
| M3 Units | One tank combining mix, flocculation and settling with recirculating blanket and launders | NOT COVERED | Description not in the texts; kept qualitative, no rates or times |
| M3 Units | Existing solids reduce lime waste and speed floc | NOT COVERED | Not in the texts; general practice |
| M3 Units | Weirs and launders must be level; short-circuiting | NOT COVERED | Not in the texts; flagged in lesson as general operating idea |
| M3 Units | Thick blanket spills solids over weirs | NOT COVERED | Not in the texts; general practice |
| M3 Stabilization | Recarbonation adjusts water so it neither corrodes nor deposits CaCO3; CO2 is the usual pH adjustment; removes bitterness | SUPPORTED | sp6 11.6.5, p.437 and 18.11.2.1.5, p.655 |
| M3 Stabilization | Acid is an alternative to CO2 | NOT COVERED | Not discussed in the texts; lesson says so |
| M3 Stabilization | Langelier index shows whether CaCO3 deposits or dissolves | SUPPORTED | sp6 glossary: "indicates whether calcium carbonate will be deposited or dissolved"; sp2 glossary |
| M3 Stabilization | Positive index means scale, negative means corrosion | NOT COVERED | Sign convention not printed; texts give a target near 0.5 only (sp6 p.613) |
| M3 Stabilization | Index reflects CaCO3 only and may not show corrosion for a pipe material | SUPPORTED | sp6 p.613 Note: "may not actually reflect the corrosive nature of the particular water for a specific pipe material" |
| M3 Stabilization | Excess CO2 can redissolve CaCO3 | NOT COVERED | Not in the texts; general chemistry |
| M3 Stabilization | CO2 dose = Ca(OH)2 excess x 44/74 + residual Mg x 44/24.3 | SUPPORTED | sp6 Eq. 5.128, p.140 |
| M3 Stabilization | Recarbonation is placed ahead of the filters | NOT COVERED | Texts say "during or after" softening; the order ahead of filters is general plant practice |
| M3 Recalcination, filters | Recalcination can recover and reuse lime sludge and reduce disposal | SUPPORTED | sp6 p.655: "install recalcination equipment to recover and reuse the lime sludge" |
| M3 Recalcination, filters | Heating sludge recovers calcium oxide | NOT COVERED | Mechanism not in the texts |
| M3 Recalcination, filters | Lime floc carryover makes turbidity targets harder; acidified samples allowed | SUPPORTED | sp6 18.9.3.2: "residual lime floc carryover inherent in the process" |
| M3 Recalcination, filters | Scale can cement filter grains (encrustation) | SUPPORTED | sp6 11.6.4, p.437: "encrustation of pipes (cementing together the individual filter media grains)" |
| M4 Jar test | Fast mix about 1 min at high speed, slow mix about 20 min, settle 20 to 30 min; observe floc, clarity | SUPPORTED | sp6 18.6, p.616 steps 1 to 5 |
| M4 Jar test | Jar test gives a ballpark; repeat with narrower range | SUPPORTED | sp6 p.616: "only an attempt to achieve a ballpark approximation" |
| M4 Monitoring | Alkalinity type and amount drive the softening dose | SUPPORTED | sp6 15.8, p.559: "proper chemical dosage will depend on the type and amount of alkalinity" |
| M4 Monitoring | Lime dose partly based on magnesium hardness | SUPPORTED | sp6 15.8, p.559 |
| M4 Monitoring | Temperature affects reaction rate | NOT COVERED | Not in the texts |
| M4 Monitoring | Hardness by EDTA titration with indicator color change | SUPPORTED | sp6 15.8, p.559 |
| M4 Monitoring | Lab pH measured within about two hours; CO2 from air moves pH toward 7 | SUPPORTED | sp6 15.8.9, p.560: "measured within 2 hours ... moving the pH toward 7" |
| M4 Monitoring | pH meter must be calibrated | NOT COVERED | Texts say a quality meter is needed for accuracy; calibration not stated |
| M4 Monitoring | Samples at raw, settled, filtered points | NOT COVERED | General practice |
| M4 Scale | Oversaturated water deposits CaCO3 as an encrusting film | SUPPORTED | sp6 11.6.5, p.437: "deposit calcium carbonate, which can produce an encrusting film" |
| M4 Scale | The term post-precipitation and its signs (crust, head loss) | NOT COVERED | Not in the texts; descriptive |
| M4 Sludge | Sedimentation sludge may go to a lagoon, be thickened and held, or go to the sewer | SUPPORTED | sp2 5.2.3: "disposed of by passing it to a lagoon, by thickening and holding, or by directing it to the sanitary sewer" |
| M4 Sludge | Vacuum filters and sand drying beds are dewatering methods for biosolids | SUPPORTED | sp6 5.7.9.4 and 5.7.9.5 |
| M4 Sludge | Landfill and land application of lime sludge; choice and solids percentages | NOT COVERED | Not in the texts; left to plant plan and permit |
| M4 Feed equipment | Lime is relatively insoluble, slurry kept moving, dust collectors for hydrated lime | SUPPORTED | wqc Ch.7: "slurry be kept mixed and pumped in a loop ... velocity greater than 2 fps"; "dust collectors should be provided" |
| M4 Feed equipment | Hopper agitation needed for dry feed of light hydrated lime | SUPPORTED | wqc Appendix D-13: "hopper agitation required for dry feed of light form" |
| M4 Feed equipment | Quicklime is slaked with water to hydrated lime | SUPPORTED | wqc Appendix D-13: "slaked to form hydrated lime"; "amount of water critical for efficient slaking" |
| M4 Feed equipment | Dry feeders are volumetric (simpler, cheaper, less accurate) or gravimetric (extremely accurate, higher cost) | SUPPORTED | sp6 18.5.3.3.2 and sp2 3.3.1.2: "volumetric dry feeders are also less accurate. Gravimetric dry feeders are extremely accurate" |
| M4 Safety | Lime irritates and burns eyes, skin, respiratory system | SUPPORTED | NIOSH NPG: "irritation eyes, skin, upper respiratory system; eye, skin burns" |
| M4 Safety | Quicklime reacts with water and gives off heat | SUPPORTED | NIOSH NPG calcium oxide: "Water (liberates heat)" |
| M4 Safety | Eyewash and quick drench are provided | SUPPORTED | NIOSH NPG: "Provide: Eyewash, Quick drench" |
| M4 Troubleshooting | Order of checks for the Cedar Flats case; feed and raw water first | NOT COVERED | Scenario reasoning; the lesson says it is not stated in the texts |
| M1 What softening does | Zero-hardness water is very corrosive, so flow is blended to leave some hardness (ion exchange example, about 50 to 75 mg/L as CaCO3) | SUPPORTED | sp3 15.2.3.2.2, p.186; sp6 p.612 |
| M1 What softening does | Calcium carbonate stability is the most effective means of corrosion control | SUPPORTED | sp6 18.5.3.10, p.613 |
| M2 Forms of lime | Lime sold as powdered hydrated lime or granular quicklime; about 90 percent available CaO listed | SUPPORTED | wqc 11.3.1; wqc table: "Pulverized Quicklime ... 90% available CaO" |
| M2 Forms of lime | Hydrated lime settles out easily, making pumping and handling troublesome | SUPPORTED | wqc 11.3.1: "easily precipitates making pumping and handling troublesome" |
| M2 Forms of lime | Aeration removes carbon dioxide | SUPPORTED | sp2 p.89: "Aeration works to remove carbon dioxide (CO2)" |
| M2 Forms of lime | Removing CO2 first would lower the lime term for CO2 | NOT COVERED | Inference from the dose arithmetic, flagged as such in the lesson |
| M4 Monitoring | Phenolphthalein alkalinity titrates to pH 8.3, total to pH 4.5; worked example with zero P | SUPPORTED | sp6 Eq. 5.123, 5.124 and Example 5.196, p.139 |
| M4 Monitoring | Alum uses alkalinity (0.45 mg/L per mg/L alum); lime, soda ash and caustic add alkalinity and raise pH | SUPPORTED | sp6 5.6.7.7, p.117; sp6 18.5.3.10, p.613 |
| M4 Feed equipment | Feeder calibration ensures effective control and economy | SUPPORTED | sp6 18.5.3.4: "Chemical feeder calibration ensures effective control of the treatment process" |
| M4 Safety | Hydrated lime attacks some metals; suitable handling materials listed | SUPPORTED | NIOSH NPG calcium hydroxide: "Attacks some metals"; wqc Appendix D-13 suitable handling materials |
| M4 Monitoring | Regulator sets what to sample; lime plants may acidify turbidity samples under state protocol | SUPPORTED | sp6 18.9.3.2: "allowing such systems to acidify turbidity samples" |

## Question arithmetic
| Questions | Calculation | Verdict | Basis |
|---|---|---|---|
| hardness-basics-c2, f2, a2 | Total hardness from Ca and Mg (3 questions) | SUPPORTED | sp6 Eq. 5.116 to 5.118 |
| hardness-basics-c3, f3, a4, c6 | Carbonate / non-carbonate from alkalinity (4) | SUPPORTED | sp6 Eq. 5.119 to 5.122 |
| hardness-basics-c5, a3 | mg/L to gr/gal at 17.1 (2) | SUPPORTED | wqc conversion table |
| chemistry-and-dose-c2, c3, f2, a2 | Lime CaO dose constants (4) | NOT COVERED | Constants stated in prompt; derived from molecular weights |
| chemistry-and-dose-c4, a4, f4 | Soda ash dose (3) | SUPPORTED | sp6 Eq. 5.126 |
| chemistry-and-dose-c5 | Purity correction (1) | NOT COVERED | General arithmetic |
| chemistry-and-dose-f1, a3 | Feed rate lb/day, lb/hr (2) | SUPPORTED | sp6 Eq. 5.129 to 5.130 |
| chemistry-and-dose-f3 | Ca(OH)2 equivalent of CaO (1) | SUPPORTED | NIOSH molecular weights |
| chemistry-and-dose-f5 | Sludge mass estimate (1) | NOT COVERED | Assumption stated in prompt |
| process-units-c4, a2 | Percent settled solids (2) | SUPPORTED | sp6 Eq. 5.77 |
| process-units-f1, a3 | Recarbonation CO2 dose (2) | SUPPORTED | sp6 Eq. 5.127/5.128 |
| operation-troubleshooting-c2, f2, a3 | Alkalinity from titration (3) | SUPPORTED | sp6 Eq. 5.124 |
| operation-troubleshooting-f1, a2 | Feeder setting (2) | SUPPORTED | sp6 Eq. 5.129 |
