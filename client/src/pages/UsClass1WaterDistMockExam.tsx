import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";

// US Class I Water Distribution exam blueprint: 100 questions

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Distribution components":                              { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment/field work":                                 { bg: "#DCFCE7", color: "#15803D" },
  "Water quality/laboratory":                             { bg: "#EDE9FE", color: "#6D28D9" },
  "Safety/security/administration/public interactions":   { bg: "#FFEDD5", color: "#C2410C" },
};

export default function UsClass1WaterDistMockExam() {
  usePageMeta({
    title: "US Class I Water Distribution Mock Exam",
    description: "Timed mock exam for the US Class I Water Distribution operator certification, built on the WPI Class 1 Water Distribution Need-to-Know Criteria.",
    noindex: true,
  });

  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading, dbUnavailable } = useQuestionBank("us-class1-water-dist");

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
      title="US Class I Water Distribution Mock Exam"
      badge="US CLASS I · WATER DISTRIBUTION"
      metaDescription="100-question timed mock exam for the US Class I Water Distribution certification. 3-hour timer, 70% pass threshold."
      metaKeywords="US Class I water distribution mock exam, WPI Class 1 water distribution exam prep, state water operator certification practice exam"
      examQuestions={100}
      examDuration={3 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="us-class1-water-dist"
      productName="US Class I Water Distribution Practice Pass"
      price={149}
      backPath="/us"
      practicePath="/us-class1-water-dist"
      practiceLabel="US Class I Distribution Practice"
      showProvinceSelector={false}
      currentPath="/us-class1-water-dist-mock"
      infoLine={`${POOL.length} questions · United States · WPI Class 1 Need-to-Know Criteria`}
      stream="water"
      accentColor="#1D4ED8"
    />
  );
}
