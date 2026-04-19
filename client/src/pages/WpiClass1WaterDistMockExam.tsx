import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";


// WPI Class I Water Distribution exam blueprint: 100 questions

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Distribution System Components":                { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Installation, O&M & Repair":          { bg: "#DCFCE7", color: "#15803D" },
  "Water Quality Monitoring & Lab":                { bg: "#EDE9FE", color: "#6D28D9" },
  "Security, Safety, Admin & Public Interactions": { bg: "#FFEDD5", color: "#C2410C" },
};

export default function WpiClass1WaterDistMockExam() {
  usePageMeta({
    title: "WPI Class 1 Water Distribution Mock Exam",
    description: "Mock Exam for WPI Class 1 Water Distribution operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });

  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading } = useQuestionBank("wpi-class1-water-dist");
  
  const POOL: ExamQuestion[] = (dbQuestions as any[]).map((q: any) => ({
    id: q.id, module: q.module,
    question: q.question ?? q.text ?? "",
    options: q.options,
    correct: q.correctIndex ?? q.correct ?? q.correctAnswer ?? 0,
    explanation: q.explanation,
  }));

  if (bankLoading) return <QuizSkeleton />;

  return (
    <MockExamShell
      title="WPI Class I Water Distribution Mock Exam"
      badge="WPI CLASS I · WATER DISTRIBUTION"
      metaDescription="100-question timed mock exam for the WPI Class I Water Distribution certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 1 water distribution mock exam, BC EOCP, Alberta AWWOA Class I distribution"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class1-water-dist"
      productName="WPI Class I Water Distribution Practice Pass"
      price={99}
      backPath="/wpi"
      practicePath="/wpi-class1-water-dist"
      practiceLabel="Class I Distribution Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class1-water-dist-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level I) · Alberta (AWWOA Class I) · SK · MB`}
      stream="water"
      accentColor="#0369A1"
    />
  );
}
