import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";



const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Advanced Treatment Process Monitoring": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Operation & Maintenance":     { bg: "#DCFCE7", color: "#15803D" },
  "Laboratory Analysis & Interpretation":  { bg: "#EDE9FE", color: "#6D28D9" },
  "Biosolids Management & Regulations":    { bg: "#CCFBF1", color: "#0F766E" },
  "Plant Management, Safety & Administration": { bg: "#FEE2E2", color: "#B91C1C" },
  "Wastewater Collection":                 { bg: "#FEF9C3", color: "#A16207" },
};

export default function Class4WastewaterMockExam() {
  usePageMeta({
    title: "Class 4 Wastewater Treatment Mock Exam",
    description: "Mock Exam for Ontario OWWCO Class 4 Wastewater Treatment operator certification exam. AI-powered exam prep with detailed explanations.",
  });

  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading, dbUnavailable } = useQuestionBank("class4-wastewater");
  
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
      title="Class 4 Wastewater Treatment Mock Exam"
      badge="ONTARIO CLASS IV · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 4 Wastewater Treatment operator certification."
      metaKeywords="Class 4 wastewater mock exam, Ontario operator exam, OWWCO Class 4 wastewater"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="class4-ww"
      productName="Class 4 Wastewater Treatment Practice Pass"
      price={299}
      backPath="/ontario"
      practicePath="/class4-ww"
      practiceLabel="Class 4 Wastewater Practice"
      showProvinceSelector={true}
      currentPath="/class4-ww-mock"
      infoLine={`${POOL.length} questions · Ontario (MECP) · BC (EOCP Level IV) · Alberta (AWWOA Class IV)`}
      stream="wastewater"
    />
  );
}
