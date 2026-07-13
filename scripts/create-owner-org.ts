/**
 * Creates a test manager org for the owner and sends a magic link.
 */
import { getDb } from '../server/db';
import { organizations, organizationMembers, magicLinks } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sendMagicLinkEmail } from '../server/email';
import crypto from 'crypto';

const OWNER_EMAIL = 'belllo.ayoola@gmail.com';
const ORG_NAME = 'Echelon Institute (Owner Preview)';
const ORIGIN = 'https://echeloninstitute.ca';
const EXPIRY_MINUTES = 60 * 24 * 7; // 7 days

async function main() {
  const db = await getDb();
  if (!db) { console.error('DB connection failed'); process.exit(1); }

  // Check if already a manager member
  const existing = await db.select().from(organizationMembers)
    .where(eq(organizationMembers.email, OWNER_EMAIL));

  let orgId: number;

  if (existing.length > 0) {
    orgId = existing[0].orgId;
    console.log(`✅ Org already exists: ${orgId}`);
  } else {
    // Create org with correct column names
    const [result] = await db.insert(organizations).values({
      name: ORG_NAME,
      province: 'ontario',
      tier: 'all-access',
      seatsTotal: 50,
      managerEmail: OWNER_EMAIL,
      stripeSubscriptionId: 'owner_preview_' + Date.now(),
      termEnd: new Date('2027-06-19'),
      billingType: 'stripe',
      status: 'active',
    });

    orgId = (result as any).insertId;
    console.log(`✅ Created org: ${orgId}`);

    // Add as manager member
    await db.insert(organizationMembers).values({
      orgId,
      email: OWNER_EMAIL,
      role: 'manager',
      status: 'assigned',
    });

    console.log(`✅ Added as manager`);
  }

  // Generate magic link token
  const token = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  await db.insert(magicLinks).values({
    email: OWNER_EMAIL,
    token,
    examTypes: 'all_access,ontario',
    expiresAt,
  });

  const magicUrl = `${ORIGIN}/auth/magic?token=${token}`;
  console.log(`\n🔗 Magic link: ${magicUrl}\n`);

  // Send email
  await sendMagicLinkEmail({
    email: OWNER_EMAIL,
    magicLinkUrl: magicUrl,
    expiresInMinutes: EXPIRY_MINUTES,
  });

  console.log(`✅ Magic link email sent to ${OWNER_EMAIL}`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
