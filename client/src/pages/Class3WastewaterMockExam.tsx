import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";



const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process Monitoring":        { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Operation":                 { bg: "#DCFCE7", color: "#15803D" },
  "Equipment Evaluation & Maintenance":  { bg: "#FFEDD5", color: "#C2410C" },
  "Laboratory Analysis":                 { bg: "#EDE9FE", color: "#6D28D9" },
  "Security, Safety & Admin":            { bg: "#FEE2E2", color: "#B91C1C" },
  "Wastewater Collection":               { bg: "#CCFBF1", color: "#0F766E" },
};

export default function Class3WastewaterMockExam() {
  usePageMeta({
    title: "Class 3 Wastewater Treatment Mock Exam",
    description: "Mock Exam for Ontario OWWCO Class 3 Wastewater Treatment operator certification exam. AI-powered exam prep with detailed explanations.",
  });

  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading, dbUnavailable } = useQuestionBank("class3-wastewater");
  
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
      title="Class 3 Wastewater Treatment Mock Exam"
      badge="ONTARIO CLASS III · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 3 Wastewater Treatment operator certification."
      metaKeywords="Class 3 wastewater mock exam, Ontario operator exam, OWWCO Class 3 wastewater"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="class3-ww"
      productName="Class 3 Wastewater Treatment Practice Pass"
      price={249}
      backPath="/ontario"
      practicePath="/class3-ww"
      practiceLabel="Class 3 Wastewater Practice"
      showProvinceSelector={true}
      currentPath="/class3-ww-mock"
      infoLine={`${POOL.length} questions · Ontario (MECP) · BC (EOCP Level III) · Alberta (AWWOA Class III)`}
      stream="wastewater"
    />
  );
}
