import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";
// WPI Class I Wastewater Collection exam blueprint: 100 questions
const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Equipment Operation & Maintenance":         { bg: "#DBEAFE", color: "#1D4ED8" },
  "Collection System Components":              { bg: "#DCFCE7", color: "#15803D" },
  "Lift Station Operation and Maintenance":    { bg: "#EDE9FE", color: "#6D28D9" },
  "Collection System Monitoring & Evaluation": { bg: "#CCFBF1", color: "#0F766E" },
  "Safety & Regulations":                      { bg: "#FEE2E2", color: "#B91C1C" },
};
export default function WpiClass1WaterCollMockExam() {
  usePageMeta({
    title: "WPI Class 1 Water Collection Mock Exam",
    description: "Mock Exam for WPI Class 1 Water Collection operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });

  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading, dbUnavailable } = useQuestionBank("wpi-class1-wastewater-coll");
  
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
      title="WPI Class I Wastewater Collection Mock Exam"
      badge="WPI CLASS I · WASTEWATER COLLECTION"
      metaDescription="100-question timed mock exam for the WPI Class I Wastewater Collection certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 1 wastewater collection mock exam, BC EOCP, Alberta AWWOA Class I collection"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class1-water-coll"
      productName="WPI Class I Wastewater Collection Practice Pass"
      price={99}
      backPath="/wpi"
      practicePath="/wpi-class1-water-coll"
      practiceLabel="Class I Collection Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class1-water-coll-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level I) · Alberta (AWWOA Class I) · SK · MB`}
      stream="wastewater"
      accentColor="#065F46"
    />
  );
}
