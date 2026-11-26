import MockExamShell from "@/components/MockExamShell";
import { useMockExamMetadata } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Equipment Operation & Maintenance":         { bg: "#DBEAFE", color: "#1D4ED8" },
  "Collection System Components":              { bg: "#DCFCE7", color: "#15803D" },
  "Lift Station Operation and Maintenance":    { bg: "#EDE9FE", color: "#6D28D9" },
  "Collection System Monitoring & Evaluation": { bg: "#CCFBF1", color: "#0F766E" },
  "Safety & Regulations":                      { bg: "#FEE2E2", color: "#B91C1C" },
};

export default function Class2WastewaterCollMockExam() {
  usePageMeta({
    title: "Ontario Class 2 Wastewater Collection Mock Exam",
    description: "100-question timed mock exam for the Ontario Class 2 Wastewater Collection certification. 3-hour timer, 70% pass threshold.",
    noindex: true
  });
  const { moduleTargets: dbModuleTargets, totalQuestions, isLoading: bankLoading, dbUnavailable } = useMockExamMetadata("class2-wastewater-coll");
  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return (
    <MockExamShell
      title="Ontario Class 2 Wastewater Collection Mock Exam"
      badge="ONTARIO CLASS 2 · WASTEWATER COLLECTION"
      metaDescription="100-question timed mock exam for Ontario Class 2 Wastewater Collection certification. 3-hour timer, 70% pass threshold."
      metaKeywords="Ontario Class 2 Wastewater Collection mock exam, Ontario operator certification"
      examQuestions={100}
      examDuration={3 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      productKey="class2-wastewater-coll"
      productName="Ontario Class 2 Wastewater Collection Practice Pass"
      price={99}
      backPath="/class2-wastewater"
      practicePath="/class2-wastewater-coll"
      practiceLabel="Class 2 Wastewater Collection Practice"
      showProvinceSelector={false}
      currentPath="/class2-wastewater-coll-mock"
      infoLine={`${totalQuestions} questions · Ontario Class 2 Wastewater Collection`}
      stream="wastewater"
      accentColor="#065F46"
    />
  );
}
