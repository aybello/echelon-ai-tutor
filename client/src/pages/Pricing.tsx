// Echelon Institute — Pricing Page
// Shows all individual Practice Passes
// Stripe Checkout integration via tRPC

import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_37a8727b.png";

// ─── Product definitions (mirrors server/stripe/products.ts) ─────────────────
interface Product {
  key: string;
  name: string;
  shortName: string;
  description: string;
  priceCAD: number; // cents
  examTypes: string[];
  badge?: string;
  badgeColor?: string;
  color: string;
  bg: string;
  border: string;
  available: boolean;
  features?: string[]; // optional highlight bullets shown on the card
}

/** Maps product key → flashcard page path */
const FLASHCARD_ROUTES: Record<string, string> = {
  "oit": "/oit-water-flashcards",
  "oit-ww": "/oit-ww-flashcards",
  "class1-water": "/class1-water-flashcards",
  "class1-ww": "/class1-ww-flashcards",
  "class2-water": "/class2-water-flashcards",
  "class2-ww": "/class2-ww-flashcards",
  "class3-water": "/class3-water-flashcards",
  "class3-ww": "/class3-ww-flashcards",
  "class4-water": "/class4-water-flashcards",
  "class4-ww": "/class4-ww-flashcards",
  "wqa": "/wqa-flashcards",
  "wpi-class1-water": "/wpi-class1-water-flashcards",
  "wpi-class2-water": "/wpi-class2-water-flashcards",
  "wpi-class3-water": "/wpi-class3-water-flashcards",
  "wpi-class4-water": "/wpi-class4-water-flashcards",
  "wpi-class1-wastewater": "/wpi-class1-wastewater-flashcards",
  "wpi-class2-wastewater": "/wpi-class2-wastewater-flashcards",
  "wpi-class3-wastewater": "/wpi-class3-wastewater-flashcards",
  "wpi-class4-wastewater": "/wpi-class4-wastewater-flashcards",
};

const INDIVIDUAL: Product[] = [
  {
    key: "oit",
    name: "OIT Practice Pass",
    shortName: "OIT",
    description: "Operator-in-Training — foundation water treatment, safety, and Ontario regulations. Your first step toward a licensed career.",
    priceCAD: 5900,
    examTypes: ["oit"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    available: true,
    features: ["500+ practice questions", "Timed mock exam", "Formula sheet", "AI Tutor", "400+ flashcards", "📖 Module study notes"],
  },
  {
    key: "class1-water",
    name: "Class 1 Water Treatment",
    shortName: "Class 1 Water",
    description: "Coagulation, filtration, disinfection, CT values, and O. Reg. 128/04. Pass faster with Canada-specific AI explanations.",
    priceCAD: 14900,
    examTypes: ["class1-water"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0369A1",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    available: true,
    features: ["500 practice questions", "Timed mock exam", "Water1 formula sheet", "AI Tutor", "400+ flashcards", "📖 Module study notes"],
  },
  {
    key: "class2-water",
    name: "Class 2 Water Treatment",
    shortName: "Class 2 Water",
    description: "Advanced treatment processes, SCADA, corrosion control, membrane filtration, and process troubleshooting. Operators who pass Class 2 typically earn $70K–$90K.",
    priceCAD: 19900,
    examTypes: ["class2-water"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["500 practice questions", "Timed mock exam", "Water2 formula sheet", "AI Tutor", "400+ flashcards", "📖 Module study notes"],
  },
  {
    key: "class3-water",
    name: "Class 3 Water Treatment",
    shortName: "Class 3 Water",
    description: "Application-level exam prep: LSI, CT values, membranes, lime softening, SCADA, source water, and advanced process control. Class 3 operators earn $85K–$105K.",
    priceCAD: 34900,
    examTypes: ["class3-water"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    available: true,
    features: ["552 practice questions", "Timed mock exam", "Water3 formula sheet", "📖 Module study notes", "AI Tutor", "400+ flashcards"],
  },
  {
    key: "class4-water",
    name: "Class 4 Water Treatment",
    shortName: "Class 4 Water",
    description: "Chief operator-level exam prep: full system management, regulatory leadership, strategic operations, and emergency response. Class 4 chief operators earn $100K–$130K+.",
    priceCAD: 49900,
    examTypes: ["class4-water"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    available: true,
    features: ["500+ practice questions", "Timed mock exam", "Water4 formula sheet", "AI Tutor", "400+ flashcards"],
  },
  {
    key: "oit-ww",
    name: "OIT Wastewater Practice Pass",
    shortName: "OIT Wastewater",
    description: "Operator-in-Training Wastewater — collection systems, basic treatment, safety, and Ontario regulations. Your first step toward a licensed wastewater career.",
    priceCAD: 5900,
    examTypes: ["oit-ww"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    available: true,
    features: ["500+ practice questions", "Timed mock exam", "Formula sheet", "AI Tutor", "400+ flashcards", "📖 Module study notes"],
  },
  {
    key: "class1-ww",
    name: "Class 1 Wastewater Treatment",
    shortName: "Class 1 Wastewater",
    description: "Primary and secondary treatment, activated sludge, solids handling, and Ontario regulations. Pass faster with AI-explained step-by-step solutions.",
    priceCAD: 14900,
    examTypes: ["class1-ww"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    available: true,
    features: ["500+ practice questions", "Timed mock exam", "WW1 formula sheet", "AI Tutor", "400+ flashcards", "📖 Module study notes"],
  },
  {
    key: "class2-ww",
    name: "Class 2 Wastewater Treatment",
    shortName: "Class 2 Wastewater",
    description: "Advanced secondary treatment, nutrient removal, biosolids management, and process troubleshooting. Operators who pass Class 2 WW typically earn $70K–$90K.",
    priceCAD: 19900,
    examTypes: ["class2-ww"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#065F46",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    available: true,
    features: ["500+ practice questions", "Timed mock exam", "WW2 formula sheet", "AI Tutor", "400+ flashcards", "📖 Module study notes"],
  },
  {
    key: "class3-ww",
    name: "Class 3 Wastewater Treatment",
    shortName: "Class 3 Wastewater",
    description: "Advanced BNR, industrial pretreatment, biosolids, and regulatory compliance. Class 3 WW operators earn $85K–$105K.",
    priceCAD: 34900,
    examTypes: ["class3-ww"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#065F46",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    available: true,
    features: ["500+ practice questions", "Timed mock exam", "WW3 formula sheet", "📖 Module study notes", "AI Tutor", "400+ flashcards"],
  },
  {
    key: "class4-ww",
    name: "Class 4 Wastewater Treatment",
    shortName: "Class 4 Wastewater",
    description: "Plant superintendent level: BNR, MBR, biosolids, regulatory compliance, and emergency response. Class 4 WW superintendents earn $100K–$130K+.",
    priceCAD: 49900,
    examTypes: ["class4-ww"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#065F46",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    available: true,
    features: ["500+ practice questions", "Timed mock exam", "WW4 formula sheet", "AI Tutor", "400+ flashcards"],
  },
  {
    key: "wqa",
    name: "Water Quality Analyst Practice Pass",
    shortName: "WQA",
    description: "Water Quality Analyst exam prep — lab procedures, sampling, analytical methods, and Ontario regulations. WQA certification opens $65K–$85K analyst roles.",
    priceCAD: 17900,
    examTypes: ["wqa"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FDE68A",
    available: true,
    features: ["475 practice questions", "Timed mock exam", "Formula sheet", "AI Tutor", "400+ flashcards", "📖 Module study notes"],
  },
  {
    key: "wpi-class1-water",
    name: "WPI Class I Water Treatment Practice Pass",
    shortName: "WPI Class I Water",
    description: "WPI Class I Water Treatment — 502 questions covering treatment process, equipment O&M, lab analysis, and source water. Recognized by EOCP (BC), AWWOA (AB), SK, and MB.",
    priceCAD: 14900,
    examTypes: ["wpi-class1-water"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["502 practice questions", "Timed mock exam", "WPI formula sheet", "AI Tutor", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class2-water",
    name: "WPI Class II Water Treatment Practice Pass",
    shortName: "WPI Class II Water",
    description: "WPI Class II Water Treatment — 501 advanced questions across 5 modules. Covers advanced treatment processes, system design, lab monitoring, source water management, and regulations. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: 19900,
    examTypes: ["wpi-class2-water"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["501 advanced questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class3-water",
    name: "WPI Class III Water Treatment Practice Pass",
    shortName: "WPI Class III Water",
    description: "WPI Class III Water Treatment — 502 questions across 5 advanced modules. Covers ozone/UV disinfection, membrane filtration, advanced process control, distribution management, and regulatory QMS. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: 34900,
    examTypes: ["wpi-class3-water"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["502 advanced questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class4-water",
    name: "WPI Class IV Water Treatment Practice Pass",
    shortName: "WPI Class IV Water",
    description: "WPI Class IV Water Treatment — 501 questions across 6 chief-operator modules. Covers advanced CT/disinfection, membrane systems, plant management & leadership, asset management, regulatory compliance, and emergency response. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: 49900,
    examTypes: ["wpi-class4-water"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["501 chief-operator questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class1-wastewater",
    name: "WPI Class I Wastewater Treatment Practice Pass",
    shortName: "WPI Class I Wastewater",
    description: "WPI Class I Wastewater Treatment — 500 questions across 5 modules: Collection Systems, Primary & Secondary Treatment, Solids Handling & Biosolids, Lab & Monitoring, Safety & Regulations. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: 14900,
    examTypes: ["wpi-class1-wastewater"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["500 wastewater questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class2-wastewater",
    name: "WPI Class II Wastewater Treatment Practice Pass",
    shortName: "WPI Class II Wastewater",
    description: "WPI Class II Wastewater Treatment — 501 questions across 5 advanced modules: Secondary Treatment, Nutrient Removal, Biosolids Management, Advanced Treatment, and Process Control & Safety. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: 19900,
    examTypes: ["wpi-class2-wastewater"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["501 advanced WW questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class3-wastewater",
    name: "WPI Class III Wastewater Treatment Practice Pass",
    shortName: "WPI Class III Wastewater",
    description: "WPI Class III Wastewater Treatment — 501 questions across 8 senior-level modules: Advanced BNR, MBR, Industrial Pretreatment, Biosolids, Process Control, Regulatory Compliance, Safety, and Emerging Technologies. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: 34900,
    examTypes: ["wpi-class3-wastewater"],
    badge: "WPI Exam",
    badgeColor: "#1D4ED8",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    available: true,
    features: ["501 senior WW questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class4-wastewater",
    name: "WPI Class IV Wastewater Treatment Practice Pass",
    shortName: "WPI Class IV Wastewater",
    description: "WPI Class IV Wastewater Treatment — 502 questions across 7 chief-operator-level modules: Advanced Process Control, BNR & Resource Recovery, Emerging Technologies, Plant Management, Regulatory Compliance, Emergency Response, and Health & Safety. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: 49900,
    examTypes: ["wpi-class4-wastewater"],
    badge: "WPI Exam",
    badgeColor: "#6D28D9",
    color: "#6D28D9",
    bg: "#F5F3FF",
    border: "#C4B5FD",
    available: true,
    features: ["502 chief operator questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
];


// ─── Checkout button ──────────────────────────────────────────────────────────
function CheckoutButton({
  productKey,
  label,
  disabled,
  style,
}: {
  productKey: string;
  label: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const createSession = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err) => {
      console.error("[Checkout] Error:", err);
      setLoading(false);
      alert("Something went wrong. Please try again.");
    },
  });

  function handleClick() {
    if (disabled) return;
    const storedEmail = localStorage.getItem("echelon_trial_email") || "";
    if (storedEmail) {
      setLoading(true);
      createSession.mutate({
        productKey,
        email: storedEmail,
        origin: window.location.origin,
      });
    } else {
      setShowEmailInput(true);
    }
  }

  function handleEmailSubmit() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setLoading(true);
    setShowEmailInput(false);
    createSession.mutate({
      productKey,
      email,
      origin: window.location.origin,
    });
  }

  if (showEmailInput) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleEmailSubmit()}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1.5px solid #CBD5E1",
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
          }}
          autoFocus
        />
        <button
          onClick={handleEmailSubmit}
          style={{
            padding: "10px 0",
            borderRadius: 10,
            background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
            color: "#fff",
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            ...style,
          }}
        >
          Continue to Checkout →
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      style={{
        padding: "11px 0",
        borderRadius: 10,
        background: disabled
          ? "#E2E8F0"
          : "linear-gradient(135deg, #1D4ED8, #0E7490)",
        color: disabled ? "#94A3B8" : "#fff",
        border: "none",
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        width: "100%",
        transition: "opacity 0.15s",
        opacity: loading ? 0.7 : 1,
        ...style,
      }}
    >
      {loading ? "Redirecting…" : disabled ? "Coming Soon" : label}
    </button>
  );
}

// ─── Province config for the selector ───────────────────────────────────────
const PROVINCES = [
  { code: "ON", name: "Ontario", flag: "🍁", certBody: "MOECP / OWWCO", framework: "ontario" },
  { code: "BC", name: "British Columbia", flag: "🏔️", certBody: "EOCP", framework: "wpi" },
  { code: "AB", name: "Alberta", flag: "🛢️", certBody: "AWWOA", framework: "wpi" },
  { code: "SK", name: "Saskatchewan", flag: "🌾", certBody: "SAHO", framework: "wpi" },
  { code: "MB", name: "Manitoba", flag: "🦬", certBody: "MWWA", framework: "wpi" },
] as const;

type ProvinceCode = "ON" | "BC" | "AB" | "SK" | "MB";

// Province-specific label overrides for WPI provinces
const WPI_WATER_LABELS: Record<string, { shortName: string; description: string; badge?: string }> = {
  "oit": {
    shortName: "OIT",
    description: "Operator-in-Training — foundation water/wastewater treatment, safety, and provincial regulations.",
  },
  "class1-water": {
    shortName: "Level I / Class I",
    description: "WPI Class I Water Treatment — 502 questions covering treatment process, equipment O&M, lab analysis, and source water. Recognized by EOCP (BC), AWWOA (AB), SK, and MB.",
    badge: "WPI Exam",
  },
  "class2-water": {
    shortName: "Level II / Class II",
    description: "WPI Class II Water Treatment — advanced treatment processes, membrane filtration, and process troubleshooting.",
    badge: "WPI Exam",
  },
  "class3-water": {
    shortName: "Level III / Class III",
    description: "WPI Class III Water Treatment — senior operator level: LSI, CT values, membranes, lime softening, and advanced process control.",
    badge: "WPI Exam",
  },
  "class4-water": {
    shortName: "Level IV / Class IV",
    description: "WPI Class IV Water Treatment — chief operator level: full system management, regulatory leadership, and strategic operations.",
    badge: "WPI Exam",
  },
  "class1-ww": {
    shortName: "Level I / Class I WW",
    description: "WPI Class I Wastewater Treatment — collection systems, basic treatment, and provincial regulations.",
    badge: "WPI Exam",
  },
  "class2-ww": {
    shortName: "Level II / Class II WW",
    description: "WPI Class II Wastewater Treatment — activated sludge, nutrient removal, and advanced secondary treatment.",
    badge: "WPI Exam",
  },
  "class3-ww": {
    shortName: "Level III / Class III WW",
    description: "WPI Class III Wastewater Treatment — advanced biological treatment, BNR, and biosolids management.",
    badge: "WPI Exam",
  },
  "class4-ww": {
    shortName: "Level IV / Class IV WW",
    description: "WPI Class IV Wastewater Treatment — plant superintendent level: BNR, MBR, biosolids, regulatory compliance.",
    badge: "WPI Exam",
  },
};

// ─── Responsive styles injected once ────────────────────────────────────────
const PRICING_STYLES = `
  .pricing-page { font-family: Sora, Nunito, sans-serif; background: #F8FAFC; min-height: 100vh; }

  /* Nav */
  .pricing-nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255,255,255,0.97);
    border-bottom: 1px solid #E2E8F0;
    padding: 0 24px; height: 60px;
    display: flex; align-items: center; justify-content: space-between;
    backdrop-filter: blur(8px);
  }
  .pricing-nav-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; text-decoration: none; }
  .pricing-nav-logo span { font-weight: 800; font-size: 16px; color: #0F172A; letter-spacing: -0.3px; }
  .pricing-nav-actions { display: flex; gap: 12px; align-items: center; }
  .pricing-nav-back { color: #475569; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
  .pricing-nav-cta {
    padding: 7px 18px; border-radius: 8px;
    background: linear-gradient(135deg, #1D4ED8, #0E7490);
    color: #fff; border: none; font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: inherit; white-space: nowrap;
  }

  /* Hero */
  .pricing-hero {
    background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0E7490 100%);
    padding: 64px 24px 56px; text-align: center;
  }
  .pricing-hero-badge {
    display: inline-block;
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
    border-radius: 20px; padding: 5px 16px;
    color: #7DD3FC; font-size: 12px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px;
  }
  .pricing-hero h1 {
    font-size: clamp(26px, 5vw, 48px); font-weight: 900; color: #fff;
    margin: 0 0 16px; letter-spacing: -1px; line-height: 1.15;
  }
  .pricing-hero p {
    font-size: 16px; color: #94A3B8; max-width: 520px;
    margin: 0 auto 32px; line-height: 1.6;
  }

  /* Province selector */
  .province-selector { margin-bottom: 28px; }
  .province-selector-label {
    font-size: 12px; color: rgba(255,255,255,0.55); margin-bottom: 10px;
    font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .province-pills { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
  .province-pill {
    padding: 8px 14px; border-radius: 10px; cursor: pointer;
    font-size: 13px; font-family: inherit;
    display: flex; align-items: center; gap: 6px;
  }
  .province-wpi-tag {
    background: rgba(125,211,252,0.2); color: #7DD3FC;
    font-size: 9px; font-weight: 700; padding: 1px 6px;
    border-radius: 8px; letter-spacing: 0.04em;
  }
  .province-wpi-note {
    margin-top: 12px; display: inline-block;
    background: rgba(125,211,252,0.1); border: 1px solid rgba(125,211,252,0.3);
    border-radius: 10px; padding: 8px 16px; font-size: 12px; color: #7DD3FC;
  }

  /* Content area */
  .pricing-content { max-width: 1100px; margin: 0 auto; padding: 48px 20px 80px; }

  /* Section headers */
  .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .section-header h2 { font-size: 20px; font-weight: 800; color: #0F172A; margin: 0; }
  .section-bar { width: 4px; height: 28px; border-radius: 4px; flex-shrink: 0; }
  .section-badge {
    font-size: 11px; font-weight: 700; padding: 3px 10px;
    border-radius: 20px; border-width: 1px; border-style: solid;
  }

  /* Product grids — responsive */
  .product-grid-5 {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }
  .product-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .product-grid-1 {
    display: grid;
    grid-template-columns: minmax(0, 280px);
    gap: 16px;
  }

  /* Trust grid */
  .trust-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 16px; max-width: 900px; margin: 0 auto;
  }

  /* FAQ */
  .faq-item {
    padding: 16px 20px; background: #fff;
    border-radius: 10px; border: 1px solid #E2E8F0;
  }

  /* ── Tablet: 2–3 columns ── */
  @media (max-width: 900px) {
    .product-grid-5 { grid-template-columns: repeat(3, 1fr); }
    .product-grid-4 { grid-template-columns: repeat(2, 1fr); }
  }

  /* ── Mobile: 1–2 columns ── */
  @media (max-width: 600px) {
    .pricing-nav { padding: 0 16px; }
    .pricing-nav-logo span { font-size: 14px; }
    .pricing-nav-back { display: none; }

    .pricing-hero { padding: 40px 16px 36px; }
    .pricing-hero p { font-size: 14px; }

    .province-pill { padding: 7px 10px; font-size: 12px; }
    .province-wpi-note { font-size: 11px; padding: 6px 12px; text-align: left; }

    .pricing-content { padding: 28px 16px 60px; }

    .product-grid-5 { grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .product-grid-4 { grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .product-grid-1 { grid-template-columns: 1fr; }

    .trust-grid { grid-template-columns: repeat(2, 1fr); }

    .section-header h2 { font-size: 17px; }
    .faq-item { padding: 14px 16px; }
  }

  /* ── Very small: 1 column ── */
  @media (max-width: 380px) {
    .product-grid-5 { grid-template-columns: 1fr; }
    .product-grid-4 { grid-template-columns: 1fr; }
  }
`;

// ─── Main Pricing Page ────────────────────────────────────────────────────────
export default function Pricing() {
  usePageMeta({
    title: "Pricing — Echelon Institute",
    description:
      "Affordable Practice Passes for every Canadian water and wastewater operator certification level. OIT, Class 1–4 Water, Class 1–4 Wastewater, and WQA.",
  });

  const [selectedProvince, setSelectedProvince] = useState<ProvinceCode>("ON");
  const isWpi = selectedProvince !== "ON";
  const provinceInfo = PROVINCES.find(p => p.code === selectedProvince)!;

  return (
    <div className="pricing-page">
      <style>{PRICING_STYLES}</style>

      {/* ── Nav ── */}
      <nav className="pricing-nav">
        <Link href="/">
          <div className="pricing-nav-logo">
            <img
              src={LOGO_URL}
              alt="Echelon Institute"
              style={{ height: 36, width: "auto", objectFit: "contain" }}
            />
            <span>Echelon Institute</span>
          </div>
        </Link>
        <div className="pricing-nav-actions">
          <Link href="/">
            <span className="pricing-nav-back">← Back to Home</span>
          </Link>
          <Link href="/quiz">
            <button className="pricing-nav-cta">Try Free →</button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="pricing-hero">
        <div className="pricing-hero-badge">Canadian Water &amp; Wastewater Operator Certification</div>
        <h1>Invest in Your Certification.<br />Earn It Back in Your First Paycheck.</h1>
        <p>One-time payment. Unlimited practice. AI Tutor &amp; step-by-step solutions included.<br />Operators who pass Class 3–4 earn <strong>$85K–$130K+</strong>. Your pass costs less than one day's pay.</p>

        {/* Province selector */}
        <div className="province-selector">
          <div className="province-selector-label">Select Your Province</div>
          <div className="province-pills">
            {PROVINCES.map(p => (
              <button
                key={p.code}
                onClick={() => setSelectedProvince(p.code)}
                className="province-pill"
                style={{
                  border: selectedProvince === p.code
                    ? "2px solid #7DD3FC"
                    : "1.5px solid rgba(255,255,255,0.15)",
                  background: selectedProvince === p.code
                    ? "rgba(125,211,252,0.15)"
                    : "rgba(255,255,255,0.07)",
                  color: selectedProvince === p.code ? "#7DD3FC" : "rgba(255,255,255,0.7)",
                  fontWeight: selectedProvince === p.code ? 700 : 500,
                }}
              >
                <span>{p.flag}</span>
                <span>{p.name}</span>
                {p.framework === "wpi" && (
                  <span className="province-wpi-tag">WPI</span>
                )}
              </button>
            ))}
          </div>
          {isWpi && (
            <div className="province-wpi-note">
              <strong>{provinceInfo.certBody}</strong> — WPI standardized exams apply. All question banks are aligned with WPI Need-to-Know Criteria.
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="pricing-content">

        {/* Ontario header */}
        {!isWpi && (
          <div style={{ marginBottom: 32 }}>
            <div className="section-header">
              <div className="section-bar" style={{ background: "linear-gradient(180deg, #DC2626, #B91C1C)" }} />
              <h2>🍁 Ontario — MOECP / OWWCO</h2>
              <span className="section-badge" style={{ background: "#FEF2F2", color: "#B91C1C", borderColor: "#FECACA" }}>✓ Live</span>
            </div>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
              Ontario operator certification exams regulated by MOECP and administered by OWWCO. OIT through Class 4 Water &amp; Wastewater.
            </p>
          </div>
        )}

        {/* Water Treatment section */}
        <div style={{ marginBottom: 48 }}>
          <div className="section-header">
            <div className="section-bar" style={{ background: "linear-gradient(180deg, #1D4ED8, #0E7490)" }} />
            <h2>Water Treatment</h2>
          </div>
          {!isWpi && (
            <div className="product-grid-5">
              {INDIVIDUAL.filter(p => p.key === "oit" || (p.key.includes("-water") && !p.key.startsWith("wpi-"))).map(product => (
                <ProductCard key={product.key} product={product} isWpi={false} wpiLabel={undefined} />
              ))}
            </div>
          )}
          {isWpi && (
            <div className="product-grid-4">
              {INDIVIDUAL.filter(p => p.key.startsWith("wpi-") && p.key.includes("-water")).map(product => (
                <ProductCard key={product.key} product={product} isWpi={true} wpiLabel={WPI_WATER_LABELS[product.key]} />
              ))}
            </div>
          )}
        </div>

        {/* Wastewater section */}
        <div style={{ marginBottom: 48 }}>
          <div className="section-header">
            <div className="section-bar" style={{ background: "linear-gradient(180deg, #0F766E, #065F46)" }} />
            <h2>Wastewater Treatment</h2>
          </div>
          {!isWpi && (
            <div className="product-grid-5">
              {INDIVIDUAL.filter(p => p.key.includes("-ww") && !p.key.startsWith("wpi-")).map(product => (
                <ProductCard key={product.key} product={product} isWpi={false} wpiLabel={undefined} />
              ))}
            </div>
          )}
          {isWpi && (
            <div className="product-grid-4">
              {INDIVIDUAL.filter(p => p.key.startsWith("wpi-") && p.key.includes("-wastewater")).map(product => (
                <ProductCard key={product.key} product={product} isWpi={true} wpiLabel={WPI_WATER_LABELS[product.key]} />
              ))}
            </div>
          )}
        </div>

        {/* WQA section */}
        <div style={{ marginBottom: 48 }}>
          <div className="section-header">
            <div className="section-bar" style={{ background: "linear-gradient(180deg, #B45309, #92400E)" }} />
            <h2>Water Quality Analyst</h2>
          </div>
          <div className="product-grid-1">
            {INDIVIDUAL.filter(p => p.key === "wqa").map(product => (
              <ProductCard key={product.key} product={product} />
            ))}
          </div>
        </div>

        {/* WPI cross-sell section — shown on Ontario tab only */}
        {!isWpi && (
          <div style={{ marginBottom: 48 }}>
            <div className="section-header">
              <div className="section-bar" style={{ background: "linear-gradient(180deg, #0E7490, #0891B2)" }} />
              <h2>🌊 WPI — BC / AB / SK / MB</h2>
              <span className="section-badge" style={{ background: "#ECFEFF", color: "#0E7490", borderColor: "#A5F3FC" }}>✓ Live</span>
            </div>
            <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px", lineHeight: 1.5 }}>
              WPI standardized exams recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).
            </p>
            {/* WPI Water row */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 10px", flexWrap: "wrap" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#0E7490", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Water Treatment</p>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>· 2,000+ questions across Class I–IV</span>
              </div>
              <div className="product-grid-4">
                {INDIVIDUAL.filter(p => p.key.startsWith("wpi-") && p.key.includes("-water")).map(product => (
                  <ProductCard key={product.key} product={product} />
                ))}
              </div>
            </div>
            {/* WPI Wastewater row */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 10px", flexWrap: "wrap" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#0F766E", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Wastewater Treatment</p>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>· 2,000+ questions across Class I–IV</span>
              </div>
              <div className="product-grid-4">
                {INDIVIDUAL.filter(p => p.key.startsWith("wpi-") && p.key.includes("-wastewater")).map(product => (
                  <ProductCard key={product.key} product={product} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trust section */}
        <div
          style={{
            marginTop: 64,
            padding: "32px 20px",
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #E2E8F0",
            textAlign: "center",
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
            Everything you need to pass — included in every Practice Pass
          </h3>
          <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 8px" }}>
            One-time payment — access never expires. No subscription, no hidden fees.
          </p>
          <p style={{ color: "#94A3B8", fontSize: 12, margin: "0 0 24px" }}>
            8,500+ questions across Water Treatment, Wastewater, WQA, and WPI tracks. Canada-specific. AI-explained.
          </p>
          <div className="trust-grid">
            {[
              { icon: "📚", label: "8,500+ Questions" },
              { icon: "🤖", label: "AI Tutor Chat" },
              { icon: "📊", label: "Score History" },
              { icon: "🎯", label: "Adaptive Difficulty" },
              { icon: "🔁", label: "Unlimited Attempts" },
              { icon: "📐", label: "Formula Sheets" },
              { icon: "📱", label: "Mobile Friendly" },
            ].map(f => (
              <div
                key={f.label}
                style={{
                  padding: "16px 12px",
                  background: "#F8FAFC",
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 48 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 20 }}>
            Frequently Asked Questions
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                q: "Why are the prices higher than other prep courses?",
                a: "Because this isn't a video course — it's a career accelerator. Operators who pass Class 3 or Class 4 typically earn $85K–$130K+. Your Practice Pass costs less than one day's pay at that salary. We price based on outcome value, not content volume.",
              },
              {
                q: "Do the Practice Passes expire?",
                a: "No. Your access never expires. Pay once, practice as many times as you need until you pass.",
              },
              {
                q: "Are the questions based on real exam content?",
                a: "Yes. All questions are written by certified operators and aligned with OWWCO, EOCP, and provincial exam syllabi. Every calculation question includes a full step-by-step AI-explained solution.",
              },
              {
                q: "What makes Echelon different from free study materials?",
                a: "Free materials give you content. Echelon gives you adaptive practice, instant AI explanations for every wrong answer, timed mock exams that simulate the real thing, and a score history that shows exactly where to focus. The difference is passing vs. re-booking.",
              },
              {
                q: "What payment methods do you accept?",
                a: "All major credit and debit cards (Visa, Mastercard, Amex) via Stripe's secure checkout.",
              },
              {
                q: "Can I get a refund?",
                a: "We offer a 7-day money-back guarantee if you're not satisfied. Email support@echeloninstitute.ca.",
              },
              {
                q: "Which certification levels are available right now?",
                a: "All 11 courses are live: OIT Water, OIT Wastewater, Class 1–4 Water Treatment, and Class 1–4 Wastewater Treatment, plus WQA. Every course includes a practice quiz, timed mock exam, formula sheet, and AI Tutor.",
              },
            ].map(faq => (
              <div key={faq.q} className="faq-item">
                <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14, marginBottom: 6 }}>
                  {faq.q}
                </div>
                <div style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6 }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          background: "#0F172A",
          padding: "24px 20px",
          textAlign: "center",
          color: "#64748B",
          fontSize: 12,
        }}
      >
        © 2025 Echelon Institute. All rights reserved. · Payments secured by Stripe.
      </div>
    </div>
  );
}

// ─── Product Card ────────────────────────────────────────────────────────
function ProductCard({
  product,
  isWpi = false,
  wpiLabel,
}: {
  product: Product;
  isWpi?: boolean;
  wpiLabel?: { shortName: string; description: string; badge?: string };
}) {
  const displayName = isWpi && wpiLabel ? wpiLabel.shortName : product.shortName;
  const displayDesc = isWpi && wpiLabel ? wpiLabel.description : product.description;
  const displayBadge = isWpi && wpiLabel?.badge ? wpiLabel.badge : product.badge;
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: `1.5px solid ${product.border}`,
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {displayBadge && (
        <div
          style={{
            position: "absolute",
            top: -10,
            right: 14,
            background: isWpi && wpiLabel?.badge ? "#0E7490" : (product.badgeColor ?? "#1D4ED8"),
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 20,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {displayBadge}
        </div>
      )}

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: product.color,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 4,
          }}
        >
          Practice Pass
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
          {displayName}
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, margin: 0 }}>
        {displayDesc}
      </p>

      {product.features ? (
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 5 }}>
          {product.features.map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{
                width: 16, height: 16, borderRadius: "50%",
                background: product.bg, border: `1.5px solid ${product.color}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 9, color: product.color, fontWeight: 900,
              }}>✓</span>
              <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{f}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ flexGrow: 1 }} />
      )}

      <div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
          CA${(product.priceCAD / 100).toFixed(0)}
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>one-time · no subscription</div>
      </div>

      <CheckoutButton
        productKey={product.key}
        label={`Get ${product.shortName} Pass →`}
        disabled={!product.available}
      />
      {FLASHCARD_ROUTES[product.key] && (
        <Link href={FLASHCARD_ROUTES[product.key]}>
          <span style={{
            display: "block", textAlign: "center", fontSize: 12, fontWeight: 600,
            color: product.color, textDecoration: "none", padding: "4px 0",
            opacity: 0.75, cursor: "pointer",
          }}>
            🃏 Preview Flashcards
          </span>
        </Link>
      )}
    </div>
  );
}
