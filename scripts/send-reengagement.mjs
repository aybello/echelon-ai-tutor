/**
 * One-time re-engagement email blast.
 * Sends a personalized email to every real customer (excluding owner test accounts)
 * informing them that the login issue is fixed and giving them a direct sign-in link.
 *
 * Usage:
 *   cd /home/ubuntu/echelon-ai-tutor
 *   node scripts/send-reengagement.mjs
 *
 * Dry-run (no emails sent, just logs what would be sent):
 *   DRY_RUN=1 node scripts/send-reengagement.mjs
 */

import "dotenv/config";
import nodemailer from "nodemailer";
import mysql from "mysql2/promise";

const DRY_RUN = process.env.DRY_RUN === "1";

// ─── SMTP setup ─────────────────────────────────────────────────────────────
const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT ?? "587", 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpHost || !smtpUser || !smtpPass) {
  console.error("ERROR: SMTP_HOST, SMTP_USER, and SMTP_PASS must be set in environment.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: { user: smtpUser, pass: smtpPass },
});

// ─── DB connection ───────────────────────────────────────────────────────────
const db = await mysql.createConnection(process.env.DATABASE_URL);

// ─── Fetch all real customers with their products ───────────────────────────
const OWNER_EMAILS = ["belllo.ayoola@gmail.com"];

const [rows] = await db.execute(
  `SELECT email,
          COALESCE(MAX(CASE WHEN customerName IS NOT NULL AND customerName != '' THEN customerName END)) AS customerName,
          GROUP_CONCAT(DISTINCT productName ORDER BY createdAt SEPARATOR ', ') AS products,
          GROUP_CONCAT(DISTINCT productKey ORDER BY createdAt SEPARATOR ',') AS productKeys
   FROM purchases
   WHERE email NOT IN (${OWNER_EMAILS.map(() => "?").join(",")})
   GROUP BY email
   ORDER BY MIN(createdAt)`,
  OWNER_EMAILS
);

await db.end();

console.log(`Found ${rows.length} real customers to email.\n`);

// ─── Send emails ─────────────────────────────────────────────────────────────
const siteUrl = "https://echeloninstitute.ca";
const loginUrl = `${siteUrl}/login`;

let sent = 0;
let failed = 0;

for (const row of rows) {
  const { email, customerName, products } = row;
  const firstName = customerName?.split(" ")[0] ?? "there";

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would send to: ${email} (${firstName}) — ${products}`);
    continue;
  }

  const mail = {
    from: `"Ayoola at Echelon Institute" <${smtpUser}>`,
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

  try {
    await transporter.sendMail(mail);
    console.log(`✅ Sent to ${email} (${firstName}) — ${products}`);
    sent++;
    // 1 second delay between sends to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  } catch (err) {
    console.error(`❌ Failed to send to ${email}: ${err.message}`);
    failed++;
  }
}

if (!DRY_RUN) {
  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
} else {
  console.log(`\n[DRY RUN] Would have sent ${rows.length} emails.`);
}
