import { getDb } from '../server/db';
import { dashboardOtps } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) { console.log('no db'); process.exit(1); }
  const otps = await db.select().from(dashboardOtps)
    .where(eq(dashboardOtps.email, 'pemon@utilitieskingston.com'))
    .orderBy(desc(dashboardOtps.createdAt))
    .limit(1);
  console.log('Latest OTP for pemon:', JSON.stringify(otps, null, 2));
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
