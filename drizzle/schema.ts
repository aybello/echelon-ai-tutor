import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  phone: varchar("phone", { length: 32 }),
  province: varchar("province", { length: 32 }), // 'ON' | 'BC' | 'AB' | 'SK' | 'MB' | 'QC'
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here

/** Waitlist table for capturing email leads for upcoming courses */
export const waitlist = mysqlTable("waitlist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  courseCode: varchar("courseCode", { length: 32 }).notNull(),
  courseTitle: varchar("courseTitle", { length: 128 }).notNull(),
  province: varchar("province", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = typeof waitlist.$inferInsert;

/** Question error reports — submitted by users who spot mistakes */
export const questionErrorReports = mysqlTable("question_error_reports", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(),
  questionText: text("questionText").notNull(),
  module: varchar("module", { length: 64 }).notNull(),
  reportType: varchar("reportType", { length: 32 }).notNull(), // 'wrong_answer' | 'wrong_calculation' | 'unclear_question' | 'other'
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuestionErrorReport = typeof questionErrorReports.$inferSelect;
export type InsertQuestionErrorReport = typeof questionErrorReports.$inferInsert;

/** Trial email captures — users who hit the 15-question gate and unlocked the full bank */
export const trialEmails = mysqlTable("trial_emails", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  source: varchar("source", { length: 32 }).notNull().default("quiz_gate"), // where the gate was hit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrialEmail = typeof trialEmails.$inferSelect;
export type InsertTrialEmail = typeof trialEmails.$inferInsert;

/** Exam results — saved when a user completes a mock exam */
export const examResults = mysqlTable("exam_results", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(), // anonymous session ID from localStorage
  examType: varchar("examType", { length: 32 }).notNull(), // 'class1' | 'wqa'
  stream: varchar("stream", { length: 32 }), // 'water' | 'wastewater' | null for WQA
  province: varchar("province", { length: 32 }), // province context for this exam
  score: int("score").notNull(), // number of correct answers
  total: int("total").notNull(), // total questions attempted
  passed: mysqlEnum("passed", ["yes", "no"]).notNull(),
  timeTakenSeconds: int("timeTakenSeconds"), // how long the exam took
  moduleBreakdown: text("moduleBreakdown"), // JSON string: { moduleName: { correct, total } }
  calcOnly: mysqlEnum("calcOnly", ["yes", "no"]).default("no"), // whether this was a Math Practice (calc-only) session
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExamResult = typeof examResults.$inferSelect;
export type InsertExamResult = typeof examResults.$inferInsert;
/** Purchases — tracks completed Stripe one-time payments */
export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null for guest purchases (email-only)
  email: varchar("email", { length: 320 }).notNull(),
  productKey: varchar("productKey", { length: 64 }).notNull(), // e.g. 'oit', 'bundle-all'
  productName: varchar("productName", { length: 128 }).notNull(),
  amountCAD: int("amountCAD").notNull(), // in cents
  stripeSessionId: varchar("stripeSessionId", { length: 128 }).notNull().unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }),
  province: varchar("province", { length: 32 }), // province at time of purchase
  utmSource: varchar("utmSource", { length: 128 }),
  utmMedium: varchar("utmMedium", { length: 128 }),
  utmCampaign: varchar("utmCampaign", { length: 128 }),
  referralSource: varchar("referralSource", { length: 128 }),
  phone: varchar("phone", { length: 32 }), // captured from Stripe checkout
  customerName: varchar("customerName", { length: 128 }), // captured from pre-checkout modal
  status: varchar("status", { length: 32 }).notNull().default("active"), // 'active' | 'refunded' | 'disputed'
  refundedAt: timestamp("refundedAt"),
  welcomeEmailSentAt: timestamp("welcomeEmailSentAt"), // set when 24h onboarding email is sent; null = not yet sent
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

/** Subscriptions — tracks active Stripe recurring subscriptions */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null for guest subscriptions (email-only)
  email: varchar("email", { length: 320 }).notNull(),
  tier: varchar("tier", { length: 32 }).notNull(), // 'class1' | 'class2' | 'class3' | 'class4' | 'all-access'
  province: varchar("province", { length: 32 }).notNull(), // 'ontario' | 'western'
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }).unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  status: varchar("status", { length: 32 }).notNull().default("active"), // 'active' | 'cancelled' | 'expired' | 'past_due'
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  /** Set when this row is org-managed (seat granted by an org). Null for self-serve subscriptions.
   *  Org-managed rows have stripeSubscriptionId = null and are excluded from the self-serve billing portal. */
  orgId: int("orgId"),
  /** Subscriber's full name (captured from pre-checkout modal) */
  customerName: varchar("customerName", { length: 128 }),
  /** Subscriber's phone number (required at checkout) */
  phone: varchar("phone", { length: 32 }),
  /** Price paid in cents CAD (e.g. 9900 = CA$99.00). Populated at checkout from subscription product catalog. */
  amountCAD: int("amountCAD"),
  /** Marketing attribution */
  utmSource: varchar("utmSource", { length: 128 }),
  utmMedium: varchar("utmMedium", { length: 128 }),
  utmCampaign: varchar("utmCampaign", { length: 128 }),
  referralSource: varchar("referralSource", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/** Contact form submissions — logged for searchable record of all inquiries */
export const contactSubmissions = mysqlTable("contact_submissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 128 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

/** Flashcard progress — persists spaced-repetition known/unknown state per email+examType */
export const flashcardProgress = mysqlTable("flashcard_progress", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  examType: varchar("examType", { length: 64 }).notNull(), // e.g. 'class1-water', 'wpi-class2-wastewater'
  knownIds: text("knownIds").notNull(), // JSON array of card IDs marked as known (TiDB does not allow TEXT defaults)
  totalCards: int("totalCards").notNull().default(0),  // total cards in this deck at time of save
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FlashcardProgressRow = typeof flashcardProgress.$inferSelect;
export type InsertFlashcardProgress = typeof flashcardProgress.$inferInsert;

/** Exam dates — optional exam date set by customer per product, used for countdown + email reminders */
export const examDates = mysqlTable("exam_dates", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  productKey: varchar("productKey", { length: 64 }).notNull(), // e.g. 'class1-water', 'oit'
  examDate: timestamp("examDate").notNull(), // the date of their exam
  remindersSent: text("remindersSent").notNull(), // JSON array of intervals already sent e.g. [30, 14]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ExamDate = typeof examDates.$inferSelect;
export type InsertExamDate = typeof examDates.$inferInsert;

/** Question attempts — logs every quiz answer for topic tracking, missed questions, and agentic features */
export const questionAttempts = mysqlTable("question_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null for guest users
  guestToken: varchar("guestToken", { length: 64 }), // localStorage token for guest tracking
  studentEmail: varchar("studentEmail", { length: 320 }), // purchase/trial email for non-OAuth users
  examType: varchar("examType", { length: 64 }).notNull(), // e.g. 'oit', 'class1-water', 'wpi-class2-wastewater'
  topic: varchar("topic", { length: 128 }).notNull(), // e.g. 'Disinfection', 'Hydraulics'
  questionId: int("questionId").notNull(),
  correct: mysqlEnum("correct", ["yes", "no"]).notNull(),
  difficulty: varchar("difficulty", { length: 16 }), // 'easy' | 'medium' | 'hard'
  quizMode: varchar("quizMode", { length: 32 }).default("standard"), // 'standard' | 'quick10' | 'missed' | 'qotd'
  /** Confidence self-rating — set by the student after answering. Used in readiness scoring and review prioritization. */
  confidence: mysqlEnum("confidence", ["low", "medium", "high"]),
  /** Bookmarked — student can flag a question for later review. */
  bookmarked: mysqlEnum("bookmarked", ["yes", "no"]).default("no"),
  /** Issue Q: client-generated UUID identifying the quiz session this attempt belongs to.
   *  Nullable for historic rows; new rows always include it. */
  sessionId: varchar("sessionId", { length: 36 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  // Issue O: composite indexes for the frequent userId/studentEmail + createdAt filter pattern
  index("qa_userid_createdat_idx").on(t.userId, t.createdAt),
  index("qa_email_createdat_idx").on(t.studentEmail, t.createdAt),
  // Issue Q: index for GROUP BY sessionId queries in recentSessions
  index("qa_sessionid_idx").on(t.sessionId),
]);
export type QuestionAttempt = typeof questionAttempts.$inferSelect;
export type InsertQuestionAttempt = typeof questionAttempts.$inferInsert;

/** Student profiles — live topic accuracy snapshot, updated after each quiz session */
export const studentProfiles = mysqlTable("student_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // nullable — email-only (Stripe) students have no userId
  studentEmail: varchar("studentEmail", { length: 320 }), // purchase/trial email for non-OAuth users
  examType: varchar("examType", { length: 64 }).notNull(), // primary exam type
  topicAccuracy: text("topicAccuracy").notNull(), // JSON: { "Disinfection": { correct: 18, total: 22 } } — default '{}' set in app code
  weakTopics: text("weakTopics").notNull(), // JSON array of topic names with <65% accuracy — default '[]' set in app code
  strongTopics: text("strongTopics").notNull(), // JSON array of topic names with >80% accuracy — default '[]' set in app code
  totalAttempts: int("totalAttempts").notNull().default(0),
  totalSessions: int("totalSessions").notNull().default(0),
  currentStreak: int("currentStreak").notNull().default(0), // consecutive days active
  longestStreak: int("longestStreak").notNull().default(0),
  lastActiveDate: varchar("lastActiveDate", { length: 10 }), // YYYY-MM-DD for streak calculation
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("student_profiles_userId_idx").on(table.userId),
  uniqueIndex("student_profiles_email_idx").on(table.studentEmail),
]);
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = typeof studentProfiles.$inferInsert;

/** QOTD completions — tracks which users completed each day's Question of the Day */
export const qotdCompletions = mysqlTable("qotd_completions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null for guests
  guestToken: varchar("guestToken", { length: 64 }),
  examType: varchar("examType", { length: 64 }).notNull(),
  questionId: int("questionId").notNull(),
  dateKey: varchar("dateKey", { length: 10 }).notNull(), // YYYY-MM-DD
  correct: mysqlEnum("correct", ["yes", "no"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type QotdCompletion = typeof qotdCompletions.$inferSelect;
export type InsertQotdCompletion = typeof qotdCompletions.$inferInsert;

/** Questions — all 14,000+ exam questions stored in the database instead of JS bundles */
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  bankKey: varchar("bankKey", { length: 64 }).notNull(),
    // e.g. "class1-water", "wpi-class2-wastewater-coll", "wqa"
  questionNum: int("questionNum").notNull(),
    // original per-bank sequential ID (1, 2, 3...) — matches questionAttempts.questionId
  module: varchar("module", { length: 128 }).notNull(),
  difficulty: varchar("difficulty", { length: 16 }),
    // null for WPI banks that don't have difficulty
  question: text("question").notNull(),
  options: text("options").notNull(),
    // JSON array of option strings: ["option1", "option2", "option3", "option4"]
  correctIndex: int("correctIndex").notNull(),
    // 0=A, 1=B, 2=C, 3=D
  explanation: text("explanation").notNull(),
  steps: text("steps"),
    // JSON: [{ "l": "label", "c": "content" }] or null
  tip: text("tip"),
  isCalc: mysqlEnum("isCalc", ["yes", "no"]).default("no").notNull(),
  topic: varchar("topic", { length: 128 }),
}, (table) => [uniqueIndex("bank_question_idx").on(table.bankKey, table.questionNum)]);

export type QuestionRow = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

/** Question bank metadata — module lists, module targets, formula links per bank */
export const questionBankMeta = mysqlTable("question_bank_meta", {
  id: int("id").autoincrement().primaryKey(),
  bankKey: varchar("bankKey", { length: 64 }).notNull().unique(),
  modules: text("modules").notNull(),
    // JSON array of module names or objects
  moduleTargets: text("moduleTargets"),
    // JSON: { "Treatment Process": 32, ... } or null
  formulaLinks: text("formulaLinks"),
    // JSON: { "WQA-M001": "/formulas-wqa#..." } or null
  totalQuestions: int("totalQuestions").notNull(),
  /** Monotonically increasing counter. Incremented by admin whenever a question in this bank
   *  is edited. Clients compare this against their cached value and invalidate on mismatch. */
  contentVersion: int("contentVersion").notNull().default(1),
});

export type QuestionBankMetaRow = typeof questionBankMeta.$inferSelect;
export type InsertQuestionBankMeta = typeof questionBankMeta.$inferInsert;

/** Module overviews — study guide text per bank+module, previously in moduleOverviews.ts */
export const moduleOverviews = mysqlTable("module_overviews", {
  id: int("id").autoincrement().primaryKey(),
  bankKey: varchar("bankKey", { length: 64 }).notNull(),
  overviewsJson: text("overviewsJson").notNull(),
    // JSON: the full overviews object for this bank
    // e.g. { "Water Sources & Quality": { title, content, keyPoints, formulas } }
}, (table) => [uniqueIndex("bank_overview_idx").on(table.bankKey)]);

export type ModuleOverviewRow = typeof moduleOverviews.$inferSelect;
export type InsertModuleOverview = typeof moduleOverviews.$inferInsert;

/** User feedback — collected after 15-question gate and session completion */
export const userFeedback = mysqlTable("user_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null for guest users
  email: varchar("email", { length: 320 }), // captured for guest users
  examType: varchar("examType", { length: 64 }).notNull(), // e.g. 'oit', 'class1-water'
  rating: int("rating").notNull(), // 1-5 star rating
  comment: text("comment"), // optional free-text feedback
  feedbackType: varchar("feedbackType", { length: 32 }).notNull(), // 'quiz_gate' | 'session_complete'
  province: varchar("province", { length: 32 }), // province context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserFeedbackRow = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = typeof userFeedback.$inferInsert;

/** AI chat sessions — logs every AI tutor conversation for memory injection */
export const aiChatSessions = mysqlTable("ai_chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // nullable — OTP students have no Manus userId
  studentEmail: varchar("studentEmail", { length: 320 }), // set when userId is null (OTP students)
  examType: varchar("examType", { length: 64 }).notNull(), // which exam context this session was in
  messageCount: int("messageCount").notNull().default(0),
  topicsCovered: text("topicsCovered").notNull(), // JSON array of topic strings discussed
  summary: text("summary").notNull(), // 2-3 sentence LLM-generated summary
  resourcesSurfaced: text("resourcesSurfaced"), // JSON array of resource IDs surfaced (nullable)
  sessionStart: timestamp("sessionStart").defaultNow().notNull(),
  sessionEnd: timestamp("sessionEnd").defaultNow().notNull(),
});

export type AiChatSession = typeof aiChatSessions.$inferSelect;
export type InsertAiChatSession = typeof aiChatSessions.$inferInsert;

/** Trigger logs — tracks proactive email nudges sent by the agentic trigger engine */
export const triggerLogs = mysqlTable("trigger_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // nullable — email-only (Stripe) students have no userId
  studentEmail: varchar("studentEmail", { length: 320 }), // set when userId is null
  triggerType: varchar("triggerType", { length: 32 }).notNull(), // 'struggling' | 'plateau' | 'inactive' | 'exam_approaching' | 'milestone'
  emailSubject: varchar("emailSubject", { length: 256 }).notNull(),
  emailBodyPreview: text("emailBodyPreview"), // first 200 chars of the email body for admin review
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  cooldownUntil: timestamp("cooldownUntil").notNull(), // don't send same trigger type again until this date
  /** Issue R: written BEFORE sendMail so cooldown is claimed even on SMTP failure.
   *  'pending' → row reserved, send in progress
   *  'sent'    → sendMail succeeded
   *  'failed'  → sendMail threw; cooldown still applies to prevent duplicate sends */
  status: varchar("status", { length: 16 }).notNull().default("sent"),
}, (t) => [
  // Issue O: composite index for the two cooldown queries (userId + sentAt, userId + triggerType + sentAt)
  index("trigger_logs_userid_sentat_idx").on(t.userId, t.sentAt),
  index("trigger_logs_email_sentat_idx").on(t.studentEmail, t.sentAt),
]);

export type TriggerLog = typeof triggerLogs.$inferSelect;
export type InsertTriggerLog = typeof triggerLogs.$inferInsert;

/** Magic links for passwordless email authentication */
export const magicLinks = mysqlTable("magic_links", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  examTypes: text("examTypes").notNull(), // JSON array of exam types the user has access to
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MagicLink = typeof magicLinks.$inferSelect;
export type InsertMagicLink = typeof magicLinks.$inferInsert;

/** Dashboard OTPs — 6-digit codes for email-based dashboard login (no Manus account required) */
export const dashboardOtps = mysqlTable("dashboard_otps", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  codeHash: varchar("codeHash", { length: 128 }).notNull(), // SHA-256 of the 6-digit code
  expiresAt: timestamp("expiresAt").notNull(), // 10 minutes from creation
  usedAt: timestamp("usedAt"), // null until consumed
  attempts: int("attempts").notNull().default(0), // brute-force protection: max 5 attempts
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DashboardOtp = typeof dashboardOtps.$inferSelect;
export type InsertDashboardOtp = typeof dashboardOtps.$inferInsert;

/**
 * Organizations — one row per utility or employer that buys a team plan.
 * Billing: one Stripe subscription per org (quantity = seats).
 * Access: per-operator internal managed `subscriptions` rows (orgId set, stripeSubscriptionId null).
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  province: varchar("province", { length: 32 }).notNull(), // 'ontario' | 'western'
  tier: varchar("tier", { length: 32 }).notNull().default("all-access"), // always all-access for self-serve teams
  seatsTotal: int("seatsTotal").notNull(), // = Stripe subscription quantity
  managerEmail: varchar("managerEmail", { length: 320 }).notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }).unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  termEnd: timestamp("termEnd").notNull(), // current period end from Stripe
  billingType: varchar("billingType", { length: 16 }).notNull().default("stripe"), // 'stripe' | 'invoice'
  status: varchar("status", { length: 32 }).notNull().default("active"), // 'active' | 'past_due' | 'cancelled'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Organization members — one row per operator (or manager) in an org.
 * role: 'manager' | 'operator'
 * status: 'assigned' | 'revoked'
 * courseKey: the specific course bundle assigned to this seat (e.g. 'wpi-class4-water', 'class3-water').
 *   Null means the seat holder gets the org's default tier (all-access within their province).
 *   Set by the manager at assignment time or updated later on unassigned seats.
 */
export const organizationMembers = mysqlTable("organization_members", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  email: varchar("email", { length: 320 }).notNull(), // normalized
  name: varchar("name", { length: 200 }), // optional display name set by manager at assignment time
  role: varchar("role", { length: 20 }).notNull().default("operator"), // 'manager' | 'operator'
  status: varchar("status", { length: 20 }).notNull().default("assigned"), // 'assigned' | 'revoked'
  /** Specific course bundle for this seat. Null = org default (all-access for province). */
  courseKey: varchar("courseKey", { length: 64 }), // e.g. 'wpi-class4-water', 'class3-water', 'class3-ww'
  /**
   * JSON array of all course keys assigned to this seat.
   * Supersedes courseKey for multi-course seats. Kept in sync with courseKey (first entry).
   * e.g. '["class2-wastewater-coll","class2-water-dist"]'
   */
  courseKeys: text("courseKeys"), // JSON string: string[] | null
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
}, (t) => [
  index("org_members_orgid_idx").on(t.orgId),
  index("org_members_email_idx").on(t.email),
]);

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = typeof organizationMembers.$inferInsert;

/**
 * Blog posts — SEO-targeted articles for Ontario water/wastewater operator certification.
 * Content stored as HTML string (rendered server-side from markdown).
 */
export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 300 }).notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(), // HTML content
  author: varchar("author", { length: 100 }).notNull().default("Echelon Institute"),
  tags: varchar("tags", { length: 500 }), // comma-separated
  metaTitle: varchar("metaTitle", { length: 300 }),
  metaDescription: varchar("metaDescription", { length: 500 }),
  readingTimeMinutes: int("readingTimeMinutes").notNull().default(5),
  published: int("published").notNull().default(1), // 1 = published, 0 = draft
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("blog_slug_idx").on(t.slug),
  index("blog_published_idx").on(t.published, t.publishedAt),
]);
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * Job postings — live water/wastewater operator job board.
 * Populated by RSS ingestion (Indeed, Job Bank Canada) every 6 hours.
 * Deduplicated by sourceUrl. Jobs unseen for 14+ days are marked inactive.
 */
export const jobPostings = mysqlTable("job_postings", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  location: varchar("location", { length: 255 }),
  province: mysqlEnum("province", ["ON", "BC", "AB", "SK", "MB", "other"]).notNull().default("other"),
  salary: varchar("salary", { length: 255 }),
  jobType: mysqlEnum("jobType", ["full-time", "part-time", "contract"]).notNull().default("full-time"),
  sourceUrl: varchar("sourceUrl", { length: 1024 }).notNull().unique(),
  sourceName: varchar("sourceName", { length: 128 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["rss", "scraper"]).notNull().default("rss"),
  description: text("description"),
  postedAt: timestamp("postedAt"),
  isFeatured: int("isFeatured").notNull().default(0), // 1 = featured
  isActive: int("isActive").notNull().default(1),     // 1 = active
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("job_province_idx").on(t.province),
  index("job_type_idx").on(t.jobType),
  index("job_posted_at_idx").on(t.postedAt),
  index("job_active_idx").on(t.isActive),
]);
export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = typeof jobPostings.$inferInsert;
