/**
 * Generates fresh magic links and sends them to both Utilities Kingston managers.
 */
import { getDb } from '../server/db';
import { subscriptions, magicLinks } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { getSubscriptionExamTypes } from '../server/stripe/subscriptionProducts';
import { sendMagicLinkEmail } from '../server/email';
import crypto from 'crypto';

const EMAILS = ['pemon@utilitieskingston.com', 'cdooher@utilitieskingston.com'];
const ORIGIN = 'https://echeloninstitute.ca';
const EXPIRY_MINUTES = 60 * 24 * 7; // 7 days

async function main() {
  const db = await getDb();
  if (!db) { console.log('no db'); process.exit(1); }

  for (const email of EMAILS) {
    // Get their active subscriptions
    const subs = await db.select().from(subscriptions).where(eq(subscriptions.email, email));
    const activeSubs = subs.filter(s => s.status === 'active');

    if (activeSubs.length === 0) {
      console.log(`No active subscription for ${email}`);
      continue;
    }

    // Build exam types list
    const examTypes: string[] = [];
    for (const sub of activeSubs) {
      try {
        const types = getSubscriptionExamTypes(sub.tier as any, sub.province as any);
        examTypes.push(...types);
      } catch {}
    }
    const uniqueExamTypes = Array.from(new Set(examTypes));

    // Generate fresh token
    const token = crypto.randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

    // Delete any existing magic links for this email
    await db.delete(magicLinks).where(eq(magicLinks.email, email));

    // Insert new magic link
    await db.insert(magicLinks).values({
      email,
      token,
      examTypes: JSON.stringify(uniqueExamTypes),
      expiresAt,
    });

    const magicLinkUrl = `${ORIGIN}/auth/magic?token=${token}`;

    // Send the email
    try {
      await sendMagicLinkEmail({ email, magicLinkUrl, expiresInMinutes: EXPIRY_MINUTES });
      console.log(`✅ Fresh magic link sent to ${email}`);
      console.log(`   Link: ${magicLinkUrl}`);
      console.log(`   Expires: ${expiresAt.toISOString()}`);
    } catch (err: any) {
      console.error(`❌ Email failed for ${email}:`, err.message);
    }
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
