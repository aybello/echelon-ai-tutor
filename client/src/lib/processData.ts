// Echelon Process v2 — Water Treatment Process Data
// Design: Professional SaaS — Clean Dark-Accent (Sora, blue/teal brand)

export interface ProcessStep {
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

export const STEPS: ProcessStep[] = [
  {
    id: "intake", num: 1, label: "Intake & Screening", icon: "💧", color: "#0369A1", bg: "#E0F2FE",
    shortDesc: "Raw water enters from source",
    fullDesc: "Raw water is drawn from a surface water source (river, lake, or reservoir) or groundwater (well). Screens remove large debris — leaves, fish, sticks — before water enters the treatment train.",
    equipment: "Bar Screens & Fine Screens",
    regulation: "O. Reg. 170/03 requires continuous monitoring of raw water turbidity, pH, and temperature at the intake point.",
    keyPoints: ["Bar screens remove objects >10mm", "Fine screens (0.5–6mm) remove smaller debris", "Intake positioned to minimise algae and contamination", "Flow monitoring begins at this point"],
    waterQuality: { Turbidity: "5–500 NTU", pH: "6.5–8.5", Colour: "Yellow/Brown", Contaminants: "Sediment, bacteria, algae" },
  },
  {
    id: "coagulation", num: 2, label: "Coagulation", icon: "⚗️", color: "#7C3AED", bg: "#EDE9FE",
    shortDesc: "Chemicals destabilise particles",
    fullDesc: "Coagulant chemicals (alum, ferric chloride, or polymers) are added under rapid, violent mixing. These neutralise the negative electrical charge on particles, causing them to destabilise and begin to attract each other.",
    equipment: "Flash Mixer / Rapid Mix Basin",
    regulation: "Jar testing must be performed regularly to optimise coagulant dose — especially when raw water turbidity or organic content changes.",
    keyPoints: ["Alum (aluminum sulphate) is most common in Ontario", "Rapid mix (G value >300/s) for 30–60 seconds", "pH must be 6.0–7.5 for optimal coagulation", "Streaming current monitors help optimise dose in real time"],
    waterQuality: { Turbidity: "Still high", pH: "Adjusted 6–7.5", Colour: "Unchanged", Contaminants: "Particles now destabilised" },
  },
  {
    id: "flocculation", num: 3, label: "Flocculation", icon: "🌀", color: "#BE185D", bg: "#FCE7F3",
    shortDesc: "Particles clump into floc",
    fullDesc: "Gentle, slow mixing encourages destabilised particles to collide and stick together, forming larger clumps called 'floc'. Tapered mixing — fast at the start, slow at the end — promotes floc growth without breaking it apart.",
    equipment: "Flocculation Basin with Paddle Mixers",
    regulation: "Flocculation basins provide 20–40 minutes of contact time. Tapered mixing (decreasing G value from ~75 to ~10/s) is best practice.",
    keyPoints: ["Gentle mixing only — too fast breaks floc apart", "Detention time: 20–40 minutes", "Tapered mixing: fast start, slow finish", "Visible fluffy floc indicates the process is working"],
    waterQuality: { Turbidity: "Still visible", pH: "6–7.5", Colour: "Fluffy floc visible", Contaminants: "Particles aggregated" },
  },
  {
    id: "sedimentation", num: 4, label: "Sedimentation", icon: "⬇️", color: "#B45309", bg: "#FEF3C7",
    shortDesc: "Floc settles to the bottom",
    fullDesc: "Water flows slowly through large sedimentation basins (clarifiers). Reduced velocity allows heavy floc to sink under gravity. Sludge is collected and removed from the bottom while clarified water overflows the top weirs.",
    equipment: "Sedimentation Basin / Clarifier",
    regulation: "Surface overflow rate (SOR) typically 20–40 m³/m²/day. Turbidity leaving sedimentation should be <5 NTU before filtration.",
    keyPoints: ["Overflow rate = flow ÷ surface area", "Detention time: 2–8 hours", "Sludge removed by mechanical scrapers", "Plate/tube settlers can enhance performance"],
    waterQuality: { Turbidity: "1–10 NTU", pH: "Unchanged", Colour: "Slight haze", Contaminants: "80–90% of solids removed" },
  },
  {
    id: "filtration", num: 5, label: "Filtration", icon: "🔵", color: "#0F766E", bg: "#CCFBF1",
    shortDesc: "Fine particles removed",
    fullDesc: "Clarified water passes through filter beds containing layers of granular media (anthracite, sand, gravel). Remaining fine particles and microorganisms are physically strained and adsorbed onto media surfaces. Filters are cleaned by backwashing.",
    equipment: "Rapid Sand Filter / Dual Media Filter",
    regulation: "O. Reg. 170/03 Schedule 6: Continuous turbidity monitoring required. Target <0.3 NTU. Filters must be backwashed before turbidity exceeds 1.0 NTU.",
    keyPoints: ["Media layers: anthracite → sand → gravel", "Filtration rate: 5–15 m/hr", "Backwashing restores filter capacity", "Turbidity must be <0.3 NTU leaving filters"],
    waterQuality: { Turbidity: "<0.3 NTU", pH: "Unchanged", Colour: "Clear", Contaminants: "Giardia & Cryptosporidium removed" },
  },
  {
    id: "disinfection", num: 6, label: "Disinfection", icon: "☀️", color: "#D97706", bg: "#FEF9C3",
    shortDesc: "Pathogens are killed",
    fullDesc: "Disinfectants kill or inactivate pathogenic microorganisms (bacteria, viruses, protozoa) that survived earlier treatment. Chlorine is most common in Ontario — it also provides a residual that protects water in the distribution system.",
    equipment: "Chlorine Contact Chamber / UV Reactor",
    regulation: "CT (Concentration × Time) must meet minimum values for 3-log Giardia and 4-log virus inactivation under O. Reg. 170/03.",
    keyPoints: ["CT = Concentration (mg/L) × Contact Time (min)", "Sodium hypochlorite most common in Ontario", "UV provides excellent Cryptosporidium inactivation", "Minimum chlorine residual must be maintained"],
    waterQuality: { Turbidity: "<0.3 NTU", pH: "6.5–8.5", Colour: "Crystal clear", Contaminants: "Pathogens inactivated" },
  },
  {
    id: "distribution", num: 7, label: "Distribution", icon: "🏙️", color: "#059669", bg: "#D1FAE5",
    shortDesc: "Safe water to the tap",
    fullDesc: "Treated water is pumped through transmission mains, distribution pipes, storage reservoirs, and service connections to reach homes and businesses. Maintaining adequate pressure and chlorine residual is critical throughout.",
    equipment: "Pumping Stations, Watermains, Storage Tanks",
    regulation: "O. Reg. 170/03 requires minimum chlorine residuals to be sampled throughout the distribution system on a regular schedule.",
    keyPoints: ["Minimum chlorine residual maintained at all points", "Pressure typically 275–550 kPa at service connections", "Regular flushing removes stagnant water", "Cross-connection control protects potable supply"],
    waterQuality: { Turbidity: "<1 NTU", pH: "6.5–8.5", Colour: "Crystal clear", Contaminants: "Safe for consumption" },
  },
];

export const LABEL_INFO: Record<string, string> = {
  // Intake
  source:     "Surface water intake from a protected source. Raw water quality varies seasonally — turbidity spikes during heavy rainfall and spring runoff.",
  barscreen:  "Removes large debris >10mm — logs, fish, leaves. Must be cleaned regularly to maintain flow capacity and prevent damage to downstream equipment.",
  finescreen: "Removes smaller particles (0.5–6mm). Fine screens protect pumps and reduce load on downstream treatment processes.",
  pump:       "Low-lift pumps move raw water from the source to the treatment plant. Head requirements vary with source elevation and distance to plant.",
  flowmeter:  "Measures raw water intake volume in real time. Required for operational records and chemical dosing calculations under O. Reg. 170/03.",
  // Coagulation
  rawwater:   "Raw water enters with high turbidity and natural organic matter (NOM). Water quality data from the intake informs the coagulant dose decision.",
  chemical:   "Coagulant (typically alum — aluminum sulphate) is added here. Dose is optimised by jar testing. Typical alum dose: 5–50 mg/L depending on raw water quality.",
  rapidmix:   "The flash mixer creates intense turbulence (G value >300/s) for 30–60 seconds. This is critical — coagulant must be distributed instantly throughout the water before it reacts.",
  impeller:   "High-speed impeller creates the turbulence needed for rapid coagulant distribution. Too slow = uneven mixing. Too long = floc formation begins too early.",
  outlet:     "Large, dense floc exits toward the sedimentation basin. Good floc is visible — fluffy, grey-brown particles that settle quickly.",
  // Flocculation
  inlet:      "Water enters from coagulation with destabilised (charge-neutralised) particles that are now ready to collide and form floc.",
  basin1:     "Stage 1: Faster mixing (G ≈ 75/s). Initial large-scale collision of destabilised particles. Floc begins to form but is still small and fragile.",
  paddles:    "Slow-rotating paddle mixers create gentle orthokinetic mixing without breaking the fragile floc apart. RPM is carefully controlled.",
  basin2:     "Stage 2: Medium mixing (G ≈ 35/s). Floc grows larger as particles continue to collide. Visible fluffy particles start forming.",
  basin3:     "Stage 3: Very gentle mixing (G ≈ 10/s). Large, dense floc forms. Too much energy here would shear the floc apart and undo the process.",
  // Clarifier / Sedimentation
  inlet2:     "Water enters the basin gently through a baffle or inlet pipe. Even distribution prevents disturbing settled sludge at the bottom.",
  flocblanket:"A suspended layer of previously settled floc. Incoming water must pass through it, trapping fine particles — acts as a natural deep-bed filter.",
  scraper:    "Rotating or travelling mechanical arm that continuously scrapes settled solids along the basin floor toward the sludge hopper. Speed: very slow (1–3 RPM).",
  hopper:     "Heavy sludge collects here. Periodic withdrawal removes concentrated sludge for further treatment or disposal. Sludge concentration: 0.5–2% solids.",
  weir:       "Clarified water overflows this weir — water quality at this point determines filtration efficiency. Target: <5 NTU, ideally <2 NTU.",
  launder:    "Trough collecting clarified overflow water and directing it to the filters. Weir loading rate (m³/hr per m of weir length) affects effluent quality.",
  // Filter
  influent:   "Clarified water from sedimentation enters the filter from above. Turbidity here is typically 1–10 NTU. Lower = better filter performance and longer filter runs.",
  anthracite: "Top media layer (0.8–1.4mm grain size, depth 400–600mm). Lower density than sand — stays on top during backwash. Catches the bulk of floc particles.",
  sand:       "Middle media layer (0.45–0.55mm, depth 250–300mm). Finer and denser than anthracite. Polishes water after the anthracite removes the bulk of solids.",
  gravel:     "Bottom support layer (2–75mm). Holds fine media in place and prevents sand from entering the underdrain. Does not provide filtration — only structural support.",
  underdrain: "Collects filtered water and distributes backwash water evenly across the entire filter. Even distribution is critical — hot spots cause media channelling.",
  turbidity:  "Continuous turbidity monitoring required under O. Reg. 170/03. Must trigger alarm at 1.0 NTU and initiate backwash or filter shutdown. Target: <0.3 NTU.",
  // Disinfection
  inflow:     "Clear filtered water (<0.3 NTU) enters the contact chamber. Low turbidity is essential — turbid water physically shields pathogens from disinfectant contact.",
  baffles:    "Serpentine baffle walls force water to travel the full chamber length, preventing short-circuiting. Without baffles, some water could pass through in minutes instead of the design contact time.",
  chlorine:   "Sodium hypochlorite injected here under precise flow-proportional control. Dose = (CT target + residual requirement) ÷ contact time. Most Ontario systems use liquid hypochlorite.",
  ctzone:     "CT = Concentration (mg/L) × Contact Time (min). O. Reg. 170/03 requires minimum CT for 3-log Giardia inactivation and 4-log virus inactivation. CT values are temperature and pH dependent.",
  residual:   "Continuous chlorine analyser ensures adequate residual leaves the contact chamber before entering distribution. If residual drops below minimum, an alarm triggers immediate corrective action.",
  outflow:    "Disinfected water with a maintained chlorine residual flows to the distribution system. This residual protects water quality all the way to the consumer's tap.",
  // Distribution
  pump2:      "High-lift pumps boost pressure to distribute water throughout the system. Multiple pumps allow variable output to match changing demand across the day.",
  tower:      "Elevated storage provides system pressure without constant pumping and acts as a buffer for peak demand periods. The water height creates the static pressure.",
  main:       "Large diameter transmission and distribution mains carry water to different zones. Pipe materials include ductile iron, PVC, and HDPE — each with different pressure ratings.",
  reservoir:  "Ground-level storage balances supply and demand. Sized to provide emergency supply and fire flow reserves. Turnover time must be managed to prevent stagnation.",
  service:    "The final connection from the watermain to the consumer. Service lines may be copper, polyethylene, or (in older systems) lead — lead service lines are being replaced across Ontario.",
};
