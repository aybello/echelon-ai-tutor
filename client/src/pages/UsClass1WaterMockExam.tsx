import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";

// US Class I Water Treatment exam blueprint: 100 questions

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment processes":             { bg: "#DBEAFE", color: "#1D4ED8" },
  "Laboratory":                      { bg: "#EDE9FE", color: "#6D28D9" },
  "Equipment":                       { bg: "#DCFCE7", color: "#15803D" },
  "Source water":                    { bg: "#CCFBF1", color: "#0F766E" },
  "Safety/security/administration":  { bg: "#FFEDD5", color: "#C2410C" },
};

export default function UsClass1WaterMockExam() {
  usePageMeta({
    title: "US Class I Water Treatment Mock Exam",
    description: "Timed mock exam for the US Class I Water Treatment operator certification, built on the WPI Class 1 Water Treatment Need-to-Know Criteria.",
    noindex: true,
  });

  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading, dbUnavailable } = useQuestionBank("us-class1-water");

  const POOL: ExamQuestion[] = (dbQuestions as any[]).map((q: any) => ({
    id: q.id, module: q.module,
    question: q.question ?? q.text ?? "",
    options: q.options,
    correct: q.correctIndex ?? q.correct ?? q.correctAnswer ?? 0,
    explanation: q.explanation,
  }));

  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <MockExamShell
      title="US Class I Water Treatment Mock Exam"
      badge="US CLASS I · WATER TREATMENT"
      metaDescription="100-question timed mock exam for the US Class I Water Treatment certification. 3-hour timer, 70% pass threshold."
      metaKeywords="US Class I water treatment mock exam, WPI Class 1 water treatment exam prep, state water operator certification practice exam"
      examQuestions={100}
      examDuration={3 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="us-class1-water"
      productName="US Class I Water Treatment Practice Pass"
      price={149}
      backPath="/us"
      practicePath="/us-class1-water"
      practiceLabel="US Class I Treatment Practice"
      showProvinceSelector={false}
      currentPath="/us-class1-water-mock"
      infoLine={`${POOL.length} questions · United States · WPI Class 1 Need-to-Know Criteria`}
      stream="water"
      accentColor="#0369A1"
    />
  );
}
