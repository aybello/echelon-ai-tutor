// CLASS 3 WATER TREATMENT FORMULA SHEET
// Covers all calculation-heavy topics from the ABC/WPI Class 3 NTK
// Organized by module: Treatment Process, Lab Analysis, Equipment O&M, Source Water, Safety
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
    id: "treatment",
    title: "Treatment Process",
    icon: "⚗️",
    color: "#1D4ED8",
    bg: "#DBEAFE",
    formulas: [
      {
        name: "Langelier Saturation Index (LSI)",
        formula: "LSI = pH − pHs",
        units: "dimensionless",
        variables: [
          "pH = measured pH of water",
          "pHs = pH at which water is saturated with CaCO₃",
          "pHs = (pK₂ − pKs) + p[Ca²⁺] + p[HCO₃⁻]",
          "LSI > 0: scale-forming (CaCO₃ deposits)",
          "LSI < 0: corrosive (dissolves CaCO₃ scale)",
          "LSI = 0: balanced",
        ],
        example: "pH = 7.8, pHs = 8.2 → LSI = 7.8 − 8.2 = −0.4 (slightly corrosive)",
        examTip: "Class 3 exams test pHs calculation from temperature, calcium, and alkalinity. Know that LSI < −0.5 requires corrosion control treatment.",
      },
      {
        name: "Chlorine Demand",
        formula: "Demand = Applied Dose − Residual",
        units: "mg/L",
        variables: [
          "Applied Dose = chlorine added (mg/L)",
          "Residual = free or total chlorine remaining after contact time (mg/L)",
          "Demand = consumed by organics, ammonia, metals, etc.",
        ],
        example: "Applied 3.5 mg/L, residual 1.2 mg/L → Demand = 3.5 − 1.2 = 2.3 mg/L",
        examTip: "Breakpoint chlorination requires ~10× the ammonia-N concentration to reach the breakpoint and achieve free chlorine residual.",
      },
      {
        name: "CT Value (Disinfection)",
        formula: "CT = C × T",
        units: "mg·min/L",
        variables: [
          "C = disinfectant residual concentration (mg/L)",
          "T = contact time (minutes) — typically T₁₀ (10th percentile)",
          "CT required depends on pathogen, disinfectant, pH, temperature",
          "Higher CT = more disinfection credit",
        ],
        example: "C = 1.5 mg/L free Cl₂, T₁₀ = 30 min → CT = 45 mg·min/L",
        examTip: "For Giardia: 3-log inactivation requires CT ≈ 73 mg·min/L at 15°C, pH 7. For Cryptosporidium: chlorine is ineffective; UV or ozone required.",
      },
      {
        name: "Coagulant Dose (Jar Test)",
        formula: "Dose (mg/L) = (Volume of coagulant stock × Concentration of stock) / Volume of sample",
        units: "mg/L",
        variables: [
          "Volume of coagulant stock = mL added to jar",
          "Concentration of stock = mg/mL (or g/L)",
          "Volume of sample = typically 1,000 mL (1 L)",
        ],
        example: "Add 1.5 mL of 10,000 mg/L alum to 1,000 mL sample → Dose = (1.5 × 10,000) / 1,000 = 15 mg/L",
        examTip: "Jar test results must be scaled to plant flow for actual chemical feed rate. Optimal pH for alum coagulation is 6.5–7.5.",
      },
      {
        name: "Chemical Feed Rate",
        formula: "Feed Rate (kg/day) = Flow (ML/day) × Dose (mg/L)",
        units: "kg/day",
        variables: [
          "Flow = plant flow rate in megalitres per day (ML/day)",
          "Dose = chemical dose in mg/L",
          "1 ML/day × 1 mg/L = 1 kg/day",
        ],
        example: "Flow = 25 ML/day, alum dose = 18 mg/L → Feed Rate = 25 × 18 = 450 kg/day",
        examTip: "This is the most common Class 3 calculation. Memorize: ML/day × mg/L = kg/day. Convert m³/s to ML/day: × 86.4",
      },
      {
        name: "Fluoride Dose Calculation",
        formula: "Volume of fluoride solution = (Target − Current) × Plant Flow / (Fluoride concentration × Purity)",
        units: "L/day",
        variables: [
          "Target = desired fluoride concentration (mg/L), typically 0.7 mg/L",
          "Current = existing fluoride in source water (mg/L)",
          "Plant Flow = ML/day",
          "Fluoride concentration = mg/L in stock solution",
          "Purity = fraction (e.g., 0.98 for 98% pure NaF)",
        ],
        example: "Target 0.7 mg/L, current 0.1 mg/L, flow 10 ML/day, 10,000 mg/L NaF stock, 98% purity → Volume = (0.7−0.1) × 10,000,000 / (10,000 × 0.98) = 612 L/day",
        examTip: "Fluoride calculations appear frequently at Class 3. Know the three fluoride chemicals: NaF (sodium fluoride), Na₂SiF₆ (sodium fluorosilicate), H₂SiF₆ (fluorosilicic acid).",
      },
      {
        name: "Lime Dose for Softening",
        formula: "Lime dose (mg/L as CaCO₃) = CO₂ + Carbonate Hardness + Mg hardness (if removing Mg)",
        units: "mg/L as CaCO₃",
        variables: [
          "CO₂ removal: CO₂ (mg/L) × 2.27 = lime dose (mg/L as CaCO₃)",
          "Carbonate hardness removal: 1 mg/L CaCO₃ hardness requires 1 mg/L lime (as CaCO₃)",
          "Mg removal: 1 mg/L Mg hardness requires 1 mg/L lime (as CaCO₃) extra",
          "Actual lime = lime dose (as CaCO₃) × 0.74 (converts to Ca(OH)₂)",
        ],
        example: "CO₂ = 20 mg/L, carbonate hardness = 150 mg/L as CaCO₃ → Lime = (20 × 2.27 + 150) × 0.74 = 145 mg/L Ca(OH)₂",
        examTip: "Soda ash (Na₂CO₃) is needed for non-carbonate hardness removal: 1 mg/L NCH requires 1.06 mg/L soda ash (as CaCO₃).",
      },
      {
        name: "Filter Loading Rate",
        formula: "Loading Rate (m/h) = Flow (m³/h) / Filter Area (m²)",
        units: "m/h (or gal/min/ft²)",
        variables: [
          "Flow = total flow through the filter (m³/h)",
          "Filter Area = plan area of filter media (m²)",
          "Typical design rate: 5–15 m/h for rapid sand filters",
          "Maximum rate: 15–20 m/h (check turbidity at high rates)",
        ],
        example: "Flow = 500 m³/h, filter area = 50 m² → Loading Rate = 500/50 = 10 m/h",
        examTip: "Filter loading rate affects turbidity removal. Rates above 15 m/h may cause turbidity breakthrough. Reduce rate when source water turbidity is high.",
      },
      {
        name: "Backwash Rate",
        formula: "Backwash Rate (m/h) = Backwash Flow (m³/h) / Filter Area (m²)",
        units: "m/h",
        variables: [
          "Backwash Flow = flow rate during backwash (m³/h)",
          "Filter Area = plan area of filter (m²)",
          "Typical backwash rate: 36–60 m/h (10–15 gal/min/ft²)",
          "Target: 20–30% bed expansion",
        ],
        example: "Backwash flow = 2,000 m³/h, filter area = 50 m² → Backwash Rate = 2,000/50 = 40 m/h",
        examTip: "Insufficient backwash rate leaves mud balls in the media. Excessive rate washes out fine media. Backwash water volume = 2–5% of filtered water production.",
      },
      {
        name: "UV Dose (Fluence)",
        formula: "UV Dose (mJ/cm²) = UV Intensity (mW/cm²) × Contact Time (s)",
        units: "mJ/cm²",
        variables: [
          "UV Intensity = measured at the sensor (mW/cm²)",
          "Contact Time = hydraulic residence time in UV reactor (s)",
          "Dose ≥ 40 mJ/cm² for 4-log Cryptosporidium inactivation",
          "Dose ≥ 186 mJ/cm² for 4-log Giardia inactivation (UV less effective)",
          "Dose ≥ 40 mJ/cm² for 4-log virus inactivation (with 254 nm)",
        ],
        example: "Intensity = 20 mW/cm², contact time = 5 s → UV Dose = 20 × 5 = 100 mJ/cm²",
        examTip: "UV dose is reduced by turbidity and UVT (UV transmittance). Always use validated dose-response curves. UV does not provide residual disinfection.",
      },
      {
        name: "Ozone CT",
        formula: "Ozone CT (mg·min/L) = Ozone Residual (mg/L) × Contact Time (min)",
        units: "mg·min/L",
        variables: [
          "Ozone Residual = dissolved ozone concentration (mg/L)",
          "Contact Time = T₁₀ in ozone contactor (min)",
          "CT for 3-log Giardia inactivation: 0.5–1.0 mg·min/L at pH 7, 15°C",
          "CT for 3-log Cryptosporidium: 5–10 mg·min/L",
          "Ozone decomposes rapidly; residual must be measured at contactor outlet",
        ],
        example: "Ozone residual = 0.4 mg/L, T₁₀ = 4 min → CT = 0.4 × 4 = 1.6 mg·min/L",
        examTip: "Ozone CT is much lower than chlorine CT for Giardia/Crypto. Ozone also oxidizes taste/odour compounds and NOM. Bromate formation is a concern with bromide-containing source water.",
      },
    ],
  },
  {
    id: "lab",
    title: "Laboratory Analysis",
    icon: "🔬",
    color: "#A16207",
    bg: "#FEF9C3",
    formulas: [
      {
        name: "Turbidity Removal (Log Credit)",
        formula: "Log Removal = log₁₀(Influent Turbidity / Effluent Turbidity)",
        units: "log units",
        variables: [
          "Influent Turbidity = raw water or settled water turbidity (NTU)",
          "Effluent Turbidity = filtered water turbidity (NTU)",
          "2-log removal = 99% removal",
          "3-log removal = 99.9% removal",
        ],
        example: "Influent = 50 NTU, Effluent = 0.05 NTU → Log Removal = log(50/0.05) = log(1000) = 3.0 log",
        examTip: "Ontario requires filtered water turbidity ≤ 0.3 NTU (95th percentile) and ≤ 1.0 NTU at all times. Individual filter turbidity ≤ 0.1 NTU is the operational target.",
      },
      {
        name: "Chlorine Residual (DPD Method)",
        formula: "Free Cl₂ residual measured directly; Combined Cl₂ = Total − Free",
        units: "mg/L",
        variables: [
          "Free chlorine = HOCl + OCl⁻ (measured with DPD #1)",
          "Total chlorine = free + combined (measured with DPD #3)",
          "Combined chlorine = chloramines (NH₂Cl, NHCl₂, NCl₃)",
          "Ontario minimum free Cl₂ residual: 0.2 mg/L at all points in distribution",
        ],
        example: "DPD #1 = 1.5 mg/L (free), DPD #3 = 2.1 mg/L (total) → Combined = 2.1 − 1.5 = 0.6 mg/L",
        examTip: "At Class 3, know the breakpoint chlorination curve: combined chlorine peaks at ~7.6:1 Cl₂:NH₃-N ratio, then drops to zero at the breakpoint (~10:1 ratio).",
      },
      {
        name: "Total Dissolved Solids (TDS) by Evaporation",
        formula: "TDS (mg/L) = (Mass of residue − Mass of dish) × 1,000,000 / Sample Volume (mL)",
        units: "mg/L",
        variables: [
          "Mass of residue = mass of dish + dried residue (mg)",
          "Mass of dish = tare weight (mg)",
          "Sample Volume = volume filtered (mL)",
          "Multiply by 1,000,000 to convert g/mL to mg/L",
        ],
        example: "Dish = 50.0000 g, Dish + residue = 50.0250 g, Sample = 100 mL → TDS = (25 mg) × 1,000,000 / 100 = 250 mg/L",
        examTip: "TDS by evaporation (gravimetric) is the reference method. Conductivity-based TDS meters use a conversion factor (typically 0.5–0.7 × conductivity in μS/cm).",
      },
      {
        name: "Hardness Calculation",
        formula: "Total Hardness (mg/L as CaCO₃) = 2.497 × [Ca (mg/L)] + 4.118 × [Mg (mg/L)]",
        units: "mg/L as CaCO₃",
        variables: [
          "Ca (mg/L) = calcium concentration",
          "Mg (mg/L) = magnesium concentration",
          "2.497 = conversion factor for Ca (MW CaCO₃/MW Ca × 0.5 = 100/40.08 × 1 = 2.497)",
          "4.118 = conversion factor for Mg (100/24.31 × 1 = 4.118)",
        ],
        example: "Ca = 80 mg/L, Mg = 20 mg/L → Hardness = (2.497 × 80) + (4.118 × 20) = 199.8 + 82.4 = 282 mg/L as CaCO₃",
        examTip: "Hardness classification: 0–75 mg/L = soft, 75–150 = moderately hard, 150–300 = hard, >300 = very hard. Ontario aesthetic objective: ≤200 mg/L as CaCO₃.",
      },
      {
        name: "Alkalinity Titration",
        formula: "Alkalinity (mg/L as CaCO₃) = (Volume of H₂SO₄ × Normality × 50,000) / Sample Volume (mL)",
        units: "mg/L as CaCO₃",
        variables: [
          "Volume of H₂SO₄ = mL of acid used to reach pH 4.5 endpoint",
          "Normality = normality of H₂SO₄ titrant (typically 0.02 N)",
          "50,000 = conversion factor (equivalent weight of CaCO₃ × 1,000)",
          "Sample Volume = mL of sample",
        ],
        example: "H₂SO₄ = 8.5 mL, N = 0.02, Sample = 100 mL → Alkalinity = (8.5 × 0.02 × 50,000) / 100 = 85 mg/L as CaCO₃",
        examTip: "Alkalinity is the buffering capacity of water. Low alkalinity (<50 mg/L) makes pH control difficult during coagulation. Alkalinity is consumed by coagulant addition.",
      },
      {
        name: "SUVA (Specific UV Absorbance)",
        formula: "SUVA (L/mg·m) = UV₂₅₄ absorbance (m⁻¹) / DOC (mg/L)",
        units: "L/mg·m",
        variables: [
          "UV₂₅₄ = UV absorbance at 254 nm (measured in cm⁻¹, then × 100 to convert to m⁻¹)",
          "DOC = dissolved organic carbon (mg/L)",
          "SUVA > 4: high aromatic NOM, amenable to coagulation, high THM formation potential",
          "SUVA 2–4: mixed NOM character",
          "SUVA < 2: low aromatic NOM, NOT amenable to coagulation, high HAA formation potential",
        ],
        example: "UV₂₅₄ = 0.15 cm⁻¹ = 15 m⁻¹, DOC = 5 mg/L → SUVA = 15/5 = 3.0 L/mg·m (mixed NOM)",
        examTip: "SUVA > 4 indicates enhanced coagulation will be effective for NOM removal and DBP control. SUVA < 2 requires alternative treatment (GAC, NF).",
      },
      {
        name: "TOC Removal by Enhanced Coagulation",
        formula: "% TOC Removal = (TOC_in − TOC_out) / TOC_in × 100",
        units: "%",
        variables: [
          "TOC_in = TOC of raw or settled water (mg/L)",
          "TOC_out = TOC of filtered water (mg/L)",
          "Enhanced coagulation target: depends on raw water TOC and SUVA",
          "Typical target: 25–50% TOC removal by coagulation",
        ],
        example: "TOC_in = 8 mg/L, TOC_out = 5 mg/L → % Removal = (8−5)/8 × 100 = 37.5%",
        examTip: "Ontario requires enhanced coagulation for systems with TOC > 2 mg/L and SUVA > 2. Target TOC removal depends on raw water TOC (see EPA Enhanced Coagulation guidance table).",
      },
    ],
  },
  {
    id: "equipment",
    title: "Equipment O&M",
    icon: "🔧",
    color: "#15803D",
    bg: "#DCFCE7",
    formulas: [
      {
        name: "Pump Efficiency",
        formula: "Pump Efficiency (%) = (Water Power / Shaft Power) × 100",
        units: "%",
        variables: [
          "Water Power (kW) = Flow (m³/s) × Head (m) × ρg / 1,000",
          "ρg = 9,810 N/m³ (specific weight of water)",
          "Shaft Power (kW) = power input to pump shaft",
          "Overall efficiency = pump efficiency × motor efficiency",
        ],
        example: "Flow = 0.1 m³/s, Head = 30 m → Water Power = 0.1 × 30 × 9,810 / 1,000 = 29.4 kW. If shaft power = 35 kW → Efficiency = 29.4/35 × 100 = 84%",
        examTip: "Pump efficiency typically 70–85% for centrifugal pumps. Efficiency decreases significantly when operating far from the design point (BEP).",
      },
      {
        name: "Specific Speed",
        formula: "Ns = N × Q^0.5 / H^0.75",
        units: "dimensionless (or rpm·gpm^0.5/ft^0.75)",
        variables: [
          "N = pump speed (rpm)",
          "Q = flow rate (gpm or m³/s)",
          "H = total head (ft or m)",
          "Low Ns (500–1,500): radial flow, high head, low flow",
          "High Ns (>5,000): axial flow, low head, high flow",
        ],
        example: "N = 1,750 rpm, Q = 500 gpm, H = 100 ft → Ns = 1,750 × 500^0.5 / 100^0.75 = 1,750 × 22.4 / 31.6 = 1,240 (radial flow pump)",
        examTip: "Specific speed determines pump type. Water treatment plants typically use radial flow (centrifugal) pumps with Ns 500–3,000.",
      },
      {
        name: "Net Positive Suction Head (NPSH)",
        formula: "NPSHa = (Pa − Pv) / ρg + Zs − hf",
        units: "m (or ft)",
        variables: [
          "Pa = absolute pressure at suction (m of water)",
          "Pv = vapour pressure of water at operating temperature (m)",
          "Zs = elevation of water surface above pump centreline (m, negative if below)",
          "hf = friction losses in suction piping (m)",
          "NPSHa must exceed NPSHr (required) to prevent cavitation",
        ],
        example: "Pa = 10.3 m, Pv = 0.17 m (15°C), Zs = −2 m, hf = 0.5 m → NPSHa = 10.3 − 0.17 − 2 − 0.5 = 7.6 m",
        examTip: "Cavitation occurs when NPSHa < NPSHr. Signs: noise, vibration, pitting of impeller. Prevent by: reducing suction lift, increasing suction pipe diameter, reducing flow velocity.",
      },
      {
        name: "Affinity Laws (Variable Speed Pumps)",
        formula: "Q₂/Q₁ = N₂/N₁ | H₂/H₁ = (N₂/N₁)² | P₂/P₁ = (N₂/N₁)³",
        units: "dimensionless ratios",
        variables: [
          "Q = flow rate (m³/s or gpm)",
          "H = total head (m or ft)",
          "P = power (kW or hp)",
          "N = pump speed (rpm)",
          "Subscripts 1 and 2 = original and new operating conditions",
        ],
        example: "Reduce speed from 1,750 to 1,400 rpm (ratio = 0.8): Q₂ = 0.8 × Q₁, H₂ = 0.64 × H₁, P₂ = 0.51 × P₁ (49% power reduction!)",
        examTip: "VFDs (variable frequency drives) use affinity laws. Reducing speed to 80% reduces power by 49% — huge energy savings for variable demand systems.",
      },
      {
        name: "Membrane Flux",
        formula: "Flux (L/m²·h) = Permeate Flow (L/h) / Membrane Area (m²)",
        units: "L/m²·h (LMH)",
        variables: [
          "Permeate Flow = filtered water production rate (L/h)",
          "Membrane Area = total active membrane area (m²)",
          "Typical flux: MF/UF = 20–80 LMH, NF/RO = 10–30 LMH",
          "Higher flux = faster fouling, more frequent cleaning",
        ],
        example: "Permeate flow = 1,000 L/h, membrane area = 50 m² → Flux = 1,000/50 = 20 LMH",
        examTip: "Transmembrane pressure (TMP) increases as membranes foul. When TMP reaches the cleaning threshold, chemical cleaning (CIP) is required. Track TMP vs. flux to monitor fouling.",
      },
      {
        name: "Membrane Recovery",
        formula: "Recovery (%) = Permeate Flow / Feed Flow × 100",
        units: "%",
        variables: [
          "Permeate Flow = product water flow rate",
          "Feed Flow = total inlet flow rate",
          "Concentrate Flow = Feed − Permeate",
          "Typical recovery: RO = 75–85%, NF = 80–90%, UF/MF = 90–95%",
        ],
        example: "Feed = 100 m³/h, Permeate = 80 m³/h → Recovery = 80/100 × 100 = 80%",
        examTip: "Higher recovery = less concentrate waste but higher salt concentration in concentrate. Scaling risk increases at high recovery. Antiscalant dosing may be required.",
      },
      {
        name: "Chemical Metering Pump Output",
        formula: "Output (L/h) = Stroke Length (%) × Stroke Rate (strokes/min) × Displacement per Stroke (mL) × 60 / 1,000",
        units: "L/h",
        variables: [
          "Stroke Length = % of maximum stroke (0–100%)",
          "Stroke Rate = strokes per minute",
          "Displacement = volume per stroke at 100% stroke length (mL)",
          "Calibrate by measuring actual output over a timed period",
        ],
        example: "Stroke length = 75%, rate = 60 spm, displacement = 5 mL → Output = 0.75 × 60 × 5 × 60 / 1,000 = 13.5 L/h",
        examTip: "Always calibrate chemical metering pumps by measuring actual output — do not rely on dial settings alone. Calibrate after any maintenance or chemical change.",
      },
    ],
  },
  {
    id: "source",
    title: "Source Water",
    icon: "🌊",
    color: "#6D28D9",
    bg: "#EDE9FE",
    formulas: [
      {
        name: "Dilution Ratio",
        formula: "Dilution Ratio = River Flow / Effluent Flow",
        units: "dimensionless",
        variables: [
          "River Flow = upstream river flow (m³/s or ML/day)",
          "Effluent Flow = wastewater discharge flow (m³/s or ML/day)",
          "Diluted concentration = Source concentration / (Dilution Ratio + 1)",
        ],
        example: "River flow = 15 m³/s, effluent = 0.3 m³/s → Dilution = 15/0.3 = 50:1. If effluent has 10 mg/L of a contaminant, diluted concentration = 10/51 = 0.2 mg/L",
        examTip: "Even at 50:1 dilution, pharmaceuticals and pathogens may be present at concentrations of concern. Source water monitoring is essential.",
      },
      {
        name: "Reservoir Hydraulic Retention Time (HRT)",
        formula: "HRT (days) = Volume (ML) / Flow (ML/day)",
        units: "days",
        variables: [
          "Volume = reservoir storage volume (ML or m³)",
          "Flow = average daily withdrawal rate (ML/day)",
          "Long HRT (>30 days): algal bloom risk, thermal stratification",
          "Short HRT (<7 days): less treatment time, higher turbidity risk",
        ],
        example: "Volume = 5,000 ML, Flow = 50 ML/day → HRT = 5,000/50 = 100 days",
        examTip: "Long HRT allows algae to bloom and taste/odour compounds to accumulate. Short HRT means contamination events clear faster but treatment must respond quickly.",
      },
      {
        name: "Trophic State Index (TSI) — Carlson",
        formula: "TSI(Chl-a) = 9.81 × ln(Chl-a μg/L) + 30.6",
        units: "dimensionless (0–100 scale)",
        variables: [
          "Chl-a = chlorophyll-a concentration (μg/L)",
          "TSI < 40: oligotrophic (clear, low nutrients)",
          "TSI 40–50: mesotrophic",
          "TSI 50–70: eutrophic (algal blooms possible)",
          "TSI > 70: hypereutrophic (severe algal blooms)",
        ],
        example: "Chl-a = 20 μg/L → TSI = 9.81 × ln(20) + 30.6 = 9.81 × 3.0 + 30.6 = 60 (eutrophic)",
        examTip: "TSI > 50 indicates elevated algal bloom risk. Cyanobacteria blooms and taste/odour problems are common in eutrophic reservoirs.",
      },
      {
        name: "Secchi Depth to Turbidity (Approximate)",
        formula: "Turbidity (NTU) ≈ 40 / Secchi Depth (m)",
        units: "NTU",
        variables: [
          "Secchi Depth = depth at which a Secchi disk disappears from view (m)",
          "Relationship is approximate and varies with particle type",
          "Deeper Secchi depth = clearer water = lower turbidity",
        ],
        example: "Secchi depth = 2 m → Turbidity ≈ 40/2 = 20 NTU (approximate)",
        examTip: "Secchi depth is a quick field measurement of water clarity. It is NOT a substitute for turbidimeter measurement for regulatory compliance.",
      },
      {
        name: "Phosphorus Loading",
        formula: "P Load (kg/year) = Concentration (mg/L) × Flow (m³/year) / 1,000",
        units: "kg/year",
        variables: [
          "Concentration = total phosphorus in tributary (mg/L)",
          "Flow = annual tributary flow (m³/year)",
          "Divide by 1,000 to convert mg to g, then g to kg",
          "Compare to reservoir critical loading to assess eutrophication risk",
        ],
        example: "TP = 0.05 mg/L, Flow = 10,000,000 m³/year → P Load = 0.05 × 10,000,000 / 1,000 = 500 kg/year",
        examTip: "Phosphorus loading drives eutrophication. Reducing P loading from agricultural runoff, wastewater, and urban stormwater is the key to controlling algal blooms.",
      },
    ],
  },
  {
    id: "safety",
    title: "Security, Safety & Admin",
    icon: "🛡️",
    color: "#B91C1C",
    bg: "#FEE2E2",
    formulas: [
      {
        name: "Chlorine Gas Leak Rate",
        formula: "Leak Rate (kg/h) = Weight Loss (kg) / Time (h)",
        units: "kg/h",
        variables: [
          "Weight Loss = decrease in cylinder weight (kg)",
          "Time = elapsed time (h)",
          "Maximum withdrawal rate: 1-tonne cylinder = 18 kg/h at 20°C",
          "Exceeding max rate causes cylinder frosting and reduced output",
        ],
        example: "Cylinder weight decreased from 450 kg to 430 kg over 2 hours → Leak Rate = 20/2 = 10 kg/h",
        examTip: "Chlorine cylinders should be weighed daily to monitor consumption and detect leaks. Keep cylinders in a ventilated, locked room with a chlorine gas detector.",
      },
      {
        name: "Chemical Inventory (Days of Supply)",
        formula: "Days of Supply = Inventory (kg) / Daily Usage (kg/day)",
        units: "days",
        variables: [
          "Inventory = current stock on hand (kg)",
          "Daily Usage = average daily consumption (kg/day)",
          "Minimum stock: typically 30 days supply",
          "Critical stock: 7 days supply triggers emergency order",
        ],
        example: "Inventory = 2,000 kg alum, Daily Usage = 450 kg/day → Days of Supply = 2,000/450 = 4.4 days (CRITICAL — order immediately)",
        examTip: "Class 3 operators are responsible for chemical inventory management. Maintain minimum 30-day supply of critical chemicals (chlorine, coagulant, fluoride).",
      },
      {
        name: "Dilution of Chemical Stock Solution",
        formula: "C₁V₁ = C₂V₂",
        units: "concentration × volume",
        variables: [
          "C₁ = concentration of stock solution",
          "V₁ = volume of stock solution to use",
          "C₂ = desired concentration of diluted solution",
          "V₂ = total volume of diluted solution",
        ],
        example: "Make 100 L of 1% NaOCl from 12.5% stock: V₁ = (1% × 100 L) / 12.5% = 8 L of stock + 92 L water",
        examTip: "Always add acid to water (never water to acid) when diluting concentrated acids. For bleach dilution, use cool water to reduce chlorine loss.",
      },
      {
        name: "Water Loss (Non-Revenue Water)",
        formula: "Water Loss (%) = (Volume Produced − Volume Billed) / Volume Produced × 100",
        units: "%",
        variables: [
          "Volume Produced = total water treated and pumped to distribution (m³)",
          "Volume Billed = total metered water sold to customers (m³)",
          "Difference includes: real losses (leaks), apparent losses (meter error, theft)",
          "Target: < 10% water loss for well-maintained systems",
        ],
        example: "Produced = 10,000 m³/day, Billed = 8,500 m³/day → Loss = (10,000−8,500)/10,000 × 100 = 15% (above target)",
        examTip: "Water loss > 15% indicates significant leakage or metering problems. Pressure management, leak detection, and meter replacement are key strategies.",
      },
      {
        name: "Energy Consumption per Volume",
        formula: "Energy (kWh/m³) = Total Energy Used (kWh) / Volume Treated (m³)",
        units: "kWh/m³",
        variables: [
          "Total Energy = electricity consumed by all plant equipment (kWh)",
          "Volume Treated = total water treated (m³)",
          "Typical range: 0.2–0.5 kWh/m³ for conventional treatment",
          "Membrane systems: 0.5–1.5 kWh/m³",
          "RO desalination: 3–5 kWh/m³",
        ],
        example: "Energy = 5,000 kWh/day, Volume = 25,000 m³/day → Energy = 5,000/25,000 = 0.20 kWh/m³",
        examTip: "Energy is typically 30–40% of water treatment operating costs. VFDs, off-peak pumping, and process optimization are key energy reduction strategies.",
      },
    ],
  },
];

export default function FormulasWater3() {
  usePageMeta({
    title: "Class 3 Water Treatment Formula Sheet — Echelon Institute",
    description: "Comprehensive formula sheet for the Ontario Class 3 Water Treatment operator exam. Covers LSI, CT values, lime softening, membrane flux, pump efficiency, and more.",
    path: "/formulas-water3",
    keywords: "Class 3 water treatment formulas, LSI calculation, CT value, lime softening, membrane flux, pump efficiency, Ontario operator exam",
  });

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSections = SECTIONS.map(section => ({
    ...section,
    formulas: section.formulas.filter(f =>
      !searchTerm ||
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.examTip.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(s => s.formulas.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", fontFamily: "'Sora', sans-serif" }}>      <style>{`
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

      <SiteNav currentPath="/formulas-water3" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%)", color: "#fff", padding: "28px 16px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, opacity: 0.75, textTransform: "uppercase", marginBottom: 6 }}>
            Echelon Institute
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800 }}>
            Class 3 Water Treatment Formula Sheet
          </h1>
          <p style={{ margin: "0 0 16px", fontSize: 14, opacity: 0.85 }}>
            {SECTIONS.reduce((acc, s) => acc + s.formulas.length, 0)} formulas · Application-level calculations · ABC/WPI NTK aligned
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/class3-water">
              <button style={{ padding: "8px 14px", background: "rgba(0,0,0,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                📝 Practice Quiz
              </button>
            </Link>
            <Link href="/class3-water-mock">
              <button style={{ padding: "8px 14px", background: "rgba(0,0,0,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                📋 Mock Exam
              </button>
            </Link>
            <Link href="/formulas">
              <button style={{ padding: "8px 14px", background: "rgba(0,0,0,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                📐 General Formulas
              </button>
            </Link>
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
            style={{ width: "100%", padding: "12px 16px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: "#F8FAFC", background: "#fff", boxSizing: "border-box" }}
          />
        </div>

        {/* Section tabs */}
        {!searchTerm && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            <button
              onClick={() => setActiveSection(null)}
              style={{ padding: "8px 14px", background: !activeSection ? "#1E40AF" : "#fff", color: !activeSection ? "#fff" : "#E2E8F0", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              All Sections
            </button>
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
                style={{ padding: "8px 14px", background: activeSection === s.id ? s.color : "#fff", color: activeSection === s.id ? "#fff" : "#E2E8F0", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
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
                <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
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
                      <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontFamily: "monospace", fontSize: 14, color: "#F8FAFC", fontWeight: 600, lineHeight: 1.6 }}>
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
