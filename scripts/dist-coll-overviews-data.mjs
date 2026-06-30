// ─── ONTARIO WATER DISTRIBUTION OVERVIEWS ────────────────────────────────────

export const WD_OVERVIEWS_CLASS1 = {
  "General": {
    title: "General",
    intro: "The General module for Class 1 Water Distribution covers foundational mathematics, basic hydraulics, and the regulatory framework governing Ontario drinking water systems. Operators must understand pressure, flow, and volume calculations as well as the roles of O. Reg. 170/03 and the Safe Drinking Water Act, 2002. This module accounts for approximately 13 of the 80 questions on the Class 1 exam.",
    keyPoints: [
      {
        heading: "Basic Hydraulics and Pressure",
        body: "Pressure in a water distribution system is measured in kilopascals (kPa) or metres of head. One metre of water column equals 9.81 kPa. Operators must convert between units and calculate static pressure, residual pressure, and pressure at various elevations. Normal distribution system pressures range from 275 kPa to 690 kPa (40 to 100 psi)."
      },
      {
        heading: "Flow and Velocity Calculations",
        body: "Flow rate (Q) equals the cross-sectional area (A) multiplied by velocity (V): Q = A x V. Operators must calculate flow in L/s or m3/d and convert between units. Velocity in distribution mains should generally not exceed 1.5 m/s to prevent water hammer and excessive head loss."
      },
      {
        heading: "Volume and Dosage Calculations",
        body: "Volume calculations are required for storage tanks, reservoirs, and pipe segments. Chlorine dosage is calculated as: Dose (mg/L) = Demand (mg/L) + Residual (mg/L). Operators must calculate the amount of chlorine stock solution required to achieve a target residual in a given volume of water."
      },
      {
        heading: "Regulatory Framework",
        body: "Ontario drinking water systems are governed by the Safe Drinking Water Act, 2002 (SDWA) and O. Reg. 170/03 (Drinking Water Systems). O. Reg. 170/03 specifies sampling frequencies, reporting requirements, and adverse result procedures. The Drinking Water Quality Standards (O. Reg. 169/03) sets maximum acceptable concentrations (MACs) for all regulated parameters."
      },
      {
        heading: "Operator Certification and Responsibilities",
        body: "Class 1 Water Distribution operators are certified under O. Reg. 128/04. The operator-in-charge (OIC) is responsible for the day-to-day operation of the system and must hold a certificate equal to or higher than the system classification. Operators must understand the difference between the owner, operating authority, and OIC roles."
      }
    ],
    formulas: [
      { name: "Pressure from Head", formula: "P (kPa) = h (m) x 9.81", description: "Convert metres of water head to pressure in kPa" },
      { name: "Flow Rate", formula: "Q = A x V", description: "Q = flow (m3/s), A = pipe area (m2), V = velocity (m/s)" },
      { name: "Pipe Area", formula: "A = π x (D/2)²", description: "Calculate cross-sectional area of a circular pipe" }
    ],
    examTips: [
      "Know the pressure conversion: 1 m head = 9.81 kPa and 1 psi = 6.895 kPa",
      "O. Reg. 170/03 is the key regulation for distribution system operation — know its sampling and reporting requirements",
      "The OIC must hold a certificate equal to or higher than the system classification"
    ]
  },
  "Support Systems": {
    title: "Support Systems",
    intro: "The Support Systems module covers the equipment used to move, store, and monitor water in a distribution system. Class 1 operators must understand pumps, motors, storage facilities, valves, hydrants, and basic instrumentation. This module accounts for approximately 9 of the 80 questions on the Class 1 exam.",
    keyPoints: [
      {
        heading: "Pumps and Motors",
        body: "Centrifugal pumps are the most common type used in water distribution. Key pump parameters include flow rate (Q), total dynamic head (TDH), efficiency, and net positive suction head (NPSH). Operators must recognize normal operating conditions and identify signs of cavitation, air binding, and seal failure. Motor amperage should be checked regularly against nameplate values."
      },
      {
        heading: "Storage Facilities",
        body: "Elevated tanks and ground-level reservoirs provide storage for peak demand, fire flow, and emergency supply. Storage volume is typically sized for one day's average demand. Operators must maintain minimum water levels, inspect for structural integrity, and ensure turnover rates are adequate to prevent water quality degradation. Reservoirs must be covered and secured against contamination."
      },
      {
        heading: "Valves",
        body: "Gate valves, butterfly valves, and ball valves are used to isolate sections of the distribution system. Gate valves should be operated fully open or fully closed to prevent wear on the gate. Valve exercising programs ensure valves remain operable. Air release valves (ARVs) and air/vacuum valves are installed at high points to release trapped air and prevent vacuum conditions."
      },
      {
        heading: "Fire Hydrants",
        body: "Fire hydrants must be inspected, flushed, and lubricated annually. Dry-barrel hydrants drain automatically after use and are required in cold climates. Wet-barrel hydrants maintain water in the barrel and are used in warmer climates. Hydrant flow tests measure available fire flow and system pressure at the hydrant location."
      },
      {
        heading: "Instrumentation and Controls",
        body: "Pressure gauges, flow meters, and level sensors provide operators with real-time system data. Pressure transducers convert pressure to an electrical signal for SCADA systems. Operators must understand how to calibrate instruments and recognize out-of-range readings. Telemetry systems allow remote monitoring of pump stations and storage facilities."
      }
    ],
    formulas: [
      { name: "Total Dynamic Head", formula: "TDH = Static Head + Friction Head + Velocity Head", description: "Total head a pump must overcome" },
      { name: "Pump Power", formula: "P (kW) = (Q x TDH x SG) / (367 x efficiency)", description: "Q in m3/hr, TDH in metres, SG = specific gravity" }
    ],
    examTips: [
      "Gate valves are always fully open or fully closed — never throttled",
      "Know the difference between dry-barrel and wet-barrel hydrants and when each is used",
      "TDH = static head + friction losses — know how to calculate each component"
    ]
  },
  "Processes": {
    title: "Processes",
    intro: "The Processes module is the largest section of the Class 1 Water Distribution exam, covering the core operational tasks of maintaining water quality and system integrity. Topics include disinfection, flushing, cross-connection control, main installation and repair, and water quality monitoring. This module accounts for approximately 49 of the 80 questions on the Class 1 exam.",
    keyPoints: [
      {
        heading: "Disinfection and Chlorine Residuals",
        body: "Ontario's O. Reg. 170/03 requires a minimum free chlorine residual of 0.05 mg/L at all points in the distribution system. Operators must maintain adequate residuals while avoiding disinfection byproduct (DBP) formation. Chlorine residual testing is performed using the DPD colorimetric method. Booster chlorination stations may be required in large systems to maintain residuals at the extremities."
      },
      {
        heading: "Flushing Programs",
        body: "Unidirectional flushing (UDF) is the preferred method for removing sediment, biofilm, and stale water from distribution mains. Flushing velocity should reach a minimum of 0.75 m/s to effectively scour the pipe. Dead-end mains require regular flushing to prevent water quality deterioration. Flushing water must be dechlorinated before discharge to storm sewers or watercourses."
      },
      {
        heading: "Cross-Connection Control",
        body: "A cross-connection is any actual or potential connection between a potable water supply and a source of contamination. Backflow prevention devices (BFPDs) protect against backpressure and backsiphonage. Reduced pressure zone (RPZ) assemblies provide the highest level of protection and are required for high-hazard connections. Ontario's O. Reg. 170/03 requires a cross-connection control program."
      },
      {
        heading: "Main Installation and Repair",
        body: "New water mains must be pressure tested and disinfected before being placed in service. Pressure testing requires a minimum of 1.5 times the operating pressure for at least two hours. Disinfection is performed using the slug method (continuous feed) or the tablet method. After disinfection, mains must be flushed and bacteriological samples collected before service connection."
      },
      {
        heading: "Water Quality Monitoring",
        body: "O. Reg. 170/03 specifies minimum sampling frequencies for microbiological, chemical, and physical parameters. Microbiological samples must be collected from representative locations throughout the distribution system. Adverse results (E. coli, total coliform, or HPC above limits) require immediate notification to the local Medical Officer of Health and the Ministry of the Environment."
      }
    ],
    formulas: [
      { name: "Chlorine Dose", formula: "Dose (mg/L) = Demand (mg/L) + Residual (mg/L)", description: "Calculate required chlorine dose" },
      { name: "Flushing Velocity", formula: "V (m/s) = Q (m3/s) / A (m2)", description: "Ensure minimum 0.75 m/s for effective scouring" },
      { name: "Chlorine Stock Volume", formula: "V_stock = (Target mg/L x Volume L) / (Stock concentration mg/L)", description: "Volume of stock solution needed to achieve target residual" }
    ],
    examTips: [
      "Minimum free chlorine residual in distribution is 0.05 mg/L under O. Reg. 170/03",
      "RPZ assemblies are required for high-hazard cross-connections — know the hierarchy of backflow preventers",
      "New mains must be pressure tested at 1.5x operating pressure before disinfection and commissioning"
    ]
  },
  "Administration": {
    title: "Administration",
    intro: "The Administration module covers the regulatory, reporting, and record-keeping requirements for Class 1 Water Distribution operators. Operators must understand their obligations under the Safe Drinking Water Act, O. Reg. 170/03, and the Drinking Water Quality Management Standard (DWQMS). This module accounts for approximately 9 of the 80 questions on the Class 1 exam.",
    keyPoints: [
      {
        heading: "Reporting and Notification Requirements",
        body: "O. Reg. 170/03 requires operators to report adverse water quality results to the local Medical Officer of Health and the Ministry of the Environment, Conservation and Parks (MECP) immediately upon becoming aware. Annual reports must be prepared and made available to the public. Operators must also report equipment failures that affect system performance."
      },
      {
        heading: "Record Keeping",
        body: "Operators must maintain records of all water quality test results, operational data, maintenance activities, and adverse events. Records must be retained for a minimum of 10 years. Logbooks should record daily readings, abnormal events, and corrective actions taken. Accurate records are essential for regulatory compliance and system management."
      },
      {
        heading: "Drinking Water Quality Management Standard (DWQMS)",
        body: "The DWQMS is a quality management system framework for municipal drinking water systems in Ontario. It requires systems to develop and maintain an Operational Plan that documents all aspects of system operation. The DWQMS is based on ISO 9001 principles and requires regular internal audits and management reviews."
      },
      {
        heading: "Emergency Response",
        body: "Operators must have an Emergency Response Plan (ERP) that addresses water main breaks, contamination events, power failures, and natural disasters. The ERP must include contact lists, notification procedures, and response protocols. Operators must be familiar with the ERP and participate in regular drills and exercises."
      },
      {
        heading: "Public Communication",
        body: "When adverse water quality results are detected, operators must notify the public through appropriate channels, which may include boil water advisories (BWAs). BWAs are issued when there is evidence of microbiological contamination or a significant risk of contamination. Operators must follow the MECP's guidance on issuing and lifting BWAs."
      }
    ],
    formulas: [],
    examTips: [
      "Adverse results must be reported immediately to the Medical Officer of Health and MECP — know the notification chain",
      "Records must be kept for a minimum of 10 years under O. Reg. 170/03",
      "The DWQMS Operational Plan is a living document that must be updated regularly"
    ]
  }
};

export const WD_OVERVIEWS_CLASS2 = {
  "General": {
    title: "General",
    intro: "The General module for Class 2 Water Distribution builds on Class 1 fundamentals with more advanced hydraulic calculations, system analysis, and regulatory knowledge. Operators must apply Hardy-Cross analysis concepts, understand water hammer, and interpret system hydraulic models. This module accounts for approximately 13 of the 80 questions on the Class 2 exam.",
    keyPoints: [
      {
        heading: "Advanced Hydraulic Calculations",
        body: "Class 2 operators must apply the Hazen-Williams equation to calculate head loss in pipes: hL = 10.67 x L x Q^1.852 / (C^1.852 x D^4.87). The Hazen-Williams C-factor reflects pipe roughness (C=140 for new PVC, C=100 for older cast iron). Operators must calculate head loss through series and parallel pipe networks and understand how pipe age and material affect system performance."
      },
      {
        heading: "Water Hammer",
        body: "Water hammer is a pressure surge caused by a sudden change in flow velocity, typically from rapid valve closure or pump shutdown. The surge pressure can be calculated using the Joukowsky equation: dP = rho x a x dV, where 'a' is the wave speed. Surge protection devices include surge tanks, air vessels, slow-closing valves, and pump bypass lines. Water hammer can cause pipe bursts and joint failures."
      },
      {
        heading: "System Hydraulic Modelling",
        body: "Hydraulic models (such as EPANET) simulate pressure and flow throughout a distribution system. Models are used for system planning, fire flow analysis, and identifying areas of low pressure or poor water quality. Operators must understand model inputs (pipe data, demand nodes, pump curves) and interpret model outputs. Model calibration requires field pressure measurements and flow tests."
      },
      {
        heading: "Water Quality Parameters",
        body: "Class 2 operators must understand the chemical and microbiological parameters regulated under O. Reg. 169/03. Key parameters include turbidity (MAC 1 NTU, target 0.1 NTU), pH (6.5-8.5), total dissolved solids (TDS), hardness, and disinfection byproducts (THMs MAC 100 ug/L, HAAs MAC 80 ug/L). Operators must interpret laboratory reports and identify trends."
      },
      {
        heading: "Pipe Materials and Corrosion",
        body: "Common pipe materials include ductile iron (DI), PVC, HDPE, and asbestos cement (AC). Corrosion of metallic pipes can cause taste and odour problems, red water complaints, and structural failure. The Langelier Saturation Index (LSI) predicts the tendency of water to deposit or dissolve calcium carbonate. LSI = pH - pHs, where pHs is the saturation pH. Positive LSI indicates scale-forming tendency; negative LSI indicates corrosive tendency."
      }
    ],
    formulas: [
      { name: "Hazen-Williams Head Loss", formula: "hL = 10.67 x L x Q^1.852 / (C^1.852 x D^4.87)", description: "hL in metres, L in metres, Q in m3/s, D in metres" },
      { name: "Langelier Saturation Index", formula: "LSI = pH - pHs", description: "Positive = scale-forming, Negative = corrosive" },
      { name: "Water Hammer Pressure", formula: "dP = rho x a x dV", description: "rho = water density, a = wave speed, dV = velocity change" }
    ],
    examTips: [
      "Know the Hazen-Williams C-factors for common pipe materials: PVC=140, new DI=130, old cast iron=100",
      "LSI above zero means scale-forming (protective); below zero means corrosive — know which is preferred",
      "Water hammer is prevented by slow valve closure and surge protection devices, not fast closure"
    ]
  },
  "Support Systems": {
    title: "Support Systems",
    intro: "At Class 2, the Support Systems module requires a deeper understanding of pump system analysis, storage design, and advanced valve and meter applications. Operators must interpret pump curves, calculate system curves, and understand the impact of parallel and series pump configurations. This module accounts for approximately 9 of the 80 questions on the Class 2 exam.",
    keyPoints: [
      {
        heading: "Pump Curves and System Curves",
        body: "A pump curve plots flow (Q) versus total dynamic head (TDH) for a specific pump. The system curve plots the head required to move water through the system at various flow rates. The operating point is where the pump curve intersects the system curve. Operators must identify the best efficiency point (BEP) and understand the consequences of operating far from BEP, including cavitation and bearing failure."
      },
      {
        heading: "Parallel and Series Pump Operation",
        body: "Pumps in parallel increase flow capacity while maintaining the same head. Pumps in series increase head capacity while maintaining the same flow. When adding a pump in parallel, the combined pump curve is constructed by adding flows at the same head. Parallel pumping is common in booster stations where demand varies significantly throughout the day."
      },
      {
        heading: "Variable Frequency Drives (VFDs)",
        body: "VFDs control pump speed to match system demand, reducing energy consumption and water hammer. The affinity laws govern pump performance at different speeds: Q2/Q1 = N2/N1 (flow proportional to speed), H2/H1 = (N2/N1)^2 (head proportional to speed squared), P2/P1 = (N2/N1)^3 (power proportional to speed cubed). VFDs can reduce energy costs by up to 50% compared to throttling valves."
      },
      {
        heading: "Storage Design and Operation",
        body: "Storage volume must meet peak hour demand, fire flow requirements, and emergency storage needs. The Ontario Fire Code specifies minimum fire flow rates and durations based on building occupancy and construction. Operators must manage storage levels to balance system pressure, water age, and emergency reserves. Mixing within storage tanks is critical to prevent stratification and maintain water quality."
      },
      {
        heading: "Pressure Reducing Valves (PRVs)",
        body: "PRVs automatically reduce upstream pressure to a set downstream pressure, protecting lower-elevation zones from excessive pressure. PRVs must be sized correctly for the flow range and set to maintain pressure within the 275-690 kPa range. Operators must inspect PRVs regularly for proper operation, seat wear, and diaphragm condition. Pressure sustaining valves (PSVs) maintain a minimum upstream pressure."
      }
    ],
    formulas: [
      { name: "Affinity Law - Flow", formula: "Q2/Q1 = N2/N1", description: "Flow is proportional to pump speed" },
      { name: "Affinity Law - Head", formula: "H2/H1 = (N2/N1)²", description: "Head is proportional to speed squared" },
      { name: "Affinity Law - Power", formula: "P2/P1 = (N2/N1)³", description: "Power is proportional to speed cubed" }
    ],
    examTips: [
      "Know all three affinity laws — they are frequently tested at Class 2 and above",
      "Pumps in parallel add flows at the same head; pumps in series add heads at the same flow",
      "The operating point is the intersection of the pump curve and system curve"
    ]
  },
  "Processes": {
    title: "Processes",
    intro: "The Processes module at Class 2 covers advanced water quality management, system operations, and infrastructure maintenance. Operators must understand disinfection byproduct formation and control, water main rehabilitation techniques, and advanced cross-connection control programs. This module accounts for approximately 49 of the 80 questions on the Class 2 exam.",
    keyPoints: [
      {
        heading: "Disinfection Byproduct Formation and Control",
        body: "Trihalomethanes (THMs) and haloacetic acids (HAAs) form when chlorine reacts with natural organic matter (NOM). The MAC for total THMs is 100 ug/L and for HAAs is 80 ug/L under O. Reg. 169/03. Control strategies include reducing NOM through enhanced coagulation at the treatment plant, using chloramines instead of free chlorine, and reducing water age in the distribution system. Operators must monitor DBP levels and report exceedances."
      },
      {
        heading: "Water Main Rehabilitation",
        body: "Aging water mains can be rehabilitated using cured-in-place pipe (CIPP) lining, cement mortar lining, or pipe bursting. Rehabilitation extends pipe life and improves hydraulic capacity without full replacement. Operators must understand the selection criteria for each method based on pipe condition, diameter, and access constraints. Condition assessment using CCTV inspection and acoustic leak detection informs rehabilitation planning."
      },
      {
        heading: "Leak Detection and Water Loss Management",
        body: "Non-revenue water (NRW) includes real losses (leakage) and apparent losses (meter error, unauthorized use). The Infrastructure Leakage Index (ILI) compares actual leakage to the unavoidable annual real losses (UARL). Acoustic leak detection methods include correlators, listening sticks, and ground microphones. District Metered Areas (DMAs) allow operators to isolate and quantify leakage in specific zones."
      },
      {
        heading: "Advanced Cross-Connection Control",
        body: "A comprehensive cross-connection control program includes an inventory of all premises with potential cross-connections, annual inspection of backflow prevention devices, and a registry of all installed devices. Testable backflow preventers (RPZ, DCVA) must be tested annually by a certified tester. High-hazard premises include hospitals, car washes, irrigation systems, and industrial facilities."
      },
      {
        heading: "Nitrification in Distribution Systems",
        body: "Nitrification occurs when ammonia-oxidizing bacteria (AOB) convert ammonia to nitrite and then nitrate in chloraminated systems. Symptoms include loss of chloramine residual, increase in nitrite, and elevated HPC counts. Control strategies include maintaining a chloramine residual above 0.5 mg/L, flushing problem areas, and periodic breakpoint chlorination. Nitrification is a significant water quality concern in large distribution systems using chloramines."
      }
    ],
    formulas: [
      { name: "Infrastructure Leakage Index", formula: "ILI = CARL / UARL", description: "CARL = current annual real losses, UARL = unavoidable annual real losses" },
      { name: "CT Value", formula: "CT = Concentration (mg/L) x Contact Time (min)", description: "Used to verify disinfection efficacy" }
    ],
    examTips: [
      "THM MAC = 100 ug/L, HAA MAC = 80 ug/L under O. Reg. 169/03 — both are tested frequently",
      "ILI below 1.0 is excellent; above 3.0 indicates significant leakage that requires investigation",
      "Nitrification is specific to chloraminated systems — know the signs and control strategies"
    ]
  },
  "Administration": {
    title: "Administration",
    intro: "The Administration module at Class 2 covers management responsibilities, regulatory compliance programs, and financial management for water distribution systems. Operators must understand the DWQMS audit process, staff supervision, and emergency management planning. This module accounts for approximately 9 of the 80 questions on the Class 2 exam.",
    keyPoints: [
      {
        heading: "DWQMS Operational Plan",
        body: "The DWQMS Operational Plan is a comprehensive document that describes the drinking water system, its risks, and the controls in place to manage those risks. It must include a risk assessment, operational procedures, monitoring and measurement plans, and an emergency response plan. The Operational Plan must be reviewed and updated annually and audited by a third-party accredited auditor every three years."
      },
      {
        heading: "Staff Management and Training",
        body: "Class 2 operators may supervise Class 1 operators and must ensure that all staff are properly trained and certified. Training records must be maintained and updated. Operators must be familiar with the requirements of O. Reg. 128/04 regarding operator certification, including the continuing education requirements for certificate renewal. Succession planning is important to ensure operational continuity."
      },
      {
        heading: "Financial Management Basics",
        body: "Operators must understand basic financial concepts including capital vs. operating expenditures, asset management plans, and rate-setting. The Ontario Water Wastewater Agency Response Network (ONWARN) provides mutual aid assistance during emergencies. Asset management plans must identify the condition and remaining useful life of all infrastructure components and plan for their replacement."
      },
      {
        heading: "Regulatory Compliance Programs",
        body: "Operators must maintain compliance with all applicable regulations including the SDWA, O. Reg. 170/03, O. Reg. 169/03, and O. Reg. 128/04. Compliance programs include monitoring schedules, reporting procedures, and corrective action protocols. Non-compliance must be reported to the MECP and corrective actions documented. Operators must stay current with regulatory changes and updates."
      },
      {
        heading: "Emergency Management Planning",
        body: "Emergency Response Plans must address a range of scenarios including water main breaks, contamination events, power failures, and extreme weather events. Plans must include contact lists, notification trees, and resource inventories. Tabletop exercises and full-scale drills should be conducted regularly to test plan effectiveness. Plans must be updated after each emergency event and at least annually."
      }
    ],
    formulas: [],
    examTips: [
      "The DWQMS Operational Plan must be audited by a third-party accredited auditor every three years",
      "O. Reg. 128/04 governs operator certification — know the classification requirements and continuing education obligations",
      "Asset management plans must address the full lifecycle of infrastructure from installation to replacement"
    ]
  }
};

export const WD_OVERVIEWS_CLASS3 = {
  "General": {
    title: "General",
    intro: "The General module for Class 3 Water Distribution covers advanced system analysis, complex hydraulic modelling, and senior-level regulatory knowledge. Operators must apply network analysis techniques, interpret extended-period simulation (EPS) models, and understand advanced water quality modelling. This module accounts for approximately 13 of the 80 questions on the Class 3 exam.",
    keyPoints: [
      {
        heading: "Network Analysis and Modelling",
        body: "Extended-period simulation (EPS) models simulate system behaviour over time, capturing diurnal demand patterns, storage cycling, and pump operations. Operators must understand how to calibrate models using field data and use models for operational decision-making. Key calibration parameters include pipe roughness (C-factors), demand allocations, and pump curves. Models must be validated against independent field measurements."
      },
      {
        heading: "Advanced Water Quality Modelling",
        body: "Water quality models simulate the transport and decay of chlorine residuals, DBP formation, and water age throughout the distribution system. EPANET includes water quality simulation capabilities. Operators must understand first-order chlorine decay kinetics and the factors that affect decay rates including temperature, pipe material, and NOM concentration. Water age modelling identifies areas of potential water quality deterioration."
      },
      {
        heading: "Fire Flow Analysis",
        body: "Fire flow analysis determines the available fire flow at any point in the distribution system. The Insurance Underwriters Survey (IUS) method calculates required fire flow based on building construction and occupancy. Operators must conduct hydrant flow tests and compare results against model predictions. Deficiencies in fire flow must be addressed through system improvements or operational changes."
      },
      {
        heading: "Advanced Pressure Management",
        body: "Pressure management reduces leakage rates, main break frequency, and energy consumption. Average zone pressure (AZP) is the key metric for pressure management. Pressure management zones (PMZs) are created using PRVs and isolation valves to maintain optimal pressures throughout the system. Studies show that reducing AZP by 10 m can reduce leakage by 10-15%."
      },
      {
        heading: "Corrosion Control Programs",
        body: "A comprehensive corrosion control program includes monitoring of pH, alkalinity, LSI, and corrosion byproducts (iron, lead, copper). Lead service line replacement programs are required under the Lead and Copper Rule. Orthophosphate dosing can form a protective film on lead and copper surfaces, reducing lead leaching. Operators must understand the interaction between corrosion control and disinfection efficacy."
      }
    ],
    formulas: [
      { name: "Hazen-Williams Velocity", formula: "V = 0.8492 x C x R^0.63 x S^0.54", description: "R = hydraulic radius, S = slope of hydraulic grade line" },
      { name: "Darcy-Weisbach", formula: "hL = f x (L/D) x (V²/2g)", description: "f = friction factor, L = length, D = diameter, V = velocity, g = 9.81 m/s²" }
    ],
    examTips: [
      "EPS models capture time-varying system behaviour — know the difference between steady-state and EPS modelling",
      "Fire flow testing requires measurement of static pressure, residual pressure, and pitot pressure at the hydrant",
      "Lead service line replacement is a regulatory requirement — know the notification and replacement procedures"
    ]
  },
  "Support Systems": {
    title: "Support Systems",
    intro: "At Class 3, the Support Systems module requires advanced knowledge of pump system optimization, storage management, and SCADA systems. Operators must manage energy costs, optimize pump scheduling, and maintain complex instrumentation and control systems. This module accounts for approximately 9 of the 80 questions on the Class 3 exam.",
    keyPoints: [
      {
        heading: "Pump System Optimization",
        body: "Pump scheduling optimization balances energy costs, storage levels, and system pressure requirements. Time-of-use (TOU) electricity pricing incentivizes pumping during off-peak hours. Operators must calculate specific energy consumption (kWh/m3) and identify opportunities to reduce energy costs. Pump efficiency testing using field measurements of flow, head, and power identifies pumps requiring maintenance or replacement."
      },
      {
        heading: "Advanced SCADA Systems",
        body: "SCADA systems provide real-time monitoring and control of all distribution system components. Operators must understand SCADA architecture including PLCs, RTUs, communication networks, and historian databases. Alarm management is critical — operators must distinguish between critical alarms requiring immediate response and informational alarms. SCADA cybersecurity is increasingly important to protect against unauthorized access."
      },
      {
        heading: "Storage Management Programs",
        body: "Storage management programs optimize the use of storage to reduce peak demand on treatment facilities, manage pressure, and maintain water quality. Operators must develop operational rules for storage filling and draining based on system demand patterns and water quality requirements. Turnover time in storage tanks should not exceed 3-5 days to prevent water quality deterioration."
      },
      {
        heading: "Equipment Performance Evaluation",
        body: "Class 3 operators must evaluate the performance of all system equipment against design specifications and manufacturer recommendations. Performance testing includes pump efficiency tests, motor load tests, and valve stroke tests. Condition assessment programs use vibration analysis, thermography, and oil analysis to identify equipment approaching failure. Maintenance management systems (CMMS) track work orders, parts inventory, and maintenance history."
      },
      {
        heading: "Electrical System Management",
        body: "Operators must understand three-phase electrical systems, power factor correction, and standby power systems. Power factor below 0.9 results in utility surcharges and reduced motor efficiency. Standby generators must be sized to power all critical loads and tested monthly under load. Transfer switches must be tested to ensure automatic transfer occurs within the required time."
      }
    ],
    formulas: [
      { name: "Specific Energy Consumption", formula: "SEC (kWh/m3) = Power (kW) / Flow (m3/hr)", description: "Lower SEC indicates more efficient pumping" },
      { name: "Power Factor", formula: "PF = True Power (kW) / Apparent Power (kVA)", description: "Target PF > 0.9 to avoid utility surcharges" }
    ],
    examTips: [
      "Specific energy consumption (kWh/m3) is the key metric for pump efficiency — lower is better",
      "SCADA cybersecurity is increasingly tested — know the basic principles of network security for industrial control systems",
      "Storage turnover time should not exceed 3-5 days to maintain water quality"
    ]
  },
  "Processes": {
    title: "Processes",
    intro: "The Processes module at Class 3 covers advanced water quality management, complex system operations, and strategic infrastructure planning. Operators must manage water quality across large, complex distribution systems and develop comprehensive programs for leak detection, cross-connection control, and main rehabilitation. This module accounts for approximately 49 of the 80 questions on the Class 3 exam.",
    keyPoints: [
      {
        heading: "Advanced Water Quality Management Programs",
        body: "Class 3 operators must develop and manage comprehensive water quality monitoring programs that go beyond the minimum requirements of O. Reg. 170/03. Programs should include routine monitoring at representative locations, trend analysis, and early warning systems. Operators must understand the relationship between source water quality, treatment performance, and distribution system water quality. Consumer complaint analysis can identify emerging water quality issues."
      },
      {
        heading: "Asset Management for Distribution Systems",
        body: "Asset management programs must address the full lifecycle of distribution system infrastructure. Condition assessment methods include CCTV inspection, acoustic leak detection, pipe sampling, and hydraulic performance analysis. Break history analysis identifies pipes with high failure rates. Risk-based prioritization considers both the probability of failure and the consequence of failure to rank rehabilitation and replacement projects."
      },
      {
        heading: "Advanced Leak Detection Programs",
        body: "District Metered Areas (DMAs) divide the distribution system into zones with controlled entry and exit points, allowing leakage to be quantified by zone. Minimum night flow (MNF) analysis during the period of lowest demand (2-4 AM) provides a reliable estimate of leakage. Acoustic correlators and ground microphones are used to locate individual leaks. Smart water networks use continuous acoustic monitoring to detect leaks in real time."
      },
      {
        heading: "Water Loss Control Programs",
        body: "The AWWA Water Audit methodology provides a standardized framework for quantifying and managing water losses. The water audit distinguishes between authorized consumption, real losses (leakage), and apparent losses (meter error, unauthorized use). The Performance Indicator (PI) system uses the ILI to benchmark leakage performance. Operators must develop water loss reduction targets and action plans."
      },
      {
        heading: "Disinfection Optimization",
        body: "Disinfection optimization balances the need for adequate microbial protection with the minimization of DBP formation. The CT concept (concentration x time) is used to verify disinfection efficacy against Giardia and Cryptosporidium. Operators must understand the factors that affect CT including temperature, pH, and turbidity. Chloramine systems require careful management of the chlorine-to-ammonia ratio to prevent nitrification and DBP formation."
      }
    ],
    formulas: [
      { name: "Water Audit - Real Losses", formula: "Real Losses = System Input Volume - Authorized Consumption - Apparent Losses", description: "Component of the AWWA water balance" },
      { name: "Minimum Night Flow Leakage", formula: "Leakage (L/hr) = MNF - Legitimate Night Use", description: "Estimate leakage from minimum night flow measurements" }
    ],
    examTips: [
      "The AWWA Water Audit methodology is the standard framework for water loss management — know the components of the water balance",
      "DMA minimum night flow analysis is the most reliable method for quantifying leakage by zone",
      "CT values must be calculated to verify disinfection efficacy — know the CT requirements for Giardia inactivation"
    ]
  },
  "Administration": {
    title: "Administration",
    intro: "The Administration module at Class 3 covers management, supervision, financial management, regulatory compliance programs, and emergency management planning at a senior level. Operators must be able to develop and implement comprehensive management programs and lead teams of operators. This module accounts for approximately 9 of the 80 questions on the Class 3 exam.",
    keyPoints: [
      {
        heading: "Staff Management and Supervision",
        body: "Class 3 operators are responsible for supervising teams of operators and ensuring that all staff are properly trained, certified, and performing their duties effectively. Performance management programs include regular performance reviews, training needs assessments, and succession planning. Operators must understand the requirements of the Ontario Human Rights Code and the Occupational Health and Safety Act as they apply to the workplace."
      },
      {
        heading: "Financial Management",
        body: "Class 3 operators must understand the financial management of water distribution systems including capital and operating budgets, rate-setting, and long-term financial planning. Asset management plans must be integrated with financial plans to ensure that sufficient funds are available for infrastructure renewal. Full-cost accounting includes all costs of providing water service including capital depreciation, debt service, and environmental costs."
      },
      {
        heading: "Regulatory Compliance Programs",
        body: "Comprehensive regulatory compliance programs include monitoring schedules, reporting procedures, corrective action protocols, and staff training. Operators must maintain a current understanding of all applicable regulations and be aware of upcoming regulatory changes. Compliance management software can help track monitoring requirements, record results, and generate required reports. Non-compliance must be investigated and root causes addressed."
      },
      {
        heading: "Emergency Management Planning",
        body: "Emergency Response Plans at Class 3 must address a wider range of scenarios and involve coordination with multiple agencies including the local Medical Officer of Health, MECP, police, and fire services. Plans must include mutual aid agreements with neighbouring utilities and access to emergency equipment and supplies. Tabletop exercises and full-scale drills must be conducted at least annually."
      },
      {
        heading: "Public Communication",
        body: "Class 3 operators must be able to communicate effectively with the public, elected officials, and media during normal operations and emergency events. Communication plans must include pre-approved messages for common scenarios and designated spokespersons. Social media monitoring can provide early warning of public concerns. Annual reports must be written in plain language and made accessible to the public."
      }
    ],
    formulas: [],
    examTips: [
      "Full-cost accounting includes capital depreciation and environmental costs, not just operating expenses",
      "Emergency Response Plans must be tested through tabletop exercises and full-scale drills at least annually",
      "Class 3 operators are responsible for supervising lower-class operators — know the certification requirements under O. Reg. 128/04"
    ]
  }
};

export const WD_OVERVIEWS_CLASS4 = {
  "General": {
    title: "General",
    intro: "The General module for Class 4 Water Distribution covers chief-operator-level knowledge of advanced hydraulics, complex system analysis, and strategic regulatory leadership. Operators must be able to direct system-wide hydraulic modelling programs, lead regulatory negotiations, and make strategic decisions about system design and expansion. This module accounts for approximately 13 of the 80 questions on the Class 4 exam.",
    keyPoints: [
      {
        heading: "Advanced Hydraulic Analysis",
        body: "Class 4 operators must be able to direct and interpret complex hydraulic analyses including transient analysis, water quality modelling, and system optimization studies. They must understand the limitations of hydraulic models and ensure that models are properly calibrated and validated. Strategic decisions about system expansion, pressure zone reconfiguration, and transmission main sizing require a thorough understanding of system hydraulics."
      },
      {
        heading: "Complex System Calculations",
        body: "Advanced calculations at Class 4 include transient pressure analysis, energy optimization, and water quality modelling. Operators must be able to interpret the results of these analyses and use them to make strategic decisions. They must also be able to critically evaluate the work of consultants and contractors and ensure that technical work meets the required standards."
      },
      {
        heading: "Advanced Electrical Applications",
        body: "Class 4 operators must understand advanced electrical concepts including power quality, harmonic distortion, and energy management systems. Power quality issues can cause equipment damage, production losses, and safety hazards. Operators must be able to specify electrical equipment, evaluate electrical system performance, and manage electrical safety programs. Energy management systems (EMS) optimize energy use across all system components."
      },
      {
        heading: "Technical Leadership",
        body: "Class 4 operators provide technical leadership for the entire distribution system organization. They must be able to develop technical standards, evaluate new technologies, and make strategic decisions about system design and operation. Technical leadership includes mentoring junior operators, developing training programs, and representing the utility in technical forums and regulatory proceedings."
      },
      {
        heading: "Strategic Regulatory Knowledge",
        body: "Class 4 operators must have a comprehensive understanding of all applicable regulations and be able to anticipate and respond to regulatory changes. They must be able to represent the utility in regulatory proceedings, negotiate compliance schedules, and develop regulatory compliance strategies. They must also understand the legislative framework governing drinking water in Ontario including the SDWA, the Clean Water Act, and the Environmental Assessment Act."
      }
    ],
    formulas: [
      { name: "Darcy-Weisbach (Turbulent)", formula: "f = 0.25 / [log(ks/(3.7D) + 5.74/Re^0.9)]²", description: "Swamee-Jain approximation for Darcy friction factor" },
      { name: "Reynolds Number", formula: "Re = V x D / v", description: "V = velocity, D = diameter, v = kinematic viscosity (1.007e-6 m2/s at 20°C)" }
    ],
    examTips: [
      "Class 4 exams do not include basic math questions — focus on strategic and regulatory knowledge",
      "Technical leadership and strategic decision-making are key themes at Class 4",
      "Know the full legislative framework: SDWA, Clean Water Act, Environmental Assessment Act, and O. Reg. 128/04"
    ]
  },
  "Support Systems": {
    title: "Support Systems",
    intro: "At Class 4, the Support Systems module requires mastery of capital planning for infrastructure replacement, advanced SCADA and automation systems, and equipment lifecycle management. Operators must be able to develop and implement system-wide asset management programs and make strategic decisions about infrastructure investment. This module accounts for approximately 8 of the 80 questions on the Class 4 exam.",
    keyPoints: [
      {
        heading: "Capital Planning for Infrastructure",
        body: "Capital planning at Class 4 involves developing long-term infrastructure renewal plans that balance risk, cost, and service level objectives. Plans must be based on rigorous condition assessment and remaining useful life estimates. Life-cycle cost analysis compares the total cost of ownership of different infrastructure options including capital, operating, and end-of-life costs. Plans must be integrated with financial plans and rate-setting processes."
      },
      {
        heading: "Advanced SCADA and Automation",
        body: "Class 4 operators must be able to specify, procure, and manage advanced SCADA and automation systems. This includes developing functional specifications, evaluating vendor proposals, and overseeing system integration. Cybersecurity for industrial control systems (ICS) is a critical responsibility — operators must implement the NIST Cybersecurity Framework and comply with applicable standards such as IEC 62443."
      },
      {
        heading: "Equipment Lifecycle Management",
        body: "Lifecycle management programs track the condition and performance of all equipment from installation to replacement. Reliability-centered maintenance (RCM) identifies the most effective maintenance strategy for each asset based on its failure modes and consequences. Operators must develop maintenance standards, manage spare parts inventories, and evaluate the cost-effectiveness of repair versus replacement decisions."
      },
      {
        heading: "System-Wide Equipment Evaluation",
        body: "Class 4 operators must be able to evaluate the performance of all system equipment against design specifications and industry benchmarks. Performance benchmarking compares the utility's equipment performance against peer utilities and identifies opportunities for improvement. Operators must be able to develop and manage equipment testing programs and interpret the results of condition assessment studies."
      },
      {
        heading: "Energy Management Programs",
        body: "Energy management programs at Class 4 involve developing and implementing strategies to reduce energy consumption and costs across the entire distribution system. Energy audits identify the largest energy consumers and opportunities for improvement. Demand response programs allow utilities to reduce energy consumption during peak demand periods in exchange for financial incentives. ISO 50001 provides a framework for energy management systems."
      }
    ],
    formulas: [],
    examTips: [
      "Life-cycle cost analysis is the standard approach for infrastructure investment decisions at Class 4",
      "ICS cybersecurity is increasingly important — know the NIST Cybersecurity Framework and IEC 62443",
      "Reliability-centered maintenance (RCM) is the preferred maintenance strategy for critical assets"
    ]
  },
  "Processes": {
    title: "Processes",
    intro: "The Processes module at Class 4 requires mastery of all distribution system processes including advanced hydraulic modelling, system-wide water quality management, risk-based asset management, and strategic planning. Operators must be able to direct complex operational programs and make strategic decisions about system design and operation. This module accounts for approximately 49 of the 80 questions on the Class 4 exam.",
    keyPoints: [
      {
        heading: "Advanced Hydraulic Modelling (EPANET)",
        body: "Class 4 operators must be able to direct and manage advanced hydraulic modelling programs using tools such as EPANET, InfoWater, or WaterGEMS. Models must be maintained as living tools that are updated with system changes and recalibrated regularly. Advanced modelling applications include transient analysis, fire flow analysis, water quality modelling, and optimization studies. Operators must be able to critically evaluate modelling results and identify model limitations."
      },
      {
        heading: "System-Wide Water Quality Management",
        body: "System-wide water quality management at Class 4 involves developing and implementing comprehensive programs to maintain water quality throughout the distribution system. Programs must address all aspects of water quality including microbial safety, chemical compliance, and aesthetic quality. Operators must understand the relationship between treatment plant performance, distribution system operations, and consumer tap water quality."
      },
      {
        heading: "Risk-Based Asset Management",
        body: "Risk-based asset management programs prioritize infrastructure renewal and maintenance based on the risk of failure. Risk = Probability of Failure x Consequence of Failure. Consequence assessment considers the impact on public health, service continuity, environmental damage, and financial cost. Operators must develop risk matrices and use them to prioritize capital investments. ISO 55000 provides the international standard for asset management."
      },
      {
        heading: "Strategic Infrastructure Planning",
        body: "Strategic infrastructure planning at Class 4 involves developing long-term plans for system expansion, rehabilitation, and replacement. Plans must be based on growth projections, service level objectives, and regulatory requirements. Environmental assessments (EAs) are required for major infrastructure projects under the Environmental Assessment Act. Operators must be able to manage complex capital projects from planning through construction and commissioning."
      },
      {
        heading: "Water Loss Control Programs",
        body: "Class 4 operators must develop and manage comprehensive water loss control programs that address all components of the water balance. Programs must include regular water audits, active leakage control, pressure management, and meter management. Performance targets must be set and progress monitored. Water loss reduction programs must be integrated with asset management plans and financial plans."
      },
      {
        heading: "DWQMS Implementation",
        body: "Class 4 operators are responsible for the overall implementation and maintenance of the DWQMS. They must ensure that the Operational Plan is current, comprehensive, and effectively implemented. Internal audits must be conducted regularly and management reviews must address all aspects of system performance. Operators must be able to respond effectively to third-party audit findings and implement corrective actions."
      }
    ],
    formulas: [
      { name: "Risk Score", formula: "Risk = PoF x CoF", description: "PoF = Probability of Failure, CoF = Consequence of Failure" },
      { name: "ILI", formula: "ILI = CARL / UARL", description: "Infrastructure Leakage Index — target < 2.0 for well-managed systems" }
    ],
    examTips: [
      "ISO 55000 is the international standard for asset management — know its key principles",
      "Risk = PoF x CoF is the foundation of risk-based asset management",
      "DWQMS third-party audits occur every three years — the Class 4 operator is responsible for the overall DWQMS program"
    ]
  },
  "Administration": {
    title: "Administration",
    intro: "The Administration module at Class 4 covers senior management responsibilities including organizational management, strategic planning, financial management, regulatory leadership, and emergency management at the organizational level. Class 4 operators are the most senior certified operators and bear ultimate responsibility for the safety and compliance of the distribution system. This module accounts for approximately 10 of the 80 questions on the Class 4 exam.",
    keyPoints: [
      {
        heading: "Organizational Management",
        body: "Class 4 operators must be able to manage complex organizations with multiple teams, programs, and stakeholders. Organizational management includes developing and implementing organizational structures, policies, and procedures. Operators must be able to lead change management initiatives, resolve conflicts, and build high-performing teams. They must understand the requirements of the Ontario Public Service Employees Union (OPSEU) collective agreement and other labour relations matters."
      },
      {
        heading: "Strategic Planning",
        body: "Strategic planning at Class 4 involves developing long-term plans for the water distribution system that align with the utility's mission, vision, and values. Strategic plans must address service level objectives, infrastructure renewal, financial sustainability, and regulatory compliance. Plans must be developed with input from stakeholders including elected officials, ratepayers, and regulatory agencies. Progress against strategic plans must be monitored and reported regularly."
      },
      {
        heading: "Financial Management and Budgeting",
        body: "Class 4 operators must be able to develop and manage complex budgets including capital and operating budgets, reserve funds, and long-term financial plans. Full-cost accounting ensures that all costs of providing water service are recovered through rates. Rate-setting must balance affordability, financial sustainability, and infrastructure renewal needs. Operators must understand the requirements of the Municipal Act and the Safe Drinking Water Act regarding financial reporting."
      },
      {
        heading: "Regulatory Leadership and DWQMS",
        body: "Class 4 operators provide regulatory leadership for the entire distribution system organization. They must maintain current knowledge of all applicable regulations and be able to anticipate and respond to regulatory changes. They must represent the utility in regulatory proceedings and negotiations. The DWQMS requires Class 4 operators to conduct regular management reviews and ensure that the Operational Plan is effectively implemented."
      },
      {
        heading: "Emergency Management Programs",
        body: "Emergency management programs at Class 4 must address a wide range of scenarios including natural disasters, infrastructure failures, contamination events, and cyber attacks. Programs must be integrated with municipal emergency management plans and provincial emergency management frameworks. Operators must be able to activate and manage the Emergency Operations Centre (EOC) and coordinate with multiple agencies. Post-incident reviews must identify lessons learned and improve future response."
      }
    ],
    formulas: [],
    examTips: [
      "Class 4 operators bear ultimate responsibility for system safety and compliance — know the legal obligations under the SDWA",
      "Strategic plans must be aligned with the utility's mission and vision and reviewed regularly",
      "Full-cost accounting and long-term financial planning are key responsibilities at Class 4"
    ]
  }
};

// ─── ONTARIO WASTEWATER COLLECTION OVERVIEWS ─────────────────────────────────

export const WWC_OVERVIEWS_CLASS1 = {
  "Operate Equipment": {
    title: "Operate Equipment",
    intro: "The Operate Equipment module covers the safe and effective operation of all equipment found in a wastewater collection system. Class 1 operators must be able to start, stop, and monitor pumps, motors, flow measurement devices, and basic SCADA controls. Recognizing normal versus abnormal operating conditions is essential for preventing system failures and protecting public health. This module accounts for approximately 15% of the Class 1 exam.",
    keyPoints: [
      {
        heading: "Pump and Motor Operation",
        body: "Submersible and dry-pit centrifugal pumps are the most common types used in lift stations. Operators must check pump performance against the design curve, monitor motor amperage against nameplate values, and verify that discharge pressure and flow are within normal ranges. Priming procedures for non-self-priming pumps must be followed to prevent dry running. Seal water systems on mechanical seals must be checked before startup."
      },
      {
        heading: "Flow Monitoring Equipment",
        body: "Flow measurement in collection systems uses magnetic flow meters (magmeters) for pressurized lines and open-channel flow meters (Parshall flumes, weirs, ultrasonic) for gravity sewers. Operators must understand the operating principles of each meter type, check for fouling or obstruction, and verify calibration. Flow data is used for system planning, regulatory reporting, and identifying infiltration and inflow (I/I)."
      },
      {
        heading: "Safety Equipment Operation",
        body: "Collection system work involves confined space entry, which requires atmospheric testing for oxygen deficiency, flammable gases, and toxic gases (H2S). Operators must use four-gas monitors, self-contained breathing apparatus (SCBA), and tripod/retrieval systems. H2S is immediately dangerous to life and health (IDLH) at 100 ppm and can be fatal within seconds at high concentrations. All confined space entries must follow the Ontario Occupational Health and Safety Act requirements."
      },
      {
        heading: "Basic Controls and Instrumentation",
        body: "Lift station controls include float switches, pressure transducers, and ultrasonic level sensors that activate pumps at set levels. Operators must understand the control logic, set pump start and stop levels, and verify that controls are functioning correctly. Telemetry systems transmit alarm and status information to a central SCADA system. Operators must respond to alarms promptly and document all alarm events."
      },
      {
        heading: "Normal versus Abnormal Operating Conditions",
        body: "Operators must establish baseline operating parameters for each lift station including normal wet well levels, pump run times, cycle frequencies, and energy consumption. Deviations from baseline indicate potential problems such as increased I/I, pump wear, or blockages. High wet well levels may indicate pump failure or blockage downstream. Low wet well levels with high pump run times may indicate a force main leak."
      }
    ],
    formulas: [
      { name: "Pump Flow Rate", formula: "Q = V / t", description: "Q = flow rate (L/s), V = volume pumped (L), t = time (s)" },
      { name: "Wet Well Volume", formula: "V = L x W x H (rectangular) or V = π x r² x H (circular)", description: "Calculate wet well volume to determine pump cycle time" }
    ],
    examTips: [
      "H2S IDLH is 100 ppm — know the action levels: 1 ppm (odour threshold), 10 ppm (action level), 50 ppm (evacuate), 100 ppm (IDLH)",
      "Four-gas monitors test for O2, LEL (combustibles), CO, and H2S — know the alarm setpoints for each",
      "Pump start and stop levels are set to maintain wet well levels within the design range"
    ]
  },
  "Evaluate and Maintain Equipment": {
    title: "Evaluate and Maintain Equipment",
    intro: "The Evaluate and Maintain Equipment module covers the inspection, evaluation, and maintenance of all equipment in a wastewater collection system. Class 1 operators must perform preventive maintenance on pumps, motors, and inspection equipment, and recognize when equipment requires corrective maintenance or replacement. This module accounts for approximately 10% of the Class 1 exam.",
    keyPoints: [
      {
        heading: "Preventive versus Corrective Maintenance",
        body: "Preventive maintenance (PM) is scheduled maintenance performed to prevent equipment failure, including lubrication, inspection, and parts replacement at set intervals. Corrective maintenance is performed after equipment has failed. A PM program reduces unplanned downtime, extends equipment life, and reduces overall maintenance costs. Maintenance records must document all PM activities, findings, and parts used."
      },
      {
        heading: "Pump and Motor Maintenance",
        body: "Pump maintenance includes checking impeller clearance, inspecting wear rings, replacing mechanical seals, and lubricating bearings. Motor maintenance includes checking insulation resistance (megger test), verifying alignment, and inspecting motor windings. Vibration analysis can detect bearing wear, misalignment, and impeller imbalance before failure occurs. Operators must follow manufacturer's recommendations for maintenance intervals."
      },
      {
        heading: "Inspection Equipment Maintenance",
        body: "CCTV inspection equipment must be maintained in good working order to provide accurate pipe condition assessments. Camera lenses must be cleaned, cables inspected for damage, and lighting systems checked. Vacuum testing equipment for manhole testing must be calibrated and seals inspected. Smoke testing equipment requires proper fuel and blower maintenance. All inspection equipment must be decontaminated after use in wastewater environments."
      },
      {
        heading: "Safety Equipment Maintenance",
        body: "Four-gas monitors must be bump tested before each use and calibrated at least monthly using certified calibration gases. SCBA units must be inspected monthly, cylinders recharged after use, and full inspections performed annually. Tripod and retrieval systems must be load tested and inspected for wear. Personal protective equipment (PPE) must be inspected before each use and replaced when damaged or worn."
      },
      {
        heading: "Maintenance Records and Work Orders",
        body: "All maintenance activities must be documented using work orders that record the date, work performed, parts used, and technician. Maintenance records provide a history of equipment performance and support warranty claims. Computerized maintenance management systems (CMMS) track work orders, parts inventory, and equipment history. Records must be retained in accordance with regulatory requirements."
      }
    ],
    formulas: [],
    examTips: [
      "Bump testing a gas monitor verifies the sensor responds to gas — calibration verifies the accuracy of the reading",
      "Megger testing measures insulation resistance — values below 1 MΩ indicate deteriorating insulation",
      "Impeller clearance should be checked and adjusted to manufacturer's specifications to maintain pump efficiency"
    ]
  },
  "Maintain and Restore Collection System": {
    title: "Maintain and Restore Collection System",
    intro: "The Maintain and Restore Collection System module covers the inspection, cleaning, and repair of gravity sewers, manholes, and related infrastructure. Class 1 operators must be able to perform routine maintenance, respond to blockages and overflows, and understand basic rehabilitation techniques. This module accounts for approximately 25% of the Class 1 exam.",
    keyPoints: [
      {
        heading: "Sewer Cleaning Methods",
        body: "High-velocity jet cleaning (hydro-jetting) uses high-pressure water (up to 20,000 kPa) to remove grease, debris, and roots from sewer pipes. Mechanical cleaning methods include bucket machines, rodding, and root cutters. Cleaning frequency depends on pipe condition, flow characteristics, and history of blockages. Fats, oils, and grease (FOG) are a major cause of sewer blockages and require regular cleaning programs in commercial areas."
      },
      {
        heading: "CCTV Inspection",
        body: "CCTV inspection is the primary method for assessing the condition of gravity sewers. Operators must understand the Pipeline Assessment Certification Program (PACP) coding system used to classify defects. Major defects include cracks, fractures, joint offsets, root intrusion, and structural collapse. Inspection results are used to prioritize maintenance and rehabilitation activities. Pre-cleaning is required before CCTV inspection to ensure accurate condition assessment."
      },
      {
        heading: "Manhole Inspection and Maintenance",
        body: "Manholes must be inspected for structural integrity, cover condition, channel condition, and signs of infiltration. Common defects include deteriorated mortar joints, cracked or spalled concrete, and corroded iron components. Manhole rehabilitation methods include cementitious lining, epoxy coating, and preformed plastic inserts. Manhole covers must be properly seated to prevent surface water inflow and unauthorized access."
      },
      {
        heading: "Sanitary Sewer Overflows (SSOs)",
        body: "SSOs occur when wastewater overflows from the collection system before reaching the treatment plant. Causes include blockages, pipe failures, and capacity exceedance during wet weather. SSOs must be reported to the MECP and the local Medical Officer of Health immediately. Operators must respond quickly to minimize the volume of overflow and protect public health and the environment. Overflow records must document the cause, volume, and corrective actions taken."
      },
      {
        heading: "Infiltration and Inflow (I/I)",
        body: "Infiltration is groundwater that enters the collection system through defects in pipes and manholes. Inflow is surface water that enters through improper connections, open manholes, and area drains. I/I increases wet weather flows, overloads treatment plants, and causes SSOs. Smoke testing and dye testing are used to identify sources of inflow. Flow monitoring and CCTV inspection identify sources of infiltration."
      }
    ],
    formulas: [
      { name: "Flow Velocity (Manning's)", formula: "V = (1/n) x R^(2/3) x S^(1/2)", description: "n = Manning's roughness, R = hydraulic radius, S = slope" },
      { name: "Hydraulic Radius", formula: "R = A / P", description: "A = flow area, P = wetted perimeter" }
    ],
    examTips: [
      "SSOs must be reported immediately to MECP and the Medical Officer of Health — know the notification requirements",
      "PACP coding is the standard for CCTV inspection defect classification — know the major defect categories",
      "Manning's n for concrete pipe is 0.013, for PVC is 0.009-0.011 — know the common values"
    ]
  },
  "Maintain Lift Stations": {
    title: "Maintain Lift Stations",
    intro: "The Maintain Lift Stations module covers the operation, maintenance, and troubleshooting of wastewater lift stations (pump stations). Class 1 operators must understand wet well design, pump selection, force main hydraulics, and emergency response procedures for lift station failures. This module accounts for approximately 15% of the Class 1 exam.",
    keyPoints: [
      {
        heading: "Wet Well Design and Operation",
        body: "Wet wells are designed to provide storage volume to allow pumps to operate within acceptable cycle times. Minimum cycle time prevents motor overheating (typically 6-10 starts per hour maximum). Maximum cycle time prevents septicity and H2S generation in the wet well. Wet well geometry affects pump performance — operators must understand the relationship between wet well level and pump efficiency. Wet wells must be inspected for grease accumulation, structural integrity, and seal condition."
      },
      {
        heading: "Force Main Hydraulics",
        body: "Force mains convey wastewater under pressure from lift stations to the treatment plant or gravity sewer. Key hydraulic parameters include velocity (minimum 0.6 m/s to prevent solids deposition), friction losses (Hazen-Williams or Darcy-Weisbach), and total dynamic head. Air release valves (ARVs) must be installed at high points to release trapped air. Operators must monitor force main pressure to detect leaks and blockages."
      },
      {
        heading: "Pump Selection and Performance",
        body: "Lift station pumps must be selected to match the system curve at the design flow rate. The operating point must be within the acceptable range on the pump curve. Pumps operating far from the best efficiency point (BEP) experience increased wear and reduced efficiency. Operators must verify pump performance by measuring flow rate and total dynamic head and comparing against the design pump curve."
      },
      {
        heading: "Emergency Response for Lift Station Failures",
        body: "Lift station failures can result in SSOs if not addressed quickly. Emergency response procedures must include: notification of the supervisor and MECP, deployment of portable pumps or vacuum trucks, isolation of the failed station, and repair or bypass procedures. Standby generators must be available and tested regularly to maintain operation during power failures. Operators must be familiar with the emergency response plan for each lift station."
      },
      {
        heading: "Odour Control at Lift Stations",
        body: "H2S and other odorous compounds are generated by anaerobic conditions in wet wells and force mains. Odour control methods include chemical dosing (iron salts, nitrate, hydrogen peroxide), ventilation, and biofilters. Chemical dosing rates must be optimized to control odour without excessive chemical costs. Operators must monitor H2S levels and adjust dosing rates accordingly. Odour complaints from the public must be investigated and documented."
      }
    ],
    formulas: [
      { name: "Pump Cycle Time", formula: "t = V / (Qin - Qpump)", description: "V = wet well volume between start/stop levels, Qin = inflow, Qpump = pump flow" },
      { name: "Force Main Velocity", formula: "V = Q / A", description: "Minimum 0.6 m/s to prevent solids deposition" }
    ],
    examTips: [
      "Minimum force main velocity is 0.6 m/s to prevent solids deposition — know this value",
      "Maximum pump starts per hour is typically 6-10 — excessive cycling overheats motors",
      "ARVs at high points in force mains are critical to prevent air locking and water hammer"
    ]
  },
  "Monitor, Evaluate and Adjust Collection System": {
    title: "Monitor, Evaluate and Adjust Collection System",
    intro: "The Monitor, Evaluate and Adjust Collection System module covers the monitoring, analysis, and operational adjustments required to maintain effective collection system performance. Class 1 operators must understand flow monitoring, capacity assessment, and the identification and control of I/I. This module accounts for approximately 25% of the Class 1 exam.",
    keyPoints: [
      {
        heading: "Flow Monitoring Programs",
        body: "Flow monitoring uses portable flow meters installed in manholes to measure flow rates at key points in the collection system. Data loggers record flow data continuously, allowing operators to identify diurnal patterns, wet weather responses, and long-term trends. Flow monitoring data is used to assess system capacity, identify I/I sources, and plan system improvements. Meters must be calibrated and data validated before use in planning decisions."
      },
      {
        heading: "Capacity Assessment",
        body: "Collection system capacity is assessed by comparing measured flows against the design capacity of pipes and lift stations. Pipes flowing more than 75% full during peak flow conditions may be at risk of surcharging. Surcharging occurs when the hydraulic grade line rises above the pipe crown, creating pressure flow conditions in a gravity sewer. Capacity deficiencies must be addressed through I/I reduction, flow diversion, or pipe upsizing."
      },
      {
        heading: "Wet Weather Response",
        body: "Wet weather events cause significant increases in flow due to I/I. Operators must monitor wet well levels and pump performance during and after rain events. Pre-storm preparation includes ensuring all pumps are operational, generators are fuelled, and emergency equipment is available. Post-storm inspections identify damage, blockages, and new sources of I/I. Wet weather flow data is essential for capacity planning and regulatory reporting."
      },
      {
        heading: "System Performance Indicators",
        body: "Key performance indicators (KPIs) for collection systems include SSO frequency and volume, pipe condition ratings, I/I as a percentage of dry weather flow, and maintenance response times. Operators must track KPIs over time and use them to identify trends and prioritize maintenance activities. Benchmarking against peer utilities identifies areas for improvement. KPIs must be reported to management and regulatory agencies as required."
      },
      {
        heading: "Operational Adjustments",
        body: "Operators must be able to make operational adjustments to respond to changing system conditions. Adjustments include changing pump start/stop levels, adjusting chemical dosing rates, and modifying cleaning frequencies. During high-flow events, operators may need to activate emergency storage, divert flows, or deploy portable pumps. All operational adjustments must be documented in the operations log."
      }
    ],
    formulas: [
      { name: "Pipe Fullness Ratio", formula: "d/D = actual depth / pipe diameter", description: "Pipes should not exceed 75% full (d/D = 0.75) during peak flow" },
      { name: "I/I Rate", formula: "I/I (L/s/ha) = (Wet Weather Flow - Dry Weather Flow) / Catchment Area", description: "Quantify infiltration and inflow per unit area" }
    ],
    examTips: [
      "Pipes flowing more than 75% full (d/D > 0.75) during peak flow are at risk of surcharging",
      "I/I is expressed as L/s/ha or L/s/km — know how to calculate it from flow monitoring data",
      "Pre-storm preparation is critical — ensure all pumps are operational before forecast rain events"
    ]
  },
  "Security, Safety and Administrative Procedures": {
    title: "Security, Safety and Administrative Procedures",
    intro: "The Security, Safety and Administrative Procedures module covers the regulatory, safety, and administrative requirements for wastewater collection system operations. Class 1 operators must understand their obligations under the Ontario Water Resources Act, the Occupational Health and Safety Act, and O. Reg. 129/04. This module accounts for approximately 10% of the Class 1 exam.",
    keyPoints: [
      {
        heading: "Regulatory Framework",
        body: "Wastewater collection systems in Ontario are regulated under the Ontario Water Resources Act (OWRA) and O. Reg. 129/04 (Sewage Systems). The Environmental Compliance Approval (ECA) sets the conditions for system operation including effluent limits, monitoring requirements, and reporting obligations. Operators must understand the requirements of the ECA and ensure that operations comply with all conditions. Non-compliance must be reported to the MECP."
      },
      {
        heading: "Confined Space Safety",
        body: "All manholes, wet wells, and underground vaults are classified as confined spaces under the Ontario Occupational Health and Safety Act. Confined space entry requires a written entry permit, atmospheric testing, continuous monitoring, a trained attendant, and rescue equipment. The entry permit must document the hazards identified, control measures implemented, and emergency procedures. No one may enter a confined space without completing all permit requirements."
      },
      {
        heading: "Record Keeping and Reporting",
        body: "Operators must maintain records of all operational data, maintenance activities, SSOs, and adverse events. Records must be retained for a minimum of 10 years. Monthly and annual reports must be submitted to the MECP as required by the ECA. SSO reports must be submitted within 24 hours of the event. Accurate and complete records are essential for regulatory compliance and system management."
      },
      {
        heading: "Emergency Response Procedures",
        body: "Emergency Response Plans must address SSOs, lift station failures, pipe collapses, and hazardous material releases. Plans must include contact lists, notification procedures, and response protocols. Operators must be familiar with the ERP and participate in regular drills. Emergency equipment including portable pumps, vacuum trucks, and bypass piping must be available and maintained in good working order."
      },
      {
        heading: "Security Procedures",
        body: "Collection system infrastructure must be secured against unauthorized access and vandalism. Manhole covers must be properly seated and locked where required. Lift station buildings must be secured with appropriate locks and access control systems. Security cameras and alarm systems may be installed at critical facilities. Operators must report any signs of tampering, vandalism, or unauthorized access to their supervisor and, if appropriate, to police."
      }
    ],
    formulas: [],
    examTips: [
      "All manholes and wet wells are confined spaces — know the entry permit requirements under the OHSA",
      "SSOs must be reported to MECP within 24 hours — know the reporting requirements under the ECA",
      "O. Reg. 129/04 governs sewage systems in Ontario — know its key requirements for collection system operators"
    ]
  }
};

export const WWC_OVERVIEWS_CLASS2 = {
  "Operate Equipment": {
    title: "Operate Equipment",
    intro: "At Class 2, the Operate Equipment module requires a deeper understanding of complex lift station equipment, advanced instrumentation, and system-wide operational management. Operators must be able to manage multi-pump stations, interpret SCADA data, and optimize pump operations for energy efficiency. This module accounts for approximately 15% of the Class 2 exam.",
    keyPoints: [
      {
        heading: "Multi-Pump Station Operations",
        body: "Large lift stations use multiple pumps to handle varying flow conditions. Pump sequencing logic determines which pumps start first and at what wet well levels. Lead-lag configurations alternate pump duty to equalize wear. Operators must understand the hydraulic implications of running different pump combinations and how each combination affects the system curve and operating point. Variable frequency drives (VFDs) allow continuous flow control and energy optimization."
      },
      {
        heading: "Advanced Instrumentation and SCADA",
        body: "Class 2 operators must interpret SCADA trend data to identify developing problems before they cause failures. Key trends include wet well level, pump run time, cycle frequency, motor current, and discharge pressure. Alarm management requires operators to prioritize and respond to alarms based on their severity and consequence. SCADA historians allow operators to review past events and identify patterns. Operators must understand the communication protocols used in SCADA systems (Modbus, DNP3, OPC)."
      },
      {
        heading: "Energy Optimization",
        body: "Lift stations are major energy consumers in wastewater utilities. Energy optimization strategies include pump scheduling to take advantage of off-peak electricity rates, VFD speed control to match pump output to inflow, and power factor correction. Specific energy consumption (kWh/m3) is the key metric for benchmarking pump efficiency. Operators must calculate specific energy and identify opportunities for improvement."
      },
      {
        heading: "Force Main Operations",
        body: "Class 2 operators must manage force main systems including pressure monitoring, air release valve maintenance, and surge protection. Pressure transients (water hammer) can cause force main failures if not properly controlled. Operators must understand the causes of water hammer and the function of surge protection devices. Force main condition assessment using pressure monitoring and acoustic methods identifies developing leaks and corrosion."
      },
      {
        heading: "Odour Control Systems",
        body: "Advanced odour control systems at Class 2 include chemical dosing systems (iron salts, nitrate, hydrogen peroxide, caustic), biological scrubbers, and activated carbon filters. Chemical dosing rates must be optimized using H2S monitoring data. Operators must understand the chemistry of H2S generation and control, including the role of sulfate-reducing bacteria (SRB) and the effect of temperature, pH, and retention time on H2S production."
      }
    ],
    formulas: [
      { name: "Specific Energy", formula: "SE (kWh/m3) = Power (kW) / Flow (m3/hr)", description: "Lower specific energy indicates more efficient pumping" },
      { name: "Affinity Law - Flow", formula: "Q2/Q1 = N2/N1", description: "Flow proportional to speed for VFD control" }
    ],
    examTips: [
      "Specific energy (kWh/m3) is the key metric for pump efficiency benchmarking",
      "VFD affinity laws: flow proportional to speed, head proportional to speed squared, power proportional to speed cubed",
      "H2S is generated by sulfate-reducing bacteria under anaerobic conditions — control by reducing retention time or dosing with iron salts"
    ]
  },
  "Evaluate and Maintain Equipment": {
    title: "Evaluate and Maintain Equipment",
    intro: "At Class 2, the Evaluate and Maintain Equipment module requires advanced knowledge of condition assessment, predictive maintenance techniques, and maintenance program management. Operators must develop and manage comprehensive maintenance programs for complex collection system equipment. This module accounts for approximately 10% of the Class 2 exam.",
    keyPoints: [
      {
        heading: "Predictive Maintenance Techniques",
        body: "Predictive maintenance uses condition monitoring data to predict equipment failures before they occur. Key techniques include vibration analysis (detects bearing wear, misalignment, and imbalance), thermography (detects electrical hot spots and bearing overheating), oil analysis (detects contamination and wear particles), and motor current signature analysis (MCSA, detects rotor bar defects). Predictive maintenance reduces unplanned downtime and extends equipment life compared to time-based PM."
      },
      {
        heading: "Pump Performance Testing",
        body: "Pump performance testing involves measuring flow rate, total dynamic head, and power consumption and comparing results against the design pump curve. Performance degradation indicates wear, blockage, or cavitation. Operators must calculate pump efficiency and specific energy from field measurements. Performance testing should be conducted at commissioning and periodically thereafter to track degradation trends."
      },
      {
        heading: "Maintenance Program Management",
        body: "Class 2 operators must develop and manage maintenance programs that balance preventive, predictive, and corrective maintenance. Maintenance programs must be documented in a CMMS that tracks work orders, parts inventory, equipment history, and maintenance costs. Key performance indicators for maintenance programs include planned maintenance compliance (PMC), mean time between failures (MTBF), and maintenance cost as a percentage of asset replacement value (ARV)."
      },
      {
        heading: "Electrical System Maintenance",
        body: "Electrical maintenance at Class 2 includes testing motor insulation resistance, checking motor starter contacts, testing transfer switches, and inspecting switchgear. Thermal imaging of electrical panels identifies hot spots caused by loose connections or overloaded circuits. Arc flash hazard analysis is required for all electrical work and must be documented in arc flash labels on all electrical equipment. Lockout/tagout (LOTO) procedures must be followed for all electrical maintenance."
      },
      {
        heading: "Inspection Equipment and Techniques",
        body: "Class 2 operators must manage comprehensive pipe inspection programs using CCTV, sonar, and laser profiling. Sonar inspection is used for pipes that cannot be dewatered. Laser profiling measures pipe deformation and ovality. Inspection data must be coded using PACP standards and entered into a geographic information system (GIS) for analysis and planning. Inspection programs must be prioritized based on pipe age, material, and maintenance history."
      }
    ],
    formulas: [
      { name: "Pump Efficiency", formula: "η = (Q x TDH x ρ x g) / (1000 x P_motor)", description: "η = efficiency, Q in m3/s, TDH in m, P_motor in kW" },
      { name: "MTBF", formula: "MTBF = Total Operating Time / Number of Failures", description: "Mean time between failures — higher is better" }
    ],
    examTips: [
      "Vibration analysis is the most effective predictive maintenance technique for rotating equipment",
      "Pump efficiency = hydraulic power output / shaft power input — know how to calculate from field measurements",
      "LOTO procedures are mandatory for all electrical maintenance — know the steps: isolate, lock, tag, test, work"
    ]
  },
  "Maintain and Restore Collection System": {
    title: "Maintain and Restore Collection System",
    intro: "At Class 2, the Maintain and Restore Collection System module covers advanced pipe rehabilitation techniques, comprehensive maintenance programs, and I/I reduction strategies. Operators must be able to plan and manage complex rehabilitation projects and develop long-term infrastructure renewal plans. This module accounts for approximately 25% of the Class 2 exam.",
    keyPoints: [
      {
        heading: "Pipe Rehabilitation Techniques",
        body: "Trenchless rehabilitation methods include cured-in-place pipe (CIPP) lining, slip lining, pipe bursting, and spray-applied lining. CIPP is the most widely used method and can rehabilitate pipes from 150 mm to 2400 mm in diameter. Pipe bursting replaces the existing pipe with a new pipe of equal or larger diameter. Method selection depends on pipe condition, diameter, access constraints, and cost. All rehabilitation work must be inspected by CCTV before and after to verify quality."
      },
      {
        heading: "I/I Reduction Programs",
        body: "I/I reduction programs use a systematic approach to identify, quantify, and eliminate sources of infiltration and inflow. The program includes flow monitoring to quantify I/I by sub-catchment, smoke testing and dye testing to identify inflow sources, CCTV inspection to identify infiltration sources, and rehabilitation to eliminate defects. Cost-effectiveness analysis compares the cost of I/I reduction against the cost of increased treatment capacity."
      },
      {
        heading: "Root Control Programs",
        body: "Tree roots are a major cause of sewer blockages and structural damage. Root control methods include mechanical cutting, chemical treatment (copper sulfate, dichlobenil), and pipe rehabilitation. Chemical root control must be applied carefully to avoid environmental damage. Root control programs must be integrated with CCTV inspection programs to identify and prioritize problem areas. Pipe lining eliminates root intrusion permanently."
      },
      {
        heading: "Manhole Rehabilitation",
        body: "Manhole rehabilitation methods include cementitious lining (shotcrete, hand-applied mortar), epoxy coating, polyurethane lining, and preformed plastic inserts. Method selection depends on the severity of deterioration, access constraints, and cost. Hydrogen sulfide corrosion is a major cause of concrete manhole deterioration in wastewater systems. Protective coatings must be resistant to H2S and sulfuric acid. All rehabilitation work must be inspected and tested for watertightness."
      },
      {
        heading: "Emergency Main Repair",
        body: "Emergency repairs to sewer mains must be completed quickly to minimize SSOs and service disruption. Repair methods include point repair (excavation and replacement of a short section), CIPP spot lining, and mechanical couplings. Operators must have emergency repair materials and equipment readily available. Traffic control plans must be in place for repairs in roadways. All emergency repairs must be documented and followed up with permanent rehabilitation if required."
      }
    ],
    formulas: [],
    examTips: [
      "CIPP is the most widely used trenchless rehabilitation method — know its advantages and limitations",
      "I/I reduction cost-effectiveness is compared against the cost of increased treatment capacity",
      "H2S corrosion of concrete is caused by sulfuric acid produced by thiobacillus bacteria — know the mechanism"
    ]
  },
  "Maintain Lift Stations": {
    title: "Maintain Lift Stations",
    intro: "At Class 2, the Maintain Lift Stations module requires advanced knowledge of lift station design, pump system analysis, and comprehensive maintenance programs. Operators must be able to manage multiple lift stations, optimize pump operations, and plan for capacity upgrades. This module accounts for approximately 15% of the Class 2 exam.",
    keyPoints: [
      {
        heading: "Lift Station Design Principles",
        body: "Lift station design must provide reliable service under all flow conditions including peak wet weather flow. Key design parameters include wet well volume, pump selection, force main sizing, and standby power. Redundancy requirements specify the number of standby pumps and the capacity of the standby power system. Operators must understand design criteria to evaluate whether existing stations are adequate for current and future flows."
      },
      {
        heading: "Pump System Analysis",
        body: "Pump system analysis involves developing the system curve and identifying the operating point for each pump combination. The system curve changes with wet well level, force main condition, and downstream conditions. Operators must understand how changes in the system curve affect pump performance and energy consumption. Parallel pump analysis determines the combined flow and head for multiple pumps operating simultaneously."
      },
      {
        heading: "Capacity Planning",
        body: "Lift station capacity must be evaluated against current and projected future flows. Peak wet weather flow (PWWF) is typically 3-5 times the average dry weather flow (ADWF) in older systems with significant I/I. Capacity upgrades may include adding pumps, increasing wet well volume, or upsizing the force main. Operators must be able to calculate the hydraulic capacity of the existing system and identify deficiencies."
      },
      {
        heading: "Standby Power Systems",
        body: "Standby generators must be sized to power all critical loads including pumps, controls, lighting, and HVAC. Automatic transfer switches (ATS) must transfer power to the generator within 10 seconds of a power failure. Generators must be tested monthly under load and serviced annually. Fuel storage must provide a minimum of 72 hours of operation at full load. Operators must have procedures for manual transfer if the ATS fails."
      },
      {
        heading: "Force Main Condition Assessment",
        body: "Force main condition assessment uses pressure monitoring, acoustic leak detection, and direct inspection to identify deterioration. Pressure transient monitoring detects developing leaks and blockages. Acoustic correlators locate leaks in pressurized force mains. Cathodic protection systems protect metallic force mains from corrosion and must be monitored and maintained. Pipe condition data is used to prioritize rehabilitation and replacement."
      }
    ],
    formulas: [
      { name: "Peak Wet Weather Flow", formula: "PWWF = Peaking Factor x ADWF", description: "Peaking factor typically 3-5 for older systems with I/I" },
      { name: "Pump Cycle Time", formula: "t_cycle = V_ww / (Q_pump - Q_in)", description: "Wet well volume / net pump discharge rate" }
    ],
    examTips: [
      "Peak wet weather flow is typically 3-5x ADWF in older systems — know how to calculate it",
      "ATS must transfer power within 10 seconds of power failure — know the testing requirements",
      "Cathodic protection systems protect metallic force mains — know the two types: sacrificial anode and impressed current"
    ]
  },
  "Monitor, Evaluate and Adjust Collection System": {
    title: "Monitor, Evaluate and Adjust Collection System",
    intro: "At Class 2, the Monitor, Evaluate and Adjust Collection System module covers advanced monitoring programs, capacity management, and system optimization. Operators must develop and manage comprehensive monitoring programs and use data to make informed operational decisions. This module accounts for approximately 25% of the Class 2 exam.",
    keyPoints: [
      {
        heading: "Advanced Flow Monitoring Programs",
        body: "Class 2 operators must design and manage comprehensive flow monitoring programs that provide data for capacity assessment, I/I quantification, and regulatory reporting. Programs must include permanent and temporary flow meters at strategic locations, data validation procedures, and analysis protocols. Flow data must be correlated with rainfall data to quantify wet weather response. Long-term flow monitoring identifies trends in system performance."
      },
      {
        heading: "Capacity Management Programs",
        body: "Capacity management programs assess the hydraulic capacity of the collection system and identify deficiencies. Hydraulic models (InfoSewer, SewerGEMS) simulate system performance under various flow conditions. Capacity deficiencies are addressed through I/I reduction, flow diversion, or infrastructure upgrades. Capacity management plans must be updated regularly to reflect system changes and growth."
      },
      {
        heading: "Wet Weather Management",
        body: "Wet weather management programs minimize SSOs and system surcharging during rain events. Programs include real-time monitoring of wet well levels and rainfall, pre-storm preparation checklists, and emergency response protocols. Combined sewer overflow (CSO) control programs are required for systems with combined sewers. Long-term control plans (LTCPs) for CSOs must demonstrate compliance with provincial water quality objectives."
      },
      {
        heading: "System Performance Reporting",
        body: "Class 2 operators must prepare comprehensive performance reports for management and regulatory agencies. Reports must include SSO frequency and volume, pipe condition ratings, I/I trends, and maintenance performance indicators. Annual reports must be submitted to the MECP as required by the ECA. Performance data must be analyzed to identify trends and opportunities for improvement."
      },
      {
        heading: "Operational Optimization",
        body: "Operational optimization uses monitoring data to improve system performance and reduce costs. Pump scheduling optimization reduces energy costs by pumping during off-peak hours and taking advantage of storage capacity. Chemical dosing optimization reduces chemical costs while maintaining adequate odour control. Maintenance scheduling optimization prioritizes high-risk assets and reduces emergency response costs."
      }
    ],
    formulas: [
      { name: "Rainfall-Dependent I/I", formula: "RDII = (Wet Weather Flow - Dry Weather Flow) / Rainfall Depth", description: "Quantify I/I response per mm of rainfall" },
      { name: "SSO Volume", formula: "V_SSO = Q_overflow x t_duration", description: "Estimate SSO volume from overflow rate and duration" }
    ],
    examTips: [
      "Hydraulic models (InfoSewer, SewerGEMS) are used for capacity assessment — know the key inputs and outputs",
      "LTCPs for CSOs must demonstrate compliance with provincial water quality objectives",
      "Rainfall-dependent I/I (RDII) is the key metric for quantifying wet weather response"
    ]
  },
  "Security, Safety and Administrative Procedures": {
    title: "Security, Safety and Administrative Procedures",
    intro: "At Class 2, the Security, Safety and Administrative Procedures module covers management responsibilities, comprehensive safety programs, and regulatory compliance at a supervisory level. Operators must be able to develop and implement safety programs, manage regulatory compliance, and supervise Class 1 operators. This module accounts for approximately 10% of the Class 2 exam.",
    keyPoints: [
      {
        heading: "Safety Program Management",
        body: "Class 2 operators must develop and manage comprehensive safety programs that comply with the Ontario Occupational Health and Safety Act. Programs must include hazard identification and risk assessment, safe work procedures, training and competency verification, incident investigation, and emergency response. Joint Health and Safety Committees (JHSCs) are required for workplaces with 20 or more workers and must include worker representatives."
      },
      {
        heading: "Confined Space Program",
        body: "A comprehensive confined space program includes hazard assessment for all confined spaces, written entry procedures, training for all workers who may enter or supervise confined space entry, rescue procedures and equipment, and annual program review. Atmospheric testing must be performed by a competent person using calibrated equipment. The program must be reviewed and updated after any incident or near-miss involving confined space entry."
      },
      {
        heading: "Staff Supervision and Training",
        body: "Class 2 operators are responsible for supervising Class 1 operators and ensuring that all staff are properly trained and certified. Training records must be maintained and updated. Operators must be familiar with the requirements of O. Reg. 129/04 regarding operator certification. Performance management programs include regular performance reviews, training needs assessments, and corrective action procedures for performance deficiencies."
      },
      {
        heading: "Regulatory Compliance Management",
        body: "Regulatory compliance management at Class 2 includes maintaining compliance schedules, tracking monitoring requirements, and ensuring that all reports are submitted on time. Non-compliance must be investigated and root causes addressed. Corrective action plans must be developed and implemented. Operators must maintain current knowledge of all applicable regulations and be aware of upcoming regulatory changes."
      },
      {
        heading: "Emergency Response Planning",
        body: "Emergency Response Plans at Class 2 must address a wider range of scenarios and involve coordination with multiple agencies. Plans must include mutual aid agreements with neighbouring utilities and access to emergency equipment. Tabletop exercises and full-scale drills must be conducted regularly. Post-incident reviews must identify lessons learned and improve future response. Plans must be updated annually and after each emergency event."
      }
    ],
    formulas: [],
    examTips: [
      "JHSCs are required for workplaces with 20 or more workers — know the composition and responsibilities",
      "Confined space programs must be reviewed and updated after any incident or near-miss",
      "O. Reg. 129/04 governs operator certification for collection systems — know the classification requirements"
    ]
  }
};

export const WWC_OVERVIEWS_CLASS3 = {
  "Operate Equipment": {
    title: "Operate Equipment",
    intro: "At Class 3, the Operate Equipment module requires advanced knowledge of complex collection system equipment, system-wide operational management, and performance optimization. Operators must manage large, complex systems with multiple lift stations and force mains, and optimize operations for energy efficiency and reliability. This module accounts for approximately 15% of the Class 3 exam.",
    keyPoints: [
      {
        heading: "Complex System Operations",
        body: "Class 3 operators manage large collection systems with multiple lift stations, force mains, and storage facilities. System-wide operational management requires understanding the hydraulic interactions between system components. Operators must develop operational rules for pump sequencing, storage management, and flow routing that optimize system performance across all conditions. Real-time hydraulic models can support operational decision-making in complex systems."
      },
      {
        heading: "Advanced SCADA Management",
        body: "Class 3 operators must manage complex SCADA systems with hundreds of monitoring points and control devices. SCADA system management includes alarm rationalization (reducing nuisance alarms), historian database management, and cybersecurity. Operators must be able to develop SCADA displays and reports that provide meaningful operational information. SCADA system redundancy must be maintained to ensure continuous monitoring during system failures."
      },
      {
        heading: "Energy Management",
        body: "Energy management at Class 3 involves developing and implementing system-wide strategies to reduce energy consumption and costs. Strategies include pump scheduling optimization, VFD retrofits, power factor correction, and demand response participation. Energy audits identify the largest energy consumers and quantify savings opportunities. Operators must track energy KPIs and report progress against energy reduction targets."
      },
      {
        heading: "Equipment Performance Management",
        body: "Class 3 operators must manage comprehensive equipment performance programs that track the condition and performance of all system equipment. Performance benchmarking compares equipment performance against design specifications and peer utilities. Operators must identify equipment approaching end-of-life and develop replacement plans. Equipment performance data must be integrated with asset management systems."
      },
      {
        heading: "Advanced Odour Control",
        body: "Advanced odour control at Class 3 requires a system-wide approach that addresses all sources of odorous compounds. Operators must develop odour control strategies based on H2S generation modelling, which considers temperature, pH, retention time, and sulfate concentration. Advanced treatment technologies include biological scrubbers, activated carbon, UV oxidation, and ozone. Odour monitoring programs must include continuous H2S monitoring at critical locations."
      }
    ],
    formulas: [
      { name: "H2S Generation Rate", formula: "H2S (mg/L) = k x BOD x t / (V/Q)", description: "k = rate constant, BOD = biochemical oxygen demand, t = retention time" },
      { name: "Energy Intensity", formula: "EI (kWh/ML) = Annual Energy (kWh) / Annual Flow (ML)", description: "System-wide energy intensity metric" }
    ],
    examTips: [
      "H2S generation is proportional to BOD, temperature, and retention time — know the factors that increase H2S production",
      "Energy intensity (kWh/ML) is the system-wide energy efficiency metric — lower is better",
      "SCADA alarm rationalization reduces nuisance alarms and improves operator response to critical alarms"
    ]
  },
  "Evaluate and Maintain Equipment": {
    title: "Evaluate and Maintain Equipment",
    intro: "At Class 3, the Evaluate and Maintain Equipment module requires advanced knowledge of asset management, reliability engineering, and maintenance program optimization. Operators must develop and manage comprehensive asset management programs that optimize the lifecycle of all collection system equipment. This module accounts for approximately 15% of the Class 3 exam.",
    keyPoints: [
      {
        heading: "Reliability-Centered Maintenance (RCM)",
        body: "RCM is a systematic approach to developing maintenance strategies based on equipment failure modes and their consequences. The RCM process identifies the functions of each asset, the ways it can fail, the effects of failure, and the appropriate maintenance strategy. Maintenance strategies include time-based PM, condition-based maintenance (CBM), run-to-failure, and redesign. RCM reduces maintenance costs while maintaining or improving equipment reliability."
      },
      {
        heading: "Asset Condition Assessment Programs",
        body: "Comprehensive condition assessment programs use multiple techniques to evaluate the condition of all collection system assets. Techniques include CCTV inspection, sonar, laser profiling, structural analysis, and geotechnical investigation. Condition ratings are used to calculate remaining useful life and prioritize rehabilitation and replacement. Condition assessment data must be maintained in a GIS-based asset management system."
      },
      {
        heading: "Maintenance Program Optimization",
        body: "Maintenance program optimization uses performance data to continuously improve maintenance effectiveness and efficiency. Key metrics include planned maintenance compliance (PMC), mean time between failures (MTBF), mean time to repair (MTTR), and maintenance cost as a percentage of asset replacement value (ARV). Benchmarking against peer utilities identifies opportunities for improvement. Optimization requires a mature CMMS with accurate historical data."
      },
      {
        heading: "Equipment Specification and Procurement",
        body: "Class 3 operators must be able to develop technical specifications for collection system equipment and evaluate vendor proposals. Specifications must address performance requirements, material standards, installation requirements, and testing criteria. Life-cycle cost analysis compares the total cost of ownership of different equipment options. Operators must manage the procurement process from specification development through commissioning and warranty."
      },
      {
        heading: "Maintenance Management Systems",
        body: "Advanced CMMS systems provide comprehensive maintenance management capabilities including work order management, preventive maintenance scheduling, parts inventory management, and performance reporting. Operators must ensure that CMMS data is accurate and complete. Integration with GIS, SCADA, and financial systems provides a comprehensive view of asset performance and cost. Mobile CMMS applications allow field technicians to access and update work orders in real time."
      }
    ],
    formulas: [
      { name: "Availability", formula: "A = MTBF / (MTBF + MTTR)", description: "Equipment availability — target > 99% for critical assets" },
      { name: "Maintenance Cost Ratio", formula: "MCR = Annual Maintenance Cost / Asset Replacement Value", description: "Target < 2-4% for well-maintained assets" }
    ],
    examTips: [
      "RCM identifies the most cost-effective maintenance strategy for each asset based on failure modes and consequences",
      "Equipment availability = MTBF / (MTBF + MTTR) — know how to calculate and interpret it",
      "Maintenance cost ratio > 4% of ARV indicates that replacement may be more cost-effective than continued maintenance"
    ]
  },
  "Maintain and Restore Collection System": {
    title: "Maintain and Restore Collection System",
    intro: "At Class 3, the Maintain and Restore Collection System module covers advanced infrastructure management, complex rehabilitation projects, and strategic asset management. Operators must develop and manage comprehensive infrastructure renewal programs that address the full lifecycle of collection system assets. This module accounts for approximately 15% of the Class 3 exam.",
    keyPoints: [
      {
        heading: "Infrastructure Asset Management",
        body: "Infrastructure asset management at Class 3 involves developing and implementing comprehensive programs to manage the full lifecycle of collection system assets. Programs must address asset inventory, condition assessment, risk assessment, rehabilitation and replacement planning, and financial planning. The Ontario Municipal Infrastructure Strategy requires municipalities to develop asset management plans that address all infrastructure categories. Plans must be updated regularly and integrated with financial plans."
      },
      {
        heading: "Complex Rehabilitation Projects",
        body: "Class 3 operators must manage complex rehabilitation projects involving multiple rehabilitation methods, large pipe diameters, and challenging site conditions. Project management skills include scope definition, contractor procurement, construction supervision, quality control, and commissioning. Operators must understand the technical requirements of each rehabilitation method and be able to evaluate contractor proposals and inspect completed work."
      },
      {
        heading: "Advanced I/I Reduction",
        body: "Advanced I/I reduction programs use a systematic, catchment-based approach to identify and eliminate all significant sources of I/I. Programs include comprehensive flow monitoring, hydraulic modelling, condition assessment, and targeted rehabilitation. Cost-benefit analysis compares the cost of I/I reduction against the avoided cost of capacity upgrades and treatment. I/I reduction programs must demonstrate measurable reductions in wet weather flow."
      },
      {
        heading: "Collection System Modelling",
        body: "Hydraulic models of the collection system (InfoSewer, SewerGEMS, SWMM) are used for capacity assessment, I/I analysis, and planning of system improvements. Models must be calibrated against measured flow data and validated against independent data sets. Advanced modelling applications include real-time control (RTC) optimization and climate change impact assessment. Operators must understand model limitations and uncertainty."
      },
      {
        heading: "Asset Rehabilitation Planning",
        body: "Asset rehabilitation planning uses condition assessment data, risk assessment, and financial analysis to develop prioritized rehabilitation and replacement plans. Risk-based prioritization considers the probability of failure, the consequence of failure, and the cost of rehabilitation. Plans must be integrated with financial plans to ensure that sufficient funds are available. Long-term plans must address the renewal of the entire asset base over a 20-50 year planning horizon."
      }
    ],
    formulas: [
      { name: "Risk Score", formula: "Risk = PoF x CoF", description: "PoF = Probability of Failure, CoF = Consequence of Failure (1-5 scale)" },
      { name: "Net Present Value", formula: "NPV = sum of [CF_t / (1+r)^t]", description: "Compare lifecycle costs of rehabilitation options" }
    ],
    examTips: [
      "Risk-based prioritization uses Risk = PoF x CoF — know how to apply this to rehabilitation planning",
      "The Ontario Municipal Infrastructure Strategy requires municipalities to develop asset management plans",
      "Collection system hydraulic models must be calibrated against measured flow data before use in planning"
    ]
  },
  "Maintain Lift Stations": {
    title: "Maintain Lift Stations",
    intro: "At Class 3, the Maintain Lift Stations module requires advanced knowledge of lift station management, including system-wide capacity planning, force main network management, and long-term infrastructure planning. Operators must manage complex lift station networks and plan for future capacity needs. This module accounts for approximately 10% of the Class 3 exam.",
    keyPoints: [
      {
        heading: "System-Wide Capacity Planning",
        body: "System-wide capacity planning assesses the hydraulic capacity of the entire lift station network and identifies deficiencies. Planning must consider current and projected future flows, including growth and climate change impacts. Hydraulic models are used to evaluate the performance of the system under various scenarios. Capacity upgrades must be planned and budgeted as part of the long-term capital plan."
      },
      {
        heading: "Force Main Network Management",
        body: "Force main network management involves monitoring the condition and performance of all force mains in the system. Key activities include pressure monitoring, acoustic leak detection, cathodic protection monitoring, and condition assessment. Force main failures can cause major SSOs and service disruptions. Operators must develop risk-based rehabilitation and replacement plans for all force mains based on condition, age, and consequence of failure."
      },
      {
        heading: "Long-Term Pumping Infrastructure Planning",
        body: "Long-term planning for pumping infrastructure must address the replacement of aging pumps, motors, and electrical equipment. Planning must consider the increasing energy efficiency of new equipment and the potential for VFD retrofits. Operators must develop replacement schedules based on equipment age, condition, and performance data. Plans must be integrated with financial plans and rate-setting processes."
      },
      {
        heading: "Lift Station Optimization Programs",
        body: "Lift station optimization programs use operational data to identify and implement improvements in energy efficiency, reliability, and maintenance costs. Optimization strategies include pump replacement with higher-efficiency models, VFD retrofits, pump scheduling optimization, and wet well level optimization. Operators must quantify the benefits of optimization measures and prioritize investments based on cost-effectiveness."
      },
      {
        heading: "Energy Management for Pumping",
        body: "Energy management for pumping at Class 3 involves developing and implementing system-wide strategies to reduce energy consumption and costs. Strategies include peak demand management, power factor correction, and demand response participation. Operators must track energy KPIs for each lift station and the system as a whole. Energy management plans must set targets and identify specific measures to achieve them."
      }
    ],
    formulas: [
      { name: "System Efficiency", formula: "η_system = η_pump x η_motor x η_VFD", description: "Overall system efficiency is the product of component efficiencies" },
      { name: "Annual Energy Cost", formula: "Cost = SEC x Annual Flow x Energy Rate", description: "SEC in kWh/m3, flow in m3, rate in $/kWh" }
    ],
    examTips: [
      "System efficiency = pump efficiency x motor efficiency x VFD efficiency — know typical values for each",
      "Force main condition assessment uses pressure monitoring and acoustic methods — know the techniques",
      "Long-term capital plans must address the full lifecycle of pumping infrastructure"
    ]
  },
  "Monitor, Evaluate and Adjust Collection System": {
    title: "Monitor, Evaluate and Adjust Collection System",
    intro: "At Class 3, the Monitor, Evaluate and Adjust Collection System module covers strategic system management including long-term control plans (LTCPs) for CSOs, capacity management programs, and performance management systems. Operators must develop and manage comprehensive monitoring and management programs for complex collection systems. This module accounts for approximately 25% of the Class 3 exam.",
    keyPoints: [
      {
        heading: "Long-Term Control Plans (LTCPs) for CSOs",
        body: "LTCPs are required for municipalities with combined sewer systems to demonstrate compliance with provincial water quality objectives. LTCPs must evaluate all feasible control alternatives including source controls, collection system controls, and treatment controls. The plan must demonstrate that the selected alternative achieves the required level of CSO control. LTCPs must be approved by the MECP and implemented on a defined schedule."
      },
      {
        heading: "Capacity Management Programs",
        body: "Capacity management programs at Class 3 use hydraulic models, flow monitoring, and performance data to manage system capacity proactively. Programs must identify capacity deficiencies before they cause SSOs or service disruptions. Capacity management plans must be integrated with I/I reduction programs, growth management plans, and capital plans. Real-time capacity management uses SCADA data and predictive models to optimize system operations during wet weather events."
      },
      {
        heading: "Performance Management Systems",
        body: "Performance management systems at Class 3 track a comprehensive set of KPIs covering all aspects of collection system performance. KPIs must be aligned with regulatory requirements, service level objectives, and strategic goals. Performance data must be analyzed to identify trends, benchmark against peers, and prioritize improvement initiatives. Performance reports must be prepared for management, elected officials, and regulatory agencies."
      },
      {
        heading: "Regulatory Strategy and Compliance",
        body: "Class 3 operators must develop and implement regulatory compliance strategies that address all applicable requirements. Strategies must include proactive engagement with regulatory agencies, compliance monitoring programs, and corrective action procedures. Operators must anticipate regulatory changes and develop plans to achieve compliance. Regulatory compliance must be integrated with operational planning and capital planning."
      },
      {
        heading: "Environmental Management Programs",
        body: "Environmental management programs at Class 3 address the environmental impacts of collection system operations including SSOs, odour, and noise. Programs must comply with the Environmental Protection Act and other applicable legislation. Environmental monitoring programs track the impacts of system operations on receiving water bodies and the surrounding environment. Environmental management plans must set targets and identify measures to reduce environmental impacts."
      }
    ],
    formulas: [
      { name: "CSO Volume Reduction", formula: "Reduction (%) = (Baseline CSO - Current CSO) / Baseline CSO x 100", description: "Measure progress toward LTCP targets" },
      { name: "SSO Rate", formula: "SSO Rate = Number of SSOs / 100 km of sewer / year", description: "Benchmark SSO performance against peer utilities" }
    ],
    examTips: [
      "LTCPs must evaluate all feasible control alternatives and demonstrate compliance with provincial water quality objectives",
      "SSO rate per 100 km of sewer per year is the standard benchmark metric for collection system performance",
      "Real-time capacity management uses SCADA data and predictive models — know the concept and applications"
    ]
  },
  "Security, Safety and Administrative Procedures": {
    title: "Security, Safety and Administrative Procedures",
    intro: "At Class 3, the Security, Safety and Administrative Procedures module covers senior management responsibilities including organizational leadership, strategic planning, regulatory leadership, and emergency management programs. Operators must be able to manage complex organizations and lead regulatory compliance programs. This module accounts for approximately 20% of the Class 3 exam.",
    keyPoints: [
      {
        heading: "Organizational Leadership",
        body: "Class 3 operators provide organizational leadership for collection system operations. Leadership responsibilities include developing organizational culture, managing change, resolving conflicts, and building high-performing teams. Operators must understand labour relations, collective agreements, and human rights obligations. Effective communication with staff, management, elected officials, and the public is a critical leadership skill."
      },
      {
        heading: "Strategic Planning",
        body: "Strategic planning at Class 3 involves developing long-term plans for collection system operations that align with the municipality's strategic goals. Plans must address service level objectives, infrastructure renewal, financial sustainability, and regulatory compliance. Strategic plans must be developed with input from stakeholders and reviewed regularly. Progress against strategic plans must be monitored and reported."
      },
      {
        heading: "Regulatory Leadership and Environmental Compliance",
        body: "Class 3 operators provide regulatory leadership for the collection system organization. They must maintain current knowledge of all applicable regulations and be able to anticipate and respond to regulatory changes. They must represent the utility in regulatory proceedings and negotiations. Environmental compliance programs must address all aspects of collection system operations including SSOs, odour, and receiving water quality."
      },
      {
        heading: "Emergency Management Programs",
        body: "Emergency management programs at Class 3 must address a wide range of scenarios including major SSOs, infrastructure failures, and natural disasters. Programs must be integrated with municipal emergency management plans. Operators must be able to activate and manage the Emergency Operations Centre (EOC) and coordinate with multiple agencies. Post-incident reviews must identify lessons learned and improve future response."
      },
      {
        heading: "Performance Management and KPIs",
        body: "Performance management at Class 3 involves developing and managing a comprehensive set of KPIs that cover all aspects of collection system operations. KPIs must be aligned with regulatory requirements, service level objectives, and strategic goals. Performance data must be analyzed to identify trends, benchmark against peers, and prioritize improvement initiatives. Performance reports must be prepared for management, elected officials, and regulatory agencies."
      }
    ],
    formulas: [],
    examTips: [
      "Class 3 operators represent the utility in regulatory proceedings — know the regulatory framework and key regulations",
      "Emergency management programs must be integrated with municipal emergency management plans",
      "KPIs must be aligned with regulatory requirements, service level objectives, and strategic goals"
    ]
  }
};

export const WWC_OVERVIEWS_CLASS4 = {
  "Operate Equipment": {
    title: "Operate Equipment",
    intro: "At Class 4, the Operate Equipment module focuses on strategic oversight of complex collection system operations, advanced technology management, and organizational leadership in equipment operations. Class 4 operators must provide technical direction for all aspects of collection system equipment management. This module accounts for approximately 15% of the Class 4 exam.",
    keyPoints: [
      {
        heading: "Technical Leadership in Equipment Management",
        body: "Class 4 operators provide technical leadership for all aspects of collection system equipment management. This includes developing technical standards, evaluating new technologies, and making strategic decisions about equipment selection and replacement. Operators must be able to critically evaluate the work of consultants and contractors and ensure that technical work meets the required standards. Technical leadership includes mentoring junior operators and developing training programs."
      },
      {
        heading: "System-Wide Optimization",
        body: "System-wide optimization at Class 4 involves developing and implementing strategies to optimize the performance of the entire collection system. Optimization strategies address energy efficiency, reliability, maintenance costs, and environmental performance. Operators must use data analytics and modelling tools to identify optimization opportunities and quantify the benefits of proposed improvements. Optimization programs must be integrated with capital planning and financial planning."
      },
      {
        heading: "Equipment Procurement and Specification",
        body: "Class 4 operators must be able to develop comprehensive technical specifications for all types of collection system equipment. Specifications must address performance requirements, material standards, installation requirements, testing criteria, and lifecycle cost. Operators must manage the procurement process from specification development through commissioning and warranty. Life-cycle cost analysis is required for all major equipment purchases."
      },
      {
        heading: "Advanced Automation and Control",
        body: "Advanced automation and control systems at Class 4 include real-time control (RTC) systems that optimize collection system operations in real time using SCADA data and predictive models. Operators must understand the design and operation of RTC systems and be able to evaluate their performance. Cybersecurity for industrial control systems is a critical responsibility — operators must implement appropriate security measures to protect against unauthorized access."
      },
      {
        heading: "Energy Management Programs",
        body: "Energy management programs at Class 4 involve developing and implementing strategic plans to reduce energy consumption and costs across the entire collection system. Programs must include energy audits, benchmarking, target-setting, and performance monitoring. Operators must be able to evaluate the cost-effectiveness of energy efficiency investments and prioritize them based on return on investment. ISO 50001 provides a framework for energy management systems."
      }
    ],
    formulas: [],
    examTips: [
      "Class 4 exams focus on strategic and leadership knowledge, not basic calculations",
      "ISO 50001 is the international standard for energy management systems — know its key requirements",
      "RTC systems optimize collection system operations in real time — know the concept and applications"
    ]
  },
  "Evaluate and Maintain Equipment": {
    title: "Evaluate and Maintain Equipment",
    intro: "At Class 4, the Evaluate and Maintain Equipment module requires mastery of asset management, reliability engineering, and strategic maintenance program management. Operators must develop and implement organization-wide asset management programs that optimize the lifecycle of all collection system assets. This module accounts for approximately 15% of the Class 4 exam.",
    keyPoints: [
      {
        heading: "Risk-Based Asset Management (ISO 55000)",
        body: "ISO 55000 provides the international standard for asset management systems. Key principles include alignment with organizational objectives, risk-based decision-making, and continuous improvement. Asset management plans must address the full lifecycle of all assets from acquisition through disposal. Operators must develop asset management policies, strategies, and objectives that are aligned with the organization's strategic goals."
      },
      {
        heading: "Strategic Maintenance Planning",
        body: "Strategic maintenance planning at Class 4 involves developing organization-wide maintenance strategies that optimize the balance between maintenance cost, asset reliability, and risk. Strategies must be based on rigorous analysis of failure modes, consequences, and maintenance effectiveness. Operators must develop maintenance budgets, resource plans, and performance targets. Maintenance strategies must be reviewed and updated regularly based on performance data."
      },
      {
        heading: "Infrastructure Investment Decisions",
        body: "Infrastructure investment decisions at Class 4 involve evaluating competing capital projects and allocating limited resources to maximize value. Decision-making frameworks include risk-based prioritization, multi-criteria analysis, and life-cycle cost analysis. Operators must be able to develop business cases for capital projects that quantify costs, benefits, and risks. Investment decisions must be integrated with long-term financial plans and rate-setting."
      },
      {
        heading: "Asset Performance Management",
        body: "Asset performance management at Class 4 involves developing and managing comprehensive systems to track the performance of all collection system assets. Performance data must be collected, validated, and analyzed to support decision-making. Key performance indicators must be aligned with regulatory requirements, service level objectives, and strategic goals. Performance management systems must be integrated with CMMS, GIS, and financial systems."
      },
      {
        heading: "Capital Planning",
        body: "Capital planning at Class 4 involves developing long-term plans for infrastructure renewal that balance risk, cost, and service level objectives. Plans must be based on rigorous condition assessment and remaining useful life estimates. Financial analysis must consider the full lifecycle cost of infrastructure including capital, operating, and end-of-life costs. Capital plans must be integrated with financial plans and rate-setting processes to ensure long-term financial sustainability."
      }
    ],
    formulas: [],
    examTips: [
      "ISO 55000 is the international standard for asset management — know its key principles and requirements",
      "Life-cycle cost analysis is required for all major infrastructure investment decisions at Class 4",
      "Capital plans must be integrated with financial plans to ensure long-term financial sustainability"
    ]
  },
  "Maintain and Restore Collection System": {
    title: "Maintain and Restore Collection System",
    intro: "At Class 4, the Maintain and Restore Collection System module covers long-term infrastructure planning, risk-based asset management for collection systems, and strategic rehabilitation programs. Operators must be able to direct complex infrastructure renewal programs and make strategic decisions about system design and operation. This module accounts for approximately 15% of the Class 4 exam.",
    keyPoints: [
      {
        heading: "Long-Term Infrastructure Planning",
        body: "Long-term infrastructure planning at Class 4 involves developing 20-50 year plans for the renewal of the entire collection system. Plans must be based on comprehensive condition assessment, risk assessment, and financial analysis. Planning must consider population growth, climate change impacts, and regulatory requirements. Plans must be updated regularly to reflect new information and changing conditions."
      },
      {
        heading: "Risk-Based Rehabilitation Programs",
        body: "Risk-based rehabilitation programs prioritize infrastructure renewal based on the risk of failure. Risk assessment considers the probability of failure (based on condition, age, and material) and the consequence of failure (based on location, pipe size, and downstream impacts). High-risk assets are prioritized for rehabilitation or replacement. Risk assessments must be updated regularly as new condition data becomes available."
      },
      {
        heading: "Strategic Asset Management",
        body: "Strategic asset management at Class 4 involves developing and implementing organization-wide asset management programs that optimize the lifecycle of all collection system assets. Programs must address asset inventory, condition assessment, risk assessment, rehabilitation and replacement planning, and financial planning. Asset management plans must comply with the Ontario Municipal Infrastructure Strategy requirements."
      },
      {
        heading: "Capital Investment Planning",
        body: "Capital investment planning at Class 4 involves developing and managing multi-year capital programs that address the renewal of aging infrastructure. Programs must be based on rigorous analysis of asset condition, risk, and financial capacity. Capital programs must be integrated with financial plans and rate-setting processes. Operators must be able to develop business cases for capital projects and present them to management and elected officials."
      },
      {
        heading: "Sustainability in Collection Systems",
        body: "Sustainability programs at Class 4 address the environmental, social, and economic impacts of collection system operations. Environmental sustainability includes reducing energy consumption, minimizing SSOs, and protecting receiving water quality. Social sustainability includes maintaining affordable rates and providing reliable service. Economic sustainability includes ensuring long-term financial viability through appropriate rate-setting and asset management."
      }
    ],
    formulas: [],
    examTips: [
      "The Ontario Municipal Infrastructure Strategy requires municipalities to develop asset management plans — know the requirements",
      "Risk = PoF x CoF is the foundation of risk-based rehabilitation planning",
      "Sustainability programs must address environmental, social, and economic dimensions"
    ]
  },
  "Maintain Lift Stations": {
    title: "Maintain Lift Stations",
    intro: "At Class 4, the Maintain Lift Stations module requires strategic-level knowledge of lift station management including system-wide capacity planning, force main network management, and long-term infrastructure planning for pumping infrastructure. Operators must make strategic decisions about pumping infrastructure investment and management. This module accounts for approximately 10% of the Class 4 exam.",
    keyPoints: [
      {
        heading: "System-Wide Capacity Planning",
        body: "System-wide capacity planning at Class 4 involves developing long-term plans for pumping infrastructure that address current and future capacity needs. Plans must consider population growth, climate change impacts, and I/I reduction programs. Hydraulic models are used to evaluate system performance under various scenarios. Capacity plans must be integrated with collection system master plans and financial plans."
      },
      {
        heading: "Force Main Network Management",
        body: "Force main network management at Class 4 involves developing and implementing strategic programs to manage the condition and performance of all force mains. Programs must include condition assessment, risk assessment, and rehabilitation and replacement planning. Force main failures can cause major SSOs and service disruptions — operators must ensure that high-risk force mains are identified and addressed proactively."
      },
      {
        heading: "Long-Term Pumping Infrastructure Planning",
        body: "Long-term planning for pumping infrastructure must address the replacement of aging equipment and the upgrade of systems that no longer meet current standards. Planning must consider the increasing energy efficiency of new equipment and the potential for technology upgrades. Plans must be integrated with financial plans and rate-setting processes to ensure long-term financial sustainability."
      },
      {
        heading: "Lift Station Optimization Programs",
        body: "Lift station optimization programs at Class 4 use operational data and modelling to identify and implement improvements across the entire lift station network. Optimization strategies address energy efficiency, reliability, maintenance costs, and environmental performance. Operators must quantify the benefits of optimization measures and prioritize investments based on cost-effectiveness and strategic alignment."
      },
      {
        heading: "Energy Management for Pumping",
        body: "Energy management for pumping at Class 4 involves developing and implementing strategic plans to reduce energy consumption and costs across the entire pumping network. Programs must include energy audits, benchmarking, target-setting, and performance monitoring. Operators must be able to evaluate the cost-effectiveness of energy efficiency investments and present business cases to management."
      }
    ],
    formulas: [],
    examTips: [
      "Class 4 lift station management focuses on strategic planning and investment decisions, not operational details",
      "Force main network management must be risk-based — prioritize high-risk mains for assessment and rehabilitation",
      "Energy management programs must include targets, measures, and performance monitoring"
    ]
  },
  "Monitor, Evaluate and Adjust Collection System": {
    title: "Monitor, Evaluate and Adjust Collection System",
    intro: "At Class 4, this module covers strategic system management including long-term control plans (LTCPs) for CSOs, capacity management programs, and performance management systems at the organizational level. Operators must provide strategic direction for all aspects of collection system monitoring and management. This module accounts for approximately 25% of the Class 4 exam.",
    keyPoints: [
      {
        heading: "Long-Term Control Plans (LTCPs) for CSOs",
        body: "LTCPs at Class 4 require strategic leadership to develop, implement, and manage complex programs that may involve billions of dollars in infrastructure investment. Operators must be able to evaluate all feasible control alternatives, develop implementation schedules, and manage regulatory negotiations. LTCPs must demonstrate compliance with provincial water quality objectives and be approved by the MECP. Progress must be reported to the MECP and the public regularly."
      },
      {
        heading: "Capacity Management Programs",
        body: "Capacity management programs at Class 4 involve strategic planning to ensure that the collection system has sufficient capacity to serve current and future needs. Programs must address I/I reduction, system optimization, and infrastructure upgrades. Capacity management plans must be integrated with official plans, development charges programs, and financial plans. Real-time capacity management uses advanced SCADA and modelling tools to optimize system operations."
      },
      {
        heading: "Performance Management Systems",
        body: "Performance management systems at Class 4 provide strategic oversight of all aspects of collection system performance. Systems must track KPIs aligned with regulatory requirements, service level objectives, and strategic goals. Performance data must be analyzed to identify trends, benchmark against peers, and prioritize improvement initiatives. Performance reports must be prepared for management, elected officials, and regulatory agencies."
      },
      {
        heading: "Regulatory Strategy and Compliance",
        body: "Regulatory strategy at Class 4 involves developing and implementing proactive approaches to regulatory compliance that anticipate future requirements and minimize compliance costs. Operators must maintain current knowledge of all applicable regulations and be able to represent the utility in regulatory proceedings. Regulatory compliance programs must be integrated with operational planning and capital planning."
      },
      {
        heading: "Environmental Management Programs",
        body: "Environmental management programs at Class 4 address the strategic management of all environmental impacts of collection system operations. Programs must comply with the Environmental Protection Act, the Ontario Water Resources Act, and other applicable legislation. Environmental management plans must set targets and identify measures to reduce environmental impacts. Operators must be able to report on environmental performance to management, elected officials, and the public."
      }
    ],
    formulas: [],
    examTips: [
      "LTCPs at Class 4 require strategic leadership and regulatory negotiation skills — know the LTCP development process",
      "Performance management systems must be aligned with regulatory requirements, service level objectives, and strategic goals",
      "Environmental management programs must comply with the EPA, OWRA, and other applicable legislation"
    ]
  },
  "Security, Safety and Administrative Procedures": {
    title: "Security, Safety and Administrative Procedures",
    intro: "At Class 4, the Security, Safety and Administrative Procedures module covers senior management responsibilities including organizational leadership, strategic planning, regulatory leadership, and emergency management programs at the organizational level. Class 4 operators bear ultimate responsibility for the safety, compliance, and performance of the collection system. This module accounts for approximately 20% of the Class 4 exam.",
    keyPoints: [
      {
        heading: "Organizational Leadership",
        body: "Class 4 operators provide organizational leadership for the entire collection system organization. Leadership responsibilities include developing organizational culture, managing change, resolving conflicts, and building high-performing teams. Operators must understand labour relations, collective agreements, and human rights obligations. Effective communication with staff, management, elected officials, the public, and regulatory agencies is a critical leadership skill."
      },
      {
        heading: "Strategic Planning",
        body: "Strategic planning at Class 4 involves developing long-term plans for collection system operations that align with the municipality's strategic goals. Plans must address service level objectives, infrastructure renewal, financial sustainability, and regulatory compliance. Strategic plans must be developed with input from stakeholders and reviewed regularly. Progress against strategic plans must be monitored and reported to management and elected officials."
      },
      {
        heading: "Regulatory Leadership and Environmental Compliance",
        body: "Class 4 operators provide regulatory leadership for the collection system organization. They must maintain current knowledge of all applicable regulations and be able to anticipate and respond to regulatory changes. They must represent the utility in regulatory proceedings and negotiations. Environmental compliance programs must address all aspects of collection system operations and demonstrate continuous improvement."
      },
      {
        heading: "Emergency Management Programs",
        body: "Emergency management programs at Class 4 must address a wide range of scenarios including major SSOs, infrastructure failures, and natural disasters. Programs must be integrated with municipal emergency management plans and provincial emergency management frameworks. Operators must be able to activate and manage the Emergency Operations Centre (EOC) and coordinate with multiple agencies. Post-incident reviews must identify lessons learned and improve future response."
      },
      {
        heading: "Stakeholder and Public Communication",
        body: "Class 4 operators must be able to communicate effectively with a wide range of stakeholders including elected officials, ratepayers, media, regulatory agencies, and the public. Communication plans must include pre-approved messages for common scenarios and designated spokespersons. Social media monitoring can provide early warning of public concerns. Annual reports must be written in plain language and made accessible to the public."
      }
    ],
    formulas: [],
    examTips: [
      "Class 4 operators bear ultimate responsibility for system safety and compliance — know the legal obligations",
      "Emergency management programs must be integrated with municipal and provincial emergency management frameworks",
      "Stakeholder communication is a critical Class 4 skill — know the principles of effective public communication"
    ]
  }
};
