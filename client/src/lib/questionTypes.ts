/**
 * Shared type definitions for question-related data.
 * These types were previously in questions.ts and moduleOverviews.ts
 * but are preserved here since components still reference them.
 */

export interface Step {
  l: string;
  c: string;
}

export interface Question {
  id: number;
  module: string;
  type: "calculation" | "conceptual" | "recall";
  difficulty: "easy" | "medium" | "hard";
  q: string;
  formula?: string;
  options: string[];
  correct: number;
  explanation: string;
  wrongExp?: Record<number, string>;
  steps?: Step[];
  tip: string;
  isCalc?: boolean;
}

export interface HistoryEntry {
  questionId: number;
  module: string;
  difficulty: "easy" | "medium" | "hard";
  correct: boolean;
  confidence: number;
  selectedOption: number;
  wrongExplanation: string | null;
  questionObj?: any;
}

export interface PatternInsight {
  module: string;
  wrongCount: number;
  total: number;
  pct: number;
}

export interface ModuleOverview {
  title: string;
  intro: string;
  keyPoints: { heading: string; body: string }[];
  tableHeadings?: string[];
  tableRows?: string[][];
  examTips: string[];
  formulaHint?: string;
}
