import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Distribution System Components":                { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Installation, O&M & Repair":          { bg: "#DCFCE7", color: "#15803D" },
  "Water Quality Monitoring & Lab":                { bg: "#EDE9FE", color: "#6D28D9" },
  "Security, Safety, Admin & Public Interactions": { bg: "#FFEDD5", color: "#C2410C" },
};

export default function Class3WaterDistMockExam() {
  usePageMeta({
    title: "Ontario Class 3 Water Distribution Mock Exam",
    description: "100-question timed mock exam for the Ontario Class 3 Water Distribution certification. 2-hour timer, 70% pass threshold.",
  });
  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading, dbUnavailable } = useQuestionBank("class3-water-dist");
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
      title="Ontario Class 3 Water Distribution Mock Exam"
      badge="ONTARIO CLASS 3 · WATER DISTRIBUTION"
      metaDescription="100-question timed mock exam for Ontario Class 3 Water Distribution certification. 2-hour timer, 70% pass threshold."
      metaKeywords="Ontario Class 3 Water Distribution mock exam, Ontario operator certification"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="class3-water-dist"
      productName="Ontario Class 3 Water Distribution Practice Pass"
      price={99}
      backPath="/class3-water"
      practicePath="/class3-water-dist"
      practiceLabel="Class 3 Water Distribution Practice"
      showProvinceSelector={false}
      currentPath="/class3-water-dist-mock"
      infoLine={`${POOL.length} questions · Ontario Class 3 Water Distribution`}
      stream="water"
      accentColor="#0369A1"
    />
  );
}
