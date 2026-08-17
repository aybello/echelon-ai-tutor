import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

export const root = resolve(import.meta.dirname, "../..");
export const questionDirectory = resolve(root, "content/309a/questions");

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function canonicalQuestionPayload(question) {
  // Review status and eligibility are lifecycle state, not authored content;
  // approvals may advance without changing the immutable content fingerprint.
  const {
    contentHash: _contentHash,
    contentStatus: _contentStatus,
    publicEligibility: _publicEligibility,
    ...payload
  } = question;
  function sortValue(value) {
    if (Array.isArray(value)) return value.map(sortValue);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.keys(value).sort().map((key) => [key, sortValue(value[key])]),
      );
    }
    return value;
  }
  return JSON.stringify(sortValue(payload));
}

export function questionContentHash(question) {
  return createHash("sha256").update(canonicalQuestionPayload(question)).digest("hex");
}

export function loadQuestionBatches() {
  let files = [];
  try {
    files = readdirSync(questionDirectory)
      .filter((file) => /^batch-[a-e]\.json$/i.test(file))
      .sort();
  } catch {
    return [];
  }

  return files.map((file) => {
    const document = readJson(resolve(questionDirectory, file));
    return {
      file,
      path: resolve(questionDirectory, file),
      ...document,
      questions: (document.questions ?? []).map((question) => ({
        ...(document.questionDefaults ?? {}),
        ...question,
      })),
    };
  });
}

function assert(condition, errors, message) {
  if (!condition) errors.push(message);
}

export function validateQuestionBank({ batchFilter = null, full = false } = {}) {
  const allocation = readJson(resolve(root, "content/309a/309a-allocation.json"));
  const schema = readJson(resolve(root, "content/309a/309a-question.schema.json"));
  const sourceManifest = readJson(
    resolve(root, "content/309a/current-exam-source-manifest.json"),
  );
  const diagramCatalog = readJson(resolve(root, "content/309a/309a-diagrams.json"));
  const taxonomy = readJson(resolve(root, "content/309a/309a-subtask-taxonomy.json"));
  const errors = [];
  const allBatches = loadQuestionBatches();
  const batches = batchFilter
    ? allBatches.filter((candidate) => candidate.batch === batchFilter)
    : allBatches;
  const questions = batches.flatMap((candidate) => candidate.questions ?? []);
  const sources = new Map(sourceManifest.sources.map((source) => [source.id, source]));
  const diagrams = new Map(diagramCatalog.diagrams.map((diagram) => [diagram.id, diagram]));
  const subtasks = new Set(
    taxonomy.majorWorkActivities.flatMap((mwa) => mwa.subtasks.map(([code]) => code)),
  );
  const tasks = new Map(
    allocation.majorWorkActivities.flatMap((mwa) =>
      mwa.tasks.map((task) => [task.code, { ...task, module: mwa.code }]),
    ),
  );
  const required = schema.required;
  const numbers = new Set();
  const hashes = new Set();
  const questionTexts = new Set();
  const taskCounts = new Map();
  const typeCounts = new Map();
  const answerCounts = [0, 0, 0, 0];
  let calculationCount = 0;
  let diagramCount = 0;

  assert(batches.length > 0, errors, batchFilter ? `No batch ${batchFilter} file found.` : "No 309A question batches found.");

  for (const question of questions) {
    const label = `Question ${question.bankItemNumber ?? "?"}`;
    for (const field of required) {
      assert(Object.hasOwn(question, field), errors, `${label} is missing ${field}.`);
    }
    assert(question.bankKey === allocation.bankKey, errors, `${label} has the wrong bankKey.`);
    assert(question.bankVersionKey === allocation.bankVersionKey, errors, `${label} has the wrong bankVersionKey.`);
    assert(question.blueprintVersion === allocation.blueprintVersion, errors, `${label} has a stale blueprintVersion.`);
    assert(Number.isInteger(question.bankItemNumber) && question.bankItemNumber >= 1 && question.bankItemNumber <= 500, errors, `${label} has an invalid bankItemNumber.`);
    assert(!numbers.has(question.bankItemNumber), errors, `${label} duplicates a bank item number.`);
    numbers.add(question.bankItemNumber);
    assert(typeof question.question === "string" && question.question.length >= 30, errors, `${label} question text is too short.`);
    assert(!questionTexts.has(question.question.trim().toLowerCase()), errors, `${label} duplicates another question stem.`);
    questionTexts.add(question.question.trim().toLowerCase());
    assert(Array.isArray(question.options) && question.options.length === 4, errors, `${label} must have four options.`);
    assert(new Set(question.options).size === 4, errors, `${label} options must be unique.`);
    assert(Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex <= 3, errors, `${label} has an invalid correctIndex.`);
    if (question.correctIndex >= 0 && question.correctIndex <= 3) answerCounts[question.correctIndex] += 1;
    const correctLength = question.options?.[question.correctIndex]?.length ?? 0;
    const distractorAverage = question.options?.filter((_, index) => index !== question.correctIndex).reduce((sum, option) => sum + option.length, 0) / 3;
    assert(!distractorAverage || correctLength / distractorAverage <= 2.25, errors, `${label} has an obvious correct-answer length cue.`);
    assert(typeof question.explanation === "string" && question.explanation.length >= 60, errors, `${label} explanation is too short.`);
    assert(["easy", "medium", "hard"].includes(question.difficulty), errors, `${label} has an invalid difficulty.`);
    assert(["foundation", "applied_scenario", "troubleshooting_or_calculation"].includes(question.questionType), errors, `${label} has an invalid questionType.`);
    assert(["recall", "procedural_application", "critical_thinking"].includes(question.cognitiveLevel), errors, `${label} has an invalid cognitiveLevel.`);
    assert(["yes", "no"].includes(question.isCalc), errors, `${label} has an invalid isCalc.`);
    assert(question.contentStatus === "draft", errors, `${label} must enter the repository as draft.`);
    assert(question.publicEligibility === false, errors, `${label} cannot be public-eligible before Echelon's documented research review.`);
    const task = tasks.get(question.taskCode);
    assert(Boolean(task), errors, `${label} has an unknown taskCode ${question.taskCode}.`);
    assert(task?.module === question.module, errors, `${label} module does not match ${question.taskCode}.`);
    assert(question.subtaskCode?.startsWith(`${question.taskCode}.`), errors, `${label} subtaskCode does not belong to ${question.taskCode}.`);
    assert(subtasks.has(question.subtaskCode), errors, `${label} subtaskCode is not in the official taxonomy snapshot.`);
    const source = sources.get(question.sourceId);
    assert(Boolean(source), errors, `${label} sourceId does not resolve to the source manifest.`);
    assert(source?.url === question.sourceUrl, errors, `${label} sourceUrl does not match its manifest record.`);
    assert(source?.title === question.sourceTitle, errors, `${label} sourceTitle does not match its manifest record.`);
    assert(source?.rightsBasis !== "licensed_access_required", errors, `${label} uses a source without authoring rights.`);
    assert(Boolean(source?.verifiedAt), errors, `${label} source is not verified.`);
    const bannedText = `${question.question} ${question.options?.join(" ") ?? ""}`;
    assert(!/all of the above|none of the above/i.test(bannedText), errors, `${label} uses an all/none-of-the-above option.`);
    assert(!/\bCEC\s+(?:rule|table)|\bRule\s+\d|\bTable\s+\d/i.test(bannedText), errors, `${label} contains blocked code rule/table lookup content.`);
    if (question.isCalc === "yes") {
      calculationCount += 1;
      assert(question.questionType === "troubleshooting_or_calculation", errors, `${label} calculations must use the troubleshooting/calculation type.`);
      assert(Array.isArray(question.steps) && question.steps.length >= 2, errors, `${label} calculation requires worked steps.`);
      assert(typeof question.tip === "string" && question.tip.length >= 10, errors, `${label} calculation requires a tip.`);
      const correctNumber = question.options[question.correctIndex].match(/-?\d+(?:\.\d+)?/)?.[0];
      const workedText = question.steps?.map((step) => step.content).join(" ") ?? "";
      assert(Boolean(correctNumber && workedText.includes(correctNumber)), errors, `${label} worked steps do not trace to the correct numeric answer.`);
    }
    if (question.diagramId !== null) {
      diagramCount += 1;
      const diagram = diagrams.get(question.diagramId);
      assert(Boolean(diagram), errors, `${label} references an unknown diagramId.`);
      assert(diagram?.modules.includes(question.module), errors, `${label} references a diagram outside its module.`);
      assert(typeof question.diagramAlt === "string" && question.diagramAlt.length >= 20, errors, `${label} diagram requires useful alt text.`);
    } else {
      assert(question.diagramAlt === null, errors, `${label} diagramAlt must be null without a diagram.`);
    }
    const expectedHash = questionContentHash(question);
    assert(question.contentHash === expectedHash, errors, `${label} contentHash mismatch; run pnpm 309a:hash.`);
    assert(!hashes.has(question.contentHash), errors, `${label} duplicates another content hash.`);
    hashes.add(question.contentHash);
    taskCounts.set(question.taskCode, (taskCounts.get(question.taskCode) ?? 0) + 1);
    typeCounts.set(question.questionType, (typeCounts.get(question.questionType) ?? 0) + 1);
  }

  const checkedModules = new Set(batches.map((batch) => batch.batch));
  const expectedModules = allocation.majorWorkActivities.filter(
    (mwa) => full || mwa.code === batchFilter || checkedModules.has(mwa.code),
  );
  for (const mwa of expectedModules) {
    const moduleQuestions = questions.filter((question) => question.module === mwa.code);
    assert(
      moduleQuestions.length === mwa.bankTarget,
      errors,
      `${mwa.code} must contain exactly ${mwa.bankTarget} questions.`,
    );
    const moduleTypes = new Map();
    const moduleCognitiveLevels = new Map();
    for (const question of moduleQuestions) {
      moduleTypes.set(question.questionType, (moduleTypes.get(question.questionType) ?? 0) + 1);
      moduleCognitiveLevels.set(question.cognitiveLevel, (moduleCognitiveLevels.get(question.cognitiveLevel) ?? 0) + 1);
    }
    assert((moduleTypes.get("foundation") ?? 0) === mwa.questionMix.foundation, errors, `${mwa.code} must contain ${mwa.questionMix.foundation} foundation questions.`);
    assert((moduleTypes.get("applied_scenario") ?? 0) === mwa.questionMix.appliedScenario, errors, `${mwa.code} must contain ${mwa.questionMix.appliedScenario} applied scenarios.`);
    assert((moduleTypes.get("troubleshooting_or_calculation") ?? 0) === mwa.questionMix.troubleshootingOrCalculation, errors, `${mwa.code} must contain ${mwa.questionMix.troubleshootingOrCalculation} troubleshooting/calculation questions.`);
    assert((moduleCognitiveLevels.get("recall") ?? 0) === mwa.cognitiveMix.recall, errors, `${mwa.code} must contain ${mwa.cognitiveMix.recall} recall questions.`);
    assert((moduleCognitiveLevels.get("procedural_application") ?? 0) === mwa.cognitiveMix.proceduralApplication, errors, `${mwa.code} must contain ${mwa.cognitiveMix.proceduralApplication} procedural/application questions.`);
    assert((moduleCognitiveLevels.get("critical_thinking") ?? 0) === mwa.cognitiveMix.criticalThinking, errors, `${mwa.code} must contain ${mwa.cognitiveMix.criticalThinking} critical-thinking questions.`);
    for (const task of mwa.tasks) {
      assert(
        (taskCounts.get(task.code) ?? 0) === task.bankTarget,
        errors,
        `${task.code} must contain exactly ${task.bankTarget} questions.`,
      );
    }
  }

  if (full) {
    assert(questions.length === allocation.bankTarget, errors, `Full bank must contain exactly ${allocation.bankTarget} questions.`);
    const mix = allocation.requiredBankMix;
    assert((typeCounts.get("foundation") ?? 0) === mix.foundationQuestions, errors, `Full bank must contain ${mix.foundationQuestions} foundation questions.`);
    assert((typeCounts.get("applied_scenario") ?? 0) === mix.appliedScenarioQuestions, errors, `Full bank must contain ${mix.appliedScenarioQuestions} applied scenarios.`);
    assert((typeCounts.get("troubleshooting_or_calculation") ?? 0) === mix.troubleshootingOrCalculationQuestions, errors, `Full bank must contain ${mix.troubleshootingOrCalculationQuestions} troubleshooting/calculation questions.`);
    assert(calculationCount >= mix.minimumCalculationQuestions, errors, `Full bank requires at least ${mix.minimumCalculationQuestions} calculations.`);
    assert(diagramCount >= mix.minimumDiagramBackedQuestions, errors, `Full bank requires at least ${mix.minimumDiagramBackedQuestions} diagram-backed questions.`);
    assert(Math.max(...answerCounts) - Math.min(...answerCounts) <= 1, errors, "Full bank answer positions must be evenly balanced.");
  }

  return { errors, questions, batches, taskCounts, typeCounts, answerCounts, calculationCount, diagramCount };
}
