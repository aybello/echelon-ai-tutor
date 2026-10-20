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

export default function Class3WastewaterMockExam() {
  usePageMeta({
    title: "Class 3 Wastewater Treatment Mock Exam",
    description: "Mock Exam for Ontario OWWCO Class 3 Wastewater Treatment operator certification exam. AI-powered exam prep with detailed explanations.",
    noindex: true
  });

  const { moduleTargets: dbModuleTargets, totalQuestions, isLoading: bankLoading, dbUnavailable } = useMockExamMetadata("class3-wastewater");
  

  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <MockExamShell
      title="Class 3 Wastewater Treatment Mock Exam"
      badge="ONTARIO CLASS III · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 3 Wastewater Treatment operator certification."
      metaKeywords="Class 3 wastewater mock exam, Ontario operator exam, OWWCO Class 3 wastewater"
      examQuestions={100}
      examDuration={3 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      productKey="class3-ww"
      productName="Class 3 Wastewater Treatment Practice Pass"
      price={249}
      backPath="/class3-ww"
      practicePath="/class3-ww"
      practiceLabel="Class 3 Wastewater Practice"
      showProvinceSelector={true}
      currentPath="/class3-ww-mock"
      infoLine={`${totalQuestions} questions · Ontario (MECP) · BC (EOCP Level III) · Alberta (AWWOA Class III)`}
      stream="wastewater"
    />
  );
}
