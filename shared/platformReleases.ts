/**
 * Product-facing releases shipped with application code. Keeping these in the
 * repository means a successful deployment updates the public changelog even
 * when nobody opens the admin editor. Database-authored announcements are
 * merged alongside this list by the public changelog endpoint.
 */
export const PLATFORM_RELEASES = [
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
