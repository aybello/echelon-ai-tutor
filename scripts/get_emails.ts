import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.log("DB unavailable"); return; }
  
  // Get all unique emails from users table
  const users = await db.execute(sql`SELECT DISTINCT email, name FROM users WHERE email IS NOT NULL ORDER BY email`);
  console.log("USERS:", JSON.stringify(users[0]));
  
  // Get all unique emails from question_attempts
  const attempts = await db.execute(sql`SELECT DISTINCT studentEmail FROM question_attempts WHERE studentEmail IS NOT NULL ORDER BY studentEmail`);
  console.log("ATTEMPT_EMAILS:", JSON.stringify(attempts[0]));
}
main().catch(console.error);
