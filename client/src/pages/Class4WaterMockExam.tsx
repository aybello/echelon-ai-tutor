import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";



const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process":       { bg: "#DBEAFE", color: "#1D4ED8" },
  "Laboratory Analysis":     { bg: "#FEF9C3", color: "#A16207" },
  "Equipment O&M":           { bg: "#DCFCE7", color: "#15803D" },
  "Regulations & Management":{ bg: "#FEE2E2", color: "#B91C1C" },
  "Source Water & Quality":  { bg: "#EDE9FE", color: "#6D28D9" },
  "Water Distribution":      { bg: "#E0F2FE", color: "#0284C7" },
};

export default function Class4WaterMockExam() {
  usePageMeta({
    title: "Class 4 Water Treatment Mock Exam",
    description: "Mock Exam for Ontario OWWCO Class 4 Water Treatment operator certification exam. AI-powered exam prep with detailed explanations.",
  });

  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading, dbUnavailable } = useQuestionBank("class4-water");
  
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
      title="Class 4 Water Treatment Mock Exam"
      badge="ONTARIO CLASS IV · WATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 4 Water Treatment operator certification. 2-hour timer, 70% pass threshold."
      metaKeywords="Class 4 water treatment mock exam, Ontario operator exam, OWWCO Class 4"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="class4-water"
      productName="Class 4 Water Treatment Practice Pass"
      price={299}
      backPath="/ontario"
      practicePath="/class4-water"
      practiceLabel="Class 4 Water Practice"
      showProvinceSelector={true}
      currentPath="/class4-water-mock"
      infoLine={`${POOL.length} questions · Ontario (MECP) · BC (EOCP Level IV) · Alberta (AWWOA Class IV)`}
      stream="water"
    />
  );
}
