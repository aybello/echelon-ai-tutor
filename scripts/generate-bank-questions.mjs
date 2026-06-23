/**
 * Generate questions for a specific bank/module using the LLM API directly
 * Usage: node scripts/generate-bank-questions.mjs <bankKey> <module> <classLevel> <count> <startNum> <outputFile>
 */
import { writeFileSync } from "fs";
import { config } from "dotenv";
config();

const [bankKey, module, classLevel, countStr, startNumStr, outputFile] = process.argv.slice(2);
const count = parseInt(countStr);
const startNum = parseInt(startNumStr);

const API_URL = `${(process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/$/, "")}/v1/chat/completions`;
const API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!API_KEY) throw new Error("BUILT_IN_FORGE_API_KEY not set");

const TOPIC_MAP = {
  "class1-water|Water Distribution": `
- Pipe materials (PVC, ductile iron, copper, HDPE) and their properties
- Pressure zones and pressure management basics
- Valves (gate, butterfly, check, pressure reducing, air release) identification and basic operation
- Hydrants and flushing procedures
- Disinfection residuals in distribution (Ontario O. Reg. 170/03 minimums, 0.05 mg/L free chlorine)
- Cross-connection control and backflow prevention basics
- Water main breaks and repairs (basic procedures)
- Dead ends and water age management
- Meters and meter reading
- Service connections and curb stops
- Corrosion and tuberculation basics
- Leak detection basics (visual, acoustic)
- Distribution system mapping and records
- Booster pumping stations basics
- Storage reservoirs and elevated tanks (purpose and basic operation)
- Basic hydraulics (pressure, flow, velocity, Bernoulli)
- Ontario Safe Drinking Water Act requirements for distribution
- Chlorine residual testing in distribution
- Nitrification in distribution systems (basics)
- Disinfection byproducts in distribution (THMs, HAAs basics)`,

  "class2-water|Water Distribution": `
- Distribution system hydraulics (Hazen-Williams formula, head loss calculations)
- Pressure zone management and boundary valves
- Water main rehabilitation and replacement planning
- Valve exercising programs (frequency, records)
- Hydrant flow testing and fire flow calculations (ISO method)
- Disinfection residual management across the system (boosting, decay)
- Cross-connection control program administration (survey, testing, enforcement)
- Unidirectional flushing programs (planning, execution, water quality verification)
- Water quality sampling in distribution (O. Reg. 170/03 schedules, bacteriological, chemical)
- Corrosion control programs (lead, copper, Langelier Saturation Index, inhibitors)
- Leak detection and water loss management (district metered areas, night flow analysis)
- Distribution system modeling basics (EPANET inputs, calibration)
- Booster chlorination stations (operation, CT calculations)
- Storage tank operations and turnover (mixing, thermal stratification)
- Emergency response for main breaks (isolation, repair, flushing, bacteriological clearance)
- Cathodic protection (impressed current, sacrificial anode)
- Service line materials and replacement (lead service lines)
- Backflow preventer testing (annual testing requirements, types)
- Nitrification control (chloramine systems, breakpoint chlorination)
- Distribution system security (access control, monitoring)`,

  "class3-water|Water Distribution": `
- Advanced distribution hydraulics and system modeling (EPANET calibration, extended period simulation)
- Water age and residence time management (flushing programs, storage optimization)
- Disinfection byproduct formation and control in distribution (precursor removal, optimizing CT)
- Lead and copper rule compliance and corrosion inhibitor programs (orthophosphate dosing, monitoring)
- Advanced cross-connection control program management (risk assessment, program audits)
- Distribution system master planning (demand forecasting, capacity analysis)
- Asset management for distribution infrastructure (condition assessment, prioritization)
- Advanced leak detection technologies (acoustic correlators, step testing, tracer gas)
- Pressure transient analysis and water hammer (Joukowsky equation, surge protection)
- Chloramine systems and nitrification control (monochloramine stability, breakpoint)
- Emergency response planning for distribution (isolation procedures, mutual aid)
- Water loss control programs (IWA methodology, minimum night flow, pressure management)
- Advanced storage tank management (mixing systems, coating inspection, structural assessment)
- Hydraulic gradient management (pressure reducing valves, pressure sustaining valves)
- Regulatory reporting requirements (O. Reg. 170/03 adverse conditions, annual reports)
- Distribution system security and vulnerability assessment
- Pipe condition assessment methods (acoustic, electromagnetic, sampling)
- Advanced metering infrastructure (AMI) benefits, data management, leak detection
- Fire flow analysis and deficiency identification (ISO grading, capital planning)
- Capital planning for distribution renewal (lifecycle costing, risk-based prioritization)`,

  "class4-water|Water Distribution": `
- Complex distribution system hydraulic modeling and calibration (EPANET, WaterGEMS, model governance)
- Strategic asset management and lifecycle costing for distribution (PSAB 3150, risk frameworks)
- Advanced water quality modeling in distribution (DBP formation models, biofilm models)
- Regulatory compliance program management (Safe Drinking Water Act, O. Reg. 170/03, audit preparation)
- Lead service line replacement program management (prioritization, funding, communication)
- Advanced pressure management and district metered areas (DMAs, design, performance indicators)
- Water loss control: IWA water balance, economic level of leakage (ELL), non-revenue water reduction
- Complex emergency response and business continuity planning (distribution failures, contamination events)
- Distribution system optimization and energy efficiency (pump scheduling, pressure optimization)
- Advanced disinfection byproduct control strategies (treatment optimization, distribution flushing)
- Chloramine conversion and management (system-wide conversion, nitrification prevention)
- Complex cross-connection control program oversight (regulatory requirements, enforcement)
- Distribution system vulnerability assessment and security planning (AWIA 2018, risk and resilience)
- Advanced hydraulic transient analysis (transient modeling, surge protection design)
- Large-diameter transmission main management (inspection, rehabilitation, failure risk)
- Interconnection agreements and bulk water supply (emergency interconnections, metering)
- Performance benchmarking and KPI development (AWWA QualServe, CWWA benchmarking)
- Capital budget development for distribution renewal (10-year capital plan, funding strategies)
- Risk-based asset management frameworks (ISO 55000, probability/consequence of failure)
- Regulatory audit preparation and response (MOE inspections, corrective action plans)`,

  "class1-wastewater|Wastewater Collection": `
- Gravity sewer pipe materials (PVC, concrete, VCP, HDPE) properties and applications
- Manholes and their components (frame, cover, steps, channel, benching)
- Sewer grades and minimum velocities (self-cleaning velocity 0.6 m/s minimum)
- Lift stations basics (wet well, submersible pumps, controls, alarms)
- Inflow and infiltration (I/I) basics: definitions, sources, impacts
- Sewer maintenance (hydro-flushing, rodding, cleaning frequencies)
- Sewer blockages and overflows: causes, response, reporting
- Safety in collection systems (confined space entry, H2S hazards, atmospheric testing)
- Sewer inspection basics (CCTV: when and why used)
- Combined sewer overflows (CSOs): what they are and why they occur
- Sanitary vs storm sewer systems: differences and purposes
- Grease and FOG in sewers: sources, problems, prevention
- Sewer odour control basics (H2S, ventilation, chemical dosing)
- Service connections and laterals: components and maintenance
- Ontario regulations for collection systems (Environmental Protection Act)
- Sewer overflow reporting requirements (Ontario)
- Basic sewer hydraulics (Manning's equation: concept and basic use)
- Root intrusion in sewers: causes and control
- Sewer map reading and records: importance and use
- Emergency response for sewer backups and overflows`,

  "class2-wastewater|Collection Systems": `
- Applied sewer hydraulics (Manning's equation calculations, pipe sizing, full-flow vs partial-flow)
- Lift station operations and troubleshooting (pump curves, wet well level control, alarms)
- Wet well sizing and pump cycling calculations (cycle time, starts per hour)
- Preventive maintenance programs for collection systems (cleaning schedules, valve exercising)
- CCTV inspection and defect coding (PACP: pipe assessment certification program)
- Sewer rehabilitation methods (CIPP lining, pipe bursting, slip lining, point repairs)
- I/I investigation and reduction programs (smoke testing, dye testing, flow monitoring)
- Grease trap inspection and enforcement (FOG programs, SIU permits)
- Combined sewer overflow management (CSO control policy, overflow monitoring)
- Sewer overflow emergency response (isolation, notification, cleanup, reporting)
- Odour control systems (chemical dosing: iron salts, nitrates, oxygen; biofilters)
- Confined space entry procedures for sewers (permit-required, atmospheric monitoring, rescue)
- Lift station electrical systems basics (MCC, VFDs, generator backup)
- Pump selection and performance curves (duty point, efficiency, NPSH)
- Sewer system capacity analysis (peak flow factors, design storms)
- Regulatory reporting for sewer overflows (Ontario Environmental Protection Act)
- Sewer cleaning equipment (jet/vac trucks: operation, nozzle selection)
- Root control programs (chemical treatment, mechanical cutting)
- Sewer easements and right-of-way (access, maintenance obligations)
- Collection system mapping and GIS (asset inventory, work order integration)`,

  "class3-wastewater|Wastewater Collection": `
- Advanced collection system hydraulic modeling (SWMM, InfoWorks ICM: calibration, validation)
- Capacity, Management, Operations and Maintenance (CMOM) programs (EPA framework)
- Advanced I/I analysis and reduction strategies (flow monitoring, cost-effectiveness analysis)
- Sewer system master planning (population growth, capacity deficiencies, capital needs)
- Asset management for collection infrastructure (condition assessment, risk scoring, prioritization)
- Advanced lift station management and SCADA (remote monitoring, predictive maintenance)
- Force main analysis and water hammer (Joukowsky equation, surge protection devices)
- Sewer overflow reduction plans (SSO elimination, CSO long-term control plans)
- Advanced CCTV inspection and condition assessment (structural vs operational defects, grading)
- Sewer rehabilitation planning and prioritization (risk-based selection, cost-benefit)
- Odour control program management (system-wide H2S modeling, chemical optimization)
- Regulatory compliance for collection systems (Ontario Environmental Protection Act, permits)
- Emergency response planning for collection systems (overflow response, mutual aid)
- Sanitary sewer overflow (SSO) root cause analysis (capacity, O&M, structural)
- Advanced pump station design review (hydraulic analysis, redundancy, energy efficiency)
- Sewer system performance metrics (SSO frequency, I/I ratio, maintenance cost per km)
- Wet weather flow management (real-time control, storage, green infrastructure)
- Biofilm and corrosion in collection systems (H2S-induced concrete corrosion, MIC)
- Advanced confined space program management (program audits, rescue team requirements)
- Capital planning for collection system renewal (lifecycle costing, funding strategies)`,

  "class4-wastewater|Wastewater Collection": `
- Complex collection system hydraulic modeling and calibration (SWMM, InfoWorks: model governance, uncertainty)
- Strategic asset management and lifecycle costing for collection systems (PSAB 3150, ISO 55000)
- Long-term control plans (LTCPs) for combined sewer overflows (EPA CSO policy, green infrastructure)
- Advanced wet weather flow management strategies (real-time control, tunnel storage, green infrastructure)
- Collection system optimization and energy efficiency (pump scheduling, pressure management, energy audits)
- Regulatory compliance program management for collection systems (Environmental Protection Act, permits)
- Advanced force main analysis and surge protection (transient modeling, protection device selection)
- Complex lift station design and optimization (hydraulic design, reliability, lifecycle cost)
- Collection system vulnerability assessment and security (EPA VSAT, physical security, cyber security)
- Advanced I/I reduction program management (program ROI, prioritization frameworks, funding)
- Performance benchmarking and KPI development for collection (CWWA, NACWA benchmarking)
- Risk-based asset management frameworks for sewers (probability of failure, consequence of failure)
- Capital budget development for collection renewal (10-year capital plan, rate impact analysis)
- Advanced sewer condition assessment and remaining life analysis (structural grading, deterioration models)
- Integrated watershed management and green infrastructure (LID, source control, co-benefits)
- Regulatory audit preparation for collection systems (MOE inspections, corrective action plans)
- Complex emergency response and business continuity for collection (major SSO events)
- Advanced SCADA and automation for collection systems (telemetry, predictive analytics, cybersecurity)
- Climate change adaptation for collection infrastructure (increased rainfall intensity, resilience)
- Biosolids management implications from collection system operations (FOG, pharmaceuticals, microplastics)`,

  // ── WATER TREATMENT ────────────────────────────────────────────────────────
  "class1-water|Water Treatment": `
- Coagulation and flocculation basics (purpose, common coagulants: alum, ferric chloride, polymer)
- Sedimentation and clarification (purpose, how suspended solids settle, basic operation)
- Filtration basics (rapid sand filtration: purpose, media, backwash cycle, turbidity targets)
- Chlorination basics (purpose, forms of chlorine: gas, sodium hypochlorite, calcium hypochlorite)
- Chlorine residual testing (DPD colorimetric method, free vs total chlorine, Ontario minimums)
- pH and alkalinity in water treatment (why pH matters, adjustment chemicals: lime, soda ash, CO2)
- Turbidity measurement and targets (NTU, regulatory limits under O. Reg. 170/03)
- Source water types (surface water vs groundwater: characteristics, treatment differences)
- Basic water chemistry (hardness, alkalinity, pH, iron, manganese)
- Chemical feed equipment basics (chemical metering pumps, day tanks, hoppers)
- Water treatment plant safety (chemical hazards: chlorine gas, lime; PPE; SDS)
- Confined space entry basics in water treatment (permit-required spaces, atmospheric testing)
- Disinfection byproducts basics (THMs, HAAs: what they are, why they form, Ontario limits)
- Laboratory tests performed by Class 1 operators (turbidity, pH, chlorine residual, hardness)
- Taste and odour problems in water treatment (causes: algae, geosmin, MIB; treatment: activated carbon)
- Iron and manganese removal basics (oxidation and filtration approach)
- Fluoride in water treatment (purpose, Ontario target, monitoring)
- Backwash procedures for filters (when to backwash, filter-to-waste, turbidity breakthrough)
- Water storage basics (clear wells, reservoirs: purpose, disinfection, turnover)
- Ontario Safe Drinking Water Act and O. Reg. 170/03 basics (operator responsibilities, adverse conditions)`,

  "class2-water|Water Treatment": `
- Coagulation optimization (jar testing, coagulant dose selection, pH adjustment, streaming current)
- Flocculation design and operation (G-value, detention time, tapered flocculation)
- Sedimentation efficiency calculations (overflow rate, detention time, solids loading)
- Filtration operations (filter run length, turbidity breakthrough, backwash optimization, UFRV)
- Membrane filtration basics (MF, UF: purpose, integrity testing, fouling, cleaning)
- Disinfection CT calculations (CT values for Giardia and Cryptosporidium inactivation)
- Chloramine formation and nitrification (monochloramine formation, nitrification prevention)
- Disinfection byproduct formation and control (THM/HAA precursors, optimizing treatment)
- Corrosion control in treatment (Langelier Saturation Index, inhibitors: orthophosphate, zinc)
- Iron and manganese removal (oxidation: chlorine, KMnO4, ozone; greensand filtration)
- Activated carbon use (PAC vs GAC: taste/odour, DBP precursor removal, contact time)
- Fluoride addition calculations (target concentration, dose calculation, equipment)
- Chemical feed calculations (dosage, solution strength, pump settings)
- Laboratory analysis for Class 2 (jar test, streaming current, particle count, alkalinity titration)
- Residuals management (filter backwash water, sedimentation sludge: thickening, disposal)
- SCADA and process control basics (setpoints, alarms, data logging)
- Ontario regulatory requirements for water treatment (O. Reg. 170/03 sampling, reporting)
- Emergency response for treatment upsets (turbidity spike, loss of disinfection, chemical spill)
- Energy efficiency in water treatment (pump efficiency, chemical optimization)
- Source water protection and treatment triggers (algal blooms, high turbidity events)`,

  "class3-water|Water Treatment": `
- Advanced coagulation and flocculation optimization (enhanced coagulation for DBP control, charge neutralization)
- Advanced filtration management (filter performance optimization, filter media selection, UFRV targets)
- Membrane filtration systems (MF, UF, NF, RO: design, operation, integrity testing, fouling control)
- Advanced disinfection systems (UV disinfection: dose, validation, lamp fouling; ozone: CT, bromate)
- Advanced CT calculations and disinfection credit (multiple barriers, SWTR compliance)
- Disinfection byproduct control strategies (enhanced coagulation, GAC, chloramines, precursor removal)
- Advanced corrosion control programs (lead and copper monitoring, inhibitor optimization, LSI)
- Biological filtration (biofiltration: EBCT, backwash optimization, nutrient addition)
- Taste and odour management programs (seasonal monitoring, PAC dosing optimization, source control)
- Advanced residuals management (sludge thickening, dewatering, land application, lagoon management)
- Emerging contaminants in water treatment (PFAS, microplastics, pharmaceuticals: treatment approaches)
- Water treatment plant optimization (process control, chemical minimization, energy efficiency)
- Asset management for treatment facilities (condition assessment, maintenance planning)
- Advanced laboratory methods (TOC, particle counting, algae monitoring, jar test interpretation)
- Regulatory compliance management (DWSP, O. Reg. 170/03, Director's Orders, MECP inspections)
- Source water quality monitoring programs (watershed monitoring, early warning systems)
- Algal bloom response (cyanotoxin monitoring, treatment modifications, public notification)
- Advanced SCADA and process automation (PLC programming concepts, alarm management)
- Capital planning for treatment facility upgrades (process selection, cost estimation)
- Operator training and competency management for treatment facilities`,

  "class4-water|Water Treatment": `
- Advanced treatment process optimization and troubleshooting (coagulation, filtration, disinfection integration)
- Complex membrane system management (NF, RO: system design, concentrate disposal, energy recovery)
- Advanced oxidation processes (ozone/H2O2, UV/H2O2: design, operation, byproduct control)
- Multiple barrier disinfection strategies (UV + chlorine, ozone + chloramine: CT compliance, optimization)
- Advanced DBP control and regulatory compliance (Stage 2 DBPR, optimization studies, treatment changes)
- PFAS and emerging contaminant treatment (GAC, ion exchange, membrane: design, cost, regulatory drivers)
- Advanced corrosion control program management (lead service line strategy, inhibitor studies, regulatory)
- Drinking Water Safety Plans (DWSP): hazard analysis, critical control points, verification
- Complex residuals management programs (biosolids land application, lagoon design, regulatory compliance)
- Water treatment plant design review (process selection, hydraulic design, redundancy)
- Advanced source water protection (watershed risk assessment, treatment triggers, multi-barrier approach)
- Regulatory audit preparation and response (MECP inspections, corrective action plans, Director's Orders)
- Performance benchmarking for treatment facilities (AWWA QualServe, energy benchmarking)
- Risk management frameworks for water treatment (HACCP, ISO 31000, consequence of failure)
- Capital project management for treatment upgrades (business case, procurement, commissioning)
- Climate change impacts on water treatment (algal blooms, turbidity events, source water variability)
- Advanced cyanotoxin management (monitoring, treatment, public notification, regulatory requirements)
- Energy management programs for water treatment (energy audits, demand management, renewable energy)
- Strategic planning for treatment capacity (growth projections, technology selection, financing)
- Operator certification program management (training plans, competency verification, succession planning)`,

  // ── WASTEWATER TREATMENT ───────────────────────────────────────────────────
  "class1-wastewater|Wastewater Treatment": `
- Wastewater treatment plant layout and process flow (preliminary, primary, secondary, disinfection)
- Preliminary treatment (screening: bar screens, mechanically cleaned; grit removal: purpose, operation)
- Primary treatment (primary clarifiers: purpose, operation, scum and sludge removal)
- Activated sludge basics (aeration tank, secondary clarifier, return activated sludge, waste activated sludge)
- Trickling filters basics (media types, distributor arms, recirculation, sloughing)
- Disinfection of wastewater effluent (chlorination: purpose, contact time, dechlorination)
- Sludge handling basics (thickening, digestion, dewatering: purpose and basic operation)
- Effluent quality parameters (BOD, TSS, pH, ammonia: what they measure, typical limits)
- Laboratory tests for Class 1 operators (BOD, TSS, pH, DO, chlorine residual)
- Safety in wastewater treatment (H2S hazards, confined spaces, chemical hazards, PPE)
- Dissolved oxygen in activated sludge (why it matters, typical targets: 1-2 mg/L)
- Sludge volume index (SVI) basics (what it measures, good vs poor settling)
- Ontario Environmental Compliance Approval (ECA) basics (what it is, operator responsibilities)
- Odour control in wastewater treatment (sources: H2S, ammonia; basic control methods)
- Pumping in wastewater treatment (lift stations, recycle pumps, sludge pumps: basic operation)
- Nutrient basics in wastewater (nitrogen cycle: ammonia, nitrite, nitrate; phosphorus removal basics)
- Combined sewer overflows at treatment plants (bypass, overflow: causes, reporting)
- Wet weather operations (peak flow management, bypasses, effluent quality during storms)
- Record keeping and reporting for Class 1 operators (daily logs, adverse conditions)
- Ontario regulations for wastewater treatment (Environmental Protection Act, O. Reg. 129/04)`,

  "class2-wastewater|Wastewater Treatment": `
- Activated sludge process control (MLSS, MLVSS, SRT/sludge age, F:M ratio, DO control)
- Activated sludge troubleshooting (bulking: filamentous vs non-filamentous, foaming, rising sludge)
- Secondary clarifier operations (surface overflow rate, solids loading rate, sludge blanket management)
- Biological nutrient removal basics (nitrification, denitrification, biological phosphorus removal)
- Trickling filter operations and troubleshooting (recirculation ratio, ponding, filter flies)
- Rotating biological contactors (RBC: staging, disc submergence, troubleshooting)
- Sludge thickening (gravity thickening, DAF thickening: design parameters, operation)
- Anaerobic digestion (mesophilic digestion: SRT, temperature, volatile solids reduction, gas production)
- Aerobic digestion (ATAD, conventional: volatile solids reduction, regulatory requirements)
- Sludge dewatering (belt filter press, centrifuge, screw press: operation, cake solids)
- Biosolids land application (Class A vs Class B, Ontario regulations, pathogen reduction)
- Effluent quality calculations (BOD removal efficiency, TSS removal, CBOD)
- Chemical phosphorus removal (alum, ferric chloride, lime: dosing, sludge production)
- Disinfection of wastewater (UV disinfection: dose, transmittance; chlorination CT)
- Membrane bioreactors (MBR) basics (operation, membrane fouling, advantages)
- Odour control systems (biofilters, chemical scrubbers, covers: design and operation)
- Septage receiving (acceptance criteria, pretreatment, impact on plant operations)
- Laboratory analysis for Class 2 (BOD, TSS, VSS, SVI, settleability, ammonia, phosphorus)
- Energy efficiency in wastewater treatment (aeration efficiency, digester gas utilization)
- Ontario regulatory requirements for wastewater treatment (ECA conditions, O. Reg. 129/04)`,

  "class3-wastewater|Wastewater Treatment": `
- Advanced activated sludge process optimization (SRT optimization, selector reactors, DSVI)
- Advanced biological nutrient removal (BNR) systems (A2O, Bardenpho, UCT, VIP: design and operation)
- Advanced secondary clarifier design and operation (Vesilind settling, flux theory, thickening vs clarification)
- Membrane bioreactor (MBR) systems management (fouling control, CIP protocols, energy optimization)
- Advanced anaerobic digestion (thermophilic digestion, co-digestion, biogas utilization, digestate quality)
- Advanced biosolids management (Class A pathogen reduction, EQ biosolids, land application program)
- Tertiary treatment systems (sand filtration, cloth media filtration, disc filtration: design and operation)
- Advanced nutrient removal (low-level phosphorus removal, effluent polishing, regulatory limits)
- Advanced disinfection (UV validation, ozone for reuse, chloramine formation and control)
- Water reuse and reclamation (Ontario guidelines, treatment requirements, end uses)
- Emerging contaminants in wastewater (pharmaceuticals, microplastics, PFAS: treatment and monitoring)
- Advanced odour control program management (H2S modeling, chemical optimization, community relations)
- Regulatory compliance management for wastewater (ECA conditions, Director's Orders, MECP inspections)
- Asset management for treatment facilities (condition assessment, maintenance planning, lifecycle costing)
- Process optimization studies (treatability studies, pilot testing, energy audits)
- Advanced laboratory methods (respirometry, settleability testing, bioassay, toxicity testing)
- Capital planning for wastewater treatment upgrades (process selection, cost estimation, funding)
- Operator training and competency management for treatment facilities
- Climate change impacts on wastewater treatment (wet weather flows, temperature effects)
- Advanced SCADA and process automation for wastewater treatment`,

  "class4-wastewater|Wastewater Treatment": `
- Advanced BNR process design and optimization (nutrient trading, effluent limits, technology selection)
- Complex membrane system management (MBR, NF, RO for reuse: design, energy, concentrate management)
- Advanced anaerobic treatment (UASB, EGSB, AnMBR: design, biogas recovery, energy neutrality)
- Resource recovery from wastewater (energy: biogas, heat; nutrients: struvite, phosphorus; water reuse)
- Advanced biosolids management programs (Class A EQ biosolids, beneficial use, regulatory compliance)
- Micropollutant and emerging contaminant management (PFAS, pharmaceuticals: treatment, monitoring, regulatory)
- Advanced disinfection systems management (UV validation studies, ozone system design, regulatory)
- Environmental compliance approval (ECA) management (amendments, Director's Orders, audit response)
- Drinking Water Safety Plan equivalent for wastewater (risk assessment, critical control points)
- Advanced process modeling (BioWin, GPS-X, SUMO: calibration, scenario analysis, design optimization)
- Regulatory strategy for wastewater treatment (nutrient limits, effluent quality trading, permit negotiation)
- Capital project management for treatment plant expansions (business case, procurement, commissioning)
- Performance benchmarking for wastewater treatment (CWWA, WEF benchmarking, energy intensity)
- Risk management frameworks for wastewater treatment (consequence of failure, business continuity)
- Advanced energy management (energy audits, demand management, net-zero energy treatment plants)
- Climate change adaptation for wastewater treatment (capacity planning, resilience, flood protection)
- Strategic planning for treatment capacity (growth projections, technology selection, financing)
- Advanced biosolids regulations and policy (Ontario Nutrient Management Act, MECP guidelines)
- Integrated resource management (collection-treatment-biosolids-reuse as a system)
- Operator certification program management and succession planning for treatment facilities`
};

const topics = TOPIC_MAP[`${bankKey}|${module}`] || "General topics for this certification level";

const systemPrompt = `You are a professional water/wastewater operator certification exam developer writing questions for Ontario OWWCO exams. You follow the same item-writing standards used by AWWA, ASSE, WPI, and OWWCO certification bodies.

CORE ITEM-WRITING RULES:
1. Return ONLY a valid JSON array, no markdown fences, no explanation, no preamble
2. Each object has exactly: question (string), options (array of 4 strings), correctIndex (0-3 integer), explanation (string), difficulty ("easy"|"medium"|"hard")
3. Distribute difficulty: roughly 30% easy, 45% medium, 25% hard
4. For calculation questions, show the formula and step-by-step work in the explanation
5. Reference specific Ontario regulations where relevant
6. Do NOT use self-correction language (actually, in fact, note that, it should be noted)
7. Do NOT use em dashes
8. Distribute correctIndex evenly across 0, 1, 2, 3
9. Class 1 = foundational; Class 2 = applied operations; Class 3 = supervisory/advanced; Class 4 = management/complex engineering
10. Keep explanations concise (2-4 sentences max). For calculations, show only the key formula and final step.

CRITICAL DISTRACTOR QUALITY RULES (violations will make the exam useless):
11. ALL FOUR options must be similar in length. The correct answer must NOT be the longest or most detailed option. If the correct answer is 12 words, every distractor must also be 8-16 words. Never write a 3-word throwaway distractor when the correct answer is a full sentence.
12. Distractors must be plausible to someone with partial knowledge. Wrong answers should represent common misconceptions or plausible confusions -- for example, a wrong flow rate that is close to but not the correct value, a regulation section that is real but governs a different aspect, or a technique that is valid in a different context.
13. Wrong answers should represent common misconceptions or plausible confusions -- for example, a wrong flow rate that is close to but not the correct value, a regulation section that is real but governs a different aspect, or a technique that is valid in a different context.
14. The correct answer must NOT restate or paraphrase the question stem. If the stem asks "What is the purpose of X?", the correct answer should not begin with "X is used to..." in a way that makes it obviously correct from wording alone.
15. For Class 3-4 questions: all four options should be real management frameworks, engineering approaches, or regulatory strategies. The question should require knowledge to distinguish between them, not just common sense.

EXAMPLE OF BAD DISTRACTORS (never do this):
Q: What is the primary purpose of a Long-Term Control Plan?
A: To reduce the number of overflow events and comply with EPA CSO policy [CORRECT - too detailed]
B: To increase the number of employees in the department [OBVIOUSLY WRONG - throwaway]
C: To focus only on financial recovery [OBVIOUSLY WRONG - throwaway]
D: To eliminate all maintenance activities [OBVIOUSLY WRONG - throwaway]

EXAMPLE OF GOOD DISTRACTORS (always do this):
Q: What is the primary regulatory driver for developing a Long-Term Control Plan (LTCP) in Ontario?
A: The federal Wastewater Systems Effluent Regulations (WSER) under the Fisheries Act
B: Ontario's Environmental Protection Act and MECP's CSO Control Policy
C: The Safe Drinking Water Act, O. Reg. 170/03 adverse condition reporting
D: The Ontario Water Resources Act, O. Reg. 129/04 effluent limits
[All four are real Ontario/federal regulations. Only B is correct for CSO LTCPs. A candidate must actually know the regulatory framework to answer correctly.]`;

async function callLLM(prompt, batchCount) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 32768
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  const result = await response.json();
  const content = result.choices[0].message.content.trim();
  // Strip markdown code fences
  let cleaned = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  
  // Find the JSON array boundaries
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`No JSON array found in response\nContent (first 300 chars): ${content.substring(0, 300)}`);
  }
  cleaned = cleaned.substring(start, end + 1);
  
  // Replace raw control characters that break JSON parsing
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
  // Remove trailing commas before ] or } (common LLM mistake)
  cleaned = cleaned.replace(/,\s*([\]\}])/g, '$1');
  
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`JSON parse failed: ${e.message}\nContent (first 300 chars): ${content.substring(0, 300)}`);
  }
  
  if (!Array.isArray(parsed)) throw new Error(`Response is not an array`);
  return parsed;
}

console.log(`Generating ${count} questions for ${bankKey} / ${module} (${classLevel})...`);

const allQuestions = [];
const batchSize = 50;
const numBatches = Math.ceil(count / batchSize);

for (let i = 0; i < numBatches; i++) {
  const batchCount = Math.min(batchSize, count - i * batchSize);
  console.log(`  Batch ${i + 1}/${numBatches}: generating ${batchCount} questions...`);
  
  const prompt = `Generate exactly ${batchCount} unique multiple-choice questions for the Ontario ${classLevel} operator certification exam.
Bank: ${bankKey}
Module: ${module}
Class Level: ${classLevel}

Topics to cover (distribute evenly):
${topics}

Return ONLY the JSON array of ${batchCount} question objects. No other text.`;
  
  let attempts = 0;
  let batch;
  while (attempts < 5) {
    try {
      batch = await callLLM(prompt, batchCount);
      break;
    } catch (e) {
      attempts++;
      if (attempts >= 5) throw e;
      const delay = Math.min(5000 * Math.pow(2, attempts - 1), 30000);
      console.warn(`  Batch ${i + 1} attempt ${attempts} failed: ${e.message}. Retrying in ${delay/1000}s...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  allQuestions.push(...batch);
  console.log(`  Batch ${i + 1} done: ${batch.length} questions (total: ${allQuestions.length})`);
}

// Assign questionNums and normalize fields
const questions = allQuestions.slice(0, count).map((q, idx) => ({
  questionNum: startNum + idx,
  bankKey,
  module,
  difficulty: q.difficulty || "medium",
  question: q.question,
  options: Array.isArray(q.options) ? JSON.stringify(q.options) : q.options,
  correctIndex: q.correctIndex,
  explanation: q.explanation
}));

writeFileSync(outputFile, JSON.stringify(questions, null, 2));
console.log(`Done! ${questions.length} questions written to ${outputFile}`);
