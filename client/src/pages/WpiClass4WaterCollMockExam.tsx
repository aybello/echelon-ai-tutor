import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";
// WPI Class IV Wastewater Collection exam blueprint: 100 questions
const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Equipment Operation, Evaluation & Maintenance": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Collection System O&M & Restoration": { bg: "#DCFCE7", color: "#15803D" },
  "Lift Station Operation & Maintenance": { bg: "#EDE9FE", color: "#6D28D9" },
  "Collection System Monitoring, Evaluation & Adjustment": { bg: "#CCFBF1", color: "#0F766E" },
  "Security, Safety & Administrative Procedures": { bg: "#FEE2E2", color: "#B91C1C" },
  "Equipment Operation & Maintenance":         { bg: "#DBEAFE", color: "#1D4ED8" },
  "Collection System Components":              { bg: "#DCFCE7", color: "#15803D" },
  "Lift Station Operation and Maintenance":    { bg: "#EDE9FE", color: "#6D28D9" },
  "Collection System Monitoring & Evaluation": { bg: "#CCFBF1", color: "#0F766E" },
  "Safety & Regulations":                      { bg: "#FEE2E2", color: "#B91C1C" },
};
export default function WpiClass4WaterCollMockExam() {
  usePageMeta({
    title: "WPI Class IV Wastewater Collection Mock Exam",
    description: "Timed practice for WPI Class IV Wastewater Collection topics. Check your certifying authority's exam edition and local requirements.",
    noindex: true
  });

  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading, dbUnavailable } = useQuestionBank("wpi-class4-wastewater-coll");
  
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
      title="WPI Class IV Wastewater Collection Mock Exam"
      badge="WPI CLASS IV · WASTEWATER COLLECTION"
      metaDescription="100-question timed mock exam for the WPI Class IV Wastewater Collection certification. 3-hour timer, 70% pass threshold."
      metaKeywords="WPI Class IV wastewater collection mock exam, ABC WPI exam prep, BC EOCP Level IV, Alberta AWWOA Class IV, US wastewater collection operator exam"
      examQuestions={100}
      examDuration={3 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class4-water-coll"
      productName="WPI Class IV Wastewater Collection Practice Pass"
      price={299}
      backPath="/wpi"
      practicePath="/wpi-class4-water-coll"
      practiceLabel="Class IV Collection Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class4-water-coll-mock"
      infoLine={`${POOL.length} practice questions · Class IV Collection · Check your exam edition with your certifying authority`}
      stream="wastewater"
      accentColor="#7F1D1D"
    />
  );
}
