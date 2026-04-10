import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { waitlist, questionErrorReports, trialEmails, examResults, contactSubmissions, users, examDates } from "../drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { adminRouter } from "./routers/admin";
import { stripeRouter } from "./routers/stripeRouter";
import { flashcardRouter } from "./routers/flashcardRouter";
import { quizRouter } from "./routers/quizRouter";
import { sendContactEmail } from "./email";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  admin: adminRouter,
  stripe: stripeRouter,
  flashcard: flashcardRouter,
  quiz: quizRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updatePhone: protectedProcedure
      .input(
        z.object({
          phone: z.string().min(7, "Please enter a valid phone number").max(32),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.update(users).set({ phone: input.phone }).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
    updateProvince: protectedProcedure
      .input(
        z.object({
          province: z.enum(["on", "bc", "ab", "sk", "mb"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.update(users).set({ province: input.province }).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
  }),

  // Waitlist — email lead capture for upcoming courses
  waitlist: router({
    join: publicProcedure
      .input(
        z.object({
          email: z.string().email("Please enter a valid email address"),
          courseCode: z.string().min(1),
          courseTitle: z.string().min(1),
          province: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Check for duplicate — same email + course
        const existing = await db
          .select()
          .from(waitlist)
          .where(and(eq(waitlist.email, input.email), eq(waitlist.courseCode, input.courseCode)))
          .limit(1);

        if (existing.length > 0) {
          return { success: true, alreadyRegistered: true };
        }

        await db.insert(waitlist).values({
          email: input.email,
          courseCode: input.courseCode,
          courseTitle: input.courseTitle,
          province: input.province ?? null,
        });

        // Notify the owner
        await notifyOwner({
          title: `New waitlist signup: ${input.courseCode}`,
          content: `${input.email} joined the waitlist for "${input.courseTitle}"${input.province ? ` (Province: ${input.province})` : ""}.`,
        });

        return { success: true, alreadyRegistered: false };
      }),
  }),

  // Question error reporting — lets users flag mistakes in the question bank
  question: router({
    reportError: publicProcedure
      .input(
        z.object({
          questionId: z.number().int().positive(),
          questionText: z.string().min(1).max(1000),
          module: z.string().min(1).max(64),
          reportType: z.enum(["wrong_answer", "wrong_calculation", "unclear_question", "other"]),
          details: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        await db.insert(questionErrorReports).values({
          questionId: input.questionId,
          questionText: input.questionText,
          module: input.module,
          reportType: input.reportType,
          details: input.details ?? null,
        });

        // Notify owner so errors can be reviewed quickly
        await notifyOwner({
          title: `Question error reported: Q${input.questionId}`,
          content: `Module: ${input.module}\nType: ${input.reportType}\nQuestion: ${input.questionText.slice(0, 120)}...\n${input.details ? `Details: ${input.details}` : ""}`,
        });

        return { success: true };
      }),
  }),

  // Trial email gate — captures emails when users hit the 15-question free limit
  trial: router({
    unlock: publicProcedure
      .input(
        z.object({
          email: z.string().email("Please enter a valid email address"),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Upsert — don't error if same email submits again
        const existing = await db
          .select()
          .from(trialEmails)
          .where(eq(trialEmails.email, input.email))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(trialEmails).values({
            email: input.email,
            source: "quiz_gate",
          });

          // Notify owner of new trial signup
          await notifyOwner({
            title: `New trial signup via quiz gate`,
            content: `${input.email} submitted their email to unlock the full question bank.`,
          });
        }

        return { success: true };
      }),
  }),

  // Exam results — saves mock exam scores for score history
  exam: router({
    saveResult: publicProcedure
      .input(
        z.object({
          sessionId: z.string().min(1).max(64),
          examType: z.enum(["class1", "wqa", "oit", "oit-ww", "class1-water", "class1-ww", "class2-water", "class2-ww", "class3-water", "class3-ww", "class4-water", "class4-ww", "wpi-class1-water", "wpi-class2-water", "wpi-class3-water", "wpi-class4-water", "wpi-class1-wastewater", "wpi-class2-wastewater", "wpi-class3-wastewater", "wpi-class4-wastewater", "wpi-class1-water-dist", "wpi-class2-water-dist", "wpi-class3-water-dist", "wpi-class4-water-dist", "wpi-class1-water-coll", "wpi-class2-water-coll", "wpi-class3-water-coll", "wpi-class4-water-coll"]),
          stream: z.enum(["water", "wastewater"]).optional(),
          score: z.number().int().min(0),
          total: z.number().int().min(1),
          passed: z.boolean(),
          timeTakenSeconds: z.number().int().min(0).optional(),
          moduleBreakdown: z.record(z.string(), z.object({ correct: z.number(), total: z.number() })).optional(),
          calcOnly: z.boolean().optional(), // true if this was a Math Practice (calc-only) session
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        await db.insert(examResults).values({
          sessionId: input.sessionId,
          examType: input.examType,
          stream: input.stream ?? null,
          score: input.score,
          total: input.total,
          passed: input.passed ? "yes" : "no",
          timeTakenSeconds: input.timeTakenSeconds ?? null,
          moduleBreakdown: input.moduleBreakdown ? JSON.stringify(input.moduleBreakdown) : null,
          calcOnly: input.calcOnly ? "yes" : "no",
        });

        return { success: true };
      }),

    getHistory: publicProcedure
      .input(z.object({
        sessionId: z.string().min(1).max(64),
        examType: z.enum(["class1", "wqa", "oit", "oit-ww", "class1-water", "class1-ww", "class2-water", "class2-ww", "class3-water", "class3-ww", "class4-water", "class4-ww", "wpi-class1-water", "wpi-class2-water", "wpi-class3-water", "wpi-class4-water", "wpi-class1-wastewater", "wpi-class2-wastewater", "wpi-class3-wastewater", "wpi-class4-wastewater", "wpi-class1-water-dist", "wpi-class2-water-dist", "wpi-class3-water-dist", "wpi-class4-water-dist", "wpi-class1-water-coll", "wpi-class2-water-coll", "wpi-class3-water-coll", "wpi-class4-water-coll"]),
        stream: z.enum(["water", "wastewater"]).optional(),
        calcOnly: z.boolean().optional(), // filter to only Math Practice sessions
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        const conditions = [
          eq(examResults.sessionId, input.sessionId),
          eq(examResults.examType, input.examType),
        ];
        if (input.stream) {
          conditions.push(eq(examResults.stream, input.stream));
        }
        if (input.calcOnly !== undefined) {
          conditions.push(eq(examResults.calcOnly, input.calcOnly ? "yes" : "no"));
        }

        const results = await db
          .select()
          .from(examResults)
          .where(and(...conditions))
          .orderBy(desc(examResults.id))
          .limit(5);

        return results.map(r => ({
          ...r,
          moduleBreakdown: r.moduleBreakdown ? JSON.parse(r.moduleBreakdown) : null,
        }));
      }),
  }),

  // Contact form — sends email to abello@echeloninstitute.ca
  contact: router({
    send: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required").max(100),
          email: z.string().email("Please enter a valid email address"),
          subject: z.string().min(1, "Subject is required").max(200),
          message: z.string().min(10, "Message must be at least 10 characters").max(2000),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        // 1. Save to database first (always, even if email fails)
        if (db) await db.insert(contactSubmissions).values({
          name: input.name,
          email: input.email,
          subject: input.subject,
          message: input.message,
        });
        // 2. Send emails (notification + auto-reply)
        try {
          await sendContactEmail(input);
        } catch (err) {
          console.error("[Contact] Email send failed (submission still saved):", err);
          // Don't throw — submission is already saved, user gets success
        }
        // 3. Notify owner via Manus notification system as backup
        notifyOwner({
          title: `Contact form: ${input.subject}`,
          content: `From: ${input.name} <${input.email}>\n\n${input.message}`,
        }).catch(() => {}); // non-blocking
        return { success: true };
      }),
  }),

  // Exam Date Tracker — optional per-product exam date for countdown + reminders
  examDate: router({
    get: publicProcedure
      .input(z.object({ email: z.string().email(), productKey: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const rows = await db
          .select()
          .from(examDates)
          .where(and(eq(examDates.email, input.email), eq(examDates.productKey, input.productKey)))
          .limit(1);
        if (!rows.length) return null;
        return { examDate: rows[0].examDate.toISOString(), productKey: rows[0].productKey };
      }),
    set: publicProcedure
      .input(z.object({ email: z.string().email(), productKey: z.string(), examDate: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const date = new Date(input.examDate);
        if (isNaN(date.getTime())) throw new Error("Invalid date");
        const existing = await db
          .select()
          .from(examDates)
          .where(and(eq(examDates.email, input.email), eq(examDates.productKey, input.productKey)))
          .limit(1);
        if (existing.length) {
          await db
            .update(examDates)
            .set({ examDate: date, remindersSent: "[]" })
            .where(and(eq(examDates.email, input.email), eq(examDates.productKey, input.productKey)));
        } else {
          await db.insert(examDates).values({
            email: input.email,
            productKey: input.productKey,
            examDate: date,
            remindersSent: "[]",
          });
        }
        return { success: true };
      }),
    remove: publicProcedure
      .input(z.object({ email: z.string().email(), productKey: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db
          .delete(examDates)
          .where(and(eq(examDates.email, input.email), eq(examDates.productKey, input.productKey)));
        return { success: true };
      }),
  }),

  // AI Tutor chat endpoint — proxies LLM calls server-side to keep API keys secure
  tutor: router({
    chat: publicProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({ messages: input.messages });
          const reply =
            response?.choices?.[0]?.message?.content ??
            "I'm having trouble connecting right now — please try again.";
          return { reply };
        } catch (err) {
          console.error("[AI Tutor] LLM error:", err);
          return { reply: "Connection issue — please try again in a moment." };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
