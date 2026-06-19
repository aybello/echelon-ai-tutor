import nodemailer from 'nodemailer';
import { ENV } from '../server/_core/env';

function createTransporter() {
  return nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: false,
    auth: { user: ENV.smtpUser, pass: ENV.smtpPass },
  });
}

async function sendOtpEmail(email: string, code: string): Promise<void> {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Echelon Institute" <${ENV.smtpUser}>`,
    to: email,
    subject: `Your Echelon dashboard code: ${code}`,
    html: `<p>Your code is: <strong>${code}</strong>. Expires in 10 minutes.</p>`,
    text: `Your Echelon dashboard login code is: ${code}\n\nThis code expires in 10 minutes.`,
  });
}

async function main() {
  const emails = ['pemon@utilitieskingston.com', 'cdooher@utilitieskingston.com'];
  for (const email of emails) {
    try {
      await sendOtpEmail(email, '654321');
      console.log(`✅ OTP email sent to ${email}`);
    } catch (err: any) {
      console.error(`❌ Failed for ${email}:`, err.message);
    }
  }
  process.exit(0);
}

main();
