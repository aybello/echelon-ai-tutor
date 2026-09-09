import type { EditorialQuestion } from "./oitEditorial.mjs";
export function analyseOitAnswerCues(questions: EditorialQuestion[]): {
  conceptualCount: number;
  longestRate: number;
  shortestRate: number;
  longTells: number[];
  shortTells: number[];
  qualifierTells: number[];
};
