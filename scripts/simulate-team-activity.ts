/**
 * Simulates a realistic team scenario for Sample Learner 1's org (fixture-95@example.com):
 * - Assigns 3 test operators
 * - Seeds question attempt data for 2 of them (1 is "never started")
 * Then we verify the manager dashboard shows the correct data.
 */
import { getDb } from '../server/db';
import { organizations, organizationMembers, subscriptions, questionAttempts } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { normalizeEmail } from '../server/_core/access';

let DEMO_TARGET: URL;
try { DEMO_TARGET = new URL(process.env.DATABASE_URL ?? "mysql://invalid"); }
catch { throw new Error("Demo fixtures require a valid disposable database URL."); }
if (process.env.DEMO_FIXTURE_APPROVED !== "ISOLATED_DEMO_FIXTURES"
  || DEMO_TARGET.protocol !== "mysql:"
  || !["127.0.0.1", "localhost", "[::1]"].includes(DEMO_TARGET.hostname)
  || !/^\/echelon_(?:audit|demo)_[a-z0-9_]+$/i.test(DEMO_TARGET.pathname)) {
  throw new Error("Demo fixtures require explicit approval and a named disposable loopback database.");
}

const MANAGER_EMAIL = 'fixture-95@example.com';

const TEST_OPERATORS = [
  { email: 'fixture-107@example.com', name: 'Sample Learner 11', attempts: 120, correctRate: 0.82 },
  { email: 'fixture-108@example.com', name: 'Sample Learner 12',     attempts: 45,  correctRate: 0.55 },
  { email: 'fixture-109@example.com', name: 'Sample Learner 13',    attempts: 0,   correctRate: 0 },   // never started
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

  // Find Sample Learner 1's org
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

      console.log("Assigned synthetic operator.");
    } else {
      console.log("Synthetic operator already exists.");
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
      console.log(`Seeded ${op.attempts} synthetic attempts (${Math.round(op.correctRate * 100)}% accuracy).`);
    }
  }

  console.log('\n🎉 Simulation complete. Check the manager dashboard at /team');
  process.exit(0);
}

main().catch(() => {
  console.error("Synthetic activity simulation failed; no connection or account details are logged.");
  process.exitCode = 1;
});
