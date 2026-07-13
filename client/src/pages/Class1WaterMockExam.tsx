// CLASS 1 WATER MOCK EXAM — migrated onto MockExamShell (2025-06)
// 100 questions · 2-hour timer · 70% pass threshold
// productKey="class1-water" (Stripe gate)
// scoreExamType="class1" (preserves historical score records saved under "class1")
// moduleTargets: official WPI/ABC blueprint weights from question_bank_meta DB
import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process":    { bg: "#DBEAFE", color: "#1D4ED8" },
  "Laboratory Analysis":  { bg: "#EDE9FE", color: "#6D28D9" },
  "Equipment O&M":        { bg: "#DCFCE7", color: "#15803D" },
  "Source Water":         { bg: "#CCFBF1", color: "#0F766E" },
  "Safety & Admin":       { bg: "#FFEDD5", color: "#C2410C" },
};

export default function Class1WaterMockExam() {
  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading, dbUnavailable } = useQuestionBank("class1-water");

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
      title="Class 1 Water Treatment Mock Exam"
      badge="ONTARIO CLASS 1 · WATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 1 Water Treatment operator certification. 2-hour timer, 70% pass threshold, and full module breakdown on results."
      metaKeywords="Class 1 water treatment mock exam, Ontario water operator exam, OWWCO Class 1, timed exam prep"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={pool}
      productKey="class1-water"
      scoreExamType="class1"
      productName="Class 1 Water Treatment Practice Pass"
      price={99}
      backPath="/class1-water-mock"
      practicePath="/class1-water"
      practiceLabel="Class 1 Water Practice"
      formulaPath="/formulas-water1"
      formulaLabel="Class 1 Formula Sheet"
      currentPath="/class1-water-mock"
      stream="water"
      infoLine={`${pool.length} questions · Ontario Class 1 Water Treatment`}
    />
  );
}
