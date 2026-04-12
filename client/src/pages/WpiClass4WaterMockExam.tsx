import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";



const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Plant Management & Leadership":                { bg: "#CCFBF1", color: "#0F766E" },
  "Emergency Response & Contingency Planning":    { bg: "#EDE9FE", color: "#6D28D9" },
  "Advanced Process Control":                     { bg: "#DBEAFE", color: "#1D4ED8" },
  "Regulatory Compliance & Reporting":            { bg: "#FFEDD5", color: "#C2410C" },
  "Advanced Water Quality":                       { bg: "#DCFCE7", color: "#15803D" },
};

export default function WpiClass4WaterMockExam() {
  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading } = useQuestionBank("wpi-class4-water");
  
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
      title="WPI Class IV Water Treatment Mock Exam"
      badge="WPI CLASS IV · WATER TREATMENT"
      metaDescription="100-question timed mock exam for the WPI Class IV Water Treatment certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 4 water treatment mock exam, BC EOCP Level IV, Alberta AWWOA Class IV"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class4-water"
      productName="WPI Class IV Water Treatment Practice Pass"
      price={299}
      backPath="/wpi"
      practicePath="/wpi-class4-water"
      practiceLabel="Class IV Water Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class4-water-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level IV) · Alberta (AWWOA Class IV) · SK · MB`}
      stream="water"
      accentColor="#0F766E"
    />
  );
}
