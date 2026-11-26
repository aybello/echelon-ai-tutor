// Echelon — Wastewater Collection Process Data
// Interactive guide covering the full wastewater collection system

export interface CollectionStep {
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

export const COLL_STEPS: CollectionStep[] = [
  {
    id: "sources",
    num: 1,
    label: "Wastewater Sources",
    icon: "🏠",
    color: "#7C3AED",
    bg: "#EDE9FE",
    shortDesc: "Domestic, commercial & industrial flows",
    fullDesc: "Wastewater originates from domestic sources (toilets, sinks, showers), commercial establishments, and industrial facilities. It also includes infiltration (groundwater entering cracked pipes) and inflow (stormwater entering through manholes or illegal connections). Understanding flow sources is essential for system design and capacity planning.",
    equipment: "Building Drains, Lateral Connections, Cleanouts",
    regulation: "Industrial dischargers must obtain a Sewer Use Bylaw permit. Prohibited substances (oils, solvents, high-strength waste) must not enter the sanitary sewer. Pre-treatment may be required under the Ontario Water Resources Act.",
    keyPoints: [
      "Domestic wastewater: 200–400 L/person/day typical in Ontario",
      "Infiltration and inflow (I/I) can double dry-weather flow during wet events",
      "Industrial pre-treatment required before discharge to sanitary sewer",
      "Sanitary sewer separate from storm sewer in most modern systems",
      "Illegal connections (roof drains, sump pumps) cause I/I — must be eliminated",
    ],
    waterQuality: { BOD: "200–300 mg/L", TSS: "200–350 mg/L", pH: "6.5–8.5", Flow: "200–400 L/cap/day" },
  },
  {
    id: "lateral",
    num: 2,
    label: "Lateral & House Connection",
    icon: "🔌",
    color: "#0369A1",
    bg: "#E0F2FE",
    shortDesc: "Building drain connects to the sewer",
    fullDesc: "The building sewer (lateral) connects the building drain to the sanitary sewer main. The property owner is responsible for the lateral from the building to the property line; the municipality is responsible from the property line to the main. Proper slope (minimum 2%) ensures self-cleansing velocity and prevents solids deposition.",
    equipment: "PVC Pipe, Cleanouts, Wye Connections, Backwater Valves",
    regulation: "Minimum slope: 2% (1:50) for 100mm pipe to achieve self-cleansing velocity of 0.6 m/s. Cleanouts required at changes in direction and every 30m. Backwater valves required in flood-prone areas under Ontario Building Code.",
    keyPoints: [
      "Minimum 100mm diameter for building laterals",
      "Minimum slope 2% (1:50) for self-cleansing velocity ≥0.6 m/s",
      "Cleanout at property line for maintenance access",
      "Backwater valve prevents sewer backup into building during surcharge",
      "Inspection required before connection to municipal sewer",
    ],
    waterQuality: { Flow: "Peak 10× avg", Slope: "Min 2%", Velocity: "≥0.6 m/s", Pipe: "100–200mm" },
  },
  {
    id: "gravity_sewer",
    num: 3,
    label: "Gravity Sewer Mains",
    icon: "📐",
    color: "#059669",
    bg: "#D1FAE5",
    shortDesc: "Sewage flows downhill by gravity",
    fullDesc: "Gravity sewer mains collect wastewater from laterals and convey it downhill to lift stations or the treatment plant. They are designed to flow partially full (typically 50–75% full at peak design flow) to allow ventilation and accommodate surges. Minimum slope ensures self-cleansing velocity to prevent solids deposition.",
    equipment: "PVC, Concrete, HDPE Pipe; Manholes; Service Connections",
    regulation: "Design flow includes peak wet-weather flow (typically 3–5× average dry-weather flow). Manning's equation used for hydraulic design. Minimum velocity 0.6 m/s at average flow; maximum 3.0 m/s to prevent erosion.",
    keyPoints: [
      "Manning's equation: V = (1/n) × R^(2/3) × S^(1/2) — n=0.013 for concrete",
      "Design for 50–75% full at peak flow to allow ventilation",
      "Minimum self-cleansing velocity: 0.6 m/s at average flow",
      "Maximum velocity: 3.0 m/s to prevent pipe erosion",
      "Egg-shaped pipes used in large sewers to maintain velocity at low flows",
    ],
    waterQuality: { Flow: "Partial full", Velocity: "0.6–3.0 m/s", Slope: "Per Manning's", "H2S": "Risk at low V" },
  },
  {
    id: "manholes",
    num: 4,
    label: "Manholes & Access",
    icon: "🔵",
    color: "#B45309",
    bg: "#FEF3C7",
    shortDesc: "Access points for inspection & maintenance",
    fullDesc: "Manholes provide access to the sewer system for inspection, cleaning, and maintenance. They are located at every change in direction, change in pipe size, change in slope, and at regular intervals along straight runs (maximum 120m). Manholes must be gas-tight to prevent odour and must be vented to avoid explosive gas buildup.",
    equipment: "Precast Concrete Manholes, Frames and Covers, Drop Connections",
    regulation: "Maximum spacing: 120m on straight runs. Confined space entry procedures required for all manhole entry (OHSA). Gas testing for H₂S, CH₄, O₂ required before entry. Minimum two-person crew.",
    keyPoints: [
      "Maximum spacing: 120m on straight runs",
      "Drop manhole used when incoming pipe is >600mm above outgoing pipe",
      "Confined space entry: test for H₂S, CH₄, O₂ before entry",
      "H₂S is heavier than air — accumulates at the bottom of manholes",
      "Invert channels direct flow smoothly through the manhole",
    ],
    waterQuality: { "H2S": "Risk >0.5 ppm", "CH4": "LEL >10% risk", "O2": "Min 19.5%", Access: "Max 120m" },
  },
  {
    id: "liftstation",
    num: 5,
    label: "Lift Station",
    icon: "⬆️",
    color: "#DC2626",
    bg: "#FEE2E2",
    shortDesc: "Pumps sewage uphill when gravity fails",
    fullDesc: "Lift stations (pumping stations) are required when the sewer system cannot maintain gravity flow due to topography. A wet well collects incoming sewage; submersible pumps activate when the wet well reaches a set level. Duplex pump arrangements (duty + standby) provide redundancy. Emergency overflow provisions and backup power are critical.",
    equipment: "Wet Well, Submersible Pumps, Level Controls, Emergency Generator",
    regulation: "Duplex pumps required — one duty, one standby. Emergency overflow to prevent flooding. Backup power (generator) required for all lift stations. Alarm systems with remote monitoring required under O. Reg. 170/03 equivalent.",
    keyPoints: [
      "Wet well sized for 10–30 minutes detention at average flow",
      "Pumps cycle on/off based on high and low level floats or sensors",
      "Duplex arrangement: duty pump alternates to equalise wear",
      "Emergency overflow prevents flooding — discharge requires approval",
      "H₂S generation in wet wells — corrosion and safety hazard",
    ],
    waterQuality: { "H2S": "High risk", Odour: "Significant", Pump: "Duty + Standby", Backup: "Generator req'd" },
  },
  {
    id: "forcemain",
    num: 6,
    label: "Force Main",
    icon: "💨",
    color: "#0F766E",
    bg: "#CCFBF1",
    shortDesc: "Pressurised pipe from lift station",
    fullDesc: "Force mains are pressurised pipes that convey sewage from a lift station to the next gravity sewer or treatment plant. Unlike gravity sewers, force mains flow full under pressure. Minimum velocity of 0.9 m/s prevents solids deposition. Air release valves at high points prevent air locking. Sewage in force mains can become septic, generating H₂S.",
    equipment: "PVC, HDPE, Ductile Iron Pipe; Air Release Valves; Isolation Valves",
    regulation: "Minimum velocity: 0.9 m/s to prevent solids deposition. Maximum velocity: 3.0 m/s. Air release valves required at all high points. Isolation valves at lift station and at intervals for maintenance.",
    keyPoints: [
      "Force mains flow full under pressure — no free surface",
      "Minimum velocity: 0.9 m/s to prevent grit and solids deposition",
      "Air release valves at high points prevent air locking",
      "Sewage becomes septic in long force mains — H₂S generation",
      "Surge (water hammer) analysis required for pump start/stop",
    ],
    waterQuality: { Pressure: "Full pipe", Velocity: "0.9–3.0 m/s", "H2S": "Septic risk", Surge: "Design req'd" },
  },
  {
    id: "cso",
    num: 7,
    label: "Overflow & CSO Control",
    icon: "⚠️",
    color: "#D97706",
    bg: "#FEF3C7",
    shortDesc: "Managing combined sewer overflows",
    fullDesc: "Combined sewer overflows (CSOs) occur in older systems where sanitary and storm sewers share the same pipe. During heavy rain, combined flow exceeds treatment plant capacity and overflows to receiving waters. CSO control programs aim to reduce overflow frequency and volume through separation, storage, and real-time control.",
    equipment: "CSO Regulators, Storage Tunnels, Real-Time Control Systems",
    regulation: "Environment and Climate Change Canada's CSO Control Policy requires municipalities to develop and implement CSO control plans. Minimum controls include maximising flow to treatment, prohibiting dry-weather overflows, and regular inspection and maintenance.",
    keyPoints: [
      "CSOs only permitted during wet weather — dry-weather overflows are prohibited",
      "Nine minimum controls required under federal CSO policy",
      "Real-time control (RTC) optimises system capacity during storm events",
      "Storage tunnels capture peak flows for treatment after the storm",
      "Sewer separation (sanitary from storm) is the long-term solution",
    ],
    waterQuality: { Event: "Wet weather only", Receiving: "Impacted", Control: "9 min. controls", Solution: "Separation" },
  },
];

export const COLL_LABEL_INFO: Record<string, string> = {
  // Sources
  house_drain:    "Building drain collects all wastewater from fixtures inside the building. Slope must be maintained throughout to ensure self-cleansing flow. Cleanouts required at changes in direction.",
  lateral_pipe:   "Building lateral (building sewer) connects the building drain to the municipal sewer. Property owner responsible from building to property line; municipality from property line to main.",
  cleanout:       "Cleanout provides access for drain cleaning equipment. Required at every change in direction and every 30m. Located at property line for easy municipal access.",
  backwater_valve:"Backwater valve (check valve) prevents sewer backup from entering the building during surcharge events. Required in flood-prone areas under Ontario Building Code.",
  // Lateral
  wye_conn:       "Wye connection at the sewer main. Installed at 45° to the main to direct flow smoothly. Requires a permit and inspection before backfilling.",
  slope_arrow:    "Minimum 2% slope (1:50) required for 100mm pipe. Greater slopes increase velocity — self-cleansing velocity of 0.6 m/s prevents solids from settling in the pipe.",
  // Gravity Sewer
  pipe_section:   "Sewer pipe cross-section. Designed to flow 50–75% full at peak design flow. This allows ventilation and accommodates unexpected surges without surcharging.",
  flow_arrow:     "Flow direction in gravity sewer. Wastewater flows downhill by gravity — no pumping required. Slope and pipe size determine velocity and capacity.",
  manhole_conn:   "Manhole connection point. Sewers connect at manholes, which provide access for inspection and maintenance. Invert elevation changes at manholes allow for changes in slope.",
  // Manholes
  frame_cover:    "Cast iron frame and cover. Must be gas-tight to prevent odour escape. Covers marked 'SANITARY' to distinguish from storm sewer manholes.",
  steps:          "Manhole steps (rungs) for entry. Must be in good condition — corroded or missing steps are a safety hazard. OHSA confined space procedures apply to all manhole entry.",
  invert:         "Invert channel at manhole base. Smooth, curved channel directs flow from incoming to outgoing pipe with minimal turbulence and head loss.",
  drop_conn:      "Drop connection used when incoming pipe is significantly higher than outgoing pipe. External drop preferred — internal drops are difficult to maintain.",
  // Lift Station
  wet_well:       "Wet well collects incoming sewage and provides storage volume between pump cycles. Sized for 10–30 minutes detention. Frequent cycling (>6 starts/hour) damages pump motors.",
  float_switch:   "Float switches or level sensors control pump start/stop. High-level alarm triggers when wet well approaches overflow level. Low-level cutoff prevents pump running dry.",
  submersible:    "Submersible pump installed in the wet well. Handles raw sewage including solids — non-clog impeller design. Pulled for maintenance using a guide rail system.",
  standby_pump:   "Standby pump provides redundancy. Alternates with duty pump to equalise wear. Activates automatically if duty pump fails or if wet well reaches high-high level.",
  generator:      "Emergency generator provides backup power during utility outages. Required for all lift stations — power failure without backup causes sewage overflow.",
  // Force Main
  fm_pipe:        "Force main pipe flows full under pressure. PVC, HDPE, or ductile iron depending on pressure class. Thrust blocks required at bends and fittings.",
  air_release:    "Air release valve at high point. Releases trapped air during filling and admits air during draining. Air locking can stop flow completely — valves must be maintained.",
  fm_isolation:   "Isolation valve allows force main to be taken out of service for maintenance. Required at lift station discharge and at intervals along the main.",
  // CSO
  regulator:      "CSO regulator controls the split between flow to treatment and overflow. During dry weather, all flow goes to treatment. During wet weather, excess flow overflows.",
  storage:        "CSO storage tunnel or tank captures overflow for treatment after the storm event. Reduces overflow volume and frequency significantly.",
  rtc:            "Real-time control (RTC) system monitors levels and flows throughout the system. Optimises valve positions to maximise use of available capacity and reduce overflows.",
};
