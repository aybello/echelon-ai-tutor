// Echelon Institute — Pricing Page
// Shows all individual Practice Passes
// Stripe Checkout integration via tRPC

import { useState, useEffect } from "react";
import { useProvince } from "@/hooks/useProvince";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/_core/hooks/useAuth";
import CheckoutContactModal from "@/components/CheckoutContactModal";
import LandingNav from "@/components/LandingNav";
import { ALL_PRODUCTS as SHARED_PRODUCTS } from "@shared/products";

/** Helper: get the canonical price from shared/products.ts by product key */
function sharedPrice(key: string): number {
  return SHARED_PRODUCTS.find(p => p.key === key)?.priceCAD ?? 0;
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
  { tier: "class1",     label: "Class 1",    price: "$99",  priceNum: 9900,  tagline: "OIT + Class 1 Water & Wastewater",  features: ["OIT Water & Wastewater", "Class 1 Water Treatment", "Class 1 Wastewater Treatment", "AI Tutor & Flashcards", "Mock Exams & Score History"] },
  { tier: "class2",     label: "Class 2",    price: "$149", priceNum: 14900, tagline: "Class 2 Water & Wastewater",         features: ["Class 2 Water Treatment", "Class 2 Wastewater Treatment", "AI Tutor & Flashcards", "Mock Exams & Score History"] },
  { tier: "class3",     label: "Class 3",    price: "$199", priceNum: 19900, tagline: "Class 3 Water & Wastewater",         features: ["Class 3 Water Treatment", "Class 3 Wastewater Treatment", "AI Tutor & Flashcards", "Mock Exams & Score History"] },
  { tier: "class4",     label: "Class 4",    price: "$249", priceNum: 24900, tagline: "Class 4 Water & Wastewater + WQA",   features: ["Class 4 Water Treatment", "Class 4 Wastewater Treatment", "WQA Exam Prep", "AI Tutor & Flashcards", "Mock Exams & Score History"] },
  { tier: "all-access", label: "All-Access", price: "$349", priceNum: 34900, tagline: "Every Ontario exam type — all classes", features: ["All classes (1 through 4)", "Water Treatment + Wastewater Treatment", "WQA Exam Prep", "AI Tutor & Flashcards", "Unlimited attempts"], badge: "Best Value", highlight: true },
];

const SUB_TIERS_WPI: SubTier[] = [
  { tier: "class1",     label: "Class I",    price: "$149", priceNum: 14900, tagline: "Class I — all 4 WPI tracks",          features: ["Class I Water Treatment", "Class I Wastewater Treatment", "Class I Water Distribution", "Class I Wastewater Collection", "AI Tutor & Flashcards"] },
  { tier: "class2",     label: "Class II",   price: "$199", priceNum: 19900, tagline: "Class II — all 4 WPI tracks",         features: ["Class II Water Treatment", "Class II Wastewater Treatment", "Class II Water Distribution", "Class II Wastewater Collection", "AI Tutor & Flashcards"] },
  { tier: "class3",     label: "Class III",  price: "$249", priceNum: 24900, tagline: "Class III — all 4 WPI tracks",        features: ["Class III Water Treatment", "Class III Wastewater Treatment", "Class III Water Distribution", "Class III Wastewater Collection", "AI Tutor & Flashcards"] },
  { tier: "class4",     label: "Class IV",   price: "$299", priceNum: 29900, tagline: "Class IV — all 4 WPI tracks",         features: ["Class IV Water Treatment", "Class IV Wastewater Treatment", "Class IV Water Distribution", "Class IV Wastewater Collection", "AI Tutor & Flashcards"] },
  { tier: "all-access", label: "All-Access", price: "$449", priceNum: 44900, tagline: "Every WPI exam type — all classes",   features: ["All classes (I through IV)", "Water Treatment + Wastewater Treatment", "Water Distribution + Wastewater Collection", "AI Tutor & Flashcards", "Unlimited attempts"], badge: "Best Value", highlight: true },
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
    features: ["500 practice questions", "Timed mock exam", "Formula sheet", "AI Tutor", "400+ flashcards", "Module study notes"],
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
    features: ["500 practice questions", "Timed mock exam", "Water1 formula sheet", "AI Tutor", "400+ flashcards", "Module study notes"],
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
    features: ["500 practice questions", "Timed mock exam", "Water2 formula sheet", "AI Tutor", "400+ flashcards", "Module study notes"],
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
    features: ["500 practice questions", "Timed mock exam", "Water3 formula sheet", "Module study notes", "AI Tutor", "400+ flashcards"],
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
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    available: true,
    features: ["500 practice questions", "Timed mock exam", "Water4 formula sheet", "AI Tutor", "400+ flashcards"],
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
    features: ["500 practice questions", "Timed mock exam", "Formula sheet", "AI Tutor", "400+ flashcards", "Module study notes"],
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
    features: ["500 practice questions", "Timed mock exam", "WW1 formula sheet", "AI Tutor", "400+ flashcards", "Module study notes"],
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
    features: ["500 practice questions", "Timed mock exam", "WW2 formula sheet", "AI Tutor", "400+ flashcards", "Module study notes"],
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
    features: ["500 practice questions", "Timed mock exam", "WW3 formula sheet", "Module study notes", "AI Tutor", "400+ flashcards"],
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
    features: ["500 practice questions", "Timed mock exam", "WW4 formula sheet", "AI Tutor", "400+ flashcards"],
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
    features: ["500 practice questions", "Timed mock exam", "Formula sheet", "AI Tutor", "400+ flashcards", "Module study notes"],
  },
  {
    key: "wpi-class1-water",
    name: "WPI Class I Water Treatment Practice Pass",
    shortName: "WPI Class I Water",
    description: "WPI Class I Water Treatment — 500 questions covering treatment process, equipment O&M, lab analysis, and source water. Recognized by EOCP (BC), AWWOA (AB), SK, and MB.",
    priceCAD: sharedPrice("wpi-class1-water"),
    examTypes: ["wpi-class1-water"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["500 practice questions", "Timed mock exam", "WPI formula sheet", "AI Tutor", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class2-water",
    name: "WPI Class II Water Treatment Practice Pass",
    shortName: "WPI Class II Water",
    description: "WPI Class II Water Treatment — 500 advanced questions across 5 modules. Covers advanced treatment processes, system design, lab monitoring, source water management, and regulations. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class2-water"),
    examTypes: ["wpi-class2-water"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["500 advanced questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class3-water",
    name: "WPI Class III Water Treatment Practice Pass",
    shortName: "WPI Class III Water",
    description: "WPI Class III Water Treatment — 500 questions across 5 advanced modules. Covers ozone/UV disinfection, membrane filtration, advanced process control, distribution management, and regulatory QMS. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class3-water"),
    examTypes: ["wpi-class3-water"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["500 advanced questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class4-water",
    name: "WPI Class IV Water Treatment Practice Pass",
    shortName: "WPI Class IV Water",
    description: "WPI Class IV Water Treatment — 500 questions across 6 chief-operator modules. Covers advanced CT/disinfection, membrane systems, plant management & leadership, asset management, regulatory compliance, and emergency response. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class4-water"),
    examTypes: ["wpi-class4-water"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["500 chief-operator questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class1-wastewater",
    name: "WPI Class I Wastewater Treatment Practice Pass",
    shortName: "WPI Class I Wastewater",
    description: "WPI Class I Wastewater Treatment — 500 questions across 5 modules: Collection Systems, Primary & Secondary Treatment, Solids Handling & Biosolids, Lab & Monitoring, Safety & Regulations. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class1-wastewater"),
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
    description: "WPI Class II Wastewater Treatment — 500 questions across 5 advanced modules: Secondary Treatment, Nutrient Removal, Biosolids Management, Advanced Treatment, and Process Control & Safety. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class2-wastewater"),
    examTypes: ["wpi-class2-wastewater"],
    badge: "WPI Exam",
    badgeColor: "#0E7490",
    color: "#0E7490",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    available: true,
    features: ["500 advanced WW questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class3-wastewater",
    name: "WPI Class III Wastewater Treatment Practice Pass",
    shortName: "WPI Class III Wastewater",
    description: "WPI Class III Wastewater Treatment — 500 questions across 8 senior-level modules: Advanced BNR, MBR, Industrial Pretreatment, Biosolids, Process Control, Regulatory Compliance, Safety, and Emerging Technologies. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class3-wastewater"),
    examTypes: ["wpi-class3-wastewater"],
    badge: "WPI Exam",
    badgeColor: "#1D4ED8",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    available: true,
    features: ["500 senior WW questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class4-wastewater",
    name: "WPI Class IV Wastewater Treatment Practice Pass",
    shortName: "WPI Class IV Wastewater",
    description: "WPI Class IV Wastewater Treatment — 500 questions across 7 chief-operator-level modules: Advanced Process Control, BNR & Resource Recovery, Emerging Technologies, Plant Management, Regulatory Compliance, Emergency Response, and Health & Safety. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class4-wastewater"),
    examTypes: ["wpi-class4-wastewater"],
    badge: "WPI Exam",
    badgeColor: "#6D28D9",
    color: "#6D28D9",
    bg: "#F5F3FF",
    border: "#C4B5FD",
    available: true,
    features: ["500 chief operator questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class1-water-dist",
    name: "WPI Class I Water Distribution Practice Pass",
    shortName: "WPI Class I Distribution",
    description: "WPI Class I Water Distribution — 500 questions covering distribution system basics, pipe materials, pressure & flow, chlorine residual maintenance, valve & hydrant operation, and regulations. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class1-water-dist"),
    examTypes: ["wpi-class1-water-dist"],
    badge: "WPI Exam",
    badgeColor: "#0369A1",
    color: "#0369A1",
    bg: "#E0F2FE",
    border: "#BAE6FD",
    available: true,
    features: ["500 distribution questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class2-water-dist",
    name: "WPI Class II Water Distribution Practice Pass",
    shortName: "WPI Class II Distribution",
    description: "WPI Class II Water Distribution — 500 questions covering hydraulic analysis, pressure zone design, water quality management, cross-connection control, and regulatory compliance. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class2-water-dist"),
    examTypes: ["wpi-class2-water-dist"],
    badge: "WPI Exam",
    badgeColor: "#0F766E",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    available: true,
    features: ["500 distribution questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class3-water-dist",
    name: "WPI Class III Water Distribution Practice Pass",
    shortName: "WPI Class III Distribution",
    description: "WPI Class III Water Distribution — 500 questions covering advanced hydraulic modeling, transmission main design, multi-zone systems, SCADA & automation, and senior operator responsibilities. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class3-water-dist"),
    examTypes: ["wpi-class3-water-dist"],
    badge: "WPI Exam",
    badgeColor: "#1E40AF",
    color: "#1E40AF",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    available: true,
    features: ["500 distribution questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class4-water-dist",
    name: "WPI Class IV Water Distribution Practice Pass",
    shortName: "WPI Class IV Distribution",
    description: "WPI Class IV Water Distribution — 500 questions covering large-scale system management, asset management, advanced water quality, DWQMS implementation, and strategic regulatory compliance. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class4-water-dist"),
    examTypes: ["wpi-class4-water-dist"],
    badge: "WPI Exam",
    badgeColor: "#4C1D95",
    color: "#4C1D95",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    available: true,
    features: ["500 distribution questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class1-water-coll",
    name: "WPI Class I Wastewater Collection Practice Pass",
    shortName: "WPI Class I Collection",
    description: "WPI Class I Wastewater Collection — 500 questions covering collection system components, lift station operation, confined space safety, basic hydraulics, and environmental regulations. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class1-water-coll"),
    examTypes: ["wpi-class1-water-coll"],
    badge: "WPI Exam",
    badgeColor: "#065F46",
    color: "#065F46",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    available: true,
    features: ["500 collection questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class2-water-coll",
    name: "WPI Class II Wastewater Collection Practice Pass",
    shortName: "WPI Class II Collection",
    description: "WPI Class II Wastewater Collection — 500 questions covering advanced collection system design, intermediate lift station operations, system maintenance & rehabilitation, hydraulics & flow analysis, and regulatory compliance. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class2-water-coll"),
    examTypes: ["wpi-class2-water-coll"],
    badge: "WPI Exam",
    badgeColor: "#1E3A5F",
    color: "#1E3A5F",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    available: true,
    features: ["500 collection questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class3-water-coll",
    name: "WPI Class III Wastewater Collection Practice Pass",
    shortName: "WPI Class III Collection",
    description: "WPI Class III Wastewater Collection — 500 questions covering complex system operations & SCADA, advanced pump station engineering, system hydraulic modelling, advanced maintenance management, and leadership & regulatory management. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class3-water-coll"),
    examTypes: ["wpi-class3-water-coll"],
    badge: "WPI Exam",
    badgeColor: "#7C3AED",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    available: true,
    features: ["500 collection questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
  },
  {
    key: "wpi-class4-water-coll",
    name: "WPI Class IV Wastewater Collection Practice Pass",
    shortName: "WPI Class IV Collection",
    description: "WPI Class IV Wastewater Collection — 500 questions covering system planning & capital improvement, advanced engineering & design, utility management & leadership, advanced regulatory & environmental management, and emerging technologies. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).",
    priceCAD: sharedPrice("wpi-class4-water-coll"),
    examTypes: ["wpi-class4-water-coll"],
    badge: "WPI Exam",
    badgeColor: "#7F1D1D",
    color: "#7F1D1D",
    bg: "#FEF2F2",
    border: "#FECACA",
    available: true,
    features: ["500 collection questions", "Timed mock exam", "AI Tutor", "Score history", "BC / AB / SK / MB", "400+ flashcards"],
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
}: {
  productKey: string;
  label: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  productName?: string;
  priceLabel?: string;
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
      origin: window.location.origin,
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
}: {
  tier: SubscriptionTier;
  province: SubscriptionProvince;
  label: string;
  priceLabel: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const createSubscription = trpc.stripe.createSubscriptionCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => {
      console.error("[Subscription Checkout] Error:", err);
      alert("Something went wrong. Please try again.");
    },
  });

  function handleContactSubmit(contact: { name: string; email: string; phone: string }) {
    try { localStorage.setItem("echelon_trial_email", contact.email); } catch {}
    createSubscription.mutate({
      tier,
      province,
      email: contact.email,
      name: contact.name,
      phone: contact.phone,
      origin: window.location.origin,
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
    description: "WPI Class I Water Treatment — 500 questions covering treatment process, equipment O&M, lab analysis, and source water. Recognized by EOCP (BC), AWWOA (AB), SK, and MB.",
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
    grid-template-columns: minmax(0, 280px);
    gap: 16px;
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
export default function Pricing() {
  usePageMeta({
    title: "Pricing — Echelon Institute",
    description:
      "Affordable Practice Passes for every Canadian water and wastewater operator certification level. OIT, Class 1–4 Water, Class 1–4 Wastewater, and WQA.",
  });

  // Sync with the global province selector (useProvince hook)
  const { province: globalProvince } = useProvince();

  // Derive initial province from global hook; fall back to "ON" if not set
  const globalProvinceCode: ProvinceCode =
    globalProvince === "bc" ? "BC"
    : globalProvince === "ab" ? "AB"
    : globalProvince === "sk" ? "SK"
    : globalProvince === "mb" ? "MB"
    : "ON";

  const [selectedProvince, setSelectedProvince] = useState<ProvinceCode>(globalProvinceCode);
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

  // If ?tab=western is in the URL and user's global province is ON, pre-select BC so individual cards show WPI
  useEffect(() => {
    if (tabParam === "western" && selectedProvince === "ON") {
      setSelectedProvince("BC");
    }
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

  // Sync if global province changes after mount (e.g. user picks province on homepage then navigates here)
  useEffect(() => {
    setSelectedProvince(globalProvinceCode);
    setSubProvinceOverride(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalProvince]);

  const [showIndividual, setShowIndividual] = useState(false);

  // Active subscriptions — used to show "Your Current Plan" badge
  const { user, isAuthenticated } = useAuth();
  const { data: mySubsData } = trpc.stripe.getMySubscriptions.useQuery(
    { email: user?.email ?? undefined },
    { enabled: !!user?.email }
  );
  // Build a Set of "tier:province" keys for O(1) lookup
  const activePlanKeys = new Set(
    (mySubsData?.subscriptions ?? []).map(s => `${s.tier}:${s.province}`)
  );

  return (
    <div className="pricing-page">
      <style>{PRICING_STYLES}</style>

      {/* ── Nav ── */}
      <LandingNav isAuthenticated={!!isAuthenticated} currentPath="/pricing" />

      {/* ── Hero ── */}
      <div className="pricing-hero">
        <div className="pricing-hero-badge">Canadian Water &amp; Wastewater Operator Certification</div>
        <h1>Invest in Your Certification.<br />Earn It Back in Your First Paycheck.</h1>
        <p>One-time payment. Unlimited practice. AI Tutor &amp; step-by-step solutions included.<br />Operators who pass Class 3–4 earn <strong>$85K–$130K+</strong>. Your pass costs less than one day's pay.</p>
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

        {/* ── Annual Subscription Section ── */}
        <div style={{ marginBottom: 56 }}>
          <div className="section-header">
            <div className="section-bar" style={{ background: "linear-gradient(180deg, #7C3AED, #4F46E5)" }} />
            <h2>Annual All-Access Subscriptions</h2>
            <span className="section-badge" style={{ background: "#F5F3FF", color: "#7C3AED", borderColor: "#C4B5FD" }}>New</span>
          </div>
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px", lineHeight: 1.5 }}>
            Subscribe annually and unlock every exam type for your class level. Province-scoped: Ontario subscribers get EOCP tracks; Western Canada subscribers get WPI tracks.
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
              🍁 Ontario (EOCP)
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

          {(() => {
            const activeTiers = subProvince === "western" ? SUB_TIERS_WPI : SUB_TIERS_ONTARIO;
            return (
              <div className="pricing-sub-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
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
                      <ul style={{ margin: 0, padding: "0 0 0 14px", fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
                        {tier.features.map(f => <li key={f}>{f}</li>)}
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
        <div style={{ marginTop: 48, marginBottom: 24 }}>
          <button
            onClick={() => setShowIndividual(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 10, background: "none",
              border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "12px 20px",
              cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: "#334155", flex: 1 }}>
              Prefer to buy just one course? View individual practice passes
            </span>
            <span style={{ fontSize: 18, color: "#64748B", transform: showIndividual ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
          </button>
          {showIndividual && (
            <div style={{ marginTop: 8, padding: "4px 0" }}>
              <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 24px", lineHeight: 1.5 }}>
                One-time payment — access never expires. No recurring charges.
              </p>

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

            </div>
          )}
        </div>

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
            Everything you need to pass — included in every subscription
          </h3>
          <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 8px" }}>
            Annual subscription — cancel anytime. Everything unlocked for your province.
          </p>
          <p style={{ color: "#94A3B8", fontSize: 12, margin: "0 0 24px" }}>
            15,000+ questions across Water Treatment, Wastewater, WQA, and WPI tracks. Canada-specific. AI-explained.
          </p>
          <div className="trust-grid">
            {[
              { icon: "📚", label: "15,000+ Questions" },
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
  const displayBadgeColor = isWpi && wpiLabel?.badge ? "#0E7490" : (product.badgeColor ?? "#1D4ED8");

  // Extract question count from first feature bullet (e.g. "500 practice questions" → "500 Q")
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
      <div style={{ padding: "20px 20px 0", flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Header row: label tag + question count + badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
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
        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: "0 0 8px", fontFamily: "Sora, sans-serif", lineHeight: 1.3 }}>
          {displayName}
        </h3>
        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: "0 0 14px" }}>
          {displayDesc}
        </p>

        {/* Feature pills */}
        {product.features && product.features.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
            {product.features.map(f => (
              <span key={f} style={{
                fontSize: 11, color: product.color, background: product.bg,
                borderRadius: 20, padding: "3px 9px", fontWeight: 500,
              }}>{f}</span>
            ))}
          </div>
        )}

        {/* Spacer pushes price + CTA to bottom */}
        <div style={{ flex: 1 }} />

        {/* Price row */}
        <div style={{
          display: "flex", alignItems: "baseline", gap: 8,
          borderTop: "1px solid #F1F5F9", paddingTop: 12, marginBottom: 12,
        }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
            CA${(product.priceCAD / 100).toFixed(0)}
          </span>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>one-time · no subscription</span>
          {product.available && (
            <span style={{
              marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#15803D",
              background: "#F0FDF4", border: "1px solid #86EFAC",
              borderRadius: 6, padding: "3px 8px",
            }}>15 free ✓</span>
          )}
        </div>
      </div>

      {/* CTA footer */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        <CheckoutButton
          productKey={product.key}
          label={`Get ${product.shortName} Pass →`}
          disabled={!product.available}
          productName={product.name}
          priceLabel={`CA$${(product.priceCAD / 100).toFixed(0)}`}
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
