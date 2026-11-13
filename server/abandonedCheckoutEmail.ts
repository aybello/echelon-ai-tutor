import nodemailer, { type Transporter } from "nodemailer";
import { ENV } from "./_core/env";

/**
 * One recovery email for an abandoned individual checkout.
 *
 * Why this exists: a learner who reaches the Stripe payment page has already
 * picked a course and seen the price. Something interrupted them. One short,
 * useful note with a link back to the same cart is the highest-value email we
 * can send, and it is the only one we send. There is no sequence here on
 * purpose: chasing a cart more than once reads as pressure, not service.
 */
export interface AbandonedCheckoutEmailPayload {
  email: string;
  /** Human course name, e.g. "Class 4 Water Treatment Exam Pass". */
  productName: string;
  /** Formatted price the learner already saw, e.g. "CA$299". */
  priceLabel: string;
  /** Stripe-hosted link that reopens the same cart, or the pricing page. */
  checkoutUrl: string;
  /** Absolute one-click unsubscribe URL. Always present. */
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

/** Format a minor-unit amount as the label the learner saw at checkout. */
export function formatCheckoutPrice(amountCents: number, currency: string): string {
  const symbol = currency.toLowerCase() === "usd" ? "US$" : "CA$";
  const major = Math.max(0, amountCents) / 100;
  return `${symbol}${major.toFixed(major % 1 === 0 ? 0 : 2)}`;
}

/**
 * Subject and body copy. Pure and exported so the wording is testable without
 * sending mail. The tone is service, not pressure: it answers the practical
 * questions a buyer hesitates on rather than pushing urgency.
 */
export function buildAbandonedCheckoutCopy(payload: {
  productName: string;
  priceLabel: string;
}): { subject: string; paragraphs: string[]; cta: string } {
  const { productName, priceLabel } = payload;
  return {
    subject: `Your ${productName} is still waiting`,
    paragraphs: [
      `You started checking out for the ${productName} and did not finish. Your cart is still open, so you can pick it up in one click.`,
      `What you get for ${priceLabel}: the full verified question bank with worked solutions, a timed mock exam built to the real exam blueprint, and the AI Tutor available on every question to explain the reasoning and the math.`,
      `Access runs for 12 months from payment, so it covers your study period and a retake if you need one. Payment is handled securely by Stripe and billed in Canadian dollars.`,
    ],
    cta: "Complete your purchase",
  };
}

export async function sendAbandonedCheckoutEmail(
  payload: AbandonedCheckoutEmailPayload
): Promise<void> {
  const { email, productName, priceLabel, checkoutUrl, unsubscribeUrl } = payload;

  if (!ENV.smtpHost || !ENV.smtpUser || !ENV.smtpPass) {
    // The job treats a send failure as retryable; missing SMTP config must
    // surface as an error rather than silently marking the cart as contacted.
    throw new Error("SMTP not configured for abandoned checkout recovery");
  }

  const copy = buildAbandonedCheckoutCopy({ productName, priceLabel });
  const safeProduct = escapeHtml(productName);

  const textBody = [
    ...copy.paragraphs,
    ``,
    `${copy.cta}: ${checkoutUrl}`,
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
            <a href="${checkoutUrl}" style="display: inline-block; background: linear-gradient(135deg, #1D4ED8, #0EA5E9); color: #fff; text-decoration: none; padding: 13px 26px; border-radius: 10px; font-size: 15px; font-weight: 800;">${escapeHtml(copy.cta)}</a>
          </div>
          <p style="margin: 0; font-size: 11px; color: #94A3B8; text-align: center; line-height: 1.6;">
            ${safeProduct} at Echelon Institute &middot; <a href="https://echeloninstitute.ca" style="color: #94A3B8;">echeloninstitute.ca</a><br />
            <a href="${unsubscribeUrl}" style="color: #94A3B8; text-decoration: underline;">Unsubscribe from these emails</a>
          </p>
        </div>
      </div>
    `,
  });

  console.log(
    `[abandoned-checkout] Sent recovery to ${email.replace(/(^.{3}).+@/, "$1***@")}`
  );
}
