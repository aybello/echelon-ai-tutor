export interface EditorialQuestion {
  bankKey: string;
  questionNum: number;
  isCalc: string;
  correctIndex: number;
  correctAnswer: string;
  options: string[];
}
export function loadOitEditorial(bankKey: string): Map<number, { correct: string; distractors: string[] }>;
export function applyOitEditorial<T extends EditorialQuestion>(questions: T[]): T[];
