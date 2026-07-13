/**
 * Generates magic links for Utilities Kingston users so they can log in
 * without needing the OTP email.
 */
import { getDb } from '../server/db';
import { subscriptions, magicLinks } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { getSubscriptionExamTypes } from '../server/stripe/subscriptionProducts';
import { issueSubscriptionToken } from '../server/_core/subscriptionToken';
import crypto from 'crypto';

const EMAILS = ['pemon@utilitieskingston.com', 'cdooher@utilitieskingston.com'];
const ORIGIN = 'https://echeloninstitute.ca';
const EXPIRY_MINUTES = 60 * 24 * 7; // 7 days so they have time to use it

async function main() {
  const db = await getDb();
  if (!db) { console.log('no db'); process.exit(1); }

  for (const email of EMAILS) {
    // Get their subscriptions
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

    // Generate token
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
    console.log(`\n=== ${email} ===`);
    console.log(`Exam types: ${uniqueExamTypes.join(', ')}`);
    console.log(`Expires: ${expiresAt.toISOString()}`);
    console.log(`Magic link: ${magicLinkUrl}`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
