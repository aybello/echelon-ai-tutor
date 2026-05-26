// CLASS 4 WATER TREATMENT FORMULA SHEET
// Covers all calculation-heavy topics from the Class 4 Water Treatment Operator exam
// Modules: Advanced Treatment, Hydraulics, Math & Calculations, Water Quality, Lab Analysis, Regulations
import { useState } from "react";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "wouter";

interface Formula {
  name: string;
  formula: string;
  units: string;
  variables: string[];
  example: string;
  examTip: string;
}

interface Section {
  id: string;
  title: string;
  icon: string;
  color: string;
  bg: string;
  formulas: Formula[];
}

const SECTIONS: Section[] = [
  {
    id: "advanced-treatment",
    title: "Advanced Treatment Processes",
    icon: "🔬",
    color: "#1D4ED8",
    bg: "#DBEAFE",
    formulas: [
      {
        name: "CT Value (Disinfection)",
        formula: "CT = C × T₁₀",
        units: "mg·min/L",
        variables: [
          "C = disinfectant residual at end of contact zone (mg/L)",
          "T₁₀ = time for 10% of water to pass through (minutes)",
          "T₁₀ = T × Baffling Factor (BF)",
          "BF ranges from 0.1 (poor baffling) to 1.0 (plug flow)",
          "Higher CT = more disinfection credit",
        ],
        example: "C = 1.8 mg/L free Cl₂, T = 40 min, BF = 0.7 → T₁₀ = 28 min → CT = 1.8 × 28 = 50.4 mg·min/L",
        examTip: "Class 4 exams test baffling factor application. Know that a fully baffled clearwell has BF = 0.7, and a completely mixed tank has BF = 0.1. CT must be calculated using T₁₀, not total HRT.",
      },
      {
        name: "Log Inactivation",
        formula: "Log Inactivation = log₁₀(N₀/N)",
        units: "log units",
        variables: [
          "N₀ = initial pathogen concentration",
          "N = final pathogen concentration after treatment",
          "1-log = 90% removal",
          "2-log = 99% removal",
          "3-log = 99.9% removal",
          "4-log = 99.99% removal",
        ],
        example: "N₀ = 1,000 cysts, N = 1 cyst → Log = log(1000/1) = log(1000) = 3-log inactivation (99.9%)",
        examTip: "Ontario requires: Giardia 3-log, Cryptosporidium 2-log, Viruses 4-log total inactivation + removal. Multiple barriers (filtration + disinfection) contribute to total log credit.",
      },
      {
        name: "Ozone CT (Integrated)",
        formula: "CT_ozone = ∫C·dt ≈ Σ(Cᵢ × Δtᵢ)",
        units: "mg·min/L",
        variables: [
          "Cᵢ = ozone residual at each measurement point (mg/L)",
          "Δtᵢ = time interval between measurements (min)",
          "Ozone decays rapidly — residual must be measured at multiple points",
          "CT is the area under the residual vs. time curve",
        ],
        example: "Residuals: 0.8, 0.5, 0.3 mg/L over 3-min intervals → CT = (0.8+0.5+0.3) × 3 = 4.8 mg·min/L",
        examTip: "Ozone CT values are much lower than chlorine CT. For Giardia 3-log at 20°C pH 7: ozone CT ≈ 0.48 mg·min/L vs chlorine CT ≈ 73 mg·min/L. Ozone does not receive virus credit in Ontario.",
      },
      {
        name: "UV Dose",
        formula: "UV Dose = Irradiance × Exposure Time",
        units: "mJ/cm²",
        variables: [
          "Irradiance = UV light intensity at the target (mW/cm²)",
          "Exposure Time = contact time in the UV reactor (seconds)",
          "UV Dose = mW/cm² × s = mJ/cm²",
          "Effective dose depends on UVT, lamp output, flow rate",
          "UV Transmittance (UVT) measured at 254 nm",
        ],
        example: "Irradiance = 5 mW/cm², Exposure = 8 s → UV Dose = 5 × 8 = 40 mJ/cm²",
        examTip: "Class 4 UV credit: Cryptosporidium 2-log at 10 mJ/cm², 3-log at 36 mJ/cm²; Giardia 3-log at 5 mJ/cm². UV does NOT receive virus inactivation credit in Ontario. UVT must be monitored continuously.",
      },
      {
        name: "Membrane Flux",
        formula: "Flux (J) = Q / A",
        units: "L/m²/h (LMH)",
        variables: [
          "Q = permeate flow rate (L/h)",
          "A = membrane surface area (m²)",
          "Typical MF/UF flux: 20–100 LMH",
          "Higher flux → faster fouling",
          "Net flux = gross flux × (1 − backwash fraction)",
        ],
        example: "Q = 500 L/h, A = 10 m² → Flux = 500/10 = 50 LMH",
        examTip: "Transmembrane pressure (TMP) increases as membranes foul. Gradual TMP increase = irreversible fouling requiring CIP. Sudden TMP spike = air binding or integrity breach.",
      },
      {
        name: "Membrane Recovery",
        formula: "Recovery (%) = (Qpermeate / Qfeed) × 100",
        units: "%",
        variables: [
          "Qpermeate = permeate (product) flow rate",
          "Qfeed = feed flow rate",
          "Qreject = Qfeed − Qpermeate",
          "Typical MF/UF recovery: 90–95%",
          "Typical RO recovery: 75–85%",
        ],
        example: "Feed = 1,000 L/h, Permeate = 900 L/h → Recovery = 900/1,000 × 100 = 90%",
        examTip: "Higher recovery means less reject/brine to dispose of but increases concentration polarization and fouling risk. RO recovery is limited by scaling potential of the reject stream.",
      },
      {
        name: "Empty Bed Contact Time (EBCT)",
        formula: "EBCT = V_bed / Q",
        units: "minutes",
        variables: [
          "V_bed = volume of GAC/media bed (m³ or L)",
          "Q = flow rate through the bed (m³/min or L/min)",
          "Typical EBCT for taste/odour: 5–15 min",
          "Typical EBCT for micropollutants: 15–30 min",
          "Longer EBCT = better removal but higher capital cost",
        ],
        example: "V_bed = 50 m³, Q = 5 m³/min → EBCT = 50/5 = 10 minutes",
        examTip: "EBCT is the key design parameter for GAC adsorbers. It is NOT the same as hydraulic retention time — it uses the bed volume, not the void volume. Breakthrough occurs earlier with shorter EBCT.",
      },
      {
        name: "Bromate Formation Control",
        formula: "BrO₃⁻ ∝ [O₃] × [Br⁻] × pH",
        units: "µg/L",
        variables: [
          "BrO₃⁻ = bromate concentration (regulated at 10 µg/L in Ontario)",
          "[O₃] = ozone dose/residual",
          "[Br⁻] = bromide concentration in source water",
          "pH = higher pH increases bromate formation",
          "Control: lower pH, reduce O₃ dose, add NH₃, use UV/H₂O₂ AOP",
        ],
        example: "Source water Br⁻ = 200 µg/L → bromate formation risk is significant; pH should be lowered to 6.5–7.0 during ozonation",
        examTip: "Bromate is a potential carcinogen formed when ozone reacts with bromide. The Ontario MAC is 10 µg/L. Ammonia addition suppresses bromate formation by scavenging hydroxyl radicals.",
      },
    ],
  },
  {
    id: "hydraulics",
    title: "Hydraulics & Distribution",
    icon: "💧",
    color: "#0F766E",
    bg: "#CCFBF1",
    formulas: [
      {
        name: "Hazen-Williams Head Loss",
        formula: "hf = 10.67 × L × Q^1.852 / (C^1.852 × D^4.87)",
        units: "metres (m)",
        variables: [
          "hf = friction head loss (m)",
          "L = pipe length (m)",
          "Q = flow rate (m³/s)",
          "C = Hazen-Williams roughness coefficient (new PVC: 150, old CI: 80–100)",
          "D = pipe diameter (m)",
          "Higher C = smoother pipe = less head loss",
        ],
        example: "L = 500 m, D = 0.3 m, Q = 0.05 m³/s, C = 120 → hf ≈ 2.8 m",
        examTip: "Class 4 exams test the concept: doubling flow increases head loss by 3.5× (Q^1.852). Doubling pipe diameter reduces head loss by 28× (D^4.87). Pipe roughness (C) decreases with age.",
      },
      {
        name: "Pump Affinity Laws",
        formula: "Q₂/Q₁ = N₂/N₁ | H₂/H₁ = (N₂/N₁)² | P₂/P₁ = (N₂/N₁)³",
        units: "Q: L/s, H: m, P: kW",
        variables: [
          "Q = flow rate (varies linearly with speed)",
          "H = head (varies as square of speed ratio)",
          "P = power (varies as cube of speed ratio)",
          "N = rotational speed (RPM)",
          "VFD (Variable Frequency Drive) uses affinity laws to optimize energy",
        ],
        example: "Speed increases from 1,200 to 1,440 RPM (ratio = 1.2): Q increases 1.2×, H increases 1.44×, P increases 1.73×",
        examTip: "The power law (cube relationship) is why VFDs save energy — reducing speed by 20% reduces power by 49%. This is the most energy-efficient way to reduce pump output.",
      },
      {
        name: "Net Positive Suction Head (NPSH)",
        formula: "NPSH_available = (P_atm/ρg) + (P_s/ρg) − h_vapor − h_f_suction",
        units: "metres (m)",
        variables: [
          "P_atm = atmospheric pressure head (≈10.3 m at sea level)",
          "P_s = suction pressure head",
          "h_vapor = vapor pressure head of water",
          "h_f_suction = friction losses in suction piping",
          "NPSH_available must exceed NPSH_required to prevent cavitation",
        ],
        example: "NPSH_available = 10.3 − 3.0 (static lift) − 0.5 (friction) − 0.24 (vapor at 20°C) = 6.56 m",
        examTip: "If NPSH_available < NPSH_required, cavitation occurs. Increase NPSH_available by: lowering pump, increasing suction pipe diameter, reducing suction pipe length, or cooling the water.",
      },
      {
        name: "Water Hammer Pressure",
        formula: "ΔP = ρ × a × ΔV",
        units: "kPa or m head",
        variables: [
          "ΔP = pressure surge (Pa)",
          "ρ = water density (1,000 kg/m³)",
          "a = wave speed in pipe (typically 900–1,200 m/s for water mains)",
          "ΔV = change in flow velocity (m/s)",
          "Surge pressure can be 5–10× normal operating pressure",
        ],
        example: "ΔV = 1.5 m/s, a = 1,000 m/s → ΔP = 1,000 × 1,000 × 1.5 = 1,500,000 Pa = 1,500 kPa",
        examTip: "Water hammer is prevented by: slow-closing valves (close in >2L/a seconds), surge tanks, air chambers, and pressure relief valves. Pump shutdown causes negative pressure wave (column separation).",
      },
      {
        name: "Hydraulic Grade Line (HGL)",
        formula: "HGL = Elevation + Pressure Head = z + P/(ρg)",
        units: "metres (m)",
        variables: [
          "z = elevation above datum (m)",
          "P = pressure (Pa)",
          "ρ = water density (1,000 kg/m³)",
          "g = 9.81 m/s²",
          "HGL drops along the direction of flow due to friction losses",
          "HGL must be above pipe to maintain positive pressure",
        ],
        example: "Elevation = 50 m, Pressure = 300 kPa → HGL = 50 + 300,000/(1,000×9.81) = 50 + 30.6 = 80.6 m",
        examTip: "The HGL must always be above the pipe crown to prevent negative pressures (which cause contamination intrusion). Minimum pressure in distribution: 140 kPa (20 psi) residential; 550 kPa (80 psi) maximum.",
      },
      {
        name: "Pressure Zone Design",
        formula: "Operating Pressure = HGL − Pipe Elevation",
        units: "kPa or m",
        variables: [
          "Minimum pressure: 140 kPa (20 psi) at all service connections",
          "Maximum pressure: 550–700 kPa (80–100 psi) to prevent pipe damage",
          "PRV set point = maximum allowable downstream pressure",
          "Booster station required when HGL is insufficient for high-elevation areas",
        ],
        example: "HGL = 120 m, Pipe elevation = 80 m → Pressure = (120−80) × 9.81 = 392 kPa (57 psi)",
        examTip: "Pressure zones are created when elevation differences exceed 40–50 m. PRVs reduce pressure at zone boundaries. Booster stations increase pressure for high zones.",
      },
    ],
  },
  {
    id: "math",
    title: "Math & Calculations",
    icon: "🧮",
    color: "#7C3AED",
    bg: "#EDE9FE",
    formulas: [
      {
        name: "Chemical Feed Rate",
        formula: "Feed Rate (kg/d) = Dose (mg/L) × Flow (m³/d) × 0.001",
        units: "kg/day",
        variables: [
          "Dose = chemical concentration required (mg/L)",
          "Flow = plant flow rate (m³/day)",
          "0.001 = unit conversion (mg/L × m³ = g, ÷1000 = kg)",
          "For liquid chemicals: Feed Rate (L/d) = kg/d ÷ (Concentration × SG)",
        ],
        example: "Dose = 2.5 mg/L, Flow = 50,000 m³/d → Feed Rate = 2.5 × 50,000 × 0.001 = 125 kg/d",
        examTip: "Always check units. If flow is in ML/d: Feed Rate (kg/d) = Dose (mg/L) × Flow (ML/d) × 1. If using liquid chemical at 12.5% strength (SG 1.2): Volume = 125 ÷ (0.125 × 1.2) = 833 L/d.",
      },
      {
        name: "Percent Solution Concentration",
        formula: "% = (mass of solute / mass of solution) × 100",
        units: "%",
        variables: [
          "Mass of solute = chemical dissolved (g or kg)",
          "Mass of solution = total solution mass (g or kg)",
          "For liquid: % = (mass solute / volume × SG) × 100",
          "Sodium hypochlorite: typically 6–15% available chlorine",
          "Alum: typically 48% Al₂(SO₄)₃ solution",
        ],
        example: "10 kg NaOCl in 90 kg water → % = 10/(10+90) × 100 = 10%",
        examTip: "When diluting: C₁V₁ = C₂V₂. Example: dilute 15% NaOCl to 1%: V₁ = (1% × 100 L) / 15% = 6.67 L of stock + 93.33 L water.",
      },
      {
        name: "Detention Time (HRT)",
        formula: "HRT = Volume / Flow Rate",
        units: "hours or minutes",
        variables: [
          "Volume = tank/basin volume (m³ or L)",
          "Flow Rate = plant flow (m³/h or L/min)",
          "HRT = theoretical time water spends in the tank",
          "Actual contact time = HRT × Baffling Factor",
          "T₁₀ = HRT × BF (used for CT calculations)",
        ],
        example: "Clearwell volume = 2,000 m³, Flow = 500 m³/h → HRT = 2,000/500 = 4 hours",
        examTip: "HRT is NOT the same as T₁₀. For CT calculations, T₁₀ = HRT × BF. A clearwell with BF = 0.7 and HRT = 4 h has T₁₀ = 2.8 h = 168 min.",
      },
      {
        name: "Filter Loading Rate",
        formula: "Loading Rate = Q / A",
        units: "m³/m²/h or m/h",
        variables: [
          "Q = flow rate through filter (m³/h)",
          "A = filter surface area (m²)",
          "Typical rapid sand filter: 5–15 m/h (120–360 m³/m²/d)",
          "Typical dual media filter: 10–20 m/h",
          "High loading → shorter filter run, more backwashing",
        ],
        example: "Q = 500 m³/h, Filter area = 50 m² → Loading = 500/50 = 10 m/h",
        examTip: "Filter loading rate is also called surface loading rate or hydraulic loading rate. Exceeding design loading causes turbidity breakthrough. Reduce flow or take filters offline during high-demand periods.",
      },
      {
        name: "Langelier Saturation Index (LSI)",
        formula: "LSI = pH − pHs",
        units: "dimensionless",
        variables: [
          "pH = measured pH of finished water",
          "pHs = saturation pH = (pK₂ − pKs) + p[Ca²⁺] + p[Alk]",
          "LSI > 0: scale-forming (CaCO₃ deposits) — corrosion protection",
          "LSI < 0: corrosive (dissolves CaCO₃ scale) — lead/copper release",
          "LSI = 0: balanced (saturation equilibrium)",
          "Target: LSI between 0 and +0.5 for corrosion control",
        ],
        example: "pH = 7.6, pHs = 8.1 → LSI = 7.6 − 8.1 = −0.5 (corrosive — adjust pH or alkalinity)",
        examTip: "Class 4 operators must understand corrosion control for lead and copper. LSI < −0.5 requires treatment (pH adjustment, alkalinity addition, orthophosphate). The Lead and Copper Rule targets LSI near 0.",
      },
      {
        name: "Weir Overflow Rate",
        formula: "WOR = Q / L_weir",
        units: "m³/m/d",
        variables: [
          "Q = flow rate (m³/d)",
          "L_weir = total weir length (m)",
          "Typical design WOR: 125–500 m³/m/d",
          "V-notch weirs are common in clarifiers",
          "WOR controls velocity near the weir — high WOR causes turbulence and floc carryover",
        ],
        example: "Q = 20,000 m³/d, Weir length = 100 m → WOR = 20,000/100 = 200 m³/m/d",
        examTip: "High weir overflow rates cause floc carryover (turbidity spikes in settled water). Solutions: add more weir length (launder extensions), reduce flow, or improve flocculation.",
      },
      {
        name: "Surface Overflow Rate (SOR)",
        formula: "SOR = Q / A_surface",
        units: "m³/m²/d",
        variables: [
          "Q = flow rate (m³/d)",
          "A_surface = clarifier surface area (m²)",
          "Typical design SOR: 20–60 m³/m²/d for conventional clarifiers",
          "DAF: 5–15 m³/m²/h (higher than sedimentation)",
          "SOR = settling velocity of particles that are 100% removed",
        ],
        example: "Q = 15,000 m³/d, Diameter = 20 m → A = π×10² = 314 m² → SOR = 15,000/314 = 47.8 m³/m²/d",
        examTip: "Particles with settling velocity > SOR are 100% removed. Particles with settling velocity < SOR are partially removed. Reducing SOR (larger clarifier or lower flow) improves removal efficiency.",
      },
      {
        name: "Chlorine Residual Decay",
        formula: "C(t) = C₀ × e^(−k×t)",
        units: "mg/L",
        variables: [
          "C(t) = residual at time t (mg/L)",
          "C₀ = initial residual (mg/L)",
          "k = first-order decay rate constant (per hour)",
          "t = time (hours)",
          "Higher temperature → higher k → faster decay",
          "Higher NOM → higher k → faster decay",
        ],
        example: "C₀ = 1.0 mg/L, k = 0.05/h, t = 24 h → C = 1.0 × e^(−0.05×24) = 1.0 × 0.301 = 0.30 mg/L",
        examTip: "Chlorine residual must be maintained throughout the distribution system (minimum 0.05 mg/L free chlorine in Ontario). Decay is faster in warm water, long dead-end mains, and areas with high NOM.",
      },
    ],
  },
  {
    id: "water-quality",
    title: "Water Quality & Treatment",
    icon: "🧪",
    color: "#B45309",
    bg: "#FEF3C7",
    formulas: [
      {
        name: "Total Hardness",
        formula: "TH (mg/L as CaCO₃) = [Ca²⁺] × (100/40) + [Mg²⁺] × (100/24.3)",
        units: "mg/L as CaCO₃",
        variables: [
          "[Ca²⁺] = calcium concentration (mg/L)",
          "[Mg²⁺] = magnesium concentration (mg/L)",
          "MW: Ca = 40, Mg = 24.3, CaCO₃ = 100",
          "Soft: < 75 mg/L, Moderate: 75–150, Hard: 150–300, Very Hard: > 300",
          "Hardness causes scale in pipes and water heaters",
        ],
        example: "Ca²⁺ = 80 mg/L, Mg²⁺ = 18 mg/L → TH = 80×(100/40) + 18×(100/24.3) = 200 + 74 = 274 mg/L as CaCO₃",
        examTip: "Lime softening removes hardness: Ca²⁺ + Ca(OH)₂ + CO₂ → 2CaCO₃↓. Mg²⁺ removal requires excess lime (pH > 10.8). Ion exchange softening uses Na⁺ to replace Ca²⁺ and Mg²⁺.",
      },
      {
        name: "Alkalinity",
        formula: "Alkalinity (mg/L as CaCO₃) = [HCO₃⁻] × (50/61) + [CO₃²⁻] × (50/30) + [OH⁻] × (50/17)",
        units: "mg/L as CaCO₃",
        variables: [
          "[HCO₃⁻] = bicarbonate (mg/L) — dominant at pH 6–8.3",
          "[CO₃²⁻] = carbonate (mg/L) — significant at pH > 8.3",
          "[OH⁻] = hydroxide (mg/L) — significant at pH > 10",
          "MW equivalents: HCO₃⁻ = 61, CO₃²⁻ = 30, OH⁻ = 17",
          "Alkalinity buffers pH changes during disinfection",
        ],
        example: "[HCO₃⁻] = 122 mg/L → Alkalinity = 122 × (50/61) = 100 mg/L as CaCO₃",
        examTip: "Alkalinity is consumed by coagulation (alum reduces alkalinity). Minimum alkalinity of 30–40 mg/L as CaCO₃ is needed for effective coagulation. Add lime or soda ash to restore alkalinity.",
      },
      {
        name: "Trihalomethane (THM) Formation",
        formula: "THM formation ∝ [Cl₂] × [NOM] × Time × Temperature × pH",
        units: "µg/L",
        variables: [
          "THM = chloroform + bromodichloromethane + dibromochloromethane + bromoform",
          "MAC in Ontario: 100 µg/L total THMs",
          "Higher NOM → more THM precursors",
          "Higher pH → more THM formation",
          "Higher temperature → faster THM formation",
          "Control: reduce NOM (enhanced coagulation, GAC), reduce Cl₂ dose, reduce contact time",
        ],
        example: "TOC = 8 mg/L, Cl₂ dose = 3 mg/L, pH 8, 25°C → high THM risk; enhanced coagulation required",
        examTip: "THMs are regulated at 100 µg/L (annual running average). HAAs (haloacetic acids) are regulated at 80 µg/L. Both are DBPs formed by chlorine reacting with NOM. Enhanced coagulation is the primary control strategy.",
      },
      {
        name: "TOC Removal (Enhanced Coagulation)",
        formula: "% TOC removal = (TOC_in − TOC_out) / TOC_in × 100",
        units: "%",
        variables: [
          "TOC_in = raw water TOC (mg/L)",
          "TOC_out = treated water TOC (mg/L)",
          "Ontario requires enhanced coagulation for TOC > 2 mg/L",
          "Target removal depends on source water alkalinity and TOC",
          "Low alkalinity + high TOC → highest removal required",
        ],
        example: "TOC_in = 8.5 mg/L, TOC_out = 3.2 mg/L → Removal = (8.5−3.2)/8.5 × 100 = 62.4%",
        examTip: "Enhanced coagulation targets (USEPA Stage 1 DBPR): at TOC 4–8 mg/L, alkalinity < 60 mg/L → 40% TOC removal required. Lower pH (5.5–6.5) and higher coagulant dose improve NOM removal.",
      },
      {
        name: "Corrosion Index (CSMR)",
        formula: "CSMR = [Cl⁻] / [SO₄²⁻]",
        units: "dimensionless",
        variables: [
          "[Cl⁻] = chloride concentration (mg/L)",
          "[SO₄²⁻] = sulfate concentration (mg/L)",
          "CSMR > 0.5 indicates elevated lead/copper corrosion risk",
          "CSMR > 0.58 triggers lead corrosion concerns",
          "Chloride promotes pitting corrosion; sulfate promotes uniform corrosion",
        ],
        example: "[Cl⁻] = 60 mg/L, [SO₄²⁻] = 80 mg/L → CSMR = 60/80 = 0.75 (elevated risk)",
        examTip: "CSMR is important for lead service line communities. Switching from chloride-based to sulfate-based coagulants can reduce CSMR. Orthophosphate addition forms protective scale on lead pipes.",
      },
      {
        name: "Assimilable Organic Carbon (AOC)",
        formula: "AOC = AOC_Pseudomonas + AOC_Spirillum",
        units: "µg acetate-C equivalents/L",
        variables: [
          "AOC measures biodegradable fraction of DOC",
          "AOC < 10 µg/L: biologically stable (no regrowth risk)",
          "AOC > 100 µg/L: significant regrowth potential",
          "Ozonation increases AOC (breaks NOM into biodegradable fractions)",
          "BAC filtration reduces AOC by biological degradation",
        ],
        example: "After ozonation: AOC increases from 20 to 150 µg/L. After BAC: AOC decreases to 15 µg/L (biologically stable)",
        examTip: "AOC is the key parameter for distribution system biological stability. High AOC promotes bacterial regrowth, biofilm formation, and nitrification. BAC filtration after ozonation is the most effective AOC reduction strategy.",
      },
    ],
  },
  {
    id: "lab",
    title: "Laboratory Analysis",
    icon: "🔭",
    color: "#0369A1",
    bg: "#E0F2FE",
    formulas: [
      {
        name: "Method Detection Limit (MDL)",
        formula: "MDL = t × s",
        units: "same as analyte",
        variables: [
          "t = Student's t-value for n−1 degrees of freedom at 99% confidence",
          "s = standard deviation of replicate measurements at low concentration",
          "MDL = lowest concentration reliably detected above noise",
          "Reporting limit (RL) is typically 3–10× MDL",
          "Results below MDL reported as < MDL",
        ],
        example: "7 replicates at 0.5 µg/L: s = 0.05 µg/L, t = 3.143 → MDL = 3.143 × 0.05 = 0.16 µg/L",
        examTip: "Class 4 operators must understand QA/QC concepts. MDL is determined by the laboratory, not the operator. Regulatory limits must be above the MDL to be enforceable.",
      },
      {
        name: "Jar Test Coagulant Dose",
        formula: "Dose (mg/L) = (V_stock × C_stock) / V_sample",
        units: "mg/L",
        variables: [
          "V_stock = volume of coagulant stock added to jar (mL)",
          "C_stock = concentration of stock solution (mg/mL)",
          "V_sample = volume of water sample in jar (mL)",
          "Standard jar volume: 1,000 mL or 2,000 mL",
          "Typical stock: 10 g/L alum = 10 mg/mL",
        ],
        example: "1 mL of 10 mg/mL alum stock in 1,000 mL sample → Dose = (1 × 10)/1,000 = 0.01 mg/mL = 10 mg/L",
        examTip: "Jar test determines optimal coagulant dose, pH, and mixing conditions. Evaluate settled water turbidity, colour, and pH. The optimal dose is the lowest dose achieving the target turbidity.",
      },
      {
        name: "Chlorine Residual (DPD Method)",
        formula: "Free Cl₂ = DPD reading (mg/L) — read immediately after adding DPD",
        units: "mg/L",
        variables: [
          "Free chlorine = HOCl + OCl⁻ (hypochlorous acid + hypochlorite)",
          "Total chlorine = free + combined (chloramines)",
          "Combined chlorine = total − free",
          "DPD #1 = free chlorine; DPD #3 = total chlorine",
          "Amperometric titration is more accurate for regulatory compliance",
        ],
        example: "DPD #1 = 0.8 mg/L (free), DPD #3 = 1.2 mg/L (total) → Combined = 1.2 − 0.8 = 0.4 mg/L",
        examTip: "Interference: high free chlorine (> 5 mg/L) can bleach DPD → false low reading. Mn²⁺ and Cr⁶⁺ interfere. For regulatory compliance, use amperometric titration or calibrated colorimeter.",
      },
      {
        name: "Turbidity Measurement",
        formula: "Turbidity (NTU) = 90° scattered light / reference beam",
        units: "NTU (Nephelometric Turbidity Units)",
        variables: [
          "Measured at 90° to incident light beam",
          "Ontario MAC: 1 NTU treated water (0.3 NTU for membrane systems)",
          "Continuous monitoring required for surface water plants",
          "Individual filter effluent: < 0.3 NTU 95% of time",
          "Calibrate with formazin or StablCal standards",
        ],
        example: "Filter effluent turbidity = 0.25 NTU (compliant); spike to 0.8 NTU after backwash (filter ripening — filter to waste)",
        examTip: "Turbidity is the most critical online measurement for surface water plants. Spikes above 0.3 NTU trigger investigation. Continuous turbidity monitoring is required by O. Reg. 170/03.",
      },
      {
        name: "pH Measurement",
        formula: "pH = −log₁₀[H⁺]",
        units: "pH units (0–14)",
        variables: [
          "[H⁺] = hydrogen ion activity (mol/L)",
          "pH 7 = neutral, pH < 7 = acidic, pH > 7 = basic",
          "Each pH unit = 10× change in [H⁺]",
          "Calibrate with two buffers (e.g., pH 4 and pH 7, or pH 7 and pH 10)",
          "Temperature affects pH measurement — use temperature compensation",
        ],
        example: "[H⁺] = 10⁻⁷·⁸ mol/L → pH = 7.8",
        examTip: "pH affects: chlorine speciation (HOCl vs OCl⁻), coagulation efficiency, corrosion, and THM formation. At pH < 7.5, HOCl dominates (stronger disinfectant). At pH > 8, OCl⁻ dominates (weaker). Target pH 7.0–7.5 for optimal disinfection.",
      },
    ],
  },
  {
    id: "regulations",
    title: "Regulations & Management",
    icon: "📋",
    color: "#B91C1C",
    bg: "#FEE2E2",
    formulas: [
      {
        name: "Minimum Chlorine Residual (Ontario)",
        formula: "Free Cl₂ ≥ 0.05 mg/L at all points in distribution system",
        units: "mg/L",
        variables: [
          "O. Reg. 170/03 minimum: 0.05 mg/L free chlorine",
          "Recommended: 0.2–0.5 mg/L throughout distribution",
          "Maximum: 4 mg/L (aesthetic objective)",
          "Total chlorine (chloramine systems): ≥ 0.05 mg/L",
          "Residual must be maintained to prevent regrowth",
        ],
        example: "Distribution system sample: 0.03 mg/L free Cl₂ → AWQI required; investigate and flush",
        examTip: "Any sample below 0.05 mg/L free chlorine is an adverse result requiring immediate investigation and reporting. Chloramine systems maintain total chlorine ≥ 0.05 mg/L.",
      },
      {
        name: "Turbidity MAC (Ontario O. Reg. 170/03)",
        formula: "Treated water turbidity ≤ 1 NTU at all times; ≤ 0.3 NTU 95% of time",
        units: "NTU",
        variables: [
          "1 NTU = absolute maximum for treated water",
          "0.3 NTU = 95th percentile target (monthly)",
          "0.3 NTU = individual filter effluent target",
          "Membrane systems: ≤ 0.1 NTU",
          "Turbidity > 1 NTU = AWQI requiring immediate reporting",
        ],
        example: "Monthly turbidity data: 28/30 days ≤ 0.3 NTU = 93.3% compliance (below 95% target — investigate)",
        examTip: "Turbidity is a surrogate for pathogen removal. High turbidity interferes with disinfection (shields pathogens from UV/chlorine). The 0.3 NTU target ensures adequate disinfection efficiency.",
      },
      {
        name: "E. coli MAC (Ontario)",
        formula: "E. coli = 0 CFU/100 mL in treated water",
        units: "CFU/100 mL",
        variables: [
          "E. coli = 0 in any treated water sample (zero tolerance)",
          "Total coliforms = 0 in treated water (< 1 CFU/100 mL)",
          "Positive E. coli = AWQI requiring immediate reporting to MECP",
          "Confirm positive with repeat sample and investigate source",
          "Boil water advisory may be required",
        ],
        example: "Treated water sample: E. coli = 1 CFU/100 mL → AWQI, notify MECP immediately, issue boil water advisory, investigate",
        examTip: "E. coli is the primary indicator of fecal contamination. Any detection in treated water is an adverse result. Total coliform positives also require investigation but are not as immediately serious as E. coli.",
      },
      {
        name: "AWQI Reporting Timeline",
        formula: "Immediate verbal report + written report within 7 days",
        units: "hours/days",
        variables: [
          "Immediate = as soon as aware (by telephone to MECP Spills Action Centre)",
          "Written report = within 7 days of becoming aware",
          "AWQI triggers: any MAC exceedance, observation of contamination, equipment failure affecting treatment",
          "Notify: MECP, local Medical Officer of Health, owner",
          "Document: date/time, nature of incident, corrective actions",
        ],
        example: "Turbidity spike to 1.5 NTU at 14:00 → Call MECP Spills Action Centre immediately → Written report by 14:00 next week",
        examTip: "The MECP Spills Action Centre is available 24/7 at 1-800-268-6060. Do not wait for laboratory confirmation before reporting. Err on the side of caution.",
      },
      {
        name: "DWQMS Operational Plan Requirements",
        formula: "Annual review + management review + internal audit",
        units: "per year",
        variables: [
          "Operational Plan: updated annually, reviewed by owner",
          "Management Review: annual assessment of QMS effectiveness",
          "Internal Audit: annual audit of all QMS elements",
          "Corrective Actions: documented and tracked to closure",
          "Third-party accreditation: required every 3 years",
        ],
        example: "Annual DWQMS cycle: Jan (internal audit) → Mar (management review) → Jun (Operational Plan update) → Sep (third-party audit every 3 years)",
        examTip: "The DWQMS is required under O. Reg. 188/07 for all municipal residential drinking water systems. Non-compliance can result in licence revocation. The 21 elements of the DWQMS cover all aspects of QMS.",
      },
    ],
  },
];

export default function FormulasWater4() {
  usePageMeta({
    title: "Class 4 Water Treatment Formula Sheet — Echelon Institute",
    description: "Comprehensive formula sheet for the Ontario Class 4 Water Treatment operator exam. Covers advanced treatment, membrane filtration, UV disinfection, ozone, source water protection, and more.",
    path: "/formulas-water4",
    keywords: "Class 4 water treatment formulas, membrane filtration, UV disinfection, ozone, CT value, advanced water treatment, Ontario operator exam",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const filteredSections = SECTIONS.map(section => ({
    ...section,
    formulas: section.formulas.filter(f =>
      !searchTerm ||
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.variables.some(v => v.toLowerCase().includes(searchTerm.toLowerCase())) ||
      f.example.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.examTip.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(s => s.formulas.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Sora', sans-serif" }}>      <style>{`
        @media (max-width: 640px) {
          .formulas-content { padding: 16px 14px 60px !important; }
          .formulas-hero { padding: 32px 16px 28px !important; }
          .formulas-hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .formulas-hero-btns a, .formulas-hero-btns button { width: 100% !important; box-sizing: border-box; }
          .formulas-nav-btns { flex-wrap: wrap !important; }
          .formulas-nav-btns a, .formulas-nav-btns button { flex: 1 1 auto !important; }
          .formulas-quick-ref { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <SiteNav currentPath="/formulas-water4" />
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #1D4ED8 100%)", padding: "32px 16px 24px", color: "#fff" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Link href="/account" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 13 }}>← Back to Account</Link>
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>
            📐 Class 4 Water Treatment
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, opacity: 0.85 }}>
            Formula Sheet — Advanced Operator Level (Ontario MECP)
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            {SECTIONS.map(s => (
              <div key={s.id} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600 }}>
                {s.icon} {s.title} ({s.formulas.length})
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search formulas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: "#1E293B", background: "#fff", boxSizing: "border-box" }}
          />
        </div>

        {/* Section tabs */}
        {!searchTerm && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            <button
              onClick={() => setActiveSection(null)}
              style={{ padding: "8px 14px", background: !activeSection ? "#1E40AF" : "#fff", color: !activeSection ? "#fff" : "#475569", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              All Sections
            </button>
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
                style={{ padding: "8px 14px", background: activeSection === s.id ? s.color : "#fff", color: activeSection === s.id ? "#fff" : "#475569", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                {s.icon} {s.title}
              </button>
            ))}
          </div>
        )}

        {/* Formula sections */}
        {filteredSections
          .filter(s => !activeSection || s.id === activeSection)
          .map(section => (
            <div key={section.id} id={section.id} style={{ marginBottom: 32, scrollMarginTop: 80 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: section.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {section.icon}
                </div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: section.color }}>
                  {section.title}
                </h2>
                <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>
                  {section.formulas.length} formulas
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {section.formulas.map((f, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", border: `1px solid ${section.bg}` }}>
                    <div style={{ padding: "14px 18px", background: section.bg, borderBottom: `1px solid ${section.bg}` }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: section.color }}>{f.name}</div>
                      <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Units: {f.units}</div>
                    </div>
                    <div style={{ padding: "14px 18px" }}>
                      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontFamily: "monospace", fontSize: 14, color: "#1E293B", fontWeight: 600, lineHeight: 1.6 }}>
                        {f.formula}
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Variables</div>
                        {f.variables.map((v, j) => (
                          <div key={j} style={{ fontSize: 13, color: "#374151", padding: "2px 0", lineHeight: 1.5 }}>
                            • {v}
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "#F0FDF4", borderRadius: 8, padding: "10px 14px", marginBottom: 12, border: "1px solid #BBF7D0" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#15803D", marginBottom: 4 }}>📊 Worked Example</div>
                        <div style={{ fontSize: 13, color: "#14532D", lineHeight: 1.6 }}>{f.example}</div>
                      </div>
                      <div style={{ background: "#FFF7ED", borderRadius: 8, padding: "10px 14px", border: "1px solid #FED7AA" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#C2410C", marginBottom: 4 }}>💡 Exam Tip</div>
                        <div style={{ fontSize: 13, color: "#7C2D12", lineHeight: 1.6 }}>{f.examTip}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
