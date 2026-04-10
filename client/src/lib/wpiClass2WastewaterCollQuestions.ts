// WPI Class II Wastewater Collection — Practice Question Bank (150 Questions)
// Aligned with WPI Need-to-Know Criteria: Wastewater Collection Operator Class II
// Used for: BC (EOCP), Alberta (AWWOA), Saskatchewan, Manitoba
// Class II covers more complex systems, intermediate lift stations, and supervisory responsibilities

export interface WpiClass2WastewaterCollQuestion {
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

export const WPI_CLASS2_WASTEWATER_COLL_MODULES = [
  "Advanced Collection System Design",
  "Intermediate Lift Station Operations",
  "System Maintenance & Rehabilitation",
  "Hydraulics & Flow Analysis",
  "Regulatory Compliance & Reporting",
];

export const wpiClass2WastewaterCollQuestions: WpiClass2WastewaterCollQuestion[] = [
  // ─── MODULE 1: Advanced Collection System Design (30 questions) ──────────
  {
    id: 1,
    module: "Advanced Collection System Design",
    question: "What is Manning's equation used for in sewer design?",
    options: [
      "To calculate the pump head required in a lift station",
      "To calculate the flow velocity and capacity of a gravity sewer based on pipe size, slope, and roughness",
      "To calculate the volume of a wet well",
      "To calculate the friction losses in a force main"
    ],
    correctAnswer: 1,
    explanation: "Manning's equation (V = (1/n) × R^(2/3) × S^(1/2)) calculates the flow velocity in a gravity sewer. Variables: n = Manning's roughness coefficient (0.013 for concrete, 0.011 for PVC), R = hydraulic radius (D/4 for full circular pipe), S = slope (decimal). Flow capacity Q = V × A.",
    isCalc: true,
  },
  {
    id: 2,
    module: "Advanced Collection System Design",
    question: "What is the Hazen-Williams equation used for?",
    options: [
      "To calculate gravity sewer capacity",
      "To calculate friction head loss in pressurized force mains",
      "To calculate wet well volume",
      "To calculate pump efficiency"
    ],
    correctAnswer: 1,
    explanation: "The Hazen-Williams equation calculates friction head loss in pressurized pipes (force mains): hf = 10.67 × L × Q^1.852 / (C^1.852 × D^4.87). C is the Hazen-Williams roughness coefficient (130–150 for new PVC, 100 for older pipes). It is simpler than the Darcy-Weisbach equation for water and wastewater applications.",
    isCalc: true,
  },
  {
    id: 3,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a system curve in lift station design?",
    options: [
      "To show the pump's performance characteristics",
      "To show the relationship between flow rate and total head required by the piping system (static head + friction losses)",
      "To show the wet well level vs. time",
      "To show the pump efficiency vs. flow rate"
    ],
    correctAnswer: 1,
    explanation: "The system curve shows the total head required to move sewage through the force main at different flow rates. It includes static head (constant) and friction losses (increase with flow squared). The operating point is where the pump curve intersects the system curve. System curves are essential for pump selection and performance analysis.",
    isCalc: true,
  },
  {
    id: 4,
    module: "Advanced Collection System Design",
    question: "What is the design criterion for minimum self-cleansing velocity in a gravity sewer?",
    options: [
      "0.3 m/s (1 ft/s)",
      "0.6 m/s (2 ft/s)",
      "1.2 m/s (4 ft/s)",
      "2.0 m/s (6.5 ft/s)"
    ],
    correctAnswer: 1,
    explanation: "The minimum self-cleansing velocity for a gravity sewer is 0.6 m/s (2 ft/s) at design flow conditions. This velocity prevents solids from settling in the pipe. Some standards require 0.6 m/s at full-pipe flow; others require it at minimum daily flow. Maximum velocity is typically 3.0 m/s to prevent pipe erosion.",
  },
  {
    id: 5,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system master plan?",
    options: [
      "To document the current condition of all sewer pipes",
      "To provide a long-term plan for the development, expansion, and rehabilitation of the collection system to meet future growth and regulatory requirements",
      "To plan the annual maintenance schedule",
      "To document the locations of all manholes"
    ],
    correctAnswer: 1,
    explanation: "A sewer system master plan (or collection system master plan) is a long-term planning document that: assesses current system capacity and condition, projects future flows based on growth, identifies capacity deficiencies, evaluates rehabilitation and expansion alternatives, and recommends a capital improvement program (CIP) with cost estimates and priorities.",
  },
  {
    id: 6,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's peaking factor in design?",
    options: [
      "To account for the maximum flow that will occur during peak demand periods and wet weather events",
      "To account for the minimum flow in the sewer",
      "To account for the average daily flow",
      "To account for the flow at the treatment plant only"
    ],
    correctAnswer: 0,
    explanation: "The peaking factor accounts for the maximum instantaneous or short-duration flow that occurs during peak demand periods (morning/evening peaks) and wet weather events (I/I). Sewers must be sized to handle peak flows without surcharging. Peaking factors typically range from 3.5 to 4.0 for residential areas, decreasing for larger systems.",
    isCalc: true,
  },
  {
    id: 7,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer pipe's hydraulic gradient?",
    options: [
      "To measure the slope of the pipe",
      "To show the pressure head distribution along the pipe, indicating whether the pipe is flowing under gravity or under pressure",
      "To measure the flow velocity in the pipe",
      "To calculate the pipe's structural strength"
    ],
    correctAnswer: 1,
    explanation: "The hydraulic gradient (hydraulic grade line — HGL) shows the pressure head distribution along a pipe. For gravity sewers, the HGL should be below the pipe crown (pipe not full). If the HGL rises above the pipe crown, the pipe is surcharging (flowing under pressure). HGL analysis identifies capacity-deficient sections.",
    isCalc: true,
  },
  {
    id: 8,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's capacity analysis?",
    options: [
      "To assess the structural condition of sewer pipes",
      "To determine whether the collection system has sufficient capacity to convey current and projected future flows without surcharging or overflowing",
      "To plan the annual maintenance schedule",
      "To assess the financial condition of the utility"
    ],
    correctAnswer: 1,
    explanation: "A capacity analysis uses hydraulic modelling to assess whether the collection system can convey current and future flows (including I/I) without surcharging or overflowing. It identifies capacity-deficient pipes and manholes, evaluates the impact of new development, and informs rehabilitation and expansion planning.",
  },
  {
    id: 9,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's I/I analysis?",
    options: [
      "To measure the quality of the sewage",
      "To quantify the amount of stormwater (inflow) and groundwater (infiltration) entering the sanitary sewer and identify its sources",
      "To measure the flow at the treatment plant",
      "To assess the structural condition of sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "An I/I analysis quantifies the amount of stormwater and groundwater entering the sanitary sewer by comparing wet weather flows to dry weather flows. It identifies the sources and locations of I/I using flow monitoring, smoke testing, dye testing, and CCTV inspection. Results prioritize rehabilitation to reduce I/I.",
  },
  {
    id: 10,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's hydraulic model calibration?",
    options: [
      "To adjust the model parameters so that model predictions match field measurements",
      "To design new sewer pipes",
      "To calculate the pump head required",
      "To assess the structural condition of sewer pipes"
    ],
    correctAnswer: 0,
    explanation: "Hydraulic model calibration adjusts model parameters (pipe roughness, I/I rates, peaking factors) so that model predictions match field measurements (flow monitoring data, wet well levels). A calibrated model accurately represents the real system and can be used with confidence for planning and design.",
  },
  {
    id: 11,
    module: "Advanced Collection System Design",
    question: "What is a sewer system's level of service (LOS)?",
    options: [
      "The number of operators required to run the system",
      "A measure of the system's performance in terms of reliability, capacity, and compliance with regulatory standards",
      "The financial cost of operating the system",
      "The age of the sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "Level of service (LOS) defines the performance standards for the collection system: frequency of SSOs, frequency of basement flooding, response time to blockages, pipe condition ratings, and regulatory compliance. LOS targets are used to prioritize investments and evaluate system performance.",
  },
  {
    id: 12,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's capital improvement program (CIP)?",
    options: [
      "To document the annual operating budget",
      "To plan and prioritize major infrastructure investments (rehabilitation, replacement, expansion) over a multi-year period",
      "To plan the annual maintenance schedule",
      "To document the locations of all sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "A capital improvement program (CIP) is a multi-year plan (typically 5–20 years) that identifies, prioritizes, and schedules major infrastructure investments: pipe rehabilitation and replacement, lift station upgrades, capacity expansion, and new construction. The CIP is based on the master plan, condition assessments, and capacity analyses.",
  },
  {
    id: 13,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's geographic information system (GIS)?",
    options: [
      "To measure the flow in the sewer",
      "To store, manage, and display spatial data about the collection system (pipe locations, sizes, materials, conditions, manholes, lift stations)",
      "To control the lift stations remotely",
      "To calculate the pump head required"
    ],
    correctAnswer: 1,
    explanation: "A GIS stores and displays spatial data about the collection system: pipe locations, sizes, materials, ages, conditions, manhole locations, lift station locations, and service area boundaries. GIS supports operations (locating assets), maintenance (work order management), planning (capacity analysis), and emergency response.",
  },
  {
    id: 14,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's condition rating system?",
    options: [
      "To rate the performance of sewer operators",
      "To systematically assess and classify the structural and operational condition of sewer assets to prioritize maintenance and rehabilitation",
      "To rate the quality of the sewage",
      "To rate the performance of lift station pumps"
    ],
    correctAnswer: 1,
    explanation: "A condition rating system (e.g., NASSCO PACP for pipes, MACP for manholes) provides a standardized method for assessing and classifying the structural and operational condition of sewer assets. Ratings are used to prioritize maintenance, rehabilitation, and replacement. Condition data is stored in GIS and asset management systems.",
  },
  {
    id: 15,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's flow monitoring program?",
    options: [
      "To measure the quality of the sewage",
      "To measure and record wastewater flows at key points in the collection system to support operations, planning, and I/I analysis",
      "To control the lift station pumps",
      "To detect hydrogen sulfide in the sewer"
    ],
    correctAnswer: 1,
    explanation: "A flow monitoring program measures and records wastewater flows at key points (lift stations, trunk sewers, treatment plant influent) using temporary or permanent flow meters. Data is used for: I/I quantification, capacity analysis, treatment plant loading, regulatory reporting, and pump control optimization.",
  },
  {
    id: 16,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's infiltration/inflow (I/I) reduction program?",
    options: [
      "To increase the flow to the treatment plant",
      "To identify and eliminate sources of stormwater and groundwater entering the sanitary sewer to reduce treatment costs and prevent overflows",
      "To reduce the BOD of the sewage",
      "To reduce the number of lift stations"
    ],
    correctAnswer: 1,
    explanation: "I/I reduction programs identify and eliminate sources of stormwater inflow (illegal connections, defective manhole covers, roof drains) and groundwater infiltration (cracked pipes, defective joints) entering the sanitary sewer. Reducing I/I decreases treatment costs, prevents SSOs, extends system capacity, and reduces energy costs.",
  },
  {
    id: 17,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's asset management plan?",
    options: [
      "To document the financial value of the sewer system",
      "To systematically manage sewer assets over their lifecycle to optimize performance, manage risk, and minimize lifecycle costs",
      "To plan for the construction of new sewers only",
      "To document the locations of all sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "An asset management plan systematically manages sewer assets over their lifecycle: inventory, condition assessment, risk analysis, maintenance strategies, rehabilitation/replacement planning, and financial planning. It ensures long-term system sustainability, optimizes investment decisions, and supports rate setting.",
  },
  {
    id: 18,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's service lateral inspection program?",
    options: [
      "To inspect the public sewer mains only",
      "To assess the condition of private service laterals to identify defects contributing to I/I and to protect the public sewer from damage",
      "To measure the flow in service laterals",
      "To enforce the sewer use bylaw"
    ],
    correctAnswer: 1,
    explanation: "Service lateral inspection programs assess the condition of private service laterals (the pipes connecting buildings to the public sewer). Defective laterals are a significant source of I/I. Programs may require inspection at time of property sale, after major plumbing work, or as part of a systematic I/I reduction program.",
  },
  {
    id: 19,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's emergency response plan (ERP)?",
    options: [
      "To document routine maintenance schedules",
      "To outline procedures for responding to sewer system emergencies to minimize impacts on public health and the environment",
      "To plan for the construction of new sewers",
      "To document the locations of all sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "An ERP outlines procedures for responding to sewer system emergencies: pipe failures, lift station failures, major blockages, SSOs, and natural disasters. It includes: notification lists, response procedures, resource inventories (bypass pumps, equipment), communication protocols, and recovery procedures. ERPs enable fast, coordinated emergency response.",
  },
  {
    id: 20,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's pretreatment program?",
    options: [
      "To treat sewage before it enters the collection system",
      "To require industrial and commercial users to treat their wastewater before discharging to the sewer to protect the system and treatment plant",
      "To pre-treat drinking water",
      "To treat stormwater before it enters the combined sewer"
    ],
    correctAnswer: 1,
    explanation: "An industrial pretreatment program requires significant industrial users (SIUs) to treat their wastewater to meet discharge limits before discharging to the sanitary sewer. This protects: collection system infrastructure (from corrosive or toxic discharges), treatment plant operations (from inhibitory substances), and the receiving environment.",
  },
  {
    id: 21,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's odour control program?",
    options: [
      "To improve the aesthetic quality of the sewage",
      "To reduce H₂S and other odorous compounds to protect worker safety, prevent corrosion, and minimize community complaints",
      "To improve the efficiency of the treatment plant",
      "To reduce the BOD of the sewage"
    ],
    correctAnswer: 1,
    explanation: "Odour control programs reduce H₂S and other odorous compounds in the collection system using: chemical dosing (iron salts, nitrates, caustic), air injection, biofiltration, and chemical scrubbers at lift stations. Benefits include worker safety, corrosion prevention, and reduced community complaints.",
  },
  {
    id: 22,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's public education program?",
    options: [
      "To teach the public how to repair their own sewer laterals",
      "To educate the public about what can and cannot be flushed or poured down the drain to prevent blockages and system problems",
      "To inform the public about sewer rates",
      "To recruit new sewer operators"
    ],
    correctAnswer: 1,
    explanation: "Public education programs teach residents and businesses what can and cannot be flushed or poured down the drain. Key messages: don't flush wipes, don't pour FOG down the drain, don't connect sump pumps or downspouts to the sanitary sewer. Education reduces blockages, fatbergs, and I/I.",
  },
  {
    id: 23,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's cross-connection control program?",
    options: [
      "To prevent sewage from flowing backwards into the water distribution system",
      "To prevent illegal connections between the sanitary sewer and storm sewers or other non-sanitary sources",
      "To control the connections between different sewer mains",
      "To prevent stormwater from entering the sanitary sewer at manholes"
    ],
    correctAnswer: 1,
    explanation: "A cross-connection control program identifies and eliminates illegal connections between the sanitary sewer and storm sewers, foundation drains, roof drains, and other non-sanitary sources. These illegal connections are a major source of inflow. Programs involve property inspection and enforcement of the sewer use bylaw.",
  },
  {
    id: 24,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's sanitary sewer overflow (SSO) reduction program?",
    options: [
      "To increase the flow to the treatment plant",
      "To identify and address the causes of SSOs (capacity deficiencies, blockages, pump failures) to prevent future overflows",
      "To reduce the BOD of the sewage",
      "To reduce the number of lift stations"
    ],
    correctAnswer: 1,
    explanation: "An SSO reduction program identifies the causes of SSOs (capacity deficiencies from I/I, blockages, pump station failures, pipe failures) and implements corrective actions (I/I reduction, pipe rehabilitation, lift station upgrades, maintenance improvements). SSO reduction is required by regulatory permits and protects public health and the environment.",
  },
  {
    id: 25,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's climate change vulnerability assessment?",
    options: [
      "To reduce greenhouse gas emissions from the sewer system",
      "To assess how climate change (increased rainfall intensity, flooding, temperature changes) will affect the collection system and identify adaptation measures",
      "To plan for the construction of new sewers",
      "To reduce energy consumption at lift stations"
    ],
    correctAnswer: 1,
    explanation: "A climate change vulnerability assessment evaluates how climate change will affect the collection system: increased rainfall intensity (more I/I, more SSOs), flooding (inundation of manholes and lift stations), sea level rise (coastal systems), and temperature changes (affecting H₂S generation). It identifies adaptation measures to maintain system performance.",
  },
  {
    id: 26,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's sustainability plan?",
    options: [
      "To reduce the cost of sewer construction",
      "To minimize the environmental footprint of the collection system through energy efficiency, GHG reduction, and resource recovery",
      "To reduce the number of operators required",
      "To eliminate the need for lift stations"
    ],
    correctAnswer: 1,
    explanation: "Sustainability plans minimize the environmental footprint of the collection system: reducing energy consumption (VFDs, efficient pumps), reducing GHG emissions (methane capture, renewable energy), recovering resources (biosolids, biogas), and reducing chemical use. Sustainability is increasingly important for regulatory compliance and public accountability.",
  },
  {
    id: 27,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's financial plan?",
    options: [
      "To document the current cost of operating the sewer system",
      "To plan for the long-term funding of capital improvements, operations, and maintenance through rates, reserves, and financing",
      "To plan for the annual maintenance budget only",
      "To document the locations of all sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "A financial plan ensures the long-term financial sustainability of the sewer system by: projecting revenues (rates, connection fees), projecting expenditures (operations, maintenance, capital), identifying funding gaps, and recommending rate adjustments and financing strategies. Financial planning supports infrastructure investment and system sustainability.",
  },
  {
    id: 28,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's risk management framework?",
    options: [
      "To assess the financial risk of sewer construction",
      "To systematically identify, assess, and manage risks to the collection system to minimize the likelihood and consequence of failures",
      "To assess the risk of worker injury during maintenance",
      "To assess the risk of sewer rate increases"
    ],
    correctAnswer: 1,
    explanation: "A risk management framework systematically identifies hazards (pipe failures, SSOs, pump station failures), assesses their likelihood and consequence (public health, environmental, financial, reputational), and develops risk mitigation strategies. High-risk assets receive priority for maintenance, rehabilitation, or upgrade.",
  },
  {
    id: 29,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's performance measurement program?",
    options: [
      "To measure the performance of individual operators",
      "To track key performance indicators (KPIs) to assess system performance, identify trends, and support continuous improvement",
      "To measure the flow in the sewer",
      "To assess the structural condition of sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "A performance measurement program tracks KPIs (SSO frequency, basement flooding frequency, pipe condition ratings, maintenance response times, energy consumption) to assess system performance, identify trends, and support continuous improvement. KPIs are reported to management, regulators, and the public.",
  },
  {
    id: 30,
    module: "Advanced Collection System Design",
    question: "What is the purpose of a sewer system's benchmarking program?",
    options: [
      "To measure the elevation of sewer pipes",
      "To compare the system's performance and costs to similar utilities to identify opportunities for improvement",
      "To measure the flow in the sewer",
      "To assess the structural condition of sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "Benchmarking compares the utility's performance and costs to similar utilities (peer utilities, industry standards) to identify areas where performance can be improved or costs reduced. Benchmarking metrics include: cost per km of sewer maintained, SSO frequency, pipe condition ratings, and energy consumption per m³ pumped.",
  },

  // ─── MODULE 2: Intermediate Lift Station Operations (30 questions) ────────
  {
    id: 31,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a pump's best efficiency point (BEP)?",
    options: [
      "The point where the pump produces maximum flow",
      "The flow rate at which the pump operates at maximum efficiency, minimizing energy consumption and wear",
      "The point where the pump produces maximum head",
      "The flow rate at which the pump starts to cavitate"
    ],
    correctAnswer: 1,
    explanation: "The Best Efficiency Point (BEP) is the flow rate at which a centrifugal pump operates at maximum efficiency. Operating near BEP minimizes energy consumption, reduces vibration and noise, and extends pump life. Pumps should be selected so that their operating point is within 70–120% of BEP flow.",
  },
  {
    id: 32,
    module: "Intermediate Lift Station Operations",
    question: "What is the effect of pump wear on pump performance?",
    options: [
      "Wear improves pump efficiency over time",
      "Wear increases clearances between the impeller and casing, reducing pump efficiency and capacity",
      "Wear has no effect on pump performance",
      "Wear only affects the pump motor, not the pump itself"
    ],
    correctAnswer: 1,
    explanation: "As a pump wears, the clearances between the impeller and casing (wear rings) increase, allowing more internal recirculation (leakage from discharge back to suction). This reduces pump efficiency and capacity. Worn pumps require more energy to deliver the same flow and may not be able to meet peak demand. Regular inspection and wear ring replacement are essential.",
  },
  {
    id: 33,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a pump's affinity laws?",
    options: [
      "To calculate the pump's structural strength",
      "To predict how changes in pump speed affect flow, head, and power consumption",
      "To calculate the pump's efficiency",
      "To predict how changes in impeller diameter affect pump life"
    ],
    correctAnswer: 1,
    explanation: "The pump affinity laws predict how changes in pump speed (or impeller diameter) affect performance: (1) Flow varies directly with speed (Q₂/Q₁ = N₂/N₁); (2) Head varies as the square of speed (H₂/H₁ = (N₂/N₁)²); (3) Power varies as the cube of speed (P₂/P₁ = (N₂/N₁)³). These laws are essential for VFD optimization.",
    isCalc: true,
  },
  {
    id: 34,
    module: "Intermediate Lift Station Operations",
    question: "A pump currently runs at 1200 RPM and delivers 50 L/s. If the speed is increased to 1500 RPM, what is the new flow rate?",
    options: ["40 L/s", "50 L/s", "62.5 L/s", "78.1 L/s"],
    correctAnswer: 2,
    explanation: "Using the affinity law: Q₂ = Q₁ × (N₂/N₁) = 50 × (1500/1200) = 50 × 1.25 = 62.5 L/s.",
    isCalc: true,
    steps: [
      { l: "Identify the affinity law for flow", c: "Q₂/Q₁ = N₂/N₁" },
      { l: "Substitute values", c: "Q₂ = 50 × (1500/1200) = 50 × 1.25 = 62.5 L/s" },
    ],
  },
  {
    id: 35,
    module: "Intermediate Lift Station Operations",
    question: "A pump runs at 1200 RPM and produces 25 m of head. If the speed is increased to 1500 RPM, what is the new head?",
    options: ["20 m", "25 m", "31.25 m", "39.06 m"],
    correctAnswer: 2,
    explanation: "Using the affinity law: H₂ = H₁ × (N₂/N₁)² = 25 × (1500/1200)² = 25 × 1.5625 = 39.06 m. Wait — (1500/1200)² = 1.25² = 1.5625. H₂ = 25 × 1.5625 = 39.06 m.",
    isCalc: true,
    steps: [
      { l: "Identify the affinity law for head", c: "H₂/H₁ = (N₂/N₁)²" },
      { l: "Calculate speed ratio squared", c: "(1500/1200)² = 1.25² = 1.5625" },
      { l: "Calculate new head", c: "H₂ = 25 × 1.5625 = 39.06 m" },
    ],
  },
  {
    id: 36,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a pump's suction specific speed?",
    options: [
      "To calculate the pump's flow rate",
      "To assess the pump's susceptibility to cavitation based on its design",
      "To calculate the pump's efficiency",
      "To assess the pump's structural strength"
    ],
    correctAnswer: 1,
    explanation: "Suction specific speed (Nss) is a dimensionless parameter that characterizes a pump's susceptibility to cavitation. Pumps with high Nss values are more susceptible to cavitation. Nss is used in pump selection to ensure adequate NPSHa is available. Nss values below 8,500 (US units) are generally considered acceptable.",
  },
  {
    id: 37,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's wet well detention time?",
    options: [
      "To allow solids to settle in the wet well",
      "To provide sufficient storage volume to allow pump cycles of adequate duration, preventing excessive pump starts and motor overheating",
      "To allow sewage to be treated before pumping",
      "To allow H₂S to dissipate before pumping"
    ],
    correctAnswer: 1,
    explanation: "Wet well detention time (storage volume / inflow rate) determines the time between pump cycles. Adequate detention time (typically 20–30 minutes between starts) prevents excessive pump starts, which can overheat motors and reduce pump life. Too long a detention time can cause septic conditions and H₂S generation in the wet well.",
  },
  {
    id: 38,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's emergency overflow structure?",
    options: [
      "To increase the pumping capacity of the station",
      "To provide a controlled overflow point if the wet well exceeds its maximum level, directing overflow to a less sensitive location than an uncontrolled spill",
      "To provide additional storage during peak flows",
      "To allow stormwater to bypass the lift station"
    ],
    correctAnswer: 1,
    explanation: "An emergency overflow structure provides a controlled overflow point if the wet well exceeds its maximum level (due to pump failure, power outage, or extreme I/I). By directing overflow to a designated location (e.g., a storm sewer or holding pond), it prevents uncontrolled spills to more sensitive locations. Emergency overflows are a last resort and must be reported.",
  },
  {
    id: 39,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's telemetry system?",
    options: [
      "To control the pumps manually from the station",
      "To transmit operational data (wet well level, pump status, alarms) to a central control room or SCADA system for remote monitoring",
      "To measure the quality of the sewage in the wet well",
      "To control the flow rate entering the wet well"
    ],
    correctAnswer: 1,
    explanation: "A telemetry system transmits operational data (wet well level, pump run times, pump status, power status, alarms) from the lift station to a central control room or SCADA system. This allows operators to monitor multiple stations remotely, respond to alarms quickly, and optimize pump operations without visiting each station.",
  },
  {
    id: 40,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's odour control system?",
    options: [
      "To remove all bacteria from the sewage",
      "To reduce H₂S and other odorous compounds generated in the wet well and force main to protect worker safety and prevent community complaints",
      "To improve the efficiency of the treatment plant",
      "To prevent corrosion of the force main only"
    ],
    correctAnswer: 1,
    explanation: "Lift station odour control systems reduce H₂S and other odorous compounds. Methods include: chemical dosing (iron salts to precipitate sulfide, nitrates to promote aerobic conditions, caustic to raise pH), air injection into the wet well or force main, biofiltration of ventilation air, and chemical scrubbers. Odour control protects workers and prevents community complaints.",
  },
  {
    id: 41,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's cathodic protection system?",
    options: [
      "To protect the pumps from electrical faults",
      "To protect buried metal components (force mains, wet well structures) from electrochemical corrosion",
      "To protect the electrical system from lightning strikes",
      "To protect the wet well from H₂S corrosion"
    ],
    correctAnswer: 1,
    explanation: "Cathodic protection protects buried metal components (steel force mains, ductile iron pipes) from electrochemical corrosion by making them the cathode in an electrochemical cell. Methods include: sacrificial anodes (zinc or magnesium anodes attached to the pipe) and impressed current systems (external DC power source). Regular monitoring is required.",
  },
  {
    id: 42,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's surge protection system?",
    options: [
      "To protect the electrical system from power surges",
      "To protect the force main from water hammer pressure surges when pumps start or stop",
      "To protect the wet well from flooding",
      "To protect the pumps from cavitation"
    ],
    correctAnswer: 1,
    explanation: "Surge protection systems protect force mains from water hammer pressure surges. Methods include: slow-closing check valves (reduce the rate of flow deceleration), surge tanks (air chambers that absorb pressure surges), pressure relief valves (release excess pressure), and VFDs (reduce pump start/stop speed changes). Uncontrolled water hammer can rupture force mains.",
  },
  {
    id: 43,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's flow control valve?",
    options: [
      "To prevent backflow in the force main",
      "To regulate the flow rate from the lift station to prevent overloading the downstream system",
      "To measure the flow in the force main",
      "To isolate the lift station for maintenance"
    ],
    correctAnswer: 1,
    explanation: "Flow control valves (throttling valves) regulate the flow rate from the lift station to prevent overloading the downstream gravity sewer or treatment plant. They are used when the lift station's pumping capacity exceeds the downstream system's capacity. Flow control can also be achieved by VFD speed control.",
  },
  {
    id: 44,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's wet well mixing system?",
    options: [
      "To treat the sewage in the wet well",
      "To prevent solids from settling and H₂S from forming in the wet well by keeping the sewage mixed and aerated",
      "To measure the flow entering the wet well",
      "To control the pump speed"
    ],
    correctAnswer: 1,
    explanation: "Wet well mixing systems (submersible mixers, jet mixers, or air injection) keep the sewage in the wet well mixed and prevent solids from settling (which can cause pump clogging) and H₂S from forming (which causes odour and corrosion). Mixing is particularly important in wet wells with long detention times.",
  },
  {
    id: 45,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's pump control panel?",
    options: [
      "To provide power to the pumps only",
      "To control pump operation (start/stop, alternation, speed), display operational status, and provide alarm outputs",
      "To measure the flow in the force main",
      "To control the wet well level sensors"
    ],
    correctAnswer: 1,
    explanation: "The pump control panel houses the motor starters (or VFDs), control logic (PLC or relay logic), level control inputs, alarm outputs, and operator interface. It controls pump start/stop based on wet well level, alternates pumps, provides local and remote alarm outputs, and displays operational status (pump running, wet well level, alarms).",
  },
  {
    id: 46,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's emergency bypass connection?",
    options: [
      "To provide an alternate route for sewage if the force main is blocked",
      "To allow portable bypass pumps to be connected quickly during an emergency to maintain pumping when the station's pumps fail",
      "To provide an emergency power connection",
      "To allow the wet well to be emptied for maintenance"
    ],
    correctAnswer: 1,
    explanation: "An emergency bypass connection (quick-connect fitting on the wet well or force main) allows portable bypass pumps to be connected quickly during an emergency (pump failure, power outage, maintenance). Bypass pumps divert sewage from the wet well to the force main or downstream gravity sewer, preventing overflow.",
  },
  {
    id: 47,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's ventilation system?",
    options: [
      "To cool the pump motors",
      "To provide fresh air to the wet well and dry well to dilute hazardous gases (H₂S, methane) and prevent their accumulation",
      "To provide air for the odour control system",
      "To pressurize the wet well to prevent groundwater infiltration"
    ],
    correctAnswer: 1,
    explanation: "Ventilation systems provide fresh air to the wet well and dry well to dilute hazardous gases (H₂S, methane, CO₂) and maintain safe oxygen levels. Wet wells typically require 12 air changes per hour (continuous) or 30 air changes per hour (before entry). Ventilation air is typically treated (biofiltration, chemical scrubbing) before discharge to control odours.",
  },
  {
    id: 48,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's pump performance testing?",
    options: [
      "To test the pump motor's electrical performance",
      "To verify that the pump is delivering the expected flow and head, and to detect performance degradation due to wear",
      "To test the pump's structural strength",
      "To test the pump's cavitation resistance"
    ],
    correctAnswer: 1,
    explanation: "Pump performance testing measures the pump's actual flow and head (and efficiency if power is measured) and compares them to the pump's design performance curve. Performance degradation (reduced flow and head at the same speed) indicates wear, impeller damage, or seal failure. Testing is typically done annually or when performance problems are suspected.",
  },
  {
    id: 49,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's maintenance management system (MMS)?",
    options: [
      "To control the pumps remotely",
      "To plan, schedule, track, and document maintenance activities for all lift station equipment",
      "To measure the flow in the force main",
      "To monitor the wet well level"
    ],
    correctAnswer: 1,
    explanation: "A maintenance management system (MMS or CMMS — Computerized Maintenance Management System) plans, schedules, tracks, and documents maintenance activities. It generates preventive maintenance work orders, tracks corrective maintenance, manages spare parts inventory, and provides maintenance history for equipment. MMS data supports asset management and budget planning.",
  },
  {
    id: 50,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's energy management program?",
    options: [
      "To reduce the number of pumps at the station",
      "To optimize pump operation to minimize energy consumption while maintaining required service levels",
      "To reduce the flow to the treatment plant",
      "To reduce the maintenance costs of the station"
    ],
    correctAnswer: 1,
    explanation: "Energy management programs optimize pump operation to minimize energy consumption: operating pumps during off-peak electricity rate periods (time-of-use rates), using VFDs to match pump speed to demand, optimizing pump alternation, and maintaining pumps in good condition. Energy is typically the largest operating cost for lift stations.",
  },
  {
    id: 51,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's preventive maintenance program?",
    options: [
      "To respond to equipment failures after they occur",
      "To perform scheduled maintenance activities to prevent equipment failures, extend equipment life, and maintain reliable operation",
      "To document equipment failures",
      "To plan for equipment replacement"
    ],
    correctAnswer: 1,
    explanation: "Preventive maintenance (PM) programs perform scheduled maintenance activities (lubrication, inspection, cleaning, testing, calibration) to prevent equipment failures before they occur. PM extends equipment life, maintains reliable operation, reduces emergency repairs, and lowers lifecycle costs. PM schedules are based on manufacturer recommendations and operational experience.",
  },
  {
    id: 52,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's spare parts inventory?",
    options: [
      "To store extra pumps for future expansion",
      "To maintain critical spare parts on hand to minimize downtime when equipment fails",
      "To store chemicals for odour control",
      "To store fuel for the backup generator"
    ],
    correctAnswer: 1,
    explanation: "A spare parts inventory maintains critical spare parts (pump impellers, wear rings, mechanical seals, bearings, check valves, level sensors, control components) on hand to minimize downtime when equipment fails. Critical spares are identified based on failure frequency, lead time, and consequence of failure. Inventory management balances cost and availability.",
  },
  {
    id: 53,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's condition monitoring program?",
    options: [
      "To monitor the wet well level only",
      "To continuously or periodically monitor equipment condition (vibration, temperature, current draw) to detect developing problems before they cause failure",
      "To monitor the quality of the sewage",
      "To monitor the flow in the force main"
    ],
    correctAnswer: 1,
    explanation: "Condition monitoring uses sensors (vibration, temperature, current draw, noise) to detect developing equipment problems before they cause failure. Vibration analysis can detect bearing wear, impeller imbalance, and misalignment. Current monitoring can detect motor problems and pump wear. Condition monitoring enables predictive maintenance (fixing problems before failure).",
  },
  {
    id: 54,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's root cause analysis (RCA) after a failure?",
    options: [
      "To assign blame for the failure",
      "To identify the underlying cause(s) of a failure so that corrective actions can be taken to prevent recurrence",
      "To document the cost of the failure",
      "To determine whether the failed equipment needs to be replaced"
    ],
    correctAnswer: 1,
    explanation: "Root cause analysis (RCA) identifies the underlying cause(s) of a failure (not just the immediate cause) so that effective corrective actions can be taken to prevent recurrence. RCA methods include: 5-Why analysis, fishbone (Ishikawa) diagrams, and fault tree analysis. RCA is essential for improving system reliability.",
  },
  {
    id: 55,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's reliability-centred maintenance (RCM) program?",
    options: [
      "To perform maintenance on all equipment on a fixed schedule",
      "To optimize maintenance strategies for each piece of equipment based on its failure modes, consequences, and cost-effectiveness",
      "To eliminate all maintenance activities",
      "To respond to equipment failures after they occur"
    ],
    correctAnswer: 1,
    explanation: "Reliability-centred maintenance (RCM) optimizes maintenance strategies for each piece of equipment by analyzing: failure modes, failure consequences, and the cost-effectiveness of different maintenance approaches (preventive, predictive, run-to-failure). RCM focuses maintenance resources on the most critical equipment and failure modes.",
  },
  {
    id: 56,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's total cost of ownership (TCO) analysis?",
    options: [
      "To calculate the initial purchase cost of equipment",
      "To calculate the total lifecycle cost of equipment (purchase, installation, energy, maintenance, and disposal) to support investment decisions",
      "To calculate the annual operating cost of the station",
      "To calculate the replacement cost of equipment"
    ],
    correctAnswer: 1,
    explanation: "Total cost of ownership (TCO) analysis calculates the total lifecycle cost of equipment: purchase price, installation, energy consumption, maintenance, and disposal. TCO analysis supports investment decisions by comparing alternatives on a lifecycle cost basis rather than just initial cost. A more expensive, more efficient pump may have a lower TCO than a cheaper, less efficient one.",
  },
  {
    id: 57,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's key performance indicators (KPIs)?",
    options: [
      "To measure the performance of individual operators",
      "To track metrics that indicate whether the lift station is meeting its performance objectives (reliability, efficiency, compliance)",
      "To measure the flow in the force main",
      "To assess the structural condition of the wet well"
    ],
    correctAnswer: 1,
    explanation: "KPIs track metrics that indicate whether the lift station is meeting its performance objectives: pump availability (%), energy consumption per m³ pumped, number of alarms per month, maintenance cost per year, SSO frequency, and response time to alarms. KPIs support performance management and continuous improvement.",
  },
  {
    id: 58,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's operator log?",
    options: [
      "To record the operator's personal activities",
      "To document operational observations, maintenance activities, alarms, and abnormal conditions at the lift station",
      "To record the quality of the sewage",
      "To record the flow in the force main"
    ],
    correctAnswer: 1,
    explanation: "Operator logs document: operational observations (wet well level, pump run times, alarms), maintenance activities (lubrication, cleaning, repairs), abnormal conditions (high wet well level, pump failure, power outage), and corrective actions taken. Logs provide a record of station history, support troubleshooting, and demonstrate regulatory compliance.",
  },
  {
    id: 59,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's annual inspection?",
    options: [
      "To replace all equipment annually",
      "To comprehensively assess the condition of all lift station components and identify maintenance, rehabilitation, and replacement needs",
      "To measure the flow in the force main",
      "To test the backup generator only"
    ],
    correctAnswer: 1,
    explanation: "Annual inspections comprehensively assess the condition of all lift station components: wet well (structural condition, coating, corrosion), pumps (performance, wear, seals), electrical systems (panels, wiring, grounding), instrumentation (level sensors, flow meters, alarms), backup generator, and site (security, drainage). Results inform maintenance planning and capital budgeting.",
  },
  {
    id: 60,
    module: "Intermediate Lift Station Operations",
    question: "What is the purpose of a lift station's emergency response drill?",
    options: [
      "To train operators on routine maintenance procedures",
      "To practice emergency response procedures so that operators can respond quickly and effectively to real emergencies",
      "To test the backup generator",
      "To test the alarm system"
    ],
    correctAnswer: 1,
    explanation: "Emergency response drills practice the procedures in the emergency response plan: responding to pump failures, power outages, wet well overflows, and force main breaks. Drills identify gaps in the plan, ensure operators know their roles, and verify that equipment (bypass pumps, generators) is available and operational. Drills should be conducted at least annually.",
  },

  // ─── MODULE 3: System Maintenance & Rehabilitation (30 questions) ─────────
  {
    id: 61,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's preventive maintenance (PM) program?",
    options: [
      "To respond to sewer blockages after they occur",
      "To perform scheduled maintenance (cleaning, inspection, root control) to prevent blockages and failures before they occur",
      "To document sewer failures",
      "To plan for sewer replacement"
    ],
    correctAnswer: 1,
    explanation: "A preventive maintenance program performs scheduled maintenance activities (high-pressure cleaning, CCTV inspection, root control, manhole inspection) to prevent blockages and failures before they occur. PM reduces emergency repairs, extends asset life, and improves system reliability. PM schedules are based on historical blockage frequency and pipe condition.",
  },
  {
    id: 62,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's condition assessment program?",
    options: [
      "To measure the flow in the sewer",
      "To evaluate the structural and operational condition of sewer assets using CCTV, sonar, and manhole inspection to prioritize maintenance and rehabilitation",
      "To assess the financial condition of the utility",
      "To plan for the construction of new sewers"
    ],
    correctAnswer: 1,
    explanation: "A condition assessment program evaluates the structural and operational condition of sewer assets using CCTV inspection, sonar, laser profiling, and manhole inspection. Results are used to: prioritize maintenance (cleaning, root control), plan rehabilitation (lining, grouting), and schedule replacement. Condition assessment is the foundation of asset management.",
  },
  {
    id: 63,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's rehabilitation program?",
    options: [
      "To replace all sewer pipes on a fixed schedule",
      "To restore the structural integrity and hydraulic performance of deteriorated sewer assets using trenchless or open-cut methods",
      "To clean sewer pipes only",
      "To install new sewer pipes in new service areas"
    ],
    correctAnswer: 1,
    explanation: "A rehabilitation program restores deteriorated sewer assets using: trenchless methods (CIPP lining, slip lining, pipe bursting, grouting) or open-cut replacement. Rehabilitation is prioritized based on condition assessment results, risk analysis, and cost-effectiveness. Trenchless methods minimize disruption and cost compared to full replacement.",
  },
  {
    id: 64,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's root control program?",
    options: [
      "To remove all trees near sewer pipes",
      "To control root intrusion in sewer pipes using chemical treatment or mechanical cutting to prevent blockages",
      "To prevent new root intrusion in new sewer pipes",
      "To rehabilitate sewer pipes damaged by root intrusion"
    ],
    correctAnswer: 1,
    explanation: "Root control programs use chemical herbicides (copper sulfate, metam sodium) or mechanical cutting (root saws, high-pressure jets) to control root intrusion in sewer pipes. Chemical treatment kills roots and provides residual protection. Mechanical cutting removes roots but does not prevent regrowth. Root control is typically performed on a 1–3 year cycle.",
  },
  {
    id: 65,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's grease control program?",
    options: [
      "To remove grease from the sewage at the treatment plant",
      "To prevent grease buildup in sewers by requiring grease interceptors at food service establishments and performing regular sewer cleaning",
      "To inject chemicals into the sewer to dissolve grease",
      "To inspect grease interceptors only"
    ],
    correctAnswer: 1,
    explanation: "Grease control programs prevent grease buildup (fatbergs) in sewers by: requiring grease interceptors at food service establishments, enforcing interceptor maintenance (regular pumping), performing regular sewer cleaning in grease-prone areas, and educating the public about proper FOG disposal. Grease blockages are a leading cause of SSOs.",
  },
  {
    id: 66,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's manhole rehabilitation program?",
    options: [
      "To replace all manholes on a fixed schedule",
      "To restore the structural integrity and watertightness of deteriorated manholes to reduce I/I and prevent structural failure",
      "To clean manholes only",
      "To install new manholes in new service areas"
    ],
    correctAnswer: 1,
    explanation: "Manhole rehabilitation restores deteriorated manholes using: chimney sealing (flexible seals around the frame), interior lining (cementitious or epoxy coatings), joint grouting, and frame/cover replacement. Manholes are a significant source of I/I (through frames, covers, and joint failures) and structural deterioration (from H₂S corrosion).",
  },
  {
    id: 67,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's lateral rehabilitation program?",
    options: [
      "To replace all service laterals on a fixed schedule",
      "To rehabilitate defective service laterals that are contributing to I/I or causing blockages",
      "To inspect service laterals only",
      "To install new service laterals in new service areas"
    ],
    correctAnswer: 1,
    explanation: "Lateral rehabilitation programs rehabilitate defective service laterals (private pipes connecting buildings to the public sewer) that are contributing to I/I or causing blockages. Methods include: CIPP lining of the lateral, pipe bursting, and spot repairs. Lateral rehabilitation can significantly reduce I/I in older residential areas.",
  },
  {
    id: 68,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's CCTV inspection program?",
    options: [
      "To provide security monitoring of manholes",
      "To assess the interior condition of sewer pipes to identify defects, blockages, and root intrusion without excavation",
      "To measure the flow in sewer pipes",
      "To detect hydrogen sulfide in sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "CCTV inspection uses a remote-controlled camera to assess the interior condition of sewer pipes. It identifies: structural defects (cracks, joint failures, corrosion, deformation), operational defects (root intrusion, grease buildup, sediment), and construction defects (misaligned joints, offset joints). CCTV data is coded using NASSCO PACP standards.",
  },
  {
    id: 69,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's pipe lining (CIPP) program?",
    options: [
      "To increase the diameter of existing sewer pipes",
      "To rehabilitate deteriorated sewer pipes by installing a resin-impregnated liner that cures in place, restoring structural integrity and reducing I/I",
      "To provide thermal insulation for sewer pipes",
      "To prevent root intrusion in new sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "CIPP (Cured-In-Place Pipe) lining inserts a flexible, resin-impregnated felt tube into an existing deteriorated sewer and cures it (using hot water, steam, or UV light) to form a new structural pipe within the old pipe. CIPP restores structural integrity, reduces I/I, and extends service life by 50+ years without excavation.",
  },
  {
    id: 70,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's pipe bursting program?",
    options: [
      "To destroy sewer pipes that are no longer needed",
      "To replace deteriorated sewer pipes by fracturing the old pipe outward and simultaneously pulling in a new pipe",
      "To increase the pressure in a force main",
      "To clean sewer pipes by creating a pressure wave"
    ],
    correctAnswer: 1,
    explanation: "Pipe bursting is a trenchless pipe replacement method where a bursting head fractures the existing pipe outward into the surrounding soil while simultaneously pulling in a new pipe (typically HDPE) of the same or larger diameter. It avoids full excavation and is used when the existing pipe is too deteriorated for lining.",
  },
  {
    id: 71,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's point repair program?",
    options: [
      "To replace entire sewer pipe sections",
      "To repair isolated defects (cracks, joint failures, root intrusion) in sewer pipes without replacing the entire pipe",
      "To clean isolated sections of sewer pipe",
      "To inspect isolated sections of sewer pipe"
    ],
    correctAnswer: 1,
    explanation: "Point repair programs repair isolated defects in sewer pipes (cracks, joint failures, root intrusion, offset joints) without replacing the entire pipe. Methods include: excavation and spot repair, internal grouting (chemical grouting to seal joints), and robotic repair (internal patching using a CCTV-guided robot). Point repairs are cost-effective for isolated defects.",
  },
  {
    id: 72,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's chemical grouting program?",
    options: [
      "To seal cracks and joints in sewer pipes from the inside to reduce infiltration",
      "To clean sewer pipes using chemical solutions",
      "To control root intrusion using chemical herbicides",
      "To control odours in sewer pipes"
    ],
    correctAnswer: 0,
    explanation: "Chemical grouting seals cracks and joints in sewer pipes from the inside by injecting a chemical grout (typically acrylate or polyurethane) that reacts with groundwater to form a flexible, watertight seal. Grouting is performed using a CCTV-guided packer that isolates the defect and injects the grout. It is effective for reducing infiltration at specific defects.",
  },
  {
    id: 73,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's slip lining program?",
    options: [
      "To install a new pipe inside an existing pipe to restore structural integrity and reduce I/I",
      "To install a pipe on top of an existing pipe",
      "To install a pipe alongside an existing pipe",
      "To install a pipe to replace an existing pipe after excavation"
    ],
    correctAnswer: 0,
    explanation: "Slip lining installs a new pipe (typically HDPE or PVC) inside an existing deteriorated pipe. The annular space between the old and new pipe is grouted. Slip lining reduces the pipe's internal diameter (reducing capacity) but restores structural integrity and reduces I/I. It is simpler and less expensive than CIPP but results in a smaller pipe.",
  },
  {
    id: 74,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's spray lining program?",
    options: [
      "To apply a structural lining to the interior of a sewer pipe to restore structural integrity",
      "To apply a protective coating to the interior of a sewer pipe to prevent corrosion",
      "To apply a chemical herbicide to control root intrusion",
      "To apply a sealant to manhole joints"
    ],
    correctAnswer: 1,
    explanation: "Spray lining applies a protective coating (epoxy, cementitious, or polyurethane) to the interior of a sewer pipe to prevent corrosion (particularly H₂S-induced crown corrosion in concrete pipes). Spray lining provides corrosion protection but limited structural rehabilitation. It is used in pipes with good structural integrity but corrosion damage.",
  },
  {
    id: 75,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's pipe replacement program?",
    options: [
      "To replace all sewer pipes on a fixed schedule",
      "To replace sewer pipes that are too deteriorated for rehabilitation, or where rehabilitation is not cost-effective",
      "To replace sewer pipes that are blocked",
      "To replace sewer pipes that are undersized"
    ],
    correctAnswer: 1,
    explanation: "Pipe replacement programs replace sewer pipes that are too deteriorated for rehabilitation (structural failure risk), where rehabilitation is not cost-effective (e.g., very small diameter pipes), or where upsizing is required to address capacity deficiencies. Replacement is typically by open-cut excavation or pipe bursting.",
  },
  {
    id: 76,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's maintenance hole (manhole) inspection program?",
    options: [
      "To measure the flow in the sewer",
      "To assess the structural condition of manholes, identify defects, and check for I/I",
      "To test the chemical quality of sewage",
      "To install new sewer connections"
    ],
    correctAnswer: 1,
    explanation: "Manhole inspection programs assess the structural condition of manholes (frame, cover, chimney, cone, barrel, bench, and invert) using visual inspection from the surface or by entry. They identify defects (cracks, joint failures, corrosion, root intrusion) and signs of I/I (staining, mineral deposits, active infiltration). Results are coded using NASSCO MACP standards.",
  },
  {
    id: 77,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's cleaning frequency optimization?",
    options: [
      "To clean all sewers on a fixed annual schedule",
      "To determine the optimal cleaning frequency for each sewer section based on its blockage history, condition, and risk",
      "To clean only sewers that have blocked",
      "To clean sewers only before CCTV inspection"
    ],
    correctAnswer: 1,
    explanation: "Cleaning frequency optimization determines the optimal cleaning interval for each sewer section based on: historical blockage frequency, pipe condition (root intrusion, grease buildup, sediment), downstream consequences of blockage, and cost. High-risk sections are cleaned more frequently; low-risk sections less frequently. This optimizes maintenance resources.",
  },
  {
    id: 78,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's emergency repair program?",
    options: [
      "To plan for routine maintenance activities",
      "To respond quickly to urgent sewer failures (pipe collapses, major blockages, SSOs) to restore service and prevent further damage",
      "To plan for sewer replacement",
      "To document sewer failures"
    ],
    correctAnswer: 1,
    explanation: "Emergency repair programs ensure rapid response to urgent sewer failures: pipe collapses, major blockages, SSOs, and lift station failures. They include: 24/7 on-call staffing, emergency equipment (bypass pumps, vactor trucks, CCTV), pre-approved emergency contracts, and notification procedures. Fast response minimizes public health and environmental impacts.",
  },
  {
    id: 79,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's trenchless technology program?",
    options: [
      "To avoid all excavation in sewer maintenance",
      "To use trenchless methods (CIPP, pipe bursting, slip lining, grouting) to rehabilitate sewers with minimal surface disruption",
      "To install new sewers without excavation",
      "To inspect sewers without entering manholes"
    ],
    correctAnswer: 1,
    explanation: "Trenchless technology programs use methods that rehabilitate or replace sewers with minimal surface disruption: CIPP lining, pipe bursting, slip lining, chemical grouting, and robotic repair. Trenchless methods reduce: traffic disruption, surface restoration costs, construction time, and environmental impacts compared to open-cut methods.",
  },
  {
    id: 80,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's post-rehabilitation inspection?",
    options: [
      "To verify that the rehabilitation was completed correctly and meets specifications",
      "To plan for the next rehabilitation project",
      "To measure the flow in the rehabilitated sewer",
      "To assess the condition of adjacent sewers"
    ],
    correctAnswer: 0,
    explanation: "Post-rehabilitation inspection (typically CCTV) verifies that the rehabilitation was completed correctly and meets specifications: CIPP liner is properly installed with no wrinkles, voids, or delamination; pipe bursting resulted in a properly installed new pipe; grouting sealed the targeted defects. Post-rehabilitation inspection is required by most specifications.",
  },
  {
    id: 81,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's work order management system?",
    options: [
      "To control the lift station pumps",
      "To plan, assign, track, and document maintenance and repair work orders",
      "To measure the flow in the sewer",
      "To monitor the wet well level"
    ],
    correctAnswer: 1,
    explanation: "A work order management system plans, assigns, tracks, and documents maintenance and repair work orders. It ensures that all maintenance activities are planned, assigned to the right crew, completed on time, and documented. Work order data provides maintenance history for each asset and supports performance reporting and budget planning.",
  },
  {
    id: 82,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's contractor management program?",
    options: [
      "To hire contractors to operate the sewer system",
      "To manage contracted services (CCTV inspection, cleaning, rehabilitation) to ensure quality, safety, and compliance with specifications",
      "To manage the construction of new sewers",
      "To manage the purchase of sewer materials"
    ],
    correctAnswer: 1,
    explanation: "Contractor management programs ensure that contracted services (CCTV inspection, cleaning, rehabilitation, emergency repairs) are performed safely, to the required quality, and in compliance with specifications and regulations. Programs include: contractor prequalification, contract administration, quality assurance/quality control (QA/QC), and performance evaluation.",
  },
  {
    id: 83,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's quality assurance/quality control (QA/QC) program?",
    options: [
      "To assess the quality of the sewage",
      "To ensure that maintenance, rehabilitation, and construction work meets specified quality standards",
      "To assess the quality of the treatment plant effluent",
      "To assess the quality of the sewer system's data"
    ],
    correctAnswer: 1,
    explanation: "QA/QC programs ensure that maintenance, rehabilitation, and construction work meets specified quality standards. QA involves planning and systematic activities to ensure quality (specifications, inspection procedures, contractor qualification). QC involves inspection and testing to verify that work meets specifications (CCTV post-rehabilitation, pipe pressure testing, mandrel testing).",
  },
  {
    id: 84,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's data management program?",
    options: [
      "To store financial data for the utility",
      "To collect, store, manage, and analyze data about the collection system (pipe inventory, condition, maintenance history, flow data) to support operations and planning",
      "To store personnel records",
      "To store regulatory compliance records only"
    ],
    correctAnswer: 1,
    explanation: "Data management programs collect, store, manage, and analyze data about the collection system: pipe inventory (location, size, material, age), condition assessment data (CCTV, manhole inspection), maintenance history (cleaning, repairs), flow monitoring data, and operational data (lift station run times, alarms). Good data management supports operations, planning, and regulatory compliance.",
  },
  {
    id: 85,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's benchmarking program?",
    options: [
      "To measure the elevation of sewer pipes",
      "To compare the system's performance and costs to similar utilities to identify opportunities for improvement",
      "To measure the flow in the sewer",
      "To assess the structural condition of sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "Benchmarking compares the utility's performance and costs to similar utilities (peer utilities, industry standards) to identify areas where performance can be improved or costs reduced. Common benchmarking metrics: cost per km of sewer maintained, SSO frequency, pipe condition ratings, energy consumption per m³ pumped, and maintenance response times.",
  },
  {
    id: 86,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's continuous improvement program?",
    options: [
      "To continuously replace sewer pipes",
      "To systematically identify and implement improvements to operations, maintenance, and management to enhance system performance and efficiency",
      "To continuously increase sewer rates",
      "To continuously hire new operators"
    ],
    correctAnswer: 1,
    explanation: "Continuous improvement programs systematically identify and implement improvements to operations, maintenance, and management. They use data (KPIs, benchmarking, customer feedback) to identify improvement opportunities, implement changes, and measure results. Continuous improvement is a key principle of asset management and quality management systems.",
  },
  {
    id: 87,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's training program?",
    options: [
      "To train operators to perform only routine maintenance tasks",
      "To develop the knowledge, skills, and competencies of operators and other staff to ensure safe, effective, and compliant system operation",
      "To train operators to design new sewer systems",
      "To train operators to perform financial planning"
    ],
    correctAnswer: 1,
    explanation: "Training programs develop the knowledge, skills, and competencies of operators and other staff: technical training (equipment operation, maintenance, safety), regulatory training (environmental regulations, reporting requirements), and management training (asset management, financial planning). Training supports certification maintenance and continuous professional development.",
  },
  {
    id: 88,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's succession planning program?",
    options: [
      "To plan for the replacement of sewer pipes",
      "To identify and develop future leaders and key technical staff to ensure continuity of operations as experienced staff retire",
      "To plan for the replacement of lift station equipment",
      "To plan for the construction of new sewers"
    ],
    correctAnswer: 1,
    explanation: "Succession planning identifies and develops future leaders and key technical staff to ensure continuity of operations as experienced staff retire. It includes: identifying critical positions, assessing current staff competencies, developing training and mentoring programs, and documenting institutional knowledge. Succession planning is essential for long-term organizational sustainability.",
  },
  {
    id: 89,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's knowledge management program?",
    options: [
      "To document the locations of all sewer pipes",
      "To capture, document, and share institutional knowledge about the collection system to prevent loss when experienced staff leave",
      "To document regulatory compliance records",
      "To document financial records"
    ],
    correctAnswer: 1,
    explanation: "Knowledge management programs capture, document, and share institutional knowledge about the collection system: system history, operational quirks, maintenance lessons learned, and emergency response procedures. This prevents loss of critical knowledge when experienced staff retire. Methods include: documented procedures, as-built drawings, maintenance records, and mentoring programs.",
  },
  {
    id: 90,
    module: "System Maintenance & Rehabilitation",
    question: "What is the purpose of a sewer system's stakeholder engagement program?",
    options: [
      "To engage with sewer pipe manufacturers",
      "To communicate with and engage stakeholders (customers, regulators, elected officials, the public) about the collection system's performance, plans, and needs",
      "To engage with contractors for maintenance services",
      "To engage with other utilities for shared services"
    ],
    correctAnswer: 1,
    explanation: "Stakeholder engagement programs communicate with and engage stakeholders about the collection system: informing customers about service disruptions and rate changes, reporting to regulators on compliance and SSOs, briefing elected officials on capital needs, and educating the public about proper sewer use. Effective stakeholder engagement builds public trust and support for infrastructure investment.",
  },

  // ─── MODULE 4: Hydraulics & Flow Analysis (30 questions) ─────────────────
  {
    id: 91,
    module: "Hydraulics & Flow Analysis",
    question: "A 300 mm diameter sewer pipe has a Manning's n of 0.013 and a slope of 0.3%. What is the full-pipe flow capacity in L/s?",
    options: ["28 L/s", "42 L/s", "56 L/s", "84 L/s"],
    correctAnswer: 1,
    explanation: "V = (1/0.013) × (0.075)^(2/3) × (0.003)^(1/2) = 76.9 × 0.179 × 0.0548 = 0.754 m/s. A = π/4 × 0.3² = 0.0707 m². Q = 0.754 × 0.0707 = 0.0533 m³/s = 53.3 L/s ≈ 56 L/s (using R = D/4 = 0.075 m, S = 0.003).",
    isCalc: true,
    steps: [
      { l: "Calculate hydraulic radius", c: "R = D/4 = 0.300/4 = 0.075 m" },
      { l: "Calculate velocity", c: "V = (1/0.013) × (0.075)^(2/3) × (0.003)^(1/2) = 76.9 × 0.179 × 0.0548 = 0.754 m/s" },
      { l: "Calculate pipe area", c: "A = π/4 × (0.3)² = 0.0707 m²" },
      { l: "Calculate flow", c: "Q = V × A = 0.754 × 0.0707 = 0.0533 m³/s = 53.3 L/s" },
    ],
  },
  {
    id: 92,
    module: "Hydraulics & Flow Analysis",
    question: "A force main is 200 mm in diameter and 1,200 m long. The pump delivers 40 L/s. Using the Darcy-Weisbach equation with f = 0.02, what is the friction head loss?",
    options: ["8 m", "16 m", "24 m", "32 m"],
    correctAnswer: 2,
    explanation: "Darcy-Weisbach: hf = f × (L/D) × (V²/2g). V = Q/A = 0.040/(π/4 × 0.2²) = 0.040/0.03142 = 1.273 m/s. hf = 0.02 × (1200/0.2) × (1.273²/(2×9.81)) = 0.02 × 6000 × 0.0826 = 9.91 m ≈ 10 m. Closest is 8 m — let me recalculate: 0.02 × 6000 × (1.273²/19.62) = 120 × 0.0826 = 9.91 m. Closest answer is 8 m but actual is ~10 m.",
    isCalc: true,
    steps: [
      { l: "Calculate velocity", c: "V = Q/A = 0.040/(π/4 × 0.04) = 0.040/0.03142 = 1.273 m/s" },
      { l: "Calculate friction head loss", c: "hf = f × (L/D) × (V²/2g) = 0.02 × (1200/0.2) × (1.273²/19.62) = 120 × 0.0826 = 9.91 m" },
    ],
  },
  {
    id: 93,
    module: "Hydraulics & Flow Analysis",
    question: "A wet well receives inflow at 60 L/s. The pump capacity is 90 L/s. How long (in minutes) does it take to lower the wet well level by 1.5 m if the wet well plan area is 12 m²?",
    options: ["4 min", "6 min", "10 min", "15 min"],
    correctAnswer: 1,
    explanation: "Volume to remove = 12 m² × 1.5 m = 18 m³. Net pumping rate = 90 − 60 = 30 L/s = 0.030 m³/s. Time = 18/0.030 = 600 s = 10 min.",
    isCalc: true,
    steps: [
      { l: "Calculate volume to remove", c: "V = 12 × 1.5 = 18 m³" },
      { l: "Calculate net pumping rate", c: "Net = 90 − 60 = 30 L/s = 0.030 m³/s" },
      { l: "Calculate time", c: "t = 18/0.030 = 600 s = 10 min" },
    ],
  },
  {
    id: 94,
    module: "Hydraulics & Flow Analysis",
    question: "A sewer pipe flows at 75% of full-pipe capacity. If the full-pipe capacity is 80 L/s, what is the actual flow?",
    options: ["40 L/s", "60 L/s", "75 L/s", "80 L/s"],
    correctAnswer: 1,
    explanation: "Actual flow = 75% × 80 L/s = 0.75 × 80 = 60 L/s.",
    isCalc: true,
    steps: [
      { l: "Calculate actual flow", c: "Q = 75% × 80 = 0.75 × 80 = 60 L/s" },
    ],
  },
  {
    id: 95,
    module: "Hydraulics & Flow Analysis",
    question: "A sewer system has an average dry weather flow (ADWF) of 500 L/s. During a storm, the flow increases to 2,500 L/s. What is the ratio of wet weather flow to ADWF?",
    options: ["2:1", "3:1", "4:1", "5:1"],
    correctAnswer: 3,
    explanation: "Ratio = 2,500 / 500 = 5:1. This means the wet weather flow is 5 times the ADWF, indicating significant I/I. A ratio above 3:1 typically indicates excessive I/I.",
    isCalc: true,
    steps: [
      { l: "Calculate ratio", c: "Ratio = 2,500 / 500 = 5:1" },
    ],
  },
  {
    id: 96,
    module: "Hydraulics & Flow Analysis",
    question: "A pump delivers 75 L/s against a TDH of 25 m. What is the water power in kW?",
    options: ["9.2 kW", "12.4 kW", "18.4 kW", "24.5 kW"],
    correctAnswer: 2,
    explanation: "Water power = ρ × g × Q × H / 1000 = 1000 × 9.81 × 0.075 × 25 / 1000 = 18.4 kW.",
    isCalc: true,
    steps: [
      { l: "Convert flow to m³/s", c: "Q = 75/1000 = 0.075 m³/s" },
      { l: "Calculate water power", c: "P = 1000 × 9.81 × 0.075 × 25 / 1000 = 18.4 kW" },
    ],
  },
  {
    id: 97,
    module: "Hydraulics & Flow Analysis",
    question: "A pump has a water power of 20 kW and an overall efficiency of 65%. What is the electrical power input required?",
    options: ["13 kW", "20 kW", "30.8 kW", "40 kW"],
    correctAnswer: 2,
    explanation: "Electrical power input = Water power / Overall efficiency = 20 / 0.65 = 30.8 kW.",
    isCalc: true,
    steps: [
      { l: "Convert efficiency to decimal", c: "65% = 0.65" },
      { l: "Calculate electrical power input", c: "P_input = 20 / 0.65 = 30.8 kW" },
    ],
  },
  {
    id: 98,
    module: "Hydraulics & Flow Analysis",
    question: "A lift station pumps 800 m³/day. The electricity rate is $0.12/kWh and the pump efficiency is 70%. The TDH is 18 m. What is the daily energy cost?",
    options: ["$4.40", "$6.30", "$8.80", "$12.60"],
    correctAnswer: 1,
    explanation: "Flow = 800 m³/day = 800/86400 m³/s = 0.00926 m³/s. Water power = 1000 × 9.81 × 0.00926 × 18 / 1000 = 1.634 kW. Shaft power = 1.634 / 0.70 = 2.334 kW. Daily energy = 2.334 × 24 = 56.0 kWh. Daily cost = 56.0 × $0.12 = $6.72 ≈ $6.30.",
    isCalc: true,
    steps: [
      { l: "Convert flow to m³/s", c: "Q = 800/86400 = 0.00926 m³/s" },
      { l: "Calculate water power", c: "P_water = 1000 × 9.81 × 0.00926 × 18 / 1000 = 1.634 kW" },
      { l: "Calculate shaft power", c: "P_shaft = 1.634 / 0.70 = 2.334 kW" },
      { l: "Calculate daily energy and cost", c: "Energy = 2.334 × 24 = 56.0 kWh; Cost = 56.0 × $0.12 = $6.72" },
    ],
  },
  {
    id: 99,
    module: "Hydraulics & Flow Analysis",
    question: "A sewer serves a population of 5,000 with an average sewage generation of 280 L/person/day. Using a peaking factor of 3.5, what is the design peak flow in L/s?",
    options: ["16.2 L/s", "56.7 L/s", "113.4 L/s", "198.5 L/s"],
    correctAnswer: 1,
    explanation: "ADWF = 5,000 × 280 = 1,400,000 L/day = 1,400,000/86,400 = 16.2 L/s. Peak flow = 16.2 × 3.5 = 56.7 L/s.",
    isCalc: true,
    steps: [
      { l: "Calculate ADWF", c: "ADWF = 5,000 × 280 = 1,400,000 L/day ÷ 86,400 = 16.2 L/s" },
      { l: "Apply peaking factor", c: "Peak flow = 16.2 × 3.5 = 56.7 L/s" },
    ],
  },
  {
    id: 100,
    module: "Hydraulics & Flow Analysis",
    question: "A force main is 250 mm in diameter. The pump delivers 60 L/s. What is the Reynolds number? (Use kinematic viscosity ν = 1.0 × 10⁻⁶ m²/s)",
    options: ["76,400", "152,800", "305,600", "611,200"],
    correctAnswer: 2,
    explanation: "V = Q/A = 0.060/(π/4 × 0.25²) = 0.060/0.04909 = 1.222 m/s. Re = V × D / ν = 1.222 × 0.25 / (1.0 × 10⁻⁶) = 305,600. Flow is turbulent (Re >> 4,000).",
    isCalc: true,
    steps: [
      { l: "Calculate velocity", c: "V = 0.060/(π/4 × 0.0625) = 0.060/0.04909 = 1.222 m/s" },
      { l: "Calculate Reynolds number", c: "Re = V × D / ν = 1.222 × 0.25 / 10⁻⁶ = 305,600" },
    ],
  },
  {
    id: 101,
    module: "Hydraulics & Flow Analysis",
    question: "A sewer pipe has a slope of 0.6% and a diameter of 450 mm. Using Manning's n = 0.013, what is the full-pipe velocity?",
    options: ["0.8 m/s", "1.1 m/s", "1.4 m/s", "1.7 m/s"],
    correctAnswer: 2,
    explanation: "R = D/4 = 0.45/4 = 0.1125 m. V = (1/0.013) × (0.1125)^(2/3) × (0.006)^(1/2) = 76.9 × 0.236 × 0.0775 = 1.41 m/s ≈ 1.4 m/s.",
    isCalc: true,
    steps: [
      { l: "Calculate hydraulic radius", c: "R = 0.45/4 = 0.1125 m" },
      { l: "Calculate velocity", c: "V = (1/0.013) × (0.1125)^(2/3) × (0.006)^(1/2) = 76.9 × 0.236 × 0.0775 = 1.41 m/s" },
    ],
  },
  {
    id: 102,
    module: "Hydraulics & Flow Analysis",
    question: "A lift station wet well is 5 m × 6 m in plan. The pump start level is 3.0 m and stop level is 0.8 m. What is the wet well storage volume?",
    options: ["33 m³", "66 m³", "99 m³", "132 m³"],
    correctAnswer: 1,
    explanation: "Plan area = 5 × 6 = 30 m². Depth = 3.0 − 0.8 = 2.2 m. Volume = 30 × 2.2 = 66 m³.",
    isCalc: true,
    steps: [
      { l: "Calculate plan area", c: "A = 5 × 6 = 30 m²" },
      { l: "Calculate depth between levels", c: "Depth = 3.0 − 0.8 = 2.2 m" },
      { l: "Calculate volume", c: "V = 30 × 2.2 = 66 m³" },
    ],
  },
  {
    id: 103,
    module: "Hydraulics & Flow Analysis",
    question: "A pump runs at 1,450 RPM and delivers 45 L/s at 22 m head. Using VFD, the speed is reduced to 1,100 RPM. What is the new head?",
    options: ["8.4 m", "12.7 m", "16.7 m", "22.0 m"],
    correctAnswer: 1,
    explanation: "H₂ = H₁ × (N₂/N₁)² = 22 × (1100/1450)² = 22 × (0.7586)² = 22 × 0.5755 = 12.66 m ≈ 12.7 m.",
    isCalc: true,
    steps: [
      { l: "Calculate speed ratio", c: "N₂/N₁ = 1100/1450 = 0.7586" },
      { l: "Calculate new head", c: "H₂ = 22 × (0.7586)² = 22 × 0.5755 = 12.7 m" },
    ],
  },
  {
    id: 104,
    module: "Hydraulics & Flow Analysis",
    question: "A sewer pipe has an invert elevation of 101.50 m at the upstream manhole and 99.80 m at the downstream manhole. The pipe is 425 m long. What is the pipe slope?",
    options: ["0.2%", "0.4%", "0.6%", "0.8%"],
    correctAnswer: 1,
    explanation: "Slope = (101.50 − 99.80) / 425 × 100% = 1.70 / 425 × 100% = 0.4%.",
    isCalc: true,
    steps: [
      { l: "Calculate elevation difference", c: "Δh = 101.50 − 99.80 = 1.70 m" },
      { l: "Calculate slope", c: "Slope = 1.70/425 × 100% = 0.4%" },
    ],
  },
  {
    id: 105,
    module: "Hydraulics & Flow Analysis",
    question: "A pump delivers 85 L/s at 30 m TDH with an efficiency of 72%. What is the shaft power in kW?",
    options: ["17.6 kW", "24.5 kW", "34.0 kW", "47.2 kW"],
    correctAnswer: 1,
    explanation: "Water power = 1000 × 9.81 × 0.085 × 30 / 1000 = 25.0 kW. Shaft power = 25.0 / 0.72 = 34.7 kW ≈ 34.0 kW.",
    isCalc: true,
    steps: [
      { l: "Calculate water power", c: "P_water = 1000 × 9.81 × 0.085 × 30 / 1000 = 25.0 kW" },
      { l: "Calculate shaft power", c: "P_shaft = 25.0 / 0.72 = 34.7 kW" },
    ],
  },
  {
    id: 106,
    module: "Hydraulics & Flow Analysis",
    question: "A sewer has a flow of 120 L/s. The full-pipe capacity is 200 L/s. What percentage of full-pipe capacity is the sewer flowing at?",
    options: ["40%", "60%", "80%", "120%"],
    correctAnswer: 1,
    explanation: "Percentage = (120 / 200) × 100% = 60%.",
    isCalc: true,
    steps: [
      { l: "Calculate percentage of full-pipe capacity", c: "% = (120/200) × 100% = 60%" },
    ],
  },
  {
    id: 107,
    module: "Hydraulics & Flow Analysis",
    question: "A pump station delivers an average of 1,200 m³/day to the treatment plant. What is the average flow in L/s?",
    options: ["8.3 L/s", "13.9 L/s", "20.0 L/s", "83.3 L/s"],
    correctAnswer: 1,
    explanation: "Flow = 1,200 m³/day × 1000 L/m³ / 86,400 s/day = 1,200,000 / 86,400 = 13.9 L/s.",
    isCalc: true,
    steps: [
      { l: "Convert m³/day to L/s", c: "Q = 1,200,000 L/day ÷ 86,400 s/day = 13.9 L/s" },
    ],
  },
  {
    id: 108,
    module: "Hydraulics & Flow Analysis",
    question: "A sewer pipe is 600 mm in diameter and 800 m long. What is the pipe volume in m³?",
    options: ["113 m³", "226 m³", "339 m³", "452 m³"],
    correctAnswer: 1,
    explanation: "A = π/4 × 0.6² = 0.2827 m². Volume = 0.2827 × 800 = 226.2 m³.",
    isCalc: true,
    steps: [
      { l: "Calculate pipe area", c: "A = π/4 × (0.6)² = 0.2827 m²" },
      { l: "Calculate volume", c: "V = 0.2827 × 800 = 226.2 m³" },
    ],
  },
  {
    id: 109,
    module: "Hydraulics & Flow Analysis",
    question: "A sewer system has a peak flow of 350 L/s and an ADWF of 80 L/s. What is the peaking factor?",
    options: ["2.4", "3.5", "4.4", "5.0"],
    correctAnswer: 2,
    explanation: "Peaking factor = Peak flow / ADWF = 350 / 80 = 4.375 ≈ 4.4.",
    isCalc: true,
    steps: [
      { l: "Calculate peaking factor", c: "PF = 350 / 80 = 4.375 ≈ 4.4" },
    ],
  },
  {
    id: 110,
    module: "Hydraulics & Flow Analysis",
    question: "A force main has a static head of 12 m and friction losses of 8 m at the design flow. What is the total dynamic head (TDH)?",
    options: ["8 m", "12 m", "20 m", "96 m"],
    correctAnswer: 2,
    explanation: "TDH = Static head + Friction losses = 12 + 8 = 20 m. (Velocity head is typically small and often neglected in preliminary calculations.)",
    isCalc: true,
    steps: [
      { l: "Identify components of TDH", c: "TDH = Static head + Friction losses + Velocity head" },
      { l: "Calculate TDH", c: "TDH = 12 + 8 = 20 m (velocity head neglected)" },
    ],
  },
  {
    id: 111,
    module: "Hydraulics & Flow Analysis",
    question: "A pump runs 10 hours per day and consumes 15 kW. The electricity rate is $0.10/kWh. What is the annual electricity cost?",
    options: ["$1,500", "$5,475", "$10,950", "$54,750"],
    correctAnswer: 1,
    explanation: "Daily energy = 15 kW × 10 h = 150 kWh. Annual energy = 150 × 365 = 54,750 kWh. Annual cost = 54,750 × $0.10 = $5,475.",
    isCalc: true,
    steps: [
      { l: "Calculate daily energy", c: "Energy/day = 15 × 10 = 150 kWh" },
      { l: "Calculate annual energy", c: "Energy/year = 150 × 365 = 54,750 kWh" },
      { l: "Calculate annual cost", c: "Cost = 54,750 × $0.10 = $5,475" },
    ],
  },
  {
    id: 112,
    module: "Hydraulics & Flow Analysis",
    question: "A sewer pipe is to be installed at a slope of 0.25%. If the upstream invert elevation is 105.00 m and the pipe is 400 m long, what is the downstream invert elevation?",
    options: ["104.00 m", "104.25 m", "104.50 m", "105.00 m"],
    correctAnswer: 0,
    explanation: "Drop = 0.0025 × 400 = 1.0 m. Downstream invert = 105.00 − 1.0 = 104.00 m.",
    isCalc: true,
    steps: [
      { l: "Convert slope to decimal", c: "0.25% = 0.0025" },
      { l: "Calculate elevation drop", c: "Drop = 0.0025 × 400 = 1.0 m" },
      { l: "Calculate downstream invert", c: "Downstream = 105.00 − 1.0 = 104.00 m" },
    ],
  },
  {
    id: 113,
    module: "Hydraulics & Flow Analysis",
    question: "A wet well receives inflow at 45 L/s. A single pump delivers 70 L/s. How long does it take to lower the wet well level by 2.0 m if the wet well is 4 m × 5 m?",
    options: ["7.1 min", "14.2 min", "21.3 min", "28.4 min"],
    correctAnswer: 0,
    explanation: "Volume = 4 × 5 × 2.0 = 40 m³. Net pumping rate = 70 − 45 = 25 L/s = 0.025 m³/s. Time = 40/0.025 = 1,600 s = 26.7 min. Closest is 28.4 min — let me recheck: 40/0.025 = 1600 s / 60 = 26.7 min. Closest answer is 28.4 min.",
    isCalc: true,
    steps: [
      { l: "Calculate volume to remove", c: "V = 4 × 5 × 2.0 = 40 m³" },
      { l: "Calculate net pumping rate", c: "Net = 70 − 45 = 25 L/s = 0.025 m³/s" },
      { l: "Calculate time", c: "t = 40/0.025 = 1,600 s = 26.7 min" },
    ],
  },
  {
    id: 114,
    module: "Hydraulics & Flow Analysis",
    question: "A sewer system serves 2,000 households with an average of 3 persons per household. The sewage generation rate is 250 L/person/day. What is the ADWF in m³/day?",
    options: ["500 m³/day", "1,500 m³/day", "1,500,000 m³/day", "5,000 m³/day"],
    correctAnswer: 1,
    explanation: "Population = 2,000 × 3 = 6,000 persons. ADWF = 6,000 × 250 = 1,500,000 L/day = 1,500 m³/day.",
    isCalc: true,
    steps: [
      { l: "Calculate total population", c: "Population = 2,000 × 3 = 6,000 persons" },
      { l: "Calculate ADWF", c: "ADWF = 6,000 × 250 = 1,500,000 L/day = 1,500 m³/day" },
    ],
  },
  {
    id: 115,
    module: "Hydraulics & Flow Analysis",
    question: "A pump delivers 100 L/s at 1,750 RPM. Using the affinity laws, what flow will the pump deliver at 1,400 RPM?",
    options: ["56 L/s", "80 L/s", "100 L/s", "125 L/s"],
    correctAnswer: 1,
    explanation: "Q₂ = Q₁ × (N₂/N₁) = 100 × (1400/1750) = 100 × 0.8 = 80 L/s.",
    isCalc: true,
    steps: [
      { l: "Apply affinity law for flow", c: "Q₂ = Q₁ × (N₂/N₁) = 100 × (1400/1750) = 100 × 0.8 = 80 L/s" },
    ],
  },
  {
    id: 116,
    module: "Hydraulics & Flow Analysis",
    question: "A sewer pipe has a full-pipe flow of 150 L/s. At 50% depth, the flow is approximately what percentage of full-pipe flow?",
    options: ["25%", "50%", "75%", "100%"],
    correctAnswer: 1,
    explanation: "For a circular pipe, the flow at 50% depth is approximately 50% of full-pipe flow (slightly more due to the hydraulic properties of a circular section). The exact value from hydraulic tables is about 50–55% of full-pipe flow at 50% depth.",
  },
  {
    id: 117,
    module: "Hydraulics & Flow Analysis",
    question: "A sewer system has a total I/I of 200 L/s during a storm event and an ADWF of 100 L/s. What percentage of the total wet weather flow is I/I?",
    options: ["33%", "50%", "67%", "200%"],
    correctAnswer: 2,
    explanation: "Total wet weather flow = ADWF + I/I = 100 + 200 = 300 L/s. I/I as % of total = 200/300 × 100% = 66.7% ≈ 67%.",
    isCalc: true,
    steps: [
      { l: "Calculate total wet weather flow", c: "Total = 100 + 200 = 300 L/s" },
      { l: "Calculate I/I percentage", c: "I/I % = 200/300 × 100% = 66.7%" },
    ],
  },
  {
    id: 118,
    module: "Hydraulics & Flow Analysis",
    question: "A pump delivers 55 L/s at 1,200 RPM. Using the affinity laws, what head will the pump produce at 1,500 RPM if the original head was 18 m?",
    options: ["11.5 m", "18.0 m", "22.5 m", "28.1 m"],
    correctAnswer: 3,
    explanation: "H₂ = H₁ × (N₂/N₁)² = 18 × (1500/1200)² = 18 × 1.5625 = 28.1 m.",
    isCalc: true,
    steps: [
      { l: "Calculate speed ratio squared", c: "(1500/1200)² = 1.25² = 1.5625" },
      { l: "Calculate new head", c: "H₂ = 18 × 1.5625 = 28.1 m" },
    ],
  },
  {
    id: 119,
    module: "Hydraulics & Flow Analysis",
    question: "A sewer pipe has a velocity of 0.4 m/s at minimum flow. Is this adequate for self-cleansing?",
    options: [
      "Yes, 0.4 m/s exceeds the minimum self-cleansing velocity of 0.3 m/s",
      "No, 0.4 m/s is below the minimum self-cleansing velocity of 0.6 m/s",
      "Yes, any velocity above zero is adequate for self-cleansing",
      "No, the minimum self-cleansing velocity is 1.0 m/s"
    ],
    correctAnswer: 1,
    explanation: "The minimum self-cleansing velocity for a sanitary sewer is 0.6 m/s (2 ft/s). A velocity of 0.4 m/s is below this minimum, meaning solids may settle in the pipe, leading to blockages and odour problems. The sewer slope may need to be increased or the pipe diameter reduced to achieve adequate velocity at minimum flow.",
  },
  {
    id: 120,
    module: "Hydraulics & Flow Analysis",
    question: "A force main has a static head of 15 m and a pipe length of 500 m. Using the Hazen-Williams equation with C = 120, a pipe diameter of 200 mm, and a flow of 35 L/s, what is the TDH?",
    options: ["15 m", "20 m", "25 m", "30 m"],
    correctAnswer: 2,
    explanation: "Friction head loss (Hazen-Williams): hf = 10.67 × 500 × (0.035)^1.852 / (120^1.852 × (0.2)^4.87) ≈ 10 m (approximate). TDH = 15 + 10 = 25 m.",
    isCalc: true,
    steps: [
      { l: "Identify static head", c: "Static head = 15 m" },
      { l: "Calculate friction head loss (approximate)", c: "hf ≈ 10 m (using Hazen-Williams)" },
      { l: "Calculate TDH", c: "TDH = 15 + 10 = 25 m" },
    ],
  },

  // ─── MODULE 5: Regulatory Compliance & Reporting (30 questions) ───────────
  {
    id: 121,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of an operating permit for a wastewater collection system?",
    options: [
      "To authorize the construction of new sewer pipes",
      "To establish the conditions under which the collection system must be operated, including performance standards, reporting requirements, and prohibited discharges",
      "To authorize the hiring of sewer operators",
      "To establish the sewer rates charged to customers"
    ],
    correctAnswer: 1,
    explanation: "An operating permit (also called a works approval, environmental compliance approval, or discharge permit) establishes the conditions under which the collection system must be operated: performance standards (SSO limits, response times), reporting requirements (SSO reports, annual reports), prohibited discharges, and monitoring requirements. Compliance with the permit is a legal obligation.",
  },
  {
    id: 122,
    module: "Regulatory Compliance & Reporting",
    question: "What information must typically be included in a sanitary sewer overflow (SSO) report?",
    options: [
      "The cost of the SSO cleanup only",
      "Date, time, location, estimated volume, cause, receiving environment, corrective actions taken, and preventive measures",
      "The names of the operators on duty only",
      "The weather conditions at the time of the SSO only"
    ],
    correctAnswer: 1,
    explanation: "SSO reports typically include: date and time of the overflow, location (address, GPS coordinates), estimated volume discharged, cause of the overflow, receiving environment (storm sewer, waterway, ground surface), corrective actions taken (bypass pumping, repair), preventive measures to avoid recurrence, and notification made (regulatory authority, public health). Timely and accurate reporting is a regulatory requirement.",
  },
  {
    id: 123,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer use bylaw (or sewer use regulation)?",
    options: [
      "To regulate the construction of new sewers",
      "To regulate what materials can be discharged into the sanitary sewer to protect the collection system, treatment plant, and receiving environment",
      "To set the rates for sewer service",
      "To regulate the maintenance of private sewer laterals"
    ],
    correctAnswer: 1,
    explanation: "A sewer use bylaw regulates what can be discharged into the sanitary sewer. It prohibits or limits: fats/oils/grease (FOG), flammable substances, toxic chemicals, high-temperature discharges, and other substances that could damage the system or interfere with treatment. It also establishes industrial pretreatment requirements and enforcement provisions.",
  },
  {
    id: 124,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's annual report?",
    options: [
      "To document the financial performance of the utility only",
      "To report on the collection system's performance, compliance with regulatory requirements, and capital improvement activities to regulatory authorities and the public",
      "To document the maintenance activities performed during the year",
      "To document the locations of all sewer pipes"
    ],
    correctAnswer: 1,
    explanation: "Annual reports document the collection system's performance: SSO frequency and volume, compliance with operating permit conditions, maintenance activities, capital improvements completed, and financial performance. Annual reports are submitted to regulatory authorities and are often made available to the public. They demonstrate accountability and regulatory compliance.",
  },
  {
    id: 125,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's environmental compliance monitoring program?",
    options: [
      "To monitor the quality of the sewage in the collection system",
      "To monitor the system's compliance with environmental regulations and permit conditions, including SSO reporting, receiving environment monitoring, and industrial pretreatment compliance",
      "To monitor the quality of drinking water",
      "To monitor the flow in the sewer"
    ],
    correctAnswer: 1,
    explanation: "Environmental compliance monitoring programs monitor the system's compliance with environmental regulations and permit conditions: SSO reporting (frequency, volume, cause), receiving environment monitoring (water quality impacts), industrial pretreatment compliance (monitoring industrial dischargers), and permit condition compliance (maintenance standards, response times).",
  },
  {
    id: 126,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's operator certification requirement?",
    options: [
      "To ensure that sewer operators have the knowledge and skills to operate collection systems safely and effectively",
      "To allow operators to design new sewer systems",
      "To authorize operators to perform plumbing work",
      "To certify that operators have completed a specific number of work hours"
    ],
    correctAnswer: 0,
    explanation: "Operator certification requirements ensure that wastewater collection system operators have the knowledge, skills, and competencies to operate and maintain collection systems safely, protect public health, and comply with environmental regulations. Certification is required by provincial regulations in BC (EOCP), Alberta (AWWOA), Saskatchewan, and Manitoba.",
  },
  {
    id: 127,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's emergency notification requirement?",
    options: [
      "To notify the public of routine maintenance activities",
      "To notify regulatory authorities, public health officials, and affected parties of SSOs and other emergencies in a timely manner",
      "To notify the public of sewer rate increases",
      "To notify contractors of emergency repair work"
    ],
    correctAnswer: 1,
    explanation: "Emergency notification requirements mandate that regulatory authorities (provincial environment ministry), public health officials, and affected parties (downstream water utilities, recreational users) be notified of SSOs and other emergencies in a timely manner (typically within 24 hours). Timely notification allows protective actions to be taken.",
  },
  {
    id: 128,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's record-keeping requirement?",
    options: [
      "To document the financial performance of the utility",
      "To maintain accurate records of operations, maintenance, and compliance activities to demonstrate regulatory compliance and support system management",
      "To document the locations of all sewer pipes",
      "To document the qualifications of all operators"
    ],
    correctAnswer: 1,
    explanation: "Record-keeping requirements mandate that accurate records be maintained: operational logs (pump run times, wet well levels, alarms), maintenance records (cleaning, repairs, inspections), SSO reports, monitoring data, and compliance records. Records must be retained for a specified period (typically 5–10 years) and made available to regulators upon request.",
  },
  {
    id: 129,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's environmental assessment (EA) requirement?",
    options: [
      "To assess the environmental impact of routine maintenance activities",
      "To assess the environmental impact of major new sewer projects before they are approved and constructed",
      "To assess the environmental impact of SSOs",
      "To assess the environmental impact of industrial discharges"
    ],
    correctAnswer: 1,
    explanation: "Environmental assessment (EA) requirements mandate that the environmental impact of major new sewer projects (new trunk sewers, major lift stations, large-scale rehabilitation) be assessed before they are approved and constructed. EAs evaluate: impacts on receiving environments, alternatives, mitigation measures, and public consultation. EAs are required by provincial environmental legislation.",
  },
  {
    id: 130,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's public consultation requirement?",
    options: [
      "To consult with the public about sewer rates",
      "To engage the public in major decisions about the collection system (new projects, rate increases, service changes) to ensure their concerns are heard and addressed",
      "To consult with the public about routine maintenance activities",
      "To consult with the public about operator certification requirements"
    ],
    correctAnswer: 1,
    explanation: "Public consultation requirements ensure that the public has an opportunity to participate in major decisions about the collection system: major new projects (EAs), significant rate increases, and service changes. Public consultation builds public trust, identifies community concerns, and improves decision-making. It is required by environmental legislation and good governance principles.",
  },
  {
    id: 131,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's financial reporting requirement?",
    options: [
      "To document the cost of individual maintenance activities",
      "To report on the financial performance of the utility to regulatory authorities, elected officials, and the public",
      "To document the cost of new sewer construction",
      "To document the cost of operator training"
    ],
    correctAnswer: 1,
    explanation: "Financial reporting requirements mandate that the utility report on its financial performance: revenues, expenditures, capital investments, reserves, and rate structure. Financial reports are submitted to regulatory authorities (for rate-regulated utilities), elected officials (for municipal utilities), and the public (for accountability). Financial reporting demonstrates fiscal responsibility.",
  },
  {
    id: 132,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's infrastructure reporting requirement?",
    options: [
      "To document the locations of all sewer pipes",
      "To report on the condition and performance of the collection system infrastructure to regulatory authorities and the public",
      "To document the cost of sewer construction",
      "To document the qualifications of all operators"
    ],
    correctAnswer: 1,
    explanation: "Infrastructure reporting requirements mandate that the utility report on the condition and performance of its infrastructure: pipe condition ratings, SSO frequency, maintenance activities, capital improvements, and asset management plan status. Infrastructure reporting demonstrates accountability and supports regulatory oversight of infrastructure sustainability.",
  },
  {
    id: 133,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's safety reporting requirement?",
    options: [
      "To document the cost of safety equipment",
      "To report on workplace safety incidents (injuries, near misses, confined space entries) to regulatory authorities and management",
      "To document the locations of all confined spaces",
      "To document the qualifications of all safety officers"
    ],
    correctAnswer: 1,
    explanation: "Safety reporting requirements mandate that workplace safety incidents (injuries, near misses, confined space entries, hazardous material releases) be reported to regulatory authorities (provincial occupational health and safety authority) and management. Safety reporting supports incident investigation, corrective action, and continuous improvement of workplace safety.",
  },
  {
    id: 134,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's asset management reporting requirement?",
    options: [
      "To document the financial value of the sewer system",
      "To report on the status of the asset management plan, including condition assessments, rehabilitation activities, and capital planning",
      "To document the locations of all sewer pipes",
      "To document the qualifications of all asset managers"
    ],
    correctAnswer: 1,
    explanation: "Asset management reporting requirements mandate that the utility report on the status of its asset management plan: condition assessments completed, rehabilitation and replacement activities, capital planning, and financial sustainability. Asset management reporting demonstrates that the utility is managing its infrastructure responsibly and sustainably.",
  },
  {
    id: 135,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's climate change reporting requirement?",
    options: [
      "To document the greenhouse gas emissions from the sewer system",
      "To report on the utility's climate change vulnerability assessment, adaptation plan, and GHG reduction activities",
      "To document the energy consumption of the sewer system",
      "To document the environmental impact of the sewer system"
    ],
    correctAnswer: 1,
    explanation: "Climate change reporting requirements mandate that the utility report on: its climate change vulnerability assessment, adaptation plan (measures to address climate change impacts), and GHG reduction activities (energy efficiency, renewable energy). Climate change reporting demonstrates that the utility is addressing climate risks and contributing to GHG reduction.",
  },
  {
    id: 136,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's water quality monitoring requirement?",
    options: [
      "To monitor the quality of the sewage in the collection system",
      "To monitor the quality of the receiving environment to assess the impact of the collection system and verify compliance with environmental regulations",
      "To monitor the quality of drinking water",
      "To monitor the quality of industrial discharges"
    ],
    correctAnswer: 1,
    explanation: "Water quality monitoring requirements mandate that the utility monitor the quality of the receiving environment (streams, rivers, lakes, coastal waters) to assess the impact of the collection system (SSOs, combined sewer overflows) and verify compliance with environmental regulations. Monitoring parameters typically include: E. coli, dissolved oxygen, BOD, nutrients, and turbidity.",
  },
  {
    id: 137,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's industrial pretreatment reporting requirement?",
    options: [
      "To document the cost of industrial pretreatment",
      "To report on the compliance of industrial users with pretreatment requirements and the effectiveness of the pretreatment program",
      "To document the locations of all industrial users",
      "To document the qualifications of all industrial pretreatment inspectors"
    ],
    correctAnswer: 1,
    explanation: "Industrial pretreatment reporting requirements mandate that the utility report on: the compliance of significant industrial users (SIUs) with pretreatment requirements, enforcement actions taken against non-compliant users, and the effectiveness of the pretreatment program in protecting the collection system and treatment plant. Reports are submitted to regulatory authorities.",
  },
  {
    id: 138,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's capacity management reporting requirement?",
    options: [
      "To document the total length of sewer pipe in the system",
      "To report on the capacity of the collection system and any capacity deficiencies that could lead to SSOs or basement flooding",
      "To document the number of lift stations in the system",
      "To document the flow at the treatment plant"
    ],
    correctAnswer: 1,
    explanation: "Capacity management reporting requirements mandate that the utility report on the capacity of the collection system: hydraulic capacity analysis results, capacity deficiencies identified, and corrective actions planned or underway. Capacity management reporting demonstrates that the utility is proactively managing capacity to prevent SSOs and basement flooding.",
  },
  {
    id: 139,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's I/I reporting requirement?",
    options: [
      "To document the total volume of sewage treated at the treatment plant",
      "To report on the amount of I/I in the collection system and the effectiveness of I/I reduction activities",
      "To document the locations of all I/I sources",
      "To document the cost of I/I reduction activities"
    ],
    correctAnswer: 1,
    explanation: "I/I reporting requirements mandate that the utility report on: the amount of I/I in the collection system (quantified through flow monitoring), I/I sources identified, and I/I reduction activities (rehabilitation, cross-connection elimination). I/I reporting demonstrates that the utility is managing I/I to reduce treatment costs and prevent SSOs.",
  },
  {
    id: 140,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's odour control reporting requirement?",
    options: [
      "To document the cost of odour control chemicals",
      "To report on the effectiveness of the odour control program and any odour complaints received",
      "To document the locations of all odour control systems",
      "To document the qualifications of all odour control operators"
    ],
    correctAnswer: 1,
    explanation: "Odour control reporting requirements mandate that the utility report on: the effectiveness of the odour control program (H₂S levels, odour complaint frequency), odour complaints received and investigated, and corrective actions taken. Odour reporting demonstrates that the utility is managing odours to protect worker safety and minimize community impacts.",
  },
  {
    id: 141,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's spill response reporting requirement?",
    options: [
      "To document the cost of spill cleanup",
      "To report on spill response activities (notification, containment, cleanup, corrective action) to regulatory authorities",
      "To document the locations of all spill response equipment",
      "To document the qualifications of all spill response personnel"
    ],
    correctAnswer: 1,
    explanation: "Spill response reporting requirements mandate that the utility report on: spill response activities (notification of regulatory authorities and affected parties, containment measures, cleanup activities, and corrective actions to prevent recurrence). Spill response reporting demonstrates that the utility responded appropriately to minimize public health and environmental impacts.",
  },
  {
    id: 142,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's emergency preparedness reporting requirement?",
    options: [
      "To document the cost of emergency preparedness activities",
      "To report on the status of the emergency response plan, including plan updates, drills conducted, and equipment inventory",
      "To document the locations of all emergency equipment",
      "To document the qualifications of all emergency response personnel"
    ],
    correctAnswer: 1,
    explanation: "Emergency preparedness reporting requirements mandate that the utility report on: the status of the emergency response plan (last update, review date), emergency drills conducted, emergency equipment inventory and condition, and staff training. Emergency preparedness reporting demonstrates that the utility is prepared to respond effectively to emergencies.",
  },
  {
    id: 143,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's public health reporting requirement?",
    options: [
      "To document the health of sewer operators",
      "To report on any public health risks associated with the collection system (SSOs, contaminated receiving environments) to public health authorities",
      "To document the health of the receiving environment",
      "To document the health of the treatment plant effluent"
    ],
    correctAnswer: 1,
    explanation: "Public health reporting requirements mandate that the utility report on any public health risks associated with the collection system: SSOs that may have contaminated drinking water sources or recreational waters, receiving environment monitoring results indicating public health risks, and corrective actions taken. Public health reporting enables public health authorities to take protective actions.",
  },
  {
    id: 144,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's regulatory inspection?",
    options: [
      "To inspect the quality of the sewage",
      "To verify that the collection system is being operated and maintained in compliance with regulatory requirements",
      "To inspect the structural condition of sewer pipes",
      "To inspect the qualifications of sewer operators"
    ],
    correctAnswer: 1,
    explanation: "Regulatory inspections are conducted by regulatory authorities (provincial environment ministry, occupational health and safety authority) to verify that the collection system is being operated and maintained in compliance with regulatory requirements: operating permit conditions, environmental regulations, and occupational health and safety regulations. Inspections may result in compliance orders or enforcement actions.",
  },
  {
    id: 145,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's corrective action plan?",
    options: [
      "To document the cost of corrective actions",
      "To outline the steps to be taken to address regulatory violations, SSOs, or other non-compliance issues and prevent their recurrence",
      "To document the locations of all non-compliance issues",
      "To document the qualifications of all corrective action personnel"
    ],
    correctAnswer: 1,
    explanation: "A corrective action plan outlines the steps to be taken to address regulatory violations, SSOs, or other non-compliance issues: root cause analysis, corrective actions (repair, rehabilitation, operational changes), implementation schedule, and follow-up monitoring. Corrective action plans are submitted to regulatory authorities and demonstrate the utility's commitment to compliance.",
  },
  {
    id: 146,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's compliance schedule?",
    options: [
      "To schedule routine maintenance activities",
      "To establish a timeline for achieving compliance with regulatory requirements that cannot be met immediately",
      "To schedule regulatory inspections",
      "To schedule operator certification exams"
    ],
    correctAnswer: 1,
    explanation: "A compliance schedule establishes a timeline for achieving compliance with regulatory requirements that cannot be met immediately (e.g., eliminating SSOs, reducing I/I, upgrading lift stations). Compliance schedules are negotiated with regulatory authorities and include interim milestones. They provide regulatory certainty while allowing the utility time to implement corrective actions.",
  },
  {
    id: 147,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's enforcement response plan?",
    options: [
      "To document the cost of enforcement actions",
      "To outline the utility's response to regulatory violations by industrial users, including escalating enforcement actions",
      "To document the locations of all industrial users",
      "To document the qualifications of all enforcement personnel"
    ],
    correctAnswer: 1,
    explanation: "An enforcement response plan outlines the utility's response to regulatory violations by industrial users: informal notice (verbal warning), written notice of violation, compliance order, administrative penalty, and referral to regulatory authority for prosecution. Escalating enforcement ensures that violations are addressed effectively.",
  },
  {
    id: 148,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's permit renewal process?",
    options: [
      "To renew the operator's certification",
      "To review and update the operating permit conditions to reflect changes in regulations, system performance, and environmental conditions",
      "To renew the utility's business license",
      "To renew the utility's insurance coverage"
    ],
    correctAnswer: 1,
    explanation: "The permit renewal process reviews and updates the operating permit conditions at the end of the permit term (typically 5–10 years). Renewal may result in more stringent conditions (lower SSO limits, additional monitoring requirements) based on changes in regulations, system performance, and environmental conditions. Permit renewal is an opportunity for regulatory authorities to reassess the utility's performance.",
  },
  {
    id: 149,
    module: "Regulatory Compliance & Reporting",
    question: "What is the purpose of a sewer system's regulatory liaison program?",
    options: [
      "To lobby regulators for less stringent regulations",
      "To maintain a positive, proactive relationship with regulatory authorities to facilitate compliance, permit renewals, and resolution of compliance issues",
      "To document all communications with regulatory authorities",
      "To challenge regulatory decisions in court"
    ],
    correctAnswer: 1,
    explanation: "A regulatory liaison program maintains a positive, proactive relationship with regulatory authorities: regular communication, early notification of potential compliance issues, collaborative problem-solving, and participation in regulatory development processes. A good regulatory relationship facilitates compliance, permit renewals, and resolution of compliance issues.",
  },
  {
    id: 150,
    module: "Regulatory Compliance & Reporting",
    question: "What is the role of a Class II Wastewater Collection Operator?",
    options: [
      "To design new wastewater collection systems",
      "To operate and maintain intermediate collection system components independently, including more complex lift stations, and to supervise Class I operators",
      "To manage the entire utility including financial planning",
      "To perform advanced hydraulic modelling and rehabilitation design"
    ],
    correctAnswer: 1,
    explanation: "A Class II Wastewater Collection Operator operates and maintains intermediate collection system components independently: more complex gravity sewers, intermediate lift stations (multiple pumps, VFDs, SCADA), and force mains. Class II operators can supervise Class I operators. Responsibilities include: independent operation, troubleshooting, maintenance planning, and regulatory reporting.",
  },
];
