import { createHash } from "node:crypto";
import { ontarioMathGuide } from "../../server/content/ontarioMathGuide.mjs";
export const mathGuideSlug = ontarioMathGuide.slug;
export const repairFields = ["title", "excerpt", "content", "metaTitle", "metaDescription", "readingTimeMinutes"];
export const articleFingerprint = row => createHash("sha256").update(JSON.stringify(
  [row.id, row.slug, ...repairFields.map(field => row[field]), row.updatedAt],
)).digest("hex");
export function planMathGuideRepair(rows) {
  if (rows.length !== 1 || rows[0].slug !== mathGuideSlug) throw new Error("Expected exactly the math-guide article; refusing repair");
  const row = rows[0];
  return { id: row.id, slug: row.slug, beforeSha256: articleFingerprint(row),
    changedFields: repairFields.filter(field => row[field] !== ontarioMathGuide[field]) };
}
// Caller supplies a durable backup writer. No article changes until backup succeeds.
export async function applyMathGuideRepair(connection, expectedHash, writeBackup) {
  if (!/^[a-f0-9]{64}$/.test(expectedHash ?? "")) throw new Error("A reviewed dry-run SHA-256 is required");
  await connection.beginTransaction();
  try {
    const [rows] = await connection.execute("SELECT * FROM blog_posts WHERE slug = ? FOR UPDATE", [mathGuideSlug]);
    const plan = planMathGuideRepair(rows);
    if (!plan.changedFields.length) { await connection.commit(); return { ...plan, applied: false }; }
    if (plan.beforeSha256 !== expectedHash) throw new Error("Article changed since dry-run; review a fresh dry-run");
    await writeBackup(rows[0]);
    const [result] = await connection.execute(
      `UPDATE blog_posts SET ${repairFields.map(field => `\`${field}\` = ?`).join(", ")}, updatedAt = NOW() WHERE id = ? AND slug = ?`,
      [...repairFields.map(field => ontarioMathGuide[field]), plan.id, mathGuideSlug]);
    if (result.affectedRows !== 1) throw new Error("Expected exactly one updated article");
    const [after] = await connection.execute("SELECT * FROM blog_posts WHERE id = ? AND slug = ?", [plan.id, mathGuideSlug]);
    if (planMathGuideRepair(after).changedFields.length) throw new Error("Article verification failed");
    await connection.commit();
    return { ...plan, applied: true };
  } catch (error) { await connection.rollback(); throw error; }
}
