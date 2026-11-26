import fs from "node:fs";

// These are authored alternatives for each retained item, not answers borrowed
// from unrelated objectives. Each row supplies the correct answer followed by
// three distractors; delivery shuffling preserves the established answer slots.
export function loadOitEditorial(bankKey) {
  const name = bankKey === "oit" ? "water" : bankKey === "oit-ww" ? "wastewater" : null;
  if (!name) throw new Error(`Unknown OIT bank ${bankKey}`);
  const file = new URL(`../../content/oit/editorial/${name}-options.txt`, import.meta.url);
  const entries = new Map();
  for (const line of fs.readFileSync(file, "utf8").trim().split(/\r?\n/)) {
    const [id, ...choices] = line.split("|").map(value => value.trim());
    const questionNum = Number(id);
    if (!Number.isInteger(questionNum) || choices.length !== 4 || choices.some(value => !value)) {
      throw new Error(`Malformed editorial row: ${bankKey}/${id}`);
    }
    if (entries.has(questionNum)) throw new Error(`Duplicate editorial row: ${bankKey}/${id}`);
    entries.set(questionNum, { correct: choices[0], distractors: choices.slice(-3) });
  }
  return entries;
}

export function applyOitEditorial(questions) {
  const banks = new Map(["oit", "oit-ww"].map(key => [key, loadOitEditorial(key)]));
  const used = new Map(["oit", "oit-ww"].map(key => [key, new Set()]));
  const revised = questions.map(question => {
    if (question.isCalc === "yes") return question;
    const entry = banks.get(question.bankKey)?.get(question.questionNum);
    if (!entry) throw new Error(`Missing editorial choices: ${question.bankKey}/${question.questionNum}`);
    used.get(question.bankKey).add(question.questionNum);
    const correctAnswer = entry.correct;
    const options = [...entry.distractors];
    options.splice(question.correctIndex, 0, correctAnswer);
    if (new Set(options.map(value => value.toLowerCase().replace(/[^a-z0-9]/g, ""))).size !== 4) {
      throw new Error(`Duplicate editorial choices: ${question.bankKey}/${question.questionNum}`);
    }
    return { ...question, correctAnswer, options, optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3] };
  });
  for (const [key, entries] of banks) {
    for (const id of entries.keys()) {
      if (!used.get(key).has(id)) throw new Error(`Unused editorial row: ${key}/${id}`);
    }
  }
  return revised;
}
