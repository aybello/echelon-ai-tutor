/**
 * Agentic Trigger Engine — Phase 4
 * Runs nightly at 9:00 PM UTC (5 PM ET / 2 PM PT).
 * Evaluates every active student against 5 trigger conditions,
 * generates a personalized email via LLM, and sends it via SMTP.
 * Cooldown tracking prevents email fatigue.
 *
 * Supports two student types:
 *   1. OAuth users — have a userId in the users table
 *   2. Email-only customers — Stripe purchasers who never did Manus OAuth;
 *      identified by email from purchases/subscriptions tables
 */
import { getDb } from "../db";
import {
  users,
  purchases,
  subscriptions,
  studentProfiles,
  questionAttempts,
  examDates,
  triggerLogs,
} from "../../drizzle/schema";
import { withRetry } from "./retry";
import { eq, and, desc, gte, sql, or, isNull } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";
import { resolveEntitlementsByEmail } from "../_core/access";
import { resolvePrimaryStudyFocus } from "../_core/studyFocus";
import nodemailer from "nodemailer";

// ── Trigger Definitions ──────────────────────────────────────────────────────

export type TriggerType =
  | "struggling"
  | "plateau"
  | "inactive"
  | "exam_approaching"
  | "milestone";

interface TriggerResult {
  type: TriggerType;
  subject: string;
  context: string; // passed to LLM for personalization
  cooldownDays: number;
}

interface StudentData {
  userId: number | null;
  studentEmail: string | null; // set when userId is null
  name: string | null;
  email: string; // always set — the address we send to
  profile: {
    examType: string;
    weakTopics: string[];
    strongTopics: string[];
    totalAttempts: number;
    totalSessions: number;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
    topicAccuracy: Record<string, { correct: number; total: number }>;
  } | null;
  examDate: Date | null;
  examProductKey: string | null;
  recentAttempts: number; // last 7 days
  recentCorrectRate: number | null; // last 7 days
  previousCorrectRate: number | null; // 8-14 days ago
}

// ── Product Labels (shared with examReminders) ──────────────────────────────

const PRODUCT_LABELS: Record<string, string> = {
  oit: "OIT",
  "oit-ww": "OIT Wastewater",
  "class1-water": "Class 1 Water Treatment",
  "class1-ww": "Class 1 Wastewater Treatment",
  wqa: "Water Quality Analyst",
  "class2-water": "Class 2 Water Treatment",
  "class3-water": "Class 3 Water Treatment",
  "class4-water": "Class 4 Water Treatment",
  "class2-ww": "Class 2 Wastewater Treatment",
  "class3-ww": "Class 3 Wastewater Treatment",
  "class4-ww": "Class 4 Wastewater Treatment",
  "wpi-class1-water": "WPI Class I Water Treatment",
  "wpi-class2-water": "WPI Class II Water Treatment",
  "wpi-class3-water": "WPI Class III Water Treatment",
  "wpi-class4-water": "WPI Class IV Water Treatment",
  "wpi-class1-wastewater": "WPI Class I Wastewater Treatment",
  "wpi-class2-wastewater": "WPI Class II Wastewater Treatment",
  "wpi-class3-wastewater": "WPI Class III Wastewater Treatment",
  "wpi-class4-wastewater": "WPI Class IV Wastewater Treatment",
  "wpi-class1-water-dist": "WPI Class I Water Distribution",
  "wpi-class2-water-dist": "WPI Class II Water Distribution",
  "wpi-class3-water-dist": "WPI Class III Water Distribution",
  "wpi-class4-water-dist": "WPI Class IV Water Distribution",
  "wpi-class1-wastewater-coll": "WPI Class I Wastewater Collection",
  "wpi-class2-wastewater-coll": "WPI Class II Wastewater Collection",
  "wpi-class3-wastewater-coll": "WPI Class III Wastewater Collection",
  "wpi-class4-wastewater-coll": "WPI Class IV Wastewater Collection",
};

// ── Trigger Evaluation ──────────────────────────────────────────────────────

function evaluateTriggers(student: StudentData): TriggerResult | null {
  const { profile, examDate, recentAttempts, recentCorrectRate, previousCorrectRate } = student;
  const examLabel = PRODUCT_LABELS[student.examProductKey ?? profile?.examType ?? ""] ?? "your exam";

  // 1. STRUGGLING — recent accuracy < 50% with at least 20 attempts in last 7 days
  if (
    profile &&
    recentCorrectRate !== null &&
    recentCorrectRate < 0.5 &&
    recentAttempts >= 20
  ) {
    const weakList = profile.weakTopics.slice(0, 3).join(", ") || "several topics";
    return {
      type: "struggling",
      subject: `We noticed you're working hard on ${examLabel} — here's how to break through`,
      context: `Student ${student.name || "there"} has answered ${recentAttempts} questions in the last 7 days for ${examLabel} but only got ${Math.round(recentCorrectRate * 100)}% correct. Their weakest topics are: ${weakList}. They have ${profile.totalAttempts} total attempts. Encourage them — they're putting in the work. Suggest focusing on their weak topics one at a time and using the AI Tutor for step-by-step explanations.`,
      cooldownDays: 7,
    };
  }

  // 2. PLATEAU — accuracy hasn't improved (within 3%) between last 2 weeks, at least 30 attempts each week
  if (
    profile &&
    recentCorrectRate !== null &&
    previousCorrectRate !== null &&
    recentAttempts >= 30 &&
    Math.abs(recentCorrectRate - previousCorrectRate) < 0.03
  ) {
    return {
      type: "plateau",
      subject: `Time to shake up your ${examLabel} study strategy`,
      context: `Student ${student.name || "there"} has been studying ${examLabel} consistently but their accuracy has plateaued at ~${Math.round(recentCorrectRate * 100)}% for 2 weeks (${recentAttempts} attempts this week, previous week was ${Math.round(previousCorrectRate * 100)}%). Their weak topics are: ${profile.weakTopics.slice(0, 3).join(", ") || "not yet identified"}. Suggest trying different study modes (Quick 10, Retry Mistakes), switching to flashcards, or focusing on a single weak module intensively.`,
      cooldownDays: 14,
    };
  }

  // 3. INACTIVE — no activity in 5+ days but has at least 20 total attempts (they were active before)
  if (profile && profile.lastActiveDate && profile.totalAttempts >= 20) {
    const lastActive = new Date(profile.lastActiveDate);
    const daysSince = Math.floor(
      (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince >= 5) {
      const streakMsg = profile.longestStreak > 3
        ? `They had a ${profile.longestStreak}-day streak before.`
        : "";
      const examMsg = examDate
        ? `Their exam is on ${examDate.toLocaleDateString("en-CA")}.`
        : "";
      return {
        type: "inactive",
        subject: `We miss you! Your ${examLabel} prep is waiting`,
        context: `Student ${student.name || "there"} hasn't studied in ${daysSince} days. They have ${profile.totalAttempts} total attempts and were studying ${examLabel}. ${streakMsg} ${examMsg} Gently encourage them to come back — even 10 questions a day makes a difference. Don't be pushy.`,
        cooldownDays: 10,
      };
    }
  }

  // 4. EXAM APPROACHING — exam in 3 days and they haven't studied in 2+ days
  if (examDate && profile) {
    const daysUntilExam = Math.ceil(
      (examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const daysSinceActive = profile.lastActiveDate
      ? Math.floor((Date.now() - new Date(profile.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysUntilExam <= 3 && daysUntilExam >= 0 && daysSinceActive >= 2) {
      return {
        type: "exam_approaching",
        subject: `${daysUntilExam === 0 ? "Exam day" : daysUntilExam === 1 ? "1 day" : `${daysUntilExam} days`} until your ${examLabel} exam`,
        context: `Student ${student.name || "there"} has their ${examLabel} exam in ${daysUntilExam} day(s) but hasn't studied in ${daysSinceActive} days. They have ${profile.totalAttempts} total attempts with ${Math.round((profile.strongTopics.length / Math.max(1, profile.strongTopics.length + profile.weakTopics.length)) * 100)}% of topics mastered. Urgently but kindly encourage a final review session. Suggest taking a mock exam and reviewing weak topics: ${profile.weakTopics.slice(0, 3).join(", ") || "general review"}.`,
        cooldownDays: 2,
      };
    }
  }

  // 5. MILESTONE — hit 100, 250, 500, or 1000 total attempts
  if (profile) {
    const milestones = [100, 250, 500, 1000];
    for (const m of milestones) {
      // Check if they just crossed this milestone (within last 20 attempts)
      if (profile.totalAttempts >= m && profile.totalAttempts < m + 20) {
        const overallAccuracy = (() => {
          const acc = profile.topicAccuracy;
          let correct = 0, total = 0;
          for (const t of Object.values(acc)) {
            correct += t.correct;
            total += t.total;
          }
          return total > 0 ? Math.round((correct / total) * 100) : 0;
        })();
        return {
          type: "milestone",
          subject: `${m} questions answered — you're crushing ${examLabel}!`,
          context: `Student ${student.name || "there"} just hit ${m} questions answered for ${examLabel}! Their overall accuracy is ${overallAccuracy}%. Strong topics: ${profile.strongTopics.slice(0, 3).join(", ") || "building"}. Current streak: ${profile.currentStreak} days. Celebrate their achievement enthusiastically. Encourage them to keep going and mention the next milestone.`,
          cooldownDays: 30,
        };
      }
    }
  }

  return null;
}

// ── LLM Email Generation ────────────────────────────────────────────────────

async function generateEmailBody(
  trigger: TriggerResult,
  studentName: string
): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are the Echelon Institute study coach. Write a short, warm, personalized email body (3-4 paragraphs, ~150 words max) for a water/wastewater operator exam student. 

RULES:
- Address the student by first name
- Be encouraging, never condescending
- Include 1-2 specific, actionable study tips based on the context
- End with a clear call-to-action linking to https://echeloninstitute.ca
- Do NOT include a subject line — only the body
- Do NOT include "Dear" or "Hi" salutation — start directly with the student's name
- Write in plain text (no HTML, no markdown)
- Sign off as "— The Echelon Institute Team"`,
      },
      {
        role: "user",
        content: `Trigger type: ${trigger.type}\nStudent name: ${studentName}\nContext: ${trigger.context}`,
      },
    ],
  });

  return (
    (response.choices?.[0]?.message?.content as string | undefined)?.trim() ??
    `${studentName}, keep up the great work with your exam prep! Visit https://echeloninstitute.ca to continue studying.\n\n— The Echelon Institute Team`
  );
}

function wrapEmailHtml(body: string, subject: string): string {
  const paragraphs = body
    .split("\n\n")
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7;">${p.replace(/\n/g, "<br>")}</p>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1D4ED8 0%,#0E7490 100%);border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;line-height:1.3;">${subject}</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:32px;border:1px solid #E2E8F0;border-top:none;">
            ${paragraphs}
            <div style="text-align:center;margin:24px 0 8px;">
              <a href="https://echeloninstitute.ca" style="display:inline-block;background:linear-gradient(135deg,#1D4ED8,#0E7490);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;">
                Continue Studying
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#F8FAFC;padding:20px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#94A3B8;">
              You're receiving this because you're studying on Echelon Institute.
            </p>
            <p style="margin:0;font-size:12px;color:#94A3B8;">
              Echelon Institute &middot; Canada's AI-powered exam prep for water &amp; wastewater operators
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── SMTP Helper ─────────────────────────────────────────────────────────────

function createTransporter(): nodemailer.Transporter {
  if (ENV.smtpHost && ENV.smtpUser && ENV.smtpPass) {
    return nodemailer.createTransport({
      host: ENV.smtpHost,
      port: Number(ENV.smtpPort ?? 587),
      secure: Number(ENV.smtpPort ?? 587) === 465,
      auth: { user: ENV.smtpUser, pass: ENV.smtpPass },
    });
  }
  throw new Error("SMTP not configured");
}

// ── Build the combined student list ─────────────────────────────────────────

/**
 * Returns a deduplicated list of { userId, email, name } for every student
 * who should be evaluated. Includes:
 *   - OAuth users from the users table
 *   - Email-only customers from purchases and subscriptions tables
 *     (only those who do NOT have a matching userId in users, to avoid duplicates)
 */
async function buildStudentList(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>
): Promise<Array<{ userId: number | null; email: string; name: string | null }>> {
  // 1. OAuth users
  const oauthUsers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(sql`${users.email} IS NOT NULL AND ${users.email} != ''`);

  const oauthEmails = new Set(oauthUsers.map((u) => u.email!.toLowerCase()));

  const result: Array<{ userId: number | null; email: string; name: string | null }> = oauthUsers
    .filter((u) => u.email)
    .map((u) => ({ userId: u.id, email: u.email!, name: u.name }));

  // 2. Email-only purchase customers (active purchases only)
  const purchaseRows = await db
    .select({ email: purchases.email, customerName: purchases.customerName })
    .from(purchases)
    .where(
      and(
        sql`${purchases.email} IS NOT NULL AND ${purchases.email} != ''`,
        eq(purchases.status, "active"),
        isNull(purchases.userId) // only truly email-only customers
      )
    );

  const seenEmails = new Set<string>(oauthEmails);
  for (const row of purchaseRows) {
    const emailLower = row.email.toLowerCase();
    if (!seenEmails.has(emailLower)) {
      seenEmails.add(emailLower);
      result.push({ userId: null, email: row.email, name: row.customerName ?? null });
    }
  }

  // 3. Email-only subscription customers (active subscriptions only)
  const subRows = await db
    .select({ email: subscriptions.email })
    .from(subscriptions)
    .where(
      and(
        sql`${subscriptions.email} IS NOT NULL AND ${subscriptions.email} != ''`,
        eq(subscriptions.status, "active"),
        isNull(subscriptions.userId)
      )
    );

  for (const row of subRows) {
    const emailLower = row.email.toLowerCase();
    if (!seenEmails.has(emailLower)) {
      seenEmails.add(emailLower);
      result.push({ userId: null, email: row.email, name: null });
    }
  }

  return result;
}

// ── Main Runner ─────────────────────────────────────────────────────────────

export async function runTriggerEngine(): Promise<{
  evaluated: number;
  triggered: number;
  sent: number;
  skippedCooldown: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) return { evaluated: 0, triggered: 0, sent: 0, skippedCooldown: 0, errors: ["Database unavailable"] };

  let transporter: nodemailer.Transporter;
  try {
    transporter = createTransporter();
  } catch {
    return { evaluated: 0, triggered: 0, sent: 0, skippedCooldown: 0, errors: ["SMTP not configured"] };
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const allStudents = await buildStudentList(db);

  let evaluated = 0;
  let triggered = 0;
  let sent = 0;
  let skippedCooldown = 0;
  const errors: string[] = [];

  for (const student of allStudents) {
    const { userId, email, name } = student;
    const studentEmail = userId ? null : email.toLowerCase();

    evaluated++;

    try {
      // Fetch student profile — look up by userId for OAuth users, by email for email-only
      const [profileRow] = await db
        .select()
        .from(studentProfiles)
        .where(
          userId
            ? eq(studentProfiles.userId, userId)
            : eq(studentProfiles.studentEmail, studentEmail!)
        )
        .limit(1);

      if (!profileRow) continue; // No profile = never studied

      // Parse profile JSON fields
      const topicAccuracy = (() => {
        try { return JSON.parse(profileRow.topicAccuracy) as Record<string, { correct: number; total: number }>; }
        catch { return {} as Record<string, { correct: number; total: number }>; }
      })();
      const weakTopics = (() => {
        try { return JSON.parse(profileRow.weakTopics) as string[]; }
        catch { return [] as string[]; }
      })();
      const strongTopics = (() => {
        try { return JSON.parse(profileRow.strongTopics) as string[]; }
        catch { return [] as string[]; }
      })();

      // Fetch recent attempts (last 7 days) — match by userId or studentEmail
      const recentRows = await db
        .select({ correct: questionAttempts.correct })
        .from(questionAttempts)
        .where(
          and(
            userId
              ? eq(questionAttempts.userId, userId)
              : eq(questionAttempts.studentEmail, studentEmail!),
            gte(questionAttempts.createdAt, sevenDaysAgo)
          )
        );

      const recentAttempts = recentRows.length;
      const recentCorrectRate =
        recentAttempts > 0
          ? recentRows.filter((r) => r.correct === "yes").length / recentAttempts
          : null;

      // Fetch previous week attempts (8-14 days ago)
      const prevRows = await db
        .select({ correct: questionAttempts.correct })
        .from(questionAttempts)
        .where(
          and(
            userId
              ? eq(questionAttempts.userId, userId)
              : eq(questionAttempts.studentEmail, studentEmail!),
            gte(questionAttempts.createdAt, fourteenDaysAgo),
            sql`${questionAttempts.createdAt} < ${sevenDaysAgo}`
          )
        );

      const previousCorrectRate =
        prevRows.length > 0
          ? prevRows.filter((r) => r.correct === "yes").length / prevRows.length
          : null;

      // Fetch exam date
      const [examDateRow] = await db
        .select()
        .from(examDates)
        .where(eq(examDates.email, email))
        .orderBy(desc(examDates.examDate))
        .limit(1);

      // Resolve current primary study focus (avoids stale profileRow.examType)
      let currentExamType = profileRow.examType; // fallback
      try {
        const entitlements = await resolveEntitlementsByEmail(email);
        if (entitlements.unlockedExamTypes.length > 0) {
          const focus = await resolvePrimaryStudyFocus({
            email,
            unlockedExamTypes: entitlements.unlockedExamTypes,
          });
          if (focus.examType) currentExamType = focus.examType;
        }
      } catch {
        // fail open — use profileRow.examType as fallback
      }

      // Build student data
      const studentData: StudentData = {
        userId: userId ?? null,
        studentEmail,
        name,
        email,
        profile: {
          examType: currentExamType,
          weakTopics,
          strongTopics,
          totalAttempts: profileRow.totalAttempts,
          totalSessions: profileRow.totalSessions,
          currentStreak: profileRow.currentStreak,
          longestStreak: profileRow.longestStreak,
          lastActiveDate: profileRow.lastActiveDate,
          topicAccuracy,
        },
        examDate: examDateRow?.examDate ?? null,
        examProductKey: examDateRow?.productKey ?? null,
        recentAttempts,
        recentCorrectRate,
        previousCorrectRate,
      };

      // Evaluate triggers
      const trigger = evaluateTriggers(studentData);
      if (!trigger) continue;
      triggered++;

      // Check per-type cooldown — match by userId or studentEmail
      const [lastTrigger] = await db
        .select()
        .from(triggerLogs)
        .where(
          and(
            userId
              ? eq(triggerLogs.userId, userId)
              : eq(triggerLogs.studentEmail, studentEmail!),
            eq(triggerLogs.triggerType, trigger.type)
          )
        )
        .orderBy(desc(triggerLogs.sentAt))
        .limit(1);

      if (lastTrigger && lastTrigger.cooldownUntil > now) {
        skippedCooldown++;
        continue;
      }

      // Global cooldown — max 1 email per student per 3 days (any trigger type)
      const [lastAnyTrigger] = await db
        .select()
        .from(triggerLogs)
        .where(
          userId
            ? eq(triggerLogs.userId, userId)
            : eq(triggerLogs.studentEmail, studentEmail!)
        )
        .orderBy(desc(triggerLogs.sentAt))
        .limit(1);

      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      if (lastAnyTrigger && lastAnyTrigger.sentAt > threeDaysAgo) {
        skippedCooldown++;
        continue;
      }

      // Generate personalized email via LLM
      const firstName = (name ?? "").split(" ")[0] || "there";
      const emailBody = await generateEmailBody(trigger, firstName);
      const emailHtml = wrapEmailHtml(emailBody, trigger.subject);

      // Issue R: reserve the cooldown BEFORE sending.
      // This prevents duplicate sends if sendMail throws — the next engine run
      // will see the 'pending' or 'failed' row and respect the cooldown.
      const cooldownUntil = new Date(
        now.getTime() + trigger.cooldownDays * 24 * 60 * 60 * 1000
      );
      const [insertResult] = await db.insert(triggerLogs).values({
        userId: userId ?? null,
        studentEmail: studentEmail ?? null,
        triggerType: trigger.type,
        emailSubject: trigger.subject,
        emailBodyPreview: emailBody.slice(0, 200),
        cooldownUntil,
        status: "pending",
      });
      const logId = (insertResult as { insertId?: number })?.insertId ?? null;

      // Send email
      let sendError: Error | null = null;
      try {
        await transporter.sendMail({
          from: `"Echelon Institute" <${ENV.smtpUser || "no-reply@echeloninstitute.ca"}>`,
          to: email,
          subject: trigger.subject,
          text: emailBody,
          html: emailHtml,
        });
      } catch (err) {
        sendError = err as Error;
      }

      // Update status to 'sent' or 'failed'
      if (logId) {
        await db
          .update(triggerLogs)
          .set({ status: sendError ? "failed" : "sent" })
          .where(eq(triggerLogs.id, logId));
      }

      if (sendError) {
        // Cooldown is already claimed — log the failure but don't rethrow
        // (the outer catch would also claim the error, but we want the cooldown to persist)
        const identifier = userId ? `userId=${userId}` : `email=${email}`;
        const msg = `${identifier}: sendMail failed — ${sendError.message}`;
        errors.push(msg);
        console.error(`[TriggerEngine] SMTP error for ${msg}`);
        continue;
      }

      sent++;
      console.log(
        `[TriggerEngine] Sent "${trigger.type}" email to ${email} (cooldown until ${cooldownUntil.toISOString().split("T")[0]})`
      );
    } catch (err) {
      const identifier = userId ? `userId=${userId}` : `email=${email}`;
      const msg = `${identifier}: ${(err as Error).message}`;
      errors.push(msg);
      console.error(`[TriggerEngine] Error for ${msg}`);
    }
  }

  return { evaluated, triggered, sent, skippedCooldown, errors };
}

// ── Cron Scheduler ──────────────────────────────────────────────────────────

export function startTriggerEngineJob(): void {
  import("node-cron")
    .then(({ default: cron }) => {
      // Run nightly at 9:00 PM UTC (5 PM ET / 2 PM PT)
      cron.schedule("0 21 * * *", async () => {
        console.log("[TriggerEngine] Running nightly trigger evaluation...");
        try {
          const result = await withRetry(() => runTriggerEngine(), "triggerEngine");
          console.log(
            `[TriggerEngine] Done — evaluated: ${result.evaluated}, triggered: ${result.triggered}, sent: ${result.sent}, skipped (cooldown): ${result.skippedCooldown}, errors: ${result.errors.length}`
          );
          if (result.sent > 0 || result.errors.length > 0) {
            await notifyOwner({
              title: `Trigger Engine: ${result.sent} emails sent`,
              content: [
                `Evaluated: ${result.evaluated} students`,
                `Triggered: ${result.triggered}`,
                `Sent: ${result.sent}`,
                `Skipped (cooldown): ${result.skippedCooldown}`,
                result.errors.length
                  ? `Errors:\n${result.errors.slice(0, 5).join("\n")}`
                  : "No errors",
              ].join("\n"),
            }).catch((err) => { console.error("[triggerEngine] notifyOwner failed:", err); });
          }
        } catch (err) {
          console.error("[TriggerEngine] Job error:", err);
        }
      });
      console.log("[TriggerEngine] Cron job scheduled — nightly at 9:00 PM UTC");
    })
    .catch((err) => {
      console.error("[TriggerEngine] Failed to load node-cron:", err.message);
    });
}

// ── Exported for testing ────────────────────────────────────────────────────

export { evaluateTriggers, generateEmailBody, wrapEmailHtml };
export type { StudentData, TriggerResult };
