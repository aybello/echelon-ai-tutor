import { insertGapQuestions } from "./examBankGapQuestions";

async function main() {
  const result = await insertGapQuestions();
  console.log(JSON.stringify(result, null, 2));
}

void main();
