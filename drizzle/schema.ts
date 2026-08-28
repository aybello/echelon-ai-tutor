import { boolean, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar, uniqueIndex } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

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
  userId: int("userId"), // linked user account (null for anonymous)
  studentEmail: varchar("studentEmail", { length: 255 }), // linked email (null for anonymous)
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
  /** Phase 1: Org-scoped mock results */
  orgId: int("orgId"),
  organizationMemberId: int("organizationMemberId"),
  courseKey: varchar("courseKey", { length: 64 }),
  bankKey: varchar("bankKey", { length: 64 }),
}, (t) => [
  index("exam_results_identity_idx").on(t.studentEmail, t.courseKey, t.createdAt),
  index("exam_results_org_member_idx").on(t.orgId, t.organizationMemberId, t.createdAt),
  uniqueIndex("exam_results_session_unique_idx").on(t.sessionId),
  index("idx_exam_results_email").on(t.studentEmail),
  index("idx_exam_results_user").on(t.userId),
]);

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
  /** Null means a grandfathered permanent purchase; new Individual Exam Passes expire after 12 months. */
  accessExpiresAt: timestamp("accessExpiresAt"),
  refundedAt: timestamp("refundedAt"),
  /**
   * Retired legacy marker. It remains in the immutable migration contract, but
   * application reads use purchaseReadColumns so deployments created without
   * this unused column continue to work.
   */
  welcomeEmailSentAt: timestamp("welcomeEmailSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

/** Active purchase fields; deliberately excludes the retired welcome marker. */
export const purchaseReadColumns = {
  id: purchases.id,
  userId: purchases.userId,
  email: purchases.email,
  productKey: purchases.productKey,
  productName: purchases.productName,
  amountCAD: purchases.amountCAD,
  stripeSessionId: purchases.stripeSessionId,
  stripePaymentIntentId: purchases.stripePaymentIntentId,
  province: purchases.province,
  utmSource: purchases.utmSource,
  utmMedium: purchases.utmMedium,
  utmCampaign: purchases.utmCampaign,
  referralSource: purchases.referralSource,
  phone: purchases.phone,
  customerName: purchases.customerName,
  status: purchases.status,
  accessExpiresAt: purchases.accessExpiresAt,
  refundedAt: purchases.refundedAt,
  createdAt: purchases.createdAt,
};

/** Subscriptions — tracks active Stripe recurring subscriptions */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null for guest subscriptions (email-only)
  email: varchar("email", { length: 320 }).notNull(),
  tier: mysqlEnum("tier", ["class1", "class2", "class3", "class4", "all-access"]).notNull(),
  province: mysqlEnum("province", ["ontario", "western"]).notNull(),
  /** Stripe ID for self-serve rows; deterministic org-{orgId}-{email}-{courseKey} ID for org-managed rows. */
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  status: mysqlEnum("status", ["active", "cancelled", "past_due", "unpaid", "expired"]).notNull().default("active"),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  /** Set when this row is org-managed (seat granted by an org). Null for self-serve subscriptions. */
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
  /** Phase 1: Org-scoped exam dates */
  orgId: int("orgId"),
  organizationMemberId: int("organizationMemberId"),
  courseKey: varchar("courseKey", { length: 64 }),
}, (t) => [
  index("exam_dates_org_member_idx").on(t.orgId, t.organizationMemberId, t.courseKey, t.examDate),
]);
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
  /** Server-scored: the option index the student selected (0-3). */
  selectedIndex: int("selectedIndex"),
  /** The bank key for this attempt — used for org analytics scoping. */
  bankKey: varchar("bankKey", { length: 64 }),
  /** The course key for this attempt — used for org entitlement scoping. */
  courseKey: varchar("courseKey", { length: 64 }),
  /** Org ID for team plan operators — null for individual learners. */
  orgId: int("orgId"),
  /** Organization member ID for team plan operators — null for individual learners. */
  organizationMemberId: int("organizationMemberId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  // Issue O: composite indexes for the frequent userId/studentEmail + createdAt filter pattern
  index("qa_userid_createdat_idx").on(t.userId, t.createdAt),
  index("qa_email_createdat_idx").on(t.studentEmail, t.createdAt),
  // Issue Q: index for GROUP BY sessionId queries in recentSessions
  index("qa_sessionid_idx").on(t.sessionId),
  index("qa_org_member_course_created_idx").on(t.orgId, t.organizationMemberId, t.courseKey, t.createdAt),
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

/**
 * One onboarding record per learner and course. This is deliberately separate
 * from entitlements: completing or skipping onboarding can never grant or
 * revoke paid access.
 */
export const learnerOnboarding = mysqlTable("learner_onboarding", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  studentEmail: varchar("studentEmail", { length: 320 }),
  orgId: int("orgId"),
  organizationMemberId: int("organizationMemberId"),
  courseKey: varchar("courseKey", { length: 64 }).notNull(),
  examDate: timestamp("examDate"),
  studyDaysPerWeek: int("studyDaysPerWeek").notNull().default(3),
  sessionMinutes: int("sessionMinutes").notNull().default(25),
  confidence: varchar("confidence", { length: 24 }).notNull().default("somewhat"),
  status: varchar("status", { length: 24 }).notNull().default("profile_started"),
  diagnosticStartedAt: timestamp("diagnosticStartedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("learner_onboarding_user_course_idx").on(table.userId, table.courseKey),
  uniqueIndex("learner_onboarding_email_course_idx").on(table.studentEmail, table.courseKey),
  index("learner_onboarding_org_status_idx").on(table.orgId, table.status),
  index("learner_onboarding_member_idx").on(table.organizationMemberId),
]);
export type LearnerOnboarding = typeof learnerOnboarding.$inferSelect;
export type InsertLearnerOnboarding = typeof learnerOnboarding.$inferInsert;

/** Server-scored starting baselines. Scores stay out of client-side analytics. */
export const diagnosticSessions = mysqlTable("diagnostic_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 36 }).notNull().unique(),
  userId: int("userId"),
  studentEmail: varchar("studentEmail", { length: 320 }),
  orgId: int("orgId"),
  organizationMemberId: int("organizationMemberId"),
  courseKey: varchar("courseKey", { length: 64 }).notNull(),
  correct: int("correct").notNull(),
  total: int("total").notNull(),
  score: int("score").notNull(),
  label: varchar("label", { length: 64 }).notNull(),
  weakTopics: text("weakTopics").notNull(),
  strongTopics: text("strongTopics").notNull(),
  topicBreakdown: text("topicBreakdown").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
}, (table) => [
  index("diagnostic_identity_time_idx").on(table.studentEmail, table.courseKey, table.completedAt),
  index("diagnostic_user_time_idx").on(table.userId, table.courseKey, table.completedAt),
  index("diagnostic_org_time_idx").on(table.orgId, table.completedAt),
  index("diagnostic_member_idx").on(table.organizationMemberId),
]);
export type DiagnosticSession = typeof diagnosticSessions.$inferSelect;
export type InsertDiagnosticSession = typeof diagnosticSessions.$inferInsert;

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
  /** Cognitive level per WPI NTK: 'recall' = knowledge/comprehension, 'application' = analysis/synthesis */
  cognitiveLevel: mysqlEnum("cognitiveLevel", ["recall", "application"]),
  /** Traceable source and blueprint metadata for content governance. */
  sourceTitle: varchar("sourceTitle", { length: 255 }),
  sourceReference: varchar("sourceReference", { length: 512 }),
  sourceUrl: varchar("sourceUrl", { length: 1024 }),
  blueprintObjective: varchar("blueprintObjective", { length: 255 }),
  /** Existing questions start unreviewed and must be explicitly approved by an admin. */
  reviewStatus: mysqlEnum("reviewStatus", ["unreviewed", "in_review", "approved", "rejected"])
    .default("unreviewed")
    .notNull(),
  reviewedBy: varchar("reviewedBy", { length: 320 }),
  reviewedAt: timestamp("reviewedAt"),
}, (table) => [
  uniqueIndex("bank_question_idx").on(table.bankKey, table.questionNum),
  index("question_review_status_idx").on(table.reviewStatus),
  index("question_bank_review_status_idx").on(table.bankKey, table.reviewStatus),
]);

export type QuestionRow = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

/**
 * Versioned certification banks for regulated trades such as Ontario 309A.
 *
 * These tables deliberately sit beside the legacy water/wastewater question
 * tables. A bank version is the publication boundary: content may exist in a
 * draft bank without becoming visible to learners, commerce, or Teams.
 */
export const certificationBankVersions = mysqlTable("certification_bank_versions", {
  id: int("id").autoincrement().primaryKey(),
  programKey: varchar("programKey", { length: 128 }).notNull(),
  bankKey: varchar("bankKey", { length: 64 }).notNull(),
  versionKey: varchar("versionKey", { length: 128 }).notNull(),
  blueprintVersion: varchar("blueprintVersion", { length: 255 }).notNull(),
  releaseChannel: mysqlEnum("releaseChannel", ["internal", "beta", "public", "retired"])
    .default("internal")
    .notNull(),
  itemTarget: int("itemTarget").notNull(),
  active: boolean("active").default(false).notNull(),
  allocationChecksum: varchar("allocationChecksum", { length: 64 }).notNull(),
  sourceManifestChecksum: varchar("sourceManifestChecksum", { length: 64 }).notNull(),
  commercialEligibility: boolean("commercialEligibility").default(false).notNull(),
  teamEligibility: boolean("teamEligibility").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  publishedAt: timestamp("publishedAt"),
  retiredAt: timestamp("retiredAt"),
}, (table) => [
  uniqueIndex("cert_bank_version_unique_idx").on(table.bankKey, table.versionKey),
  index("cert_bank_blueprint_idx").on(table.bankKey, table.blueprintVersion),
  index("cert_bank_program_active_idx").on(table.programKey, table.active, table.releaseChannel),
]);

export type CertificationBankVersionRow = typeof certificationBankVersions.$inferSelect;
export type InsertCertificationBankVersion = typeof certificationBankVersions.$inferInsert;

/** Rights and provenance records shared by governed certification content. */
export const certificationSources = mysqlTable("certification_sources", {
  id: int("id").autoincrement().primaryKey(),
  sourceKey: varchar("sourceKey", { length: 128 }).notNull(),
  publisher: varchar("publisher", { length: 255 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  stableUrl: varchar("stableUrl", { length: 1024 }).notNull(),
  editionVersion: varchar("editionVersion", { length: 255 }),
  retrievedAt: timestamp("retrievedAt").notNull(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  rightsBasis: mysqlEnum("rightsBasis", [
    "public_official_reference",
    "permission_granted",
    "licensed_access_required",
  ]).notNull(),
  permittedUsage: text("permittedUsage").notNull(),
  verifiedAt: timestamp("verifiedAt").notNull(),
}, (table) => [
  uniqueIndex("cert_source_version_unique_idx").on(table.sourceKey, table.sha256),
  index("cert_source_key_idx").on(table.sourceKey),
  index("cert_source_rights_idx").on(table.rightsBasis),
]);

export type CertificationSourceRow = typeof certificationSources.$inferSelect;
export type InsertCertificationSource = typeof certificationSources.$inferInsert;

/** Exact task allocation for each immutable bank version. */
export const certificationBlueprintTasks = mysqlTable("certification_blueprint_tasks", {
  id: int("id").autoincrement().primaryKey(),
  bankVersionId: int("bankVersionId").notNull(),
  mwaCode: varchar("mwaCode", { length: 4 }).notNull(),
  taskCode: varchar("taskCode", { length: 16 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  officialTarget: decimal("officialTarget", { precision: 5, scale: 2 }).notNull(),
  bankTarget: int("bankTarget").notNull(),
  sourceId: int("sourceId").notNull(),
  sourceReference: varchar("sourceReference", { length: 512 }).notNull(),
}, (table) => [
  uniqueIndex("cert_blueprint_task_unique_idx").on(table.bankVersionId, table.taskCode),
  index("cert_blueprint_mwa_idx").on(table.bankVersionId, table.mwaCode),
]);

export type CertificationBlueprintTaskRow = typeof certificationBlueprintTasks.$inferSelect;
export type InsertCertificationBlueprintTask = typeof certificationBlueprintTasks.$inferInsert;

/** Original, versioned certification questions. */
export const certificationQuestions = mysqlTable("certification_questions", {
  id: int("id").autoincrement().primaryKey(),
  bankVersionId: int("bankVersionId").notNull(),
  bankItemNumber: int("bankItemNumber").notNull(),
  taskId: int("taskId").notNull(),
  module: varchar("module", { length: 4 }).notNull(),
  taskCode: varchar("taskCode", { length: 16 }).notNull(),
  subtaskCode: varchar("subtaskCode", { length: 16 }).notNull(),
  topic: varchar("topic", { length: 128 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).notNull(),
  questionType: mysqlEnum("questionType", [
    "foundation",
    "applied_scenario",
    "troubleshooting_or_calculation",
  ]).notNull(),
  cognitiveLevel: mysqlEnum("cognitiveLevel", [
    "recall",
    "procedural_application",
    "critical_thinking",
  ]).notNull(),
  question: text("question").notNull(),
  options: text("options").notNull(),
  correctIndex: int("correctIndex").notNull(),
  explanation: text("explanation").notNull(),
  steps: text("steps"),
  tip: text("tip"),
  isCalc: mysqlEnum("isCalc", ["yes", "no"]).default("no").notNull(),
  diagramId: varchar("diagramId", { length: 64 }),
  diagramAlt: text("diagramAlt"),
  sourceId: int("sourceId").notNull(),
  sourceReference: varchar("sourceReference", { length: 512 }).notNull(),
  blueprintObjective: varchar("blueprintObjective", { length: 512 }).notNull(),
  authorIdentity: varchar("authorIdentity", { length: 320 }).notNull(),
  origin: mysqlEnum("origin", ["human", "ai_assisted", "imported"]).notNull(),
  contentHash: varchar("contentHash", { length: 64 }).notNull(),
  contentStatus: mysqlEnum("contentStatus", [
    "draft",
    "editorial_approved",
    "technical_approved",
    "beta_approved",
    "rejected",
    "retired",
  ]).default("draft").notNull(),
  publicEligibility: boolean("publicEligibility").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  retiredAt: timestamp("retiredAt"),
}, (table) => [
  uniqueIndex("cert_question_bank_item_unique_idx").on(table.bankVersionId, table.bankItemNumber),
  uniqueIndex("cert_question_content_hash_unique_idx").on(table.bankVersionId, table.contentHash),
  index("cert_question_delivery_idx").on(table.bankVersionId, table.contentStatus, table.publicEligibility),
  index("cert_question_task_idx").on(table.bankVersionId, table.taskCode),
]);

export type CertificationQuestionRow = typeof certificationQuestions.$inferSelect;
export type InsertCertificationQuestion = typeof certificationQuestions.$inferInsert;

/** Immutable review decisions; authors cannot technically approve their own content. */
export const certificationContentReviews = mysqlTable("certification_content_reviews", {
  id: int("id").autoincrement().primaryKey(),
  bankVersionId: int("bankVersionId").notNull(),
  contentKind: mysqlEnum("contentKind", ["question", "diagram", "flashcard", "module_note"]).notNull(),
  contentId: int("contentId").notNull(),
  authorIdentity: varchar("authorIdentity", { length: 320 }).notNull(),
  reviewerIdentity: varchar("reviewerIdentity", { length: 320 }).notNull(),
  reviewType: mysqlEnum("reviewType", ["editorial", "technical", "beta_release"]).notNull(),
  decision: mysqlEnum("decision", ["approved", "changes_requested", "rejected"]).notNull(),
  notes: text("notes"),
  reviewedAt: timestamp("reviewedAt").defaultNow().notNull(),
}, (table) => [
  index("cert_review_content_idx").on(table.contentKind, table.contentId, table.reviewType),
  index("cert_review_bank_idx").on(table.bankVersionId, table.reviewedAt),
]);

export type CertificationContentReviewRow = typeof certificationContentReviews.$inferSelect;
export type InsertCertificationContentReview = typeof certificationContentReviews.$inferInsert;

/** Auditable, atomic content-import runs. */
export const certificationImportRuns = mysqlTable("certification_import_runs", {
  id: int("id").autoincrement().primaryKey(),
  bankVersionId: int("bankVersionId").notNull(),
  manifestChecksum: varchar("manifestChecksum", { length: 64 }).notNull(),
  dryRun: boolean("dryRun").default(true).notNull(),
  importerIdentity: varchar("importerIdentity", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["planned", "validated", "completed", "failed"]).default("planned").notNull(),
  insertedCount: int("insertedCount").default(0).notNull(),
  updatedCount: int("updatedCount").default(0).notNull(),
  rejectedCount: int("rejectedCount").default(0).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => [
  uniqueIndex("cert_import_manifest_unique_idx").on(table.bankVersionId, table.manifestChecksum),
  index("cert_import_status_idx").on(table.status, table.createdAt),
]);

export type CertificationImportRunRow = typeof certificationImportRuns.$inferSelect;
export type InsertCertificationImportRun = typeof certificationImportRuns.$inferInsert;

export const certificationDiagrams = mysqlTable("certification_diagrams", {
  id: int("id").autoincrement().primaryKey(),
  bankVersionId: int("bankVersionId").notNull(),
  diagramId: varchar("diagramId", { length: 64 }).notNull(),
  version: int("version").default(1).notNull(),
  componentKey: varchar("componentKey", { length: 255 }).notNull(),
  altText: text("altText").notNull(),
  sourceId: int("sourceId").notNull(),
  rightsMetadata: text("rightsMetadata").notNull(),
  authorIdentity: varchar("authorIdentity", { length: 320 }).notNull(),
  contentStatus: mysqlEnum("contentStatus", [
    "draft",
    "editorial_approved",
    "technical_approved",
    "beta_approved",
    "rejected",
    "retired",
  ]).default("draft").notNull(),
  retiredAt: timestamp("retiredAt"),
}, (table) => [
  uniqueIndex("cert_diagram_version_unique_idx").on(table.bankVersionId, table.diagramId, table.version),
  index("cert_diagram_delivery_idx").on(table.bankVersionId, table.contentStatus),
]);

export type CertificationDiagramRow = typeof certificationDiagrams.$inferSelect;
export type InsertCertificationDiagram = typeof certificationDiagrams.$inferInsert;

export const certificationFlashcards = mysqlTable("certification_flashcards", {
  id: int("id").autoincrement().primaryKey(),
  bankVersionId: int("bankVersionId").notNull(),
  taskId: int("taskId").notNull(),
  cardNumber: int("cardNumber").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  sourceId: int("sourceId").notNull(),
  sourceReference: varchar("sourceReference", { length: 512 }).notNull(),
  authorIdentity: varchar("authorIdentity", { length: 320 }).notNull(),
  contentStatus: mysqlEnum("contentStatus", [
    "draft",
    "editorial_approved",
    "technical_approved",
    "beta_approved",
    "rejected",
    "retired",
  ]).default("draft").notNull(),
  retiredAt: timestamp("retiredAt"),
}, (table) => [
  uniqueIndex("cert_flashcard_number_unique_idx").on(table.bankVersionId, table.cardNumber),
  index("cert_flashcard_delivery_idx").on(table.bankVersionId, table.contentStatus),
]);

export type CertificationFlashcardRow = typeof certificationFlashcards.$inferSelect;
export type InsertCertificationFlashcard = typeof certificationFlashcards.$inferInsert;

export const certificationModuleNotes = mysqlTable("certification_module_notes", {
  id: int("id").autoincrement().primaryKey(),
  bankVersionId: int("bankVersionId").notNull(),
  moduleCode: varchar("moduleCode", { length: 4 }).notNull(),
  taskCode: varchar("taskCode", { length: 16 }),
  sectionsJson: text("sectionsJson").notNull(),
  sourceId: int("sourceId").notNull(),
  sourceReference: varchar("sourceReference", { length: 512 }).notNull(),
  authorIdentity: varchar("authorIdentity", { length: 320 }).notNull(),
  contentStatus: mysqlEnum("contentStatus", [
    "draft",
    "editorial_approved",
    "technical_approved",
    "beta_approved",
    "rejected",
    "retired",
  ]).default("draft").notNull(),
  retiredAt: timestamp("retiredAt"),
}, (table) => [
  uniqueIndex("cert_module_note_scope_unique_idx").on(table.bankVersionId, table.moduleCode, table.taskCode),
  index("cert_module_note_delivery_idx").on(table.bankVersionId, table.contentStatus),
]);

export type CertificationModuleNoteRow = typeof certificationModuleNotes.$inferSelect;
export type InsertCertificationModuleNote = typeof certificationModuleNotes.$inferInsert;

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
  /** Blueprint version — incremented when moduleTargets or NTK weights change */
  blueprintVersion: int("blueprintVersion").notNull().default(1),
  /** Minimum calc questions required per mock exam for this bank (per NTK spec) */
  minCalcPerMock: int("minCalcPerMock"),
  /** Cognitive level split target: percentage of recall questions (remainder = application) */
  recallTargetPct: int("recallTargetPct"),
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
  /** SHA-256 hex hash of the raw token. The raw token is only ever in the email link — never stored. */
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
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
  /** Legacy stream-tier column retained for production schema compatibility. */
  stream: varchar("stream", { length: 32 }),
  seatsTotal: int("seatsTotal").notNull(), // = Stripe subscription quantity
  managerEmail: varchar("managerEmail", { length: 320 }).notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }).unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  termEnd: timestamp("termEnd").notNull(), // current period end from Stripe
  termStart: timestamp("termStart"), // current period start — null = backfill as termEnd minus 1 year
  billingType: varchar("billingType", { length: 16 }).notNull().default("stripe"), // 'stripe' | 'invoice'
  status: varchar("status", { length: 32 }).notNull().default("active"), // 'active' | 'past_due' | 'cancelled'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** Timestamp when the manager onboarding email was successfully delivered. Null = not yet sent. */
  onboardingEmailSentAt: timestamp("onboardingEmailSentAt"),
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
  /** FIX 4: Cooldown tracking — last time a reminder was sent to this operator. */
  lastRemindedAt: timestamp("lastRemindedAt"),
  /** FIX 4: Unsubscribe flag — true if operator has opted out of reminder emails. */
  reminderOptOut: boolean("reminderOptOut").default(false).notNull(),
  /** FIX 4: Unsubscribe token — signed token for one-click unsubscribe links. */
  unsubscribeToken: varchar("unsubscribeToken", { length: 128 }),
}, (t) => [
  index("org_members_orgid_idx").on(t.orgId),
  index("org_members_email_idx").on(t.email),
  uniqueIndex("org_members_org_email_unique_idx").on(t.orgId, t.email),
]);

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = typeof organizationMembers.$inferInsert;

/**
 * Manager-entered on-the-job practical training records for an organisation
 * operator. These are records for supervisor review, not Echelon-issued CEUs
 * or a determination that a learning event qualifies under any regulation.
 */
export const onTheJobTrainingRecords = mysqlTable("on_the_job_training_records", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  organizationMemberId: int("organizationMemberId").notNull(),
  studentEmail: varchar("studentEmail", { length: 320 }).notNull(),
  courseKey: varchar("courseKey", { length: 64 }),
  sessionDate: timestamp("sessionDate").notNull(),
  topics: text("topics").notNull(),
  learningObjectives: text("learningObjectives").notNull(),
  providerName: varchar("providerName", { length: 200 }).notNull(),
  providerPhone: varchar("providerPhone", { length: 64 }),
  durationHours: decimal("durationHours", { precision: 5, scale: 2 }).notNull(),
  /** Manager confirms the reported event was structured and facilitator-led. */
  structuredLearningConfirmed: boolean("structuredLearningConfirmed").notNull().default(false),
  recordedByEmail: varchar("recordedByEmail", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("ojt_records_org_member_date_idx").on(t.orgId, t.organizationMemberId, t.sessionDate),
  index("ojt_records_student_date_idx").on(t.studentEmail, t.sessionDate),
]);

export type OnTheJobTrainingRecord = typeof onTheJobTrainingRecords.$inferSelect;
export type InsertOnTheJobTrainingRecord = typeof onTheJobTrainingRecords.$inferInsert;

/**
 * Annual licence usage ledger.
 * One row per distinct operator per organization per contract term.
 * Used to enforce the annual-licence model: revoking an operator does NOT free a licence.
 * Unique constraint: (orgId, memberEmail, termStart) — one record per operator per term.
 */
export const organizationTermUsage = mysqlTable("organization_term_operator_usage", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  memberEmail: varchar("memberEmail", { length: 320 }).notNull(),
  termStart: timestamp("termStart").notNull(),
  termEnd: timestamp("termEnd").notNull(),
  firstActivatedAt: timestamp("firstActivatedAt").defaultNow().notNull(),
}, (t) => [
  index("term_usage_orgid_idx").on(t.orgId),
  index("term_usage_email_idx").on(t.memberEmail),
  uniqueIndex("term_usage_unique_idx").on(t.orgId, t.memberEmail, t.termStart),
]);

export type OrganizationTermUsage = typeof organizationTermUsage.$inferSelect;
export type InsertOrganizationTermUsage = typeof organizationTermUsage.$inferInsert;

/**
 * Exam outcomes — manager-recorded results plus learner self-reports.
 * orgId=0 and recordedBy="learner-self-report" identify an individual report;
 * positive org IDs remain manager-owned team outcomes.
 */
export const examOutcomes = mysqlTable("exam_outcomes", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  memberEmail: varchar("memberEmail", { length: 320 }).notNull(),
  courseKey: varchar("courseKey", { length: 64 }).notNull(),
  result: mysqlEnum("result", ["passed", "failed", "no_show"]).notNull(),
  examDate: timestamp("examDate"),
  recordedBy: varchar("recordedBy", { length: 320 }).notNull(), // manager email
  /** Study estimate captured immediately before the official result was recorded. */
  readinessScoreAtOutcome: int("readinessScoreAtOutcome"),
  readinessModelVersion: varchar("readinessModelVersion", { length: 64 }),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
}, (t) => [
  index("exam_outcomes_orgid_idx").on(t.orgId),
  index("exam_outcomes_email_idx").on(t.memberEmail),
]);
export type ExamOutcome = typeof examOutcomes.$inferSelect;
export type InsertExamOutcome = typeof examOutcomes.$inferInsert;

/**
 * Durable, queryable product events. Raw email addresses are never stored;
 * analytics.ts writes a deterministic SHA-256 hash for identity stitching.
 */
export const productAnalyticsEvents = mysqlTable("product_analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  eventName: varchar("eventName", { length: 64 }).notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  userId: varchar("userId", { length: 64 }),
  emailHash: varchar("emailHash", { length: 64 }),
  /** Browser journey identifier, stored separately so checkout can bridge anonymous and signed-in activity. */
  anonymousHash: varchar("anonymousHash", { length: 64 }),
  examType: varchar("examType", { length: 64 }),
  productKey: varchar("productKey", { length: 64 }),
  orgId: int("orgId"),
  metadata: text("metadata"),
}, (table) => [
  index("analytics_event_time_idx").on(table.eventName, table.occurredAt),
  index("analytics_email_time_idx").on(table.emailHash, table.occurredAt),
  index("analytics_anonymous_time_idx").on(table.anonymousHash, table.occurredAt),
  index("analytics_org_time_idx").on(table.orgId, table.occurredAt),
]);
export type ProductAnalyticsEvent = typeof productAnalyticsEvents.$inferSelect;
export type InsertProductAnalyticsEvent = typeof productAnalyticsEvents.$inferInsert;

/**
 * FIX 5 (P3): Bookmarks — per-user+question table so bookmark state persists across
 * multiple attempts of the same question. Keyed by (userId OR studentEmail) + bankKey + questionId.
 * Replaces the per-attempt bookmarked enum on questionAttempts (kept for backward compat).
 */
export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  studentEmail: varchar("studentEmail", { length: 320 }),
  bankKey: varchar("bankKey", { length: 64 }).notNull(),
  questionId: int("questionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  // Unique constraint: one bookmark per user+question (upsert-safe)
  uniqueIndex("bm_user_question_idx").on(t.userId, t.bankKey, t.questionId),
  uniqueIndex("bm_email_question_idx").on(t.studentEmail, t.bankKey, t.questionId),
  index("bm_userid_idx").on(t.userId),
  index("bm_email_idx").on(t.studentEmail),
]);
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

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
  sourceUrl: varchar("sourceUrl", { length: 1024 }).notNull(),
  sourceName: varchar("sourceName", { length: 128 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["rss", "scraper", "association"]).notNull().default("rss"),
  description: text("description"),
  postedAt: timestamp("postedAt"),
  isFeatured: int("isFeatured").notNull().default(0), // 1 = featured
  isActive: int("isActive").notNull().default(1),     // 1 = active
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  // MySQL 8 + utf8mb4 cannot index all 1,024 characters (4,096 bytes).
  // A 700-character prefix preserves full URLs while staying below 3,072 bytes.
  uniqueIndex("job_postings_source_url_unique").on(sql`${t.sourceUrl}(700)`),
  index("job_province_idx").on(t.province),
  index("job_type_idx").on(t.jobType),
  index("job_posted_at_idx").on(t.postedAt),
  index("job_active_idx").on(t.isActive),
]);
export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = typeof jobPostings.$inferInsert;

/**
 * Email OTP codes — 6-digit one-time passcodes for org operator login.
 * Issued when an operator requests a code; consumed when they enter it.
 * Single-use and short-lived (10 minutes).
 */
export const emailOtpCodes = mysqlTable("email_otp_codes", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  codeHash: varchar("codeHash", { length: 64 }).notNull(), // SHA-256 of the 6-digit code
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"), // null = not yet used
  attempts: int("attempts").notNull().default(0), // wrong-guess counter (max 5)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("otp_email_idx").on(t.email),
]);
export type EmailOtpCode = typeof emailOtpCodes.$inferSelect;
export type InsertEmailOtpCode = typeof emailOtpCodes.$inferInsert;

/**
 * Command drill queue — stores the next recommended drill for a user
 * after completing an Echelon Command scenario.
 * One active row per user; upserted on each "Queue simulation" click.
 */
export const commandDrillQueue = mysqlTable("command_drill_queue", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  guestId: varchar("guestId", { length: 64 }),
  drillName: varchar("drillName", { length: 255 }).notNull(),
  queuedAt: timestamp("queuedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (t) => [
  index("cdq_user_idx").on(t.userId),
  index("cdq_guest_idx").on(t.guestId),
]);
export type CommandDrillQueue = typeof commandDrillQueue.$inferSelect;
export type InsertCommandDrillQueue = typeof commandDrillQueue.$inferInsert;

/**
 * Command run history — one row per completed scenario run.
 * Powers personal score timeline and the operator leaderboard.
 */
export const commandRunHistory = mysqlTable("command_run_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  guestId: varchar("guestId", { length: 64 }),
  displayName: varchar("displayName", { length: 80 }),
  scenarioId: varchar("scenarioId", { length: 60 }).notNull(),
  scenarioTitle: varchar("scenarioTitle", { length: 120 }).notNull(),
  commandScore: int("commandScore").notNull(),
  optimalCalls: int("optimalCalls").notNull(),
  totalSteps: int("totalSteps").notNull(),
  elapsedSeconds: int("elapsedSeconds").notNull().default(0),
  decisionsJson: text("decisionsJson"), // JSON array of { stepId, choiceId, points } — nullable for historical rows
  completedAt: timestamp("completedAt").defaultNow().notNull(),
}, (t) => [
  index("crh_user_idx").on(t.userId),
  index("crh_guest_idx").on(t.guestId),
  index("crh_scenario_idx").on(t.scenarioId),
  index("crh_score_idx").on(t.commandScore),
]);
export type CommandRunHistory = typeof commandRunHistory.$inferSelect;
export type InsertCommandRunHistory = typeof commandRunHistory.$inferInsert;

// --- Command Centre: Feedback & Email Capture ---

export const commandFeedback = mysqlTable("command_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  guestId: varchar("guestId", { length: 64 }),
  scenarioId: varchar("scenarioId", { length: 64 }).notNull(),
  runId: int("runId"), // references command_run_history.id
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"), // optional text feedback
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommandFeedback = typeof commandFeedback.$inferSelect;
export type InsertCommandFeedback = typeof commandFeedback.$inferInsert;

export const commandEmailCapture = mysqlTable("command_email_capture", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  userId: int("userId"),
  guestId: varchar("guestId", { length: 64 }),
  source: varchar("source", { length: 64 }).default("command_debrief").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommandEmailCapture = typeof commandEmailCapture.$inferSelect;
export type InsertCommandEmailCapture = typeof commandEmailCapture.$inferInsert;

/**
 * Stripe event ledger — one row per processed Stripe webhook event.
 * The unique constraint on stripeEventId prevents duplicate processing on replay.
 */
export const stripeEventLog = mysqlTable("stripe_event_log", {
  id: int("id").autoincrement().primaryKey(),
  stripeEventId: varchar("stripeEventId", { length: 128 }).notNull().unique(),
  eventType: varchar("eventType", { length: 128 }).notNull(),
  stripeObjectId: varchar("stripeObjectId", { length: 128 }),
  orgId: int("orgId"),
  status: varchar("status", { length: 40 }).notNull().default("pending"),
  dbProcessed: boolean("dbProcessed").notNull().default(false),
  emailDelivered: boolean("emailDelivered").notNull().default(false),
  attemptCount: int("attemptCount").notNull().default(0),
  processingToken: varchar("processingToken", { length: 64 }),
  processingStartedAt: timestamp("processingStartedAt"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  eventTypeIdx: index("stripe_event_log_event_type_idx").on(table.eventType),
  orgIdIdx: index("stripe_event_log_org_id_idx").on(table.orgId),
  statusIdx: index("stripe_event_log_status_idx").on(table.status),
}));

export type StripeEventLog = typeof stripeEventLog.$inferSelect;
export type InsertStripeEventLog = typeof stripeEventLog.$inferInsert;

export type StripeEventStatus =
  | "pending"
  | "processing"
  | "db_completed_email_pending"
  | "completed"
  | "failed";

// ==================== Teams Flex Tables ====================

/** Teams Flex orders - one order can contain multiple course licences at different terms */
export const teamFlexOrders = mysqlTable("team_flex_orders", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  purchaserUserId: int("purchaserUserId"),
  managerEmail: varchar("managerEmail", { length: 320 }).notNull(),
  totalLicences: int("totalLicences").notNull(),
  subtotalCents: int("subtotalCents").notNull(),
  discountRate: decimal("discountRate", { precision: 5, scale: 4 }).notNull().default("0"),
  discountCents: int("discountCents").notNull().default(0),
  totalBeforeTaxCents: int("totalBeforeTaxCents").notNull(),
  taxCents: int("taxCents"),
  totalPaidCents: int("totalPaidCents"),
  currency: varchar("currency", { length: 3 }).notNull().default("cad"),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 128 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  overlapAcknowledged: boolean("overlapAcknowledged").notNull().default(false),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("team_flex_orders_checkout_unique").on(table.stripeCheckoutSessionId),
  index("team_flex_orders_org_status_idx").on(table.organizationId, table.status),
  index("idx_flex_orders_org").on(table.organizationId),
  index("idx_flex_orders_status").on(table.status),
  uniqueIndex("uk_stripe_pi").on(table.stripePaymentIntentId),
]);
export type TeamFlexOrder = typeof teamFlexOrders.$inferSelect;

/** Teams Flex order items - line items with pricing per course per term */
export const teamFlexOrderItems = mysqlTable("team_flex_order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  courseKey: varchar("courseKey", { length: 64 }).notNull(),
  examFamily: varchar("examFamily", { length: 32 }).notNull(),
  pricingBand: varchar("pricingBand", { length: 32 }).notNull(),
  courseLevel: int("courseLevel"),
  termMonths: int("termMonths").notNull(),
  quantity: int("quantity").notNull(),
  listUnitPriceCents: int("listUnitPriceCents").notNull(),
  discountRate: decimal("discountRate", { precision: 5, scale: 4 }).notNull().default("0"),
  discountedUnitPriceCents: int("discountedUnitPriceCents").notNull(),
  lineTotalCents: int("lineTotalCents").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_flex_items_order").on(table.orderId),
]);
export type TeamFlexOrderItem = typeof teamFlexOrderItems.$inferSelect;

/** Teams Flex licences - individual operator access grants */
export const teamFlexLicences = mysqlTable("team_flex_licences", {
  id: int("id").autoincrement().primaryKey(),
  orderItemId: int("orderItemId").notNull(),
  organizationId: int("organizationId").notNull(),
  courseKey: varchar("courseKey", { length: 64 }).notNull(),
  termMonths: int("termMonths").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("unused"),
  invitedEmail: varchar("invitedEmail", { length: 320 }),
  invitationToken: varchar("invitationToken", { length: 128 }),
  invitedAt: timestamp("invitedAt"),
  operatorUserId: int("operatorUserId"),
  assignedAt: timestamp("assignedAt"),
  activatedAt: timestamp("activatedAt"),
  accessEndsAt: timestamp("accessEndsAt"),
  originalAccessEndsAt: timestamp("originalAccessEndsAt"),
  reportingEndsAt: timestamp("reportingEndsAt"),
  extensionApplied: boolean("extensionApplied").notNull().default(false),
  extensionStartsAt: timestamp("extensionStartsAt"),
  activationDeadline: timestamp("activationDeadline").notNull(),
  startsAt: timestamp("startsAt"),
  suspendedAt: timestamp("suspendedAt"),
  suspendedReason: varchar("suspendedReason", { length: 100 }),
  revokedAt: timestamp("revokedAt"),
  revokeReason: varchar("revokeReason", { length: 64 }),
  previousStatus: varchar("previousStatus", { length: 32 }),
  replacedByLicenceId: int("replacedByLicenceId"),
  replacesLicenceId: int("replacesLicenceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("flex_lic_org_status_idx").on(table.organizationId, table.status),
  index("flex_lic_operator_idx").on(table.operatorUserId, table.status, table.courseKey),
  index("flex_lic_email_idx").on(table.invitedEmail, table.status, table.courseKey),
  index("flex_lic_deadline_idx").on(table.status, table.activationDeadline),
  index("flex_lic_invitation_idx").on(table.invitationToken, table.status),
  index("idx_flex_lic_deadline").on(table.status, table.activationDeadline),
  index("idx_flex_lic_expiry").on(table.status, table.accessEndsAt),
  index("idx_flex_lic_invitation").on(table.invitationToken),
]);
export type TeamFlexLicence = typeof teamFlexLicences.$inferSelect;

/** Teams Flex extensions - 90-day retake extensions */
export const teamFlexExtensions = mysqlTable("team_flex_extensions", {
  id: int("id").autoincrement().primaryKey(),
  licenceId: int("licenceId").notNull(),
  organizationId: int("organizationId").notNull(),
  purchaserUserId: int("purchaserUserId").notNull(),
  extensionDays: int("extensionDays").notNull().default(90),
  priceCents: int("priceCents").notNull(),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 128 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  appliedAt: timestamp("appliedAt"),
  newAccessEndsAt: timestamp("newAccessEndsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("team_flex_extensions_licence_unique").on(table.licenceId),
]);
export type TeamFlexExtension = typeof teamFlexExtensions.$inferSelect;

// ─── Platform Changelog ────────────────────────────────────────────────────────
export const changelog = mysqlTable("changelog", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 32 }).notNull(), // e.g. "August 2026"
  badge: varchar("badge", { length: 32 }).default(""), // e.g. "New", "Improvement", ""
  badgeColor: varchar("badgeColor", { length: 16 }).default("#0F766E").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  body: text("body").notNull(),
  sortOrder: int("sortOrder").notNull().default(0), // lower = newer (top)
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ChangelogEntry = typeof changelog.$inferSelect;
export type InsertChangelogEntry = typeof changelog.$inferInsert;
