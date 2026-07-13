/**
 * KI-001 Migration: Merge Split OAuth + OTP Student Profiles
 *
 * Problem:
 *   When a student first uses OTP email login and later signs up via Manus OAuth
 *   with the same email, they end up with two separate rows in student_profiles:
 *     - OTP row:   studentEmail = "alice@example.com", userId = NULL
 *     - OAuth row: userId = 42,                        studentEmail = NULL
 *
 *   Their question_attempts are similarly split across both keys.
 *   This causes study history, streak, and readiness score to appear reset.
 *
 * What this script does (in order):
 *   1. DRY RUN by default — prints what would be merged without touching the DB.
 *      Pass --execute to apply changes.
 *   2. Finds all (userId, email) pairs in the users table.
 *   3. For each user, checks whether BOTH an OAuth profile (userId) and an OTP
 *      profile (studentEmail) exist.
 *   4. If both exist, merges them:
 *        a. Combines topicAccuracy (sum correct + total per topic).
 *        b. Takes max(currentStreak), max(longestStreak).
 *        c. Sums totalAttempts and totalSessions (streaks take max — see step 4b).
 *        d. Takes the most recent lastActiveDate.
 *        e. Writes the merged data into the OAuth profile row (userId row).
 *        f. Deletes the OTP profile row (studentEmail row).
 *   5. Re-keys question_attempts: sets userId = <id> and clears studentEmail
 *      for all rows where studentEmail = email AND userId IS NULL.
 *   6. Prints a summary of all changes made.
 *
 * Safety:
 *   - Runs inside a transaction — all-or-nothing per user.
 *   - Dry run by default.
 *   - Idempotent: re-running after a partial failure is safe.
 *
 * Usage:
 *   node scripts/migrate-merge-split-profiles.mjs           # dry run
 *   node scripts/migrate-merge-split-profiles.mjs --execute # apply
 */

import "dotenv/config";
import mysql from "mysql2/promise";

const DRY_RUN = !process.argv.includes("--execute");

if (DRY_RUN) {
  console.log("=== DRY RUN MODE — no changes will be made ===");
  console.log("Pass --execute to apply changes.\n");
} else {
  console.log("=== EXECUTE MODE — changes WILL be written to the database ===\n");
}

const db = await mysql.createConnection(process.env.DATABASE_URL);

// ─── Step 1: Load all users with an email ────────────────────────────────────
const [users] = await db.execute(
  "SELECT id, email FROM users WHERE email IS NOT NULL AND email != ''"
);

console.log(`Found ${users.length} users with email addresses.\n`);

let mergedCount = 0;
let skippedCount = 0;

for (const user of users) {
  const { id: userId, email } = user;
  const normalizedEmail = email.toLowerCase().trim();

  // Load OAuth profile (keyed by userId)
  const [[oauthProfile]] = await db.execute(
    "SELECT * FROM student_profiles WHERE userId = ? LIMIT 1",
    [userId]
  );

  // Load OTP profile (keyed by studentEmail, no userId)
  const [[otpProfile]] = await db.execute(
    "SELECT * FROM student_profiles WHERE studentEmail = ? AND userId IS NULL LIMIT 1",
    [normalizedEmail]
  );

  if (!oauthProfile || !otpProfile) {
    // No split profile for this user — nothing to merge
    skippedCount++;
    continue;
  }

  console.log(`\nMerging profiles for ${normalizedEmail} (userId=${userId}):`);
  console.log(`  OAuth profile id=${oauthProfile.id}, totalAttempts=${oauthProfile.totalAttempts}, streak=${oauthProfile.currentStreak}`);
  console.log(`  OTP   profile id=${otpProfile.id},   totalAttempts=${otpProfile.totalAttempts}, streak=${otpProfile.currentStreak}`);

  // ─── Merge topicAccuracy ────────────────────────────────────────────────────
  let oauthTopics = {};
  let otpTopics = {};
  try { oauthTopics = JSON.parse(oauthProfile.topicAccuracy || "{}"); } catch { /* empty */ }
  try { otpTopics = JSON.parse(otpProfile.topicAccuracy || "{}"); } catch { /* empty */ }

  const mergedTopics = { ...oauthTopics };
  for (const [topic, stats] of Object.entries(otpTopics)) {
    if (mergedTopics[topic]) {
      mergedTopics[topic].correct += stats.correct;
      mergedTopics[topic].total += stats.total;
    } else {
      mergedTopics[topic] = { ...stats };
    }
  }

  // Recompute weak/strong from merged data
  const weakTopics = [];
  const strongTopics = [];
  for (const [t, stats] of Object.entries(mergedTopics)) {
    if (stats.total >= 5) {
      const pct = stats.correct / stats.total;
      if (pct < 0.65) weakTopics.push(t);
      else if (pct >= 0.80) strongTopics.push(t);
    }
  }

  // ─── Merge scalar fields ────────────────────────────────────────────────────
  const mergedCurrentStreak = Math.max(oauthProfile.currentStreak ?? 0, otpProfile.currentStreak ?? 0);
  const mergedLongestStreak = Math.max(oauthProfile.longestStreak ?? 0, otpProfile.longestStreak ?? 0);
  const mergedTotalAttempts = (oauthProfile.totalAttempts ?? 0) + (otpProfile.totalAttempts ?? 0);
  const mergedTotalSessions = (oauthProfile.totalSessions ?? 0) + (otpProfile.totalSessions ?? 0);

  // Take the most recent lastActiveDate
  const oauthDate = oauthProfile.lastActiveDate ?? "0000-00-00";
  const otpDate = otpProfile.lastActiveDate ?? "0000-00-00";
  const mergedLastActiveDate = oauthDate >= otpDate ? oauthDate : otpDate;

  console.log(`  Merged: totalAttempts=${mergedTotalAttempts}, streak=${mergedCurrentStreak}, lastActive=${mergedLastActiveDate}`);
  console.log(`  Topics merged: ${Object.keys(mergedTopics).length} topics`);

  // ─── Count question_attempts rows to re-key ─────────────────────────────────
  const [[{ attemptsCount }]] = await db.execute(
    "SELECT COUNT(*) AS attemptsCount FROM question_attempts WHERE studentEmail = ? AND userId IS NULL",
    [normalizedEmail]
  );
  console.log(`  question_attempts rows to re-key: ${attemptsCount}`);

  if (DRY_RUN) {
    console.log("  [DRY RUN] Would apply merge — skipping.");
    mergedCount++;
    continue;
  }

  // ─── Apply in a transaction ─────────────────────────────────────────────────
  await db.beginTransaction();
  try {
    // 1. Update OAuth profile with merged data
    await db.execute(
      `UPDATE student_profiles SET
        topicAccuracy = ?,
        weakTopics = ?,
        strongTopics = ?,
        currentStreak = ?,
        longestStreak = ?,
        totalAttempts = ?,
        totalSessions = ?,
        lastActiveDate = ?
       WHERE id = ?`,
      [
        JSON.stringify(mergedTopics),
        JSON.stringify(weakTopics),
        JSON.stringify(strongTopics),
        mergedCurrentStreak,
        mergedLongestStreak,
        mergedTotalAttempts,
        mergedTotalSessions,
        mergedLastActiveDate,
        oauthProfile.id,
      ]
    );

    // 2. Re-key question_attempts: set userId, clear studentEmail
    await db.execute(
      `UPDATE question_attempts SET userId = ?, studentEmail = NULL
       WHERE studentEmail = ? AND userId IS NULL`,
      [userId, normalizedEmail]
    );

    // 3. Delete OTP profile row
    await db.execute(
      "DELETE FROM student_profiles WHERE id = ?",
      [otpProfile.id]
    );

    await db.commit();
    console.log(`  ✓ Merged successfully.`);
    mergedCount++;
  } catch (err) {
    await db.rollback();
    console.error(`  ✗ Transaction failed for ${normalizedEmail}:`, err.message);
  }
}

await db.end();

console.log(`\n=== Summary ===`);
console.log(`Users with split profiles found and ${DRY_RUN ? "would be" : "were"} merged: ${mergedCount}`);
console.log(`Users with no split profile (skipped): ${skippedCount}`);
if (DRY_RUN) {
  console.log(`\nRun with --execute to apply these changes.`);
}
