// WQA MOCK EXAM — migrated onto MockExamShell (2025-06)
// 100 questions · 3-hour timer · 70% pass threshold
// productKey="wqa" (Stripe gate + saved examType)
import MockExamShell from "@/components/MockExamShell";
import { useMockExamMetadata } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";

const MODULE_TARGETS: Record<string, number> = {
  "Math":                               6,
  "Science":                            14,
  "Laboratory & Sampling":              19,
  "Safety":                             9,
  "Water Characteristics":              15,
  "Bacteriological Testing":            9,
  "Chemical Testing":                   6,
  "Disinfection":                       8,
  "Quality Assurance & Quality Control":11,
  "Regulation":                         3,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Math":                               { bg: "#EDE9FE", color: "#6D28D9" },
  "Science":                            { bg: "#DBEAFE", color: "#1D4ED8" },
  "Laboratory & Sampling":              { bg: "#E0F2FE", color: "#0369A1" },
  "Safety":                             { bg: "#FEE2E2", color: "#B91C1C" },
  "Water Characteristics":              { bg: "#DCFCE7", color: "#15803D" },
  "Bacteriological Testing":            { bg: "#FEF9C3", color: "#A16207" },
  "Chemical Testing":                   { bg: "#FFEDD5", color: "#C2410C" },
  "Disinfection":                       { bg: "#CCFBF1", color: "#0F766E" },
  "Quality Assurance & Quality Control":{ bg: "#F0FDF4", color: "#166534" },
  "Regulation":                         { bg: "#F5F3FF", color: "#5B21B6" },
};

export default function WQAMockExam() {
  const { totalQuestions, isLoading: isLoading, dbUnavailable } = useMockExamMetadata("wqa");


  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <MockExamShell
      title="WQA Mock Exam"
      badge="WATER QUALITY ANALYST · AWWA / WQA CERTIFICATION"
      metaDescription="100-question timed mock exam for the Water Quality Analyst (WQA) certification. 3-hour timer, 70% pass threshold, and full module breakdown on results."
      metaKeywords="WQA mock exam, water quality analyst exam, AWWA water quality, timed exam prep, water certification"
      examQuestions={100}
      examDuration={3 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      productKey="wqa"
      productName="WQA Practice Pass"
      price={149}
      backPath="/wqa-mock"
      practicePath="/wqa"
      practiceLabel="WQA Practice Mode"
      formulaPath="/formulas-wqa"
      formulaLabel="WQA Formula Sheet"
      currentPath="/wqa-mock"
      infoLine={`${totalQuestions} questions · Water Quality Analyst`}
    />
  );
}
