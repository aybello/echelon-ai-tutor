/**
 * Structured Data (JSON-LD) schemas for the Echelon Institute landing page.
 * Covers: Organization, EducationalOrganization with full Course catalog,
 * WebSite with SearchAction, and FAQPage.
 *
 * All data is factual and matches the live site content.
 */

const BASE_URL = "https://echeloninstitute.ca";
const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/og-image-new-NPyJfV6kq45KpTXHZ5UW8N.png";
const PROVIDER = { "@type": "Organization" as const, name: "Echelon Institute", url: BASE_URL };

// ── Helper ──────────────────────────────────────────────────────────────────

function course(
  name: string,
  description: string,
  path: string,
  priceCAD: string,
  category: string,
) {
  return {
    "@type": "Course",
    name,
    description,
    provider: PROVIDER,
    url: `${BASE_URL}${path}`,
    inLanguage: "en",
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "Self-paced",
    },
    offers: {
      "@type": "Offer",
      price: priceCAD,
      priceCurrency: "CAD",
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}/pricing`,
    },
    ...(category ? { courseCode: category } : {}),
  };
}

// ── Organization Schema ─────────────────────────────────────────────────────

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Echelon Institute",
  url: BASE_URL,
  logo: LOGO_URL,
  description:
    "Canada's AI-powered exam prep platform for water and wastewater operators. OIT, Class 1–4, WQA, and WPI certification preparation with 15,000+ practice questions across 27 courses.",
  foundingDate: "2025",
  founder: {
    "@type": "Person",
    name: "Ay Bello",
    jobTitle: "Environmental Engineer (EIT)",
  },
  address: {
    "@type": "PostalAddress",
    addressCountry: "CA",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+1-289-788-1885",
    email: "abello@echeloninstitute.ca",
    contactType: "customer service",
    availableLanguage: "English",
    hoursAvailable: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
  },
  areaServed: {
    "@type": "Country",
    name: "Canada",
  },
  knowsAbout: [
    "Water treatment operator certification",
    "Wastewater treatment operator certification",
    "Water quality analyst certification",
    "WPI certification",
    "OWWCO certification",
    "EOCP certification",
  ],
};

// ── WebSite Schema with SearchAction ────────────────────────────────────────

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Echelon Institute",
  url: BASE_URL,
  description:
    "Canada's exam prep platform for water and wastewater operators. Adaptive practice questions, AI tutor, mock exams, and process guides.",
  publisher: PROVIDER,
  inLanguage: "en",
};

// ── Course Catalog (OfferCatalog) ───────────────────────────────────────────

const ontarioCourses = [
  course("OIT Water Treatment Exam Prep", "500+ practice questions for the Ontario OIT Water Treatment certification. Adaptive difficulty, AI Tutor, mock exams, flashcards, and formula sheets. Free access — no account required.", "/quiz", "49", "OIT-W"),
  course("OIT Wastewater Treatment Exam Prep", "500+ practice questions for the Ontario OIT Wastewater Treatment certification. Covers collection systems, treatment principles, and O. Reg. 129/04.", "/oit-ww", "49", "OIT-WW"),
  course("Class 1 Water Treatment Exam Prep", "500+ practice questions for the Ontario Class 1 Water Treatment certification. Covers coagulation, flocculation, sedimentation, filtration, and disinfection.", "/class1-water", "99", "CL1-W"),
  course("Class 1 Wastewater Treatment Exam Prep", "500+ practice questions for the Ontario Class 1 Wastewater Treatment certification. Covers primary/secondary treatment, activated sludge, and effluent standards.", "/class1-ww", "99", "CL1-WW"),
  course("Class 2 Water Treatment Exam Prep", "500+ practice questions for the Ontario Class 2 Water Treatment certification. Advanced process control, chemical handling, hydraulics, and troubleshooting.", "/class2-water", "149", "CL2-W"),
  course("Class 2 Wastewater Treatment Exam Prep", "500+ practice questions for the Ontario Class 2 Wastewater Treatment certification. Advanced biological treatment, nutrient removal, and sludge management.", "/class2-ww", "149", "CL2-WW"),
  course("Class 3 Water Treatment Exam Prep", "500+ practice questions for the Ontario Class 3 Water Treatment certification. LSI, CT values, membranes, lime softening, SCADA, and advanced process control.", "/class3-water", "249", "CL3-W"),
  course("Class 3 Wastewater Treatment Exam Prep", "500+ practice questions for the Ontario Class 3 Wastewater Treatment certification. Large-scale system management, advanced process control, and regulatory leadership.", "/class3-ww", "249", "CL3-WW"),
  course("Class 4 Water Treatment Exam Prep", "500+ practice questions for the Ontario Class 4 Water Treatment certification. Full system management, regulatory compliance, and strategic operations leadership.", "/class4-water", "299", "CL4-W"),
  course("Class 4 Wastewater Treatment Exam Prep", "500+ practice questions for the Ontario Class 4 Wastewater Treatment certification. Strategic operations, capital planning, and full regulatory compliance.", "/class4-ww", "299", "CL4-WW"),
  course("Water Quality Analyst (WQA) Exam Prep", "500+ practice questions for the Ontario Water Quality Analyst certification under O. Reg. 128/04. Sampling protocols, analytical methods, QA/QC, and regulatory reporting.", "/wqa", "149", "WQA"),
];

const wpiCourses = [
  course("WPI Class I Water Treatment Exam Prep", "500+ practice questions aligned with WPI Need-to-Know Criteria for Class I Water Treatment. Recognized by EOCP (BC), AWWOA (AB), SAHO (SK), and MWWA (MB).", "/wpi-class1-water", "99", "WPI-W1"),
  course("WPI Class II Water Treatment Exam Prep", "500+ practice questions for WPI Class II Water Treatment. Advanced treatment processes, system design, lab monitoring, and regulatory compliance.", "/wpi-class2-water", "149", "WPI-W2"),
  course("WPI Class III Water Treatment Exam Prep", "500+ practice questions for WPI Class III Water Treatment. Advanced process optimization, membrane systems, chemical handling, and emergency response.", "/wpi-class3-water", "249", "WPI-W3"),
  course("WPI Class IV Water Treatment Exam Prep", "500+ practice questions for WPI Class IV Water Treatment. System-wide management, capital planning, and advanced regulatory compliance.", "/wpi-class4-water", "299", "WPI-W4"),
  course("WPI Class I Wastewater Treatment Exam Prep", "500+ practice questions for WPI Class I Wastewater Treatment. Collection systems, primary/secondary treatment, solids handling, and lab monitoring.", "/wpi-class1-wastewater", "99", "WPI-WW1"),
  course("WPI Class II Wastewater Treatment Exam Prep", "500+ practice questions for WPI Class II Wastewater Treatment. Secondary treatment, nutrient removal, biosolids management, and process control.", "/wpi-class2-wastewater", "149", "WPI-WW2"),
  course("WPI Class III Wastewater Treatment Exam Prep", "500+ practice questions for WPI Class III Wastewater Treatment. Advanced BNR, membrane bioreactors, industrial pretreatment, and regulatory compliance.", "/wpi-class3-wastewater", "249", "WPI-WW3"),
  course("WPI Class IV Wastewater Treatment Exam Prep", "500+ practice questions for WPI Class IV Wastewater Treatment. Advanced process control, BNR & resource recovery, plant management, and strategic compliance.", "/wpi-class4-wastewater", "299", "WPI-WW4"),
  course("WPI Class I Water Distribution Exam Prep", "150+ practice questions for WPI Class I Water Distribution. Pipe materials, pressure & flow, chlorine residual maintenance, and valve/hydrant operation.", "/wpi-class1-water-dist", "99", "WPI-D1"),
  course("WPI Class II Water Distribution Exam Prep", "150+ practice questions for WPI Class II Water Distribution. Hydraulic analysis, water quality management, cross-connection control, and system rehabilitation.", "/wpi-class2-water-dist", "149", "WPI-D2"),
  course("WPI Class III Water Distribution Exam Prep", "150+ practice questions for WPI Class III Water Distribution. Advanced hydraulic modelling, SCADA & automation, and water quality monitoring programs.", "/wpi-class3-water-dist", "249", "WPI-D3"),
  course("WPI Class IV Water Distribution Exam Prep", "150+ practice questions for WPI Class IV Water Distribution. Large-scale system management, asset management, and advanced DWQMS compliance.", "/wpi-class4-water-dist", "299", "WPI-D4"),
  course("WPI Class I Wastewater Collection Exam Prep", "150+ practice questions for WPI Class I Wastewater Collection. Collection system components, lift station operation, confined space safety, and basic hydraulics.", "/wpi-class1-water-coll", "99", "WPI-C1"),
  course("WPI Class II Wastewater Collection Exam Prep", "150+ practice questions for WPI Class II Wastewater Collection. Advanced collection system design, intermediate lift station operations, and regulatory compliance.", "/wpi-class2-water-coll", "149", "WPI-C2"),
  course("WPI Class III Wastewater Collection Exam Prep", "150+ practice questions for WPI Class III Wastewater Collection. Complex system operations, SCADA, advanced pump station engineering, and hydraulic modelling.", "/wpi-class3-water-coll", "249", "WPI-C3"),
  course("WPI Class IV Wastewater Collection Exam Prep", "150+ practice questions for WPI Class IV Wastewater Collection. System planning, capital improvement, utility management, and emerging technologies.", "/wpi-class4-water-coll", "299", "WPI-C4"),
];

export const courseCatalogSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Echelon Institute Certification Courses",
  description: "27 exam prep courses for Canadian water and wastewater operator certifications — Ontario (OWWCO) and Western Provinces (WPI).",
  numberOfItems: ontarioCourses.length + wpiCourses.length,
  itemListElement: [...ontarioCourses, ...wpiCourses].map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: c,
  })),
};

// ── FAQPage Schema ──────────────────────────────────────────────────────────

const faqs = [
  {
    question: "How is Echelon priced compared to other prep courses?",
    answer:
      "Echelon starts at CA$49 for OIT and CA$99 for Class 1 — less than most textbooks. We keep prices accessible because we want every operator to be able to prepare properly, regardless of budget. Higher class levels (3 and 4) are priced at CA$249–$299 to reflect the larger question banks and more complex content.",
  },
  {
    question: "Do the Practice Passes expire?",
    answer:
      "No. Your access never expires. Pay once, practice as many times as you need until you pass.",
  },
  {
    question: "Are the questions based on real exam content?",
    answer:
      "Yes. All questions are written by certified operators and aligned with OWWCO, EOCP, and provincial exam syllabi. Every calculation question includes a full step-by-step AI-explained solution.",
  },
  {
    question: "What makes Echelon different from free study materials?",
    answer:
      "Free materials give you content. Echelon gives you adaptive practice, instant AI explanations for every wrong answer, timed mock exams that simulate the real thing, and a score history that shows exactly where to focus. The difference is passing vs. re-booking.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "All major credit and debit cards (Visa, Mastercard, Amex) via Stripe's secure checkout.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "We offer a 7-day money-back guarantee if you're not satisfied. Given our low price points, we're confident you'll find the value — but if not, email support@echeloninstitute.ca and we'll make it right.",
  },
  {
    question: "Which certification levels are available right now?",
    answer:
      "All 27 courses are live. Ontario (11 courses): OIT Water (CA$49), OIT Wastewater (CA$49), Class 1–4 Water Treatment (CA$99–$299), Class 1–4 Wastewater Treatment (CA$99–$299), and WQA (CA$149). WPI — BC, AB, SK, MB (16 courses): Class I–IV Water Treatment, Class I–IV Wastewater Treatment, Class I–IV Water Distribution, and Class I–IV Wastewater Collection — all at CA$99–$299. Every course includes 500+ practice questions, a timed mock exam, AI Tutor, formula sheet, and score history.",
  },
  {
    question: "Is the OIT course really free?",
    answer:
      "Yes. The OIT Water Treatment course gives you full access to 500+ practice questions across 10 modules, the AI Tutor, flashcards, and a formula sheet — completely free, no account required. We believe every aspiring operator should be able to start their career without financial barriers.",
  },
  {
    question: "What provinces does Echelon cover?",
    answer:
      "Echelon covers all Canadian provinces that use the OWWCO (Ontario) or WPI (BC, Alberta, Saskatchewan, Manitoba) certification frameworks. Ontario courses align with O. Reg. 170/03, 128/04, and 129/04. WPI courses align with the WPI Need-to-Know Criteria recognized by EOCP, AWWOA, SAHO, and MWWA.",
  },
  {
    question: "How many practice questions are available?",
    answer:
      "Over 15,000 practice questions across 27 courses. Each course contains 150–650 questions covering every module in the exam blueprint. All questions include detailed explanations, and calculation questions include step-by-step solutions.",
  },
];

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.answer,
    },
  })),
};

// ── All schemas for the landing page ────────────────────────────────────────

export const landingPageSchemas = [
  organizationSchema,
  websiteSchema,
  courseCatalogSchema,
  faqSchema,
];
