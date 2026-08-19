/**
 * Study-utility page metadata (mock exams, flashcards, formula sheets, standalone hubs).
 *
 * Previously these routes were client-only, so search-engine crawlers received the
 * homepage's <title>, canonical, and empty body. This module derives per-page
 * metadata from the canonical courseRegistry so every publicly linked utility page
 * has server-rendered title, description, canonical, H1, JSON-LD, and body copy.
 *
 * Coverage:
 *   - /{course}-mock, /{course}-flashcards, /formulas-{...} for every active course
 *   - Standalone hubs: /formulas, /math-practice, /career, /chem-calc, /lab, /command,
 *     /process, /wastewater, /distribution-guide, /collection-guide, /pumping,
 *     /instrumentation, /partnerships
 *
 * The `PageMeta` shape and JSON-LD helpers live in pageSsr.ts and are re-imported here.
 */

import { getAllCourses, type CourseEntry } from "../shared/courseRegistry";

const SITE_URL = "https://echeloninstitute.ca";

export interface StudyUtilityPageMeta {
  path: string;
  title: string;
  description: string;
  h1: string;
  changefreq: string;
  priority: string;
  bodyHtml: string;
  /** Optional JSON-LD schema block (already serialized) */
  jsonLd?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildLearningResourceJsonLd(args: {
  path: string;
  title: string;
  description: string;
  learningResourceType: string;
}): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: args.title,
    description: args.description,
    url: `${SITE_URL}${args.path}`,
    inLanguage: "en-CA",
    learningResourceType: args.learningResourceType,
    isAccessibleForFree: true,
    provider: {
      "@type": "EducationalOrganization",
      name: "Echelon Institute",
      url: SITE_URL,
    },
  });
}

function mockPageMeta(course: CourseEntry): StudyUtilityPageMeta {
  const path = course.mockExamPath;
  const display = course.displayName;
  const title = `${display} Mock Exam | Echelon Institute`;
  const description = `Take a full-length ${display} mock exam with a realistic timer, question flags, and module-level scoring. Prepare for the certification exam under real test conditions.`;
  return {
    path,
    title,
    description,
    h1: `${display} Mock Exam`,
    changefreq: "weekly",
    priority: "0.8",
    jsonLd: buildLearningResourceJsonLd({
      path,
      title,
      description,
      learningResourceType: "Mock Exam",
    }),
    bodyHtml: `
      <h2>Full-Length Timed Mock Exam</h2>
      <p>The ${escapeHtml(display)} mock exam simulates the real certification test format, with a timer, question flags, review mode, and module-level scoring so you can see exactly where to focus your remaining study time.</p>
      <h2>What the Mock Exam Covers</h2>
      <p>Questions are drawn from the ${escapeHtml(display)} question bank and weighted to the published blueprint. Every question includes a detailed explanation on review, plus a link to the underlying study module and process guide.</p>
      <h2>Continue Practising</h2>
      <p><a href="${SITE_URL}${course.quizPath}">Return to the ${escapeHtml(display)} practice questions</a>${
        course.flashcardPath
          ? ` or <a href="${SITE_URL}${course.flashcardPath}">review flashcards</a>`
          : ""
      }${
        course.formulaPath
          ? ` and the <a href="${SITE_URL}${course.formulaPath}">formula sheet</a>`
          : ""
      }.</p>
      <h2>Independent Preparation Provider</h2>
      <p>Echelon Institute is an independent preparation provider and is not affiliated with any certifying authority. Confirm the current exam blueprint and eligibility with the applicable regulator.</p>
    `,
  };
}

function flashcardPageMeta(course: CourseEntry): StudyUtilityPageMeta | null {
  if (!course.flashcardPath) return null;
  const path = course.flashcardPath;
  const display = course.displayName;
  const title = `${display} Flashcards | Echelon Institute`;
  const description = `Study ${display} concepts with explanation-backed flashcards organized by exam module. Review definitions, formulas, and process concepts.`;
  return {
    path,
    title,
    description,
    h1: `${display} Flashcards`,
    changefreq: "weekly",
    priority: "0.7",
    jsonLd: buildLearningResourceJsonLd({
      path,
      title,
      description,
      learningResourceType: "Flashcards",
    }),
    bodyHtml: `
      <h2>Concept Review by Module</h2>
      <p>Review ${escapeHtml(display)} concepts with explanation-backed flashcards organized by module. Each card includes the concept, a plain-language explanation, and links to the underlying practice questions.</p>
      <h2>Study Alongside Practice</h2>
      <p>Flashcards complement the ${escapeHtml(display)} practice question bank. When you get a practice question wrong, the flashcard set gives you a focused way to lock in the underlying concept before you try again.</p>
      <p><a href="${SITE_URL}${course.quizPath}">Return to ${escapeHtml(display)} practice</a> or <a href="${SITE_URL}${course.mockExamPath}">take the mock exam</a>.</p>
      <h2>Independent Preparation Provider</h2>
      <p>Echelon Institute is an independent preparation provider. It does not issue certificates or guarantee an exam result.</p>
    `,
  };
}

function formulaPageMeta(course: CourseEntry): StudyUtilityPageMeta | null {
  if (!course.formulaPath) return null;
  const path = course.formulaPath;
  const display = course.displayName;
  const title = `${display} Formula Sheet | Echelon Institute`;
  const description = `${display} exam formula reference with worked examples for CT values, dosing, hydraulics, pump power, and process calculations.`;
  return {
    path,
    title,
    description,
    h1: `${display} Formula Sheet`,
    changefreq: "monthly",
    priority: "0.7",
    jsonLd: buildLearningResourceJsonLd({
      path,
      title,
      description,
      learningResourceType: "Formula Reference",
    }),
    bodyHtml: `
      <h2>Formula Reference for the ${escapeHtml(display)} Exam</h2>
      <p>This sheet lists the calculations most likely to appear on the ${escapeHtml(display)} exam — CT values, chemical dosing, hydraulics, pump power, detention time, and process control — with worked examples showing correct unit handling and setup.</p>
      <h2>Use It Alongside the Practice Bank</h2>
      <p>When a practice calculation goes wrong, use the formula sheet to check your setup before looking at the answer. Write the formula, plug in units, and sanity-check the result — the same three steps examiners reward with partial marks.</p>
      <p><a href="${SITE_URL}${course.quizPath}">Practise ${escapeHtml(display)} questions</a> or <a href="${SITE_URL}${course.mockExamPath}">take the mock exam</a>.</p>
      <h2>Independent Preparation Provider</h2>
      <p>Echelon Institute is an independent preparation provider. Always confirm which references are permitted in the actual exam with your certifying authority.</p>
    `,
  };
}

// Standalone hubs that live outside the per-course flow but are publicly linked and rank in Google.
const STANDALONE_HUBS: StudyUtilityPageMeta[] = [
  {
    path: "/formulas",
    title: "Ontario Operator Exam Formula Sheet | Echelon Institute",
    description:
      "33 Ontario water and wastewater operator exam formulas with worked examples — CT values, SVI, pump power, dosing, hydraulics, and more.",
    h1: "Ontario Operator Exam Formula Sheet",
    changefreq: "monthly",
    priority: "0.7",
    jsonLd: buildLearningResourceJsonLd({
      path: "/formulas",
      title: "Ontario Operator Exam Formula Sheet",
      description:
        "33 Ontario water and wastewater operator exam formulas with worked examples.",
      learningResourceType: "Formula Reference",
    }),
    bodyHtml: `
      <h2>All the Formulas You Need for the Ontario Exam</h2>
      <p>This sheet consolidates the 33 formulas most likely to appear on Ontario OWWCO water and wastewater operator exams — CT values, chemical dosing, sludge volume index, pump power, detention time, filter loading rate, and more — each with a worked example showing correct unit handling.</p>
      <h2>Also Available Per Course</h2>
      <p>Every Class 1–4 water and wastewater course has its own targeted formula sheet inside the platform. Pick the one that matches your exam class for the tightest scope.</p>
      <p><a href="${SITE_URL}/math-practice">Try the calculation-only practice mode</a> to drill the formulas you just reviewed.</p>
    `,
  },
  {
    path: "/math-practice",
    title:
      "Math Practice Hub — Water & Wastewater Operator Exam Calculations | Echelon Institute",
    description:
      "Every course filtered to calculation questions only — with step-by-step solutions, exam tips, and instant feedback. 800+ calc questions across 18 courses.",
    h1: "Master the Calculations. Pass the Exam.",
    changefreq: "weekly",
    priority: "0.8",
    jsonLd: buildLearningResourceJsonLd({
      path: "/math-practice",
      title: "Math Practice Hub for Water and Wastewater Operators",
      description:
        "Calculation-only practice across every water and wastewater operator course, with step-by-step solutions and exam tips.",
      learningResourceType: "Practice Problems",
    }),
    bodyHtml: `
      <h2>Calculation-Only Practice, Course by Course</h2>
      <p>Math Practice mode filters every Echelon course to calculation questions only. Every problem has a step-by-step worked solution, exam tips on setup, and instant feedback on unit handling.</p>
      <h2>Covers 800+ Calculation Questions Across 18 Courses</h2>
      <p>Ontario OIT, Class 1–4 Water Treatment, Class 1–4 Wastewater Treatment, distribution, collection, and every WPI-aligned Western Canadian course. Filter by module — for example "Hydraulics" or "Chemical Dosing" — then switch on Math Practice mode for targeted drills.</p>
      <p><a href="${SITE_URL}/formulas">Review the master formula sheet</a> or <a href="${SITE_URL}/chem-calc">try the interactive chemical dosing calculator</a>.</p>
    `,
  },
  {
    path: "/process",
    title: "Water Treatment Process Guide | Echelon Institute",
    description:
      "Interactive drinking water treatment process guide — coagulation, flocculation, sedimentation, filtration, disinfection — with topic-linked practice questions.",
    h1: "Interactive Water Treatment Process Guide",
    changefreq: "monthly",
    priority: "0.7",
    bodyHtml: `
      <h2>See the Full Treatment Train</h2>
      <p>The Echelon water treatment process guide walks through coagulation, flocculation, sedimentation, filtration, disinfection (chlorination, UV, ozone), chemical feed, iron and manganese removal, and finished-water storage using interactive SVG diagrams.</p>
      <h2>Practise Every Concept</h2>
      <p>Every diagram links to the underlying practice questions in the Class 1–4 Water Treatment courses. When you hit a topic that's unclear, jump to targeted practice and come back.</p>
      <p><a href="${SITE_URL}/wastewater">Continue to the wastewater treatment guide</a> or <a href="${SITE_URL}/distribution-guide">explore the distribution guide</a>.</p>
    `,
  },
  {
    path: "/wastewater",
    title: "Wastewater Treatment Process Guide | Echelon Institute",
    description:
      "Interactive wastewater treatment process guide — primary and secondary treatment, biological processes, sludge handling — with topic-linked practice questions.",
    h1: "Interactive Wastewater Treatment Process Guide",
    changefreq: "monthly",
    priority: "0.7",
    bodyHtml: `
      <h2>From Headworks to Effluent</h2>
      <p>The Echelon wastewater treatment guide covers screening and grit removal, primary clarifiers, activated sludge, secondary clarifiers, disinfection, and biosolids handling using interactive SVG diagrams and topic-linked practice.</p>
      <h2>Ontario and WPI-Aligned</h2>
      <p>Content maps to Ontario OWWCO Class 1–4 wastewater treatment blueprints and to the WPI wastewater treatment need-to-know criteria used in BC, Alberta, Saskatchewan, and Manitoba.</p>
      <p><a href="${SITE_URL}/collection-guide">Continue to the collection guide</a> or <a href="${SITE_URL}/process">review the drinking water process guide</a>.</p>
    `,
  },
  {
    path: "/distribution-guide",
    title: "Water Distribution System Guide | Echelon Institute",
    description:
      "Interactive water distribution system guide — mains, storage, pumping, cross-connection control, disinfection residual — with topic-linked practice questions.",
    h1: "Interactive Water Distribution System Guide",
    changefreq: "monthly",
    priority: "0.7",
    bodyHtml: `
      <h2>Distribution System Fundamentals</h2>
      <p>Explore mains, valves, hydrants, storage tanks, booster stations, cross-connection control, disinfection residual monitoring, flushing, and water age using interactive diagrams and topic-linked practice questions.</p>
      <p><a href="${SITE_URL}/pumping">Study pump anatomy and performance curves</a> or <a href="${SITE_URL}/process">return to the treatment guide</a>.</p>
    `,
  },
  {
    path: "/collection-guide",
    title: "Wastewater Collection System Guide | Echelon Institute",
    description:
      "Interactive wastewater collection system guide — gravity sewers, lift stations, manholes, inflow and infiltration — with topic-linked practice questions.",
    h1: "Interactive Wastewater Collection System Guide",
    changefreq: "monthly",
    priority: "0.7",
    bodyHtml: `
      <h2>Collection System Fundamentals</h2>
      <p>Explore gravity sewers, manholes, lift stations, force mains, sewer cleaning and inspection, inflow and infiltration, hydrogen sulfide control, and combined sewer overflows using interactive diagrams and topic-linked practice.</p>
      <p><a href="${SITE_URL}/wastewater">Continue to the wastewater treatment guide</a> or <a href="${SITE_URL}/pumping">study pump anatomy</a>.</p>
    `,
  },
  {
    path: "/career",
    title: "Water Operator Career Map | Echelon Institute",
    description:
      "Explore the Canadian water and wastewater operator career path — from OIT to Class 4 supervisor — with 2025 OCWA salary data by province.",
    h1: "Water Operator Career Map",
    changefreq: "monthly",
    priority: "0.7",
    bodyHtml: `
      <h2>From OIT to Class 4 Supervisor</h2>
      <p>The Echelon career map shows how Canadian water and wastewater operator roles progress from Operator-in-Training through Class 1–4 certification and into senior operator and supervisor positions, with typical experience and cross-training requirements.</p>
      <h2>Real 2025 Salary Data</h2>
      <p>Salary ranges are drawn from published OCWA operator classifications and provincial job postings, not generic industry surveys.</p>
      <p><a href="${SITE_URL}/blog/water-operator-salary-canada-by-province-2026">Read the full salary guide by province</a>.</p>
    `,
  },
  {
    path: "/chem-calc",
    title: "Water Operator Chemical Dosing Calculator | Echelon Institute",
    description:
      "Live chemical dosing calculator for chlorine, alum, lime, and fluoride — check your setup and units before the exam.",
    h1: "Chemical Dosing Calculator",
    changefreq: "monthly",
    priority: "0.6",
    bodyHtml: `
      <h2>Real-Time Dosing Calculations</h2>
      <p>Enter flow, target dose, and chemical strength — the calculator returns the required feed rate in real time, with the full formula and unit handling shown step by step so you can practise the setup examiners award marks for.</p>
      <p>Supports chlorine, alum, lime, and fluoride dosing. <a href="${SITE_URL}/formulas">Review the formula sheet</a> or <a href="${SITE_URL}/math-practice">try calculation-only practice</a>.</p>
    `,
  },
  {
    path: "/lab",
    title: "Water Operator Lab & Sampling Guide | Echelon Institute",
    description:
      "Water and wastewater lab procedures reference — jar tests, turbidity, chlorine residual, alkalinity, BOD, and QA/QC — with practice questions.",
    h1: "Water Operator Lab and Sampling Guide",
    changefreq: "monthly",
    priority: "0.6",
    bodyHtml: `
      <h2>Common Lab Tests, Explained</h2>
      <p>Reference guide for the lab procedures operators must know for certification exams — jar tests, turbidity, chlorine residual (DPD), alkalinity, hardness, pH, BOD, TSS — with method summaries, common errors, and QA/QC expectations.</p>
      <p><a href="${SITE_URL}/formulas">Review lab-related formulas</a>.</p>
    `,
  },
  {
    path: "/command",
    title: "Water Operator Incident Command Training | Echelon Institute",
    description:
      "Incident command tabletop scenarios for water and wastewater operators — outages, contamination, boil-water advisories, and reporting.",
    h1: "Incident Command Training for Operators",
    changefreq: "monthly",
    priority: "0.6",
    bodyHtml: `
      <h2>Tabletop Scenarios for Operators</h2>
      <p>Work through realistic incident command scenarios — power outages, chlorine loss, main breaks, adverse water quality events, and reporting to the ministry — with decision points, response checklists, and links back to the underlying regulations.</p>
      <p><a href="${SITE_URL}/lab">Review lab and sampling procedures</a> or <a href="${SITE_URL}/process">study the treatment process</a>.</p>
    `,
  },
  {
    path: "/pumping",
    title: "Water & Wastewater Pumping Systems Guide | Echelon Institute",
    description:
      "Interactive centrifugal pump guide — anatomy, performance curves, cavitation, series/parallel operation — with topic-linked practice questions.",
    h1: "Interactive Pumping Systems Guide",
    changefreq: "monthly",
    priority: "0.7",
    bodyHtml: `
      <h2>Centrifugal Pumps, End to End</h2>
      <p>Explore centrifugal pump anatomy, performance curves, cavitation behaviour, NPSH, and series/parallel configurations used in Ontario and WPI-aligned water and wastewater facilities using interactive diagrams and topic-linked practice.</p>
      <p><a href="${SITE_URL}/distribution-guide">Continue to distribution</a> or <a href="${SITE_URL}/collection-guide">explore lift stations in the collection guide</a>.</p>
    `,
  },
  {
    path: "/instrumentation",
    title: "Water Operator Instrumentation & Process Control | Echelon Institute",
    description:
      "Interactive instrumentation and process control guide — SCADA, PLCs, sensors, feedback loops — with topic-linked practice questions.",
    h1: "Instrumentation and Process Control Guide",
    changefreq: "monthly",
    priority: "0.7",
    bodyHtml: `
      <h2>SCADA, PLCs, and Feedback Control</h2>
      <p>Walk through SCADA architecture, PLCs, HMIs, common sensors (pressure, level, flow, chlorine residual, turbidity), and feedback loops used in water and wastewater plants, with topic-linked practice questions from the Class 2–4 courses.</p>
      <p><a href="${SITE_URL}/pumping">Continue to pumping systems</a> or <a href="${SITE_URL}/process">return to the treatment process guide</a>.</p>
    `,
  },
  {
    path: "/partnerships",
    title: "Partnerships & Reseller Program | Echelon Institute",
    description:
      "Partner with Echelon Institute — training providers, utility associations, and municipal training coordinators can offer Canadian operator exam prep to their teams.",
    h1: "Partnerships and Reseller Program",
    changefreq: "monthly",
    priority: "0.5",
    bodyHtml: `
      <h2>Bring Echelon to Your Members</h2>
      <p>Echelon partners with training providers, utility associations, municipal training coordinators, and Indigenous water services organizations to deliver Canadian-built operator exam preparation. Bulk seats, custom branding, and reporting are available.</p>
      <p>Contact <a href="mailto:abello@echeloninstitute.ca">abello@echeloninstitute.ca</a> to discuss a partnership, or <a href="${SITE_URL}/teams">view Echelon Teams</a> for utility and municipal plans.</p>
    `,
  },
];

/**
 * Return every study-utility SSR page (mock exams, flashcards, formula sheets, hubs).
 * Deduplicates by path so the caller can safely spread this into STATIC_PAGE_META.
 */
export function getStudyUtilityPageMeta(): StudyUtilityPageMeta[] {
  const pages: StudyUtilityPageMeta[] = [];
  const seen = new Set<string>();

  const push = (page: StudyUtilityPageMeta | null): void => {
    if (!page) return;
    if (seen.has(page.path)) return;
    seen.add(page.path);
    pages.push(page);
  };

  for (const hub of STANDALONE_HUBS) push(hub);

  for (const course of getAllCourses()) {
    if (!course.isActive) continue;
    // Skip the 309A mock/flashcards — those are hand-authored in pageSsr.ts already.
    if (course.courseKey === "electrician-309a") continue;
    push(mockPageMeta(course));
    push(flashcardPageMeta(course));
    push(formulaPageMeta(course));
  }

  return pages;
}
