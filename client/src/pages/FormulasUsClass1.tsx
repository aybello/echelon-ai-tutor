// US Class I Water Treatment and Distribution — Formula Sheet
// Covers only the calculation families that actually appear in the US Class I
// question pools, in US customary units with the same constants the worked
// solutions use. Metric equivalents are shown where a pool item supplies them.
// Aligned with the WPI Class 1 Need-to-Know Criteria. Echelon is an independent
// preparation provider and is not endorsed by WPI or any state agency.
import { useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import SiteNav from "@/components/SiteNav";

// ── TYPES ────────────────────────────────────────────────────────────────────
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

// ── CONSTANTS USED THROUGHOUT ────────────────────────────────────────────────
const CONSTANTS: { value: string; meaning: string }[] = [
  { value: "7.48", meaning: "US gallons in 1 cubic foot" },
  { value: "8.34", meaning: "Pounds in 1 US gallon of water" },
  { value: "0.785", meaning: "Area factor for a circle using diameter squared" },
  { value: "0.433", meaning: "psi added by each foot of fresh water" },
  { value: "2.31", meaning: "Feet of fresh water head in each psi" },
  { value: "1,440", meaning: "Minutes in 1 day" },
];

// ── FORMULA DATA ─────────────────────────────────────────────────────────────
const CATEGORIES: FormulaCategory[] = [
  {
    id: "chemical-feed",
    label: "Chemical Feed & Dosage",
    icon: "🧪",
    color: "#0E7490",
    bg: "#ECFEFF",
    formulas: [
      {
        name: "Pounds Formula (active chemical mass per day)",
        formula: "lb/day = Dose (mg/L) × Flow (MGD) × 8.34",
        units: "pounds per day",
        variables: [
          { sym: "Dose", desc: "Concentration of active chemical, in mg/L" },
          { sym: "Flow", desc: "Water treated, in million gallons per day" },
          { sym: "8.34", desc: "Pounds per US gallon of water" },
        ],
        example: {
          problem: "A plant treats 1.8 MGD and applies a chlorine dose of 2.4 mg/L. How many pounds of active chlorine are fed per day?",
          solution: "lb/day = 2.4 × 1.8 × 8.34\nlb/day = 2.4 × 1.8 = 4.32\n4.32 × 8.34 = 36.03",
          answer: "36.0 lb/day of active chlorine",
        },
        tip: "This gives the ACTIVE chemical mass, not the mass of the solution or product you pour in. If the product is 65 percent available chlorine, divide this answer by 0.65 to get the product weight.",
      },
      {
        name: "Dose from a Known Feed Rate",
        formula: "Dose (mg/L) = lb/day ÷ (Flow (MGD) × 8.34)",
        units: "milligrams per litre",
        variables: [
          { sym: "lb/day", desc: "Active chemical actually fed each day" },
          { sym: "Flow", desc: "Water treated, in MGD" },
        ],
        example: {
          problem: "A feeder delivers 52 lb/day of active chemical into a flow of 2.5 MGD. What concentration is being applied?",
          solution: "Denominator = 2.5 × 8.34 = 20.85\nDose = 52 ÷ 20.85 = 2.494",
          answer: "2.5 mg/L",
        },
        tip: "This is the pounds formula rearranged. If your answer looks far off, check first whether the flow was given in gpm or gpd instead of MGD.",
      },
      {
        name: "Product Feed Rate from Active Strength",
        formula: "Product (lb/day) = Active (lb/day) ÷ Decimal strength",
        units: "pounds of product per day",
        variables: [
          { sym: "Active", desc: "Pounds of the actual working chemical needed" },
          { sym: "Decimal strength", desc: "Percent available strength written as a decimal, so 65 percent becomes 0.65" },
        ],
        example: {
          problem: "You need 36 lb/day of active chlorine. The hypochlorite product is 12.5 percent available chlorine. How much product per day?",
          solution: "Product = 36 ÷ 0.125 = 288",
          answer: "288 lb/day of product",
        },
        tip: "Dividing by a decimal less than 1 must make the number bigger. If your product weight came out smaller than the active weight, you multiplied instead of divided.",
      },
    ],
  },
  {
    id: "flow-loading",
    label: "Flow & Loading Rates",
    icon: "💧",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    formulas: [
      {
        name: "Flow Unit Conversions",
        formula: "gpm × 1,440 = gpd        gpd ÷ 1,000,000 = MGD        cfs × 448.8 = gpm",
        units: "gallons per minute, gallons per day, million gallons per day",
        example: {
          problem: "A pump runs at 850 gpm. Express this in MGD.",
          solution: "gpd = 850 × 1,440 = 1,224,000\nMGD = 1,224,000 ÷ 1,000,000 = 1.224",
          answer: "1.22 MGD",
        },
        tip: "Most wrong answers on loading questions are unit errors, not math errors. Convert everything to the units the formula expects before you divide.",
      },
      {
        name: "Filter Hydraulic Loading Rate",
        formula: "Loading (gpm/ft²) = Flow (gpm) ÷ Filter surface area (ft²)",
        units: "gallons per minute per square foot",
        variables: [
          { sym: "Flow", desc: "Flow going onto the filter that is in service" },
          { sym: "Area", desc: "Plan surface area of the filter media, length × width" },
        ],
        example: {
          problem: "A filter measures 20 ft by 16 ft and receives 1,600 gpm. What is the hydraulic loading rate?",
          solution: "Area = 20 × 16 = 320 ft²\nLoading = 1,600 ÷ 320 = 5.0",
          answer: "5.0 gpm/ft²",
        },
        tip: "Use only the filters actually in service. If one of four filters is offline for backwash, the remaining three each carry more flow, and the loading rate rises.",
      },
      {
        name: "Surface Overflow Rate",
        formula: "SOR (gpd/ft²) = Flow (gpd) ÷ Basin surface area (ft²)",
        units: "gallons per day per square foot",
        variables: [
          { sym: "Flow", desc: "Daily flow through the basin" },
          { sym: "Area", desc: "Surface area of the settling basin, length × width" },
        ],
        example: {
          problem: "A rectangular sedimentation basin is 80 ft long and 25 ft wide and passes 1.2 MGD. What is the surface overflow rate?",
          solution: "Area = 80 × 25 = 2,000 ft²\nFlow = 1,200,000 gpd\nSOR = 1,200,000 ÷ 2,000 = 600",
          answer: "600 gpd/ft²",
        },
        tip: "Surface overflow rate uses the surface area of the water, not the basin volume and not the cross-section. Depth does not appear in this formula.",
      },
      {
        name: "Theoretical Detention Time",
        formula: "DT (minutes) = Volume (gal) ÷ Flow (gpm)",
        units: "minutes, or hours when divided by 60",
        variables: [
          { sym: "Volume", desc: "Water actually held in the basin or contact tank" },
          { sym: "Flow", desc: "Flow passing through, in gallons per minute" },
        ],
        example: {
          problem: "A contact tank holds 48,000 gallons and the flow is 600 gpm. What is the theoretical detention time?",
          solution: "DT = 48,000 ÷ 600 = 80 minutes\n80 ÷ 60 = 1.33 hours",
          answer: "80 minutes, or 1.33 hours",
        },
        tip: "This is an ideal number. Real basins short-circuit, so actual contact time is usually less. Never present theoretical detention time as proven contact time for disinfection credit.",
      },
    ],
  },
  {
    id: "disinfection-quality",
    label: "Disinfection & Water Quality",
    icon: "🦠",
    color: "#15803D",
    bg: "#F0FDF4",
    formulas: [
      {
        name: "Chlorine Demand",
        formula: "Demand (mg/L) = Dose applied (mg/L) − Residual measured (mg/L)",
        units: "milligrams per litre",
        variables: [
          { sym: "Dose", desc: "Chlorine concentration actually applied" },
          { sym: "Residual", desc: "Chlorine still measurable after the stated contact period" },
        ],
        example: {
          problem: "A dose of 3.2 mg/L is applied and the residual after contact is 0.9 mg/L. What is the chlorine demand?",
          solution: "Demand = 3.2 − 0.9 = 2.3",
          answer: "2.3 mg/L",
        },
        tip: "Demand, dose and residual must be paired from the same test under the same conditions. Demand changes with temperature, pH and what is in the water, so one result does not predict another day.",
      },
      {
        name: "Percent Removal",
        formula: "Removal (%) = ((In − Out) ÷ In) × 100",
        units: "percent",
        variables: [
          { sym: "In", desc: "Measured value entering the process" },
          { sym: "Out", desc: "Measured value leaving the process" },
        ],
        example: {
          problem: "Raw water turbidity is 8.4 NTU and settled water turbidity is 1.26 NTU. What is the percent removal?",
          solution: "Decrease = 8.4 − 1.26 = 7.14\nFraction = 7.14 ÷ 8.4 = 0.85\nPercent = 0.85 × 100 = 85",
          answer: "85 percent removal",
        },
        tip: "Always divide by the STARTING value. Dividing by the final value is the most common error here and gives an impossible number above 100 percent.",
      },
      {
        name: "CT Value",
        formula: "CT = Residual concentration (mg/L) × Contact time (minutes)",
        units: "mg/L · minutes",
        variables: [
          { sym: "C", desc: "Disinfectant residual at the end of the contact zone" },
          { sym: "T", desc: "Contact time, normally the T10 time, not theoretical detention" },
        ],
        example: {
          problem: "A residual of 1.1 mg/L is held through a contact time of 42 minutes. What CT was achieved?",
          solution: "CT = 1.1 × 42 = 46.2",
          answer: "46.2 mg/L · min",
        },
        tip: "The CT you achieve must be compared to the required CT from your state's approved table for the actual temperature and pH. A calculated CT alone does not prove compliance or pathogen inactivation.",
      },
    ],
  },
  {
    id: "volume-storage",
    label: "Volume & Storage",
    icon: "🛢️",
    color: "#C2410C",
    bg: "#FFF7ED",
    formulas: [
      {
        name: "Rectangular Tank Volume",
        formula: "Volume (ft³) = Length (ft) × Width (ft) × Water depth (ft)\nGallons = ft³ × 7.48",
        units: "cubic feet, then US gallons",
        variables: [
          { sym: "Water depth", desc: "Actual depth of water, not the full height of the tank wall" },
        ],
        example: {
          problem: "A rectangular reservoir is 60 ft long and 30 ft wide, holding water 12 ft deep. How many gallons does it contain?",
          solution: "Volume = 60 × 30 × 12 = 21,600 ft³\nGallons = 21,600 × 7.48 = 161,568",
          answer: "161,568 gallons",
        },
        tip: "Use the depth of the water, not the height of the structure. Using wall height on a partly full tank overstates your stored volume.",
      },
      {
        name: "Cylindrical Tank Volume",
        formula: "Volume (ft³) = 0.785 × Diameter² (ft) × Water depth (ft)\nGallons = ft³ × 7.48",
        units: "cubic feet, then US gallons",
        variables: [
          { sym: "0.785", desc: "Circle area factor used with diameter squared" },
          { sym: "Diameter", desc: "Internal diameter, squared, not the radius" },
        ],
        example: {
          problem: "A standpipe has an internal diameter of 40 ft and holds water 25 ft deep. How many gallons?",
          solution: "Area = 0.785 × 40² = 0.785 × 1,600 = 1,256 ft²\nVolume = 1,256 × 25 = 31,400 ft³\nGallons = 31,400 × 7.48 = 234,872",
          answer: "234,872 gallons",
        },
        tip: "The 0.785 factor is built for DIAMETER squared. Putting the radius in here gives a quarter of the real volume, which is the single most common tank-volume mistake.",
      },
      {
        name: "Full Pipe Volume",
        formula: "Volume (ft³) = 0.785 × Diameter² (ft) × Length (ft)\nGallons = ft³ × 7.48",
        units: "cubic feet, then US gallons",
        variables: [
          { sym: "Diameter", desc: "Internal diameter in FEET, so divide inches by 12 first" },
          { sym: "Length", desc: "Length of the pipe run, in feet" },
        ],
        example: {
          problem: "How many gallons are in 1,200 ft of 12-inch water main running full?",
          solution: "Diameter = 12 ÷ 12 = 1.0 ft\nArea = 0.785 × 1.0² = 0.785 ft²\nVolume = 0.785 × 1,200 = 942 ft³\nGallons = 942 × 7.48 = 7,046",
          answer: "About 7,046 gallons",
        },
        tip: "Pipe diameter is almost always given in inches and pipe length in feet. Convert the diameter to feet before you square it, or your answer will be out by a factor of 144.",
      },
      {
        name: "Nominal Storage Time",
        formula: "Time (minutes) = Stored volume (gal) ÷ Flow (gpm)",
        units: "minutes, or hours when divided by 60",
        example: {
          problem: "A reservoir holds 180,000 gallons and the system draws 250 gpm. What nominal storage time does that represent?",
          solution: "Time = 180,000 ÷ 250 = 720 minutes\n720 ÷ 60 = 12 hours",
          answer: "720 minutes, or 12 hours",
        },
        tip: "This is a nominal figure based on steady flow and complete turnover. It is not a maximum water age and it does not describe real mixing or stagnation in a tank.",
      },
    ],
  },
  {
    id: "pressure-hydraulics",
    label: "Pressure & Hydraulics",
    icon: "📊",
    color: "#6D28D9",
    bg: "#F5F3FF",
    formulas: [
      {
        name: "Static Pressure from Head",
        formula: "Pressure (psi) = Head (ft) × 0.433",
        units: "pounds per square inch",
        variables: [
          { sym: "Head", desc: "Vertical height of water above the point, in feet" },
          { sym: "0.433", desc: "psi per foot of fresh water" },
        ],
        example: {
          problem: "A tank's water surface sits 145 ft above a hydrant. What static pressure does that produce at the hydrant?",
          solution: "Pressure = 145 × 0.433 = 62.785",
          answer: "About 62.8 psi",
        },
        tip: "Only VERTICAL height counts. A long flat run of pipe adds no static pressure, though it does add friction loss once water is moving.",
      },
      {
        name: "Head from Pressure",
        formula: "Head (ft) = Pressure (psi) × 2.31",
        units: "feet of water",
        variables: [
          { sym: "2.31", desc: "Feet of fresh water head per psi" },
        ],
        example: {
          problem: "A gauge reads 68 psi. What height of water column does that represent?",
          solution: "Head = 68 × 2.31 = 157.08",
          answer: "About 157 ft of head",
        },
        tip: "0.433 and 2.31 are reciprocals of each other. Going from feet to psi you multiply by 0.433. Going from psi to feet you multiply by 2.31. Mixing them up inverts your answer.",
      },
      {
        name: "Velocity in a Full Pipe",
        formula: "Velocity (ft/s) = Flow (ft³/s) ÷ Internal area (ft²)",
        units: "feet per second",
        variables: [
          { sym: "Flow", desc: "Flow in cubic feet per second, so convert gpm by dividing by 448.8" },
          { sym: "Area", desc: "0.785 × diameter² with the diameter in feet" },
        ],
        example: {
          problem: "A 8-inch main carries 700 gpm. What is the mean velocity?",
          solution: "Flow = 700 ÷ 448.8 = 1.5597 ft³/s\nDiameter = 8 ÷ 12 = 0.6667 ft\nArea = 0.785 × 0.6667² = 0.3489 ft²\nVelocity = 1.5597 ÷ 0.3489 = 4.47",
          answer: "About 4.5 ft/s",
        },
        tip: "The relationship is Q = A × v. If you divided area by flow instead, your answer will be a small decimal rather than a few feet per second.",
      },
    ],
  },
  {
    id: "field-measurement",
    label: "Field Measurement",
    icon: "📐",
    color: "#B91C1C",
    bg: "#FEF2F2",
    formulas: [
      {
        name: "Metered Interval Consumption",
        formula: "Interval volume = Current reading − Previous reading",
        units: "same units as the meter register",
        example: {
          problem: "A customer meter read 128,400 gallons last quarter and reads 142,950 gallons today. What was consumed?",
          solution: "Interval = 142,950 − 128,400 = 14,550",
          answer: "14,550 gallons",
        },
        tip: "Cumulative registers never reset, so subtraction removes everything recorded before the period began. A negative result means the readings were entered in the wrong order or the meter was replaced.",
      },
      {
        name: "Timed Collection Flow",
        formula: "Flow = Collected volume ÷ Elapsed time",
        units: "gallons per minute, or gpm × 60 for gallons per hour",
        example: {
          problem: "A container collects 18 gallons in 45 seconds. What is the average flow?",
          solution: "Time = 45 ÷ 60 = 0.75 minutes\nFlow = 18 ÷ 0.75 = 24",
          answer: "24 gpm",
        },
        tip: "Convert seconds to minutes before dividing, or state the answer in gallons per second. This method assumes everything discharged was caught, so spillage makes the result read low.",
      },
      {
        name: "Well Drawdown",
        formula: "Drawdown (ft) = Pumping water level (ft) − Static water level (ft)",
        units: "feet",
        variables: [
          { sym: "Static level", desc: "Depth to water before pumping, measured from a fixed datum" },
          { sym: "Pumping level", desc: "Depth to water while pumping, from the SAME datum" },
        ],
        example: {
          problem: "Static water level is 62 ft below the measuring point and the pumping level is 91 ft below it. What is the drawdown?",
          solution: "Drawdown = 91 − 62 = 29",
          answer: "29 ft of drawdown",
        },
        tip: "Both readings must come from the same reference point, normally the top of casing. Mixing a ground-surface reading with a top-of-casing reading corrupts the result.",
      },
      {
        name: "Specific Capacity",
        formula: "Specific capacity (gpm/ft) = Pumping rate (gpm) ÷ Drawdown (ft)",
        units: "gallons per minute per foot of drawdown",
        example: {
          problem: "A well pumps 420 gpm with 29 ft of drawdown. What is the specific capacity?",
          solution: "Specific capacity = 420 ÷ 29 = 14.48",
          answer: "About 14.5 gpm/ft",
        },
        tip: "Falling specific capacity over time usually signals well or screen fouling. Track it with the date and pumping rate, since a single value on its own means little.",
      },
    ],
  },
];

export default function FormulasUsClass1() {
  usePageMeta({
    title: "US Class I Water Formulas — Echelon Institute",
    description:
      "US Class I water treatment and distribution formula sheet in US customary units: pounds formula, loading rates, detention time, chlorine demand, tank and pipe volume, static pressure, velocity, drawdown. Aligned with the WPI Class 1 Need-to-Know Criteria.",
    noindex: true,
  });
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].id);
  const [expandedFormula, setExpandedFormula] = useState<string | null>(null);
  const activeCat = CATEGORIES.find(c => c.id === activeCategory)!;
  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <style>{`
        @media (max-width: 640px) {
          .formulas-content { padding: 16px 14px 60px !important; }
          .formulas-hero { padding: 32px 16px 28px !important; }
          .formulas-hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .formulas-hero-btns a, .formulas-hero-btns button { width: 100% !important; box-sizing: border-box; }
          .formulas-nav-btns { flex-wrap: wrap !important; }
          .formulas-quick-ref { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      <SiteNav currentPath="/formulas-us-class1" />

      {/* Hero */}
      <div className="formulas-hero" style={{
        background: "linear-gradient(135deg, #0F172A 0%, #164E63 50%, #0E7490 100%)",
        padding: "48px 24px 40px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(125,211,252,0.12)",
          border: "1px solid rgba(125,211,252,0.25)",
          borderRadius: 20, padding: "5px 16px", marginBottom: 16,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#7DD3FC", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            United States — Class I
          </span>
        </div>
        <h1 style={{
          fontSize: "clamp(24px, 4vw, 40px)",
          fontWeight: 900, color: "#fff", margin: "0 0 12px",
          letterSpacing: "-0.5px", lineHeight: 1.15,
        }}>
          US Class I Water<br />Formula Sheet
        </h1>
        <p style={{ fontSize: 15, color: "#94A3B8", maxWidth: 560, margin: "0 auto 24px", lineHeight: 1.6 }}>
          Every calculation family that appears in the US Class I treatment and distribution
          question banks, in US customary units, with the same constants the worked solutions use.
        </p>
        <div className="formulas-hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/us-class1-water">
            <button style={{
              padding: "10px 22px", borderRadius: 9,
              background: "linear-gradient(135deg, #0E7490, #1D4ED8)",
              color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>Treatment Practice →</button>
          </Link>
          <Link href="/us-class1-water-dist">
            <button style={{
              padding: "10px 22px", borderRadius: 9,
              background: "rgba(255,255,255,0.1)",
              color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>Distribution Practice →</button>
          </Link>
        </div>
      </div>

      {/* Constants quick reference */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "20px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            Constants you will use
          </div>
          <div className="formulas-quick-ref" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            {CONSTANTS.map(c => (
              <div key={c.value} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0E7490", fontFamily: "monospace" }}>{c.value}</div>
                <div style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.45, marginTop: 2 }}>{c.meaning}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #E2E8F0",
        padding: "0 24px",
        overflowX: "auto",
        display: "flex",
        gap: 4,
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setExpandedFormula(null); }}
            style={{
              padding: "14px 16px",
              background: "transparent",
              border: "none",
              borderBottom: activeCategory === cat.id ? `3px solid ${cat.color}` : "3px solid transparent",
              color: activeCategory === cat.id ? cat.color : "#64748B",
              fontSize: 13.5,
              fontWeight: activeCategory === cat.id ? 800 : 600,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ marginRight: 6 }}>{cat.icon}</span>{cat.label}
          </button>
        ))}
      </div>

      {/* Formula cards */}
      <div className="formulas-content" style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 70px" }}>
        {activeCat.formulas.map(f => {
          const isOpen = expandedFormula === f.name;
          return (
            <div key={f.name} style={{
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              marginBottom: 14,
              overflow: "hidden",
            }}>
              <div style={{ padding: "18px 20px 16px" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>{f.name}</div>
                <div style={{
                  background: activeCat.bg,
                  border: `1px solid ${activeCat.color}33`,
                  borderRadius: 8,
                  padding: "12px 14px",
                  fontFamily: "monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  color: activeCat.color,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                }}>{f.formula}</div>
                {f.units && (
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>
                    Answer units: {f.units}
                  </div>
                )}
                {f.variables && f.variables.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {f.variables.map(v => (
                      <div key={v.sym} style={{ display: "flex", gap: 10, fontSize: 13, color: "#334155", marginBottom: 5, lineHeight: 1.5 }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 800, color: activeCat.color, minWidth: 80 }}>{v.sym}</span>
                        <span>{v.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
                {f.example && (
                  <button
                    onClick={() => setExpandedFormula(isOpen ? null : f.name)}
                    style={{
                      marginTop: 14,
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: isOpen ? activeCat.color : "#F1F5F9",
                      color: isOpen ? "#fff" : "#334155",
                      border: "none",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {isOpen ? "Hide worked example" : "Show worked example"}
                  </button>
                )}
              </div>
              {isOpen && f.example && (
                <div style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0", padding: "16px 20px" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "#64748B", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>Problem</div>
                  <div style={{ fontSize: 13.5, color: "#1E293B", lineHeight: 1.6, marginBottom: 14 }}>{f.example.problem}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "#64748B", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>Working</div>
                  <div style={{
                    fontFamily: "monospace", fontSize: 13, color: "#0F172A",
                    whiteSpace: "pre-wrap", lineHeight: 1.75, background: "#fff",
                    border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 14px", marginBottom: 14,
                  }}>{f.example.solution}</div>
                  <div style={{
                    display: "inline-block",
                    background: activeCat.bg,
                    border: `1px solid ${activeCat.color}44`,
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 14,
                    fontWeight: 800,
                    color: activeCat.color,
                  }}>Answer: {f.example.answer}</div>
                </div>
              )}
              {f.tip && (
                <div style={{
                  background: "#FFFBEB",
                  borderTop: "1px solid #FDE68A",
                  padding: "12px 20px",
                  fontSize: 13,
                  color: "#78350F",
                  lineHeight: 1.6,
                }}>
                  <strong style={{ fontWeight: 800 }}>Watch out: </strong>{f.tip}
                </div>
              )}
            </div>
          );
        })}

        <div style={{
          marginTop: 28,
          background: "#F1F5F9",
          border: "1px solid #CBD5E1",
          borderRadius: 10,
          padding: "16px 18px",
          fontSize: 12.5,
          color: "#475569",
          lineHeight: 1.65,
        }}>
          This sheet uses US customary units because that is what the US Class I question banks use.
          Your state sets its own certification requirements, approved reference tables and permitted
          exam aids. Confirm those with your state certifying authority before your exam date.
          Echelon Institute is an independent preparation provider and is not endorsed by WPI or
          any state agency.
        </div>
      </div>
    </div>
  );
}
