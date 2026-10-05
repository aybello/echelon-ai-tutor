import { replaceAppRoot } from "./replaceAppRoot";
/**
 * Server-Side Rendering for Static Public Pages
 *
 * Intercepts static public routes BEFORE the SPA catch-all and injects
 * per-route title, meta description, canonical, robots, H1, structured data,
 * and rich body copy so crawlers and AI models see real content without JS.
 *
 * Routes handled:
 *   /          → Homepage
 *   /pricing   → Pricing
 *   /oit       → Ontario OIT hub
 *   /about     → About
 *   /jobs      → Jobs
 *   /blog      → Blog index
 *   /wpi       → WPI hub
 *   /faq       → FAQ
 *   /privacy   → Privacy Policy
 *   /terms     → Terms of Service
 *   /refund    → Refund Policy
 *
 * Blog post routes (/blog/:slug) are handled separately in blogSsr.ts.
 * /llms.txt is served here for AI model discoverability.
 */
import type { Express, Request, Response } from "express";
import { WPI_PAGE_COPY, WPI_OFFICIAL_SOURCES } from "../shared/wpiContent";
import { US_STATE_NAMES } from "../shared/usStateNames";
import { US_STATE_CONFIGS, US_STREAMS, US_RESEARCH_CHECKED_DATE, matchedUSCourses, usCourseHref, usProgramLabel, type USStateConfig } from "../shared/usExamRouting";
import { brandedShell } from "./staticHead";
import { boundedPublicBlogLinks, renderPublicBlogLinks, type PublicBlogLink } from "./publicBlogIndex";
import fs from "fs";
import path from "path";
import {
  COURSE_SEO_PAGES,
  REGION_SEO_PAGES,
  formatCad,
  getCoursesForRegion,
  type CourseSeoPage,
  type RegionSeoPage,
} from "../shared/seoCatalog";
import {
  INDIVIDUAL_PRICES_CAD,
  TEAMS_ALL_ACCESS_MIN_SEATS,
  TEAMS_ALL_ACCESS_PRICE_CENTS,
} from "../shared/pricingCatalogue";
import { INDIVIDUAL_REFUND_SUMMARY, REFUND_CONTACT_EMAIL, TEAM_REFUND_SUMMARY } from "../shared/refundPolicy";
import { getStudyUtilityPageMeta } from "./studyUtilityPageMeta";

const SITE_URL = "https://echeloninstitute.ca";
/** Public SEO pages have no account or purchase data, so they can be safely edge-cached. */
export const PUBLIC_SSR_CACHE_CONTROL = "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";
const DEFAULT_OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/og-image-new-NPyJfV6kq45KpTXHZ5UW8N.png";
const PUBLISHER_LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/favicon-512_1eb3c09e.png";

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  h1: string;
  /** Rich body copy for crawlers — plain text paragraphs, H2s, internal links */
  bodyHtml?: string;
  /** Optional JSON-LD schema block (already serialized) */
  jsonLd?: string;
  /** changefreq for sitemap */
  changefreq?: string;
  /** priority for sitemap */
  priority?: string;
}

function buildWebPageJsonLd(meta: PageMeta): string {
  const url = `${SITE_URL}${meta.path}`;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: meta.title,
    description: meta.description,
    url,
    inLanguage: "en-CA",
    isPartOf: {
      "@type": "WebSite",
      name: "Echelon Institute",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Echelon Institute",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: PUBLISHER_LOGO,
      },
    },
  });
}

function buildFaqJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Echelon Institute?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Echelon Institute is Canada's AI-powered exam prep platform for water and wastewater operators. It provides adaptive practice questions, module study notes, 400+ concept flashcards per course, interactive process guides, and an AI tutor for active course-pass holders.",
        },
      },
      {
        "@type": "Question",
        name: "Which provinces does Echelon cover?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Echelon provides Ontario-specific OIT and Class 1–4 courses plus WPI-aligned Class I–IV preparation for treatment, distribution, and collection candidates in British Columbia, Alberta, Saskatchewan, and Manitoba. Candidates should confirm the current exam and eligibility requirements with their provincial certifying authority.",
        },
      },
      {
        "@type": "Question",
        name: "Is there a free trial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Every course includes 15 free practice questions. The OIT preview also includes 50 flashcards, 30 mock-exam questions, and three AI Tutor messages — no account or credit card required.",
        },
      },
      {
        "@type": "Question",
        name: "How do I get access for my team or utility?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Echelon offers team plans for utilities, municipalities, and training organizations. Team plans include bulk seat pricing and a shared dashboard. Contact abello@echeloninstitute.ca or visit the Pricing page to learn more.",
        },
      },
      {
        "@type": "Question",
        name: "What is the OIT exam in Ontario?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Operator-in-Training (OIT) certification is the entry-level credential for Ontario water and wastewater operators, issued by the Ministry of the Environment, Conservation and Parks (MECP). It is a prerequisite for all Class 1–4 certifications. The exam consists of 100 multiple-choice questions covering water treatment, distribution, wastewater treatment, and collection systems.",
        },
      },
      {
        "@type": "Question",
        name: "How many practice questions does Echelon have?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Echelon courses have 400+ practice questions, organized by module and difficulty level. The question banks cover exam topics including treatment processes, laboratory analysis, equipment operation and maintenance, source water, and safety and administration.",
        },
      },
      {
        "@type": "Question",
        name: "What is the AI tutor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Echelon AI tutor is a 24/7 study assistant trained on water and wastewater operator content. It can explain concepts, walk through calculation steps, clarify regulations, and answer questions about any topic in your course — all in plain language.",
        },
      },
      {
        "@type": "Question",
        name: "How much does Echelon cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Individuals purchase one 12-month Exam Pass for a selected course with a one-time payment. Team plans are available for utilities and municipalities. Visit echeloninstitute.ca/pricing for current pricing.",
        },
      },
    ],
  });
}

function buildOrganizationJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Echelon Institute",
    url: SITE_URL,
    logo: PUBLISHER_LOGO,
    description:
      "Independent Canadian exam preparation for water and wastewater operators, with course-specific practice, flashcards, mock exams, process guides, and an AI tutor.",
    sameAs: [
      "https://www.linkedin.com/company/echeloninstitute",
      "https://github.com/aybello/echelon-ai-tutor",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "abello@echeloninstitute.ca",
      availableLanguage: "English",
    },
  });
}

function buildPricingJsonLd(): string {
  const prices = Object.values(INDIVIDUAL_PRICES_CAD);
  return JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Pricing — Echelon Institute",
      description:
        "View Echelon Institute's 12-month Individual Exam Passes and team plans for utilities and municipalities.",
      url: `${SITE_URL}/pricing`,
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Echelon Institute Individual Exam Pass",
      description:
        "12 months of access from successful payment to one selected water or wastewater operator exam-prep course, including practice questions, flashcards, study notes, mock exams, and AI tutor.",
      brand: {
        "@type": "Brand",
        name: "Echelon Institute",
      },
      offers: {
        "@type": "AggregateOffer",
        lowPrice: String(Math.min(...prices) / 100),
        highPrice: String(Math.max(...prices) / 100),
        offerCount: String(Object.keys(INDIVIDUAL_PRICES_CAD).length),
        priceCurrency: "CAD",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/pricing`,
      },
    },
  ]);
}

/** All static public page metadata */
const BASE_STATIC_PAGE_META: PageMeta[] = [
  {
    path: "/",
    title: "Water & Wastewater Operator Exam Prep | Echelon Institute",
    description:
      "Canadian water and wastewater operator exam preparation with a free OIT taste: 15 practice questions, 50 flashcards, 30 mock questions, and three AI Tutor messages.",
    h1: "Prepare for Your Operator Exam. Advance Your Career.",
    jsonLd: buildOrganizationJsonLd(),
    bodyHtml: `
      <h2>Canada's Exam Prep Platform for Water &amp; Wastewater Operators</h2>
      <p>Echelon Institute is an independent Canadian exam-preparation platform built specifically for water and wastewater operators. It provides Ontario-specific courses and WPI-aligned preparation for treatment, distribution, and collection candidates in Western Canada.</p>

      <h2>What's Included</h2>
      <p>Every Echelon course includes 400+ practice questions organized by module and difficulty, 400+ concept flashcards, comprehensive study notes, timed mock exams that simulate the real test format, and an AI tutor for active course-pass holders that explains concepts and calculations in plain language.</p>

      <h2>Courses Available</h2>
      <p>Echelon covers Ontario OIT and Class 1–4 Water Treatment, Water Distribution and Supply, Wastewater Treatment, and Wastewater Collection. WPI-aligned Class I–IV preparation is also available for Western Canadian candidates. Provincial authorities control eligibility, exam content, and certification requirements.</p>

      <h2>Free to Start</h2>
      <p>Every course includes 15 free practice questions. OIT learners can also try 50 flashcards, 30 mock-exam questions, and three AI Tutor messages — no account or credit card required. Experience the complete study system before purchasing a 12-month Exam Pass.</p>

      <h2>Team Plans for Utilities</h2>
      <p>Echelon offers bulk seat pricing for utilities, municipalities, and training organizations. Team plans include a shared admin dashboard and volume discounts. Contact us at <a href="mailto:abello@echeloninstitute.ca">abello@echeloninstitute.ca</a> or visit <a href="${SITE_URL}/pricing">our pricing page</a> to learn more.</p>

      <h2>Study Resources</h2>
      <p>The <a href="${SITE_URL}/guides">Echelon Process Guides</a> cover water treatment, distribution systems, wastewater treatment, collection, pumping, instrumentation and chemical feed through interactive diagrams and topic-linked practice. The <a href="${SITE_URL}/blog">Echelon blog</a> publishes in-depth certification guides for every province.</p>
    `,
  },
  {
    path: "/electrician-309a",
    title: "Ontario 309A Electrician Exam Prep | Echelon Institute",
    description: "Free Ontario 309A Construction Electrician exam preparation with 500 original practice questions, study guides, concept diagrams, flashcards and a 100-question mock exam.",
    h1: "Ontario 309A Construction Electrician Exam Prep",
    changefreq: "weekly",
    priority: "0.9",
    jsonLd: buildWebPageJsonLd({
      path: "/electrician-309a",
      title: "Ontario 309A Electrician Exam Prep | Echelon Institute",
      description: "Free, blueprint-aligned Ontario 309A Construction Electrician practice and study tools.",
      h1: "Ontario 309A Construction Electrician Exam Prep",
    }),
    bodyHtml: `
      <h2>A Complete 309A Study Workspace</h2>
      <p>Prepare with 500 original multiple-choice questions, a 100-question timed mock exam, explanation-backed flashcards, module study guides and 16 original concept diagrams.</p>
      <h2>Weighted to the Published Construction Electrician Blueprint</h2>
      <p>The course follows the five current Major Work Activities: common occupational skills; generating, distribution and service systems; wiring systems; motors and control systems; and signalling and communication systems.</p>
      <h2>Learn the Process, Not Just the Answer</h2>
      <p>Every module connects safe work sequences, system relationships, troubleshooting logic and worked calculations. Diagram-backed questions help learners trace distribution, bonding, transformers, wiring, motor controls, drives, automation and signalling systems.</p>
      <h2>Independent Exam Preparation</h2>
      <p>Echelon Institute is an independent training provider and is not affiliated with Skilled Trades Ontario or the Red Seal Program. Candidates should confirm current eligibility and examination requirements with the applicable authority.</p>
    `,
  },
  {
    path: "/electrician-309a-mock",
    title: "Ontario 309A Electrician Mock Exam | Echelon Institute",
    description: "Take a free 100-question Ontario 309A Construction Electrician mock exam with a four-hour timer and module-level results.",
    h1: "Ontario 309A Construction Electrician Mock Exam",
    changefreq: "weekly",
    priority: "0.8",
    bodyHtml: `
      <h2>Blueprint-Weighted Exam Practice</h2>
      <p>The mock exam selects 100 original questions across the five published Construction Electrician Major Work Activities, with a four-hour timer, question flags and module-level scoring.</p>
      <p><a href="${SITE_URL}/electrician-309a">Return to the complete 309A study workspace</a> for targeted practice, study guides, diagrams and flashcards.</p>
    `,
  },
  {
    path: "/electrician-309a-flashcards",
    title: "Ontario 309A Electrician Flashcards | Echelon Institute",
    description: "Study Ontario 309A Construction Electrician concepts with free explanation-backed flashcards organized by exam module.",
    h1: "Ontario 309A Construction Electrician Flashcards",
    changefreq: "weekly",
    priority: "0.8",
    bodyHtml: `
      <h2>Concept Review by 309A Module</h2>
      <p>Review occupational skills, distribution and services, wiring systems, motors and controls, and signalling and communications using explanation-backed concept cards.</p>
      <p><a href="${SITE_URL}/electrician-309a">Return to the complete 309A study workspace</a> for practice sessions, study guides, diagrams and the full mock exam.</p>
    `,
  },
  {
    path: "/guides",
    title: "Interactive Process Guides for Water Operators | Echelon Institute",
    description:
      "Explore interactive drinking water, wastewater, distribution, collection, pumping, instrumentation and chemical feed guides. Save progress and practise each topic for your operator exam.",
    h1: "Interactive Process Guides for Water and Wastewater Operators",
    changefreq: "monthly",
    jsonLd: buildWebPageJsonLd({
      path: "/guides",
      title:
        "Interactive Process Guides for Water Operators | Echelon Institute",
      description:
        "Interactive technical learning guides for water and wastewater operator certification.",
      h1: "Interactive Process Guides for Water and Wastewater Operators",
    }),
    bodyHtml: `
      <h2>Understand the System, Then Practise the Exam</h2>
      <p>Echelon Process Guides connect treatment flow, equipment behaviour and operator decisions to certification practice. Each guide follows one repeatable learning loop: see the system, understand the process, operate the equipment, remember the exam points and prove the topic through practice questions.</p>

      <h2>Seven Interactive Technical Guides</h2>
      <p>Explore <a href="${SITE_URL}/process">Drinking Water Treatment</a>, <a href="${SITE_URL}/wastewater">Wastewater Treatment</a>, <a href="${SITE_URL}/distribution-guide">Water Distribution</a>, <a href="${SITE_URL}/collection-guide">Wastewater Collection</a>, <a href="${SITE_URL}/pumping">Pumping Systems</a>, <a href="${SITE_URL}/instrumentation">Process Control and Instrumentation</a>, and the <a href="${SITE_URL}/chem-calc">Chemical Feed Calculator</a>.</p>

      <h2>Built Around Operator Decisions</h2>
      <p>The guides visualize the variables operators manage in the field: turbidity, disinfectant residual, BOD, TSS, dissolved oxygen, system pressure, flow, head, efficiency, NPSH, process variable, setpoint and controller output.</p>

      <h2>Connected to Certification Practice</h2>
      <p>Select Ontario or WPI/ABC and your certification level inside any guide. Echelon links the current process topic to the matching practice course so learning and exam preparation stay connected.</p>

      <h2>Progress and Bookmarks</h2>
      <p>Guide progress, the last topic visited and bookmarks are saved automatically on the learner's device. Utilities can use Echelon Teams to connect operator learning activity with readiness and topic-level performance.</p>
    `,
  },
  {
    path: "/pricing",
    title: "Pricing — Echelon Institute | Water Operator Exam Prep Plans",
    description:
      `View 12-month Individual Exam Passes from ${formatCad(INDIVIDUAL_PRICES_CAD.oit)} to ${formatCad(INDIVIDUAL_PRICES_CAD["class4-water"])} and team plans for utilities and municipalities.`,
    h1: "Simple, Transparent Pricing for Every Operator",
    jsonLd: buildPricingJsonLd(),
    bodyHtml: `
      <h2>Try 15 Questions Free</h2>
      <p>Every course starts with 15 free questions so you can check the question format and explanations before purchasing. No account or credit card is required. <a href="${SITE_URL}/quiz">Try Water OIT</a> or <a href="${SITE_URL}/oit-ww">try Wastewater OIT</a>.</p>

      <h2>Individual Exam Passes — Ontario</h2>
      <p>Each pass is for one named learner, one selected course, and 12 months of access from successful payment. Prices are in Canadian dollars; applicable taxes are added at checkout.</p>
      <table>
        <thead><tr><th>Course</th><th>Price</th><th>Access</th></tr></thead>
        <tbody>
          <tr><td>Ontario OIT — Water or Wastewater</td><td>${formatCad(INDIVIDUAL_PRICES_CAD.oit)}</td><td>12 months</td></tr>
          <tr><td>Ontario Class 1 — any stream</td><td>${formatCad(INDIVIDUAL_PRICES_CAD["class1-water"])}</td><td>12 months</td></tr>
          <tr><td>Ontario Class 2 — any stream, or Water Quality Analyst</td><td>${formatCad(INDIVIDUAL_PRICES_CAD["class2-water"])}</td><td>12 months</td></tr>
          <tr><td>Ontario Class 3 — any stream</td><td>${formatCad(INDIVIDUAL_PRICES_CAD["class3-water"])}</td><td>12 months</td></tr>
          <tr><td>Ontario Class 4 — any stream</td><td>${formatCad(INDIVIDUAL_PRICES_CAD["class4-water"])}</td><td>12 months</td></tr>
        </tbody>
      </table>
      <p><a href="${SITE_URL}/canada/ontario">Browse every Ontario course</a>.</p>

      <h2>Individual Exam Passes — WPI-Aligned Courses</h2>
      <p>These courses support WPI-aligned treatment, wastewater, distribution, and collection exams. Candidates must confirm local eligibility and exam requirements with their certifying authority.</p>
      <table>
        <thead><tr><th>Course level</th><th>Price</th><th>Access</th></tr></thead>
        <tbody>
          <tr><td>Class I — any WPI stream</td><td>${formatCad(INDIVIDUAL_PRICES_CAD["wpi-class1-water"])}</td><td>12 months</td></tr>
          <tr><td>Class II — any WPI stream</td><td>${formatCad(INDIVIDUAL_PRICES_CAD["wpi-class2-water"])}</td><td>12 months</td></tr>
          <tr><td>Class III — any WPI stream</td><td>${formatCad(INDIVIDUAL_PRICES_CAD["wpi-class3-water"])}</td><td>12 months</td></tr>
          <tr><td>Class IV — any WPI stream</td><td>${formatCad(INDIVIDUAL_PRICES_CAD["wpi-class4-water"])}</td><td>12 months</td></tr>
        </tbody>
      </table>
      <p><a href="${SITE_URL}/wpi">Browse WPI-aligned courses</a>.</p>

      <h2>What Every Plan Includes</h2>
      <p>Every paid pass includes 400+ practice questions organized by module, 400+ digital flashcards with progress tracking, study notes, timed mock exams, the AI Tutor, process guides, and score history.</p>

      <h2>Team Plans for Utilities and Municipalities</h2>
      <p>Echelon offers two team models for utilities, municipalities, training organizations, and Indigenous water authorities. Both include named-operator accounts, a shared manager dashboard, progress reporting, and volume discounts.</p>

      <h3>Teams Flex</h3>
      <p>Assign one released certification course to one named operator for 3 or 6 months. Teams Flex is a one-time purchase with no five-seat minimum and starts at CA$39 per operator. It is best for a specific upcoming exam or a cohort studying different certifications.</p>

      <h3>Teams Annual</h3>
      <p>Give each named operator one annual stream plan from CA$449 per year, or All Streams for ${formatCad(TEAMS_ALL_ACCESS_PRICE_CENTS)} per operator per year. Annual plans require at least ${TEAMS_ALL_ACCESS_MIN_SEATS} operators and are best for ongoing workforce development. <a href="${SITE_URL}/teams">Review Echelon Teams</a> or contact <a href="mailto:abello@echeloninstitute.ca">abello@echeloninstitute.ca</a>.</p>

      <h3>Graduated Volume Discounts</h3>
      <p>Seats 1–9 are list price; seats 10–24 receive 10% off; seats 25–49 receive 15% off; and seats 50 or more receive 20% off. Discounts apply by seat band rather than retroactively to every seat.</p>

      <h2>Free Access</h2>
      <p>Every course includes 15 free practice questions. The OIT preview also includes 50 flashcards, 30 mock-exam questions, and three AI Tutor messages — no account or credit card required. Visit the <a href="${SITE_URL}/oit">Ontario OIT hub</a> to begin immediately.</p>

      <h2>Refund Policy</h2>
      <p>${INDIVIDUAL_REFUND_SUMMARY} ${TEAM_REFUND_SUMMARY} Read the full <a href="${SITE_URL}/refund">refund policy</a> for all eligibility terms.</p>
    `,
  },
  {
    path: "/oit",
    title: "Ontario OIT Exam Prep — Free Practice | Echelon Institute",
    description:
      `Ontario Operator-in-Training exam preparation for water and wastewater. Start with 15 free questions; a 12-month pass for one selected OIT course is ${formatCad(INDIVIDUAL_PRICES_CAD.oit)}.`,
    h1: "Ontario OIT Exam Prep for Water and Wastewater",
    changefreq: "weekly",
    priority: "0.9",
    jsonLd: buildWebPageJsonLd({
      path: "/oit",
      title: "Ontario OIT Exam Prep — Free Practice | Echelon Institute",
      description:
        "Ontario Operator-in-Training exam preparation with free Water and Wastewater previews, flashcards, mock exams, formulas, and process guides.",
      h1: "Ontario OIT Exam Prep for Water and Wastewater",
    }),
    bodyHtml: `
      <h2>Choose Your Ontario OIT Stream</h2>
      <p>The Operator-in-Training certificate is the entry-level route into regulated water and wastewater operations in Ontario. Echelon provides separate preparation for Water Treatment and Distribution, and for Wastewater Treatment and Collection.</p>

      <h2>Start Free — No Account or Credit Card</h2>
      <ul>
        <li><a href="${SITE_URL}/quiz">Try 15 Water OIT questions</a>.</li>
        <li><a href="${SITE_URL}/oit-ww">Try 15 Wastewater OIT questions</a>.</li>
      </ul>

      <h2>One Selected OIT Course for ${formatCad(INDIVIDUAL_PRICES_CAD.oit)}</h2>
      <p>A paid Exam Pass provides 12 months of access from successful payment for one named learner and includes 400+ practice questions, 400+ flashcards with progress tracking, a timed 100-question mock exam, AI Tutor explanations, process guides, formula sheets, and math practice.</p>
      <ul>
        <li><a href="${SITE_URL}/oit-water-flashcards">Water OIT flashcards</a> and <a href="${SITE_URL}/oit-ww-flashcards">Wastewater OIT flashcards</a></li>
        <li><a href="${SITE_URL}/oit-mock">Water OIT mock exam</a> and <a href="${SITE_URL}/oit-ww-mock">Wastewater OIT mock exam</a></li>
        <li><a href="${SITE_URL}/formulas">Formula sheets</a>, <a href="${SITE_URL}/math-practice">math practice</a>, and <a href="${SITE_URL}/guides">interactive process guides</a></li>
      </ul>
      <p><a href="${SITE_URL}/pricing">Review all pricing</a> or <a href="${SITE_URL}/canada/ontario">browse every Ontario course</a>.</p>

      <h2>Confirm Current OWWCO Requirements</h2>
      <p>OWWCO sets eligibility, registration, permitted references, and exam requirements. Confirm current rules on the <a href="https://owwco.ca" rel="noopener">OWWCO website</a>. Echelon Institute is an independent exam-preparation provider and is not affiliated with or endorsed by OWWCO or the Ontario Ministry of the Environment, Conservation and Parks.</p>
    `,
  },
  {
    path: "/about",
    title: "About Echelon Institute | Canadian Water Operator Exam Prep",
    description:
      "Learn about Echelon Institute, an independent Canadian exam-preparation platform built specifically for water and wastewater operators.",
    h1: "About Echelon Institute",
    jsonLd: buildWebPageJsonLd({
      path: "/about",
      title: "About Echelon Institute",
      description:
        "Canada's AI-powered exam prep platform built for water and wastewater operators.",
      h1: "About Echelon Institute",
    }),
    bodyHtml: `
      <h2>Our Mission</h2>
      <p>Echelon Institute exists to help Canadian water and wastewater operators pass their certification exams and advance their careers. Water operators are among the most essential workers in any community — they protect public health every day — and they deserve world-class study tools to match the importance of their work.</p>

      <h2>Built for Canadian Operators</h2>
      <p>Unlike generic exam-prep platforms, Echelon is built specifically for the water sector. Ontario-specific courses and WPI-aligned Western Canadian courses are organized by certification stream and class. Candidates should verify current requirements with OWWCO, EOCP, or the applicable provincial authority.</p>

      <h2>AI-Powered Learning</h2>
      <p>Echelon's AI tutor is available 24/7 to answer questions, explain concepts, and walk through calculation problems in plain language. The adaptive question engine tracks your performance by module and adjusts difficulty to focus your study time where it matters most.</p>

      <h2>Certifications Covered</h2>
      <p>Echelon covers Ontario OIT and Class 1–4 treatment, distribution, and collection streams, plus WPI-aligned Class I–IV preparation used by candidates in Western Canada. Echelon is independent and is not endorsed by a certifying authority.</p>

      <h2>Contact Us</h2>
      <p>Questions about Echelon? Reach us at <a href="mailto:abello@echeloninstitute.ca">abello@echeloninstitute.ca</a>. For team and organizational inquiries, visit the <a href="${SITE_URL}/pricing">pricing page</a>.</p>
    `,
  },
  {
    path: "/jobs",
    title: "Water Operator Jobs in Canada | Echelon Institute Job Board",
    description:
      "Browse water and wastewater operator job postings across Canada. Find Class 1–4 operator roles in Ontario, BC, Alberta, Saskatchewan, and Manitoba.",
    h1: "Water & Wastewater Operator Jobs in Canada",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: "Water & Wastewater Operator",
      description:
        "Browse current water and wastewater operator job openings across Canada on the Echelon Institute job board.",
      hiringOrganization: {
        "@type": "Organization",
        name: "Echelon Institute",
        sameAs: SITE_URL,
      },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressCountry: "CA",
        },
      },
    }),
    bodyHtml: `
      <h2>Find Water Operator Jobs Across Canada</h2>
      <p>The Echelon Institute job board aggregates water and wastewater operator job postings from municipalities, utilities, and private operators across Canada. Roles are updated regularly and span all certification classes — from entry-level OIT positions to senior Class 4 operator and superintendent roles.</p>

      <h2>Provinces Covered</h2>
      <p>Job postings are sourced from Ontario, British Columbia, Alberta, Saskatchewan, Manitoba, and other provinces. Filter by province and certification class to find roles that match your credentials.</p>

      <h2>Advance Your Career</h2>
      <p>Preparing for a promotion or a new role? Echelon's exam prep platform supports higher-class certification study. Visit <a href="${SITE_URL}/pricing">our pricing page</a> to see Individual Exam Passes, or start with the <a href="${SITE_URL}/">free practice questions</a> available on every course.</p>

      <h2>Water Operator Career Resources</h2>
      <p>Read the <a href="${SITE_URL}/blog/water-operator-salary-canada-by-province-2026">2026 Water Operator Salary Guide</a> for current compensation context, and the <a href="${SITE_URL}/blog/canadian-water-operator-certification-by-province">Canadian Certification Guide</a> for a province-by-province overview.</p>
    `,
  },
  {
    path: "/blog",
    title: "Water Operator Certification & Workforce Blog | Echelon Institute",
    description:
      "Official-source-backed water and wastewater certification guides, exam preparation, career advice, and municipal workforce resources for Canada and WPI-aligned US jurisdictions.",
    h1: "Operator Certification, Careers & Workforce Readiness",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Echelon Institute Blog",
      description:
        "Official-source-backed certification, exam preparation, career, and utility workforce guides for water and wastewater operators and managers.",
      url: `${SITE_URL}/blog`,
      publisher: {
        "@type": "Organization",
        name: "Echelon Institute",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: PUBLISHER_LOGO },
      },
    }),
    bodyHtml: `
      <h2>Guides for Operators</h2>
      <p>Echelon publishes source-backed certification, exam preparation, and career guides for Canadian operators and candidates in WPI-aligned US jurisdictions. Local coverage varies, so every regulatory article identifies its jurisdiction, sources, review date, and technical-review status.</p>

      <h2>Resources for Utilities and Municipalities</h2>
      <p>Training managers can use Echelon's workforce-readiness articles to evaluate operator programs, launch certification cohorts, support learners, and measure outcomes responsibly. Visit <a href="${SITE_URL}/teams">Echelon for Teams</a> for institutional onboarding and manager reporting.</p>

      <h2>Featured Articles</h2>
      <ul>
        <li><a href="${SITE_URL}/blog/how-to-pass-ontario-oit-water-exam">How to Pass the Ontario OIT Water Exam</a></li>
        <li><a href="${SITE_URL}/blog/how-to-become-water-wastewater-operator-ontario">How to Become a Water or Wastewater Operator in Ontario</a></li>
        <li><a href="${SITE_URL}/blog/ontario-oit-exam-eligibility-format-fees-study-plan">Ontario OIT Exam: Eligibility, Format, Fees and Study Plan</a></li>
        <li><a href="${SITE_URL}/blog/class-1-water-treatment-practice-questions-study-guide">Class 1 Water Treatment Practice Questions and Study Guide</a></li>
        <li><a href="${SITE_URL}/blog/class-1-wastewater-treatment-practice-questions-study-guide">Class 1 Wastewater Treatment Practice Questions and Study Guide</a></li>
        <li><a href="${SITE_URL}/blog/how-long-study-water-operator-certification-exam">How Long Should You Study for an Operator Exam?</a></li>
        <li><a href="${SITE_URL}/blog/water-operator-certification-reciprocity-canada">Water Operator Certification Reciprocity Across Canada</a></li>
        <li><a href="${SITE_URL}/blog/utilities-build-certification-ready-operator-workforce">How Utilities Can Build a Certification-Ready Workforce</a></li>
        <li><a href="${SITE_URL}/blog/water-operator-training-programs-municipal-manager-checklist">Water Operator Training Programs: Manager Checklist</a></li>
        <li><a href="${SITE_URL}/blog/water-operator-salary-canada-by-province-2026">Water Operator Salary in Canada by Province (2026)</a></li>
        <li><a href="${SITE_URL}/blog/ontario-water-operator-exam-math-formulas-cheat-sheet">Ontario Water Operator Exam Math Formulas Cheat Sheet</a></li>
        <li><a href="${SITE_URL}/blog/water-treatment-chlorination-guide-ontario-operators">Water Treatment Chlorination Guide for Ontario Operators</a></li>
        <li><a href="${SITE_URL}/blog/ontario-class-1-vs-class-2-water-operator-differences">Ontario Class 1 vs Class 2 Water Operator: Key Differences</a></li>
        <li><a href="${SITE_URL}/blog/owwco-wastewater-operator-certification-ontario-guide">OWWCO Wastewater Operator Certification Ontario Guide</a></li>
        <li><a href="${SITE_URL}/blog/canadian-water-operator-certification-by-province">Canadian Water Operator Certification by Province</a></li>
        <li><a href="${SITE_URL}/blog/bc-water-operator-certification-guide">BC Water Operator Certification Guide (EOCP)</a></li>
        <li><a href="${SITE_URL}/blog/eocp-exam-study-tips-bc">EOCP Exam Study Tips for BC Operators</a></li>
        <li><a href="${SITE_URL}/blog/alberta-water-operator-certification-guide">Alberta Water Operator Certification Guide</a></li>
        <li><a href="${SITE_URL}/blog/awwoa-level-1-exam-prep-alberta">Alberta Level I Operator Exam Prep</a></li>
        <li><a href="${SITE_URL}/blog/manitoba-water-operator-certification-guide">Manitoba Water Operator Certification Guide</a></li>
        <li><a href="${SITE_URL}/blog/saskatchewan-water-operator-certification-guide">Saskatchewan Water Operator Certification Guide</a></li>
      </ul>

      <h2>Start Practising</h2>
      <p>Ready to study? <a href="${SITE_URL}/">Start with free practice questions</a> on any course — no account required. Purchase the selected course's 12-month Exam Pass for full access to its question bank, flashcards, mock exams, and AI tutor.</p>
    `,
  },
  {
    path: "/wpi",
    title: WPI_PAGE_COPY.title,
    description: WPI_PAGE_COPY.description,
    h1: WPI_PAGE_COPY.heading,
    bodyHtml: `
      <h2>Water Professionals International</h2><p>${escapeHtml(WPI_PAGE_COPY.identity)}</p>
      <h2>Ontario Also Uses WPI Examinations</h2><p>${escapeHtml(WPI_PAGE_COPY.ontario)}</p>
      <h2>Confirm Your Jurisdiction and Exam Version</h2><p>${escapeHtml(WPI_PAGE_COPY.version)}</p>
      <p><a href="${WPI_OFFICIAL_SOURCES.wpi}">WPI ABC Testing</a> · <a href="${WPI_OFFICIAL_SOURCES.ontario}">OWWCO exam preparation</a> · <a href="${WPI_OFFICIAL_SOURCES.criteria}">WPI exam criteria</a> · <a href="${WPI_OFFICIAL_SOURCES.eocp}">EOCP exam update</a></p>
      <h2>Choose an Echelon Preparation Course</h2>
      <p>Browse Water Treatment, Wastewater Treatment, Water Distribution and Wastewater Collection at Class I to IV. Every course offers 15 free practice questions. A selected Individual Exam Pass provides 12 months from successful payment.</p>
      <ul>${COURSE_SEO_PAGES.filter(course => course.regionPath === "/wpi").map(course => `<li><a href="${course.quizPath}">${escapeHtml(course.displayName)}</a></li>`).join("")}</ul>
      <p><a href="/canada/ontario">Ontario course catalogue</a> · <a href="/pricing">Individual Exam Passes</a></p>
      <h2>Independent Preparation</h2><p>${escapeHtml(WPI_PAGE_COPY.independence)}</p>
    `,
  },
  {
    path: "/faq",
    title: "FAQ — Echelon Institute | Water Operator Exam Prep Questions",
    description:
      "Frequently asked questions about Echelon Institute's water operator exam prep platform — courses, pricing, provinces covered, team plans, and more.",
    h1: "Frequently Asked Questions",
    jsonLd: buildFaqJsonLd(),
    bodyHtml: `
      <h2>About Echelon Institute</h2>
      <p>Echelon Institute is Canada's AI-powered exam prep platform for water and wastewater operators. It provides adaptive practice questions, module study notes, 400+ concept flashcards per course, interactive process guides, mock exams, and an AI tutor for active course-pass holders.</p>

      <h2>Which Provinces Are Covered?</h2>
      <p>Echelon provides Ontario-specific OIT and Class 1–4 courses plus WPI-aligned Class I–IV preparation for treatment, distribution, and collection candidates in British Columbia, Alberta, Saskatchewan, and Manitoba. Confirm current requirements with your certifying authority.</p>

      <h2>Is There a Free Trial?</h2>
      <p>Yes. Every course includes 15 free practice questions. OIT also includes 50 flashcards, 30 mock-exam questions, and three AI Tutor messages — no account or credit card required. A 12-month Exam Pass is required to continue beyond those limits. <a href="${SITE_URL}/">Start practising now</a>.</p>

      <h2>How Many Practice Questions Are There?</h2>
      <p>Each course has 400+ practice questions organized by module and difficulty level. Topics include treatment processes, laboratory analysis, equipment operation and maintenance, source water, and safety and administration.</p>

      <h2>What Is the AI Tutor?</h2>
      <p>The Echelon AI tutor is a 24/7 study assistant trained on water and wastewater operator content. It explains concepts, walks through calculation steps, clarifies regulations, and answers questions about any topic in your course — all in plain language.</p>

      <h2>Team Plans for Utilities</h2>
      <p>Echelon offers bulk seat pricing for utilities, municipalities, and training organizations. Contact <a href="mailto:abello@echeloninstitute.ca">abello@echeloninstitute.ca</a> or visit the <a href="${SITE_URL}/pricing">pricing page</a>.</p>

      <h2>How Much Does It Cost?</h2>
      <p>Individuals purchase one 12-month Exam Pass for a selected course with a one-time payment. Visit <a href="${SITE_URL}/pricing">echeloninstitute.ca/pricing</a> for current pricing.</p>
    `,
  },
  {
    path: "/privacy",
    title: "Privacy Policy | Echelon Institute",
    description:
      "Read Echelon Institute's privacy policy. Learn how we collect, use, and protect your personal information in compliance with Canadian privacy law (PIPEDA).",
    h1: "Privacy Policy",
    jsonLd: buildWebPageJsonLd({
      path: "/privacy",
      title: "Privacy Policy | Echelon Institute",
      description:
        "Echelon Institute's privacy policy under Canadian law (PIPEDA).",
      h1: "Privacy Policy",
    }),
    bodyHtml: `
      <h2>Your Privacy Matters</h2>
      <p>Echelon Institute is committed to protecting your personal information in compliance with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable Canadian provincial privacy laws.</p>
      <h2 id="advertising-measurement">Optional Google Ads Measurement</h2>
      <p>We use optional advertising cookies only after you allow ad measurement. They help measure which ads lead to public visits and confirmed purchases. You can continue without tracking or change the choice in this page's browser controls without losing study access. Browser privacy opt-out signals are respected.</p>
      <p>Google may receive browser, device and network information, including an IP address, and process data outside Canada. Our event payloads exclude customer contact details, access tokens, raw payment-session URLs and private learner activity. Public URLs retain only approved route templates and bounded Google ad-click identifiers. Configured purchase measurement contains the actual amount, currency and a non-personal one-way order identifier. We do not enable enhanced conversions or personalized advertising. Read <a href="https://policies.google.com/privacy">Google's Privacy Policy</a>.</p>
      <h2>Contact</h2>
      <p>For privacy-related inquiries, contact <a href="mailto:abello@echeloninstitute.ca">abello@echeloninstitute.ca</a>. Return to the <a href="${SITE_URL}/">homepage</a> or read the <a href="${SITE_URL}/terms">terms of service</a>.</p>
    `,
  },
  {
    path: "/terms",
    title: "Terms of Service | Echelon Institute",
    description:
      "Read Echelon Institute's terms of service. These terms govern your use of the platform, Exam Passes, and legacy subscription services.",
    h1: "Terms of Service",
    jsonLd: buildWebPageJsonLd({
      path: "/terms",
      title: "Terms of Service | Echelon Institute",
      description:
        "Terms governing your use of the Echelon Institute platform.",
      h1: "Terms of Service",
    }),
    bodyHtml: `
      <h2>Terms Governing Your Use of Echelon Institute</h2>
      <p>These terms of service govern your access to and use of the Echelon Institute platform, including Individual Exam Passes, Team plans, grandfathered legacy subscriptions, practice questions, flashcards, mock exams, and AI tutor features.</p>
      <h2>Contact</h2>
      <p>For questions about these terms, contact <a href="mailto:abello@echeloninstitute.ca">abello@echeloninstitute.ca</a>. Read the <a href="${SITE_URL}/privacy">privacy policy</a> or return to the <a href="${SITE_URL}/">homepage</a>.</p>
    `,
  },
  {
    path: "/refund",
    title: "Refund Policy | Echelon Institute",
    description:
      "Read Echelon Institute's refund policy for Individual Exam Passes and Teams plans.",
    h1: "Refund Policy",
    jsonLd: buildWebPageJsonLd({
      path: "/refund",
      title: "Refund Policy | Echelon Institute",
      description:
        "Echelon Institute's refund policy for Individual Exam Passes and Teams plans.",
      h1: "Refund Policy",
    }),
    bodyHtml: `
      <h2>Satisfaction Guarantee</h2>
      <p>${INDIVIDUAL_REFUND_SUMMARY}</p>
      <p>${TEAM_REFUND_SUMMARY}</p>
      <h2>Contact</h2>
      <p>To request a refund or ask about eligibility, contact <a href="mailto:${REFUND_CONTACT_EMAIL}">${REFUND_CONTACT_EMAIL}</a>. View <a href="${SITE_URL}/pricing">Exam Pass and Team pricing</a> or return to the <a href="${SITE_URL}/">homepage</a>.</p>
    `,
  },
  // ── US Expansion Pages ────────────────────────────────────────────────────
  {
    path: "/us",
    title:
      "US Water Operator Exam Prep | Shared WPI Study | Echelon Institute",
    description:
      "Find your state's operator certification requirements, then compare shared WPI preparation for four water and wastewater streams at Class I to IV.",
    h1: "US Water Operator Exam Prep: Start With Your State",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "US Water Operator Exam Prep | Echelon Institute",
      description:
        "State-first course selection and shared WPI preparation for US water and wastewater operators.",
      url: `${SITE_URL}/us`,
      inLanguage: "en-US",
      isPartOf: {
        "@type": "WebSite",
        name: "Echelon Institute",
        url: SITE_URL,
      },
    }),
    bodyHtml: `
      <h2>Start With Your State's Requirements</h2>
      <p><a href="${SITE_URL}/us/states">Find your state</a> before choosing preparation. Exam providers, classifications, and requirements can differ by stream and level. Your certifying authority controls eligibility, exam content, permitted references, and certification.</p>

      <h2>Four Shared WPI Study Streams</h2>
      <p>Echelon's shared WPI catalogue includes Water Treatment, Wastewater Treatment, Water Distribution, and Wastewater Collection at Class I to IV. These are shared preparation courses, not dedicated state exam courses. A state listing does not mean every exam uses WPI or that a shared course covers its requirements. <a href="${SITE_URL}/us/courses">Browse the shared course catalogue</a>.</p>

      <h2>Study Tools in Your Selected Course</h2>
      <p>Use topic-based practice and explanations, flashcards, formula references, timed mock exams, and progress tracking. Active course-pass holders can use the AI Tutor for concepts and calculations. Practice scores and mock exams are study tools, not a guarantee of an exam result or an exact copy of your state's test.</p>

      <h2>Free Preview and Individual Exam Passes</h2>
      <p>Review the selected course's free preview and access details before purchasing. An Individual Exam Pass is for one named learner, one selected course, and 12 months of access from successful payment. Prices are in Canadian dollars (CAD); applicable taxes are added at checkout. <a href="${SITE_URL}/pricing">Review current pricing</a>.</p>

      <h2>Independent Preparation</h2>
      <p>Echelon Institute is independent and is not affiliated with or endorsed by ABC, WPI, or any state certifying authority. The authority's current documents control. Confirm your exam version, passing score, and registration rules with that authority.</p>
    `,
  },
  {
    path: "/us/courses",
    title:
      "Shared WPI Courses for US Operators | Echelon Institute",
    description:
      "Compare shared WPI preparation for water treatment, wastewater treatment, distribution, and collection at Class I to IV. Confirm your state and exam before choosing.",
    h1: "Shared WPI Preparation Courses for US Operators",
    jsonLd: buildWebPageJsonLd({
      path: "/us/courses",
      title: "Shared WPI Courses for US Operators | Echelon Institute",
      description: "Shared WPI preparation at Class I to IV. Check your state's exam and course scope before purchasing.",
      h1: "Shared WPI Preparation Courses for US Operators",
    }),
    bodyHtml: `
      <h2>Check Your State and Exam First</h2>
      <p><a href="${SITE_URL}/us/states">Find your state</a> and confirm your certification stream, class, exam provider, and exam version with the certifying authority. The courses below use the existing shared WPI study routes. They are not dedicated state exam courses and do not replace state-specific regulations or authority study material.</p>

      <h2>Four Streams at Class I to IV</h2>
      <p>Choose from Water Treatment, Wastewater Treatment, Water Distribution, and Wastewater Collection. Course names describe the shared WPI study level, not an automatic match to a state's classification.</p>
      <ul>${COURSE_SEO_PAGES.filter(course => course.regionPath === "/wpi").map(course => `<li><a href="${SITE_URL}${course.quizPath}?country=US">${escapeHtml(course.displayName)}</a>: ${formatCad(course.priceCAD)} for one selected course with 12 months of access from successful payment.</li>`).join("")}</ul>

      <h2>Review the Course Before Purchasing</h2>
      <p>Open the selected course to review its free preview and access details. Course study tools include practice and explanations, flashcards, formula references, timed mock exams, progress tracking, and AI Tutor support for active course-pass holders. Mock exams are practice tools, not an exact reproduction of an authority's exam.</p>

      <h2>Individual Access and CAD Pricing</h2>
      <p>Each Individual Exam Pass is for one named learner and one selected course. Prices are in Canadian dollars (CAD); applicable taxes are added at checkout. <a href="${SITE_URL}/pricing">Review pricing and access terms</a>.</p>

      <h2>Independent Preparation</h2>
      <p>Echelon Institute is independent and is not affiliated with or endorsed by ABC, WPI, or any state certifying authority. Your certifying authority controls eligibility, exam content, permitted references, and certification. The authority's current documents control.</p>
    `,
  },
  {
    path: "/us/states",
    title:
      "US Water Operator Certification by State | Echelon Institute",
    description:
      "Choose your state to review operator certification requirements and course scope. Shared WPI preparation is not a dedicated state exam course.",
    h1: "US Water Operator Certification by State",
    jsonLd: buildWebPageJsonLd({
      path: "/us/states",
      title: "US Water Operator Certification by State | Echelon Institute",
      description:
        "State directory for operator certification requirements and shared WPI course scope, without blanket exam coverage claims.",
      h1: "US Water Operator Certification by State",
    }),
    bodyHtml: `
      <h2>Choose Your State</h2>
      <p>This directory includes all 50 states so you can start with your jurisdiction. A listing does not mean every stream or level uses WPI exams or has a dedicated Echelon course. Check the state page's course scope and the authority's current requirements before purchasing.</p>
      <ul>${US_STATE_NAMES.map(state => `<li><a href="${SITE_URL}/us/states/${state.slug}">${escapeHtml(state.name)}</a></li>`).join("")}</ul>

      <h2>Confirm the Stream, Level, and Exam Version</h2>
      <p>Water treatment, wastewater treatment, distribution, and collection can follow different certification rules in the same state. Your certifying authority controls eligibility, exam content, permitted references, passing scores, and certification. The authority's current documents control.</p>

      <h2>Shared Preparation Is Not a State Exam Course</h2>
      <p>The <a href="${SITE_URL}/us/courses">shared WPI course catalogue</a> provides preparation across four streams at Class I to IV. It does not replace state-specific study material or guarantee a match to your exam. Review the selected course's free preview and access details.</p>

      <h2>Independent Preparation</h2>
      <p>Echelon Institute is independent and is not affiliated with or endorsed by ABC, WPI, or any state certifying authority. Certification decisions belong to the authority, not Echelon.</p>

      <p><a href="${SITE_URL}/us">Return to the US overview</a> or <a href="${SITE_URL}/pricing">review Individual Exam Pass terms and Canadian dollar (CAD) pricing</a>.</p>
    `,
  },
];

function buildRegionPageMeta(page: RegionSeoPage): PageMeta {
  const courses = getCoursesForRegion(page);
  return {
    path: page.path,
    title: `${page.title} | Echelon Institute`,
    description: page.description,
    h1: page.heading,
    changefreq: "monthly",
    priority: "0.9",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: page.heading,
          description: page.description,
          url: `${SITE_URL}${page.path}`,
          inLanguage: "en-CA",
          isPartOf: {
            "@type": "WebSite",
            name: "Echelon Institute",
            url: SITE_URL,
          },
        },
        {
          "@type": "ItemList",
          name: `${page.name} operator exam-prep courses`,
          numberOfItems: courses.length,
          itemListElement: courses.map((course, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: course.displayName,
            url: `${SITE_URL}${course.path}`,
          })),
        },
      ],
    }),
    bodyHtml: `
      <p>${escapeHtml(page.summary)}</p>
      <h2>Confirm the Current Certification Requirements</h2>
      <p>${escapeHtml(page.frameworkNote)} <a href="${page.authorityUrl}">Visit ${escapeHtml(page.authorityName)}</a>.</p>
      <h2>${escapeHtml(page.name)} Operator Exam-Prep Courses</h2>
      <ul>${courses.map(course => `<li><a href="${SITE_URL}${course.path}">${escapeHtml(course.displayName)}</a> — ${formatCad(course.priceCAD)} with 12 months of access from successful payment</li>`).join("")}</ul>
      <h2>Independent Preparation Provider</h2>
      <p>Echelon Institute is independent and is not affiliated with or endorsed by OWWCO, MOECP, EOCP, WPI, or any provincial certifying authority. The authority's current documents control.</p>
    `,
  };
}

function buildCoursePageMeta(course: CourseSeoPage): PageMeta {
  return {
    path: course.path,
    title: `${course.title} | Echelon Institute`,
    description: course.description,
    h1: course.heading,
    changefreq: "monthly",
    priority: "0.8",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.displayName,
      description: course.description,
      url: `${SITE_URL}${course.path}`,
      inLanguage: "en-CA",
      educationalLevel: course.levelLabel,
      provider: {
        "@type": "EducationalOrganization",
        name: "Echelon Institute",
        url: SITE_URL,
      },
      offers: {
        "@type": "Offer",
        price: (course.priceCAD / 100).toFixed(0),
        priceCurrency: "CAD",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/pricing`,
      },
    }),
    bodyHtml: `
      <p>${escapeHtml(course.description)}</p>
      <h2>What Is Included</h2>
      <p>Start with a free 15-question preview. Full access includes course-specific practice, explanations, weak-topic tracking, a timed mock exam, study tools, and AI-supported explanations.</p>
      <h2>Individual Exam Pass</h2>
      <p>${formatCad(course.priceCAD)} CAD for one course with 12 months of access from successful payment through a one-time payment. <a href="${SITE_URL}/pricing">View current pricing</a>.</p>
      <h2>Start the Free Preview</h2>
      <p><a href="${SITE_URL}${course.quizPath}">Try the first 15 questions</a> with no account or credit card required.</p>
      <h2>Certification Requirements</h2>
      <p>Echelon is an independent preparation provider. It does not issue certificates or guarantee an exam result. Confirm eligibility, exam content, permitted references, and current rules with the applicable certifying authority.</p>
    `,
  };
}

function buildUSStatePageMeta(state: USStateConfig): PageMeta {
  const body = US_STREAMS.map(stream => {
    const program = state.programs.find(item => item.stream === stream.key)!;
    const courses = matchedUSCourses(state, stream.key);
    const choices = courses.length ? `<ul>${courses.map(course => `<li>${escapeHtml(course.displayName)}: <a href="${escapeHtml(usCourseHref(course, "practice", state.code)!)}">Practice</a> | <a href="${escapeHtml(usCourseHref(course, "mock", state.code)!)}">Mock exam</a> | <a href="${escapeHtml(usCourseHref(course, "flashcards", state.code)!)}">Flashcards</a></li>`).join("")}</ul>` : `<p>No state-matched course is linked for this stream yet.</p>`;
    return `<section><h2>${escapeHtml(stream.label)}</h2><p>${escapeHtml(usProgramLabel(program))}</p>
      <p><strong>Program authority:</strong> ${escapeHtml(program.authorityName || "Not confirmed")}</p>
      <p><strong>Local levels:</strong> ${escapeHtml(program.localLevels)}</p><p>${escapeHtml(program.note)}</p>
      ${program.authorityUrl ? `<p><a href="${escapeHtml(program.authorityUrl)}">Official program information</a></p>` : ""}
      ${choices}${program.sources.length ? `<h3>Sources and exam scope</h3><ul>${program.sources.map(source => `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.title)}</a><p>${escapeHtml(source.evidence)}</p></li>`).join("")}</ul>` : ""}</section>`;
  }).join("");
  return {
    path: `/us/states/${state.slug}`, title: `${state.name} Operator Exam Routes | Echelon Institute`,
    description: `Check ${state.name} water and wastewater exam programs, official sources and confirmed shared WPI course matches. State-specific courses are listed separately.`,
    h1: `${state.name} operator exam preparation`, changefreq: "monthly", priority: "0.6",
    bodyHtml: `<p>Source check: ${US_RESEARCH_CHECKED_DATE}. Shared WPI courses are linked only where the standardized exam and class match are confirmed. Local grades may not equal WPI class numbers. Your authority's current documents control.</p>${body}
      ${state.dedicatedCourseNeeds.length ? `<h2>Dedicated course research</h2><p>Dedicated prep is not available or being sold yet.</p><ul>${state.dedicatedCourseNeeds.map(note => `<li>${escapeHtml(note)}</li>`).join("")}</ul>` : ""}
      ${state.limits.length ? `<h2>What still needs confirmation</h2><ul>${state.limits.map(note => `<li>${escapeHtml(note)}</li>`).join("")}</ul>` : ""}
      <p><a href="/us/courses?state=${state.code}">View confirmed shared courses</a> or <a href="/us/states">view all states</a>.</p>`,
  };
}

export const STATIC_PAGE_META: PageMeta[] = [
  ...BASE_STATIC_PAGE_META,
  ...getStudyUtilityPageMeta(),
  {
    path: "/teams",
    title:
      "Water Operator Training for Utilities & Municipalities | Echelon Teams",
    description:
      "Manage water and wastewater operator exam preparation with flexible team seats, learner assignments, progress reporting, receipts, and invoices.",
    h1: "Operator Training and Exam Preparation for Teams",
    changefreq: "monthly",
    priority: "0.9",
    bodyHtml: `
      <h2>Certification Preparation for Utilities and Municipalities</h2>
      <p>Echelon Teams lets managers assign course access, monitor learner activity, and support operators preparing for water and wastewater certification exams.</p>
      <h2>Flexible Team Access</h2>
      <p>Choose 3 or 6 months of access and assign seats to the courses each operator needs. Payment records include downloadable receipts and invoices.</p>
      <h2>Independent Training Platform</h2>
      <p>Echelon Institute is an independent preparation provider and is not affiliated with or endorsed by a certifying authority. <a href="${SITE_URL}/teams">Explore Teams</a> or <a href="mailto:abello@echeloninstitute.ca">contact Echelon</a>.</p>
    `,
  },
  ...REGION_SEO_PAGES.map(buildRegionPageMeta),
  ...COURSE_SEO_PAGES.map(buildCoursePageMeta),
  ...Object.values(US_STATE_CONFIGS).map(buildUSStatePageMeta),
];

/** Build a map for O(1) lookup */
const META_MAP = new Map<string, PageMeta>(
  STATIC_PAGE_META.map(m => [m.path, m])
);

/** Read the index.html shell (works in both dev and prod) */
function getIndexHtml(isDev: boolean): string {
  const templatePath = isDev
    ? path.resolve(process.cwd(), "client", "index.html")
    : path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        "public",
        "index.html"
      );
  if (!fs.existsSync(templatePath)) {
    const devPath = path.resolve(process.cwd(), "client", "index.html");
    return fs.readFileSync(devPath, "utf-8");
  }
  return fs.readFileSync(templatePath, "utf-8");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * hreflang pairs — where a US and a Canadian equivalent exist for the same content,
 * we tell Google which language/region each is for. `/us` is the entry to the US
 * variant; `/` is the entry to the Canadian variant. `x-default` should point to
 * the language-neutral fallback (we use `/` since the site is English-first).
 */
const HREFLANG_GROUPS: ReadonlyArray<{
  enCA: string;
  enUS: string;
}> = [
  { enCA: "/", enUS: "/us" },
  { enCA: "/wpi", enUS: "/us/courses" },
  { enCA: "/canada/ontario", enUS: "/us/states" },
];

function buildHreflangTags(path: string): string {
  const group = HREFLANG_GROUPS.find(
    g => g.enCA === path || g.enUS === path
  );
  if (!group) return "";
  const caUrl = `${SITE_URL}${group.enCA}`;
  const usUrl = `${SITE_URL}${group.enUS}`;
  return `
    <link rel="alternate" hreflang="en-CA" href="${caUrl}" />
    <link rel="alternate" hreflang="en-US" href="${usUrl}" />
    <link rel="alternate" hreflang="x-default" href="${caUrl}" />`;
}

function buildSeoHead(meta: PageMeta): string {
  const canonicalUrl = `${SITE_URL}${meta.path}`;
  const titleEsc = escapeHtml(meta.title);
  const descEsc = escapeHtml(meta.description);
  const jsonLd = meta.jsonLd ?? buildWebPageJsonLd(meta);
  const hreflangTags = buildHreflangTags(meta.path);
  const isUsPage = meta.path === "/us" || meta.path.startsWith("/us/");
  const ogLocale = isUsPage ? "en_US" : "en_CA";

  return `
    <meta name="description" content="${descEsc}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonicalUrl}" />${hreflangTags}
    <meta property="og:title" content="${titleEsc}" />
    <meta property="og:description" content="${descEsc}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${DEFAULT_OG_IMAGE}" />
    <meta property="og:site_name" content="Echelon Institute" />
    <meta property="og:locale" content="${ogLocale}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${titleEsc}" />
    <meta name="twitter:description" content="${descEsc}" />
    <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />
    <script type="application/ld+json">${jsonLd.replace(/</g, "\\u003c")}</script>`;
}

/** Rich crawlable HTML body shell with H1, H2s, body copy, and internal links */
function buildSsrBody(meta: PageMeta): string {
  return brandedShell(`<h1>${escapeHtml(meta.h1)}</h1>${meta.bodyHtml ?? ""}`);
}

export function injectSeoIntoTemplate(template: string, meta: PageMeta): string {
  const titleTag = `<title>${escapeHtml(meta.title)}</title>`;
  const seoHead = buildSeoHead(meta);
  const ssrBody = buildSsrBody(meta);

  let html = template
    // Replace the default <title>
    .replace(/<title>[^<]*<\/title>/, () => titleTag)
    // Remove default <meta name="description"> to avoid duplicates
    .replace(/<meta name="description"[^>]*>/, "")
    // Remove default canonical to avoid duplicates
    .replace(/<link rel="canonical"[^>]*>/, "")
    // Remove default robots meta to avoid duplicates
    .replace(/<meta name="robots"[^>]*>/, "")
    // Remove all OG meta tags from the template (SSR will inject correct ones)
    .replace(/<meta property="og:[^"]+"[^>]*>/g, "")
    // Remove all Twitter Card meta tags from the template (SSR will inject correct ones)
    .replace(/<meta name="twitter:[^"]+"[^>]*>/g, "")
    // Inject all SEO tags before </head>
    .replace("</head>", () => `${seoHead}\n</head>`);
  html = replaceAppRoot(html, ssrBody);

  return html;
}

/** Build the llms.txt content for AI assistants and answer engines. */
export function buildLlmsTxt(): string {
  return `# Echelon Institute
> Independent Canadian exam-preparation platform for water and wastewater operators.

Echelon Institute provides course-specific practice questions, mock exams, flashcards, process guides, progress tracking, and AI-supported explanations. Every course includes 15 free practice questions. OIT also includes 50 flashcards, 30 mock-exam questions, and three AI Tutor messages without an account or credit card. An Individual Exam Pass is a one-time payment for one selected course and 12 months of access from successful payment.

Echelon Institute is independent. It is not affiliated with or endorsed by OWWCO, MOECP, EOCP, WPI, or a provincial or US state certifying authority. Official authority documents control eligibility, exam content, permitted references, and certification decisions.

## Canadian Course Coverage
- Ontario-specific OIT, Water Quality Analyst, and Class 1–4 preparation for water treatment, water distribution and supply, wastewater treatment, and wastewater collection
- WPI-aligned Class I–IV preparation for water treatment, wastewater treatment, water distribution, and wastewater collection
- Province guides for British Columbia, Alberta, Saskatchewan, and Manitoba explain where to confirm current requirements

## US Coverage
- Water Treatment — Class I, II, III, IV
- Wastewater Treatment — Class I, II, III, IV
- Water Distribution — Class I, II, III, IV
- Wastewater Collection — Class I, II, III, IV
- Shared WPI preparation is linked per state, stream and confirmed WPI class. A state listing is not complete exam coverage.
- Customized, mixed and unique state exams require separate research and dedicated courses. Those courses are not yet offered or sold.
- Local grade names can differ from WPI class numbers. Candidates must confirm their exam version and local requirements with the authority.

## Key Pages
- Homepage: ${SITE_URL}/
- Ontario Exam Prep: ${SITE_URL}/canada/ontario
- British Columbia Exam Prep: ${SITE_URL}/canada/british-columbia
- Alberta Exam Prep: ${SITE_URL}/canada/alberta
- Saskatchewan Exam Prep: ${SITE_URL}/canada/saskatchewan
- Manitoba Exam Prep: ${SITE_URL}/canada/manitoba
- Course Catalogue: ${SITE_URL}/#courses
- Teams: ${SITE_URL}/teams
- US Operator Exam Prep: ${SITE_URL}/us
- US Courses: ${SITE_URL}/us/courses
- US States: ${SITE_URL}/us/states
- Process Guides: ${SITE_URL}/guides
- Pricing: ${SITE_URL}/pricing
- About: ${SITE_URL}/about
- FAQ: ${SITE_URL}/faq
- Blog: ${SITE_URL}/blog
- WPI-Aligned Exam Preparation: ${SITE_URL}/wpi
- Jobs Board: ${SITE_URL}/jobs

## Course Detail Pages
${COURSE_SEO_PAGES.map(course => `- ${course.displayName}: ${SITE_URL}${course.path}`).join("\n")}

## Blog Articles (for detailed certification information)
- ${SITE_URL}/blog/how-to-pass-ontario-oit-water-exam
- ${SITE_URL}/blog/how-to-become-water-wastewater-operator-ontario
- ${SITE_URL}/blog/ontario-oit-exam-eligibility-format-fees-study-plan
- ${SITE_URL}/blog/class-1-water-treatment-practice-questions-study-guide
- ${SITE_URL}/blog/class-1-wastewater-treatment-practice-questions-study-guide
- ${SITE_URL}/blog/how-long-study-water-operator-certification-exam
- ${SITE_URL}/blog/water-operator-certification-reciprocity-canada
- ${SITE_URL}/blog/utilities-build-certification-ready-operator-workforce
- ${SITE_URL}/blog/water-operator-training-programs-municipal-manager-checklist
- ${SITE_URL}/blog/water-operator-salary-canada-by-province-2026
- ${SITE_URL}/blog/ontario-water-operator-exam-math-formulas-cheat-sheet
- ${SITE_URL}/blog/water-treatment-chlorination-guide-ontario-operators
- ${SITE_URL}/blog/ontario-class-1-vs-class-2-water-operator-differences
- ${SITE_URL}/blog/owwco-wastewater-operator-certification-ontario-guide
- ${SITE_URL}/blog/canadian-water-operator-certification-by-province
- ${SITE_URL}/blog/bc-water-operator-certification-guide
- ${SITE_URL}/blog/eocp-exam-study-tips-bc
- ${SITE_URL}/blog/alberta-water-operator-certification-guide
- ${SITE_URL}/blog/awwoa-level-1-exam-prep-alberta
- ${SITE_URL}/blog/manitoba-water-operator-certification-guide
- ${SITE_URL}/blog/saskatchewan-water-operator-certification-guide

## Contact
- Email: abello@echeloninstitute.ca
- Website: ${SITE_URL}
`;
}

/** Register SSR routes for all static public pages */
export function registerPageSsrRoutes(
  app: Express,
  isDev: boolean,
  vite?: { transformIndexHtml: (url: string, html: string) => Promise<string> },
  loadBlogLinks: () => Promise<PublicBlogLink[]> = boundedPublicBlogLinks
): void {
  // Serve llms.txt for AI model discoverability
  app.get("/llms.txt", (_req: Request, res: Response) => {
    res
      .status(200)
      .set({
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      })
      .end(buildLlmsTxt());
  });

  // Serve llms-full.txt (same content — some AI crawlers check this path)
  app.get("/llms-full.txt", (_req: Request, res: Response) => {
    res
      .status(200)
      .set({
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      })
      .end(buildLlmsTxt());
  });

  // Exact-path routes only — /blog/:slug is handled by blogSsr.ts
  const staticPaths = STATIC_PAGE_META.map(m => m.path);

  for (const pagePath of staticPaths) {
    app.get(
      pagePath === "/" ? "/" : pagePath,
      async (req: Request, res: Response, next) => {
        // Only handle exact path match (no query string confusion)
        const meta = META_MAP.get(pagePath);
        if (!meta) return res.status(404).send("Not found");

        try {
          const template = getIndexHtml(isDev);
          let renderMeta = meta;
          let blogUnavailable = false;
          if (pagePath === "/blog") {
            try {
              const posts = await loadBlogLinks();
              const body = (meta.bodyHtml ?? "").replace(/<h2>Featured Articles<\/h2>[\s\S]*?<\/ul>/, () => renderPublicBlogLinks(posts));
              renderMeta = { ...meta, bodyHtml: body };
            } catch {
              blogUnavailable = true;
              renderMeta = { ...meta, bodyHtml: (meta.bodyHtml ?? "").replace(/<h2>Featured Articles<\/h2>[\s\S]*?<\/ul>/, "<h2>Published Articles</h2><p>Articles are temporarily unavailable. Please reload or use the interactive blog when it is ready.</p>") };
            }
          }
          const seoHtml = injectSeoIntoTemplate(template, renderMeta);
          // In dev mode, run Vite's transformIndexHtml so it injects @vite/client
          // and HMR scripts — without this, React never mounts on SSR-served pages.
          const html =
            isDev && vite
              ? await vite.transformIndexHtml(req.originalUrl, seoHtml)
              : seoHtml;
          res
            .status(200)
            .set({
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": isDev || blogUnavailable ? "no-store" : PUBLIC_SSR_CACHE_CONTROL,
            })
            .end(html);
        } catch (err) {
          console.error("[pageSsr] Public render unavailable");
          // Known routes keep the SPA shell on transient rendering failures.
          next();
        }
      }
    );
  }
}

/** Export meta map for use in dynamic sitemap */
export { META_MAP };
