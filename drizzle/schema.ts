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
  score: int("score").notNull(), // number of correct answers
  total: int("total").notNull(), // total questions attempted
  passed: mysqlEnum("passed", ["yes", "no"]).notNull(),
  timeTakenSeconds: int("timeTakenSeconds"), // how long the exam took
  moduleBreakdown: text("moduleBreakdown"), // JSON string: { moduleName: { correct, total } }
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
