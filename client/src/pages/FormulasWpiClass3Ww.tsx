// WPI CLASS III WASTEWATER TREATMENT FORMULA SHEET
import { useState } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";

interface FormulaCard {
  title: string;
  formula: string;
  variables: string[];
  example: string;
  result: string;
  notes?: string;
}
interface FormulaSection {
  category: string;
  icon: string;
  color: string;
  cards: FormulaCard[];
}

const SECTIONS: FormulaSection[] = [
  {
    category: "Biological Nutrient Removal (BNR)",
    icon: "🌿",
    color: "#15803D",
    cards: [
      {
        title: "Nitrogen Mass Balance (BNR System)",
        formula: "TN_removed = TN_in − TN_effluent",
        variables: [
          "TN_in = TKN_in + NO₃_in (mg/L)",
          "TN_effluent = NH₄_eff + NO₃_eff + NO₂_eff + Org-N_eff (mg/L)",
          "TN_removal efficiency = (TN_in − TN_eff) / TN_in × 100%",
        ],
        example: "TN_in = 35 mg/L; TN_eff = 8 mg/L",
        result: "TN removal = (35 − 8) / 35 × 100 = 77%",
      },
      {
        title: "Nitrification Rate (Monod Kinetics)",
        formula: "μ_AOB = μ_max × [NH₄] / (K_NH₄ + [NH₄]) × [DO] / (K_O + [DO])",
        variables: [
          "μ_max = maximum specific growth rate of AOB (0.8–1.0 /d at 20°C)",
          "K_NH₄ = half-saturation constant for ammonia (~0.5–1.0 mg NH₄-N/L)",
          "K_O = half-saturation constant for DO (~0.3–0.5 mg/L)",
          "SRT_min for nitrification = 1 / μ_AOB (safety factor ×2–3)",
        ],
        example: "μ_max = 0.9/d; [NH₄] = 5 mg/L; K_NH₄ = 0.7 mg/L; [DO] = 2 mg/L; K_O = 0.4 mg/L",
        result: "μ_AOB = 0.9 × (5/5.7) × (2/2.4) = 0.9 × 0.877 × 0.833 = 0.66/d → SRT_min = 1.5 d",
      },
      {
        title: "Denitrification Rate",
        formula: "SDNR = (NO₃_in − NO₃_out) × Q / (V × MLVSS)",
        variables: [
          "SDNR = specific denitrification rate (kg NO₃-N/kg MLVSS·d)",
          "NO₃_in, NO₃_out = nitrate entering and leaving anoxic zone (mg/L)",
          "Q = flow through anoxic zone (m³/d)",
          "V = anoxic zone volume (m³); MLVSS = mg/L",
          "Typical SDNR: 0.03–0.11 kg NO₃-N/kg MLVSS·d",
        ],
        example: "NO₃_in = 20 mg/L; NO₃_out = 5 mg/L; Q = 10,000 m³/d; V = 2,000 m³; MLVSS = 2,500 mg/L",
        result: "SDNR = (20−5) × 10,000 / (2,000 × 2,500) × 1,000 = 150,000 / 5,000,000 × 1,000 = 0.03 kg/kg·d",
      },
      {
        title: "Internal Recycle (IR) Rate for Denitrification",
        formula: "NO₃_eff ≈ TKN_in / (IR/Q + RAS/Q + 1) − (denitrification in anoxic)",
        variables: [
          "IR = internal recycle flow (m³/d)",
          "RAS = return activated sludge flow (m³/d)",
          "Q = influent flow (m³/d)",
          "Typical IR/Q ratio: 2–4× for 70–80% TN removal",
          "Higher IR/Q increases pumping energy with diminishing returns",
        ],
        example: "TKN_in = 30 mg/L; IR/Q = 3; RAS/Q = 1; assume complete denitrification in anoxic zone",
        result: "NO₃_eff ≈ 30 / (3 + 1 + 1) = 6 mg/L (theoretical minimum with IR = 3Q)",
      },
      {
        title: "Phosphorus Removal — EBPR",
        formula: "P_removed = P_in − P_eff (mg/L) or P_in × Q × 1/1,000 (kg/d)",
        variables: [
          "EBPR requires anaerobic zone (P release) followed by aerobic zone (P uptake)",
          "PAOs store phosphorus as polyphosphate (poly-P) granules",
          "P content of PAO-rich sludge: 5–15% of VSS (vs. 1.5–2% for normal sludge)",
          "P removal via WAS: P_WAS = WAS_flow × WAS_TSS × P_fraction / 1,000",
        ],
        example: "P_in = 8 mg/L; P_eff = 0.5 mg/L; Q = 10,000 m³/d",
        result: "P removed = (8 − 0.5) × 10,000 / 1,000 = 75 kg/d",
      },
      {
        title: "Aerobic SRT for BNR",
        formula: "SRT_aerobic = SRT_total × (V_aerobic / V_total)",
        variables: [
          "SRT_total = overall mean cell residence time (days)",
          "V_aerobic = volume of aerobic zones (m³)",
          "V_total = total aeration tank volume (m³)",
          "Minimum aerobic SRT for nitrification at 15°C: ~6–8 days",
          "Minimum aerobic SRT for nitrification at 10°C: ~10–15 days",
        ],
        example: "SRT_total = 15 d; V_aerobic = 3,000 m³; V_total = 5,000 m³",
        result: "SRT_aerobic = 15 × (3,000/5,000) = 9 days (adequate for nitrification at 15°C)",
      },
    ],
  },
  {
    category: "Activated Sludge Process Control",
    icon: "🦠",
    color: "#1D4ED8",
    cards: [
      {
        title: "Sludge Retention Time (SRT / MCRT)",
        formula: "SRT = (V × MLSS) / (Q_WAS × SS_WAS + Q_eff × SS_eff)",
        variables: [
          "V = aeration tank volume (m³)",
          "MLSS = mixed liquor suspended solids (mg/L)",
          "Q_WAS = waste activated sludge flow (m³/d)",
          "SS_WAS = WAS suspended solids concentration (mg/L)",
          "Q_eff = effluent flow (m³/d); SS_eff = effluent TSS (mg/L)",
        ],
        example: "V = 4,000 m³; MLSS = 3,000 mg/L; Q_WAS = 150 m³/d; SS_WAS = 8,000 mg/L; Q_eff = 10,000 m³/d; SS_eff = 10 mg/L",
        result: "SRT = (4,000 × 3,000) / (150 × 8,000 + 10,000 × 10) = 12,000,000 / 1,300,000 = 9.2 days",
      },
      {
        title: "Food-to-Microorganism (F/M) Ratio",
        formula: "F/M = (Q × BOD_in) / (V × MLVSS) [kg BOD/kg MLVSS·d]",
        variables: [
          "Q = influent flow (m³/d)",
          "BOD_in = influent BOD (mg/L)",
          "V = aeration tank volume (m³)",
          "MLVSS = volatile suspended solids in aeration tank (mg/L)",
          "Typical F/M: 0.05–0.15 (extended aeration), 0.2–0.4 (conventional), 0.4–1.5 (high-rate)",
        ],
        example: "Q = 10,000 m³/d; BOD_in = 200 mg/L; V = 4,000 m³; MLVSS = 2,200 mg/L",
        result: "F/M = (10,000 × 200) / (4,000 × 2,200) × 1/1,000 = 2,000,000 / 8,800,000 = 0.23 kg/kg·d",
      },
      {
        title: "Sludge Volume Index (SVI)",
        formula: "SVI (mL/g) = SSV₃₀ (mL/L) / MLSS (g/L)",
        variables: [
          "SSV₃₀ = settled sludge volume after 30 min in 1-L cylinder (mL/L)",
          "MLSS = mixed liquor suspended solids (g/L)",
          "SVI < 80: excellent settling; 80–150: good; 150–250: poor (bulking); >250: severe bulking",
          "DSVI used when MLSS > 3,500 mg/L (dilute sample 1:2 before test)",
        ],
        example: "SSV₃₀ = 220 mL/L; MLSS = 3.2 g/L",
        result: "SVI = 220 / 3.2 = 69 mL/g (excellent settling)",
      },
      {
        title: "Oxygen Uptake Rate (OUR) and SOUR",
        formula: "SOUR = OUR / MLVSS [mg O₂/g VSS·h]",
        variables: [
          "OUR = oxygen uptake rate measured in respirometer (mg O₂/L·h)",
          "MLVSS = volatile suspended solids (g/L)",
          "SOUR 8–20: active, healthy biomass",
          "SOUR < 5: inhibited or starved biomass",
          "SOUR > 30: young sludge, high F/M",
        ],
        example: "OUR = 45 mg O₂/L·h; MLVSS = 2.5 g/L",
        result: "SOUR = 45 / 2.5 = 18 mg O₂/g VSS·h (healthy, active biomass)",
      },
      {
        title: "Oxygen Demand (AOR)",
        formula: "AOR = 1.5 × BOD_removed + 4.57 × NH₄_nitrified − 2.86 × NO₃_denitrified",
        variables: [
          "AOR = actual oxygen requirement (kg O₂/d)",
          "BOD_removed = kg BOD/d removed",
          "NH₄_nitrified = kg NH₄-N/d nitrified (×4.57 for O₂ demand)",
          "NO₃_denitrified = kg NO₃-N/d denitrified (×2.86 O₂ credit)",
          "Factor 1.5 accounts for endogenous respiration",
        ],
        example: "BOD removed = 1,500 kg/d; NH₄ nitrified = 200 kg/d; NO₃ denitrified = 150 kg/d",
        result: "AOR = 1.5×1,500 + 4.57×200 − 2.86×150 = 2,250 + 914 − 429 = 2,735 kg O₂/d",
      },
    ],
  },
  {
    category: "Membrane Bioreactor (MBR)",
    icon: "🔬",
    color: "#6D28D9",
    cards: [
      {
        title: "Membrane Flux",
        formula: "J = Q_permeate / A_membrane [L/m²·h = LMH]",
        variables: [
          "J = permeate flux (LMH)",
          "Q_permeate = permeate flow rate (L/h)",
          "A_membrane = total membrane area (m²)",
          "Typical MBR flux: 15–30 LMH (submerged), 30–60 LMH (pressurized)",
          "Critical flux: flux above which fouling rate increases rapidly",
        ],
        example: "Q_permeate = 10,000 L/h; A_membrane = 500 m²",
        result: "J = 10,000 / 500 = 20 LMH (typical submerged MBR flux)",
      },
      {
        title: "Transmembrane Pressure (TMP)",
        formula: "TMP = P_feed − P_permeate (kPa)",
        variables: [
          "TMP = transmembrane pressure (kPa)",
          "P_feed = pressure on feed side (kPa)",
          "P_permeate = pressure on permeate side (kPa)",
          "Typical operating TMP: 10–40 kPa (submerged MBR)",
          "Rising TMP at constant flux indicates membrane fouling",
        ],
        example: "P_feed = 30 kPa; P_permeate = 5 kPa",
        result: "TMP = 30 − 5 = 25 kPa (normal operating range)",
      },
      {
        title: "Specific Membrane Resistance",
        formula: "R = TMP / (μ × J) [m⁻¹]",
        variables: [
          "R = membrane resistance (m⁻¹)",
          "TMP = transmembrane pressure (Pa)",
          "μ = permeate viscosity (Pa·s, ≈ 0.001 Pa·s at 20°C)",
          "J = flux (m/s, convert from LMH: 1 LMH = 2.78 × 10⁻⁷ m/s)",
          "Typical clean membrane resistance: 10¹¹–10¹² m⁻¹",
        ],
        example: "TMP = 20,000 Pa; μ = 0.001 Pa·s; J = 20 LMH = 5.56 × 10⁻⁶ m/s",
        result: "R = 20,000 / (0.001 × 5.56×10⁻⁶) = 3.6 × 10¹² m⁻¹",
      },
      {
        title: "MBR Aeration Intensity (SADm)",
        formula: "SADm = Q_air / A_membrane [Nm³/m²·h]",
        variables: [
          "SADm = specific aeration demand per membrane area",
          "Q_air = air flow rate for membrane scouring (Nm³/h)",
          "A_membrane = total membrane area (m²)",
          "Typical SADm: 0.2–0.5 Nm³/m²·h for submerged MBR",
          "Higher SADm reduces fouling but increases energy consumption",
        ],
        example: "Q_air = 200 Nm³/h; A_membrane = 500 m²",
        result: "SADm = 200 / 500 = 0.4 Nm³/m²·h (typical operating range)",
      },
    ],
  },
  {
    category: "Advanced Biosolids Management",
    icon: "♻️",
    color: "#0F766E",
    cards: [
      {
        title: "Volatile Solids Reduction (VSR) — Digester",
        formula: "VSR = (VS_in − VS_out) / VS_in × 100%",
        variables: [
          "VS_in = volatile solids entering digester (kg/d or %)",
          "VS_out = volatile solids leaving digester (kg/d or %)",
          "Typical VSR: 50–60% (mesophilic AD), 55–65% (thermophilic AD)",
          "Class B biosolids require VSR ≥ 38% or PSRP",
          "Class A biosolids require additional pathogen reduction (PFRP)",
        ],
        example: "VS_in = 1,000 kg/d; VS_out = 420 kg/d",
        result: "VSR = (1,000 − 420) / 1,000 × 100 = 58% (good mesophilic AD performance)",
      },
      {
        title: "Biogas Production Rate",
        formula: "Q_biogas = VS_destroyed × 0.75–1.12 m³ CH₄/kg VS (+ CO₂)",
        variables: [
          "Typical biogas yield: 0.75–1.12 m³ CH₄/kg VS destroyed",
          "Biogas composition: 60–70% CH₄, 30–40% CO₂",
          "Energy content of CH₄: 35.8 MJ/Nm³",
          "Combined heat and power (CHP) efficiency: 30–40% electrical, 40–50% thermal",
          "Net energy recovery: typically 0.5–1.0 kWh/m³ wastewater treated",
        ],
        example: "VS destroyed = 500 kg/d; CH₄ yield = 0.9 m³/kg VS",
        result: "CH₄ production = 500 × 0.9 = 450 m³/d; Energy = 450 × 35.8 MJ = 16,110 MJ/d = 4,475 kWh/d",
      },
      {
        title: "Biosolids Land Application Rate (Agronomic Rate)",
        formula: "Application rate (dry t/ha) = Crop N requirement / Available N in biosolids",
        variables: [
          "Available N = (Mineral N × 1.0) + (Organic N × mineralization rate)",
          "Mineralization rate: 20–30% in year 1 for Class B biosolids",
          "Maximum application rate limited by N, P, or metals (whichever is most restrictive)",
          "Setback distances: 30 m from watercourses, 100 m from wells",
        ],
        example: "Crop N requirement = 150 kg N/ha; Biosolids: 3% TN, 60% available N",
        result: "Rate = 150 / (30,000 mg/kg × 0.60 × 10⁻³) = 150 / 18 = 8.3 dry t/ha",
      },
      {
        title: "Sludge Dewatering — Cake Solids Content",
        formula: "Solids recovery = (Cake mass × Cake %TS) / (Feed mass × Feed %TS) × 100%",
        variables: [
          "Cake %TS: belt press 18–25%, centrifuge 20–28%, filter press 30–45%",
          "Polymer dose: 3–8 g/kg DS (belt press), 5–15 g/kg DS (centrifuge)",
          "Cake volume = Wet sludge volume × (1 − %TS_feed) / (1 − %TS_cake)",
          "Volume reduction: 15% TS cake has ~5× less volume than 3% TS thickened sludge",
        ],
        example: "Feed: 10 m³/h at 3% TS; Cake: 0.4 m³/h at 22% TS",
        result: "Solids recovery = (0.4 × 22) / (10 × 3) × 100 = 8.8 / 30 × 100 = 29% (low — check polymer dose)",
      },
      {
        title: "Alkalinity Requirement for Anaerobic Digestion",
        formula: "Alkalinity (mg/L as CaCO₃) should be 2,000–5,000 mg/L for stable AD",
        variables: [
          "VFA/Alkalinity ratio < 0.3 indicates stable digester",
          "VFA/Alkalinity ratio > 0.5 indicates potential souring",
          "Lime addition to raise alkalinity: CaO dose = (target − current alkalinity) × 0.74",
          "Bicarbonate alkalinity (TA) is the key buffer in AD",
        ],
        example: "Current alkalinity = 1,500 mg/L; Target = 3,000 mg/L; Digester volume = 1,000 m³",
        result: "CaO needed = (3,000 − 1,500) × 0.74 × 1,000 m³ × 1,000 L/m³ / 10⁶ = 1,110 kg CaO",
      },
    ],
  },
  {
    category: "Industrial Pretreatment",
    icon: "🏭",
    color: "#B91C1C",
    cards: [
      {
        title: "Industrial User Permit Limit (IU Limit)",
        formula: "IU_limit = POTW_limit × (Q_POTW / Q_IU) × (1 − removal_efficiency)",
        variables: [
          "POTW_limit = POTW effluent permit limit for the pollutant (mg/L)",
          "Q_POTW = POTW design flow (m³/d)",
          "Q_IU = industrial user flow (m³/d)",
          "removal_efficiency = POTW removal efficiency for the pollutant (decimal)",
          "IU limit must also consider pass-through and interference criteria",
        ],
        example: "POTW limit = 1 mg/L Pb; Q_POTW = 10,000 m³/d; Q_IU = 500 m³/d; POTW removal = 80%",
        result: "IU_limit = 1 × (10,000/500) × (1/0.20) = 1 × 20 × 5 = 100 mg/L Pb (simplified)",
        notes: "Actual IU limits use more complex calculations including headworks analysis and local limits.",
      },
      {
        title: "Toxic Unit (TU) — Effluent Toxicity",
        formula: "TU = 100 / LC50 (%) or TU = 1 / (EC50 / 100)",
        variables: [
          "TU = toxic units (dimensionless)",
          "LC50 = concentration (% effluent) causing 50% mortality in 96-hr test",
          "EC50 = concentration causing 50% effect in chronic test",
          "WSER requires LC50 > 100% (i.e., TU < 1) for acute lethality",
          "TU > 1 means the effluent is acutely lethal at 100% concentration",
        ],
        example: "LC50 = 45% effluent (in 96-hr rainbow trout test)",
        result: "TU = 100 / 45 = 2.2 TU (FAILS — effluent is acutely lethal; must investigate cause)",
      },
      {
        title: "Equalization Basin Volume",
        formula: "V_eq = ΣQ_in × Δt − ΣQ_out × Δt (cumulative flow method)",
        variables: [
          "V_eq = required equalization volume (m³)",
          "Q_in = instantaneous inflow rate (m³/h)",
          "Q_out = constant outflow rate = average daily flow (m³/h)",
          "Δt = time interval (h)",
          "V_eq = maximum cumulative difference between inflow and outflow",
        ],
        example: "Peak flow = 2× average; Average flow = 500 m³/h; Peak duration = 4 hours",
        result: "V_eq ≈ (2,000 − 500) × 4 = 6,000 m³ (approximate — use mass balance diagram for accuracy)",
      },
    ],
  },
  {
    category: "Regulatory & Environmental Calculations",
    icon: "📋",
    color: "#A16207",
    cards: [
      {
        title: "Effluent Load Calculation",
        formula: "Load (kg/d) = Concentration (mg/L) × Flow (m³/d) / 1,000",
        variables: [
          "1 mg/L × 1 m³/d = 1 g/d = 0.001 kg/d",
          "1 mg/L × 1,000 m³/d = 1 kg/d",
          "Load (kg/d) = C (mg/L) × Q (m³/d) × 10⁻³",
          "Load (lb/d) = C (mg/L) × Q (MGD) × 8.34",
        ],
        example: "Effluent TSS = 12 mg/L; Q = 15,000 m³/d",
        result: "TSS load = 12 × 15,000 / 1,000 = 180 kg/d",
      },
      {
        title: "Dilution Factor (Receiving Water)",
        formula: "DF = (Q_river + Q_effluent) / Q_effluent",
        variables: [
          "DF = dilution factor (dimensionless)",
          "Q_river = receiving water flow (m³/s or m³/d)",
          "Q_effluent = effluent discharge flow (m³/s or m³/d)",
          "Mixed concentration: C_mix = (C_eff × Q_eff + C_river × Q_river) / (Q_eff + Q_river)",
        ],
        example: "Q_river (7Q10) = 1.5 m³/s; Q_eff = 0.15 m³/s; C_eff = 10 mg/L; C_river = 0 mg/L",
        result: "DF = (1.5 + 0.15) / 0.15 = 11×; C_mix = 10 × 0.15 / 1.65 = 0.91 mg/L",
      },
      {
        title: "Greenhouse Gas Emissions — N₂O",
        formula: "N₂O emissions (kg N₂O/yr) = TN_load (kg N/yr) × EF_N₂O",
        variables: [
          "EF_N₂O = emission factor for N₂O from treatment (0.005 kg N₂O-N/kg N for BNR)",
          "GWP of N₂O = 298 (100-year global warming potential vs CO₂)",
          "CO₂e = N₂O emissions × 298",
          "IPCC default EF for direct N₂O from WWTP: 0.0032 kg N₂O-N/kg N influent",
        ],
        example: "TN load = 200,000 kg N/yr; EF = 0.005 kg N₂O-N/kg N",
        result: "N₂O = 200,000 × 0.005 × 44/28 = 1,571 kg N₂O/yr; CO₂e = 1,571 × 298 = 468,000 kg CO₂e/yr",
      },
      {
        title: "Biosolids Metal Loading Rate",
        formula: "Annual loading (kg/ha·yr) = Application rate (dry t/ha) × Metal concentration (mg/kg) / 1,000",
        variables: [
          "Cumulative loading limits (CCME): Pb 150 kg/ha, Cd 4 kg/ha, Cu 150 kg/ha, Zn 300 kg/ha",
          "Annual loading limits: Pb 15 kg/ha·yr, Cd 0.5 kg/ha·yr",
          "Metal concentration in biosolids (mg/kg dry weight)",
          "Application rate (dry tonnes/ha)",
        ],
        example: "Biosolids Zn = 1,200 mg/kg; Application rate = 5 dry t/ha",
        result: "Annual Zn loading = 5 × 1,200 / 1,000 = 6 kg Zn/ha·yr (< 30 kg/ha·yr annual limit)",
      },
    ],
  },
  {
    category: "Advanced Process Control",
    icon: "⚙️",
    color: "#C2410C",
    cards: [
      {
        title: "Aeration Energy — Standard Oxygen Transfer Rate (SOTR)",
        formula: "SOTR = AOR / (α × β × θ^(T−20) × (C_s20 − C_L) / C_s20)",
        variables: [
          "AOR = actual oxygen requirement (kg O₂/d)",
          "α = process water correction factor (0.4–0.8 for activated sludge)",
          "β = salinity-surface tension correction (0.95–0.99)",
          "θ = temperature correction factor (1.024)",
          "C_s20 = DO saturation at 20°C (9.09 mg/L); C_L = operating DO (mg/L)",
        ],
        example: "AOR = 2,000 kg/d; α = 0.6; β = 0.97; T = 15°C; C_L = 2 mg/L; C_s20 = 9.09 mg/L",
        result: "SOTR = 2,000 / (0.6 × 0.97 × 1.024^(15−20) × (9.09−2)/9.09) = 2,000 / (0.6 × 0.97 × 0.887 × 0.780) = 2,000 / 0.402 = 4,975 kg O₂/d",
      },
      {
        title: "Blower Power Requirement",
        formula: "P = (Q_air × ρ_air × R × T₁) / (η × 29) × [(P₂/P₁)^(0.283) − 1]",
        variables: [
          "P = shaft power (kW)",
          "Q_air = air flow rate (m³/s)",
          "ρ_air = air density (1.2 kg/m³ at 20°C)",
          "R = gas constant (8,314 J/kmol·K)",
          "T₁ = inlet air temperature (K)",
          "η = blower efficiency (0.70–0.85)",
          "P₂/P₁ = discharge/inlet pressure ratio",
        ],
        example: "Q_air = 1 m³/s; T₁ = 293 K; P₁ = 101.3 kPa; P₂ = 115 kPa; η = 0.75",
        result: "P ≈ Q × ΔP / η = 1 × (115,000 − 101,300) / 0.75 ≈ 18.3 kW (simplified isothermal approximation)",
      },
      {
        title: "Hydraulic Loading Rate (HLR) — Secondary Clarifier",
        formula: "HLR (m/h) = Q_influent / A_clarifier",
        variables: [
          "HLR = hydraulic loading rate (m/h or m³/m²·h)",
          "Q_influent = influent flow to clarifier (m³/h)",
          "A_clarifier = clarifier surface area (m²)",
          "Typical HLR: 0.5–1.5 m/h (average), 1.5–2.5 m/h (peak)",
          "Solids loading rate (SLR) = (Q + Q_RAS) × MLSS / A_clarifier",
        ],
        example: "Q = 10,000 m³/d; A = 800 m²",
        result: "HLR = (10,000/24) / 800 = 416.7 / 800 = 0.52 m/h (within normal range)",
      },
    ],
  },
];

export default function FormulasWpiClass3Ww() {
  usePageMeta({
    title: "WPI Class 3 Wastewater Formulas",
    description: "Essential formulas and calculations for WPI Class 3 Wastewater operator certification exam. Quick reference formula sheet.",
  });

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = SECTIONS.map((s) => ({
    ...s,
    cards: s.cards.filter(
      (c) =>
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.formula.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((s) => s.cards.length > 0);

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

      <SiteNav currentPath="/formulas-wpi-class3-ww" />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <Link href="/wpi-class3-wastewater">
              <button style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                ← Practice Quiz
              </button>
            </Link>
            <span style={{ color: "#CBD5E1", fontSize: 13 }}>·</span>
            <Link href="/wpi-class3-wastewater-mock">
              <button style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                Mock Exam
              </button>
            </Link>
          </div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontSize: "clamp(20px, 3vw, 28px)",
            fontWeight: 900, color: "#0F172A", margin: "0 0 6px",
          }}>
            WPI Class III Wastewater Formula Sheet
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            BNR kinetics · SRT/F/M · MBR flux · biosolids · industrial pretreatment · regulatory calculations
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search formulas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "10px 16px", borderRadius: 10,
              border: "1.5px solid #E2E8F0", fontSize: 14, fontFamily: "inherit",
              outline: "none", background: "#fff", boxSizing: "border-box" as const,
            }}
          />
        </div>

        {/* Section tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <button
            onClick={() => setActiveSection(null)}
            style={{
              padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
              borderColor: activeSection === null ? "#0F766E" : "#E2E8F0",
              background: activeSection === null ? "#CCFBF1" : "#fff",
              color: activeSection === null ? "#0F766E" : "#64748B",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            All Topics
          </button>
          {SECTIONS.map((s) => (
            <button
              key={s.category}
              onClick={() => setActiveSection(activeSection === s.category ? null : s.category)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
                borderColor: activeSection === s.category ? s.color : "#E2E8F0",
                background: activeSection === s.category ? `${s.color}15` : "#fff",
                color: activeSection === s.category ? s.color : "#64748B",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {s.icon} {s.category}
            </button>
          ))}
        </div>

        {/* Formula sections */}
        {filtered
          .filter((s) => !activeSection || s.category === activeSection)
          .map((section) => (
            <div key={section.category} style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>{section.icon}</span>
                <h2 style={{
                  fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800,
                  color: section.color, margin: 0,
                }}>
                  {section.category}
                </h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
                {section.cards.map((card) => (
                  <div key={card.title} style={{
                    background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0",
                    padding: "20px", overflow: "hidden",
                  }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 10px" }}>
                      {card.title}
                    </h3>
                    <div style={{
                      background: "#F8FAFC", borderRadius: 8, padding: "10px 14px",
                      marginBottom: 12, fontFamily: "monospace", fontSize: 13,
                      color: section.color, fontWeight: 600, lineHeight: 1.6,
                      borderLeft: `3px solid ${section.color}`,
                    }}>
                      {card.formula}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      {card.variables.map((v, i) => (
                        <div key={i} style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6, marginBottom: 2 }}>
                          • {v}
                        </div>
                      ))}
                    </div>
                    <div style={{
                      background: "#F0FDF4", borderRadius: 8, padding: "10px 14px",
                      borderLeft: "3px solid #22C55E",
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#15803D", marginBottom: 4 }}>
                        EXAMPLE
                      </div>
                      <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5, marginBottom: 4 }}>
                        {card.example}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>
                        → {card.result}
                      </div>
                    </div>
                    {card.notes && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "#94A3B8", fontStyle: "italic", lineHeight: 1.5 }}>
                        ⚠️ {card.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

        {/* CTA */}
        <div style={{
          marginTop: 40, padding: "24px", background: "linear-gradient(135deg, #F0FDFA, #ECFEFF)",
          borderRadius: 16, border: "1px solid #99F6E4", textAlign: "center",
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
            Ready to test your knowledge?
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/wpi-class3-wastewater">
              <button style={{
                padding: "10px 24px", borderRadius: 10,
                background: "linear-gradient(135deg, #0F766E, #0891B2)",
                color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Practice Quiz →
              </button>
            </Link>
            <Link href="/wpi-class3-wastewater-mock">
              <button style={{
                padding: "10px 24px", borderRadius: 10, background: "#fff",
                color: "#0F172A", border: "1.5px solid #E2E8F0", fontSize: 13,
                fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                Mock Exam →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
