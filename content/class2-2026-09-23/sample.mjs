import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// One scenario from each selected topic family, with broad module coverage.
const selections = {
  "class2-water": ["Water Treatment II", [1,4,5,7,8,9,10,12,15,16,17,20,24,27,32,36,38,39,44,47]],
  "class2-water-dist": ["Ontario Water Distribution II", [1,2,3,4,8,11,12,15,20,21,22,23,24,26,30,34,40,46,47,48]],
  "class2-wastewater": ["Wastewater Treatment II", [1,3,4,5,7,8,9,12,15,16,17,20,21,24,28,38,39,43,49,50]],
  "class2-wastewater-coll": ["Wastewater Collection II", [1,3,4,5,11,12,13,14,17,20,21,22,26,27,30,31,36,37,38,41]],
};

const output = [
  "# Class II question review: 20 from each bank",
  "",
  "These 80 examples are selected from the September 23, 2026 draft package. Every question is `in_review`; the source lead has not been individually confirmed by an Ontario subject-matter expert. No item is learner-visible.",
  "",
];
for (const [bank, [title, families]] of Object.entries(selections)) {
  const rows = JSON.parse(await readFile(fileURLToPath(new URL(`./${bank}-250-drafts.json`, import.meta.url)), "utf8"));
  output.push(`## ${title} (\`${bank}\`)`, "");
  for (const [index, family] of families.entries()) {
    const caseIndex = (family * 7 + 3) % 5;
    const row = rows[(family - 1) * 5 + caseIndex];
    output.push(`### ${index + 1}. ${row.topic} · ${row.module}`, "", row.question, "");
    for (const [choice, option] of row.options.entries()) output.push(`${"ABCD"[choice]}. ${option}  `);
    output.push("", `**Draft answer:** ${"ABCD"[row.correctIndex]}. ${row.options[row.correctIndex]}  `,
      `**Explanation:** ${row.explanation}  `);
    if (row.isCalc === "yes") output.push(`**Calculation:** ${row.steps.map(step => step.c).join("; ")}  `);
    output.push(`**Source lead:** [${row.sourceTitle}](${row.sourceUrl}) — ${row.sourceReference}  `,
      `**Draft ID:** \`${row.draftId}\``, "");
  }
}
await writeFile(fileURLToPath(new URL("./sample-20-each.md", import.meta.url)), `${output.join("\n")}\n`);
console.log("Wrote 80 draft previews across four banks.");
