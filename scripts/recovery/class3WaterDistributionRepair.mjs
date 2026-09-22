#!/usr/bin/env node
/** Safe, review-gated repair of the legacy Ontario Class III distribution bank.
 * Plan by default. Apply only after a fresh, exact live-state comparison.
 * This script does not mark new questions approved or overwrite customer data.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { buildCandidateQuestions } from "../../content/class3-water-dist/new-questions-2026-09-22.mjs";

export const BANK = "class3-water-dist";
export const RELEASE = "class3-water-dist-repair-2026-09-22";
// Explicit law/AWWA claims in the September 19 bank plus five unsupported
// numerical technical assertions; all need dated source and scenario review.
export const HELD_REGULATORY = [5, 23, 29, 37, 44, 58, 64, 85, 103, 106, 114, 126, 133, 153, 155, 164, 171, 181, 198, 210, 213, 228, 249, 259, 265, 269, 277, 289, 300, 311, 321, 323, 354, 366, 367, 374, 386, 391, 402, 405, 413, 436, 437, 444, 470];
export const HELD_NUMERIC = Array.from({ length: 71 }, (_, i) => 501 + i);
export const TARGETS = [...new Set([...HELD_REGULATORY, ...HELD_NUMERIC, 308, 447])].sort((a, b) => a - b);

const FIXES = {
  308: { correctIndex: 1, explanation: "Pipe volume = π × (0.300 m / 2)² × 500 m = 35.3429 m³ = 35,343 L. The target residual is irrelevant to the requested pipe volume." },
  447: { correctIndex: 1, explanation: "Average daily demand = 15,000,000 L ÷ 30 days ÷ 1,000 L/m³ = 500 m³/day." },
  508: { question: "A booster pump raises water pressure from 422 kPa at its inlet to 715 kPa at its outlet. It delivers 68 L/s for 10 hours. What hydraulic energy does it add, in kWh, ignoring losses?", answer: "199.2 kWh", explanation: "Hydraulic power = 293,000 Pa × 0.068 m³/s = 19.924 kW; energy over 10 h = 199.24 kWh. This is hydraulic energy, not actual billed electrical consumption." },
  510: { answer: "49.7 m", explanation: "Required water-surface elevation = 114 m + (370 kPa ÷ 9.81 kPa/m) = 151.72 m. Above ground at 102 m, the required level is 49.72 m; friction losses are ignored." },
  513: { question: "Under an ideal volume-over-flow estimate, a 7,100 m³ tank has a continuous 52 L/s throughflow. Is its nominal turnover time less than a stated planning target of 48 hours?", answer: "Yes, expected nominal time is about 38 hours", explanation: "Nominal time = 7,100 m³ ÷ 0.052 m³/s ÷ 3,600 s/h = 37.93 h, less than 48 h. Real tank mixing can make actual water age different." },
  517: { question: "All 5,200 m³ of a zone's daily flow passes through one 250 mm inside-diameter feeder main at a constant average rate. What is the mean velocity in this pipe?", answer: "1.23 m/s", explanation: "Flow = 5,200/86,400 = 0.06019 m³/s; area = π(0.250 m)²/4 = 0.04909 m²; velocity = 1.226 m/s." },
  521: { answer: "38.7 m", explanation: "Area = π(0.600 m)²/4; velocity = 0.900/area = 3.183 m/s. Darcy–Weisbach head loss = 0.018 × (2,500/0.600) × velocity²/(2 × 9.81) = 38.7 m." },
  522: { answer: "52.4 kW", explanation: "Pressure rise = 700 − 120 = 580 kPa. Hydraulic power = 580 kPa × 0.065 m³/s = 37.7 kW; input power = 37.7/0.72 = 52.36 kW." },
  528: { question: "Peak demand is 2,160 m³/h. Each pump can deliver 18 L/s at the required head. How many identical installed pumps are needed to meet peak demand with one pump unavailable?", answer: "35 pumps", explanation: "2,160 m³/h = 600 L/s. Ceiling(600/18) = 34 pumps on duty; add one unavailable/standby unit for 35 installed pumps." },
  529: { answer: "326 mm", explanation: "480 m³/h = 0.13333 m³/s. Diameter = √[4Q/(πv)] = √[4 × 0.13333/(π × 1.6)] = 0.326 m. Choose an actual pipe whose inside diameter is at least this value." },
  540: { answer: "19.0 min", explanation: "One theoretical pipe volume passes in length/velocity = 1,600 m ÷ 1.4 m/s = 1,142.9 s = 19.05 min. This does not establish how long a complete cleaning takes." },
  550: { question: "A reservoir water surface is at elevation 170 m and a customer tap is at 135 m. The design target is 350 kPa residual at that tap. With 9.81 kPa per metre of water, what nonnegative head loss can be allowed between them?", answer: "None; the target cannot be met even with zero loss", explanation: "Static head = 170 − 135 = 35 m, while 350 kPa requires 350/9.81 = 35.68 m. Available head is already 0.68 m short before friction losses." },
  557: { question: "A PRV reduces pressure from 560 to 325 kPa at 215 L/s. Ignoring other losses, what rate of hydraulic energy dissipation corresponds to the pressure drop?", answer: "50.5 kW", explanation: "Pressure drop = 235,000 Pa; flow = 0.215 m³/s; hydraulic power = ΔP × Q = 50,525 W = 50.525 kW." },
  560: { answer: "2,062 m³", explanation: "Cycled volume = π × (25 m/2)² × (9.2 − 5.0) m = 2,061.67 m³, approximately 2,062 m³." },
  561: { answer: "0.53 m", explanation: "Using the stated SI Hazen–Williams form with Q = 0.060 m³/s, L = 450 m, D = 0.350 m and C = 130: h = 10.67 L Q^1.852/(C^1.852 D^4.871) = 0.53 m." },
  570: { question: "A pump delivers 235 L/s against 42 m total dynamic head for 24 hours. Its overall wire-to-water efficiency is 78% and electricity costs $0.11/kWh. Ignoring demand charges, what is the approximate energy cost?", answer: "$327.71", explanation: "Input power = (9.81 kN/m³ × 0.235 m³/s × 42 m)/0.78 = 124.13 kW; cost = 124.13 × 24 × $0.11 ≈ $327.71. The given efficiency is treated as overall wire-to-water efficiency." },
};

function sha(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function optionsOf(row) { return typeof row.options === "string" ? JSON.parse(row.options) : row.options; }
export function fingerprint(row) {
  return sha([row.question, optionsOf(row), Number(row.correctIndex), row.explanation, row.steps ?? null]);
}
function normalizedStem(s) { return s.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function fail(message) { throw new Error(`Class III distribution release blocked: ${message}`); }

export function buildPlan(live, manifest, metadata = null) {
  if (!Array.isArray(live) || live.length !== 571) fail(`expected 571 live rows, got ${live?.length}`);
  if (metadata && (metadata.bankKey !== BANK || Number(metadata.totalQuestions) !== 571)) fail("bank metadata differs from the 571-row baseline");
  if (manifest?.bankKey !== BANK || manifest?.release !== RELEASE || manifest?.targets?.length !== TARGETS.length) fail("invalid manifest");
  const current = new Map();
  for (const row of live) {
    if (row.bankKey !== BANK || !Number.isInteger(Number(row.questionNum)) || current.has(Number(row.questionNum))) fail("duplicate or foreign live row");
    current.set(Number(row.questionNum), row);
  }
  const additions = buildCandidateQuestions();
  const existingStems = new Set([...current.values()].map(row => normalizedStem(row.question)));
  const newStems = new Set();
  for (const item of additions) {
    if (current.has(item.questionNum)) fail(`reserved addition number ${item.questionNum} is occupied`);
    const stem = normalizedStem(item.question);
    if (!stem || existingStems.has(stem) || newStems.has(stem)) fail(`duplicate stem at ${item.questionNum}`);
    newStems.add(stem);
    if (item.reviewStatus !== "in_review" || item.options.length !== 4 || new Set(item.options).size !== 4 || item.options[item.correctIndex] === undefined) fail(`invalid addition ${item.questionNum}`);
  }
  const changes = [];
  for (const num of TARGETS) {
    const row = current.get(num);
    const pinned = manifest.targets.find(item => item.questionNum === num);
    if (!row || !pinned || Number(row.id) !== pinned.id || fingerprint(row) !== pinned.fingerprint) fail(`live row ${num} differs from September 19 baseline; reconcile before applying`);
    if (row.reviewStatus === "rejected") fail(`target row ${num} is rejected in live state; reconcile before applying`);
    const next = { ...row };
    const fix = FIXES[num];
    if (fix) {
      if (fix.question) next.question = fix.question;
      if (fix.correctIndex !== undefined) next.correctIndex = fix.correctIndex;
      if (fix.answer) {
        const options = optionsOf(row);
        options[Number(row.correctIndex)] = fix.answer;
        next.options = options;
      }
      next.explanation = fix.explanation;
      next.steps = null; // Legacy steps contain contradicting and invented arithmetic.
      next.cognitiveLevel = "application";
      next.sourceTitle = "Independent arithmetic check; WPI 2025 Class III topic map";
      next.sourceReference = "Numerical derivation shown in the revised explanation; jurisdictional review pending.";
      next.sourceUrl = "https://gowpi.org/wp-content/uploads/2026/04/WaterDistribution-%E2%80%93-Class-3_mh-fin.pdf";
      next.blueprintObjective = "Distribution system calculation and operational analysis";
    }
    // The two simple corrected-key items stay visible as explicitly unreviewed.
    // The 71 questionable calculation rows and 45 unsourced regulatory or technical-claim rows are held.
    next.reviewStatus = num === 308 || num === 447 ? "unreviewed" : "in_review";
    next.reviewedBy = null; next.reviewedAt = null;
    changes.push({ before: row, after: next });
  }
  const planDigest = sha({ release: RELEASE, metaVersion: metadata?.contentVersion ?? null, baseline: changes.map(x => [x.before.id, fingerprint(x.before), x.before.reviewStatus]), additions: additions.map(x => [x.questionNum, x.question, x.options, x.correctIndex]) });
  return { changes, additions, planDigest, held: TARGETS.length - 2, corrected: Object.keys(FIXES).length };
}

async function run() {
  const args = process.argv.slice(2);
  const manifestPath = args[args.indexOf("--manifest") + 1];
  if (!manifestPath || manifestPath.startsWith("--")) fail("pass --manifest path");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const snapshotIndex = args.indexOf("--snapshot");
  if (snapshotIndex !== -1) {
    const rows = JSON.parse(readFileSync(args[snapshotIndex + 1], "utf8"));
    const plan = buildPlan(rows, manifest);
    console.log(JSON.stringify({ mode: "offline-plan", changes: plan.changes.length, corrected: plan.corrected, held: plan.held, additionsInReview: plan.additions.length, planDigest: plan.planDigest }, null, 2));
    return;
  }
  if (!process.env.DATABASE_URL) fail("DATABASE_URL is required for live plan/apply");
  const mysql = await import("mysql2/promise");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT * FROM `questions` WHERE `bankKey`=? ORDER BY `questionNum` FOR UPDATE", [BANK]);
    const [metas] = await connection.execute("SELECT * FROM `question_bank_meta` WHERE `bankKey`=? FOR UPDATE", [BANK]);
    if (metas.length !== 1) fail("expected one bank metadata row");
    const plan = buildPlan(rows, manifest, metas[0]);
    console.log(JSON.stringify({ mode: args.includes("--apply") ? "apply-requested" : "live-plan", changes: plan.changes.length, corrected: plan.corrected, held: plan.held, additionsInReview: plan.additions.length, planDigest: plan.planDigest }, null, 2));
    if (!args.includes("--apply")) { await connection.rollback(); return; }
    if (process.env.CONFIRM_CLASS3_DISTRIBUTION_REPAIR !== plan.planDigest) fail("confirmation digest does not match this exact live plan");
    if (!process.env.CLASS3_REPAIR_BACKUP_EVIDENCE?.trim()) fail("documented production backup evidence is required");
    for (const { before, after } of plan.changes) {
      const beforeImage = Object.fromEntries(["bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus", "reviewedBy", "reviewedAt"].map(key => [key, before[key] ?? null]));
      const [captured] = await connection.execute("INSERT INTO `question_content_snapshots` (`releaseKey`,`bankKey`,`questionId`,`questionNum`,`sourceContentVersion`,`contentHash`,`payload`) VALUES (?,?,?,?,?,?,?)", [RELEASE, BANK, before.id, before.questionNum, Number(metas[0].contentVersion), sha(beforeImage), JSON.stringify(beforeImage)]);
      if (captured.affectedRows !== 1) fail(`before-image capture failed at ${before.questionNum}`);
      const [res] = await connection.execute("UPDATE `questions` SET `question`=?,`options`=?,`correctIndex`=?,`explanation`=?,`steps`=?,`cognitiveLevel`=?,`sourceTitle`=?,`sourceReference`=?,`sourceUrl`=?,`blueprintObjective`=?,`reviewStatus`=?,`reviewedBy`=NULL,`reviewedAt`=NULL WHERE `id`=? AND `bankKey`=? AND `questionNum`=?", [after.question, JSON.stringify(optionsOf(after)), after.correctIndex, after.explanation, after.steps, after.cognitiveLevel, after.sourceTitle, after.sourceReference, after.sourceUrl, after.blueprintObjective, after.reviewStatus, before.id, BANK, before.questionNum]);
      if (res.affectedRows !== 1) fail(`update failed at ${before.questionNum}`);
    }
    const fields = ["bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex", "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle", "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus", "reviewedBy", "reviewedAt"];
    const sql = `INSERT INTO \`questions\` (${fields.map(x => `\`${x}\``).join(",")}) VALUES (${fields.map(() => "?").join(",")})`;
    for (const item of plan.additions) {
      const values = fields.map(field => field === "options" ? JSON.stringify(item.options) : item[field] ?? null);
      await connection.execute(sql, values);
    }
    const [metaUpdate] = await connection.execute("UPDATE `question_bank_meta` SET `totalQuestions`=821,`contentVersion`=`contentVersion`+1 WHERE `bankKey`=? AND `totalQuestions`=571 AND `contentVersion`=?", [BANK, metas[0].contentVersion]);
    if (metaUpdate.affectedRows !== 1) fail("bank metadata update failed");
    const [check] = await connection.execute("SELECT COUNT(*) AS n, SUM(`reviewStatus`='in_review') AS held FROM `questions` WHERE `bankKey`=?", [BANK]);
    if (Number(check[0]?.n) !== 821 || Number(check[0]?.held) < 366) fail("post-write question count or review hold mismatch");
    await connection.commit();
    console.log("Committed 250 in-review additions and the verified repair/hold batch.");
  } catch (error) { await connection.rollback(); throw error; }
  finally { await connection.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await run();
