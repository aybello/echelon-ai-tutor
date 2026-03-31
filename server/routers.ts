import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { waitlist, questionErrorReports, trialEmails } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  admin: adminRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
        });

        // Notify the owner
        await notifyOwner({
          title: `New waitlist signup: ${input.courseCode}`,
          content: `${input.email} joined the waitlist for "${input.courseTitle}".`,
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
