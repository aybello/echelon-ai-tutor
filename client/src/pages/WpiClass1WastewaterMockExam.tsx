import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";



const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Wastewater Collection Systems":   { bg: "#DBEAFE", color: "#1D4ED8" },
  "Primary & Secondary Treatment":   { bg: "#CCFBF1", color: "#0F766E" },
  "Solids Handling & Biosolids":     { bg: "#DCFCE7", color: "#15803D" },
  "Laboratory & Monitoring":         { bg: "#EDE9FE", color: "#6D28D9" },
  "Safety, Regulations & Admin":     { bg: "#FFEDD5", color: "#C2410C" },
};

export default function WpiClass1WastewaterMockExam() {
  usePageMeta({
    title: "WPI Class 1 Wastewater Treatment Mock Exam",
    description: "Mock Exam for WPI Class 1 Wastewater Treatment operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });

  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading } = useQuestionBank("wpi-class1-wastewater");
  
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
      title="WPI Class I Wastewater Treatment Mock Exam"
      badge="WPI CLASS I · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the WPI Class I Wastewater Treatment certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 1 wastewater mock exam, BC EOCP Level I wastewater, Alberta AWWOA Class I"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class1-wastewater"
      productName="WPI Class I Wastewater Treatment Practice Pass"
      price={99}
      backPath="/wpi"
      practicePath="/wpi-class1-wastewater"
      practiceLabel="Class I Wastewater Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class1-wastewater-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level I) · Alberta (AWWOA Class I) · SK · MB`}
      stream="wastewater"
      accentColor="#0F766E"
    />
  );
}
