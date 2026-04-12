import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";



const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process":   { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment O&M":       { bg: "#DCFCE7", color: "#15803D" },
  "Laboratory Analysis": { bg: "#EDE9FE", color: "#6D28D9" },
  "Source Water":        { bg: "#CCFBF1", color: "#0F766E" },
  "Safety & Admin":      { bg: "#FFEDD5", color: "#C2410C" },
};

export default function WpiClass1WaterMockExam() {
  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading } = useQuestionBank("wpi-class1-water");
  
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
      title="WPI Class I Water Treatment Mock Exam"
      badge="WPI CLASS I · WATER TREATMENT"
      metaDescription="100-question timed mock exam for the WPI Class I Water Treatment certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 1 water treatment mock exam, BC EOCP Level I, Alberta AWWOA Class I"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class1-water"
      productName="WPI Class I Water Treatment Practice Pass"
      price={99}
      backPath="/wpi"
      practicePath="/wpi-class1-water"
      practiceLabel="Class I Water Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class1-water-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level I) · Alberta (AWWOA Class I) · SK · MB`}
      stream="water"
      accentColor="#0F766E"
    />
  );
}
