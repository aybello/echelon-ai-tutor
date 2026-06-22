// CLASS 1 WATER MOCK EXAM — migrated onto MockExamShell (2025-06)
// 100 questions · 2-hour timer · 70% pass threshold
// productKey="class1-water" (Stripe gate)
// scoreExamType="class1" (preserves historical score records saved under "class1")
import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";

const MODULE_TARGETS: Record<string, number> = {
  "Water Sources & Quality":    11,
  "Coagulation & Flocculation": 10,
  "Sedimentation":              10,
  "Filtration":                 12,
  "Disinfection":               12,
  "Chemical Feed & Dosing":     10,
  "Iron & Manganese Removal":   10,
  "Water Quality & Regulations":10,
  "Water Distribution":         15,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Water Sources & Quality":    { bg: "#DBEAFE", color: "#1D4ED8" },
  "Coagulation & Flocculation": { bg: "#FEF9C3", color: "#A16207" },
  "Sedimentation":              { bg: "#DCFCE7", color: "#15803D" },
  "Filtration":                 { bg: "#EDE9FE", color: "#6D28D9" },
  "Disinfection":               { bg: "#CCFBF1", color: "#0F766E" },
  "Chemical Feed & Dosing":     { bg: "#FFEDD5", color: "#C2410C" },
  "Iron & Manganese Removal":   { bg: "#FEE2E2", color: "#B91C1C" },
  "Water Quality & Regulations":{ bg: "#F0FDF4", color: "#166534" },
  "Water Distribution":         { bg: "#E0F2FE", color: "#0284C7" },
};

export default function Class1WaterMockExam() {
  const { questions: dbQuestions, isLoading, dbUnavailable } = useQuestionBank("class1-water");

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
      moduleTargets={MODULE_TARGETS}
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
