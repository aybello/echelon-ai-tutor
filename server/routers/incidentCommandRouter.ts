import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeGPT56 } from "../_core/openaiResponses";
import { getDb } from "../db";
import { commandDrillQueue, commandRunHistory, users } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

const decisionSchema = z.object({
  stepId: z.string().min(1).max(40),
  stepTitle: z.string().min(1).max(120),
  choiceLabel: z.string().min(1).max(240),
  consequence: z.string().min(1).max(500),
  points: z.number().int().min(0).max(20),
});

const submittedDecisionSchema = z.object({
  stepId: z.string().min(1).max(40),
  choiceId: z.string().min(1).max(40),
  stepTitle: z.string().min(1).max(120),
  choiceLabel: z.string().min(1).max(240),
  consequence: z.string().min(1).max(500),
  points: z.number().int().min(0).max(20),
});

export function fallbackDebrief(score: number, decisions: z.infer<typeof decisionSchema>[], scenarioTitle: string) {
  const strongest = [...decisions].sort((a, b) => b.points - a.points)[0];
  const weakest = [...decisions].sort((a, b) => a.points - b.points)[0];
  const level = score >= 85 ? "incident-command ready" : score >= 65 ? "developing operator" : "operator in remediation";

  return {
    summary: `You finished as a ${level} in the ${scenarioTitle} scenario. Your strongest decision was "${strongest?.choiceLabel ?? "the initial response"}." Your greatest improvement opportunity came during ${weakest?.stepTitle ?? "the response sequence"}.`,
    strengths: [
      "You maintained a process-wide view instead of reacting to a single instrument.",
      strongest?.consequence ?? "You selected a defensible control action.",
    ],
    improvements: [
      weakest?.consequence ?? "Verify critical readings before escalating treatment changes.",
      "State the verification sample, escalation path and documentation step together.",
    ],
    nextDrill: score >= 85 ? "Distribution pressure-loss and contamination response" : "Coagulation, filter breakthrough and CT verification",
    generatedBy: "rules-engine" as const,
  };
}

export function parseSections(text: string, score: number, decisions: z.infer<typeof decisionSchema>[], scenarioTitle: string) {
  const fallback = fallbackDebrief(score, decisions, scenarioTitle);
  const normalizedText = text.replace(/\*\*/g, "");
  const section = (name: string) => {
    const match = normalizedText.match(new RegExp(`${name}:\\s*([\\s\\S]*?)(?=\\n[A-Z][A-Z ]+:|$)`, "i"));
    return match?.[1]?.trim() ?? "";
  };
  const list = (name: string) => section(name)
    .split(/\n+/)
    .map(line => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  return {
    summary: section("SUMMARY") || fallback.summary,
    strengths: list("STRENGTHS").length ? list("STRENGTHS") : fallback.strengths,
    improvements: list("IMPROVEMENTS").length ? list("IMPROVEMENTS") : fallback.improvements,
    nextDrill: section("NEXT DRILL") || fallback.nextDrill,
    generatedBy: "gpt-5.6" as const,
  };
}

export const incidentCommandRouter = router({
  /** Save the recommended next drill for the logged-in user */
  queueDrill: protectedProcedure
    .input(z.object({ drillName: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { queued: false, drillName: input.drillName };
      await db.update(commandDrillQueue)
        .set({ completedAt: new Date() })
        .where(eq(commandDrillQueue.userId, ctx.user.id));
      await db.insert(commandDrillQueue).values({
        userId: ctx.user.id,
        drillName: input.drillName,
      });
      return { queued: true, drillName: input.drillName };
    }),

  /** Get the current queued drill for the logged-in user */
  getQueuedDrill: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select()
        .from(commandDrillQueue)
        .where(eq(commandDrillQueue.userId, ctx.user.id))
        .orderBy(desc(commandDrillQueue.queuedAt))
        .limit(1);
      const row = rows[0];
      if (!row || row.completedAt) return null;
      return { drillName: row.drillName, queuedAt: row.queuedAt };
    }),

  /** Mark the current queued drill as completed */
  clearQueuedDrill: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { cleared: false };
      await db.update(commandDrillQueue)
        .set({ completedAt: new Date() })
        .where(eq(commandDrillQueue.userId, ctx.user.id));
      return { cleared: true };
    }),

  /** Save a completed scenario run to the history table */
  saveRun: protectedProcedure
    .input(z.object({
      scenarioId: z.string().min(1).max(60),
      scenarioTitle: z.string().min(1).max(120),
      commandScore: z.number().int().min(0).max(100),
      optimalCalls: z.number().int().min(0),
      totalSteps: z.number().int().min(1),
      elapsedSeconds: z.number().int().min(0).default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { saved: false };
      await db.insert(commandRunHistory).values({
        userId: ctx.user.id,
        scenarioId: input.scenarioId,
        scenarioTitle: input.scenarioTitle,
        commandScore: input.commandScore,
        optimalCalls: input.optimalCalls,
        totalSteps: input.totalSteps,
        elapsedSeconds: input.elapsedSeconds,
      });
      return { saved: true };
    }),

  /** Get the logged-in user's personal run history (last 20 runs) */
  getMyHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select()
        .from(commandRunHistory)
        .where(eq(commandRunHistory.userId, ctx.user.id))
        .orderBy(desc(commandRunHistory.completedAt))
        .limit(20);
      return rows.map(row => ({
        id: row.id,
        scenarioId: row.scenarioId,
        scenarioTitle: row.scenarioTitle,
        commandScore: row.commandScore,
        optimalCalls: row.optimalCalls,
        totalSteps: row.totalSteps,
        elapsedSeconds: row.elapsedSeconds,
        completedAt: row.completedAt,
      }));
    }),

  /** Get the global leaderboard — top 20 operators by best single-run score */
  getLeaderboard: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      // Best score per user, with their name
      const rows = await db
        .select({
          userId: commandRunHistory.userId,
          bestScore: sql<number>`MAX(${commandRunHistory.commandScore})`,
          totalRuns: sql<number>`COUNT(*)`,
          userName: users.name,
        })
        .from(commandRunHistory)
        .leftJoin(users, eq(commandRunHistory.userId, users.id))
        .groupBy(commandRunHistory.userId, users.name)
        .orderBy(desc(sql`MAX(${commandRunHistory.commandScore})`))
        .limit(20);

      return rows.map((row, index) => ({
        rank: index + 1,
        userId: row.userId,
        displayName: row.userName ?? `Operator #${row.userId}`,
        bestScore: Number(row.bestScore),
        totalRuns: Number(row.totalRuns),
      }));
    }),

  debrief: publicProcedure
    .input(z.object({
      decisions: z.array(submittedDecisionSchema).min(1).max(10),
      scenarioId: z.string().min(1).max(60).default("cedar-ridge-storm"),
      scenarioTitle: z.string().min(1).max(120).default("Cedar Ridge Storm Response"),
    }))
    .mutation(async ({ input }) => {
      const decisions = input.decisions.map(d => decisionSchema.parse({
        stepId: d.stepId,
        stepTitle: d.stepTitle,
        choiceLabel: d.choiceLabel,
        consequence: d.consequence,
        points: d.points,
      }));
      const score = decisions.reduce((sum, decision) => sum + decision.points, 0);
      const maxScore = decisions.length * 20;
      const commandScore = Math.round((score / maxScore) * 100);
      const fallback = fallbackDebrief(commandScore, decisions, input.scenarioTitle);
      const timeline = decisions
        .map((decision, index) => `${index + 1}. ${decision.stepTitle}\nDecision: ${decision.choiceLabel}\nObserved consequence: ${decision.consequence}\nScore: ${decision.points}/20`)
        .join("\n\n");

      const prompt = `You are Echelon Command, an expert training evaluator for licensed drinking-water and wastewater operators. This is an EDUCATIONAL SIMULATION, not live operational advice. Evaluate the learner only from the supplied scenario record. Be exact, calm, concise and constructive. Do not invent regulations, readings or actions.\n\nSCENARIO: ${input.scenarioTitle}\nFINAL SCORE: ${commandScore}/100\n\nDECISION RECORD:\n${timeline}\n\nReturn exactly these sections with no markdown table:\nSUMMARY: 2 to 3 sentences assessing the operator's command judgment.\nSTRENGTHS:\n- two specific strengths tied to their decisions\nIMPROVEMENTS:\n- two specific improvements tied to their decisions\nNEXT DRILL: one concise recommended follow-up simulation.`;

      try {
        const text = await invokeGPT56(prompt);
        return parseSections(text, commandScore, decisions, input.scenarioTitle);
      } catch (error) {
        console.warn("[Echelon Command] GPT-5.6 debrief unavailable; using deterministic fallback.", error);
        return fallback;
      }
    }),
});
