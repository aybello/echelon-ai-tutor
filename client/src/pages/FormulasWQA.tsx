// ECHELON AI TUTOR — WQA Formula Sheet
// Covers: Unit Conversions, Dilution & Standards, Alkalinity & Hardness,
//         CT Values & Disinfection, Langelier Saturation Index, QA/QC Calculations,
//         Regulatory Limits (O. Reg. 169/03 / 170/03)
// Design: Blue/teal brand, mirrors FormulasWW3.tsx structure
import { useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import SiteNav from "@/components/SiteNav";

interface Formula {
  name: string;
  formula: string;
  units?: string;
  variables?: { sym: string; desc: string }[];
  example?: { problem: string; solution: string; answer: string };
  tip?: string;
}
interface FormulaCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  formulas: Formula[];
}

const CATEGORIES: FormulaCategory[] = [
  {
    id: "unit-conversions",
    label: "Unit Conversions",
    icon: "📏",
    color: "#0369A1",
    bg: "#E0F2FE",
    formulas: [
      {
        name: "mg/L ↔ µg/L",
        formula: "µg/L = mg/L × 1,000     |     mg/L = µg/L ÷ 1,000",
        tip: "1 mg/L = 1 ppm (parts per million) in dilute aqueous solutions. 1 µg/L = 1 ppb. The WQA exam frequently asks you to convert between these — always check which unit the question asks for.",
        example: {
          problem: "A sample contains 0.045 mg of fluoride in 50 mL. Express the concentration in µg/L.",
          solution: "Concentration (mg/L) = 0.045 mg ÷ 0.050 L = 0.90 mg/L\n0.90 mg/L × 1,000 = 900 µg/L",
          answer: "900 µg/L",
        },
      },
      {
        name: "g/L ↔ mg/L",
        formula: "mg/L = g/L × 1,000     |     g/L = mg/L ÷ 1,000",
        tip: "Reagent concentrations are often given in g/L; sample results are reported in mg/L. Know both directions cold.",
        example: {
          problem: "A stock solution contains 5.85 g/L NaCl. What is this in mg/L?",
          solution: "5.85 g/L × 1,000 = 5,850 mg/L",
          answer: "5,850 mg/L",
        },
      },
      {
        name: "Concentration from Mass & Volume",
        formula: "C (mg/L) = mass (mg) ÷ volume (L)",
        variables: [
          { sym: "C", desc: "Concentration (mg/L)" },
          { sym: "mass", desc: "Mass of solute (mg)" },
          { sym: "volume", desc: "Volume of solution (L)" },
        ],
        tip: "Convert mL to L before dividing. This is the most fundamental calculation on the WQA exam.",
        example: {
          problem: "A 250 mL sample contains 0.125 mg of nitrate. What is the concentration in mg/L?",
          solution: "C = 0.125 mg ÷ 0.250 L = 0.50 mg/L",
          answer: "0.50 mg/L",
        },
      },
      {
        name: "Normality ↔ Molarity",
        formula: "N = M × n     |     M = N ÷ n",
        variables: [
          { sym: "N", desc: "Normality (eq/L)" },
          { sym: "M", desc: "Molarity (mol/L)" },
          { sym: "n", desc: "n-factor (equivalents per mole; for H₂SO₄ = 2, for NaOH = 1, for HCl = 1)" },
        ],
        tip: "For acid-base titrations: n-factor = number of H⁺ or OH⁻ ions exchanged. H₂SO₄ has n=2; HCl and NaOH have n=1.",
        example: {
          problem: "What is the normality of a 0.05 M H₂SO₄ solution?",
          solution: "N = 0.05 mol/L × 2 eq/mol = 0.10 N",
          answer: "0.10 N",
        },
      },
      {
        name: "Equivalent Weight & Normality",
        formula: "N = (mass in g/L) ÷ EW     |     EW = MW ÷ n",
        variables: [
          { sym: "EW", desc: "Equivalent weight (g/eq)" },
          { sym: "MW", desc: "Molecular weight (g/mol)" },
          { sym: "n", desc: "n-factor" },
        ],
        tip: "EW of CaCO₃ = 100.09/2 = 50.05 g/eq. This is used constantly in hardness and alkalinity calculations.",
        example: {
          problem: "What is the normality of a solution containing 4.9 g/L of H₂SO₄ (MW = 98 g/mol)?",
          solution: "EW = 98 ÷ 2 = 49 g/eq\nN = 4.9 g/L ÷ 49 g/eq = 0.10 N",
          answer: "0.10 N",
        },
      },
    ],
  },
  {
    id: "dilution",
    label: "Dilution & Standard Preparation",
    icon: "🧪",
    color: "#0F766E",
    bg: "#CCFBF1",
    formulas: [
      {
        name: "Dilution Equation (C₁V₁ = C₂V₂)",
        formula: "C₁ × V₁ = C₂ × V₂",
        variables: [
          { sym: "C₁", desc: "Concentration of stock solution" },
          { sym: "V₁", desc: "Volume of stock solution needed" },
          { sym: "C₂", desc: "Desired concentration of working standard" },
          { sym: "V₂", desc: "Final volume of working standard" },
        ],
        tip: "Units of C must match on both sides. Units of V must match on both sides. Rearrange to solve for the unknown: V₁ = (C₂ × V₂) ÷ C₁.",
        example: {
          problem: "How many mL of a 1,000 mg/L stock standard are needed to prepare 100 mL of a 5 mg/L working standard?",
          solution: "V₁ = (C₂ × V₂) ÷ C₁ = (5 mg/L × 100 mL) ÷ 1,000 mg/L = 500 ÷ 1,000 = 0.5 mL",
          answer: "0.5 mL of stock + 99.5 mL diluent",
        },
      },
      {
        name: "Serial Dilution Factor",
        formula: "DF = V_sample ÷ V_total     |     C_final = C_initial × DF₁ × DF₂ × …",
        variables: [
          { sym: "DF", desc: "Dilution factor for one step (dimensionless, 0–1)" },
          { sym: "V_sample", desc: "Volume of sample taken (mL)" },
          { sym: "V_total", desc: "Total volume after dilution (mL)" },
        ],
        tip: "A 1:10 dilution has DF = 0.1. Two sequential 1:10 dilutions give an overall DF = 0.01 (1:100). Always multiply DFs for serial dilutions.",
        example: {
          problem: "A sample is diluted 1:10, then that dilution is diluted 1:5. What is the overall dilution factor?",
          solution: "Overall DF = (1/10) × (1/5) = 1/50 = 0.02",
          answer: "1:50 overall dilution (DF = 0.02)",
        },
      },
      {
        name: "Back-Calculation to Original Concentration",
        formula: "C_original = C_measured ÷ DF",
        variables: [
          { sym: "C_original", desc: "True concentration in original sample" },
          { sym: "C_measured", desc: "Concentration measured in diluted sample" },
          { sym: "DF", desc: "Overall dilution factor applied" },
        ],
        tip: "If a 1:100 diluted sample reads 0.25 mg/L, the original is 0.25 ÷ 0.01 = 25 mg/L. Always divide by the dilution factor, not multiply.",
        example: {
          problem: "A sample diluted 1:20 gives a reading of 3.5 mg/L. What is the concentration in the original sample?",
          solution: "C_original = 3.5 mg/L ÷ (1/20) = 3.5 × 20 = 70 mg/L",
          answer: "70 mg/L",
        },
      },
      {
        name: "Percent Recovery (Spike Recovery)",
        formula: "% Recovery = (C_spiked − C_unspiked) ÷ C_spike_added × 100",
        variables: [
          { sym: "C_spiked", desc: "Measured concentration in spiked sample (mg/L)" },
          { sym: "C_unspiked", desc: "Measured concentration in unspiked sample (mg/L)" },
          { sym: "C_spike_added", desc: "Known concentration of spike added (mg/L)" },
        ],
        tip: "Acceptable range is typically 80–120% for most WQA parameters. Values outside this range indicate matrix interference, contamination, or instrument drift.",
        example: {
          problem: "An unspiked sample reads 1.2 mg/L. After adding a 2.0 mg/L spike, the spiked sample reads 3.0 mg/L. What is the % recovery?",
          solution: "% Recovery = (3.0 − 1.2) ÷ 2.0 × 100 = 1.8 ÷ 2.0 × 100 = 90%",
          answer: "90% — within acceptable range (80–120%)",
        },
      },
    ],
  },
  {
    id: "alkalinity-hardness",
    label: "Alkalinity & Hardness",
    icon: "💧",
    color: "#1D4ED8",
    bg: "#DBEAFE",
    formulas: [
      {
        name: "Total Alkalinity (Titration)",
        formula: "Alkalinity (mg/L as CaCO₃) = (V_acid × N_acid × 50,000) ÷ V_sample",
        variables: [
          { sym: "V_acid", desc: "Volume of acid titrant used (mL)" },
          { sym: "N_acid", desc: "Normality of acid titrant (eq/L)" },
          { sym: "50,000", desc: "Conversion factor: EW of CaCO₃ (50.05) × 1,000 mL/L" },
          { sym: "V_sample", desc: "Volume of sample titrated (mL)" },
        ],
        tip: "The factor 50,000 = EW of CaCO₃ × 1,000. Memorize this — it appears on almost every WQA exam. Phenolphthalein alkalinity uses the P endpoint (pH 8.3); total alkalinity uses the M endpoint (pH 4.5).",
        example: {
          problem: "12.5 mL of 0.02 N H₂SO₄ is used to titrate 100 mL of sample. What is the total alkalinity?",
          solution: "Alkalinity = (12.5 × 0.02 × 50,000) ÷ 100 = 12,500 ÷ 100 = 125 mg/L as CaCO₃",
          answer: "125 mg/L as CaCO₃",
        },
      },
      {
        name: "Hardness (EDTA Titration)",
        formula: "Hardness (mg/L as CaCO₃) = (V_EDTA × M_EDTA × 100,090) ÷ V_sample",
        variables: [
          { sym: "V_EDTA", desc: "Volume of EDTA titrant used (mL)" },
          { sym: "M_EDTA", desc: "Molarity of EDTA (mol/L)" },
          { sym: "100,090", desc: "MW of CaCO₃ (g/mol) × 1,000 mL/L" },
          { sym: "V_sample", desc: "Volume of sample titrated (mL)" },
        ],
        tip: "EDTA forms 1:1 complexes with Ca²⁺ and Mg²⁺. Eriochrome Black T indicator turns blue at the endpoint. Use pH 10 buffer. Magnesium hardness = Total hardness − Calcium hardness.",
        example: {
          problem: "8.5 mL of 0.01 M EDTA is used to titrate 50 mL of sample. What is the total hardness?",
          solution: "Hardness = (8.5 × 0.01 × 100,090) ÷ 50 = 8,507.65 ÷ 50 ≈ 170 mg/L as CaCO₃",
          answer: "170 mg/L as CaCO₃",
        },
      },
      {
        name: "Hardness Conversion: CaCO₃ → Ion",
        formula: "C_ion (mg/L) = Hardness (mg/L as CaCO₃) × (MW_ion ÷ (n × EW_CaCO₃))",
        variables: [
          { sym: "MW_ion", desc: "Atomic/molecular weight of ion (Ca²⁺ = 40.08, Mg²⁺ = 24.31)" },
          { sym: "n", desc: "Valence of ion (Ca²⁺ = 2, Mg²⁺ = 2)" },
          { sym: "EW_CaCO₃", desc: "Equivalent weight of CaCO₃ = 50.05 g/eq" },
        ],
        tip: "Shortcut: Ca²⁺ (mg/L) = Ca hardness (mg/L as CaCO₃) × 0.4008. Mg²⁺ (mg/L) = Mg hardness (mg/L as CaCO₃) × 0.2431.",
        example: {
          problem: "Total hardness = 200 mg/L as CaCO₃; calcium hardness = 120 mg/L as CaCO₃. What is the Mg²⁺ concentration?",
          solution: "Mg hardness = 200 − 120 = 80 mg/L as CaCO₃\nMg²⁺ = 80 × 0.2431 = 19.4 mg/L",
          answer: "19.4 mg/L as Mg²⁺",
        },
      },
      {
        name: "meq/L Conversion",
        formula: "meq/L = (mg/L as CaCO₃) ÷ 50     |     mg/L as CaCO₃ = meq/L × 50",
        tip: "The equivalent weight of CaCO₃ is 50.05 g/eq ≈ 50. So 1 meq/L = 50 mg/L as CaCO₃. This conversion is used in ion balance and corrosion index calculations.",
        example: {
          problem: "A sample has a total alkalinity of 150 mg/L as CaCO₃. Express this in meq/L.",
          solution: "meq/L = 150 ÷ 50 = 3.0 meq/L",
          answer: "3.0 meq/L",
        },
      },
    ],
  },
  {
    id: "ct-disinfection",
    label: "CT Values & Disinfection",
    icon: "☣️",
    color: "#7C3AED",
    bg: "#EDE9FE",
    formulas: [
      {
        name: "CT Value",
        formula: "CT = C × T",
        units: "mg·min/L",
        variables: [
          { sym: "C", desc: "Disinfectant residual concentration (mg/L) — measured at the outlet of the contact chamber" },
          { sym: "T", desc: "Contact time (min) — use T₁₀ (time for 10% of flow to pass through)" },
        ],
        tip: "T₁₀ = Baffling factor × HRT. Baffling factors: excellent = 0.7, good = 0.5, average = 0.3, poor = 0.1. Always use T₁₀, not HRT, in CT calculations.",
        example: {
          problem: "A chlorine contact chamber has a residual of 1.5 mg/L and a T₁₀ of 45 minutes. What is the CT?",
          solution: "CT = 1.5 mg/L × 45 min = 67.5 mg·min/L",
          answer: "67.5 mg·min/L",
        },
      },
      {
        name: "CT Required for Giardia (Free Chlorine, 10°C)",
        formula: "CT_required = 165 mg·min/L (for 4-log / 99.99% inactivation at 10°C, pH 7–8)",
        tip: "Ontario's Procedure for Disinfection requires 4-log (99.99%) Giardia inactivation. CT requirements increase at lower temperatures and higher pH. At 5°C the CT requirement is approximately 235 mg·min/L. UV can also achieve Giardia credit at 40 mJ/cm² for 4-log.",
      },
      {
        name: "CT Required for Viruses (Free Chlorine, 10°C)",
        formula: "CT_required = 6 mg·min/L (for 4-log / 99.99% inactivation at 10°C, pH 6–9)",
        tip: "Viruses require much less CT than Giardia because free chlorine is highly effective against viruses. UV at 40 mJ/cm² also achieves 4-log virus inactivation credit in Ontario.",
      },
      {
        name: "Log Inactivation Credit",
        formula: "Log inactivation = log₁₀(N₀ ÷ N)",
        variables: [
          { sym: "N₀", desc: "Initial organism concentration" },
          { sym: "N", desc: "Final organism concentration after disinfection" },
        ],
        tip: "1-log = 90% removal; 2-log = 99%; 3-log = 99.9%; 4-log = 99.99%. Ontario requires 4-log for both Giardia and viruses from combined treatment and disinfection.",
        example: {
          problem: "A system achieves 2-log removal through filtration and 2-log inactivation through disinfection. What is the total log credit for Giardia?",
          solution: "Total log credit = 2 + 2 = 4-log (99.99% inactivation)",
          answer: "4-log — meets Ontario's minimum requirement",
        },
      },
      {
        name: "Chlorine Dose, Demand & Residual",
        formula: "Dose = Demand + Residual",
        variables: [
          { sym: "Dose", desc: "Amount of chlorine added (mg/L)" },
          { sym: "Demand", desc: "Chlorine consumed by reactions with organics, ammonia, metals (mg/L)" },
          { sym: "Residual", desc: "Chlorine remaining after demand is satisfied (mg/L)" },
        ],
        tip: "O. Reg. 170/03 requires a minimum free chlorine residual of 0.05 mg/L throughout the distribution system. Most systems target 0.2 mg/L at the extremities.",
        example: {
          problem: "A water system adds 3.5 mg/L of chlorine. The measured residual is 0.8 mg/L. What is the chlorine demand?",
          solution: "Demand = Dose − Residual = 3.5 − 0.8 = 2.7 mg/L",
          answer: "2.7 mg/L chlorine demand",
        },
      },
      {
        name: "UV Dose",
        formula: "UV Dose (mJ/cm²) = UV Intensity (mW/cm²) × Exposure Time (s)",
        tip: "Ontario requires 40 mJ/cm² for 4-log Giardia and 4-log virus inactivation credit. UV dose must be validated at the lowest transmittance (UVT) and highest flow rate expected in operation.",
        example: {
          problem: "A UV reactor delivers 8 mW/cm² at the required flow rate. How many seconds of exposure are needed for a 40 mJ/cm² dose?",
          solution: "Time = 40 mJ/cm² ÷ 8 mW/cm² = 5 seconds",
          answer: "5 seconds",
        },
      },
    ],
  },
  {
    id: "lsi",
    label: "Langelier Saturation Index",
    icon: "⚖️",
    color: "#B45309",
    bg: "#FFFBEB",
    formulas: [
      {
        name: "Langelier Saturation Index (LSI)",
        formula: "LSI = pH − pHs",
        variables: [
          { sym: "pH", desc: "Measured pH of the water" },
          { sym: "pHs", desc: "pH at which the water is saturated with CaCO₃ (calculated)" },
        ],
        tip: "LSI > 0: scale-forming (CaCO₃ will precipitate). LSI < 0: corrosive (CaCO₃ will dissolve). LSI = 0: balanced. Target LSI of 0 to +0.5 for corrosion control in distribution systems.",
        example: {
          problem: "A water sample has pH 7.8 and a calculated pHs of 8.4. What is the LSI and what does it indicate?",
          solution: "LSI = 7.8 − 8.4 = −0.6",
          answer: "LSI = −0.6 — water is corrosive (will dissolve CaCO₃ scale and attack pipe surfaces)",
        },
      },
      {
        name: "pHs Calculation",
        formula: "pHs = (9.3 + A + B) − (C + D)",
        variables: [
          { sym: "A", desc: "TDS factor: log₁₀(TDS) − 1 (or use lookup table)" },
          { sym: "B", desc: "Temperature factor (from lookup table; decreases with temperature)" },
          { sym: "C", desc: "Calcium hardness factor: log₁₀(Ca hardness as CaCO₃)" },
          { sym: "D", desc: "Alkalinity factor: log₁₀(Total alkalinity as CaCO₃)" },
        ],
        tip: "The WQA exam typically provides pHs or the lookup table values. Know the formula structure and that higher Ca hardness and alkalinity lower pHs (making water more scale-forming).",
        example: {
          problem: "Given: pHs = 8.1, measured pH = 7.6. What is the LSI?",
          solution: "LSI = 7.6 − 8.1 = −0.5",
          answer: "LSI = −0.5 (slightly corrosive)",
        },
      },
    ],
  },
  {
    id: "qaqc",
    label: "QA/QC Calculations",
    icon: "📊",
    color: "#166534",
    bg: "#F0FDF4",
    formulas: [
      {
        name: "Relative Percent Difference (RPD)",
        formula: "RPD (%) = |C₁ − C₂| ÷ ((C₁ + C₂) ÷ 2) × 100",
        variables: [
          { sym: "C₁", desc: "Concentration in first replicate" },
          { sym: "C₂", desc: "Concentration in second replicate" },
        ],
        tip: "RPD measures precision between duplicates. Acceptable RPD is typically ≤ 20% for most parameters. High RPD indicates poor precision — check homogeneity, analyst technique, or instrument stability.",
        example: {
          problem: "A duplicate pair gives results of 4.8 mg/L and 5.2 mg/L. What is the RPD?",
          solution: "RPD = |4.8 − 5.2| ÷ ((4.8 + 5.2) ÷ 2) × 100 = 0.4 ÷ 5.0 × 100 = 8%",
          answer: "8% — acceptable (< 20%)",
        },
      },
      {
        name: "Method Detection Limit (MDL)",
        formula: "MDL = t_(n-1, 99%) × s",
        variables: [
          { sym: "t_(n-1, 99%)", desc: "Student's t-value at 99% confidence for (n−1) degrees of freedom" },
          { sym: "s", desc: "Standard deviation of n replicate measurements of a low-level spike" },
          { sym: "n", desc: "Number of replicates (minimum 7 per EPA MDL procedure)" },
        ],
        tip: "MDL is the lowest concentration that can be detected with 99% confidence. For n=7 replicates, t = 3.143. The MDL must be ≤ 1/3 of the regulatory limit for the method to be valid.",
        example: {
          problem: "Seven replicates of a low-level spike give a standard deviation of 0.012 mg/L. What is the MDL? (t = 3.143)",
          solution: "MDL = 3.143 × 0.012 = 0.038 mg/L",
          answer: "MDL = 0.038 mg/L",
        },
      },
      {
        name: "Z-Score (Proficiency Testing)",
        formula: "Z = (x − X) ÷ σ",
        variables: [
          { sym: "x", desc: "Lab's reported result" },
          { sym: "X", desc: "Assigned (true) value from PT provider" },
          { sym: "σ", desc: "Standard deviation of the PT program" },
        ],
        tip: "|Z| ≤ 2: satisfactory. 2 < |Z| ≤ 3: questionable (warning). |Z| > 3: unsatisfactory (action required). Proficiency testing is mandatory for accredited labs under O. Reg. 252/05.",
        example: {
          problem: "A lab reports 1.85 mg/L for a PT sample with an assigned value of 2.00 mg/L and σ = 0.10 mg/L. What is the Z-score?",
          solution: "Z = (1.85 − 2.00) ÷ 0.10 = −0.15 ÷ 0.10 = −1.5",
          answer: "Z = −1.5 — satisfactory (|Z| ≤ 2)",
        },
      },
      {
        name: "Coefficient of Variation (CV)",
        formula: "CV (%) = (s ÷ x̄) × 100",
        variables: [
          { sym: "s", desc: "Standard deviation of replicate measurements" },
          { sym: "x̄", desc: "Mean (average) of replicate measurements" },
        ],
        tip: "CV expresses precision as a percentage of the mean. Lower CV = better precision. CV < 10% is generally acceptable for routine water analysis; < 5% for critical parameters.",
        example: {
          problem: "Five replicates of a chlorine standard give: 1.02, 0.98, 1.05, 1.00, 0.95 mg/L. Mean = 1.00, s = 0.037. What is the CV?",
          solution: "CV = (0.037 ÷ 1.00) × 100 = 3.7%",
          answer: "CV = 3.7% — excellent precision",
        },
      },
    ],
  },
  {
    id: "regulatory",
    label: "Regulatory Limits (Ontario)",
    icon: "📋",
    color: "#9F1239",
    bg: "#FFF1F2",
    formulas: [
      {
        name: "Key MACs — O. Reg. 169/03",
        formula: "Maximum Acceptable Concentrations (MACs) for drinking water parameters",
        tip: "These are the most frequently tested regulatory values on the WQA exam. MACs are health-based limits; Aesthetic Objectives (AOs) are non-health-based guidelines.",
        variables: [
          { sym: "Nitrate (NO₃-N)", desc: "MAC = 10 mg/L as N (= 44.3 mg/L as NO₃)" },
          { sym: "Nitrite (NO₂-N)", desc: "MAC = 1.0 mg/L as N" },
          { sym: "Fluoride", desc: "MAC = 1.5 mg/L; AO = 1.0 mg/L (optimal 0.7 mg/L)" },
          { sym: "Lead", desc: "MAC = 0.010 mg/L (10 µg/L)" },
          { sym: "Arsenic", desc: "MAC = 0.010 mg/L (10 µg/L)" },
          { sym: "Turbidity (treated)", desc: "MAC = 1.0 NTU; operational trigger = 0.3 NTU (conventional filtration)" },
          { sym: "E. coli", desc: "MAC = 0 CFU/100 mL (zero tolerance)" },
          { sym: "Total Coliforms", desc: "MAC = 0 CFU/100 mL in treated water" },
          { sym: "THMs (total)", desc: "MAC = 0.100 mg/L (100 µg/L)" },
          { sym: "HAAs (total)", desc: "MAC = 0.080 mg/L (80 µg/L)" },
        ],
      },
      {
        name: "Chlorine Residual Requirements — O. Reg. 170/03",
        formula: "Minimum free Cl₂ residual = 0.05 mg/L at all points in distribution system",
        tip: "The 0.05 mg/L minimum is the regulatory floor — not a target. Most systems aim for 0.2 mg/L at extremities. Maximum residual is not specified in O. Reg. 170/03 but Health Canada's aesthetic objective for chlorine is 0.6 mg/L (taste/odour threshold).",
      },
      {
        name: "Adverse Test Result Notification",
        formula: "Notify MOH: immediately and no later than 24 hours after becoming aware",
        tip: "Under O. Reg. 170/03 s.18, an adverse test result (E. coli, total coliforms, turbidity exceedance, or MAC exceedance) requires immediate notification to the local Medical Officer of Health. The 24-hour clock starts when the owner becomes aware — not when the lab reports.",
      },
      {
        name: "Record Retention",
        formula: "Operational records must be retained for a minimum of 10 years (O. Reg. 170/03)",
        tip: "This includes test results, maintenance logs, calibration records, and operator logs. The 10-year requirement applies to all records. Some records (e.g., design drawings) must be kept indefinitely.",
      },
    ],
  },
];

export default function FormulasWQA() {
  usePageMeta({
    title: "WQA Formula Sheet — Water Quality Analyst",
    description: "Complete formula reference for the Ontario Water Quality Analyst (WQA) exam. Covers unit conversions, dilution, alkalinity, hardness, CT values, Langelier Index, QA/QC, and O. Reg. 169/03 regulatory limits.",
    path: "/formulas-wqa",
    keywords: "WQA formula sheet, Water Quality Analyst formulas, alkalinity calculation, CT value, Langelier saturation index, dilution formula, O. Reg. 169/03, Ontario drinking water",
  });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    formulas: cat.formulas.filter((f) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.formula.toLowerCase().includes(q) ||
        (f.tip ?? "").toLowerCase().includes(q) ||
        (f.example?.problem ?? "").toLowerCase().includes(q)
      );
    }),
  })).filter((cat) => cat.formulas.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <SiteNav currentPath="/formulas-wqa" />
      {/* ── HEADER ── */}
      <div style={{ background: "linear-gradient(135deg, #0369A1 0%, #0F766E 100%)", padding: "40px 20px 32px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Link href="/wqa">
              <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#fff" }}>
                ← WQA Practice
              </span>
            </Link>
            <Link href="/wqa-mock">
              <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#fff" }}>
                📋 Mock Exam
              </span>
            </Link>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            🔬 WQA Formula Sheet
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", margin: "0 0 20px" }}>
            Water Quality Analyst — Ontario Certification Exam Reference
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { icon: "📏", label: "Unit Conversions" },
              { icon: "🧪", label: "Dilution & Standards" },
              { icon: "💧", label: "Alkalinity & Hardness" },
              { icon: "☣️", label: "CT Values" },
              { icon: "⚖️", label: "Langelier Index" },
              { icon: "📊", label: "QA/QC" },
              { icon: "📋", label: "Regulatory Limits" },
            ].map((chip) => (
              <span key={chip.label} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#fff" }}>
                {chip.icon} {chip.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px 80px" }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search formulas…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #E2E8F0", fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 20, boxSizing: "border-box", background: "#fff" }}
        />

        {/* Category filter chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid", borderColor: activeCategory === null ? "#0369A1" : "#E2E8F0", background: activeCategory === null ? "#0369A1" : "#fff", color: activeCategory === null ? "#fff" : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid", borderColor: activeCategory === cat.id ? cat.color : "#E2E8F0", background: activeCategory === cat.id ? cat.color : "#fff", color: activeCategory === cat.id ? "#fff" : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Formula cards */}
        {filteredCategories
          .filter((cat) => !activeCategory || cat.id === activeCategory)
          .map((cat) => (
            <div key={cat.id} id={cat.id} style={{ marginBottom: 32, scrollMarginTop: 80 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>{cat.icon}</span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: cat.color, margin: 0 }}>{cat.label}</h2>
              </div>
              <div style={{ display: "grid", gap: 16 }}>
                {cat.formulas.map((f, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", overflow: "hidden" }}>
                    {/* Formula header */}
                    <div style={{ background: cat.bg, padding: "16px 20px", borderBottom: `2px solid ${cat.color}20` }}>
                      <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: cat.color }}>{f.name}</h3>
                      <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: 13, color: "#1E293B", fontWeight: 600, border: `1px solid ${cat.color}30`, whiteSpace: "pre-wrap" }}>
                        {f.formula}
                      </div>
                      {f.units && (
                        <div style={{ marginTop: 6, fontSize: 12, color: "#64748B" }}>Units: <strong>{f.units}</strong></div>
                      )}
                    </div>
                    <div style={{ padding: "16px 20px" }}>
                      {/* Variables */}
                      {f.variables && f.variables.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Variables / Reference Values</div>
                          <div style={{ display: "grid", gap: 4 }}>
                            {f.variables.map((v, j) => (
                              <div key={j} style={{ display: "flex", gap: 8, fontSize: 13 }}>
                                <span style={{ fontFamily: "monospace", fontWeight: 700, color: cat.color, minWidth: 120, flexShrink: 0 }}>{v.sym}</span>
                                <span style={{ color: "#475569" }}>{v.desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Example */}
                      {f.example && (
                        <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px", marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Worked Example</div>
                          <p style={{ fontSize: 13, color: "#1E293B", margin: "0 0 8px", fontWeight: 600 }}>{f.example.problem}</p>
                          <p style={{ fontSize: 13, color: "#475569", margin: "0 0 6px", whiteSpace: "pre-line" }}>{f.example.solution}</p>
                          <p style={{ fontSize: 13, color: cat.color, fontWeight: 700, margin: 0 }}>Answer: {f.example.answer}</p>
                        </div>
                      )}
                      {/* Exam tip */}
                      {f.tip && (
                        <div style={{ background: cat.bg, border: `1px solid ${cat.color}30`, borderRadius: 8, padding: "10px 14px" }}>
                          <span style={{ fontSize: 12, color: "#64748B" }}>💡 <strong style={{ color: cat.color }}>Exam tip:</strong> {f.tip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {filteredCategories.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94A3B8" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No formulas match "{search}"</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Try a different keyword</div>
          </div>
        )}
      </div>
    </div>
  );
}
