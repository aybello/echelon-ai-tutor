/**
 * Product-facing releases shipped with application code. Keeping these in the
 * repository means a successful deployment updates the public changelog even
 * when nobody opens the admin editor. Database-authored announcements are
 * merged alongside this list by the public changelog endpoint.
 */
export const PLATFORM_RELEASES = [
  {
    id: -20261014,
    date: "October 14, 2026",
    badge: "Improvement",
    badgeColor: "#0F766E",
    title: "Clearer Teams purchasing and administration",
    body: "Teams Annual offers a named-operator stream plan from CA$449 per year or All Streams at CA$549, with a five-seat minimum. Teams Flex provides course-specific 3- or 6-month licences from CA$39. Municipalities can request a quotation or pilot review and optionally ask for a callback; a request is not an invoice or activated pilot. Nova Scotia uses shared WPI preparation with treatment Classes I–IV and distribution/collection Classes I–III. Admin history, sales reconciliation and enquiry follow-up are clearer. Historical prices and retired products below are not current offers.",
    sortOrder: -10_100,
    visible: true,
    createdAt: new Date("2026-10-14T12:00:00.000Z"),
    updatedAt: new Date("2026-10-14T12:00:00.000Z"),
  },
  {
    id: -20261013,
    date: "October 13, 2026",
    badge: "Fix",
    badgeColor: "#2563EB",
    title: "Clearer worked mathematics in the AI Tutor",
    body: "AI Tutor explanations now render common inline and display math delimiters so calculation steps are easier to follow. Independently verify calculations and follow the current guidance of your certifying authority.",
    sortOrder: -10_090,
    visible: true,
    createdAt: new Date("2026-10-13T12:00:00.000Z"),
    updatedAt: new Date("2026-10-13T12:00:00.000Z"),
  },
  {
    id: -20261006,
    date: "October 6, 2026",
    badge: "Improvement",
    badgeColor: "#0F766E",
    title: "Expanded Ontario Class II practice",
    body: "Additional Class II questions are available across water treatment, distribution, wastewater treatment and collection. The free preview and live course counts show learner-visible content; source drafting labels are not the production release status.",
    sortOrder: -10_080,
    visible: true,
    createdAt: new Date("2026-10-06T12:00:00.000Z"),
    updatedAt: new Date("2026-10-06T12:00:00.000Z"),
  },
  {
    id: -20260819,
    date: "August 2026",
    badge: "Improvement",
    badgeColor: "#0F766E",
    title: "A complete free OIT preview",
    body: "New learners can now try 15 practice questions, 50 flashcards, 30 mock-exam questions, and three AI Tutor messages before choosing an Exam Pass. We also improved electrician flashcards so every card keeps the full question needed to answer it.",
    sortOrder: -10_000,
    visible: true,
    createdAt: new Date("2026-08-19T12:00:00.000Z"),
    updatedAt: new Date("2026-08-19T12:00:00.000Z"),
  },
] as const;
