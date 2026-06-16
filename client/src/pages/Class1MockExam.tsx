// CLASS 1 MOCK EXAM — migrated onto MockExamShell (2025-06)
// 100 questions · 2-hour timer · 70% pass threshold
// Two streams: Water (Treatment + Distribution) | Wastewater (Treatment + Collection)
// productKey per stream: class1-water / class1-ww
// scoreExamType for both: "class1" (preserves legacy score history)
import MockExamShell, { type ExamQuestion, type StreamOption } from "@/components/MockExamShell";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";

// ── Module colours ────────────────────────────────────────────────────────────
const MODULE_COLORS_WATER: Record<string, { bg: string; color: string }> = {
  "Water Treatment":    { bg: "#DBEAFE", color: "#1D4ED8" },
  "Water Distribution": { bg: "#EFF6FF", color: "#1D4ED8" },
};

const MODULE_COLORS_WW: Record<string, { bg: string; color: string }> = {
  "Wastewater Treatment":  { bg: "#CCFBF1", color: "#0F766E" },
  "Wastewater Collection": { bg: "#F0FDFA", color: "#0F766E" },
};

// ── Module targets (proportional sampling) ────────────────────────────────────
// Water: 60 Treatment + 40 Distribution = 100 total
// Wastewater: 60 Treatment + 40 Collection = 100 total
const MODULE_TARGETS_WATER: Record<string, number> = {
  "Water Treatment":    60,
  "Water Distribution": 40,
};

const MODULE_TARGETS_WW: Record<string, number> = {
  "Wastewater Treatment":  60,
  "Wastewater Collection": 40,
};

export default function Class1MockExam() {
  const { questions: dbQuestions, isLoading, dbUnavailable } = useQuestionBank("class1");

  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  // Map all questions to ExamQuestion shape
  const allQuestions: ExamQuestion[] = dbQuestions.map(q => ({
    id: q.id,
    module: q.module,
    question: q.question,
    options: q.options,
    correct: q.correctIndex,
    explanation: q.explanation,
  }));

  // Split by stream
  const waterPool = allQuestions.filter(q =>
    q.module === "Water Treatment" || q.module === "Water Distribution"
  );
  const wwPool = allQuestions.filter(q =>
    q.module === "Wastewater Treatment" || q.module === "Wastewater Collection"
  );

  const streamOptions: StreamOption[] = [
    {
      productKey:    "class1-water",
      scoreExamType: "class1",
      stream:        "water",
      label:         "Water Class 1",
      icon:          "💧",
      color:         "#1D4ED8",
      bg:            "#EFF6FF",
      moduleTargets: MODULE_TARGETS_WATER,
      moduleColors:  MODULE_COLORS_WATER,
      questionPool:  waterPool,
      productName:   "Class 1 Water Practice Pass",
      price:         99,
    },
    {
      productKey:    "class1-ww",
      scoreExamType: "class1",
      stream:        "wastewater",
      label:         "Wastewater Class 1",
      icon:          "♻️",
      color:         "#0F766E",
      bg:            "#F0FDFA",
      moduleTargets: MODULE_TARGETS_WW,
      moduleColors:  MODULE_COLORS_WW,
      questionPool:  wwPool,
      productName:   "Class 1 Wastewater Practice Pass",
      price:         99,
    },
  ];

  return (
    <MockExamShell
      title="Class 1 Mock Exam"
      badge="ONTARIO CLASS 1 · WATER & WASTEWATER"
      metaDescription="100-question timed mock exam for Ontario Class 1 Water and Wastewater operator certification. 2-hour timer, 70% pass threshold, and full module breakdown on results."
      metaKeywords="Class 1 mock exam, Ontario water operator exam, wastewater operator practice test, EOCP Class 1, OWWCO exam prep"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS_WATER}
      moduleColors={MODULE_COLORS_WATER}
      questionPool={waterPool}
      productKey="class1-water"
      productName="Class 1 Water Practice Pass"
      price={99}
      streamOptions={streamOptions}
      backPath="/class1-mock"
      practicePath="/class1-water"
      practiceLabel="Class 1 Practice Mode"
      currentPath="/class1-mock"
      infoLine={`${allQuestions.length} questions · Ontario Class 1 (Water & Wastewater)`}
    />
  );
}
