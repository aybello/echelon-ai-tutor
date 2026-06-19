/**
 * Simulates a realistic team scenario for Philip's org (pemon@utilitieskingston.com):
 * - Assigns 3 test operators
 * - Seeds question attempt data for 2 of them (1 is "never started")
 * Then we verify the manager dashboard shows the correct data.
 */
import { getDb } from '../server/db';
import { organizations, organizationMembers, subscriptions, questionAttempts } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { normalizeEmail } from '../server/_core/access';

const MANAGER_EMAIL = 'pemon@utilitieskingston.com';

const TEST_OPERATORS = [
  { email: 'test.operator1@utilitieskingston.com', name: 'Alex Thompson', attempts: 120, correctRate: 0.82 },
  { email: 'test.operator2@utilitieskingston.com', name: 'Jamie Lee',     attempts: 45,  correctRate: 0.55 },
  { email: 'test.operator3@utilitieskingston.com', name: 'Sam Rivera',    attempts: 0,   correctRate: 0 },   // never started
];

// Sample question IDs from OIT bank
const SAMPLE_QUESTIONS = [
  { id: 1001, topic: 'Disinfection' },
  { id: 1002, topic: 'Disinfection' },
  { id: 1003, topic: 'Disinfection' },
  { id: 1004, topic: 'Hydraulics' },
  { id: 1005, topic: 'Hydraulics' },
  { id: 1006, topic: 'Regulations' },
  { id: 1007, topic: 'Regulations' },
  { id: 1008, topic: 'Math & Calculations' },
  { id: 1009, topic: 'Math & Calculations' },
  { id: 1010, topic: 'Water Quality' },
];

function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d;
}

async function main() {
  const db = await getDb();
  if (!db) { console.error('DB connection failed'); process.exit(1); }

  // Find Philip's org
  const managerRow = await db.select({ orgId: organizationMembers.orgId })
    .from(organizationMembers)
    .where(and(
      eq(organizationMembers.email, normalizeEmail(MANAGER_EMAIL)),
      eq(organizationMembers.role, 'manager'),
    ))
    .limit(1);

  if (managerRow.length === 0) {
    console.error('Manager not found'); process.exit(1);
  }

  const orgId = managerRow[0].orgId;
  console.log(`✅ Found org: ${orgId}`);

  // Get org details
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));

  // Assign test operators
  for (const op of TEST_OPERATORS) {
    const email = normalizeEmail(op.email);

    // Check if already exists
    const existing = await db.select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.email, email)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(organizationMembers).values({
        orgId,
        email,
        name: op.name,
        role: 'operator',
        status: 'assigned',
      });

      // Upsert subscription using the same sentinel pattern as grantSeat
      const orgSubId = `org-${orgId}-${email}`;
      const existingSub = await db.select({ id: subscriptions.id })
        .from(subscriptions)
        .where(and(eq(subscriptions.email, email), eq(subscriptions.orgId, orgId)))
        .limit(1);
      if (existingSub.length === 0) {
        await db.insert(subscriptions).values({
          email,
          tier: 'all-access',
          province: org.province,
          stripeSubscriptionId: orgSubId,
          stripeCustomerId: '',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: org.termEnd,
          orgId,
        });
      }

      console.log(`✅ Assigned operator: ${op.name} (${email})`);
    } else {
      console.log(`⚠️  Operator already exists: ${email}`);
    }

    // Seed question attempts
    if (op.attempts > 0) {
      const attemptsToInsert = [];
      for (let i = 0; i < op.attempts; i++) {
        const q = SAMPLE_QUESTIONS[i % SAMPLE_QUESTIONS.length];
        const isCorrect = Math.random() < op.correctRate;
        attemptsToInsert.push({
          studentEmail: email,
          questionId: q.id + i, // unique per attempt
          topic: q.topic,
          correct: isCorrect ? 'yes' as const : 'no' as const,
          examType: 'oit_water',
          createdAt: randomDate(14),
        });
      }

      // Insert in batches of 50
      for (let i = 0; i < attemptsToInsert.length; i += 50) {
        await db.insert(questionAttempts).values(attemptsToInsert.slice(i, i + 50));
      }
      console.log(`✅ Seeded ${op.attempts} attempts for ${op.name} (${Math.round(op.correctRate * 100)}% accuracy)`);
    }
  }

  console.log('\n🎉 Simulation complete. Check the manager dashboard at /team');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
