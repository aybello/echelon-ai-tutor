// OIT MOCK EXAM — migrated onto MockExamShell (2025-06)
// 100 questions · 2-hour timer · 70% pass threshold
// productKey="oit" (Stripe gate + saved examType)
import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";

const MODULE_TARGETS: Record<string, number> = {
  "Disinfection": 11,
  "Chemical Feed & Storage": 12,
  "Hydraulics": 10,
  "Math & Calculations": 11,
  "Ontario Regulations": 11,
  "Pumping Systems": 11,
  "Water Treatment": 11,
  "Wastewater Treatment": 5,
  "Water Quality & Sampling": 11,
  "Health & Safety": 7,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Disinfection":             { bg: "#DBEAFE", color: "#1D4ED8" },
  "Chemical Feed & Storage":  { bg: "#FEF9C3", color: "#A16207" },
  "Hydraulics":               { bg: "#DCFCE7", color: "#15803D" },
  "Math & Calculations":      { bg: "#FFEDD5", color: "#C2410C" },
  "Ontario Regulations":      { bg: "#EDE9FE", color: "#6D28D9" },
  "Pumping Systems":          { bg: "#CCFBF1", color: "#0F766E" },
  "Water Treatment":          { bg: "#DBEAFE", color: "#0369A1" },
  "Wastewater Treatment":     { bg: "#ECFDF5", color: "#065F46" },
  "Water Quality & Sampling": { bg: "#FEF9C3", color: "#A16207" },
  "Health & Safety":          { bg: "#FEE2E2", color: "#B91C1C" },
};

export default function OITMockExam() {
  const { questions: dbQuestions, isLoading, dbUnavailable } = useQuestionBank("oit");

  const pool: ExamQuestion[] = dbQuestions.map(q => ({
    id: q.id,
    module: q.module,
    question: q.question,
    options: q.options,
    correct: q.correctIndex,
    explanation: q.explanation,
  }));

  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <MockExamShell
      title="OIT Mock Exam"
      badge="OPERATOR-IN-TRAINING · WATER & WASTEWATER"
      metaDescription="100-question timed mock exam for the Operator-in-Training (OIT) certification. 2-hour timer, 70% pass threshold, and full module breakdown on results. For Ontario, BC, Alberta, and all Canadian provinces."
      metaKeywords="OIT mock exam, Canadian operator in training exam, water operator practice test, OWWCO OIT, EOCP OIT, timed exam prep"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={pool}
      productKey="oit"
      productName="OIT Practice Pass"
      price={49}
      backPath="/oit-mock"
      practicePath="/quiz"
      practiceLabel="OIT Practice Mode"
      showProvinceSelector={true}
      currentPath="/oit-mock"
      infoLine={`${pool.length} questions · Canadian OIT (Water & Wastewater)`}
    />
  );
}
