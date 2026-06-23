import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Equipment Operation & Maintenance":         { bg: "#DBEAFE", color: "#1D4ED8" },
  "Collection System Components":              { bg: "#DCFCE7", color: "#15803D" },
  "Lift Station Operation and Maintenance":    { bg: "#EDE9FE", color: "#6D28D9" },
  "Collection System Monitoring & Evaluation": { bg: "#CCFBF1", color: "#0F766E" },
  "Safety & Regulations":                      { bg: "#FEE2E2", color: "#B91C1C" },
};

export default function Class4WastewaterCollMockExam() {
  usePageMeta({
    title: "Ontario Class 4 Wastewater Collection Mock Exam",
    description: "100-question timed mock exam for the Ontario Class 4 Wastewater Collection certification. 2-hour timer, 70% pass threshold.",
  });
  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading, dbUnavailable } = useQuestionBank("class4-wastewater-coll");
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
      title="Ontario Class 4 Wastewater Collection Mock Exam"
      badge="ONTARIO CLASS 4 · WASTEWATER COLLECTION"
      metaDescription="100-question timed mock exam for Ontario Class 4 Wastewater Collection certification. 2-hour timer, 70% pass threshold."
      metaKeywords="Ontario Class 4 Wastewater Collection mock exam, Ontario operator certification"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="class4-wastewater-coll"
      productName="Ontario Class 4 Wastewater Collection Practice Pass"
      price={99}
      backPath="/class4-wastewater"
      practicePath="/class4-wastewater-coll"
      practiceLabel="Class 4 Wastewater Collection Practice"
      showProvinceSelector={false}
      currentPath="/class4-wastewater-coll-mock"
      infoLine={`${POOL.length} questions · Ontario Class 4 Wastewater Collection`}
      stream="wastewater"
      accentColor="#065F46"
    />
  );
}
