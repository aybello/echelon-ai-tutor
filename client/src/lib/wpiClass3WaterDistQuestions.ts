// WPI Class III Water Distribution — Practice Question Bank (150 Questions)
// Aligned with WPI Need-to-Know Criteria: Water Distribution Operator Class III
// Used for: BC (EOCP Level III), Alberta (AWWOA Class III), Saskatchewan, Manitoba
// Exam Blueprint: 23 Distribution System Components | 25 Equipment O&M | 25 Water Quality | 27 Safety & Admin
// Calculations: ~12% of exam

export interface WpiClass3WaterDistQuestion {
  id: number;
  module: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  steps?: { l: string; c: string }[];
  tip?: string;
  isCalc?: boolean;
}

export const wpiClass3WaterDistQuestions: WpiClass3WaterDistQuestion[] = [
  // ─── MODULE 1: Distribution System Components (38 questions) ───────────────
  {
    id: 1,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system hydraulic model?",
    options: [
      "To calculate chemical dosages",
      "To simulate water flow, pressure, and water quality throughout the distribution network under various demand and operational scenarios",
      "To track customer complaints",
      "To schedule pipe replacement"
    ],
    correctAnswer: 1,
    explanation: "Hydraulic models (such as EPANET) simulate the distribution system to: predict pressures and flows under various demand conditions, identify system deficiencies (low pressure zones, undersized pipes), evaluate the impact of proposed improvements, optimize pump scheduling and tank operations, and support water quality modeling (chlorine decay, age, source tracing). Models require calibration against field measurements to be reliable. They are essential tools for system planning and operations.",
  },
  {
    id: 2,
    module: "Distribution System Components",
    question: "What is the significance of the C-factor (Hazen-Williams coefficient) in distribution system design?",
    options: [
      "It measures water hardness",
      "It quantifies pipe roughness and its effect on friction head loss — higher C values indicate smoother pipes with less friction loss",
      "It measures chlorine demand",
      "It quantifies pump efficiency"
    ],
    correctAnswer: 1,
    explanation: "The Hazen-Williams C-factor quantifies pipe roughness: new smooth pipes (PVC, HDPE) have C=140-150; new ductile iron has C=130; older cast iron with tuberculation may have C=60-80. Lower C values mean higher friction losses for the same flow. The Hazen-Williams formula: V = 0.849 × C × R^0.63 × S^0.54. As pipes age and tuberculate, C decreases, increasing head loss and reducing system capacity. C-factor field testing (fire flow tests) is used to calibrate hydraulic models.",
    isCalc: true,
  },
  {
    id: 3,
    module: "Distribution System Components",
    question: "What is a pressure zone and why are they used in distribution systems?",
    options: [
      "A zone where water pressure is measured",
      "A portion of the distribution system served at a specific pressure range, created using pressure reducing valves or separate pumping systems to maintain appropriate pressures throughout hilly or large service areas",
      "A zone with high water demand",
      "A zone with special water quality requirements"
    ],
    correctAnswer: 1,
    explanation: "Pressure zones divide distribution systems into areas served at specific pressure ranges (typically 40-80 psi). They are needed when: terrain elevation differences would cause excessive pressure in low areas or inadequate pressure in high areas, system size makes single-zone pressure management impractical, or different customer types have different pressure requirements. Pressure zones are separated by: pressure reducing valves (PRVs) that reduce pressure from high to low zones, pressure sustaining valves (PSVs) that maintain minimum pressure in high zones, and separate pumping systems for high-pressure zones.",
  },
  {
    id: 4,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system master plan?",
    options: [
      "To schedule daily operations",
      "To provide a long-range (10-20 year) framework for system expansion, rehabilitation, and capital investment based on growth projections, regulatory requirements, and infrastructure condition assessment",
      "To track customer accounts",
      "To schedule employee training"
    ],
    correctAnswer: 1,
    explanation: "A distribution system master plan: assesses current system capacity and condition, projects future demands based on population and land use growth, identifies infrastructure deficiencies and needed improvements, prioritizes capital projects, estimates costs and funding requirements, and guides rate-setting and financial planning. Master plans are typically updated every 5-10 years. They incorporate hydraulic modeling to evaluate proposed improvements and ensure the system can meet future demands at adequate pressures.",
  },
  {
    id: 5,
    module: "Distribution System Components",
    question: "What is water age in a distribution system and why is it important?",
    options: [
      "The age of the pipes in the system",
      "The time water has spent in the distribution system since leaving the treatment plant — older water has lower disinfectant residual, higher DBP formation potential, and greater risk of microbial regrowth",
      "The age of the water source",
      "The time since the last flushing"
    ],
    correctAnswer: 1,
    explanation: "Water age (residence time) is the time water spends in the distribution system. High water age causes: chlorine residual decay (increasing microbial risk), disinfection byproduct (DBP) formation (trihalomethanes, haloacetic acids), taste and odor complaints, and nitrification in chloraminated systems. High water age occurs in: dead-end mains, oversized storage tanks, low-demand areas, and during low-demand periods. Management strategies: system flushing, tank turnover optimization, looping dead-ends, and demand management.",
  },
  {
    id: 6,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system vulnerability assessment?",
    options: [
      "To assess pipe condition only",
      "To systematically identify threats, vulnerabilities, and consequences of potential attacks or failures on the water system, and to develop risk reduction strategies",
      "To assess customer vulnerability to rate increases",
      "To assess employee safety risks"
    ],
    correctAnswer: 1,
    explanation: "Vulnerability assessments (VAs) are required by the America's Water Infrastructure Act (AWIA) for systems serving >3,300 people. VAs evaluate: physical security (facility access, perimeter security), cyber security (SCADA, control systems), chemical/biological/radiological threats, natural hazards (floods, earthquakes, drought), and interdependencies (power, chemicals, communications). VAs must be updated every 5 years. Results inform Emergency Response Plans (ERPs) and capital improvement priorities.",
  },
  {
    id: 7,
    module: "Distribution System Components",
    question: "What is the significance of the minimum night flow (MNF) analysis in distribution systems?",
    options: [
      "It measures nighttime demand only",
      "It is used to estimate real water losses (leakage) by measuring the minimum flow into a district metered area during the period of lowest legitimate demand (typically 2-4 AM)",
      "It measures pump efficiency at night",
      "It measures storage tank levels at night"
    ],
    correctAnswer: 1,
    explanation: "Minimum night flow (MNF) analysis: measures total flow into a district metered area (DMA) during the period of lowest legitimate consumption (typically 2-4 AM). At this time, most customers are not using water, so flow above estimated night use represents leakage. MNF = Night Use + Leakage. Night use is estimated from customer data. Leakage = MNF - Night Use. MNF analysis is the foundation of active leakage control programs and helps prioritize leak detection efforts.",
  },
  {
    id: 8,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system flushing program?",
    options: [
      "To test pipe strength",
      "To remove sediment, biofilm, and aged water from distribution mains, restore disinfectant residuals, and improve water quality",
      "To test meter accuracy",
      "To reduce water pressure"
    ],
    correctAnswer: 1,
    explanation: "Distribution system flushing programs: remove accumulated sediment and biofilm, restore disinfectant residuals in low-flow areas, improve taste and odor, reduce water age in dead-end mains, and verify system hydraulics. Unidirectional flushing (UDF) is more effective than conventional flushing — it uses a systematic sequence of valve closures to create high-velocity flow (2.5-5 ft/s) in one direction, scouring the pipe. UDF uses less water and is more effective than conventional flushing. Flushing should be documented and tracked.",
  },
  {
    id: 9,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system corrosion control program?",
    options: [
      "To prevent pipe leaks only",
      "To minimize corrosion of distribution system pipes and plumbing, which can cause pipe deterioration, water quality problems (red water, taste/odor), and lead/copper release from household plumbing",
      "To prevent external corrosion only",
      "To prevent pump corrosion"
    ],
    correctAnswer: 1,
    explanation: "Distribution system corrosion control: prevents internal pipe corrosion (tuberculation, red water, taste/odor), minimizes lead and copper release from household plumbing (required by Lead and Copper Rule), and extends pipe service life. Methods include: pH adjustment (maintaining pH 7.5-9.0), alkalinity adjustment (maintaining 30-100 mg/L as CaCO3), orthophosphate addition (forms protective scale on lead/copper), calcium carbonate saturation (Langelier Saturation Index), and cathodic protection for metallic pipes. The Lead and Copper Rule requires corrosion control treatment for systems exceeding action levels.",
  },
  {
    id: 10,
    module: "Distribution System Components",
    question: "What is the purpose of a district metered area (DMA) in water distribution?",
    options: [
      "A metered area for billing purposes only",
      "A discrete zone of the distribution system with defined boundaries and metered inflows/outflows, used for water loss management, pressure management, and water quality monitoring",
      "A metered area for pump efficiency testing",
      "A metered area for fire flow testing"
    ],
    correctAnswer: 1,
    explanation: "District metered areas (DMAs) divide the distribution system into manageable zones for: water loss management (measuring and reducing leakage), pressure management (optimizing pressure to minimize leakage and pipe bursts), water quality monitoring (tracking chlorine residuals and water age), and hydraulic analysis (calibrating models). DMAs have defined boundaries (closed valves or check valves) and metered inflows. Flow data from DMA meters enables minimum night flow analysis for leakage quantification. DMAs are a key component of active leakage control programs.",
  },
  {
    id: 11,
    module: "Distribution System Components",
    question: "What is the Infrastructure Leakage Index (ILI) and how is it used?",
    options: [
      "A measure of pipe age",
      "A performance indicator that compares actual real losses to the unavoidable annual real losses (UARL) for a system — ILI = Current Annual Real Losses / UARL",
      "A measure of pipe material quality",
      "A measure of pump efficiency"
    ],
    correctAnswer: 1,
    explanation: "The Infrastructure Leakage Index (ILI) = Current Annual Real Losses (CARL) / Unavoidable Annual Real Losses (UARL). UARL represents the minimum leakage achievable with current technology and best practices. ILI = 1.0 means the system is performing at the best achievable level. ILI > 1.0 means there is recoverable leakage. ILI is used to: benchmark system performance, set leakage reduction targets, and prioritize investment in leakage control. ILI < 2 is considered excellent; ILI > 8 indicates significant leakage problems requiring urgent attention.",
    isCalc: true,
  },
  {
    id: 12,
    module: "Distribution System Components",
    question: "What is the purpose of a cathodic protection system for buried metallic pipes?",
    options: [
      "To prevent internal corrosion only",
      "To prevent external corrosion of metallic pipes by making the pipe the cathode of an electrochemical cell, using either sacrificial anodes or impressed current",
      "To prevent biological growth",
      "To prevent scale formation"
    ],
    correctAnswer: 1,
    explanation: "Cathodic protection (CP) prevents external corrosion of buried metallic pipes (steel, ductile iron, cast iron). Two types: Sacrificial anode CP — more active metals (magnesium, zinc) are connected to the pipe; they corrode preferentially, protecting the pipe. Impressed current CP — an external DC power source drives current from inert anodes to the pipe, making it cathodic. CP is essential for: steel transmission mains, steel storage tanks, and ductile iron pipes in corrosive soils. CP effectiveness is monitored by measuring pipe-to-soil potential (should be more negative than -0.85V vs. copper-copper sulfate electrode).",
  },
  {
    id: 13,
    module: "Distribution System Components",
    question: "What is the purpose of a water system emergency interconnection?",
    options: [
      "To connect to neighboring systems for normal supply",
      "To provide a temporary or permanent connection to an adjacent water system that can supply water during emergencies such as source failure, treatment plant outage, or major main break",
      "To connect to fire department water supplies",
      "To connect to industrial water users"
    ],
    correctAnswer: 1,
    explanation: "Emergency interconnections provide backup water supply from adjacent utilities during: source water contamination events, treatment plant outages, major transmission main failures, drought or water shortage, and natural disasters. Interconnections must include: backflow prevention (to protect both systems), metering, isolation valves, and pressure regulation. They must be regularly exercised (at least annually) to ensure operability. Interconnection agreements must address: water quality standards, pricing, maximum flow rates, and notification procedures.",
  },
  {
    id: 14,
    module: "Distribution System Components",
    question: "What is the purpose of a pipe condition assessment program?",
    options: [
      "To assess pipe color only",
      "To systematically evaluate the structural and hydraulic condition of distribution mains to prioritize rehabilitation and replacement, reducing main breaks and water losses",
      "To assess pipe installation quality only",
      "To assess pipe age only"
    ],
    correctAnswer: 1,
    explanation: "Pipe condition assessment programs: evaluate structural condition (wall thickness, corrosion, cracks), hydraulic condition (C-factor, tuberculation), failure history (break frequency, repair costs), and remaining service life. Assessment methods include: closed-circuit television (CCTV) inspection, acoustic leak detection, pipe sampling and laboratory analysis, electromagnetic inspection (for metallic pipes), and break history analysis. Results are used to: prioritize pipe rehabilitation (lining, coating) and replacement, optimize capital investment, and reduce main break frequency and water losses.",
  },
  {
    id: 15,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system water quality monitoring plan?",
    options: [
      "To monitor only at the treatment plant",
      "To systematically sample and analyze water quality throughout the distribution system to verify regulatory compliance, detect water quality deterioration, and identify problem areas",
      "To monitor only at customer taps",
      "To monitor only at storage tanks"
    ],
    correctAnswer: 1,
    explanation: "Distribution system water quality monitoring plans: ensure regulatory compliance (Total Coliform Rule, Lead and Copper Rule, Disinfectants and DBP Rule), detect water quality deterioration (chlorine loss, microbial growth, taste/odor), identify problem areas (low residual zones, high water age areas), and verify treatment effectiveness. Monitoring locations should represent: entry points, storage facilities, high water age areas, dead-ends, and customer taps. Results should be analyzed for trends and used to optimize operations (flushing, disinfection, storage turnover).",
  },
  {
    id: 16,
    module: "Distribution System Components",
    question: "What is the significance of the Langelier Saturation Index (LSI) in distribution system management?",
    options: [
      "It measures chlorine demand",
      "It indicates whether water is corrosive (negative LSI) or scale-forming (positive LSI) with respect to calcium carbonate — used to assess corrosion potential and optimize corrosion control treatment",
      "It measures turbidity",
      "It measures biological activity"
    ],
    correctAnswer: 1,
    explanation: "The Langelier Saturation Index (LSI) = pH - pHs, where pHs is the pH at which water is saturated with calcium carbonate. LSI < 0: water is undersaturated (corrosive — will dissolve CaCO3 scale, potentially attacking pipe walls). LSI = 0: water is at equilibrium. LSI > 0: water is supersaturated (scale-forming — will deposit CaCO3, which can protect pipes). For corrosion control, a slightly positive LSI (0 to +0.5) is typically targeted. LSI is affected by pH, temperature, calcium hardness, alkalinity, and TDS.",
    isCalc: true,
  },
  {
    id: 17,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system flushing velocity requirement?",
    options: [
      "To test pipe strength",
      "To ensure sufficient velocity (typically 2.5-5 ft/s or 0.76-1.52 m/s) to scour sediment and biofilm from pipe walls during flushing operations",
      "To test meter accuracy",
      "To test pressure relief valves"
    ],
    correctAnswer: 1,
    explanation: "Flushing velocity requirements ensure effective cleaning: minimum 2.5 ft/s (0.76 m/s) to mobilize sediment; 5 ft/s (1.52 m/s) or higher for effective scouring. Required flushing flow can be calculated: Q = V × A, where A is pipe cross-sectional area. For a 6-inch pipe (A = 0.196 ft²): Q = 2.5 × 0.196 = 0.49 ft³/s = 220 gpm. Unidirectional flushing achieves higher velocities with less water than conventional flushing by directing flow in one direction using valve sequencing.",
    isCalc: true,
  },
  {
    id: 18,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system pressure management program?",
    options: [
      "To maximize system pressure",
      "To optimize system pressure to reduce pipe breaks, minimize leakage, extend infrastructure life, and reduce energy consumption while maintaining adequate service pressure",
      "To minimize system pressure",
      "To equalize pressure throughout the system"
    ],
    correctAnswer: 1,
    explanation: "Pressure management programs: reduce pipe breaks (pipe break frequency is proportional to pressure), minimize leakage (leakage is proportional to pressure — reducing pressure by 10% reduces leakage by ~10%), extend infrastructure life (lower pressure reduces pipe fatigue), reduce energy consumption (lower pressure means less pumping energy), and maintain service quality (minimum 20 psi at all times, 35 psi for fire flow). Tools include: pressure reducing valves (PRVs), pressure sustaining valves (PSVs), variable speed pumps, and pressure zone management.",
  },
  {
    id: 19,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system asset management program?",
    options: [
      "To track equipment inventory only",
      "To systematically manage infrastructure assets throughout their lifecycle — from planning and acquisition through operation, maintenance, rehabilitation, and replacement — to deliver required service levels at minimum cost",
      "To track employee assets only",
      "To track financial assets only"
    ],
    correctAnswer: 1,
    explanation: "Asset management programs: inventory all infrastructure assets (pipes, valves, hydrants, pumps, tanks), assess asset condition and remaining useful life, quantify risk of failure and consequence of failure, develop maintenance and replacement strategies, optimize capital and O&M spending, and support long-term financial planning. Key components: asset registry (GIS-based), condition assessment, criticality analysis, level of service targets, and capital improvement planning. Asset management reduces lifecycle costs and improves service reliability.",
  },
  {
    id: 20,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system GIS (Geographic Information System)?",
    options: [
      "To track customer billing only",
      "To spatially manage and analyze distribution system infrastructure data — pipe locations, sizes, materials, ages, valve locations, hydrant locations — enabling better operations, maintenance planning, and capital investment decisions",
      "To track employee locations only",
      "To track water quality data only"
    ],
    correctAnswer: 1,
    explanation: "GIS systems for water distribution: store and display infrastructure data (pipe locations, sizes, materials, ages, installation dates), support operations (valve isolation analysis, hydrant management, service connection records), enable maintenance planning (break history analysis, condition assessment tracking), support emergency response (rapid isolation analysis), integrate with hydraulic models (model calibration, scenario analysis), and support asset management (lifecycle cost analysis, capital planning). GIS is the foundation of modern distribution system management.",
  },
  {
    id: 21,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system SCADA system?",
    options: [
      "To control only pump stations",
      "To monitor and control distribution system operations remotely — including pump stations, storage tanks, pressure reducing valves, and water quality sensors — enabling real-time operational awareness and control",
      "To monitor only water quality",
      "To control only storage tanks"
    ],
    correctAnswer: 1,
    explanation: "SCADA (Supervisory Control and Data Acquisition) systems: monitor real-time system status (pressures, flows, tank levels, pump status), control remote equipment (start/stop pumps, open/close valves, adjust PRV setpoints), collect operational data for analysis and reporting, generate alarms for abnormal conditions, and enable remote operation reducing operator travel. SCADA systems must be secured against cyber threats (network segmentation, access controls, encryption, regular updates). SCADA data is essential for system optimization and emergency response.",
  },
  {
    id: 22,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system water loss audit?",
    options: [
      "To audit financial losses only",
      "To systematically quantify all water entering and leaving the distribution system to identify and quantify real losses (leakage) and apparent losses (meter error, unauthorized use), enabling targeted loss reduction strategies",
      "To audit customer meters only",
      "To audit pump efficiency only"
    ],
    correctAnswer: 1,
    explanation: "Water loss audits (AWWA M36 methodology): quantify system input volume (production), authorized consumption (billed and unbilled), real losses (leakage from pipes, tanks, service connections), and apparent losses (meter under-registration, data errors, unauthorized use). Water Balance: System Input = Authorized Consumption + Water Losses. Water Losses = Real Losses + Apparent Losses. Audits identify: where losses are occurring, their magnitude, and cost-effective reduction strategies. Annual audits are recommended; results guide capital investment in leak detection and meter replacement.",
  },
  {
    id: 23,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system cross-connection control program?",
    options: [
      "To prevent pipe crossings",
      "To identify and eliminate or protect cross-connections — actual or potential connections between the potable water system and any source of contamination — through backflow prevention device installation and testing",
      "To prevent pipe intersections",
      "To prevent pressure crossings between zones"
    ],
    correctAnswer: 1,
    explanation: "Cross-connection control programs: survey customer premises for cross-connections (irrigation systems, fire sprinkler systems, industrial processes, swimming pools), require installation of appropriate backflow prevention devices (air gaps, reduced pressure zone assemblies, double check valves), require annual testing of backflow preventers by certified testers, maintain records of all devices, and enforce compliance. Cross-connections can cause serious contamination events — backflow has caused illness and death. Programs are required by most state/provincial regulations.",
  },
  {
    id: 24,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system pipe lining program?",
    options: [
      "To replace old pipes",
      "To rehabilitate deteriorated pipes by applying an internal lining (cement mortar, epoxy, cured-in-place pipe) to restore hydraulic capacity, prevent corrosion, and extend pipe service life without full replacement",
      "To test pipe strength",
      "To install new pipes inside old ones"
    ],
    correctAnswer: 1,
    explanation: "Pipe lining programs rehabilitate deteriorated pipes: cement mortar lining — applied by centrifugal spinning, restores hydraulic capacity (C-factor), prevents corrosion, cost-effective for large-diameter mains; epoxy lining — applied by spraying, provides smooth surface, suitable for smaller pipes; cured-in-place pipe (CIPP) — flexible liner inserted and cured in place, structurally rehabilitates pipes without excavation. Lining is typically 30-50% of replacement cost. It is most appropriate for pipes with good structural condition but poor hydraulic condition or corrosion problems.",
  },
  {
    id: 25,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system valve exercising program?",
    options: [
      "To test valve strength",
      "To regularly operate all distribution valves to ensure operability, identify failed valves, and maintain the ability to isolate system sections for maintenance and emergency response",
      "To lubricate valves only",
      "To replace old valves"
    ],
    correctAnswer: 1,
    explanation: "Valve exercising programs: operate all distribution valves on a regular cycle (typically every 1-5 years), identify seized or failed valves requiring repair or replacement, maintain valve operability for emergency isolation, update valve records in GIS, and reduce the number of customers affected during main breaks. Programs should: prioritize critical valves (transmission mains, large diameter), track valve condition and repair history, and document results. Valve failure during emergencies can significantly increase the impact of main breaks.",
  },
  {
    id: 26,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system hydrant flow test?",
    options: [
      "To test hydrant paint quality",
      "To measure available fire flow at specific locations — the flow rate that can be delivered while maintaining a minimum residual pressure (typically 20 psi) — used for fire protection planning and hydraulic model calibration",
      "To test hydrant valve operation only",
      "To flush distribution mains"
    ],
    correctAnswer: 1,
    explanation: "Hydrant flow tests measure: static pressure (no flow), residual pressure (during flow from a nearby hydrant), and pitot pressure (to calculate flow from the flowing hydrant). Available fire flow is calculated using the formula: Q_available = Q_test × [(P_static - 20) / (P_static - P_residual)]^0.54. Results are used for: fire protection planning (verifying adequate fire flow), hydraulic model calibration (C-factor determination), and identifying system deficiencies. Tests should be conducted at representative locations throughout the system.",
    isCalc: true,
  },
  {
    id: 27,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system meter replacement program?",
    options: [
      "To replace meters that are visually damaged",
      "To systematically replace aging customer meters before they fail or become significantly inaccurate, reducing apparent water losses and maintaining billing accuracy",
      "To replace meters that customers complain about",
      "To replace meters only when they stop working"
    ],
    correctAnswer: 1,
    explanation: "Meter replacement programs: replace aging meters before accuracy degrades significantly (meters typically under-register by 1-5% per decade of age), reduce apparent water losses (under-registration is a major component of apparent losses), maintain billing accuracy and revenue, and upgrade to advanced metering infrastructure (AMI) for remote reading and leak detection. Cost-benefit analysis: compare revenue recovery from improved accuracy against meter replacement cost. Meters should be tested periodically; replacement is typically cost-effective when accuracy falls below 98-99%.",
  },
  {
    id: 28,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system nitrification control program?",
    options: [
      "To control nitrogen in source water",
      "To prevent and manage nitrification — the microbial oxidation of ammonia to nitrite and nitrate — in chloraminated distribution systems, which depletes chloramine residual and promotes microbial growth",
      "To control nitrate in drinking water",
      "To control nitrogen in wastewater"
    ],
    correctAnswer: 1,
    explanation: "Nitrification in chloraminated systems: ammonia-oxidizing bacteria (AOB) oxidize free ammonia (from chloramine decomposition) to nitrite, which further oxidizes to nitrate. Nitrification depletes chloramine residual, promotes microbial growth, and can cause taste/odor problems. Control strategies: maintain adequate chloramine residual (>1 mg/L), optimize chlorine-to-ammonia ratio (3:1 to 5:1 by weight), minimize water age, increase system flushing, boost chloramine residual at strategic points, and temporarily switch to free chlorine (breakpoint chlorination) to eliminate nitrifying bacteria.",
  },
  {
    id: 29,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system lead service line replacement program?",
    options: [
      "To replace all old pipes",
      "To systematically identify and replace lead service lines — the portion of the service connection from the water main to the building — to reduce lead exposure at customer taps, as required by the Lead and Copper Rule",
      "To replace lead solder in buildings",
      "To replace lead valves"
    ],
    correctAnswer: 1,
    explanation: "Lead service line replacement programs: inventory all service lines to identify lead service lines (LSLs), prioritize replacement based on risk (high-lead tap samples, vulnerable populations — children, pregnant women), replace full service lines (both utility and customer portions), provide filters and public education during replacement, and verify effectiveness through post-replacement tap sampling. The revised Lead and Copper Rule (LCRR) requires utilities to: complete LSL inventories, replace LSLs within 10 years if action level is exceeded, and notify customers with LSLs.",
  },
  {
    id: 30,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system emergency response plan (ERP)?",
    options: [
      "To respond to customer complaints",
      "To document procedures for responding to emergencies that could disrupt water service or compromise water quality, including roles and responsibilities, notification procedures, and recovery actions",
      "To respond to employee emergencies only",
      "To respond to financial emergencies only"
    ],
    correctAnswer: 1,
    explanation: "Emergency Response Plans (ERPs) are required by AWIA for systems serving >3,300 people. ERPs must address: natural hazards (floods, earthquakes, drought), malevolent acts (contamination, physical attack, cyber attack), and technological failures (power outages, equipment failures, main breaks). ERPs must include: roles and responsibilities, notification procedures (regulators, customers, media), resource requirements, mutual aid contacts, and recovery procedures. ERPs must be updated every 5 years and exercised regularly through tabletop exercises and drills.",
  },
  {
    id: 31,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system water quality complaint tracking system?",
    options: [
      "To track customer billing complaints",
      "To systematically record, investigate, and resolve customer water quality complaints — providing early warning of water quality problems, identifying problem areas, and demonstrating regulatory compliance",
      "To track employee complaints",
      "To track regulatory complaints"
    ],
    correctAnswer: 1,
    explanation: "Water quality complaint tracking systems: record all complaints (date, location, nature of complaint), investigate causes (field sampling, pressure testing, flushing), resolve issues (flushing, main repair, treatment adjustment), track trends (identify recurring problems, seasonal patterns), and demonstrate regulatory compliance (response to complaints is required by some regulations). Complaint data should be mapped in GIS to identify geographic patterns. Clusters of complaints may indicate: main breaks, cross-connections, treatment problems, or distribution system deterioration.",
  },
  {
    id: 32,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system surge analysis?",
    options: [
      "To analyze electrical surges",
      "To evaluate transient pressure waves (water hammer) caused by rapid flow changes — pump starts/stops, valve operations, main breaks — and design surge protection to prevent pipe damage and contamination",
      "To analyze demand surges",
      "To analyze pressure zone surges"
    ],
    correctAnswer: 1,
    explanation: "Surge analysis evaluates transient pressures (water hammer) caused by: rapid pump starts/stops, quick valve closures, main breaks, and power failures. Transient pressures can: exceed pipe pressure ratings (causing breaks), create negative pressures (causing pipe collapse or contamination intrusion), and damage equipment. Surge protection measures: surge tanks (air vessels), surge anticipating valves, slow-closing valves, variable speed drives (for gradual pump speed changes), and flywheel inertia. Surge analysis is essential for: transmission main design, pump station design, and investigating unexplained main breaks.",
  },
  {
    id: 33,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system chlorine residual monitoring program?",
    options: [
      "To monitor chlorine at the treatment plant only",
      "To verify that adequate disinfectant residual is maintained throughout the distribution system to prevent microbial regrowth and protect public health",
      "To monitor chlorine at storage tanks only",
      "To monitor chlorine at pump stations only"
    ],
    correctAnswer: 1,
    explanation: "Chlorine residual monitoring programs: verify compliance with regulatory requirements (minimum 0.2 mg/L free chlorine or 0.5 mg/L total chlorine at the point of entry, detectable residual throughout the system), identify low-residual areas (requiring flushing or booster disinfection), detect water quality deterioration (sudden residual loss may indicate contamination or main break), and optimize disinfection (minimize DBP formation while maintaining adequate residual). Monitoring should cover: entry points, storage facilities, extremities, dead-ends, and high water age areas.",
  },
  {
    id: 34,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system pressure transient monitoring program?",
    options: [
      "To monitor normal operating pressures only",
      "To detect and characterize transient pressure events (water hammer) in the distribution system, which can cause pipe breaks, contamination intrusion, and equipment damage",
      "To monitor pressure at customer taps only",
      "To monitor pressure at storage tanks only"
    ],
    correctAnswer: 1,
    explanation: "Pressure transient monitoring programs: install high-frequency pressure loggers at strategic locations, detect transient events (pressure spikes and drops), characterize event magnitude and frequency, identify causes (pump operations, valve closures, main breaks), and evaluate the need for surge protection. Transient monitoring has revealed that many distribution systems experience frequent transient events that can cause: pipe fatigue and breaks, contamination intrusion through pipe defects, and equipment damage. Results inform surge protection design and operational procedure improvements.",
  },
  {
    id: 35,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system pipe material selection policy?",
    options: [
      "To select the cheapest pipe material",
      "To specify appropriate pipe materials for different applications based on: pressure rating, corrosion resistance, soil conditions, installation requirements, hydraulic performance, and lifecycle cost",
      "To select the strongest pipe material",
      "To select the lightest pipe material"
    ],
    correctAnswer: 1,
    explanation: "Pipe material selection considers: pressure rating (must exceed maximum operating pressure with safety factor), corrosion resistance (internal and external, based on water chemistry and soil conditions), soil conditions (expansive soils, rocky soils, high groundwater), installation requirements (trenchless installation, directional drilling), hydraulic performance (C-factor, roughness), and lifecycle cost (initial cost + maintenance + replacement). Common materials: PVC (C=150, corrosion-resistant, lower cost, limited sizes), ductile iron (C=130, strong, available in large sizes, requires corrosion protection), HDPE (flexible, corrosion-resistant, suitable for trenchless installation).",
  },
  {
    id: 36,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system pressure testing program for new mains?",
    options: [
      "To test pipe material strength",
      "To verify the integrity of newly installed mains before they are placed in service — detecting leaks, joint failures, and installation defects — typically at 1.5 times maximum operating pressure for 2 hours",
      "To test valve operation",
      "To test hydrant operation"
    ],
    correctAnswer: 1,
    explanation: "Pressure testing of new mains (AWWA C600/C605): test pressure = 1.5 × maximum operating pressure (minimum 150 psi for distribution mains), test duration = 2 hours minimum, allowable leakage = calculated based on pipe diameter and length (AWWA formula: L = SD√P / 133,200, where L = allowable leakage in gph, S = pipe length in feet, D = pipe diameter in inches, P = test pressure in psi). Testing detects: defective pipe joints, damaged pipe sections, improper installation, and faulty fittings. All new mains must be pressure tested and disinfected before being placed in service.",
    isCalc: true,
  },
  {
    id: 37,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system service connection management program?",
    options: [
      "To manage customer billing only",
      "To maintain accurate records of all service connections, manage service connection installation and repair, and ensure proper backflow prevention — service connections are a major source of leakage and cross-connections",
      "To manage meter reading only",
      "To manage customer complaints only"
    ],
    correctAnswer: 1,
    explanation: "Service connection management programs: maintain accurate records (location, size, material, age, meter information), manage installation and repair (proper materials, installation standards), ensure backflow prevention (appropriate device for hazard level), detect and repair leaks (service connections are a major source of real losses — often 20-30% of total leakage), and manage lead service line inventory and replacement. Service connections include: corporation stop (at main), service line (from main to meter), meter, and curb stop. Accurate service connection records are essential for water loss management and emergency response.",
  },
  {
    id: 38,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system booster chlorination program?",
    options: [
      "To add chlorine at the treatment plant only",
      "To add disinfectant at strategic points within the distribution system to maintain adequate residuals in areas where residual has decayed due to long travel times, high water age, or high chlorine demand",
      "To add chlorine only at storage tanks",
      "To add chlorine only at pump stations"
    ],
    correctAnswer: 1,
    explanation: "Booster chlorination programs: identify locations where chlorine residual falls below regulatory minimums or desired levels (typically >0.2 mg/L free chlorine), install booster disinfection facilities (chlorine injection systems, UV systems), optimize dosing to maintain target residuals without excessive DBP formation, and monitor effectiveness. Booster locations are typically: remote areas of the system, areas with high water age, downstream of storage facilities, and areas with high chlorine demand. Booster chlorination is more effective than increasing treatment plant dose, which increases DBP formation throughout the system.",
  },
  // ─── MODULE 2: Equipment Installation, O&M & Repair (40 questions) ──────────
  {
    id: 39,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump curve and how is it used in distribution system operations?",
    options: [
      "To show pump age",
      "To graphically represent the relationship between pump flow rate and head (pressure) — used to select appropriate pumps, determine operating points, and diagnose pump performance problems",
      "To show pump maintenance schedule",
      "To show pump energy consumption only"
    ],
    correctAnswer: 1,
    explanation: "Pump curves (H-Q curves) show: head (pressure) vs. flow rate for a specific pump at a given speed. The system curve shows: total head required vs. flow rate for the piping system. The operating point is where pump curve intersects system curve. Uses: pump selection (choose pump whose curve intersects system curve at desired operating point), performance monitoring (compare actual vs. design curve to detect wear), variable speed drive optimization (adjusting speed shifts pump curve), and parallel/series pump analysis (combined curves for multiple pumps). Pump efficiency curves (BEP — best efficiency point) are also critical for energy optimization.",
  },
  {
    id: 40,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump affinity law and how is it applied?",
    options: [
      "To calculate pump maintenance costs",
      "To predict how pump performance (flow, head, power) changes when pump speed changes — Q₂/Q₁ = N₂/N₁; H₂/H₁ = (N₂/N₁)²; P₂/P₁ = (N₂/N₁)³",
      "To calculate pump installation costs",
      "To predict pump failure"
    ],
    correctAnswer: 1,
    explanation: "Pump affinity laws: Flow (Q) is proportional to speed (N): Q₂ = Q₁ × (N₂/N₁). Head (H) is proportional to speed squared: H₂ = H₁ × (N₂/N₁)². Power (P) is proportional to speed cubed: P₂ = P₁ × (N₂/N₁)³. Applications: Variable speed drives (VSDs) — reducing pump speed by 20% reduces power by 49% (0.8³ = 0.51), providing significant energy savings. Impeller trimming — reducing impeller diameter has similar effects to reducing speed. Affinity laws are approximate and most accurate near the best efficiency point (BEP).",
    isCalc: true,
  },
  {
    id: 41,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump vibration analysis program?",
    options: [
      "To measure pump noise only",
      "To detect and diagnose mechanical problems in pumps and motors — including imbalance, misalignment, bearing wear, cavitation, and resonance — before they cause catastrophic failure",
      "To measure pump speed only",
      "To measure pump temperature only"
    ],
    correctAnswer: 1,
    explanation: "Pump vibration analysis: measures vibration amplitude and frequency at multiple points (bearing housings, pump casing, motor). Vibration signatures indicate: imbalance (vibration at 1× running speed), misalignment (vibration at 1× and 2× running speed), bearing wear (high-frequency vibration), cavitation (broadband high-frequency vibration), and resonance (vibration at natural frequency). Trending vibration data over time detects deterioration before failure. ISO 10816 provides vibration severity criteria. Vibration analysis is a key component of predictive maintenance programs, enabling planned repairs before failures occur.",
  },
  {
    id: 42,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump efficiency testing program?",
    options: [
      "To test pump speed only",
      "To measure actual pump efficiency and compare to design efficiency — identifying pumps that have degraded due to wear, impeller damage, or seal leakage — enabling targeted maintenance or replacement to reduce energy costs",
      "To test pump flow rate only",
      "To test pump pressure only"
    ],
    correctAnswer: 1,
    explanation: "Pump efficiency testing: measures flow rate (using flow meter or ultrasonic meter), head (using pressure gauges), and power input (using power meter). Wire-to-water efficiency = (Flow × Head × specific weight of water) / Power input. Comparing actual to design efficiency: identifies degraded pumps (worn impellers, excessive clearances, seal leakage), quantifies energy waste, and prioritizes maintenance or replacement. A 10% efficiency reduction on a large pump can cost thousands of dollars per year in excess energy. Efficiency testing is typically done annually for major pumps.",
    isCalc: true,
  },
  {
    id: 43,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pressure reducing valve (PRV) maintenance program?",
    options: [
      "To replace PRVs regularly",
      "To ensure PRVs are operating correctly — maintaining set downstream pressure, not leaking through when closed, and responding properly to flow changes — through regular inspection, testing, and maintenance",
      "To test PRV pressure ratings only",
      "To test PRV installation quality only"
    ],
    correctAnswer: 1,
    explanation: "PRV maintenance programs: inspect PRVs regularly (quarterly to annually depending on criticality), verify downstream pressure is at setpoint, check for leakage through (PRV not fully closing), inspect pilot valves and strainers (clean or replace as needed), check diaphragms and seals (replace if worn), verify PRV responds properly to flow changes, and document maintenance history. PRV failures can cause: downstream pressure too high (pipe breaks, customer damage), downstream pressure too low (inadequate service), or PRV stuck open (pressure zone integrity loss). Critical PRVs should have bypass valves for maintenance.",
  },
  {
    id: 44,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a variable speed drive (VSD) in a pump station?",
    options: [
      "To protect the pump from overload only",
      "To vary pump speed to match system demand — maintaining constant pressure or flow while reducing energy consumption during low-demand periods, and providing soft starts to reduce water hammer",
      "To increase pump speed only",
      "To reduce pump speed only"
    ],
    correctAnswer: 1,
    explanation: "Variable speed drives (VSDs/VFDs): vary pump speed to match system demand, maintaining constant pressure (pressure control mode) or constant flow (flow control mode). Benefits: energy savings (power ∝ speed³ — reducing speed by 20% reduces power by ~49%), reduced water hammer (gradual speed changes vs. abrupt starts/stops), extended pump life (reduced mechanical stress), and improved pressure control. VSDs are most beneficial for: high-head systems, systems with variable demand, and systems where pressure control is critical. VSD payback periods are typically 2-5 years for large pumps.",
  },
  {
    id: 45,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a storage tank inspection program?",
    options: [
      "To inspect tank paint only",
      "To assess the structural and coating condition of storage tanks — detecting corrosion, coating failures, structural defects, and water quality problems — to prioritize maintenance and rehabilitation",
      "To inspect tank capacity only",
      "To inspect tank level controls only"
    ],
    correctAnswer: 1,
    explanation: "Storage tank inspection programs: inspect exterior (coating condition, structural condition, vents, overflow, access hatches), inspect interior (coating condition, sediment accumulation, structural condition, cathodic protection), sample water quality (turbidity, chlorine residual, coliform), and inspect appurtenances (level controls, pressure gauges, overflow pipes, vents). AWWA D100/D102/D103 provide inspection standards. Interior inspections require confined space entry procedures. Inspection frequency: exterior annually, interior every 3-5 years. Findings guide: coating rehabilitation, structural repairs, cleaning, and cathodic protection maintenance.",
  },
  {
    id: 46,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution main repair procedure?",
    options: [
      "To replace damaged mains only",
      "To restore service quickly and safely following a main break while minimizing contamination risk, property damage, and service disruption — including isolation, excavation, repair, disinfection, pressure testing, and return to service",
      "To document main breaks only",
      "To notify customers only"
    ],
    correctAnswer: 1,
    explanation: "Main repair procedures: isolate the break (close valves to minimize affected area), notify customers and emergency services, excavate safely (call before you dig, shoring requirements), dewater the excavation, make the repair (clamp, coupling, or pipe replacement), flush the repaired section, disinfect (chlorine solution per AWWA C651), pressure test, collect bacteriological samples, and return to service after satisfactory sample results. Documentation: location, date, pipe material/size/age, cause of break, repair method, and time to restore service. All main breaks should be tracked in GIS for trend analysis.",
  },
  {
    id: 47,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a hydrant maintenance program?",
    options: [
      "To paint hydrants regularly",
      "To ensure fire hydrants are operable, properly maintained, and accessible — through regular inspection, lubrication, flushing, and repair — so they are available for fire suppression and system flushing",
      "To test hydrant flow rates only",
      "To replace old hydrants only"
    ],
    correctAnswer: 1,
    explanation: "Hydrant maintenance programs: inspect all hydrants annually (check for damage, proper drainage, accessibility), operate hydrants (open and close fully to verify operability), lubricate operating nuts and caps, flush hydrants (remove sediment, verify flow), paint hydrants (color-coding for flow capacity), repair or replace defective hydrants, and document maintenance history in GIS. NFPA 291 provides hydrant color-coding standards: Class AA (>1500 gpm) — light blue; Class A (1000-1499 gpm) — green; Class B (500-999 gpm) — orange; Class C (<500 gpm) — red. Hydrant maintenance is critical for fire protection.",
  },
  {
    id: 48,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a service connection leak detection program?",
    options: [
      "To detect leaks in customer plumbing only",
      "To systematically detect leaks in service connections — the portion of the system from the main to the meter — which can account for 20-30% of total system leakage and are often not visible at the surface",
      "To detect leaks in distribution mains only",
      "To detect leaks in storage tanks only"
    ],
    correctAnswer: 1,
    explanation: "Service connection leak detection: uses acoustic methods (listening rods, ground microphones, correlators) to detect leaks in service lines from main to meter. Service connection leaks: are often not visible at the surface (water percolates into soil), can be significant in aggregate (many small leaks), and are often found in older lead or galvanized service lines. Detection methods: step testing (measuring flow at successive points to isolate leak location), acoustic listening (detecting leak noise), and correlators (cross-correlating noise signals from two points to locate leak). Service connection leaks should be repaired promptly.",
  },
  {
    id: 49,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pipe tapping procedure?",
    options: [
      "To test pipe strength",
      "To make a connection to an existing pressurized main without shutting off service — using a tapping sleeve and valve — enabling new service connections or main extensions without service interruption",
      "To repair pipe leaks",
      "To test pipe material"
    ],
    correctAnswer: 1,
    explanation: "Pipe tapping procedures: install tapping sleeve (wraps around existing main), install tapping valve (gate or ball valve), use tapping machine to drill through pipe wall under pressure, withdraw tapping machine, and close tapping valve. Tapping allows: new service connections, main extensions, and installation of valves or hydrants without shutting off service. Key considerations: tapping sleeve must be rated for main pressure, tapping machine must be rated for pipe material and size, tap location must avoid joints and fittings, and proper disinfection procedures must be followed. Wet tapping requires trained operators and proper equipment.",
  },
  {
    id: 50,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system valve installation procedure?",
    options: [
      "To replace all old valves",
      "To ensure valves are installed correctly — at proper depth, with proper thrust restraint, in the correct orientation, with proper joint connections — so they operate reliably and can be located and operated during emergencies",
      "To test valve pressure ratings",
      "To document valve locations only"
    ],
    correctAnswer: 1,
    explanation: "Valve installation procedures: install at proper depth (below frost line, typically 5-8 feet), ensure proper thrust restraint (thrust blocks or mechanical restraints at bends, tees, and dead-ends), install in correct orientation (gate valves — stem vertical; butterfly valves — stem horizontal), make proper joint connections (push-on, mechanical joint, or flanged), install valve box (for access), record location in GIS, and operate valve to verify full open and close. Valve spacing: typically every 500-1000 feet on distribution mains, at all intersections. Proper installation ensures valves can be located and operated during emergencies.",
  },
  {
    id: 51,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system thrust restraint design?",
    options: [
      "To prevent pipe movement due to water hammer only",
      "To resist the unbalanced hydraulic forces at pipe fittings (bends, tees, reducers, dead-ends) that would otherwise push fittings apart — using thrust blocks or mechanical restraints",
      "To prevent pipe movement due to soil settlement only",
      "To prevent pipe movement due to temperature changes only"
    ],
    correctAnswer: 1,
    explanation: "Thrust forces occur at: bends (direction changes), tees (branch connections), reducers (diameter changes), and dead-ends (caps, plugs). Thrust = Pressure × Area × (1 - cos θ) for bends, where θ is the deflection angle. Thrust restraint methods: concrete thrust blocks (bearing against undisturbed soil — most common for large pipes), mechanical restraints (harness joints, restrained joints — used where thrust blocks are impractical), and tie rods (connecting fittings to adjacent pipe). Thrust block design: block area = Thrust / Soil bearing capacity. Inadequate thrust restraint causes: joint separation, pipe movement, and main breaks.",
    isCalc: true,
  },
  {
    id: 52,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pipe bedding and backfill procedure?",
    options: [
      "To save excavation costs",
      "To provide proper support for buried pipes — preventing differential settlement, protecting pipe from point loads, and ensuring long-term structural integrity — using specified bedding and backfill materials and compaction",
      "To speed up installation",
      "To reduce pipe costs"
    ],
    correctAnswer: 1,
    explanation: "Pipe bedding and backfill procedures: bedding zone (below and around pipe) — granular material (sand, crushed stone) compacted to provide uniform support; initial backfill (above pipe to 12 inches) — granular material carefully placed and compacted to avoid pipe damage; final backfill (above initial backfill) — native material or specified fill, compacted to required density. Compaction requirements: typically 95% Standard Proctor density in traffic areas. Proper bedding prevents: differential settlement (causing joint separation), point loads (causing pipe cracking), and pipe flotation in high groundwater areas.",
  },
  {
    id: 53,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pipe disinfection procedure?",
    options: [
      "To test pipe strength",
      "To disinfect newly installed or repaired mains before placing them in service — killing bacteria introduced during construction — using chlorine solution per AWWA C651 (minimum 25 mg/L for 24 hours, or 50 mg/L for 3 hours)",
      "To clean pipe interior only",
      "To test pipe water quality only"
    ],
    correctAnswer: 1,
    explanation: "Pipe disinfection (AWWA C651): fill new main with chlorinated water (minimum 25 mg/L free chlorine for 24 hours, or 50 mg/L for 3 hours), verify chlorine residual at end of contact time (minimum 10 mg/L remaining), flush disinfection water to waste (dechlorinate before disposal), collect bacteriological samples (total coliform — must be absent in 2 consecutive samples taken 24 hours apart), and place in service after satisfactory results. Disinfection is required for: new mains, repaired mains (after breaks), and mains returned to service after extended shutdown. Proper disinfection prevents waterborne disease outbreaks.",
  },
  {
    id: 54,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system air valve maintenance program?",
    options: [
      "To maintain air quality in pump stations",
      "To ensure air release/vacuum break valves are operating correctly — releasing air during filling and admitting air during draining — preventing air binding and vacuum conditions that can cause pipe collapse or contamination intrusion",
      "To maintain air compressors",
      "To maintain air quality in storage tanks"
    ],
    correctAnswer: 1,
    explanation: "Air valve types: air release valves (ARVs) — release air during normal operation at high points; air/vacuum valves (AVVs) — admit large volumes of air during pipe draining to prevent vacuum; combination air valves (CAVs) — perform both functions. Maintenance: inspect and operate valves regularly, clean float and orifice (sediment can prevent proper operation), replace worn seals and floats, verify proper operation (air release during filling, vacuum break during draining). Air valve failures can cause: air binding (reducing flow capacity), vacuum conditions (pipe collapse, contamination intrusion), and water hammer (when air pockets are suddenly expelled).",
  },
  {
    id: 55,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system meter testing and calibration program?",
    options: [
      "To replace meters regularly",
      "To verify meter accuracy by testing meters against a known standard — identifying meters that under-register (causing revenue loss) or over-register (causing customer billing disputes) — and calibrating or replacing inaccurate meters",
      "To read meters remotely",
      "To install new meters"
    ],
    correctAnswer: 1,
    explanation: "Meter testing programs: test meters at multiple flow rates (low flow — 1/4 GPM, intermediate — 1 GPM, high flow — maximum rated flow), compare to known standard (certified test bench), calculate accuracy at each flow rate, and determine if meter is within acceptable accuracy range (typically ±2% at all flow rates). Meters that under-register: cause revenue loss (most common — meters wear over time and under-register at low flows). Meters that over-register: cause customer billing disputes (rare). Testing frequency: based on meter age, size, and type. Positive displacement meters: test every 5-10 years; turbine meters: test every 2-5 years.",
  },
  {
    id: 56,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pump station standby power system?",
    options: [
      "To reduce electricity costs",
      "To maintain pump station operations during power outages — using diesel generators, natural gas generators, or battery backup systems — ensuring continued water service during emergencies",
      "To reduce peak demand charges only",
      "To provide backup lighting only"
    ],
    correctAnswer: 1,
    explanation: "Standby power systems for pump stations: diesel generators (most common — reliable, long runtime, but require fuel storage and maintenance), natural gas generators (no fuel storage, but dependent on gas supply), battery/UPS systems (for short outages and to bridge time until generator starts), and automatic transfer switches (ATS — automatically switch to standby power when utility power fails). Sizing: generator must power all critical loads (pumps, controls, lighting, HVAC). Testing: run generators monthly under load, annual full load test. Fuel: maintain adequate fuel supply (minimum 72 hours at full load).",
  },
  {
    id: 57,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system chemical feed system maintenance program?",
    options: [
      "To maintain chemical inventory only",
      "To ensure chemical feed systems (chlorine, fluoride, corrosion inhibitor) are operating correctly — maintaining accurate dosing, preventing leaks, and ensuring safe operation — through regular inspection, calibration, and maintenance",
      "To maintain chemical quality only",
      "To maintain chemical storage only"
    ],
    correctAnswer: 1,
    explanation: "Chemical feed system maintenance: inspect and calibrate chemical metering pumps (verify output at multiple settings), inspect chemical storage tanks and containment, check chemical feed lines for leaks and blockages, verify chemical quality (test concentration, check expiration dates), inspect safety equipment (PPE, emergency eyewash, ventilation), and document maintenance. Calibration: collect pump output over a timed period, calculate actual output vs. setpoint, adjust as needed. Chemical feed accuracy is critical: under-dosing (inadequate disinfection or corrosion control), over-dosing (regulatory violations, taste/odor, chemical costs).",
  },
  {
    id: 58,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system SCADA maintenance program?",
    options: [
      "To maintain SCADA software only",
      "To ensure SCADA hardware and software are operating reliably — through regular inspection, testing, calibration of sensors and transmitters, software updates, and cybersecurity measures — maintaining operational awareness and control",
      "To maintain SCADA communications only",
      "To maintain SCADA databases only"
    ],
    correctAnswer: 1,
    explanation: "SCADA maintenance programs: inspect and test field instruments (pressure transmitters, flow meters, level sensors, water quality analyzers) — calibrate against known standards, replace worn sensors; maintain communications (radio, cellular, fiber — test signal strength, replace failed equipment); maintain control hardware (PLCs, RTUs — test I/O, update firmware); maintain software (patch operating systems, update SCADA software, backup databases); and maintain cybersecurity (access controls, network segmentation, intrusion detection). SCADA failures can leave operators blind to system conditions during emergencies.",
  },
  {
    id: 59,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pipe condition assessment using acoustic leak detection?",
    options: [
      "To detect pipe corrosion only",
      "To detect and locate leaks in distribution mains by listening for the characteristic sound of water escaping under pressure — using listening rods, ground microphones, and acoustic correlators",
      "To detect pipe age only",
      "To detect pipe material only"
    ],
    correctAnswer: 1,
    explanation: "Acoustic leak detection methods: listening rods (contact with valves, hydrants, or pipe) — detect leak noise by direct contact; ground microphones (placed on ground surface) — detect leak noise transmitted through soil; acoustic correlators — place sensors at two points, cross-correlate signals to calculate leak location (distance from sensor = total distance × time difference × wave speed / 2). Leak noise characteristics: frequency depends on pipe material (plastic pipes transmit lower frequencies than metal pipes), pressure (higher pressure = louder noise), and leak size. Correlators are most effective on metallic pipes; plastic pipes require specialized equipment.",
  },
  {
    id: 60,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pipe condition assessment using pipe sampling?",
    options: [
      "To test water quality in pipes",
      "To physically remove pipe samples for laboratory analysis — measuring wall thickness, corrosion depth, tuberculation, and material properties — to assess remaining service life and inform rehabilitation or replacement decisions",
      "To test pipe installation quality",
      "To test pipe joint integrity"
    ],
    correctAnswer: 1,
    explanation: "Pipe sampling programs: remove pipe sections (typically 12-24 inch samples) from representative locations during main breaks or planned excavations, conduct laboratory analysis (wall thickness measurement, corrosion pit depth, tensile strength testing, microstructure analysis), calculate remaining wall thickness and estimated remaining service life, and use results to calibrate deterioration models. Pipe sampling provides: direct evidence of pipe condition, validation of non-destructive assessment methods, and data for replacement prioritization. Results should be documented in GIS with pipe age, material, soil conditions, and break history.",
  },
  {
    id: 61,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system electromagnetic pipe inspection?",
    options: [
      "To detect plastic pipe defects",
      "To detect and characterize defects in metallic pipes (cast iron, ductile iron, steel) — including corrosion pits, cracks, and wall thickness loss — using electromagnetic techniques such as magnetic flux leakage (MFL)",
      "To detect pipe age only",
      "To detect pipe material only"
    ],
    correctAnswer: 1,
    explanation: "Electromagnetic pipe inspection techniques: Magnetic Flux Leakage (MFL) — magnetizes the pipe wall; defects cause flux to leak out, detected by sensors; measures wall thickness loss and pit depth. Remote Field Testing (RFT) — uses electromagnetic coils; effective for detecting corrosion in ferromagnetic pipes. Guided Wave Ultrasonic Testing (GWUT) — sends ultrasonic waves along the pipe; reflections from defects are detected. These techniques can be deployed through: internal inspection tools (pigs), external scanning, and in-line inspection. Results: quantify remaining wall thickness, identify high-risk pipe sections, and prioritize rehabilitation or replacement.",
  },
  {
    id: 62,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system trenchless pipe rehabilitation program?",
    options: [
      "To replace pipes without excavation",
      "To rehabilitate deteriorated pipes using trenchless methods — cured-in-place pipe (CIPP), pipe bursting, slip lining — that minimize surface disruption, reduce costs, and maintain service continuity compared to open-cut replacement",
      "To install new pipes without excavation",
      "To detect leaks without excavation"
    ],
    correctAnswer: 1,
    explanation: "Trenchless pipe rehabilitation methods: Cured-in-Place Pipe (CIPP) — flexible liner inserted and cured in place, structurally rehabilitates pipe, reduces diameter slightly; Pipe Bursting — bursting head fractures old pipe outward while pulling new pipe through, maintains or increases diameter; Slip Lining — new pipe inserted inside old pipe, reduces diameter significantly; Spray Lining — cement mortar or epoxy sprayed on interior, improves hydraulics and prevents corrosion. Benefits over open-cut: reduced surface disruption (traffic, landscaping), lower cost in urban areas, faster installation, and maintained service continuity. Trenchless methods require: pipe cleaning, CCTV inspection, and access pits.",
  },
  {
    id: 63,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pump impeller trimming?",
    options: [
      "To repair damaged impellers",
      "To reduce pump head and flow by machining the impeller to a smaller diameter — shifting the pump curve downward to match system requirements — without replacing the pump",
      "To increase pump efficiency",
      "To balance pump impellers"
    ],
    correctAnswer: 1,
    explanation: "Impeller trimming: reduces impeller diameter to shift pump curve downward (lower head and flow). Affinity laws for impeller trimming: Q₂/Q₁ ≈ D₂/D₁; H₂/H₁ ≈ (D₂/D₁)²; P₂/P₁ ≈ (D₂/D₁)³. Applications: when a pump is oversized for current system conditions (delivering too much head or flow), impeller trimming reduces energy consumption and avoids operating far from BEP. Limitations: trimming is permanent (cannot be reversed), excessive trimming reduces efficiency, and trimming is most effective when the required reduction is less than 20%. Trimming is an alternative to throttling (which wastes energy across a control valve).",
    isCalc: true,
  },
  {
    id: 64,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pressure zone boundary valve management?",
    options: [
      "To manage valves at system boundaries only",
      "To maintain the integrity of pressure zone boundaries by ensuring boundary valves are properly closed, regularly inspected, and monitored — preventing uncontrolled pressure transfer between zones that could damage pipes or reduce service pressure",
      "To manage valves at treatment plant boundaries",
      "To manage valves at property boundaries"
    ],
    correctAnswer: 1,
    explanation: "Pressure zone boundary valve management: identify all boundary valves (valves that separate pressure zones), verify they are properly closed (leaking boundary valves allow high-pressure water into low-pressure zones, potentially causing breaks), inspect regularly (at least annually), monitor downstream pressure for signs of boundary valve leakage, and maintain records in GIS. Boundary valve failures can cause: pipe breaks in low-pressure zones (from excessive pressure), customer damage (from pressure surges), and pressure zone integrity loss (making pressure management impossible). Critical boundary valves should have pressure monitoring on both sides.",
  },
  {
    id: 65,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system storage tank turnover optimization?",
    options: [
      "To maximize storage tank capacity",
      "To ensure storage tanks are regularly cycled (filled and drawn down) to minimize water age, maintain disinfectant residuals, prevent sediment accumulation, and maintain water quality",
      "To minimize storage tank capacity",
      "To maximize storage tank pressure"
    ],
    correctAnswer: 1,
    explanation: "Storage tank turnover optimization: tanks should cycle daily (fill during low-demand periods, draw down during high-demand periods) to minimize water age. Strategies: adjust pump setpoints (lower turn-on and turn-off levels to increase cycling), use time-of-day controls (pump during off-peak hours, draw down during peak hours), install mixing systems (to prevent thermal stratification and short-circuiting), and flush tanks periodically (to remove sediment). Target turnover: complete volume exchange every 3-7 days. Poor turnover causes: high water age, chlorine residual loss, DBP formation, taste/odor complaints, and sediment accumulation.",
  },
  {
    id: 66,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system backflow preventer testing program?",
    options: [
      "To test backflow preventer installation quality only",
      "To verify that backflow prevention devices are functioning correctly — providing adequate protection against backflow — through annual testing by certified testers, with repair or replacement of failed devices",
      "To test backflow preventer age only",
      "To test backflow preventer material only"
    ],
    correctAnswer: 1,
    explanation: "Backflow preventer testing programs: require annual testing of all testable backflow prevention devices (RPZAs, double check valves, pressure vacuum breakers) by certified testers, maintain records of all devices and test results, require prompt repair or replacement of failed devices, and enforce compliance. Testing verifies: check valves open at proper differential pressure, check valves seat properly (no leakage), relief valve opens at proper differential pressure (for RPZAs), and air inlet opens properly (for PVBs). Failed backflow preventers provide no protection against contamination. Most regulations require annual testing; high-hazard applications may require more frequent testing.",
  },
  {
    id: 67,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pipe joint inspection program?",
    options: [
      "To inspect pipe joint paint only",
      "To identify deteriorated or leaking pipe joints — including push-on joints, mechanical joints, and flanged joints — that are sources of leakage or potential contamination pathways",
      "To inspect pipe joint age only",
      "To inspect pipe joint material only"
    ],
    correctAnswer: 1,
    explanation: "Pipe joint inspection: push-on joints (rubber gasket seal — can fail due to gasket deterioration, root intrusion, or joint deflection exceeding limits), mechanical joints (bolted gland with rubber gasket — can fail due to bolt corrosion or gasket deterioration), flanged joints (bolted with gasket — can fail due to bolt corrosion or gasket failure), and restrained joints (prevent joint separation under thrust). Inspection methods: acoustic leak detection (detect leaking joints), CCTV inspection (detect root intrusion, joint offsets), and excavation (direct inspection). Joint failures are a major source of distribution system leakage.",
  },
  {
    id: 68,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pump station wet well maintenance program?",
    options: [
      "To maintain wet well water quality only",
      "To maintain the structural integrity and operational reliability of pump station wet wells — through regular inspection, cleaning, coating maintenance, and structural repair — preventing corrosion, leakage, and operational failures",
      "To maintain wet well level controls only",
      "To maintain wet well pumps only"
    ],
    correctAnswer: 1,
    explanation: "Wet well maintenance programs: inspect wet well interior (coating condition, structural cracks, infiltration/inflow, sediment accumulation), clean wet well (remove sediment and debris that can clog pumps), inspect and maintain coatings (epoxy or polyurethane coatings protect concrete from corrosion), repair structural defects (cracks, spalling), inspect and maintain level controls (floats, ultrasonic sensors, pressure transducers), and inspect and maintain vents (to prevent odor and gas accumulation). Wet well maintenance requires: confined space entry procedures, gas monitoring (H₂S, methane, oxygen), and proper PPE.",
  },
  {
    id: 69,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pipe corrosion protection program for metallic pipes?",
    options: [
      "To protect pipe exterior paint only",
      "To prevent internal and external corrosion of metallic distribution pipes — using polyethylene encasement, protective coatings, cathodic protection, and corrosion control water treatment — to extend pipe service life",
      "To protect pipe joints only",
      "To protect pipe fittings only"
    ],
    correctAnswer: 1,
    explanation: "Metallic pipe corrosion protection: External corrosion — polyethylene encasement (AWWA C105 — wrapping ductile iron pipe in 8-mil polyethylene), protective coatings (coal tar, epoxy, polyurethane), and cathodic protection (sacrificial anodes or impressed current). Internal corrosion — cement mortar lining (standard for ductile iron — AWWA C104), epoxy lining, and corrosion control water treatment (pH adjustment, orthophosphate). Corrosion protection selection: based on soil corrosivity (resistivity, pH, redox potential, sulfides), water chemistry, and pipe material. Corrosion is a leading cause of distribution main failures.",
  },
  {
    id: 70,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pump station electrical system maintenance program?",
    options: [
      "To maintain electrical billing only",
      "To ensure the reliability and safety of pump station electrical systems — through regular inspection, testing, and maintenance of switchgear, motor control centers, transformers, and wiring — preventing electrical failures and ensuring safe operation",
      "To maintain electrical meters only",
      "To maintain electrical lighting only"
    ],
    correctAnswer: 1,
    explanation: "Pump station electrical maintenance: inspect and test switchgear (circuit breakers, disconnect switches — test operation, check contacts), motor control centers (MCC — inspect contactors, overloads, wiring), transformers (check oil level and condition, inspect bushings and connections), motors (check insulation resistance, bearing temperature, vibration), and wiring (check for deterioration, overheating, proper connections). Thermographic (infrared) scanning: identifies hot spots in electrical connections before they cause failures. Electrical failures are a leading cause of pump station outages. Electrical work must be performed by qualified electricians following NFPA 70E arc flash safety procedures.",
  },
  {
    id: 71,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pipe cleaning program using pigging?",
    options: [
      "To test pipe strength",
      "To clean distribution mains by passing foam or mechanical pigs through the pipe — removing sediment, biofilm, tuberculation, and scale — restoring hydraulic capacity and improving water quality",
      "To inspect pipe interior only",
      "To test pipe material"
    ],
    correctAnswer: 1,
    explanation: "Pipe cleaning by pigging: foam pigs (soft foam cylinders propelled by water pressure — remove loose sediment and biofilm), mechanical pigs (steel body with brushes or scrapers — remove tuberculation and scale), and bi-directional pigs (can be propelled in either direction — useful where access is limited). Pigging process: insert pig at upstream access point, propel with water pressure, receive at downstream access point, collect and dispose of removed material. Benefits: restores C-factor (hydraulic capacity), improves water quality (removes biofilm and sediment), and prepares pipe for lining. Pigging requires: access points (tapping saddles or hydrants), appropriate pig size, and proper disposal of removed material.",
  },
  {
    id: 72,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pressure gauge calibration program?",
    options: [
      "To replace pressure gauges regularly",
      "To verify that pressure gauges are reading accurately — by comparing to a calibrated reference gauge — ensuring that operational decisions and regulatory compliance are based on accurate pressure data",
      "To inspect pressure gauge condition only",
      "To document pressure gauge locations only"
    ],
    correctAnswer: 1,
    explanation: "Pressure gauge calibration: compare field gauge to calibrated reference gauge (dead weight tester or certified digital gauge) at multiple pressure points, calculate error at each point, adjust or replace gauges outside acceptable accuracy (typically ±2% of full scale). Calibration frequency: critical gauges (regulatory compliance, process control) — annually or more frequently; routine gauges — every 2-3 years. Inaccurate pressure gauges can cause: incorrect operational decisions (inadequate pressure, pipe breaks), regulatory non-compliance (false compliance readings), and safety hazards (operating at incorrect pressures). Calibration records should be maintained.",
  },
  {
    id: 73,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system flow meter calibration program?",
    options: [
      "To replace flow meters regularly",
      "To verify that flow meters are reading accurately — ensuring accurate billing, water loss accounting, and operational data — through regular calibration against known standards or portable reference meters",
      "To inspect flow meter condition only",
      "To document flow meter locations only"
    ],
    correctAnswer: 1,
    explanation: "Flow meter calibration: compare meter reading to portable reference meter (ultrasonic clamp-on meter or insertion meter) at multiple flow rates, calculate error at each flow rate, repair or replace meters outside acceptable accuracy (typically ±2%). Calibration frequency: billing meters (large commercial/industrial) — annually; system flow meters (pump station, entry point) — annually or more frequently. Inaccurate flow meters cause: billing errors (revenue loss or customer disputes), inaccurate water loss accounting (cannot identify real losses), and incorrect operational data (pump efficiency, system performance). Calibration records should be maintained.",
  },
  {
    id: 74,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pump station security program?",
    options: [
      "To protect pump station equipment from theft only",
      "To protect pump stations from unauthorized access, vandalism, and deliberate contamination — through physical security measures (fencing, locks, cameras, alarms) and cybersecurity measures (SCADA security) — as required by vulnerability assessments",
      "To protect pump station employees only",
      "To protect pump station electrical equipment only"
    ],
    correctAnswer: 1,
    explanation: "Pump station security programs: physical security (perimeter fencing, security lighting, tamper-resistant locks, security cameras, intrusion alarms, limited access), chemical security (locked chemical storage, chemical inventory tracking, secondary containment), cybersecurity (SCADA network segmentation, access controls, encryption, regular updates, intrusion detection), and personnel security (background checks, access control, security awareness training). Security measures must be commensurate with risk (determined by vulnerability assessment). Security incidents must be reported to appropriate authorities. Regular security audits verify effectiveness of security measures.",
  },
  {
    id: 75,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pump station ventilation system maintenance?",
    options: [
      "To maintain air quality for equipment only",
      "To ensure adequate ventilation in pump stations to prevent accumulation of hazardous gases (hydrogen sulfide, methane, chlorine), maintain safe oxygen levels, control temperature and humidity, and protect equipment from corrosion",
      "To maintain air quality for employees only",
      "To maintain pump station temperature only"
    ],
    correctAnswer: 1,
    explanation: "Pump station ventilation maintenance: inspect and test ventilation fans (verify airflow, check motor and belts), inspect ductwork and louvers (check for blockages and damage), verify automatic controls (fans should start when gas detectors alarm or when personnel enter), maintain gas detectors (calibrate regularly — H₂S, O₂, LEL), and inspect emergency ventilation (portable fans for confined space entry). Ventilation requirements: minimum 6 air changes per hour for occupied spaces; 12 air changes per hour for chemical storage areas. Inadequate ventilation can cause: oxygen deficiency, toxic gas accumulation, and equipment corrosion.",
  },
  {
    id: 76,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pipe repair clamp selection?",
    options: [
      "To select the cheapest repair clamp",
      "To select the appropriate repair clamp for the pipe material, size, and type of defect — ensuring a reliable, long-term repair that restores full pressure rating and prevents recurrence",
      "To select the fastest repair clamp to install",
      "To select the smallest repair clamp"
    ],
    correctAnswer: 1,
    explanation: "Repair clamp selection: full circle clamps (for circumferential cracks and holes — cover full pipe circumference), half circle clamps (for small holes and pits), service saddle clamps (for service connection leaks), and joint repair clamps (for leaking joints). Selection criteria: pipe material (clamp must be compatible — stainless steel for corrosive environments), pipe outside diameter (OD — clamps are sized by OD, which varies by pipe material and class), pressure rating (must exceed maximum operating pressure), and defect type and location. Improper clamp selection can result in: clamp failure, inadequate repair, or pipe damage during installation.",
  },
  {
    id: 77,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pump station control system maintenance?",
    options: [
      "To maintain control panel aesthetics only",
      "To ensure pump station control systems (PLCs, RTUs, HMIs) are operating reliably and correctly — through regular inspection, testing, software backup, and firmware updates — maintaining automated operations and alarm functions",
      "To maintain control system documentation only",
      "To maintain control system wiring only"
    ],
    correctAnswer: 1,
    explanation: "Control system maintenance: inspect and test PLCs/RTUs (verify I/O operation, check battery backup, update firmware), inspect HMIs (verify display accuracy, update software), test alarm functions (verify all alarms activate and notify operators), backup control system programs (store offsite), verify communication systems (radio, cellular, fiber), and test automatic control sequences (pump alternation, level control, pressure control). Control system failures can cause: loss of automated operations (requiring manual operation), loss of alarms (operators unaware of problems), and SCADA communication failures (loss of remote monitoring and control).",
  },
  {
    id: 78,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pipe joint restraint program?",
    options: [
      "To prevent pipe joint leakage only",
      "To ensure pipe joints are properly restrained against thrust forces — preventing joint separation during pressure surges, water hammer, and soil movement — through proper installation of thrust blocks, restrained joints, or harness rods",
      "To prevent pipe joint corrosion only",
      "To prevent pipe joint root intrusion only"
    ],
    correctAnswer: 1,
    explanation: "Pipe joint restraint: unrestrained joints (push-on and mechanical joints) rely on soil friction to resist thrust forces — adequate for normal operating pressures but may separate during: pressure surges (water hammer), soil movement (frost heave, settlement), and high-pressure testing. Restraint methods: concrete thrust blocks (most common — bearing against undisturbed soil), restrained joints (mechanical restraints built into joint — harness joints, restrained push-on joints), and tie rods (connecting fittings to adjacent pipe). Restrained joint length: calculated based on pipe size, pressure, soil friction angle, and safety factor. Joint separation causes: main breaks, service disruption, and contamination risk.",
  },
  // ─── MODULE 3: Water Quality Monitoring & Lab (40 questions) ──────────────
  {
    id: 79,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality event detection system?",
    options: [
      "To monitor water quality at the treatment plant only",
      "To continuously monitor water quality parameters (chlorine, pH, turbidity, conductivity, TOC) at strategic points in the distribution system to detect contamination events or water quality deterioration in near real-time",
      "To monitor water quality at customer taps only",
      "To monitor water quality at storage tanks only"
    ],
    correctAnswer: 1,
    explanation: "Water quality event detection systems (EDS): continuously monitor multiple parameters (chlorine residual, pH, turbidity, conductivity, TOC, UV absorbance) at strategic locations (entry points, storage tanks, system extremities), use algorithms to detect anomalies (sudden changes in multiple parameters), generate alarms for investigation, and enable rapid response to contamination events. EDS can detect: deliberate contamination (chemical or biological agents), accidental contamination (cross-connections, main breaks), treatment failures (inadequate disinfection), and water quality deterioration (chlorine decay, nitrification). EDS is a key component of water security programs.",
  },
  {
    id: 80,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system total organic carbon (TOC) monitoring program?",
    options: [
      "To measure organic matter in source water only",
      "To monitor organic matter concentrations in the distribution system — which can react with disinfectants to form DBPs, support microbial growth, and indicate contamination events — enabling optimization of disinfection and DBP control",
      "To measure organic matter in wastewater only",
      "To measure organic matter in storage tanks only"
    ],
    correctAnswer: 1,
    explanation: "TOC monitoring in distribution systems: measures the concentration of organic carbon (natural organic matter + synthetic organic compounds), which is a precursor to disinfection byproduct (DBP) formation. High TOC: increases DBP formation potential (THMs, HAAs), increases chlorine demand (reducing residual), and can support microbial growth. TOC monitoring: identifies areas of high DBP formation potential, detects contamination events (sudden TOC increase), and guides treatment optimization (enhanced coagulation to reduce TOC before disinfection). TOC is measured by online analyzers or laboratory analysis (combustion or UV/persulfate oxidation methods).",
  },
  {
    id: 81,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system heterotrophic plate count (HPC) monitoring program?",
    options: [
      "To detect coliform bacteria only",
      "To measure the total number of bacteria in distribution system water — providing an indicator of biological stability, disinfection effectiveness, and potential for microbial regrowth — without identifying specific pathogens",
      "To detect specific pathogens only",
      "To measure algae growth only"
    ],
    correctAnswer: 1,
    explanation: "Heterotrophic plate count (HPC) measures total culturable bacteria in water. HPC > 500 CFU/mL: indicates potential water quality problems (inadequate disinfection, microbial regrowth, biofilm sloughing). HPC uses: monitoring biological stability of distribution water, assessing disinfection effectiveness, detecting biofilm problems, and evaluating the impact of system changes (new mains, repairs). HPC is not a regulatory requirement in most jurisdictions but is used as an operational tool. HPC is measured by spread plate or pour plate methods using R2A agar (incubated at 28°C for 7 days) or standard methods agar (incubated at 35°C for 48 hours).",
  },
  {
    id: 82,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system disinfection byproduct (DBP) monitoring program?",
    options: [
      "To monitor DBPs at the treatment plant only",
      "To measure DBP concentrations (trihalomethanes, haloacetic acids) at representative locations throughout the distribution system to verify regulatory compliance and identify areas of high DBP formation for targeted control",
      "To monitor DBPs at customer taps only",
      "To monitor DBPs at storage tanks only"
    ],
    correctAnswer: 1,
    explanation: "DBP monitoring programs: measure trihalomethanes (THMs — chloroform, bromodichloromethane, dibromochloromethane, bromoform) and haloacetic acids (HAAs — five species) at representative locations. Regulatory limits: Total THMs — 80 μg/L (LRAA); HAA5 — 60 μg/L (LRAA). Monitoring locations: maximum residence time locations (highest water age — highest DBP concentrations). Monitoring frequency: quarterly. DBP formation increases with: higher TOC, higher temperature, higher chlorine dose, longer contact time (higher water age), and lower pH (for HAAs). Control strategies: reduce TOC (enhanced coagulation), reduce chlorine dose, reduce water age, and use alternative disinfectants.",
  },
  {
    id: 83,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system lead and copper monitoring program?",
    options: [
      "To monitor lead and copper in source water only",
      "To measure lead and copper concentrations at customer taps — particularly in homes with lead service lines or copper plumbing with lead solder — to assess corrosion control effectiveness and protect public health",
      "To monitor lead and copper in treatment plant effluent only",
      "To monitor lead and copper in storage tanks only"
    ],
    correctAnswer: 1,
    explanation: "Lead and Copper Rule (LCR) monitoring: collect first-draw samples (1 liter, after 6+ hours of no use) from high-risk homes (lead service lines, copper with lead solder, lead flux). Action levels: Lead — 15 μg/L (90th percentile); Copper — 1.3 mg/L (90th percentile). If action levels exceeded: optimize corrosion control treatment, replace lead service lines, provide public education, and collect additional samples. LCR monitoring locations: prioritize homes with lead service lines, copper plumbing with lead solder, and lead flux. Sample collection must follow strict protocols (first-draw, no pre-flushing).",
  },
  {
    id: 84,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system nitrate monitoring program?",
    options: [
      "To monitor nitrate in source water only",
      "To verify that nitrate concentrations in distributed water comply with the regulatory limit (10 mg/L as N) — particularly important for systems using groundwater with high nitrate or experiencing nitrification in chloraminated systems",
      "To monitor nitrate in wastewater only",
      "To monitor nitrate in storage tanks only"
    ],
    correctAnswer: 1,
    explanation: "Nitrate monitoring in distribution systems: regulatory limit = 10 mg/L as N (MCL). Nitrate sources: source water (agricultural runoff, septic systems), nitrification in chloraminated systems (ammonia oxidation produces nitrite, then nitrate). Monitoring: required at entry points and in distribution system for systems with nitrate concerns. Nitrate health effects: methemoglobinemia (blue baby syndrome) in infants — nitrate reduces oxygen-carrying capacity of blood. Nitrate control: source water protection, treatment (ion exchange, reverse osmosis, biological denitrification), and nitrification control in chloraminated systems.",
  },
  {
    id: 85,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality sampling protocol?",
    options: [
      "To collect samples as conveniently as possible",
      "To ensure water quality samples are collected, handled, preserved, and analyzed correctly — using standardized procedures that produce representative, accurate, and legally defensible results for regulatory compliance and operational decision-making",
      "To collect samples as quickly as possible",
      "To collect samples as cheaply as possible"
    ],
    correctAnswer: 1,
    explanation: "Water quality sampling protocols specify: sample collection procedures (sample point preparation, flushing requirements, sample volume), sample containers (material, size, preservatives), preservation requirements (temperature, chemical preservatives, holding times), chain of custody documentation (sample ID, collector, date/time, preservation), and analytical methods (EPA or Standard Methods approved methods). Proper protocols ensure: representative samples (not contaminated by sampling equipment), accurate results (proper preservation prevents degradation), and legally defensible data (required for regulatory compliance). Improper sampling can produce: false positive or false negative results, regulatory violations, or invalid data.",
  },
  {
    id: 86,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality trend analysis?",
    options: [
      "To analyze water quality data for billing purposes",
      "To identify patterns and trends in water quality data — seasonal variations, long-term changes, spatial patterns — that indicate system problems, treatment changes, or emerging issues requiring operational or capital improvements",
      "To analyze water quality data for regulatory reporting only",
      "To analyze water quality data for customer complaints only"
    ],
    correctAnswer: 1,
    explanation: "Water quality trend analysis: plots water quality parameters over time (chlorine residual, pH, turbidity, DBPs, HPC), identifies: seasonal patterns (summer temperature increases chlorine decay and DBP formation), long-term trends (declining C-factor, increasing DBPs), spatial patterns (areas with consistently low residuals or high DBPs), and anomalies (sudden changes indicating system problems). Tools: statistical process control (SPC) charts, GIS mapping of water quality data, and correlation analysis. Trend analysis enables: proactive operational adjustments, targeted capital improvements, and early detection of emerging problems.",
  },
  {
    id: 87,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality profiling study?",
    options: [
      "To profile customer water quality preferences",
      "To systematically characterize water quality throughout the distribution system — measuring multiple parameters at many locations — to identify problem areas, calibrate water quality models, and guide operational improvements",
      "To profile water quality at the treatment plant only",
      "To profile water quality at storage tanks only"
    ],
    correctAnswer: 1,
    explanation: "Water quality profiling studies: collect samples at many locations throughout the distribution system (entry points, storage tanks, system extremities, dead-ends, intermediate points), measure multiple parameters (chlorine residual, pH, turbidity, temperature, HPC, DBPs, water age tracer), map results in GIS, and identify: low-residual areas (requiring flushing or booster disinfection), high-DBP areas (requiring operational changes), high water age areas (requiring system modifications), and areas with microbial quality concerns. Profiling studies are typically conducted seasonally (summer — worst case for DBPs and microbial growth; winter — worst case for water age in some systems).",
  },
  {
    id: 88,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system Legionella monitoring program?",
    options: [
      "To monitor Legionella in source water only",
      "To detect and control Legionella bacteria in distribution system water and building plumbing — which can cause Legionnaires' disease — through systematic monitoring, water management plans, and corrective actions",
      "To monitor Legionella in wastewater only",
      "To monitor Legionella in cooling towers only"
    ],
    correctAnswer: 1,
    explanation: "Legionella monitoring programs: Legionella pneumophila causes Legionnaires' disease (severe pneumonia) and Pontiac fever (flu-like illness). Risk factors: warm water temperatures (25-45°C optimal growth), stagnant water (low flow, dead legs), low or absent disinfectant residual, and biofilm. Distribution system risk: Legionella can colonize distribution system biofilm, particularly in warm climates or during summer. Building plumbing risk: hot water systems, cooling towers, decorative fountains. Water management plans (WMPs): required by ASHRAE 188 for high-risk buildings (hospitals, hotels, large buildings). WMPs include: hazard analysis, control measures, monitoring, and corrective actions.",
  },
  {
    id: 89,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality model?",
    options: [
      "To model water quantity only",
      "To simulate the fate and transport of water quality constituents (chlorine, DBPs, water age, contaminants) throughout the distribution system — enabling prediction of water quality at any location and optimization of operations",
      "To model water pressure only",
      "To model water temperature only"
    ],
    correctAnswer: 1,
    explanation: "Water quality models (e.g., EPANET water quality module): simulate chlorine decay (bulk decay + wall decay), DBP formation, water age, source tracing (blending of water from different sources), and contaminant transport. Uses: predict water quality at locations not monitored, optimize disinfection (booster locations and doses), evaluate operational changes (tank turnover, flushing programs), design monitoring programs (identify representative locations), and respond to contamination events (predict affected areas). Model calibration: compare simulated to measured water quality at multiple locations; adjust decay coefficients and wall reaction rates. Water quality models are most valuable when integrated with hydraulic models.",
  },
  {
    id: 90,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system chloramine stability monitoring program?",
    options: [
      "To monitor chloramine at the treatment plant only",
      "To track chloramine residual decay throughout the distribution system — monitoring for nitrification, chloramine decomposition, and areas of inadequate residual — to maintain effective disinfection and prevent microbial regrowth",
      "To monitor chloramine in source water only",
      "To monitor chloramine in storage tanks only"
    ],
    correctAnswer: 1,
    explanation: "Chloramine stability monitoring: measure total chlorine, free chlorine, and free ammonia at multiple points in the distribution system. Indicators of nitrification: decreasing total chlorine residual, increasing free ammonia (from chloramine decomposition), increasing nitrite (from ammonia oxidation), and decreasing pH. Monitoring frequency: weekly at minimum; daily in problem areas. Nitrification control: maintain total chlorine >1 mg/L, optimize Cl₂:NH₃ ratio (3:1 to 5:1 by weight), minimize water age, increase flushing, and implement breakpoint chlorination when nitrification is detected. Chloramine stability is affected by: temperature, pH, water age, and organic matter.",
  },
  {
    id: 91,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality emergency response sampling plan?",
    options: [
      "To collect samples during routine operations only",
      "To define sampling locations, parameters, procedures, and laboratory contacts for rapid water quality assessment during emergencies — enabling quick characterization of contamination events and informed decisions about public notification and system response",
      "To collect samples for regulatory reporting only",
      "To collect samples for customer complaints only"
    ],
    correctAnswer: 1,
    explanation: "Emergency response sampling plans: pre-identify sampling locations (representative of affected area, upstream/downstream of suspected source), specify parameters to analyze (based on likely contaminants — microbial, chemical, radiological), identify certified laboratories with emergency analysis capability, define sample collection procedures (proper containers, preservation, chain of custody), establish communication protocols (who collects, who analyzes, who receives results), and define decision criteria (when to issue boil water advisory, when to issue do-not-use order). Pre-planning enables rapid, organized response during emergencies when time is critical.",
  },
  {
    id: 92,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality laboratory quality assurance/quality control (QA/QC) program?",
    options: [
      "To ensure laboratory equipment is clean only",
      "To ensure that laboratory analyses produce accurate, precise, and reliable results — through standardized procedures, calibration, blanks, duplicates, spikes, and proficiency testing — enabling valid regulatory compliance decisions and operational choices",
      "To ensure laboratory staff are trained only",
      "To ensure laboratory documentation is complete only"
    ],
    correctAnswer: 1,
    explanation: "Laboratory QA/QC programs: method blanks (verify no contamination from reagents or equipment), duplicates (verify precision — results should agree within ±10-20%), matrix spikes (verify accuracy — known amount added to sample, recovery should be 80-120%), calibration standards (verify instrument accuracy), proficiency testing (analyze blind samples from external source — verify laboratory performance), and chain of custody (document sample handling from collection to analysis). QA/QC ensures: results are accurate (not biased by contamination or instrument error), precise (reproducible), and legally defensible (required for regulatory compliance). Certified laboratories must meet state/provincial QA/QC requirements.",
  },
  {
    id: 93,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality online monitoring program?",
    options: [
      "To replace laboratory analysis completely",
      "To continuously monitor key water quality parameters (chlorine, pH, turbidity, conductivity) at strategic locations — providing real-time operational awareness, early warning of quality changes, and data for trend analysis",
      "To monitor water quality at customer taps only",
      "To monitor water quality for billing purposes"
    ],
    correctAnswer: 1,
    explanation: "Online water quality monitoring: continuously measures parameters (chlorine residual — amperometric or colorimetric sensors; pH — glass electrode; turbidity — nephelometric; conductivity — electrode; TOC — UV/persulfate oxidation). Advantages: real-time data (detect changes immediately), continuous record (identify patterns and trends), alarm capability (notify operators of abnormal conditions), and reduced sampling costs. Limitations: sensors require regular calibration and maintenance, can have interferences, and measure only a few parameters. Online monitoring complements (not replaces) laboratory analysis. Strategic locations: entry points, storage tanks, system extremities, and areas of historical water quality concern.",
  },
  {
    id: 94,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system source water blending optimization?",
    options: [
      "To blend water from different sources to reduce treatment costs only",
      "To optimize the blending of water from multiple sources or treatment trains to achieve target water quality parameters — minimizing DBP formation, maintaining corrosion control, and meeting regulatory requirements — while managing costs",
      "To blend water from different sources for taste improvement only",
      "To blend water from different sources to reduce pressure"
    ],
    correctAnswer: 1,
    explanation: "Source water blending optimization: when a system has multiple sources (surface water + groundwater, different treatment trains), blending ratios affect: DBP formation potential (TOC, bromide), corrosion potential (pH, alkalinity, hardness), disinfectant demand (TOC, reduced compounds), and taste and odor. Optimization: use water quality models to predict blending effects, conduct jar tests to evaluate treatment options, monitor distribution system water quality to verify results, and adjust blending ratios seasonally (source water quality varies). Blending can: reduce DBP formation, improve corrosion control, and reduce treatment costs — but must be carefully managed to avoid adverse effects.",
  },
  {
    id: 95,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality consumer confidence report (CCR)?",
    options: [
      "To report water quality to regulators only",
      "To annually inform customers about their drinking water quality — including source water information, detected contaminants and their levels, regulatory limits, and health effects — as required by the Safe Drinking Water Act",
      "To report water quality to employees only",
      "To report water quality to the media only"
    ],
    correctAnswer: 1,
    explanation: "Consumer Confidence Reports (CCRs) — also called Annual Water Quality Reports: required annually for all community water systems, must be delivered to customers by July 1 (for previous calendar year data), must include: source water information, detected contaminants and levels, MCLs and MCLGs, health effects of detected contaminants, system compliance information, and educational information. CCRs must be written in plain language accessible to customers. Electronic delivery is allowed with paper copies available on request. CCRs build public trust, demonstrate transparency, and educate customers about their water quality.",
  },
  {
    id: 96,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality tracer study?",
    options: [
      "To trace pipe locations underground",
      "To measure actual water travel times and mixing patterns in the distribution system — using conservative tracers (fluoride, lithium, stable isotopes) — for hydraulic model calibration, water age assessment, and operational optimization",
      "To trace chemical contamination only",
      "To trace microbial contamination only"
    ],
    correctAnswer: 1,
    explanation: "Tracer studies: inject a conservative tracer (fluoride — most common, lithium, stable isotopes) at a known concentration and time, monitor tracer breakthrough at multiple locations in the distribution system, measure arrival time and concentration profile, and use results to: calibrate hydraulic models (compare simulated to measured travel times), assess water age (tracer arrival time = water age), identify mixing patterns (blending of water from different sources), and evaluate operational changes (impact of pump scheduling, valve operations on water age). Tracer studies provide direct measurement of system hydraulics that cannot be obtained from models alone.",
  },
  {
    id: 97,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality complaint investigation protocol?",
    options: [
      "To dismiss customer complaints quickly",
      "To systematically investigate customer water quality complaints — collecting samples, conducting field tests, reviewing operational data, and identifying root causes — to resolve the immediate issue and prevent recurrence",
      "To document complaints for legal purposes only",
      "To notify regulators of complaints only"
    ],
    correctAnswer: 1,
    explanation: "Water quality complaint investigation protocols: receive and document complaint (date, location, nature of complaint), conduct initial assessment (review operational data, check for other complaints in area), dispatch field crew (collect samples, conduct field tests — chlorine, pH, turbidity, odor), investigate potential causes (main break, cross-connection, treatment problem, distribution system issue), take corrective action (flushing, main repair, treatment adjustment), notify customer of findings and actions, and document investigation and resolution. Complaint data should be entered in GIS for trend analysis. Recurring complaints in the same area indicate a systemic problem requiring capital improvement.",
  },
  {
    id: 98,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality biofilm monitoring program?",
    options: [
      "To monitor biofilm in treatment plant filters only",
      "To detect and characterize biofilm growth in distribution system pipes — which can harbor pathogens, consume disinfectant, cause taste and odor problems, and contribute to corrosion — enabling targeted control measures",
      "To monitor biofilm in storage tanks only",
      "To monitor biofilm in customer plumbing only"
    ],
    correctAnswer: 1,
    explanation: "Biofilm monitoring in distribution systems: biofilm is a community of microorganisms attached to pipe surfaces, embedded in a polysaccharide matrix. Biofilm causes: disinfectant demand (consuming chlorine), microbial regrowth (releasing bacteria into bulk water), taste and odor (producing earthy/musty compounds), and corrosion (microbially influenced corrosion — MIC). Monitoring methods: HPC (bulk water indicator), ATP (adenosine triphosphate — measures active biomass), pipe section analysis (remove pipe samples for biofilm quantification), and online sensors (turbidity, TOC as indirect indicators). Control: maintain adequate disinfectant residual, minimize water age, and implement regular flushing.",
  },
  // ─── MODULE 4: Security, Safety, Admin & Public Interactions (32 questions) ─
  {
    id: 99,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility emergency operations center (EOC)?",
    options: [
      "To manage routine operations only",
      "To serve as the command and coordination center during major emergencies — bringing together key personnel, information, and resources to manage the emergency response and recovery operations",
      "To manage customer service only",
      "To manage employee training only"
    ],
    correctAnswer: 1,
    explanation: "Emergency Operations Centers (EOCs): centralize command and coordination during major emergencies (major main breaks, contamination events, natural disasters, cyber attacks). EOC functions: situation assessment (collecting and analyzing information), decision-making (determining response priorities and strategies), resource management (allocating personnel, equipment, and materials), communications (internal coordination and external notifications), documentation (recording decisions and actions), and public information (coordinating with media and public). EOCs should be pre-equipped with: communication systems, maps, emergency plans, contact lists, and backup power. EOC activation criteria should be pre-defined.",
  },
  {
    id: 100,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility incident command system (ICS)?",
    options: [
      "To manage routine maintenance only",
      "To provide a standardized organizational structure for emergency response — with defined roles (Incident Commander, Operations, Planning, Logistics, Finance) — enabling effective coordination among multiple agencies and organizations",
      "To manage customer complaints only",
      "To manage employee performance only"
    ],
    correctAnswer: 1,
    explanation: "Incident Command System (ICS): standardized emergency management system used by all emergency response agencies. ICS structure: Incident Commander (overall responsibility), Command Staff (Public Information Officer, Safety Officer, Liaison Officer), and General Staff (Operations Section, Planning Section, Logistics Section, Finance/Administration Section). ICS principles: unity of command (each person reports to one supervisor), span of control (5-7 people per supervisor), common terminology, and modular organization (expands or contracts based on incident size). Water utilities should train key personnel in ICS and integrate with local emergency management. ICS enables effective coordination with fire, police, and public health agencies.",
  },
  {
    id: 101,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility public notification plan?",
    options: [
      "To notify the public of rate increases only",
      "To define procedures for rapidly notifying customers of water quality emergencies — boil water advisories, do-not-use orders, contamination events — using multiple communication channels to reach all affected customers",
      "To notify the public of planned maintenance only",
      "To notify the public of new services only"
    ],
    correctAnswer: 1,
    explanation: "Public notification plans: define notification tiers (Tier 1 — immediate, within 24 hours for acute health risks; Tier 2 — within 30 days for non-acute violations; Tier 3 — annual for informational notices), specify notification methods (direct contact — phone, door-to-door; media — TV, radio, newspaper; social media; website; email/text alerts; signage), identify customer contact information, define message content (what happened, what to do, what is being done, when to expect resolution), and establish spokesperson and approval process. Effective notification: reaches all affected customers quickly, provides clear actionable guidance, and maintains public trust.",
  },
  {
    id: 102,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility boil water advisory (BWA) protocol?",
    options: [
      "To advise customers to boil water for taste improvement",
      "To define the criteria, procedures, and communications for issuing, maintaining, and lifting boil water advisories — when water may be microbiologically unsafe — protecting public health while minimizing unnecessary disruption",
      "To advise customers to boil water for all uses",
      "To advise customers to boil water for chemical contamination"
    ],
    correctAnswer: 1,
    explanation: "Boil water advisory (BWA) protocols: Issuance criteria — loss of pressure (potential contamination intrusion), positive coliform sample, treatment failure (inadequate disinfection), main break with contamination risk. Issuance process — notify regulatory authority, issue public notification (all affected customers within 24 hours), coordinate with public health. BWA maintenance — continue sampling, maintain increased monitoring, communicate status updates. Lifting criteria — two consecutive satisfactory coliform samples (24 hours apart), pressure restored, treatment verified, regulatory approval. Lifting process — notify regulatory authority, issue public notification, provide guidance (flush plumbing before use). BWAs should be issued conservatively — public health protection is paramount.",
  },
  {
    id: 103,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility media relations plan?",
    options: [
      "To promote the utility's services only",
      "To define how the utility communicates with media during normal operations and emergencies — designating spokespersons, establishing message approval processes, and ensuring accurate, timely, and consistent information reaches the public",
      "To manage social media accounts only",
      "To manage advertising campaigns only"
    ],
    correctAnswer: 1,
    explanation: "Media relations plans: designate spokespersons (typically General Manager or Communications Director — trained in media relations), establish message approval process (who approves statements before release), define media contact protocols (how media inquiries are handled, who can speak to media), prepare key messages for likely scenarios (main breaks, water quality events, rate increases), conduct media training for spokespersons, and establish relationships with local media before emergencies. Effective media relations: ensures accurate information reaches the public, prevents misinformation, maintains public trust, and demonstrates utility competence and transparency.",
  },
  {
    id: 104,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility customer service plan?",
    options: [
      "To manage customer billing only",
      "To define standards and procedures for all customer interactions — service applications, billing inquiries, water quality complaints, emergency notifications — ensuring consistent, professional, and responsive service that maintains customer satisfaction and trust",
      "To manage customer meter reading only",
      "To manage customer account information only"
    ],
    correctAnswer: 1,
    explanation: "Customer service plans: define service standards (response times for complaints, service connection requests, billing inquiries), establish complaint handling procedures (receive, investigate, resolve, document), define billing procedures (meter reading, bill calculation, payment options, delinquency procedures), establish service connection procedures (application, inspection, connection), define emergency notification procedures (main breaks, water quality events, planned outages), and establish customer assistance programs (for low-income customers). Customer service quality directly affects: customer satisfaction, public trust, and the utility's ability to obtain rate increases and capital funding.",
  },
  {
    id: 105,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility rate structure design?",
    options: [
      "To maximize utility revenue only",
      "To design water rates that recover full cost of service (including capital replacement), promote water conservation, ensure affordability for low-income customers, and comply with regulatory requirements — while maintaining financial sustainability",
      "To minimize customer water bills only",
      "To match competitor rates only"
    ],
    correctAnswer: 1,
    explanation: "Water rate structure design: cost of service analysis (allocate costs among customer classes — residential, commercial, industrial), rate structure selection (flat rate, uniform volumetric, tiered/inclining block, seasonal rates), conservation pricing (tiered rates encourage conservation), affordability programs (lifeline rates, bill assistance for low-income customers), and regulatory compliance (cost-of-service basis required in most jurisdictions). Rate structures must recover: operating costs (O&M), debt service (bond payments), and capital replacement (depreciation or pay-as-you-go). Rate adequacy: rates must be sufficient to maintain financial health and fund necessary capital improvements.",
  },
  {
    id: 106,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility capital improvement program (CIP)?",
    options: [
      "To plan routine maintenance activities",
      "To identify, prioritize, and schedule capital projects (pipe replacement, pump station upgrades, storage tank rehabilitation) over a 5-10 year planning horizon — based on infrastructure condition, regulatory requirements, and growth needs — with associated cost estimates and funding sources",
      "To plan employee training programs",
      "To plan operational improvements only"
    ],
    correctAnswer: 1,
    explanation: "Capital Improvement Programs (CIPs): identify needed capital projects (from master plan, asset management, regulatory requirements, growth projections), prioritize projects (based on risk, regulatory requirements, growth needs, and available funding), develop cost estimates (planning level to detailed design), identify funding sources (rates, bonds, grants, developer contributions), develop implementation schedule (phased over 5-10 years), and update annually. CIPs are essential for: long-term financial planning (rate setting, debt management), regulatory compliance (demonstrating commitment to improvements), and infrastructure sustainability (preventing deferred maintenance backlog). CIPs should be integrated with the utility's financial plan.",
  },
  {
    id: 107,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility succession planning program?",
    options: [
      "To plan for utility ownership succession only",
      "To identify and develop future leaders and technical experts — ensuring the utility retains critical knowledge and skills as experienced employees retire — through mentoring, training, cross-training, and career development programs",
      "To plan for employee retirement benefits only",
      "To plan for employee replacement only"
    ],
    correctAnswer: 1,
    explanation: "Succession planning programs: identify critical positions (those requiring specialized knowledge or certifications), assess current incumbents (age, retirement plans, performance), identify potential successors (internal candidates with potential), develop successors (training, mentoring, cross-training, stretch assignments), document critical knowledge (standard operating procedures, institutional knowledge), and recruit externally when internal succession is insufficient. Water utilities face significant workforce challenges: large numbers of experienced operators retiring, difficulty attracting qualified replacements, and long training times for licensed operators. Succession planning is essential for maintaining operational continuity and institutional knowledge.",
  },
  {
    id: 108,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility operator certification program?",
    options: [
      "To certify operators for billing purposes",
      "To ensure that water distribution system operators have demonstrated the knowledge and skills required to operate systems safely and effectively — through examination, experience requirements, and continuing education — protecting public health",
      "To certify operators for insurance purposes",
      "To certify operators for employment purposes only"
    ],
    correctAnswer: 1,
    explanation: "Operator certification programs: state/provincial programs require operators to: pass written examinations (demonstrating knowledge of distribution system operations, water quality, safety, and regulations), accumulate experience (working under a certified operator), complete continuing education (maintaining and updating knowledge), and renew certification periodically (typically every 3-5 years). Certification levels correspond to system complexity (Class I-IV based on population served, system complexity, and treatment processes). Certified operators are responsible for: safe system operations, regulatory compliance, water quality protection, and public health. Certification requirements vary by jurisdiction.",
  },
  {
    id: 109,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility confined space rescue plan?",
    options: [
      "To rescue equipment from confined spaces",
      "To define procedures for rescuing workers who become incapacitated in permit-required confined spaces — including rescue team training, equipment requirements, and coordination with emergency services — before entry operations begin",
      "To rescue animals from confined spaces",
      "To rescue equipment from flooded spaces"
    ],
    correctAnswer: 1,
    explanation: "Confined space rescue plans (OSHA 29 CFR 1910.146): must be developed before entry into permit-required confined spaces. Plans must address: rescue methods (non-entry rescue preferred — using retrieval systems; entry rescue only when non-entry is not feasible), rescue team requirements (training, equipment, physical fitness), equipment requirements (retrieval systems, SCBA, first aid equipment), coordination with local emergency services (fire department rescue teams), and communication procedures. Non-entry rescue: use retrieval system (harness + rope + winch) to extract incapacitated entrant without additional personnel entering. Entry rescue: requires trained, equipped rescue team with SCBA. Most confined space fatalities involve would-be rescuers.",
  },
  {
    id: 110,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility hazard communication program?",
    options: [
      "To communicate hazards to customers only",
      "To ensure employees are informed about chemical hazards in the workplace — through Safety Data Sheets (SDS), container labeling, and training — enabling them to handle chemicals safely and respond appropriately to exposures",
      "To communicate hazards to regulators only",
      "To communicate hazards to the media only"
    ],
    correctAnswer: 1,
    explanation: "Hazard Communication Programs (OSHA 29 CFR 1910.1200 — HazCom/GHS): Safety Data Sheets (SDS) — 16-section documents providing: chemical identity, physical/chemical properties, health hazards, exposure limits, protective measures, and emergency procedures; Container labeling — GHS-compliant labels with: product identifier, signal word (Danger or Warning), hazard pictograms, hazard statements, precautionary statements, and supplier information; Training — employees must be trained on: how to read SDS, label requirements, chemical hazards in their workplace, and protective measures. Water utilities use many hazardous chemicals: chlorine, sodium hypochlorite, fluoride, sulfuric acid, ammonia, and corrosion inhibitors.",
  },
  {
    id: 111,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility lockout/tagout (LOTO) program?",
    options: [
      "To lock utility facilities at night",
      "To prevent unexpected energization or startup of equipment during maintenance — by locking and tagging energy isolation devices (electrical disconnects, valves) — protecting workers from hazardous energy release",
      "To lock chemical storage areas",
      "To lock pump station doors"
    ],
    correctAnswer: 1,
    explanation: "Lockout/Tagout (LOTO) programs (OSHA 29 CFR 1910.147): required for maintenance on equipment with hazardous energy (electrical, hydraulic, pneumatic, mechanical, thermal, chemical, gravitational). LOTO procedure: notify affected employees, shut down equipment, isolate all energy sources (open electrical disconnects, close valves, release stored energy), apply lockout devices (one lock per worker), apply tagout tags, verify zero energy state (test controls, measure voltage, check pressure gauges), perform maintenance, restore energy in reverse order. Water utility LOTO applications: pump maintenance (electrical + hydraulic energy), valve maintenance (hydraulic pressure), chemical feed system maintenance (chemical energy). LOTO violations are among OSHA's most frequently cited standards.",
  },
  {
    id: 112,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility excavation and trenching safety program?",
    options: [
      "To plan excavation locations only",
      "To protect workers from cave-ins and other excavation hazards — through soil classification, protective systems (sloping, shoring, trench boxes), and safe work practices — as required by OSHA 29 CFR 1926 Subpart P",
      "To plan excavation costs only",
      "To plan excavation schedules only"
    ],
    correctAnswer: 1,
    explanation: "Excavation and trenching safety (OSHA 29 CFR 1926 Subpart P): Competent person — must classify soil and inspect excavations daily and after rain. Soil classification: Type A (cohesive, uncracked, no vibration — stable), Type B (intermediate), Type C (granular, cracked, or submerged — unstable). Protective systems: sloping (cut back walls at safe angle — Type A: 53°; Type B: 45°; Type C: 34°), shoring (hydraulic or timber — supports trench walls), and trench boxes/shields (protect workers without supporting walls). Access/egress: ladder or ramp within 25 feet of workers. Utility location: call before you dig (811). Cave-ins are a leading cause of construction fatalities.",
  },
  {
    id: 113,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility traffic control plan for work in roadways?",
    options: [
      "To control traffic for utility vehicles only",
      "To protect workers and the public during utility work in or near roadways — through proper signing, channelization, flagging, and coordination with traffic authorities — as required by the Manual on Uniform Traffic Control Devices (MUTCD)",
      "To control traffic for customer access",
      "To control traffic for emergency vehicles only"
    ],
    correctAnswer: 1,
    explanation: "Traffic control plans (MUTCD compliance): required for all work in or near roadways. Components: advance warning signs (alert drivers to work zone ahead), channelizing devices (cones, drums, barriers — guide traffic around work zone), flagger stations (control traffic flow through work zone), worker protection (high-visibility vests, safe positioning), and coordination with traffic authorities (permits, lane closures). MUTCD requirements: minimum sign sizes, spacing, and placement; flagger training and certification; temporary traffic control zone design. Work zone fatalities: workers and motorists are killed in work zones annually — proper traffic control is critical. Traffic control plans must be site-specific and adapted to conditions.",
  },
  {
    id: 114,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility drug and alcohol testing program?",
    options: [
      "To test employees for performance enhancement drugs only",
      "To ensure that safety-sensitive positions are performed by employees who are not impaired by drugs or alcohol — through pre-employment, random, post-accident, and reasonable suspicion testing — protecting public safety and employee health",
      "To test employees for medical conditions only",
      "To test employees for insurance purposes only"
    ],
    correctAnswer: 1,
    explanation: "Drug and alcohol testing programs: required for safety-sensitive positions (operators, drivers of commercial vehicles). Testing types: pre-employment (before hiring for safety-sensitive positions), random (unannounced, throughout the year), post-accident (after accidents meeting specified criteria), reasonable suspicion (when supervisor observes signs of impairment), return-to-duty (after violation, before returning to safety-sensitive work), and follow-up (after return-to-duty, for 1-5 years). DOT regulations (49 CFR Part 40) apply to commercial vehicle drivers. State/provincial regulations may apply to water operators. Positive test consequences: removal from safety-sensitive duties, referral to Employee Assistance Program (EAP), and return-to-duty process.",
  },
  {
    id: 115,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility regulatory compliance tracking system?",
    options: [
      "To track regulatory fees only",
      "To systematically monitor all regulatory requirements — sampling schedules, reporting deadlines, permit conditions, operational requirements — ensuring no requirements are missed and enabling proactive compliance management",
      "To track regulatory inspections only",
      "To track regulatory violations only"
    ],
    correctAnswer: 1,
    explanation: "Regulatory compliance tracking systems: maintain a comprehensive inventory of all regulatory requirements (federal, state/provincial, local), track compliance status (in compliance, pending, at risk), schedule required sampling and reporting (with advance reminders), document compliance actions (sampling results, reports submitted, corrective actions), track permit conditions and renewal dates, and generate compliance reports for management and regulators. Compliance tracking prevents: missed sampling deadlines (violations), late reports (violations), and overlooked permit conditions (violations). Violations can result in: fines, consent orders, public notification requirements, and reputational damage.",
  },
  {
    id: 116,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility financial management system?",
    options: [
      "To manage employee payroll only",
      "To track revenues and expenditures, manage cash flow, plan capital investments, set rates, manage debt, and ensure the utility's long-term financial sustainability — enabling reliable service delivery and infrastructure maintenance",
      "To manage customer billing only",
      "To manage vendor payments only"
    ],
    correctAnswer: 1,
    explanation: "Water utility financial management: revenue management (billing, collections, rate setting), expenditure management (O&M costs, capital costs, debt service), financial planning (rate studies, capital improvement programs, debt management), financial reporting (audited financial statements, regulatory reports), and performance monitoring (financial ratios — debt coverage, days cash on hand, operating ratio). Financial sustainability requires: rates sufficient to cover all costs (O&M + capital replacement + debt service), adequate reserves (operating reserve — 90 days O&M; capital reserve — for major repairs), and manageable debt levels (debt service coverage ratio > 1.25). Financial distress leads to: deferred maintenance, service deterioration, and regulatory violations.",
  },
  {
    id: 117,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water utility performance measurement program?",
    options: [
      "To track employee attendance only",
      "To systematically measure, monitor, and improve utility operations across financial, operational, customer service, and environmental dimensions — enabling data-driven management and continuous improvement",
      "To track customer complaints only",
      "To manage vendor performance only"
    ],
    correctAnswer: 1,
    explanation: "Water utility performance measurement: operational metrics (water loss/NRW, energy efficiency, system reliability, water quality compliance), financial metrics (operating ratio, debt coverage, days cash on hand, revenue per connection), customer service metrics (complaints per 1000 connections, response times, billing accuracy), and environmental metrics (energy use per ML, chemical use efficiency, spill frequency). Key frameworks: AWWA QualServe benchmarking, IWA performance indicators, USEPA CUPSS (Check Up Program for Small Systems). Performance measurement enables: identification of improvement opportunities, benchmarking against peer utilities, regulatory reporting, and strategic planning. Continuous improvement cycle: measure → analyze → improve → measure.",
  },
];

export const WPI_CLASS3_WATER_DIST_MODULES = [
  { id: "distribution-system-components", name: "Distribution System Components", icon: "🔧", count: 23 },
  { id: "equipment-installation-om-repair", name: "Equipment Installation, O&M & Repair", icon: "⚙️", count: 25 },
  { id: "water-quality-monitoring-lab", name: "Water Quality Monitoring & Lab", icon: "🧪", count: 25 },
  { id: "security-safety-admin", name: "Security, Safety, Admin & Public Interactions", icon: "🛡️", count: 27 },
];
