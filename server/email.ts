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
  } else if (!ENV.isProduction) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  } else {
    console.error("[email] SMTP not configured in production — cannot send purchase confirmation.");
    throw new Error("Email service not configured");
  }

  const siteUrl = "https://echeloninstitute.ca";
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

export interface SubscriptionConfirmationPayload {
  email: string;
  tierLabel: string;   // e.g. "Class 2 All-Access"
  provinceLabel: string; // e.g. "Ontario (EOCP)"
  currentPeriodEnd: Date;
  quizPath: string;    // first quiz to land on
}

/**
 * Sends a subscription activation confirmation email to the subscriber.
 * Called from the webhook on customer.subscription.created.
 */
export async function sendSubscriptionConfirmationEmail(
  payload: SubscriptionConfirmationPayload
): Promise<void> {
  const { email, tierLabel, provinceLabel, currentPeriodEnd, quizPath } = payload;

  let transporter: nodemailer.Transporter;
  if (ENV.smtpHost && ENV.smtpUser && ENV.smtpPass) {
    transporter = createTransporter();
  } else if (!ENV.isProduction) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  } else {
    console.error("[email] SMTP not configured in production — cannot send subscription confirmation.");
    throw new Error("Email service not configured");
  }

  const siteUrl = "https://echeloninstitute.ca";
  const renewalDate = currentPeriodEnd.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  const quizUrl = `${siteUrl}${quizPath}`;
  const accountUrl = `${siteUrl}/account`;

  const mail = {
    from: `"Echelon Institute" <${ENV.smtpUser || "no-reply@echeloninstitute.ca"}>`,
    to: email,
    subject: `Your ${tierLabel} subscription is active — Echelon Institute`,
    text: [
      `Your subscription is now active!`,
      ``,
      `Plan: ${tierLabel}`,
      `Province: ${provinceLabel}`,
      `Renews: ${renewalDate}`,
      ``,
      `Start studying: ${quizUrl}`,
      `Manage your subscription: ${accountUrl}`,
      ``,
      `Questions? Reply to this email or contact abello@echeloninstitute.ca`,
    ].join("\n"),
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#7C3AED 0%,#4F46E5 100%);border-radius:12px 12px 0 0;padding:32px 32px 28px;text-align:center;">
            <div style="font-size:40px;margin-bottom:12px;">🎓</div>
            <h1 style="color:#ffffff;margin:0 0 8px;font-size:26px;font-weight:800;">Subscription Activated!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:15px;">Your annual plan is now active and ready to use.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
            <div style="background:#F5F3FF;border:1.5px solid #C4B5FD;border-radius:10px;padding:18px 22px;margin-bottom:28px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#7C3AED;letter-spacing:0.06em;text-transform:uppercase;">Subscription Details</p>
              <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#0F172A;">${tierLabel}</p>
              <p style="margin:0 0 4px;font-size:14px;color:#475569;">${provinceLabel}</p>
              <p style="margin:0;font-size:13px;color:#64748B;">Renews automatically on ${renewalDate}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding-right:8px;width:50%;">
                  <a href="${quizUrl}" style="display:block;background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#ffffff;text-decoration:none;text-align:center;padding:14px 12px;border-radius:8px;font-size:14px;font-weight:700;">
                    Start Studying Now
                  </a>
                </td>
                <td style="padding-left:8px;width:50%;">
                  <a href="${accountUrl}" style="display:block;background:#0F172A;color:#ffffff;text-decoration:none;text-align:center;padding:14px 12px;border-radius:8px;font-size:14px;font-weight:700;">
                    Manage Subscription
                  </a>
                </td>
              </tr>
            </table>
            <ul style="margin:0 0 28px;padding-left:20px;">
              <li style="font-size:13px;color:#475569;margin-bottom:6px;line-height:1.5;">Unlimited practice questions for all included exam types</li>
              <li style="font-size:13px;color:#475569;margin-bottom:6px;line-height:1.5;">AI Tutor with step-by-step explanations</li>
              <li style="font-size:13px;color:#475569;margin-bottom:6px;line-height:1.5;">Timed mock exams and score history</li>
              <li style="font-size:13px;color:#475569;line-height:1.5;">Flashcards and module study notes</li>
            </ul>
            <div style="border-top:1px solid #E2E8F0;padding-top:20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#64748B;">Questions? Reply to this email or reach us at</p>
              <p style="margin:0;font-size:13px;"><a href="mailto:abello@echeloninstitute.ca" style="color:#7C3AED;text-decoration:none;">abello@echeloninstitute.ca</a></p>
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

  const info = await transporter.sendMail(mail);
  if (!ENV.smtpHost) {
    console.log("[Subscription Email] Preview URL:", nodemailer.getTestMessageUrl(info));
  } else {
    console.log(`[Subscription Email] Activation sent to ${email}`);
  }
}

/**
 * Sends a renewal confirmation email when an annual subscription renews.
 * Called from the webhook on invoice.payment_succeeded.
 */
export async function sendSubscriptionRenewalEmail(
  payload: SubscriptionConfirmationPayload
): Promise<void> {
  const { email, tierLabel, provinceLabel, currentPeriodEnd, quizPath } = payload;

  let transporter: nodemailer.Transporter;
  if (ENV.smtpHost && ENV.smtpUser && ENV.smtpPass) {
    transporter = createTransporter();
  } else if (!ENV.isProduction) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  } else {
    console.error("[email] SMTP not configured in production — cannot send renewal email.");
    throw new Error("Email service not configured");
  }

  const siteUrl = "https://echeloninstitute.ca";
  const renewalDate = currentPeriodEnd.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  const quizUrl = `${siteUrl}${quizPath}`;
  const accountUrl = `${siteUrl}/account`;

  const mail = {
    from: `"Echelon Institute" <${ENV.smtpUser || "no-reply@echeloninstitute.ca"}>`,
    to: email,
    subject: `Your ${tierLabel} subscription has renewed — Echelon Institute`,
    text: [
      `Your subscription has been renewed for another year.`,
      ``,
      `Plan: ${tierLabel}`,
      `Province: ${provinceLabel}`,
      `Next renewal: ${renewalDate}`,
      ``,
      `Continue studying: ${quizUrl}`,
      `Manage your subscription: ${accountUrl}`,
      ``,
      `To cancel before the next renewal, visit your account page.`,
      `Questions? Reply to this email or contact abello@echeloninstitute.ca`,
    ].join("\n"),
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#0F172A 0%,#1E293B 100%);border-radius:12px 12px 0 0;padding:32px 32px 28px;text-align:center;">
            <div style="font-size:40px;margin-bottom:12px;">🔄</div>
            <h1 style="color:#ffffff;margin:0 0 8px;font-size:26px;font-weight:800;">Subscription Renewed</h1>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:15px;">Another year of full access is now active.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
            <div style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:10px;padding:18px 22px;margin-bottom:28px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#15803D;letter-spacing:0.06em;text-transform:uppercase;">Renewal Confirmed</p>
              <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#0F172A;">${tierLabel}</p>
              <p style="margin:0 0 4px;font-size:14px;color:#475569;">${provinceLabel}</p>
              <p style="margin:0;font-size:13px;color:#64748B;">Next renewal: ${renewalDate}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding-right:8px;width:50%;">
                  <a href="${quizUrl}" style="display:block;background:linear-gradient(135deg,#1D4ED8,#0E7490);color:#ffffff;text-decoration:none;text-align:center;padding:14px 12px;border-radius:8px;font-size:14px;font-weight:700;">
                    Continue Studying
                  </a>
                </td>
                <td style="padding-left:8px;width:50%;">
                  <a href="${accountUrl}" style="display:block;background:#F1F5F9;color:#0F172A;text-decoration:none;text-align:center;padding:14px 12px;border-radius:8px;font-size:14px;font-weight:700;border:1px solid #E2E8F0;">
                    Manage Subscription
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 12px;font-size:13px;color:#64748B;line-height:1.6;">
              To cancel before the next renewal date, visit your account page and click "Manage Subscription".
            </p>
            <div style="border-top:1px solid #E2E8F0;padding-top:20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#64748B;">Questions? Reply to this email or reach us at</p>
              <p style="margin:0;font-size:13px;"><a href="mailto:abello@echeloninstitute.ca" style="color:#1D4ED8;text-decoration:none;">abello@echeloninstitute.ca</a></p>
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

  const info = await transporter.sendMail(mail);
  if (!ENV.smtpHost) {
    console.log("[Subscription Email] Preview URL:", nodemailer.getTestMessageUrl(info));
  } else {
    console.log(`[Subscription Email] Renewal sent to ${email}`);
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
  } else if (!ENV.isProduction) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  } else {
    console.error("[email] SMTP not configured in production — cannot send contact email.");
    throw new Error("Email service not configured");
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


export interface MagicLinkEmailPayload {
  email: string;
  magicLinkUrl: string;
  expiresInMinutes: number;
}

/**
 * Sends a magic link email for passwordless authentication.
 * The link contains a one-time token that grants access to the user's purchased courses.
 */
export async function sendMagicLinkEmail(
  payload: MagicLinkEmailPayload
): Promise<void> {
  const { email, magicLinkUrl, expiresInMinutes } = payload;

  let transporter: nodemailer.Transporter;
  if (ENV.smtpHost && ENV.smtpUser && ENV.smtpPass) {
    transporter = createTransporter();
  } else if (!ENV.isProduction) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  } else {
    console.error("[email] SMTP not configured in production.");
    throw new Error("Email service not configured");
  }

  const mail = {
    from: `"Echelon Institute" <${ENV.smtpUser || "no-reply@echeloninstitute.ca"}>`,
    to: email,
    subject: `Your login link - Echelon Institute`,
    text: [
      `Hi there,`,
      ``,
      `Click the link below to access your Echelon Institute courses:`,
      ``,
      magicLinkUrl,
      ``,
      `This link expires in ${expiresInMinutes} minutes and can only be used once.`,
      ``,
      `If you didn't request this, you can safely ignore this email.`,
      ``,
      `- The Echelon Institute Team`,
    ].join("\n"),
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1D4ED8 0%,#0E7490 100%);border-radius:12px 12px 0 0;padding:32px 32px 28px;text-align:center;">
            <div style="font-size:40px;margin-bottom:12px;">🔐</div>
            <h1 style="color:#ffffff;margin:0 0 8px;font-size:24px;font-weight:800;">Your Login Link</h1>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:15px;">Click below to access your courses instantly.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;text-align:center;">
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
              Click the button below to sign in and access all your purchased courses. No password needed.
            </p>
            <a href="${magicLinkUrl}" style="display:inline-block;background:linear-gradient(135deg,#1D4ED8,#0E7490);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:700;">
              Sign In to Echelon Institute
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:#94A3B8;">
              This link expires in ${expiresInMinutes} minutes and can only be used once.
            </p>
            <div style="border-top:1px solid #E2E8F0;margin-top:28px;padding-top:20px;">
              <p style="margin:0;font-size:12px;color:#94A3B8;">
                If you didn't request this link, you can safely ignore this email.
              </p>
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

  const info = await transporter.sendMail(mail);
  if (!ENV.smtpHost) {
    console.log("[Magic Link Email] Preview URL:", nodemailer.getTestMessageUrl(info));
  } else {
    console.log(`[Magic Link Email] Sent to ${email}`);
  }
}

// ─── Re-engagement email ────────────────────────────────────────────────────

export interface ReEngagementEmailPayload {
  email: string;
  customerName?: string | null;
  products: string; // e.g. "OIT Water, Class 1 Water"
  loginUrl: string; // https://echeloninstitute.ca/login
}

/**
 * One-time re-engagement email sent to existing purchasers who haven't logged in.
 * Informs them the login system is fixed and gives them a direct link.
 */
export async function sendReEngagementEmail(payload: ReEngagementEmailPayload): Promise<void> {
  const { email, customerName, products, loginUrl } = payload;
  const firstName = customerName?.split(" ")[0] ?? "there";
  const siteUrl = "https://echeloninstitute.ca";

  const transporter = createTransporter();

  const mail = {
    from: `"Echelon Institute" <${ENV.smtpUser || "no-reply@echeloninstitute.ca"}>`,
    to: email,
    subject: `Your Echelon Institute access is ready to use`,
    text: [
      `Hi ${firstName},`,
      ``,
      `We noticed you haven't had a chance to log in and use your ${products} yet.`,
      ``,
      `We recently fixed a login issue that was preventing some students from accessing their dashboard. Everything is working now.`,
      ``,
      `Log in here: ${loginUrl}`,
      ``,
      `Just enter the email address you used to purchase (${email}) and you'll get a 6-digit code to sign in instantly. No password needed.`,
      ``,
      `Once you're in, you'll find:`,
      `  - Your full question bank (500+ questions per course)`,
      `  - Timed mock exams`,
      `  - AI Tutor for step-by-step explanations`,
      `  - Your progress dashboard`,
      ``,
      `If you run into any issues, just reply to this email.`,
      ``,
      `Good luck on your exam!`,
      `Ayoola`,
      `Echelon Institute`,
    ].join("\n"),
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1D4ED8 0%,#0E7490 100%);border-radius:12px 12px 0 0;padding:32px 32px 28px;text-align:center;">
            <div style="font-size:36px;margin-bottom:12px;">👋</div>
            <h1 style="color:#ffffff;margin:0 0 8px;font-size:24px;font-weight:800;line-height:1.2;">Your access is ready</h1>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:15px;">We fixed a login issue. Here's how to get in.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 20px;font-size:16px;color:#0F172A;line-height:1.6;">Hi ${firstName},</p>
            <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
              We noticed you haven't had a chance to log in and use your <strong style="color:#0F172A;">${products}</strong> yet.
            </p>
            <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
              We recently fixed a login issue that was preventing some students from accessing their dashboard. Everything is working now.
            </p>

            <div style="background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#1D4ED8;letter-spacing:0.06em;text-transform:uppercase;">How to sign in</p>
              <p style="margin:0 0 12px;font-size:14px;color:#1E3A5F;line-height:1.6;">
                Go to the login page and enter <strong>${email}</strong>. You'll receive a 6-digit code by email. Enter the code and you're in. No password needed.
              </p>
              <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#1D4ED8,#0E7490);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;">
                Sign In to Echelon Institute
              </a>
            </div>

            <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0F172A;">Once you're in, you'll find:</p>
            <ul style="margin:0 0 28px;padding-left:20px;">
              <li style="font-size:13px;color:#475569;margin-bottom:6px;line-height:1.5;">500+ practice questions per course, unlimited attempts</li>
              <li style="font-size:13px;color:#475569;margin-bottom:6px;line-height:1.5;">Timed mock exams (100 questions, 2 hours)</li>
              <li style="font-size:13px;color:#475569;margin-bottom:6px;line-height:1.5;">AI Tutor for step-by-step explanations on every question</li>
              <li style="font-size:13px;color:#475569;margin-bottom:6px;line-height:1.5;">Progress dashboard showing your accuracy by module</li>
              <li style="font-size:13px;color:#475569;line-height:1.5;">Interactive process guides, formula sheets, and flashcards</li>
            </ul>

            <div style="border-top:1px solid #E2E8F0;padding-top:20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#64748B;">Questions? Just reply to this email.</p>
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

  const info = await transporter.sendMail(mail);
  console.log(`[Re-engagement Email] Sent to ${email} — ${nodemailer.getTestMessageUrl(info) || "production"}`);
}

// ─── Welcome / onboarding email (Day 1 after purchase) ──────────────────────

export interface WelcomeOnboardingEmailPayload {
  email: string;
  customerName?: string | null;
  productName: string;
  productKey: string;
  quizPath: string;
  mockPath: string;
}

/**
 * Sent 1 day after purchase as a "getting started" guide.
 * Walks the student through the 3 most important features.
 */
export async function sendWelcomeOnboardingEmail(payload: WelcomeOnboardingEmailPayload): Promise<void> {
  const { email, customerName, productName, quizPath, mockPath } = payload;
  const firstName = customerName?.split(" ")[0] ?? "there";
  const siteUrl = "https://echeloninstitute.ca";
  const quizUrl = `${siteUrl}${quizPath}`;
  const mockUrl = `${siteUrl}${mockPath}`;
  const loginUrl = `${siteUrl}/login`;
  const dashboardUrl = `${siteUrl}/dashboard`;

  const transporter = createTransporter();

  const mail = {
    from: `"Ayoola at Echelon Institute" <${ENV.smtpUser || "no-reply@echeloninstitute.ca"}>`,
    to: email,
    subject: `3 things to do first with your ${productName}`,
    text: [
      `Hi ${firstName},`,
      ``,
      `You purchased your ${productName} yesterday. Here are the 3 most effective things to do first:`,
      ``,
      `1. Sign in and check your dashboard`,
      `   ${loginUrl}`,
      `   Enter your email (${email}) to get a sign-in code. Your dashboard tracks your accuracy by module so you know exactly where to focus.`,
      ``,
      `2. Do a 15-question practice session`,
      `   ${quizUrl}`,
      `   Don't try to study everything at once. Start with one module, answer 15 questions, and read every explanation — even the ones you got right.`,
      ``,
      `3. Take a baseline mock exam`,
      `   ${mockUrl}`,
      `   100 questions, 2 hours. Do it now before you've studied much. Your baseline score tells you which modules need the most work.`,
      ``,
      `That's it for now. Reply to this email if you have any questions.`,
      ``,
      `Ayoola`,
      `Echelon Institute`,
    ].join("\n"),
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1D4ED8 0%,#0E7490 100%);border-radius:12px 12px 0 0;padding:32px 32px 28px;text-align:center;">
            <div style="font-size:36px;margin-bottom:12px;">🚀</div>
            <h1 style="color:#ffffff;margin:0 0 8px;font-size:24px;font-weight:800;line-height:1.2;">3 things to do first</h1>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:15px;">Get the most out of your ${productName}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">Hi ${firstName}, you purchased your ${productName} yesterday. Here are the 3 most effective things to do first:</p>

            <!-- Step 1 -->
            <div style="display:flex;margin-bottom:24px;">
              <div style="flex-shrink:0;width:36px;height:36px;background:#EFF6FF;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:16px;font-size:16px;font-weight:800;color:#1D4ED8;text-align:center;line-height:36px;">1</div>
              <div>
                <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0F172A;">Sign in and check your dashboard</p>
                <p style="margin:0 0 10px;font-size:13px;color:#475569;line-height:1.6;">Enter your email (<strong>${email}</strong>) at the login page to get a sign-in code. Your dashboard tracks your accuracy by module so you know exactly where to focus.</p>
                <a href="${loginUrl}" style="display:inline-block;background:#EFF6FF;border:1.5px solid #BFDBFE;color:#1D4ED8;text-decoration:none;padding:8px 16px;border-radius:7px;font-size:13px;font-weight:700;">Sign In</a>
              </div>
            </div>

            <!-- Step 2 -->
            <div style="display:flex;margin-bottom:24px;">
              <div style="flex-shrink:0;width:36px;height:36px;background:#F0FDF4;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:16px;font-size:16px;font-weight:800;color:#15803D;text-align:center;line-height:36px;">2</div>
              <div>
                <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0F172A;">Do a 15-question practice session</p>
                <p style="margin:0 0 10px;font-size:13px;color:#475569;line-height:1.6;">Start with one module, answer 15 questions, and read every explanation even the ones you got right. That's how the adaptive engine learns your weak spots.</p>
                <a href="${quizUrl}" style="display:inline-block;background:#F0FDF4;border:1.5px solid #BBF7D0;color:#15803D;text-decoration:none;padding:8px 16px;border-radius:7px;font-size:13px;font-weight:700;">Start Practice</a>
              </div>
            </div>

            <!-- Step 3 -->
            <div style="display:flex;margin-bottom:28px;">
              <div style="flex-shrink:0;width:36px;height:36px;background:#FFF7ED;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:16px;font-size:16px;font-weight:800;color:#C2410C;text-align:center;line-height:36px;">3</div>
              <div>
                <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0F172A;">Take a baseline mock exam</p>
                <p style="margin:0 0 10px;font-size:13px;color:#475569;line-height:1.6;">100 questions, 2 hours. Do it before you've studied much. Your baseline score shows exactly which modules need the most work before exam day.</p>
                <a href="${mockUrl}" style="display:inline-block;background:#FFF7ED;border:1.5px solid #FED7AA;color:#C2410C;text-decoration:none;padding:8px 16px;border-radius:7px;font-size:13px;font-weight:700;">Take Mock Exam</a>
              </div>
            </div>

            <div style="border-top:1px solid #E2E8F0;padding-top:20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#64748B;">Questions? Just reply to this email.</p>
              <p style="margin:0;font-size:12px;color:#94A3B8;">Echelon Institute · Canada's AI-powered exam prep for water &amp; wastewater operators</p>
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

  const info = await transporter.sendMail(mail);
  console.log(`[Welcome Onboarding Email] Sent to ${email} — ${nodemailer.getTestMessageUrl(info) || "production"}`);
}

export interface TeamEnrollmentEmailPayload {
  email: string;
  orgName: string;
  managerEmail: string;
  loginUrl: string; // e.g. https://echeloninstitute.ca/dashboard/login
}

/**
 * Sends a team enrollment email to an operator who has been assigned a seat
 * by their organization manager. Generic — works for any utility or company.
 * Called from grantSeat() in orgRouter.ts.
 */
export async function sendTeamEnrollmentEmail(
  payload: TeamEnrollmentEmailPayload
): Promise<void> {
  const { email, orgName, managerEmail, loginUrl } = payload;

  let transporter: nodemailer.Transporter;
  if (ENV.smtpHost && ENV.smtpUser && ENV.smtpPass) {
    transporter = createTransporter();
  } else if (!ENV.isProduction) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  } else {
    console.error("[email] SMTP not configured in production — cannot send team enrollment email.");
    throw new Error("Email service not configured");
  }

  const siteUrl = "https://echeloninstitute.ca";

  const mail = {
    from: `"Echelon Institute" <${ENV.smtpUser || "no-reply@echeloninstitute.ca"}>`,
    to: email,
    subject: `You've been enrolled in Echelon Institute — ${orgName}`,
    text: [
      `Hi there,`,
      ``,
      `${orgName} has enrolled you in Echelon Institute — Canada's AI-powered exam prep platform for water and wastewater operators.`,
      ``,
      `Your All-Access subscription is active and ready to use. You have full access to practice questions, mock exams, flashcards, study guides, and the AI Tutor for every certification level.`,
      ``,
      `To get started, sign in here:`,
      `  ${loginUrl}`,
      ``,
      `Use this email address (${email}) to sign in. You'll receive a one-time code — no password needed.`,
      ``,
      `Your progress, scores, and exam readiness are tracked on your personal dashboard. Your manager at ${orgName} can see an overview of team readiness but cannot see your individual question responses.`,
      ``,
      `Questions? Reply to this email or reach us at abello@echeloninstitute.ca`,
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
            <div style="font-size:40px;margin-bottom:12px;">🎓</div>
            <h1 style="color:#ffffff;margin:0 0 8px;font-size:26px;font-weight:800;line-height:1.2;">You've been enrolled!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:15px;">${orgName} has given you full access to Echelon Institute.</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;">

            <!-- Enrollment summary -->
            <div style="background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:10px;padding:18px 22px;margin-bottom:28px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#1D4ED8;letter-spacing:0.06em;text-transform:uppercase;">Enrollment Confirmed</p>
              <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#0F172A;">All-Access Subscription</p>
              <p style="margin:0 0 4px;font-size:14px;color:#475569;">Enrolled by: ${orgName}</p>
              <p style="margin:0;font-size:13px;color:#64748B;">Every certification level included — Class 1 through 4, Water &amp; Wastewater</p>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#1D4ED8,#0E7490);color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:10px;font-size:16px;font-weight:800;letter-spacing:-0.01em;">
                Sign In &amp; Start Studying →
              </a>
              <p style="margin:12px 0 0;font-size:13px;color:#64748B;">Use <strong>${email}</strong> to sign in — no password needed, just a one-time code.</p>
            </div>

            <!-- What's included -->
            <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0F172A;">What's included in your All-Access subscription:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="vertical-align:top;width:50%;padding-right:12px;">
                  <ul style="margin:0;padding-left:18px;">
                    <li style="font-size:13px;color:#475569;margin-bottom:8px;line-height:1.5;">500+ practice questions per exam level</li>
                    <li style="font-size:13px;color:#475569;margin-bottom:8px;line-height:1.5;">Timed mock exams (100 questions, 2 hrs)</li>
                    <li style="font-size:13px;color:#475569;margin-bottom:8px;line-height:1.5;">AI Tutor — step-by-step explanations</li>
                    <li style="font-size:13px;color:#475569;line-height:1.5;">Flashcard spaced-repetition system</li>
                  </ul>
                </td>
                <td style="vertical-align:top;width:50%;padding-left:12px;">
                  <ul style="margin:0;padding-left:18px;">
                    <li style="font-size:13px;color:#475569;margin-bottom:8px;line-height:1.5;">Module-by-module performance tracking</li>
                    <li style="font-size:13px;color:#475569;margin-bottom:8px;line-height:1.5;">Formula sheets with worked examples</li>
                    <li style="font-size:13px;color:#475569;margin-bottom:8px;line-height:1.5;">Process guides and study notes</li>
                    <li style="font-size:13px;color:#475569;line-height:1.5;">Exam date reminders and readiness score</li>
                  </ul>
                </td>
              </tr>
            </table>

            <!-- Privacy note -->
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:14px 18px;margin-bottom:28px;">
              <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
                <strong style="color:#0F172A;">Your privacy:</strong> Your manager at ${orgName} can see team-level readiness metrics (overall accuracy, activity, exam dates) but cannot see your individual question responses or session details.
              </p>
            </div>

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

  const info = await transporter.sendMail(mail);
  if (!ENV.smtpHost) {
    console.log("[Team Enrollment Email] Preview URL:", nodemailer.getTestMessageUrl(info));
  } else {
    console.log(`[Team Enrollment Email] Sent to ${email} from org ${orgName}`);
  }
}
