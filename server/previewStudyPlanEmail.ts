import nodemailer, { type Transporter } from "nodemailer";
import { ENV } from "./_core/env";

/**
 * Email sent when a learner finishes the free preview and asks for their
 * study plan.
 *
 * Why this exists: before this, a learner who used the entire free preview
 * either bought immediately or vanished. Over a 30 day window 78 learners
 * exhausted the preview and only 2 were reachable afterwards. The offer was
 * present and working, but it was a single-moment, one-answer-only decision.
 *
 * This gives the learner something genuinely useful for their own study, and
 * gives the business permission to follow up. The plan is built from their
 * real preview answers, so it is specific to them rather than a generic
 * marketing email.
 */
export interface PreviewStudyPlanEmailPayload {
  email: string;
  courseLabel: string;
  score: number;
  correct: number;
  total: number;
  /** Modules the learner missed at least one question in, strongest first. */
  weakTopics: string[];
  /** Absolute URL back into the course the learner was practising. */
  courseUrl: string;
  /** Absolute URL to the matching Exam Pass. */
  offerUrl: string;
  priceLabel: string;
  /**
   * Where in the preview the learner asked for the plan. The offer now also
   * appears partway through, so the email must not tell someone they finished
   * a preview they are still in the middle of.
   */
  stage?: "in_preview" | "preview_complete";
}

function createTransporter(): Transporter {
  return nodemailer.createTransport({
    host: ENV.smtpHost,
    port: Number(ENV.smtpPort ?? 587),
    secure: Number(ENV.smtpPort ?? 587) === 465,
    auth: { user: ENV.smtpUser, pass: ENV.smtpPass },
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}

/** Escape user-influenced values before they enter an HTML email body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build the ordered study steps from the learner's own preview result.
 * Kept pure and exported so the wording is testable without sending mail.
 */
export function buildStudyPlanSteps(payload: {
  score: number;
  weakTopics: string[];
  courseLabel: string;
}): string[] {
  const { score, weakTopics, courseLabel } = payload;
  const steps: string[] = [];

  if (weakTopics.length > 0) {
    steps.push(
      `Start with ${weakTopics[0]}. This is where you missed the most in your preview, so it is the fastest place to gain marks.`
    );
    if (weakTopics[1]) {
      steps.push(
        `Then work through ${weakTopics[1]}, and keep going until you can answer it without hesitating.`
      );
    }
  } else {
    steps.push(
      `You answered every preview question correctly, so widen your range. Practise across all modules of ${courseLabel} rather than repeating what you already know.`
    );
  }

  steps.push(
    score >= 80
      ? "Move to a timed mock exam early. Your accuracy is strong, so your next gain comes from working at exam pace."
      : "Practise in short daily sessions rather than long occasional ones. Spacing your practice is what moves scores on certification exams."
  );

  steps.push(
    "Use the AI Tutor on every question you get wrong. Reading the reason a distractor is wrong is what stops you repeating the mistake on exam day."
  );

  return steps;
}

export async function sendPreviewStudyPlanEmail(
  payload: PreviewStudyPlanEmailPayload
): Promise<void> {
  const {
    email,
    courseLabel,
    score,
    correct,
    total,
    weakTopics,
    courseUrl,
    offerUrl,
    priceLabel,
    stage = "preview_complete",
  } = payload;

  if (!ENV.smtpHost || !ENV.smtpUser || !ENV.smtpPass) {
    // Capture must never depend on mail delivery. The lead is already stored.
    console.error("[preview-plan] SMTP not configured; skipping plan email.");
    return;
  }

  const steps = buildStudyPlanSteps({ score, weakTopics, courseLabel });
  const safeCourse = escapeHtml(courseLabel);
  const inPreview = stage === "in_preview";
  const resultLabel = inPreview ? "YOUR RESULT SO FAR" : "YOUR PREVIEW RESULT";
  const subheading = inPreview
    ? "Built from the questions you have answered so far."
    : "Built from the questions you just answered.";
  const topicsLine = weakTopics.length
    ? weakTopics.map(escapeHtml).join(", ")
    : inPreview
      ? "None so far. You have answered every question correctly."
      : "None. You answered every preview question correctly.";

  const textBody = [
    `Here is your ${courseLabel} study plan.`,
    ``,
    `${inPreview ? "Your result so far" : "Your preview result"}: ${score} percent (${correct} of ${total} correct)`,
    `Topics to strengthen: ${weakTopics.length ? weakTopics.join(", ") : "none, you answered every question correctly"}`,
    ``,
    `Your plan:`,
    ...steps.map((step, index) => `${index + 1}. ${step}`),
    ``,
    `Keep practising: ${courseUrl}`,
    `Full access to ${courseLabel} is ${priceLabel} for 12 months: ${offerUrl}`,
    ``,
    `This preview is a study diagnostic, not a prediction of your official exam result.`,
    ``,
    `Echelon Institute`,
    `https://echeloninstitute.ca`,
  ].join("\n");

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Echelon Institute" <${ENV.smtpUser || "no-reply@echeloninstitute.ca"}>`,
    to: email,
    subject: `Your ${courseLabel} study plan`,
    text: textBody,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1D4ED8, #0EA5E9); padding: 28px 24px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #fff; margin: 0; font-size: 21px; font-weight: 800;">Your ${safeCourse} study plan</h2>
          <p style="color: rgba(255,255,255,0.88); margin: 8px 0 0; font-size: 14px;">${subheading}</p>
        </div>
        <div style="background: #F8FAFC; padding: 26px 24px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="background: #fff; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 6px; font-size: 11px; font-weight: 800; color: #64748B; letter-spacing: 0.08em;">${resultLabel}</p>
            <p style="margin: 0 0 10px; font-size: 28px; font-weight: 900; color: #1D4ED8;">${score}%<span style="font-size: 13px; font-weight: 600; color: #64748B;"> &nbsp;${correct} of ${total} correct</span></p>
            <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Topics to strengthen:</strong> ${topicsLine}</p>
          </div>
          <p style="margin: 0 0 10px; font-size: 13px; font-weight: 800; color: #0F172A; letter-spacing: 0.02em;">YOUR PLAN</p>
          <ol style="margin: 0 0 22px; padding-left: 20px; color: #334155;">
            ${steps.map(step => `<li style="font-size: 14px; line-height: 1.6; margin-bottom: 10px;">${escapeHtml(step)}</li>`).join("")}
          </ol>
          <div style="text-align: center; margin-bottom: 18px;">
            <a href="${courseUrl}" style="display: inline-block; background: linear-gradient(135deg, #1D4ED8, #0EA5E9); color: #fff; text-decoration: none; padding: 13px 26px; border-radius: 10px; font-size: 15px; font-weight: 800;">Keep practising</a>
          </div>
          <p style="margin: 0 0 18px; font-size: 13px; color: #475569; text-align: center; line-height: 1.6;">
            When you are ready for the full question bank, timed mock exam and AI Tutor on every question,
            <a href="${offerUrl}" style="color: #1D4ED8; font-weight: 700;">${safeCourse} is ${escapeHtml(priceLabel)}</a>
            for 12 months of access.
          </p>
          <p style="margin: 0; font-size: 11px; color: #94A3B8; text-align: center; line-height: 1.5;">
            This preview is a study diagnostic, not a prediction of your official exam result.<br />
            Echelon Institute &middot; <a href="https://echeloninstitute.ca" style="color: #94A3B8;">echeloninstitute.ca</a>
          </p>
        </div>
      </div>
    `,
  });

  console.log(
    `[preview-plan] Sent to ${email.replace(/(^.{3}).+@/, "$1***@")}`
  );
}
