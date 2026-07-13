/**
 * Sends a personalized welcome + onboarding email to Philip Emon and Carl Dooher.
 */
import { getDb } from '../server/db';
import { magicLinks } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sendMagicLinkEmail } from '../server/email';
import nodemailer from 'nodemailer';
import { ENV } from '../server/_core/env';
import crypto from 'crypto';

const RECIPIENTS = [
  { name: 'Philip', email: 'pemon@utilitieskingston.com', seats: 10 },
  { name: 'Carl',   email: 'cdooher@utilitieskingston.com', seats: 14 },
];
const ORIGIN = 'https://echeloninstitute.ca';
const EXPIRY_MINUTES = 60 * 24 * 7;

function createTransporter() {
  return nodemailer.createTransport({
    host: ENV.smtpHost,
    port: Number(ENV.smtpPort ?? 587),
    secure: false,
    auth: { user: ENV.smtpUser, pass: ENV.smtpPass },
  });
}

async function main() {
  const db = await getDb();
  if (!db) { console.error('DB connection failed'); process.exit(1); }

  const transporter = createTransporter();

  for (const recipient of RECIPIENTS) {
    // Generate a fresh magic link
    const token = crypto.randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

    await db.insert(magicLinks).values({
      email: recipient.email,
      token,
      examTypes: 'all_access,ontario',
      expiresAt,
    });

    const dashboardUrl = `${ORIGIN}/auth/magic?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#F8FAFC; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <div style="max-width:600px; margin:32px auto; background:#FFFFFF; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg, #1D4ED8, #0E7490); padding:32px 40px; text-align:center;">
      <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp" alt="Echelon Institute" width="52" style="margin-bottom:12px;" />
      <h1 style="color:#FFFFFF; margin:0; font-size:22px; font-weight:800; letter-spacing:-0.02em;">Welcome to Echelon Institute</h1>
      <p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px;">Your team is ready to start preparing for certification</p>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">
      <p style="color:#0F172A; font-size:16px; margin:0 0 20px;">Hi ${recipient.name},</p>
      
      <p style="color:#334155; font-size:15px; line-height:1.7; margin:0 0 20px;">
        Thank you for bringing Utilities Kingston onto Echelon Institute — we're genuinely excited to support your team's certification journey. Your account is fully set up and your operators can start studying today.
      </p>

      <p style="color:#334155; font-size:15px; line-height:1.7; margin:0 0 28px;">
        You have <strong style="color:#1D4ED8;">${recipient.seats} operator seats</strong> available under your Ontario All-Access plan, valid through <strong>June 19, 2027</strong>.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center; margin:0 0 36px;">
        <a href="${dashboardUrl}" style="display:inline-block; padding:14px 32px; background:linear-gradient(135deg, #1D4ED8, #0E7490); color:#FFFFFF; border-radius:10px; text-decoration:none; font-size:15px; font-weight:700; letter-spacing:-0.01em;">
          Open Your Team Dashboard →
        </a>
        <p style="color:#94A3B8; font-size:12px; margin:10px 0 0;">This link logs you in automatically — no password needed. Valid for 7 days.</p>
      </div>

      <!-- Divider -->
      <hr style="border:none; border-top:1px solid #E2E8F0; margin:0 0 28px;" />

      <!-- Steps -->
      <h2 style="color:#0F172A; font-size:16px; font-weight:700; margin:0 0 20px;">Getting Your Team Started — 3 Simple Steps</h2>

      <div style="margin-bottom:20px;">
        <div style="display:flex; align-items:flex-start; margin-bottom:16px;">
          <div style="background:#EFF6FF; color:#1D4ED8; font-weight:800; font-size:13px; border-radius:50%; width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; margin-right:14px; line-height:28px; text-align:center;">1</div>
          <div>
            <p style="color:#0F172A; font-size:14px; font-weight:700; margin:0 0 4px;">Log in to your Team Dashboard</p>
            <p style="color:#64748B; font-size:13px; line-height:1.6; margin:0;">Click the button above or go to <a href="${ORIGIN}/team/login" style="color:#1D4ED8;">${ORIGIN}/team/login</a> and enter your email to receive a sign-in code. Bookmark this page for future logins.</p>
          </div>
        </div>

        <div style="display:flex; align-items:flex-start; margin-bottom:16px;">
          <div style="background:#EFF6FF; color:#1D4ED8; font-weight:800; font-size:13px; border-radius:50%; width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; margin-right:14px; line-height:28px; text-align:center;">2</div>
          <div>
            <p style="color:#0F172A; font-size:14px; font-weight:700; margin:0 0 4px;">Assign seats to your operators</p>
            <p style="color:#64748B; font-size:13px; line-height:1.6; margin:0;">From the dashboard, click <strong>Add Operator</strong> and enter each team member's email address. They'll receive an enrollment email with a one-click login link — no password required.</p>
          </div>
        </div>

        <div style="display:flex; align-items:flex-start;">
          <div style="background:#EFF6FF; color:#1D4ED8; font-weight:800; font-size:13px; border-radius:50%; width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; margin-right:14px; line-height:28px; text-align:center;">3</div>
          <div>
            <p style="color:#0F172A; font-size:14px; font-weight:700; margin:0 0 4px;">Track your team's progress</p>
            <p style="color:#64748B; font-size:13px; line-height:1.6; margin:0;">Your dashboard shows each operator's readiness score, questions answered, weak modules, and mock exam results — updated in real time as they study.</p>
          </div>
        </div>
      </div>

      <!-- What's included -->
      <hr style="border:none; border-top:1px solid #E2E8F0; margin:28px 0;" />
      <h2 style="color:#0F172A; font-size:16px; font-weight:700; margin:0 0 16px;">What Each Operator Gets</h2>
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0; color:#334155; font-size:13px; border-bottom:1px solid #F1F5F9;">📝 Practice Questions</td>
          <td style="padding:8px 0; color:#1D4ED8; font-size:13px; font-weight:600; text-align:right; border-bottom:1px solid #F1F5F9;">15,000+ across all Ontario courses</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#334155; font-size:13px; border-bottom:1px solid #F1F5F9;">🤖 AI Tutor</td>
          <td style="padding:8px 0; color:#1D4ED8; font-size:13px; font-weight:600; text-align:right; border-bottom:1px solid #F1F5F9;">24/7 — explains every question</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#334155; font-size:13px; border-bottom:1px solid #F1F5F9;">📋 Mock Exams</td>
          <td style="padding:8px 0; color:#1D4ED8; font-size:13px; font-weight:600; text-align:right; border-bottom:1px solid #F1F5F9;">Timed, exam-format practice tests</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#334155; font-size:13px; border-bottom:1px solid #F1F5F9;">🃏 Flashcards</td>
          <td style="padding:8px 0; color:#1D4ED8; font-size:13px; font-weight:600; text-align:right; border-bottom:1px solid #F1F5F9;">500+ per course</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#334155; font-size:13px;">📐 Formula Sheets & Study Notes</td>
          <td style="padding:8px 0; color:#1D4ED8; font-size:13px; font-weight:600; text-align:right;">All modules covered</td>
        </tr>
      </table>

      <!-- Support -->
      <hr style="border:none; border-top:1px solid #E2E8F0; margin:28px 0;" />
      <p style="color:#64748B; font-size:13px; line-height:1.7; margin:0;">
        If you have any questions or need help getting your team set up, reply to this email or reach us at <a href="mailto:abello@echeloninstitute.ca" style="color:#1D4ED8;">abello@echeloninstitute.ca</a>. We're happy to jump on a quick call if that's easier.
      </p>
      <p style="color:#64748B; font-size:13px; line-height:1.7; margin:12px 0 0;">
        Wishing your team every success on their exams.
      </p>
      <p style="color:#0F172A; font-size:14px; font-weight:700; margin:16px 0 0;">The Echelon Institute Team</p>
    </div>

    <!-- Footer -->
    <div style="background:#F8FAFC; padding:20px 40px; text-align:center; border-top:1px solid #E2E8F0;">
      <p style="color:#94A3B8; font-size:12px; margin:0;">© 2026 Echelon Institute · <a href="${ORIGIN}" style="color:#94A3B8;">${ORIGIN}</a></p>
    </div>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: `"Echelon Institute" <${ENV.smtpUser}>`,
      to: recipient.email,
      subject: `Welcome to Echelon Institute, ${recipient.name} — Your Team Dashboard is Ready`,
      html,
    });

    console.log(`✅ Welcome email sent to ${recipient.name} (${recipient.email})`);
  }

  console.log('\n🎉 All welcome emails sent successfully.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
