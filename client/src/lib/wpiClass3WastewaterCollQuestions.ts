// WPI Class III Wastewater Collection — Practice Question Bank (150 Questions)
// Aligned with WPI Need-to-Know Criteria: Wastewater Collection Operator Class III
// Class III covers complex systems, advanced lift stations, SCADA, supervisory roles

export interface WpiClass3WastewaterCollQuestion {
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

export const WPI_CLASS3_WASTEWATER_COLL_MODULES = [
  "Complex System Operations & SCADA",
  "Advanced Pump Station Engineering",
  "System Hydraulic Modelling",
  "Advanced Maintenance Management",
  "Leadership, Safety & Regulatory Management",
];

export const wpiClass3WastewaterCollQuestions: WpiClass3WastewaterCollQuestion[] = [
  // ─── MODULE 1: Complex System Operations & SCADA (30 questions) ──────────
  {
    id: 1,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's historian in a wastewater collection system?",
    options: [
      "To record the names of operators who accessed the system",
      "To store time-stamped operational data (flows, levels, pump status, alarms) for trend analysis, performance reporting, and troubleshooting",
      "To provide real-time control of lift station pumps",
      "To generate maintenance work orders automatically"
    ],
    correctAnswer: 1,
    explanation: "A SCADA historian stores time-stamped operational data (wet well levels, flows, pump run times, alarms, chemical dosing rates) for extended periods. Historian data supports: trend analysis (identifying developing problems), performance reporting (KPIs, regulatory reports), troubleshooting (reconstructing events before a failure), and capacity analysis (flow monitoring).",
  },
  {
    id: 2,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's alarm management strategy?",
    options: [
      "To generate as many alarms as possible to ensure operators are always aware of system status",
      "To prioritize and rationalize alarms so that operators receive actionable, meaningful alerts without being overwhelmed by nuisance alarms",
      "To suppress all alarms during normal operation",
      "To automatically respond to all alarms without operator intervention"
    ],
    correctAnswer: 1,
    explanation: "Alarm management strategies rationalize alarms to ensure operators receive actionable, meaningful alerts. Key principles: alarm rationalization (eliminate nuisance alarms), alarm prioritization (critical, high, medium, low), alarm suppression (during known abnormal conditions), and alarm response procedures. Alarm flooding (too many alarms) can overwhelm operators and lead to missed critical alarms.",
  },
  {
    id: 3,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's cybersecurity program?",
    options: [
      "To prevent unauthorized access to the SCADA system and protect it from cyberattacks that could disrupt collection system operations",
      "To encrypt all operational data stored in the historian",
      "To prevent operators from accessing the SCADA system remotely",
      "To prevent regulatory authorities from accessing SCADA data"
    ],
    correctAnswer: 0,
    explanation: "SCADA cybersecurity programs protect the system from unauthorized access and cyberattacks: network segmentation (isolating SCADA from corporate IT and the internet), access control (strong passwords, multi-factor authentication), patch management (keeping software up to date), intrusion detection, and incident response planning. Cyberattacks on water/wastewater SCADA systems are a growing threat.",
  },
  {
    id: 4,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's redundancy and failover design?",
    options: [
      "To provide backup control capabilities if the primary SCADA system fails, ensuring continued monitoring and control of the collection system",
      "To provide backup power to the SCADA system",
      "To provide backup data storage for the SCADA historian",
      "To provide backup communication links for the SCADA system"
    ],
    correctAnswer: 0,
    explanation: "SCADA redundancy and failover design ensures continued monitoring and control if the primary system fails: redundant servers (primary and standby), redundant communication links (fiber, cellular, radio), redundant PLCs (primary and backup), and uninterruptible power supplies (UPS). Failover should be automatic and seamless to minimize operational disruption.",
  },
  {
    id: 5,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's remote terminal unit (RTU) or programmable logic controller (PLC)?",
    options: [
      "To provide the human-machine interface (HMI) for operators",
      "To collect field data (sensor readings, equipment status) and execute local control logic at remote sites (lift stations)",
      "To store operational data in the historian",
      "To provide communication between the SCADA server and the internet"
    ],
    correctAnswer: 1,
    explanation: "RTUs and PLCs are field devices at remote sites (lift stations) that: collect sensor data (wet well level, flow, pressure, pump status), execute local control logic (start/stop pumps based on level, alternate pumps), and communicate data to the SCADA server. PLCs can operate autonomously if communication with the SCADA server is lost.",
  },
  {
    id: 6,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's human-machine interface (HMI)?",
    options: [
      "To collect field data from sensors",
      "To provide operators with a graphical display of system status and controls for monitoring and operating the collection system",
      "To store operational data in the historian",
      "To execute local control logic at lift stations"
    ],
    correctAnswer: 1,
    explanation: "The HMI provides operators with a graphical display of system status: system overview (map of collection system with lift station status), individual lift station displays (wet well level, pump status, alarms), trend displays (historical data), and alarm lists. The HMI also provides controls for operators to manually start/stop pumps, adjust setpoints, and acknowledge alarms.",
  },
  {
    id: 7,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's communication network?",
    options: [
      "To connect the SCADA system to the internet",
      "To transmit data between field devices (RTUs, PLCs) at lift stations and the SCADA server at the control center",
      "To connect operators to the SCADA system remotely",
      "To transmit alarm notifications to operators' mobile phones"
    ],
    correctAnswer: 1,
    explanation: "The SCADA communication network transmits data between field devices at lift stations and the SCADA server. Communication technologies include: fiber optic cable (high bandwidth, reliable), cellular (4G/5G, flexible), radio (licensed or unlicensed), and leased telephone lines. Network design must balance bandwidth, reliability, latency, and cost.",
  },
  {
    id: 8,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's data quality management program?",
    options: [
      "To ensure that all SCADA data is accurate, complete, and reliable for operational decision-making and regulatory reporting",
      "To ensure that all SCADA data is encrypted",
      "To ensure that all SCADA data is backed up",
      "To ensure that all SCADA data is accessible to the public"
    ],
    correctAnswer: 0,
    explanation: "Data quality management ensures that SCADA data is accurate, complete, and reliable: sensor calibration (regular calibration of flow meters, level sensors, pressure transmitters), data validation (detecting and flagging erroneous readings), data completeness (ensuring no gaps in data), and data integrity (preventing unauthorized modification). Poor data quality can lead to incorrect operational decisions and regulatory reporting errors.",
  },
  {
    id: 9,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's advanced control strategy?",
    options: [
      "To replace operators with automated systems",
      "To optimize system operation (energy consumption, pump wear, wet well levels) using advanced control algorithms beyond simple on/off control",
      "To provide backup control if the primary control system fails",
      "To control the treatment plant from the collection system SCADA"
    ],
    correctAnswer: 1,
    explanation: "Advanced control strategies optimize system operation: time-of-use energy optimization (pumping during off-peak electricity rate periods), predictive control (anticipating wet weather flows and pre-emptying wet wells), adaptive control (adjusting setpoints based on system conditions), and coordinated control (coordinating multiple lift stations to optimize system-wide performance).",
  },
  {
    id: 10,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's integration with the asset management system?",
    options: [
      "To automatically generate maintenance work orders based on SCADA alarm data and equipment run times",
      "To store SCADA data in the asset management system",
      "To control lift station pumps from the asset management system",
      "To generate regulatory reports from the asset management system"
    ],
    correctAnswer: 0,
    explanation: "Integration between SCADA and the asset management system (CMMS) enables: automatic generation of preventive maintenance work orders based on equipment run times, automatic generation of corrective maintenance work orders based on SCADA alarms, and transfer of equipment performance data to the asset management system for condition monitoring and lifecycle analysis.",
  },
  {
    id: 11,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's mobile access capability?",
    options: [
      "To allow operators to control lift station pumps from their personal mobile phones",
      "To allow operators to monitor system status and respond to alarms remotely using mobile devices",
      "To allow the public to monitor the sewer system",
      "To allow regulators to access SCADA data remotely"
    ],
    correctAnswer: 1,
    explanation: "Mobile access allows operators to monitor system status and respond to alarms remotely using smartphones or tablets. Mobile access enables: faster alarm response (operators can check status before driving to the site), remote troubleshooting, and improved situational awareness during emergency events. Mobile access must be secured (VPN, multi-factor authentication).",
  },
  {
    id: 12,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's event logging?",
    options: [
      "To record all operator actions and system events for audit, troubleshooting, and regulatory compliance purposes",
      "To record the quality of the sewage",
      "To record the flow in the sewer",
      "To record the structural condition of sewer pipes"
    ],
    correctAnswer: 0,
    explanation: "Event logging records all operator actions (setpoint changes, manual pump starts/stops, alarm acknowledgements) and system events (alarms, equipment failures, communication failures) with timestamps. Event logs support: troubleshooting (reconstructing events before a failure), audit (verifying that operators followed procedures), and regulatory compliance (demonstrating that alarms were responded to).",
  },
  {
    id: 13,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's performance dashboard?",
    options: [
      "To display real-time system status to operators",
      "To provide management with a high-level view of system performance KPIs (energy consumption, pump availability, SSO frequency, alarm response times)",
      "To display the structural condition of sewer pipes",
      "To display the financial performance of the utility"
    ],
    correctAnswer: 1,
    explanation: "A performance dashboard provides management with a high-level view of system performance KPIs: energy consumption per m³ pumped, pump availability (%), alarm response times, SSO frequency, and maintenance cost per km of sewer. Dashboards support performance management, continuous improvement, and reporting to elected officials and the public.",
  },
  {
    id: 14,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's simulation and training mode?",
    options: [
      "To simulate the structural condition of sewer pipes",
      "To allow operators to practice responding to abnormal conditions and emergencies without affecting the real system",
      "To simulate the financial performance of the utility",
      "To simulate the hydraulic performance of the collection system"
    ],
    correctAnswer: 1,
    explanation: "SCADA simulation and training modes allow operators to practice responding to abnormal conditions and emergencies (pump failures, power outages, wet well overflows) without affecting the real system. Training in a simulated environment improves operator competency and preparedness for real emergencies.",
  },
  {
    id: 15,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's change management process?",
    options: [
      "To manage changes to the sewer system infrastructure",
      "To control and document changes to the SCADA system (software, configuration, hardware) to prevent unintended consequences",
      "To manage changes to operator certification requirements",
      "To manage changes to regulatory requirements"
    ],
    correctAnswer: 1,
    explanation: "SCADA change management controls and documents changes to the SCADA system: software updates, configuration changes (setpoints, control logic), and hardware changes. Change management ensures that: changes are tested before implementation, changes are documented, changes can be reversed if they cause problems, and all stakeholders are notified. Uncontrolled changes can cause system failures.",
  },
  {
    id: 16,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's disaster recovery plan?",
    options: [
      "To recover from natural disasters affecting the sewer system",
      "To restore SCADA system functionality after a major failure (hardware failure, cyberattack, natural disaster) to minimize operational disruption",
      "To recover from pump failures at lift stations",
      "To recover from SSOs"
    ],
    correctAnswer: 1,
    explanation: "A SCADA disaster recovery plan outlines procedures for restoring SCADA functionality after a major failure: hardware failure (server crash, PLC failure), cyberattack (ransomware), or natural disaster (flood, fire). It includes: backup systems, data recovery procedures, communication protocols, and recovery time objectives (RTOs). Regular testing of the disaster recovery plan is essential.",
  },
  {
    id: 17,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's integration with the geographic information system (GIS)?",
    options: [
      "To display SCADA data on a geographic map of the collection system for spatial situational awareness",
      "To store SCADA data in the GIS",
      "To control lift station pumps from the GIS",
      "To generate regulatory reports from the GIS"
    ],
    correctAnswer: 0,
    explanation: "Integration between SCADA and GIS displays real-time operational data (lift station status, wet well levels, alarms) on a geographic map of the collection system. This provides spatial situational awareness: operators can see the location of problems relative to the collection system, identify downstream impacts, and dispatch crews efficiently.",
  },
  {
    id: 18,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's predictive analytics capability?",
    options: [
      "To predict the structural condition of sewer pipes",
      "To use historical data and machine learning to predict equipment failures, wet weather flows, and system performance before they occur",
      "To predict the financial performance of the utility",
      "To predict regulatory changes"
    ],
    correctAnswer: 1,
    explanation: "Predictive analytics uses historical SCADA data and machine learning algorithms to predict: equipment failures (based on vibration, temperature, current trends), wet weather flows (based on rainfall forecasts and historical I/I relationships), and system performance (based on operational patterns). Predictive analytics enables proactive maintenance and operational optimization.",
  },
  {
    id: 19,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's network monitoring capability?",
    options: [
      "To monitor the flow in the sewer network",
      "To monitor the health and performance of the SCADA communication network to detect and diagnose communication failures",
      "To monitor the structural condition of sewer pipes",
      "To monitor the quality of the sewage"
    ],
    correctAnswer: 1,
    explanation: "Network monitoring continuously monitors the health and performance of the SCADA communication network: link status (up/down), signal strength (for wireless links), latency, and packet loss. Network monitoring detects communication failures quickly, enabling rapid diagnosis and restoration. Communication failures can result in loss of monitoring and control of lift stations.",
  },
  {
    id: 20,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's version control for PLC programs?",
    options: [
      "To control the version of the SCADA software",
      "To track and manage changes to PLC programs so that previous versions can be restored if a change causes problems",
      "To control the version of the SCADA database",
      "To track the version of the SCADA hardware"
    ],
    correctAnswer: 1,
    explanation: "Version control for PLC programs tracks and manages changes to PLC programs: who made the change, when, and what was changed. If a program change causes problems (unexpected behavior, system failure), the previous version can be quickly restored. Version control is a critical component of SCADA change management.",
  },
  {
    id: 21,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's integration with the work order management system?",
    options: [
      "To automatically generate work orders based on SCADA alarms and equipment run times",
      "To control lift station pumps from the work order management system",
      "To store SCADA data in the work order management system",
      "To generate regulatory reports from the work order management system"
    ],
    correctAnswer: 0,
    explanation: "Integration between SCADA and the work order management system (CMMS) enables: automatic generation of corrective maintenance work orders when SCADA alarms indicate equipment failures, automatic generation of preventive maintenance work orders based on equipment run times, and transfer of maintenance history data to the SCADA system for condition monitoring.",
  },
  {
    id: 22,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's energy monitoring capability?",
    options: [
      "To monitor the energy consumption of the SCADA system itself",
      "To monitor and analyze energy consumption at lift stations to identify opportunities for energy savings",
      "To monitor the energy consumption of the treatment plant",
      "To monitor the energy consumption of the entire utility"
    ],
    correctAnswer: 1,
    explanation: "Energy monitoring tracks energy consumption at lift stations: kWh per m³ pumped, peak demand (kW), power factor, and energy cost. Energy monitoring identifies: inefficient pumps (high energy per m³), opportunities for time-of-use optimization (shifting pumping to off-peak periods), and the impact of operational changes on energy consumption.",
  },
  {
    id: 23,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's integration with the hydraulic model?",
    options: [
      "To control the hydraulic model from the SCADA system",
      "To use real-time SCADA data to update and run the hydraulic model for real-time system management and emergency response",
      "To store hydraulic model results in the SCADA historian",
      "To display hydraulic model results on the SCADA HMI"
    ],
    correctAnswer: 1,
    explanation: "Integration between SCADA and the hydraulic model enables real-time hydraulic modelling: SCADA data (flows, levels, pump status) is used to update the model in real time, and the model predicts future system conditions (wet well levels, pipe surcharging) under current and projected flows. Real-time modelling supports emergency response and operational decision-making.",
  },
  {
    id: 24,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's remote diagnostics capability?",
    options: [
      "To diagnose structural problems in sewer pipes remotely",
      "To allow engineers and vendors to diagnose SCADA and equipment problems remotely without visiting the site",
      "To diagnose the quality of the sewage remotely",
      "To diagnose the financial performance of the utility remotely"
    ],
    correctAnswer: 1,
    explanation: "Remote diagnostics allows engineers and vendors to access SCADA data and PLC programs remotely to diagnose problems without visiting the site. Remote diagnostics reduces response time (problems can be diagnosed and often resolved remotely), reduces travel costs, and enables 24/7 support from vendors. Remote access must be secured (VPN, multi-factor authentication).",
  },
  {
    id: 25,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's integration with the weather monitoring system?",
    options: [
      "To monitor weather conditions at lift stations for operator safety",
      "To use real-time and forecast weather data to anticipate wet weather flows and optimize system operation proactively",
      "To monitor weather conditions for SCADA equipment protection",
      "To monitor weather conditions for regulatory reporting"
    ],
    correctAnswer: 1,
    explanation: "Integration with weather monitoring systems provides real-time and forecast rainfall data that can be used to: anticipate wet weather I/I (and pre-empty wet wells before storms), optimize chemical dosing for odour control (H₂S generation increases with temperature), and prepare for emergency response (extreme weather events). Weather integration enables proactive rather than reactive operations.",
  },
  {
    id: 26,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's data analytics platform?",
    options: [
      "To store SCADA data for regulatory reporting",
      "To analyze large volumes of SCADA data to identify patterns, trends, and anomalies that support operational optimization and asset management",
      "To control lift station pumps using data analytics",
      "To generate financial reports from SCADA data"
    ],
    correctAnswer: 1,
    explanation: "A data analytics platform analyzes large volumes of SCADA data to identify: operational patterns (pump cycling frequency, wet well level trends), anomalies (unusual flows indicating I/I or equipment problems), performance trends (pump efficiency degradation), and optimization opportunities (energy savings, maintenance optimization). Data analytics transforms raw SCADA data into actionable insights.",
  },
  {
    id: 27,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's integration with the customer information system (CIS)?",
    options: [
      "To bill customers for sewer service based on SCADA flow data",
      "To correlate customer complaints (basement flooding, odours) with SCADA operational data to identify system problems",
      "To control lift station pumps based on customer demand",
      "To provide customers with real-time access to SCADA data"
    ],
    correctAnswer: 1,
    explanation: "Integration between SCADA and the CIS enables correlation of customer complaints (basement flooding, odours, sewage backups) with SCADA operational data (wet well levels, pump status, alarms). This correlation helps identify system problems causing customer impacts and prioritize maintenance and rehabilitation activities.",
  },
  {
    id: 28,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's integration with the enterprise resource planning (ERP) system?",
    options: [
      "To control lift station pumps from the ERP system",
      "To transfer operational data (energy consumption, maintenance costs, equipment run times) from SCADA to the ERP system for financial reporting and asset management",
      "To store SCADA data in the ERP system",
      "To generate regulatory reports from the ERP system"
    ],
    correctAnswer: 1,
    explanation: "Integration between SCADA and the ERP system transfers operational data (energy consumption, equipment run times, maintenance activities) to the ERP system for: financial reporting (energy costs, maintenance costs), asset management (lifecycle cost analysis), and performance reporting (KPIs). Integration eliminates manual data entry and improves data accuracy.",
  },
  {
    id: 29,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's open architecture design?",
    options: [
      "To allow any vendor's equipment to be connected to the SCADA system using standard protocols (e.g., OPC, Modbus, DNP3)",
      "To allow the public to access the SCADA system",
      "To allow regulators to access the SCADA system",
      "To allow the SCADA system to be accessed from the internet"
    ],
    correctAnswer: 0,
    explanation: "Open architecture design uses standard communication protocols (OPC-UA, Modbus, DNP3, IEC 61850) to allow equipment from different vendors to be connected to the SCADA system. Open architecture avoids vendor lock-in, enables integration of best-of-breed equipment, reduces costs, and simplifies system expansion and upgrades.",
  },
  {
    id: 30,
    module: "Complex System Operations & SCADA",
    question: "What is the purpose of a SCADA system's lifecycle management program?",
    options: [
      "To manage the lifecycle of sewer pipes",
      "To plan for the maintenance, upgrade, and replacement of SCADA hardware and software components over their lifecycle",
      "To manage the lifecycle of lift station pumps",
      "To manage the lifecycle of sewer operators"
    ],
    correctAnswer: 1,
    explanation: "SCADA lifecycle management plans for the maintenance, upgrade, and replacement of SCADA components: servers (typically 5–7 year lifecycle), PLCs/RTUs (10–15 year lifecycle), HMI software (3–5 year upgrade cycle), and communication hardware. Lifecycle management ensures that SCADA components are replaced before they become obsolete or unsupported, preventing system failures.",
  },

  // ─── MODULE 2: Advanced Pump Station Engineering (30 questions) ───────────
  {
    id: 31,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's variable frequency drive (VFD) in an advanced system?",
    options: [
      "To provide backup power to the pump motor",
      "To continuously vary the pump speed to match the pumping rate to the inflow rate, minimizing wet well level fluctuations and energy consumption",
      "To protect the pump motor from overload",
      "To measure the flow in the force main"
    ],
    correctAnswer: 1,
    explanation: "In advanced systems, VFDs continuously vary pump speed to match pumping rate to inflow rate. Benefits: minimized wet well level fluctuations (more consistent level = less H₂S generation), reduced energy consumption (affinity laws — power varies as cube of speed), reduced water hammer (gradual speed changes), and extended pump life (reduced cycling). VFDs are the preferred control method for large, complex lift stations.",
  },
  {
    id: 32,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's submersible mixer in a wet well?",
    options: [
      "To treat the sewage in the wet well",
      "To prevent solids settling and septicity in the wet well, and to reduce H₂S generation",
      "To measure the flow entering the wet well",
      "To control the pump speed"
    ],
    correctAnswer: 1,
    explanation: "Submersible mixers in wet wells prevent solids from settling (which can clog pumps and create anaerobic zones), prevent septicity (anaerobic decomposition producing H₂S and methane), and reduce H₂S generation by maintaining aerobic or anoxic conditions. Mixing is particularly important in wet wells with long detention times or high solids loads.",
  },
  {
    id: 33,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's parallel pumping configuration?",
    options: [
      "To increase the head produced by the pump station",
      "To increase the flow capacity of the pump station by operating multiple pumps simultaneously",
      "To provide redundancy only, not additional capacity",
      "To reduce the energy consumption of the pump station"
    ],
    correctAnswer: 1,
    explanation: "Parallel pumping (multiple pumps connected to the same suction and discharge headers) increases flow capacity: two identical pumps in parallel deliver approximately 1.8 times the flow of one pump (not 2× due to increased friction losses at higher flow). Parallel pumping also provides redundancy (one pump can be taken offline for maintenance). The operating point shifts along the system curve.",
    isCalc: true,
  },
  {
    id: 34,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's series pumping configuration?",
    options: [
      "To increase the flow capacity of the pump station",
      "To increase the head produced by the pump station for high-head applications",
      "To provide redundancy only, not additional head",
      "To reduce the energy consumption of the pump station"
    ],
    correctAnswer: 1,
    explanation: "Series pumping (multiple pumps connected in series, with the discharge of one pump feeding the suction of the next) increases the head produced by the pump station. Two identical pumps in series produce approximately 2× the head of one pump at the same flow. Series pumping is used in high-head applications (long force mains, high static head). The operating point shifts along the system curve.",
    isCalc: true,
  },
  {
    id: 35,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's wet well level control strategy in a complex system?",
    options: [
      "To maintain the wet well level at a constant level",
      "To optimize wet well level management to balance energy costs, H₂S generation, pump cycling, and overflow risk",
      "To minimize the wet well level at all times",
      "To maximize the wet well level at all times"
    ],
    correctAnswer: 1,
    explanation: "Advanced wet well level control strategies balance competing objectives: energy optimization (pumping during off-peak rate periods by allowing the wet well to fill during peak rate periods), H₂S minimization (avoiding long detention times), pump cycling minimization (avoiding excessive starts), and overflow risk management (maintaining adequate freeboard). VFDs and advanced control algorithms enable these strategies.",
  },
  {
    id: 36,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's force main air release valve?",
    options: [
      "To release excess pressure in the force main",
      "To release air trapped in the force main at high points, preventing air locks that reduce pumping capacity",
      "To allow air to enter the force main during pump shutdown",
      "To measure the air content of the sewage"
    ],
    correctAnswer: 1,
    explanation: "Air release valves at high points in force mains release air trapped in the pipe. Air pockets reduce the effective pipe diameter, increase friction losses, and can cause pump cavitation. Air release valves open automatically when air accumulates and close when sewage reaches the valve. Combination air valves also admit air during pump shutdown to prevent vacuum formation.",
  },
  {
    id: 37,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's force main flushing program?",
    options: [
      "To clean the force main using high-pressure water",
      "To periodically flush the force main with high-velocity flow to remove sediment and prevent septicity",
      "To inject chemicals into the force main to control odours",
      "To inspect the interior of the force main"
    ],
    correctAnswer: 1,
    explanation: "Force main flushing programs periodically flush the force main with high-velocity flow (by operating all pumps simultaneously or using a dedicated flushing pump) to remove sediment deposits and prevent septicity. Sediment in force mains reduces capacity, promotes H₂S generation, and can cause pump clogging. Flushing is particularly important for force mains with low velocities.",
  },
  {
    id: 38,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's force main condition assessment program?",
    options: [
      "To measure the flow in the force main",
      "To assess the structural condition of the force main using inspection tools (CCTV, sonar, SmartBall) to identify defects and plan rehabilitation",
      "To measure the pressure in the force main",
      "To measure the velocity in the force main"
    ],
    correctAnswer: 1,
    explanation: "Force main condition assessment uses inspection tools to assess structural condition: CCTV (for accessible pipes), sonar (for submerged or partially filled pipes), SmartBall (acoustic leak detection), and pressure testing. Force main failures (ruptures) can cause major SSOs and property damage. Condition assessment identifies deteriorating pipes before they fail.",
  },
  {
    id: 39,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's emergency generator load management?",
    options: [
      "To reduce the load on the emergency generator to the minimum required to maintain critical operations during a power outage",
      "To maximize the load on the emergency generator",
      "To provide power to all equipment at the pump station during a power outage",
      "To charge the battery backup system"
    ],
    correctAnswer: 0,
    explanation: "Emergency generator load management ensures that the generator can supply power to critical equipment during a power outage: pumps (one or more, depending on generator capacity), control systems, lighting, and ventilation. Non-critical loads (office equipment, non-essential lighting) are shed to maximize available power for pumping. Load management is programmed into the automatic transfer switch.",
  },
  {
    id: 40,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's wet well coating system?",
    options: [
      "To provide thermal insulation for the wet well",
      "To protect the wet well structure from H₂S-induced corrosion and extend its service life",
      "To prevent groundwater infiltration into the wet well",
      "To provide a non-slip surface for operators entering the wet well"
    ],
    correctAnswer: 1,
    explanation: "Wet well coating systems protect the concrete or steel wet well structure from H₂S-induced corrosion. H₂S is oxidized to sulfuric acid by bacteria on wet surfaces, which attacks concrete (biogenic sulfide corrosion). Coatings include: epoxy, polyurethane, and cementitious coatings. Regular inspection and recoating are required to maintain protection.",
  },
  {
    id: 41,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's pump performance curve analysis?",
    options: [
      "To determine the pump's structural strength",
      "To verify that the pump is operating at the correct point on its performance curve and identify performance degradation",
      "To determine the pump's electrical efficiency",
      "To determine the pump's cavitation resistance"
    ],
    correctAnswer: 1,
    explanation: "Pump performance curve analysis compares the pump's actual operating point (measured flow and head) to its design performance curve. Deviations from the design curve indicate: wear (reduced flow and head), impeller damage, seal failure, or system changes (increased friction losses). Regular performance curve analysis supports predictive maintenance and pump optimization.",
  },
  {
    id: 42,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's motor efficiency monitoring?",
    options: [
      "To monitor the motor's structural condition",
      "To track motor efficiency over time to detect degradation and identify opportunities for motor replacement with more efficient units",
      "To monitor the motor's temperature only",
      "To monitor the motor's speed only"
    ],
    correctAnswer: 1,
    explanation: "Motor efficiency monitoring tracks motor efficiency (output power / input power) over time. Efficiency degradation indicates: winding insulation deterioration, bearing wear, or rotor problems. When motor efficiency falls below a threshold, replacement with a premium efficiency motor (IE3 or IE4) may be cost-effective. Motor efficiency monitoring supports energy management and maintenance planning.",
  },
  {
    id: 43,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's vibration analysis program?",
    options: [
      "To measure the vibration of the wet well structure",
      "To detect developing mechanical problems (bearing wear, impeller imbalance, misalignment, cavitation) in pumps and motors before they cause failure",
      "To measure the vibration of the force main",
      "To measure the vibration of the SCADA equipment"
    ],
    correctAnswer: 1,
    explanation: "Vibration analysis uses accelerometers to measure vibration at specific frequencies on pumps and motors. Vibration signatures indicate: bearing wear (high-frequency vibration), impeller imbalance (vibration at rotational frequency), misalignment (vibration at 2× rotational frequency), and cavitation (broadband high-frequency vibration). Vibration analysis enables predictive maintenance (replacing bearings before they fail).",
  },
  {
    id: 44,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's thermographic inspection program?",
    options: [
      "To measure the temperature of the sewage",
      "To detect hot spots in electrical equipment (connections, switchgear, motors) that indicate developing problems",
      "To measure the temperature of the wet well",
      "To measure the temperature of the force main"
    ],
    correctAnswer: 1,
    explanation: "Thermographic (infrared) inspection uses thermal cameras to detect hot spots in electrical equipment: loose connections (high resistance = heat), overloaded conductors, failing switchgear, and motor winding problems. Hot spots indicate developing problems that can lead to equipment failure or fire if not addressed. Thermographic inspection is a key predictive maintenance tool for electrical systems.",
  },
  {
    id: 45,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's motor insulation resistance testing?",
    options: [
      "To measure the motor's efficiency",
      "To assess the condition of the motor winding insulation to detect moisture ingress, contamination, or insulation degradation",
      "To measure the motor's speed",
      "To measure the motor's power factor"
    ],
    correctAnswer: 1,
    explanation: "Motor insulation resistance testing (megger testing) measures the resistance of the motor winding insulation to detect: moisture ingress (from flooding or condensation), contamination (oil, sewage), and insulation degradation (aging, overheating). Low insulation resistance indicates risk of winding failure. Testing is performed annually or after any event that may have compromised insulation (flooding, overheating).",
  },
  {
    id: 46,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's oil analysis program?",
    options: [
      "To measure the quality of the sewage",
      "To analyze the lubricating oil in pump bearings and gearboxes to detect wear particles, contamination, and oil degradation",
      "To measure the quality of the fuel for the backup generator",
      "To measure the quality of the hydraulic oil in the pump control valves"
    ],
    correctAnswer: 1,
    explanation: "Oil analysis analyzes lubricating oil samples from pump bearings and gearboxes to detect: wear particles (indicating bearing or gear wear), contamination (water, sewage, dirt), and oil degradation (oxidation, viscosity changes). Oil analysis enables predictive maintenance (replacing bearings before they fail) and optimizes oil change intervals.",
  },
  {
    id: 47,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's acoustic emission testing?",
    options: [
      "To measure the noise level at the pump station for community impact assessment",
      "To detect developing cracks in pump casings, impellers, and piping by listening for the acoustic emissions produced by crack propagation",
      "To measure the vibration of the pump station structure",
      "To detect leaks in the force main"
    ],
    correctAnswer: 1,
    explanation: "Acoustic emission testing detects developing cracks in pump casings, impellers, and piping by listening for the high-frequency acoustic emissions produced by crack propagation and plastic deformation. It is used for condition monitoring of high-pressure pump casings and piping where cracks could lead to catastrophic failure.",
  },
  {
    id: 48,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's power quality monitoring?",
    options: [
      "To measure the power consumption of the pump station",
      "To monitor the quality of the electrical supply (voltage, frequency, harmonics, power factor) to detect problems that could damage equipment",
      "To measure the efficiency of the pump motors",
      "To monitor the backup generator's power output"
    ],
    correctAnswer: 1,
    explanation: "Power quality monitoring measures: voltage (sags, swells, interruptions), frequency (deviations from 60 Hz), harmonics (distortion from VFDs), and power factor. Power quality problems can: damage motors (voltage unbalance, harmonics), cause nuisance tripping of protection devices, reduce motor efficiency, and shorten equipment life. Power quality monitoring identifies problems before they cause equipment damage.",
  },
  {
    id: 49,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's cathodic protection monitoring program?",
    options: [
      "To monitor the structural condition of the wet well",
      "To verify that the cathodic protection system is providing adequate protection to buried metal components (force mains, wet well structures)",
      "To monitor the corrosion of the pump casings",
      "To monitor the corrosion of the electrical conduits"
    ],
    correctAnswer: 1,
    explanation: "Cathodic protection monitoring verifies that the cathodic protection system is providing adequate protection: measuring pipe-to-soil potential (should be more negative than -850 mV vs. CSE for steel), checking anode condition (sacrificial anodes deplete over time), and measuring current output (impressed current systems). Regular monitoring ensures continued protection of buried metal components.",
  },
  {
    id: 50,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's structural inspection program?",
    options: [
      "To inspect the structural condition of sewer pipes",
      "To assess the structural condition of the pump station building, wet well, and dry well to identify deterioration and plan maintenance and rehabilitation",
      "To inspect the structural condition of the force main",
      "To inspect the structural condition of the SCADA equipment"
    ],
    correctAnswer: 1,
    explanation: "Structural inspection programs assess the condition of pump station structures: wet well (H₂S corrosion of concrete, coating condition, joint integrity), dry well (structural condition, waterproofing), and building (roof, walls, foundation). Structural deterioration can lead to: wet well collapse, groundwater infiltration, and loss of containment. Regular inspection enables planned rehabilitation before failure.",
  },
  {
    id: 51,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's HVAC system?",
    options: [
      "To provide heating and cooling for operator comfort only",
      "To maintain appropriate temperature and humidity in the dry well and control room to protect electrical equipment and ensure safe working conditions",
      "To ventilate the wet well only",
      "To provide air for the odour control system only"
    ],
    correctAnswer: 1,
    explanation: "HVAC systems in pump stations maintain appropriate temperature and humidity in the dry well and control room: protecting electrical equipment from overheating (motors, VFDs, control panels) and condensation (corrosion, short circuits), maintaining safe working conditions for operators, and preventing freezing in cold climates. HVAC systems must be designed for the corrosive environment of a pump station.",
  },
  {
    id: 52,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's emergency lighting system?",
    options: [
      "To provide lighting for the pump station during normal operation",
      "To provide adequate lighting for safe operation and emergency egress during a power failure",
      "To provide lighting for the wet well during maintenance",
      "To provide lighting for the force main during inspection"
    ],
    correctAnswer: 1,
    explanation: "Emergency lighting systems provide adequate lighting for safe operation and emergency egress during a power failure. Emergency lighting is required by building codes and occupational health and safety regulations. Battery-backed emergency lights activate automatically when power fails and must provide adequate illumination for at least 90 minutes.",
  },
  {
    id: 53,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's security system?",
    options: [
      "To monitor the pump station for equipment failures",
      "To protect the pump station from unauthorized access, vandalism, and tampering that could disrupt operations or compromise public safety",
      "To monitor the quality of the sewage",
      "To monitor the flow in the force main"
    ],
    correctAnswer: 1,
    explanation: "Security systems protect pump stations from unauthorized access, vandalism, and tampering: perimeter fencing, access control (keyed locks, card readers), intrusion detection (motion sensors, door contacts), CCTV cameras, and lighting. Pump stations are critical infrastructure — tampering could cause SSOs, equipment damage, or public safety hazards.",
  },
  {
    id: 54,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's noise control program?",
    options: [
      "To reduce the noise level inside the pump station for operator comfort",
      "To reduce noise emissions from the pump station to comply with community noise bylaws and minimize impacts on neighboring properties",
      "To reduce the noise level in the wet well",
      "To reduce the noise level in the force main"
    ],
    correctAnswer: 1,
    explanation: "Noise control programs reduce noise emissions from pump stations to comply with community noise bylaws and minimize impacts on neighboring properties. Noise sources include: pump motors, VFDs, generators, and ventilation fans. Noise control measures include: acoustic enclosures, vibration isolation mounts, silencers on ventilation openings, and sound-attenuating walls.",
  },
  {
    id: 55,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's spill containment system?",
    options: [
      "To contain sewage spills within the pump station site to prevent environmental contamination",
      "To contain chemical spills at the pump station",
      "To contain fuel spills at the backup generator",
      "All of the above"
    ],
    correctAnswer: 3,
    explanation: "Spill containment systems contain all types of spills at the pump station: sewage spills (wet well overflow, pipe leaks), chemical spills (odour control chemicals, lubricants), and fuel spills (generator fuel). Containment systems include: berms, sumps, impermeable surfaces, and drainage to a holding tank. Spill containment prevents environmental contamination and regulatory violations.",
  },
  {
    id: 56,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's dewatering system?",
    options: [
      "To remove sewage from the wet well for maintenance",
      "To remove groundwater from the dry well and pump station site to prevent flooding and structural damage",
      "To remove stormwater from the pump station site",
      "To remove condensation from the control room"
    ],
    correctAnswer: 1,
    explanation: "Dewatering systems remove groundwater from the dry well and pump station site: sump pumps in the dry well (remove groundwater infiltration), foundation drains (collect and discharge groundwater), and temporary dewatering systems (during construction or major maintenance). Groundwater infiltration into the dry well can damage electrical equipment and create safety hazards.",
  },
  {
    id: 57,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's flow measurement system?",
    options: [
      "To measure the flow entering the wet well",
      "To measure the flow pumped by the station for operational monitoring, regulatory reporting, and performance analysis",
      "To measure the flow in the gravity sewer upstream of the station",
      "To measure the flow in the gravity sewer downstream of the force main"
    ],
    correctAnswer: 1,
    explanation: "Flow measurement systems measure the flow pumped by the station: electromagnetic flow meters (in the force main), ultrasonic flow meters, or calculated flow (from pump performance curves and wet well level changes). Flow data is used for: operational monitoring (detecting pump problems), regulatory reporting (treatment plant loading), and performance analysis (energy per m³, I/I quantification).",
  },
  {
    id: 58,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's chemical dosing system?",
    options: [
      "To treat the sewage in the wet well",
      "To inject chemicals (iron salts, nitrates, caustic) into the wet well or force main to control H₂S, odours, and corrosion",
      "To inject chemicals into the gravity sewer upstream of the station",
      "To inject chemicals into the treatment plant influent"
    ],
    correctAnswer: 1,
    explanation: "Chemical dosing systems inject chemicals into the wet well or force main to control H₂S, odours, and corrosion: iron salts (ferrous or ferric chloride — precipitate sulfide as iron sulfide), nitrates (promote anoxic conditions, inhibit sulfate-reducing bacteria), caustic (raise pH, inhibit H₂S generation), and oxygen (promote aerobic conditions). Chemical dosing is controlled based on H₂S monitoring.",
  },
  {
    id: 59,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's wet well level sensor calibration program?",
    options: [
      "To calibrate the pump speed sensors",
      "To verify that wet well level sensors (ultrasonic, pressure, float) are accurately measuring the wet well level, which is critical for pump control and overflow prevention",
      "To calibrate the flow meters in the force main",
      "To calibrate the H₂S sensors in the wet well"
    ],
    correctAnswer: 1,
    explanation: "Wet well level sensor calibration verifies that level sensors are accurately measuring the wet well level. Inaccurate level sensing can cause: premature pump start (wasting energy), delayed pump start (overflow risk), or incorrect pump stop (running pumps dry). Calibration involves comparing sensor readings to a physical measurement (tape measure, staff gauge) and adjusting as needed.",
  },
  {
    id: 60,
    module: "Advanced Pump Station Engineering",
    question: "What is the purpose of a pump station's hydraulic transient analysis?",
    options: [
      "To analyze the hydraulic performance of the gravity sewer upstream of the station",
      "To analyze pressure surges (water hammer) in the force main to ensure that the pipe and fittings can withstand transient pressures",
      "To analyze the flow distribution in the wet well",
      "To analyze the hydraulic performance of the pump impeller"
    ],
    correctAnswer: 1,
    explanation: "Hydraulic transient analysis (water hammer analysis) calculates the pressure surges that occur in the force main when pumps start or stop. Transient pressures can far exceed steady-state pressures and can rupture pipes, damage valves, and cause cavitation. Analysis results are used to design surge protection measures (slow-closing valves, surge tanks, VFDs).",
    isCalc: true,
  },

  // ─── MODULE 3: System Hydraulic Modelling (30 questions) ─────────────────
  {
    id: 61,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's calibration and validation process?",
    options: [
      "To adjust the model to match field measurements and then verify the calibrated model against independent data",
      "To design new sewer pipes using the model",
      "To calculate the pump head required using the model",
      "To assess the structural condition of sewer pipes using the model"
    ],
    correctAnswer: 0,
    explanation: "Calibration adjusts model parameters (pipe roughness, I/I rates, peaking factors) so that model predictions match field measurements (flow monitoring data, wet well levels). Validation verifies the calibrated model against independent data (data not used in calibration) to confirm that the model accurately represents the real system. A calibrated and validated model can be used with confidence for planning and design.",
  },
  {
    id: 62,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's dry weather flow (DWF) calibration?",
    options: [
      "To calibrate the model for wet weather conditions",
      "To adjust the model's base flow parameters (per capita flow, commercial/industrial flows) so that model predictions match measured dry weather flows",
      "To calibrate the model for emergency conditions",
      "To calibrate the model for future growth conditions"
    ],
    correctAnswer: 1,
    explanation: "DWF calibration adjusts the model's base flow parameters: per capita sewage generation rate, diurnal flow pattern (hourly variation throughout the day), commercial and industrial flow contributions, and groundwater infiltration. DWF calibration ensures that the model accurately represents normal operating conditions before wet weather calibration.",
  },
  {
    id: 63,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's wet weather flow (WWF) calibration?",
    options: [
      "To calibrate the model for dry weather conditions",
      "To adjust the model's I/I parameters so that model predictions match measured wet weather flows during and after storm events",
      "To calibrate the model for future growth conditions",
      "To calibrate the model for emergency conditions"
    ],
    correctAnswer: 1,
    explanation: "WWF calibration adjusts the model's I/I parameters: rainfall-dependent inflow (RDI) rates, groundwater infiltration rates, and I/I response times. WWF calibration requires simultaneous flow monitoring and rainfall data. A well-calibrated WWF model accurately predicts system response to different storm events and is used for I/I analysis and capacity assessment.",
  },
  {
    id: 64,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's sensitivity analysis?",
    options: [
      "To assess the sensitivity of the model to changes in input parameters and identify which parameters have the greatest impact on model predictions",
      "To assess the sensitivity of sewer pipes to structural loading",
      "To assess the sensitivity of lift station pumps to changes in operating conditions",
      "To assess the sensitivity of the model to changes in regulatory requirements"
    ],
    correctAnswer: 0,
    explanation: "Sensitivity analysis assesses how model predictions change when input parameters are varied. Parameters with high sensitivity (large impact on predictions) require more accurate data and careful calibration. Parameters with low sensitivity have less impact and may not require precise calibration. Sensitivity analysis guides data collection priorities and identifies model uncertainties.",
  },
  {
    id: 65,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's design storm analysis?",
    options: [
      "To design the storm sewer system",
      "To simulate the collection system's response to design storm events (e.g., 5-year, 10-year, 100-year storms) to assess capacity and identify deficiencies",
      "To design the treatment plant for storm flows",
      "To design the emergency response plan for storm events"
    ],
    correctAnswer: 1,
    explanation: "Design storm analysis simulates the collection system's response to design storm events (storms with specified return periods: 5-year, 10-year, 25-year, 100-year). Results identify: pipes that surcharge (flow under pressure), manholes that overflow (SSOs), and lift stations that cannot handle peak flows. Design storm analysis is used to identify capacity deficiencies and design improvements.",
  },
  {
    id: 66,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's future growth scenario analysis?",
    options: [
      "To predict the future financial performance of the utility",
      "To simulate the collection system's response to projected future growth (population, land use changes) to identify future capacity deficiencies",
      "To predict the future condition of sewer pipes",
      "To predict the future regulatory requirements"
    ],
    correctAnswer: 1,
    explanation: "Future growth scenario analysis simulates the collection system's response to projected future growth: new residential and commercial development, population growth, and land use changes. Results identify future capacity deficiencies (pipes that will surcharge, lift stations that will be overloaded) and inform the capital improvement program (CIP) for system expansion.",
  },
  {
    id: 67,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's rehabilitation alternative analysis?",
    options: [
      "To design the rehabilitation of sewer pipes",
      "To evaluate the hydraulic performance of different rehabilitation alternatives (pipe lining, upsizing, parallel pipes) to identify the most cost-effective solution",
      "To assess the structural condition of sewer pipes",
      "To plan the construction of new sewers"
    ],
    correctAnswer: 1,
    explanation: "Rehabilitation alternative analysis uses the hydraulic model to evaluate the performance of different rehabilitation alternatives: CIPP lining (slight diameter reduction), pipe upsizing (larger diameter), parallel pipes (additional capacity), and I/I reduction (reducing flows). The model compares the hydraulic performance of each alternative and identifies the most cost-effective solution for addressing capacity deficiencies.",
  },
  {
    id: 68,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's real-time control (RTC) simulation?",
    options: [
      "To control lift station pumps in real time",
      "To simulate the performance of real-time control strategies (VFD speed control, flow control valves, pump sequencing) to optimize system operation",
      "To control the treatment plant in real time",
      "To simulate the structural condition of sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "RTC simulation uses the hydraulic model to simulate the performance of real-time control strategies before implementing them in the field: VFD speed control (optimizing pump speed to minimize energy), flow control valves (throttling flow to prevent downstream surcharging), and pump sequencing (optimizing the order of pump starts). RTC simulation identifies the optimal control strategy without risking system disruption.",
  },
  {
    id: 69,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's emergency scenario analysis?",
    options: [
      "To design the emergency response plan",
      "To simulate the collection system's response to emergency scenarios (pump failures, pipe breaks, power outages) to identify vulnerabilities and plan mitigation measures",
      "To simulate the financial impact of emergencies",
      "To simulate the regulatory response to emergencies"
    ],
    correctAnswer: 1,
    explanation: "Emergency scenario analysis simulates the collection system's response to emergency scenarios: pump station failure (wet well overflow risk), major pipe failure (upstream surcharging), power outage (multiple pump station failures), and extreme storm events. Results identify system vulnerabilities and inform emergency response planning (bypass pumping requirements, overflow locations).",
  },
  {
    id: 70,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's I/I source identification analysis?",
    options: [
      "To identify the sources of I/I in the collection system using the hydraulic model and flow monitoring data",
      "To design the I/I reduction program",
      "To assess the structural condition of sewer pipes contributing to I/I",
      "To calculate the cost of I/I reduction"
    ],
    correctAnswer: 0,
    explanation: "I/I source identification analysis uses the hydraulic model and flow monitoring data to identify the locations and magnitudes of I/I sources in the collection system. By comparing model predictions to measured flows at multiple monitoring points, the analysis isolates the sub-basins contributing the most I/I. Results prioritize I/I reduction activities (rehabilitation, cross-connection elimination).",
  },
  {
    id: 71,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's level of service (LOS) assessment?",
    options: [
      "To assess the structural condition of sewer pipes",
      "To evaluate the collection system's ability to meet defined LOS targets (e.g., no surcharging for a 5-year storm, no basement flooding for a 10-year storm)",
      "To assess the financial performance of the utility",
      "To assess the regulatory compliance of the utility"
    ],
    correctAnswer: 1,
    explanation: "LOS assessment uses the hydraulic model to evaluate the collection system's ability to meet defined LOS targets: no pipe surcharging for a specified design storm (e.g., 5-year), no manhole overflows for a specified design storm (e.g., 10-year), no basement flooding for a specified design storm (e.g., 25-year). LOS assessment identifies where the system fails to meet targets and informs the CIP.",
  },
  {
    id: 72,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's new development impact assessment?",
    options: [
      "To assess the financial impact of new development on the utility",
      "To evaluate the hydraulic impact of new development on the existing collection system and identify required system upgrades",
      "To assess the environmental impact of new development",
      "To assess the structural impact of new development on existing sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "New development impact assessment uses the hydraulic model to evaluate the impact of proposed new development on the existing collection system: increased flows from new development, impact on pipe capacity (surcharging), impact on lift station capacity (wet well overflow risk), and required system upgrades. Results inform development approval conditions and development charges.",
  },
  {
    id: 73,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's climate change impact assessment?",
    options: [
      "To assess the financial impact of climate change on the utility",
      "To evaluate the impact of projected climate change (increased rainfall intensity, sea level rise) on the collection system and identify adaptation measures",
      "To assess the environmental impact of climate change on the collection system",
      "To assess the regulatory impact of climate change on the utility"
    ],
    correctAnswer: 1,
    explanation: "Climate change impact assessment uses the hydraulic model to evaluate the impact of projected climate change: increased rainfall intensity (more frequent and severe I/I events, more SSOs), sea level rise (reduced gravity drainage in coastal areas), and temperature changes (increased H₂S generation). Results identify adaptation measures to maintain system performance under future climate conditions.",
  },
  {
    id: 74,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's uncertainty analysis?",
    options: [
      "To quantify the uncertainty in model predictions due to parameter uncertainty and model limitations",
      "To assess the uncertainty in regulatory requirements",
      "To assess the uncertainty in future growth projections",
      "To assess the uncertainty in the structural condition of sewer pipes"
    ],
    correctAnswer: 0,
    explanation: "Uncertainty analysis quantifies the uncertainty in model predictions due to: parameter uncertainty (uncertain pipe roughness, I/I rates), model structure uncertainty (simplifications in the model), and input data uncertainty (uncertain rainfall data, population projections). Uncertainty analysis provides confidence intervals for model predictions and informs decision-making under uncertainty.",
  },
  {
    id: 75,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's master plan update?",
    options: [
      "To update the model with new pipe inventory data only",
      "To periodically update the hydraulic model with new data (condition assessments, flow monitoring, growth projections) and re-run analyses to update the master plan",
      "To update the model with new regulatory requirements",
      "To update the model with new financial data"
    ],
    correctAnswer: 1,
    explanation: "Periodic master plan updates (typically every 5–10 years) update the hydraulic model with new data: updated pipe inventory (new sewers, rehabilitated pipes), new flow monitoring data (updated I/I calibration), updated growth projections (new official plans, development applications), and new regulatory requirements. Updated analyses identify new capacity deficiencies and update the CIP.",
  },
  {
    id: 76,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's pipe network simplification?",
    options: [
      "To reduce the number of pipes in the collection system",
      "To simplify the model by removing minor pipes and replacing them with equivalent flows, reducing model complexity and computation time",
      "To simplify the design of new sewer pipes",
      "To simplify the maintenance of the collection system"
    ],
    correctAnswer: 1,
    explanation: "Pipe network simplification (skeletonization) removes minor pipes (small-diameter laterals) from the model and represents their flows as equivalent inflows to the remaining pipes. Simplification reduces model complexity and computation time without significantly affecting model accuracy for the pipes of interest (trunk sewers, major collectors). The level of simplification depends on the modelling objectives.",
  },
  {
    id: 77,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's subcatchment delineation?",
    options: [
      "To delineate the drainage area contributing to each pipe in the collection system for I/I modelling",
      "To delineate the service area of the collection system",
      "To delineate the areas contributing to stormwater runoff",
      "To delineate the areas served by each lift station"
    ],
    correctAnswer: 0,
    explanation: "Subcatchment delineation defines the drainage area contributing to each pipe or manhole in the collection system. Subcatchment boundaries are used to assign: base flows (population, commercial/industrial flows), I/I rates (rainfall-dependent inflow, groundwater infiltration), and future growth flows. Accurate subcatchment delineation is essential for model accuracy.",
  },
  {
    id: 78,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's diurnal flow pattern?",
    options: [
      "To represent the daily variation in sewage flow (low at night, peaks in morning and evening) for accurate model predictions",
      "To represent the seasonal variation in sewage flow",
      "To represent the variation in sewage flow during storm events",
      "To represent the variation in sewage flow with population growth"
    ],
    correctAnswer: 0,
    explanation: "The diurnal flow pattern represents the daily variation in sewage flow: low flows at night (2–4 AM), rising flows in the morning (6–9 AM peak), moderate flows during the day, and an evening peak (5–8 PM). The diurnal pattern is used in the hydraulic model to simulate time-varying flows throughout the day. Accurate diurnal patterns are essential for predicting peak flows and system capacity.",
  },
  {
    id: 79,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's groundwater table representation?",
    options: [
      "To model the flow of groundwater in the soil",
      "To represent the groundwater table elevation in the model to calculate groundwater infiltration rates into the sewer system",
      "To model the impact of groundwater on sewer pipe structural integrity",
      "To model the impact of groundwater on lift station operations"
    ],
    correctAnswer: 1,
    explanation: "The groundwater table elevation in the model is used to calculate groundwater infiltration rates into the sewer system: infiltration is proportional to the head difference between the groundwater table and the sewer pipe (when the groundwater table is above the pipe). Seasonal variations in the groundwater table (high in spring, low in late summer) affect infiltration rates and must be represented in the model.",
  },
  {
    id: 80,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's surcharge analysis?",
    options: [
      "To analyze the structural impact of surcharge on sewer pipes",
      "To identify pipes and manholes that flow under pressure (surcharge) during design storm events, indicating capacity deficiencies",
      "To analyze the financial impact of surcharge on the utility",
      "To analyze the regulatory impact of surcharge on the utility"
    ],
    correctAnswer: 1,
    explanation: "Surcharge analysis identifies pipes and manholes where the hydraulic grade line (HGL) rises above the pipe crown (surcharge) or above the manhole rim (overflow) during design storm events. Surcharging indicates capacity deficiencies. Severe surcharging can cause: basement flooding, manhole overflows (SSOs), and structural damage to pipes. Surcharge analysis informs rehabilitation and expansion planning.",
  },
  {
    id: 81,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's pump station representation?",
    options: [
      "To design the pump station",
      "To accurately represent the pump station's performance (pump curves, wet well storage, control logic) in the hydraulic model for system-wide analysis",
      "To assess the structural condition of the pump station",
      "To calculate the energy consumption of the pump station"
    ],
    correctAnswer: 1,
    explanation: "Accurate pump station representation in the hydraulic model includes: pump performance curves (flow vs. head), wet well storage volume, control logic (pump start/stop levels), and force main characteristics. Accurate representation ensures that the model correctly predicts pump station behavior during design storms and emergency scenarios, which is critical for system-wide capacity analysis.",
  },
  {
    id: 82,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's long-term simulation?",
    options: [
      "To simulate the collection system's response over a long period (months to years) using continuous rainfall and flow data",
      "To simulate the collection system's response to a single design storm",
      "To simulate the long-term structural deterioration of sewer pipes",
      "To simulate the long-term financial performance of the utility"
    ],
    correctAnswer: 0,
    explanation: "Long-term simulation runs the hydraulic model over a long period (months to years) using continuous rainfall and flow data. Long-term simulation provides: frequency analysis of SSOs (how often they occur under historical rainfall), assessment of I/I reduction effectiveness, and evaluation of system performance under a range of weather conditions. It is more comprehensive than single design storm analysis.",
  },
  {
    id: 83,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's GIS integration?",
    options: [
      "To display model results on a geographic map for spatial analysis and communication",
      "To store model data in the GIS",
      "To control lift station pumps from the GIS",
      "To generate regulatory reports from the GIS"
    ],
    correctAnswer: 0,
    explanation: "GIS integration displays hydraulic model results on a geographic map: pipe surcharge depths, manhole overflow locations, flood depths, and pump station performance. Spatial display enables: identification of problem areas, communication of results to stakeholders, and integration with other spatial data (land use, topography, infrastructure). GIS integration is standard in modern hydraulic modelling software.",
  },
  {
    id: 84,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's data management system?",
    options: [
      "To store all model input data, results, and documentation in an organized, accessible format",
      "To control the hydraulic model",
      "To generate regulatory reports from the model",
      "To manage the financial data of the utility"
    ],
    correctAnswer: 0,
    explanation: "A hydraulic model data management system stores all model input data (pipe inventory, subcatchment data, flow monitoring data), model results (simulated flows, levels, surcharge depths), and documentation (calibration reports, analysis reports) in an organized, accessible format. Good data management ensures model continuity when staff change and supports model updates and audits.",
  },
  {
    id: 85,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's documentation?",
    options: [
      "To document the locations of all sewer pipes",
      "To document the model's assumptions, calibration, validation, and limitations so that users understand the model's capabilities and uncertainties",
      "To document the regulatory requirements",
      "To document the financial performance of the utility"
    ],
    correctAnswer: 1,
    explanation: "Hydraulic model documentation describes: model structure (software, pipe network, subcatchments), input data sources and assumptions, calibration process and results, validation results, model limitations and uncertainties, and guidance for model use. Good documentation ensures that the model can be understood, maintained, and updated by future users, and supports regulatory review.",
  },
  {
    id: 86,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's peer review?",
    options: [
      "To review the model by a peer utility",
      "To have an independent expert review the model's structure, calibration, and results to verify their accuracy and appropriateness",
      "To review the model by regulatory authorities",
      "To review the model by the public"
    ],
    correctAnswer: 1,
    explanation: "Peer review by an independent expert verifies the model's structure, calibration, and results. Peer review identifies: modelling errors, inappropriate assumptions, calibration deficiencies, and limitations in model application. Peer review is required for major planning studies and regulatory submissions to ensure model credibility and defensibility.",
  },
  {
    id: 87,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's training program?",
    options: [
      "To train operators to use the hydraulic model for daily operations",
      "To train engineers and planners to build, calibrate, and use the hydraulic model effectively",
      "To train regulators to review hydraulic models",
      "To train the public to understand hydraulic models"
    ],
    correctAnswer: 1,
    explanation: "Hydraulic model training programs train engineers and planners to: build and maintain the model (pipe network entry, subcatchment delineation), calibrate and validate the model (using flow monitoring data), run analyses (design storms, growth scenarios, rehabilitation alternatives), and interpret and communicate results. Training ensures that the model is used correctly and its results are reliable.",
  },
  {
    id: 88,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's software selection process?",
    options: [
      "To select the cheapest hydraulic modelling software",
      "To select the hydraulic modelling software that best meets the utility's needs (capabilities, ease of use, support, cost, industry acceptance)",
      "To select the software used by the regulatory authority",
      "To select the software used by the largest utilities"
    ],
    correctAnswer: 1,
    explanation: "Software selection evaluates hydraulic modelling software based on: capabilities (gravity sewer, force main, pump station, real-time control, GIS integration), ease of use, technical support, cost, and industry acceptance (regulatory acceptance, peer review credibility). Common software packages include: InfoWorks ICM, MIKE URBAN, SWMM, and SewerGEMS.",
  },
  {
    id: 89,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's continuous improvement program?",
    options: [
      "To continuously replace sewer pipes based on model results",
      "To continuously update and improve the model as new data becomes available and modelling techniques advance",
      "To continuously increase sewer rates based on model results",
      "To continuously hire new modellers"
    ],
    correctAnswer: 1,
    explanation: "Continuous improvement programs update and improve the hydraulic model as: new data becomes available (flow monitoring, condition assessments, as-built drawings), modelling techniques advance (new calibration methods, new I/I modelling approaches), and the system changes (new sewers, rehabilitated pipes, new development). A continuously improved model remains accurate and useful for planning and operations.",
  },
  {
    id: 90,
    module: "System Hydraulic Modelling",
    question: "What is the purpose of a hydraulic model's integration with the asset management system?",
    options: [
      "To control the asset management system from the hydraulic model",
      "To use hydraulic model results (capacity analysis, surcharge locations) to inform asset management decisions (rehabilitation priorities, replacement timing)",
      "To store hydraulic model results in the asset management system",
      "To generate financial reports from the hydraulic model"
    ],
    correctAnswer: 1,
    explanation: "Integration between the hydraulic model and the asset management system uses model results to inform asset management decisions: capacity-deficient pipes (from surcharge analysis) are prioritized for upsizing or rehabilitation, high-risk pipes (from condition assessment and hydraulic analysis) are prioritized for replacement, and model results inform the CIP and long-term financial planning.",
  },

  // ─── MODULE 4: Advanced Maintenance Management (15 questions) ────────────
  {
    id: 91,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a reliability-centred maintenance (RCM) analysis for a wastewater collection system?",
    options: [
      "To perform maintenance on all equipment on a fixed schedule",
      "To optimize maintenance strategies for each asset based on failure modes, failure consequences, and cost-effectiveness",
      "To eliminate all maintenance activities",
      "To respond to equipment failures after they occur"
    ],
    correctAnswer: 1,
    explanation: "RCM analysis systematically determines the most appropriate maintenance strategy for each asset by analyzing: failure modes (how can it fail?), failure effects (what happens when it fails?), failure consequences (safety, environmental, operational, economic), and maintenance task effectiveness (can the failure be prevented or detected?). RCM optimizes maintenance resources and improves system reliability.",
  },
  {
    id: 92,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a total productive maintenance (TPM) program?",
    options: [
      "To perform maintenance on all equipment on a fixed schedule",
      "To involve all staff (operators, maintenance, management) in improving equipment reliability, efficiency, and safety through proactive maintenance and continuous improvement",
      "To eliminate all maintenance activities",
      "To respond to equipment failures after they occur"
    ],
    correctAnswer: 1,
    explanation: "Total productive maintenance (TPM) involves all staff in improving equipment reliability: operators perform basic maintenance (cleaning, lubrication, inspection), maintenance staff focus on complex repairs and improvements, and management provides resources and support. TPM aims to eliminate equipment failures, defects, and accidents through proactive maintenance and continuous improvement.",
  },
  {
    id: 93,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a maintenance key performance indicator (KPI) program?",
    options: [
      "To measure the performance of individual maintenance workers",
      "To track metrics that indicate the effectiveness and efficiency of the maintenance program (equipment availability, maintenance cost, mean time between failures)",
      "To measure the flow in the sewer",
      "To assess the structural condition of sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "Maintenance KPIs track: equipment availability (%), mean time between failures (MTBF), mean time to repair (MTTR), planned vs. reactive maintenance ratio, maintenance cost per km of sewer, and energy consumption per m³ pumped. KPIs support performance management, continuous improvement, and benchmarking against peer utilities.",
  },
  {
    id: 94,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a maintenance budget optimization program?",
    options: [
      "To minimize the maintenance budget",
      "To allocate the maintenance budget to the highest-priority assets and activities to maximize system reliability and minimize lifecycle costs",
      "To maximize the maintenance budget",
      "To allocate the maintenance budget equally among all assets"
    ],
    correctAnswer: 1,
    explanation: "Maintenance budget optimization allocates the maintenance budget to the highest-priority assets and activities: high-risk assets (high consequence of failure) receive more resources, low-risk assets receive less. Optimization uses risk analysis, condition assessment data, and cost-benefit analysis to maximize the return on maintenance investment and minimize lifecycle costs.",
  },
  {
    id: 95,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a maintenance information system (MIS)?",
    options: [
      "To control lift station pumps",
      "To collect, store, and analyze maintenance data to support decision-making, performance reporting, and continuous improvement",
      "To measure the flow in the sewer",
      "To monitor the wet well level"
    ],
    correctAnswer: 1,
    explanation: "A maintenance information system (MIS or CMMS) collects, stores, and analyzes maintenance data: work order history, equipment failure history, maintenance costs, spare parts inventory, and equipment performance data. MIS data supports: maintenance planning, performance reporting (KPIs), asset management decisions (repair vs. replace), and regulatory compliance documentation.",
  },
  {
    id: 96,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a maintenance contractor performance management program?",
    options: [
      "To hire contractors to operate the sewer system",
      "To monitor and manage the performance of maintenance contractors to ensure quality, safety, and compliance with specifications",
      "To manage the construction of new sewers",
      "To manage the purchase of maintenance materials"
    ],
    correctAnswer: 1,
    explanation: "Contractor performance management monitors and manages maintenance contractors: performance metrics (quality of work, schedule adherence, safety record), regular performance reviews, corrective action for poor performance, and contract renewal decisions. Effective contractor management ensures that contracted services meet quality and safety standards.",
  },
  {
    id: 97,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a maintenance workforce planning program?",
    options: [
      "To plan the number of maintenance workers required for routine maintenance only",
      "To ensure that the maintenance workforce has the right skills, certifications, and numbers to meet current and future maintenance needs",
      "To plan the retirement of maintenance workers",
      "To plan the hiring of maintenance contractors"
    ],
    correctAnswer: 1,
    explanation: "Maintenance workforce planning ensures that the maintenance workforce has: the right skills (technical training, certifications), the right numbers (adequate staffing for planned and emergency maintenance), and the right succession plan (developing future maintenance leaders). Workforce planning addresses: skills gaps, succession planning, training needs, and staffing levels.",
  },
  {
    id: 98,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a maintenance technology adoption program?",
    options: [
      "To adopt the latest technology regardless of cost or benefit",
      "To systematically evaluate and adopt new maintenance technologies (drones, robotics, AI) that improve maintenance effectiveness and efficiency",
      "To replace all maintenance workers with technology",
      "To adopt technology only when required by regulations"
    ],
    correctAnswer: 1,
    explanation: "Maintenance technology adoption programs systematically evaluate and adopt new technologies: drones (aerial inspection of pump station roofs, large manholes), robotics (CCTV inspection, robotic repair), AI and machine learning (predictive maintenance, anomaly detection), and advanced sensors (vibration, acoustic emission). Technology adoption improves maintenance effectiveness and efficiency.",
  },
  {
    id: 99,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a maintenance lessons learned program?",
    options: [
      "To document the cost of maintenance failures",
      "To capture and share lessons from maintenance successes and failures to improve future maintenance practices",
      "To document the locations of maintenance failures",
      "To document the qualifications of maintenance workers"
    ],
    correctAnswer: 1,
    explanation: "Lessons learned programs capture and share lessons from maintenance successes and failures: what worked well (effective maintenance practices), what didn't work (failed maintenance approaches), and what can be improved (process improvements). Lessons learned are shared across the organization and with peer utilities to improve maintenance practices industry-wide.",
  },
  {
    id: 100,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a maintenance innovation program?",
    options: [
      "To continuously replace maintenance equipment with new equipment",
      "To encourage and implement innovative maintenance approaches that improve system reliability, reduce costs, and enhance sustainability",
      "To continuously hire new maintenance workers",
      "To continuously increase the maintenance budget"
    ],
    correctAnswer: 1,
    explanation: "Maintenance innovation programs encourage and implement innovative approaches: new maintenance technologies (robotics, AI), new maintenance strategies (RCM, TPM), new materials (advanced coatings, composite pipes), and new processes (digital work orders, mobile maintenance). Innovation improves system reliability, reduces costs, and enhances sustainability.",
  },
  {
    id: 101,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a maintenance risk register?",
    options: [
      "To document the financial risk of maintenance failures",
      "To identify, assess, and track maintenance-related risks (equipment failure risks, safety risks, environmental risks) and their mitigation measures",
      "To document the locations of maintenance risks",
      "To document the qualifications of maintenance risk managers"
    ],
    correctAnswer: 1,
    explanation: "A maintenance risk register identifies, assesses, and tracks maintenance-related risks: equipment failure risks (probability and consequence of failure), safety risks (confined space entry, electrical hazards), and environmental risks (SSOs from pump failures). For each risk, the register documents: mitigation measures, responsible person, and status. The risk register supports proactive risk management.",
  },
  {
    id: 102,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a maintenance audit program?",
    options: [
      "To audit the financial performance of the maintenance program",
      "To systematically review the maintenance program to verify that it is being implemented as planned and identify opportunities for improvement",
      "To audit the qualifications of maintenance workers",
      "To audit the maintenance contractor's performance"
    ],
    correctAnswer: 1,
    explanation: "Maintenance audit programs systematically review the maintenance program: verifying that preventive maintenance is being performed on schedule, checking that maintenance records are complete and accurate, assessing the effectiveness of maintenance activities (are failures being prevented?), and identifying opportunities for improvement. Audits ensure that the maintenance program is implemented as planned.",
  },
  {
    id: 103,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a maintenance benchmarking program?",
    options: [
      "To measure the elevation of sewer pipes",
      "To compare the maintenance program's performance and costs to similar utilities to identify opportunities for improvement",
      "To measure the flow in the sewer",
      "To assess the structural condition of sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "Maintenance benchmarking compares the utility's maintenance performance and costs to similar utilities: cost per km of sewer maintained, equipment availability (%), planned vs. reactive maintenance ratio, and energy consumption per m³ pumped. Benchmarking identifies areas where performance can be improved or costs reduced.",
  },
  {
    id: 104,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a maintenance sustainability program?",
    options: [
      "To reduce the cost of maintenance",
      "To minimize the environmental footprint of maintenance activities through energy efficiency, waste reduction, and sustainable materials",
      "To reduce the number of maintenance workers",
      "To eliminate the need for maintenance"
    ],
    correctAnswer: 1,
    explanation: "Maintenance sustainability programs minimize the environmental footprint of maintenance activities: reducing energy consumption (efficient equipment, optimized operations), reducing waste (recycling materials, minimizing chemical use), using sustainable materials (environmentally friendly lubricants, coatings), and reducing GHG emissions (electric vehicles, renewable energy). Sustainability is increasingly important for regulatory compliance and public accountability.",
  },
  {
    id: 105,
    module: "Advanced Maintenance Management",
    question: "What is the purpose of a maintenance knowledge management program?",
    options: [
      "To document the locations of all maintenance equipment",
      "To capture, document, and share maintenance knowledge (procedures, lessons learned, equipment history) to prevent loss when experienced staff leave",
      "To document regulatory compliance records",
      "To document financial records"
    ],
    correctAnswer: 1,
    explanation: "Maintenance knowledge management captures, documents, and shares maintenance knowledge: equipment-specific maintenance procedures, lessons learned from failures and successes, equipment history (maintenance records, failure history), and institutional knowledge (system quirks, operational tips). Knowledge management prevents loss of critical knowledge when experienced staff retire and supports training of new staff.",
  },

  // ─── MODULE 5: Leadership, Safety & Regulatory Management (45 questions) ─
  {
    id: 106,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a Class III operator's supervisory responsibilities?",
    options: [
      "To design new wastewater collection systems",
      "To supervise Class I and II operators, ensure regulatory compliance, and manage complex system operations",
      "To manage the entire utility including financial planning",
      "To perform advanced hydraulic modelling and rehabilitation design"
    ],
    correctAnswer: 1,
    explanation: "Class III operators supervise Class I and II operators: assigning work, providing technical guidance, reviewing work quality, and ensuring regulatory compliance. Class III operators are responsible for complex system operations (advanced lift stations, SCADA, complex maintenance programs) and may be the responsible operator for the collection system.",
  },
  {
    id: 107,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a safety management system (SMS) for a wastewater collection utility?",
    options: [
      "To document safety incidents after they occur",
      "To systematically manage safety risks to prevent injuries, illnesses, and fatalities through proactive hazard identification, risk assessment, and control",
      "To comply with occupational health and safety regulations only",
      "To train workers on safety procedures only"
    ],
    correctAnswer: 1,
    explanation: "A safety management system (SMS) systematically manages safety risks: hazard identification (identifying all workplace hazards), risk assessment (assessing likelihood and consequence of harm), risk control (eliminating or minimizing hazards), incident investigation (learning from incidents), and continuous improvement (improving safety performance over time). An SMS is required by occupational health and safety legislation in most provinces.",
  },
  {
    id: 108,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a confined space entry program for a wastewater collection utility?",
    options: [
      "To allow workers to enter manholes and wet wells safely by following established procedures for atmospheric testing, ventilation, and rescue",
      "To prevent workers from entering confined spaces",
      "To document all confined space entries",
      "To train workers on confined space hazards only"
    ],
    correctAnswer: 0,
    explanation: "A confined space entry program allows workers to enter manholes, wet wells, and other confined spaces safely: atmospheric testing (O₂, H₂S, combustible gases), forced ventilation (before and during entry), personal protective equipment (supplied air respirator if required), standby person (outside the space), and rescue procedures (never enter to rescue without proper equipment and training).",
  },
  {
    id: 109,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a lockout/tagout (LOTO) program for a wastewater collection utility?",
    options: [
      "To prevent unauthorized access to pump stations",
      "To prevent the unexpected energization of equipment during maintenance by locking out and tagging all energy sources",
      "To prevent theft of equipment from pump stations",
      "To prevent vandalism of pump stations"
    ],
    correctAnswer: 1,
    explanation: "Lockout/tagout (LOTO) programs prevent the unexpected energization of equipment during maintenance: all energy sources (electrical, hydraulic, pneumatic, gravity) are isolated and locked out before maintenance begins. Each worker places their own lock on the energy isolation device. LOTO is required by occupational health and safety regulations and prevents serious injuries and fatalities.",
  },
  {
    id: 110,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a hazard communication program for a wastewater collection utility?",
    options: [
      "To communicate safety hazards to the public",
      "To ensure that workers are informed about the hazardous chemicals they work with (H₂S, chlorine, caustic, ferric chloride) through safety data sheets and training",
      "To communicate safety hazards to regulatory authorities",
      "To communicate safety hazards to contractors"
    ],
    correctAnswer: 1,
    explanation: "Hazard communication programs ensure that workers are informed about hazardous chemicals: safety data sheets (SDS) for all chemicals used (H₂S, chlorine, caustic, ferric chloride, lubricants), chemical labelling, and worker training on chemical hazards and safe handling. Hazard communication is required by occupational health and safety regulations (WHMIS in Canada).",
  },
  {
    id: 111,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a personal protective equipment (PPE) program for a wastewater collection utility?",
    options: [
      "To provide workers with PPE as the primary means of controlling hazards",
      "To provide workers with appropriate PPE as the last line of defense after engineering and administrative controls have been implemented",
      "To comply with occupational health and safety regulations only",
      "To protect workers from all hazards without other controls"
    ],
    correctAnswer: 1,
    explanation: "PPE programs provide workers with appropriate PPE as the last line of defense: after engineering controls (ventilation, guarding) and administrative controls (procedures, training) have been implemented. PPE for wastewater collection includes: safety boots, gloves, safety glasses, hard hat, high-visibility vest, respiratory protection (H₂S, confined space), and fall protection. PPE selection is based on hazard assessment.",
  },
  {
    id: 112,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a safety incident investigation program?",
    options: [
      "To assign blame for safety incidents",
      "To identify the root causes of safety incidents and implement corrective actions to prevent recurrence",
      "To document safety incidents for regulatory reporting",
      "To calculate the cost of safety incidents"
    ],
    correctAnswer: 1,
    explanation: "Safety incident investigation programs identify the root causes of safety incidents (injuries, near misses, property damage) and implement corrective actions to prevent recurrence. Root cause analysis methods (5-Why, fishbone) identify underlying causes (management system failures, not just worker errors). Investigations must be conducted promptly and corrective actions implemented and tracked.",
  },
  {
    id: 113,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a safety performance measurement program?",
    options: [
      "To measure the performance of individual workers",
      "To track safety KPIs (injury frequency, near miss frequency, safety training completion) to assess safety performance and identify trends",
      "To measure the flow in the sewer",
      "To assess the structural condition of sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "Safety performance measurement tracks KPIs: lost time injury frequency rate (LTIFR), total recordable injury frequency rate (TRIFR), near miss frequency rate, safety training completion rate, and safety audit scores. KPIs support safety performance management, continuous improvement, and reporting to management and regulatory authorities.",
  },
  {
    id: 114,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a safety culture program?",
    options: [
      "To comply with occupational health and safety regulations",
      "To create an organizational culture where safety is a core value, all workers are empowered to identify and report hazards, and management demonstrates visible safety leadership",
      "To train workers on safety procedures",
      "To document safety incidents"
    ],
    correctAnswer: 1,
    explanation: "Safety culture programs create an organizational culture where safety is a core value: management demonstrates visible safety leadership (participating in safety walks, addressing hazards promptly), workers are empowered to identify and report hazards (without fear of reprisal), and safety is integrated into all decisions and activities. A positive safety culture is the foundation of an effective safety management system.",
  },
  {
    id: 115,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a regulatory compliance management program?",
    options: [
      "To comply with regulations only when inspected",
      "To systematically identify, track, and manage compliance with all applicable regulations (environmental, occupational health and safety, building codes) to prevent violations",
      "To challenge regulations that are too stringent",
      "To document regulatory violations after they occur"
    ],
    correctAnswer: 1,
    explanation: "Regulatory compliance management programs systematically identify all applicable regulations, track compliance status, and manage compliance activities: environmental regulations (operating permits, SSO reporting), occupational health and safety regulations (confined space, LOTO, WHMIS), and building codes (pump station construction). Proactive compliance management prevents violations and regulatory penalties.",
  },
  {
    id: 116,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a regulatory change management program?",
    options: [
      "To challenge regulatory changes",
      "To monitor regulatory changes, assess their impact on the utility, and implement required changes to operations and management",
      "To document regulatory changes",
      "To lobby regulators for less stringent regulations"
    ],
    correctAnswer: 1,
    explanation: "Regulatory change management programs monitor regulatory changes (new regulations, amended regulations, new guidance documents), assess their impact on the utility (operational changes required, capital investments needed, reporting changes), and implement required changes. Proactive regulatory change management prevents compliance surprises and allows time for orderly implementation.",
  },
  {
    id: 117,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a stakeholder management program for a Class III operator?",
    options: [
      "To manage relationships with sewer pipe manufacturers",
      "To identify, engage, and manage relationships with all stakeholders (regulators, elected officials, customers, community groups) to support the utility's mission",
      "To manage relationships with maintenance contractors",
      "To manage relationships with other utilities"
    ],
    correctAnswer: 1,
    explanation: "Stakeholder management programs identify all stakeholders (regulators, elected officials, customers, community groups, media, other utilities), assess their interests and influence, and develop engagement strategies. Effective stakeholder management builds trust, supports regulatory compliance, facilitates capital investment approvals, and manages community concerns about odours, SSOs, and rate increases.",
  },
  {
    id: 118,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a crisis communication plan for a wastewater collection utility?",
    options: [
      "To communicate routine operational information to the public",
      "To provide a framework for communicating with the public, media, and regulatory authorities during a crisis (major SSO, system failure, public health emergency)",
      "To communicate sewer rate increases to customers",
      "To communicate maintenance activities to customers"
    ],
    correctAnswer: 1,
    explanation: "A crisis communication plan provides a framework for communicating during a crisis: designated spokesperson, key messages, communication channels (media, social media, website, direct notification), notification procedures (regulatory authorities, public health, affected residents), and post-crisis communication (corrective actions taken). Effective crisis communication maintains public trust and minimizes reputational damage.",
  },
  {
    id: 119,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a Class III operator's mentoring program?",
    options: [
      "To train Class I operators only",
      "To develop the knowledge, skills, and competencies of junior operators through structured mentoring relationships with experienced operators",
      "To train operators on equipment operation only",
      "To train operators on regulatory requirements only"
    ],
    correctAnswer: 1,
    explanation: "Mentoring programs develop junior operators through structured relationships with experienced operators: sharing technical knowledge, operational experience, and professional judgment. Mentoring accelerates the development of junior operators, transfers institutional knowledge, and supports succession planning. Class III operators are well-positioned to mentor Class I and II operators.",
  },
  {
    id: 120,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a Class III operator's professional development program?",
    options: [
      "To maintain the operator's certification only",
      "To continuously develop the operator's knowledge, skills, and leadership capabilities through training, education, and professional activities",
      "To train the operator on new equipment only",
      "To train the operator on new regulations only"
    ],
    correctAnswer: 1,
    explanation: "Professional development programs continuously develop Class III operators: technical training (new technologies, advanced hydraulics, SCADA), management training (leadership, financial management, project management), professional activities (industry associations, conferences, publications), and formal education (engineering technology programs, management degrees). Continuous professional development maintains competency and advances the profession.",
  },
  {
    id: 121,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's strategic plan?",
    options: [
      "To plan the annual maintenance schedule",
      "To define the utility's long-term vision, mission, goals, and strategies for achieving them",
      "To plan the construction of new sewers",
      "To plan the financial performance of the utility"
    ],
    correctAnswer: 1,
    explanation: "A strategic plan defines the utility's long-term vision (what the utility aspires to be), mission (why the utility exists), goals (what the utility wants to achieve), and strategies (how the utility will achieve its goals). Strategic plans typically cover 5–10 years and address: service delivery, infrastructure sustainability, financial sustainability, regulatory compliance, and organizational development.",
  },
  {
    id: 122,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's organizational development program?",
    options: [
      "To hire new staff",
      "To develop the utility's organizational capabilities (structure, culture, processes, people) to achieve its strategic goals",
      "To restructure the utility's organizational chart",
      "To develop the utility's financial capabilities"
    ],
    correctAnswer: 1,
    explanation: "Organizational development programs develop the utility's capabilities: organizational structure (aligning structure with strategy), culture (developing a culture of safety, innovation, and continuous improvement), processes (improving operational and management processes), and people (developing staff competencies, leadership, and succession). Organizational development enables the utility to achieve its strategic goals.",
  },
  {
    id: 123,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's change management program?",
    options: [
      "To manage changes to the sewer system infrastructure",
      "To manage organizational changes (new technologies, new processes, restructuring) to minimize disruption and ensure successful implementation",
      "To manage changes to regulatory requirements",
      "To manage changes to sewer rates"
    ],
    correctAnswer: 1,
    explanation: "Change management programs manage organizational changes: new technologies (SCADA upgrades, new maintenance tools), new processes (new maintenance strategies, new reporting requirements), and restructuring (organizational changes). Effective change management: communicates the rationale for change, involves affected staff, provides training and support, and monitors implementation. Poor change management leads to resistance and failed implementations.",
  },
  {
    id: 124,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's performance management program?",
    options: [
      "To measure the performance of individual employees only",
      "To systematically measure, report, and improve the utility's performance across all dimensions (operational, financial, safety, environmental, customer service)",
      "To measure the financial performance of the utility only",
      "To measure the environmental performance of the utility only"
    ],
    correctAnswer: 1,
    explanation: "Performance management programs systematically measure, report, and improve the utility's performance: operational performance (SSO frequency, pump availability, maintenance response times), financial performance (cost per m³ treated, rate affordability), safety performance (injury frequency), environmental performance (SSO volume, energy consumption), and customer service (complaint response times). Performance management drives continuous improvement.",
  },
  {
    id: 125,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's innovation program?",
    options: [
      "To continuously replace infrastructure with new infrastructure",
      "To encourage and implement innovative approaches to service delivery, operations, and management that improve performance and reduce costs",
      "To continuously hire new staff",
      "To continuously increase the utility's budget"
    ],
    correctAnswer: 1,
    explanation: "Innovation programs encourage and implement innovative approaches: new technologies (SCADA, robotics, AI), new operational strategies (real-time control, predictive maintenance), new business models (shared services, public-private partnerships), and new management approaches (asset management, performance management). Innovation improves performance, reduces costs, and enhances sustainability.",
  },
  {
    id: 126,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's partnership program?",
    options: [
      "To partner with sewer pipe manufacturers",
      "To develop partnerships with other utilities, government agencies, research institutions, and industry associations to share knowledge, resources, and best practices",
      "To partner with maintenance contractors",
      "To partner with regulatory authorities"
    ],
    correctAnswer: 1,
    explanation: "Partnership programs develop relationships with: other utilities (shared services, joint procurement, knowledge sharing), government agencies (regulatory collaboration, funding programs), research institutions (applied research, technology development), and industry associations (AWWOA, EOCP, WEF, APWA). Partnerships leverage external knowledge and resources to improve utility performance.",
  },
  {
    id: 127,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's community engagement program?",
    options: [
      "To engage the community in routine maintenance activities",
      "To build community understanding and support for the utility's mission, services, and infrastructure investment needs",
      "To engage the community in regulatory compliance activities",
      "To engage the community in financial planning activities"
    ],
    correctAnswer: 1,
    explanation: "Community engagement programs build community understanding and support: educating the public about the importance of wastewater collection, communicating about service disruptions and planned improvements, engaging community members in planning processes, and building trust through transparency and accountability. Strong community support facilitates rate increases and capital investment approvals.",
  },
  {
    id: 128,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's media relations program?",
    options: [
      "To advertise the utility's services",
      "To proactively communicate with the media about the utility's activities, achievements, and challenges to maintain public trust and manage reputational risk",
      "To respond to media inquiries only",
      "To prevent negative media coverage"
    ],
    correctAnswer: 1,
    explanation: "Media relations programs proactively communicate with the media: issuing news releases about major projects and achievements, providing background information on complex issues, and responding promptly and accurately to media inquiries. Proactive media relations builds public trust, shapes the narrative around the utility's activities, and manages reputational risk during crises.",
  },
  {
    id: 129,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's government relations program?",
    options: [
      "To lobby government for less stringent regulations",
      "To build productive relationships with government officials (elected officials, senior bureaucrats) to advocate for the utility's interests and access funding programs",
      "To comply with government regulations",
      "To report to government authorities"
    ],
    correctAnswer: 1,
    explanation: "Government relations programs build productive relationships with government officials: briefing elected officials on infrastructure needs and funding requirements, advocating for funding programs (federal and provincial infrastructure programs), participating in regulatory development processes, and maintaining positive relationships with regulatory authorities. Effective government relations supports capital investment and regulatory outcomes.",
  },
  {
    id: 130,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's industry association participation?",
    options: [
      "To network with other utility professionals",
      "To contribute to and benefit from industry knowledge sharing, advocacy, and professional development through active participation in industry associations (AWWOA, EOCP, WEF, APWA)",
      "To comply with industry standards",
      "To access industry publications"
    ],
    correctAnswer: 1,
    explanation: "Industry association participation provides: access to industry knowledge (best practices, technical guidance, research), professional development opportunities (conferences, training, certification), networking with peers, advocacy on industry issues (regulatory development, funding programs), and opportunities to contribute to the profession (committee work, publications). Active participation benefits both the individual and the utility.",
  },
  {
    id: 131,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's research and development (R&D) program?",
    options: [
      "To conduct academic research on wastewater treatment",
      "To identify, fund, and implement applied research that addresses the utility's operational and management challenges",
      "To publish research papers",
      "To train researchers"
    ],
    correctAnswer: 1,
    explanation: "R&D programs identify, fund, and implement applied research that addresses the utility's challenges: new inspection technologies (advanced CCTV, acoustic sensors), new rehabilitation materials (advanced CIPP resins, self-healing coatings), new operational strategies (real-time control, predictive maintenance), and new management approaches (AI-based asset management). R&D drives innovation and improves utility performance.",
  },
  {
    id: 132,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's knowledge transfer program?",
    options: [
      "To transfer knowledge from the utility to regulatory authorities",
      "To capture and transfer knowledge from experienced staff to newer staff to prevent loss of institutional knowledge",
      "To transfer knowledge from research institutions to the utility",
      "To transfer knowledge from the utility to the public"
    ],
    correctAnswer: 1,
    explanation: "Knowledge transfer programs capture and transfer institutional knowledge from experienced staff to newer staff: documented procedures, as-built drawings, maintenance records, operational lessons learned, and mentoring programs. Knowledge transfer is critical for succession planning and organizational continuity as experienced staff retire.",
  },
  {
    id: 133,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's diversity and inclusion program?",
    options: [
      "To comply with employment equity legislation",
      "To create a diverse and inclusive workplace that attracts and retains top talent from all backgrounds and perspectives",
      "To hire a specific number of workers from designated groups",
      "To provide diversity training to all workers"
    ],
    correctAnswer: 1,
    explanation: "Diversity and inclusion programs create a workplace where all employees feel valued and included: diverse hiring practices (attracting candidates from all backgrounds), inclusive workplace culture (zero tolerance for discrimination and harassment), equitable advancement opportunities, and accommodation of diverse needs. Diverse and inclusive workplaces attract and retain top talent and improve organizational performance.",
  },
  {
    id: 134,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's employee wellness program?",
    options: [
      "To reduce the cost of employee health benefits",
      "To support the physical, mental, and social well-being of employees to improve health, productivity, and retention",
      "To comply with occupational health and safety regulations",
      "To reduce absenteeism only"
    ],
    correctAnswer: 1,
    explanation: "Employee wellness programs support the physical, mental, and social well-being of employees: physical wellness (fitness programs, ergonomic workstations), mental wellness (employee assistance programs, mental health support, stress management), and social wellness (team building, recognition programs). Wellness programs improve employee health, productivity, and retention, and reduce absenteeism.",
  },
  {
    id: 135,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's ethical conduct program?",
    options: [
      "To comply with anti-corruption legislation",
      "To establish and maintain high ethical standards for all utility employees and contractors to ensure integrity, transparency, and public trust",
      "To prevent fraud and theft",
      "To comply with conflict of interest legislation"
    ],
    correctAnswer: 1,
    explanation: "Ethical conduct programs establish and maintain high ethical standards: code of conduct (clear standards for ethical behavior), conflict of interest policy (preventing personal interests from influencing decisions), whistleblower protection (encouraging reporting of unethical behavior), and ethics training (ensuring all employees understand and comply with ethical standards). Ethical conduct builds public trust and prevents misconduct.",
  },
  {
    id: 136,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's financial management program?",
    options: [
      "To minimize the utility's budget",
      "To ensure the long-term financial sustainability of the utility through sound financial planning, rate setting, reserve management, and capital financing",
      "To maximize the utility's revenue",
      "To minimize the utility's debt"
    ],
    correctAnswer: 1,
    explanation: "Financial management programs ensure long-term financial sustainability: financial planning (projecting revenues and expenditures over 10–20 years), rate setting (setting rates to recover full costs including capital), reserve management (building reserves for capital replacement), and capital financing (debt management, grant applications). Sound financial management ensures that the utility can maintain and renew its infrastructure.",
  },
  {
    id: 137,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's procurement program?",
    options: [
      "To purchase the cheapest materials and services",
      "To procure materials, equipment, and services in a transparent, competitive, and value-for-money manner that complies with procurement policies and regulations",
      "To purchase materials and services from local suppliers only",
      "To purchase materials and services from the same suppliers as other utilities"
    ],
    correctAnswer: 1,
    explanation: "Procurement programs procure materials, equipment, and services in a transparent, competitive, and value-for-money manner: competitive bidding (ensuring fair competition), procurement policies (preventing conflicts of interest), lifecycle cost analysis (evaluating total cost, not just purchase price), and sustainable procurement (considering environmental and social factors). Sound procurement ensures value for money and public accountability.",
  },
  {
    id: 138,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's project management program?",
    options: [
      "To manage the construction of new sewers only",
      "To plan, execute, and control capital projects (rehabilitation, expansion, new construction) to deliver them on time, on budget, and to the required quality",
      "To manage the annual maintenance program",
      "To manage the utility's financial projects"
    ],
    correctAnswer: 1,
    explanation: "Project management programs plan, execute, and control capital projects: project planning (scope, schedule, budget), project execution (construction management, quality assurance), project control (monitoring progress, managing changes), and project closeout (commissioning, as-built documentation, lessons learned). Effective project management delivers projects on time, on budget, and to the required quality.",
  },
  {
    id: 139,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's risk management program?",
    options: [
      "To assess the financial risk of capital projects",
      "To systematically identify, assess, and manage all risks to the utility (operational, financial, regulatory, reputational) to minimize the likelihood and consequence of adverse events",
      "To assess the risk of worker injury",
      "To assess the risk of regulatory violations"
    ],
    correctAnswer: 1,
    explanation: "Risk management programs systematically identify, assess, and manage all risks: operational risks (equipment failures, SSOs), financial risks (rate affordability, capital cost overruns), regulatory risks (non-compliance, permit violations), and reputational risks (negative media coverage, community opposition). Risk management ensures that the utility is prepared for adverse events and can minimize their impacts.",
  },
  {
    id: 140,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's business continuity plan?",
    options: [
      "To plan for the construction of new sewers",
      "To ensure that the utility can continue to deliver essential services during and after a major disruption (natural disaster, cyberattack, pandemic)",
      "To plan for the retirement of key staff",
      "To plan for the financial sustainability of the utility"
    ],
    correctAnswer: 1,
    explanation: "A business continuity plan ensures that the utility can continue to deliver essential services during and after a major disruption: natural disasters (floods, earthquakes), cyberattacks (SCADA ransomware), pandemics (staff unavailability), and infrastructure failures (major pipe breaks, pump station failures). The plan identifies critical services, alternative delivery methods, and recovery procedures.",
  },
  {
    id: 141,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's succession planning program?",
    options: [
      "To plan for the replacement of sewer pipes",
      "To identify and develop future leaders and key technical staff to ensure continuity of operations as experienced staff retire",
      "To plan for the replacement of lift station equipment",
      "To plan for the construction of new sewers"
    ],
    correctAnswer: 1,
    explanation: "Succession planning identifies and develops future leaders and key technical staff: identifying critical positions (Class IV operator, engineering manager, operations superintendent), assessing current staff competencies, developing training and mentoring programs, and documenting institutional knowledge. Succession planning ensures organizational continuity as experienced staff retire.",
  },
  {
    id: 142,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's talent management program?",
    options: [
      "To hire the most talented employees",
      "To attract, develop, and retain talented employees to build organizational capability and achieve the utility's strategic goals",
      "To identify and promote the most talented employees",
      "To train talented employees on technical skills only"
    ],
    correctAnswer: 1,
    explanation: "Talent management programs attract, develop, and retain talented employees: employer branding (attracting candidates), recruitment (selecting the best candidates), onboarding (integrating new employees), development (training, mentoring, career development), performance management (recognizing and rewarding performance), and retention (competitive compensation, positive work environment). Talent management builds organizational capability.",
  },
  {
    id: 143,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's leadership development program?",
    options: [
      "To develop technical skills in senior operators",
      "To develop the leadership capabilities of current and future leaders to improve organizational performance and succession planning",
      "To develop regulatory compliance skills in senior operators",
      "To develop financial management skills in senior operators"
    ],
    correctAnswer: 1,
    explanation: "Leadership development programs develop leadership capabilities: strategic thinking, communication, decision-making, team building, change management, and financial management. Programs include: formal training (leadership courses, MBA programs), coaching and mentoring, stretch assignments (leading projects, cross-functional teams), and action learning. Leadership development improves organizational performance and prepares future leaders.",
  },
  {
    id: 144,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's organizational learning program?",
    options: [
      "To train all employees on technical skills",
      "To create an organization that continuously learns from its experiences, adapts to change, and improves its performance over time",
      "To document all organizational knowledge",
      "To train all employees on regulatory requirements"
    ],
    correctAnswer: 1,
    explanation: "Organizational learning programs create a learning organization: capturing lessons from successes and failures, sharing knowledge across the organization, encouraging experimentation and innovation, and adapting to change. Learning organizations continuously improve their performance by learning from experience and applying new knowledge. Organizational learning is a key capability for long-term sustainability.",
  },
  {
    id: 145,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's corporate social responsibility (CSR) program?",
    options: [
      "To comply with social responsibility legislation",
      "To demonstrate the utility's commitment to environmental sustainability, community well-being, and ethical governance beyond regulatory requirements",
      "To improve the utility's public image",
      "To reduce the utility's tax burden"
    ],
    correctAnswer: 1,
    explanation: "CSR programs demonstrate the utility's commitment to: environmental sustainability (reducing GHG emissions, protecting receiving environments), community well-being (supporting local employment, community programs), and ethical governance (transparency, accountability, anti-corruption). CSR builds public trust, attracts and retains employees, and demonstrates that the utility is a responsible corporate citizen.",
  },
  {
    id: 146,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's environmental management system (EMS)?",
    options: [
      "To comply with environmental regulations only",
      "To systematically manage the utility's environmental impacts through a structured framework (ISO 14001) of planning, implementation, monitoring, and continuous improvement",
      "To document environmental incidents",
      "To train employees on environmental regulations"
    ],
    correctAnswer: 1,
    explanation: "An environmental management system (EMS) based on ISO 14001 systematically manages environmental impacts: identifying significant environmental aspects (SSOs, energy consumption, GHG emissions), setting environmental objectives and targets, implementing environmental programs, monitoring performance, and continuously improving. An EMS demonstrates environmental commitment and supports regulatory compliance.",
  },
  {
    id: 147,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's quality management system (QMS)?",
    options: [
      "To comply with quality management standards only",
      "To systematically manage the quality of the utility's services through a structured framework (ISO 9001) of planning, implementation, monitoring, and continuous improvement",
      "To document quality incidents",
      "To train employees on quality management"
    ],
    correctAnswer: 1,
    explanation: "A quality management system (QMS) based on ISO 9001 systematically manages service quality: identifying customer requirements, setting quality objectives, implementing quality processes, monitoring performance, and continuously improving. A QMS ensures consistent service quality, improves customer satisfaction, and demonstrates commitment to quality.",
  },
  {
    id: 148,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's integrated management system (IMS)?",
    options: [
      "To integrate all utility management systems into a single system",
      "To integrate quality (ISO 9001), environmental (ISO 14001), and safety (ISO 45001) management systems into a single, coherent management framework",
      "To integrate the SCADA and asset management systems",
      "To integrate the financial and operational management systems"
    ],
    correctAnswer: 1,
    explanation: "An integrated management system (IMS) integrates quality (ISO 9001), environmental (ISO 14001), and safety (ISO 45001) management systems into a single, coherent framework. Integration eliminates duplication, reduces administrative burden, and ensures that quality, environmental, and safety considerations are addressed consistently across all utility activities.",
  },
  {
    id: 149,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the purpose of a utility's governance framework?",
    options: [
      "To define the utility's organizational structure only",
      "To define the roles, responsibilities, accountabilities, and decision-making processes that ensure the utility is managed effectively, ethically, and in the public interest",
      "To define the utility's financial management processes only",
      "To define the utility's regulatory compliance processes only"
    ],
    correctAnswer: 1,
    explanation: "A governance framework defines: roles and responsibilities (board, management, staff), accountabilities (who is responsible for what), decision-making processes (how decisions are made), and oversight mechanisms (audit, performance reporting). Good governance ensures that the utility is managed effectively, ethically, and in the public interest, and maintains public trust.",
  },
  {
    id: 150,
    module: "Leadership, Safety & Regulatory Management",
    question: "What is the role of a Class III Wastewater Collection Operator?",
    options: [
      "To design new wastewater collection systems",
      "To independently operate and maintain complex collection systems, supervise Class I and II operators, and serve as the responsible operator for the collection system",
      "To manage the entire utility including financial planning",
      "To perform advanced hydraulic modelling and rehabilitation design"
    ],
    correctAnswer: 1,
    explanation: "A Class III Wastewater Collection Operator independently operates and maintains complex collection systems: advanced lift stations (multiple pumps, VFDs, SCADA), complex force mains, and large-diameter gravity sewers. Class III operators supervise Class I and II operators, serve as the responsible operator for the collection system, and are responsible for regulatory compliance and emergency response.",
  },
];
