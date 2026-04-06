import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

export interface ContactEmailPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface PurchaseConfirmationPayload {
  email: string;
  productName: string;
  productKey: string;
  amountCAD: number; // in cents
  quizPath: string;  // e.g. "/class1-ww"
  mockPath: string;  // e.g. "/class1-ww-mock"
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
 * Sends a purchase confirmation email to the buyer after a successful Stripe checkout.
 * Includes their access link, the email they used, and a restore-access reminder.
 */
export async function sendPurchaseConfirmationEmail(
  payload: PurchaseConfirmationPayload
): Promise<void> {
  const { email, productName, productKey, amountCAD, quizPath, mockPath } = payload;

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

  const siteUrl = "https://echeloninstitute.manus.space";
  const amountFormatted = `CA$${(amountCAD / 100).toFixed(2)}`;
  const quizUrl = `${siteUrl}${quizPath}`;
  const mockUrl = `${siteUrl}${mockPath}`;
  const accountUrl = `${siteUrl}/account`;

  const confirmationMail = {
    from: `"Echelon Institute" <${ENV.smtpUser || "no-reply@echeloninstitute.ca"}>`,
    to: email,
    subject: `Your ${productName} is ready — Echelon Institute`,
    text: [
      `You're all set!`,
      ``,
      `Thank you for purchasing the ${productName} (${amountFormatted}).`,
      ``,
      `Start studying now:`,
      `  Practice Quiz: ${quizUrl}`,
      `  Mock Exam:     ${mockUrl}`,
      ``,
      `IMPORTANT — Save this email.`,
      `Your access is tied to this email address: ${email}`,
      `To restore access on any device, visit: ${accountUrl}`,
      `Enter the email above and your passes will be unlocked instantly.`,
      ``,
      `Questions? Reply to this email or contact us at abello@echeloninstitute.ca`,
      ``,
      `Good luck on your exam!`,
      `— The Echelon Institute Team`,
    ].join("\n"),
    html: `
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
            <div style="font-size:40px;margin-bottom:12px;">🎉</div>
            <h1 style="color:#ffffff;margin:0 0 8px;font-size:26px;font-weight:800;line-height:1.2;">You're all set!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:15px;">Your practice pass is now active and ready to use.</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">

            <!-- Purchase summary -->
            <div style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:10px;padding:18px 22px;margin-bottom:28px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#15803D;letter-spacing:0.06em;text-transform:uppercase;">Purchase Confirmed</p>
              <p style="margin:0;font-size:18px;font-weight:800;color:#0F172A;">${productName}</p>
              <p style="margin:4px 0 0;font-size:14px;color:#475569;">${amountFormatted} · One-time payment · Access never expires</p>
            </div>

            <!-- Start studying CTAs -->
            <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0F172A;">Start studying now:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding-right:8px;width:50%;">
                  <a href="${quizUrl}" style="display:block;background:linear-gradient(135deg,#1D4ED8,#0E7490);color:#ffffff;text-decoration:none;text-align:center;padding:14px 12px;border-radius:8px;font-size:14px;font-weight:700;">
                    📝 Practice Quiz →
                  </a>
                </td>
                <td style="padding-left:8px;width:50%;">
                  <a href="${mockUrl}" style="display:block;background:#0F172A;color:#ffffff;text-decoration:none;text-align:center;padding:14px 12px;border-radius:8px;font-size:14px;font-weight:700;">
                    ⏱ Mock Exam →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Access restore notice -->
            <div style="background:#FFF7ED;border:1.5px solid #FED7AA;border-radius:10px;padding:18px 22px;margin-bottom:28px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#C2410C;">⚠️ Save this email — it's your access key</p>
              <p style="margin:0 0 10px;font-size:13px;color:#78350F;line-height:1.6;">
                Your access is tied to this email address:<br>
                <strong style="color:#0F172A;font-size:14px;">${email}</strong>
              </p>
              <p style="margin:0 0 12px;font-size:13px;color:#78350F;line-height:1.6;">
                To restore access on any device (new phone, different browser, cleared cache), visit the Account page and enter this email.
              </p>
              <a href="${accountUrl}" style="display:inline-block;background:#FFF7ED;border:1.5px solid #FED7AA;color:#C2410C;text-decoration:none;padding:10px 18px;border-radius:7px;font-size:13px;font-weight:700;">
                🎫 Restore Access → Account Page
              </a>
            </div>

            <!-- What's included -->
            <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0F172A;">What's included in your pass:</p>
            <ul style="margin:0 0 28px;padding-left:20px;">
              <li style="font-size:13px;color:#475569;margin-bottom:6px;line-height:1.5;">500+ practice questions — unlimited attempts</li>
              <li style="font-size:13px;color:#475569;margin-bottom:6px;line-height:1.5;">Timed mock exam (100 questions, 2 hours)</li>
              <li style="font-size:13px;color:#475569;margin-bottom:6px;line-height:1.5;">AI Tutor — step-by-step explanations on every question</li>
              <li style="font-size:13px;color:#475569;margin-bottom:6px;line-height:1.5;">Module-by-module performance tracking</li>
              <li style="font-size:13px;color:#475569;line-height:1.5;">Formula sheet with worked examples</li>
            </ul>

            <!-- Footer -->
            <div style="border-top:1px solid #E2E8F0;padding-top:20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#64748B;">Questions? Reply to this email or reach us at</p>
              <p style="margin:0 0 6px;font-size:13px;"><a href="mailto:abello@echeloninstitute.ca" style="color:#1D4ED8;text-decoration:none;">abello@echeloninstitute.ca</a></p>
              <p style="margin:12px 0 0;font-size:12px;color:#94A3B8;">Echelon Institute · Canada's AI-powered exam prep for water &amp; wastewater operators</p>
            </div>

          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  };

  const info = await transporter.sendMail(confirmationMail);

  // Log preview URL for test accounts
  if (!ENV.smtpHost) {
    console.log("[Purchase Email] Preview URL:", nodemailer.getTestMessageUrl(info));
  } else {
    console.log(`[Purchase Email] Sent to ${email} for ${productKey}`);
  }
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
