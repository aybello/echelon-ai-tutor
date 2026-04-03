import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

export interface ContactEmailPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function createTransporter(): nodemailer.Transporter {
  if (ENV.smtpHost && ENV.smtpUser && ENV.smtpPass) {
    return nodemailer.createTransport({
      host: ENV.smtpHost,
      port: Number(ENV.smtpPort ?? 587),
      secure: Number(ENV.smtpPort ?? 587) === 465,
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPass,
      },
    });
  }
  // Fallback — should not reach here in production
  throw new Error("SMTP not configured");
}

/**
 * Sends a contact form submission to the Echelon Institute inbox
 * AND sends an auto-reply confirmation to the submitter.
 */
export async function sendContactEmail(payload: ContactEmailPayload): Promise<void> {
  const { name, email, subject, message } = payload;

  let transporter: nodemailer.Transporter;

  if (ENV.smtpHost && ENV.smtpUser && ENV.smtpPass) {
    transporter = createTransporter();
  } else {
    // Fallback: Ethereal test account (emails visible at ethereal.email)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // ── 1. Notification email to Echelon inbox ──────────────────────────────
  const notificationMail = {
    from: `"Echelon Institute" <${ENV.smtpUser || "no-reply@echeloninstitute.ca"}>`,
    to: "abello@echeloninstitute.ca",
    replyTo: `"${name}" <${email}>`,
    subject: `[Contact Form] ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0369A1, #0E7490); padding: 24px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 20px;">New Contact Form Submission</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Echelon Institute</p>
        </div>
        <div style="background: #F8FAFC; padding: 24px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: #64748B; width: 80px;"><strong>Name</strong></td>
              <td style="padding: 8px 0; font-size: 14px; color: #0F172A;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: #64748B;"><strong>Email</strong></td>
              <td style="padding: 8px 0; font-size: 14px; color: #0F172A;"><a href="mailto:${email}" style="color: #0369A1;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: #64748B;"><strong>Subject</strong></td>
              <td style="padding: 8px 0; font-size: 14px; color: #0F172A;">${subject}</td>
            </tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 6px; border: 1px solid #E2E8F0;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #64748B; font-weight: 600;">MESSAGE</p>
            <p style="margin: 0; font-size: 14px; color: #0F172A; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="margin: 16px 0 0; font-size: 12px; color: #94A3B8;">Reply directly to this email to respond to ${name}.</p>
        </div>
      </div>
    `,
  };

  // ── 2. Auto-reply confirmation to the submitter ─────────────────────────
  const autoReplyMail = {
    from: `"Echelon Institute" <${ENV.smtpUser || "no-reply@echeloninstitute.ca"}>`,
    to: `"${name}" <${email}>`,
    subject: `We received your message — Echelon Institute`,
    text: `Hi ${name},\n\nThank you for reaching out to Echelon Institute! We've received your message and will get back to you within 1 business day.\n\nHere's a copy of what you sent:\n\nSubject: ${subject}\n\n${message}\n\n---\nEchelon Institute\nPhone: 289-788-1885\nEmail: abello@echeloninstitute.ca\nhttps://echeloninstitute.manus.space`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1D4ED8, #0E7490); padding: 28px 24px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 22px; font-weight: 800;">Thanks for reaching out!</h2>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">We've received your message and will reply within 1 business day.</p>
        </div>
        <div style="background: #F8FAFC; padding: 28px 24px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 16px; font-size: 15px; color: #0F172A;">Hi <strong>${name}</strong>,</p>
          <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
            Thank you for contacting <strong>Echelon Institute</strong>. We've received your message and our team will get back to you as soon as possible — typically within 1 business day.
          </p>
          <div style="background: white; border-radius: 8px; border: 1px solid #E2E8F0; padding: 16px 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #94A3B8; letter-spacing: 0.05em;">YOUR MESSAGE</p>
            <p style="margin: 0 0 6px; font-size: 13px; color: #64748B;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 0; font-size: 14px; color: #0F172A; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 4px;">
            <p style="margin: 0 0 4px; font-size: 13px; color: #64748B;">📞 <a href="tel:+12897881885" style="color: #0369A1; text-decoration: none;">289-788-1885</a></p>
            <p style="margin: 0 0 4px; font-size: 13px; color: #64748B;">✉️ <a href="mailto:abello@echeloninstitute.ca" style="color: #0369A1; text-decoration: none;">abello@echeloninstitute.ca</a></p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #94A3B8;">Canada's AI-powered exam prep platform for water and wastewater operators.</p>
          </div>
        </div>
      </div>
    `,
  };

  // Send both emails in parallel
  const [info] = await Promise.all([
    transporter.sendMail(notificationMail),
    transporter.sendMail(autoReplyMail),
  ]);

  // Log preview URL for test accounts
  if (!ENV.smtpHost) {
    console.log("[Contact Email] Preview URL:", nodemailer.getTestMessageUrl(info));
  }
}
