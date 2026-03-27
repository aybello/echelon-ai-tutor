import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { waitlist } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
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
