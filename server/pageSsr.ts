/**
 * Server-Side Rendering for Static Public Pages
 *
 * Intercepts the 9 static public routes BEFORE the SPA catch-all and injects
 * per-route title, meta description, canonical, robots, H1, and structured
 * data into the index.html shell so crawlers see real content without JS.
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
          text: "Echelon covers Ontario (OIT, Class 1–4 Water Distribution and Wastewater Collection), British Columbia (EOCP), Alberta (AWWOA), Saskatchewan (SLWA), and Manitoba (WQAM).",
        },
      },
      {
        "@type": "Question",
        name: "Is there a free trial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The first 15 questions on every course are free — no account or credit card required.",
        },
      },
      {
        "@type": "Question",
        name: "How do I get access for my team?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Echelon offers team plans for utilities and municipalities. Contact us at abello@echeloninstitute.ca or visit the Pricing page to learn more about bulk seat pricing.",
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
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pricing — Echelon Institute",
    description:
      "View Echelon Institute's subscription plans for individual operators and team plans for utilities and municipalities.",
    url: `${SITE_URL}/pricing`,
    mainEntity: {
      "@type": "ItemList",
      name: "Echelon Institute Subscription Plans",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Monthly Plan",
          description: "Full access to all courses for one month.",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Annual Plan",
          description: "Full access to all courses for one year at a discounted rate.",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Team Plan",
          description: "Bulk seat pricing for utilities and municipalities.",
        },
      ],
    },
  });
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
  },
  {
    path: "/pricing",
    title: "Pricing — Echelon Institute | Water Operator Exam Prep Plans",
    description:
      "View Echelon Institute's subscription plans. Monthly and annual plans for individual operators, plus team plans for utilities and municipalities across Canada.",
    h1: "Simple, Transparent Pricing for Every Operator",
    jsonLd: buildPricingJsonLd(),
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
  },
  {
    path: "/wpi",
    title: "WPI Water Process Intelligence | Echelon Institute",
    description:
      "WPI (Water Process Intelligence) is Echelon Institute's interactive process guide for Canadian water and wastewater operators. Explore treatment processes, equipment, and regulations by province.",
    h1: "WPI — Water Process Intelligence",
    jsonLd: buildWebPageJsonLd({
      path: "/wpi",
      title: "WPI Water Process Intelligence | Echelon Institute",
      description:
        "Interactive process guide for Canadian water and wastewater operators.",
      h1: "WPI — Water Process Intelligence",
    }),
  },
  {
    path: "/faq",
    title: "FAQ — Echelon Institute | Water Operator Exam Prep Questions",
    description:
      "Frequently asked questions about Echelon Institute's water operator exam prep platform — courses, pricing, provinces covered, team plans, and more.",
    h1: "Frequently Asked Questions",
    jsonLd: buildFaqJsonLd(),
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

/** Minimal visible-to-crawlers HTML body with H1 and key internal links */
function buildSsrBody(meta: PageMeta): string {
  const h1Esc = escapeHtml(meta.h1);
  return `
<div id="ssr-page-shell" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;" aria-hidden="true">
  <h1>${h1Esc}</h1>
  <nav aria-label="Site navigation">
    <a href="${SITE_URL}/">Home</a>
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
    // Replace the default <meta name="description"> if present
    .replace(/<meta name="description"[^>]*>/, "")
    // Replace the default canonical if present
    .replace(/<link rel="canonical"[^>]*>/, "")
    // Replace the default robots meta if present
    .replace(/<meta name="robots"[^>]*>/, "")
    // Inject all SEO tags before </head>
    .replace("</head>", `${seoHead}\n</head>`)
    // Inject SSR body shell right after <div id="root">
    .replace('<div id="root"></div>', `<div id="root"></div>${ssrBody}`);

  return html;
}

/** Register SSR routes for all static public pages */
export function registerPageSsrRoutes(app: Express, isDev: boolean): void {
  // Exact-path routes only — /blog/:slug is handled by blogSsr.ts
  const staticPaths = STATIC_PAGE_META.map((m) => m.path);

  for (const pagePath of staticPaths) {
    app.get(pagePath === "/" ? "/" : pagePath, (req: Request, res: Response) => {
      // Only handle exact path match (no query string confusion)
      const meta = META_MAP.get(pagePath);
      if (!meta) return res.status(404).send("Not found");

      try {
        const template = getIndexHtml(isDev);
        const html = injectSeoIntoTemplate(template, meta);
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
