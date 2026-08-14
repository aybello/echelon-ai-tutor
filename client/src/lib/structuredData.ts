/** Factual, registry-backed JSON-LD for the public landing page. */
import { COURSE_SEO_PAGES, SITE_URL } from "@shared/seoCatalog";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/favicon-512_1eb3c09e.png";

const provider = {
  "@type": "EducationalOrganization",
  "@id": `${SITE_URL}/#organization`,
  name: "Echelon Institute",
  url: SITE_URL,
};

export const organizationSchema = {
  "@context": "https://schema.org",
  ...provider,
  logo: LOGO_URL,
  description:
    "Independent Canadian exam preparation for water and wastewater operators, with course-specific practice, mock exams, flashcards, process guides, and AI-supported explanations.",
  foundingDate: "2025",
  founder: {
    "@type": "Person",
    name: "Ay Bello",
    jobTitle: "Environmental Engineer and Founder",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "abello@echeloninstitute.ca",
    contactType: "customer support",
    availableLanguage: "English",
  },
  areaServed: { "@type": "Country", name: "Canada" },
  knowsAbout: [
    "water operator certification exam preparation",
    "wastewater operator certification exam preparation",
    "Ontario operator-in-training exam preparation",
    "Water Professionals International exam preparation",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Echelon Institute",
  url: SITE_URL,
  description:
    "Canadian water and wastewater operator exam preparation with a free 15-question preview on every course.",
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en-CA",
};

export const courseCatalogSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Echelon Institute Operator Exam-Prep Courses",
  description:
    "Ontario-specific and WPI-aligned water and wastewater operator exam-preparation courses.",
  numberOfItems: COURSE_SEO_PAGES.length,
  itemListElement: COURSE_SEO_PAGES.map((course, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Course",
      name: course.displayName,
      description: course.description,
      url: `${SITE_URL}${course.path}`,
      inLanguage: "en-CA",
      educationalLevel: course.levelLabel,
      provider: { "@id": `${SITE_URL}/#organization` },
      offers: {
        "@type": "Offer",
        price: (course.priceCAD / 100).toFixed(0),
        priceCurrency: "CAD",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/pricing`,
      },
    },
  })),
};

const faqs = [
  {
    question: "How can I try Echelon before paying?",
    answer:
      "The first 15 questions on every course are available without an account or credit card. Full access requires an Individual Exam Pass or an assigned team licence.",
  },
  {
    question: "How does individual access work?",
    answer:
      "An Individual Exam Pass is a one-time payment for one selected course and 12 months of access. Current course pricing is shown on the pricing page.",
  },
  {
    question: "Which certifications are supported?",
    answer:
      "Echelon provides Ontario-specific OIT and Class 1–4 preparation plus WPI-aligned Class I–IV courses for treatment, distribution, and collection candidates. Candidates should confirm current requirements with their certifying authority.",
  },
  {
    question: "Is Echelon affiliated with a certifying authority?",
    answer:
      "No. Echelon Institute is an independent exam-preparation provider and is not affiliated with or endorsed by OWWCO, MOECP, EOCP, WPI, or a provincial certifying authority.",
  },
  {
    question: "Does Echelon guarantee an exam result?",
    answer:
      "No. Echelon provides preparation tools, but eligibility, exam content, certification decisions, and results are controlled by the applicable certifying authority.",
  },
];

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(faq => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export const landingPageSchemas = [
  {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema,
      websiteSchema,
      courseCatalogSchema,
      faqSchema,
    ].map(({ "@context": _context, ...schema }) => schema),
  } as Record<string, unknown>,
];
