// WPI Class II Water Distribution — Practice Question Bank (150 Questions)
// Aligned with WPI Need-to-Know Criteria: Water Distribution Operator Class II
// Used for: BC (EOCP Level II), Alberta (AWWOA Class II), Saskatchewan, Manitoba
// Exam Blueprint: 32 Distribution System Components | 28 Equipment O&M | 20 Water Quality | 20 Safety & Admin
export interface WpiClass2WaterDistQuestion {
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

export const wpiClass2WaterDistQuestions: WpiClass2WaterDistQuestion[] = [
  // ─── MODULE 1: Distribution System Components (50 questions) ───────────────
  {
    id: 1,
    module: "Distribution System Components",
    question: "What is the primary advantage of a looped (grid) distribution system over a dead-end system?",
    options: [
      "Lower installation cost",
      "Improved water circulation, reduced stagnation, and the ability to isolate sections for maintenance without shutting off service to large areas",
      "Higher operating pressure throughout the system",
      "Simpler hydraulic analysis"
    ],
    correctAnswer: 1,
    explanation: "Looped (grid) systems allow water to flow from multiple directions to any point, preventing dead-ends where water can stagnate and lose disinfectant residual. They also allow sections to be isolated for repair without shutting off service to large areas. Dead-end systems have only one flow path, creating stagnation zones and requiring complete shutdowns for repairs.",
  },
  {
    id: 2,
    module: "Distribution System Components",
    question: "What is the purpose of a pressure zone in a water distribution system?",
    options: [
      "To increase water pressure throughout the system",
      "To divide the system into areas of similar pressure, preventing excessive pressure at low elevations and insufficient pressure at high elevations",
      "To separate potable and non-potable water",
      "To isolate areas with different water quality"
    ],
    correctAnswer: 1,
    explanation: "Pressure zones divide distribution systems into areas where pressure can be managed appropriately. Without pressure zones, low-elevation areas would experience excessive pressure (causing pipe breaks and wasted water) while high-elevation areas would have insufficient pressure (below minimum service pressure). Pressure reducing valves (PRVs) separate pressure zones, reducing pressure from a higher zone to a lower zone.",
  },
  {
    id: 3,
    module: "Distribution System Components",
    question: "What is the minimum residual pressure required at service connections during peak demand conditions according to most Canadian standards?",
    options: [
      "100 kPa (15 psi)",
      "140 kPa (20 psi)",
      "275 kPa (40 psi)",
      "550 kPa (80 psi)"
    ],
    correctAnswer: 2,
    explanation: "Most Canadian standards (and AWWA guidelines) require a minimum residual pressure of 275 kPa (40 psi) at service connections during peak demand conditions. This ensures adequate pressure for domestic use, fire suppression, and prevents backflow from negative pressure conditions. Maximum pressure is typically limited to 690 kPa (100 psi) to prevent pipe damage and reduce water loss.",
  },
  {
    id: 4,
    module: "Distribution System Components",
    question: "What is the purpose of a surge tank (air vessel) in a water distribution system?",
    options: [
      "To store water for peak demand periods",
      "To absorb pressure transients (water hammer) caused by sudden changes in flow velocity, protecting pipes and equipment",
      "To add air to the water for taste improvement",
      "To provide emergency water storage"
    ],
    correctAnswer: 1,
    explanation: "Surge tanks (air vessels or hydropneumatic tanks) absorb pressure transients (water hammer) caused by sudden pump starts/stops, valve closures, or pipe breaks. They contain a cushion of compressed air that compresses when pressure rises and expands when pressure drops, dampening the pressure wave. Without surge protection, water hammer can cause pipe failures, joint separations, and equipment damage.",
    isCalc: false,
  },
  {
    id: 5,
    module: "Distribution System Components",
    question: "Calculate the velocity in a 300 mm diameter pipe carrying a flow of 0.085 m³/s.",
    options: [
      "0.85 m/s",
      "1.20 m/s",
      "1.50 m/s",
      "2.10 m/s"
    ],
    correctAnswer: 1,
    explanation: "Velocity = Q / A. Area = π × (0.300/2)² = π × 0.0225 = 0.07069 m². Velocity = 0.085 / 0.07069 = 1.20 m/s. This is within the acceptable range of 0.6–3.0 m/s for distribution mains. Velocities below 0.6 m/s can cause sediment deposition; above 3.0 m/s can cause erosion and noise.",
    isCalc: true,
    steps: [
      { l: "Calculate pipe cross-sectional area", c: "A = π × (D/2)² = π × (0.300/2)² = π × 0.0225 = 0.07069 m²" },
      { l: "Apply continuity equation", c: "V = Q/A = 0.085 m³/s ÷ 0.07069 m² = 1.20 m/s" },
    ],
  },
  {
    id: 6,
    module: "Distribution System Components",
    question: "What is the purpose of a blow-off (blowdown) valve in a water distribution system?",
    options: [
      "To release excess pressure",
      "To flush sediment, biofilm, and stagnant water from dead-end mains and low points in the system",
      "To allow air to enter the pipe during draining",
      "To prevent backflow at service connections"
    ],
    correctAnswer: 1,
    explanation: "Blow-off (blowdown) valves are installed at dead-ends and low points in distribution mains to allow flushing of accumulated sediment, biofilm, and stagnant water. Regular flushing (unidirectional or conventional) maintains water quality, removes disinfection by-products, and keeps the system clean. Blow-offs are typically 50–100 mm diameter and discharge to a storm sewer or drainage ditch.",
  },
  {
    id: 7,
    module: "Distribution System Components",
    question: "What is the Hazen-Williams coefficient (C) for new ductile iron pipe?",
    options: [
      "80",
      "100",
      "130",
      "150"
    ],
    correctAnswer: 2,
    explanation: "New ductile iron pipe has a Hazen-Williams C coefficient of approximately 130. This coefficient represents the pipe's hydraulic smoothness — higher C values indicate smoother pipes with less friction loss. Over time, tuberculation (iron corrosion deposits) and biofilm growth reduce C to 80–100 in older unlined iron pipes. PVC pipe has C ≈ 150, and concrete pipe C ≈ 120–140.",
  },
  {
    id: 8,
    module: "Distribution System Components",
    question: "What is the purpose of a pressure sustaining valve (PSV) in a distribution system?",
    options: [
      "To reduce pressure downstream",
      "To maintain a minimum upstream pressure, preventing the upstream zone from being drained by downstream demand",
      "To prevent backflow",
      "To regulate flow rate"
    ],
    correctAnswer: 1,
    explanation: "A pressure sustaining valve (PSV) maintains a minimum upstream pressure. Unlike a pressure reducing valve (PRV) which limits downstream pressure, a PSV ensures the upstream zone maintains adequate pressure even when downstream demand is high. PSVs are used to protect elevated storage tanks, ensure minimum pressure at critical points, and prevent draining of upstream zones.",
  },
  {
    id: 9,
    module: "Distribution System Components",
    question: "What is the recommended minimum pipe burial depth in Canada to protect against freezing?",
    options: [
      "0.5 m below the frost line",
      "At or below the local frost depth (typically 1.5–3.0 m depending on region)",
      "1.0 m below grade regardless of location",
      "0.3 m below grade"
    ],
    correctAnswer: 1,
    explanation: "Water mains must be buried below the local frost depth to prevent freezing. Frost depth varies significantly across Canada: 1.5 m in southern Ontario, 2.0–2.5 m in the prairies, and up to 3.0 m in northern regions. Local design standards specify minimum cover requirements. Additional insulation or heat tracing may be required in areas with shallow frost depth or where pipes must be installed at shallower depths.",
  },
  {
    id: 10,
    module: "Distribution System Components",
    question: "What is the purpose of cathodic protection on buried metallic water mains?",
    options: [
      "To prevent biological growth inside the pipe",
      "To prevent external corrosion of metallic pipes by making the pipe the cathode in an electrochemical cell",
      "To improve water quality",
      "To prevent internal scaling"
    ],
    correctAnswer: 1,
    explanation: "Cathodic protection prevents external corrosion of buried metallic pipes (steel, ductile iron) by making the pipe the cathode (protected electrode) in an electrochemical cell. Two methods: (1) Sacrificial anode — a more active metal (zinc, magnesium) is connected to the pipe and corrodes instead; (2) Impressed current — a DC power source drives current from an inert anode through the soil to the pipe. Without cathodic protection, buried metallic pipes corrode from external soil contact.",
  },
  {
    id: 11,
    module: "Distribution System Components",
    question: "What is the purpose of a water tower (elevated storage tank) in a distribution system?",
    options: [
      "To treat water before distribution",
      "To provide head (pressure) through gravity, equalize system pressure during demand fluctuations, and provide emergency storage",
      "To store water for industrial use only",
      "To pump water to high-elevation areas"
    ],
    correctAnswer: 1,
    explanation: "Water towers (elevated storage) serve three functions: (1) Pressure — the water elevation provides hydraulic head (pressure) through gravity, reducing the need for continuous pumping; (2) Equalization — the tank fills during low demand and empties during peak demand, smoothing out pressure fluctuations; (3) Emergency storage — provides water during pump failures or power outages. The hydraulic grade line (HGL) is set by the water surface elevation in the tank.",
  },
  {
    id: 12,
    module: "Distribution System Components",
    question: "Calculate the static pressure at the base of a water tower if the water surface is 45 m above the base.",
    options: [
      "220 kPa",
      "441 kPa",
      "550 kPa",
      "680 kPa"
    ],
    correctAnswer: 1,
    explanation: "Pressure = ρgh = 1000 kg/m³ × 9.81 m/s² × 45 m = 441,450 Pa = 441 kPa (approximately 64 psi). This is within the acceptable service pressure range of 275–690 kPa (40–100 psi). Each metre of water elevation provides approximately 9.81 kPa (or roughly 10 kPa for quick calculations).",
    isCalc: true,
    steps: [
      { l: "Apply hydrostatic pressure formula", c: "P = ρ × g × h = 1000 kg/m³ × 9.81 m/s² × 45 m" },
      { l: "Calculate pressure in Pascals", c: "P = 441,450 Pa" },
      { l: "Convert to kPa", c: "P = 441,450 / 1000 = 441 kPa" },
    ],
  },
  {
    id: 13,
    module: "Distribution System Components",
    question: "What is the purpose of a check valve in a pump discharge line?",
    options: [
      "To control flow rate",
      "To prevent backflow through the pump when it stops, protecting the pump from reverse rotation and preventing drainage of the discharge line",
      "To reduce pressure",
      "To allow air release"
    ],
    correctAnswer: 1,
    explanation: "Check valves on pump discharge lines prevent backflow when the pump stops. Without a check valve, water in the discharge line would flow backward through the pump, causing reverse rotation (which can damage the pump motor and impeller) and draining the discharge piping. Swing check valves are common for horizontal installations; ball check valves for vertical. Slow-closing check valves reduce water hammer on pump shutdown.",
  },
  {
    id: 14,
    module: "Distribution System Components",
    question: "What is the difference between a gate valve and a butterfly valve in distribution systems?",
    options: [
      "Gate valves are for pressure control; butterfly valves are for isolation only",
      "Gate valves provide full-bore opening with minimal pressure drop when fully open; butterfly valves are more compact and lighter but have a disc that remains in the flow path",
      "Butterfly valves are only used underground; gate valves are above ground",
      "Gate valves are for water; butterfly valves are for wastewater only"
    ],
    correctAnswer: 1,
    explanation: "Gate valves: full-bore opening when fully open (minimal pressure drop), slow to operate (multiple turns), large and heavy, best for isolation service. Butterfly valves: compact and lightweight, quarter-turn operation, disc remains in flow path (some pressure drop even when open), suitable for larger diameter pipes. Both are used for isolation in distribution systems. Gate valves are preferred where full-bore flow is critical; butterfly valves where space and weight are concerns.",
  },
  {
    id: 15,
    module: "Distribution System Components",
    question: "What is the purpose of an air/vacuum release valve (AVRV) in a water main?",
    options: [
      "To release excess water pressure",
      "To automatically release trapped air during filling and admit air during draining, preventing air locks and vacuum conditions",
      "To prevent backflow",
      "To regulate flow"
    ],
    correctAnswer: 1,
    explanation: "Air/vacuum release valves (AVRVs) serve two functions: (1) Air release — automatically releases trapped air pockets during pipe filling and normal operation (air pockets reduce flow capacity and can cause pressure surges); (2) Vacuum break — admits air when the pipe drains or experiences negative pressure, preventing pipe collapse and siphoning. AVRVs are installed at high points in the system where air naturally accumulates.",
  },
  {
    id: 16,
    module: "Distribution System Components",
    question: "What is the recommended spacing for isolation valves in a water distribution main?",
    options: [
      "Every 50 m",
      "Every 150–300 m or at each block, so that no more than 500 service connections are isolated during a main break",
      "Every 1 km",
      "Only at major intersections"
    ],
    correctAnswer: 1,
    explanation: "AWWA and Canadian standards recommend isolation valves spaced so that no more than 500 service connections (or a specified length, typically 150–300 m in urban areas) are affected when a section is isolated for repair. Adequate valve spacing minimizes customer impact during main breaks and maintenance. Valves should be located at all tees, crosses, and major intersections. Regular valve exercising (turning and returning to open position) prevents valves from seizing.",
  },
  {
    id: 17,
    module: "Distribution System Components",
    question: "What is the purpose of a pressure reducing valve (PRV) station in a distribution system?",
    options: [
      "To increase pressure in low-pressure zones",
      "To reduce pressure from a higher-pressure zone to a lower-pressure zone, maintaining a set downstream pressure",
      "To measure flow",
      "To prevent backflow between zones"
    ],
    correctAnswer: 1,
    explanation: "Pressure reducing valves (PRVs) automatically reduce upstream pressure to a preset downstream pressure. They are used to create pressure zones, protecting low-elevation areas from excessive pressure (which causes pipe breaks, joint failures, and increased water loss through leaks). PRV stations typically include: isolation valves, strainer, PRV, pressure gauges, and a bypass line for maintenance. The PRV modulates its opening to maintain constant downstream pressure regardless of upstream pressure or downstream flow.",
  },
  {
    id: 18,
    module: "Distribution System Components",
    question: "What is the purpose of a fire hydrant flush valve (drain valve)?",
    options: [
      "To drain the hydrant barrel after use, preventing freezing in cold climates",
      "To flush the hydrant before connecting hoses",
      "To control water pressure during firefighting",
      "To prevent backflow into the distribution main"
    ],
    correctAnswer: 0,
    explanation: "The drain valve (flush valve) in a dry-barrel fire hydrant automatically opens when the main valve is closed, draining the hydrant barrel to prevent freezing. When the main valve opens, water pressure closes the drain valve. Wet-barrel hydrants (used in frost-free climates) do not have drain valves. Dry-barrel hydrants must never be opened partially — the drain valve must be fully closed (main valve fully open) to prevent water from draining while the hydrant is in use.",
  },
  {
    id: 19,
    module: "Distribution System Components",
    question: "What is the minimum fire flow requirement for a residential area according to most Canadian standards?",
    options: [
      "500 L/min for 30 minutes",
      "1,500 L/min for 2 hours",
      "3,000 L/min for 4 hours",
      "5,000 L/min for 6 hours"
    ],
    correctAnswer: 1,
    explanation: "Most Canadian standards (and NFPA 1) require a minimum fire flow of 1,500 L/min (400 gpm) for 2 hours for residential areas. Commercial and industrial areas require higher flows: 3,000–6,000 L/min for 2–4 hours depending on building size and construction. Fire flow must be available while maintaining a residual pressure of at least 140 kPa (20 psi) at the fire hydrant. Distribution systems must be designed to provide both domestic demand and fire flow simultaneously.",
  },
  {
    id: 20,
    module: "Distribution System Components",
    question: "What is the purpose of a water meter at a service connection?",
    options: [
      "To control pressure at the service connection",
      "To measure the volume of water consumed by the customer for billing purposes and to detect leaks",
      "To prevent backflow",
      "To regulate flow to the customer"
    ],
    correctAnswer: 1,
    explanation: "Water meters measure the volume of water delivered to customers for billing (revenue metering) and for water loss analysis. Meter data also helps detect leaks: unusually high consumption may indicate a leak on the customer's side. Meters are typically located at the property line or curb stop. Common types: positive displacement (nutating disc, oscillating piston) for residential; turbine or electromagnetic for commercial/industrial. Smart meters enable remote reading and real-time leak detection.",
  },
  {
    id: 21,
    module: "Distribution System Components",
    question: "What is the purpose of a curb stop (curb valve) at a service connection?",
    options: [
      "To measure water consumption",
      "To allow the utility to shut off water service to an individual customer without entering the property",
      "To prevent backflow from the customer's premises",
      "To regulate pressure at the service connection"
    ],
    correctAnswer: 1,
    explanation: "A curb stop (curb valve or corporation stop) is a shutoff valve installed at the property line or curb, allowing the utility to shut off water service to a specific customer without entering private property or shutting off the main. It is typically a ball valve or plug valve operated with a special key. The curb stop is used for non-payment shutoffs, emergency shutoffs, and meter replacement. The customer's interior shutoff valve is separate and on private property.",
  },
  {
    id: 22,
    module: "Distribution System Components",
    question: "What is the purpose of a service saddle (tapping saddle) when making a service connection to an existing main?",
    options: [
      "To provide a reinforced, leak-free connection point for drilling a hole in an existing pipe under pressure",
      "To support the pipe at the connection point",
      "To measure flow at the connection",
      "To prevent corrosion at the connection point"
    ],
    correctAnswer: 0,
    explanation: "A service saddle (tapping saddle) provides a reinforced, leak-free fitting that clamps around an existing pipe, allowing a hole to be drilled (tapped) under pressure to make a new service connection without shutting off the main. The saddle distributes stress around the hole and provides a threaded outlet for the corporation stop. Saddles are used when the pipe material (PVC, AC, cast iron) requires reinforcement at the tap location.",
  },
  {
    id: 23,
    module: "Distribution System Components",
    question: "What is the hydraulic grade line (HGL) in a distribution system?",
    options: [
      "The physical elevation of the water main",
      "A line representing the pressure head (pressure/ρg + elevation) at each point in the system, showing where water would rise to in a piezometer",
      "The maximum allowable pressure in the system",
      "The flow velocity profile in the pipe"
    ],
    correctAnswer: 1,
    explanation: "The hydraulic grade line (HGL) represents the total piezometric head (pressure head + elevation head) at each point in the system. It shows the pressure energy available at any location. The HGL slopes downward in the direction of flow due to friction losses. In a pressurized pipe, the HGL is above the pipe; if the HGL drops below the pipe, negative pressure (vacuum) occurs. The HGL is set by the water surface elevation in storage tanks and the pump head.",
  },
  {
    id: 24,
    module: "Distribution System Components",
    question: "What is the purpose of a thrust block at a pipe bend or fitting?",
    options: [
      "To support the pipe weight",
      "To resist the unbalanced hydraulic thrust force at bends, tees, and dead-ends, preventing joint separation",
      "To prevent pipe movement due to soil settlement",
      "To provide access for maintenance"
    ],
    correctAnswer: 1,
    explanation: "Thrust blocks resist unbalanced hydraulic thrust forces at bends, tees, reducers, and dead-ends. When water changes direction or stops at a fitting, the pressure creates a net force that can push the fitting off the pipe. Thrust blocks transfer this force to the surrounding soil through a concrete bearing surface. The block size depends on pipe diameter, pressure, soil bearing capacity, and fitting angle. Restrained joints (mechanical restraints) are an alternative to thrust blocks.",
  },
  {
    id: 25,
    module: "Distribution System Components",
    question: "What is the purpose of a tracer wire installed with non-metallic (PVC, HDPE) water mains?",
    options: [
      "To provide cathodic protection",
      "To allow the pipe to be located using electronic pipe locating equipment, since non-metallic pipes cannot be detected by standard metal detectors",
      "To monitor pipe temperature",
      "To detect leaks electronically"
    ],
    correctAnswer: 1,
    explanation: "Non-metallic pipes (PVC, HDPE) cannot be detected by standard electromagnetic pipe locators used to locate buried utilities. Tracer wire (typically 12 AWG copper or stainless steel) is installed alongside non-metallic pipes and connected to surface access points, allowing the pipe to be located using electronic equipment. Tracer wire must be continuous (no breaks) and accessible at surface access points (valve boxes, meter pits). Without tracer wire, non-metallic pipes can only be located by excavation.",
  },
  {
    id: 26,
    module: "Distribution System Components",
    question: "What is the purpose of a pressure zone boundary valve in a distribution system?",
    options: [
      "To control flow between pressure zones",
      "To separate two pressure zones, typically remaining closed to prevent high-pressure water from flowing into the low-pressure zone, but can be opened for emergency interconnection",
      "To measure pressure difference between zones",
      "To regulate flow between zones automatically"
    ],
    correctAnswer: 1,
    explanation: "Pressure zone boundary valves separate adjacent pressure zones and are normally kept closed to maintain the pressure differential between zones. They can be opened in emergencies (e.g., PRV failure, fire flow demand) to allow flow between zones, accepting that the lower zone will experience higher pressure temporarily. Opening boundary valves during emergencies requires careful monitoring to prevent damage from excessive pressure in the lower zone.",
  },
  {
    id: 27,
    module: "Distribution System Components",
    question: "What is the purpose of a water main cleaning pig (swab)?",
    options: [
      "To inspect the pipe interior for defects",
      "To remove biofilm, sediment, and tuberculation from the pipe interior to restore hydraulic capacity and improve water quality",
      "To seal pipe leaks from the inside",
      "To measure pipe diameter"
    ],
    correctAnswer: 1,
    explanation: "Cleaning pigs (foam swabs, poly pigs) are inserted into the pipe and propelled by water pressure to scrub the pipe interior, removing biofilm, sediment, and loose tuberculation. This restores hydraulic capacity (increases C factor), improves water quality (removes biofilm that harbors bacteria), and reduces disinfectant demand. Pigs are launched from one access point and retrieved at another. Ice pigging (using ice slurry) is a newer technique that is gentler on pipe linings.",
  },
  {
    id: 28,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system hydraulic model?",
    options: [
      "To replace field testing of the system",
      "To simulate system behavior under various demand and operational scenarios, supporting planning, design, operations, and emergency response",
      "To measure actual flows in the system",
      "To control valves and pumps automatically"
    ],
    correctAnswer: 1,
    explanation: "Hydraulic models (EPANET, WaterGEMS, InfoWater) simulate pressure and flow throughout the distribution system under various conditions: peak demand, fire flow, pump failure, pipe break, future growth. They support: capital planning (pipe sizing, storage sizing), operations (valve settings, pump scheduling), water quality modeling (chlorine decay, age, source tracing), and emergency response (isolation scenarios). Models must be calibrated against field measurements to be reliable.",
  },
  {
    id: 29,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system master meter?",
    options: [
      "To control pressure in the system",
      "To measure the total volume of water entering the distribution system from the treatment plant or source, used for water loss calculations",
      "To measure flow to individual customers",
      "To detect leaks in the transmission main"
    ],
    correctAnswer: 1,
    explanation: "Master meters measure the total volume of water entering the distribution system (from treatment plants, wells, or interconnections). Comparing master meter readings to the sum of customer meter readings reveals the system's non-revenue water (NRW) or water loss: NRW = Water Produced - Water Billed. NRW includes real losses (leakage), apparent losses (meter error, theft), and authorized unbilled use (flushing, firefighting). Master meters must be accurate and regularly calibrated.",
  },
  {
    id: 30,
    module: "Distribution System Components",
    question: "What is the purpose of a district metered area (DMA) in a distribution system?",
    options: [
      "To separate water quality zones",
      "To create a defined zone with measured inflow and outflow, enabling precise water loss detection and localization",
      "To separate pressure zones",
      "To meter water use by district for billing purposes"
    ],
    correctAnswer: 1,
    explanation: "A district metered area (DMA) is a defined zone of the distribution system with all inflows and outflows measured by meters. By comparing inflow to outflow and customer consumption, operators can calculate the zone's water loss and detect increases that indicate new leaks. DMAs enable proactive leak detection — a sudden increase in minimum night flow (MNF) indicates a new leak. DMAs are a key tool in active leakage control programs.",
  },
  {
    id: 31,
    module: "Distribution System Components",
    question: "What is the purpose of a pressure management strategy in water loss control?",
    options: [
      "To increase pressure for better service",
      "To reduce system pressure to the minimum required level, reducing leak flow rates and pipe burst frequency",
      "To equalize pressure throughout the system",
      "To reduce pumping costs only"
    ],
    correctAnswer: 1,
    explanation: "Pressure management reduces system pressure to the minimum required level (while maintaining minimum service pressure). Lower pressure reduces: (1) leak flow rates — leakage is proportional to pressure; (2) pipe burst frequency — higher pressure increases burst probability; (3) background leakage through micro-cracks. Pressure management is one of the most cost-effective water loss control strategies. Advanced pressure management uses time-modulated PRV control to vary pressure with demand (lower pressure at night when demand is low).",
  },
  {
    id: 32,
    module: "Distribution System Components",
    question: "What is the purpose of a water age analysis in distribution system modeling?",
    options: [
      "To determine the age of the pipes",
      "To track how long water has been in the system, identifying areas with long residence times where disinfectant residual may be depleted and water quality may deteriorate",
      "To determine when pipes need replacement",
      "To track the age of the water treatment plant"
    ],
    correctAnswer: 1,
    explanation: "Water age analysis tracks the time water spends in the distribution system from the treatment plant to the customer. Areas with long water age (dead-ends, low-demand areas, large storage tanks) are prone to: disinfectant residual depletion, nitrification (in chloraminated systems), bacterial regrowth, and taste/odor complaints. Water age analysis identifies problem areas for targeted flushing, looping dead-ends, or adjusting storage tank operations to improve turnover.",
  },
  {
    id: 33,
    module: "Distribution System Components",
    question: "What is the difference between a transmission main and a distribution main?",
    options: [
      "Transmission mains carry treated water; distribution mains carry raw water",
      "Transmission mains are large-diameter pipes that convey water from the source/treatment plant to the distribution system; distribution mains are smaller pipes that deliver water to service connections",
      "Transmission mains are above ground; distribution mains are buried",
      "Transmission mains have higher pressure; distribution mains have lower pressure"
    ],
    correctAnswer: 1,
    explanation: "Transmission mains (also called trunk mains or feeder mains) are large-diameter pipes (typically 300 mm and larger) that convey large volumes of water from treatment plants, reservoirs, or pumping stations to the distribution system. They typically have few or no service connections. Distribution mains (typically 100–300 mm) form the network that delivers water to individual service connections. The distinction affects design criteria, materials, and inspection requirements.",
  },
  {
    id: 34,
    module: "Distribution System Components",
    question: "What is the purpose of a water quality monitoring station in a distribution system?",
    options: [
      "To control water pressure",
      "To continuously or periodically measure water quality parameters (chlorine residual, turbidity, pH) at strategic points to detect water quality deterioration or contamination",
      "To measure flow in the main",
      "To detect pipe leaks"
    ],
    correctAnswer: 1,
    explanation: "Water quality monitoring stations measure parameters like free chlorine residual, turbidity, pH, and temperature at strategic points in the distribution system. They detect: chlorine residual depletion (indicating long water age or high demand), turbidity increases (indicating main breaks or sediment disturbance), and potential contamination events. Continuous online monitoring enables rapid response to water quality events. Monitoring locations are selected based on hydraulic modeling to represent system extremities and vulnerable areas.",
  },
  {
    id: 35,
    module: "Distribution System Components",
    question: "What is the purpose of a cross-connection control program?",
    options: [
      "To prevent pipes from crossing each other",
      "To identify and eliminate or protect against connections between the potable water system and non-potable sources that could allow contamination to enter the drinking water system",
      "To control flow at pipe intersections",
      "To manage pressure at pipe crossings"
    ],
    correctAnswer: 1,
    explanation: "A cross-connection control program identifies and eliminates (or protects against) connections between the potable water system and potential contamination sources (irrigation systems, industrial processes, fire suppression systems with additives, etc.). Backflow preventers (reduced pressure zone devices, double check valves, air gaps) are installed to prevent contamination from entering the potable system through backpressure or backsiphonage. Regular inspection and testing of backflow preventers is required.",
  },
  {
    id: 36,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system flushing program?",
    options: [
      "To test fire hydrants",
      "To remove accumulated sediment, biofilm, and stale water from the distribution system, maintaining water quality and hydraulic capacity",
      "To test pipe pressure",
      "To locate leaks"
    ],
    correctAnswer: 1,
    explanation: "Systematic flushing programs remove accumulated sediment, biofilm, corrosion products, and stale water from distribution mains. Conventional flushing opens hydrants to create high-velocity flow. Unidirectional flushing (UDF) is more effective — it closes valves to create a single flow direction, achieving higher velocities that scour the pipe. Flushing is done seasonally (spring and fall), after main breaks, after new construction, and in response to water quality complaints. Flushed water must be disposed of properly.",
  },
  {
    id: 37,
    module: "Distribution System Components",
    question: "What is the purpose of a pipe condition assessment program?",
    options: [
      "To determine when pipes need cleaning",
      "To evaluate the structural and hydraulic condition of pipes to prioritize rehabilitation or replacement and manage infrastructure risk",
      "To measure water quality in pipes",
      "To locate all buried pipes"
    ],
    correctAnswer: 1,
    explanation: "Pipe condition assessment evaluates the structural integrity (wall thickness, corrosion, cracks) and hydraulic performance (C factor, roughness) of distribution mains to prioritize rehabilitation or replacement. Methods include: CCTV inspection, acoustic leak detection, electromagnetic inspection (for metallic pipes), pipe sampling and coupon analysis, and hydraulic testing. Condition assessment data feeds into asset management plans and capital replacement programs, optimizing infrastructure investment.",
  },
  {
    id: 38,
    module: "Distribution System Components",
    question: "What is the purpose of a water system emergency interconnection?",
    options: [
      "To permanently connect two water systems",
      "To provide a temporary connection between adjacent water systems for emergency water supply when one system experiences a failure or shortage",
      "To share water quality data between systems",
      "To equalize pressure between systems"
    ],
    correctAnswer: 1,
    explanation: "Emergency interconnections provide temporary connections between adjacent water systems, allowing one system to supply water to another during emergencies (drought, source contamination, treatment plant failure, major main break). Interconnections typically include isolation valves, backflow preventers, and metering. They require agreements between utilities regarding water quality, pressure, and billing. Regular testing of interconnections (including flow testing) ensures they will function when needed.",
  },
  {
    id: 39,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system water loss audit?",
    options: [
      "To audit customer billing records",
      "To quantify and categorize all water losses (real losses, apparent losses) to identify cost-effective intervention strategies",
      "To measure water quality losses",
      "To audit pump efficiency"
    ],
    correctAnswer: 1,
    explanation: "A water loss audit (AWWA M36 methodology) quantifies: (1) Real losses — physical leakage from pipes, joints, fittings, and storage tanks; (2) Apparent losses — meter under-registration, billing errors, unauthorized consumption (theft). The audit calculates the Infrastructure Leakage Index (ILI) and identifies cost-effective interventions: active leakage control, pressure management, pipe replacement, meter replacement. Regular audits track progress and justify infrastructure investment.",
  },
  {
    id: 40,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system security vulnerability assessment?",
    options: [
      "To assess physical security of pump stations only",
      "To identify and evaluate threats, vulnerabilities, and consequences to the water system, and develop countermeasures to reduce risk",
      "To assess cybersecurity of SCADA systems only",
      "To assess employee security clearances"
    ],
    correctAnswer: 1,
    explanation: "Security vulnerability assessments (SVAs) identify threats (physical attack, contamination, cyber attack), vulnerabilities (unsecured access points, single points of failure), and consequences (public health impact, service disruption) to the water system. They evaluate existing countermeasures and recommend improvements: physical security (fencing, locks, cameras), operational security (access control, employee screening), and emergency response plans. SVAs are required under federal and provincial regulations for larger water systems.",
  },
  {
    id: 41,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system master plan?",
    options: [
      "To document current system operations",
      "To provide a long-term strategic plan for system expansion, rehabilitation, and improvement based on growth projections, condition assessment, and regulatory requirements",
      "To plan daily operations",
      "To document emergency procedures"
    ],
    correctAnswer: 1,
    explanation: "A distribution system master plan (infrastructure master plan) provides a long-term (20–50 year) strategic framework for system development. It includes: demand projections (population growth, land use), system capacity analysis (hydraulic modeling), condition assessment and remaining useful life, capital improvement program (CIP) with cost estimates, and financing strategy. Master plans guide infrastructure investment decisions, ensuring the system meets future needs while managing costs and risks.",
  },
  {
    id: 42,
    module: "Distribution System Components",
    question: "What is the purpose of a water main pressure test after installation?",
    options: [
      "To test the pump capacity",
      "To verify the integrity of the installed pipe, joints, and fittings before putting the main into service, typically at 1.5 times the maximum operating pressure",
      "To measure the pipe's hydraulic capacity",
      "To test the disinfection system"
    ],
    correctAnswer: 1,
    explanation: "Hydrostatic pressure testing verifies the integrity of newly installed or repaired water mains before they are put into service. The test is typically conducted at 1.5 times the maximum operating pressure (or a minimum of 1,035 kPa / 150 psi) for 2 hours. Acceptable leakage rates are specified in standards (AWWA C600, C605). The test detects defective pipe, joints, fittings, and valves that would leak under operating conditions. Pressure testing is followed by disinfection and bacteriological testing before the main is connected to the distribution system.",
  },
  {
    id: 43,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system SCADA system?",
    options: [
      "To manually control all system components",
      "To remotely monitor and control system components (pumps, valves, storage tanks, pressure) in real-time, enabling efficient operations and rapid response to system events",
      "To bill customers for water use",
      "To analyze water quality data only"
    ],
    correctAnswer: 1,
    explanation: "SCADA (Supervisory Control and Data Acquisition) systems remotely monitor and control distribution system components: pump stations (start/stop, speed control), storage tanks (level monitoring, fill/drain control), pressure reducing valves (setpoint adjustment), and water quality sensors (chlorine, turbidity). SCADA enables: automated pump control based on tank levels, alarm notification for system anomalies, data logging for trend analysis, and remote operation to reduce operator travel. Cybersecurity of SCADA systems is a critical concern.",
  },
  {
    id: 44,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system GIS (Geographic Information System)?",
    options: [
      "To track customer billing",
      "To maintain a spatial database of all system infrastructure (pipes, valves, hydrants, meters, service connections) with attributes, enabling mapping, analysis, and work order management",
      "To model water quality",
      "To control SCADA systems"
    ],
    correctAnswer: 1,
    explanation: "GIS maintains a spatial database of all distribution system assets: pipes (material, diameter, age, condition), valves (type, location, last exercised), hydrants (flow test data), meters (size, age, reading), and service connections. GIS enables: system mapping, hydraulic model integration, work order management, main break analysis, valve isolation analysis (which valves to close for a main break), and infrastructure planning. GIS is the foundation of modern asset management programs.",
  },
  {
    id: 45,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system asset management program?",
    options: [
      "To manage employee assets",
      "To systematically manage infrastructure assets throughout their lifecycle (planning, acquisition, operation, maintenance, rehabilitation, replacement) to minimize lifecycle cost while maintaining acceptable service levels",
      "To manage financial assets",
      "To manage water quality data"
    ],
    correctAnswer: 1,
    explanation: "Asset management programs systematically manage infrastructure throughout its lifecycle: (1) Inventory — what assets exist; (2) Condition — what is their current state; (3) Criticality — what is the consequence of failure; (4) Risk — probability × consequence; (5) Lifecycle cost — total cost of ownership; (6) Levels of service — what performance is required. Asset management optimizes investment decisions, balancing renewal needs against available funding while maintaining service levels and managing risk.",
  },
  {
    id: 46,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system leak detection program?",
    options: [
      "To find leaks only after customer complaints",
      "To proactively locate and repair leaks before they become visible, reducing water loss, preventing infrastructure damage, and avoiding costly emergency repairs",
      "To test pipe pressure",
      "To inspect pipe interiors"
    ],
    correctAnswer: 1,
    explanation: "Active leak detection programs proactively locate leaks using: acoustic methods (listening equipment, correlators that compare sound signals from two points to pinpoint leaks), ground-penetrating radar, tracer gas injection, and district metering (minimum night flow analysis). Proactive leak detection reduces: water loss (revenue), infrastructure damage from soil erosion around leaks, risk of main breaks, and emergency repair costs. Early detection allows planned repairs rather than emergency responses.",
  },
  {
    id: 47,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system corrosion control program?",
    options: [
      "To prevent external corrosion only",
      "To control both internal corrosion (which affects water quality and pipe integrity) and external corrosion (which affects pipe structural integrity) through chemical treatment, cathodic protection, and pipe lining",
      "To prevent pipe scaling only",
      "To control biological growth only"
    ],
    correctAnswer: 1,
    explanation: "Corrosion control programs address both internal and external corrosion: Internal corrosion — pH adjustment (maintaining pH 7.5–8.5), alkalinity control, corrosion inhibitors (orthophosphate, silicate), and pipe lining (cement mortar, epoxy) protect pipe interiors and prevent lead/copper leaching from plumbing; External corrosion — cathodic protection (sacrificial anodes, impressed current) and protective coatings protect buried metallic pipes from soil corrosion. Lead and Copper Rule compliance requires effective corrosion control.",
  },
  {
    id: 48,
    module: "Distribution System Components",
    question: "What is the purpose of a water system interconnection agreement?",
    options: [
      "To share infrastructure costs",
      "To define the terms and conditions for water supply between two adjacent utilities, including water quality, quantity, pressure, billing, and emergency provisions",
      "To merge two water utilities",
      "To share customer data"
    ],
    correctAnswer: 1,
    explanation: "Interconnection agreements define the terms for water exchange between adjacent utilities: water quality standards (the receiving utility must accept the supplied water), quantity limits (maximum flow rates), pressure requirements (minimum delivery pressure), billing rates, metering responsibilities, emergency provisions (conditions for emergency supply), and operational protocols. Agreements protect both parties and ensure that interconnections are used appropriately and that water quality is maintained.",
  },
  {
    id: 49,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system water quality sampling plan?",
    options: [
      "To satisfy regulatory requirements only",
      "To systematically collect and analyze water samples from representative locations throughout the system to verify compliance with drinking water standards and detect water quality problems",
      "To test water at the treatment plant only",
      "To test water at customer complaints only"
    ],
    correctAnswer: 1,
    explanation: "A distribution system sampling plan identifies: sampling locations (representative of the system, including extremities, high-risk areas, and regulatory compliance points), sampling frequency (based on population served and regulatory requirements), parameters to test (total coliform, E. coli, chlorine residual, lead, copper, DBPs), and response protocols (what to do if results are unsatisfactory). Sampling plans must meet regulatory requirements (Safe Drinking Water Act, provincial regulations) and be reviewed regularly.",
  },
  {
    id: 50,
    module: "Distribution System Components",
    question: "What is the purpose of a distribution system emergency response plan (ERP)?",
    options: [
      "To document routine operations",
      "To provide pre-planned procedures for responding to emergencies (main breaks, contamination events, power failures, natural disasters) to minimize public health risk and restore service quickly",
      "To plan capital improvements",
      "To document water quality standards"
    ],
    correctAnswer: 1,
    explanation: "Emergency response plans (ERPs) provide pre-planned procedures for responding to water system emergencies: main breaks (isolation, repair, service restoration), contamination events (boil water advisories, do not use orders, flushing), power failures (generator operation, pump prioritization), natural disasters (flood, earthquake response), and cyber attacks. ERPs include: contact lists, decision trees, public notification procedures, and resource lists. Regular exercises (tabletop and full-scale) test and improve ERPs.",
  },

  // ─── MODULE 2: Equipment Installation, O&M & Repair (40 questions) ──────────
  {
    id: 51,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump curve (head-capacity curve)?",
    options: [
      "To show the pump's power consumption at different speeds",
      "To show the relationship between pump head (pressure) and flow rate, used to determine the operating point where the pump curve intersects the system curve",
      "To show the pump's efficiency at different temperatures",
      "To show the pump's wear rate over time"
    ],
    correctAnswer: 1,
    explanation: "A pump curve shows the relationship between total dynamic head (TDH) and flow rate (Q) for a specific pump at a given speed. As flow increases, head decreases. The operating point is where the pump curve intersects the system curve (which shows the head required to overcome friction and static head at different flow rates). The pump curve also shows efficiency and power consumption at each operating point. Understanding pump curves is essential for proper pump selection and troubleshooting.",
  },
  {
    id: 52,
    module: "Equipment Installation, O&M & Repair",
    question: "What is cavitation in a centrifugal pump and what causes it?",
    options: [
      "Excessive vibration caused by unbalanced impeller",
      "Formation and collapse of vapor bubbles in the pump due to local pressure dropping below the vapor pressure of water, causing noise, vibration, and impeller damage",
      "Corrosion of the pump casing from aggressive water",
      "Air entrainment in the suction line"
    ],
    correctAnswer: 1,
    explanation: "Cavitation occurs when local pressure in the pump drops below the vapor pressure of water, causing water to vaporize and form bubbles. When these bubbles move to higher-pressure regions, they collapse violently, causing: noise (crackling/popping), vibration, reduced pump performance, and severe impeller damage (pitting). Causes: insufficient NPSH (Net Positive Suction Head), high suction lift, high water temperature, partially closed suction valve, clogged suction strainer, or operating far from the pump's best efficiency point (BEP).",
  },
  {
    id: 53,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a variable frequency drive (VFD) on a distribution pump?",
    options: [
      "To protect the motor from power surges",
      "To vary the pump speed to match system demand, maintaining constant pressure while reducing energy consumption and water hammer",
      "To measure pump flow rate",
      "To provide backup power during outages"
    ],
    correctAnswer: 1,
    explanation: "Variable frequency drives (VFDs) vary pump motor speed by changing the frequency of the electrical supply. Benefits: (1) Pressure control — maintain constant system pressure regardless of demand fluctuations; (2) Energy savings — pump power varies with the cube of speed (reducing speed by 20% reduces power by ~50%); (3) Reduced water hammer — gradual speed changes eliminate sudden pressure surges; (4) Reduced mechanical wear — soft starts and stops reduce stress on pump and motor. VFDs are the most common method of pump control in modern distribution systems.",
  },
  {
    id: 54,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station wet well?",
    options: [
      "To treat water before pumping",
      "To provide a buffer volume of water that allows the pump to operate efficiently without short-cycling (starting and stopping too frequently)",
      "To store water for emergency use",
      "To allow sediment to settle before pumping"
    ],
    correctAnswer: 1,
    explanation: "A wet well provides buffer storage that prevents pump short-cycling (frequent starts and stops). Short-cycling causes: motor overheating, increased wear on motor contactors and bearings, and water hammer from frequent starts/stops. The wet well volume is sized to provide a minimum cycle time (typically 10–15 minutes between starts) based on pump flow rate and inflow rate. Wet well level sensors (float switches, pressure transducers, ultrasonic sensors) control pump operation.",
  },
  {
    id: 55,
    module: "Equipment Installation, O&M & Repair",
    question: "Calculate the total dynamic head (TDH) for a pump with: static head = 30 m, friction losses = 8 m, velocity head = 0.5 m.",
    options: [
      "30 m",
      "38 m",
      "38.5 m",
      "40 m"
    ],
    correctAnswer: 2,
    explanation: "TDH = Static head + Friction losses + Velocity head = 30 + 8 + 0.5 = 38.5 m. Static head is the elevation difference between suction and discharge water levels. Friction losses include pipe friction (Hazen-Williams or Darcy-Weisbach), fittings, valves, and meter losses. Velocity head is usually small and sometimes neglected. TDH determines the pump head required and is used with the pump curve to find the operating point.",
    isCalc: true,
    steps: [
      { l: "Identify components of TDH", c: "TDH = Static head + Friction losses + Velocity head" },
      { l: "Sum the components", c: "TDH = 30 m + 8 m + 0.5 m = 38.5 m" },
    ],
  },
  {
    id: 56,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a mechanical seal on a centrifugal pump?",
    options: [
      "To seal the pump casing to prevent external leakage",
      "To prevent water from leaking along the pump shaft where it exits the casing, while allowing the shaft to rotate",
      "To seal the suction and discharge flanges",
      "To prevent air from entering the pump"
    ],
    correctAnswer: 1,
    explanation: "Mechanical seals prevent water from leaking along the rotating pump shaft where it exits the casing. They consist of two flat faces (one rotating with the shaft, one stationary) held together by spring pressure and hydraulic pressure, with a thin film of water providing lubrication and cooling. Mechanical seals replaced traditional packing glands (which required periodic adjustment and allowed a controlled drip). Mechanical seal failure causes: excessive leakage, loss of prime, and pump damage. Seals must never run dry.",
  },
  {
    id: 57,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station emergency generator?",
    options: [
      "To provide power during peak demand periods",
      "To provide backup electrical power to maintain pump station operation during utility power failures, ensuring continued water supply",
      "To reduce electricity costs",
      "To power SCADA systems only"
    ],
    correctAnswer: 1,
    explanation: "Emergency generators provide backup power to pump stations during utility power failures, maintaining water supply and system pressure. Generators are sized to power critical loads: pumps, controls, lighting, HVAC, and SCADA. They start automatically on power failure (automatic transfer switch) and must be tested regularly (monthly load testing, annual full-load testing). Fuel supply must be adequate for the expected outage duration. Generator maintenance includes: oil changes, filter replacement, battery testing, and coolant checks.",
  },
  {
    id: 58,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pressure relief valve on a pump discharge line?",
    options: [
      "To control normal operating pressure",
      "To protect the pump, motor, and piping from excessive pressure caused by sudden valve closure or pump startup against a closed valve",
      "To release air from the discharge line",
      "To measure discharge pressure"
    ],
    correctAnswer: 1,
    explanation: "Pressure relief valves (PRVs) on pump discharge lines open automatically when pressure exceeds a set point, protecting the system from overpressure damage. They are used to: protect against water hammer from sudden valve closure, prevent damage if a pump starts against a closed discharge valve, and protect the system during power failures when check valves slam shut. Relief valves discharge to a safe location (drain, wet well) and must be sized to handle the full pump flow.",
  },
  {
    id: 59,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station flow meter?",
    options: [
      "To control pump speed",
      "To measure the volume of water pumped for operational monitoring, billing, and water loss calculations",
      "To detect leaks in the pump station",
      "To measure water quality"
    ],
    correctAnswer: 1,
    explanation: "Flow meters at pump stations measure the volume of water pumped, providing data for: operational monitoring (verifying pump performance against design specifications), energy efficiency analysis (flow per unit of energy), water loss calculations (comparing pumped volume to billed volume), and billing (for wholesale water supply). Common meter types: magnetic flow meters (electromagnetic, no moving parts, accurate for conductive fluids), ultrasonic meters (clamp-on for existing pipes), and turbine meters.",
  },
  {
    id: 60,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station confined space entry procedure?",
    options: [
      "To ensure proper lighting in the pump station",
      "To protect workers from hazards (oxygen deficiency, toxic gases, engulfment) when entering confined spaces such as wet wells and valve vaults",
      "To prevent unauthorized access",
      "To document pump maintenance activities"
    ],
    correctAnswer: 1,
    explanation: "Confined space entry procedures protect workers from hazards in spaces not designed for continuous occupancy: oxygen deficiency (from decomposition, displacement by other gases), toxic gases (H₂S from sewage, CO from generators), flammable gases, and engulfment. Procedures include: atmospheric testing (O₂, LEL, H₂S, CO) before and during entry, ventilation, personal protective equipment, attendant outside the space, rescue equipment, and emergency procedures. Confined space entry is regulated under provincial occupational health and safety regulations.",
  },
  {
    id: 61,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a valve exercising program?",
    options: [
      "To test valve pressure ratings",
      "To regularly operate (turn) valves to prevent them from seizing in the open or closed position, ensuring they can be operated when needed for isolation",
      "To measure valve flow coefficients",
      "To inspect valve interiors"
    ],
    correctAnswer: 1,
    explanation: "Valve exercising programs regularly operate all distribution valves (typically annually or biannually) to: prevent valves from seizing in the open position due to corrosion, mineral deposits, or biological growth; verify that valves can be fully closed when needed for isolation; identify valves that need repair or replacement; and update GIS records with valve condition information. Exercising involves turning the valve through its full range and returning it to the open position. Records should document date, turns required, and condition.",
  },
  {
    id: 62,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a fire hydrant flow test?",
    options: [
      "To test the hydrant for leaks",
      "To measure the available fire flow (flow rate and residual pressure) at a specific location in the distribution system for fire protection planning and hydraulic model calibration",
      "To flush the hydrant",
      "To test the hydrant valve operation"
    ],
    correctAnswer: 1,
    explanation: "Fire hydrant flow tests measure the available fire flow at specific locations: a static pressure reading (no flow), a pitot gauge reading at the flowing hydrant (to calculate flow), and a residual pressure reading at a nearby hydrant. Results are used for: fire protection planning (verifying adequate fire flow), hydraulic model calibration (comparing measured to modeled flows), and identifying system deficiencies. Flow tests should be conducted during peak demand periods for worst-case analysis. Results are plotted on flow curves for fire department use.",
  },
  {
    id: 63,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a water main disinfection procedure after repair or new installation?",
    options: [
      "To test the pipe pressure",
      "To kill any bacteria introduced during construction or repair before the main is returned to service, preventing contamination of the distribution system",
      "To flush sediment from the pipe",
      "To test the pipe for leaks"
    ],
    correctAnswer: 1,
    explanation: "Water main disinfection (AWWA C651) kills bacteria introduced during construction or repair. Methods: (1) Continuous feed — fill the main with chlorinated water (25–50 mg/L free chlorine) and hold for 24 hours; (2) Slug method — a high-concentration slug (100+ mg/L) is pushed through the main; (3) Tablet method — calcium hypochlorite tablets are placed in the pipe during installation. After disinfection, the main is flushed, and bacteriological samples are collected. The main cannot be returned to service until samples pass (no total coliform detected).",
  },
  {
    id: 64,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump impeller wear ring?",
    options: [
      "To seal the pump shaft",
      "To maintain a close clearance between the impeller and casing, reducing recirculation (internal leakage) from the high-pressure discharge side back to the low-pressure suction side",
      "To protect the impeller from cavitation",
      "To balance the impeller hydraulically"
    ],
    correctAnswer: 1,
    explanation: "Wear rings (also called clearance rings or sealing rings) maintain a close clearance between the rotating impeller and the stationary casing, minimizing internal recirculation (leakage from high-pressure discharge back to low-pressure suction). As wear rings erode, the clearance increases, reducing pump efficiency and capacity. Wear rings are replaceable, allowing the pump to be restored to original performance without replacing the impeller or casing. Excessive wear ring clearance causes: reduced flow, reduced head, and increased power consumption.",
  },
  {
    id: 65,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station ventilation system?",
    options: [
      "To cool the water being pumped",
      "To remove heat generated by motors and equipment, control humidity, dilute any toxic or flammable gases, and maintain safe working conditions",
      "To provide fresh air for the pumps",
      "To prevent condensation on electrical equipment only"
    ],
    correctAnswer: 1,
    explanation: "Pump station ventilation serves multiple purposes: (1) Heat removal — motors and equipment generate heat that must be removed to prevent overheating; (2) Humidity control — prevents condensation on electrical equipment; (3) Gas dilution — removes any toxic (H₂S, CO) or flammable gases that may accumulate; (4) Safe working conditions — maintains adequate oxygen levels and comfortable temperatures for workers. Ventilation requirements depend on equipment heat load, space volume, and potential gas sources. Explosion-proof fans are required where flammable gases may be present.",
  },
  {
    id: 66,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station electrical panel lockout/tagout (LOTO) procedure?",
    options: [
      "To prevent unauthorized access to the electrical panel",
      "To isolate energy sources (electrical, hydraulic, pneumatic) before performing maintenance on equipment, preventing accidental energization and injury",
      "To document electrical maintenance",
      "To test electrical circuits"
    ],
    correctAnswer: 1,
    explanation: "Lockout/tagout (LOTO) procedures isolate all energy sources before maintenance: electrical (circuit breakers locked in the off position), hydraulic (valves closed and locked), pneumatic (pressure relieved and locked), and gravity (equipment blocked). Each worker applies their own lock, ensuring the equipment cannot be energized until all workers remove their locks. LOTO prevents accidental energization that could cause electrocution, crushing, or other serious injuries. LOTO is required by provincial occupational health and safety regulations.",
  },
  {
    id: 67,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station maintenance log?",
    options: [
      "To satisfy regulatory requirements only",
      "To document all maintenance activities, inspections, repairs, and operational changes, providing a history that supports troubleshooting, warranty claims, and regulatory compliance",
      "To track employee hours",
      "To document water quality results"
    ],
    correctAnswer: 1,
    explanation: "Maintenance logs document: scheduled maintenance (oil changes, filter replacements, inspections), corrective maintenance (repairs, parts replaced), operational changes (setpoint adjustments, control changes), and abnormal events (alarms, failures). Good records support: troubleshooting (identifying recurring problems), warranty claims (documenting manufacturer-required maintenance), regulatory compliance (demonstrating proper O&M), and asset management (tracking maintenance history for replacement planning). Electronic maintenance management systems (CMMS) are increasingly used.",
  },
  {
    id: 68,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a water main hot tap (wet tap)?",
    options: [
      "To repair a leaking main under pressure",
      "To make a new connection to an existing pressurized water main without shutting off the main, using a tapping machine and tapping sleeve",
      "To test the main pressure",
      "To install a valve in an existing main"
    ],
    correctAnswer: 1,
    explanation: "A hot tap (wet tap) allows a new connection to be made to an existing pressurized main without shutting off service. The process: install a tapping sleeve (with a gate valve) around the existing pipe, connect the tapping machine to the valve, open the valve, drill through the pipe with the tapping machine, retract the drill, close the valve, and remove the tapping machine. Hot taps are used for new service connections, main extensions, and installing valves in existing mains. They require specialized equipment and trained operators.",
  },
  {
    id: 69,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pipe coupling (repair clamp) for emergency main repairs?",
    options: [
      "To permanently repair a broken main",
      "To quickly stop leakage from a pipe break or crack, allowing service to be restored while a permanent repair is planned",
      "To connect pipes of different materials",
      "To reduce pressure at a repair point"
    ],
    correctAnswer: 1,
    explanation: "Repair clamps (also called repair couplings or pipe clamps) are used for emergency repairs to stop leakage from pipe breaks, cracks, and joint failures. They consist of a rubber gasket and metal shell that clamp around the pipe, sealing the leak. Repair clamps are not permanent solutions — they are used to restore service quickly while a permanent repair (pipe replacement, joint repair) is planned. They must be rated for the operating pressure and compatible with the pipe material.",
  },
  {
    id: 70,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station automatic transfer switch (ATS)?",
    options: [
      "To switch between different pump speeds",
      "To automatically switch the electrical supply from the utility power to the emergency generator when utility power fails, and back to utility power when it is restored",
      "To transfer water between storage tanks",
      "To switch between different pump stations"
    ],
    correctAnswer: 1,
    explanation: "An automatic transfer switch (ATS) monitors utility power and automatically switches to the emergency generator when utility power fails (typically within 10–30 seconds). When utility power is restored, the ATS transfers back to utility power and shuts down the generator. The ATS ensures continuous pump station operation during power outages without requiring operator intervention. ATS units must be tested regularly (monthly) to verify proper operation. Some ATS units include a time delay to prevent nuisance transfers during momentary power fluctuations.",
  },
  {
    id: 71,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station SCADA alarm system?",
    options: [
      "To document routine operations",
      "To alert operators to abnormal conditions (pump failures, high/low pressure, high/low tank levels, power failures, security breaches) requiring immediate attention",
      "To control pump speed",
      "To measure water quality"
    ],
    correctAnswer: 1,
    explanation: "SCADA alarm systems alert operators to abnormal conditions that require attention: pump failures (motor overload, high temperature, seal failure), pressure alarms (high pressure, low pressure), tank level alarms (high level, low level), power failure, generator failure, security alarms (door open, motion detected), and water quality alarms (low chlorine, high turbidity). Alarms are prioritized by severity (critical, high, low). Alarm management includes: alarm rationalization (eliminating nuisance alarms), escalation procedures, and documentation of alarm responses.",
  },
  {
    id: 72,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump efficiency test?",
    options: [
      "To verify the pump is operating safely",
      "To measure actual pump performance (flow, head, power) and compare to the design pump curve, identifying performance degradation that indicates wear or damage",
      "To test the pump motor",
      "To verify pump installation"
    ],
    correctAnswer: 1,
    explanation: "Pump efficiency tests measure actual pump performance: flow rate (using a calibrated flow meter), total dynamic head (using pressure gauges at suction and discharge), and power consumption (using a power meter). Comparing measured performance to the original pump curve identifies: wear ring erosion (reduced flow and head), impeller wear (reduced efficiency), cavitation damage, and motor problems. Efficiency testing is typically done annually or when performance problems are suspected. Significant efficiency loss justifies pump rehabilitation or replacement.",
  },
  {
    id: 73,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a water main pipe bursting technique?",
    options: [
      "To test pipe pressure to failure",
      "To replace an existing deteriorated pipe by inserting a bursting head that fractures the old pipe outward while simultaneously pulling in a new pipe of equal or larger diameter",
      "To clean the pipe interior",
      "To inspect the pipe interior"
    ],
    correctAnswer: 1,
    explanation: "Pipe bursting is a trenchless pipe replacement method: a bursting head (expander) is pulled through the existing pipe, fracturing it outward into the surrounding soil, while simultaneously pulling in a new HDPE pipe. Benefits: minimal excavation (only launch and reception pits), can upsize the pipe, faster than open-cut replacement, and less disruption to traffic and services. Limitations: not suitable for all soil conditions, cannot be used with some pipe materials (reinforced concrete), and requires adequate clearance for the displaced soil.",
  },
  {
    id: 74,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a cured-in-place pipe (CIPP) lining for water mains?",
    options: [
      "To increase pipe diameter",
      "To rehabilitate deteriorated pipes by inserting a resin-impregnated liner that is cured in place, creating a new structural pipe within the existing pipe",
      "To clean the pipe interior",
      "To add cathodic protection to the pipe"
    ],
    correctAnswer: 1,
    explanation: "CIPP lining rehabilitates deteriorated pipes without excavation: a felt tube impregnated with thermosetting resin is inverted or pulled into the existing pipe, then cured (using hot water, steam, or UV light) to form a rigid, structural pipe within the existing pipe. Benefits: restores structural integrity, eliminates leaks and infiltration, improves hydraulic performance (smooth interior), and extends pipe life by 50+ years. Limitations: reduces pipe diameter slightly, requires cleaning and CCTV inspection before lining, and is not suitable for severely deformed pipes.",
  },
  {
    id: 75,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station preventive maintenance (PM) program?",
    options: [
      "To repair equipment after it fails",
      "To perform scheduled maintenance activities (lubrication, filter replacement, inspections, testing) at defined intervals to prevent failures and extend equipment life",
      "To document equipment history only",
      "To train new operators"
    ],
    correctAnswer: 1,
    explanation: "Preventive maintenance (PM) programs perform scheduled maintenance before failures occur: lubrication (bearings, seals), filter replacement (air, oil, strainer), belt and coupling inspection, electrical testing (insulation resistance, motor current), vibration analysis, and operational testing (pump performance, valve operation, generator testing). PM prevents: unexpected failures that interrupt service, secondary damage from neglected maintenance, and costly emergency repairs. PM programs are documented in a CMMS (Computerized Maintenance Management System) that schedules and tracks all maintenance activities.",
  },
  {
    id: 76,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump bearing lubrication schedule?",
    options: [
      "To prevent rust on the bearing housing",
      "To maintain a lubricant film between bearing surfaces, reducing friction, heat, and wear to extend bearing life",
      "To cool the motor",
      "To prevent water from entering the bearing"
    ],
    correctAnswer: 1,
    explanation: "Bearing lubrication maintains a film of oil or grease between rolling elements and races, reducing: friction (heat generation), wear (metal-to-metal contact), and noise. Over-lubrication is as harmful as under-lubrication — excess grease causes churning, heat buildup, and seal damage. Lubrication intervals depend on bearing size, speed, load, and temperature. Manufacturers specify grease type, quantity, and interval. Oil-lubricated bearings require periodic oil changes and level checks. Bearing failure is a leading cause of pump downtime.",
  },
  {
    id: 77,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station security system?",
    options: [
      "To monitor employee attendance",
      "To detect and deter unauthorized access to pump stations, protecting critical infrastructure from vandalism, theft, and intentional contamination",
      "To monitor water quality",
      "To control pump operations remotely"
    ],
    correctAnswer: 1,
    explanation: "Pump station security systems protect critical infrastructure: physical security (fencing, locked doors, tamper-resistant hardware), intrusion detection (motion sensors, door contacts, cameras), access control (key cards, keypads, biometrics), and alarm notification (to operators and security services). Security is required by provincial regulations and is part of vulnerability assessments. Security measures must be balanced with operational needs (emergency access) and maintained regularly (testing cameras, testing alarms, reviewing access logs).",
  },
  {
    id: 78,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station sump pump?",
    options: [
      "To pump water from the wet well",
      "To remove groundwater and drainage that accumulates in the pump station floor drain or sump, preventing flooding and maintaining a dry working environment",
      "To provide emergency water supply",
      "To test the main pumps"
    ],
    correctAnswer: 1,
    explanation: "Sump pumps remove water that accumulates in the pump station from: groundwater infiltration (through floor cracks, wall penetrations), condensation, equipment drains, and spills. Without sump pumps, water accumulation would: create slip hazards, damage electrical equipment, promote corrosion, and create unsafe working conditions. Sump pumps are typically small submersible pumps that activate automatically when the sump level reaches a set point. They discharge to a storm sewer or drainage ditch (not to the sanitary sewer without approval).",
  },
  {
    id: 79,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pipe joint restraint system?",
    options: [
      "To prevent pipe movement due to thermal expansion",
      "To prevent pipe joints from separating under internal pressure, soil movement, or external loads, particularly at bends, tees, and dead-ends where thrust forces act",
      "To align pipes during installation",
      "To seal pipe joints against leakage"
    ],
    correctAnswer: 1,
    explanation: "Joint restraint systems prevent pipe joints from separating under: internal pressure (thrust forces at bends, tees, dead-ends), soil movement (settlement, frost heave), and external loads (traffic, construction). Methods: thrust blocks (concrete bearing against soil), restrained joints (mechanical locking devices on push-on or mechanical joints), and tie rods (steel rods connecting fittings). Restrained joints are preferred in poor soil conditions, high water tables, and where thrust blocks cannot be used. The length of restrained pipe required depends on pipe diameter, pressure, and soil friction.",
  },
  {
    id: 80,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pipe inspection using acoustic leak detection?",
    options: [
      "To inspect pipe interior condition",
      "To locate leaks by detecting the sound of water escaping from the pipe, using listening equipment (geophones, hydrophones) or correlators that compare sounds at two points to pinpoint leak location",
      "To measure pipe flow",
      "To detect corrosion on the pipe exterior"
    ],
    correctAnswer: 1,
    explanation: "Acoustic leak detection locates leaks by detecting the sound of water escaping from the pipe: (1) Listening equipment (geophones, hydrophones) — operators walk the pipe route listening for leak sounds at valve boxes, hydrants, and the ground surface; (2) Correlators — electronic devices placed at two points (valves, hydrants) that compare the time delay of the leak sound to calculate the leak location. Acoustic methods work best on metallic pipes (good sound transmission) and are less effective on plastic pipes (poor sound transmission) and large-diameter pipes.",
  },
  {
    id: 81,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station energy audit?",
    options: [
      "To measure water quality",
      "To evaluate energy consumption and identify opportunities to reduce energy costs through operational changes, equipment upgrades, or tariff optimization",
      "To audit employee energy use",
      "To measure pump flow rates"
    ],
    correctAnswer: 1,
    explanation: "Energy audits evaluate pump station energy consumption: pump efficiency (comparing actual to design), motor efficiency (rewound motors lose efficiency), VFD performance, operating schedule optimization (pumping during off-peak rate periods), and system hydraulics (reducing unnecessary head losses). Energy is typically the largest operating cost for distribution systems. Improvements can include: VFD installation, pump impeller trimming, motor replacement with premium efficiency motors, and operational scheduling changes. Energy audits identify the most cost-effective improvements.",
  },
  {
    id: 82,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a water main pipe lining with cement mortar?",
    options: [
      "To increase pipe diameter",
      "To protect the pipe interior from corrosion and tuberculation, maintain water quality, and restore hydraulic capacity in older metallic pipes",
      "To repair structural defects",
      "To add cathodic protection"
    ],
    correctAnswer: 1,
    explanation: "Cement mortar lining (CML) protects metallic pipe interiors from corrosion and tuberculation: the alkaline environment (high pH) of cement mortar inhibits iron corrosion, preventing red water complaints and maintaining water quality. CML also restores hydraulic capacity in tuberculated pipes (increasing C factor from 80 to 120+). Application methods: centrifugal application (spinning the pipe during manufacturing), or in-situ application (inserting a lining machine into existing pipes). CML is standard for new ductile iron pipe and can be applied to existing pipes during rehabilitation.",
  },
  {
    id: 83,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station motor insulation resistance test (megger test)?",
    options: [
      "To measure motor speed",
      "To measure the electrical insulation resistance of the motor windings, detecting moisture, contamination, or deterioration that could lead to motor failure",
      "To measure motor power consumption",
      "To test the motor starter"
    ],
    correctAnswer: 1,
    explanation: "Megger (insulation resistance) tests apply a high DC voltage (typically 500–1000V) to the motor windings and measure the resistance to ground. Low insulation resistance indicates: moisture in the windings, contaminated insulation, or deteriorated insulation that could cause a ground fault or motor failure. Minimum acceptable resistance varies with motor voltage and size. Trending insulation resistance over time detects gradual deterioration. Megger tests should be performed before commissioning new motors, after extended storage, and as part of annual maintenance.",
  },
  {
    id: 84,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pipe replacement program?",
    options: [
      "To replace all pipes on a fixed schedule",
      "To systematically replace pipes that have reached the end of their useful life based on condition assessment, break history, and criticality, optimizing infrastructure investment",
      "To replace pipes that have failed",
      "To replace pipes with better materials"
    ],
    correctAnswer: 1,
    explanation: "Pipe replacement programs systematically replace pipes based on: condition assessment (remaining wall thickness, structural integrity), break history (pipes with multiple breaks are prioritized), water quality impacts (lead pipes, tuberculated iron pipes), hydraulic performance (undersized pipes), and criticality (consequence of failure). Replacement programs are developed as part of asset management plans, with long-term capital budgets. Replacement rates must keep pace with pipe aging to avoid a growing backlog of deteriorated infrastructure.",
  },
  {
    id: 85,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station vibration analysis?",
    options: [
      "To measure water hammer in the discharge line",
      "To detect mechanical problems (bearing wear, impeller imbalance, misalignment, cavitation) by measuring and analyzing vibration signatures of rotating equipment",
      "To measure pipe vibration",
      "To test pump speed"
    ],
    correctAnswer: 1,
    explanation: "Vibration analysis detects mechanical problems in rotating equipment before they cause failures: bearing wear (characteristic frequency signatures), impeller imbalance (1× running speed vibration), misalignment (2× running speed, axial vibration), cavitation (broadband high-frequency vibration), and resonance. Vibration is measured with accelerometers at bearing housings and compared to baseline measurements and ISO vibration severity standards. Trending vibration levels over time detects gradual deterioration. Vibration analysis is a key predictive maintenance technique.",
  },
  {
    id: 86,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a distribution system pipe condition assessment using electromagnetic inspection?",
    options: [
      "To locate buried pipes",
      "To measure the remaining wall thickness of metallic pipes from the inside, detecting corrosion pits and wall loss that indicate structural deterioration",
      "To detect water quality problems",
      "To measure pipe diameter"
    ],
    correctAnswer: 1,
    explanation: "Electromagnetic (EM) inspection tools (SmartBall, Sahara, PipeDiver) are inserted into pressurized pipes and travel with the flow, measuring wall thickness using electromagnetic or acoustic methods. They detect: corrosion pits, wall loss (internal and external), and graphitization (in cast iron pipes). EM inspection provides a condition profile of the entire pipe length, enabling prioritized rehabilitation or replacement. Unlike CCTV (which only shows the pipe interior surface), EM inspection detects subsurface defects that are not visible.",
  },
  {
    id: 87,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station chemical feed system?",
    options: [
      "To add chemicals to the pumped water for treatment",
      "To add corrosion inhibitors, disinfectants, or pH adjustment chemicals to the water at the pump station to maintain water quality in the distribution system",
      "To clean the pump station equipment",
      "To treat wastewater from the pump station"
    ],
    correctAnswer: 1,
    explanation: "Chemical feed systems at pump stations add: corrosion inhibitors (orthophosphate to prevent lead/copper leaching), disinfectants (chlorine, chloramine to maintain residual in the distribution system), pH adjustment chemicals (lime, caustic soda to control corrosivity), and fluoride (for dental health). Chemical feed systems include: chemical storage tanks, metering pumps (peristaltic, diaphragm), flow pacing (adjusting dose based on flow rate), and safety equipment (spill containment, emergency eyewash). Chemical dosing must be carefully controlled to maintain target residuals.",
  },
  {
    id: 88,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station remote monitoring system?",
    options: [
      "To replace on-site operators",
      "To allow operators to monitor pump station status (pump operation, tank levels, pressures, alarms) from a central location or mobile device, enabling rapid response to problems",
      "To control pump stations from the treatment plant",
      "To measure water quality remotely"
    ],
    correctAnswer: 1,
    explanation: "Remote monitoring systems (SCADA, telemetry) allow operators to monitor and control pump stations from a central control room or mobile devices: pump status (running, stopped, fault), tank levels, system pressures, flow rates, water quality (chlorine, turbidity), and alarms. Remote monitoring enables: reduced operator travel (fewer site visits required), faster alarm response (immediate notification vs. next scheduled visit), operational optimization (adjusting pump schedules remotely), and data logging for trend analysis. Cybersecurity of remote monitoring systems is critical.",
  },
  {
    id: 89,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a water main pipe coupon analysis?",
    options: [
      "To measure pipe flow capacity",
      "To analyze the physical and chemical condition of a pipe sample (coupon) removed from service, assessing corrosion, tuberculation, wall loss, and material properties",
      "To test pipe pressure rating",
      "To measure pipe diameter"
    ],
    correctAnswer: 1,
    explanation: "Pipe coupon analysis involves removing a section of pipe from service and conducting laboratory analysis: wall thickness measurement (remaining vs. original), corrosion pit depth and distribution, tuberculation characterization, material identification (pipe material, lining condition), microbiological analysis (biofilm, nitrifying bacteria), and mechanical testing (tensile strength, hardness). Coupon analysis provides detailed condition information that cannot be obtained from non-destructive inspection, supporting pipe replacement decisions and understanding of corrosion mechanisms.",
  },
  {
    id: 90,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station cathodic protection system?",
    options: [
      "To protect the pump from corrosion inside",
      "To protect buried metallic components (pipes, fittings, pump casings) from external corrosion by making them the cathode in an electrochemical cell",
      "To protect the pump station building",
      "To protect electrical equipment from corrosion"
    ],
    correctAnswer: 1,
    explanation: "Cathodic protection systems protect buried metallic components from external corrosion: sacrificial anode systems (zinc or magnesium anodes connected to the structure) or impressed current systems (DC power source driving current from an inert anode through the soil to the structure). Cathodic protection is particularly important in corrosive soils (high conductivity, low pH, high moisture) and for structures near DC transit systems (stray current corrosion). Regular monitoring (pipe-to-soil potential measurements) verifies adequate protection.",
  },

  // ─── MODULE 3: Water Quality Monitoring & Lab (30 questions) ────────────────
  {
    id: 91,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring free chlorine residual in the distribution system?",
    options: [
      "To determine the dose of chlorine added at the treatment plant",
      "To verify that adequate disinfectant is present throughout the distribution system to prevent bacterial regrowth and provide a barrier against contamination",
      "To measure water taste and odor",
      "To detect lead contamination"
    ],
    correctAnswer: 1,
    explanation: "Free chlorine residual measurements verify that adequate disinfectant is present throughout the distribution system. Minimum residual requirements vary by jurisdiction (typically 0.1–0.2 mg/L at the system extremities). Low or absent residual indicates: excessive chlorine demand (from biofilm, organic matter, or long water age), dilution from an undetected contamination event, or a distribution system problem. Residual is measured using DPD colorimetric methods or amperometric titration. Results guide operational decisions (booster chlorination, flushing).",
  },
  {
    id: 92,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a coliform bacteria test in the distribution system?",
    options: [
      "To measure water turbidity",
      "To detect the presence of total coliform bacteria (indicator organisms) that suggest fecal contamination or inadequate disinfection in the distribution system",
      "To measure chlorine residual",
      "To detect lead and copper"
    ],
    correctAnswer: 1,
    explanation: "Total coliform bacteria are indicator organisms — their presence suggests potential fecal contamination (from sewage intrusion, cross-connections, or inadequate disinfection). E. coli (a subset of total coliform) specifically indicates fecal contamination. Regulatory requirements: most jurisdictions require zero total coliform in distribution system samples (with specific action levels for repeat samples). Positive results trigger: repeat sampling, investigation of the source, corrective action (flushing, superchlorination), and public notification if required.",
  },
  {
    id: 93,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring turbidity in the distribution system?",
    options: [
      "To measure water temperature",
      "To detect disturbances in the distribution system (main breaks, flushing, sediment resuspension) that increase particle levels and may indicate water quality problems",
      "To measure chlorine residual",
      "To detect bacterial contamination"
    ],
    correctAnswer: 1,
    explanation: "Distribution system turbidity measurements detect: main breaks (sudden turbidity increase), sediment resuspension (from high-velocity flow or flushing), corrosion products (iron, manganese), and potential contamination events. High turbidity can: interfere with disinfection (particles shield bacteria from chlorine), cause aesthetic complaints (discolored water), and indicate system disturbances. Online turbidity monitors provide continuous monitoring at strategic locations. Turbidity is measured in NTU (Nephelometric Turbidity Units).",
  },
  {
    id: 94,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring pH in the distribution system?",
    options: [
      "To determine water taste",
      "To monitor corrosion control effectiveness (pH affects lead/copper leaching and pipe corrosion rates) and disinfection efficiency (pH affects chlorine speciation and effectiveness)",
      "To measure chlorine demand",
      "To detect contamination"
    ],
    correctAnswer: 1,
    explanation: "pH monitoring in the distribution system: (1) Corrosion control — low pH increases lead and copper leaching from plumbing; target pH 7.5–8.5 for corrosion control; (2) Disinfection — pH affects chlorine speciation: at low pH, hypochlorous acid (HOCl) predominates (more effective disinfectant); at high pH, hypochlorite ion (OCl⁻) predominates (less effective); (3) Nitrification control — in chloraminated systems, pH affects nitrification rates. pH is measured using glass electrode meters or colorimetric methods.",
  },
  {
    id: 95,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring lead and copper at customer taps (Lead and Copper Rule)?",
    options: [
      "To measure lead in the water main",
      "To assess the effectiveness of corrosion control treatment in preventing lead and copper from leaching into drinking water from plumbing materials",
      "To detect industrial contamination",
      "To measure water hardness"
    ],
    correctAnswer: 1,
    explanation: "Lead and copper sampling at customer taps (first-draw samples after 6+ hours of stagnation) assesses corrosion control effectiveness. Lead leaches from lead service lines, lead solder, and brass fittings; copper leaches from copper plumbing. Action levels: lead 10 μg/L (Canada), copper 1.3 mg/L (US). If action levels are exceeded, utilities must: optimize corrosion control treatment, replace lead service lines, and provide public education. Sampling sites are selected to represent homes with lead service lines or lead solder.",
  },
  {
    id: 96,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring disinfection by-products (DBPs) in the distribution system?",
    options: [
      "To measure chlorine residual",
      "To verify compliance with regulatory limits for trihalomethanes (THMs) and haloacetic acids (HAAs) formed when chlorine reacts with natural organic matter",
      "To measure water age",
      "To detect bacterial contamination"
    ],
    correctAnswer: 1,
    explanation: "Disinfection by-products (DBPs) form when chlorine reacts with natural organic matter (NOM) in water. The main DBPs regulated in Canada: trihalomethanes (THMs — chloroform, bromoform, etc.) and haloacetic acids (HAAs). Canadian guideline: THMs 100 μg/L (total), HAAs 80 μg/L (total). DBPs increase with: higher NOM concentration, longer contact time (water age), higher chlorine dose, and higher temperature. DBP monitoring guides treatment optimization (NOM removal, alternative disinfectants) and distribution system operations (reducing water age).",
  },
  {
    id: 97,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring heterotrophic plate count (HPC) bacteria in the distribution system?",
    options: [
      "To detect E. coli contamination",
      "To assess the overall bacterial population in the distribution system, indicating the effectiveness of disinfection and the potential for biofilm growth",
      "To measure chlorine residual",
      "To detect specific pathogens"
    ],
    correctAnswer: 1,
    explanation: "Heterotrophic plate count (HPC) measures the total culturable bacterial population in water. While HPC bacteria are generally not pathogens, elevated counts indicate: inadequate disinfection, biofilm growth (which can harbor pathogens), long water age, or organic matter that supports bacterial growth. Canadian guidelines: HPC < 500 CFU/mL (colony-forming units per milliliter) in distribution system samples. HPC is used as an operational indicator — trends over time are more meaningful than individual results.",
  },
  {
    id: 98,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring water temperature in the distribution system?",
    options: [
      "To ensure water is safe to drink",
      "To monitor conditions that affect disinfection effectiveness, bacterial growth rates, DBP formation, and corrosion rates",
      "To detect contamination",
      "To measure water age"
    ],
    correctAnswer: 1,
    explanation: "Water temperature affects: (1) Disinfection — chlorine effectiveness decreases at lower temperatures; CT values must be increased at cold temperatures; (2) Bacterial growth — higher temperatures accelerate bacterial growth and biofilm formation; (3) DBP formation — THM formation increases with temperature; (4) Corrosion — higher temperatures generally increase corrosion rates; (5) Nitrification — nitrifying bacteria are most active at 15–30°C. Temperature monitoring helps operators anticipate seasonal water quality changes and adjust operations accordingly.",
  },
  {
    id: 99,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality complaint investigation?",
    options: [
      "To satisfy customer service requirements only",
      "To identify the source of water quality problems (taste, odor, color, pressure), implement corrective actions, and prevent recurrence",
      "To document customer complaints",
      "To test water at the treatment plant"
    ],
    correctAnswer: 1,
    explanation: "Water quality complaint investigations: (1) Gather information — complaint type (taste, odor, color, pressure), location, time, duration; (2) Collect samples — at the customer tap, nearby hydrants, and upstream locations; (3) Analyze samples — relevant parameters based on complaint type; (4) Identify cause — main break, sediment disturbance, biofilm, cross-connection, treatment problem; (5) Implement corrective action — flushing, repair, treatment adjustment; (6) Follow up — verify resolution and prevent recurrence. All complaints should be documented and tracked.",
  },
  {
    id: 100,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system nitrification monitoring program (for chloraminated systems)?",
    options: [
      "To measure nitrogen in the water",
      "To detect nitrification (bacterial conversion of ammonia to nitrite and nitrate) which depletes chloramine residual and can lead to bacterial regrowth in the distribution system",
      "To measure fertilizer contamination",
      "To detect industrial nitrogen discharge"
    ],
    correctAnswer: 1,
    explanation: "In chloraminated systems, nitrifying bacteria (Nitrosomonas, Nitrospira) can oxidize free ammonia (from chloramine decomposition) to nitrite and nitrate, depleting chloramine residual and creating conditions for bacterial regrowth. Nitrification monitoring measures: total chlorine (decreasing), free ammonia (decreasing), nitrite (increasing), and HPC (increasing). Nitrification is most common in: warm water (>15°C), long water age areas, and storage tanks. Control strategies: flushing, superchlorination (breakpoint chlorination), reducing water age, and adjusting chloramine ratio.",
  },
  {
    id: 101,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality event detection system?",
    options: [
      "To measure routine water quality parameters",
      "To rapidly detect anomalies in water quality data (sudden changes in multiple parameters) that may indicate a contamination event, enabling rapid response to protect public health",
      "To control chemical dosing",
      "To measure water age"
    ],
    correctAnswer: 1,
    explanation: "Water quality event detection systems (EDS) continuously monitor multiple parameters (chlorine, pH, turbidity, conductivity, TOC) and use algorithms to detect anomalies that may indicate contamination events. Single-parameter changes can have innocent explanations; simultaneous changes in multiple parameters are more likely to indicate a real event. EDS enables: rapid detection of contamination events (minutes vs. hours for manual sampling), faster public notification, and more effective emergency response. EDS is part of a comprehensive water security program.",
  },
  {
    id: 102,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring total organic carbon (TOC) in the distribution system?",
    options: [
      "To measure water color",
      "To monitor the organic matter content that serves as a substrate for bacterial growth and DBP precursor material, and to track changes that may indicate source water quality changes or contamination",
      "To measure chlorine demand",
      "To detect industrial contamination"
    ],
    correctAnswer: 1,
    explanation: "Total organic carbon (TOC) in the distribution system: (1) Bacterial growth substrate — organic carbon supports bacterial growth and biofilm formation; higher TOC = higher bacterial growth potential; (2) DBP precursors — NOM reacts with chlorine to form THMs and HAAs; higher TOC = higher DBP formation potential; (3) Chlorine demand — organic matter consumes chlorine, reducing residual; (4) Contamination indicator — sudden TOC increases may indicate contamination. TOC monitoring guides treatment optimization and distribution system operations.",
  },
  {
    id: 103,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system bacteriological sampling plan?",
    options: [
      "To satisfy regulatory requirements only",
      "To systematically collect and analyze water samples from representative locations throughout the system to verify microbiological safety and detect contamination",
      "To test water at the treatment plant",
      "To test water at customer complaints only"
    ],
    correctAnswer: 1,
    explanation: "Bacteriological sampling plans specify: sampling locations (representative of the system, including extremities, high-risk areas, and regulatory compliance points), sampling frequency (based on population served — larger systems require more samples), parameters (total coliform, E. coli), and response protocols (repeat sampling, investigation, corrective action, public notification). Plans must meet provincial regulatory requirements and be reviewed regularly. Sample collection technique (proper sanitization, first-draw vs. flushed samples) affects result validity.",
  },
  {
    id: 104,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring conductivity in the distribution system?",
    options: [
      "To measure electrical hazards",
      "To monitor the total dissolved solids (TDS) content and detect changes that may indicate contamination, cross-connections, or changes in source water quality",
      "To measure water hardness",
      "To control chemical dosing"
    ],
    correctAnswer: 1,
    explanation: "Conductivity measures the ability of water to conduct electricity, which is proportional to dissolved ion concentration (TDS). In the distribution system, conductivity monitoring: detects sudden changes that may indicate contamination (e.g., intrusion of saline water, industrial chemicals), identifies cross-connections (different conductivity from non-potable sources), monitors source water quality changes (seasonal variation), and tracks changes from treatment processes. Conductivity is measured continuously by online sensors and is a key parameter in water quality event detection systems.",
  },
  {
    id: 105,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring manganese in the distribution system?",
    options: [
      "To detect industrial contamination",
      "To monitor manganese levels that can cause black water complaints, staining, and potential neurological health effects if they exceed the aesthetic objective",
      "To measure water hardness",
      "To detect bacterial contamination"
    ],
    correctAnswer: 1,
    explanation: "Manganese in drinking water causes: black/brown water (when oxidized manganese precipitates), black staining of fixtures and laundry, and potential neurological health effects at high concentrations. Canadian aesthetic objective: 0.05 mg/L (taste/color threshold); health-based guideline: 0.12 mg/L. Manganese in the distribution system comes from: source water (groundwater, stratified reservoirs), manganese deposits in old pipes, and disturbance of pipe sediments. Monitoring guides treatment optimization (oxidation and filtration) and distribution system operations (flushing).",
  },
  {
    id: 106,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality sampling protocol for lead?",
    options: [
      "To measure lead in the water main",
      "To collect first-draw samples after 6+ hours of stagnation at homes with lead service lines or lead solder, measuring lead that has leached from plumbing materials",
      "To detect industrial lead contamination",
      "To measure lead in treatment plant effluent"
    ],
    correctAnswer: 1,
    explanation: "Lead sampling protocol (first-draw): (1) Identify sampling sites — homes with lead service lines, pre-1990 homes with lead solder, or homes with lead-containing fixtures; (2) Instruct residents — do not use water for 6+ hours before sampling; (3) Collect first-draw sample — first 250 mL or 1 L from the tap without flushing; (4) Analyze for lead; (5) Compare to action level (10 μg/L in Canada). First-draw samples capture lead that has leached from plumbing materials during stagnation. Flushed samples would miss this lead.",
  },
  {
    id: 107,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring iron in the distribution system?",
    options: [
      "To detect industrial contamination",
      "To monitor iron levels that can cause red/brown water complaints, staining, and taste problems from corrosion of unlined iron and steel pipes",
      "To measure water hardness",
      "To detect bacterial contamination"
    ],
    correctAnswer: 1,
    explanation: "Iron in the distribution system causes: red/brown water (from ferric iron precipitates), metallic taste, staining of fixtures and laundry, and increased chlorine demand (iron consumes chlorine). Sources: corrosion of unlined cast iron and steel pipes, iron deposits disturbed by high-velocity flow or flushing, and source water iron. Canadian aesthetic objective: 0.3 mg/L. Monitoring guides: pipe replacement/lining decisions, flushing programs, and treatment optimization (iron removal). Sudden iron increases may indicate main breaks or sediment disturbance.",
  },
  {
    id: 108,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality trend analysis?",
    options: [
      "To satisfy regulatory reporting requirements",
      "To identify gradual changes in water quality parameters over time that may indicate emerging problems (biofilm growth, corrosion, source water changes) before they become acute issues",
      "To compare water quality to other utilities",
      "To document water quality for billing purposes"
    ],
    correctAnswer: 1,
    explanation: "Water quality trend analysis examines changes in parameters over time: seasonal patterns (temperature, DBPs, algae-related taste/odor), long-term trends (increasing lead, decreasing chlorine residual, increasing HPC), and anomalies (sudden changes that may indicate problems). Trend analysis enables: proactive identification of emerging problems, evaluation of treatment changes, optimization of operations, and regulatory compliance planning. Statistical tools (control charts, regression analysis) help distinguish real trends from normal variation.",
  },
  {
    id: 109,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality model?",
    options: [
      "To replace water quality sampling",
      "To simulate the transport and fate of water quality constituents (chlorine, DBPs, water age) throughout the distribution system, identifying problem areas and evaluating operational strategies",
      "To measure water quality in real time",
      "To control chemical dosing automatically"
    ],
    correctAnswer: 1,
    explanation: "Water quality models (EPANET, WaterGEMS) simulate the transport and fate of water quality constituents: chlorine decay (bulk decay in the water, wall decay at the pipe surface), DBP formation (THMs, HAAs), water age (residence time), and source tracing (identifying which source supplies each part of the system). Models identify: areas with long water age and low chlorine residual, optimal booster chlorination locations, and the impact of operational changes on water quality. Models must be calibrated against field measurements.",
  },
  {
    id: 110,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system biofilm monitoring program?",
    options: [
      "To detect pathogenic bacteria in the water",
      "To monitor the growth of biofilm (communities of bacteria attached to pipe surfaces) that can harbor pathogens, consume disinfectant, and cause water quality problems",
      "To measure pipe corrosion",
      "To measure water age"
    ],
    correctAnswer: 1,
    explanation: "Biofilm monitoring assesses the extent of biofilm growth in distribution pipes: HPC measurements (elevated counts indicate biofilm), ATP (adenosine triphosphate) measurements (rapid indicator of biological activity), and pipe coupon analysis (direct examination of biofilm on pipe surfaces). Biofilm: consumes disinfectant (increasing chlorine demand), harbors pathogens (Legionella, Pseudomonas, Mycobacterium), causes taste and odor problems, and accelerates pipe corrosion. Control strategies: maintaining adequate chlorine residual, reducing water age, flushing, and pipe replacement.",
  },
  {
    id: 111,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring chloramine residual in a chloraminated distribution system?",
    options: [
      "To measure free chlorine",
      "To verify that adequate combined chlorine (chloramine) residual is maintained throughout the system to prevent bacterial regrowth while minimizing DBP formation",
      "To measure ammonia",
      "To detect nitrification"
    ],
    correctAnswer: 1,
    explanation: "Chloramine residual monitoring verifies that adequate combined chlorine is present throughout the system. Chloramines are used as secondary disinfectants because they: form fewer DBPs (THMs, HAAs) than free chlorine, are more stable (persist longer in the distribution system), and are more effective at penetrating biofilm. However, chloramines: are weaker disinfectants than free chlorine, can undergo nitrification, and are harmful to dialysis patients and fish. Monitoring includes: total chlorine, free chlorine, and free ammonia to characterize the chloramine species present.",
  },
  {
    id: 112,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality audit?",
    options: [
      "To satisfy regulatory requirements",
      "To comprehensively evaluate all aspects of distribution system water quality management (monitoring, operations, maintenance, emergency response) to identify gaps and improvement opportunities",
      "To audit water quality laboratory performance",
      "To compare water quality to other utilities"
    ],
    correctAnswer: 1,
    explanation: "Water quality audits comprehensively evaluate: sampling plan adequacy (locations, frequency, parameters), laboratory quality assurance (method validation, proficiency testing), operational practices (disinfection maintenance, flushing, valve operation), infrastructure condition (pipe materials, age, condition), emergency response capabilities, and regulatory compliance. Audits identify gaps between current practice and best practice, leading to improvement plans. Internal audits (self-assessment) and external audits (regulatory inspections, third-party reviews) both have value.",
  },
  {
    id: 113,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring dissolved oxygen (DO) in the distribution system?",
    options: [
      "To ensure water is safe to drink",
      "To monitor conditions that affect corrosion rates (higher DO increases corrosion of iron and copper) and detect potential contamination from oxygen-depleted sources",
      "To measure water age",
      "To detect bacterial contamination"
    ],
    correctAnswer: 1,
    explanation: "Dissolved oxygen (DO) in the distribution system: (1) Corrosion — DO is a key driver of iron and copper corrosion; higher DO increases corrosion rates; corrosion control strategies may include DO reduction; (2) Contamination indicator — sudden DO decreases may indicate intrusion of oxygen-depleted water (groundwater, sewage); (3) Biological activity — DO is consumed by aerobic bacteria and biofilm; low DO may indicate high biological activity. DO is measured using membrane electrode sensors or optical sensors.",
  },
  {
    id: 114,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality emergency response plan?",
    options: [
      "To document routine water quality monitoring",
      "To provide pre-planned procedures for responding to water quality emergencies (contamination events, boil water advisories, do not use orders) to protect public health",
      "To plan water quality improvements",
      "To document regulatory compliance"
    ],
    correctAnswer: 1,
    explanation: "Water quality emergency response plans provide procedures for: detecting water quality events (monitoring systems, customer complaints), assessing the severity and extent of contamination, making public notification decisions (boil water advisory, do not use order), implementing corrective actions (flushing, superchlorination, isolation), coordinating with public health authorities, and restoring normal operations (confirming water quality before lifting advisories). Plans must be regularly tested and updated. Public communication is critical — clear, timely, and accurate information protects public health.",
  },
  {
    id: 115,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring specific conductance (temperature-corrected conductivity) in the distribution system?",
    options: [
      "To measure electrical hazards",
      "To provide a temperature-independent measure of dissolved ion concentration, enabling valid comparisons of conductivity measurements taken at different temperatures",
      "To measure water hardness",
      "To control chemical dosing"
    ],
    correctAnswer: 1,
    explanation: "Specific conductance (SC) is conductivity corrected to a standard temperature (25°C), enabling valid comparisons regardless of water temperature. Conductivity increases approximately 2% per °C, so a sample at 10°C would have lower conductivity than the same sample at 25°C. SC is used for: trend analysis (comparing measurements over time and across locations), detecting changes in water chemistry (source water quality changes, contamination), and calibrating conductivity sensors. Most modern conductivity meters automatically calculate and display SC.",
  },
  {
    id: 116,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality sampling chain of custody?",
    options: [
      "To track sample delivery costs",
      "To document the handling of water samples from collection through analysis, ensuring sample integrity and providing a defensible record for regulatory compliance and legal proceedings",
      "To track laboratory equipment",
      "To document analyst qualifications"
    ],
    correctAnswer: 1,
    explanation: "Chain of custody (COC) documentation tracks water samples from collection to laboratory analysis: sample collector identification, collection date/time/location, sample type, preservation method, transport conditions, laboratory receipt, and analyst identification. COC ensures: sample integrity (proper collection, preservation, and transport), result traceability (linking results to specific samples and locations), regulatory defensibility (demonstrating proper procedures), and legal admissibility (if results are used in enforcement actions). COC forms must be completed accurately and retained.",
  },
  {
    id: 117,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality laboratory quality control (QC) program?",
    options: [
      "To satisfy accreditation requirements only",
      "To ensure that analytical results are accurate, precise, and reliable through systematic use of blanks, duplicates, standards, and spike recoveries",
      "To train laboratory analysts",
      "To document laboratory equipment maintenance"
    ],
    correctAnswer: 1,
    explanation: "Laboratory QC programs ensure result reliability: (1) Method blanks — detect contamination in reagents or equipment; (2) Duplicates — assess precision (reproducibility) of the analysis; (3) Calibration standards — verify instrument accuracy; (4) Matrix spikes — assess method accuracy in the specific sample matrix; (5) Certified reference materials — verify overall method performance. QC results are evaluated against acceptance criteria — results outside criteria trigger investigation and corrective action. QC documentation is essential for laboratory accreditation and regulatory compliance.",
  },
  {
    id: 118,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of measuring alkalinity in the distribution system?",
    options: [
      "To measure water taste",
      "To assess the buffering capacity of the water (resistance to pH change) and monitor corrosion control effectiveness, since alkalinity affects the stability of protective calcium carbonate scales",
      "To detect contamination",
      "To measure water hardness"
    ],
    correctAnswer: 1,
    explanation: "Alkalinity (primarily bicarbonate and carbonate) provides buffering capacity — resistance to pH change. In corrosion control: (1) Langelier Saturation Index (LSI) — alkalinity is a key factor in calculating LSI, which predicts whether water will deposit (positive LSI) or dissolve (negative LSI) calcium carbonate scale; (2) Protective scale — calcium carbonate scale on pipe surfaces protects against corrosion and lead/copper leaching; (3) pH stability — adequate alkalinity prevents pH from dropping during distribution, which would increase corrosivity. Target alkalinity for corrosion control: typically > 40 mg/L as CaCO₃.",
  },
  {
    id: 119,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality public reporting program?",
    options: [
      "To satisfy regulatory requirements only",
      "To inform the public about the quality of their drinking water, building trust and enabling informed decisions about water use",
      "To report water quality to other utilities",
      "To document water quality for insurance purposes"
    ],
    correctAnswer: 1,
    explanation: "Public reporting programs (annual water quality reports, consumer confidence reports) inform the public about: source water characteristics, treatment processes, water quality results (compliance with standards), any violations and corrective actions, and future plans. Public reporting: builds trust in the water system, enables informed decisions (e.g., whether to use a filter), satisfies regulatory requirements, and demonstrates accountability. Reports should be written in plain language, easily accessible (website, mail), and include context to help the public understand the results.",
  },
  {
    id: 120,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality risk assessment?",
    options: [
      "To satisfy regulatory requirements",
      "To systematically identify and evaluate hazards and risks to drinking water quality throughout the distribution system, prioritizing control measures based on risk level",
      "To assess water quality laboratory risks",
      "To assess operator safety risks"
    ],
    correctAnswer: 1,
    explanation: "Water quality risk assessments (Water Safety Plans, HACCP-based approaches) identify: hazards (contamination sources, system vulnerabilities), exposure pathways (how contamination could reach consumers), likelihood of occurrence, severity of health consequences, and existing control measures. Risk is characterized as probability × consequence. High-risk hazards receive priority attention and additional control measures. Risk assessments guide: monitoring program design (focus on high-risk parameters and locations), operational procedures, and infrastructure investment priorities.",
  },

  // ─── MODULE 4: Security, Safety, Admin & Public Interactions (30 questions) ──
  {
    id: 121,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water system security plan?",
    options: [
      "To document physical security measures only",
      "To provide a comprehensive framework for protecting the water system from physical and cyber threats, including prevention, detection, response, and recovery measures",
      "To satisfy regulatory requirements only",
      "To document employee security training"
    ],
    correctAnswer: 1,
    explanation: "Water system security plans address: (1) Prevention — physical security (fencing, locks, cameras), access control, cybersecurity (firewalls, encryption, access management); (2) Detection — intrusion detection, water quality monitoring, SCADA anomaly detection; (3) Response — emergency response procedures, communication protocols, coordination with law enforcement and public health; (4) Recovery — restoring system operations after an incident. Security plans are required by federal and provincial regulations for larger water systems and must be regularly reviewed and updated.",
  },
  {
    id: 122,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water system operator certification program?",
    options: [
      "To satisfy regulatory requirements only",
      "To ensure that operators have the knowledge, skills, and abilities to safely and effectively operate water systems, protecting public health",
      "To train operators on customer service",
      "To certify operators for salary increases"
    ],
    correctAnswer: 1,
    explanation: "Operator certification programs ensure competency: written examinations test knowledge of water treatment, distribution, regulations, and safety; experience requirements ensure practical skills; continuing education requirements ensure operators stay current with new technologies and regulations. Certification levels correspond to system complexity (Class I–IV). Certification protects public health by ensuring that qualified operators manage water systems. Provincial regulations specify certification requirements for different system types and sizes.",
  },
  {
    id: 123,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a confined space entry permit?",
    options: [
      "To document the entry for payroll purposes",
      "To formally authorize entry into a confined space after verifying that all safety requirements (atmospheric testing, ventilation, rescue equipment, attendant) are in place",
      "To notify regulatory authorities of the entry",
      "To document the work to be performed"
    ],
    correctAnswer: 1,
    explanation: "Confined space entry permits formally authorize entry after verifying safety requirements: atmospheric testing results (O₂ ≥ 19.5%, LEL < 10%, H₂S < 10 ppm, CO < 25 ppm), ventilation adequacy, PPE requirements, rescue equipment availability, attendant designation, emergency procedures, and communication arrangements. Permits must be signed by the entry supervisor and displayed at the entry point. Permits are valid for a specific entry and must be cancelled if conditions change. Entry without a permit in a permit-required confined space is a serious safety violation.",
  },
  {
    id: 124,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water system public notification procedure for a boil water advisory?",
    options: [
      "To satisfy regulatory requirements only",
      "To rapidly inform the public of a potential health risk from drinking water and provide clear instructions to protect their health until the water is safe to drink",
      "To notify the media for publicity",
      "To document the event for regulatory reporting"
    ],
    correctAnswer: 1,
    explanation: "Boil water advisory (BWA) notification: (1) Decision — based on bacteriological results, treatment failure, or significant system event (main break, loss of pressure); (2) Content — clear instructions (boil water for 1 minute before drinking, using for cooking, making ice, brushing teeth), affected area, reason for advisory, and expected duration; (3) Distribution — media release, social media, direct contact (schools, hospitals, vulnerable populations), door-to-door in severe cases; (4) Lifting — after confirming water quality (two consecutive satisfactory bacteriological samples). Speed and clarity of communication are critical.",
  },
  {
    id: 125,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water system traffic control plan for main repair work?",
    options: [
      "To satisfy municipal requirements",
      "To protect workers and the public from traffic hazards during road excavation and repair work, using signs, barriers, flaggers, and lane closures",
      "To minimize traffic disruption",
      "To coordinate with police"
    ],
    correctAnswer: 1,
    explanation: "Traffic control plans protect workers and the public during road excavation: warning signs (advance warning, work zone signs), delineators (cones, barrels, barriers), flaggers (trained workers directing traffic), lane closures, and speed reductions. Plans must comply with provincial traffic control standards (Ontario Book 7, BC MUTCD). Inadequate traffic control is a leading cause of worker fatalities in the construction industry. Plans must be developed before work begins and adjusted as conditions change. All workers in traffic control zones must wear high-visibility clothing.",
  },
  {
    id: 126,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water system customer service plan?",
    options: [
      "To satisfy regulatory requirements",
      "To define standards for responding to customer inquiries, complaints, and service requests, ensuring consistent, timely, and professional service",
      "To manage customer billing",
      "To document customer interactions"
    ],
    correctAnswer: 1,
    explanation: "Customer service plans define: response time standards (how quickly to respond to different types of inquiries and complaints), communication protocols (who responds, what information to provide), service standards (what services are provided, at what cost), complaint resolution procedures, and performance metrics. Good customer service: builds public trust in the water utility, reduces escalation of complaints, provides valuable feedback on system performance, and supports regulatory compliance (many regulations require customer notification and response). Customer satisfaction surveys measure performance.",
  },
  {
    id: 127,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water system media relations plan?",
    options: [
      "To promote the water utility",
      "To provide a framework for communicating with the media during normal operations and emergencies, ensuring accurate, timely, and consistent information is provided to the public",
      "To manage social media accounts",
      "To document media inquiries"
    ],
    correctAnswer: 1,
    explanation: "Media relations plans: designate spokespersons (who is authorized to speak to media), establish approval processes (who must approve statements before release), provide key messages (pre-approved language for common scenarios), define protocols for emergency communications (who to notify, what to say, when to say it), and include media contact lists. During water quality emergencies, accurate and timely media communication is critical for public health protection. Inconsistent or inaccurate information undermines public trust and can cause unnecessary alarm or false reassurance.",
  },
  {
    id: 128,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water system regulatory compliance calendar?",
    options: [
      "To track employee vacation schedules",
      "To document all regulatory reporting deadlines, sampling requirements, and compliance milestones to ensure timely compliance with all applicable regulations",
      "To track regulatory changes",
      "To document regulatory inspections"
    ],
    correctAnswer: 1,
    explanation: "Regulatory compliance calendars track: sampling deadlines (bacteriological, chemical, physical parameters), reporting deadlines (annual reports, quarterly reports, incident reports), permit renewal dates, certification renewal dates, equipment testing deadlines (backflow preventer tests, generator tests), and inspection dates. Compliance calendars prevent missed deadlines that result in regulatory violations, fines, and public notification requirements. Electronic systems (CMMS, spreadsheets) with automated reminders are most effective.",
  },
  {
    id: 129,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water system operator training program?",
    options: [
      "To satisfy certification renewal requirements only",
      "To ensure operators have the knowledge and skills to safely and effectively operate the water system, including system-specific training, technical training, safety training, and regulatory training",
      "To train operators on customer service",
      "To train operators on financial management"
    ],
    correctAnswer: 1,
    explanation: "Operator training programs ensure operators have current knowledge and skills: system-specific training (equipment, procedures, emergency response); technical training (water quality, hydraulics, treatment processes); safety training (confined space, LOTO, traffic control); and regulatory training (new requirements, standards). Training supports certification maintenance (continuing education credits), improves operational performance, and reduces the risk of incidents and regulatory violations. Training records must be maintained to document compliance with certification requirements.",
  },
  {
    id: 130,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water system succession planning program?",
    options: [
      "To plan for utility mergers",
      "To identify and develop future leaders and key technical staff to ensure continuity of operations when experienced operators retire or leave",
      "To plan for system expansion",
      "To plan for regulatory changes"
    ],
    correctAnswer: 1,
    explanation: "Succession planning addresses the risk of losing experienced operators through retirement or turnover: identifying critical positions, assessing current staff capabilities, developing training and mentoring programs to build future capacity, and documenting institutional knowledge (standard operating procedures, system-specific knowledge). The water sector faces a significant workforce challenge as many experienced operators approach retirement. Succession planning ensures that critical knowledge and skills are transferred before experienced operators leave.",
  },
  {
    id: 131,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water system financial plan?",
    options: [
      "To satisfy regulatory requirements",
      "To ensure the long-term financial sustainability of the water system by projecting revenues and expenses, planning capital investments, and setting appropriate rates",
      "To manage employee salaries",
      "To document financial transactions"
    ],
    correctAnswer: 1,
    explanation: "Water system financial plans: project operating expenses (staffing, chemicals, energy, maintenance), capital expenses (pipe replacement, equipment upgrades), revenue requirements (what rates must generate), rate setting (ensuring rates are adequate and equitable), reserve fund planning (accumulating funds for future capital needs), and debt management (borrowing for major capital projects). Financial sustainability requires: full cost recovery (rates cover all costs), adequate reserves, and long-term capital planning. Many water systems are facing infrastructure funding gaps due to years of deferred investment.",
  },
  {
    id: 132,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water system annual report?",
    options: [
      "To satisfy regulatory requirements only",
      "To communicate the utility's performance, financial status, and future plans to customers, regulators, and other stakeholders, building accountability and trust",
      "To document water quality results only",
      "To report to shareholders"
    ],
    correctAnswer: 1,
    explanation: "Annual reports communicate: water quality results (compliance with standards), system performance (service reliability, response times), financial performance (revenues, expenses, rates), capital investments (completed and planned), operational highlights, and future plans. Annual reports demonstrate accountability to customers who pay for water service and regulators who oversee public health protection. They should be written in plain language, easily accessible (website, mail on request), and include context to help readers understand the results.",
  },
  {
    id: 133,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water system public education program?",
    options: [
      "To promote water conservation only",
      "To inform the public about the water system, water quality, conservation, and their role in protecting drinking water quality, building informed and engaged customers",
      "To satisfy regulatory requirements",
      "To promote the water utility's image"
    ],
    correctAnswer: 1,
    explanation: "Public education programs inform customers about: how their water is treated and delivered, water quality (what's in their water and why it's safe), water conservation (how to reduce water use), cross-connection control (how to prevent backflow), lead in plumbing (how to reduce exposure), and emergency preparedness (what to do during water quality events). Informed customers: understand the value of water service, support appropriate rate increases, cooperate with conservation programs, and report potential contamination events. Schools, community events, and digital media are effective channels.",
  },
  {
    id: 134,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water system mutual aid agreement?",
    options: [
      "To share employees between utilities",
      "To provide a framework for water utilities to assist each other during emergencies, sharing equipment, personnel, and expertise to restore service more quickly",
      "To share water quality data",
      "To share financial resources"
    ],
    correctAnswer: 1,
    explanation: "Mutual aid agreements (MAAs) between water utilities provide: equipment sharing (pumps, generators, pipe repair equipment), personnel sharing (operators, engineers), technical assistance (expertise for unusual problems), and emergency water supply (interconnections). MAAs are activated during emergencies that exceed a utility's own resources: major main breaks, natural disasters, equipment failures, or contamination events. MAAs must be pre-negotiated and regularly exercised to be effective. Regional water utility associations often facilitate MAA development.",
  },
  {
    id: 135,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a water system incident reporting procedure?",
    options: [
      "To document incidents for insurance purposes only",
      "To ensure that all significant incidents (water quality events, main breaks, injuries, security breaches) are promptly reported to appropriate authorities and documented for investigation and prevention",
      "To satisfy regulatory requirements only",
      "To document incidents for legal defense"
    ],
    correctAnswer: 1,
    explanation: "Incident reporting procedures ensure: timely notification of regulatory authorities (as required by regulations — typically within 24 hours for significant events), accurate documentation of what happened and the utility's response, root cause analysis to prevent recurrence, and legal protection through proper record-keeping. Reports should include: date/time, location, nature of incident, personnel involved, immediate actions taken, and follow-up steps planned.",
  },
  {
    id: 136,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is a confined space entry permit and when is it required?",
    options: [
      "A permit required only for underground vaults",
      "A written authorization documenting hazard evaluation, safety measures, and emergency procedures required before entering any permit-required confined space such as manholes, wet wells, or valve vaults",
      "A permit required only when working alone",
      "A permit required only for spaces deeper than 10 feet"
    ],
    correctAnswer: 1,
    explanation: "Confined space entry permits are required by OSHA 29 CFR 1910.146 for permit-required confined spaces — those with potential for hazardous atmosphere, engulfment, entrapment, or other serious safety hazards. In water distribution, permit-required confined spaces include: manholes, wet wells, pump stations, valve vaults, and storage tank interiors. The permit must document: space identification, purpose of entry, authorized entrants and attendants, hazards present, atmospheric testing results, rescue procedures, and communication methods. Entry without a proper permit can result in fatalities.",
  },
];

export const wpiClass2WaterDistModules = [
  { id: "dist-system-components", name: "Distribution System Components", icon: "🔧" },
  { id: "equipment-om-repair", name: "Equipment Installation, O&M & Repair", icon: "⚙️" },
  { id: "water-quality-lab", name: "Water Quality Monitoring & Lab", icon: "🧪" },
  { id: "security-safety-admin", name: "Security, Safety, Admin & Public Interactions", icon: "🛡️" },
];

export function getWpiClass2WaterDistQuestions() {
  return wpiClass2WaterDistQuestions;
}
