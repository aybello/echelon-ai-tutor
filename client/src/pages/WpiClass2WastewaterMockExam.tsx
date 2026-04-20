import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";



const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Nutrient Removal":                          { bg: "#DCFCE7", color: "#15803D" },
  "Biosolids Management":                      { bg: "#EDE9FE", color: "#6D28D9" },
  "Secondary Treatment Processes":             { bg: "#CCFBF1", color: "#0F766E" },
  "Advanced Treatment & Effluent Quality":     { bg: "#DBEAFE", color: "#1D4ED8" },
  "Safety, Regulations & Administration":      { bg: "#FFEDD5", color: "#C2410C" },
};

export default function WpiClass2WastewaterMockExam() {
  usePageMeta({
    title: "WPI Class 2 Wastewater Treatment Mock Exam",
    description: "Mock Exam for WPI Class 2 Wastewater Treatment operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });

  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading, dbUnavailable } = useQuestionBank("wpi-class2-wastewater");
  
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
      title="WPI Class II Wastewater Treatment Mock Exam"
      badge="WPI CLASS II · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the WPI Class II Wastewater Treatment certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 2 wastewater mock exam, BC EOCP Level II wastewater, Alberta AWWOA Class II"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class2-wastewater"
      productName="WPI Class II Wastewater Treatment Practice Pass"
      price={149}
      backPath="/wpi"
      practicePath="/wpi-class2-wastewater"
      practiceLabel="Class II Wastewater Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class2-wastewater-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level II) · Alberta (AWWOA Class II) · SK · MB`}
      stream="wastewater"
      accentColor="#0F766E"
    />
  );
}
