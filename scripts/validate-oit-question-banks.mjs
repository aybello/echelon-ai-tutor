import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const contentRoot = path.join(repoRoot, "content", "oit");
const manifest = JSON.parse(fs.readFileSync(path.join(contentRoot, "manifest.json"), "utf8"));
const allowedDifficulties = new Set(["easy", "medium", "hard"]);
const allowedBanks = new Set(["oit", "oit-ww"]);
const allowedSourceUrls = new Set(manifest.sources.map(source => source.url));
const normalized = value => value.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const wordCount = value => value.trim().split(/\s+/).filter(Boolean).length;
const giveawayLanguage = /\b(always|never|ignore|guess|wait until|omit|regardless|by smell|previous day's|cancel each other|unattended)\b/i;
const knownBadContent = /filterable particulate material|effective biochemical oxygen demand|achieving its intended operational result/i;

function longestRun(values) {
  let longest = 0;
  let current = 0;
  let previous = -1;
  for (const value of values) {
    current = value === previous ? current + 1 : 1;
    previous = value;
    longest = Math.max(longest, current);
  }
  return longest;
}

function repeatsPeriod(values, period) {
  return values.every((value, index) => index < period || value === values[index % period]);
}

function stemPattern(question) {
  const topic = normalized(question.topic);
  return normalized(question.question)
    .replace(/\b\d+\b/g, "#")
    .split(topic)
    .join("{topic}");
}

function tokenSet(value) {
  return new Set(normalized(value).split(" ").filter(token => token.length > 2));
}

function jaccard(left, right) {
  const intersection = [...left].filter(token => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
}

assert.equal(manifest.version, "2026-08-28-v2", "Unexpected OIT package version.");
assert.equal(manifest.importMode, "additive", "OIT package must remain additive.");
assert.deepEqual(manifest.questionNumberRange, { start: 1001, end: 1500 });
assert.equal(manifest.banks.length, 2, "Manifest must define exactly two OIT banks.");
assert.equal(manifest.governance.sourceReviewStatus, "unreviewed");
assert.equal(manifest.governance.databaseStagingStatus, "in_review");
assert.equal(manifest.governance.activation, "individual-admin-approval-required");

const globalItemIds = new Set();
const globalStems = new Map();
const allQuestions = [];
let totalQuestions = 0;

for (const bank of manifest.banks) {
  assert(allowedBanks.has(bank.bankKey), `Unsupported bank key ${bank.bankKey}.`);
  const filePath = path.join(contentRoot, bank.file);
  const questions = JSON.parse(fs.readFileSync(filePath, "utf8"));
  assert.equal(questions.length, bank.expectedCount, `${bank.bankKey} must contain ${bank.expectedCount} questions.`);
  assert.equal(questions.length, 500, `${bank.bankKey} is not a complete 500-question bank.`);

  const numbers = new Set();
  const answerCounts = [0, 0, 0, 0];
  const answerSequence = [];
  const streamCounts = new Map();
  const streamDifficultyCounts = new Map();
  const streamCalculationCounts = new Map();
  const patternCounts = new Map();
  const calculationAnswers = new Map();
  let calculationCount = 0;

  questions.forEach((question, index) => {
    const context = `${bank.bankKey} row ${index + 1}`;
    assert.equal(question.bankKey, bank.bankKey, `${context}: bank key drift.`);
    assert.equal(question.questionNum, 1001 + index, `${context}: question number must be sequential and additive.`);
    assert(!numbers.has(question.questionNum), `${context}: duplicate question number.`);
    numbers.add(question.questionNum);

    assert.match(question.itemId, /^OIT-\d{4}$/, `${context}: invalid itemId.`);
    assert(!globalItemIds.has(question.itemId), `${context}: duplicate global itemId.`);
    globalItemIds.add(question.itemId);

    assert(question.module?.trim(), `${context}: missing module.`);
    assert(question.topic?.trim(), `${context}: missing topic.`);
    assert(allowedDifficulties.has(question.difficulty), `${context}: invalid difficulty ${question.difficulty}.`);
    assert.equal(question.cognitiveLevel, question.difficulty === "easy" ? "recall" : "application", `${context}: cognitive level does not match difficulty.`);
    assert(question.question?.trim().length >= 25, `${context}: question stem is too short.`);
    const stemKey = normalized(question.question);
    assert(!globalStems.has(stemKey), `${context}: duplicate normalized stem also used by ${globalStems.get(stemKey)}.`);
    globalStems.set(stemKey, context);

    const pattern = stemPattern(question);
    patternCounts.set(pattern, (patternCounts.get(pattern) ?? 0) + 1);

    assert(Array.isArray(question.options), `${context}: options must be an array.`);
    assert.equal(question.options.length, 4, `${context}: exactly four options are required.`);
    question.options.forEach((option, optionIndex) => {
      assert.equal(typeof option, "string", `${context}: option ${optionIndex} is not text.`);
      assert(option.trim().length >= 2, `${context}: option ${optionIndex} is too short.`);
    });
    assert.equal(new Set(question.options.map(normalized)).size, 4, `${context}: duplicate options.`);
    assert(Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex <= 3, `${context}: invalid correctIndex.`);
    assert.equal(question.correctAnswer, question.options[question.correctIndex], `${context}: correctAnswer does not match correctIndex.`);
    assert.equal(question.optionA, question.options[0], `${context}: optionA drift.`);
    assert.equal(question.optionB, question.options[1], `${context}: optionB drift.`);
    assert.equal(question.optionC, question.options[2], `${context}: optionC drift.`);
    assert.equal(question.optionD, question.options[3], `${context}: optionD drift.`);
    answerCounts[question.correctIndex] += 1;
    answerSequence.push(question.correctIndex);

    question.options.forEach((option, optionIndex) => {
      if (optionIndex !== question.correctIndex) {
        assert(!giveawayLanguage.test(option), `${context}: distractor contains giveaway language.`);
      }
    });

    const correctLength = wordCount(question.correctAnswer);
    const wrongAverage = question.options
      .filter((_, optionIndex) => optionIndex !== question.correctIndex)
      .reduce((sum, option) => sum + wordCount(option), 0) / 3;
    assert(correctLength <= wrongAverage * 1.4, `${context}: correct answer has a strong length cue.`);

    assert(question.explanation?.trim().length >= 50, `${context}: explanation is too short.`);
    assert(!/\b(actually|in fact|it should be noted)\b/i.test(question.explanation), `${context}: explanation contains self-correction language.`);
    assert(!knownBadContent.test(`${question.question} ${question.options.join(" ")} ${question.explanation}`), `${context}: known inaccurate or nonsensical wording returned.`);
    assert.equal(question.reviewStatus, "unreviewed", `${context}: source package must remain unreviewed.`);
    assert(question.sourceTitle?.trim() && question.sourceReference?.trim() && /^https:\/\//.test(question.sourceUrl), `${context}: incomplete source traceability.`);
    assert(allowedSourceUrls.has(question.sourceUrl), `${context}: source URL is absent from the manifest.`);
    assert(normalized(question.sourceReference).includes(normalized(question.topic)), `${context}: source reference is not item-specific.`);
    assert(question.blueprintObjective?.trim(), `${context}: missing blueprint objective.`);

    assert(["yes", "no"].includes(question.isCalc), `${context}: invalid calculation flag.`);
    if (question.isCalc === "yes") {
      calculationCount += 1;
      assert(question.formula?.trim(), `${context}: calculation question has no formula.`);
      const calculationKey = `${question.stream}|${question.topic}`;
      const answers = calculationAnswers.get(calculationKey) ?? new Set();
      assert(!answers.has(question.correctAnswer), `${context}: calculation answer repeats within ${question.topic}.`);
      answers.add(question.correctAnswer);
      calculationAnswers.set(calculationKey, answers);
      streamCalculationCounts.set(question.stream, (streamCalculationCounts.get(question.stream) ?? 0) + 1);
    }

    streamCounts.set(question.stream, (streamCounts.get(question.stream) ?? 0) + 1);
    const difficultyCounts = streamDifficultyCounts.get(question.stream) ?? { easy: 0, medium: 0, hard: 0 };
    difficultyCounts[question.difficulty] += 1;
    streamDifficultyCounts.set(question.stream, difficultyCounts);
    allQuestions.push({ ...question, context });
  });

  assert.deepEqual(answerCounts, [125, 125, 125, 125], `${bank.bankKey}: answer positions must be balanced without a predictable sequence.`);
  assert(longestRun(answerSequence) <= 3, `${bank.bankKey}: answer key contains a run longer than three.`);
  assert(!answerSequence.every((value, index) => value === index % 4), `${bank.bankKey}: answer key repeats the A-B-C-D cycle.`);
  for (let period = 2; period <= 12; period += 1) {
    assert(!repeatsPeriod(answerSequence, period), `${bank.bankKey}: answer key repeats a period-${period} pattern.`);
  }

  assert.equal(calculationCount, 96, `${bank.bankKey}: expected 96 calculation questions.`);
  assert.equal(calculationAnswers.size, 12, `${bank.bankKey}: expected 12 calculation objectives.`);
  for (const [key, answers] of calculationAnswers) assert.equal(answers.size, 8, `${bank.bankKey}: ${key} must have eight distinct worked answers.`);
  assert.equal(streamCounts.size, 2, `${bank.bankKey}: expected two 250-question operating streams.`);
  for (const [stream, count] of streamCounts) {
    assert.equal(count, 250, `${bank.bankKey}: ${stream} must contain 250 questions.`);
    assert.equal(streamCalculationCounts.get(stream), 48, `${bank.bankKey}: ${stream} must contain 48 calculations.`);
    assert.deepEqual(streamDifficultyCounts.get(stream), manifest.blueprint[stream].difficulty, `${bank.bankKey}: ${stream} difficulty mix drifted.`);
  }

  const mostRepeatedPattern = Math.max(...patternCounts.values());
  assert(mostRepeatedPattern <= 16, `${bank.bankKey}: one stem template is repeated ${mostRepeatedPattern} times.`);
  totalQuestions += questions.length;

  console.log(`PASS ${bank.bankKey}: ${questions.length} questions, 96 calculations, non-patterned balanced answer key.`);
}

assert.equal(totalQuestions, 1000, "Package must contain exactly 1,000 questions.");
assert.equal(globalItemIds.size, 1000, "Global item IDs must be unique.");
assert.equal(globalStems.size, 1000, "Question stems must be unique.");

// Near-duplicate scan across non-calculation questions. Numeric variants within
// one calculation objective are reviewed by the distinct-answer gate above.
const nonCalculations = allQuestions.filter(question => question.isCalc === "no");
const tokenSets = nonCalculations.map(question => tokenSet(question.question));
for (let left = 0; left < nonCalculations.length; left += 1) {
  for (let right = left + 1; right < nonCalculations.length; right += 1) {
    if (jaccard(tokenSets[left], tokenSets[right]) >= 0.93) {
      throw new Error(`${nonCalculations[left].context} and ${nonCalculations[right].context}: near-duplicate stems.`);
    }
  }
}

console.log("PASS OIT package: 500 water + 500 wastewater questions with staged review governance.");
