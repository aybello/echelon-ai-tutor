// WPI Class I Water Distribution — Practice Question Bank (150 Questions)
// Aligned with WPI Need-to-Know Criteria: Water Distribution Operator Class I
// Used for: BC (EOCP), Alberta (AWWOA), Saskatchewan, Manitoba
// Exam Blueprint: 35 Distribution System Components | 30 Equipment O&M | 15 Water Quality | 20 Safety & Admin
export interface WpiClass1WaterDistQuestion {
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

export const wpiClass1WaterDistQuestions: WpiClass1WaterDistQuestion[] = [
  // ─── MODULE 1: Distribution System Components (50 questions) ───────────────
  {
    id: 1,
    module: "Distribution System Components",
    question: "What is the primary purpose of a water distribution system?",
    options: [
      "To treat raw water to drinking water standards",
      "To convey treated water from the treatment plant to consumers at adequate pressure and quality",
      "To store water for emergency use only",
      "To pump water from wells to the surface"
    ],
    correctAnswer: 1,
    explanation: "A water distribution system conveys treated water from the treatment plant or storage facilities to consumers. It must deliver water at adequate pressure (typically 275–690 kPa / 40–100 psi), in sufficient quantity, and at acceptable quality.",
  },
  {
    id: 2,
    module: "Distribution System Components",
    question: "What is the minimum acceptable residual pressure at a service connection during normal operating conditions?",
    options: ["70 kPa (10 psi)", "140 kPa (20 psi)", "275 kPa (40 psi)", "550 kPa (80 psi)"],
    correctAnswer: 2,
    explanation: "The generally accepted minimum residual pressure at a service connection during normal operating conditions is 275 kPa (40 psi). This ensures adequate flow at fixtures and prevents backflow from negative pressure events.",
  },
  {
    id: 3,
    module: "Distribution System Components",
    question: "What type of pipe material is most commonly used in modern water distribution systems?",
    options: [
      "Cast iron (CI)",
      "Asbestos cement (AC)",
      "Ductile iron (DI) and PVC",
      "Galvanized steel"
    ],
    correctAnswer: 2,
    explanation: "Ductile iron (DI) and PVC (polyvinyl chloride) are the most commonly used pipe materials in modern water distribution systems. DI is preferred for larger mains; PVC is common for smaller distribution mains and services. Older systems may still have cast iron, asbestos cement, or galvanized steel.",
  },
  {
    id: 4,
    module: "Distribution System Components",
    question: "What is a 'dead end' in a water distribution system and why is it a concern?",
    options: [
      "A pipe that has been permanently taken out of service — no concern",
      "A pipe section with flow in only one direction — can cause water quality problems due to stagnation",
      "A pipe that connects two pressure zones — concern for pressure imbalance",
      "A pipe installed at the end of a transmission main — no quality concern"
    ],
    correctAnswer: 1,
    explanation: "A dead end is a pipe section where water can only enter from one direction, with no outlet except through customer services. Stagnation in dead ends causes chlorine residual loss, sediment accumulation, bacterial regrowth, and taste/odour complaints. Dead ends should be flushed regularly.",
  },
  {
    id: 5,
    module: "Distribution System Components",
    question: "What is the purpose of a gate valve in a distribution system?",
    options: [
      "To regulate flow and pressure continuously",
      "To isolate sections of pipe for maintenance or repair",
      "To prevent backflow from customer services",
      "To release air from high points in the system"
    ],
    correctAnswer: 1,
    explanation: "Gate valves are used to isolate sections of the distribution system for maintenance, repair, or emergency shutdowns. They are fully-open or fully-closed valves — not designed for throttling. Butterfly valves and ball valves can also be used for isolation.",
  },
  {
    id: 6,
    module: "Distribution System Components",
    question: "What is the function of a pressure reducing valve (PRV)?",
    options: [
      "To increase pressure in low-pressure zones",
      "To reduce upstream pressure to a lower, controlled downstream pressure",
      "To prevent water hammer in the system",
      "To release excess pressure to the atmosphere"
    ],
    correctAnswer: 1,
    explanation: "A pressure reducing valve (PRV) automatically reduces a higher upstream pressure to a lower, preset downstream pressure. PRVs are used to create pressure zones, protect low-lying areas from excessive pressure, and reduce leakage and pipe stress.",
  },
  {
    id: 7,
    module: "Distribution System Components",
    question: "A fire hydrant is connected to a water main. What is the minimum flow rate a hydrant should provide for fire fighting?",
    options: ["250 L/min (65 gpm)", "500 L/min (130 gpm)", "1,500 L/min (400 gpm)", "3,800 L/min (1,000 gpm)"],
    correctAnswer: 2,
    explanation: "The minimum fire flow from a hydrant is typically 1,500 L/min (400 gpm) for residential areas, though requirements vary by jurisdiction and building type. Commercial and industrial areas may require much higher flows. Hydrant flow testing determines actual available flow.",
  },
  {
    id: 8,
    module: "Distribution System Components",
    question: "What is a 'looped' distribution system and what is its main advantage?",
    options: [
      "A system with only one supply point — advantage is simplicity",
      "A system where mains are interconnected to allow flow from multiple directions — advantage is redundancy and better pressure",
      "A system with elevated storage tanks — advantage is gravity pressure",
      "A system with booster pumps — advantage is higher pressure"
    ],
    correctAnswer: 1,
    explanation: "A looped (or grid) distribution system has interconnected mains that allow water to reach any point from multiple directions. This provides redundancy (if one main is shut down, flow can come from another direction), more uniform pressure, better fire flow, and improved water quality through circulation.",
  },
  {
    id: 9,
    module: "Distribution System Components",
    question: "What is the purpose of an air release/vacuum valve (ARV) in a distribution system?",
    options: [
      "To release chlorine gas from the system",
      "To release trapped air at high points and admit air to prevent vacuum formation during draining",
      "To control pressure at pump stations",
      "To sample water quality at key locations"
    ],
    correctAnswer: 1,
    explanation: "Air release/vacuum valves (ARVs) are installed at high points in the distribution system. They automatically release accumulated air (which reduces carrying capacity and can cause pressure surges) and admit air during pipe draining to prevent vacuum collapse. Combination ARVs perform both functions.",
  },
  {
    id: 10,
    module: "Distribution System Components",
    question: "What is the difference between a transmission main and a distribution main?",
    options: [
      "Transmission mains are smaller and serve individual customers; distribution mains are larger and carry bulk water",
      "Transmission mains carry large volumes of water over long distances; distribution mains are smaller and serve local areas",
      "Transmission mains are made of PVC; distribution mains are made of ductile iron",
      "There is no difference — the terms are interchangeable"
    ],
    correctAnswer: 1,
    explanation: "Transmission mains (also called trunk mains) carry large volumes of treated water from the treatment plant or storage to the distribution system. They are typically larger diameter (>300 mm / 12 in) with few or no service connections. Distribution mains are smaller and serve local areas with service connections to customers.",
  },
  {
    id: 11,
    module: "Distribution System Components",
    question: "What is a service connection (service lateral)?",
    options: [
      "The large main pipe running down the street",
      "The pipe connecting the distribution main to an individual customer's property",
      "The connection between two distribution mains",
      "The pipe connecting the treatment plant to the transmission main"
    ],
    correctAnswer: 1,
    explanation: "A service connection (service lateral or service line) is the pipe that connects the distribution main to an individual customer's property. It typically includes a corporation stop (at the main), the service pipe, a curb stop (at the property line), and a meter.",
  },
  {
    id: 12,
    module: "Distribution System Components",
    question: "What is the purpose of a curb stop on a service connection?",
    options: [
      "To measure water consumption",
      "To prevent backflow from the customer's plumbing",
      "To allow the utility to shut off water to an individual customer at the property line",
      "To regulate pressure to the customer's property"
    ],
    correctAnswer: 2,
    explanation: "A curb stop (curb valve) is a shutoff valve located at or near the property line on a service connection. It allows the utility to shut off water to an individual customer for non-payment, repairs, or emergencies without entering the customer's property.",
  },
  {
    id: 13,
    module: "Distribution System Components",
    question: "What is 'water hammer' and what causes it?",
    options: [
      "Corrosion of pipe walls caused by aggressive water",
      "A pressure surge caused by a sudden change in flow velocity, such as rapid valve closure",
      "The sound of water flowing through undersized pipes",
      "Vibration of pipes caused by high-velocity flow"
    ],
    correctAnswer: 1,
    explanation: "Water hammer is a pressure surge (positive or negative) caused by a sudden change in flow velocity. Rapid valve closure, pump start/stop, or sudden demand changes can cause pressure waves that travel through the system at the speed of sound. Severe water hammer can rupture pipes, damage valves, and cause meter failures.",
  },
  {
    id: 14,
    module: "Distribution System Components",
    question: "What is the purpose of a surge tank or surge vessel in a distribution system?",
    options: [
      "To store water for peak demand periods",
      "To absorb pressure surges and protect the system from water hammer",
      "To treat water before distribution",
      "To boost pressure in low-pressure zones"
    ],
    correctAnswer: 1,
    explanation: "Surge tanks (standpipes) and surge vessels (hydropneumatic tanks) absorb pressure surges caused by water hammer. They provide a cushion of stored water or compressed air that dampens pressure transients, protecting pipes, valves, and meters from damage.",
  },
  {
    id: 15,
    module: "Distribution System Components",
    question: "What is the Hazen-Williams formula used for in distribution system design?",
    options: [
      "Calculating chlorine residual decay in pipes",
      "Estimating head loss due to friction in water pipes",
      "Determining pump horsepower requirements",
      "Calculating storage tank volume requirements"
    ],
    correctAnswer: 1,
    explanation: "The Hazen-Williams formula is used to estimate head loss due to friction in water distribution pipes: h_f = 10.67 × L × Q^1.852 / (C^1.852 × D^4.87). The C-factor (roughness coefficient) varies by pipe material — new PVC: C=150, new ductile iron: C=130, old cast iron: C=80–100.",
    isCalc: true,
  },
  {
    id: 16,
    module: "Distribution System Components",
    question: "A water main has a C-factor of 100. What does a lower C-factor indicate?",
    options: [
      "The pipe is smoother and has less friction loss",
      "The pipe is rougher (more tuberculated or corroded) and has greater friction loss",
      "The pipe is newer and in better condition",
      "The pipe is made of PVC"
    ],
    correctAnswer: 1,
    explanation: "The Hazen-Williams C-factor is a roughness coefficient — higher C means smoother pipe with less friction loss; lower C means rougher pipe with more friction loss. New PVC: C=150; new ductile iron: C=130; old tuberculated cast iron: C=60–80. Unlined old cast iron mains can have very low C-factors, significantly reducing carrying capacity.",
  },
  {
    id: 17,
    module: "Distribution System Components",
    question: "What is tuberculation in a water main?",
    options: [
      "The buildup of biofilm on pipe walls",
      "The formation of rust mounds (tubercles) on the interior of unlined iron pipes, reducing flow capacity",
      "The deposition of calcium carbonate scale on pipe walls",
      "The corrosion of the exterior of buried pipes"
    ],
    correctAnswer: 1,
    explanation: "Tuberculation is the formation of rust mounds (tubercles) on the interior surface of unlined cast iron or ductile iron pipes. Tubercles are composed of iron oxides and hydroxides. They significantly reduce the pipe's internal diameter and C-factor, increasing head loss and reducing flow capacity. Tuberculated pipes may also harbor bacteria.",
  },
  {
    id: 18,
    module: "Distribution System Components",
    question: "What is a pressure zone in a water distribution system?",
    options: [
      "An area where pressure is always zero",
      "A section of the distribution system where pressure is controlled within a specific range, typically separated by PRVs or pump stations",
      "An area where fire hydrants are located",
      "A zone where water quality monitoring is conducted"
    ],
    correctAnswer: 1,
    explanation: "A pressure zone is a section of the distribution system where pressure is maintained within a specific range (typically 275–690 kPa / 40–100 psi). Zones are created using PRVs, pump stations, or storage tanks. Multiple zones are used in hilly terrain to prevent excessive pressure in low-lying areas and maintain adequate pressure in high-elevation areas.",
  },
  {
    id: 19,
    module: "Distribution System Components",
    question: "What is the purpose of a blow-off (flush) valve at the end of a dead-end main?",
    options: [
      "To release pressure from the system",
      "To discharge stagnant water and sediment to maintain water quality",
      "To fill tanker trucks for emergency supply",
      "To connect the main to the wastewater system"
    ],
    correctAnswer: 1,
    explanation: "Blow-off (flush) valves at dead-end mains allow operators to discharge stagnant water and accumulated sediment. Regular flushing of dead ends maintains chlorine residual, removes sediment, and prevents bacterial regrowth. Flushing should be done at a velocity of at least 0.75 m/s (2.5 ft/s) to scour the pipe.",
  },
  {
    id: 20,
    module: "Distribution System Components",
    question: "What is a cross-connection in a water distribution system?",
    options: [
      "A pipe that crosses under a road",
      "Any actual or potential connection between the potable water supply and a source of contamination",
      "A connection between two different pressure zones",
      "A pipe fitting that changes direction"
    ],
    correctAnswer: 1,
    explanation: "A cross-connection is any actual or potential connection between the potable water supply and a source of contamination or pollution. Examples include a garden hose submerged in a swimming pool, a boiler connected to the water supply, or an irrigation system without backflow prevention. Cross-connections are the primary cause of distribution system contamination.",
  },
  {
    id: 21,
    module: "Distribution System Components",
    question: "What is the difference between backpressure and backsiphonage?",
    options: [
      "They are the same thing — both describe backflow",
      "Backpressure is backflow caused by downstream pressure exceeding supply pressure; backsiphonage is backflow caused by negative pressure (vacuum) in the supply",
      "Backpressure occurs in high-pressure zones; backsiphonage occurs in low-pressure zones",
      "Backpressure is caused by pumps; backsiphonage is caused by gravity"
    ],
    correctAnswer: 1,
    explanation: "Backpressure backflow occurs when downstream pressure (from a booster pump, elevated tank, or thermal expansion) exceeds the supply pressure. Backsiphonage occurs when negative pressure (vacuum) develops in the supply pipe, drawing contaminants back into the system — typically caused by a main break, heavy withdrawal, or firefighting.",
  },
  {
    id: 22,
    module: "Distribution System Components",
    question: "What type of backflow preventer provides the highest level of protection?",
    options: [
      "Atmospheric vacuum breaker (AVB)",
      "Pressure vacuum breaker (PVB)",
      "Double check valve assembly (DCVA)",
      "Reduced pressure zone (RPZ) backflow preventer"
    ],
    correctAnswer: 3,
    explanation: "The reduced pressure zone (RPZ) backflow preventer provides the highest level of protection. It has two independently acting check valves and a differential pressure relief valve that opens to atmosphere if either check fails. RPZs are required for high-hazard cross-connections (chemicals, sewage, etc.). They must be installed above grade and tested annually.",
  },
  {
    id: 23,
    module: "Distribution System Components",
    question: "What is the purpose of a water meter at a service connection?",
    options: [
      "To regulate pressure to the customer",
      "To measure the volume of water consumed by the customer for billing purposes",
      "To prevent backflow from the customer's plumbing",
      "To filter sediment from the water supply"
    ],
    correctAnswer: 1,
    explanation: "Water meters measure the volume of water consumed by customers for billing purposes. They also help utilities detect leaks (by comparing total production to metered consumption), identify unauthorized use, and manage demand. Common meter types include positive displacement, turbine, electromagnetic, and ultrasonic.",
  },
  {
    id: 24,
    module: "Distribution System Components",
    question: "What is 'non-revenue water' (NRW)?",
    options: [
      "Water that is treated but not yet distributed",
      "The difference between water produced/purchased and water billed to customers, including real losses (leakage) and apparent losses (meter errors, theft)",
      "Water used for flushing and maintenance",
      "Water stored in reservoirs"
    ],
    correctAnswer: 1,
    explanation: "Non-revenue water (NRW) is the difference between water entering the distribution system and water billed to customers. It includes real losses (physical leakage from pipes, joints, and fittings), apparent losses (meter under-registration, billing errors, unauthorized use), and authorized unbilled consumption (flushing, firefighting). High NRW indicates system inefficiency.",
  },
  {
    id: 25,
    module: "Distribution System Components",
    question: "What is the minimum cover depth for a water main in a cold climate to prevent freezing?",
    options: [
      "0.3 m (1 ft)",
      "0.6 m (2 ft)",
      "1.2–1.8 m (4–6 ft) or below the frost line",
      "3 m (10 ft)"
    ],
    correctAnswer: 2,
    explanation: "Water mains must be buried below the frost line to prevent freezing. In Canadian climates, this is typically 1.2–1.8 m (4–6 ft) or more depending on the region. The frost depth varies by location — northern communities may require deeper burial. Local design standards specify minimum cover requirements.",
  },
  {
    id: 26,
    module: "Distribution System Components",
    question: "What is cathodic protection and why is it used on buried metallic pipes?",
    options: [
      "A lining applied to the inside of pipes to prevent corrosion",
      "An electrochemical method to prevent external corrosion of buried metallic pipes by making them cathodic",
      "A coating applied to the outside of pipes to prevent UV degradation",
      "A chemical added to the water to prevent internal corrosion"
    ],
    correctAnswer: 1,
    explanation: "Cathodic protection prevents external corrosion of buried metallic pipes (ductile iron, steel) by making the pipe the cathode of an electrochemical cell. Two methods: sacrificial anode (attach a more active metal like magnesium or zinc that corrodes instead of the pipe) or impressed current (apply a DC current to make the pipe cathodic). Corrosion only occurs at the anode.",
  },
  {
    id: 27,
    module: "Distribution System Components",
    question: "What is the purpose of a valve box (valve vault)?",
    options: [
      "To store spare valves and fittings",
      "To provide access to buried valves for operation and maintenance",
      "To protect valves from water hammer",
      "To house pressure monitoring equipment"
    ],
    correctAnswer: 1,
    explanation: "Valve boxes (valve vaults) provide surface access to buried valves for operation and maintenance. They protect the valve operator (stem) from damage and allow operators to turn the valve without excavation. Valve boxes must be kept clear of debris, maintained at grade, and their locations recorded on system maps.",
  },
  {
    id: 28,
    module: "Distribution System Components",
    question: "What is the standard direction to close a gate valve?",
    options: [
      "Counterclockwise (left)",
      "Clockwise (right) — 'righty tighty'",
      "Either direction — gate valves can be closed in both directions",
      "Always requires a valve key — no standard direction"
    ],
    correctAnswer: 1,
    explanation: "Gate valves are closed by turning clockwise (right) — 'righty tighty, lefty loosey.' This is the standard for most valves. However, operators should always check the valve markings (OPEN/CLOSE arrows) before operating. Some older valves or specialized valves may operate differently.",
  },
  {
    id: 29,
    module: "Distribution System Components",
    question: "What is a hydrant flow test used to determine?",
    options: [
      "The chlorine residual at the hydrant location",
      "The available fire flow and residual pressure at a specific location in the distribution system",
      "The age and condition of the hydrant",
      "The pipe material and diameter at the hydrant location"
    ],
    correctAnswer: 1,
    explanation: "A hydrant flow test determines the available fire flow (L/min or gpm) and residual pressure at a specific location. One hydrant is flowed while pressure is measured at a nearby static hydrant. The test data is used to assess system capacity, identify weak areas, and verify fire flow requirements are met.",
  },
  {
    id: 30,
    module: "Distribution System Components",
    question: "What is the purpose of a water storage reservoir or elevated tank in a distribution system?",
    options: [
      "To treat water before distribution",
      "To provide storage for peak demand, fire flow, and emergency supply, and to equalize pressure",
      "To pump water to higher elevations only",
      "To remove sediment from the water"
    ],
    correctAnswer: 1,
    explanation: "Water storage (ground-level reservoirs, elevated tanks, standpipes) serves multiple purposes: equalizes pressure throughout the day, provides storage for peak demand periods, supplies fire flow, provides emergency supply during pump or power failures, and allows treatment plants to operate at a steady rate.",
  },
  {
    id: 31,
    module: "Distribution System Components",
    question: "What is the hydraulic grade line (HGL) in a distribution system?",
    options: [
      "The physical elevation of the pipe",
      "An imaginary line representing the pressure head (pressure/ρg + elevation) at any point in the system",
      "The flow velocity profile in a pipe",
      "The pipe diameter profile along a main"
    ],
    correctAnswer: 1,
    explanation: "The hydraulic grade line (HGL) represents the total pressure head (pressure head + elevation head) at any point in the system. For a pipe flowing full, the HGL shows where water would rise in a piezometer tube. The HGL slopes downward in the direction of flow due to friction losses. Pressure at any point = (HGL elevation − pipe elevation) × ρg.",
  },
  {
    id: 32,
    module: "Distribution System Components",
    question: "What is a 'main break' and what are the immediate steps an operator should take?",
    options: [
      "A planned maintenance shutdown — no immediate action needed",
      "An unplanned rupture of a water main — operator should isolate the break, notify supervisors, restore service, and repair the main",
      "A pressure drop in the system — operator should increase pump speed",
      "A valve failure — operator should bypass the valve"
    ],
    correctAnswer: 1,
    explanation: "A main break is an unplanned rupture of a water main. Immediate steps: (1) Locate and isolate the break by closing the nearest valves; (2) Notify supervisors and affected customers; (3) Assess the extent of service disruption; (4) Repair the main; (5) Flush and disinfect the repaired section; (6) Collect bacteriological samples before returning to service; (7) Document the event.",
  },
  {
    id: 33,
    module: "Distribution System Components",
    question: "What is the purpose of pipe flushing after a main repair?",
    options: [
      "To test the pressure in the repaired section",
      "To remove sediment, contamination, and air introduced during the repair, and to restore chlorine residual",
      "To check for leaks in the repaired section",
      "To fill the pipe with fresh water from the treatment plant"
    ],
    correctAnswer: 1,
    explanation: "After a main repair, flushing removes sediment, contamination (soil, debris), and air introduced during the repair. It also restores chlorine residual throughout the repaired section. Flushing should achieve a velocity of at least 0.75 m/s (2.5 ft/s). After flushing, bacteriological samples must be collected and pass before the main is returned to service.",
  },
  {
    id: 34,
    module: "Distribution System Components",
    question: "What is the purpose of a corporation stop on a service connection?",
    options: [
      "To measure water consumption",
      "To provide a shutoff at the main for the service connection",
      "To regulate pressure to the customer",
      "To prevent backflow from the customer's plumbing"
    ],
    correctAnswer: 1,
    explanation: "A corporation stop (corporation cock) is a valve installed directly in the water main at the point where the service connection taps into the main. It allows the utility to shut off the individual service at the main without affecting other customers. Corporation stops are typically made of brass and are installed using a tapping machine under pressure.",
  },
  {
    id: 35,
    module: "Distribution System Components",
    question: "What is the typical pipe diameter range for a distribution main (as opposed to a service line or transmission main)?",
    options: [
      "Less than 25 mm (1 in)",
      "25–75 mm (1–3 in)",
      "100–300 mm (4–12 in)",
      "Greater than 600 mm (24 in)"
    ],
    correctAnswer: 2,
    explanation: "Distribution mains typically range from 100–300 mm (4–12 in) in diameter. Service lines are typically 19–50 mm (3/4–2 in). Transmission mains are typically larger than 300 mm (12 in). The minimum recommended distribution main diameter for fire protection is 150 mm (6 in).",
  },
  {
    id: 36,
    module: "Distribution System Components",
    question: "What is a pressure sustaining valve (PSV) and how does it differ from a PRV?",
    options: [
      "They are the same device — PSV and PRV are interchangeable terms",
      "A PSV maintains a minimum upstream pressure; a PRV reduces downstream pressure to a set point",
      "A PSV increases pressure; a PRV decreases pressure",
      "A PSV is used for gas systems; a PRV is used for water systems"
    ],
    correctAnswer: 1,
    explanation: "A pressure sustaining valve (PSV) maintains a minimum upstream pressure by throttling flow — it prevents upstream pressure from dropping below a set point. A PRV reduces downstream pressure to a set point regardless of upstream pressure. PSVs are used to maintain pressure in upstream zones when downstream demand is high.",
  },
  {
    id: 37,
    module: "Distribution System Components",
    question: "What is the purpose of a check valve in a distribution system?",
    options: [
      "To regulate flow rate",
      "To allow flow in only one direction, preventing backflow",
      "To release air from the system",
      "To reduce pressure"
    ],
    correctAnswer: 1,
    explanation: "A check valve allows flow in only one direction and automatically closes to prevent backflow when flow reverses. Check valves are used on pump discharge lines, at connections between pressure zones, and in backflow prevention assemblies. Types include swing check, ball check, and tilting disc check valves.",
  },
  {
    id: 38,
    module: "Distribution System Components",
    question: "What is 'unaccounted-for water' (UAW) and how is it calculated?",
    options: [
      "Water that is treated but not distributed — calculated as Treatment − Distribution",
      "The difference between water produced and water billed — calculated as (Production − Billed Consumption) / Production × 100%",
      "Water used for flushing only — calculated from flushing records",
      "Water lost to evaporation — calculated from weather data"
    ],
    correctAnswer: 1,
    explanation: "Unaccounted-for water (UAW), now more commonly called non-revenue water (NRW), is calculated as: UAW% = (Production − Billed Consumption) / Production × 100%. It includes real losses (leakage), apparent losses (meter errors, theft), and authorized unbilled use (flushing, firefighting). A UAW% above 15–20% typically indicates significant leakage.",
    isCalc: true,
  },
  {
    id: 39,
    module: "Distribution System Components",
    question: "What is a 'boil water advisory' (BWA) and when is it issued?",
    options: [
      "An advisory issued when water pressure is too high",
      "An advisory issued when there is a risk of microbial contamination of the drinking water supply, advising customers to boil water before consumption",
      "An advisory issued when water temperature exceeds 25°C",
      "An advisory issued when chlorine residual is too high"
    ],
    correctAnswer: 1,
    explanation: "A boil water advisory (BWA) is issued when there is a risk of microbial contamination of the drinking water supply. Triggers include: main break with potential contamination, loss of disinfection, low pressure event, positive bacteriological sample, or turbidity exceedance. Customers are advised to boil water for at least 1 minute before drinking, cooking, or brushing teeth.",
  },
  {
    id: 40,
    module: "Distribution System Components",
    question: "What is the purpose of a water system map and what information should it contain?",
    options: [
      "A decorative map for the utility office — contains only major streets",
      "A record of the distribution system infrastructure — should contain pipe locations, sizes, materials, valve locations, hydrant locations, and service connections",
      "A map showing customer locations only",
      "A map showing water quality monitoring locations only"
    ],
    correctAnswer: 1,
    explanation: "A water system map is an essential operational and planning tool. It should contain: pipe locations, sizes, materials, and ages; valve locations and numbers; hydrant locations and flow data; service connection locations; storage facility locations; pump station locations; pressure zone boundaries; and water quality monitoring points. GIS-based maps are increasingly common.",
  },
  {
    id: 41,
    module: "Distribution System Components",
    question: "What is the recommended minimum separation distance between a water main and a sanitary sewer?",
    options: [
      "0.3 m (1 ft) horizontal",
      "3 m (10 ft) horizontal",
      "10 m (33 ft) horizontal",
      "30 m (100 ft) horizontal"
    ],
    correctAnswer: 1,
    explanation: "The recommended minimum horizontal separation between a water main and a sanitary sewer is 3 m (10 ft), and a minimum vertical separation of 0.5 m (18 in) with the water main above the sewer. When these separations cannot be maintained, special construction standards apply (e.g., pressure-tested joints, encasement). These requirements prevent cross-contamination.",
  },
  {
    id: 42,
    module: "Distribution System Components",
    question: "What is a 'wet tap' (hot tap)?",
    options: [
      "A connection made to a water main while it is under pressure, without shutting down the main",
      "A connection made to a water main after it has been drained",
      "A tap installed in a warm climate",
      "A temporary connection for construction water supply"
    ],
    correctAnswer: 0,
    explanation: "A wet tap (hot tap) is a connection made to a pressurized water main without shutting it down. A tapping machine drills through the pipe wall and installs a corporation stop or tapping sleeve while the main remains in service. This avoids service disruptions to other customers. Wet taps require specialized equipment and training.",
  },
  {
    id: 43,
    module: "Distribution System Components",
    question: "What is the purpose of a pressure relief valve (safety relief valve) on a hydropneumatic tank?",
    options: [
      "To maintain a minimum pressure in the tank",
      "To automatically release pressure if it exceeds a set maximum, preventing tank rupture",
      "To drain the tank for maintenance",
      "To add air to the tank to maintain the air cushion"
    ],
    correctAnswer: 1,
    explanation: "A pressure relief valve (safety relief valve) on a hydropneumatic tank automatically opens to release pressure if it exceeds a preset maximum, preventing tank rupture or explosion. It is a critical safety device. Relief valves must be regularly tested and maintained. The set pressure must not exceed the tank's rated working pressure.",
  },
  {
    id: 44,
    module: "Distribution System Components",
    question: "What is pipe bedding and why is it important?",
    options: [
      "The lining inside a pipe to prevent corrosion",
      "The material placed under and around a buried pipe to support it and distribute loads",
      "The joint compound used to seal pipe connections",
      "The insulation wrapped around pipes in cold climates"
    ],
    correctAnswer: 1,
    explanation: "Pipe bedding is the material placed under and around a buried pipe to provide uniform support, distribute soil and traffic loads, and prevent point loading that could crack the pipe. Proper bedding (typically granular material like sand or crushed stone) is critical for pipe longevity. Bedding requirements vary by pipe material and trench conditions.",
  },
  {
    id: 45,
    module: "Distribution System Components",
    question: "What is a 'pressure transient' and how can it damage a distribution system?",
    options: [
      "A gradual pressure change over hours — causes pipe fatigue over time",
      "A sudden, rapid pressure change (surge) that can cause pipe rupture, joint failure, meter damage, and backflow",
      "A seasonal pressure variation — no damage potential",
      "A pressure difference between two zones — managed by PRVs"
    ],
    correctAnswer: 1,
    explanation: "A pressure transient (surge) is a sudden, rapid pressure change caused by water hammer, pump start/stop, or rapid valve operation. Positive transients can rupture pipes and damage meters; negative transients can cause pipe collapse, joint failure, and backsiphonage of contaminants. Transients are managed with slow-closing valves, surge tanks, and pressure relief valves.",
  },
  {
    id: 46,
    module: "Distribution System Components",
    question: "What is the purpose of a thrust block at a pipe fitting?",
    options: [
      "To support the weight of the pipe",
      "To resist the unbalanced hydraulic thrust forces at bends, tees, reducers, and dead ends",
      "To prevent pipe movement due to temperature changes",
      "To anchor the pipe to prevent flotation in high water table areas"
    ],
    correctAnswer: 1,
    explanation: "Thrust blocks are concrete masses cast against undisturbed soil at pipe fittings (bends, tees, reducers, dead ends) to resist unbalanced hydraulic thrust forces. Pressure in a pipe exerts force at changes in direction or diameter. Without thrust restraint, fittings can pull apart. Thrust blocks transfer the force to the surrounding soil. Mechanical joint restraints are an alternative.",
  },
  {
    id: 47,
    module: "Distribution System Components",
    question: "What is a 'water age' and why is it important for water quality?",
    options: [
      "The age of the water treatment plant",
      "The time water has spent in the distribution system since leaving the treatment plant — older water has lower chlorine residual and higher DBP formation potential",
      "The age of the water source",
      "The time since the last water quality test"
    ],
    correctAnswer: 1,
    explanation: "Water age is the time water has spent in the distribution system since leaving the treatment plant. As water age increases: chlorine residual decreases (increasing microbial risk); disinfection by-products (DBPs) may increase; taste and odour can deteriorate. Long water age occurs in dead ends, oversized mains, and large storage tanks. System design should minimize water age.",
  },
  {
    id: 48,
    module: "Distribution System Components",
    question: "What is the purpose of a fire hydrant 'dry barrel' design in cold climates?",
    options: [
      "To prevent water from freezing in the hydrant barrel between uses",
      "To reduce the weight of the hydrant",
      "To allow the hydrant to be used without a wrench",
      "To prevent vandalism"
    ],
    correctAnswer: 0,
    explanation: "A dry barrel hydrant keeps the barrel (the above-ground portion) empty of water between uses, preventing freezing in cold climates. The main valve is located below the frost line. When the hydrant is opened, water fills the barrel; when closed, the barrel drains back into the ground through a drain port. Wet barrel hydrants (used in warm climates) have water in the barrel at all times.",
  },
  {
    id: 49,
    module: "Distribution System Components",
    question: "What is a 'tapping sleeve' used for?",
    options: [
      "To repair a leaking pipe joint",
      "To make a new connection to an existing main without shutting it down",
      "To reduce the diameter of a pipe",
      "To protect a pipe from external corrosion"
    ],
    correctAnswer: 1,
    explanation: "A tapping sleeve is a mechanical fitting clamped onto an existing main to allow a new branch connection to be made under pressure (wet tap). The sleeve provides a sealed work area for the tapping machine to drill through the pipe wall and install a gate valve. Tapping sleeves are used for new service connections, main extensions, and system upgrades.",
  },
  {
    id: 50,
    module: "Distribution System Components",
    question: "What is the purpose of a 'system hydraulic model' for a water distribution system?",
    options: [
      "A physical scale model of the distribution system for display purposes",
      "A computer simulation of the distribution system used to analyze pressures, flows, and water quality under various conditions",
      "A manual calculation method for pipe sizing",
      "A map showing the physical layout of the system"
    ],
    correctAnswer: 1,
    explanation: "A hydraulic model (e.g., EPANET, WaterGEMS) is a computer simulation of the distribution system. It models pipe flows, pressures, pump operations, storage levels, and water quality (chlorine decay, water age) under various demand scenarios. Models are used for system planning, fire flow analysis, pressure zone design, and emergency response planning.",
  },

  // ─── MODULE 2: Equipment Installation, Operation, Maintenance & Repair (45 questions) ───
  {
    id: 51,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of priming a centrifugal pump before starting?",
    options: [
      "To lubricate the pump bearings",
      "To fill the pump casing with water so it can develop suction and discharge pressure",
      "To test the pump motor for correct rotation",
      "To flush the pump of any debris before operation"
    ],
    correctAnswer: 1,
    explanation: "Centrifugal pumps must be primed (filled with water) before starting because they cannot pump air — they rely on the centrifugal force of water to develop pressure. A dry pump will not develop suction, will overheat, and the mechanical seal and impeller can be damaged. Self-priming pumps have a built-in mechanism to re-prime automatically.",
  },
  {
    id: 52,
    module: "Equipment Installation, O&M & Repair",
    question: "What is cavitation in a centrifugal pump and what causes it?",
    options: [
      "The buildup of scale on the impeller — caused by hard water",
      "The formation and collapse of vapor bubbles in the pump — caused by the liquid pressure dropping below its vapor pressure",
      "Air entering the pump suction — caused by a loose suction fitting",
      "Vibration of the pump — caused by misalignment"
    ],
    correctAnswer: 1,
    explanation: "Cavitation occurs when the liquid pressure at the pump inlet drops below the vapor pressure of the liquid, causing vapor bubbles to form. When these bubbles move to higher-pressure areas in the pump, they collapse violently, causing noise (like gravel in the pump), vibration, pitting of the impeller, and reduced pump performance. Causes include high suction lift, high liquid temperature, or excessive flow rate.",
  },
  {
    id: 53,
    module: "Equipment Installation, O&M & Repair",
    question: "What does NPSH stand for and why is it important for pump selection?",
    options: [
      "Net Positive Suction Head — the minimum pressure required at the pump inlet to prevent cavitation",
      "Net Pressure Surge Height — the maximum pressure the pump can withstand",
      "Normal Pump Suction Height — the typical suction lift for a pump",
      "Net Pump Speed Head — the relationship between pump speed and head"
    ],
    correctAnswer: 0,
    explanation: "NPSH (Net Positive Suction Head) is the minimum pressure required at the pump inlet to prevent cavitation. NPSHr (required) is a pump characteristic from the manufacturer; NPSHa (available) is determined by the system. For safe operation, NPSHa must exceed NPSHr by a safety margin (typically 0.5–1.0 m). If NPSHa < NPSHr, cavitation will occur.",
    isCalc: true,
  },
  {
    id: 54,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump curve?",
    options: [
      "To show the physical dimensions of the pump",
      "To show the relationship between pump head (pressure) and flow rate, and to select the operating point",
      "To show the pump's power consumption at different speeds",
      "To show the pump's efficiency at different temperatures"
    ],
    correctAnswer: 1,
    explanation: "A pump curve (H-Q curve) shows the relationship between the pump's head (pressure) and flow rate. As flow increases, head decreases. The system curve shows the head required by the system at different flow rates. The operating point is where the pump curve and system curve intersect. Pump curves also show efficiency and power consumption.",
  },
  {
    id: 55,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pressure gauge on a pump discharge?",
    options: [
      "To measure the flow rate through the pump",
      "To monitor the discharge pressure and detect pump problems",
      "To control the pump speed automatically",
      "To measure the water temperature"
    ],
    correctAnswer: 1,
    explanation: "A pressure gauge on the pump discharge monitors the discharge pressure, which indicates pump performance. Abnormally low discharge pressure may indicate a broken impeller, worn wear rings, or excessive flow. Abnormally high pressure may indicate a closed valve or system blockage. Suction pressure gauges monitor for cavitation conditions.",
  },
  {
    id: 56,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump mechanical seal?",
    options: [
      "To seal the pump casing to prevent external leakage",
      "To seal the rotating shaft where it exits the pump casing, preventing water from leaking along the shaft",
      "To seal the pump suction flange",
      "To seal the impeller to the shaft"
    ],
    correctAnswer: 1,
    explanation: "A mechanical seal prevents water from leaking along the rotating pump shaft where it exits the casing. It consists of two flat faces (one rotating with the shaft, one stationary) held together by spring pressure. Mechanical seals require a small amount of leakage for lubrication and cooling. Excessive leakage indicates seal wear and replacement is needed.",
  },
  {
    id: 57,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump packing (stuffing box)?",
    options: [
      "To pack the pump for shipping",
      "An older method of sealing the pump shaft using compressed packing rings — allows a small, controlled drip for lubrication",
      "To insulate the pump from vibration",
      "To protect the pump from freezing"
    ],
    correctAnswer: 1,
    explanation: "Pump packing (stuffing box) is an older shaft sealing method using compressed rings of packing material (graphite, PTFE, etc.) around the shaft. A gland nut compresses the packing to control leakage. A small, controlled drip (1–3 drops/second) is required for lubrication and cooling. Too tight causes shaft wear and overheating; too loose causes excessive leakage.",
  },
  {
    id: 58,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a variable frequency drive (VFD) on a distribution pump?",
    options: [
      "To protect the pump motor from power surges",
      "To vary the pump speed to match system demand, saving energy and reducing pressure surges",
      "To start the pump motor gradually to reduce starting current",
      "To monitor pump performance and detect faults"
    ],
    correctAnswer: 1,
    explanation: "A variable frequency drive (VFD) varies the speed of the pump motor by changing the frequency of the electrical supply. This allows the pump to match its output to system demand — reducing speed during low demand saves significant energy (power varies with the cube of speed). VFDs also provide soft-start capability, reducing water hammer and motor starting current.",
  },
  {
    id: 59,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a check valve on the pump discharge?",
    options: [
      "To regulate pump flow rate",
      "To prevent backflow through the pump when it is stopped, protecting the pump from reverse rotation",
      "To reduce pressure fluctuations in the discharge line",
      "To measure pump flow rate"
    ],
    correctAnswer: 1,
    explanation: "A check valve on the pump discharge prevents backflow through the pump when it is stopped. Without a check valve, water in the discharge line would flow backward through the pump, causing reverse rotation that can damage the motor and pump. Check valves also maintain system pressure when the pump is off.",
  },
  {
    id: 60,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump isolation valve?",
    options: [
      "To control pump flow rate during normal operation",
      "To isolate the pump from the system for maintenance or replacement without draining the system",
      "To prevent backflow through the pump",
      "To regulate pump suction pressure"
    ],
    correctAnswer: 1,
    explanation: "Isolation valves (gate or butterfly valves) on both the suction and discharge of a pump allow the pump to be isolated from the system for maintenance, repair, or replacement without draining the entire system. The suction isolation valve also allows the pump casing to be drained for maintenance.",
  },
  {
    id: 61,
    module: "Equipment Installation, O&M & Repair",
    question: "What does 'pump efficiency' mean and how is it calculated?",
    options: [
      "The ratio of water output to electricity input — calculated as Flow × Head / Motor Power",
      "The ratio of useful hydraulic power output to shaft power input — calculated as (Flow × Head × ρg) / Shaft Power",
      "The ratio of pump uptime to total time — calculated as Operating Hours / Total Hours",
      "The ratio of actual flow to rated flow — calculated as Actual Flow / Rated Flow"
    ],
    correctAnswer: 1,
    explanation: "Pump efficiency = (Hydraulic Power Output) / (Shaft Power Input) = (Q × H × ρ × g) / P_shaft. Overall (wire-to-water) efficiency also includes motor efficiency: η_overall = η_pump × η_motor. Typical pump efficiencies: 70–85%. Efficiency decreases as the pump operates away from its best efficiency point (BEP). Monitoring efficiency helps detect wear.",
    isCalc: true,
  },
  {
    id: 62,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pressure switch on a hydropneumatic (pressure tank) system?",
    options: [
      "To measure water pressure for billing purposes",
      "To automatically start and stop the pump to maintain pressure within a set range",
      "To release excess pressure from the tank",
      "To monitor water quality in the tank"
    ],
    correctAnswer: 1,
    explanation: "A pressure switch automatically starts the pump when pressure drops to the 'cut-in' pressure and stops it when pressure reaches the 'cut-out' pressure. This maintains system pressure within a set range without continuous pump operation. The pressure differential (cut-out minus cut-in) is typically 35–70 kPa (5–10 psi). Short cycling (frequent start/stop) indicates a waterlogged tank.",
  },
  {
    id: 63,
    module: "Equipment Installation, O&M & Repair",
    question: "What is 'pump short cycling' and what causes it?",
    options: [
      "The pump running at reduced speed — caused by low voltage",
      "The pump starting and stopping very frequently — often caused by a waterlogged pressure tank (insufficient air cushion)",
      "The pump running in reverse — caused by a failed check valve",
      "The pump overheating — caused by running at low flow"
    ],
    correctAnswer: 1,
    explanation: "Pump short cycling is the pump starting and stopping very frequently (many times per hour). The most common cause is a waterlogged pressure tank — the air cushion has been absorbed into the water, leaving little water storage capacity. Each pump start/stop cycle is hard on the motor (high starting current, mechanical stress). Short cycling is detected by monitoring pump start frequency.",
  },
  {
    id: 64,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a flow meter in a distribution system?",
    options: [
      "To control the flow rate automatically",
      "To measure the volume or rate of water flowing through a pipe for billing, operations, or leak detection",
      "To filter sediment from the water",
      "To regulate pressure in the system"
    ],
    correctAnswer: 1,
    explanation: "Flow meters measure the volume or rate of water flow. Types include: magnetic (electromagnetic) meters (no moving parts, accurate, suitable for all water types), turbine meters, Venturi meters, orifice plates, and ultrasonic meters. Flow meters are used for production metering, customer billing, leak detection (district metering), and operational monitoring.",
  },
  {
    id: 65,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pressure reducing valve (PRV) maintenance program?",
    options: [
      "PRVs are maintenance-free and do not require a maintenance program",
      "To ensure PRVs are operating correctly, set to the correct pressure, and not leaking — includes regular inspection, testing, and cleaning",
      "To replace PRVs on a fixed schedule regardless of condition",
      "To monitor PRV performance for billing purposes"
    ],
    correctAnswer: 1,
    explanation: "PRVs require regular maintenance to ensure correct operation. Maintenance includes: checking downstream pressure against set point; inspecting for leakage; cleaning the strainer (if installed); inspecting and replacing diaphragm, springs, and seats as needed; and verifying the pilot valve operation. Poorly maintained PRVs can fail open (causing high pressure) or fail closed (causing low pressure).",
  },
  {
    id: 66,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a valve exercising program?",
    options: [
      "To test the physical fitness of operators",
      "To regularly operate distribution valves to ensure they function when needed and to prevent them from seizing",
      "To replace valves on a fixed schedule",
      "To record valve locations on system maps"
    ],
    correctAnswer: 1,
    explanation: "A valve exercising program involves regularly operating (opening and closing) distribution valves to ensure they function correctly when needed for isolations and repairs. Valves that are not exercised can seize (become inoperable) due to corrosion, mineral deposits, or debris. Programs typically exercise each valve annually or on a multi-year cycle, recording the number of turns and any problems.",
  },
  {
    id: 67,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a hydrant flushing program?",
    options: [
      "To test hydrant flow for fire fighting capacity only",
      "To remove sediment and stale water from dead ends and low-flow areas, maintain chlorine residual, and verify hydrant operability",
      "To paint and maintain the exterior of hydrants",
      "To check hydrant thread compatibility with fire department equipment"
    ],
    correctAnswer: 1,
    explanation: "A hydrant flushing program serves multiple purposes: removes sediment and stale water from dead ends and low-flow areas; restores chlorine residual; verifies hydrant operability (opens, closes, drains correctly); identifies hydrants that need maintenance; and improves water quality for customers. Flushing is typically done seasonally (spring and fall) or as needed based on water quality complaints.",
  },
  {
    id: 68,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a leak detection program?",
    options: [
      "To detect leaks in customer plumbing",
      "To identify and locate leaks in the distribution system to reduce water loss and prevent main breaks",
      "To detect leaks in the water treatment plant",
      "To monitor for chemical leaks near the water source"
    ],
    correctAnswer: 1,
    explanation: "A leak detection program identifies and locates leaks in the distribution system to reduce non-revenue water (NRW), prevent main breaks, and reduce water loss. Methods include: acoustic leak detection (listening devices, correlators); district metering (comparing inflow to outflow in a zone); pressure testing; and visual inspection. Early leak detection prevents costly main breaks and contamination events.",
  },
  {
    id: 69,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pipe cleaning (pigging) program?",
    options: [
      "To inspect pipe condition using a camera",
      "To remove sediment, biofilm, and tuberculation from pipe interiors using mechanical or hydraulic cleaning devices (pigs)",
      "To apply internal lining to corroded pipes",
      "To test pipe pressure integrity"
    ],
    correctAnswer: 1,
    explanation: "Pipe cleaning (pigging) uses mechanical devices (pigs) or high-velocity water to remove sediment, biofilm, and tuberculation from pipe interiors. Cleaning restores flow capacity (improves C-factor), improves water quality (removes biofilm and sediment that harbor bacteria), and extends pipe life. After cleaning, pipes are disinfected and bacteriologically tested before returning to service.",
  },
  {
    id: 70,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the procedure for disinfecting a new or repaired water main before placing it in service?",
    options: [
      "Simply flush the main with water until it runs clear",
      "Fill the main with a chlorine solution (typically 50 mg/L free chlorine), hold for 24 hours, flush to waste, and collect bacteriological samples",
      "Add chlorine tablets to the main and flush immediately",
      "Test the main for pressure integrity only — no disinfection required"
    ],
    correctAnswer: 1,
    explanation: "New or repaired mains must be disinfected before service per AWWA C651. The continuous feed method fills the main with a high-chlorine solution (typically 25–50 mg/L free chlorine), holds for 24 hours (or 3 hours at higher concentrations), flushes to waste (dechlorinating if required), and collects bacteriological samples. Two consecutive days of satisfactory samples are required before the main is placed in service.",
  },
  {
    id: 71,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pressure test on a new water main before placing it in service?",
    options: [
      "To verify the pipe material meets specifications",
      "To verify the integrity of the pipe, joints, and fittings by pressurizing the main above operating pressure and checking for leaks",
      "To test the pump capacity for the new main",
      "To verify the pipe is correctly aligned"
    ],
    correctAnswer: 1,
    explanation: "A pressure test (hydrostatic test) verifies the integrity of a new or repaired main before service. The main is pressurized to 1.5× the maximum operating pressure (or per AWWA C600) and held for a specified time. Leakage is measured and compared to allowable limits. All joints, fittings, and valves are inspected for leaks. The test must pass before disinfection and service.",
  },
  {
    id: 72,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station SCADA system?",
    options: [
      "To manually control pump operations from the station",
      "To remotely monitor and control pump station operations, collect data, and generate alarms",
      "To measure water quality at the pump station",
      "To calculate pump efficiency"
    ],
    correctAnswer: 1,
    explanation: "SCADA (Supervisory Control and Data Acquisition) systems remotely monitor and control pump station operations. They collect real-time data (pressures, flows, levels, pump status), generate alarms for abnormal conditions, allow remote control of pumps and valves, and store historical data for analysis. SCADA reduces the need for on-site operators and improves response time to system events.",
  },
  {
    id: 73,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station emergency generator?",
    options: [
      "To provide power for the pump station office",
      "To maintain pump operations during power outages, ensuring continuous water supply",
      "To provide backup power for SCADA systems only",
      "To power the pump station lighting during maintenance"
    ],
    correctAnswer: 1,
    explanation: "Emergency generators provide backup power to maintain pump operations during power outages. Without backup power, pumps stop, system pressure drops, storage tanks drain, and customers lose water service. Generators must be sized to power all critical equipment (pumps, controls, lighting), regularly tested under load, and fueled for extended outages.",
  },
  {
    id: 74,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station wet well?",
    options: [
      "To store chemicals for pump station operations",
      "To collect and store water before pumping, providing a buffer between inflow and pump capacity",
      "To treat water before pumping",
      "To store emergency water supply"
    ],
    correctAnswer: 1,
    explanation: "A pump station wet well (or sump) collects and stores water before pumping, providing a buffer between inflow and pump capacity. The wet well level controls pump operation (pumps start at high level, stop at low level). Wet well sizing must balance storage capacity (to prevent short cycling) with water age (to prevent stagnation and water quality deterioration).",
  },
  {
    id: 75,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump bearing lubrication program?",
    options: [
      "To reduce friction and wear on pump bearings, extending pump life and preventing failures",
      "To cool the pump motor",
      "To seal the pump shaft",
      "To balance the pump impeller"
    ],
    correctAnswer: 0,
    explanation: "Pump bearings require regular lubrication to reduce friction, prevent wear, and extend bearing life. Over-lubrication can be as damaging as under-lubrication — excess grease causes overheating. Lubrication intervals and grease types are specified by the manufacturer. Bearing temperature and vibration monitoring can detect bearing problems before failure.",
  },
  {
    id: 76,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of vibration monitoring on pumps and motors?",
    options: [
      "To measure water flow through the pump",
      "To detect mechanical problems (bearing wear, imbalance, misalignment, cavitation) before they cause failure",
      "To measure pump efficiency",
      "To control pump speed"
    ],
    correctAnswer: 1,
    explanation: "Vibration monitoring detects mechanical problems in pumps and motors before they cause failure. Increased vibration can indicate: bearing wear or failure; impeller imbalance or damage; shaft misalignment; cavitation; or loose components. Regular vibration measurements (baseline + trending) allow predictive maintenance, reducing unexpected failures and repair costs.",
  },
  {
    id: 77,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a storage tank inspection program?",
    options: [
      "To measure water quality in the tank",
      "To assess the structural condition, interior coating, and cleanliness of storage tanks, and to identify maintenance needs",
      "To test the tank overflow and drain systems",
      "To verify tank capacity meets demand requirements"
    ],
    correctAnswer: 1,
    explanation: "Storage tank inspections assess: structural condition (cracks, corrosion, settlement); interior coating condition (blistering, peeling, bare metal); cleanliness (sediment, biofilm, debris); inlet/outlet piping; overflow and drain systems; access hatches and vents; and security. Tanks should be inspected every 3–5 years. Deficiencies must be corrected to maintain water quality and structural integrity.",
  },
  {
    id: 78,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a storage tank cleaning program?",
    options: [
      "To remove the tank from service for replacement",
      "To remove sediment, biofilm, and debris from the tank interior to maintain water quality",
      "To apply a new interior coating to the tank",
      "To test the tank for structural integrity"
    ],
    correctAnswer: 1,
    explanation: "Storage tank cleaning removes sediment (which can harbor bacteria and reduce storage capacity), biofilm (which can cause taste/odour and microbial contamination), and debris. Tanks should be cleaned every 3–5 years or as needed based on inspection results. After cleaning, tanks are disinfected per AWWA C652 and bacteriologically tested before returning to service.",
  },
  {
    id: 79,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a chlorine booster station in a distribution system?",
    options: [
      "To add chlorine to the water at the treatment plant",
      "To add chlorine at a point in the distribution system to maintain adequate residual in distant or large systems",
      "To remove excess chlorine from the water before delivery to customers",
      "To monitor chlorine residual in the distribution system"
    ],
    correctAnswer: 1,
    explanation: "Chlorine booster stations add chlorine at strategic points in the distribution system to maintain adequate residual in areas far from the treatment plant or in large systems where chlorine demand exceeds what can be applied at the plant. Boosters prevent low residual (microbial risk) and reduce the need for very high chlorine doses at the plant (which can increase DBP formation).",
  },
  {
    id: 80,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a backflow preventer testing program?",
    options: [
      "To test the water pressure at customer service connections",
      "To verify that backflow prevention assemblies are functioning correctly and providing the required level of protection",
      "To test the flow rate at customer service connections",
      "To inspect customer plumbing for cross-connections"
    ],
    correctAnswer: 1,
    explanation: "Backflow preventer testing programs verify that assemblies (RPZs, DCVAs, PVBs) are functioning correctly. Assemblies must be tested annually by a certified tester using calibrated differential pressure gauges. Failed assemblies must be repaired or replaced immediately. Testing records must be maintained. Untested assemblies may fail to prevent backflow during a contamination event.",
  },
  {
    id: 81,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a water meter replacement program?",
    options: [
      "To upgrade meters to smart meters for remote reading",
      "To replace aging meters that have become inaccurate (typically under-registering) to reduce apparent losses and improve revenue",
      "To replace meters that have been damaged by customers",
      "To replace meters with higher-capacity meters as customer demand increases"
    ],
    correctAnswer: 1,
    explanation: "Water meters become less accurate over time, typically under-registering flow (especially at low flows). Under-registering meters cause apparent losses (revenue loss) and inaccurate consumption data. Meter replacement programs replace meters based on age (typically 15–20 years) or accuracy testing. Replacing old meters typically pays for itself through recovered revenue.",
  },
  {
    id: 82,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a cathodic protection monitoring program?",
    options: [
      "To monitor water quality in the distribution system",
      "To verify that cathodic protection systems are providing adequate protection to buried metallic pipes and structures",
      "To monitor pipe pressure in the distribution system",
      "To detect leaks in buried pipes"
    ],
    correctAnswer: 1,
    explanation: "Cathodic protection monitoring verifies that the system is providing adequate protection. For impressed current systems: check rectifier output (voltage and current), measure pipe-to-soil potential (must be more negative than −0.85 V vs. Cu/CuSO₄ reference electrode). For sacrificial anode systems: measure anode current output and pipe-to-soil potential. Annual surveys are typically required.",
  },
  {
    id: 83,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump performance test?",
    options: [
      "To test the pump motor for correct rotation direction",
      "To verify the pump is operating on its curve (correct head and flow relationship) and detect performance degradation",
      "To test the pump for leaks",
      "To measure the pump noise level"
    ],
    correctAnswer: 1,
    explanation: "A pump performance test measures head and flow at the current operating point and compares it to the pump curve. Performance degradation (reduced head or flow at the same speed) indicates wear of impeller wear rings, impeller erosion, or internal recirculation. Regular testing allows trending of pump condition and planning of maintenance before failure.",
  },
  {
    id: 84,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station confined space entry program?",
    options: [
      "To allow operators to enter pump stations without safety equipment",
      "To ensure safe entry into confined spaces (wet wells, valve vaults) by following established safety procedures including atmospheric testing, ventilation, and standby person",
      "To restrict access to pump stations to authorized personnel only",
      "To inspect pump stations for structural deficiencies"
    ],
    correctAnswer: 1,
    explanation: "Confined space entry programs ensure safe entry into permit-required confined spaces (wet wells, valve vaults, underground chambers). Required procedures: atmospheric testing (O₂, combustible gases, H₂S); forced ventilation; lockout/tagout of energy sources; use of appropriate PPE; a trained attendant outside; and rescue equipment on site. Confined space entry is a leading cause of water utility fatalities.",
  },
  {
    id: 85,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pipe condition assessment program?",
    options: [
      "To determine the age of buried pipes",
      "To evaluate the structural and hydraulic condition of distribution pipes to prioritize rehabilitation and replacement",
      "To measure water quality in the distribution system",
      "To detect leaks in buried pipes"
    ],
    correctAnswer: 1,
    explanation: "Pipe condition assessment evaluates the structural condition (wall thickness, corrosion, cracks) and hydraulic condition (C-factor, carrying capacity) of distribution pipes. Methods include: CCTV inspection; acoustic emission testing; electromagnetic inspection; pressure testing; and flow testing. Assessment data is used to prioritize pipe rehabilitation (lining) or replacement in capital planning.",
  },
  {
    id: 86,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a 'no-dig' (trenchless) pipe rehabilitation method?",
    options: [
      "To replace pipes without excavation, reducing cost, disruption, and surface restoration",
      "To install new pipes alongside existing pipes",
      "To clean pipes without removing them from service",
      "To inspect pipes without excavation"
    ],
    correctAnswer: 0,
    explanation: "Trenchless rehabilitation methods (CIPP lining, slip lining, pipe bursting) rehabilitate or replace deteriorated pipes without excavation. Benefits: reduced cost (no excavation, backfill, or surface restoration); reduced disruption to traffic and businesses; faster completion; and preservation of existing pipe alignment. Common methods: cured-in-place pipe (CIPP) lining installs a resin-impregnated liner inside the existing pipe.",
  },
  {
    id: 87,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a 'district metered area' (DMA) in leak detection?",
    options: [
      "A billing district where all customers are metered",
      "A defined zone in the distribution system where all inflows and outflows are metered to calculate the water balance and detect leakage",
      "An area where water quality monitoring is concentrated",
      "A pressure zone bounded by PRVs"
    ],
    correctAnswer: 1,
    explanation: "A district metered area (DMA) is a defined zone where all inflows and outflows are metered. The minimum night flow (MNF) — typically measured between 2–4 AM when customer demand is lowest — is used to estimate leakage. If MNF exceeds expected legitimate night use, leakage is present. DMAs allow utilities to prioritize leak detection efforts and track leakage reduction over time.",
  },
  {
    id: 88,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a 'step test' in leak detection?",
    options: [
      "A test of pump performance at different speeds",
      "A method to locate leaks by progressively closing valves in a DMA to identify the pipe section with the highest leakage",
      "A pressure test of a new pipe section",
      "A flow test of a fire hydrant"
    ],
    correctAnswer: 1,
    explanation: "A step test locates leaks within a DMA by progressively closing valves to isolate pipe sections. As each section is isolated, the change in minimum night flow indicates the leakage in that section. The section with the largest flow reduction when isolated contains the most leakage. Step tests narrow down the location for acoustic leak detection equipment.",
  },
  {
    id: 89,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a 'ground penetrating radar' (GPR) survey of a distribution system?",
    options: [
      "To detect water quality contamination in the soil",
      "To locate buried pipes, valves, and other underground infrastructure without excavation",
      "To measure soil contamination from pipe leaks",
      "To assess pipe wall thickness"
    ],
    correctAnswer: 1,
    explanation: "Ground penetrating radar (GPR) uses radar pulses to image the subsurface, locating buried pipes, valves, service connections, and other infrastructure. GPR is useful when records are incomplete or inaccurate. It can also detect voids (caused by leaks eroding soil) and assess pavement condition over buried pipes. GPR does not require excavation and can be used on paved surfaces.",
  },
  {
    id: 90,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump station 'wet well level control' system?",
    options: [
      "To measure the water quality in the wet well",
      "To automatically control pump operation based on wet well water level, maintaining level within acceptable limits",
      "To prevent the wet well from overflowing",
      "To measure the inflow to the wet well"
    ],
    correctAnswer: 1,
    explanation: "Wet well level control systems automatically start and stop pumps based on the water level in the wet well. Pumps start when the level rises to the 'start' setpoint and stop when it drops to the 'stop' setpoint. Multiple pumps may have different start/stop levels for lead/lag operation. Level sensors (float switches, pressure transducers, ultrasonic) provide the level signal.",
  },
  {
    id: 91,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a pump alignment check?",
    options: [
      "To verify the pump is installed level",
      "To verify the pump shaft and motor shaft are correctly aligned to prevent vibration, bearing wear, and seal failure",
      "To verify the pump impeller is correctly positioned",
      "To verify the pump is connected to the correct pipe"
    ],
    correctAnswer: 1,
    explanation: "Pump alignment verifies that the pump shaft and motor shaft are correctly aligned (both angularly and parallel). Misalignment causes vibration, premature bearing failure, mechanical seal failure, and shaft fatigue. Alignment is checked with dial indicators or laser alignment tools. Alignment should be checked after installation, after any maintenance, and periodically during operation.",
  },
  {
    id: 92,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a 'pump run-out' condition and why is it a concern?",
    options: [
      "The pump running at its maximum efficiency point — no concern",
      "The pump operating at a flow rate far exceeding its design point — causes cavitation, overloading of the motor, and reduced pump life",
      "The pump running continuously without stopping — causes overheating",
      "The pump running in reverse — causes impeller damage"
    ],
    correctAnswer: 1,
    explanation: "Pump run-out occurs when the pump operates at a flow rate far exceeding its design point (far to the right of the pump curve). At run-out: head is very low; flow is very high; NPSHr increases (cavitation risk); motor may be overloaded; and pump efficiency is very low. Run-out can occur when a valve is opened too far or when a pipe break occurs. Throttling the discharge valve or installing a flow control valve prevents run-out.",
  },
  {
    id: 93,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a 'pump deadhead' condition and why is it a concern?",
    options: [
      "The pump operating at zero flow (against a closed valve) — causes overheating and potential pump damage",
      "The pump operating at maximum flow — causes cavitation",
      "The pump running at reduced speed — causes vibration",
      "The pump running in reverse — causes impeller damage"
    ],
    correctAnswer: 0,
    explanation: "Pump deadhead (shutoff) occurs when the pump operates against a closed discharge valve (zero flow). The pump recirculates water internally, which rapidly heats the water. Overheating can damage the mechanical seal, cause thermal expansion of the casing, and in extreme cases cause the water to flash to steam. Centrifugal pumps should never be operated at shutoff for more than a few minutes.",
  },
  {
    id: 94,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a 'motor insulation resistance test' (megger test)?",
    options: [
      "To measure the motor's power consumption",
      "To test the electrical insulation of the motor windings to detect moisture, contamination, or insulation breakdown before failure",
      "To measure the motor's rotational speed",
      "To test the motor's starting current"
    ],
    correctAnswer: 1,
    explanation: "A megger test (insulation resistance test) applies a high DC voltage (typically 500–1000V) to the motor windings and measures the resistance of the insulation. Low insulation resistance indicates moisture, contamination, or insulation breakdown — which can lead to motor failure or electrical hazard. Megger tests are performed during commissioning, after maintenance, and periodically as part of a predictive maintenance program.",
  },
  {
    id: 95,
    module: "Equipment Installation, O&M & Repair",
    question: "What is the purpose of a 'valve packing' replacement?",
    options: [
      "To replace the valve with a new one",
      "To replace the packing material in the valve stem gland to prevent leakage around the stem",
      "To replace the valve seat to improve sealing",
      "To replace the valve operator (handwheel or actuator)"
    ],
    correctAnswer: 1,
    explanation: "Valve packing is the sealing material in the valve stem gland that prevents water from leaking along the stem. Over time, packing compresses and wears, causing stem leakage. Packing replacement involves removing the gland nut, extracting old packing, installing new packing rings, and adjusting the gland nut to stop leakage without over-tightening (which causes excessive stem friction and wear).",
  },

  // ─── MODULE 3: Water Quality Monitoring, Evaluation & Lab Analysis (25 questions) ───
  {
    id: 96,
    module: "Water Quality Monitoring & Lab",
    question: "What is the minimum free chlorine residual required in a distribution system according to most Canadian guidelines?",
    options: ["0.05 mg/L", "0.1 mg/L", "0.2 mg/L", "0.5 mg/L"],
    correctAnswer: 1,
    explanation: "Health Canada's Guidelines for Canadian Drinking Water Quality recommend a minimum free chlorine residual of 0.1 mg/L at all points in the distribution system. Many provinces require a minimum of 0.2 mg/L. The maximum allowable concentration (MAC) for chlorine is 5 mg/L. Adequate residual prevents microbial regrowth and provides a barrier against contamination.",
  },
  {
    id: 97,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of monitoring chlorine residual at multiple points in the distribution system?",
    options: [
      "To calculate the total chlorine used for billing purposes",
      "To verify that adequate disinfection residual is maintained throughout the system and to detect areas of high chlorine demand or contamination",
      "To determine the chlorine dose at the treatment plant",
      "To comply with chemical inventory requirements"
    ],
    correctAnswer: 1,
    explanation: "Monitoring chlorine residual at multiple distribution points verifies that adequate residual is maintained throughout the system. Low residual areas indicate: high chlorine demand (biofilm, organic matter, corrosion); long water age (dead ends, oversized mains); or potential contamination. Monitoring results guide flushing programs, booster chlorination, and system operation.",
  },
  {
    id: 98,
    module: "Water Quality Monitoring & Lab",
    question: "What is the DPD colorimetric method used for?",
    options: [
      "Measuring turbidity in water samples",
      "Measuring free and total chlorine residual in water samples",
      "Measuring pH in water samples",
      "Measuring hardness in water samples"
    ],
    correctAnswer: 1,
    explanation: "The DPD (N,N-diethyl-p-phenylenediamine) colorimetric method measures free and total chlorine residual. DPD reagent reacts with free chlorine to produce a pink color — the intensity is proportional to the chlorine concentration. Adding potassium iodide (KI) converts combined chlorine to free chlorine for total chlorine measurement. Results are read with a colorimeter or spectrophotometer.",
  },
  {
    id: 99,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a bacteriological sample (total coliform test) in a distribution system?",
    options: [
      "To measure the chlorine residual in the distribution system",
      "To detect the presence of total coliform bacteria as an indicator of potential fecal contamination and treatment effectiveness",
      "To measure the turbidity of the water",
      "To detect the presence of specific pathogens"
    ],
    correctAnswer: 1,
    explanation: "Total coliform bacteria are used as indicator organisms for fecal contamination and treatment effectiveness. Their presence indicates that the treatment barrier may have been compromised or that contamination has entered the distribution system. Canadian guidelines require that no sample contain E. coli and that no more than 5% of monthly samples be total coliform positive.",
  },
  {
    id: 100,
    module: "Water Quality Monitoring & Lab",
    question: "What is the proper procedure for collecting a bacteriological water sample from a distribution system tap?",
    options: [
      "Collect the sample immediately without flushing, using any clean container",
      "Flush the tap for 2–5 minutes, use a sterile sample bottle with sodium thiosulfate (to neutralize chlorine), and avoid contaminating the bottle or tap",
      "Collect the sample after flushing for 30 seconds, using a clean plastic bottle",
      "Collect the sample from the first draw without flushing, to capture the worst-case water quality"
    ],
    correctAnswer: 1,
    explanation: "Bacteriological sample collection procedure: (1) Select a representative tap (no aerator, no leaks); (2) Flame or sanitize the tap if required; (3) Flush for 2–5 minutes to purge the service line; (4) Use a sterile sample bottle containing sodium thiosulfate (to neutralize chlorine and stop disinfection); (5) Do not pre-rinse the bottle; (6) Fill to the marked line; (7) Label and transport on ice to the lab within 6–8 hours.",
  },
  {
    id: 101,
    module: "Water Quality Monitoring & Lab",
    question: "What is turbidity and why is it monitored in a distribution system?",
    options: [
      "The temperature of the water — monitored for seasonal changes",
      "The cloudiness or haziness of water caused by suspended particles — monitored as an indicator of treatment effectiveness and potential contamination",
      "The colour of the water — monitored for aesthetic complaints",
      "The taste and odour of the water — monitored for customer complaints"
    ],
    correctAnswer: 1,
    explanation: "Turbidity is the cloudiness of water caused by suspended particles (sediment, microorganisms, organic matter). In a distribution system, increased turbidity can indicate: main break or disturbance; corrosion products; sediment resuspension; or contamination. Turbidity is measured in NTU (Nephelometric Turbidity Units). Health Canada's guideline is ≤1 NTU at the tap.",
  },
  {
    id: 102,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of monitoring pH in a distribution system?",
    options: [
      "To ensure the water tastes acceptable to customers",
      "To control corrosion and scale formation, maintain disinfection effectiveness, and comply with regulatory guidelines",
      "To measure the effectiveness of coagulation at the treatment plant",
      "To detect contamination from industrial sources"
    ],
    correctAnswer: 1,
    explanation: "pH monitoring in the distribution system serves multiple purposes: controlling corrosion (low pH accelerates corrosion; high pH causes scale); maintaining chlorine effectiveness (free chlorine is more effective at lower pH); preventing lead and copper leaching (low pH increases metal dissolution); and complying with guidelines (Health Canada: pH 7–10.5 for distribution). pH is measured with a pH meter or colorimetric test.",
  },
  {
    id: 103,
    module: "Water Quality Monitoring & Lab",
    question: "What is the Langelier Saturation Index (LSI) used for?",
    options: [
      "Measuring chlorine residual decay in the distribution system",
      "Predicting whether water will tend to deposit calcium carbonate scale (corrosion protection) or dissolve it (corrosive to pipes)",
      "Measuring the hardness of the water",
      "Predicting the formation of disinfection by-products"
    ],
    correctAnswer: 1,
    explanation: "The Langelier Saturation Index (LSI) predicts the tendency of water to deposit or dissolve calcium carbonate: LSI = pH − pHs (where pHs is the saturation pH). LSI > 0: water is supersaturated — tends to deposit scale (protective coating on pipes). LSI < 0: water is undersaturated — tends to dissolve scale (corrosive). LSI = 0: water is in equilibrium. A slightly positive LSI (0 to +0.5) is desirable for pipe protection.",
    isCalc: true,
  },
  {
    id: 104,
    module: "Water Quality Monitoring & Lab",
    question: "What are disinfection by-products (DBPs) and why are they a concern?",
    options: [
      "Chemicals added to the water during treatment — a concern for taste and odour",
      "Chemical compounds formed when disinfectants react with natural organic matter in the water — a concern because some are potentially carcinogenic",
      "Bacteria that survive the disinfection process — a concern for public health",
      "Chemicals leached from pipe materials — a concern for corrosion"
    ],
    correctAnswer: 1,
    explanation: "Disinfection by-products (DBPs) form when disinfectants (primarily chlorine) react with natural organic matter (NOM) in the water. The main groups are trihalomethanes (THMs) and haloacetic acids (HAAs). Some DBPs are potentially carcinogenic with long-term exposure. Health Canada has guidelines for THMs (100 μg/L) and HAAs (80 μg/L). DBP formation is minimized by reducing NOM before disinfection.",
  },
  {
    id: 105,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a distribution system water quality monitoring plan?",
    options: [
      "To satisfy regulatory requirements only",
      "To systematically collect and analyze water quality data to verify treatment effectiveness, detect contamination, and ensure regulatory compliance",
      "To monitor customer complaints about water quality",
      "To measure the age of the distribution system infrastructure"
    ],
    correctAnswer: 1,
    explanation: "A water quality monitoring plan specifies: what parameters to monitor (chlorine residual, turbidity, pH, bacteriological, DBPs); where to sample (representative points throughout the system, including dead ends and extremities); how often to sample (daily, weekly, monthly); and how to respond to exceedances. Monitoring plans are required by regulators and are essential for verifying that water delivered to customers is safe.",
  },
  {
    id: 106,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a 'grab sample' versus a 'composite sample' in water quality monitoring?",
    options: [
      "Grab samples are collected automatically; composite samples are collected manually",
      "A grab sample is collected at a single point in time; a composite sample is a mixture of samples collected over time or from multiple locations",
      "Grab samples are used for bacteriological testing; composite samples are used for chemical testing",
      "There is no difference — the terms are interchangeable"
    ],
    correctAnswer: 1,
    explanation: "A grab sample is collected at a single point in time and represents conditions at that moment. A composite sample is a mixture of samples collected over time (time-composite) or from multiple locations (spatial composite), representing average conditions. Grab samples are used for parameters that change rapidly (chlorine residual, bacteriological). Composite samples are used for parameters that are more stable (DBPs, metals).",
  },
  {
    id: 107,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a 'chain of custody' form for water quality samples?",
    options: [
      "To record the sample collection location and time",
      "To document the handling, transfer, and analysis of a sample to ensure the integrity of the results and their legal defensibility",
      "To track the cost of sample collection and analysis",
      "To schedule sample collection activities"
    ],
    correctAnswer: 1,
    explanation: "A chain of custody (COC) form documents the handling, transfer, and analysis of a water quality sample from collection to final disposal. It records: who collected the sample; collection date, time, and location; sample type and parameters requested; transfers between parties (signatures required); and laboratory receipt. COC forms ensure sample integrity and provide legal defensibility for results.",
  },
  {
    id: 108,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a 'field blank' in water quality sampling?",
    options: [
      "A sample collected from a location with no water quality issues",
      "A clean water sample processed through the same field collection procedure as regular samples to detect contamination introduced during sampling",
      "A sample collected at the beginning of a sampling event",
      "A sample collected from a fire hydrant"
    ],
    correctAnswer: 1,
    explanation: "A field blank is a clean water sample (typically deionized water) that is opened, handled, and processed through the same field collection procedure as regular samples. If the field blank shows contamination, it indicates that the contamination was introduced during sampling (from the environment, equipment, or sample bottles) rather than being present in the water. Field blanks are used for quality assurance/quality control (QA/QC).",
  },
  {
    id: 109,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of monitoring lead and copper at customer taps in a distribution system?",
    options: [
      "To measure the corrosivity of the source water",
      "To detect lead and copper leaching from service lines, solder, and plumbing fixtures, which can cause health risks especially for children",
      "To measure the effectiveness of corrosion inhibitors added at the treatment plant",
      "To detect industrial contamination of the water supply"
    ],
    correctAnswer: 1,
    explanation: "Lead and copper monitoring at customer taps detects leaching from lead service lines, lead solder (in homes built before 1990), and copper plumbing. Lead causes neurological damage, especially in children; copper causes gastrointestinal illness at high levels. Health Canada guidelines: lead MAC = 5 μg/L; copper MAC = 1 mg/L. If action levels are exceeded, corrosion control treatment and service line replacement are required.",
  },
  {
    id: 110,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a 'first draw' sample for lead and copper monitoring?",
    options: [
      "The first sample collected in a sampling event",
      "A sample collected after flushing the tap to represent the water quality in the main",
      "A sample collected from the tap after water has been stagnant in the service line for at least 6 hours, to capture the worst-case lead and copper concentration",
      "A sample collected from the first tap in a building"
    ],
    correctAnswer: 2,
    explanation: "A first draw sample for lead and copper monitoring is collected from the tap after water has been stagnant in the service line and plumbing for at least 6 hours (typically overnight). This represents the worst-case concentration of lead and copper leached from service lines, solder, and fixtures. The sample is collected without flushing the tap first.",
  },
  {
    id: 111,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of monitoring water temperature in a distribution system?",
    options: [
      "To ensure the water is cold enough for customer preference",
      "To assess the risk of microbial regrowth (higher temperature accelerates bacterial growth and chlorine decay) and to detect seasonal changes",
      "To measure the efficiency of the treatment process",
      "To detect industrial thermal pollution of the water source"
    ],
    correctAnswer: 1,
    explanation: "Water temperature affects: chlorine decay rate (higher temperature = faster decay); microbial regrowth potential (bacteria grow faster at higher temperatures); taste and odour (warm water tastes flat); and DBP formation (higher temperature increases THM formation). Monitoring temperature helps operators adjust chlorine doses seasonally and identify areas of high water age (warm water in summer).",
  },
  {
    id: 112,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a 'heterotrophic plate count' (HPC) test in distribution system monitoring?",
    options: [
      "To detect the presence of specific pathogens",
      "To measure the general bacterial population in the water as an indicator of overall microbial quality and treatment effectiveness",
      "To measure the chlorine residual in the water",
      "To detect the presence of coliform bacteria"
    ],
    correctAnswer: 1,
    explanation: "The heterotrophic plate count (HPC) measures the total number of bacteria that can grow on a nutrient medium under specified conditions. HPC is used as an indicator of overall microbial quality — high HPC may indicate: inadequate disinfection; biofilm growth; contamination; or long water age. Health Canada guideline: HPC ≤ 500 CFU/mL. HPC is not a direct health indicator but is a useful operational tool.",
  },
  {
    id: 113,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of monitoring nitrate in a distribution system?",
    options: [
      "To detect agricultural runoff contamination of the source water",
      "To protect infants from methemoglobinemia (blue baby syndrome) caused by high nitrate levels",
      "To measure the effectiveness of the treatment process",
      "To detect industrial contamination of the water supply"
    ],
    correctAnswer: 1,
    explanation: "Nitrate (NO₃⁻) at high concentrations causes methemoglobinemia (blue baby syndrome) in infants under 6 months — nitrate is converted to nitrite in the infant's gut, which oxidizes hemoglobin to methemoglobin, reducing oxygen-carrying capacity. Health Canada MAC: 10 mg/L as N (45 mg/L as NO₃⁻). Nitrate sources include agricultural runoff, septic systems, and natural geological deposits.",
  },
  {
    id: 114,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a 'consumer complaint' tracking system for water quality?",
    options: [
      "To respond to customer billing disputes",
      "To identify water quality problems in the distribution system by tracking the location, nature, and frequency of complaints",
      "To track customer service requests for new connections",
      "To monitor customer satisfaction with utility services"
    ],
    correctAnswer: 1,
    explanation: "A consumer complaint tracking system records the location, nature (taste, odour, colour, pressure, etc.), and frequency of water quality complaints. Clusters of complaints in a specific area may indicate: a main break; sediment disturbance; low chlorine residual; biofilm growth; or contamination. Complaint data is used to prioritize flushing, sampling, and system investigation.",
  },
  {
    id: 115,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a 'continuous online monitoring' system for chlorine residual in a distribution system?",
    options: [
      "To replace grab sampling for regulatory compliance",
      "To provide real-time, continuous data on chlorine residual at key locations, enabling rapid detection of residual loss and faster response to contamination events",
      "To automatically adjust chlorine doses at the treatment plant",
      "To measure chlorine residual for billing purposes"
    ],
    correctAnswer: 1,
    explanation: "Continuous online chlorine analyzers provide real-time data at key distribution system locations (pump stations, storage tanks, pressure zone boundaries). Benefits: early detection of chlorine residual loss (faster response to contamination); identification of high-demand areas; optimization of booster chlorination; and trending of residual over time. Online monitoring complements but does not replace grab sampling for regulatory compliance.",
  },
  {
    id: 116,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a 'water quality event detection system' (EDS)?",
    options: [
      "To detect chemical spills near the water source",
      "To analyze multiple water quality parameters in real-time and use algorithms to detect anomalies that may indicate contamination events",
      "To monitor customer complaints about water quality",
      "To detect leaks in the distribution system"
    ],
    correctAnswer: 1,
    explanation: "Water quality event detection systems (EDS) analyze multiple parameters (chlorine residual, pH, turbidity, conductivity, TOC) in real-time using statistical algorithms to detect anomalies that may indicate contamination events. EDS can detect changes that no single parameter would reveal. They are used at key distribution system locations as part of a security and water quality monitoring strategy.",
  },
  {
    id: 117,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a 'water quality profile' of a distribution system?",
    options: [
      "A document listing all water quality parameters monitored",
      "A spatial and temporal map of water quality parameters throughout the distribution system, used to identify problem areas and optimize operations",
      "A customer report on water quality",
      "A regulatory submission of water quality data"
    ],
    correctAnswer: 1,
    explanation: "A water quality profile maps key parameters (chlorine residual, turbidity, pH, temperature, HPC) throughout the distribution system over time. It identifies: areas of low residual (dead ends, extremities); areas of high water age; zones with high chlorine demand; and seasonal variations. Profiles are used to optimize flushing programs, booster chlorination placement, and system operations.",
  },
  {
    id: 118,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of monitoring conductivity in a distribution system?",
    options: [
      "To measure the electrical resistance of the pipe material",
      "To measure the total dissolved solids (TDS) content of the water and detect changes that may indicate contamination or source water changes",
      "To measure the corrosivity of the water",
      "To detect the presence of specific ions"
    ],
    correctAnswer: 1,
    explanation: "Conductivity measures the ability of water to conduct electricity, which is proportional to the concentration of dissolved ions (TDS). In a distribution system, conductivity monitoring can detect: contamination events (sudden increase or decrease); source water changes; and cross-connections with non-potable water. Conductivity is a useful parameter for online event detection systems.",
  },
  {
    id: 119,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a 'total organic carbon' (TOC) measurement in distribution system monitoring?",
    options: [
      "To measure the amount of organic matter in the water, which is a precursor to DBP formation and supports microbial regrowth",
      "To measure the effectiveness of the coagulation process",
      "To detect the presence of pesticides in the water",
      "To measure the biological oxygen demand of the water"
    ],
    correctAnswer: 0,
    explanation: "Total organic carbon (TOC) measures the concentration of organic carbon in water. In the distribution system, TOC is important because: it is a precursor to DBP formation (reacts with chlorine to form THMs and HAAs); it supports microbial regrowth (carbon source for bacteria); and it exerts chlorine demand. Monitoring TOC helps predict DBP formation potential and optimize treatment to reduce organic matter.",
  },
  {
    id: 120,
    module: "Water Quality Monitoring & Lab",
    question: "What is the purpose of a 'water quality annual report' (consumer confidence report)?",
    options: [
      "An internal report for utility management only",
      "A public document that informs customers about the quality of their drinking water, including monitoring results and any exceedances",
      "A regulatory submission required for permit renewal",
      "A report on the utility's financial performance"
    ],
    correctAnswer: 1,
    explanation: "A water quality annual report (consumer confidence report or CCR) informs customers about the quality of their drinking water. It includes: water source information; treatment processes; monitoring results for regulated parameters; any exceedances and corrective actions; and health information. CCRs are required by regulators and must be provided to customers annually. They build public trust and transparency.",
  },

  // ─── MODULE 4: Security, Safety, Administrative Procedures & Public Interactions (30 questions) ───
  {
    id: 121,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water security vulnerability assessment'?",
    options: [
      "To assess the physical condition of distribution system infrastructure",
      "To identify and evaluate threats, vulnerabilities, and consequences to the water system, and to develop countermeasures",
      "To assess the financial vulnerability of the utility",
      "To evaluate the water quality vulnerability of the source water"
    ],
    correctAnswer: 1,
    explanation: "A water security vulnerability assessment (VA) identifies threats (intentional contamination, physical attack, cyber attack), vulnerabilities (unprotected access points, single points of failure), and potential consequences. The VA is used to prioritize and implement countermeasures (physical security, monitoring, emergency response). VAs are required by regulation for larger utilities and are a best practice for all systems.",
  },
  {
    id: 122,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water emergency response plan' (ERP)?",
    options: [
      "A plan for responding to customer billing emergencies",
      "A documented plan for responding to water system emergencies (main breaks, contamination events, power outages) to minimize public health impacts and restore service",
      "A plan for emergency water rate increases",
      "A plan for emergency hiring of additional staff"
    ],
    correctAnswer: 1,
    explanation: "An emergency response plan (ERP) documents procedures for responding to water system emergencies: main breaks, contamination events, power outages, natural disasters, and security incidents. It includes: notification procedures (staff, regulators, public); response actions; resource requirements; mutual aid agreements; and recovery procedures. ERPs must be regularly tested (tabletop exercises, drills) and updated.",
  },
  {
    id: 123,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'lockout/tagout' (LOTO) procedure?",
    options: [
      "To lock the pump station gate to prevent unauthorized access",
      "To isolate and de-energize equipment before maintenance to prevent accidental startup and worker injury",
      "To lock valves in the open position during normal operation",
      "To tag equipment that needs to be replaced"
    ],
    correctAnswer: 1,
    explanation: "Lockout/tagout (LOTO) procedures isolate and de-energize equipment (pumps, motors, valves) before maintenance to prevent accidental startup and worker injury. Steps: notify affected personnel; shut down equipment; isolate all energy sources (electrical, hydraulic, pneumatic); apply lockout devices and personal locks; verify zero energy state; perform maintenance; remove locks in reverse order. LOTO is required by occupational health and safety regulations.",
  },
  {
    id: 124,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'confined space entry permit'?",
    options: [
      "To authorize entry into a utility's property",
      "To document the hazard assessment, safety precautions, and authorization for entry into a permit-required confined space",
      "To permit construction in a confined area",
      "To authorize work in a restricted area near a water main"
    ],
    correctAnswer: 1,
    explanation: "A confined space entry permit documents: the space to be entered; hazards present; atmospheric testing results; required PPE and equipment; isolation and lockout measures; attendant and rescue arrangements; and authorization signatures. The permit must be completed before entry and posted at the entry point. It ensures all hazards have been identified and controlled before workers enter.",
  },
  {
    id: 125,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What are the three atmospheric hazards that must be tested before entering a confined space?",
    options: [
      "Carbon dioxide, nitrogen, and argon",
      "Oxygen deficiency/enrichment, combustible/flammable gases, and toxic gases (e.g., H₂S)",
      "Chlorine, ammonia, and carbon monoxide",
      "Methane, propane, and butane"
    ],
    correctAnswer: 1,
    explanation: "Before confined space entry, test for: (1) Oxygen — deficiency (<19.5%) causes asphyxiation; enrichment (>23.5%) increases fire/explosion risk; (2) Combustible/flammable gases — must be <10% of LEL (lower explosive limit); (3) Toxic gases — especially H₂S (hydrogen sulphide, common in wet wells) and CO (carbon monoxide). Testing must be done with a calibrated multi-gas detector before entry and continuously during entry.",
  },
  {
    id: 126,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water distribution operator certification' program?",
    options: [
      "To certify that water distribution systems meet design standards",
      "To ensure that operators have the knowledge and skills required to safely operate and maintain water distribution systems, protecting public health",
      "To certify water quality laboratory analysts",
      "To certify contractors who install water distribution systems"
    ],
    correctAnswer: 1,
    explanation: "Operator certification programs ensure that water distribution operators have the knowledge and skills to safely operate and maintain systems. Certification is typically required by provincial/territorial regulation. Operators must pass an exam, meet experience requirements, and complete continuing education to maintain certification. The WPI exam is one of the recognized certification exams in Canada.",
  },
  {
    id: 127,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'cross-connection control program'?",
    options: [
      "To prevent pipe crossings under roads",
      "To identify, eliminate, and prevent cross-connections between the potable water supply and sources of contamination",
      "To control the connection of new customers to the distribution system",
      "To prevent unauthorized connections to fire hydrants"
    ],
    correctAnswer: 1,
    explanation: "A cross-connection control program identifies and eliminates existing cross-connections and prevents new ones. Components: bylaw or regulation requiring backflow prevention; survey of customer premises to identify cross-connections; installation of appropriate backflow preventers; annual testing of assemblies; and education of plumbers and customers. Cross-connection control is one of the most important public health protection measures for distribution systems.",
  },
  {
    id: 128,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'public notification' when a boil water advisory is issued?",
    options: [
      "To inform the public of water rate increases",
      "To inform affected customers of the health risk and the precautions they should take (boiling water) to protect themselves",
      "To inform the public of planned maintenance shutdowns",
      "To inform the public of new water quality monitoring results"
    ],
    correctAnswer: 1,
    explanation: "Public notification of a boil water advisory (BWA) informs affected customers of the health risk and the precautions required. Notification methods: direct contact (phone, door-to-door); media (radio, TV, social media); utility website; and signage at public locations. Notification must be timely (within hours of the decision to issue a BWA) and must reach all affected customers, including vulnerable populations.",
  },
  {
    id: 129,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water main flushing notification' to customers?",
    options: [
      "To warn customers that their water may be temporarily discoloured or have reduced pressure during flushing operations",
      "To bill customers for the water used during flushing",
      "To notify customers of a water quality problem",
      "To request customer cooperation in reducing water use during flushing"
    ],
    correctAnswer: 0,
    explanation: "Flushing notifications warn customers that their water may be temporarily discoloured (from disturbed sediment or rust), have reduced pressure, or be temporarily shut off during flushing operations. Advance notice allows customers to fill containers, avoid laundry (discoloured water can stain), and plan for temporary service interruptions. Notifications are typically sent 24–48 hours in advance.",
  },
  {
    id: 130,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water service interruption notification' to customers?",
    options: [
      "To bill customers for the interruption",
      "To inform affected customers of the planned or unplanned interruption, its expected duration, and any precautions they should take",
      "To notify customers of a water quality problem",
      "To request customer cooperation in reducing water use"
    ],
    correctAnswer: 1,
    explanation: "Service interruption notifications inform customers of planned (maintenance, construction) or unplanned (main break, emergency) water service interruptions. They should include: affected area; expected start and end time; reason for interruption; any water quality precautions (boil water advisory); and contact information. Advance notice for planned interruptions allows customers to prepare (fill containers, reschedule activities).",
  },
  {
    id: 131,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water use restriction' (outdoor watering ban)?",
    options: [
      "To reduce water bills for customers",
      "To reduce peak demand during periods of high demand or low supply to maintain adequate pressure and fire flow",
      "To reduce water treatment costs",
      "To comply with environmental regulations"
    ],
    correctAnswer: 1,
    explanation: "Water use restrictions reduce peak demand during periods of high demand (summer heat waves) or low supply (drought, source water issues). By restricting outdoor watering (the largest discretionary use), utilities can maintain adequate system pressure, preserve storage for fire flow and emergencies, and avoid the need for costly infrastructure expansion. Restrictions are typically staged (Stage 1: odd/even watering; Stage 2: no outdoor watering).",
  },
  {
    id: 132,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water system asset management plan'?",
    options: [
      "A financial plan for the utility",
      "A systematic approach to managing infrastructure assets (pipes, pumps, tanks) to optimize their lifecycle cost and maintain service levels",
      "A plan for acquiring new water sources",
      "A plan for expanding the distribution system"
    ],
    correctAnswer: 1,
    explanation: "An asset management plan (AMP) systematically manages infrastructure assets over their lifecycle. It includes: asset inventory (what assets exist, their age, condition, and value); risk assessment (likelihood and consequence of failure); maintenance strategies (preventive, predictive, corrective); capital planning (rehabilitation and replacement schedules); and financial planning (rates and reserves). AMPs help utilities make informed decisions about infrastructure investment.",
  },
  {
    id: 133,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water system operating permit' or 'approval to operate'?",
    options: [
      "A permit to construct a new water main",
      "A regulatory authorization that specifies the conditions under which a water system may operate, including monitoring requirements and reporting obligations",
      "A permit to hire new operators",
      "A permit to use a specific water source"
    ],
    correctAnswer: 1,
    explanation: "An operating permit (approval to operate) is a regulatory authorization specifying the conditions under which a water system may operate. It typically includes: design and operational standards; monitoring and reporting requirements; operator certification requirements; and conditions for specific situations (boil water advisories, emergency response). Violations of permit conditions can result in enforcement action.",
  },
  {
    id: 134,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water system inspection' by a regulatory authority?",
    options: [
      "To assess the financial performance of the utility",
      "To verify that the water system is being operated and maintained in compliance with regulatory requirements and that the water supply is safe",
      "To assess the physical condition of the infrastructure",
      "To review the utility's customer service performance"
    ],
    correctAnswer: 1,
    explanation: "Regulatory inspections verify that water systems are operated and maintained in compliance with regulations and that the water supply is safe. Inspectors review: operating records; monitoring data; operator certification; maintenance logs; emergency response plans; and physical condition of facilities. Inspection findings may result in orders to correct deficiencies, administrative penalties, or other enforcement actions.",
  },
  {
    id: 135,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water system record keeping' program?",
    options: [
      "To satisfy regulatory requirements only",
      "To document operations, maintenance, water quality, and incidents to support decision-making, regulatory compliance, legal defense, and historical analysis",
      "To track customer billing information",
      "To document employee performance"
    ],
    correctAnswer: 1,
    explanation: "Record keeping documents all aspects of water system operations: water quality monitoring results; maintenance activities; operator logs; chemical usage; incident reports; customer complaints; and regulatory correspondence. Good records: demonstrate regulatory compliance; support legal defense; enable trend analysis; facilitate knowledge transfer; and support asset management. Records must be retained for specified periods (typically 5–10 years for most records).",
  },
  {
    id: 136,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'personal protective equipment' (PPE) program for distribution system operators?",
    options: [
      "To comply with uniform requirements",
      "To protect operators from workplace hazards (chemical exposure, traffic, falls, confined space, electrical) by providing and requiring appropriate protective equipment",
      "To improve operator visibility to the public",
      "To protect operators from weather conditions"
    ],
    correctAnswer: 1,
    explanation: "PPE programs protect operators from workplace hazards. Common PPE for distribution operators: hard hat (falling objects, overhead hazards); safety glasses/goggles (chemical splash, flying debris); gloves (chemical handling, sharp edges); high-visibility vest (traffic); steel-toed boots (falling objects, slips); hearing protection (loud equipment); and SCBA or supplied air (confined space with atmospheric hazards). PPE is the last line of defense — engineering and administrative controls are preferred.",
  },
  {
    id: 137,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'traffic control plan' when working on a water main in a roadway?",
    options: [
      "To notify the public of the water main repair",
      "To protect workers and the public from traffic hazards during roadway work",
      "To coordinate with the municipality on road closures",
      "To minimize traffic delays during the repair"
    ],
    correctAnswer: 1,
    explanation: "A traffic control plan protects workers and the public during roadway work. It specifies: advance warning signs; channelizing devices (cones, barricades); flaggers; and temporary traffic signals. Traffic control must comply with provincial/territorial standards (e.g., Ontario's Book 7, Alberta's ATCMM). Struck-by incidents are a leading cause of fatalities in roadway work zones.",
  },
  {
    id: 138,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'utility locate' (call before you dig) before excavation?",
    options: [
      "To obtain permission to excavate",
      "To identify and mark the location of buried utilities (water, gas, electrical, telecom) to prevent damage and worker injury during excavation",
      "To determine the depth of the water main",
      "To notify the municipality of the planned excavation"
    ],
    correctAnswer: 1,
    explanation: "Utility locates (Ontario: Ontario One Call; Alberta: Alberta One Call) identify and mark the location of buried utilities before excavation. Striking a buried utility can cause: worker injury or death (gas explosion, electrocution); service disruption; and environmental damage. Locates are legally required before excavation in most jurisdictions. Even with locates, hand digging is required within the tolerance zone (typically 1 m) of a marked utility.",
  },
  {
    id: 139,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'trench safety' program for distribution system excavations?",
    options: [
      "To ensure trenches are properly backfilled after pipe installation",
      "To prevent trench cave-ins that can bury and kill workers by requiring proper shoring, sloping, or trench boxes",
      "To ensure trenches are properly dewatered before pipe installation",
      "To ensure trenches are properly marked to prevent falls"
    ],
    correctAnswer: 1,
    explanation: "Trench cave-ins are one of the most deadly construction hazards — a cubic metre of soil weighs approximately 1.5 tonnes. Trench safety requires: sloping (cutting back trench walls at a safe angle); shoring (timber or hydraulic shoring to support walls); or trench boxes (pre-fabricated shields). Requirements vary by soil type and trench depth. Trenches deeper than 1.2 m typically require protective systems. Workers must never enter an unprotected trench.",
  },
  {
    id: 140,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'chemical safety data sheet' (SDS, formerly MSDS)?",
    options: [
      "To document the purchase price and supplier of chemicals",
      "To provide information on the hazards, safe handling, storage, and emergency response for a chemical substance",
      "To document the chemical dosage used in water treatment",
      "To record chemical inventory levels"
    ],
    correctAnswer: 1,
    explanation: "A Safety Data Sheet (SDS) provides comprehensive information on a chemical: identification; hazard identification; composition; first aid measures; fire-fighting measures; accidental release measures; handling and storage; exposure controls and PPE; physical and chemical properties; toxicological information; and disposal. SDS must be readily accessible to workers who handle chemicals. WHMIS (Workplace Hazardous Materials Information System) requires SDS for all controlled products.",
  },
  {
    id: 141,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water system security plan'?",
    options: [
      "To secure the utility's financial assets",
      "To protect the water system from intentional contamination, physical attack, and cyber attack through physical security, monitoring, and response procedures",
      "To protect customer data and billing information",
      "To secure water rights and water allocation"
    ],
    correctAnswer: 1,
    explanation: "A water system security plan protects against intentional threats. Physical security measures: fencing, locks, lighting, cameras, and alarms at facilities; tamper-evident seals on hydrants and valves; restricted access to pump stations and treatment plants. Cyber security: secure SCADA systems; access controls; network monitoring. Response procedures: detection, notification, containment, and recovery. Security plans are required for larger systems and are a best practice for all.",
  },
  {
    id: 142,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'mutual aid agreement' between water utilities?",
    options: [
      "To share water supply during drought conditions",
      "To provide reciprocal assistance (personnel, equipment, supplies) during emergencies that exceed a single utility's capacity to respond",
      "To share water quality monitoring data",
      "To coordinate water rate setting"
    ],
    correctAnswer: 1,
    explanation: "Mutual aid agreements allow water utilities to provide reciprocal assistance during emergencies (major main breaks, natural disasters, contamination events) that exceed a single utility's capacity. Agreements specify: types of assistance available; request and authorization procedures; cost reimbursement; liability; and communication protocols. Mutual aid is a key component of emergency preparedness and resilience.",
  },
  {
    id: 143,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'public education program' for water conservation?",
    options: [
      "To reduce the utility's operating costs",
      "To inform customers about the importance of water conservation and provide practical tips to reduce water use, reducing demand and deferring infrastructure expansion",
      "To comply with environmental regulations",
      "To reduce customer water bills"
    ],
    correctAnswer: 1,
    explanation: "Public education programs promote water conservation by informing customers about the importance of water as a resource and providing practical tips (low-flow fixtures, efficient irrigation, leak detection). Benefits: reduced peak demand (deferring infrastructure expansion); reduced operating costs (less water treated and pumped); environmental benefits (more water left in source); and reduced customer bills. Programs may include school visits, social media, bill inserts, and rebate programs.",
  },
  {
    id: 144,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water system master plan'?",
    options: [
      "A plan for the daily operation of the water system",
      "A long-term planning document that evaluates current system capacity, projects future demand, and identifies infrastructure improvements needed to meet future needs",
      "A plan for emergency response to water system failures",
      "A financial plan for the utility"
    ],
    correctAnswer: 1,
    explanation: "A water system master plan (or water distribution system master plan) evaluates current system capacity (hydraulic model analysis), projects future demand (population growth, land use changes), identifies deficiencies (pressure, fire flow, water quality), and recommends infrastructure improvements (new mains, storage, pump stations). Master plans typically cover a 20–25 year horizon and are updated every 5–10 years.",
  },
  {
    id: 145,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water rate study'?",
    options: [
      "To compare water rates with other utilities",
      "To determine the water rates needed to recover the full cost of providing water service, including operations, maintenance, and capital investment",
      "To set water rates based on customer ability to pay",
      "To calculate the cost of water treatment chemicals"
    ],
    correctAnswer: 1,
    explanation: "A water rate study determines the rates needed to recover the full cost of providing water service: operating and maintenance costs; debt service on existing infrastructure; capital reserves for future replacement; and regulatory compliance costs. Rates should be cost-based, equitable, and sufficient to maintain financial sustainability. Rate studies are typically conducted every 3–5 years or when significant cost changes occur.",
  },
  {
    id: 146,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water loss control program'?",
    options: [
      "To prevent water from evaporating from storage tanks",
      "To systematically identify, quantify, and reduce real and apparent water losses in the distribution system",
      "To prevent water from freezing in the distribution system",
      "To reduce water treatment chemical usage"
    ],
    correctAnswer: 1,
    explanation: "A water loss control program systematically reduces non-revenue water (NRW). Components: water audit (quantify real and apparent losses); active leakage control (leak detection and repair); pressure management (reduce leakage by lowering pressure); meter accuracy management (replace old meters); and data management (improve billing accuracy). The AWWA Water Audit Methodology (M36 manual) provides a standardized framework.",
  },
  {
    id: 147,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'drinking water quality management standard' (DWQMS) in Ontario?",
    options: [
      "A standard for the design of water treatment plants",
      "A quality management system framework that requires drinking water systems to document, implement, and continually improve their management practices",
      "A standard for water quality monitoring frequency",
      "A standard for operator certification requirements"
    ],
    correctAnswer: 1,
    explanation: "Ontario's Drinking Water Quality Management Standard (DWQMS) requires licensed drinking water systems to implement a quality management system (QMS). The QMS documents: operational plans; risk assessments; management review; internal audits; and continual improvement processes. Systems must be accredited by an approved accreditation body. DWQMS is based on ISO 9001 principles adapted for drinking water.",
  },
  {
    id: 148,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'source water protection plan'?",
    options: [
      "To protect the water treatment plant from contamination",
      "To identify and manage threats to the quality and quantity of source water (lakes, rivers, groundwater) used for drinking water",
      "To protect the distribution system from contamination",
      "To protect water rights from competing users"
    ],
    correctAnswer: 1,
    explanation: "Source water protection plans identify and manage threats to drinking water sources. They include: source water assessment (characterize the watershed or wellhead protection area); threat identification (agricultural runoff, spills, septic systems, industrial discharges); risk assessment; and risk management policies (land use controls, best management practices, spill prevention). Source water protection is the first barrier in a multi-barrier approach to safe drinking water.",
  },
  {
    id: 149,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water system financial reserve fund'?",
    options: [
      "To fund emergency repairs only",
      "To accumulate funds for future capital expenditures (pipe replacement, equipment replacement) so that large costs can be managed without rate spikes or debt",
      "To fund operating costs during low-revenue periods",
      "To fund employee pension obligations"
    ],
    correctAnswer: 1,
    explanation: "A capital reserve fund accumulates money over time for future capital expenditures (pipe replacement, pump replacement, storage tank rehabilitation). Without reserves, utilities must either borrow money (incurring debt and interest costs) or implement large rate increases when major replacements are needed. Reserve funds smooth out capital costs over time and maintain financial sustainability. Asset management plans inform reserve fund requirements.",
  },
  {
    id: 150,
    module: "Security, Safety, Admin & Public Interactions",
    question: "What is the purpose of a 'water system operator training program'?",
    options: [
      "To satisfy certification renewal requirements only",
      "To ensure operators have the knowledge and skills to safely and effectively operate the water system, including new technologies and regulatory changes",
      "To train operators on customer service skills",
      "To train operators on financial management"
    ],
    correctAnswer: 1,
    explanation: "Operator training programs ensure operators have current knowledge and skills: system-specific training (equipment, procedures, emergency response); technical training (water quality, hydraulics, treatment processes); safety training (confined space, LOTO, traffic control); and regulatory training (new requirements, standards). Training supports certification maintenance (continuing education credits), improves operational performance, and reduces the risk of incidents and regulatory violations.",
  },
];

export const WPI_CLASS1_WATER_DIST_MODULES: string[] = [
  "Distribution System Components",
  "Equipment Installation, O&M & Repair",
  "Water Quality Monitoring & Lab",
  "Security, Safety, Admin & Public Interactions",
];
