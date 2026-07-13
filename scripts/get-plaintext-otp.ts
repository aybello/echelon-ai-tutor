/**
 * Test helper: generate a fresh OTP for pemon and return the plaintext code.
 * This bypasses the email and directly inserts a known code for testing.
 */
import { getDb } from '../server/db';
import { dashboardOtps } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

const EMAIL = 'pemon@utilitieskingston.com';
const TEST_CODE = '123456';

async function main() {
  const db = await getDb();
  if (!db) { console.error('DB unavailable'); process.exit(1); }

  const hash = crypto.createHash('sha256').update(TEST_CODE).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  // Delete existing unused OTPs for this email
  await db.delete(dashboardOtps).where(eq(dashboardOtps.email, EMAIL));

  // Insert known test OTP
  await db.insert(dashboardOtps).values({
    email: EMAIL,
    codeHash: hash,
    expiresAt,
  });

  console.log(`✅ Test OTP set for ${EMAIL}: ${TEST_CODE} (expires in 10 min)`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
