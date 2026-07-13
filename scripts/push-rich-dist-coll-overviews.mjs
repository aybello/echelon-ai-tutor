#!/usr/bin/env node
/**
 * push-rich-dist-coll-overviews.mjs
 *
 * Replaces the thin keyTopics-only module overviews for all Ontario
 * Water Distribution and Wastewater Collection banks with rich
 * keyPoints / formulas / examTips content.
 *
 * Run from project root:
 *   node scripts/push-rich-dist-coll-overviews.mjs
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import {
  WD_OVERVIEWS_CLASS1,
  WD_OVERVIEWS_CLASS2,
  WD_OVERVIEWS_CLASS3,
  WD_OVERVIEWS_CLASS4,
  WWC_OVERVIEWS_CLASS1,
  WWC_OVERVIEWS_CLASS2,
  WWC_OVERVIEWS_CLASS3,
  WWC_OVERVIEWS_CLASS4,
} from "./dist-coll-overviews-data.mjs";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const BANK_OVERVIEWS = {
  "class1-water-dist":      WD_OVERVIEWS_CLASS1,
  "class2-water-dist":      WD_OVERVIEWS_CLASS2,
  "class3-water-dist":      WD_OVERVIEWS_CLASS3,
  "class4-water-dist":      WD_OVERVIEWS_CLASS4,
  "class1-wastewater-coll": WWC_OVERVIEWS_CLASS1,
  "class2-wastewater-coll": WWC_OVERVIEWS_CLASS2,
  "class3-wastewater-coll": WWC_OVERVIEWS_CLASS3,
  "class4-wastewater-coll": WWC_OVERVIEWS_CLASS4,
};

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Connected to database.\n");

  for (const [bankKey, overviews] of Object.entries(BANK_OVERVIEWS)) {
    const overviewsJson = JSON.stringify(overviews);
    const moduleCount = Object.keys(overviews).length;

    const [result] = await conn.execute(
      `UPDATE module_overviews SET overviewsJson = ? WHERE bankKey = ?`,
      [overviewsJson, bankKey]
    );

    if (result.affectedRows === 0) {
      await conn.execute(
        `INSERT INTO module_overviews (bankKey, overviewsJson) VALUES (?, ?)`,
        [bankKey, overviewsJson]
      );
      console.log(`✅ Inserted  ${bankKey}  (${moduleCount} modules)`);
    } else {
      console.log(`✅ Updated   ${bankKey}  (${moduleCount} modules)`);
    }
  }

  await conn.end();
  console.log("\n🎉 All dist/coll module overviews updated with rich content!");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
