# Source check: ceu-reverse-osmosis vs Water Quality Control Handbook, Spellman and WEF MOP 11

Checked 2026-11-26 against the text extractions in `ceusrc/` (wqc.txt Section 8.8 and neighbours, sp6.txt Ch. 9 and 18-19, mop.txt). Page markers are the printed handbook pages. The textbooks cover RO mainly as one membrane section of the Water Quality Control Handbook, so much of the operating practice (SDI test, antiscalant, clean-in-place, normalising, post-treatment) is NOT COVERED and rests on general practice; those rows are kept deliberately general with no numbers stated as rules. The only web source is the EPA reuse page, used for context.

## Totals

| Group | Supported | Contradicted | Not covered | Total |
|---|---|---|---|---|
| Lesson claims | 47 | 1 | 34 | 82 |

Questions: 64 total, 23 arithmetic (recomputed independently, formulas as in the rows above) and 41 concept questions drawn from the same lesson claims; each concept question rests on a row above, so its verdict follows that row. Distractors that the books contradict: M1 F4 (material chlorine ratings, Table 8.9), M3 A2 (pH ranges, Table 8.9), M3 A4 (pretreatment pairing, Table 8.8). No distractor needed replacing because of a book passage.

## Claims and verdicts

| # | Location | Claim | Verdict | Evidence |
|---|---|---|---|---|
| 1 | M1 Why RO | RO is used to remove dissolved solids; MF and UF remove suspended and colloidal material | SUPPORTED | "reverse osmosis is used to remove dissolved solids from a wastewater" (wqc 8.8.1, p. 8.92) |
| 2 | M1 Why RO | Membranes reach treatment not possible in classic processes; common where clean water is scarce | SUPPORTED | "capable of separation not possible in classic wastewater treatment ... especially common in areas where clean water is scarce" (wqc 8.8.1.5, p. 8.93) |
| 3 | M1 Why RO | High capital and operating cost | SUPPORTED | "Membrane filtration has a high capital and operating cost" (wqc 8.8.2, p. 8.93) |
| 4 | M1 Why RO | WEF MOP 11 lists MF, UF, NF, RO as advanced steps removing organics, nutrients, pathogens | SUPPORTED | "membrane filtration ... is used to remove organics, nutrients, and pathogens from wastewater" (mop.txt line 1296, advanced wastewater treatment) |
| 5 | M1 Osmosis | Osmosis moves water from low to high ionic concentration; RO forces it back | SUPPORTED | "Osmosis is the flow of water from an area of low ionic concentration to an area of high ionic concentration" (wqc 8.8.1.1, p. 8.92) |
| 6 | M1 Osmosis | Applied pressure must exceed osmotic pressure | SUPPORTED | "the applied pressure must be greater than the naturally occurring osmotic pressure" (wqc 8.8.1.1) |
| 7 | M1 Osmosis | Osmotic pressure depends on molar concentration, ions formed, temperature | SUPPORTED | "a function of the molar concentration of the solute, the number of ions formed ... and the solution temperature" (wqc 8.8.1.1) |
| 8 | M1 Osmosis | van't Hoff relation, osmotic pressure = ions x concentration x R x T | SUPPORTED | "Pi = vi x ci x R x T" (wqc eq. 8.61, p. 8.98) |
| 9 | M1 Streams | A membrane process has one input and two outputs | SUPPORTED | "there is one input and two outputs" (sp6 18.9.1, p. 650 area) |
| 10 | M1 Streams | Names permeate, concentrate and the synonyms reject, brine, product water | NOT COVERED | wqc uses "treated water" and "concentrate"; sp6 silent on "reject" and "brine" as stream names. Kept as common usage. |
| 11 | M1 Streams | Concentration polarization raises osmotic pressure at the surface and lowers flux and rejection | SUPPORTED | "The more concentrated solute layer increases the osmotic pressure at the membrane surface, which causes a decrease in water flux and dissolved solids rejection" (wqc 8.8.2.2, p. 8.95) |
| 12 | M1 Streams | Good velocity across the membrane keeps polarization small | NOT COVERED | wqc describes the layer but not the velocity remedy. Kept as general practice. |
| 13 | M1 Family | Pore size order MF, UF, NF, RO; RO about 0.1 to 1 nm | SUPPORTED | Table 8.7: RO minimum 0.1 nm, maximum 1 nm (wqc p. 8.92) |
| 14 | M1 Family | RO operating pressure differentials in the hundreds of psi (min 200, max 1,200) | SUPPORTED | Table 8.11: Reverse osmosis 200 / 1200 / 514 psi (wqc p. 8.97) |
| 15 | M1 Family | Spellman lists a lower pressure range for RO | SUPPORTED | Table 18.21: "Reverse osmosis (RO) 100-150" psi (sp6 p. 656). Differs from wqc; lesson tells learners ranges differ. |
| 16 | M1 Family | Molecular weight cutoff is the smallest molecule retained, in daltons | NOT COVERED | Neither book defines MWCO in these words (sp6 only uses MWCO values for DBP studies). Kept as standard definition. |
| 17 | M1 Family | UF used as pretreatment ahead of NF or RO | SUPPORTED | "UF units can also be used as a pretreatment option for nanofiltration or reverse osmosis" (wqc 8.8.1.3) |
| 18 | M1 Family | NF rejects less dissolved ion than RO | SUPPORTED | "larger effective pore size than reverse osmosis ... lower dissolved solids rejection rates" (wqc 8.8.1.2) |
| 19 | M1 Family | NF can remove DBP precursors | SUPPORTED | "nanofiltration (NF) membranes with MWCOs of 400 to 800 Da effectively controlled DBP formation" (sp6 18.10.8.2) |
| 20 | M1 Family | NF is called a softening membrane | NOT COVERED | Neither book uses the phrase. |
| 21 | M1 Family | Electrically driven processes such as EDR separate ions by ion exchange | SUPPORTED | "EDR ... The separation process used in EDR, however, is ion exchange" (sp6 18.11.2.3) |
| 22 | M1 Materials | Cellulose acetate: chlorine resistance good, poor temperature and chemical stability, narrow pH range | SUPPORTED | Table 8.9: CA pH 4.5-9, 55 C, chlorine Good; text: "poor temperature and chemical stability" (wqc 8.8.3.2) |
| 23 | M1 Materials | Polyamide: wide pH range, poor chlorine resistance | SUPPORTED | Table 8.9: Polyamide pH 3-12, chlorine Poor (wqc p. 8.96) |
| 24 | M1 Modules | Four configurations; hollow fibre and spiral wound popular for area per volume but foul readily | SUPPORTED | "Hollow fiber and spiral wound membranes are the most popular configurations because of the large membrane surface area per volume ... high probability of fouling" (wqc 8.8.3.3, p. 8.97) |
| 25 | M1 Modules | Spiral wound element construction: sheets and spacers wound on a central tube, permeate spirals inward | NOT COVERED | wqc and sp6 do not describe the winding. Kept as standard module description. |
| 26 | M1 Modules | Hollow fibre RO: feed outside the fibres, permeate from hollow centres | NOT COVERED | Not described in the books. |
| 27 | M1 Modules | Submerged membranes use vacuum to draw permeate (MBR) | SUPPORTED | "separate vacuum pumps pull permeate through the membranes" (mop.txt, Ch. 22 membrane bioreactors) |
| 28 | M1 Modules | Cross-flow versus dead-end flow; dead-end must be backwashed; spiral wound RO is not backwashed | NOT COVERED | Books do not discuss flow patterns in these terms. Kept as general practice. |
| 29 | M2 Recovery | Recovery = permeate / feed; treated flow = raw flow x recovery efficiency | SUPPORTED | "Qt = Qr x Rw ... Rw = recovery efficiency" (wqc eq. 8.64) |
| 30 | M2 Recovery | Recovery chosen by economic comparison of concentrate disposal and larger system cost | SUPPORTED | "The recovery efficiency is determined through an economic analysis comparing the cost of final concentrate treatment or disposal and the increase capital and operating cost" (wqc 8.8.4.1) |
| 31 | M2 Rejection | Rejection = (1 - Cp/Cf) x 100 | SUPPORTED | "Ri = (1 - Ci/Cf) x 100" (wqc eq. 8.62, p. 8.99) |
| 32 | M2 Rejection | Salt passage = Cp/Cf x 100 = 100 - rejection | NOT COVERED | Derived from eq. 8.62; the term "salt passage" is not used in the books. |
| 33 | M2 Rejection | Conductivity is proportional to dissolved solids | SUPPORTED | "A conductivity meter measures electrical conductivity which is proportional to the dissolved solids in the water" (wqc 3.3) |
| 34 | M2 Flux | Flux in gal/day/ft2; RO typical 2 to 62, average 23 | SUPPORTED | Table 8.12: Reverse osmosis 2 / 62 / 23 gal/day/ft2 (wqc p. 8.98) |
| 35 | M2 Flux | Area = permeate flow / flux | CONTRADICTED | Printed eq. 8.63 "Am = F x Qt" with F in gpd/ft2 and Qt in gpd does not balance units; division is dimensionally correct. Lesson uses division and says why. |
| 36 | M2 CF | CF = 1 / (1 - recovery) for near-complete rejection | NOT COVERED | Derived by mass balance; not printed in the books. |
| 37 | M2 CF | RO typically concentrates salts 2 to 4 times; solubility limit may be exceeded | SUPPORTED | "Reverse osmosis processes typically concentrate dissolved salts by a factor of 2 to 4 times ... solubility limits may be exceeded" (wqc 8.8.2.2) |
| 38 | M2 CF | Salt balance feed x Cf = permeate x Cp + concentrate x Cc | NOT COVERED | General mass balance; not printed for RO in the books. |
| 39 | M2 Pressure | Permeate flow rises with (applied pressure - osmotic pressure) | SUPPORTED | Eq. 8.60: flow = Kw(deltaP - Pi)A / thickness (wqc p. 8.98) |
| 40 | M2 Pressure | Net driving pressure falls along the unit as concentrate gets saltier | NOT COVERED | Derived from the flux relation; illustrative figures are the course authors own. |
| 41 | M2 Pressure | Compaction is proportional to pressure and temperature and lowers flux | SUPPORTED | "Creep deformation is directly proportional to the applied pressure and temperature" (wqc 8.8.3.5) |
| 42 | M2 Staging | In staged systems concentrate or permeate of one stage feeds another | SUPPORTED | "either the concentrate or the filtrate from one stage is used as the feed for another membrane unit" (wqc 8.8.3.6) |
| 43 | M2 Staging | Fewer vessels in each later stage; concentrate valve sets recovery | NOT COVERED | Not in the books. |
| 44 | M2 Staging | Transmembrane pressure = average of inlet and outlet minus permeate pressure | NOT COVERED | Not in the books; standard definition, worked example uses own numbers. |
| 45 | M2 Energy | BHP = gpm x head x SG / (3,960 x efficiency); head = psi x 2.31 | SUPPORTED | "BHP = Flow x head x specific gravity / 3960 x efficiency" and "Head (ft) = Pressure (psi) x 2.31" (sp6 9.2.8, Eq. 9.14 and 9.16) |
| 46 | M2 Energy | 0.746 kW per hp; specific energy kWh per 1,000 gal | NOT COVERED | Conversion constant stated in each question; specific energy is derived arithmetic. |
| 47 | M2 Temperature | Colder water lowers flux; manufacturers give a temperature correction factor | NOT COVERED | wqc says osmotic pressure depends on temperature and membranes have temperature limits, but not the flux or correction factor. Kept as general practice with a stated factor in questions. |
| 48 | M3 Why | Fouling is one of the largest problems; pretreatment is among the most important design choices; most fouling eliminated by pretreatment and cleaning | SUPPORTED | "Membrane fouling is one of the largest problems" (8.8.2.2); "one of the most important design aspects" (8.8.3.1); "Most fouling can be eliminated by pretreatment" (8.8.2.2) |
| 49 | M3 Why | Pretreatment table: solids, organics, chlorine, scalants, FOG, pH matched to technologies | SUPPORTED | Table 8.8 (wqc p. 8.96) |
| 50 | M3 Particles | Feed SDI less than 3.5 protects the membrane | SUPPORTED | "should have an SDI (silt density index) of less than 3.5 to protect the membrane from fouling" (wqc 8.8.1.1) |
| 51 | M3 Particles | SDI is a plugging test on a small-pore filter | NOT COVERED | Books give the index but not the test description. |
| 52 | M3 Particles | Paper cartridge disposable, changed at a maximum pressure loss; cartridge is the last guard | SUPPORTED | "Paper media is disposable ... when the pressure loss through the filter reaches a maximum level" (wqc 8.7.2.1). The phrase "last guard" is the lesson wording. |
| 53 | M3 Oxidants | Polyamide chlorine resistance poor; activated carbon for chlorine | SUPPORTED | Table 8.9 and Table 8.8 (wqc) |
| 54 | M3 Oxidants | Chlorine damage to polyamide is permanent and raises salt passage | NOT COVERED | Books rate resistance only. |
| 55 | M3 Oxidants | Sodium bisulfite style reducing agents remove chlorine | SUPPORTED | "Sulfur dioxide gas, sodium sulfate, sodium metabisulfate, or sodium bisulfates are the chemicals used to dechlorinate" (sp6 19.10.1.6.5). Shown for wastewater; its use ahead of RO is general practice. |
| 56 | M3 Oxidants | Non-oxidising biocide where oxidants are not tolerated | NOT COVERED | Not in the books. |
| 57 | M3 Scale | Scalants include calcium and magnesium; chemical addition is a listed pretreatment | SUPPORTED | Table 8.8 "Scalants (calcium, magnesium, metal hydroxides ...)" -> "Precipitation, filtration, chemical addition, ion exchange" |
| 58 | M3 Scale | Calcium carbonate and calcium sulfate are the common scalants | NOT COVERED | Books name calcium and magnesium only. |
| 59 | M3 Scale | Scale raises osmotic pressure at the surface and reduces flux and rejection | SUPPORTED | "the scales increase the osmotic pressure at the membrane surface which reduces water flux and salt rejection rates" (wqc 8.8.2.2) |
| 60 | M3 Scale | Scale shows first at the tail end | NOT COVERED | Follows from concentration but is not stated. |
| 61 | M3 Scale | Antiscalant interferes with crystal growth; acid adjusts pH; dosing set by designer | NOT COVERED | sp6 mentions antiscalant only for hypochlorite solutions. Kept as general practice. |
| 62 | M3 Scale | Lower recovery lowers concentration factor and scale risk | NOT COVERED | Derived from the concentration relation. |
| 63 | M3 Fouling | Five fouling types; iron most common metal oxide; biofouling lowers flux and rejection and raises pressure drop; BOD supports it | SUPPORTED | wqc 8.8.2.2 and 8.8.2.1 (BOD note, p. 8.94-8.95) |
| 64 | M3 Fouling | Lead-end versus tail-end signatures of particles, slime and scale | NOT COVERED | Not in the books; teaching summary of the fouling descriptions. |
| 65 | M3 Cleaning | Routine cleaning needed at any size of unit; water or chemical flush; part or all of the system offline | SUPPORTED | "membrane cleaning and routine maintenance on the pumps is necessary with any size unit ... flushing clean water ... or a chemical cleaning solution" (wqc 8.8.6) |
| 66 | M3 Cleaning | CIP recirculates cleaner through installed elements; acid-type for scale, alkaline or detergent for organics | NOT COVERED | Books do not use the term CIP or match cleaner type to foulant. |
| 67 | M3 Cleaning | Clean on normalised flow, pressure drop and salt passage triggers set by manufacturer; late cleaning hardens foulants | NOT COVERED | Not in the books. No trigger numbers are stated as rules. |
| 68 | M3 Cleaning | Reversible versus irreversible fouling; membranes eventually replaced | NOT COVERED | wqc says cleaning and replacement costs belong in the economics (8.8.2.2) but does not define reversibility. |
| 69 | M3 Integrity | Membrane materials have temperature and chemical limits; operation outside shortens life | SUPPORTED | "If prolonged operation outside of the range occurs, membrane life will be reduced" (wqc 8.8.2.1) |
| 70 | M3 Integrity | Rising permeate conductivity with steady flow suggests a leak; vessel probing, air-pressure hold test, particle count | NOT COVERED | Not in the books. |
| 71 | M4 Operation | Membrane systems can run without attention with correct controls; cleaning and maintenance still needed | SUPPORTED | "can be run continuously without operator attention if designed with the correct controls" (wqc 8.8.6) |
| 72 | M4 Operation | Gauges on pretreatment filters and feed pump; level controls on feed, permeate, concentrate tanks | SUPPORTED | wqc 8.8.4.2, p. 8.101 |
| 73 | M4 Operation | Controller trips on pressure, pH, turbidity, conductivity; alarms tested on a schedule | NOT COVERED | Not in the books. |
| 74 | M4 Normalise | Normalised flow, salt passage and pressure drop are the trended values; normalising uses manufacturer method | NOT COVERED | Not in the books. Questions give the factor as a stated constant. |
| 75 | M4 Concentrate | Concentrate must be disposed of or treated; brine disposal is a limitation | SUPPORTED | "must be disposed of or further treated" (wqc 8.8.4.1); "disposal of the waste brine generated, membrane fouling, cost of membrane replacement, and increasing energy cost" (sp6 18.10.8.2) |
| 76 | M4 Concentrate | Discharge to sewer or surface water or ground is permit-controlled; volume large versus conventional waste | NOT COVERED | Not in the books. |
| 77 | M4 Post-treatment | Permeate low in minerals, aggressive; stabilise, degasify, corrosion control chemicals | NOT COVERED | Not in the books. |
| 78 | M4 Post-treatment | Langelier saturation index is a numerical index of scale or dissolving tendency | SUPPORTED | "Langelier saturation index (LSI)-A numerical index" (sp6 glossary, line 6422). The scale and corrosion meaning is general. |
| 79 | M4 Shutdown | Preserve idle membranes; flush to waste before restart | NOT COVERED | Not in the books. |
| 80 | M4 Records | Content of a useful RO log | NOT COVERED | Not in the books; wqc 8.8.3.5 lists treatability data only. |
| 81 | M4 Safety | High-pressure piping and chemical hazards recognised; facility procedures govern | NOT COVERED | Not RO-specific in the books. Recognition only; no procedure given. |
| 82 | M1 Context | EPA water reuse page: potable and non-potable reuse context | SUPPORTED | "safe potable and non-potable water reuse" (epa.gov/waterreuse, curl 200 on 2026-11-26). Page does not mention RO. |

## Notes on the contradicted and conflicting items
- wqc eq. 8.63 as printed (area = F x Qt) is a misprint against its own units. The course divides.
- wqc Section 8.8.1.1 also says a well designed RO system gives permeate of only 5 to 10 percent of the water treated; this contradicts the same handbook's recovery discussion and ordinary practice, so it was not used.
- RO pressure ranges differ between wqc (200 to 1,200 psi) and Spellman (100 to 150 psi); the lesson tells learners to use their own unit data.

## Resolution of flagged items (review step, 2026-11-26)

- CONTRADICTED row 35 (flux area, printed eq. 8.63): checked against the book page. The printed page is WQC p. 8.99 (PDF page 26 of `ceusrc/wqc/epdf.tips_water-quality-control-handbook-pages-3.pdf`), where eq. 8.63 reads `Am = F x Qt` with F in gpd/ft2 and Qt in gpd, so the book's own units do not balance (the product is gpd2/ft2, not ft2). The draft's `area = permeate flow / flux` is the dimensionally correct form and is the one used in the arithmetic. Verdict: the book's printed equation is wrong; the draft is right. The lesson already says the printed form does not balance and uses division. No change to the arithmetic.
- Rounding flag 1 (final item how-ro-works-f3): 146.2 / 6.895 = 21.2 psi. The displayed choice is now "About 21.2 psi" (was "About 21 psi"); explanation updated.
- Rounding flag 2 (alternate pretreatment-fouling-a3): 1.5 x 1.25 = 1.875 percent. The displayed choice is now "About 1.88 percent" and the explanation gives 1.875 as 1.88 to two decimals. The distractor "About 0.4 percent" (the absolute rise, 0.375 points) is now "About 0.375 percent".
- Row 20 (NF "softening membrane") was NOT COVERED and was attributed to Spellman in the lesson. The attribution is removed; the sentence now states only the supported NF statement (looser membrane, rejects less of the dissolved ions).
- NOT COVERED rows: all 34 are listed with decisions in `ceu-reverse-osmosis-REVIEW-RESULT.md`. None states a numeric limit, dose, trigger or residual as a rule. The numbers that remain in those claims are formulas, unit conversions, or constants stated inside a question prompt.
