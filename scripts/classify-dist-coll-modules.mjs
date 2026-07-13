/**
 * classify-dist-coll-modules.mjs
 *
 * Re-tags Ontario water distribution and wastewater collection questions
 * with official exam module labels from the OWWCO/ABC Need-to-Know documents.
 *
 * WATER DISTRIBUTION modules (Ontario NTK July 2004):
 *   - "General" (Math, Safety, Applied Science)
 *   - "Support Systems" (Pumps, Motors, Pipes, Valves, Controls, Hydrants)
 *   - "Processes" (Conveyance, Storage, Disinfection, Sampling, Leak Detection, etc.)
 *   - "Administration" (Management, Reporting, Emergency Response)
 *
 * WASTEWATER COLLECTION modules (ABC NTK 2008):
 *   - "Operate Equipment"
 *   - "Evaluate & Maintain Equipment"
 *   - "Maintain & Restore Collection System"
 *   - "Maintain Lift Stations"
 *   - "Monitor, Evaluate & Adjust Collection System"
 *   - "Security, Safety & Administrative Procedures"
 *
 * Usage: node scripts/classify-dist-coll-modules.mjs [--bank <bankKey>] [--dry-run]
 */

import mysql from "mysql2/promise";
import { readFileSync } from "fs";

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const DATABASE_URL  = process.env.DATABASE_URL;

const DRY_RUN   = process.argv.includes("--dry-run");
const BANK_FILTER = (() => {
  const idx = process.argv.indexOf("--bank");
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

// ─── MODULE DEFINITIONS ──────────────────────────────────────────────────────

const WD_MODULES = [
  "General",
  "Support Systems",
  "Processes",
  "Administration",
];

const WD_SYSTEM_PROMPT = `You are an expert Ontario water distribution operator certification exam classifier.

Your job is to classify each exam question into exactly one of these 4 official Ontario Water Distribution exam modules:

1. "General" — Basic & applied math, units of expression, applied science, public health principles, electrical concepts, hydraulic concepts, maps & plans, safety procedures, WHMIS, first aid.

2. "Support Systems" — Electrical controls, transformers, battery banks, motors, drives, pumps (centrifugal, positive displacement, turbine, metering), generators, engines, pipes, joints, valves, fittings, cathodic protection, hydrants, measuring & control systems, cross-connection & backflow prevention devices.

3. "Processes" — Sources & characteristics, quality control & assurance, compliance, conveyance, pressure control, storage (reservoirs, tanks, towers), corrosion control, metering, leak detection, excavation & repair, repair inspection, temporary service, fire flow, swabbing, flushing systems, chlorination of pipe repairs, thawing, sampling, testing (chlorine residual, pH, temperature).

4. "Administration" — Management, supervision, finance, communication, site security, information systems, emergency response, regulatory reporting, record keeping.

Respond with ONLY a JSON array of objects, one per question, in the same order as input:
[{"id": <question_id>, "module": "<module_name>"}, ...]

No explanation, no markdown, just the JSON array.`;

const WWC_MODULES = [
  "Operate Equipment",
  "Evaluate & Maintain Equipment",
  "Maintain & Restore Collection System",
  "Maintain Lift Stations",
  "Monitor, Evaluate & Adjust Collection System",
  "Security, Safety & Administrative Procedures",
];

const WWC_SYSTEM_PROMPT = `You are an expert wastewater collection operator certification exam classifier.

Your job is to classify each exam question into exactly one of these 6 official ABC/Ontario Wastewater Collection exam modules:

1. "Operate Equipment" — Operating pumps, motors, flow monitoring equipment, safety equipment, SCADA controls, instrumentation, telemetry, generators, blowers, compressors.

2. "Evaluate & Maintain Equipment" — Evaluating and maintaining pumps, motors, inspection equipment (CCTV, vacuum testing, pressure testing), safety equipment, preventive and corrective maintenance, troubleshooting equipment failures.

3. "Maintain & Restore Collection System" — Cleaning and maintaining sewer lines (hydraulic cleaning, balling, flushing, poly pigging), physical inspection, sewer line repair and rehabilitation, pipe fittings and joining methods, excavation and repair, trenchless rehabilitation.

4. "Maintain Lift Stations" — Lift station operation, wet well management, lift station piping and fittings, valve operation, wet well cleaning, lift station maintenance, force main operation, emergency bypass pumping.

5. "Monitor, Evaluate & Adjust Collection System" — Flow monitoring, hydraulic analysis, inflow & infiltration (I/I) identification and control, sewer system evaluation surveys (SSES), overflow monitoring, combined sewer overflow (CSO) management, collection system performance evaluation, water quality monitoring, regulatory compliance monitoring.

6. "Security, Safety & Administrative Procedures" — Safety procedures, confined space entry, traffic control, WHMIS, personal protective equipment, emergency response, spill response, regulatory reporting, record keeping, permit-to-work systems, public communications.

Respond with ONLY a JSON array of objects, one per question, in the same order as input:
[{"id": <question_id>, "module": "<module_name>"}, ...]

No explanation, no markdown, just the JSON array.`;

// ─── BANKS TO PROCESS ────────────────────────────────────────────────────────

const BANKS = [
  { key: "class1-water-dist",       type: "WD",  modules: WD_MODULES,  systemPrompt: WD_SYSTEM_PROMPT  },
  { key: "class2-water-dist",       type: "WD",  modules: WD_MODULES,  systemPrompt: WD_SYSTEM_PROMPT  },
  { key: "class3-water-dist",       type: "WD",  modules: WD_MODULES,  systemPrompt: WD_SYSTEM_PROMPT  },
  { key: "class4-water-dist",       type: "WD",  modules: WD_MODULES,  systemPrompt: WD_SYSTEM_PROMPT  },
  { key: "class1-wastewater-coll",  type: "WWC", modules: WWC_MODULES, systemPrompt: WWC_SYSTEM_PROMPT },
  { key: "class2-wastewater-coll",  type: "WWC", modules: WWC_MODULES, systemPrompt: WWC_SYSTEM_PROMPT },
  { key: "class3-wastewater-coll",  type: "WWC", modules: WWC_MODULES, systemPrompt: WWC_SYSTEM_PROMPT },
  { key: "class4-wastewater-coll",  type: "WWC", modules: WWC_MODULES, systemPrompt: WWC_SYSTEM_PROMPT },
].filter(b => !BANK_FILTER || b.key === BANK_FILTER);

// ─── LLM HELPER ──────────────────────────────────────────────────────────────

async function classifyBatch(questions, systemPrompt, modules) {
  const userContent = questions.map(q => {
    let opts = [];
    try { opts = JSON.parse(q.options); } catch {}
    return `ID ${q.id}: ${q.question}\nOptions: ${opts.join(" | ")}`;
  }).join("\n\n");

  const response = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userContent },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Parse — handle both array and {results: [...]} shapes
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`JSON parse failed: ${content.slice(0, 200)}`);
  }

  if (Array.isArray(parsed)) return parsed;
  // Find the first array value
  const arr = Object.values(parsed).find(v => Array.isArray(v));
  if (arr) return arr;
  throw new Error(`Unexpected LLM response shape: ${content.slice(0, 200)}`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);

  for (const bank of BANKS) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Processing: ${bank.key}`);
    console.log(`${"=".repeat(60)}`);

    // Fetch all questions for this bank
    const [questions] = await conn.execute(
      `SELECT id, question, options FROM questions WHERE bankKey = ? ORDER BY id`,
      [bank.key]
    );

    console.log(`  ${questions.length} questions to classify`);

    const BATCH_SIZE = 25;
    const updates = [];
    let batchNum = 0;

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      batchNum++;
      process.stdout.write(`  Batch ${batchNum}/${Math.ceil(questions.length / BATCH_SIZE)} (q${i+1}-${Math.min(i+BATCH_SIZE, questions.length)})... `);

      let results;
      let retries = 0;
      while (retries < 3) {
        try {
          results = await classifyBatch(batch, bank.systemPrompt, bank.modules);
          break;
        } catch (err) {
          retries++;
          if (retries >= 3) throw err;
          console.log(`\n  Retry ${retries} after error: ${err.message}`);
          await new Promise(r => setTimeout(r, 2000 * retries));
        }
      }

      // Validate results
      for (const r of results) {
        if (!bank.modules.includes(r.module)) {
          // Try to find closest match
          const closest = bank.modules.find(m => m.toLowerCase().includes(r.module.toLowerCase().split(" ")[0]));
          if (closest) {
            console.log(`\n  ⚠️  Remapped "${r.module}" → "${closest}" for q${r.id}`);
            r.module = closest;
          } else {
            console.log(`\n  ⚠️  Unknown module "${r.module}" for q${r.id}, using first module`);
            r.module = bank.modules[0];
          }
        }
        updates.push({ id: r.id, module: r.module });
      }

      console.log(`✓`);

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    }

    // Tally distribution
    const dist = {};
    for (const u of updates) {
      dist[u.module] = (dist[u.module] || 0) + 1;
    }
    console.log(`\n  Module distribution:`);
    for (const [mod, cnt] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
      const pct = ((cnt / questions.length) * 100).toFixed(1);
      console.log(`    ${cnt.toString().padStart(3)} (${pct.padStart(5)}%)  ${mod}`);
    }

    if (DRY_RUN) {
      console.log(`\n  [DRY RUN] Skipping DB updates`);
      continue;
    }

    // Apply updates in batches of 100
    console.log(`\n  Applying ${updates.length} DB updates...`);
    for (let i = 0; i < updates.length; i += 100) {
      const chunk = updates.slice(i, i + 100);
      // Build a CASE statement for efficient bulk update
      const ids = chunk.map(u => u.id);
      const cases = chunk.map(u => `WHEN ${u.id} THEN ?`).join(" ");
      const values = chunk.map(u => u.module);
      await conn.execute(
        `UPDATE questions SET module = CASE id ${cases} END WHERE id IN (${ids.join(",")})`,
        values
      );
    }
    console.log(`  ✅ Done!`);
  }

  await conn.end();
  console.log(`\n${"=".repeat(60)}`);
  console.log(`All banks processed!`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
