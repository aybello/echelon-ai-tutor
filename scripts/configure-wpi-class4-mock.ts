import "dotenv/config";
import mysql from "mysql2/promise";
import { open } from "node:fs/promises";
import { parseArgs } from "node:util";
import { planWpiBlueprintRelease, applyWpiBlueprintRelease } from "../server/wpiBlueprintRelease";
import { WPI_CLASS4_BANK, WPI_CLASS4_SOURCE } from "../server/mockBlueprint";
const { values } = parseArgs({ options: { apply: { type: "boolean", default: false },
  "expected-sha256": { type: "string" }, "backup-file": { type: "string" }, "edition-evidence": { type: "string" } } });
if (values.apply && (!values["expected-sha256"] || !values["backup-file"] || !values["edition-evidence"]?.trim())) {
  throw new Error("Apply requires reviewed --expected-sha256, new private --backup-file and --edition-evidence documenting certifying-authority confirmation of WPI standardized 2025 adoption");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  let result;
  if (values.apply) {
    result = await applyWpiBlueprintRelease(db, values["expected-sha256"]!, async snapshot => {
      const backup = await open(values["backup-file"]!, "wx", 0o600);
      try { await backup.writeFile(JSON.stringify({ savedAt: new Date().toISOString(), source: WPI_CLASS4_SOURCE, editionEvidence: values["edition-evidence"], snapshot }, null, 2)); await backup.sync(); }
      finally { await backup.close(); }
    });
  } else {
    // Consistent read-only snapshot; concurrent edits invalidate the later apply hash.
    await db.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
    try {
      const [meta] = await db.execute<any[]>("SELECT * FROM question_bank_meta WHERE bankKey = ?", [WPI_CLASS4_BANK]);
      const [rows] = await db.execute<any[]>("SELECT * FROM questions WHERE bankKey = ? ORDER BY questionNum", [WPI_CLASS4_BANK]);
      if (meta.length !== 1) throw new Error("Expected one bank metadata row");
      result = planWpiBlueprintRelease(meta[0], rows);
    } finally { await db.rollback(); }
  }
  console.log(JSON.stringify({ mode: values.apply ? "apply" : "dry-run", source: WPI_CLASS4_SOURCE, ...result }, null, 2));
  if (!result.canActivate) process.exitCode = 1;
} finally { await db.end(); }
