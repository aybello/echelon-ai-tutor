import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.log("DB unavailable"); return; }
  const rows = await db.execute(sql`SELECT studentEmail, examType, examDate FROM exam_dates ORDER BY examDate ASC`);
  console.log("EXAM DATES:", JSON.stringify(rows[0]));
}
main().catch(console.error);
