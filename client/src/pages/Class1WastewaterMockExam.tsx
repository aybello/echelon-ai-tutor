import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";



const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Wastewater Collection":  { bg: "#CCFBF1", color: "#0F766E" },
  "Wastewater Characteristics & Preliminary Treatment": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Primary Treatment":      { bg: "#DCFCE7", color: "#15803D" },
  "Secondary Treatment":    { bg: "#EDE9FE", color: "#6D28D9" },
  "Biological Nutrient Removal": { bg: "#CCFBF1", color: "#0F766E" },
  "Tertiary Treatment & Filtration": { bg: "#FEF9C3", color: "#A16207" },
  "Disinfection":           { bg: "#FFEDD5", color: "#C2410C" },
  "Solids Handling & Biosolids": { bg: "#FEE2E2", color: "#B91C1C" },
  "Regulations, Safety & Operations": { bg: "#F3E8FF", color: "#7C3AED" },
};

export default function Class1WastewaterMockExam() {
  usePageMeta({
    title: "Class 1 Wastewater Treatment Mock Exam",
    description: "Mock Exam for Ontario OWWCO Class 1 Wastewater Treatment operator certification exam. AI-powered exam prep with detailed explanations.",
  });

  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading, dbUnavailable } = useQuestionBank("class1-wastewater");
  
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
      title="Class 1 Wastewater Treatment Mock Exam"
      badge="ONTARIO CLASS I · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 1 Wastewater Treatment operator certification."
      metaKeywords="Class 1 wastewater mock exam, Ontario operator exam, OWWCO Class 1 wastewater"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="class1-ww"
      productName="Class 1 Wastewater Practice Pass"
      price={99}
      backPath="/ontario"
      practicePath="/class1-ww"
      practiceLabel="Class 1 Wastewater Practice"
      showProvinceSelector={true}
      currentPath="/class1-ww-mock"
      infoLine={`${POOL.length} questions · Ontario (MECP) · BC (EOCP Level I) · Alberta (AWWOA Class I)`}
      stream="wastewater"
    />
  );
}
