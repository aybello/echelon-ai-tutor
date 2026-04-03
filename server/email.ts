import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

export interface ContactEmailPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Sends a contact form submission to the Echelon Institute inbox.
 * Uses SMTP credentials from environment variables if available,
 * otherwise falls back to Ethereal (test) transport.
 */
export async function sendContactEmail(payload: ContactEmailPayload): Promise<void> {
  const { name, email, subject, message } = payload;

  let transporter: nodemailer.Transporter;

  if (ENV.smtpHost && ENV.smtpUser && ENV.smtpPass) {
    // Production: use configured SMTP
    transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: Number(ENV.smtpPort ?? 587),
      secure: Number(ENV.smtpPort ?? 587) === 465,
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPass,
      },
    });
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

  const mailOptions = {
    from: `"Echelon Institute Contact" <no-reply@echeloninstitute.ca>`,
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

  const info = await transporter.sendMail(mailOptions);

  // Log preview URL for test accounts
  if (!ENV.smtpHost) {
    console.log("[Contact Email] Preview URL:", nodemailer.getTestMessageUrl(info));
  }
}
