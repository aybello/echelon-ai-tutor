// Echelon — Water Distribution Process Data
// Interactive guide covering the full distribution system from pumping to service connection

export interface DistributionStep {
  id: string;
  num: number;
  label: string;
  icon: string;
  color: string;
  bg: string;
  shortDesc: string;
  fullDesc: string;
  equipment: string;
  regulation: string;
  keyPoints: string[];
  waterQuality: Record<string, string>;
}

export const DIST_STEPS: DistributionStep[] = [
  {
    id: "pumping",
    num: 1,
    label: "High-Lift Pumping",
    icon: "⚙️",
    color: "#0369A1",
    bg: "#E0F2FE",
    shortDesc: "Treated water pressurised for distribution",
    fullDesc: "High-lift pumps at the treatment plant boost treated water to the pressures needed to deliver it throughout the distribution system. Variable-speed drives (VSDs) allow output to match demand, reducing energy use. Pumps operate in parallel or series depending on system demand.",
    equipment: "Centrifugal Pumps, Variable-Speed Drives, Pressure Gauges",
    regulation: "O. Reg. 170/03 requires continuous pressure monitoring. Minimum 140 kPa at all service connections; typical operating range 275–550 kPa.",
    keyPoints: [
      "Centrifugal pumps most common — impeller converts rotation to pressure",
      "VSDs reduce energy consumption by 30–50% compared to throttle control",
      "Pumps operated in parallel increase flow; in series increase pressure",
      "Pump curves show the relationship between flow rate and head",
      "Cavitation occurs when suction pressure drops below vapour pressure — avoid by maintaining adequate NPSH",
    ],
    waterQuality: { "Free Cl₂": "0.5–2.0 mg/L", pH: "6.5–8.5", Turbidity: "<1 NTU", Pressure: "275–550 kPa" },
  },
  {
    id: "transmission",
    num: 2,
    label: "Transmission Mains",
    icon: "🔵",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    shortDesc: "Large pipes carry water from plant to zones",
    fullDesc: "Transmission mains are large-diameter pipes (typically 400mm–1200mm) that carry bulk water from the treatment plant to storage facilities and pressure zone boundaries. They are designed for low velocity to minimise head loss and are typically not tapped for individual services.",
    equipment: "Ductile Iron, PVC, HDPE, Steel Pipe; Isolation Valves",
    regulation: "Pipe materials must meet AWWA standards. Pressure ratings must exceed maximum system pressure including surge (water hammer) events.",
    keyPoints: [
      "Hazen-Williams formula used for head loss calculations: hf = 10.67 × L × Q^1.852 / (C^1.852 × D^4.87)",
      "C-factor reflects pipe roughness — new DI ≈ 140, old unlined CI ≈ 80",
      "Velocity typically kept below 1.5 m/s to limit head loss and water hammer",
      "Air relief valves placed at high points; blow-off valves at low points",
      "Cathodic protection prevents corrosion on metallic pipes in corrosive soils",
    ],
    waterQuality: { "Free Cl₂": "0.3–1.5 mg/L", pH: "6.5–8.5", Turbidity: "<1 NTU", Velocity: "<1.5 m/s" },
  },
  {
    id: "storage",
    num: 3,
    label: "Storage & Reservoirs",
    icon: "🏗️",
    color: "#7C3AED",
    bg: "#EDE9FE",
    shortDesc: "Balances supply, demand and emergencies",
    fullDesc: "Storage facilities (elevated tanks, standpipes, ground reservoirs) serve three critical functions: equalising diurnal demand fluctuations, providing emergency supply during pump failures, and maintaining system pressure. Elevated storage provides pressure by gravity — the water height above the service area creates static head.",
    equipment: "Elevated Tanks, Standpipes, Ground-Level Reservoirs, Clearwells",
    regulation: "Storage volume must provide fire flow reserve plus 24-hour emergency supply. Turnover time must be managed to prevent chlorine decay and stagnation — typically 3–5 day maximum.",
    keyPoints: [
      "Elevated storage provides pressure: 1 metre of height = 9.81 kPa",
      "Storage volume = peak day demand + fire flow + emergency reserve",
      "Turnover time must be managed — stagnant water loses chlorine residual",
      "Reservoirs require regular inspection, cleaning, and disinfection",
      "Altitude valves prevent overflow and control fill/drain cycles",
    ],
    waterQuality: { "Free Cl₂": "0.2–1.0 mg/L", pH: "6.5–8.5", Turbidity: "<1 NTU", Residence: "1–5 days" },
  },
  {
    id: "pressurezones",
    num: 4,
    label: "Pressure Zones",
    icon: "📊",
    color: "#059669",
    bg: "#D1FAE5",
    shortDesc: "System divided to control pressure",
    fullDesc: "Distribution systems are divided into pressure zones (also called pressure districts) to maintain acceptable pressures throughout areas with different elevations. Pressure-reducing valves (PRVs) step pressure down from high zones to lower zones. Booster stations increase pressure in high-elevation areas.",
    equipment: "Pressure-Reducing Valves (PRVs), Booster Pumping Stations, Zone Meters",
    regulation: "Maximum static pressure at any service connection must not exceed 700 kPa (to protect plumbing fixtures). Minimum dynamic pressure during peak demand must be ≥140 kPa.",
    keyPoints: [
      "PRVs reduce pressure from upstream zone — set point typically 350–500 kPa",
      "Booster stations serve high-elevation areas that cannot be served by gravity",
      "Zone boundaries defined by elevation contours and hydraulic grade line",
      "Pressure transients (water hammer) can exceed static pressure by 2–3×",
      "SCADA monitors pressure at key points in each zone continuously",
    ],
    waterQuality: { "Free Cl₂": "0.2–1.0 mg/L", pH: "6.5–8.5", Pressure: "140–700 kPa", Turbidity: "<1 NTU" },
  },
  {
    id: "distribution_mains",
    num: 5,
    label: "Distribution Mains",
    icon: "🔗",
    color: "#B45309",
    bg: "#FEF3C7",
    shortDesc: "Looped network delivers water to streets",
    fullDesc: "Distribution mains (typically 100mm–400mm) form the looped network that delivers water to individual streets and properties. Looped systems provide redundancy — if one main is shut down for repairs, water can reach customers via an alternate path. Dead-end mains require regular flushing to prevent stagnation.",
    equipment: "PVC, Ductile Iron, HDPE Pipe; Gate Valves, Hydrants, Curb Stops",
    regulation: "Minimum 100mm diameter for mains serving hydrants. Valve spacing must allow isolation of any section within 2 valve turns. Hydrant spacing per local fire code (typically 150m maximum).",
    keyPoints: [
      "Looped systems preferred over dead-ends for redundancy and water quality",
      "Minimum 100mm diameter for fire protection capability",
      "Valve spacing: no more than 2 valves to isolate any section",
      "Unidirectional flushing removes sediment and refreshes stagnant water",
      "Pipe materials: PVC (most common new), DI (high-pressure), HDPE (directional drilling)",
    ],
    waterQuality: { "Free Cl₂": "0.1–0.8 mg/L", pH: "6.5–8.5", Turbidity: "<1 NTU", Velocity: "0.3–1.5 m/s" },
  },
  {
    id: "crossconnection",
    num: 6,
    label: "Cross-Connection Control",
    icon: "🛡️",
    color: "#DC2626",
    bg: "#FEE2E2",
    shortDesc: "Backflow prevention protects the supply",
    fullDesc: "Cross-connection control prevents contaminated water from flowing backward into the potable supply through backflow. Backflow can occur by backpressure (downstream pressure exceeds supply pressure) or backsiphonage (negative pressure in the supply main). Backflow preventers are required at all high-hazard connections.",
    equipment: "Reduced Pressure Zone (RPZ) Assemblies, Double Check Valves, Air Gaps",
    regulation: "O. Reg. 170/03 and local bylaws require a cross-connection control program. RPZ assemblies required for high-hazard connections (hospitals, industrial, irrigation with chemical injection). Annual testing by certified tester required.",
    keyPoints: [
      "Air gap is the only 100% reliable backflow prevention method",
      "RPZ assembly: two check valves + relief valve — protects against backpressure AND backsiphonage",
      "Double check valve: protects against backpressure only — low-hazard applications",
      "Backsiphonage caused by main breaks, high-demand events, or firefighting",
      "Annual testing and certification of all backflow preventers required",
    ],
    waterQuality: { "Free Cl₂": "0.1–0.5 mg/L", pH: "6.5–8.5", Hazard: "High if no BFP", Protection: "RPZ/Air Gap" },
  },
  {
    id: "service",
    num: 7,
    label: "Service Connections",
    icon: "🏠",
    color: "#0F766E",
    bg: "#CCFBF1",
    shortDesc: "Final delivery to the customer",
    fullDesc: "The service connection is the pipe from the distribution main to the customer's property. It includes the corporation stop (at the main), the service line, the curb stop (at the property line), and the water meter. Older systems may have lead service lines — these are being replaced across Canada due to health risks.",
    equipment: "Corporation Stops, Service Lines, Curb Stops, Water Meters",
    regulation: "Health Canada's Guidelines for Canadian Drinking Water Quality set a maximum acceptable concentration of 0.005 mg/L for lead. Lead service line replacement programs are mandatory in many Ontario municipalities.",
    keyPoints: [
      "Corporation stop: valve at the main — utility-owned and operated",
      "Curb stop: valve at property line — utility-operated, customer shutoff",
      "Water meter measures consumption and detects leaks (continuous flow at night)",
      "Lead service lines: copper or polyethylene replacement required",
      "Minimum service pressure: 140 kPa dynamic during peak demand",
    ],
    waterQuality: { "Free Cl₂": "≥0.05 mg/L", pH: "6.5–8.5", Lead: "<0.005 mg/L", Pressure: "≥140 kPa" },
  },
];

export const DIST_LABEL_INFO: Record<string, string> = {
  // Pumping Station
  pump_inlet:    "Suction side of the high-lift pump. Treated water from the clearwell enters here. Net Positive Suction Head (NPSH) must be adequate to prevent cavitation.",
  impeller:      "The rotating impeller converts mechanical energy to kinetic energy, then to pressure. Impeller diameter and speed determine the pump's operating point on the pump curve.",
  vsd:           "Variable-Speed Drive (VSD) adjusts motor speed to match system demand. Reduces energy consumption significantly compared to throttling with a valve.",
  discharge:     "High-pressure discharge side. Pressure gauge and check valve installed here. Check valve prevents backflow when pump stops.",
  pressure_gauge:"Continuous pressure monitoring required. Alarms set for high and low pressure conditions. Data logged to SCADA for operational records.",
  // Transmission Main
  main_pipe:     "Large-diameter transmission main (400–1200mm). Designed for low velocity (<1.5 m/s) to minimise head loss. Typically ductile iron or prestressed concrete.",
  air_valve:     "Air/vacuum relief valve at high points. Releases trapped air during filling and admits air during draining to prevent vacuum collapse.",
  blowoff:       "Blow-off valve at low points allows flushing of sediment and complete drainage for maintenance. Discharge must be to a safe location — never to a sanitary sewer without an air gap.",
  isolation:     "Gate or butterfly valve for system isolation. Operated during main breaks, planned maintenance, or pressure zone adjustments. Valve exercise program keeps them operational.",
  // Storage
  inlet_pipe:    "Fill pipe from transmission main. Altitude valve controls filling — closes when tank is full to prevent overflow.",
  altitude_valve:"Automatically closes when tank reaches maximum level. Opens when system demand drops tank level. Prevents overflow and maintains system pressure.",
  overflow:      "Emergency overflow pipe set at maximum water level. Discharge must be to a safe location. Overflow indicates altitude valve failure — requires immediate attention.",
  tank_body:     "Tank structure must be inspected and cleaned regularly (every 3–5 years). Interior coating prevents corrosion and maintains water quality.",
  level_sensor:  "Continuous level monitoring via pressure transducer or ultrasonic sensor. Level data used for pump control and demand forecasting.",
  // Pressure Zone / PRV
  prv_body:      "Pressure-Reducing Valve (PRV) body. Reduces upstream pressure to a set downstream pressure. Spring-loaded diaphragm responds to downstream pressure changes.",
  prv_bypass:    "Bypass valve allows flow when PRV is being serviced. Must be operated carefully — bypass flow is unregulated and can cause pressure surges.",
  zone_meter:    "Flow meter at zone boundary measures water entering the pressure zone. Used for water balance calculations and leak detection (night flow analysis).",
  booster_pump:  "Booster pump serves high-elevation areas. Pressure switch starts/stops pump based on zone pressure. Backup pump required for redundancy.",
  // Distribution Main
  gate_valve:    "Gate valve for main isolation. Fully open or fully closed — not for throttling. Valve exercise program: operate annually to prevent seizure.",
  hydrant:       "Fire hydrant provides emergency water supply for firefighting. Also used for flushing and pressure testing. Dry-barrel design prevents freezing in cold climates.",
  tee:           "Tee fitting connects branch mains to the distribution grid. Looped connections at tees provide redundancy — water can reach any point from two directions.",
  curb_box:      "Curb stop access box at property line. Allows utility to shut off service to individual properties without entering the building.",
  // Cross-Connection
  rpz_body:      "Reduced Pressure Zone (RPZ) assembly: two independently operating check valves with a differential pressure relief valve between them. Provides protection against both backpressure and backsiphonage.",
  check1:        "First check valve — closes when downstream pressure approaches upstream pressure. Must maintain a minimum 7 kPa differential to stay closed.",
  relief_valve:  "Relief valve opens if pressure between the two check valves rises above the upstream pressure — indicating a failed check valve. Discharge to floor drain or safe location.",
  check2:        "Second check valve — provides backup protection. If first check valve fails, second check valve prevents backflow. Relief valve between them provides visual indication of failure.",
  air_gap:       "Physical air gap between supply outlet and flood rim of receiving vessel. The only 100% reliable backflow prevention — no mechanical parts to fail.",
  // Service Connection
  corp_stop:     "Corporation stop (corp stop) is the valve at the tap on the distribution main. Installed under pressure using a tapping machine. Utility-owned and operated.",
  service_line:  "Pipe from corp stop to curb stop. May be copper, polyethylene, or (in older systems) lead. Lead service lines must be replaced — they are a health hazard.",
  curb_stop:     "Curb stop valve at the property line. Utility-operated for service shutoff. Customer cannot operate this valve — they use the building shutoff inside.",
  meter:         "Water meter measures consumption in cubic metres. Smart meters enable remote reading and continuous monitoring for leak detection (abnormal night flow).",
  meter_pit:     "Meter pit or vault protects the meter from freezing and physical damage. Must be accessible for reading and maintenance.",
};
