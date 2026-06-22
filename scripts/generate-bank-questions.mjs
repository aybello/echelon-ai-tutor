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
- Biosolids management implications from collection system operations (FOG, pharmaceuticals, microplastics)`
};

const topics = TOPIC_MAP[`${bankKey}|${module}`] || "General topics for this certification level";

const systemPrompt = `You are an expert Ontario water/wastewater operator exam question writer with deep knowledge of Ontario regulations (O. Reg. 170/03, O. Reg. 129/04, Environmental Protection Act), AWWA standards, and water/wastewater engineering principles.

RULES:
1. Return ONLY a valid JSON array, no markdown fences, no explanation, no preamble
2. Each object has exactly: question (string), options (array of 4 strings), correctIndex (0-3 integer), explanation (string), difficulty ("easy"|"medium"|"hard")
3. Distribute difficulty: roughly 30% easy, 45% medium, 25% hard
4. For calculation questions, show the formula and step-by-step work in the explanation
5. Reference specific Ontario regulations where relevant
6. Do NOT use self-correction language (actually, in fact, note that, it should be noted)
7. Do NOT use em dashes
8. Distribute correctIndex evenly across 0, 1, 2, 3
9. Class 1 = foundational; Class 2 = applied operations; Class 3 = supervisory/advanced; Class 4 = management/complex engineering
10. Options must be plausible: wrong answers should be common misconceptions, not obviously wrong
11. Keep explanations concise (2-4 sentences max). For calculations, show only the key formula and final step. Do NOT include extended reasoning, self-doubt, or multiple calculation attempts in explanations`;

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
