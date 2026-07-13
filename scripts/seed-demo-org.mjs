/**
 * seed-demo-org.mjs
 * Creates a demo org (Utilities Kingston) with a manager and 8 operators,
 * each with realistic quiz history, so the OrgDashboard can be previewed.
 *
 * Run: node scripts/seed-demo-org.mjs
 * Outputs: the manager email and a signed JWT cookie value to paste into the browser.
 */

import { createConnection } from "mysql2/promise";
import { SignJWT } from "jose";
import dotenv from "dotenv";
import { createHash } from "crypto";

dotenv.config({ path: ".env" });

const DB_URL = process.env.DATABASE_URL;
const JWT_SECRET_RAW = process.env.JWT_SECRET ?? "dev-secret";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);

if (!DB_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// Parse DATABASE_URL  mysql://user:pass@host:port/db
function parseDbUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port) || 3306,
    user: u.username,
    password: u.password,
    database: u.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: false },
  };
}

const MANAGER_EMAIL = "carl.demo@utilitieskingston.ca";
const ORG_NAME = "Utilities Kingston";

const OPERATORS = [
  { email: "j.smith@utilitieskingston.ca",   name: "James Smith",   examType: "class1-water",    sessions: 12, accuracy: 78 },
  { email: "m.jones@utilitieskingston.ca",   name: "Maria Jones",   examType: "class2-water",    sessions: 8,  accuracy: 65 },
  { email: "r.patel@utilitieskingston.ca",   name: "Raj Patel",     examType: "class1-ww",       sessions: 15, accuracy: 84 },
  { email: "s.chen@utilitieskingston.ca",    name: "Sarah Chen",    examType: "class3-water",    sessions: 5,  accuracy: 52 },
  { email: "t.brown@utilitieskingston.ca",   name: "Tyler Brown",   examType: "oit",             sessions: 20, accuracy: 91 },
  { email: "a.wilson@utilitieskingston.ca",  name: "Alex Wilson",   examType: "class1-water",    sessions: 3,  accuracy: 61 },
  { email: "d.garcia@utilitieskingston.ca",  name: "Diego Garcia",  examType: "class2-ww",       sessions: 9,  accuracy: 73 },
  { email: "l.nguyen@utilitieskingston.ca",  name: "Linh Nguyen",   examType: "class4-water",    sessions: 0,  accuracy: 0  },
];

const TOPICS_BY_EXAM = {
  "oit":          ["Disinfection", "Hydraulics", "Regulations", "Health & Safety", "Water Quality"],
  "class1-water": ["Coagulation", "Filtration", "Disinfection", "CT Values", "Hydraulics"],
  "class2-water": ["Advanced Treatment", "SCADA", "Corrosion Control", "Membrane Filtration", "Process Troubleshooting"],
  "class3-water": ["LSI", "CT Values", "Membranes", "Lime Softening", "Source Water"],
  "class4-water": ["System Management", "Regulatory Leadership", "Strategic Operations", "Emergency Response", "SCADA Advanced"],
  "class1-ww":    ["Primary Treatment", "Secondary Treatment", "Sludge Handling", "Regulations", "Hydraulics"],
  "class2-ww":    ["Biological Treatment", "Nutrient Removal", "Biosolids", "Process Control", "Lab Analysis"],
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  const conn = await createConnection(parseDbUrl(DB_URL));
  console.log("Connected to DB");

  // ── 1. Clean up any previous demo data ──────────────────────────────────────
  const allEmails = [MANAGER_EMAIL, ...OPERATORS.map(o => o.email)];
  const placeholders = allEmails.map(() => "?").join(",");

  await conn.execute(`DELETE FROM question_attempts WHERE studentEmail IN (${placeholders})`, allEmails);
  await conn.execute(`DELETE FROM student_profiles WHERE studentEmail IN (${placeholders})`, allEmails);
  await conn.execute(`DELETE FROM subscriptions WHERE email IN (${placeholders})`, allEmails);
  await conn.execute(`DELETE FROM organization_members WHERE email IN (${placeholders})`, allEmails);
  // Delete org by manager email
  await conn.execute(`DELETE FROM organizations WHERE managerEmail = ?`, [MANAGER_EMAIL]);
  console.log("Cleaned up previous demo data");

  // ── 2. Create the organization ───────────────────────────────────────────────
  const termEnd = new Date();
  termEnd.setFullYear(termEnd.getFullYear() + 1);

  const [orgResult] = await conn.execute(
    `INSERT INTO organizations (name, province, tier, seatsTotal, managerEmail, stripeSubscriptionId, stripeCustomerId, termEnd, billingType, status)
     VALUES (?, 'ontario', 'all-access', 10, ?, 'demo-sub-utilities-kingston', 'demo-cus-utilities-kingston', ?, 'invoice', 'active')`,
    [ORG_NAME, MANAGER_EMAIL, termEnd]
  );
  const orgId = orgResult.insertId;
  console.log(`Created org: ${ORG_NAME} (id=${orgId})`);

  // ── 3. Insert manager member row ─────────────────────────────────────────────
  await conn.execute(
    `INSERT INTO organization_members (orgId, email, role, status) VALUES (?, ?, 'manager', 'assigned')`,
    [orgId, MANAGER_EMAIL]
  );

  // ── 4. Insert manager subscription row (needed for OTP auth check) ──────────
  await conn.execute(
    `INSERT INTO subscriptions (email, tier, province, stripeSubscriptionId, stripeCustomerId, status, currentPeriodStart, currentPeriodEnd, orgId)
     VALUES (?, 'all-access', 'ontario', 'demo-mgr-utilities-kingston', '', 'active', NOW(), ?, ?)`,
    [MANAGER_EMAIL, termEnd, orgId]
  );

  // ── 5. Insert operators ──────────────────────────────────────────────────────
  for (const op of OPERATORS) {
    // Member row
    await conn.execute(
      `INSERT INTO organization_members (orgId, email, name, role, status) VALUES (?, ?, ?, 'operator', 'assigned')`,
      [orgId, op.email, op.name]
    );

    // Subscription row
    const orgSubId = `org-${orgId}-${op.email}`;
    await conn.execute(
      `INSERT INTO subscriptions (email, tier, province, stripeSubscriptionId, stripeCustomerId, status, currentPeriodStart, currentPeriodEnd, orgId)
       VALUES (?, 'all-access', 'ontario', ?, '', 'active', NOW(), ?, ?)`,
      [op.email, orgSubId, termEnd, orgId]
    );

    if (op.sessions === 0) continue;

    // Quiz attempts — spread across last 30 days
    const topics = TOPICS_BY_EXAM[op.examType] ?? ["General"];
    const attemptsPerSession = 20;
    const totalAttempts = op.sessions * attemptsPerSession;
    const correctTarget = Math.round(totalAttempts * op.accuracy / 100);
    let correctSoFar = 0;

    for (let s = 0; s < op.sessions; s++) {
      // sessionId column is varchar(36) — use a short fixed-length ID
      const sessionId = `d${orgId}-${s}-${op.email.slice(0,8)}`.slice(0, 36);
      const sessionDate = daysAgo(randomInt(1, 30));

      for (let q = 0; q < attemptsPerSession; q++) {
        const topic = topics[q % topics.length];
        const isCorrect = correctSoFar < correctTarget && (Math.random() < op.accuracy / 100);
        if (isCorrect) correctSoFar++;

        await conn.execute(
          `INSERT INTO question_attempts (studentEmail, examType, topic, questionId, correct, difficulty, quizMode, sessionId, createdAt)
           VALUES (?, ?, ?, ?, ?, 'medium', 'standard', ?, ?)`,
          [op.email, op.examType, topic, randomInt(1, 500), isCorrect ? "yes" : "no", sessionId, sessionDate]
        );
      }
    }

    // Student profile snapshot
    const topicAccuracy = {};
    for (const topic of topics) {
      const c = randomInt(Math.floor(op.accuracy * 0.8), Math.min(100, Math.ceil(op.accuracy * 1.1)));
      topicAccuracy[topic] = { correct: c, total: 100 };
    }
    const weakTopics = topics.filter(t => (topicAccuracy[t].correct / topicAccuracy[t].total) < 0.65);
    const strongTopics = topics.filter(t => (topicAccuracy[t].correct / topicAccuracy[t].total) > 0.80);

    await conn.execute(
      `INSERT INTO student_profiles (studentEmail, examType, topicAccuracy, weakTopics, strongTopics, totalAttempts, totalSessions, currentStreak, longestStreak, lastActiveDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         topicAccuracy = VALUES(topicAccuracy),
         weakTopics = VALUES(weakTopics),
         strongTopics = VALUES(strongTopics),
         totalAttempts = VALUES(totalAttempts),
         totalSessions = VALUES(totalSessions),
         currentStreak = VALUES(currentStreak),
         longestStreak = VALUES(longestStreak),
         lastActiveDate = VALUES(lastActiveDate)`,
      [
        op.email, op.examType,
        JSON.stringify(topicAccuracy),
        JSON.stringify(weakTopics),
        JSON.stringify(strongTopics),
        totalAttempts, op.sessions,
        randomInt(1, 7), randomInt(5, 21),
        new Date().toISOString().slice(0, 10)
      ]
    );

    console.log(`  Seeded operator: ${op.email} (${op.sessions} sessions, ${op.accuracy}% accuracy)`);
  }

  // ── 6. Issue a signed JWT for the manager ────────────────────────────────────
  const token = await new SignJWT({ email: MANAGER_EMAIL, type: "dashboard" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);

  console.log("\n✅ Done! To view the dashboard:\n");
  console.log("1. Open the browser dev tools → Application → Cookies");
  console.log(`2. Add a cookie named: echelon_dashboard_session`);
  console.log(`   Value: ${token}`);
  console.log(`   Domain: 3000-i4wlpeu9riou8qduhkoqr-28efefea.us2.manus.computer`);
  console.log(`   Path: /`);
  console.log(`   HttpOnly: true`);
  console.log("\nOR run this in the browser console:");
  console.log(`document.cookie = "echelon_dashboard_session=${token}; path=/; max-age=86400";`);
  console.log(`\nThen navigate to: /team`);
  console.log(`\nManager email: ${MANAGER_EMAIL}`);

  await conn.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
