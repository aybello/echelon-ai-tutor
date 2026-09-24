#!/usr/bin/env node
/**
 * Read-only classifier for restoring detailed Ontario Water Treatment and
 * Wastewater Treatment modules. It never writes to the database.
 *
 * Usage:
 *   node scripts/recovery/classifyOntarioTreatmentModules.mjs [--bank <bankKey>] [--sample <count>]
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import mysql from "mysql2/promise";
import {
  ONTARIO_TREATMENT_BANK_KEYS,
  ONTARIO_TREATMENT_MODULE_PROFILES,
  preservedRowHash,
} from "../lib/ontarioTreatmentModuleRestoration.mjs";
import { authoritativeProductionConnectionOptions } from "./releaseClass3ApprovedCandidates.mjs";

const MODEL = "gpt-6-astra";
const RELEASE_KEY = "ontario-treatment-module-restoration-2026-09-24";
const PRIVATE_ROOT = "/home/ubuntu/private/echelon-authoritative-recovery/ontario-treatment-module-restoration-2026-09-24";
const OUTPUT_PATH = `${PRIVATE_ROOT}/ontario-treatment-module-classification.json`;
const BATCH_SIZE = 25;
const SAMPLE_ARG = process.argv.indexOf("--sample");
const BANK_ARG = process.argv.indexOf("--bank");
const sampleCount = SAMPLE_ARG === -1 ? null : Number(process.argv[SAMPLE_ARG + 1]);
const requestedBank = BANK_ARG === -1 ? null : process.argv[BANK_ARG + 1];

if ((SAMPLE_ARG !== -1 && (!Number.isInteger(sampleCount) || sampleCount < 1 || sampleCount > BATCH_SIZE))
  || (BANK_ARG !== -1 && !requestedBank)
  || process.argv.some((arg, index) => arg === "--sample" && index === SAMPLE_ARG && index + 1 >= process.argv.length)
  || process.argv.some((arg, index) => arg === "--bank" && index === BANK_ARG && index + 1 >= process.argv.length)) {
  throw new Error("Usage: node scripts/recovery/classifyOntarioTreatmentModules.mjs [--bank <bankKey>] [--sample <1-25>]");
}
if (requestedBank && !ONTARIO_TREATMENT_BANK_KEYS.includes(requestedBank)) {
  throw new Error(`Unsupported treatment bank ${JSON.stringify(requestedBank)}.`);
}

const bankKeys = requestedBank ? [requestedBank] : [...ONTARIO_TREATMENT_BANK_KEYS];

const MODULE_SCOPE_GUIDANCE = Object.freeze({
  "class1-wastewater": Object.freeze({
    "Wastewater Characteristics & Preliminary Treatment": "Wastewater constituents, flow, loading, screening, comminution, grit removal, equalization and preliminary-treatment purpose or equipment.",
    "Primary Treatment": "Primary clarifiers, sedimentation, primary sludge, scum, settling performance and primary-treatment operation.",
    "Secondary Treatment": "Biological treatment other than nutrient removal, including activated sludge, aeration, secondary clarifiers, trickling filters, RBCs, biomass and process control.",
    "Biological Nutrient Removal": "Nitrogen and phosphorus removal, nitrification, denitrification, anoxic or anaerobic zones, nutrient chemistry and nutrient-process control.",
    "Tertiary Treatment & Filtration": "Polishing, advanced filtration, membranes, tertiary clarification and tertiary effluent quality.",
    "Disinfection": "Chlorine, UV, ozone, contact time, residuals, dechlorination and disinfection monitoring or safety.",
    "Solids Handling & Biosolids": "Sludge thickening, digestion, dewatering, stabilization, biosolids handling, hauling and disposal or beneficial use.",
    "Regulations, Safety & Operations": "Operator duties, compliance, reporting, permits, laboratory records, safety, emergency response, WHMIS and plant operations management.",
    "Wastewater Collection": "Sewers, lift stations, force mains, inflow and infiltration, collection maintenance, CCTV, cleaning and collection-system hydraulics.",
  }),
  "class2-water": Object.freeze({
    "Treatment Process": "Coagulation, flocculation, sedimentation, filtration, disinfection, chemical treatment and treatment-process operation or control.",
    "Source Water Characteristics": "Watersheds, groundwater or surface-water sources, raw-water quality, contamination, water chemistry and source assessment or protection.",
    "Equipment Operation & Maintenance": "Pumps, motors, valves, chemical-feed equipment, controls, instrumentation, troubleshooting and preventive maintenance.",
    "Laboratory Analysis": "Sampling, lab procedures, analytical methods, QA/QC, interpreting test results and operational laboratory control.",
    "Security, Safety & Administrative": "Safety, security, emergency response, regulations, reporting, records, supervision and administrative requirements.",
    "Water Distribution": "Distribution pipes, storage, pressure, hydrants, cross-connections, leak detection, flushing and distribution-system operation.",
  }),
  "class3-water": Object.freeze({
    "Treatment Process": "Coagulation, flocculation, clarification, filtration, disinfection, chemical treatment and process optimization or control.",
    "Laboratory Analysis": "Sampling, laboratory methods, QA/QC, analytical interpretation and process-control testing.",
    "Equipment O&M": "Pumps, motors, electrical or mechanical systems, instrumentation, controls, maintenance planning and troubleshooting.",
    "Source Water Characteristics": "Raw-water sources, watershed factors, water chemistry, contamination, source protection and source-quality evaluation.",
    "Security, Safety & Admin": "Regulatory compliance, safety, security, emergency response, management, records, communication and supervision.",
    "Water Distribution": "Pipes, storage, pressure, hydrants, cross-connections, repairs, leak control, flushing and distribution operation.",
  }),
  "class4-water": Object.freeze({
    "Treatment Process": "Core treatment-process operation and control, including coagulation, clarification, filtration and disinfection.",
    "Equipment O&M": "Mechanical, electrical, pumping, chemical-feed, instrumentation, controls and maintenance systems.",
    "Hydraulics": "Flow, head, pressure, pump curves, pipe hydraulics, detention time and hydraulic calculations.",
    "Regulations & Management": "Regulatory compliance, permits, reporting, finance, administration, policy, management and staffing.",
    "Water Quality": "Water chemistry, microbiology, contaminants, sampling interpretation, aesthetics and quality objectives.",
    "Math & Calculations": "General calculations, unit conversions, dosage, loading, volume, concentration or other math where calculation is the primary skill.",
    "Source Water Protection": "Watershed protection, risk assessment, source vulnerability, land use and protection planning.",
    "Plant Management": "Asset management, planning, budgeting, staffing, supervision, procurement and operational management.",
    "Emergency Response": "Emergency planning, incidents, contingencies, public communication and response to abnormal events.",
    "Advanced Treatment": "Membranes, adsorption, ion exchange, advanced oxidation, softening and other advanced treatment processes.",
    "Lab Analysis": "Laboratory sampling, analytical methods, QA/QC and laboratory-result interpretation.",
    "Safety": "Worker safety, confined space, lockout, chemical safety, PPE, WHMIS and safe-work procedures.",
    "Water Distribution": "Distribution-system pipes, storage, pressure, hydrants, cross-connections and distribution operations.",
  }),
  "class2-wastewater": Object.freeze({
    "Treatment Process": "Primary and secondary treatment, aeration, clarification, process control, nutrient removal and disinfection at the treatment plant.",
    "Collection Systems": "Sewers, lift stations, force mains, inflow and infiltration, cleaning, inspection and collection-system maintenance.",
    "Laboratory Analysis": "Sampling, laboratory methods, QA/QC, analytical interpretation and process-control testing.",
    "Safety & Administration": "Safety, regulatory compliance, reporting, records, security, emergency response and administration.",
    "Equipment O&M": "Pumps, motors, blowers, valves, controls, instrumentation, maintenance and equipment troubleshooting.",
  }),
  "class3-wastewater": Object.freeze({
    "Equipment Evaluation & Maintenance": "Condition assessment, preventive maintenance, repair planning, reliability and evaluating equipment performance.",
    "Equipment Operation": "Operating pumps, blowers, valves, controls, instrumentation and plant equipment under normal or abnormal conditions.",
    "Laboratory Analysis": "Sampling, analytical procedures, QA/QC, lab-result interpretation and process-control tests.",
    "Security, Safety & Admin": "Safety, security, compliance, reporting, supervision, records, communication and emergency procedures.",
    "Treatment Process Monitoring": "Monitoring and adjusting biological, solids, nutrient, clarification, disinfection or other treatment processes.",
    "Wastewater Collection": "Sewers, lift stations, force mains, collection maintenance, infiltration and inflow and collection-system monitoring.",
  }),
  "class4-wastewater": Object.freeze({
    "Advanced Treatment Process Monitoring": "Advanced biological or physical-chemical treatment monitoring, optimization, nutrient removal, filtration, disinfection and complex process control.",
    "Equipment Operation & Maintenance": "Operating, maintaining, troubleshooting or evaluating mechanical, electrical, pumping, blower, control and instrumentation equipment.",
    "Laboratory Analysis & Interpretation": "Sampling, laboratory QA/QC, analytical methods, data interpretation and using results for process decisions.",
    "Biosolids Management & Regulations": "Sludge or biosolids treatment, handling, disposal, beneficial use and biosolids-specific regulatory requirements.",
    "Plant Management, Safety & Administration": "Management, finance, staffing, compliance, records, safety, emergency response, communication and administration.",
    "Wastewater Collection": "Sewer collection systems, lift stations, force mains, maintenance, I/I, overflows and collection-system operations.",
  }),
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fail(message) {
  throw new Error(`Ontario treatment module classification blocked: ${message}`);
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function parseOptions(raw, questionNum) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === "string")) throw new Error("not a string array");
    return parsed;
  } catch {
    fail(`Question ${questionNum} has malformed options.`);
  }
}

function questionPayload(question) {
  return [
    `Question number: ${question.questionNum}`,
    `Question: ${question.question}`,
    `Options: ${parseOptions(question.options, question.questionNum).map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join(" | ")}`,
    `Explanation: ${question.explanation}`,
    `Difficulty: ${question.difficulty ?? "unspecified"}; Calculation: ${question.isCalc ?? "no"}; Cognitive level: ${question.cognitiveLevel ?? "unspecified"}`,
  ].join("\n");
}

function classifierPrompt(bankKey, modules) {
  const courseName = bankKey.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return [
    "You are classifying existing Ontario operator-certification practice questions for navigation only.",
    `Course bank: ${courseName}.`,
    "Assign every question to exactly one existing detailed module. Do not assess, edit, rewrite, correct, or explain the educational content. Use the question, choices and explanation solely to identify its primary learning objective.",
    "For questions covering more than one subject, choose the module that best represents the skill or process the learner must know to answer it. Use the exact label spelling below. Do not invent labels.",
    "Detailed modules:",
    ...modules.map((module, index) => `${index + 1}. ${module} — ${MODULE_SCOPE_GUIDANCE[bankKey]?.[module] ?? "Use the module label's primary subject."}`),
    "Return JSON only, matching the schema. Keep each rationale concise and factual. Confidence is an integer from 0 to 100.",
  ].join("\n");
}

async function classifyBatch(bankKey, modules, questions) {
  const payload = {
    model: MODEL,
    messages: [
      { role: "system", content: classifierPrompt(bankKey, modules) },
      { role: "user", content: questions.map(questionPayload).join("\n\n---\n\n") },
    ],
    max_completion_tokens: 5000,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ontario_treatment_module_classification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            classifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  questionNum: { type: "integer" },
                  module: { type: "string" },
                  confidence: { type: "integer" },
                  rationale: { type: "string" },
                },
                required: ["questionNum", "module", "confidence", "rationale"],
                additionalProperties: false,
              },
            },
          },
          required: ["classifications"],
          additionalProperties: false,
        },
      },
    },
  };

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      const body = await response.text();
      if (!response.ok) throw new Error(`OpenAI ${response.status}: ${body.slice(0, 600)}`);
      const parsed = JSON.parse(body);
      const content = parsed?.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw new Error("OpenAI response did not contain text content.");
      const result = JSON.parse(content);
      if (!Array.isArray(result?.classifications)) throw new Error("OpenAI response did not contain classifications.");
      return result.classifications;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(1000 * attempt * attempt);
    }
  }
  throw lastError;
}

function validateBatch(questions, modules, classifications) {
  if (classifications.length !== questions.length) {
    fail(`Classifier returned ${classifications.length} rows for a ${questions.length}-question batch.`);
  }
  const expected = new Set(questions.map((question) => Number(question.questionNum)));
  const result = new Map();
  for (const classification of classifications) {
    const questionNum = Number(classification.questionNum);
    if (!Number.isInteger(questionNum) || !expected.has(questionNum) || result.has(questionNum)) {
      fail(`Classifier returned an invalid or duplicate question number ${classification.questionNum}.`);
    }
    if (!modules.includes(classification.module)) fail(`Classifier returned unsupported module ${JSON.stringify(classification.module)}.`);
    if (!Number.isInteger(classification.confidence) || classification.confidence < 0 || classification.confidence > 100) {
      fail(`Classifier returned invalid confidence for question ${questionNum}.`);
    }
    if (typeof classification.rationale !== "string" || classification.rationale.trim().length < 3) {
      fail(`Classifier returned an empty rationale for question ${questionNum}.`);
    }
    result.set(questionNum, {
      questionNum,
      module: classification.module,
      confidence: classification.confidence,
      rationale: classification.rationale.trim(),
    });
  }
  if (result.size !== expected.size) fail("Classifier did not return each input question exactly once.");
  return result;
}

async function assertAuthoritativeTarget(connection) {
  const [identityRows] = await connection.execute("SELECT DATABASE() AS databaseName");
  const connectedDatabase = String(identityRows[0]?.databaseName ?? "");
  if (!connectedDatabase || connectedDatabase !== process.env.DATABASE_CUTOVER_TARGET_DATABASE) {
    fail("Connected database does not match the configured authoritative external cutover target.");
  }
}

async function readBank(connection, bankKey) {
  const [metadataRows] = await connection.execute(
    "SELECT bankKey, modules, totalQuestions, contentVersion FROM `question_bank_meta` WHERE `bankKey`=?",
    [bankKey],
  );
  if (metadataRows.length !== 1) fail(`Expected exactly one metadata row for ${bankKey}.`);
  const [questions] = await connection.execute(
    `SELECT id, bankKey, questionNum, module, question, options, correctIndex, explanation, difficulty, isCalc, cognitiveLevel, steps, reviewStatus
       FROM \`questions\`
      WHERE \`bankKey\`=? AND COALESCE(\`reviewStatus\`, 'approved') NOT IN ('in_review','rejected')
      ORDER BY \`questionNum\``,
    [bankKey],
  );
  if (questions.length === 0) fail(`${bankKey} has no learner-visible questions.`);
  return { metadata: metadataRows[0], questions };
}

async function readExistingOutput() {
  try {
    const text = await readFile(OUTPUT_PATH, "utf8");
    const parsed = JSON.parse(text);
    if (parsed?.releaseKey !== RELEASE_KEY || parsed?.model !== MODEL || !parsed?.banks || typeof parsed.banks !== "object") {
      fail("Existing classification package has an unexpected release key or model.");
    }
    return parsed;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return { releaseKey: RELEASE_KEY, model: MODEL, banks: {} };
    }
    throw error;
  }
}

async function persist(value) {
  await mkdir(PRIVATE_ROOT, { recursive: true });
  const rendered = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(OUTPUT_PATH, rendered);
  return sha256(rendered);
}

function summarize(bankKey, modules, classifications) {
  const counts = Object.fromEntries(modules.map((module) => [module, 0]));
  for (const classification of classifications) counts[classification.module] += 1;
  return {
    bankKey,
    questionCount: classifications.length,
    modules,
    counts,
    lowConfidenceCount: classifications.filter((classification) => classification.confidence < 80).length,
  };
}

async function main() {
  if (!process.env.OPENAI_API_KEY) fail("OPENAI_API_KEY is unavailable.");
  const connection = await mysql.createConnection(authoritativeProductionConnectionOptions());
  try {
    await assertAuthoritativeTarget(connection);
    const packageData = await readExistingOutput();
    for (const bankKey of bankKeys) {
      const profile = ONTARIO_TREATMENT_MODULE_PROFILES[bankKey];
      const { metadata, questions } = await readBank(connection, bankKey);
      let metadataModules;
      try { metadataModules = JSON.parse(metadata.modules); }
      catch { fail(`${bankKey} metadata modules are not valid JSON.`); }
      if (JSON.stringify(metadataModules) !== JSON.stringify(profile.modules)) {
        fail(`${bankKey} metadata does not match the approved detailed module profile.`);
      }

      const selectedQuestions = sampleCount ? questions.slice(0, sampleCount) : questions;
      const existing = sampleCount ? [] : (packageData.banks[bankKey]?.classifications ?? []);
      const existingByQuestionNum = new Map(existing.map((classification) => [Number(classification.questionNum), classification]));
      for (const question of selectedQuestions) {
        const saved = existingByQuestionNum.get(Number(question.questionNum));
        if (saved && saved.sourceHash !== preservedRowHash(question)) {
          fail(`${bankKey} question ${question.questionNum} changed after its saved classification.`);
        }
      }
      const remaining = selectedQuestions.filter((question) => !existingByQuestionNum.has(Number(question.questionNum)));
      const classified = [...existing];
      for (let offset = 0; offset < remaining.length; offset += BATCH_SIZE) {
        const batch = remaining.slice(offset, offset + BATCH_SIZE);
        process.stdout.write(`${bankKey}: classifying ${existing.length + offset + 1}-${existing.length + offset + batch.length} of ${selectedQuestions.length}... `);
        const result = await classifyBatch(bankKey, profile.modules, batch);
        const validated = validateBatch(batch, profile.modules, result);
        for (const question of batch) {
          const classification = validated.get(Number(question.questionNum));
          classified.push({
            ...classification,
            sourceHash: preservedRowHash(question),
          });
        }
        classified.sort((left, right) => left.questionNum - right.questionNum);
        if (!sampleCount) {
          const inProgress = summarize(bankKey, profile.modules, classified);
          packageData.banks[bankKey] = {
            capturedAtUtc: new Date().toISOString(),
            status: "in_progress",
            sourceMetadata: {
              modules: metadata.modules,
              totalQuestions: Number(metadata.totalQuestions),
              contentVersion: Number(metadata.contentVersion ?? 1),
            },
            ...inProgress,
            classifications: classified,
          };
          packageData.updatedAtUtc = new Date().toISOString();
          await persist(packageData);
        }
        console.log("ok");
      }

      const summary = summarize(bankKey, profile.modules, classified);
      if (sampleCount) {
        console.log(JSON.stringify({ model: MODEL, sample: summary, classifications: classified }, null, 2));
        continue;
      }
      if (classified.length !== questions.length) fail(`${bankKey} classification remains incomplete.`);
      packageData.banks[bankKey] = {
        capturedAtUtc: new Date().toISOString(),
        status: "complete",
        sourceMetadata: {
          modules: metadata.modules,
          totalQuestions: Number(metadata.totalQuestions),
          contentVersion: Number(metadata.contentVersion ?? 1),
        },
        ...summary,
        classifications: classified,
      };
      packageData.updatedAtUtc = new Date().toISOString();
      const digest = await persist(packageData);
      console.log(JSON.stringify({ saved: true, bankKey, outputPath: OUTPUT_PATH, packageDigest: digest, ...summary }, null, 2));
    }
  } finally {
    await connection.end();
  }
}

await main();
