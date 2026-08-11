/**
 * Server-Side Rendering for Static Public Pages
 *
 * Intercepts the 9 static public routes BEFORE the SPA catch-all and injects
 * per-route title, meta description, canonical, robots, H1, structured data,
 * and rich body copy so crawlers and AI models see real content without JS.
 *
 * Routes handled:
 *   /          → Homepage
 *   /pricing   → Pricing
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
import fs from "fs";
import path from "path";

const SITE_URL = "https://echeloninstitute.ca";
const DEFAULT_OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/og-image-new-NPyJfV6kq45KpTXHZ5UW8N.png";
const PUBLISHER_LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/favicon-512_1eb3c09e.png";

interface PageMeta {
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
          text: "Echelon Institute is Canada's AI-powered exam prep platform for water and wastewater operators. It provides adaptive practice questions, module study notes, 500+ flashcards per course, interactive process guides, and an AI tutor available 24/7.",
        },
      },
      {
        "@type": "Question",
        name: "Which provinces does Echelon cover?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Echelon covers Ontario (OIT, Class 1–4 Water Treatment, Water Distribution, Wastewater Treatment, and Wastewater Collection), British Columbia (EOCP), Alberta (AWWOA Level 1–4), Saskatchewan (SLWA), and Manitoba (WQAM). WPI content is available for all provinces.",
        },
      },
      {
        "@type": "Question",
        name: "Is there a free trial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The first 15 questions on every course are completely free — no account or credit card required. You can start practising immediately at echeloninstitute.ca.",
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
          text: "Echelon has over 500 practice questions per course, organized by module and difficulty level. The question bank covers all exam topics including treatment processes, laboratory analysis, equipment operation and maintenance, source water, and safety and administration.",
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
          text: "Echelon offers a monthly plan and an annual plan at a discounted rate. Team plans are available for utilities and municipalities. Visit echeloninstitute.ca/pricing for current pricing in Canadian dollars.",
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
      "Canada's AI-powered exam prep platform for water and wastewater operators. Adaptive practice questions, flashcards, study notes, and an AI tutor for OIT, EOCP, AWWOA, SLWA, and WQAM certifications.",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "abello@echeloninstitute.ca",
      availableLanguage: "English",
    },
  });
}

function buildPricingJsonLd(): string {
  return JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Pricing — Echelon Institute",
      description:
        "View Echelon Institute's subscription plans for individual operators and team plans for utilities and municipalities.",
      url: `${SITE_URL}/pricing`,
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Echelon Institute Practice Pass",
      description:
        "Full access to all water and wastewater operator exam prep courses, including 500+ practice questions per course, flashcards, study notes, mock exams, and AI tutor.",
      brand: {
        "@type": "Brand",
        name: "Echelon Institute",
      },
      offers: [
        {
          "@type": "Offer",
          name: "Monthly Plan",
          priceCurrency: "CAD",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/pricing`,
        },
        {
          "@type": "Offer",
          name: "Annual Plan",
          priceCurrency: "CAD",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/pricing`,
        },
      ],
    },
  ]);
}

/** All static public page metadata */
export const STATIC_PAGE_META: PageMeta[] = [
  {
    path: "/",
    title: "Water & Wastewater Operator Exam Prep | Echelon Institute",
    description:
      "Canada's AI-powered exam prep platform for water and wastewater operators. Adaptive practice questions, 500+ flashcards, study notes, and an AI tutor for OIT, EOCP, AWWOA, SLWA, and WQAM certifications.",
    h1: "Pass Your Operator Exam. Advance Your Career.",
    jsonLd: buildOrganizationJsonLd(),
    bodyHtml: `
      <h2>Canada's Exam Prep Platform for Water &amp; Wastewater Operators</h2>
      <p>Echelon Institute is Canada's AI-powered exam prep platform built specifically for water and wastewater operators. Whether you are preparing for the Ontario OIT exam, the BC EOCP certification, the Alberta AWWOA exam, Saskatchewan SLWA, or Manitoba WQAM, Echelon provides the tools you need to pass on your first attempt.</p>

      <h2>What's Included</h2>
      <p>Every Echelon course includes over 500 adaptive practice questions organized by module and difficulty, 500+ digital flashcards, comprehensive study notes, timed mock exams that simulate the real test format, and an AI tutor available 24/7 to explain concepts, walk through calculations, and answer your questions in plain language.</p>

      <h2>Courses Available</h2>
      <p>Echelon covers Ontario Class 1, 2, 3, and 4 Water Treatment, Water Distribution, Wastewater Treatment, and Wastewater Collection certifications. OIT (Operator-in-Training) content is available for free. British Columbia EOCP, Alberta AWWOA Level 1–4, Saskatchewan SLWA, and Manitoba WQAM courses are also available.</p>

      <h2>Free to Start</h2>
      <p>The first 15 questions on every course are completely free — no account or credit card required. Start practising right now and see exactly how Echelon works before you subscribe.</p>

      <h2>Team Plans for Utilities</h2>
      <p>Echelon offers bulk seat pricing for utilities, municipalities, and training organizations. Team plans include a shared admin dashboard and volume discounts. Contact us at <a href="mailto:abello@echeloninstitute.ca">abello@echeloninstitute.ca</a> or visit <a href="${SITE_URL}/pricing">our pricing page</a> to learn more.</p>

      <h2>Study Resources</h2>
      <p>The <a href="${SITE_URL}/guides">Echelon Process Guides</a> cover water treatment, distribution systems, wastewater treatment, collection, pumping, instrumentation and chemical feed through interactive diagrams and topic-linked practice. The <a href="${SITE_URL}/blog">Echelon blog</a> publishes in-depth certification guides for every province.</p>
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
      title: "Interactive Process Guides for Water Operators | Echelon Institute",
      description: "Interactive technical learning guides for water and wastewater operator certification.",
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
      "View Echelon Institute's subscription plans. Monthly and annual plans for individual operators, plus team plans for utilities and municipalities across Canada.",
    h1: "Simple, Transparent Pricing for Every Operator",
    jsonLd: buildPricingJsonLd(),
    bodyHtml: `
      <h2>Individual Plans</h2>
      <p>Echelon offers monthly and annual subscription plans for individual water and wastewater operators. The annual plan provides the best value with a significant discount compared to monthly billing. All plans include full access to every course — Ontario OIT, Class 1–4 Water Treatment, Water Distribution, Wastewater Treatment, Wastewater Collection, BC EOCP, Alberta AWWOA, Saskatchewan SLWA, and Manitoba WQAM.</p>

      <h2>What Every Plan Includes</h2>
      <p>Every subscription includes 500+ adaptive practice questions per course organized by module, 500+ digital flashcards, comprehensive study notes, timed mock exams, the AI tutor, WPI process guides, and score history tracking so you can see your progress over time.</p>

      <h2>Team Plans for Utilities and Municipalities</h2>
      <p>Echelon offers bulk seat pricing for utilities, municipalities, training organizations, and Indigenous water authorities. Team plans include a shared admin dashboard, usage reporting, and volume discounts. Contact <a href="mailto:abello@echeloninstitute.ca">abello@echeloninstitute.ca</a> to discuss your organization's needs.</p>

      <h2>Free Access</h2>
      <p>The first 15 questions on every course are always free — no account required. OIT content is available at no cost to help entry-level operators get started. Visit <a href="${SITE_URL}/">the homepage</a> to begin practising immediately.</p>

      <h2>Refund Policy</h2>
      <p>Echelon offers a satisfaction guarantee. Read the full <a href="${SITE_URL}/refund">refund policy</a> for details on eligibility and the process for requesting a refund.</p>
    `,
  },
  {
    path: "/about",
    title: "About Echelon Institute | Canadian Water Operator Exam Prep",
    description:
      "Learn about Echelon Institute — Canada's AI-powered exam prep platform built specifically for water and wastewater operators preparing for OIT, EOCP, AWWOA, SLWA, and WQAM certifications.",
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
      <p>Unlike generic exam prep platforms, Echelon is built specifically for the Canadian water sector. Every question, study note, and process guide is written to reflect Canadian regulations, provincial certification standards, and the actual content of exams administered by MECP (Ontario), EOCP (BC), AWWOA (Alberta), SLWA (Saskatchewan), and WQAM (Manitoba).</p>

      <h2>AI-Powered Learning</h2>
      <p>Echelon's AI tutor is available 24/7 to answer questions, explain concepts, and walk through calculation problems in plain language. The adaptive question engine tracks your performance by module and adjusts difficulty to focus your study time where it matters most.</p>

      <h2>Certifications Covered</h2>
      <p>Echelon covers Ontario OIT, Class 1–4 Water Treatment, Class 1–4 Water Distribution, Class 1–4 Wastewater Treatment, Class 1–4 Wastewater Collection, British Columbia EOCP, Alberta AWWOA Level 1–4, Saskatchewan SLWA, and Manitoba WQAM. New certifications are added regularly.</p>

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
      <p>Preparing for a promotion or a new role? Echelon's exam prep platform helps you earn higher-class certifications faster. Visit <a href="${SITE_URL}/pricing">our pricing page</a> to see subscription options, or start with the <a href="${SITE_URL}/">free practice questions</a> available on every course.</p>

      <h2>Water Operator Career Resources</h2>
      <p>Read the <a href="${SITE_URL}/blog/water-operator-salary-canada-by-province-2025">Water Operator Salary Guide</a> for province-by-province compensation data, and the <a href="${SITE_URL}/blog/canadian-water-operator-certification-by-province">Canadian Certification Guide</a> for a full breakdown of requirements in every province.</p>
    `,
  },
  {
    path: "/blog",
    title: "Water Operator Certification Blog | Echelon Institute",
    description:
      "Expert guides on water and wastewater operator certification across Canada. Province-by-province exam prep tips, study strategies, and career advice for OIT, EOCP, AWWOA, SLWA, and WQAM.",
    h1: "Water Operator Certification Guides & Exam Prep Tips",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Echelon Institute Blog",
      description:
        "Expert guides on water and wastewater operator certification across Canada.",
      url: `${SITE_URL}/blog`,
      publisher: {
        "@type": "Organization",
        name: "Echelon Institute",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: PUBLISHER_LOGO },
      },
    }),
    bodyHtml: `
      <h2>Certification Guides by Province</h2>
      <p>Echelon publishes in-depth certification guides for every province in Canada. Each guide covers the exam format, registration process, study tips, and the specific topics you need to master.</p>

      <h2>Featured Articles</h2>
      <ul>
        <li><a href="${SITE_URL}/blog/how-to-pass-ontario-oit-water-exam">How to Pass the Ontario OIT Water Exam</a></li>
        <li><a href="${SITE_URL}/blog/water-operator-salary-canada-by-province-2025">Water Operator Salary in Canada by Province (2025)</a></li>
        <li><a href="${SITE_URL}/blog/ontario-water-operator-exam-math-formulas-cheat-sheet">Ontario Water Operator Exam Math Formulas Cheat Sheet</a></li>
        <li><a href="${SITE_URL}/blog/water-treatment-chlorination-guide-ontario-operators">Water Treatment Chlorination Guide for Ontario Operators</a></li>
        <li><a href="${SITE_URL}/blog/ontario-class-1-vs-class-2-water-operator-differences">Ontario Class 1 vs Class 2 Water Operator: Key Differences</a></li>
        <li><a href="${SITE_URL}/blog/owwco-wastewater-operator-certification-ontario-guide">OWWCO Wastewater Operator Certification Ontario Guide</a></li>
        <li><a href="${SITE_URL}/blog/canadian-water-operator-certification-by-province">Canadian Water Operator Certification by Province</a></li>
        <li><a href="${SITE_URL}/blog/bc-water-operator-certification-guide">BC Water Operator Certification Guide (EOCP)</a></li>
        <li><a href="${SITE_URL}/blog/eocp-exam-study-tips-bc">EOCP Exam Study Tips for BC Operators</a></li>
        <li><a href="${SITE_URL}/blog/alberta-water-operator-certification-guide">Alberta Water Operator Certification Guide (AWWOA)</a></li>
        <li><a href="${SITE_URL}/blog/awwoa-level-1-exam-prep-alberta">AWWOA Level 1 Exam Prep for Alberta Operators</a></li>
        <li><a href="${SITE_URL}/blog/manitoba-water-operator-certification-guide">Manitoba Water Operator Certification Guide (WQAM)</a></li>
        <li><a href="${SITE_URL}/blog/saskatchewan-water-operator-certification-guide">Saskatchewan Water Operator Certification Guide (SLWA)</a></li>
      </ul>

      <h2>Start Practising</h2>
      <p>Ready to study? <a href="${SITE_URL}/">Start with free practice questions</a> on any course — no account required. Subscribe for full access to all 500+ questions, flashcards, mock exams, and the AI tutor.</p>
    `,
  },
  {
    path: "/wpi",
    title: "WPI Water Professionals International | Echelon Institute",
    description:
      "WPI (Water Professionals International) is Echelon Institute's interactive process guide for Canadian water and wastewater operators. Explore treatment processes, equipment, and regulations by province.",
    h1: "WPI — Water Professionals International",
    jsonLd: buildWebPageJsonLd({
      path: "/wpi",
      title: "WPI Water Professionals International | Echelon Institute",
      description:
        "Interactive process guide for Canadian water and wastewater operators.",
      h1: "WPI — Water Professionals International",
    }),
    bodyHtml: `
      <h2>Interactive Process Guides for Water Operators</h2>
      <p>WPI (Water Professionals International) is Echelon Institute's interactive reference guide for Canadian water and wastewater operators. It covers the full treatment process from source water intake to distribution, as well as wastewater collection and treatment systems.</p>

      <h2>What WPI Covers</h2>
      <p>WPI includes detailed explanations of coagulation and flocculation, sedimentation, filtration, disinfection (chlorination, UV, ozone), chemical feed and dosing, iron and manganese removal, water quality regulations, pump operation, and more. Wastewater content covers primary and secondary treatment, biological processes, sludge handling, and collection system maintenance.</p>

      <h2>Province-Specific Content</h2>
      <p>WPI content is aligned with the regulatory frameworks of Ontario (MECP), British Columbia (EOCP), Alberta (AWWOA), Saskatchewan (SLWA), and Manitoba (WQAM). Regulatory references and standards are province-specific where they differ.</p>

      <h2>Use WPI Alongside Your Practice Questions</h2>
      <p>WPI is designed to complement Echelon's practice question bank. When you encounter a topic you are unsure about in a practice question, WPI provides the conceptual background and regulatory context to help you understand the correct answer. <a href="${SITE_URL}/">Start practising</a> or <a href="${SITE_URL}/pricing">view subscription plans</a>.</p>
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
      <p>Echelon Institute is Canada's AI-powered exam prep platform for water and wastewater operators. It provides adaptive practice questions, module study notes, 500+ flashcards per course, interactive process guides, mock exams, and an AI tutor available 24/7.</p>

      <h2>Which Provinces Are Covered?</h2>
      <p>Echelon covers Ontario (OIT, Class 1–4 Water Treatment, Water Distribution, Wastewater Treatment, Wastewater Collection), British Columbia (EOCP), Alberta (AWWOA Level 1–4), Saskatchewan (SLWA), and Manitoba (WQAM).</p>

      <h2>Is There a Free Trial?</h2>
      <p>Yes. The first 15 questions on every course are completely free — no account or credit card required. OIT content is also available at no cost. <a href="${SITE_URL}/">Start practising now</a>.</p>

      <h2>How Many Practice Questions Are There?</h2>
      <p>Each course has 500+ practice questions organized by module and difficulty level. Topics include treatment processes, laboratory analysis, equipment operation and maintenance, source water, and safety and administration.</p>

      <h2>What Is the AI Tutor?</h2>
      <p>The Echelon AI tutor is a 24/7 study assistant trained on water and wastewater operator content. It explains concepts, walks through calculation steps, clarifies regulations, and answers questions about any topic in your course — all in plain language.</p>

      <h2>Team Plans for Utilities</h2>
      <p>Echelon offers bulk seat pricing for utilities, municipalities, and training organizations. Contact <a href="mailto:abello@echeloninstitute.ca">abello@echeloninstitute.ca</a> or visit the <a href="${SITE_URL}/pricing">pricing page</a>.</p>

      <h2>How Much Does It Cost?</h2>
      <p>Echelon offers monthly and annual plans. The annual plan provides the best value. Visit <a href="${SITE_URL}/pricing">echeloninstitute.ca/pricing</a> for current pricing in Canadian dollars.</p>
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
      description: "Echelon Institute's privacy policy under Canadian law (PIPEDA).",
      h1: "Privacy Policy",
    }),
    bodyHtml: `
      <h2>Your Privacy Matters</h2>
      <p>Echelon Institute is committed to protecting your personal information in compliance with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable Canadian provincial privacy laws.</p>
      <h2>Contact</h2>
      <p>For privacy-related inquiries, contact <a href="mailto:abello@echeloninstitute.ca">abello@echeloninstitute.ca</a>. Return to the <a href="${SITE_URL}/">homepage</a> or read the <a href="${SITE_URL}/terms">terms of service</a>.</p>
    `,
  },
  {
    path: "/terms",
    title: "Terms of Service | Echelon Institute",
    description:
      "Read Echelon Institute's terms of service. These terms govern your use of the platform and all subscription services.",
    h1: "Terms of Service",
    jsonLd: buildWebPageJsonLd({
      path: "/terms",
      title: "Terms of Service | Echelon Institute",
      description: "Terms governing your use of the Echelon Institute platform.",
      h1: "Terms of Service",
    }),
    bodyHtml: `
      <h2>Terms Governing Your Use of Echelon Institute</h2>
      <p>These terms of service govern your access to and use of the Echelon Institute platform, including all subscription services, practice questions, flashcards, mock exams, and AI tutor features.</p>
      <h2>Contact</h2>
      <p>For questions about these terms, contact <a href="mailto:abello@echeloninstitute.ca">abello@echeloninstitute.ca</a>. Read the <a href="${SITE_URL}/privacy">privacy policy</a> or return to the <a href="${SITE_URL}/">homepage</a>.</p>
    `,
  },
  {
    path: "/refund",
    title: "Refund Policy | Echelon Institute",
    description:
      "Read Echelon Institute's refund policy. Understand the conditions under which refunds are issued for monthly and annual subscriptions.",
    h1: "Refund Policy",
    jsonLd: buildWebPageJsonLd({
      path: "/refund",
      title: "Refund Policy | Echelon Institute",
      description: "Echelon Institute's refund policy for subscriptions.",
      h1: "Refund Policy",
    }),
    bodyHtml: `
      <h2>Satisfaction Guarantee</h2>
      <p>Echelon Institute offers a satisfaction guarantee for subscriptions. If you are not satisfied with your purchase, contact us to discuss your options.</p>
      <h2>Contact</h2>
      <p>To request a refund or ask about eligibility, contact <a href="mailto:abello@echeloninstitute.ca">abello@echeloninstitute.ca</a>. View <a href="${SITE_URL}/pricing">subscription plans</a> or return to the <a href="${SITE_URL}/">homepage</a>.</p>
    `,
  },
  // ── US Expansion Pages ────────────────────────────────────────────────────
  {
    path: "/us",
    title: "US Water Operator Exam Prep | ABC/WPI Certification Study — Echelon Institute",
    description:
      "AI-powered exam prep for US water and wastewater operators. Aligned to the 2025 ABC/WPI Need-to-Know Criteria for all 4 streams (water treatment, wastewater treatment, distribution, collection) and all 4 class levels.",
    h1: "US Water Operator Exam Prep — Pass Your ABC/WPI Certification",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "US Water Operator Exam Prep | Echelon Institute",
      description: "AI-powered ABC/WPI exam prep for US water and wastewater operators.",
      url: `${SITE_URL}/us`,
      inLanguage: "en-US",
      isPartOf: { "@type": "WebSite", name: "Echelon Institute", url: SITE_URL },
    }),
    bodyHtml: `
      <h2>ABC/WPI Exam Prep for US Water Operators</h2>
      <p>Echelon Institute provides AI-powered exam preparation for US water and wastewater operators pursuing ABC/WPI certification. All content is aligned to the official 2025 WPI Need-to-Know Criteria published by Water Professionals International (WPI) and the Association of Boards of Certification (ABC).</p>

      <h2>All Four Certification Streams</h2>
      <p>Echelon covers all four operator certification streams: <a href="${SITE_URL}/wpi-class1-water">Water Treatment</a>, <a href="${SITE_URL}/wpi-class1-wastewater">Wastewater Treatment</a>, <a href="${SITE_URL}/wpi-class1-water-dist">Water Distribution</a>, and <a href="${SITE_URL}/wpi-class1-water-coll">Wastewater Collection</a>. Each stream is available for Class I through Class IV.</p>

      <h2>45 States Covered</h2>
      <p>Approximately 45 US states use the ABC/WPI standardized exam system. Echelon covers operators in Iowa, Colorado, Oregon, Ohio, Michigan, Wisconsin, Minnesota, Indiana, Virginia, North Carolina, Georgia, Maryland, Massachusetts, Washington, Pennsylvania, and all other WPI states. <a href="${SITE_URL}/us/states">Find your state</a>.</p>

      <h2>What the WPI Exam Covers</h2>
      <p>The WPI exam consists of 100 multiple-choice questions covering treatment processes, laboratory analysis, equipment operation and maintenance, source water quality, and safety and security. Calculation questions make up 10–16% of the exam. The passing score is 70%.</p>

      <h2>AI-Powered Study Tools</h2>
      <p>Echelon's AI tutor explains every answer in detail, identifies your weak modules, and adapts the session to focus where you need it most. Practice with 500+ questions per level, take full-length 100-question timed mock exams, and review key concepts with organized flashcards.</p>

      <h2>Pricing for US Operators</h2>
      <p>Echelon offers monthly and annual subscription plans. The annual plan provides the best value. <a href="${SITE_URL}/pricing">View current pricing</a>. Free practice questions are included — no account required to begin.</p>

      <h2>Start Preparing Today</h2>
      <p>Select your stream and class level to begin: <a href="${SITE_URL}/us/courses">browse all 16 courses</a> or <a href="${SITE_URL}/us/states">find your state</a> for state-specific certification information.</p>
    `,
  },
  {
    path: "/us/courses",
    title: "US Water Operator Courses | All 4 Streams & 4 Levels — Echelon Institute",
    description:
      "Browse all 16 ABC/WPI water operator certification prep courses. Water treatment, wastewater treatment, distribution, and collection — Class I through Class IV. AI-powered practice questions, mock exams, and flashcards.",
    h1: "US Water Operator Certification Courses — All Streams & Levels",
    jsonLd: buildWebPageJsonLd({
      path: "/us/courses",
      title: "US Water Operator Courses | Echelon Institute",
      description: "All 16 ABC/WPI water operator certification prep courses.",
      h1: "US Water Operator Certification Courses",
    }),
    bodyHtml: `
      <h2>16 Courses for US Water and Wastewater Operators</h2>
      <p>Echelon Institute offers 16 certification prep courses covering all four ABC/WPI streams and all four class levels. Each course includes 500+ practice questions, a 100-question timed mock exam, and organized flashcards aligned to the 2025 WPI Need-to-Know Criteria.</p>

      <h2>Water Treatment — Class I through Class IV</h2>
      <p>Water treatment operator courses cover coagulation, flocculation, sedimentation, filtration, disinfection, chemical feed, source water quality, and regulatory compliance. <a href="${SITE_URL}/wpi-class1-water">Start with Class I Water Treatment</a>.</p>

      <h2>Wastewater Treatment — Class I through Class IV</h2>
      <p>Wastewater treatment courses cover primary, secondary, and tertiary treatment, activated sludge, nutrient removal, biosolids management, laboratory analysis, and equipment operation. <a href="${SITE_URL}/wpi-class1-wastewater">Start with Class I Wastewater Treatment</a>.</p>

      <h2>Water Distribution — Class I through Class IV</h2>
      <p>Distribution system courses cover pipe materials, pressure zones, cross-connection control, water quality monitoring, hydrant maintenance, and system hydraulics. <a href="${SITE_URL}/wpi-class1-water-dist">Start with Class I Water Distribution</a>.</p>

      <h2>Wastewater Collection — Class I through Class IV</h2>
      <p>Collection system courses cover gravity sewers, force mains, lift stations, infiltration and inflow, CCTV inspection, cleaning equipment, and confined space safety. <a href="${SITE_URL}/wpi-class1-water-coll">Start with Class I Wastewater Collection</a>.</p>

      <h2>Free Trial Available</h2>
      <p>The first 15 questions on every course are free — no account or credit card required. <a href="${SITE_URL}/pricing">View pricing</a> for full access.</p>
    `,
  },
  {
    path: "/us/states",
    title: "US Water Operator Certification by State | ABC/WPI Exam Prep — Echelon Institute",
    description:
      "Find water and wastewater operator certification exam prep for your state. Echelon covers all 45 states that use the ABC/WPI standardized exam — Iowa, Colorado, Oregon, Ohio, Michigan, and more.",
    h1: "US Water Operator Certification by State",
    jsonLd: buildWebPageJsonLd({
      path: "/us/states",
      title: "US Water Operator Certification by State | Echelon Institute",
      description: "ABC/WPI exam prep for all 45 US states that use the standardized exam.",
      h1: "US Water Operator Certification by State",
    }),
    bodyHtml: `
      <h2>45 States Using the ABC/WPI Standardized Exam</h2>
      <p>Approximately 45 US states use the ABC/WPI standardized exam for water and wastewater operator certification. Echelon Institute covers operators in all of these states with content aligned to the 2025 WPI Need-to-Know Criteria.</p>

      <h2>Midwest States</h2>
      <p>Iowa (Iowa DNR), Minnesota (MDH), Wisconsin (WI DNR), Michigan (EGLE), Indiana (IDEM), Ohio (Ohio EPA), Missouri (MO DNR), North Dakota (NDDEQ), South Dakota (SD DANR), Nebraska (NDEE), Kansas (KDHE).</p>

      <h2>Northeast States</h2>
      <p>Maine (Maine DWP), New Hampshire (NHDES), Vermont (VT DEC), Massachusetts (MassDEP), Rhode Island (RIDOH), Connecticut (CT DPH), New Jersey (NJDEP), Delaware (DNREC), Maryland (MDE), Pennsylvania (PA DEP), West Virginia (WV BPH).</p>

      <h2>Southern States</h2>
      <p>Virginia (VDH), North Carolina (NC DWR), South Carolina (SCDHEC), Georgia (Georgia EPD), Alabama (ADEM), Mississippi (MSDH), Arkansas (ADH), Oklahoma (Oklahoma DEQ), Louisiana (LDH), Kentucky (KY DOW), Tennessee (TDEC).</p>

      <h2>Western States</h2>
      <p>Washington (WA DOH), Oregon (OHA), Idaho (Idaho DEQ), Montana (Montana DEQ), Wyoming (Wyoming DEQ), Colorado (CDPHE), Utah (Utah DDW), Nevada (NDEP), Arizona (ADEQ), New Mexico (NMED), Alaska (Alaska DEC), Hawaii (Hawaii DOH).</p>

      <h2>States Not Covered</h2>
      <p>California (SWRCB), Texas (TCEQ), Florida (FDEP), and New York (NYSDOH) use their own state-specific exam systems rather than the ABC/WPI standardized exam. Echelon does not currently offer prep for these state-specific exams.</p>

      <h2>Start Practicing</h2>
      <p><a href="${SITE_URL}/us/courses">Browse all courses</a> or <a href="${SITE_URL}/us">return to the US overview</a>.</p>
    `,
  },
];

/** Build a map for O(1) lookup */
const META_MAP = new Map<string, PageMeta>(
  STATIC_PAGE_META.map((m) => [m.path, m])
);

/** Read the index.html shell (works in both dev and prod) */
function getIndexHtml(isDev: boolean): string {
  const templatePath = isDev
    ? path.resolve(process.cwd(), "client", "index.html")
    : path.resolve(path.dirname(new URL(import.meta.url).pathname), "public", "index.html");
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

function buildSeoHead(meta: PageMeta): string {
  const canonicalUrl = `${SITE_URL}${meta.path}`;
  const titleEsc = escapeHtml(meta.title);
  const descEsc = escapeHtml(meta.description);
  const jsonLd = meta.jsonLd ?? buildWebPageJsonLd(meta);

  return `
    <meta name="description" content="${descEsc}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:title" content="${titleEsc}" />
    <meta property="og:description" content="${descEsc}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${DEFAULT_OG_IMAGE}" />
    <meta property="og:site_name" content="Echelon Institute" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${titleEsc}" />
    <meta name="twitter:description" content="${descEsc}" />
    <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />
    <script type="application/ld+json">${jsonLd}</script>`;
}

/** Rich crawlable HTML body shell with H1, H2s, body copy, and internal links */
function buildSsrBody(meta: PageMeta): string {
  const h1Esc = escapeHtml(meta.h1);
  const bodyContent = meta.bodyHtml ?? "";
  return `
<div id="ssr-page-shell" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;" aria-hidden="true">
  <h1>${h1Esc}</h1>
  ${bodyContent}
  <nav aria-label="Site navigation">
    <a href="${SITE_URL}/">Home</a>
    <a href="${SITE_URL}/guides">Process Guides</a>
    <a href="${SITE_URL}/pricing">Pricing</a>
    <a href="${SITE_URL}/about">About</a>
    <a href="${SITE_URL}/blog">Blog</a>
    <a href="${SITE_URL}/faq">FAQ</a>
    <a href="${SITE_URL}/jobs">Jobs</a>
    <a href="${SITE_URL}/wpi">WPI</a>
    <a href="${SITE_URL}/privacy">Privacy</a>
    <a href="${SITE_URL}/terms">Terms</a>
  </nav>
</div>`;
}

function injectSeoIntoTemplate(template: string, meta: PageMeta): string {
  const titleTag = `<title>${escapeHtml(meta.title)}</title>`;
  const seoHead = buildSeoHead(meta);
  const ssrBody = buildSsrBody(meta);

  let html = template
    // Replace the default <title>
    .replace(/<title>[^<]*<\/title>/, titleTag)
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
    .replace("</head>", `${seoHead}\n</head>`)
    // Inject SSR body shell right after <div id="root">
    .replace('<div id="root"></div>', `<div id="root"></div>${ssrBody}`);

  return html;
}

/** Build the llms.txt content for AI model discoverability */
function buildLlmsTxt(): string {
  return `# Echelon Institute
> AI-powered exam prep platform for water and wastewater operators in Canada and the United States.

Echelon Institute helps water and wastewater operators in Canada and the US pass their certification exams. The platform provides adaptive practice questions, flashcards, mock exams, study notes, interactive process guides, and a 24/7 AI tutor. The first 15 questions on every course are free.

## Canadian Certifications Covered
- Ontario OIT (Operator-in-Training) — Water Treatment and Wastewater Treatment
- Ontario Class 1, 2, 3, 4 — Water Treatment
- Ontario Class 1, 2, 3, 4 — Water Distribution
- Ontario Class 1, 2, 3, 4 — Wastewater Treatment
- Ontario Class 1, 2, 3, 4 — Wastewater Collection
- British Columbia EOCP (Environmental Operators Certification Program)
- Alberta AWWOA (Alberta Water & Wastewater Operators Association) Level 1–4
- Saskatchewan SLWA (Saskatchewan Water and Wastewater Association)
- Manitoba WQAM (Water and Wastewater Association of Manitoba)

## US Certifications Covered (ABC/WPI Standardized Exam)
- Water Treatment — Class I, II, III, IV
- Wastewater Treatment — Class I, II, III, IV
- Water Distribution — Class I, II, III, IV
- Wastewater Collection — Class I, II, III, IV
- Covers all 45 states using the ABC/WPI exam (Iowa, Colorado, Oregon, Ohio, Michigan, Wisconsin, Minnesota, Indiana, Virginia, North Carolina, Georgia, Maryland, Massachusetts, Washington, Pennsylvania, and more)
- Content aligned to 2025 WPI Need-to-Know Criteria published by Water Professionals International (WPI) and the Association of Boards of Certification (ABC)

## Key Pages
- Homepage: ${SITE_URL}/
- US Operator Exam Prep: ${SITE_URL}/us
- US Courses: ${SITE_URL}/us/courses
- US States: ${SITE_URL}/us/states
- Process Guides: ${SITE_URL}/guides
- Pricing: ${SITE_URL}/pricing
- About: ${SITE_URL}/about
- FAQ: ${SITE_URL}/faq
- Blog: ${SITE_URL}/blog
- WPI Process Guides: ${SITE_URL}/wpi
- Jobs Board: ${SITE_URL}/jobs

## Blog Articles (for detailed certification information)
- ${SITE_URL}/blog/how-to-pass-ontario-oit-water-exam
- ${SITE_URL}/blog/water-operator-salary-canada-by-province-2025
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
export function registerPageSsrRoutes(app: Express, isDev: boolean, vite?: { transformIndexHtml: (url: string, html: string) => Promise<string> }): void {
  // Serve llms.txt for AI model discoverability
  app.get("/llms.txt", (_req: Request, res: Response) => {
    res
      .status(200)
      .set({ "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" })
      .end(buildLlmsTxt());
  });

  // Serve llms-full.txt (same content — some AI crawlers check this path)
  app.get("/llms-full.txt", (_req: Request, res: Response) => {
    res
      .status(200)
      .set({ "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" })
      .end(buildLlmsTxt());
  });

  // Exact-path routes only — /blog/:slug is handled by blogSsr.ts
  const staticPaths = STATIC_PAGE_META.map((m) => m.path);

  for (const pagePath of staticPaths) {
    app.get(pagePath === "/" ? "/" : pagePath, async (req: Request, res: Response) => {
      // Only handle exact path match (no query string confusion)
      const meta = META_MAP.get(pagePath);
      if (!meta) return res.status(404).send("Not found");

      try {
        const template = getIndexHtml(isDev);
        const seoHtml = injectSeoIntoTemplate(template, meta);
        // In dev mode, run Vite's transformIndexHtml so it injects @vite/client
        // and HMR scripts — without this, React never mounts on SSR-served pages.
        const html = (isDev && vite)
          ? await vite.transformIndexHtml(req.originalUrl, seoHtml)
          : seoHtml;
        res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(html);
      } catch (err) {
        console.error(`[pageSsr] Error rendering ${pagePath}:`, err);
        // Fall through to SPA catch-all on error
        res.status(500).send("Internal server error");
      }
    });
  }
}

/** Export meta map for use in dynamic sitemap */
export { META_MAP };
