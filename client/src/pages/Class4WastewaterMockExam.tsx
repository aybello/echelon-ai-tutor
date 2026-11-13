import MockExamShell from "@/components/MockExamShell";
import { useMockExamMetadata } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";



const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Equipment Evaluation, Maintenance & Operation": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Treatment Process Evaluation & Adjustment":     { bg: "#DCFCE7", color: "#15803D" },
  "Laboratory Analysis":                           { bg: "#EDE9FE", color: "#6D28D9" },
  "Safety & Admin":                                { bg: "#FEE2E2", color: "#B91C1C" },
};

export default function Class4WastewaterMockExam() {
  usePageMeta({
    title: "Class 4 Wastewater Treatment Mock Exam",
    description: "Mock Exam for Ontario OWWCO Class 4 Wastewater Treatment operator certification exam. AI-powered exam prep with detailed explanations.",
    noindex: true
  });

  const { moduleTargets: dbModuleTargets, totalQuestions, isLoading: bankLoading, dbUnavailable } = useMockExamMetadata("class4-wastewater");
  

  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <MockExamShell
      title="Class 4 Wastewater Treatment Mock Exam"
      badge="ONTARIO CLASS IV · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 4 Wastewater Treatment operator certification."
      metaKeywords="Class 4 wastewater mock exam, Ontario operator exam, OWWCO Class 4 wastewater"
      examQuestions={100}
      examDuration={3 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      productKey="class4-ww"
      productName="Class 4 Wastewater Treatment Practice Pass"
      price={299}
      backPath="/class4-ww"
      practicePath="/class4-ww"
      practiceLabel="Class 4 Wastewater Practice"
      showProvinceSelector={true}
      currentPath="/class4-ww-mock"
      infoLine={`${totalQuestions} questions · Ontario (MECP) · BC (EOCP Level IV) · Alberta (AWWOA Class IV)`}
      stream="wastewater"
    />
  );
}
