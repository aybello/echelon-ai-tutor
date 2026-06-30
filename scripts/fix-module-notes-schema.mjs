/**
 * fix-module-notes-schema.mjs
 *
 * Migrates the 8 Ontario water distribution and wastewater collection banks
 * from the old `keyTopics: string[]` schema to the correct
 * `keyPoints: {heading, body}[], examTips: string[]` schema.
 *
 * Run once: node scripts/fix-module-notes-schema.mjs
 */

import { config } from "dotenv";
config();
import { createConnection } from "mysql2/promise";

// ─── Rich module notes data ───────────────────────────────────────────────────

const OVERVIEWS = {

  // ═══════════════════════════════════════════════════════════════════════════
  // ONTARIO WATER DISTRIBUTION
  // ═══════════════════════════════════════════════════════════════════════════

  "class1-water-dist": {
    General: {
      title: "General",
      intro: "The General module covers the foundational knowledge every Class 1 Water Distribution operator must have. This includes basic and applied math (calculating volumes, flow rates, chemical doses), units of expression, applied science (chemistry, microbiology, public health principles), electrical concepts, hydraulic concepts (head, pressure, flow), maps and plans, and safety procedures including WHMIS and first aid. On the Class 1 exam, this module accounts for 27 of the 80 questions.",
      keyPoints: [
        { heading: "Basic & Applied Math", body: "Volume, flow rate, and chemical dose calculations. Memorize the formula triangle: C × V = mass. Practice unit conversions between L, m³, mg/L, and kg." },
        { heading: "Units of Expression", body: "Know when to use mg/L vs. g/m³ vs. ppm. For water, mg/L ≈ ppm. Understand how to convert between imperial and metric units." },
        { heading: "Applied Science & Public Health", body: "Understand how pathogens enter distribution systems, the role of chlorine residual, and why turbidity matters for public health." },
        { heading: "Electrical Concepts", body: "Ohm's Law (V = IR), power calculations (P = VI), single-phase vs. three-phase power, and how to read electrical diagrams." },
        { heading: "Hydraulic Concepts", body: "Head (pressure head, velocity head, elevation head), Bernoulli's principle, friction losses (Hazen-Williams), and how pressure relates to elevation." },
        { heading: "Maps & Plans", body: "Reading as-built drawings, understanding plan vs. profile views, locating valves and hydrants from maps, and interpreting hydraulic grade lines." },
        { heading: "Safety Procedures & WHMIS", body: "Confined space entry (Class 1 awareness level), WHMIS 2015 hazard classes, SDS sheets, PPE selection, and lockout/tagout basics." },
      ],
      examTips: [
        "Math questions on Class 1 are straightforward — practice the volume and dose formulas until they are automatic.",
        "Hydraulic head questions often ask you to calculate pressure at a point given elevation differences — remember 1 m of head = 9.81 kPa.",
        "WHMIS questions focus on hazard classes and SDS sections — know the 9 hazard pictograms.",
        "Electrical questions at Class 1 are conceptual — understand Ohm's Law and basic circuit types.",
      ],
    },
    "Support Systems": {
      title: "Support Systems",
      intro: "The Support Systems module covers the equipment and materials used to distribute safe drinking water. Class 1 operators must understand the basic operation and troubleshooting of electrical controls, motors, pumps (centrifugal, positive displacement, turbine, and metering), generators, engines, pipes, joints, valves, fittings, cathodic protection devices, hydrants, measuring and control systems, and cross-connection and backflow prevention devices. This module accounts for 16 of the 80 questions on the Class 1 exam.",
      keyPoints: [
        { heading: "Electrical Controls & Transformers", body: "Understand motor starters, contactors, overload relays, and how transformers step voltage up or down. Know the difference between DOL, star-delta, and soft starters." },
        { heading: "Motors & Drives", body: "Three-phase induction motors are the standard. Know how to read a motor nameplate, understand insulation classes, and recognize signs of overheating or bearing failure." },
        { heading: "Pumps (Centrifugal, PD, Turbine, Metering)", body: "Centrifugal pumps are most common — know the pump curve, BEP, cavitation causes and symptoms. Positive displacement pumps deliver constant flow regardless of pressure." },
        { heading: "Generators & Engines", body: "Standby generators must be tested weekly under load. Know the difference between diesel and natural gas generators, and understand automatic transfer switches." },
        { heading: "Pipes, Joints & Fittings", body: "Common materials: ductile iron (DI), PVC, HDPE, copper. Know the difference between push-on, mechanical, and flanged joints. Understand thrust restraint." },
        { heading: "Valves & Hydrants", body: "Gate valves (isolation), butterfly valves (throttling), PRVs (pressure reducing), check valves (backflow prevention). Know hydrant components: main valve, drain valve, breakaway flange." },
        { heading: "Measuring & Control Systems", body: "Flow meters (magnetic, ultrasonic, venturi), pressure gauges, level sensors, and basic SCADA concepts. Understand 4-20 mA signal loops." },
        { heading: "Cross-Connection & Backflow Prevention", body: "A cross-connection is any actual or potential connection between the potable water system and a non-potable source. Backflow preventers (DCVA, RPZ, air gap) protect against contamination." },
      ],
      examTips: [
        "Pump questions are common — know the difference between centrifugal and positive displacement, and understand what cavitation is and how to prevent it.",
        "Valve questions often ask about the correct valve type for a specific application — gate for isolation, butterfly for throttling, PRV for pressure control.",
        "Cross-connection questions focus on identifying hazards and selecting the correct backflow preventer for the degree of hazard.",
        "Know the components of a fire hydrant and what the drain valve does when the hydrant is closed.",
      ],
    },
    Processes: {
      title: "Processes",
      intro: "The Processes module is the main focus of the Water Distribution exam. It covers the day-to-day operation of a distribution system including: sources and characteristics of water, quality control and assurance, regulatory compliance, conveyance, pressure control, storage (reservoirs, elevated tanks, standpipes), corrosion control, metering, leak detection, excavation and repair, temporary service, fire flow requirements, swabbing, flushing systems, chlorination of pipe repairs, thawing frozen mains, sampling, and testing (chlorine residual, pH, temperature). This module accounts for 34 of the 80 questions on the Class 1 exam.",
      keyPoints: [
        { heading: "Sources & Water Characteristics", body: "Surface water vs. groundwater characteristics. Understand turbidity, hardness, pH, alkalinity, and how they affect distribution system operation and corrosion." },
        { heading: "Quality Control & Assurance", body: "Chlorine residual maintenance throughout the system. Understand the difference between free, combined, and total chlorine. Know minimum residuals under O. Reg. 170/03." },
        { heading: "Regulatory Compliance (O. Reg. 170/03)", body: "Know the sampling frequency requirements, adverse result response procedures, and notification requirements under Ontario's drinking water regulations." },
        { heading: "Conveyance & Pressure Control", body: "Pressure reducing valves (PRVs), pressure sustaining valves (PSVs), and pressure zones. Minimum system pressure is typically 140 kPa (20 psi) at the service connection." },
        { heading: "Storage Systems", body: "Reservoirs, elevated tanks, and standpipes. Understand turnover requirements, disinfection of new storage, and how storage affects system pressure and water age." },
        { heading: "Corrosion Control", body: "Internal corrosion (pH, alkalinity, Langelier Saturation Index) and external corrosion (cathodic protection, soil conditions). Know the difference between galvanic and stray current corrosion." },
        { heading: "Metering & Leak Detection", body: "Understand water audits, non-revenue water (NRW), and basic leak detection methods (listening devices, pressure testing, district metered areas)." },
        { heading: "Pipe Repair & Rehabilitation", body: "Excavation procedures, repair clamps, full-circle repair sleeves, and service saddles. Know the disinfection procedure for repaired mains (chlorination, flushing, sampling)." },
        { heading: "Flushing & Disinfection of Mains", body: "Unidirectional flushing (UDF) vs. conventional flushing. New main disinfection: continuous feed or slug method. Minimum chlorine contact time and residual requirements." },
        { heading: "Sampling & Testing", body: "Bacteriological sampling locations, chlorine residual testing (DPD colorimetric), pH testing, and temperature. Know the difference between routine and triggered sampling." },
      ],
      examTips: [
        "Regulatory questions focus on O. Reg. 170/03 — know the sampling frequencies and the 24-hour adverse result notification requirement.",
        "Chlorine residual questions are very common — know the minimum free chlorine residual (0.05 mg/L at the point of consumption) and how to calculate CT values.",
        "Pressure questions often involve calculating pressure at a point given elevation and flow — use the hydraulic grade line concept.",
        "New main disinfection questions focus on the chlorination procedure — know the minimum concentration (25 mg/L for 24 hours or 50 mg/L for 3 hours) and the required bacteriological clearance.",
      ],
    },
    Administration: {
      title: "Administration",
      intro: "The Administration module covers the administrative functions that support system operation. For Class 1, this includes basic record keeping, regulatory reporting, communication, and emergency response awareness. This module accounts for 3 of the 80 questions on the Class 1 exam.",
      keyPoints: [
        { heading: "Record Keeping & Documentation", body: "Operators must maintain accurate records of all operations, maintenance, and water quality results. Records must be kept for the periods specified in O. Reg. 170/03." },
        { heading: "Regulatory Reporting", body: "Annual reports, adverse result notifications, and summary reports to the Ministry. Know the difference between immediate notification and written report requirements." },
        { heading: "Emergency Response Basics", body: "Know your system's Emergency Response Plan (ERP). Understand the chain of notification for a water quality emergency and when to issue a Boil Water Advisory." },
        { heading: "Communication", body: "Effective communication with supervisors, the public, and regulatory agencies. Know how to document and report unusual events." },
      ],
      examTips: [
        "Administration questions at Class 1 are straightforward — focus on record keeping requirements and the adverse result notification process.",
        "Know the difference between a Boil Water Advisory (BWA) and a Do Not Use Advisory (DNUA) and when each is issued.",
      ],
    },
  },

  "class2-water-dist": {
    General: {
      title: "General",
      intro: "At Class 2, the General module builds on Class 1 foundations with more advanced math (pump calculations, chemical feed rates), deeper applied science, intermediate electrical and hydraulic concepts, and more complex safety requirements. This module accounts for 21 of the 80 questions on the Class 2 exam.",
      keyPoints: [
        { heading: "Intermediate Math & Calculations", body: "Pump power calculations (kW = Q × H × ρ × g / efficiency), chemical feed rates, and detention time calculations. Practice working backwards from a desired residual to a dose." },
        { heading: "Units of Expression", body: "Comfortable conversion between all metric and imperial units. Understand flow units (L/s, m³/d, USGPM) and how to convert between them." },
        { heading: "Applied Science & Chemistry", body: "Deeper understanding of water chemistry: carbonate system, Langelier Saturation Index (LSI), chlorine chemistry (breakpoint chlorination), and disinfection by-products (DBPs)." },
        { heading: "Electrical Concepts", body: "Three-phase power calculations, power factor, motor efficiency, and understanding variable frequency drives (VFDs). Know how to read motor performance curves." },
        { heading: "Hydraulic Concepts (Head Loss, Pump Curves)", body: "Hazen-Williams equation for friction loss, minor losses, system curves, and pump operating point (intersection of pump curve and system curve). Understand parallel and series pump operation." },
        { heading: "Safety & WHMIS", body: "Confined space entry procedures (Class 2 requires working knowledge), lockout/tagout procedures, and chemical handling safety for chlorine and other treatment chemicals." },
      ],
      examTips: [
        "Pump curve questions are common at Class 2 — know how to find the operating point and how parallel pumps affect flow vs. head.",
        "LSI calculations appear regularly — know the formula and what each component means (pH, temperature, TDS, calcium hardness, alkalinity).",
        "Breakpoint chlorination questions ask about the chlorine-to-ammonia ratio (10:1 by weight) and what happens at each stage of the breakpoint curve.",
        "VFD questions focus on energy savings and how VFDs affect pump performance — understand affinity laws.",
      ],
    },
    "Support Systems": {
      title: "Support Systems",
      intro: "At Class 2, operators must have intermediate knowledge of all support system equipment. This includes advanced pump selection and troubleshooting, motor controls and variable frequency drives, pipe materials and joining methods, valve types and operation, and backflow prevention programs. This module accounts for 10 of the 80 questions on the Class 2 exam.",
      keyPoints: [
        { heading: "Advanced Pump Operation & Troubleshooting", body: "Diagnosing pump problems: cavitation (noise, vibration, erosion), air binding, seal failures, bearing failures. Know how to read vibration analysis results and what they indicate." },
        { heading: "Motor Controls & VFDs", body: "Soft starters vs. VFDs — when to use each. VFDs follow the affinity laws: flow ∝ speed, head ∝ speed², power ∝ speed³. Understand harmonics and how to mitigate them." },
        { heading: "Pipe Materials & Joining", body: "Selection criteria for DI, PVC, HDPE, and steel pipe. Understand the difference between pressure class and pressure rating. Know which joints are appropriate for each material." },
        { heading: "Valve Types & Operation", body: "Gate, butterfly, ball, plug, check, PRV, PSV, and air release valves. Know the operating characteristics, maintenance requirements, and failure modes of each type." },
        { heading: "Backflow Prevention Programs", body: "Ontario's Cross-Connection Control (CCC) program requirements. Know the hazard classification system and which backflow preventer is required for each hazard level." },
      ],
      examTips: [
        "Pump troubleshooting questions give you symptoms and ask for the cause — cavitation is the most common answer for noise/vibration/erosion.",
        "VFD affinity law questions are calculation-based — if speed doubles, power increases by 8× (2³). Practice these.",
        "Backflow preventer selection questions: air gap for high hazard, RPZ for moderate-high hazard, DCVA for low-moderate hazard.",
      ],
    },
    Processes: {
      title: "Processes",
      intro: "The Processes module at Class 2 requires advanced knowledge of distribution system operations including hydraulic modeling basics, pressure zone management, water quality management throughout the distribution system, disinfection residual maintenance, cross-connection control programs, and comprehensive sampling and testing programs. This module accounts for 44 of the 80 questions on the Class 2 exam.",
      keyPoints: [
        { heading: "Hydraulic Modeling Basics", body: "Understanding what EPANET models and what it can predict. Know the inputs required (pipe lengths, diameters, roughness coefficients, demands, pump curves) and what outputs are useful." },
        { heading: "Pressure Zone Management", body: "Pressure reducing stations, pressure sustaining stations, and zone boundary valves. Understand how to maintain adequate pressure (140 kPa minimum) while preventing excessive pressure (700 kPa maximum)." },
        { heading: "Water Quality in Distribution", body: "Water age and its effect on chlorine residual and DBP formation. Understand how system design (dead ends, large mains, oversized storage) affects water quality." },
        { heading: "Disinfection Residual Maintenance", body: "Chlorine booster stations, rechlorination points, and how to calculate the required dose to maintain residual at the extremities of the system." },
        { heading: "Cross-Connection Control Programs", body: "Developing and implementing a CCC program: inventory, risk assessment, installation of backflow preventers, annual testing requirements, and record keeping." },
        { heading: "Comprehensive Sampling Programs", body: "Developing sampling plans that meet O. Reg. 170/03 requirements. Know how to select representative sampling locations and how to respond to adverse results." },
        { heading: "Corrosion Control Programs", body: "Developing a corrosion control program: monitoring (LSI, lead and copper sampling), treatment options (pH adjustment, orthophosphate dosing), and evaluation criteria." },
      ],
      examTips: [
        "Water age questions are common — understand that dead ends and oversized mains increase water age and reduce chlorine residual.",
        "Pressure zone questions often involve calculating the pressure at a specific point given the HGL elevation and pipe elevation.",
        "CCC program questions focus on the annual testing requirement for backflow preventers and the record keeping requirements.",
        "Corrosion control questions at Class 2 focus on the LSI and what adjustments to make when it indicates corrosive or scale-forming conditions.",
      ],
    },
    Administration: {
      title: "Administration",
      intro: "At Class 2, the Administration module expands to include management responsibilities, financial awareness, supervision basics, and more detailed regulatory reporting requirements. This module accounts for 5 of the 80 questions on the Class 2 exam.",
      keyPoints: [
        { heading: "Supervision & Management Basics", body: "Delegating tasks, conducting performance reviews, and managing a small team. Understand the difference between leadership and management styles." },
        { heading: "Financial Awareness", body: "Reading a budget, understanding operating vs. capital expenditures, and the basics of cost-benefit analysis for equipment purchases." },
        { heading: "Regulatory Reporting (O. Reg. 170/03)", body: "Annual reports, quarterly reports, and the requirements for reporting adverse results. Know the timelines for each type of report." },
        { heading: "Emergency Response Planning", body: "The components of an Emergency Response Plan (ERP): hazard identification, response procedures, contact lists, and recovery procedures. Know when to activate the ERP." },
        { heading: "Record Keeping Systems", body: "Electronic vs. paper records, retention requirements, and the importance of accurate and complete records for regulatory compliance and liability protection." },
      ],
      examTips: [
        "Administration questions at Class 2 often focus on the regulatory reporting requirements and the components of an ERP.",
        "Know the difference between a Boil Water Advisory (precautionary vs. mandatory) and when each is issued.",
      ],
    },
  },

  "class3-water-dist": {
    General: {
      title: "General",
      intro: "At Class 3, the General module requires advanced knowledge of hydraulics, complex calculations, and advanced electrical systems. The emphasis shifts from basic knowledge to application and problem-solving. This module accounts for 13 of the 80 questions on the Class 3 exam.",
      keyPoints: [
        { heading: "Advanced Hydraulic Calculations", body: "Complex network analysis, Hardy-Cross method concepts, and understanding how to interpret hydraulic model outputs. Know how to calculate water hammer pressure and how to mitigate it." },
        { heading: "Complex Math & Problem Solving", body: "Multi-step calculations involving pump efficiency, energy costs, chemical costs, and life-cycle cost analysis. Practice working through problems systematically." },
        { heading: "Advanced Electrical Systems", body: "Power factor correction, harmonic analysis, motor protection relays, and understanding electrical drawings for complex systems. Know how to calculate demand charges." },
        { heading: "Applied Science Applications", body: "Advanced water chemistry: disinfection by-product (DBP) formation and control, nitrification in distribution systems, and the impact of source water quality on distribution system management." },
      ],
      examTips: [
        "Water hammer questions are common at Class 3 — know the causes (rapid valve closure, pump trips), the formula for surge pressure, and mitigation strategies (surge tanks, slow-closing valves).",
        "Nitrification questions focus on the conditions that promote nitrification (low chloramine residual, warm temperatures, stagnant water) and how to control it.",
        "Electrical questions at Class 3 are application-level — be able to calculate power factor and understand its economic impact.",
      ],
    },
    "Support Systems": {
      title: "Support Systems",
      intro: "Class 3 operators must have advanced knowledge of all support systems, including the ability to evaluate equipment performance, specify replacement equipment, and manage maintenance programs. This module accounts for 9 of the 80 questions on the Class 3 exam.",
      keyPoints: [
        { heading: "Equipment Performance Evaluation", body: "Pump efficiency testing, motor efficiency testing, and comparing actual performance to design specifications. Know how to use pump test data to identify deteriorating performance." },
        { heading: "Pump System Analysis", body: "System curve analysis, identifying the effects of pipe aging on system curves, and evaluating options for system optimization (impeller trimming, VFDs, parallel pumping)." },
        { heading: "Electrical System Management", body: "Power quality monitoring, demand management, and energy audits. Understand how to identify and correct power quality problems (harmonics, voltage unbalance)." },
        { heading: "Maintenance Program Management", body: "Developing preventive maintenance (PM) programs, condition monitoring (vibration analysis, oil analysis, thermography), and reliability-centered maintenance (RCM) concepts." },
        { heading: "SCADA & Instrumentation", body: "Advanced SCADA configuration, alarm management, historian data analysis, and cybersecurity basics for industrial control systems." },
      ],
      examTips: [
        "Pump efficiency questions require you to calculate wire-to-water efficiency from pump test data — know the formula: η = (Q × H × ρ × g) / (input power).",
        "RCM questions focus on the decision logic: run-to-failure vs. time-based PM vs. condition-based monitoring — know when each is appropriate.",
        "SCADA cybersecurity questions focus on network segmentation, access control, and patch management.",
      ],
    },
    Processes: {
      title: "Processes",
      intro: "At Class 3, the Processes module requires advanced knowledge of distribution system management including hydraulic modeling, water quality management programs, asset management basics, and advanced troubleshooting. This module accounts for 49 of the 80 questions on the Class 3 exam.",
      keyPoints: [
        { heading: "Advanced Hydraulic Modeling", body: "EPANET model calibration, extended period simulation (EPS), fire flow analysis, and using model results to identify system deficiencies and evaluate improvement options." },
        { heading: "Water Quality Management Programs", body: "Developing a distribution system water quality monitoring program: parameter selection, sampling frequency, location selection, data analysis, and corrective action procedures." },
        { heading: "Asset Management Basics", body: "Asset inventory, condition assessment, risk assessment (probability of failure × consequence of failure), and developing a prioritized capital replacement plan." },
        { heading: "Advanced Troubleshooting", body: "Systematic approach to diagnosing complex distribution system problems: pressure complaints, water quality complaints, high water loss, and recurring main breaks." },
        { heading: "Pressure Management Programs", body: "Advanced pressure management: pressure zoning, pressure reducing valve optimization, and using pressure management to reduce main break frequency and water loss." },
        { heading: "Water Loss Management", body: "Water audit methodology (IWA water balance), performance indicators (ILI, CARL), active leakage control (ALC) programs, and economic level of leakage (ELL) concepts." },
      ],
      examTips: [
        "Asset management questions at Class 3 focus on risk assessment — know how to calculate risk score (probability × consequence) and how to use it to prioritize work.",
        "Water loss questions use the IWA water balance — know the components: system input volume, authorized consumption (metered + unmetered), apparent losses, and real losses.",
        "Hydraulic modeling questions focus on model calibration — know what parameters are calibrated (roughness coefficients, demands) and what data is needed.",
        "Pressure management questions focus on the relationship between pressure and leakage — higher pressure = higher leak rates. Know the N1 exponent concept.",
      ],
    },
    Administration: {
      title: "Administration",
      intro: "At Class 3, the Administration module covers management, supervision, financial management, regulatory compliance programs, and emergency management planning. This module accounts for 9 of the 80 questions on the Class 3 exam.",
      keyPoints: [
        { heading: "Staff Management & Supervision", body: "Performance management, progressive discipline, training needs assessment, and succession planning. Understand employment law basics relevant to utilities." },
        { heading: "Financial Management", body: "Budget development, variance analysis, rate setting basics, and capital planning. Understand the difference between operating and capital budgets and how they interact." },
        { heading: "Regulatory Compliance Programs", body: "Developing and managing a regulatory compliance program: identifying applicable regulations, tracking compliance, managing non-compliance events, and continuous improvement." },
        { heading: "Emergency Management Planning", body: "Developing and maintaining an Emergency Response Plan (ERP): hazard and vulnerability assessment, response procedures, mutual aid agreements, and exercise programs." },
        { heading: "Public Communication", body: "Communicating with the public during normal operations and emergencies. Know how to issue a Boil Water Advisory and what information must be included." },
      ],
      examTips: [
        "Financial management questions at Class 3 focus on budget development and rate setting — understand the concept of full-cost pricing for water services.",
        "Emergency management questions focus on the components of an ERP and the incident command system (ICS) structure.",
      ],
    },
  },

  "class4-water-dist": {
    General: {
      title: "General",
      intro: "At Class 4, the General module focuses on advanced applications of hydraulics, complex system analysis, and leadership in technical areas. Class 4 exams do not include basic math questions. This module accounts for 13 of the 80 questions on the Class 4 exam.",
      keyPoints: [
        { heading: "Advanced Hydraulic Analysis", body: "Transient analysis (water hammer), complex network modeling, and system optimization. Understand the limitations of hydraulic models and how to validate model results against field measurements." },
        { heading: "Complex System Calculations", body: "Life-cycle cost analysis, energy optimization calculations, and economic analysis of infrastructure investments. Know how to present technical analysis to non-technical decision-makers." },
        { heading: "Advanced Electrical Applications", body: "Power system reliability, harmonic mitigation strategies, energy management systems (EMS), and demand response programs. Understand utility rate structures and how to minimize energy costs." },
        { heading: "Technical Leadership", body: "Providing technical direction to engineering consultants, reviewing technical specifications, and making strategic decisions about technology adoption and system design." },
      ],
      examTips: [
        "Class 4 General questions test application and synthesis — you will not be asked to perform basic calculations but to interpret results and make decisions.",
        "Technical leadership questions focus on the operator's role in the design and construction process — know when to involve engineering consultants and what to look for in technical reviews.",
        "Energy management questions focus on demand management strategies and how to evaluate the cost-effectiveness of energy efficiency investments.",
      ],
    },
    "Support Systems": {
      title: "Support Systems",
      intro: "Class 4 operators must be able to evaluate, specify, and oversee all support systems at an advanced level, including capital planning for infrastructure replacement and advanced SCADA systems. This module accounts for 8 of the 80 questions on the Class 4 exam.",
      keyPoints: [
        { heading: "Capital Planning for Infrastructure", body: "Developing 10-20 year capital replacement plans based on asset condition, risk, and financial constraints. Know how to prioritize capital investments using risk-based asset management." },
        { heading: "Advanced SCADA & Automation", body: "SCADA system architecture, cybersecurity frameworks (NIST, ICS-CERT), and evaluating SCADA upgrade options. Understand the integration of SCADA with GIS and asset management systems." },
        { heading: "Equipment Lifecycle Management", body: "Total cost of ownership (TCO) analysis, end-of-life planning, and managing equipment obsolescence. Know how to develop equipment replacement strategies that minimize risk." },
        { heading: "System-Wide Equipment Evaluation", body: "Conducting system-wide equipment audits, identifying systemic equipment problems, and developing organization-wide maintenance standards and specifications." },
      ],
      examTips: [
        "Capital planning questions focus on the prioritization process — know how to use risk scores (probability × consequence) to rank capital projects.",
        "SCADA cybersecurity questions at Class 4 focus on governance and policy — know the key elements of an ICS cybersecurity program.",
      ],
    },
    Processes: {
      title: "Processes",
      intro: "At Class 4, the Processes module requires mastery of all distribution system processes including advanced hydraulic modeling, system-wide water quality management, risk-based asset management, and strategic planning. This module accounts for 49 of the 80 questions on the Class 4 exam.",
      keyPoints: [
        { heading: "Advanced Hydraulic Modeling (EPANET)", body: "Master model development, calibration, and application for master planning, fire flow analysis, and water quality modeling. Know how to use model results to support capital investment decisions." },
        { heading: "System-Wide Water Quality Management", body: "Developing and managing a comprehensive water quality management program: source-to-tap approach, DBP formation and control, nitrification prevention, and lead and copper control." },
        { heading: "Risk-Based Asset Management", body: "ISO 55000 asset management principles, risk assessment methodologies, and developing asset management plans (AMPs) that meet regulatory requirements." },
        { heading: "Strategic Infrastructure Planning", body: "Long-range infrastructure planning: population growth projections, demand forecasting, system capacity analysis, and developing master plans that align with official plans." },
        { heading: "Water Loss Control Programs", body: "Developing and managing a comprehensive water loss control program: water audits, active leakage control, pressure management, and pipe replacement programs targeting high-break areas." },
        { heading: "DWQMS Implementation", body: "Drinking Water Quality Management Standard (DWQMS) requirements: quality management system (QMS) elements, operational plan development, management review, and continual improvement." },
      ],
      examTips: [
        "DWQMS questions are unique to Class 4 — know the 21 elements of the DWQMS operational plan and the role of the Qualified Person in Charge (QPIC).",
        "Strategic planning questions focus on the master planning process — know the typical planning horizon (20 years), the key inputs (population projections, demand forecasts), and the outputs (capital program).",
        "Risk-based asset management questions focus on ISO 55000 concepts — know the difference between an asset management policy, strategy, objectives, and plan.",
        "Water quality modeling questions focus on using EPANET's water quality module to predict chlorine residuals and water age throughout the system.",
      ],
    },
    Administration: {
      title: "Administration",
      intro: "At Class 4, the Administration module covers senior management responsibilities including organizational management, strategic planning, financial management, regulatory leadership, and emergency management. This module accounts for 10 of the 80 questions on the Class 4 exam.",
      keyPoints: [
        { heading: "Organizational Management", body: "Organizational design, change management, and building a high-performance culture. Understand the operator's role in strategic human resources management." },
        { heading: "Strategic Planning", body: "Developing and implementing strategic plans for water utilities: vision, mission, values, strategic objectives, and performance measures. Know how to align operational plans with strategic plans." },
        { heading: "Financial Management & Budgeting", body: "Multi-year financial planning, rate setting, debt management, and financial reporting. Understand the financial sustainability requirements for water utilities under Ontario's Safe Drinking Water Act." },
        { heading: "Regulatory Leadership & DWQMS", body: "Leading a regulatory compliance culture, managing relationships with the Ministry of the Environment, Conservation and Parks (MECP), and maintaining the DWQMS operational plan." },
        { heading: "Emergency Management Programs", body: "Developing and maintaining organization-wide emergency management programs: hazard identification, risk assessment, business continuity planning, and post-incident review." },
        { heading: "Stakeholder Communication", body: "Communicating with elected officials, the public, media, and regulatory agencies. Know how to develop a communications plan for both routine operations and emergencies." },
      ],
      examTips: [
        "DWQMS questions at Class 4 Administration focus on the management review process and the role of the owner vs. the operating authority.",
        "Financial management questions focus on the concept of full-cost pricing and how to develop a sustainable rate structure.",
        "Strategic planning questions focus on the alignment between strategic plans and operational plans — know how KPIs are used to track progress.",
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ONTARIO WASTEWATER COLLECTION
  // ═══════════════════════════════════════════════════════════════════════════

  "class1-wastewater-coll": {
    "Operate Equipment": {
      title: "Operate Equipment",
      intro: "This module covers the operation of all equipment found in a wastewater collection system. Class 1 operators must be able to operate pumps and motors, flow monitoring equipment, safety equipment, and basic SCADA controls. Understanding normal operating ranges and recognizing abnormal conditions is essential. This module accounts for 15% of the Class 1 exam.",
      keyPoints: [
        { heading: "Pump & Motor Operation", body: "Starting and stopping pumps, monitoring pump performance (flow, pressure, current draw), and recognizing signs of pump problems (cavitation, overheating, vibration)." },
        { heading: "Flow Monitoring Equipment", body: "Types of flow meters used in collection systems: magnetic, ultrasonic, and weir/flume. Know how to read flow data and identify abnormal flow patterns (I/I events)." },
        { heading: "Safety Equipment Operation", body: "Gas detectors (H₂S, CH₄, O₂ deficiency), confined space entry equipment, and personal protective equipment (PPE). Know how to test and calibrate gas detectors." },
        { heading: "Basic Controls & Instrumentation", body: "Float switches, pressure transducers, level sensors, and basic SCADA/telemetry. Know how to interpret control panel displays and respond to alarms." },
        { heading: "Normal vs. Abnormal Operating Conditions", body: "Understanding normal wet well levels, flow rates, and pump cycling. Recognize abnormal conditions: high wet well level, pump failure, power outage, and overflow events." },
      ],
      examTips: [
        "Gas detection questions are very common — know the hazardous concentrations of H₂S (10 ppm TLV-TWA, 15 ppm TLV-STEL, IDLH 100 ppm) and CH₄ (LEL 5%, UEL 15%).",
        "Pump operation questions focus on recognizing abnormal conditions — know the symptoms of cavitation, air binding, and impeller wear.",
        "SCADA questions at Class 1 are conceptual — understand what SCADA does and how to respond to common alarms.",
      ],
    },
    "Evaluate & Maintain Equipment": {
      title: "Evaluate & Maintain Equipment",
      intro: "Class 1 operators must understand how to evaluate equipment condition and perform basic maintenance. This includes inspecting equipment for abnormal conditions, performing preventive maintenance on pumps, motors, and inspection equipment (CCTV, vacuum testing), and understanding the difference between preventive and corrective maintenance. This module accounts for 10% of the Class 1 exam.",
      keyPoints: [
        { heading: "Equipment Condition Inspection", body: "Visual inspection of pumps, motors, valves, and piping. Know what to look for: oil leaks, unusual noise, vibration, corrosion, and signs of wear." },
        { heading: "Preventive vs. Corrective Maintenance", body: "Preventive maintenance (PM) is scheduled and based on time or usage. Corrective maintenance is unplanned and reactive. PM reduces the frequency and cost of corrective maintenance." },
        { heading: "Pump & Motor Maintenance", body: "Lubrication schedules, mechanical seal inspection and replacement, impeller inspection, and motor insulation testing (megger testing). Know the basic PM tasks for submersible vs. dry-pit pumps." },
        { heading: "Inspection Equipment Maintenance", body: "CCTV camera maintenance, cleaning and calibrating flow meters, and maintaining vacuum testing equipment. Know how to recognize when inspection equipment needs calibration." },
        { heading: "Safety Equipment Maintenance", body: "Testing and calibrating gas detectors (bump test vs. full calibration), inspecting confined space entry equipment, and maintaining PPE. Know the required testing frequency for each type of safety equipment." },
      ],
      examTips: [
        "Gas detector maintenance questions focus on the difference between a bump test (functional check) and a full calibration — know when each is required.",
        "Pump maintenance questions focus on the most common PM tasks: lubrication, seal inspection, and impeller condition assessment.",
        "Know the difference between preventive, predictive, and corrective maintenance — and when each is appropriate.",
      ],
    },
    "Maintain & Restore Collection System": {
      title: "Maintain & Restore Collection System",
      intro: "This module covers the cleaning, inspection, and repair of sewer lines and collection system components. Class 1 operators must understand hydraulic cleaning methods (balling, flushing, poly pigging), physical inspection techniques, pipe fittings and joining methods, and basic sewer line repair. This module accounts for 15% of the Class 1 exam.",
      keyPoints: [
        { heading: "Hydraulic Cleaning (Balling, Flushing, Poly Pigging)", body: "Balling uses a rubber ball slightly smaller than the pipe to create a hydraulic head. Flushing uses high-velocity water. Poly pigging uses foam pigs. Know when each method is appropriate." },
        { heading: "Physical Inspection of Sewers", body: "CCTV inspection (most common), manhole inspection, and smoke testing. Know the NASSCO PACP defect coding system for CCTV inspection results." },
        { heading: "Pipe Fittings & Joining Methods", body: "Common sewer pipe materials: PVC, concrete, clay, HDPE. Know the joining methods for each material and the appropriate use of couplings, adapters, and repair clamps." },
        { heading: "Basic Sewer Line Repair", body: "Point repair procedures: excavation, pipe removal, replacement, and backfill. Know the safety requirements for excavation (shoring, sloping, benching) and the trench rescue procedures." },
        { heading: "Excavation & Repair Procedures", body: "Ontario Occupational Health and Safety Act (OHSA) requirements for excavation: competent worker, soil classification, and protective systems. Know the minimum requirements for each soil type." },
      ],
      examTips: [
        "Excavation safety questions are very common — know the OHSA requirements for Type 1, 2, and 3 soils and the required protective systems.",
        "CCTV inspection questions focus on the NASSCO PACP coding system — know the most common defect codes (fracture, crack, joint offset, root intrusion).",
        "Cleaning method questions ask you to select the appropriate method for a given situation — know the limitations of each method.",
      ],
    },
    "Maintain Lift Stations": {
      title: "Maintain Lift Stations",
      intro: "Class 1 operators must understand lift station operation and basic maintenance. This includes wet well management, valve operation, lift station piping, wet well cleaning, and emergency bypass pumping procedures. This module accounts for 10% of the Class 1 exam.",
      keyPoints: [
        { heading: "Wet Well Operation & Management", body: "Wet well level control (float switches, level transducers), pump cycling, and managing wet well detention time to minimize septicity and H₂S generation." },
        { heading: "Lift Station Valve Operation", body: "Isolation valves (gate, plug), check valves (swing, ball, duckbill), and air release valves. Know the purpose of each valve and how to operate them safely." },
        { heading: "Lift Station Piping & Fittings", body: "Wet well piping configurations, force main connections, and the purpose of the valve vault. Know the common materials used for lift station piping and their advantages." },
        { heading: "Wet Well Cleaning", body: "Procedures for cleaning a wet well: isolation, dewatering, confined space entry, high-pressure washing, and waste disposal. Know the safety requirements for wet well entry." },
        { heading: "Emergency Bypass Pumping", body: "Setting up a portable pump for emergency bypass: suction hose sizing, discharge hose routing, and ensuring adequate flow to prevent SSOs. Know when to activate the emergency bypass plan." },
      ],
      examTips: [
        "Wet well management questions focus on controlling detention time — long detention times promote septicity and H₂S generation, which corrodes concrete and creates safety hazards.",
        "Emergency bypass questions focus on the procedure and the sizing of the bypass pump — the pump must be able to handle peak wet weather flow.",
        "Confined space entry questions for wet well cleaning focus on the permit requirements and the atmospheric testing sequence (O₂ first, then combustibles, then toxics).",
      ],
    },
    "Monitor, Evaluate & Adjust Collection System": {
      title: "Monitor, Evaluate & Adjust Collection System",
      intro: "This is the largest module on the Class 1 exam, covering system monitoring and performance evaluation. Topics include flow monitoring, identifying inflow and infiltration (I/I), basic hydraulic principles, overflow monitoring, and regulatory compliance monitoring. This module accounts for 35% of the Class 1 exam.",
      keyPoints: [
        { heading: "Flow Monitoring", body: "Temporary and permanent flow monitoring: meter types, installation requirements, and data interpretation. Know how to identify wet weather flow events in flow data." },
        { heading: "Inflow & Infiltration (I/I) Identification", body: "Inflow: direct connection of stormwater to sanitary sewer (roof drains, foundation drains, catch basins). Infiltration: groundwater entering through cracks and joints. Know how to distinguish between them." },
        { heading: "Basic Hydraulic Principles", body: "Manning's equation for open channel flow (Q = (1/n) × A × R^(2/3) × S^(1/2)), full-pipe vs. partial-pipe flow, and the concept of hydraulic capacity." },
        { heading: "Overflow Monitoring", body: "Sanitary sewer overflow (SSO) monitoring requirements under O. Reg. 170/03. Know the reporting requirements for SSOs and how to document overflow events." },
        { heading: "Water Quality Monitoring", body: "Monitoring for H₂S in collection system air spaces, wet well atmospheric monitoring, and understanding the relationship between septicity and H₂S generation." },
        { heading: "Regulatory Compliance Monitoring", body: "O. Reg. 170/03 requirements for collection systems: overflow reporting, spill reporting, and the Environmental Activity and Sector Registry (EASR) requirements." },
      ],
      examTips: [
        "Manning's equation questions are common — know the formula and what each variable represents. Practice calculating flow for a given pipe diameter, slope, and roughness coefficient.",
        "I/I questions focus on identification methods — smoke testing identifies inflow, CCTV identifies infiltration through cracks and joints.",
        "SSO reporting questions focus on the O. Reg. 170/03 requirements — know the 24-hour notification requirement and what information must be reported.",
        "H₂S monitoring questions focus on the hazardous concentration levels and the required monitoring frequency in confined spaces.",
      ],
    },
    "Security, Safety & Administrative Procedures": {
      title: "Security, Safety & Administrative Procedures",
      intro: "This module covers safety procedures, administrative functions, and security requirements. Class 1 operators must understand confined space entry procedures, traffic control, WHMIS, personal protective equipment, emergency response, spill response, regulatory reporting, and record keeping. This module accounts for 15% of the Class 1 exam.",
      keyPoints: [
        { heading: "Confined Space Entry Procedures", body: "Ontario OHSA Confined Spaces regulation (O. Reg. 632/05): definition of confined space, permit requirements, atmospheric testing, ventilation, rescue procedures, and attendant responsibilities." },
        { heading: "Traffic Control", body: "Ontario Traffic Manual Book 7 requirements for working in or near roadways. Know the requirements for flagging, signage, and traffic control plans." },
        { heading: "WHMIS & PPE", body: "WHMIS 2015 hazard classes, SDS sections, and PPE selection for common collection system hazards (H₂S, sewage, chemicals). Know the hierarchy of controls." },
        { heading: "Emergency Response", body: "Emergency response procedures for common collection system emergencies: SSO, lift station failure, main break, and worker injury. Know the chain of notification." },
        { heading: "Spill Response Procedures", body: "Ontario Environmental Protection Act (EPA) spill reporting requirements: immediate notification to the Ministry Spills Action Centre (SAC) at 1-800-268-6060." },
        { heading: "Regulatory Reporting & Record Keeping", body: "O. Reg. 170/03 record keeping requirements for collection systems. Know what records must be kept, for how long, and who has access to them." },
      ],
      examTips: [
        "Confined space questions are very common — know the O. Reg. 632/05 requirements: who can enter, what testing is required, and what the attendant's responsibilities are.",
        "Spill reporting questions focus on the immediate notification requirement — operators must call the SAC immediately upon becoming aware of a spill.",
        "WHMIS questions focus on the hazard classes and SDS sections — know the 9 physical hazard classes and the 3 health hazard classes.",
        "Traffic control questions focus on the minimum requirements for working in a roadway — know when a traffic control plan is required.",
      ],
    },
  },

  "class2-wastewater-coll": {
    "Operate Equipment": {
      title: "Operate Equipment",
      intro: "At Class 2, operators must have application-level knowledge of all collection system equipment. This includes operating more complex pump systems, telemetry and SCADA systems, and understanding equipment interactions within the system. This module accounts for 15% of the Class 2 exam.",
      keyPoints: [
        { heading: "Advanced Pump System Operation", body: "Operating multiple pump configurations (parallel, series), understanding pump interaction effects, and optimizing pump selection for varying flow conditions." },
        { heading: "Telemetry & SCADA Operation", body: "Interpreting SCADA displays, responding to alarms, and using historical data to identify trends and anomalies. Know how to use SCADA data for operational decision-making." },
        { heading: "Equipment Interaction & System Balance", body: "Understanding how changes to one part of the system affect other components. Know how to balance flows across multiple lift stations and force mains." },
        { heading: "Flow Control Equipment", body: "Flow control gates, overflow weirs, and flow equalization basins. Know how to operate these devices to manage wet weather flows and prevent SSOs." },
        { heading: "Generator Operation", body: "Standby generator testing procedures, automatic transfer switch (ATS) operation, and generator load management. Know the required testing frequency and what to check during a generator test." },
      ],
      examTips: [
        "Parallel pump operation questions focus on the combined pump curve — when pumps operate in parallel, flow increases but head stays the same.",
        "SCADA questions at Class 2 focus on using SCADA data for operational decisions — know how to identify I/I events, pump failures, and flow anomalies from SCADA data.",
        "Generator questions focus on the testing requirements and the ATS operation — know the required weekly test duration and what constitutes a successful test.",
      ],
    },
    "Evaluate & Maintain Equipment": {
      title: "Evaluate & Maintain Equipment",
      intro: "Class 2 operators must be able to evaluate equipment performance and develop maintenance programs. This includes analyzing pump performance curves, evaluating CCTV inspection results, and managing preventive maintenance schedules. This module accounts for 15% of the Class 2 exam.",
      keyPoints: [
        { heading: "Pump Performance Curve Analysis", body: "Plotting actual pump performance against the design curve to identify performance degradation. Know how to calculate pump efficiency from field measurements and compare to design efficiency." },
        { heading: "CCTV Inspection Evaluation", body: "Interpreting NASSCO PACP inspection reports, prioritizing defects for repair, and developing rehabilitation recommendations based on inspection results." },
        { heading: "Maintenance Program Development", body: "Developing a preventive maintenance (PM) program: identifying critical equipment, establishing PM tasks and frequencies, and tracking PM completion." },
        { heading: "Equipment Performance Trending", body: "Using maintenance management system (CMMS) data to identify equipment with increasing failure rates or maintenance costs. Know how to use trending data to justify equipment replacement." },
        { heading: "Root Cause Analysis", body: "Systematic approach to identifying the root cause of equipment failures: 5-Why analysis, fault tree analysis, and fishbone diagrams. Know how to document and communicate root cause findings." },
      ],
      examTips: [
        "Pump performance curve questions require you to calculate efficiency from field data — know the formula and what a significant efficiency loss indicates.",
        "CCTV evaluation questions focus on defect prioritization — know the PACP defect grades and how they are used to prioritize rehabilitation.",
        "Root cause analysis questions focus on the 5-Why methodology — practice applying it to common collection system equipment failures.",
      ],
    },
    "Maintain & Restore Collection System": {
      title: "Maintain & Restore Collection System",
      intro: "At Class 2, operators must understand advanced cleaning and rehabilitation techniques including CCTV inspection and condition assessment, sewer cleaning methods, and trenchless rehabilitation technologies. This module accounts for 15% of the Class 2 exam.",
      keyPoints: [
        { heading: "CCTV Inspection & Condition Assessment", body: "Developing a CCTV inspection program: inspection frequency, prioritization, and using inspection results to develop a condition assessment database." },
        { heading: "Advanced Sewer Cleaning Methods", body: "High-velocity cleaning (jetting), mechanical cleaning (rodding, bucket machines), and chemical cleaning. Know when each method is appropriate and the safety requirements for each." },
        { heading: "Trenchless Rehabilitation Technologies", body: "Cured-in-place pipe (CIPP) lining, slip lining, pipe bursting, and spray-applied coatings. Know the advantages and limitations of each technology and when each is appropriate." },
        { heading: "Pipe Lining & Sliplining", body: "CIPP installation procedure: cleaning, CCTV, liner installation, curing, and final CCTV. Know the quality control requirements and the common defects to look for in the final inspection." },
        { heading: "Sewer Replacement Planning", body: "Developing a sewer replacement program: condition assessment, risk assessment, prioritization, and cost estimation. Know how to use GIS data to support replacement planning." },
      ],
      examTips: [
        "Trenchless rehabilitation questions focus on selecting the appropriate technology — CIPP for structural rehabilitation, slip lining for capacity reduction, pipe bursting for capacity increase.",
        "CIPP installation questions focus on the quality control requirements — know the minimum wall thickness calculation and the required post-installation inspection.",
        "Sewer replacement prioritization questions use risk assessment — know how to combine condition score and consequence of failure to calculate risk.",
      ],
    },
    "Maintain Lift Stations": {
      title: "Maintain Lift Stations",
      intro: "Class 2 operators must have advanced knowledge of lift station management including wet well hydraulics, force main operation, pump selection, and lift station optimization. This module accounts for 10% of the Class 2 exam.",
      keyPoints: [
        { heading: "Wet Well Hydraulics", body: "Calculating wet well volume, detention time, and pump cycling frequency. Know how to size a wet well to achieve the desired pump cycling frequency (typically 4-6 starts per hour)." },
        { heading: "Force Main Operation & Maintenance", body: "Force main flushing, air release valve maintenance, and force main condition assessment. Know the causes and consequences of force main failures and how to prevent them." },
        { heading: "Pump Selection & Sizing", body: "Selecting a pump for a given application: calculating the total dynamic head (TDH), selecting a pump that operates near its BEP, and specifying the motor size." },
        { heading: "Lift Station Optimization", body: "Optimizing pump scheduling to minimize energy costs, using VFDs to match pump output to inflow, and managing wet well levels to minimize H₂S generation." },
        { heading: "Electrical Systems at Lift Stations", body: "Motor control centers (MCCs), automatic transfer switches (ATSs), and generator systems. Know how to interpret electrical drawings and troubleshoot common electrical problems." },
      ],
      examTips: [
        "Wet well sizing questions require you to calculate the required volume for a given pump cycling frequency — know the formula: V = Q × (1 - Q/Qmax) / (4 × n), where n is the maximum starts per hour.",
        "TDH calculation questions require you to add static head, friction losses, and minor losses — know the Hazen-Williams equation for friction loss in force mains.",
        "Pump selection questions focus on selecting a pump that operates near its BEP — know how to read a pump curve and identify the BEP.",
      ],
    },
    "Monitor, Evaluate & Adjust Collection System": {
      title: "Monitor, Evaluate & Adjust Collection System",
      intro: "At Class 2, this module covers advanced system monitoring including hydraulic analysis, I/I quantification, sewer system evaluation surveys (SSES), and combined sewer overflow (CSO) monitoring. This module accounts for 30% of the Class 2 exam.",
      keyPoints: [
        { heading: "Hydraulic Analysis", body: "Using flow monitoring data to calculate system hydraulic capacity, identify capacity constraints, and evaluate the impact of I/I on system performance." },
        { heading: "I/I Quantification & Control", body: "Quantifying I/I using flow monitoring data: base flow, dry weather flow (DWF), and wet weather flow (WWF). Know how to calculate the I/I component and compare it to regulatory benchmarks." },
        { heading: "Sewer System Evaluation Surveys (SSES)", body: "SSES methodology: flow monitoring, smoke testing, dye testing, and CCTV inspection. Know how to use SSES results to develop an I/I reduction program." },
        { heading: "CSO Monitoring & Reporting", body: "Combined sewer overflow (CSO) monitoring requirements, long-term control plan (LTCP) requirements, and reporting to the Ministry. Know the difference between a CSO and an SSO." },
        { heading: "Flow Data Analysis", body: "Analyzing flow monitoring data: diurnal patterns, wet weather response, and identifying anomalies. Know how to use flow data to calculate system capacity and identify I/I sources." },
        { heading: "System Performance Evaluation", body: "Key performance indicators (KPIs) for collection systems: SSO frequency, I/I ratio, overflow volume, and pipe condition index. Know how to calculate and interpret each KPI." },
      ],
      examTips: [
        "I/I quantification questions require you to calculate the I/I component from flow monitoring data — know the formula: I/I = WWF - DWF.",
        "SSES questions focus on the methodology — know the sequence of investigations and what each technique identifies.",
        "CSO vs. SSO questions focus on the definition — CSOs occur in combined sewers (sanitary + storm), SSOs occur in sanitary sewers only.",
        "KPI questions focus on the calculation and interpretation — know how to calculate the I/I ratio and what it means for system performance.",
      ],
    },
    "Security, Safety & Administrative Procedures": {
      title: "Security, Safety & Administrative Procedures",
      intro: "At Class 2, the administrative module expands to include regulatory reporting programs, spill response planning, and more complex safety program management. This module accounts for 15% of the Class 2 exam.",
      keyPoints: [
        { heading: "Regulatory Reporting Programs", body: "Developing a regulatory reporting program: identifying all reporting requirements, establishing tracking systems, and ensuring timely and accurate reporting." },
        { heading: "Spill Response Planning", body: "Developing a spill response plan: identifying potential spill scenarios, establishing response procedures, training staff, and conducting exercises." },
        { heading: "Safety Program Management", body: "Developing and managing a safety program: hazard identification, risk assessment, control measures, training, and incident investigation." },
        { heading: "Emergency Response Plans", body: "Developing an Emergency Response Plan (ERP) for a collection system: identifying critical assets, establishing response procedures, and conducting tabletop exercises." },
        { heading: "Record Keeping Systems", body: "Developing a record keeping system that meets regulatory requirements: identifying required records, establishing retention periods, and ensuring records are accessible for inspection." },
        { heading: "Public Communication", body: "Communicating with the public during normal operations and emergencies. Know how to develop a public notification plan for SSO events." },
      ],
      examTips: [
        "Safety program management questions focus on the hierarchy of controls — elimination, substitution, engineering controls, administrative controls, PPE.",
        "Spill response planning questions focus on the components of a spill response plan and the immediate notification requirement.",
        "Record keeping questions focus on the retention requirements — know how long each type of record must be kept under O. Reg. 170/03.",
      ],
    },
  },

  "class3-wastewater-coll": {
    "Operate Equipment": {
      title: "Operate Equipment",
      intro: "At Class 3, operators must have analysis-level knowledge of all collection system equipment, including the ability to evaluate equipment performance, optimize system operations, and make decisions about equipment upgrades. This module accounts for 15% of the Class 3 exam.",
      keyPoints: [
        { heading: "Equipment Performance Analysis", body: "Analyzing equipment performance data to identify trends, predict failures, and optimize operations. Know how to use vibration analysis, oil analysis, and thermography data." },
        { heading: "System Optimization", body: "Optimizing collection system operations to minimize energy costs, reduce SSO risk, and extend equipment life. Know how to use SCADA data to identify optimization opportunities." },
        { heading: "Equipment Upgrade Decisions", body: "Evaluating options for equipment upgrades: cost-benefit analysis, life-cycle cost analysis, and risk assessment. Know how to develop a business case for an equipment upgrade." },
        { heading: "Advanced SCADA & Automation", body: "Advanced SCADA configuration, alarm rationalization, and using SCADA data for predictive maintenance. Know how to evaluate SCADA upgrade options and develop SCADA specifications." },
        { heading: "Energy Efficiency Management", body: "Developing an energy management program for a collection system: energy audits, identifying efficiency opportunities, implementing improvements, and measuring results." },
      ],
      examTips: [
        "Equipment upgrade decision questions focus on life-cycle cost analysis — know how to calculate net present value (NPV) and use it to compare alternatives.",
        "Energy management questions focus on the energy audit process and the most common energy efficiency opportunities in collection systems (VFDs, pump optimization).",
        "Predictive maintenance questions focus on condition monitoring technologies — know what vibration analysis, oil analysis, and thermography can detect.",
      ],
    },
    "Evaluate & Maintain Equipment": {
      title: "Evaluate & Maintain Equipment",
      intro: "Class 3 operators must be able to conduct comprehensive equipment evaluations, develop asset management strategies, and oversee complex maintenance programs. This module accounts for 15% of the Class 3 exam.",
      keyPoints: [
        { heading: "Comprehensive Equipment Evaluation", body: "Conducting a comprehensive equipment evaluation: performance testing, condition assessment, and risk assessment. Know how to use evaluation results to develop a replacement plan." },
        { heading: "Asset Management Strategies", body: "Developing asset management strategies: run-to-failure, time-based replacement, condition-based replacement, and risk-based replacement. Know when each strategy is appropriate." },
        { heading: "Maintenance Program Oversight", body: "Overseeing a maintenance program: setting performance targets, monitoring KPIs, conducting audits, and implementing continuous improvement." },
        { heading: "Life Cycle Cost Analysis", body: "Calculating the life-cycle cost of an asset: capital cost, operating cost, maintenance cost, and end-of-life cost. Know how to use LCC analysis to compare alternatives." },
        { heading: "Reliability-Centered Maintenance", body: "RCM methodology: identifying functions, functional failures, failure modes, and failure effects. Know how to use RCM analysis to develop a maintenance program." },
      ],
      examTips: [
        "Asset management strategy questions focus on selecting the appropriate strategy — run-to-failure for low-consequence assets, condition-based for high-consequence assets.",
        "LCC analysis questions require you to calculate the present value of future costs — know how to use the discount rate to calculate net present value.",
        "RCM questions focus on the methodology — know the difference between a failure mode and a failure effect, and how to use FMEA to develop a maintenance program.",
      ],
    },
    "Maintain & Restore Collection System": {
      title: "Maintain & Restore Collection System",
      intro: "At Class 3, operators must understand advanced rehabilitation planning, condition assessment programs, and long-term infrastructure management strategies. This module accounts for 15% of the Class 3 exam.",
      keyPoints: [
        { heading: "Condition Assessment Programs", body: "Developing a comprehensive condition assessment program: inspection frequency, prioritization, data management, and using results to develop a rehabilitation plan." },
        { heading: "Rehabilitation Planning", body: "Developing a rehabilitation plan: prioritizing defects, selecting rehabilitation methods, estimating costs, and developing a multi-year capital program." },
        { heading: "Asset Management for Collection Systems", body: "Applying asset management principles to collection system rehabilitation: risk assessment, consequence of failure analysis, and developing a risk-based rehabilitation priority." },
        { heading: "Advanced Trenchless Technologies", body: "Advanced trenchless rehabilitation: spiral wound lining, thermoformed pipe lining, and robotic repair. Know the advantages and limitations of each technology." },
        { heading: "Infrastructure Renewal Planning", body: "Developing a long-term infrastructure renewal plan: asset inventory, condition assessment, risk assessment, and developing a 20-year capital program." },
      ],
      examTips: [
        "Condition assessment program questions focus on the inspection frequency — know the recommended inspection cycle for different pipe materials and ages.",
        "Rehabilitation planning questions focus on the prioritization process — know how to use risk scores to prioritize rehabilitation projects.",
        "Advanced trenchless technology questions focus on selecting the appropriate technology for a given application — know the limitations of each technology.",
      ],
    },
    "Maintain Lift Stations": {
      title: "Maintain Lift Stations",
      intro: "Class 3 operators must have advanced knowledge of lift station design considerations, force main transient analysis, and lift station optimization programs. This module accounts for 10% of the Class 3 exam.",
      keyPoints: [
        { heading: "Lift Station Design Considerations", body: "Key design parameters: wet well volume, pump selection, force main sizing, and electrical system design. Know how to evaluate a lift station design and identify potential problems." },
        { heading: "Force Main Transient Analysis", body: "Water hammer analysis for force mains: calculating surge pressures, identifying vulnerable locations, and specifying surge protection measures (surge tanks, air release valves, slow-closing valves)." },
        { heading: "Lift Station Optimization Programs", body: "Developing a lift station optimization program: energy audits, pump efficiency testing, VFD evaluation, and wet well level optimization." },
        { heading: "Wet Well Design & Sizing", body: "Wet well design considerations: shape, volume, inlet configuration, and ventilation. Know how to calculate the required wet well volume for a given pump cycling frequency." },
        { heading: "Pump Station Automation", body: "Advanced pump station automation: adaptive control algorithms, remote monitoring, and predictive maintenance using SCADA data." },
      ],
      examTips: [
        "Force main transient analysis questions focus on water hammer — know the Joukowsky equation for surge pressure and the factors that affect it.",
        "Lift station optimization questions focus on the energy savings potential — know how VFDs reduce energy consumption and how to calculate the payback period.",
        "Wet well design questions focus on the sizing calculation — know how to calculate the required volume for a given pump cycling frequency and peak flow.",
      ],
    },
    "Monitor, Evaluate & Adjust Collection System": {
      title: "Monitor, Evaluate & Adjust Collection System",
      intro: "At Class 3, this module covers advanced hydraulic modeling, CSO control planning, and comprehensive system performance management. This module accounts for 25% of the Class 3 exam.",
      keyPoints: [
        { heading: "Advanced Hydraulic Modeling", body: "Developing and calibrating a hydraulic model for a collection system: model inputs, calibration data requirements, and using model results for capacity analysis and rehabilitation planning." },
        { heading: "CSO Control Planning", body: "Developing a CSO control plan: identifying CSO outfalls, quantifying overflow volumes, evaluating control options, and developing a long-term control plan (LTCP)." },
        { heading: "System Performance Management", body: "Developing a system performance management program: identifying KPIs, setting targets, monitoring performance, and implementing corrective actions." },
        { heading: "Capacity Management", body: "Capacity management, operations, and maintenance (CMOM) program: capacity assessment, operations optimization, and maintenance program development." },
        { heading: "Wet Weather Flow Management", body: "Managing wet weather flows: flow equalization, real-time control (RTC), and emergency response procedures for high-flow events." },
        { heading: "Environmental Impact Assessment", body: "Assessing the environmental impact of collection system overflows: receiving water quality, regulatory requirements, and developing mitigation measures." },
      ],
      examTips: [
        "Hydraulic modeling questions at Class 3 focus on model calibration — know what data is needed and what parameters are calibrated.",
        "CSO control planning questions focus on the LTCP development process — know the regulatory requirements and the typical control options.",
        "CMOM program questions focus on the four components: capacity, management, operations, and maintenance — know what each component includes.",
      ],
    },
    "Security, Safety & Administrative Procedures": {
      title: "Security, Safety & Administrative Procedures",
      intro: "At Class 3, the administrative module covers management of safety programs, regulatory compliance programs, and organizational leadership in emergency response. This module accounts for 20% of the Class 3 exam.",
      keyPoints: [
        { heading: "Safety Program Management", body: "Managing a comprehensive safety program: hazard identification, risk assessment, control measures, training, incident investigation, and continuous improvement." },
        { heading: "Regulatory Compliance Programs", body: "Developing and managing a regulatory compliance program: identifying applicable regulations, tracking compliance, managing non-compliance events, and continuous improvement." },
        { heading: "Emergency Management Leadership", body: "Leading emergency response: incident command system (ICS), EOC activation, inter-agency coordination, and post-incident review." },
        { heading: "Environmental Compliance", body: "Managing environmental compliance: spill prevention, spill response, environmental monitoring, and regulatory reporting." },
        { heading: "Staff Training Programs", body: "Developing and managing a staff training program: needs assessment, training plan development, delivery, and evaluation." },
        { heading: "Regulatory Reporting Systems", body: "Developing a regulatory reporting system: identifying all reporting requirements, establishing tracking systems, and ensuring timely and accurate reporting." },
      ],
      examTips: [
        "ICS questions focus on the command structure — know the five functional areas (command, operations, planning, logistics, finance/administration) and the span of control principle.",
        "Environmental compliance questions focus on the spill reporting requirements — know the immediate notification requirement and the written report requirements.",
        "Safety program management questions focus on the hierarchy of controls and the incident investigation process.",
      ],
    },
  },

  "class4-wastewater-coll": {
    "Operate Equipment": {
      title: "Operate Equipment",
      intro: "At Class 4, operators must have mastery-level knowledge of all collection system equipment and be able to provide technical leadership in equipment selection, procurement, and system-wide optimization. This module accounts for 15% of the Class 4 exam.",
      keyPoints: [
        { heading: "Technical Leadership in Equipment Management", body: "Providing technical direction for equipment procurement: developing specifications, evaluating bids, and overseeing commissioning. Know how to evaluate vendor proposals and negotiate contracts." },
        { heading: "System-Wide Optimization", body: "Developing and implementing a system-wide optimization program: identifying optimization opportunities, prioritizing improvements, and measuring results." },
        { heading: "Equipment Procurement & Specification", body: "Developing technical specifications for major equipment purchases: pumps, motors, generators, and SCADA systems. Know the key performance requirements and acceptance testing criteria." },
        { heading: "Advanced Automation & Control", body: "Advanced process control for collection systems: model predictive control (MPC), real-time optimization, and integration with smart city platforms." },
        { heading: "Energy Management Programs", body: "Developing and managing an organization-wide energy management program: energy audits, target setting, implementation, and reporting. Know the ISO 50001 energy management standard." },
      ],
      examTips: [
        "Technical specification questions focus on the key performance requirements — know what parameters must be specified for pumps (flow, head, efficiency, NPSH), motors (power, speed, efficiency), and generators (capacity, fuel consumption, transfer time).",
        "Energy management questions at Class 4 focus on the ISO 50001 standard — know the Plan-Do-Check-Act cycle and the key elements of an energy management system.",
        "Advanced control questions focus on the benefits of real-time control — know how RTC can reduce CSO volumes and improve system performance.",
      ],
    },
    "Evaluate & Maintain Equipment": {
      title: "Evaluate & Maintain Equipment",
      intro: "Class 4 operators must be able to lead organization-wide asset management programs, conduct risk-based maintenance planning, and make strategic decisions about infrastructure investment. This module accounts for 15% of the Class 4 exam.",
      keyPoints: [
        { heading: "Risk-Based Asset Management (ISO 55000)", body: "ISO 55000 asset management principles: asset management policy, strategy, objectives, and plan. Know the relationship between the asset management system and the organizational strategic plan." },
        { heading: "Strategic Maintenance Planning", body: "Developing a strategic maintenance plan: identifying critical assets, selecting maintenance strategies, allocating resources, and measuring performance." },
        { heading: "Infrastructure Investment Decisions", body: "Making strategic infrastructure investment decisions: business case development, risk assessment, financial analysis, and stakeholder consultation." },
        { heading: "Asset Performance Management", body: "Developing an asset performance management system: defining performance measures, setting targets, monitoring performance, and implementing corrective actions." },
        { heading: "Capital Planning", body: "Developing a long-term capital plan: asset inventory, condition assessment, risk assessment, financial analysis, and developing a 20-year capital program." },
      ],
      examTips: [
        "ISO 55000 questions focus on the key concepts — know the difference between an asset management policy, strategy, objectives, and plan.",
        "Capital planning questions focus on the process — know the steps from asset inventory to capital program development.",
        "Business case development questions focus on the key components — know how to present a business case for a major infrastructure investment.",
      ],
    },
    "Maintain & Restore Collection System": {
      title: "Maintain & Restore Collection System",
      intro: "At Class 4, operators must understand long-term infrastructure planning, risk-based asset management for collection systems, and strategic rehabilitation programs. This module accounts for 15% of the Class 4 exam.",
      keyPoints: [
        { heading: "Long-Term Infrastructure Planning", body: "Developing a 20-year infrastructure plan: population growth projections, capacity analysis, condition assessment, and developing a phased capital program." },
        { heading: "Risk-Based Rehabilitation Programs", body: "Developing a risk-based rehabilitation program: risk assessment methodology, consequence of failure analysis, and developing a risk-prioritized rehabilitation schedule." },
        { heading: "Strategic Asset Management", body: "Applying ISO 55000 principles to collection system asset management: developing an asset management plan, setting performance targets, and measuring results." },
        { heading: "Capital Investment Planning", body: "Developing a capital investment plan: identifying capital needs, prioritizing investments, developing funding strategies, and managing the capital program." },
        { heading: "Sustainability in Collection Systems", body: "Incorporating sustainability principles into collection system management: green infrastructure, energy recovery, and resource recovery from wastewater." },
      ],
      examTips: [
        "Long-term planning questions focus on the planning process — know the key inputs (population projections, capacity analysis, condition assessment) and outputs (capital program).",
        "Sustainability questions focus on green infrastructure — know the types of green infrastructure (bioswales, rain gardens, permeable pavement) and their benefits for collection systems.",
        "Risk-based rehabilitation questions focus on the prioritization process — know how to combine probability of failure and consequence of failure to calculate risk.",
      ],
    },
    "Maintain Lift Stations": {
      title: "Maintain Lift Stations",
      intro: "Class 4 operators must have strategic-level knowledge of lift station management including system-wide capacity planning, force main network management, and long-term infrastructure planning for pumping infrastructure. This module accounts for 10% of the Class 4 exam.",
      keyPoints: [
        { heading: "System-Wide Capacity Planning", body: "Developing a system-wide capacity plan for pumping infrastructure: flow projections, capacity analysis, identifying deficiencies, and developing a capital program." },
        { heading: "Force Main Network Management", body: "Managing a force main network: condition assessment, risk assessment, rehabilitation planning, and emergency response planning for force main failures." },
        { heading: "Long-Term Pumping Infrastructure Planning", body: "Developing a long-term plan for pumping infrastructure: asset inventory, condition assessment, risk assessment, and developing a 20-year capital program." },
        { heading: "Lift Station Optimization Programs", body: "Developing and managing a system-wide lift station optimization program: energy audits, pump efficiency testing, VFD evaluation, and wet well level optimization." },
        { heading: "Energy Management for Pumping", body: "Developing an energy management program for pumping infrastructure: energy audits, target setting, implementation, and reporting." },
      ],
      examTips: [
        "Capacity planning questions focus on the process — know how to project future flows and assess system capacity against projected demands.",
        "Force main management questions focus on the risk of failure — know the consequences of a force main failure and how to assess and manage that risk.",
        "Energy management questions focus on the optimization opportunities — know how VFDs, pump scheduling, and wet well level management can reduce energy costs.",
      ],
    },
    "Monitor, Evaluate & Adjust Collection System": {
      title: "Monitor, Evaluate & Adjust Collection System",
      intro: "At Class 4, this module covers strategic system management including long-term control plans (LTCPs) for CSOs, capacity management programs, and performance management systems. This module accounts for 25% of the Class 4 exam.",
      keyPoints: [
        { heading: "Long-Term Control Plans (LTCPs) for CSOs", body: "Developing an LTCP: CSO characterization, control option evaluation, cost-benefit analysis, and regulatory approval. Know the regulatory requirements for LTCP development and implementation." },
        { heading: "Capacity Management Programs", body: "Developing a CMOM program: capacity assessment, operations optimization, and maintenance program development. Know the regulatory requirements for CMOM programs." },
        { heading: "Performance Management Systems", body: "Developing a performance management system for a collection system: identifying KPIs, setting targets, monitoring performance, and reporting to stakeholders." },
        { heading: "Regulatory Strategy & Compliance", body: "Developing a regulatory strategy: identifying applicable regulations, assessing compliance status, developing a compliance roadmap, and managing regulatory relationships." },
        { heading: "Environmental Management Programs", body: "Developing an environmental management program: environmental impact assessment, monitoring programs, mitigation measures, and reporting." },
        { heading: "Strategic System Planning", body: "Developing a strategic plan for a collection system: vision, mission, strategic objectives, and performance measures. Know how to align the strategic plan with the organizational strategic plan." },
      ],
      examTips: [
        "LTCP questions focus on the development process — know the regulatory requirements and the typical steps in developing an LTCP.",
        "CMOM program questions focus on the four components — know what each component includes and the regulatory requirements.",
        "Performance management questions focus on KPI selection and target setting — know the most important KPIs for collection systems and how to set meaningful targets.",
        "Strategic planning questions focus on the alignment between the collection system strategic plan and the organizational strategic plan.",
      ],
    },
    "Security, Safety & Administrative Procedures": {
      title: "Security, Safety & Administrative Procedures",
      intro: "At Class 4, the administrative module covers senior management responsibilities including organizational leadership, strategic planning, regulatory leadership, and emergency management programs at the organizational level. This module accounts for 20% of the Class 4 exam.",
      keyPoints: [
        { heading: "Organizational Leadership", body: "Leading a large organization: organizational design, change management, building a high-performance culture, and developing future leaders." },
        { heading: "Strategic Planning", body: "Developing and implementing a strategic plan for a collection system utility: vision, mission, values, strategic objectives, and performance measures." },
        { heading: "Regulatory Leadership & Environmental Compliance", body: "Leading a regulatory compliance culture: developing a compliance management system, managing regulatory relationships, and responding to non-compliance events." },
        { heading: "Emergency Management Programs", body: "Developing and managing an organization-wide emergency management program: hazard identification, risk assessment, business continuity planning, and post-incident review." },
        { heading: "Performance Management & KPIs", body: "Developing a performance management system: identifying KPIs, setting targets, monitoring performance, and reporting to the board and stakeholders." },
        { heading: "Stakeholder & Public Communication", body: "Communicating with elected officials, the public, media, and regulatory agencies. Know how to develop a communications plan for both routine operations and emergencies." },
      ],
      examTips: [
        "Organizational leadership questions at Class 4 focus on strategic HR management — know the key elements of a succession planning program.",
        "Regulatory leadership questions focus on the compliance management system — know the key elements and how to manage non-compliance events.",
        "Emergency management questions focus on the business continuity planning process — know the difference between an ERP and a BCP.",
        "Stakeholder communication questions focus on crisis communication — know the key principles of effective crisis communication.",
      ],
    },
  },
};

// ─── Migration script ─────────────────────────────────────────────────────────

const conn = await createConnection(process.env.DATABASE_URL);

let updated = 0;
let failed = 0;

for (const [bankKey, modules] of Object.entries(OVERVIEWS)) {
  try {
    const json = JSON.stringify(modules);
    const [result] = await conn.query(
      "UPDATE module_overviews SET overviewsJson = ? WHERE bankKey = ?",
      [json, bankKey]
    );
    if (result.affectedRows === 1) {
      console.log(`✅ Updated ${bankKey}`);
      updated++;
    } else {
      console.log(`⚠️  No row found for ${bankKey} — inserting...`);
      await conn.query(
        "INSERT INTO module_overviews (bankKey, overviewsJson) VALUES (?, ?)",
        [bankKey, json]
      );
      updated++;
    }
  } catch (err) {
    console.error(`❌ Failed to update ${bankKey}:`, err.message);
    failed++;
  }
}

console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
await conn.end();
