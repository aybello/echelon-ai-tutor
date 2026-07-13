/**
 * Sends magic link access emails to Utilities Kingston users.
 */
import { sendMagicLinkEmail } from '../server/email';

const users = [
  {
    email: 'pemon@utilitieskingston.com',
    token: '31NXKLowe5HalgT0AAihORJ2obc6b8RDzenWKeXljM7a01GKzL4XnDBegSYIzs0t',
  },
  {
    email: 'cdooher@utilitieskingston.com',
    token: 'D1II7xdg2fU-tMgpMnAuFIgWApk4c0l94a24aNYwX7HoruhzMcJ-Nniim_HaNPzv',
  },
];

const ORIGIN = 'https://echeloninstitute.ca';
const EXPIRY_MINUTES = 60 * 24 * 7; // 7 days

for (const user of users) {
  const magicLinkUrl = `${ORIGIN}/auth/magic?token=${user.token}`;
  try {
    await sendMagicLinkEmail({
      email: user.email,
      magicLinkUrl,
      expiresInMinutes: EXPIRY_MINUTES,
    });
    console.log(`✅ Email sent to ${user.email}`);
  } catch (err: any) {
    console.error(`❌ Failed to send to ${user.email}:`, err.message);
  }
}

process.exit(0);
