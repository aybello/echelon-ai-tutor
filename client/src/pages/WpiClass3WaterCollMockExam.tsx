import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
// WPI Class III Wastewater Collection exam blueprint: 100 questions
const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Complex System Operations & SCADA":          { bg: "#EDE9FE", color: "#6D28D9" },
  "Advanced Pump Station Engineering":          { bg: "#DCFCE7", color: "#15803D" },
  "System Hydraulic Modelling":                 { bg: "#DBEAFE", color: "#1D4ED8" },
  "Advanced Maintenance Management":            { bg: "#FEF9C3", color: "#A16207" },
  "Leadership, Safety & Regulatory Management": { bg: "#FEE2E2", color: "#B91C1C" },
};
export default function WpiClass3WaterCollMockExam() {
  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading } = useQuestionBank("wpi-class3-wastewater-coll");
  
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
      title="WPI Class III Wastewater Collection Mock Exam"
      badge="WPI CLASS III · WASTEWATER COLLECTION"
      metaDescription="100-question timed mock exam for the WPI Class III Wastewater Collection certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 3 wastewater collection mock exam, BC EOCP, Alberta AWWOA Class III collection"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class3-water-coll"
      productName="WPI Class III Wastewater Collection Practice Pass"
      price={249}
      backPath="/wpi"
      practicePath="/wpi-class3-water-coll"
      practiceLabel="Class III Collection Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class3-water-coll-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level III) · Alberta (AWWOA Class III) · SK · MB`}
      stream="wastewater"
      accentColor="#7C3AED"
    />
  );
}
