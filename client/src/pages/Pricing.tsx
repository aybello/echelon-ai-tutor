// Echelon Institute — Pricing Page
// Shows all 10 individual Practice Passes + 3 bundles
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

const INDIVIDUAL: Product[] = [
  {
    key: "oit",
    name: "OIT Practice Pass",
    shortName: "OIT",
    description: "Operator-in-Training — foundation water treatment, safety, and Ontario regulations.",
    priceCAD: 4900,
    examTypes: ["oit"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    available: true,
    features: ["500+ practice questions", "Timed mock exam", "Formula sheet", "AI Tutor"],
  },
  {
    key: "class1-water",
    name: "Class 1 Water Treatment",
    shortName: "Class 1 Water",
    description: "Coagulation, filtration, disinfection, CT values, and O. Reg. 128/04.",
    priceCAD: 7900,
    examTypes: ["class1-water"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0369A1",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    available: true,
    features: ["500 practice questions", "Timed mock exam", "Water1 formula sheet", "AI Tutor"],
  },
  {
    key: "class2-water",
    name: "Class 2 Water Treatment",
    shortName: "Class 2 Water",
    description: "Advanced treatment processes, SCADA, corrosion control, membrane filtration, and process troubleshooting.",
    priceCAD: 9900,
    examTypes: ["class2-water"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["500 practice questions", "Timed mock exam", "Water2 formula sheet", "AI Tutor"],
  },
  {
    key: "class3-water",
    name: "Class 3 Water Treatment",
    shortName: "Class 3 Water",
    description: "Application-level exam prep: LSI, CT values, membranes, lime softening, SCADA, source water, and advanced process control.",
    priceCAD: 12900,
    examTypes: ["class3-water"],
    badge: "New",
    badgeColor: "#1E40AF",
    color: "#1E40AF",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    available: true,
    features: ["500 practice questions", "Timed mock exam", "Class 3 Water formula sheet", "AI Tutor"],
  },
  {
    key: "class4-water",
    name: "Class 4 Water Treatment",
    shortName: "Class 4 Water",
    description: "Full system management, regulatory leadership, advanced treatment, and strategic operations for Class 4 Water operators.",
    priceCAD: 14900,
    examTypes: ["class4-water"],
    badge: "New",
    badgeColor: "#7C3AED",
    color: "#4C1D95",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    available: true,
    features: ["500 practice questions", "Timed mock exam", "Class 4 Water formula sheet", "AI Tutor"],
  },
  {
    key: "oit-ww",
    name: "OIT Wastewater Practice Pass",
    shortName: "OIT WW",
    description: "Operator-in-Training Wastewater — collection systems, basic treatment, safety, and Ontario O. Reg. 129/04.",
    priceCAD: 4900,
    examTypes: ["oit-ww"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#065F46",
    bg: "#F0FDFA",
    border: "#99F6E4",
    available: true,
    features: ["600+ practice questions", "Timed mock exam", "WW1 formula sheet", "AI Tutor"],
  },
  {
    key: "class1-ww",
    name: "Class 1 Wastewater",
    shortName: "Class 1 WW",
    description: "Wastewater characteristics, collection systems, basic treatment, and O. Reg. 129/04.",
    priceCAD: 7900,
    examTypes: ["class1-ww"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    available: true,
    features: ["500 practice questions", "Timed mock exam", "WW1 formula sheet", "AI Tutor"],
  },
  {
    key: "class2-ww",
    name: "Class 2 Wastewater",
    shortName: "Class 2 WW",
    description: "Activated sludge, nutrient removal, advanced secondary treatment, and process control.",
    priceCAD: 9900,
    examTypes: ["class2-ww"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    available: true,
    features: ["500 practice questions", "Timed mock exam", "WW2 formula sheet", "AI Tutor"],
  },
  {
    key: "class3-ww",
    name: "Class 3 Wastewater",
    shortName: "Class 3 WW",
    description: "Advanced biological treatment, BNR, biosolids management, and process optimization for Class 3 Wastewater operators.",
    priceCAD: 12900,
    examTypes: ["class3-ww"],
    badge: "New",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["502 practice questions", "Timed mock exam", "WW3 formula sheet", "AI Tutor"],
  },
  {
    key: "class4-ww",
    name: "Class 4 Wastewater",
    shortName: "Class 4 WW",
    description: "Plant superintendent level — BNR, MBR, biosolids, regulatory compliance, capital planning, and leadership.",
    priceCAD: 14900,
    examTypes: ["class4-ww"],
    badge: "New",
    badgeColor: "#0E7490",
    color: "#064E3B",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    available: true,
    features: ["500 practice questions", "Timed mock exam", "WW4 formula sheet", "AI Tutor"],
  },
  {
    key: "wqa",
    name: "WQA Practice Pass",
    shortName: "WQA",
    description: "Water Quality Analyst — lab techniques, sampling, QA/QC, and regulatory compliance.",
    priceCAD: 7900,
    examTypes: ["wqa"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FDE68A",
    available: true,
    features: ["300 practice questions", "Timed mock exam", "WQA formula sheet", "AI Tutor"],
  },
  // ── WPI (BC / AB / SK / MB) ──────────────────────────────────────────────
  {
    key: "wpi-class1-water",
    name: "WPI Class I Water Treatment Practice Pass",
    shortName: "WPI Class I Water",
    description: "WPI Class I Water Treatment — 502 questions across 5 modules. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB). Aligned with WPI Need-to-Know Criteria.",
    priceCAD: 7900,
    examTypes: ["wpi-class1-water"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["502 practice questions", "Timed mock exam", "WPI formula sheet", "AI Tutor", "BC / AB / SK / MB"],
  },
  {
    key: "wpi-class2-water",
    name: "WPI Class II Water Treatment Practice Pass",
    shortName: "WPI Class II Water",
    description: "WPI Class II Water Treatment — 501 advanced questions across 5 modules. Covers advanced treatment processes, system design, lab monitoring, source water management, and regulations. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: 9900,
    examTypes: ["wpi-class2-water"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["501 advanced questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB"],
  },
  {
    key: "wpi-class3-water",
    name: "WPI Class III Water Treatment Practice Pass",
    shortName: "WPI Class III Water",
    description: "WPI Class III Water Treatment — 502 questions across 5 advanced modules. Covers ozone/UV disinfection, membrane filtration, advanced process control, distribution management, and regulatory QMS. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: 12900,
    examTypes: ["wpi-class3-water"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["502 advanced questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB"],
  },
  {
    key: "wpi-class4-water",
    name: "WPI Class IV Water Treatment Practice Pass",
    shortName: "WPI Class IV Water",
    description: "WPI Class IV Water Treatment — 501 questions across 6 chief-operator modules. Covers advanced CT/disinfection, membrane systems, plant management & leadership, asset management, regulatory compliance, and emergency response. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: 12900,
    examTypes: ["wpi-class4-water"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["501 chief-operator questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB"],
  },
];

interface Bundle {
  key: string;
  name: string;
  tagline: string;
  description: string;
  priceCAD: number;
  savings: number;
  includes: string[];
  color: string;
  bg: string;
  border: string;
  badge?: string;
  badgeColor?: string;
}

const BUNDLES: Bundle[] = [
  {
    key: "bundle-water",
    name: "Water Treatment Full Ladder",
    tagline: "OIT + Class 1–4",
    description: "Every Water Treatment exam in one pass. Take your career from OIT all the way to Class 4.",
    priceCAD: 34900,
    savings: 15500,
    includes: ["OIT Practice Pass", "Class 1 Water Treatment", "Class 2 Water Treatment", "Class 3 Water Treatment", "Class 4 Water Treatment"],
    color: "#1D4ED8",
    bg: "linear-gradient(135deg, #EFF6FF, #F0F9FF)",
    border: "#BFDBFE",
  },
  {
    key: "bundle-ww",
    name: "Wastewater Full Ladder",
    tagline: "OIT WW + Class 1–4",
    description: "Complete Wastewater Treatment ladder — OIT WW through Class 4 in one bundle.",
    priceCAD: 29900,
    savings: 20700,
    includes: ["OIT Wastewater Practice Pass", "Class 1 Wastewater", "Class 2 Wastewater", "Class 3 Wastewater", "Class 4 Wastewater"],
    color: "#0F766E",
    bg: "linear-gradient(135deg, #F0FDFA, #ECFDF5)",
    border: "#99F6E4",
  },
  {
    key: "bundle-all",
    name: "Complete All Access",
    tagline: "All 14 Practice Passes",
    description: "Every exam on the platform — Water Treatment, Wastewater, and WQA. The ultimate prep bundle.",
    priceCAD: 59900,
    savings: 49000,
    includes: ["OIT Water", "OIT Wastewater", "Class 1–4 Water Treatment", "Class 1–4 Wastewater", "WQA"],
    color: "#7C3AED",
    bg: "linear-gradient(135deg, #F5F3FF, #EFF6FF)",
    border: "#DDD6FE",
    badge: "Best Value",
    badgeColor: "#7C3AED",
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
    // Try to get email from localStorage (set during quiz gate)
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

// ─── Main Pricing Page ────────────────────────────────────────────────────────
export default function Pricing() {
  usePageMeta({
    title: "Pricing — Echelon Institute",
    description:
      "Affordable Practice Passes for every Canadian water and wastewater operator certification level. OIT, Class 1–4 Water, Class 1–4 Wastewater, and WQA.",
  });

  const [activeTab, setActiveTab] = useState<"individual" | "bundles">("individual");
  const [selectedProvince, setSelectedProvince] = useState<ProvinceCode>("ON");
  const isWpi = selectedProvince !== "ON";
  const provinceInfo = PROVINCES.find(p => p.code === selectedProvince)!;

  return (
    <div
      style={{
        fontFamily: "Sora, Nunito, sans-serif",
        background: "#F8FAFC",
        minHeight: "100vh",
      }}
    >
      {/* ── Nav ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(255,255,255,0.97)",
          borderBottom: "1px solid #E2E8F0",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(8px)",
        }}
      >
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textDecoration: "none" }}>
            <img
              src={LOGO_URL}
              alt="Echelon Institute"
              style={{ height: 36, width: "auto", objectFit: "contain" }}
            />
            <span style={{ fontWeight: 800, fontSize: 16, color: "#0F172A", letterSpacing: "-0.3px" }}>
              Echelon Institute
            </span>
          </div>
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/">
            <span style={{ color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Back to Home</span>
          </Link>
          <Link href="/quiz">
            <button
              style={{
                padding: "7px 18px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                color: "#fff",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Try Free →
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0E7490 100%)",
          padding: "64px 24px 56px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 20,
            padding: "5px 16px",
            color: "#7DD3FC",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          Canadian Operator Certification Prep
        </div>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 900,
            color: "#fff",
            margin: "0 0 16px",
            letterSpacing: "-1px",
            lineHeight: 1.15,
          }}
        >
          Simple, Transparent Pricing
        </h1>
        <p
          style={{
            fontSize: 17,
            color: "#94A3B8",
            maxWidth: 520,
            margin: "0 auto 32px",
            lineHeight: 1.6,
          }}
        >
          One-time payment. Unlimited practice. AI Tutor included.
          No subscription, no hidden fees.
        </p>

        {/* Province selector */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Select Your Province
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {PROVINCES.map(p => (
              <button
                key={p.code}
                onClick={() => setSelectedProvince(p.code)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: selectedProvince === p.code
                    ? "2px solid #7DD3FC"
                    : "1.5px solid rgba(255,255,255,0.15)",
                  background: selectedProvince === p.code
                    ? "rgba(125,211,252,0.15)"
                    : "rgba(255,255,255,0.07)",
                  color: selectedProvince === p.code ? "#7DD3FC" : "rgba(255,255,255,0.7)",
                  fontSize: 13,
                  fontWeight: selectedProvince === p.code ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{p.flag}</span>
                <span>{p.name}</span>
                {p.framework === "wpi" && (
                  <span style={{
                    background: "rgba(125,211,252,0.2)",
                    color: "#7DD3FC",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 8,
                    letterSpacing: "0.04em",
                  }}>WPI</span>
                )}
              </button>
            ))}
          </div>
          {isWpi && (
            <div style={{
              marginTop: 12,
              display: "inline-block",
              background: "rgba(125,211,252,0.1)",
              border: "1px solid rgba(125,211,252,0.3)",
              borderRadius: 10,
              padding: "8px 16px",
              fontSize: 12,
              color: "#7DD3FC",
            }}>
              <strong>{provinceInfo.certBody}</strong> — WPI standardized exams apply. All question banks are aligned with WPI Need-to-Know Criteria.
            </div>
          )}
        </div>

        {/* Tab toggle */}
        <div
          style={{
            display: "inline-flex",
            background: "rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 4,
            gap: 4,
          }}
        >
          {(["individual", "bundles"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 24px",
                borderRadius: 9,
                border: "none",
                background: activeTab === tab ? "#fff" : "transparent",
                color: activeTab === tab ? "#0F172A" : "rgba(255,255,255,0.7)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
                textTransform: "capitalize",
              }}
            >
              {tab === "individual" ? "Individual Passes" : "Save with Bundles"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>
        {activeTab === "individual" ? (
          <>
            {/* Water Treatment section */}
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div
                  style={{
                    width: 4,
                    height: 28,
                    borderRadius: 4,
                    background: "linear-gradient(180deg, #1D4ED8, #0E7490)",
                  }}
                />
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  Water Treatment
                </h2>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 16,
                }}
              >
                {INDIVIDUAL.filter(p => p.key === "oit" || p.key.includes("-water")).map(product => (
                  <ProductCard key={product.key} product={product} isWpi={isWpi} wpiLabel={WPI_WATER_LABELS[product.key]} />
                ))}
              </div>
            </div>

            {/* Wastewater section */}
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div
                  style={{
                    width: 4,
                    height: 28,
                    borderRadius: 4,
                    background: "linear-gradient(180deg, #0F766E, #065F46)",
                  }}
                />
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  Wastewater Treatment
                </h2>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 16,
                }}
              >
                {INDIVIDUAL.filter(p => p.key.includes("-ww")).map(product => (
                  <ProductCard key={product.key} product={product} isWpi={isWpi} wpiLabel={WPI_WATER_LABELS[product.key]} />
                ))}
              </div>
            </div>

            {/* WQA section */}
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div
                  style={{
                    width: 4,
                    height: 28,
                    borderRadius: 4,
                    background: "linear-gradient(180deg, #B45309, #92400E)",
                  }}
                />
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  Water Quality Analyst
                </h2>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 16,
                }}
              >
                {INDIVIDUAL.filter(p => p.key === "wqa").map(product => (
                  <ProductCard key={product.key} product={product} />
                ))}
              </div>
            </div>

            {/* WPI section */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div
                  style={{
                    width: 4,
                    height: 28,
                    borderRadius: 4,
                    background: "linear-gradient(180deg, #0E7490, #0891B2)",
                  }}
                />
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  🌊 WPI — BC / AB / SK / MB
                </h2>
                <span style={{
                  background: "#ECFEFF",
                  color: "#0E7490",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 20,
                  border: "1px solid #A5F3FC",
                }}>✓ Live</span>
              </div>
              <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px", lineHeight: 1.5 }}>
                WPI standardized exams recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 16,
                }}
              >
                {INDIVIDUAL.filter(p => p.key.startsWith("wpi-")).map(product => (
                  <ProductCard key={product.key} product={product} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {BUNDLES.map(bundle => (
              <BundleCard key={bundle.key} bundle={bundle} />
            ))}
          </div>
        )}

        {/* Trust section */}
        <div
          style={{
            marginTop: 64,
            padding: "32px 24px",
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #E2E8F0",
            textAlign: "center",
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
            What's included with every Practice Pass
          </h3>
          <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 8px" }}>
            One-time payment — access never expires
          </p>
          <p style={{ color: "#94A3B8", fontSize: 12, margin: "0 0 24px" }}>
            5,000+ questions across Water Treatment, Wastewater, WQA, and WPI tracks
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 16,
              maxWidth: 900,
              margin: "0 auto",
            }}
          >
            {[
              { icon: "📚", label: "5,000+ Questions" },
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
                q: "Do the Practice Passes expire?",
                a: "No. Your access never expires. Pay once, practice as many times as you need.",
              },
              {
                q: "Are the questions based on real exam content?",
                a: "Yes. All questions are written by certified operators and aligned with OWWCO, EOCP, and provincial exam syllabi.",
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
              <div
                key={faq.q}
                style={{
                  padding: "16px 20px",
                  background: "#fff",
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                }}
              >
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
          padding: "24px",
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
        padding: "20px 18px",
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
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
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
        <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
          CA${(product.priceCAD / 100).toFixed(0)}
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>one-time · no subscription</div>
      </div>

      <CheckoutButton
        productKey={product.key}
        label={`Get ${product.shortName} Pass →`}
        disabled={!product.available}
      />
    </div>
  );
}

// ─── Bundle Card ──────────────────────────────────────────────────────────────
function BundleCard({ bundle }: { bundle: Bundle }) {
  return (
    <div
      style={{
        background: bundle.bg,
        borderRadius: 16,
        border: `2px solid ${bundle.border}`,
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        position: "relative",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      }}
    >
      {bundle.badge && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: bundle.badgeColor ?? "#7C3AED",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 16px",
            borderRadius: 20,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {bundle.badge}
        </div>
      )}

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: bundle.color,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 4,
          }}
        >
          {bundle.tagline}
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>
          {bundle.name}
        </div>
      </div>

      <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>
        {bundle.description}
      </p>

      <div>
        <div style={{ fontSize: 11, color: "#64748B", marginBottom: 8, fontWeight: 600 }}>
          Includes:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {bundle.includes.map(item => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#334155" }}>
              <span style={{ color: bundle.color, fontWeight: 700 }}>✓</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.7)",
          borderRadius: 10,
          padding: "12px 16px",
          border: `1px solid ${bundle.border}`,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
          CA${(bundle.priceCAD / 100).toFixed(0)}
        </div>
        <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 700, marginTop: 4 }}>
          Save CA${(bundle.savings / 100).toFixed(0)} vs buying individually
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>one-time · no subscription</div>
      </div>

      <CheckoutButton
        productKey={bundle.key}
        label={`Get ${bundle.name} →`}
        style={{ background: `linear-gradient(135deg, ${bundle.color}, #0E7490)` }}
      />
    </div>
  );
}
