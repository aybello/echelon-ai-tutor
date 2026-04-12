import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";


// WPI Class III Water Distribution exam blueprint: 100 questions
const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Distribution System Components":                { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Installation, O&M & Repair":          { bg: "#DCFCE7", color: "#15803D" },
  "Water Quality Monitoring & Lab":                { bg: "#EDE9FE", color: "#6D28D9" },
  "Security, Safety, Admin & Public Interactions": { bg: "#FFEDD5", color: "#C2410C" },
};

export default function WpiClass3WaterDistMockExam() {
  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading } = useQuestionBank("wpi-class3-water-dist");
  
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
      title="WPI Class III Water Distribution Mock Exam"
      badge="WPI CLASS III · WATER DISTRIBUTION"
      metaDescription="100-question timed mock exam for the WPI Class III Water Distribution certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 3 water distribution mock exam, BC EOCP Level III, Alberta AWWOA Class III distribution"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class3-water-dist"
      productName="WPI Class III Water Distribution Practice Pass"
      price={99}
      backPath="/wpi"
      practicePath="/wpi-class3-water-dist"
      practiceLabel="Class III Distribution Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class3-water-dist-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level III) · Alberta (AWWOA Class III) · SK · MB`}
      stream="water"
      accentColor="#0369A1"
    />
  );
}
