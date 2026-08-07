import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";



const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Equipment Evaluation, Maintenance & Operation": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Treatment Process Evaluation & Adjustment":     { bg: "#DCFCE7", color: "#15803D" },
  "Laboratory Analysis":                           { bg: "#EDE9FE", color: "#6D28D9" },
  "Safety & Admin":                                { bg: "#FEE2E2", color: "#B91C1C" },
};

export default function WpiClass4WastewaterMockExam() {
  usePageMeta({
    title: "WPI Class 4 Wastewater Treatment Mock Exam",
    description: "Mock Exam for WPI Class 4 Wastewater Treatment operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
    noindex: true
  });

  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading, dbUnavailable } = useQuestionBank("wpi-class4-wastewater");
  
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
      title="WPI Class IV Wastewater Treatment Mock Exam"
      badge="WPI CLASS IV · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the WPI Class IV Wastewater Treatment certification. 3-hour timer, 70% pass threshold."
      metaKeywords="WPI Class IV wastewater treatment mock exam, ABC WPI exam prep, BC EOCP Level IV, Alberta AWWOA Class IV, US wastewater operator exam"
      examQuestions={100}
      examDuration={3 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class4-wastewater"
      productName="WPI Class IV Wastewater Practice Pass"
      price={299}
      backPath="/wpi"
      practicePath="/wpi-class4-wastewater"
      practiceLabel="Class IV Wastewater Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class4-wastewater-mock"
      infoLine={`${POOL.length} questions · Canada & US · ABC/WPI Standard · Class IV`}
      stream="wastewater"
      accentColor="#0F766E"
    />
  );
}
