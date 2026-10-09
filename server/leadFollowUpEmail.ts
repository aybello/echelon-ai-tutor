import nodemailer, { type Transporter } from "nodemailer";
import { ENV } from "./_core/env";

/**
 * Bounded follow-up emails for captured quiz-gate leads.
 *
 * Why this exists: leads captured at the quiz gate received exactly one study
 * plan email at the moment of capture and were never contacted again. A single
 * email at a single moment converts only the people who were already about to
 * buy. These two follow-ups give the lead a reason to come back while the exam
 * still matters to them, then stop.
 *
 * Deliberate limits:
 * - Exactly two follow-ups, then permanent silence. No open-ended drip.
 * - Every email carries a one-click unsubscribe honoured before any send.
 * - Buyers are suppressed before sending, so nobody is marketed a course they
 *   already own.
 */
export interface LeadFollowUpEmailPayload {
  email: string;
  /** 1 = first follow-up (day 3), 2 = final follow-up (day 10). */
  stage: 1 | 2;
  courseLabel: string;
  /** Absolute URL back into the course quiz the lead was practising. */
  courseUrl: string;
  /** Absolute URL to the pricing page for the matching Exam Pass. */
  offerUrl: string;
  priceLabel?: string;
  /** Absolute one-click unsubscribe URL. Always present on follow-ups. */
  unsubscribeUrl: string;
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Subject and body copy per stage. Pure and exported so the wording is
 * testable without sending mail.
 */
export function buildLeadFollowUpCopy(payload: {
  stage: 1 | 2;
  courseLabel: string;
  priceLabel?: string;
}): { subject: string; paragraphs: string[]; cta: string } {
  const { stage, courseLabel, priceLabel } = payload;

  if (stage === 1) {
    return {
      subject: `How is your ${courseLabel} studying going?`,
      paragraphs: [
        `A few days ago you practised ${courseLabel} questions on Echelon Institute. Checking in: how is the studying going?`,
        `Most people who pass certification exams do it with short, regular practice rather than long cram sessions. Even ten questions today keeps the material fresh.`,
        `Your free preview questions are still there whenever you want them.`,
      ],
      cta: "Pick up where you left off",
    };
  }

  return {
    subject: `Your ${courseLabel} practice is still here`,
    paragraphs: [
      `This is the last note from us about your ${courseLabel} practice, so we wanted to make it count.`,
      `If your exam is coming up, the full Exam Pass gives you the complete question bank, a timed mock exam built to the real blueprint, and the AI Tutor on every question${priceLabel ? ` for ${priceLabel}` : ""} with 12 months of access.`,
      `If the timing is not right, no problem. We will not email you about this again, and your free preview stays available whenever you need it.`,
    ],
    cta: "See the full Exam Pass",
  };
}

export async function sendLeadFollowUpEmail(
  payload: LeadFollowUpEmailPayload
): Promise<void> {
  const { email, stage, courseLabel, courseUrl, offerUrl, priceLabel, unsubscribeUrl } = payload;

  if (!ENV.smtpHost || !ENV.smtpUser || !ENV.smtpPass) {
    // The job treats a send failure as retryable; missing SMTP config must
    // surface as an error, not silently mark the lead as contacted.
    throw new Error("SMTP not configured for lead follow-ups");
  }

  const copy = buildLeadFollowUpCopy({ stage, courseLabel, priceLabel });
  const ctaUrl = stage === 1 ? courseUrl : offerUrl;
  const safeCourse = escapeHtml(courseLabel);

  const textBody = [
    ...copy.paragraphs,
    ``,
    `${copy.cta}: ${ctaUrl}`,
    ``,
    `Echelon Institute`,
    `https://echeloninstitute.ca`,
    ``,
    `No longer want these emails? Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Echelon Institute" <${ENV.smtpUser || "no-reply@echeloninstitute.ca"}>`,
    to: email,
    subject: copy.subject,
    text: textBody,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1D4ED8, #0EA5E9); padding: 24px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #fff; margin: 0; font-size: 19px; font-weight: 800;">${escapeHtml(copy.subject)}</h2>
        </div>
        <div style="background: #F8FAFC; padding: 26px 24px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px;">
          ${copy.paragraphs
            .map(
              p =>
                `<p style="margin: 0 0 14px; font-size: 14px; line-height: 1.65; color: #334155;">${escapeHtml(p)}</p>`
            )
            .join("")}
          <div style="text-align: center; margin: 22px 0 18px;">
            <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #1D4ED8, #0EA5E9); color: #fff; text-decoration: none; padding: 13px 26px; border-radius: 10px; font-size: 15px; font-weight: 800;">${escapeHtml(copy.cta)}</a>
          </div>
          <p style="margin: 0; font-size: 11px; color: #94A3B8; text-align: center; line-height: 1.6;">
            ${safeCourse} practice at Echelon Institute &middot; <a href="https://echeloninstitute.ca" style="color: #94A3B8;">echeloninstitute.ca</a><br />
            <a href="${unsubscribeUrl}" style="color: #94A3B8; text-decoration: underline;">Unsubscribe from these emails</a>
          </p>
        </div>
      </div>
    `,
  });

  console.log(
    `[lead-follow-up] Sent stage ${stage} to ${email.replace(/(^.{3}).+@/, "$1***@")}`
  );
}
