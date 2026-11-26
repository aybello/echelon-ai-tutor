import nodemailer, { type Transporter } from "nodemailer";
import { ENV } from "./_core/env";

/**
 * Email sent to a manager who configured a team order and never completed
 * payment.
 *
 * The tone matters here. This person works at a municipal water utility and is
 * almost certainly blocked by procurement mechanics rather than by doubt: a
 * purchase order is required, a corporate card was declined, or a supervisor
 * must approve. A discount would be the wrong answer and would cheapen the
 * product. A short, direct offer to solve the blocker is the right one.
 *
 * There is no second email. One honest follow-up from a real person respects
 * a working manager's inbox. A drip sequence would not.
 */
export interface AbandonedTeamOrderEmailPayload {
  managerEmail: string;
  organizationName: string;
  totalLicences: number;
  subtotalCents: number;
  courseNames: string[];
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
 * Builds the single sentence naming what the manager was buying. Kept pure so
 * the wording is testable without sending mail.
 */
export function buildOrderSummary(input: {
  totalLicences: number;
  courseNames: string[];
}): string {
  const seats = input.totalLicences === 1 ? "1 licence" : `${input.totalLicences} licences`;
  if (input.courseNames.length === 0) return seats;
  if (input.courseNames.length === 1) return `${seats} for ${input.courseNames[0]}`;
  const last = input.courseNames[input.courseNames.length - 1];
  const rest = input.courseNames.slice(0, -1).join(", ");
  return `${seats} across ${rest} and ${last}`;
}

export async function sendAbandonedTeamOrderEmail(
  payload: AbandonedTeamOrderEmailPayload,
): Promise<void> {
  const { managerEmail, organizationName, totalLicences, subtotalCents, courseNames } = payload;

  if (!ENV.smtpHost || !ENV.smtpUser || !ENV.smtpPass) {
    console.error("[team-recovery] SMTP not configured; skipping recovery email.");
    return;
  }

  const summary = buildOrderSummary({ totalLicences, courseNames });
  const amount = `CA$${(subtotalCents / 100).toFixed(2)}`;
  const safeOrg = escapeHtml(organizationName);
  const safeSummary = escapeHtml(summary);

  const textBody = [
    `Hi,`,
    ``,
    `You set up ${summary} for ${organizationName} on Echelon Institute (${amount}) but the order did not go through.`,
    ``,
    `If a purchase order, invoice or quote would make this easier, reply to this email and we will issue one. We work with municipal and utility procurement regularly and can match whatever your finance team needs.`,
    ``,
    `If you would rather just finish the order, start it again here:`,
    `https://echeloninstitute.ca/teams`,
    ``,
    `Happy to answer any questions about course coverage or how licence assignment works for your operators.`,
    ``,
    `Ayoola Bello`,
    `Echelon Institute`,
    `https://echeloninstitute.ca`,
  ].join("\n");

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Echelon Institute" <${ENV.smtpUser || "no-reply@echeloninstitute.ca"}>`,
    to: managerEmail,
    replyTo: "abello@echeloninstitute.ca",
    subject: `Your ${organizationName} licence order`,
    text: textBody,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0F172A;">
        <p style="font-size: 15px; line-height: 1.6;">Hi,</p>
        <p style="font-size: 15px; line-height: 1.6;">
          You set up <strong>${safeSummary}</strong> for ${safeOrg} on Echelon Institute
          (${escapeHtml(amount)}) but the order did not go through.
        </p>
        <p style="font-size: 15px; line-height: 1.6;">
          If a purchase order, invoice or quote would make this easier, reply to this email and
          we will issue one. We work with municipal and utility procurement regularly and can
          match whatever your finance team needs.
        </p>
        <p style="font-size: 15px; line-height: 1.6;">
          If you would rather just finish the order,
          <a href="https://echeloninstitute.ca/teams" style="color: #1D4ED8; font-weight: 700;">start it again here</a>.
        </p>
        <p style="font-size: 15px; line-height: 1.6;">
          Happy to answer any questions about course coverage or how licence assignment works
          for your operators.
        </p>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 4px;">Ayoola Bello</p>
        <p style="font-size: 13px; color: #64748B; margin-top: 0;">
          Echelon Institute &middot;
          <a href="https://echeloninstitute.ca" style="color: #64748B;">echeloninstitute.ca</a>
        </p>
      </div>
    `,
  });

  console.log(
    `[team-recovery] Sent to ${managerEmail.replace(/(^.{3}).+@/, "$1***@")} for ${organizationName}`,
  );
}
