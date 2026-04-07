/**
 * Exam Date Reminder Job
 * Runs daily at 8:00 AM UTC. Checks all exam_dates rows and sends
 * study reminder emails at 30, 14, 7, and 1 day(s) before the exam.
 * Tracks which reminders have already been sent in the remindersSent column.
 */
import { getDb } from "../db";
import { examDates } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";
import nodemailer from "nodemailer";

const REMINDER_INTERVALS = [30, 14, 7, 1]; // days before exam

function getDaysUntil(examDate: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

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

function getReminderSubject(days: number, productLabel: string): string {
  if (days === 1) return `⏰ Your ${productLabel} exam is TOMORROW — final review time!`;
  if (days === 7) return `📅 7 days until your ${productLabel} exam — stay on track`;
  if (days === 14) return `📚 2 weeks to your ${productLabel} exam — keep the momentum`;
  return `🎯 30 days until your ${productLabel} exam — great time to start`;
}

function getReminderHtml(
  email: string,
  productLabel: string,
  productKey: string,
  days: number,
  examDateStr: string
): string {
  const siteUrl = "https://echeloninstitute.ca";
  const accountUrl = `${siteUrl}/account`;
  const examDateFormatted = new Date(examDateStr).toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const urgencyColor = days <= 1 ? "#EF4444" : days <= 7 ? "#F59E0B" : days <= 14 ? "#3B82F6" : "#22C55E";
  const urgencyBg = days <= 1 ? "#FEF2F2" : days <= 7 ? "#FFFBEB" : days <= 14 ? "#EFF6FF" : "#F0FDF4";
  const urgencyBorder = days <= 1 ? "#FECACA" : days <= 7 ? "#FDE68A" : days <= 14 ? "#BFDBFE" : "#BBF7D0";

  const tips: string[] = days <= 1
    ? ["Review your formula sheet one more time", "Get a good night's sleep", "Eat a proper breakfast before the exam", "Arrive early and stay calm — you've prepared for this"]
    : days <= 7
    ? ["Take a full mock exam today to gauge readiness", "Review your weakest modules", "Focus on calculation questions — they're worth the most", "Use the AI Tutor for any concepts that aren't clicking"]
    : days <= 14
    ? ["Complete at least one practice session per day", "Target modules where your score is below 70%", "Review the formula sheet and work through examples", "Take a mock exam this weekend to benchmark yourself"]
    : ["Build a consistent daily study habit now", "Start with the modules you find most challenging", "Use flashcards to reinforce key terms and concepts", "Set a goal: complete one module per week"];

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1D4ED8 0%,#0E7490 100%);border-radius:12px 12px 0 0;padding:32px 32px 28px;text-align:center;">
            <div style="font-size:40px;margin-bottom:12px;">${days <= 1 ? "⏰" : days <= 7 ? "🔥" : "📚"}</div>
            <h1 style="color:#ffffff;margin:0 0 8px;font-size:24px;font-weight:800;line-height:1.2;">
              ${days === 1 ? "Exam Tomorrow!" : days === 0 ? "Exam Day!" : `${days} Days to Go`}
            </h1>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px;">${productLabel}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">

            <!-- Countdown badge -->
            <div style="background:${urgencyBg};border:1.5px solid ${urgencyBorder};border-radius:10px;padding:18px 22px;margin-bottom:24px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${urgencyColor};letter-spacing:0.04em;text-transform:uppercase;">
                ${days <= 1 ? "Final Countdown" : "Exam Countdown"}
              </p>
              <p style="margin:0;font-size:28px;font-weight:900;color:#0F172A;">${days === 0 ? "Today" : days === 1 ? "1 Day" : `${days} Days`}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#64748B;">${examDateFormatted}</p>
            </div>

            <!-- Study tips -->
            <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#0F172A;">
              ${days <= 1 ? "Last-minute tips:" : days <= 7 ? "This week, focus on:" : "Study tips for this stage:"}
            </p>
            <ul style="margin:0 0 24px;padding-left:20px;">
              ${tips.map(tip => `<li style="font-size:13px;color:#475569;margin-bottom:8px;line-height:1.5;">${tip}</li>`).join("")}
            </ul>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${accountUrl}" style="display:inline-block;background:linear-gradient(135deg,#1D4ED8,#0E7490);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;">
                ${days <= 1 ? "📝 Review Your Notes →" : "📝 Study Now →"}
              </a>
            </div>

            <!-- Footer -->
            <div style="border-top:1px solid #E2E8F0;padding-top:20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94A3B8;">
                You're receiving this because you set an exam date for ${productLabel} on Echelon Institute.
              </p>
              <p style="margin:0 0 6px;font-size:12px;color:#94A3B8;">
                To remove your exam date, visit your <a href="${accountUrl}" style="color:#1D4ED8;text-decoration:none;">Account page</a>.
              </p>
              <p style="margin:12px 0 0;font-size:12px;color:#94A3B8;">Echelon Institute · Canada's AI-powered exam prep for water &amp; wastewater operators</p>
            </div>

          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `;
}

// Map productKey to a human-readable label (mirrors EXAM_META in Account.tsx)
const PRODUCT_LABELS: Record<string, string> = {
  oit: "OIT Practice Pass",
  "oit-ww": "OIT Wastewater Practice Pass",
  "class1-water": "Class 1 Water Treatment Pass",
  "class1-ww": "Class 1 Wastewater Treatment Pass",
  wqa: "Water Quality Analyst Pass",
  "class2-water": "Class 2 Water Treatment Pass",
  "class3-water": "Class 3 Water Treatment Pass",
  "class4-water": "Class 4 Water Treatment Pass",
  "class2-ww": "Class 2 Wastewater Treatment Pass",
  "class3-ww": "Class 3 Wastewater Treatment Pass",
  "class4-ww": "Class 4 Wastewater Treatment Pass",
  "wpi-class1-water": "WPI Class I Water Treatment Pass",
  "wpi-class2-water": "WPI Class II Water Treatment Pass",
  "wpi-class3-water": "WPI Class III Water Treatment Pass",
  "wpi-class4-water": "WPI Class IV Water Treatment Pass",
  "wpi-class1-wastewater": "WPI Class I Wastewater Treatment Pass",
  "wpi-class2-wastewater": "WPI Class II Wastewater Treatment Pass",
  "wpi-class3-wastewater": "WPI Class III Wastewater Treatment Pass",
  "wpi-class4-wastewater": "WPI Class IV Wastewater Treatment Pass",
};

export async function runExamReminders(): Promise<{ sent: number; errors: string[] }> {
  const db = await getDb();
  if (!db) return { sent: 0, errors: ["Database unavailable"] };

  const allRows = await db.select().from(examDates);
  let sent = 0;
  const errors: string[] = [];

  let transporter: nodemailer.Transporter | null = null;
  try {
    transporter = createTransporter();
  } catch (err) {
    return { sent: 0, errors: ["SMTP not configured — skipping exam reminders"] };
  }

  for (const row of allRows) {
    const days = getDaysUntil(row.examDate);

    // Skip past exams (more than 1 day ago)
    if (days < 0) continue;

    const alreadySent: number[] = (() => {
      try { return JSON.parse(row.remindersSent) as number[]; } catch { return []; }
    })();

    for (const interval of REMINDER_INTERVALS) {
      if (days !== interval) continue;
      if (alreadySent.includes(interval)) continue;

      const productLabel = PRODUCT_LABELS[row.productKey] ?? row.productKey;

      try {
        await transporter.sendMail({
          from: `"Echelon Institute" <${ENV.smtpUser || "no-reply@echeloninstitute.ca"}>`,
          to: row.email,
          subject: getReminderSubject(interval, productLabel),
          html: getReminderHtml(row.email, productLabel, row.productKey, interval, row.examDate.toISOString()),
        });

        // Mark this interval as sent
        const updated = [...alreadySent, interval];
        const { eq, and } = await import("drizzle-orm");
        await db
          .update(examDates)
          .set({ remindersSent: JSON.stringify(updated) })
          .where(and(eq(examDates.email, row.email), eq(examDates.productKey, row.productKey)));

        sent++;
        console.log(`[ExamReminder] Sent ${interval}-day reminder to ${row.email} for ${row.productKey}`);
      } catch (err) {
        const msg = `Failed to send ${interval}-day reminder to ${row.email}: ${(err as Error).message}`;
        errors.push(msg);
        console.error(`[ExamReminder] ${msg}`);
      }
    }
  }

  return { sent, errors };
}

export function startExamReminderJob(): void {
  import("node-cron")
    .then(({ default: cron }) => {
      // Run daily at 8:00 AM UTC
      cron.schedule("0 8 * * *", async () => {
        console.log("[ExamReminder] Running daily exam reminder check...");
        try {
          const result = await runExamReminders();
          console.log(`[ExamReminder] Done — sent: ${result.sent}, errors: ${result.errors.length}`);
          if (result.sent > 0 || result.errors.length > 0) {
            await notifyOwner({
              title: `Exam reminders: ${result.sent} sent`,
              content: result.errors.length
                ? `Sent: ${result.sent}\nErrors:\n${result.errors.join("\n")}`
                : `Sent ${result.sent} exam reminder email(s) today.`,
            }).catch(() => {});
          }
        } catch (err) {
          console.error("[ExamReminder] Job error:", err);
        }
      });
      console.log("[ExamReminder] Cron job scheduled — daily at 8:00 AM UTC");
    })
    .catch((err) => {
      console.error("[ExamReminder] Failed to load node-cron:", err.message);
    });
}
