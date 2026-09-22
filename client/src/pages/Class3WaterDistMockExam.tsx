import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";
import { formatQuestionBankCount } from "@shared/questionBankDisplay";

const CLASS3_WATER_DISTRIBUTION_MOCK_DURATION_HOURS = 3;
const CLASS3_WATER_DISTRIBUTION_MOCK_DESCRIPTION = `100-question timed mock exam for the Ontario Class 3 Water Distribution certification. ${CLASS3_WATER_DISTRIBUTION_MOCK_DURATION_HOURS}-hour timer, 70% pass threshold.`;

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Distribution System Components":                { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Installation, O&M & Repair":          { bg: "#DCFCE7", color: "#15803D" },
  "Water Quality Monitoring & Lab":                { bg: "#EDE9FE", color: "#6D28D9" },
  "Security, Safety, Admin & Public Interactions": { bg: "#FFEDD5", color: "#C2410C" },
};

export default function Class3WaterDistMockExam() {
  usePageMeta({
    title: "Ontario Class 3 Water Distribution Mock Exam",
    description: CLASS3_WATER_DISTRIBUTION_MOCK_DESCRIPTION,
    noindex: true
  });
  const { questions: dbQuestions, moduleTargets: dbModuleTargets, totalQuestions, isLoading: bankLoading, dbUnavailable } = useQuestionBank("class3-water-dist");
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
      metaDescription={CLASS3_WATER_DISTRIBUTION_MOCK_DESCRIPTION}
      metaKeywords="Ontario Class 3 Water Distribution mock exam, Ontario operator certification"
      examQuestions={100}
      examDuration={CLASS3_WATER_DISTRIBUTION_MOCK_DURATION_HOURS * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="class3-water-dist"
      backPath="/class3-water"
      practicePath="/class3-water-dist"
      practiceLabel="Class 3 Water Distribution Practice"
      showProvinceSelector={false}
      currentPath="/class3-water-dist-mock"
      infoLine={`${formatQuestionBankCount(totalQuestions)} · ${CLASS3_WATER_DISTRIBUTION_MOCK_DURATION_HOURS}-hour timer · Ontario Class 3 Water Distribution`}
      stream="water"
      accentColor="#0369A1"
    />
  );
}
