#!/usr/bin/env node
import "dotenv/config";
import mysql from "mysql2/promise";
import { open } from "node:fs/promises";
import { parseArgs } from "node:util";
import { applyMathGuideRepair, mathGuideSlug, planMathGuideRepair } from "./lib/mathGuideRepair.mjs";
const { values } = parseArgs({ options: {
  apply: { type: "boolean", default: false },
  "expected-sha256": { type: "string" }, "backup-file": { type: "string" },
} });
if (values.apply && (!values["backup-file"] || !values["expected-sha256"])) {
  throw new Error("--apply requires --expected-sha256 from a reviewed dry-run and a new --backup-file path");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const result = values.apply
    ? await applyMathGuideRepair(db, values["expected-sha256"], async row => {
      const backup = await open(values["backup-file"], "wx", 0o600);
      try { await backup.writeFile(JSON.stringify({ savedAt: new Date().toISOString(), row }, null, 2)); await backup.sync(); }
      finally { await backup.close(); }
    })
    : planMathGuideRepair((await db.execute("SELECT * FROM blog_posts WHERE slug = ?", [mathGuideSlug]))[0]);
  console.log(JSON.stringify({ mode: values.apply ? "apply" : "dry-run", ...result }, null, 2));
} finally { await db.end(); }
