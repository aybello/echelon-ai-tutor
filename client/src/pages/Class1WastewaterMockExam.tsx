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

export default function Class1WastewaterMockExam() {
  usePageMeta({
    title: "Class 1 Wastewater Treatment Mock Exam",
    description: "Mock Exam for Ontario OWWCO Class 1 Wastewater Treatment operator certification exam. AI-powered exam prep with detailed explanations.",
    noindex: true
  });

  const { moduleTargets: dbModuleTargets, totalQuestions, isLoading: bankLoading, dbUnavailable } = useMockExamMetadata("class1-wastewater");
  

  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <MockExamShell
      title="Class 1 Wastewater Treatment Mock Exam"
      badge="ONTARIO CLASS I · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 1 Wastewater Treatment operator certification."
      metaKeywords="Class 1 wastewater mock exam, Ontario operator exam, OWWCO Class 1 wastewater"
      examQuestions={100}
      examDuration={3 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      productKey="class1-ww"
      productName="Class 1 Wastewater Practice Pass"
      price={99}
      backPath="/class1-ww"
      practicePath="/class1-ww"
      practiceLabel="Class 1 Wastewater Practice"
      showProvinceSelector={true}
      currentPath="/class1-ww-mock"
      infoLine={`${totalQuestions} questions · Ontario (MECP) · BC (EOCP Level I) · Alberta (AWWOA Class I)`}
      stream="wastewater"
    />
  );
}
