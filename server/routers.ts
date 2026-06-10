import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { getResourcesForProfile, formatResourcesForPrompt } from "./resourceIndex";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { waitlist, questionErrorReports, trialEmails, examResults, contactSubmissions, users, examDates, userFeedback, aiChatSessions, studentProfiles } from "../drizzle/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { adminRouter } from "./routers/admin";
import { stripeRouter } from "./routers/stripeRouter";
import { flashcardRouter } from "./routers/flashcardRouter";
import { quizRouter } from "./routers/quizRouter";
import { dashboardRouter } from "./routers/dashboardRouter";
import { magicLinkRouter } from "./routers/magicLinkRouter";
import { dashboardAuthRouter } from "./routers/dashboardAuthRouter";
import { sendContactEmail } from "./email";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  admin: adminRouter,
  stripe: stripeRouter,
  flashcard: flashcardRouter,
  quiz: quizRouter,
  dashboard: dashboardRouter,
  magicLink: magicLinkRouter,
  dashboardAuth: dashboardAuthRouter,
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
        }).catch((err) => { console.error("[contact] notifyOwner failed:", err); }); // non-blocking
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

  // User feedback — collected after 15-question gate and session completion
  feedback: router({
    submit: publicProcedure
      .input(
        z.object({
          examType: z.string().min(1).max(64),
          rating: z.number().int().min(1).max(5),
          comment: z.string().max(1000).optional(),
          email: z.string().email().optional(), // for guest users
          feedbackType: z.enum(["quiz_gate", "session_complete"]),
          province: z.string().max(32).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const userId = ctx.user?.id ?? null;
        await db.insert(userFeedback).values({
          userId,
          email: input.email ?? ctx.user?.email ?? null,
          examType: input.examType,
          rating: input.rating,
          comment: input.comment ?? null,
          feedbackType: input.feedbackType,
          province: input.province ?? null,
        });
        // Notify owner for low ratings (1-2 stars) so issues are flagged quickly
        if (input.rating <= 2) {
          notifyOwner({
            title: `Low feedback rating: ${input.rating}/5 on ${input.examType}`,
            content: `Type: ${input.feedbackType}\nExam: ${input.examType}\nRating: ${input.rating}/5${input.comment ? `\nComment: ${input.comment}` : ""}${input.email ? `\nEmail: ${input.email}` : ""}`,
          }).catch((err) => { console.error("[feedback] notifyOwner failed:", err); });
        }
        return { success: true };
      }),
  }),

  // AI Tutor — context-aware chat with student memory
  tutor: router({
    /**
     * chat — main LLM endpoint. If the user is authenticated, fetches their
     * student profile + last 3 session summaries and injects them into the
     * system prompt so the AI "knows" the student.
     */
    chat: publicProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string().max(4000), // cap per-message content to prevent prompt stuffing
            })
          ).max(40), // cap conversation history to 40 messages
          examType: z.string().optional(), // current exam context
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          let enrichedMessages = [...input.messages];

          // If user is authenticated, inject student context into the system prompt
          if (ctx.user?.id && input.examType) {
            try {
              const db = await getDb();
              if (db) {
                // Fetch student profile
                const profiles = await db
                  .select()
                  .from(studentProfiles)
                  .where(eq(studentProfiles.userId, ctx.user.id))
                  .limit(1);
                const profile = profiles[0] ?? null;

                // Fetch last 3 AI chat session summaries
                const recentSessions = await db
                  .select({
                    summary: aiChatSessions.summary,
                    topicsCovered: aiChatSessions.topicsCovered,
                    sessionEnd: aiChatSessions.sessionEnd,
                  })
                  .from(aiChatSessions)
                  .where(eq(aiChatSessions.userId, ctx.user.id))
                  .orderBy(desc(aiChatSessions.sessionEnd))
                  .limit(3);

                // Fetch exam date if set
                const examDateRows = ctx.user.email
                  ? await db
                      .select()
                      .from(examDates)
                      .where(
                        and(
                          eq(examDates.email, ctx.user.email),
                          eq(examDates.productKey, input.examType)
                        )
                      )
                      .limit(1)
                  : [];
                const examDate = examDateRows[0] ?? null;

                // Build the memory block
                if (profile && profile.totalAttempts >= 15) {
                  let topicAccuracy: Record<string, { correct: number; total: number }> = {};
                  let weakTopics: string[] = [];
                  let strongTopics: string[] = [];
                  try { topicAccuracy = JSON.parse(profile.topicAccuracy || "{}"); } catch {}
                  try { weakTopics = JSON.parse(profile.weakTopics || "[]"); } catch {}
                  try { strongTopics = JSON.parse(profile.strongTopics || "[]"); } catch {}

                  const topicSummary = Object.entries(topicAccuracy)
                    .map(([topic, data]) => {
                      const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                      return `  - ${topic}: ${pct}% (${data.correct}/${data.total})`;
                    })
                    .join("\n");

                  let examCountdown = "";
                  if (examDate) {
                    const daysUntil = Math.ceil(
                      (new Date(examDate.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    if (daysUntil > 0) {
                      examCountdown = `\n- Exam date: ${new Date(examDate.examDate).toLocaleDateString("en-CA")} (${daysUntil} days away)`;
                    }
                  }

                  let sessionNotes = "";
                  if (recentSessions.length > 0) {
                    sessionNotes =
                      "\n\nRECENT SESSION NOTES:\n" +
                      recentSessions
                        .map((s, i) => {
                          const label = i === 0 ? "Last session" : `${i + 1} sessions ago`;
                          return `- ${label}: ${s.summary}`;
                        })
                        .join("\n");
                  }

                  let memoryBlock = `\n\nSTUDENT PROFILE (${ctx.user.name || "Student"}):
- Questions attempted: ${profile.totalAttempts} | Sessions: ${profile.totalSessions} | Streak: ${profile.currentStreak} days${examCountdown}
- Strong topics: ${strongTopics.length > 0 ? strongTopics.join(", ") : "Still building data"}
- Weak topics: ${weakTopics.length > 0 ? weakTopics.join(", ") : "Still building data"}
- Topic breakdown:\n${topicSummary}${sessionNotes}

BEHAVIOUR RULES:
- Proactively guide toward weak topics without being obvious about it
- If the student has not set an exam date, ask once per session
- Reference their past session context when relevant
- Keep responses concise — many students are on mobile
- When recommending external resources, use the RECOMMENDED RESOURCES section below`;

                  // Inject recommended resources based on weak topics
                  const resources = getResourcesForProfile({
                    examType: input.examType ?? "",
                    weakTopics,
                    strongTopics,
                  });
                  const resourceBlock = formatResourcesForPrompt(resources);
                  if (resourceBlock) {
                    memoryBlock += resourceBlock;
                  }

                  // Inject memory into the first system message
                  const sysIdx = enrichedMessages.findIndex((m) => m.role === "system");
                  if (sysIdx !== -1) {
                    enrichedMessages[sysIdx] = {
                      ...enrichedMessages[sysIdx],
                      content: enrichedMessages[sysIdx].content + memoryBlock,
                    };
                  }
                }
              }
            } catch (profileErr) {
              // Non-fatal — fall back to standard prompt without memory
              console.error("[AI Tutor] Profile fetch error (non-fatal):", profileErr);
            }
          }

          const response = await invokeLLM({ messages: enrichedMessages, maxTokens: 1536 }); // cap tutor replies to 1536 tokens (vs 32768 default)
          const reply =
            response?.choices?.[0]?.message?.content ??
            "I'm having trouble connecting right now — please try again.";
          return { reply };
        } catch (err) {
          console.error("[AI Tutor] LLM error:", err);
          return { reply: "Connection issue — please try again in a moment." };
        }
      }),

    /**
     * saveSession — called when the student closes the AI tutor panel.
     * Generates a summary via LLM and saves the session to ai_chat_sessions.
     */
    saveSession: protectedProcedure
      .input(
        z.object({
          examType: z.string(),
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          ),
          sessionStartMs: z.number(), // unix ms when panel was opened
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Only save if there were actual user messages (not just the initial greeting)
        const userMessages = input.messages.filter((m) => m.role === "user");
        if (userMessages.length === 0) return { saved: false };

        try {
          // Generate a 2-3 sentence summary via LLM
          const conversationText = input.messages
            .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
            .join("\n");

          const summaryResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "Summarise this tutoring session in 2-3 sentences. Note the topics covered, any concepts the student struggled with, and any key insights. Be specific and factual — this summary will be injected into future sessions so the AI remembers this student.",
              },
              {
                role: "user",
                content: conversationText,
              },
            ],
          });

          const summary = String(
            summaryResponse?.choices?.[0]?.message?.content ??
            "Session summary unavailable."
          );

          // Extract topics from the conversation (simple keyword extraction)
          const topicsResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  'Extract the water/wastewater operator exam topics discussed in this tutoring session. Return ONLY a JSON array of topic strings, e.g. ["Disinfection", "Hydraulics"]. If no specific topics, return ["General"].',
              },
              {
                role: "user",
                content: conversationText,
              },
            ],
          });

          let topicsCovered = "[\"General\"]";
          try {
            const raw = String(topicsResponse?.choices?.[0]?.message?.content ?? "");
            // Extract JSON array from the response (may have markdown fences)
            const match = raw.match(/\[[\s\S]*\]/);
            if (match) {
              JSON.parse(match[0]); // validate it parses
              topicsCovered = match[0];
            }
          } catch {}

          const db = await getDb();
          if (!db) return { saved: false };

          await db.insert(aiChatSessions).values({
            userId: ctx.user.id,
            examType: input.examType,
            messageCount: input.messages.length,
            topicsCovered,
            summary,
            sessionStart: new Date(input.sessionStartMs),
            sessionEnd: new Date(),
          });

          // Increment totalSessions on the student profile
          await db
            .update(studentProfiles)
            .set({ totalSessions: sql`${studentProfiles.totalSessions} + 1` })
            .where(eq(studentProfiles.userId, ctx.user.id))
            .catch((err) => { console.error("[session] profile update failed:", err); }); // non-fatal

          return { saved: true, summary };
        } catch (err) {
          console.error("[AI Tutor] saveSession error:", err);
          return { saved: false };
        }
      }),

    /**
     * getRecentSessions — returns last N AI chat session summaries for the student
     */
    getRecentSessions: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(10).default(3) }).optional())
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];

        const sessions = await db
          .select({
            id: aiChatSessions.id,
            examType: aiChatSessions.examType,
            messageCount: aiChatSessions.messageCount,
            topicsCovered: aiChatSessions.topicsCovered,
            summary: aiChatSessions.summary,
            sessionStart: aiChatSessions.sessionStart,
            sessionEnd: aiChatSessions.sessionEnd,
          })
          .from(aiChatSessions)
          .where(eq(aiChatSessions.userId, ctx.user.id))
          .orderBy(desc(aiChatSessions.sessionEnd))
          .limit(input?.limit ?? 3);

        return sessions.map((s) => ({
          ...s,
          topicsCovered: (() => {
            try { return JSON.parse(s.topicsCovered); } catch { return []; }
          })(),
        }));
      }),

    /**
     * getStudentContext — returns the full student profile for frontend display
     * (e.g., showing "AI knows you" indicator, weak topics, etc.)
     */
    getStudentContext: protectedProcedure
      .input(z.object({ examType: z.string() }).optional())
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return null;

        const profiles = await db
          .select()
          .from(studentProfiles)
          .where(eq(studentProfiles.userId, ctx.user.id))
          .limit(1);

        const profile = profiles[0];
        if (!profile || profile.totalAttempts < 15) return null;

        let weakTopics: string[] = [];
        let strongTopics: string[] = [];
        try { weakTopics = JSON.parse(profile.weakTopics || "[]"); } catch {}
        try { strongTopics = JSON.parse(profile.strongTopics || "[]"); } catch {}

        const sessionCount = await db
          .select({ cnt: sql<number>`COUNT(*)` })
          .from(aiChatSessions)
          .where(eq(aiChatSessions.userId, ctx.user.id));

        return {
          totalAttempts: profile.totalAttempts,
          totalSessions: profile.totalSessions,
          currentStreak: profile.currentStreak,
          weakTopics,
          strongTopics,
          aiSessionCount: Number(sessionCount[0]?.cnt ?? 0),
          hasMemory: true,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
