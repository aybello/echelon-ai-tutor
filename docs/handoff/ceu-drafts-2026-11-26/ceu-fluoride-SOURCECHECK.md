# Source check: ceu-fluoride vs textbooks

Checked 2026-11-26 against the text extractions in ceusrc (sp6 Spellman Handbook 2009; sp3 Spellman Waterworks Vol 1 1996; wqc Water Quality Control Handbook) plus the CDC about page fetched 2026-11-26. Page markers are printed page numbers or section numbers (extractions are not paginated). Verdicts: SUPPORTED, CONTRADICTED, NOT COVERED (books silent; the claim may rest on the Royce topic list or general practice and is kept only at recognition or purpose level). No exact regulatory limit is stated in the course, so none was checked.

## Totals

| SUPPORTED | CONTRADICTED | NOT COVERED | Total claims |
|---|---|---|---|
| 68 | 0 | 14 | 82 |

Gap-fill claims from wtp2 were added after the first pass. Calculation questions (15 of 64) are arithmetic from the constants above and were recomputed in recompute.py; they are not counted as claims. Distractors were checked not to rest on a book statement.

## Claims

| Location | Claim | Verdict | Evidence |
|---|---|---|---|
| M1 What fluoridation is | Fluoridation adjusts fluoride content; operators may be directed to do it | SUPPORTED | sp3 (Spellman WF 1996) Ch.18.2 p.224: "may be directed to adjust the fluoride content of the water"; CDC about page: "process of adjusting the amount of fluoride" |
| M1 What fluoridation is | Decision is local or state; CDC does not mandate | SUPPORTED | CDC about page: "State and local governments decide whether to implement water fluoridation"; "CDC does not mandate" |
| M1 What fluoridation is | Decay is caused by acids from bacteria acting on sugars; fluoride strengthens enamel and aids rebuilding | NOT COVERED | Textbooks give outcome only (sp3 p.223 "maximum reduction in tooth decay"); mechanism taken from general dental science and the Royce topic list, not verified in the books; kept at concept level |
| M1 What fluoridation is | At the right level there is a large decay reduction without aesthetically significant fluorosis | SUPPORTED | sp3 (Spellman WF 1996) p.223: "maximum reduction in tooth decay with no aesthetically significant dental fluorosis" |
| M1 Natural vs adjusted | Fluoride is seldom appreciable in surface water, appears in groundwater in some regions, in some igneous or sedimentary rocks | SUPPORTED | sp3 (Spellman WF 1996) 18.1 p.224: "seldom found in appreciable quantities in surface waters and appears in groundwater in only a few geographical regions"; HB 5.6.11.1 same |
| M1 Natural vs adjusted | Amount fed depends on desired level, natural level and chemical chosen | SUPPORTED | sp3 (Spellman WF 1996) 18.2 p.224: "depends upon the amount of fluoride desired in the finished water, the amount already naturally present, and the fluoride source selected" |
| M1 Natural vs adjusted | Test reports total fluoride; natural plus calculated dose gives theoretical concentration | SUPPORTED | sp6 (Spellman HB 2009) 5.6.11.4.4 p.135: "Adding the calculated dosage to the natural fluoride level ... will yield the theoretical concentration" (the cannot-distinguish statement itself is from Royce slide 248, not a book) |
| M1 Natural vs adjusted | Excess natural fluoride needs alternate supply or treatment | SUPPORTED | sp3 (Spellman WF 1996) 18.1 p.224: "alternate water supplies must be used or treatment to reduce the fluoride concentration must be applied" |
| M1 Natural vs adjusted | Defluoridation uses activated alumina or reverse osmosis; blending | SUPPORTED | sp6 (Spellman HB 2009) water treatment process table (Spellman, adapted from AWWA 1984): "Activated alumina - Removes some inorganic contamination"; "Reverse osmosis ... Removes nearly all inorganic contaminants". Blending is general practice, NOT COVERED by books |
| M1 Optimal level | Older recommendation varied with climate because water intake rises in warm weather | SUPPORTED | sp6 (Spellman HB 2009) 5.6.11.3 p.132: levels "based on the annual average of the maximum daily air temperature"; Table 5.7; E formula uses ounces of water per pound of body weight |
| M1 Optimal level | Later guidance moved to a single recommended value | SUPPORTED | CDC about page: "The recommended fluoride concentration ... (also called the optimal level)" stated as one value (value not reproduced in the course) |
| M1 Optimal level | A control range around the target; small shortfalls cut benefit | SUPPORTED | sp6 (Spellman HB 2009) Table 5.7 control range; p.133: "Even a drop of 0.2 ppm below optimal levels can reduce dental benefits significantly" (number not reproduced) |
| M1 Optimal level | Primary standard protects health; secondary is advisory for tooth appearance | SUPPORTED | sp6 (Spellman HB 2009) Table 14.3 Secondary MCLs: fluoride, "Dental fluorosis"; WF p.224 "Fluoride levels in water should not exceed" (values not reproduced) |
| M1 Health | Fluoride is toxic in large quantities | SUPPORTED | sp3 (Spellman WF 1996) 18.1 p.224: "Fluoride is toxic to humans in large quantities" |
| M1 Health | Excess over time causes mottled or discolored teeth (dental fluorosis) | SUPPORTED | sp3 (Spellman WF 1996) p.224: "mottled or discolored teeth, a condition called dental fluorosis" |
| M1 Health | Chronic means smaller excess over time; acute means one large dose | NOT COVERED | Textbooks silent; concept from Royce topic list and general toxicology; kept without symptoms or numbers |
| M1 Health | Major medical and dental bodies endorse; critics exist | SUPPORTED | sp3 (Spellman WF 1996) 18.1 p.224 (endorsement list; skeptics' concerns); HB 11.7.5 (Mullenix view and rebuttal) |
| M1 History | Colorado dentist noted mottled teeth with little decay; research linked it to water | NOT COVERED | Neither book gives the Colorado history. Common public history; CDC about page confirms only that fluoridation began in 1945 |
| M1 History | Grand Rapids, Michigan began adjusting fluoride in 1945 | SUPPORTED | CDC about page: "since community water fluoridation started in 1945" (Grand Rapids named by Royce slide only) |
| M2 Chemicals | Three common chemicals; each should meet AWWA standards | SUPPORTED | sp6 (Spellman HB 2009) 5.6.11.2 p.131: "three commonly used fluoride chemicals should meet the American Water Works Associations (AWWA) standards" |
| M2 Chemicals | Fluoride is added to water as a liquid (solid dissolved first) | NOT COVERED | Royce slide 180 only; consistent with sp3 (Spellman WF 1996) feeder descriptions (solution feeders and dry feeders into a solution vessel) |
| M2 Sodium fluoride | White odorless powder or crystals; reference standard; about 4 g/100 mL, nearly constant | SUPPORTED | sp6 (Spellman HB 2009) 5.6.11.2.1: "white, odorless material available either as a powder or in the form of crystals"; "practically constant at 4 g per 100 mL"; Table 5.5 |
| M2 Sodium fluoride | Made from fluorspar and sulfuric acid in the past; now from fluorosilicic acid and caustic soda | SUPPORTED | sp6 (Spellman HB 2009) 5.6.11.2.1: "adding sulfuric acid to fluorspar ... now produced by neutralizing fluorosilicic acid with caustic soda" |
| M2 Sodium fluoride | Some states require blue tint | SUPPORTED | sp3 (Spellman WF 1996) p.225: "Some states require that the chemical ... be tinted blue" |
| M2 Sodium fluoride | Crystals make less dust; dust is main handling hazard | NOT COVERED | Royce slides 67-68 only; books silent. Kept at recognition level |
| M2 Sodium fluoride | CDC recommends against dry feeding NaF and against unsaturated NaF solution | SUPPORTED | sp6 (Spellman HB 2009) Example 5.179 note and 5.6.11.4.4 Caution: "CDC recommends against the use of unsaturated sodium fluoride solution"; "recommends against using sodium fluoride in a dry feeder" |
| M2 Silicofluoride | Low solubility, dry feeder, large solution volume (about 60 gal per lb), about 5 min detention, corrosion-resistant tank | SUPPORTED | sp3 (Spellman WF 1996) p.224: "approximately 60 gallons per pound of chemical ... detention time of about 5 minutes ... stainless steel or some other corrosion-resistant material"; HB Table 5.5 (0.44 to 2.45 g/100 mL) |
| M2 Silicofluoride | Saturated solutions acidic | NOT COVERED | Royce slide 73 only; WF says only "the solution is quite corrosive" (p.224). Wording in lesson kept to acidic/corrosive |
| M2 Acid | Liquid 20-35 percent, corrosive, fuming, delayed skin burn, low pH may depress weakly buffered water; by-product of phosphate fertilizer | SUPPORTED | sp6 (Spellman HB 2009) 5.6.11.2.3: "straw-colored, transparent, fuming, corrosive liquid"; "low pH (1.2) ... slightly depress the pH of poorly buffered potable waters"; "delayed burn on skin tissue" |
| M2 Acid | Contains traces of hydrofluoric acid; fortified acid | SUPPORTED | sp6 (Spellman HB 2009) 5.6.11.2.3: "Hydrofluoric acid (HF) is an extremely corrosive material. Its presence ... whether from intentional addition (i.e., fortified acid) or from normal production" |
| M2 Acid | Fumes rise, unlike chlorine; diluting forms silica precipitate | NOT COVERED | Royce slides 84, 81, 89 only; books silent on both. Lesson says only that dilution risks a precipitate and that supplier guidance governs |
| M2 Acid | Fed by metering pump, with or without dilution | SUPPORTED | sp3 (Spellman WF 1996) p.224: "fed by a displacement pump or chemical metering pump, either with or without dilution" |
| M2 Purity | Product contains water and impurities; AFI and purity concept | SUPPORTED | sp6 (Spellman HB 2009) 5.6.11.4.2: determine "Dosage, Maximum pumping rate, Chemical purity, Available fluoride ion concentration" |
| M2 Feeders | Two feeder types: solution feeders and dry feeders | SUPPORTED | sp3 (Spellman WF 1996) p.225: "(1) solution feeders ... (2) dry feeders, where a predetermined quantity of the solid material is fed" |
| M2 Feeders | Positive displacement diaphragm pumps most common; most accurate near mid-range | NOT COVERED | Royce slides 186-194 only; books silent beyond "displacement pump or chemical metering pump" (WF p.224) |
| M2 Feeders | Volumetric vs gravimetric dry feeders; small systems pumps, large dry feeders | SUPPORTED | wtp2 13.30: "Volumetric feeders ... usually simpler, less expensive, less accurate ... Gravimetric feeders are usually more accurate" |
| M2 Feeders | Cloudy solution causes: tank size, contact time, water, mixing | NOT COVERED | Partly supported: WF p.224 gives vessel size, detention time and water volume for silicofluoride; agitation point is Royce slide 234 only |
| M2 Saturator | Bed of NaF, saturated solution of nearly constant strength; no weighing | SUPPORTED | sp6 (Spellman HB 2009) 5.6.11.4.3 p.134: "This simplifies calculations because it eliminates the need for weighing the chemicals" |
| M2 Saturator | Upflow and downflow designs; sand and gravel in downflow | SUPPORTED | wtp2 13.31-13.33: downflow saturator uses sand and gravel; upflow has no barrier, water forced upward; upflow preferred, easier to clean |
| M2 Saturator | Hardness forms insoluble Ca and Mg fluoride; soften make-up water | SUPPORTED | sp3 (Spellman WF 1996) p.225: "The water used to make the solution may need to be softened." (precipitation mechanism from Royce slide 218; hardness number not reproduced) |
| M2 Backflow | Backsiphonage; air gap and vacuum breaker protect potable supply; vacuum breakers named for fluoride and chlorine solution lines | SUPPORTED | sp3 (Spellman WF 1996) Ch.14 14.2.2.2.1-2: air gap "greatest degree of protection"; vacuum breakers used for "supply lines on low concentration chemical vats, such as chlorine and fluoride solutions" |
| M2 Backflow | Anti-siphon valve, loaded valve, injection point above tank level | NOT COVERED | Royce slides 239-241 only; books silent on fluoride anti-siphon valves. Purpose-level only |
| M2 Day tank | Day tank limits supply and allows check against production | SUPPORTED | wtp2 Glossary: day tank "stores sufficient chemical solution to properly treat the water ... for at least one day"; 13.41 item 13 for scales |
| M2 Feed point | About 10 percent lost on floc if fed before filtration; feed at each well with mixing | SUPPORTED | sp3 (Spellman WF 1996) p.225: "approximately 10 percent of the chemical adheres to floc and is lost"; "fluoride must be fed at each well" |
| M3 Constants | 8.34 lb/gal; 1 mg/L = 1 ppm; AFI NaF 0.45, Na2SiF6 0.607, FSA 0.792; purities 0.98/0.985/0.23 | SUPPORTED | sp6 (Spellman HB 2009) 5.6.11.4: "mg/L is equal to ppm"; Examples 5.177-5.179 use 0.607 x 0.985, 0.79 x 0.23, 0.45 x 0.98; Ex.5.183 uses 0.792 |
| M3 Constants | FSA 23 percent weighs 9.94 lb/gal | SUPPORTED | sp6 (Spellman HB 2009) Table 5.6: 23 percent, 1.191, 9.938 lb/gal |
| M3 Percent F | NaF 45.2 percent; Na2SiF6 60.6 percent | SUPPORTED | sp6 (Spellman HB 2009) Ex.5.176: "19.00 / 41.9997 x 100 = 45.2%"; Key Point MW Na2SiF6 188.06 (60.7 percent used in Ex.5.177). Course computes 60.6 with stated atomic weights |
| M3 Feed rate | lb/day = dose x MGD x 8.34 / (AFI x purity) | SUPPORTED | sp6 (Spellman HB 2009) Eq. 5.107 p.133 |
| M3 Feed rate | Feed rate in g/min = lb/day / 1,440 x 454 | SUPPORTED | sp6 (Spellman HB 2009) Ex.5.177: "divide by 1440 min/day and multiply by 454 g/lb" |
| M3 Saturator | 40,000 mg/L x 0.45 = 18,000 mg/L; gpd = flow x dose / 18,000 | SUPPORTED | sp6 (Spellman HB 2009) 5.6.11.4.3: "40,000 mg/L times percent available fluoride (45%) equals 18,000 mg/L"; Eq. 5.109; Ex.5.180 |
| M3 Saturator | Unsaturated solution concentration = 18,000 x strength / 4; percent strength from lb in gal | SUPPORTED | sp6 (Spellman HB 2009) Eq. 5.115, Ex.5.181 (6.5 lb in 45 gal gives 1.7%) |
| M3 Rule of thumb | 19 lb NaF, 14 lb Na2SiF6, 46 lb 23 percent acid add 1 mg/L to 1 MG | SUPPORTED | sp6 (Spellman HB 2009) 5.6.11.2: "Approximately 19 lb", "14 lb", "46 lb (4.4 gal)"; WF p.224 (14 lb, 46 lb) |
| M3 Calculated dosage | Calculated dose plus natural gives theoretical concentration; used as safety check and troubleshooting aid | SUPPORTED | sp6 (Spellman HB 2009) 5.6.11.4.4 p.135: "calculated as a safety precaution ... also an aid in solving troubleshooting problems" |
| M3 Calculated dosage | Pump setting mL/min = gal/day x 3,785 / 1,440 | NOT COVERED | Arithmetic only (conversion constants); HB Ex.5.178 gives 3,785 mL/gal and mL/min conversion |
| M4 Importance | Controlling the level is the most important part; records of chemical, water, tests | SUPPORTED | sp3 (Spellman WF 1996) p.225: "Controlling the fluoride level ... is, obviously, the most important part"; "records are kept of how much chemical is fed each day, how much water is treated each day, and the results of the tests" |
| M4 ISE | Electrode with lanthanum fluoride crystal; sample pH moderate; Al, Fe, Si interfere; buffer with chelating agent | SUPPORTED | wqc EPA Method 340.2 sections 2.2, 3.1: "lanthanum fluoride crystal"; "sample pH should be between 5 and 9"; "addition of a pH 5.0 buffer ... containing a strong chelating agent" (pH range not reproduced) |
| M4 ISE | Standards prepared from stock; calibration curve | SUPPORTED | wqc Method 340.2 sections 6.2-6.3, 7: "Prepare a series of standards"; standard curve |
| M4 Colorimetric | Zirconium dye; fluoride bleaches red color in proportion | SUPPORTED | sp6 (Spellman HB 2009) 15.8.20: "fluoride ion reacts with zirconium ion and produces zirconium fluoride, which bleaches an organic red dye in direct proportion to its concentration" |
| M4 Colorimetric | Electrode method has fewer interferences than colorimetric | NOT COVERED | Royce slide 250 only |
| M4 Calibration | Feeder calibration with calibration column | NOT COVERED | Royce slides 199-200 only; HB Ex.5.177 discusses data-sheet feed rates |
| M4 Overfeed | Causes: siphoning, wrong setting, calculation error, wrong solution strength, feed continues at low flow | NOT COVERED | Books do not list causes; HB 5.6.11.4.4 says the calculated dose guards against "an overfeed or accident". Causes are plant-engineering inference from the equipment described; purpose level |
| M4 Overfeed | Response purposes: stop, limit exposure, notify under rule and facility procedure | SUPPORTED | wtp2 13.7 item 6 (see gap-fill rows); purposes only in the course |
| M4 Records | Records show chemical, water, test results; corrections noted not erased | SUPPORTED | sp3 (Spellman WF 1996) p.225 (three records); correction practice is general good record-keeping, NOT COVERED |
| M4 Safety | Fluoride chemicals are a safety hazard unless handled properly; know each chemical's hazards | SUPPORTED | sp6 (Spellman HB 2009) 5.6.11.2 Caution: "can constitute a safety hazard for the water plant operator unless proper handling precautions are observed" |
| M4 Safety | Dust the main hazard; ventilation; separate storage; protective equipment purposes | SUPPORTED | wtp2 13.110: "One of the major causes of overexposure is the inhalation of fluoride dust" (usually when loading a dry feeder or saturator); wtp2 13.5B and 13.41 for eyewash and ventilation. Separate storage from other chemicals remains Royce-only |
| M1 History | Observer traced mottling to excess fluoride by 1931 and noted fewer cavities; Grand Rapids and Newburgh began 1945 with comparison cities; comparison showed far less decay | SUPPORTED | wtp2 Ch.13 13.0 p.29: "not until 1931 ... excessive fluoride in the water supplies"; "mottled teeth seemed to have fewer dental caries"; "1945 controlled fluoridation was started in ... Grand Rapids, Michigan and Newburgh, New York with control cities" (percent reduction not reproduced) |
| M1 Optimal level | Older interim federal table tied limits to climate | SUPPORTED | wtp2 Table 13.1 "Interim primary drinking water regulations for fluoride and recommended levels" by annual average maximum daily temperature (values not reproduced) |
| M1 Health | Mottling appears as brown, chalky enamel | SUPPORTED | wtp2 13.0: "mottled (brown, chalky deposits) tooth enamel" |
| M1 Natural vs adjusted | Three situations: natural adequate or excessive, blended sources, fluoride added | SUPPORTED | wtp2 13.3 p.30: "three different types of situations" (natural, blended, added) |
| M2 Purity | Insist on AWWA-conforming chemicals and keep standards on file; non-conforming chemical is a sanitary defect | SUPPORTED | wtp2 13.2 p.30: "insist that your supplier furnish only compounds meeting the appropriate AWWA specifications"; "several copies of the appropriate AWWA standard"; 13.10 defect 5 |
| M2 Feeders | Pump types: diaphragm, peristaltic, electronic; peristaltic and electronic for low rates; never meter against suction head; positive displacement pump damaged against closed valve | SUPPORTED | wtp2 13.30 p.31: "Fluoride doses must never be metered against a negative or suction head"; 13.41: "displacement pump will damage itself or rupture lines in seconds if allowed to run against a closed valve"; 13.61: "Peristaltic and electronic feeder pumps ... may be used when the feed rates are low" |
| M2 Day tank | Scales needed in any system except the sodium fluoride saturator | SUPPORTED | wtp2 13.41 item 13: "In any fluoridation system, except the sodium fluoride saturator, scales are necessary for weighing the quantity of chemical (including solution) fed per day" |
| M2 Saturator | Crystal grade NaF; powder can clog; stirring; upflow easier to maintain | SUPPORTED | wtp2 13.31: "Only crystal-grade ... sodium fluoride should be fed with a saturator"; "use of powdered sodium fluoride is not recommended because this chemical will clog"; "Saturators should be stirred every day" (frequency and bed depth not reproduced) |
| M4 Overfeed design | System should prevent overfeed and backsiphonage, monitor chemical used, be flow paced; analyzer with high alarm; alarm list; closed-loop analyzer risk | SUPPORTED | wtp2 13.30 p.31 and 13.34: "design must incorporate means to prevent both overfeeding and back siphonage along with a means to monitor the amount of chemical used"; "if the analyzer goes haywire and incorrectly indicates low fluoride levels ... over-fluoride the water supply"; 13.33 alarm list |
| M4 Overfeed design | Manual-mode switch should show a warning light | SUPPORTED | wtp2 13.41 item 9 |
| M4 Overfeed | Response: shut down, flush mains, notify health departments, which decide on public notice | SUPPORTED | wtp2 13.7 item 6: "Shut down the plant if there is any significant overfeeding ... notify the local and state health departments ... will then decide if public notification should be undertaken" (course gives purpose only) |
| M4 Underfeed | Fluoridation need not be continuous but underfeeding should not be allowed | SUPPORTED | wtp2 13.8: "fluoridation does not have to be continuous"; "Underfeeding should not be allowed because this results in a very significant reduction" |
| M4 Maintenance | Sanitary defect list | SUPPORTED | wtp2 13.10: defects 1-6 (start-stop controls, feed rate control, no analyzer, backflow safeguards, AWWA specs, chlorine residual) |
| M4 Storage | Acid tanks vented outdoors; fumes harmful and kill plants; fiberglass or lined steel; interior inspection; fix leaks at once; rinse containers | SUPPORTED | wtp2 13.34 and 13.10: "tanks must be vented to the outside as the fumes from the acid are"; "Fluoride fumes can kill vegetation"; "Thoroughly rinse all containers"; lined steel and fiberglass tanks |
| M4 Storage | Long shutdown: clean out so chemical cannot solidify; unflushed lines can injure | SUPPORTED | wtp2 13.9: "Operators could be seriously injured if they open a chemical line that has not been properly flushed out" |
| M4 Safety | Respirator, coveralls, gloves for dry chemicals; eyewash, drench shower, face shield; no eating, drinking, smoking | SUPPORTED | wtp2 13.110 and 13.5B answer; objective test item 12: "Never eat, drink or smoke in or around fluoridation chemical storage or feed areas" (cartridge types and intervals not reproduced) |
| M4 Safety | Acute poisoning signs: vomiting, cramps, thirst, weakness; dust irritates nose, nosebleed | SUPPORTED | wtp2 13.111 (fatal-dose figure and first aid not reproduced) |

## Notes on conflicts

- sp3 (1996) says the optimum is a single value near 1.0 mg/L and that levels should not exceed a stated value; sp6 prints an older climate-based table. Neither is current, and the course states no target or limit as a rule. Not a contradiction of any course claim.
- wqc 3.3.2.16 calls fluoride non-cumulative, while the Royce course calls it a bone seeker. The course makes no claim about retention or accumulation.
- sp6 says underfeeding is a more serious problem than overfeeding. The course does not repeat it, because an overfeed is treated as a safety event; it keeps the narrower book claim that small shortfalls cost benefit.
- sp6 acid properties (Table 5.6) give 9.938 lb/gal; the sp6 example note rounds to 10 lb/gal. The course uses 9.94 lb/gal.
- Content cutoffs: sp3 and sp6 are older books; verify against your certifying agency's current reference list.

## Review verification addendum (rounds 1 to 3, 2026-11-26)

Checked against the extracted texts after the review findings. Locations are approximate line numbers in ceusrc/ files (OCR text, so some are approximate); page markers are the printed page where the text shows one.

| # | Location in course | Claim checked | Verdict | Source location and quote |
|---|---|---|---|---|
| R1 | feed-rate-math, Estimating | About 19 lb sodium fluoride adds 1 ppm to 1 MG | SUPPORTED | sp6.txt line 10259: "Approximately 19 lb of sodium fluoride will add 1 ppm of fluoride to 1 million gal of water" (p. 132) |
| R2 | feed-rate-math, Estimating | About 46 lb of 23 percent acid adds 1 ppm to 1 MG | SUPPORTED | sp6.txt line ~10306 (Table 5.6 text): "Approximately 46 lb (4.4 gal) of 23% acid are required to add 1 ppm of fluoride to 1 million gal of water" (p. 133) |
| R3 | feed-rate-math, constants | 9.94 lb/gal for 23 percent acid | SUPPORTED | sp6.txt line 10302, Table 5.6: "23  1.191  9.938" |
| R4 | feed-rate-math, constants | AFI 0.45, 0.607 and 0.792 as typical values | SUPPORTED as worked-example inputs | sp6.txt lines 10457, 10527, 10631, 10650 (examples use 0.45, 0.607, 0.792); labelled typical in the lesson |
| R5 | chemicals-feeders, NaF | NaF made from fluorspar and sulfuric acid, then neutralised with sodium carbonate; now from fluorosilicic acid and caustic soda | SUPPORTED | sp6.txt line 10257 and 10258: "adding sulfuric acid to fluorspar and then neutralizing the mixture with sodium carbonate. It is now produced by neutralizing fluorosilicic acid with caustic soda" |
| R6 | chemicals-feeders, saturator | Only crystal-grade NaF for saturators | SUPPORTED | wtp.txt line ~8198: "Only crystal-grade (20 to 60 mesh) sodium fluoride should be" |
| R7 | chemicals-feeders, acid | Fluorosilicic acid straw-coloured, fuming, corrosive; pH 1.2; 1 ppm can slightly depress pH of poorly buffered water; delayed burn | SUPPORTED | sp6.txt lines 10290-10305 (Table 5.6 text) |
| R8 | chemicals-feeders, acid | HF present from production or intentional fortification | SUPPORTED | sp6.txt line ~10307: "Hydrofluoric acid (HF) ... whether from intentional addition (i.e., fortified acid) or from normal production processes" |
| R9 | chemicals-feeders, anti-siphon | Anti-siphon valve metering pump; mechanical siphon breaker on make-up line | SUPPORTED (presence only) | wtp.txt line 8281 "ANTI-SIPHON VALVE METERING PUMP"; line 8245 "MECHANICAL SIPHON-BREAKER MUST BE INCORPORAT-". Valve spring mechanism and elevation rule NOT COVERED; wording kept general |
| R10 | chemicals-feeders, day tank | Day tank usually holds enough for at least one day | SUPPORTED | wtp.txt line 1823 (glossary) and 7631: "A day tank usually stores suffi[cient]..." |
| R11 | chemicals-feeders, dissolving | Dry feeders often deliver into a dissolving tank | SUPPORTED with "many" | wtp.txt Ch.13 section 13.31 (reviewer quote: "many dry-feed systems"); lesson now says "often" |
| R12 | chemicals-feeders, make-up water | Hardness guidance is in Ch. 13 | SUPPORTED | wtp.txt Ch. 13 section 13.31 (hardness guidance); course does not restate the numbers |
| R13 | what-and-why, decision | Governing body decides, often by vote; water department chooses chemical and equipment | SUPPORTED | wtp.txt lines 7690-7705, section 13.1: "The governing body will usually rely upon a vote of the people... the water department or water company will almost always make the final decisions as to types of chemical and feeding equipment" |
| R14 | what-and-why, defluoridation | Term means removal of excess fluoride | SUPPORTED | wtp.txt line 1849-1850 (glossary): "The removal of excess fluoride in drinking water to prevent the mottling" |
| R15 | what-and-why, caries | Incidence of caries relative to fluoride well established; adjustment is a public health measure | SUPPORTED | sp3.txt lines 9920-9926 (Ch. 18) |
| R16 | what-and-why, low levels | Low levels increase caries | SUPPORTED | sp3.txt line ~9921: "Low levels of fluoride result in increasing incidence of caries" |
| R17 | what-and-why, Table 5.7 | Historical control range 0.1 below and 0.5 above (community) | SUPPORTED as historical | sp6.txt Table 5.7 (p. 21 of DHHS manual, quoted in sp6 line ~10340): community control range "0.1 Below", "0.5 Above" |
| R18 | what-and-why, secondary value | Table 14.3 lists fluoride with dental fluorosis; number NOT stated in course | SUPPORTED | sp6.txt line 35228: "Fluoride 2 mg/L Dental fluorosis" (course does not print the 2 mg/L value) |
| R19 | what-and-why, authorities | Most authorities hold a moderate quantity of fluoride is beneficial | SUPPORTED | sp3.txt line ~9938: "Most authorities hold that a moderate quantity of fluoride ions" |
| R20 | what-and-why, dental fluorosis | Excess fluoride while teeth form gives fluorosis; no aesthetically significant fluorosis at right level | SUPPORTED | sp3.txt line ~9922 ("no aesthetically signzjicant dental fluorosis"; OCR text) |
| R21 | monitoring-safety, poisoning | Symptoms: vomiting, stomach cramps, diarrhea, weakness, thirst; inhaled dust: nose pain then runny nose or nosebleed; see doctor immediately | SUPPORTED (list, no fixed sequence) | wtp.txt lines ~9209-9262, section 13.111 |
| R22 | monitoring-safety, dust | Dust inhalation is one of the major causes of overexposure | SUPPORTED | wtp.txt section 13.110 (around line 9217): "One of the major causes of overexposure is the inhalation of fluoride dust" |
| R23 | monitoring-safety, bags | Dry storage, preferably off the floor; bags stacked too high can fall | SUPPORTED | wtp.txt section 13.110 (around line 9235, approximate) |
| R24 | monitoring-safety, analyzer | Continuous analyzer on treated water line downstream for mixing, if installation warrants | SUPPORTED | wtp.txt section 13.7, item 2 (around lines 8960-8990, OCR text) |
| R25 | monitoring-safety, analysis | Al, Fe, Si complex fluoride; pH 5.0 buffer with strong chelating agent | SUPPORTED | wqc.txt lines 24889-24891 (Method 340.2, sec. 2.3): "Si, Fe and Al interfere by forming complexes with fluoride... addition of a pH 5.0 buffer ... containing a strong chelating agent" |
| R26 | monitoring-safety, electrode | Electrometer calibration uses a semilog plot; selective-ion meter follows manufacturer | SUPPORTED | wqc.txt Method 340.2 section 7.2 ("Using semilogarithmic graph paper, plot the concentration... on the log axis") and section 8 |
| R27 | monitoring-safety, colorimetric | Zirconium dye reacts with fluoride; fluoride bleaches the zirconium-dye complex | SUPPORTED after correction | sp6.txt section 15.8.20 (reviewer quote); lesson and explanation reworded |
| R28 | monitoring-safety, records | Chemical fed and water treated support the calculated dose; test result supports comparison | SUPPORTED (wording) | wtp.txt log sheets, sections 13.62 and 13.621 (line ~8706 onward; chapter is 13, not 29) |
| R29 | feed-rate-math, pumps | Stroke and rate adjusted pumps; preference for mid-range accuracy | NOT COVERED | not in the supplied excerpts; softened to "check the manufacturer's accuracy range" |
| R30 | monitoring-safety, alarms | Alarms and interlocks; closed-loop response to a low-reading analyzer | NOT COVERED | general practice; kept as one qualified sentence |
| R31 | monitoring-safety, calibration interval | Calibration frequency, standards shelf life, calibration log | NOT COVERED | left to the method and facility procedure |
| R32 | monitoring-safety, vent and tank materials | Vent outdoors; tank materials; inspection schedule | NOT COVERED | removed; storage now refers to facility design |

### Removed or softened as not supported (round 1 to 3 triage)
- Floc loss "about a tenth" when fed ahead of filters: no support found in ch. 13 or sp6 fluoride text. Removed; the related question now asks about analyzer placement (R24).
- "60 gallons per pound" and "several minutes of detention" for silicofluoride: not found. Removed.
- "Fumes rise, unlike chlorine": not found. Removed.
- NaF tinted blue; CDC recommends against dry feeding and unsaturated solutions: not found in supplied texts. Removed.
- Colorado history (1931 and 1945 dates, Grand Rapids and Newburgh): not in the books. Section replaced by a sourced paragraph (R15, R13).
- "Fluoridation is most important part" (Spellman attribution): not found. Removed.
- "Dust is the hazard operators meet most often": not supported as a ranking. Reworded (R22).
- "Acute poisoning is rare": not supported. Removed.
- "Separate storage away from other chemicals": not found. Replaced with R23.
- "Day tank caps what could be fed in error": not found. Removed.
- Spring-loaded valve and "stuck valve drives flow": mechanism not in books. Softened.
- "Upflow is widely used" and "stir the bed": not found. Removed.
- Federal and state limit history: not in the supplied excerpts. Kept as a general statement, recorded NOT COVERED.

### Totals after round 3
- Claims rechecked in this addendum: 32 rows (R1 to R32): SUPPORTED 28 (R27 and R28 needed wording corrections), NOT COVERED 4 (R29 to R32), plus the federal-rule history sentence, which is NOT COVERED.
- CONTRADICTED: 0 in the addendum. Reviewer claims that the book contradicts were corrected in the draft (see REVIEW-RESULT).
