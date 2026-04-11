import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

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
  examType: varchar("examType", { length: 64 }).notNull(), // e.g. 'oit', 'class1-water', 'wpi-class2-wastewater'
  topic: varchar("topic", { length: 128 }).notNull(), // e.g. 'Disinfection', 'Hydraulics'
  questionId: int("questionId").notNull(),
  correct: mysqlEnum("correct", ["yes", "no"]).notNull(),
  difficulty: varchar("difficulty", { length: 16 }), // 'easy' | 'medium' | 'hard'
  quizMode: varchar("quizMode", { length: 32 }).default("standard"), // 'standard' | 'quick10' | 'missed' | 'qotd'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type QuestionAttempt = typeof questionAttempts.$inferSelect;
export type InsertQuestionAttempt = typeof questionAttempts.$inferInsert;

/** Student profiles — live topic accuracy snapshot, updated after each quiz session */
export const studentProfiles = mysqlTable("student_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
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
});
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
