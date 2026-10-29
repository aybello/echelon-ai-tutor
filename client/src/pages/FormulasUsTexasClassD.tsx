import { useState } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";

type Formula = {
  name: string;
  formula: string;
  units: string;
  use: string;
  example: string;
  working: string;
  answer: string;
};

type Category = { id: string; label: string; icon: string; color: string; bg: string; formulas: Formula[] };

const categories: Category[] = [
  {
    id: "geometry",
    label: "Tank geometry",
    icon: "🛢️",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    formulas: [
      {
        name: "Circular floor area",
        formula: "Area (ft²) = 0.785 × [diameter (ft)]²",
        units: "square feet",
        use: "Use the inside diameter. The 0.785 factor is π ÷ 4.",
        example: "A circular tank has an inside diameter of 40 ft. Find its floor area.",
        working: "Area = 0.785 × 40²\nArea = 0.785 × 1,600\nArea = 1,256 ft²",
        answer: "1,256 ft²",
      },
      {
        name: "Rectangular tank volume",
        formula: "Volume (ft³) = length (ft) × width (ft) × water depth (ft)\nGallons = ft³ × 7.48",
        units: "cubic feet, then US gallons",
        use: "Use actual water depth, not the full wall height.",
        example: "A clearwell is 50 ft by 20 ft with 10 ft of water. Find the volume in gallons.",
        working: "Volume = 50 × 20 × 10 = 10,000 ft³\nGallons = 10,000 × 7.48 = 74,800",
        answer: "74,800 US gallons",
      },
      {
        name: "Cylindrical tank volume",
        formula: "Volume (ft³) = 0.785 × [diameter (ft)]² × water depth (ft)\nGallons = ft³ × 7.48",
        units: "cubic feet, then US gallons",
        use: "Convert inches to feet before squaring a pipe or tank diameter.",
        example: "A cylindrical tank has a 20 ft inside diameter and 12 ft water depth. Find its volume.",
        working: "Area = 0.785 × 20² = 314 ft²\nVolume = 314 × 12 = 3,768 ft³\nGallons = 3,768 × 7.48 = 28,185 (rounded)",
        answer: "28,185 US gallons",
      },
    ],
  },
  {
    id: "flow",
    label: "Flow conversion",
    icon: "💧",
    color: "#0E7490",
    bg: "#ECFEFF",
    formulas: [
      {
        name: "Gallons per minute to gallons per day",
        formula: "gpd = gpm × 1,440",
        units: "gallons per day",
        use: "There are 1,440 minutes in one day.",
        example: "A well pump delivers 350 gpm for a full day. How many gallons are pumped?",
        working: "gpd = 350 × 1,440\ngpd = 504,000",
        answer: "504,000 gallons per day",
      },
      {
        name: "Gallons per minute to million gallons per day",
        formula: "MGD = (gpm × 1,440) ÷ 1,000,000",
        units: "million gallons per day",
        use: "Convert the full-day gallons to millions of gallons.",
        example: "A well pump delivers 1,250 gpm continuously. Express the flow in MGD.",
        working: "gpd = 1,250 × 1,440 = 1,800,000\nMGD = 1,800,000 ÷ 1,000,000 = 1.8",
        answer: "1.8 MGD",
      },
    ],
  },
  {
    id: "chemical",
    label: "Chemical dosage",
    icon: "🧪",
    color: "#15803D",
    bg: "#F0FDF4",
    formulas: [
      {
        name: "Pounds formula",
        formula: "lb/day = dose (mg/L) × flow (MGD) × 8.34",
        units: "pounds of active chemical per day",
        use: "8.34 converts the dose and MGD into pounds of active chemical.",
        example: "A system treats 0.5 MGD and applies 2.0 mg/L chlorine. Find the active chlorine feed rate.",
        working: "lb/day = 2.0 × 0.5 × 8.34\nlb/day = 8.34",
        answer: "8.34 lb/day of active chlorine",
      },
      {
        name: "Product amount from available strength",
        formula: "product lb/day = active lb/day ÷ decimal available strength",
        units: "pounds of product per day",
        use: "Write the product strength as a decimal. For example, 65 percent becomes 0.65.",
        example: "The preceding example needs 8.34 lb of active chlorine. Calcium hypochlorite is 65 percent available. Find the product amount.",
        working: "product = 8.34 lb/day ÷ 0.65\nproduct = 12.83 lb/day (rounded)",
        answer: "12.83 lb/day of product",
      },
    ],
  },
];

/** Not registered publicly until Texas content and commerce are governed live. */
export default function FormulasUsTexasClassD() {
  const [categoryId, setCategoryId] = useState(categories[0].id);
  const [openFormula, setOpenFormula] = useState<string | null>(null);
  const active = categories.find((category) => category.id === categoryId) ?? categories[0];

  usePageMeta({
    title: "Texas Class D Water Formula Sheet | Echelon Institute",
    description: "Texas Class D water study formulas for tank volume, flow conversion and the pounds formula. Echelon is an independent preparation provider.",
    noindex: true,
  });

  return (
    <div className="legacy-formula-page" style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Sora', sans-serif" }}>
      <SiteNav currentPath="/formulas-us-texas-class-d-water" />
      <section style={{ background: "linear-gradient(135deg, #431407 0%, #9A3412 52%, #0E7490 100%)", padding: "48px 24px 42px", textAlign: "center" }}>
        <div style={{ color: "#FED7AA", fontSize: 11, letterSpacing: "0.12em", fontWeight: 800, textTransform: "uppercase", marginBottom: 12 }}>Texas Class D Water</div>
        <h1 style={{ color: "white", fontSize: "clamp(28px, 5vw, 44px)", margin: "0 0 12px", letterSpacing: "-0.04em" }}>Formula Sheet</h1>
        <p style={{ color: "#FED7AA", maxWidth: 650, margin: "0 auto 22px", lineHeight: 1.65, fontSize: 15 }}>The calculation families used in Echelon’s Texas Class D Water question bank, with US customary units and worked examples.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/us-texas-class-d-water" style={{ background: "white", color: "#9A3412", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>Practice questions</Link>
          <Link href="/us-texas-class-d-water-mock" style={{ background: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>Mock exam</Link>
        </div>
      </section>
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px", color: "#78350F", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}><strong>Study aid only.</strong> Use your authority’s current rules, approved reference material and calculator policy for your actual exam. These examples do not establish operating requirements or compliance values. Geometry examples use 0.785 as the stated approximation for π ÷ 4 and round final gallon values to the nearest whole gallon. Other final values use the precision shown.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>{categories.map((category) => <button key={category.id} onClick={() => { setCategoryId(category.id); setOpenFormula(null); }} style={{ border: category.id === active.id ? `2px solid ${category.color}` : "1px solid #CBD5E1", background: category.id === active.id ? category.bg : "white", color: category.id === active.id ? category.color : "#475569", borderRadius: 999, padding: "9px 14px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>{category.icon} {category.label}</button>)}</div>
        {active.formulas.map((item) => {
          const isOpen = openFormula === item.name;
          return <article key={item.name} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden", marginBottom: 14, boxShadow: "0 2px 10px rgba(15,23,42,0.04)" }}>
            <div style={{ padding: "20px" }}><h2 style={{ color: "#0F172A", fontSize: 18, margin: "0 0 10px" }}>{item.name}</h2><div style={{ background: active.bg, border: `1px solid ${active.color}33`, color: active.color, borderRadius: 9, padding: "12px 14px", fontFamily: "monospace", fontWeight: 800, whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{item.formula}</div><p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.55, margin: "11px 0 0" }}><strong style={{ color: "#334155" }}>Answer units:</strong> {item.units}<br />{item.use}</p><button onClick={() => setOpenFormula(isOpen ? null : item.name)} style={{ marginTop: 14, border: "none", borderRadius: 8, background: isOpen ? active.color : "#F1F5F9", color: isOpen ? "white" : "#334155", padding: "8px 12px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>{isOpen ? "Hide worked example" : "Show worked example"}</button></div>
            {isOpen && <div style={{ borderTop: "1px solid #E2E8F0", background: "#F8FAFC", padding: "18px 20px" }}><div style={{ color: "#64748B", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Example</div><p style={{ color: "#1E293B", lineHeight: 1.6 }}>{item.example}</p><pre style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px", margin: "10px 0", color: "#0F172A", whiteSpace: "pre-wrap", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", lineHeight: 1.65 }}>{item.working}</pre><strong style={{ color: active.color }}>Answer: {item.answer}</strong></div>}
          </article>;
        })}
      </main>
    </div>
  );
}
