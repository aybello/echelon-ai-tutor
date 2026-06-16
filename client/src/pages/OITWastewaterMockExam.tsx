// OIT WASTEWATER MOCK EXAM — migrated onto MockExamShell (2025-06)
// 50 questions · 1-hour timer · 70% pass threshold
// productKey="oit-ww" (Stripe gate + saved examType)
import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";

const MODULE_TARGETS: Record<string, number> = {
  "Wastewater Characteristics & Sources": 5,
  "Preliminary & Primary Treatment":      5,
  "Secondary & Biological Treatment":     5,
  "Disinfection & Effluent Quality":       5,
  "Solids Handling & Biosolids":           5,
  "Wastewater Collection Systems":         5,
  "Math & Calculations":                   5,
  "Pumping & Hydraulics":                  4,
  "Ontario Regulations & Safety":          4,
  "Lab & Monitoring":                      4,
  "Nutrient Removal & Advanced Treatment": 3,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Wastewater Characteristics & Sources": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Preliminary & Primary Treatment":      { bg: "#DCFCE7", color: "#15803D" },
  "Secondary & Biological Treatment":     { bg: "#EDE9FE", color: "#6D28D9" },
  "Disinfection & Effluent Quality":       { bg: "#FFEDD5", color: "#C2410C" },
  "Solids Handling & Biosolids":           { bg: "#FEE2E2", color: "#B91C1C" },
  "Wastewater Collection Systems":         { bg: "#CCFBF1", color: "#0F766E" },
  "Math & Calculations":                   { bg: "#FEF9C3", color: "#A16207" },
  "Pumping & Hydraulics":                  { bg: "#E0E7FF", color: "#4338CA" },
  "Ontario Regulations & Safety":          { bg: "#F0FDF4", color: "#166534" },
  "Lab & Monitoring":                      { bg: "#FDF2F8", color: "#9D174D" },
  "Nutrient Removal & Advanced Treatment": { bg: "#ECFDF5", color: "#047857" },
};

export default function OITWastewaterMockExam() {
  const { questions: dbQuestions, isLoading, dbUnavailable } = useQuestionBank("oit-ww");

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
      title="OIT Wastewater Mock Exam"
      badge="OPERATOR-IN-TRAINING · WASTEWATER TREATMENT"
      metaDescription="50-question timed mock exam for the OIT Wastewater certification. 1-hour timer, 70% pass threshold, and full module breakdown on results."
      metaKeywords="OIT wastewater mock exam, Ontario wastewater operator exam, OWWCO OIT wastewater, timed exam prep"
      examQuestions={50}
      examDuration={1 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={pool}
      productKey="oit-ww"
      productName="OIT Wastewater Practice Pass"
      price={49}
      backPath="/oit-ww-mock"
      practicePath="/oit-ww"
      practiceLabel="OIT Wastewater Practice"
      currentPath="/oit-ww-mock"
      infoLine={`${pool.length} questions · OIT Wastewater Treatment`}
    />
  );
}
