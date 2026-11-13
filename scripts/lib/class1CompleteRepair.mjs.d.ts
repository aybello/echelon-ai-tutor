export const CLASS1_BANK_KEYS: string[];
export const CLASS1_EXPECTED_COUNTS: Record<string, number>;
export const QUESTION_FIELDS: string[];
export const METADATA_FIELDS: string[];
export function stable(value: unknown): unknown;
export function digest(value: unknown): string;
export function questionIdentity(question: { bankKey: string; questionNum: number }): string;
export function reconcileClass1CompleteRepair(input: {
  pkg: unknown;
  currentQuestions: unknown[];
  currentMetadata: unknown[];
  attemptCounts?: Record<number, number>;
  expectedCounts?: Record<string, number>;
}): unknown;
