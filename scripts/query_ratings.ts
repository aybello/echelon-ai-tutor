import { getDb } from "../server/db";
import { userFeedback } from "../drizzle/schema";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.log("DB unavailable"); return; }
  const rows = await db.execute(sql`SELECT rating, COUNT(*) as cnt FROM user_feedback GROUP BY rating ORDER BY rating DESC`);
  console.log("RATINGS:", JSON.stringify(rows));
}
main().catch(console.error);
