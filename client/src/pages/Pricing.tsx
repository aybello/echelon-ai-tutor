// Echelon Institute — Pricing Page
// Shows all individual Practice Passes
// Stripe Checkout integration via tRPC

import { useState, useEffect } from "react";
import { useProvince } from "@/hooks/useProvince";
import { useGeoRegion } from "@/hooks/useGeoRegion";
import { formatPriceUSD } from "@shared/products";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { getAnonymousAnalyticsId } from "@/lib/anonymousAnalytics";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/_core/hooks/useAuth";
import CheckoutContactModal from "@/components/CheckoutContactModal";
import LandingNav from "@/components/LandingNav";
import { ALL_PRODUCTS as SHARED_PRODUCTS } from "@shared/products";
import { getSubscriptionExamTypes, EXAM_LABELS } from "@/lib/examMeta";
import {
  getTeamTotalPriceCents,
  getTeamEffectiveSeatPriceCents,
  getTeamSavingsCents,
} from "@shared/teamPricing";
import { TEAMS_ALL_ACCESS_PRICE_CENTS } from "@shared/pricingCatalogue";

/** Helper: get the canonical CAD price from shared/products.ts by product key */
function sharedPrice(key: string): number {
  return SHARED_PRODUCTS.find(p => p.key === key)?.priceCAD ?? 0;
}
/** Helper: get the canonical USD price from shared/products.ts by product key */
function sharedPriceUSD(key: string): number {
  return SHARED_PRODUCTS.find(p => p.key === key)?.priceUSD ?? 0;
}

type SubscriptionTier = "class1" | "class2" | "class3" | "class4" | "all-access";
type SubscriptionProvince = "ontario" | "western";

interface SubTier {
  tier: SubscriptionTier;
  label: string;
  price: string;
  priceNum: number;
  tagline: string;
  features: string[];
  badge?: string;
  highlight?: boolean;
}

const SUB_TIERS_ONTARIO: SubTier[] = [
  { tier: "class1",     label: "Class 1",    price: "$99",  priceNum: 9900,  tagline: "OIT + Class 1 — all 4 tracks",         features: ["OIT Water & Wastewater", "Class 1 Water Treatment", "Class 1 Wastewater Treatment", "Class 1 Water Distribution", "Class 1 Wastewater Collection", "AI Tutor & Flashcards"] },
  { tier: "class2",     label: "Class 2",    price: "$149", priceNum: 14900, tagline: "Class 2 — all 4 tracks",              features: ["Class 2 Water Treatment", "Class 2 Wastewater Treatment", "Class 2 Water Distribution", "Class 2 Wastewater Collection", "AI Tutor & Flashcards"] },
  { tier: "class3",     label: "Class 3",    price: "$199", priceNum: 19900, tagline: "Class 3 — all 4 tracks",              features: ["Class 3 Water Treatment", "Class 3 Wastewater Treatment", "Class 3 Water Distribution", "Class 3 Wastewater Collection", "AI Tutor & Flashcards"] },
  { tier: "class4",     label: "Class 4",    price: "$249", priceNum: 24900, tagline: "Class 4 — all 4 tracks + WQA",        features: ["Class 4 Water Treatment", "Class 4 Wastewater Treatment", "Class 4 Water Distribution", "Class 4 Wastewater Collection", "WQA Exam Prep", "AI Tutor & Flashcards"] },
  { tier: "all-access", label: "All-Access", price: "$349", priceNum: 34900, tagline: "Every Ontario exam type — all classes", features: ["All classes (1 through 4)", "All 4 tracks: Water Treatment, Wastewater Treatment, Distribution & Collection", "WQA Exam Prep", "AI Tutor & Flashcards", "Unlimited attempts"], badge: "Best Value", highlight: true },
];

const SUB_TIERS_WPI: SubTier[] = [
  { tier: "class1",     label: "Class I",    price: "$149", priceNum: 14900, tagline: "Class I — all 4 WPI tracks",          features: ["Class I Water Treatment", "Class I Wastewater Treatment", "Class I Water Distribution", "Class I Wastewater Collection", "AI Tutor & Flashcards"] },
  { tier: "class2",     label: "Class II",   price: "$199", priceNum: 19900, tagline: "Class II — all 4 WPI tracks",         features: ["Class II Water Treatment", "Class II Wastewater Treatment", "Class II Water Distribution", "Class II Wastewater Collection", "AI Tutor & Flashcards"] },
  { tier: "class3",     label: "Class III",  price: "$249", priceNum: 24900, tagline: "Class III — all 4 WPI tracks",        features: ["Class III Water Treatment", "Class III Wastewater Treatment", "Class III Water Distribution", "Class III Wastewater Collection", "AI Tutor & Flashcards"] },
  { tier: "class4",     label: "Class IV",   price: "$299", priceNum: 29900, tagline: "Class IV — all 4 WPI tracks",         features: ["Class IV Water Treatment", "Class IV Wastewater Treatment", "Class IV Water Distribution", "Class IV Wastewater Collection", "AI Tutor & Flashcards"] },
  { tier: "all-access", label: "All-Access", price: "$399", priceNum: 39900, tagline: "Every WPI exam type — all classes",   features: ["All classes (I through IV)", "Water Treatment + Wastewater Treatment", "Water Distribution + Wastewater Collection", "AI Tutor & Flashcards", "Unlimited attempts"], badge: "Best Value", highlight: true },
];

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";

// ─── Product definitions ───────────────────────────────────────────────────────────────────────
// priceCAD is sourced from shared/products.ts via sharedPrice() — never hardcode prices here.
// UI-only fields (color, bg, border, badge, features) live here as presentation metadata.
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
const QUIZ_ROUTES: Record<string, string> = {
  "oit": "/quiz",
  "oit-ww": "/oit-ww-quiz",
  "class1-water": "/class1-water-quiz",
  "class1-ww": "/class1-ww-quiz",
  "class2-water": "/class2-water-quiz",
  "class2-ww": "/class2-ww-quiz",
  "class3-water": "/class3-water-quiz",
  "class3-ww": "/class3-ww-quiz",
  "class4-water": "/class4-water-quiz",
  "class4-ww": "/class4-ww-quiz",
  "class1-water-dist": "/class1-water-dist",
  "class2-water-dist": "/class2-water-dist",
  "class3-water-dist": "/class3-water-dist",
  "class4-water-dist": "/class4-water-dist",
  "class1-wastewater-coll": "/class1-wastewater-coll",
  "class2-wastewater-coll": "/class2-wastewater-coll",
  "class3-wastewater-coll": "/class3-wastewater-coll",
  "class4-wastewater-coll": "/class4-wastewater-coll",
  "wqa": "/wqa-quiz",
  "wpi-class1-water": "/wpi-class1-water",
  "wpi-class2-water": "/wpi-class2-water",
  "wpi-class3-water": "/wpi-class3-water",
  "wpi-class4-water": "/wpi-class4-water",
  "wpi-class1-wastewater": "/wpi-class1-wastewater",
  "wpi-class2-wastewater": "/wpi-class2-wastewater",
  "wpi-class3-wastewater": "/wpi-class3-wastewater",
  "wpi-class4-wastewater": "/wpi-class4-wastewater",
  "wpi-class1-water-dist": "/wpi-class1-water-dist",
  "wpi-class2-water-dist": "/wpi-class2-water-dist",
  "wpi-class3-water-dist": "/wpi-class3-water-dist",
  "wpi-class4-water-dist": "/wpi-class4-water-dist",
  "wpi-class1-water-coll": "/wpi-class1-water-coll",
  "wpi-class2-water-coll": "/wpi-class2-water-coll",
  "wpi-class3-water-coll": "/wpi-class3-water-coll",
  "wpi-class4-water-coll": "/wpi-class4-water-coll",
};

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
  "class1-water-dist": "/class1-water-dist-flashcards",
  "class2-water-dist": "/class2-water-dist-flashcards",
  "class3-water-dist": "/class3-water-dist-flashcards",
  "class4-water-dist": "/class4-water-dist-flashcards",
  "class1-wastewater-coll": "/class1-wastewater-coll-flashcards",
  "class2-wastewater-coll": "/class2-wastewater-coll-flashcards",
  "class3-wastewater-coll": "/class3-wastewater-coll-flashcards",
  "class4-wastewater-coll": "/class4-wastewater-coll-flashcards",
  "wqa": "/wqa-flashcards",
  "wpi-class1-water": "/wpi-class1-water-flashcards",
  "wpi-class2-water": "/wpi-class2-water-flashcards",
  "wpi-class3-water": "/wpi-class3-water-flashcards",
  "wpi-class4-water": "/wpi-class4-water-flashcards",
  "wpi-class1-wastewater": "/wpi-class1-wastewater-flashcards",
  "wpi-class2-wastewater": "/wpi-class2-wastewater-flashcards",
  "wpi-class3-wastewater": "/wpi-class3-wastewater-flashcards",
  "wpi-class4-wastewater": "/wpi-class4-wastewater-flashcards",
  "wpi-class1-water-dist": "/wpi-class1-water-dist-flashcards",
  "wpi-class2-water-dist": "/wpi-class2-water-dist-flashcards",
  "wpi-class3-water-dist": "/wpi-class3-water-dist-flashcards",
  "wpi-class4-water-dist": "/wpi-class4-water-dist-flashcards",
  "wpi-class1-water-coll": "/wpi-class1-water-coll-flashcards",
  "wpi-class2-water-coll": "/wpi-class2-water-coll-flashcards",
  "wpi-class3-water-coll": "/wpi-class3-water-coll-flashcards",
  "wpi-class4-water-coll": "/wpi-class4-water-coll-flashcards",
};

const INDIVIDUAL: Product[] = [
  {
    key: "oit",
    name: "OIT Practice Pass",
    shortName: "OIT",
    description: "Operator-in-Training — foundation water treatment, safety, and Ontario regulations. Your first step toward a licensed career.",
    priceCAD: sharedPrice("oit"),
    examTypes: ["oit"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "Formula sheet", "AI Tutor", "flashcards", "Module study notes"],
  },
  {
    key: "class1-water",
    name: "Class 1 Water Treatment",
    shortName: "Class 1 Water",
    description: "Coagulation, filtration, disinfection, CT values, and O. Reg. 128/04. Pass faster with Canada-specific AI explanations.",
    priceCAD: sharedPrice("class1-water"),
    examTypes: ["class1-water"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0369A1",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "Water1 formula sheet", "AI Tutor", "flashcards", "Module study notes"],
  },
  {
    key: "class2-water",
    name: "Class 2 Water Treatment",
    shortName: "Class 2 Water",
    description: "Advanced treatment processes, SCADA, corrosion control, membrane filtration, and process troubleshooting. Operators who pass Class 2 typically earn $70K–$90K.",
    priceCAD: sharedPrice("class2-water"),
    examTypes: ["class2-water"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "Water2 formula sheet", "AI Tutor", "flashcards", "Module study notes"],
  },
  {
    key: "class3-water",
    name: "Class 3 Water Treatment",
    shortName: "Class 3 Water",
    description: "Application-level exam prep: LSI, CT values, membranes, lime softening, SCADA, source water, and advanced process control. Class 3 operators earn $85K–$105K.",
    priceCAD: sharedPrice("class3-water"),
    examTypes: ["class3-water"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "Water3 formula sheet", "AI Tutor", "flashcards", "Module study notes"],
  },
  {
    key: "class4-water",
    name: "Class 4 Water Treatment",
    shortName: "Class 4 Water",
    description: "Chief operator-level exam prep: full system management, regulatory leadership, strategic operations, and emergency response. Class 4 chief operators earn $100K–$130K+.",
    priceCAD: sharedPrice("class4-water"),
    examTypes: ["class4-water"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#1E3A8A",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "Water4 formula sheet", "AI Tutor", "flashcards", "Module study notes"],
  },
  {
    key: "oit-ww",
    name: "OIT Wastewater Practice Pass",
    shortName: "OIT Wastewater",
    description: "Operator-in-Training Wastewater — collection systems, basic treatment, safety, and Ontario regulations. Your first step toward a licensed wastewater career.",
    priceCAD: sharedPrice("oit-ww"),
    examTypes: ["oit-ww"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "Formula sheet", "AI Tutor", "flashcards", "Module study notes"],
  },
  {
    key: "class1-ww",
    name: "Class 1 Wastewater Treatment",
    shortName: "Class 1 Wastewater",
    description: "Primary and secondary treatment, activated sludge, solids handling, and Ontario regulations. Pass faster with AI-explained step-by-step solutions.",
    priceCAD: sharedPrice("class1-ww"),
    examTypes: ["class1-ww"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "WW1 formula sheet", "AI Tutor", "flashcards", "Module study notes"],
  },
  {
    key: "class2-ww",
    name: "Class 2 Wastewater Treatment",
    shortName: "Class 2 Wastewater",
    description: "Advanced secondary treatment, nutrient removal, biosolids management, and process troubleshooting. Operators who pass Class 2 WW typically earn $70K–$90K.",
    priceCAD: sharedPrice("class2-ww"),
    examTypes: ["class2-ww"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#065F46",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "WW2 formula sheet", "AI Tutor", "flashcards", "Module study notes"],
  },
  {
    key: "class3-ww",
    name: "Class 3 Wastewater Treatment",
    shortName: "Class 3 Wastewater",
    description: "Advanced BNR, industrial pretreatment, biosolids, and regulatory compliance. Class 3 WW operators earn $85K–$105K.",
    priceCAD: sharedPrice("class3-ww"),
    examTypes: ["class3-ww"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#065F46",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "WW3 formula sheet", "AI Tutor", "flashcards", "Module study notes"],
  },
  {
    key: "class4-ww",
    name: "Class 4 Wastewater Treatment",
    shortName: "Class 4 Wastewater",
    description: "Plant superintendent level: BNR, MBR, biosolids, regulatory compliance, and emergency response. Class 4 WW superintendents earn $100K–$130K+.",
    priceCAD: sharedPrice("class4-ww"),
    examTypes: ["class4-ww"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#065F46",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "WW4 formula sheet", "AI Tutor", "flashcards", "Module study notes"],
  },
  {
    key: "class1-water-dist",
    name: "Class 1 Water Distribution Practice Pass",
    shortName: "Class 1 Distribution",
    description: "Pipe materials, valve operation, hydrant maintenance, and pressure management. OWWCO Class 1 aligned.",
    priceCAD: sharedPrice("class1-water-dist"),
    examTypes: ["class1-water-dist"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0369A1",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "AI Tutor", "Score history", "flashcards", "Ontario OWWCO"],
  },
  {
    key: "class2-water-dist",
    name: "Class 2 Water Distribution Practice Pass",
    shortName: "Class 2 Distribution",
    description: "System design, water main installation, cross-connection control, and distribution operations. OWWCO Class 2 aligned.",
    priceCAD: sharedPrice("class2-water-dist"),
    examTypes: ["class2-water-dist"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "AI Tutor", "Score history", "flashcards", "Ontario OWWCO"],
  },
  {
    key: "class3-water-dist",
    name: "Class 3 Water Distribution Practice Pass",
    shortName: "Class 3 Distribution",
    description: "Advanced hydraulics, system modelling, asset management, and distribution system planning. OWWCO Class 3 aligned.",
    priceCAD: sharedPrice("class3-water-dist"),
    examTypes: ["class3-water-dist"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#1E40AF",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "AI Tutor", "Score history", "flashcards", "Ontario OWWCO"],
  },
  {
    key: "class4-water-dist",
    name: "Class 4 Water Distribution Practice Pass",
    shortName: "Class 4 Distribution",
    description: "Strategic asset management, risk-based frameworks, KPIs, capital planning, and regulatory compliance. OWWCO Class 4 aligned.",
    priceCAD: sharedPrice("class4-water-dist"),
    examTypes: ["class4-water-dist"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#4C1D95",
    bg: "#F5F3FF",
    border: "#C4B5FD",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "AI Tutor", "Score history", "flashcards", "Ontario OWWCO"],
  },
  {
    key: "class1-wastewater-coll",
    name: "Class 1 Wastewater Collection Practice Pass",
    shortName: "Class 1 Collection",
    description: "Collection system basics, I/I identification, manhole inspection, and O. Reg. 129/04. OWWCO Class 1 aligned.",
    priceCAD: sharedPrice("class1-wastewater-coll"),
    examTypes: ["class1-wastewater-coll"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#065F46",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "AI Tutor", "Score history", "flashcards", "Ontario OWWCO"],
  },
  {
    key: "class2-wastewater-coll",
    name: "Class 2 Wastewater Collection Practice Pass",
    shortName: "Class 2 Collection",
    description: "Collection system design, sewer rehabilitation, pump station operations, and CSO management. OWWCO Class 2 aligned.",
    priceCAD: sharedPrice("class2-wastewater-coll"),
    examTypes: ["class2-wastewater-coll"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "AI Tutor", "Score history", "flashcards", "Ontario OWWCO"],
  },
  {
    key: "class3-wastewater-coll",
    name: "Class 3 Wastewater Collection Practice Pass",
    shortName: "Class 3 Collection",
    description: "Advanced hydraulics, CCTV inspection, force main design, and Long-Term Control Plans. OWWCO Class 3 aligned.",
    priceCAD: sharedPrice("class3-wastewater-coll"),
    examTypes: ["class3-wastewater-coll"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "AI Tutor", "Score history", "flashcards", "Ontario OWWCO"],
  },
  {
    key: "class4-wastewater-coll",
    name: "Class 4 Wastewater Collection Practice Pass",
    shortName: "Class 4 Collection",
    description: "Strategic system management, lifecycle cost optimization, green infrastructure, and regulatory compliance. OWWCO Class 4 aligned.",
    priceCAD: sharedPrice("class4-wastewater-coll"),
    examTypes: ["class4-wastewater-coll"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#6D28D9",
    bg: "#F5F3FF",
    border: "#C4B5FD",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "AI Tutor", "Score history", "flashcards", "Ontario OWWCO"],
  },
  {
    key: "wqa",
    name: "Water Quality Analyst Practice Pass",
    shortName: "WQA",
    description: "Water Quality Analyst exam prep — lab procedures, sampling, analytical methods, and Ontario regulations. WQA certification opens $65K–$85K analyst roles.",
    priceCAD: sharedPrice("wqa"),
    examTypes: ["wqa"],
    badge: "Available Now",
    badgeColor: "#16A34A",
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FDE68A",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "Formula sheet", "AI Tutor", "flashcards", "Module study notes"],
  },
  {
    key: "wpi-class1-water",
    name: "WPI Class I Water Treatment Practice Pass",
    shortName: "WPI Class I Water",
    description: "Treatment process, equipment O&M, lab analysis, and source water. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class1-water"),
    examTypes: ["wpi-class1-water"],
    badge: "WPI",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["400+ practice questions", "Timed mock exam", "WPI formula sheet", "AI Tutor", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class2-water",
    name: "WPI Class II Water Treatment Practice Pass",
    shortName: "WPI Class II Water",
    description: "Advanced treatment, system design, lab monitoring, and source water management. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class2-water"),
    examTypes: ["wpi-class2-water"],
    badge: "WPI",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["500 advanced questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class3-water",
    name: "WPI Class III Water Treatment Practice Pass",
    shortName: "WPI Class III Water",
    description: "Ozone/UV disinfection, membrane filtration, advanced process control, and regulatory QMS. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class3-water"),
    examTypes: ["wpi-class3-water"],
    badge: "WPI",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["500 advanced questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class4-water",
    name: "WPI Class IV Water Treatment Practice Pass",
    shortName: "WPI Class IV Water",
    description: "Chief-operator level: advanced CT/disinfection, plant management, asset management, and emergency response. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class4-water"),
    examTypes: ["wpi-class4-water"],
    badge: "WPI",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["500 chief-operator questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class1-wastewater",
    name: "WPI Class I Wastewater Treatment Practice Pass",
    shortName: "WPI Class I Wastewater",
    description: "Primary & secondary treatment, solids handling, biosolids, lab monitoring, and safety. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class1-wastewater"),
    examTypes: ["wpi-class1-wastewater"],
    badge: "WPI",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["500 wastewater questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class2-wastewater",
    name: "WPI Class II Wastewater Treatment Practice Pass",
    shortName: "WPI Class II Wastewater",
    description: "Nutrient removal, biosolids management, advanced treatment, and process control. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class2-wastewater"),
    examTypes: ["wpi-class2-wastewater"],
    badge: "WPI",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["500 advanced WW questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class3-wastewater",
    name: "WPI Class III Wastewater Treatment Practice Pass",
    shortName: "WPI Class III Wastewater",
    description: "Advanced BNR, MBR, industrial pretreatment, biosolids, and regulatory compliance. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class3-wastewater"),
    examTypes: ["wpi-class3-wastewater"],
    badge: "WPI",
    badgeColor: "#1D4ED8",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    available: true,
    features: ["500 senior WW questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class4-wastewater",
    name: "WPI Class IV Wastewater Treatment Practice Pass",
    shortName: "WPI Class IV Wastewater",
    description: "Chief-operator level: BNR & resource recovery, plant management, regulatory compliance, and emergency response. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class4-wastewater"),
    examTypes: ["wpi-class4-wastewater"],
    badge: "WPI",
    badgeColor: "#6D28D9",
    color: "#6D28D9",
    bg: "#F5F3FF",
    border: "#C4B5FD",
    available: true,
    features: ["500 chief operator questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class1-water-dist",
    name: "WPI Class I Water Distribution Practice Pass",
    shortName: "WPI Class I Distribution",
    description: "Pipe materials, pressure & flow, chlorine residual, valve & hydrant operation. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class1-water-dist"),
    examTypes: ["wpi-class1-water-dist"],
    badge: "WPI",
    badgeColor: "#0369A1",
    color: "#0369A1",
    bg: "#E0F2FE",
    border: "#BAE6FD",
    available: true,
    features: ["500 distribution questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class2-water-dist",
    name: "WPI Class II Water Distribution Practice Pass",
    shortName: "WPI Class II Distribution",
    description: "Hydraulic analysis, pressure zone design, water quality management, and cross-connection control. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class2-water-dist"),
    examTypes: ["wpi-class2-water-dist"],
    badge: "WPI",
    badgeColor: "#0F766E",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    available: true,
    features: ["500 distribution questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class3-water-dist",
    name: "WPI Class III Water Distribution Practice Pass",
    shortName: "WPI Class III Distribution",
    description: "Advanced hydraulic modelling, transmission main design, multi-zone systems, and SCADA. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class3-water-dist"),
    examTypes: ["wpi-class3-water-dist"],
    badge: "WPI",
    badgeColor: "#1E40AF",
    color: "#1E40AF",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    available: true,
    features: ["500 distribution questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class4-water-dist",
    name: "WPI Class IV Water Distribution Practice Pass",
    shortName: "WPI Class IV Distribution",
    description: "Large-scale system management, asset management, DWQMS implementation, and regulatory compliance. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class4-water-dist"),
    examTypes: ["wpi-class4-water-dist"],
    badge: "WPI",
    badgeColor: "#4C1D95",
    color: "#4C1D95",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    available: true,
    features: ["500 distribution questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class1-water-coll",
    name: "WPI Class I Wastewater Collection Practice Pass",
    shortName: "WPI Class I Collection",
    description: "Collection system components, lift station operation, confined space safety, and basic hydraulics. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class1-water-coll"),
    examTypes: ["wpi-class1-water-coll"],
    badge: "WPI",
    badgeColor: "#065F46",
    color: "#065F46",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    available: true,
    features: ["500 collection questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class2-water-coll",
    name: "WPI Class II Wastewater Collection Practice Pass",
    shortName: "WPI Class II Collection",
    description: "Advanced collection design, lift station operations, system rehabilitation, and hydraulics. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class2-water-coll"),
    examTypes: ["wpi-class2-water-coll"],
    badge: "WPI",
    badgeColor: "#1E3A5F",
    color: "#1E3A5F",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    available: true,
    features: ["500 collection questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class3-water-coll",
    name: "WPI Class III Wastewater Collection Practice Pass",
    shortName: "WPI Class III Collection",
    description: "Complex system operations, SCADA, advanced pump station engineering, and hydraulic modelling. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class3-water-coll"),
    examTypes: ["wpi-class3-water-coll"],
    badge: "WPI",
    badgeColor: "#7C3AED",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    available: true,
    features: ["500 collection questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
  {
    key: "wpi-class4-water-coll",
    name: "WPI Class IV Wastewater Collection Practice Pass",
    shortName: "WPI Class IV Collection",
    description: "System planning, capital improvement, utility management, and advanced regulatory compliance. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    priceCAD: sharedPrice("wpi-class4-water-coll"),
    examTypes: ["wpi-class4-water-coll"],
    badge: "WPI",
    badgeColor: "#7F1D1D",
    color: "#7F1D1D",
    bg: "#FEF2F2",
    border: "#FECACA",
    available: true,
    features: ["500 collection questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "flashcards"],
  },
];


// ─── Checkout button ──────────────────────────────────────────────────────────
function CheckoutButton({
  productKey,
  label,
  disabled,
  style,
  productName,
  priceLabel,
  currency = "cad",
}: {
  productKey: string;
  label: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  productName?: string;
  priceLabel?: string;
  currency?: "cad" | "usd";
}) {
  const [showModal, setShowModal] = useState(false);
  const createSession = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err) => {
      console.error("[Checkout] Error:", err);
      alert("Something went wrong. Please try again.");
    },
  });

  function handleClick() {
    if (disabled) return;
    setShowModal(true);
  }

  function handleContactSubmit(contact: { name: string; email: string; phone: string }) {
    // Save email to localStorage for access restoration
    try { localStorage.setItem("echelon_trial_email", contact.email); } catch {}
      createSession.mutate({
        productKey,
        email: contact.email,
        name: contact.name,
        phone: contact.phone,
        currency,
        visitorId: getAnonymousAnalyticsId(),
      });
  }

  return (
    <>
      {showModal && (
        <CheckoutContactModal
          productName={productName ?? label}
          priceLabel={priceLabel}
          prefillEmail={(() => { try { return localStorage.getItem("echelon_trial_email") ?? ""; } catch { return ""; } })()}
          onSubmit={handleContactSubmit}
          onClose={() => setShowModal(false)}
          isLoading={createSession.isPending}
        />
      )}
      <button
        onClick={handleClick}
        disabled={disabled || createSession.isPending}
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
          opacity: createSession.isPending ? 0.7 : 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          ...style,
        }}
      >
        {createSession.isPending ? "Redirecting…" : disabled ? "Coming Soon" : label}
      </button>
    </>
  );
}

// ─── Subscription Checkout Button ──────────────────────────────────────────
function SubscriptionCheckoutButton({
  tier,
  province,
  label,
  priceLabel,
  currency = "cad",
}: {
  tier: SubscriptionTier;
  province: SubscriptionProvince;
  label: string;
  priceLabel: string;
  currency?: "cad" | "usd";
}) {
  const [showModal, setShowModal] = useState(false);
  const createSubscription = trpc.stripe.createSubscriptionCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err) => {
      console.error("[Subscription Checkout] Error:", err);
      alert("Something went wrong. Please try again.");
    },
  });

  function handleContactSubmit(contact: { name: string; email: string; phone: string }) {
    try { localStorage.setItem("echelon_trial_email", contact.email); } catch {}
    // Read UTM params and referral source from URL search params
    const sp = new URLSearchParams(window.location.search);
    const utmSource = sp.get("utm_source") ?? undefined;
    const utmMedium = sp.get("utm_medium") ?? undefined;
    const utmCampaign = sp.get("utm_campaign") ?? undefined;
    const referralSource = sp.get("ref") ?? document.referrer?.split("/")[2] ?? undefined;
      createSubscription.mutate({
        tier,
        province,
        email: contact.email,
        name: contact.name,
        phone: contact.phone,
        utmSource,
        utmMedium,
        utmCampaign,
        referralSource,
        currency,
      });
  }

  // priceLabel is passed in from the parent (province-aware)

  return (
    <>
      {showModal && (
        <CheckoutContactModal
          productName={label}
          priceLabel={priceLabel}
          prefillEmail={(() => { try { return localStorage.getItem("echelon_trial_email") ?? ""; } catch { return ""; } })()}
          onSubmit={handleContactSubmit}
          onClose={() => setShowModal(false)}
          isLoading={createSubscription.isPending}
        />
      )}
      <button
        onClick={() => setShowModal(true)}
        disabled={createSubscription.isPending}
        style={{
          padding: "11px 0",
          borderRadius: 10,
          background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
          color: "#fff",
          border: "none",
          fontSize: 13,
          fontWeight: 700,
          cursor: createSubscription.isPending ? "wait" : "pointer",
          fontFamily: "inherit",
          width: "100%",
          opacity: createSubscription.isPending ? 0.7 : 1,
          marginTop: "auto",
        }}
      >
        {createSubscription.isPending ? "Redirecting…" : label}
      </button>
    </>
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
    description: "Treatment process, equipment O&M, lab analysis, and source water. EOCP (BC), AWWOA (AB), SAHO (SK), MWWA (MB).",
    badge: "WPI",
  },
  "class2-water": {
    shortName: "Level II / Class II",
    description: "WPI Class II Water Treatment — advanced treatment processes, membrane filtration, and process troubleshooting.",
    badge: "WPI",
  },
  "class3-water": {
    shortName: "Level III / Class III",
    description: "WPI Class III Water Treatment — senior operator level: LSI, CT values, membranes, lime softening, and advanced process control.",
    badge: "WPI",
  },
  "class4-water": {
    shortName: "Level IV / Class IV",
    description: "WPI Class IV Water Treatment — chief operator level: full system management, regulatory leadership, and strategic operations.",
    badge: "WPI",
  },
  "class1-ww": {
    shortName: "Level I / Class I WW",
    description: "WPI Class I Wastewater Treatment — collection systems, basic treatment, and provincial regulations.",
    badge: "WPI",
  },
  "class2-ww": {
    shortName: "Level II / Class II WW",
    description: "WPI Class II Wastewater Treatment — activated sludge, nutrient removal, and advanced secondary treatment.",
    badge: "WPI",
  },
  "class3-ww": {
    shortName: "Level III / Class III WW",
    description: "WPI Class III Wastewater Treatment — advanced biological treatment, BNR, and biosolids management.",
    badge: "WPI",
  },
  "class4-ww": {
    shortName: "Level IV / Class IV WW",
    description: "WPI Class IV Wastewater Treatment — plant superintendent level: BNR, MBR, biosolids, regulatory compliance.",
    badge: "WPI",
  },
};

// ─── Responsive styles injected once ────────────────────────────────────────
const PRICING_STYLES = `
  .pricing-page { font-family: 'Sora', sans-serif; background: #F8FAFC; min-height: 100vh; }

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
    grid-template-columns: minmax(0, 320px);
    gap: 16px;
    justify-content: center;
  }

  /* Trust grid */
  .trust-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 16px; max-width: 900px; margin: 0 auto;
  }


  /* ── Tablet: 2–3 columns ── */
  @media (max-width: 900px) {
    .product-grid-5 { grid-template-columns: repeat(3, 1fr); }
    .product-grid-4 { grid-template-columns: repeat(2, 1fr); }
  }

  /* ── Small mobile: force 1-col subscription grid ── */
  @media (max-width: 480px) {
    .pricing-sub-grid { grid-template-columns: 1fr !important; }
  }

  /* ── Mobile: 1 column ── */
  @media (max-width: 600px) {
    .pricing-nav { padding: 0 16px; }
    .pricing-nav-logo span { font-size: 14px; }
    .pricing-nav-back { display: none; }

    .pricing-hero { padding: 40px 16px 36px; }
    .pricing-hero p { font-size: 14px; }

    .province-pill { padding: 7px 10px; font-size: 12px; }
    .province-wpi-note { font-size: 11px; padding: 6px 12px; text-align: left; }

    .pricing-content { padding: 28px 16px 60px; }

    .product-grid-5 { grid-template-columns: 1fr; gap: 12px; }
    .product-grid-4 { grid-template-columns: 1fr; gap: 12px; }
    .product-grid-1 { grid-template-columns: 1fr; }

    .trust-grid { grid-template-columns: repeat(2, 1fr); }

    .section-header h2 { font-size: 17px; }
  }
`;

// ─── Main Pricing Page ────────────────────────────────────────────────────────
/** Seat calculator for Teams All-Access — shows graduated pricing */
function TeamSeatCalculator() {
  const [seats, setSeats] = useState(10);
  const BASE = TEAMS_ALL_ACCESS_PRICE_CENTS;

  // Delegated to the shared catalogue so this page, the Teams page and the
  // Stripe checkout can never quote three different numbers again.
  const totalCents = getTeamTotalPriceCents("ontario", "all-access", seats);
  const perSeatAvg = getTeamEffectiveSeatPriceCents("ontario", "all-access", seats);
  const savings = getTeamSavingsCents("ontario", "all-access", seats);
  const fmt = (c: number) => `CA$${(c / 100).toLocaleString("en-CA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <section style={{ maxWidth: 860, margin: "0 auto 52px", padding: 28, borderRadius: 18, background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)", color: "#fff" }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 25, margin: "0 0 6px", fontWeight: 900 }}>Teams All-Access</h2>
        <p style={{ maxWidth: 560, margin: "0 auto 20px", color: "#CBD5E1", fontSize: 14, lineHeight: 1.6 }}>
          Every course, every stream. One price per operator per year. Volume discounts applied automatically.
        </p>
      </div>

      {/* Seat slider */}
      <div style={{ maxWidth: 480, margin: "0 auto 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <label style={{ fontSize: 13, color: "#94A3B8", fontWeight: 700 }}>Operators</label>
          <span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{seats}</span>
        </div>
        <input
          type="range"
          min={5}
          max={100}
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#2563EB", cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B", marginTop: 4 }}>
          <span>5 (minimum)</span>
          <span>100</span>
        </div>
      </div>

      {/* Pricing result */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, maxWidth: 520, margin: "0 auto 20px" }}>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.06)", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, marginBottom: 4 }}>Per Operator</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{fmt(perSeatAvg)}</div>
          <div style={{ fontSize: 11, color: "#64748B" }}>/year</div>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.06)", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, marginBottom: 4 }}>Total</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{fmt(totalCents)}</div>
          <div style={{ fontSize: 11, color: "#64748B" }}>/year</div>
        </div>
        {savings > 0 && (
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(34,197,94,0.12)", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#4ADE80", fontWeight: 700, marginBottom: 4 }}>You Save</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#4ADE80" }}>{fmt(savings)}</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>vs. list price</div>
          </div>
        )}
      </div>

      {/* Volume bands */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {["1–9: list price", "10–24: 10% off", "25–49: 15% off", "50+: 20% off"].map((text) => (
          <span key={text} style={{ padding: "6px 10px", borderRadius: 20, background: "rgba(255,255,255,0.08)", color: "#E2E8F0", fontSize: 11, fontWeight: 700 }}>{text}</span>
        ))}
      </div>

      {/* Course Passes note + CTA */}
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 16px", color: "#94A3B8", fontSize: 13 }}>
          Need targeted exam prep instead? <strong style={{ color: "#E2E8F0" }}>Course Passes</strong> start at CA$29/operator for 3 months.
        </p>
        <Link href="/teams"><button style={{ cursor: "pointer", fontFamily: "inherit", border: "none", borderRadius: 10, padding: "13px 22px", background: "linear-gradient(135deg, #2563EB, #14B8A6)", color: "#fff", fontSize: 14, fontWeight: 800 }}>Build a Team Plan →</button></Link>
      </div>
    </section>
  );
}

export default function Pricing() {
  const { region: geoRegion, isUS } = useGeoRegion();
  const funnelAnalytics = trpc.funnelAnalytics.track.useMutation();
  usePageMeta({
    title: "Pricing — Echelon Institute",
    description: isUS
      ? "Affordable Practice Passes for US water and wastewater operators. WPI Class I–IV, all 4 streams. Start free."
      : "Affordable Practice Passes for every Canadian water and wastewater operator certification level. OIT, Class 1–4 Water, Class 1–4 Wastewater, and WQA.",
  });

  // Sync with the global province selector (useProvince hook)
  const { province: globalProvince } = useProvince();

  // Derive province code from global hook (used for syncing after user changes province)
  const globalProvinceCode: ProvinceCode =
    globalProvince === "bc" ? "BC"
    : globalProvince === "ab" ? "AB"
    : globalProvince === "sk" ? "SK"
    : globalProvince === "mb" ? "MB"
    : "ON";

  // /pricing always defaults to Ontario regardless of stored province.
  // Only ?tab=western or an explicit user click on the province selector switches to western.
  const [selectedProvince, setSelectedProvince] = useState<ProvinceCode>("ON");
  const isWpi = selectedProvince !== "ON";
  const provinceInfo = PROVINCES.find(p => p.code === selectedProvince)!;

  // Read ?tab=western from URL to pre-select the Western Canada subscription tab
  const searchString = useSearch();
  const tabParam = new URLSearchParams(searchString).get("tab") as SubscriptionProvince | null;

  // Derive subProvince from selectedProvince (Ontario → "ontario", WPI → "western")
  // Allow manual override via setSubProvince
  const derivedSubProvince: SubscriptionProvince = selectedProvince === "ON" ? "ontario" : "western";
  const [subProvinceOverride, setSubProvinceOverride] = useState<SubscriptionProvince | null>(
    tabParam === "western" ? "western" : null
  );
  const subProvince: SubscriptionProvince = subProvinceOverride ?? derivedSubProvince;

  // If ?tab=western is in the URL, pre-select BC so individual cards show WPI
  useEffect(() => {
    if (tabParam === "western") {
      setSelectedProvince("BC");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    funnelAnalytics.mutate({ event: "pricing_viewed", visitorId: getAnonymousAnalyticsId() });
  // A single page-view event is intentional; mutation identity is not a dependency.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the user picks a province in the top selector, clear any manual override
  const handleProvinceSelect = (code: ProvinceCode) => {
    setSelectedProvince(code);
    setSubProvinceOverride(null); // let it re-derive from the new province
  };

  // When the user manually clicks the subscription toggle, record the override
  const handleSubProvinceSelect = (p: SubscriptionProvince) => {
    setSubProvinceOverride(p);
  };

  // Do NOT sync selectedProvince from globalProvince on mount or change.
  // /pricing defaults to Ontario; only ?tab=western or explicit user action changes it.

  const [showIndividual, setShowIndividual] = useState(true);
  const [buyerType, setBuyerType] = useState<"individual" | "team">("individual");
  const [individualModel, setIndividualModel] = useState<"course" | "allAccess" | null>(null);
  const [selectedIndividualKey, setSelectedIndividualKey] = useState("");
  const [selectedAnnualTier, setSelectedAnnualTier] = useState<SubscriptionTier | "">("");

  // Active subscriptions — used to show "Your Current Plan" badge
  // Works for both OAuth users (isAuthenticated) and verified email-session users (OTP login)
  const { user, isAuthenticated } = useAuth();
  const { data: mySubsData } = trpc.stripe.getMySubscriptions.useQuery(
    undefined,
    { enabled: !!isAuthenticated }
  );
  const { data: emailSubsData } = trpc.stripe.getMySubscriptionsForEmailSession.useQuery(
    undefined,
    { enabled: !isAuthenticated } // only call when OAuth user is not present
  );
  const activeSubs = mySubsData?.subscriptions ?? emailSubsData?.subscriptions ?? [];
  // Build a Set of "tier:province" keys for O(1) lookup
  const activePlanKeys = new Set(
    activeSubs.map(s => `${s.tier}:${s.province}`)
  );
  const relevantIndividualProducts = INDIVIDUAL.filter(product =>
    product.available && (isWpi ? product.key.startsWith("wpi-") : !product.key.startsWith("wpi-"))
  );
  const selectedIndividualProduct = relevantIndividualProducts.find(product => product.key === selectedIndividualKey);
  const currentAnnualTiers = subProvince === "western" ? SUB_TIERS_WPI : SUB_TIERS_ONTARIO;
  const selectedAnnualSubscription = currentAnnualTiers.find(tier => tier.tier === selectedAnnualTier);

  return (
    <div className="pricing-page">
      <style>{PRICING_STYLES}</style>

      {/* ── Nav ── */}
      <LandingNav isAuthenticated={!!isAuthenticated} currentPath="/pricing" />

      {/* ── Hero ── */}
      <div className="pricing-hero">
        <div className="pricing-hero-badge">{isUS ? "US Water & Wastewater Operator Certification" : "Canadian Water & Wastewater Operator Certification"}</div>
        <h1>Invest in Your Certification.<br />Earn It Back in Your First Paycheck.</h1>
        <p>Choose a 12-month Individual Exam Pass for one certification course, or a Teams plan for multiple operators. Every paid pass includes unlimited practice during its term, the AI Tutor, and step-by-step solutions.<br />{isUS ? "Operators who pass Class III–IV earn $80K–$120K+." : "Operators who pass Class 3–4 earn $85K–$130K+."} Your preparation costs less than one day's pay.</p>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(240,253,244,0.15)", border: "1.5px solid rgba(134,239,172,0.5)",
          borderRadius: 10, padding: "10px 18px", marginTop: 12, marginBottom: 4,
        }}>
          <span style={{ fontSize: 16 }}>🎁</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#86EFAC" }}>Every course includes 15 free questions — no account or credit card needed</span>
        </div>

        {/* Province selector */}
        <div className="province-selector">
          <div className="province-selector-label">Select Your Province</div>
          <div className="province-pills">
            {PROVINCES.map(p => (
              <button
                key={p.code}
                onClick={() => handleProvinceSelect(p.code)}
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

        {/* ── Buyer-led pricing decision ── */}
        <section style={{ maxWidth: 860, margin: "0 auto 40px" }} aria-labelledby="pricing-path-heading">
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#64748B", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Step 1</p>
            <h2 id="pricing-path-heading" style={{ margin: "6px 0 0", color: "#0F172A", fontSize: 26, fontWeight: 900 }}>Who is buying access?</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <button
              type="button"
              onClick={() => {
                setBuyerType("individual");
                funnelAnalytics.mutate({ event: "buyer_path_selected", buyerType: "individual", visitorId: getAnonymousAnalyticsId() });
              }}
              style={{ textAlign: "left", cursor: "pointer", fontFamily: "inherit", padding: 22, borderRadius: 16, background: buyerType === "individual" ? "linear-gradient(135deg, #EFF6FF, #ECFEFF)" : "#fff", border: buyerType === "individual" ? "2px solid #2563EB" : "1.5px solid #E2E8F0", boxShadow: buyerType === "individual" ? "0 10px 24px rgba(37,99,235,0.12)" : "none" }}
            >
              <div style={{ fontSize: 25, marginBottom: 10 }}>👤</div>
              <div style={{ fontSize: 18, fontWeight: 850, color: "#0F172A" }}>For myself</div>
              <p style={{ margin: "6px 0 0", color: "#64748B", fontSize: 13, lineHeight: 1.5 }}>Choose one certification course with 12 months of individual access.</p>
              <div style={{ marginTop: 12, color: "#2563EB", fontSize: 13, fontWeight: 800 }}>Choose an Exam Pass →</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setBuyerType("team");
                funnelAnalytics.mutate({ event: "buyer_path_selected", buyerType: "team", visitorId: getAnonymousAnalyticsId() });
              }}
              style={{ textAlign: "left", cursor: "pointer", fontFamily: "inherit", padding: 22, borderRadius: 16, background: buyerType === "team" ? "linear-gradient(135deg, #F0FDFA, #ECFEFF)" : "#fff", border: buyerType === "team" ? "2px solid #0D9488" : "1.5px solid #E2E8F0", boxShadow: buyerType === "team" ? "0 10px 24px rgba(13,148,136,0.12)" : "none" }}
            >
              <div style={{ fontSize: 25, marginBottom: 10 }}>🏢</div>
              <div style={{ fontSize: 18, fontWeight: 850, color: "#0F172A" }}>For my team</div>
              <p style={{ margin: "6px 0 0", color: "#64748B", fontSize: 13, lineHeight: 1.5 }}>Buy targeted Course Passes or an annual training plan for operators.</p>
              <div style={{ marginTop: 12, color: "#0D9488", fontSize: 13, fontWeight: 800 }}>Choose team access →</div>
            </button>
          </div>

          {buyerType === "individual" && activeSubs.length > 0 && (
            <div style={{ marginTop: 20, padding: "16px 18px", background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12, color: "#166534", fontSize: 13 }}>
              Your existing subscription remains active and grandfathered. <Link href="/account"><strong>Manage it in your account →</strong></Link>
            </div>
          )}
        </section>

        {buyerType === "team" && (
          <TeamSeatCalculator />
        )}

        {/* ── Fix 13: Annual vs One-Time Comparison Table ── */}
        <div style={{ display: buyerType === "individual" && individualModel === "allAccess" ? "block" : "none", maxWidth: 760, margin: "0 auto 48px", padding: "0 4px" }}>
          <p style={{ textAlign: "center", fontSize: 15, color: "#475569", marginBottom: 20, lineHeight: 1.6 }}>
            Choose annual all-access for multiple courses, or buy one course with a one-time payment.
          </p>
          <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#fff" }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#0F172A", borderBottom: "1px solid #E2E8F0", width: "28%" }}></th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#7C3AED", borderBottom: "1px solid #E2E8F0" }}>Annual All-Access</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#0047AB", borderBottom: "1px solid #E2E8F0" }}>One-Time Course Pass</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Best for", "Operators studying several streams or levels", "One specific exam"],
                  ["Access", "Legacy plan terms", "One course for 12 months"],
                  ["Billing", "Renews annually until cancelled", "Single payment"],
                  ["Cancellation", "Stop renewal anytime; access continues through paid term", "Not applicable"],
                  ["Features", "Practice, mocks, flashcards, formulas, AI Tutor", "Same features for that course"],
                ].map(([label, annual, oneTime], i) => (
                  <tr key={label} style={{ background: i % 2 === 0 ? "#fff" : "#F8FAFC" }}>
                    <td style={{ padding: "11px 16px", fontWeight: 600, color: "#334155", borderBottom: "1px solid #F1F5F9" }}>{label}</td>
                    <td style={{ padding: "11px 16px", color: "#475569", borderBottom: "1px solid #F1F5F9" }}>{annual}</td>
                    <td style={{ padding: "11px 16px", color: "#475569", borderBottom: "1px solid #F1F5F9" }}>{oneTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* ── Annual Subscription Section ── */}
        <div style={{ display: buyerType === "individual" && individualModel === "allAccess" ? "block" : "none", marginBottom: 56 }}>
          <div className="section-header">
            <div className="section-bar" style={{ background: "linear-gradient(180deg, #7C3AED, #4F46E5)" }} />
            <h2>Annual All-Access Subscriptions</h2>
            <span className="section-badge" style={{ background: "#F5F3FF", color: "#7C3AED", borderColor: "#C4B5FD" }}>New</span>
          </div>
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px", lineHeight: 1.5 }}>
            {isUS
              ? "Subscribe annually and unlock every exam type for your class level. All four WPI tracks included: Water Treatment, Wastewater Treatment, Water Distribution, and Wastewater Collection. Prices in USD."
              : "Legacy annual plans remain active under their original terms. New individual access is available as a 12-month Exam Pass for one selected certification course."}
          </p>

          {/* Province toggle for subscriptions */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <button
              onClick={() => handleSubProvinceSelect("ontario")}
              style={{
                padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                background: subProvince === "ontario" ? "#EDE9FE" : "#F1F5F9",
                color: subProvince === "ontario" ? "#7C3AED" : "#64748B",
                border: subProvince === "ontario" ? "1.5px solid #C4B5FD" : "1.5px solid #E2E8F0",
              }}
            >
              🍁 Ontario (MOECP / OWWCO)
            </button>
            <button
              onClick={() => handleSubProvinceSelect("western")}
              style={{
                padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                background: subProvince === "western" ? "#ECFEFF" : "#F1F5F9",
                color: subProvince === "western" ? "#0E7490" : "#64748B",
                border: subProvince === "western" ? "1.5px solid #A5F3FC" : "1.5px solid #E2E8F0",
              }}
            >
              🏔️ Western Canada (WPI — BC, AB, SK, MB)
            </button>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="annual-tier-picker" style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 8 }}>Choose the level of all-access you need</label>
            <select
              id="annual-tier-picker"
              value={selectedAnnualTier}
              onChange={event => setSelectedAnnualTier(event.target.value as SubscriptionTier)}
              style={{ width: "100%", padding: "13px 14px", border: "1.5px solid #C4B5FD", borderRadius: 10, fontSize: 15, color: "#0F172A", background: "#fff", fontFamily: "inherit" }}
            >
              <option value="">Choose an annual option…</option>
              {currentAnnualTiers.map(tier => <option key={tier.tier} value={tier.tier}>{tier.label} All-Access — {tier.price}/year</option>)}
            </select>
          </div>

          {selectedAnnualSubscription ? (
            <div style={{ maxWidth: 520, margin: "0 auto 12px", background: selectedAnnualSubscription.highlight ? "linear-gradient(135deg, #F5F3FF, #EDE9FE)" : "#fff", border: selectedAnnualSubscription.highlight ? "2px solid #A78BFA" : "1.5px solid #E2E8F0", borderRadius: 16, padding: 24, textAlign: "left" }}>
              {selectedAnnualSubscription.badge && <div style={{ display: "inline-block", marginBottom: 10, padding: "4px 10px", borderRadius: 20, color: "#fff", background: "#7C3AED", fontSize: 10, fontWeight: 800, letterSpacing: "0.05em" }}>{selectedAnnualSubscription.badge}</div>}
              <div style={{ fontSize: 12, color: "#7C3AED", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>{selectedAnnualSubscription.label} All-Access</div>
              <div style={{ marginTop: 5, fontSize: 30, color: "#0F172A", fontWeight: 900 }}>{selectedAnnualSubscription.price}<span style={{ color: "#64748B", fontSize: 14, fontWeight: 600 }}>/year</span></div>
              <p style={{ margin: "8px 0 14px", color: "#475569", fontSize: 14 }}>{selectedAnnualSubscription.tagline}</p>
              <ul style={{ margin: "0 0 18px", paddingLeft: 18, color: "#334155", fontSize: 13, lineHeight: 1.8 }}>
                <li>All included certification tracks for this level</li>
                <li>Mock exams, flashcards, formulas, and AI Tutor</li>
                <li>12 months of access; cancel renewal anytime</li>
              </ul>
              <SubscriptionCheckoutButton tier={selectedAnnualSubscription.tier} province={subProvince} label={`Subscribe — ${selectedAnnualSubscription.price}/year`} priceLabel={`${selectedAnnualSubscription.price}/year`} currency={isUS ? "usd" : "cad"} />
            </div>
          ) : (
            <div style={{ padding: "24px", textAlign: "center", color: "#64748B", border: "1px dashed #CBD5E1", borderRadius: 12, background: "#F8FAFC" }}>Choose an annual option above to see one clear price and checkout option.</div>
          )}

          {(() => {
            const activeTiers = subProvince === "western" ? SUB_TIERS_WPI : SUB_TIERS_ONTARIO;
            return (
              <div className="pricing-sub-grid" style={{ display: "none", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
                {activeTiers.map(tier => {
                  const isActivePlan = activePlanKeys.has(`${tier.tier}:${subProvince}`);
                  return (
                    <div
                      key={tier.tier}
                      style={{
                        background: isActivePlan
                          ? "linear-gradient(135deg, #F0FDF4, #DCFCE7)"
                          : tier.highlight ? "linear-gradient(135deg, #F5F3FF, #EDE9FE)" : "#fff",
                        border: isActivePlan
                          ? "2px solid #86EFAC"
                          : tier.highlight ? "2px solid #A78BFA" : "1.5px solid #E2E8F0",
                        borderRadius: 14,
                        padding: "20px 18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        position: "relative",
                      }}
                    >
                      {isActivePlan ? (
                        <div style={{
                          position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                          background: "#16A34A", color: "#fff", fontSize: 10, fontWeight: 800,
                          padding: "3px 12px", borderRadius: 20, letterSpacing: "0.05em", whiteSpace: "nowrap",
                        }}>
                          ✓ Your Current Plan
                        </div>
                      ) : tier.badge ? (
                        <div style={{
                          position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                          background: "#7C3AED", color: "#fff", fontSize: 10, fontWeight: 800,
                          padding: "3px 12px", borderRadius: 20, letterSpacing: "0.05em", whiteSpace: "nowrap",
                        }}>
                          {tier.badge}
                        </div>
                      ) : null}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: isActivePlan ? "#15803D" : "#7C3AED", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                          {tier.label} All-Access
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                          {tier.price}
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#64748B" }}>/yr</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{tier.tagline}</div>
                      </div>
                      <ul style={{ margin: 0, padding: "0 0 0 14px", fontSize: 12, color: "#475569", lineHeight: 1.8 }}>
                        <li style={{ color: "#334155" }}>Water Treatment &amp; Wastewater Treatment</li>
                        <li style={{ color: "#334155" }}>Water Distribution &amp; Wastewater Collection</li>
                        {tier.tier === "class4" && subProvince === "ontario" && <li style={{ color: "#334155" }}>Water Quality Analyst (WQA)</li>}
                        {tier.tier === "all-access" && <li style={{ color: "#334155" }}>All classes — OIT through Class 4</li>}
                        <li style={{ color: "#7C3AED", fontWeight: 600 }}>+ AI Tutor, Flashcards &amp; Mock Exams</li>
                      </ul>
                      {isActivePlan ? (
                        <Link href="/account">
                          <button style={{
                            padding: "11px 0", borderRadius: 10,
                            background: "linear-gradient(135deg, #16A34A, #15803D)",
                            color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit", width: "100%", marginTop: "auto",
                          }}>
                            Manage Subscription →
                          </button>
                        </Link>
                      ) : (
                       <SubscriptionCheckoutButton
                          tier={tier.tier}
                          province={subProvince}
                          label={`Subscribe — ${tier.price}/yr`}
                          priceLabel={`${tier.price}/yr`}
                          currency={isUS ? "usd" : "cad"}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* ── Individual Practice Passes — collapsible ── */}
        <div style={{ display: buyerType === "individual" ? "block" : "none", marginTop: 24, marginBottom: 24 }}>
          <div style={{ padding: "18px 20px", background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 12 }}>
            <div style={{ fontSize: 17, fontWeight: 850, color: "#0F172A" }}>Choose your Individual Exam Pass</div>
            <p style={{ margin: "5px 0 0", color: "#475569", fontSize: 13 }}>Select the course that matches your upcoming exam. One-time payment; 12 months of access from purchase.</p>
          </div>
          {showIndividual && (
            <div style={{ marginTop: 8, padding: "4px 0" }}>
              <div style={{ margin: "20px 0 24px" }}>
                <label htmlFor="individual-course-picker" style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 8 }}>Select your jurisdiction, stream, and certification level</label>
                <select
                  id="individual-course-picker"
                  value={selectedIndividualKey}
                  onChange={e => {
                    setSelectedIndividualKey(e.target.value);
                    if (e.target.value) funnelAnalytics.mutate({ event: "product_selected", productKey: e.target.value, visitorId: getAnonymousAnalyticsId() });
                  }}
                  style={{ width: "100%", padding: "13px 14px", border: "1.5px solid #BFDBFE", borderRadius: 10, fontSize: 15, color: "#0F172A", background: "#fff", fontFamily: "inherit" }}
                >
                  <option value="">Choose your Course Pass…</option>
                  {relevantIndividualProducts.map(product => (
                    <option key={product.key} value={product.key}>{product.shortName} — CA${(product.priceCAD / 100).toFixed(0)}</option>
                  ))}
                </select>
                <p style={{ fontSize: 12, color: "#64748B", margin: "8px 0 0" }}>Your selected pass includes practice questions, mock exams, flashcards, study resources, and the AI Tutor for that course.</p>
              </div>

              {selectedIndividualProduct ? (
                <div className="product-grid-1" style={{ marginBottom: 24 }}>
                  <ProductCard
                    product={selectedIndividualProduct}
                    isWpi={isWpi}
                    wpiLabel={isWpi ? WPI_WATER_LABELS[selectedIndividualProduct.key] : undefined}
                    isUS={isUS}
                  />
                </div>
              ) : (
                <div style={{ padding: "24px", textAlign: "center", color: "#64748B", border: "1px dashed #CBD5E1", borderRadius: 12, background: "#F8FAFC" }}>
                  Pick your course above to see one clear price and your checkout option.
                </div>
              )}

              <div style={{ display: "none" }} aria-hidden="true">
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
              {INDIVIDUAL.filter(p => p.key.startsWith("wpi-") && p.key.includes("-water") && !p.key.includes("-water-dist") && !p.key.includes("-water-coll")).map(product => (
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

        {/* Water Distribution section — WPI only */}
        {isWpi && (
          <div style={{ marginBottom: 48 }}>
            <div className="section-header">
              <div className="section-bar" style={{ background: "linear-gradient(180deg, #0369A1, #0284C7)" }} />
              <h2>🚰 Water Distribution</h2>
            </div>
            <div className="product-grid-4">
              {INDIVIDUAL.filter(p => p.key.startsWith("wpi-") && p.key.includes("-water-dist")).map(product => (
                <ProductCard key={product.key} product={product} isWpi={true} wpiLabel={WPI_WATER_LABELS[product.key]} />
              ))}
            </div>
          </div>
        )}

        {/* Wastewater Collection section — WPI only */}
        {isWpi && (
          <div style={{ marginBottom: 48 }}>
            <div className="section-header">
              <div className="section-bar" style={{ background: "linear-gradient(180deg, #065F46, #047857)" }} />
              <h2>🔩 Wastewater Collection</h2>
            </div>
            <div className="product-grid-4">
              {INDIVIDUAL.filter(p => p.key.startsWith("wpi-") && p.key.includes("-water-coll")).map(product => (
                <ProductCard key={product.key} product={product} isWpi={true} wpiLabel={WPI_WATER_LABELS[product.key]} />
              ))}
            </div>
          </div>
        )}

        {/* WQA section */}
        <div style={{ marginBottom: 48 }}>
          <div className="section-header">
            <div className="section-bar" style={{ background: "linear-gradient(180deg, #B45309, #92400E)" }} />
            <h2>Water Quality Analyst</h2>
          </div>
          <div className="product-grid-1">
            {INDIVIDUAL.filter(p => p.key === "wqa").map(product => (
              <ProductCard key={product.key} product={product} isUS={isUS} />
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
                  <ProductCard key={product.key} product={product} isUS={isUS} />
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
                  <ProductCard key={product.key} product={product} isUS={isUS} />
                ))}
              </div>
            </div>
          </div>
        )}

              </div>

            </div>
          )}
        </div>

        {/* Trust section */}
        <div
          style={{
            display: buyerType === "individual" ? "block" : "none",
            marginTop: 64,
            padding: "32px 20px",
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #E2E8F0",
            textAlign: "center",
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
            Everything you need to pass — included with your Exam Pass
          </h3>
          <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 8px" }}>
            Individual Exam Passes are one-time purchases with no renewal. Grandfathered annual subscriptions continue through their paid term if renewal is cancelled.
          </p>
          <p style={{ color: "#94A3B8", fontSize: 12, margin: "0 0 24px" }}>
            18,000+ questions across Water Treatment, Wastewater, WQA, and WPI tracks. Canada-specific. AI-explained.
          </p>
          <div className="trust-grid">
            {[
              { icon: "📚", label: "18,000+ Questions" },
              { icon: "🤖", label: "AI Tutor Chat" },
              { icon: "📝", label: "Timed Mock Exam" },
              { icon: "🃏", label: "400+ Flashcards" },
              { icon: "📖", label: "Module Study Notes" },
              { icon: "💡", label: "AI Step-by-Step Explanations" },
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

      </div>

      {/* Teams / Utilities CTA */}
      <div
        style={{
          display: buyerType === "individual" ? "flex" : "none",
          marginTop: 48,
          background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)",
          borderRadius: 20,
          padding: "40px 28px",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 16,
          border: "1px solid rgba(99,179,237,0.2)",
        }}
      >
        <div style={{ fontSize: 36 }}>🏢</div>
        <h3 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.2 }}>
          Training a team of operators?
        </h3>
        <p style={{ color: "#94A3B8", fontSize: 14, margin: 0, maxWidth: 480, lineHeight: 1.6 }}>
          Utilities, municipalities, and training departments can purchase seats for their whole team.
          Each operator gets their own account — individual progress tracking, AI tutor access, and estimated study scores.
          Volume discounts begin at 10 annual operator licences.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
          {[
            { label: "10–24 licences", discount: "10% off" },
            { label: "25–49 licences", discount: "15% off" },
            { label: "50+ licences", discount: "20% off" },
          ].map(t => (
            <div key={t.label} style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              padding: "8px 16px",
              fontSize: 13,
              color: "#E2E8F0",
            }}>
              <span style={{ fontWeight: 700, color: "#63B3ED" }}>{t.discount}</span>
              {" "}{t.label}
            </div>
          ))}
        </div>
        <a
          href="/teams"
          style={{
            marginTop: 8,
            display: "inline-block",
            background: "#3B82F6",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            padding: "12px 28px",
            borderRadius: 10,
            textDecoration: "none",
            letterSpacing: 0.2,
          }}
        >
          View Team Plans →
        </a>
      </div>

      {/* FAQ Section */}
      <div style={{ marginTop: 64, maxWidth: 720, margin: "64px auto 0" }}>
        <h3 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", textAlign: "center", marginBottom: 8 }}>Frequently Asked Questions</h3>
        <p style={{ color: "#64748B", fontSize: 14, textAlign: "center", marginBottom: 32 }}>Everything you need to know before purchasing.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              q: "What does an Individual Exam Pass include?",
              a: "An Individual Exam Pass gives one learner 12 months of access to one selected certification course. It includes practice questions, AI Tutor, mock exams, flashcards, formulas, and study resources for that course."
            },
            {
              q: "What if I need access for several operators or courses?",
              a: "Choose a Teams plan. Course Passes provide one course for a named operator in 3-, 6-, or 12-month terms, while Teams All-Access covers every course for each named operator on an annual plan."
            },
            {
              q: "How do I access my passes after purchase?",
              a: "After checkout, you'll receive a Stripe receipt to your email. Visit echeloninstitute.ca/account and enter your purchase email to restore access on any device. You can also request a magic sign-in link from that page."
            },
            {
              q: "Can I use Echelon on my phone or tablet?",
              a: "Yes. Echelon is fully mobile-friendly and works on any modern browser — iOS Safari, Android Chrome, or desktop. No app download required."
            },
            {
              q: "What is your refund policy?",
              a: "We offer a 7-day refund for first-time purchases if you haven't completed more than 50 questions. Contact abello@echeloninstitute.ca with your purchase email and we'll process the refund promptly."
            },
            {
              q: "How do Teams / utility plans work?",
              a: "A manager purchases a seat plan and assigns individual operators to seats. Each operator gets their own access to the included courses, plus the manager gets a team dashboard showing estimated study scores, weak topics, and activity. Estimates are not official pass predictions. Volume discounts apply automatically at checkout."
            },
            {
              q: "Is Echelon affiliated with MOECP, OWWCO, EOCP, or WPI?",
              a: "No. Echelon Institute is an independent exam prep platform. We are not affiliated with, endorsed by, or the official certifying body for any provincial or national certification program. We help operators prepare — the official exams are administered by your provincial authority."
            },
            {
              q: "Can I cancel or get a refund?",
              a: "Individual Exam Passes are one-time purchases with 12 months of access — no renewal to cancel. If you have a legacy annual subscription, you can cancel renewal from your account page. Refund requests within 7 days of purchase can be sent to support@echeloninstitute.ca."
            },
          ].map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 32, padding: "20px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0" }}>
          <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 8px" }}>Still have questions?</p>
          <a href="mailto:abello@echeloninstitute.ca?subject=Pricing%20Question" style={{ color: "#3B82F6", fontWeight: 700, fontSize: 13 }}>Email abello@echeloninstitute.ca →</a>
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
          marginTop: 48,
        }}
      >
        © 2026 Echelon Institute. All rights reserved. · Payments secured by Stripe. · <a href="/account" style={{ color: "#94A3B8" }}>My Account</a> · <a href="mailto:abello@echeloninstitute.ca" style={{ color: "#94A3B8" }}>Support</a>
      </div>
    </div>
  );
}

// ─── Product Card ────────────────────────────────────────────────────────
function ProductCard({
  product,
  isWpi = false,
  wpiLabel,
  isUS = false,
}: {
  product: Product;
  isWpi?: boolean;
  wpiLabel?: { shortName: string; description: string; badge?: string };
  isUS?: boolean;
}) {
  const displayName = isWpi && wpiLabel ? wpiLabel.shortName : product.shortName;
  const displayDesc = isWpi && wpiLabel ? wpiLabel.description : product.description;
  const displayBadge = isWpi && wpiLabel?.badge ? wpiLabel.badge : product.badge;
  const displayBadgeColor = isWpi && wpiLabel?.badge ? "#0E7490" : (product.badgeColor ?? "#1D4ED8");

  // Extract question count from first feature bullet (e.g. "400+ practice questions" → "500 Q")
  const qMatch = product.features?.[0]?.match(/(\d[\d,]+)/);
  const questionCount = qMatch ? qMatch[1] : null;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: `1.5px solid ${product.border}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.10)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Coloured top accent bar */}
      <div style={{ height: 4, background: product.color, flexShrink: 0 }} />

      {/* Card body */}
      <div style={{ padding: "14px 16px 0", flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Header row: label tag + question count + badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{
            background: product.bg, color: product.color,
            fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
            letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0,
          }}>
            Practice Pass
          </span>
          <span style={{ flex: 1 }} />
          {questionCount && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: product.color,
              background: product.bg, borderRadius: 6, padding: "2px 8px", flexShrink: 0,
            }}>
              {questionCount} Q
            </span>
          )}
          {displayBadge && (
            <span style={{
              background: displayBadgeColor, color: "#fff",
              fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
              letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0,
            }}>
              {displayBadge}
            </span>
          )}
        </div>

        {/* Title + description */}
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: "0 0 6px", fontFamily: "Sora, sans-serif", lineHeight: 1.3 }}>
          {displayName}
        </h3>
        <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, margin: "0 0 10px" }}>
          {displayDesc}
        </p>

        {/* Feature pills */}
        {product.features && product.features.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
            {product.features.map(f => (
              <span key={f} style={{
                fontSize: 10, color: product.color, background: product.bg,
                borderRadius: 20, padding: "2px 8px", fontWeight: 500,
              }}>{f}</span>
            ))}
          </div>
        )}

        {/* Spacer pushes price + CTA to bottom */}
        <div style={{ flex: 1 }} />

        {/* Price row */}
        <div style={{
          borderTop: "1px solid #F1F5F9", paddingTop: 10, marginBottom: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
              {isUS
                ? `US$${(sharedPriceUSD(product.key) / 100).toFixed(0)}`
                : `CA$${(product.priceCAD / 100).toFixed(0)}`}
            </span>
            {product.available && (
              <span style={{
                marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#15803D",
                background: "#F0FDF4", border: "1px solid #86EFAC",
                borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap",
              }}>15 free ✓</span>
            )}
          </div>
          <span style={{
            display: "inline-block",
            fontSize: 11, color: "#64748B", fontWeight: 500,
            background: "#F8FAFC", border: "1px solid #E2E8F0",
            borderRadius: 20, padding: "2px 10px",
          whiteSpace: "nowrap",
          }}>One-time payment · 12 months access</span>
        </div>
      </div>

      {/* CTA footer */}
      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        <CheckoutButton
          productKey={product.key}
          label={`Get ${product.shortName} Pass →`}
          disabled={!product.available}
          productName={product.name}
          priceLabel={isUS ? `US$${(sharedPriceUSD(product.key) / 100).toFixed(0)}` : `CA$${(product.priceCAD / 100).toFixed(0)}`}
          currency={isUS ? "usd" : "cad"}
        />
        {product.available && QUIZ_ROUTES[product.key] && (
          <Link href={QUIZ_ROUTES[product.key]}>
            <button style={{
              width: "100%", padding: "9px",
              background: "transparent",
              color: "#64748B", border: "1px solid #E2E8F0",
              borderRadius: 10, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Try Free →
            </button>
          </Link>
        )}
        {FLASHCARD_ROUTES[product.key] && (
          <Link href={FLASHCARD_ROUTES[product.key]}>
            <span style={{
              display: "block", textAlign: "center", fontSize: 12, fontWeight: 600,
              color: product.color, textDecoration: "none", padding: "2px 0",
              opacity: 0.75, cursor: "pointer",
            }}>
              🃏 Preview Flashcards
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── FAQ Item ────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", lineHeight: 1.4 }}>{q}</span>
        <span style={{ fontSize: 18, color: "#94A3B8", flexShrink: 0, transform: open ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
      </button>
      {open && (
        <div style={{ padding: "0 20px 16px", fontSize: 13, color: "#64748B", lineHeight: 1.7, borderTop: "1px solid #F1F5F9" }}>
          <div style={{ paddingTop: 12 }}>{a}</div>
        </div>
      )}
    </div>
  );
}
